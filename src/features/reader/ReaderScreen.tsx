import * as Speech from 'expo-speech';
import { Voice } from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';

import { voicePresets } from '../../data/voicePresets';
import { useLibrary } from '../../state/library-context';
import { colors } from '../../theme/tokens';
import { Book } from '../../types/book';
import { resolveVoiceAssignments, VoiceMatchResult } from './voice-utils';

type ReaderScreenProps = {
  book: Book;
  onClose: () => void;
};

const SWIPE_THRESHOLD = 48;
const EDGE_TAP_WIDTH = 56;
const MAX_DRAG_RATIO = 0.92;
const PAGE_SIDE_GUTTER = 18;
const PAGE_PREVIEW_LINE_COUNT = 17;
const DEFAULT_VOICE_MATCH: VoiceMatchResult = {
  reason: 'default',
  score: 0,
  voice: null
};

export function ReaderScreen({ book, onClose }: ReaderScreenProps) {
  const {
    state: {
      currentPageByBookId,
      isNarrationActive,
      isNarrationPaused,
      narrationBookId,
      narrationPageByBookId,
      selectedVoicePresetId
    },
    nextPage,
    previousPage,
    startNarration,
    pauseNarration,
    resumeNarration,
    stopNarration,
    setVoicePreset
  } = useLibrary();
  const { width } = useWindowDimensions();
  const pageWidth = Math.max(width - 40 - PAGE_SIDE_GUTTER * 2, 248);
  const page = currentPageByBookId[book.id] ?? 0;
  const [dragDirection, setDragDirection] = useState<-1 | 0 | 1>(0);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceLookupReady, setVoiceLookupReady] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const narrationTokenRef = useRef<string | null>(null);

  const selectedVoicePreset =
    voicePresets.find((preset) => preset.id === selectedVoicePresetId) ?? voicePresets[0];
  const voiceAssignments = useMemo(
    () => resolveVoiceAssignments(availableVoices, voicePresets),
    [availableVoices]
  );
  const matchedVoiceResult = voiceAssignments[selectedVoicePreset.id] ?? DEFAULT_VOICE_MATCH;
  const matchedVoice = matchedVoiceResult.voice;

  const isCurrentNarration =
    isNarrationActive &&
    narrationBookId === book.id &&
    (narrationPageByBookId[book.id] ?? 0) === page;
  const isPausedNarration = isCurrentNarration && isNarrationPaused;
  const canGoNext = page < book.pages.length - 1;
  const canGoPrevious = page > 0;
  const targetPage =
    dragDirection < 0
      ? Math.min(page + 1, book.pages.length - 1)
      : dragDirection > 0
        ? Math.max(page - 1, 0)
        : page;
  const targetPageText = book.pages[targetPage] ?? book.pages[page];

  const pageShadowOpacity = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [0.24, 0, 0.24]
  });
  const backgroundScale = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [1, 0.982, 1]
  });
  const backgroundOpacity = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [1, 0.68, 1]
  });
  const foregroundRotate = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: ['-15deg', '0deg', '15deg']
  });
  const foregroundScale = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [0.985, 1, 0.985]
  });
  const leftCurlOpacity = dragX.interpolate({
    inputRange: [0, pageWidth * 0.1, pageWidth * 0.7],
    outputRange: [0, 0.45, 0.92],
    extrapolate: 'clamp'
  });
  const rightCurlOpacity = dragX.interpolate({
    inputRange: [-pageWidth * 0.7, -pageWidth * 0.1, 0],
    outputRange: [0.92, 0.45, 0],
    extrapolate: 'clamp'
  });
  const leftCurlScale = dragX.interpolate({
    inputRange: [0, pageWidth * 0.7],
    outputRange: [0.2, 1],
    extrapolate: 'clamp'
  });
  const rightCurlScale = dragX.interpolate({
    inputRange: [-pageWidth * 0.7, 0],
    outputRange: [1, 0.2],
    extrapolate: 'clamp'
  });
  const spineShadowOpacity = dragX.interpolate({
    inputRange: [-pageWidth * 0.7, 0, pageWidth * 0.7],
    outputRange: [0.22, 0.08, 0.22]
  });
  const pageLift = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [4, 0, 4]
  });

  const resetDrag = () => {
    dragX.setValue(0);
    setDragDirection(0);
    isAnimatingRef.current = false;
  };

  const syncStopNarration = () => {
    narrationTokenRef.current = null;
    stopNarration();
  };

  const stopActiveNarration = async () => {
    narrationTokenRef.current = null;
    await Speech.stop();
    stopNarration();
  };

  const animateToRest = () => {
    isAnimatingRef.current = true;
    Animated.spring(dragX, {
      toValue: 0,
      bounciness: 7,
      speed: 17,
      useNativeDriver: true
    }).start(() => {
      resetDrag();
    });
  };

  const turnPage = (direction: -1 | 1) => {
    const canTurn = direction < 0 ? canGoNext : canGoPrevious;

    if (!canTurn || isAnimatingRef.current) {
      animateToRest();
      return;
    }

    isAnimatingRef.current = true;
    setDragDirection(direction);

    void stopActiveNarration().finally(() => {
      Animated.timing(dragX, {
        toValue: direction < 0 ? -pageWidth : pageWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start(() => {
        if (direction < 0) {
          nextPage(book.id);
        } else {
          previousPage(book.id);
        }

        resetDrag();
      });
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();

        if (isMounted) {
          setAvailableVoices(voices);
        }
      } catch {
        if (isMounted) {
          setAvailableVoices([]);
        }
      } finally {
        if (isMounted) {
          setVoiceLookupReady(true);
        }
      }
    };

    void loadVoices();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      void Speech.stop();
      syncStopNarration();
    };
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !isAnimatingRef.current &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 12,
        onPanResponderMove: (_, gestureState) => {
          const nextDirection = gestureState.dx < 0 ? -1 : gestureState.dx > 0 ? 1 : 0;

          setDragDirection(nextDirection);
          dragX.setValue(
            Math.max(-pageWidth * MAX_DRAG_RATIO, Math.min(gestureState.dx, pageWidth * MAX_DRAG_RATIO))
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -SWIPE_THRESHOLD) {
            turnPage(-1);
          } else if (gestureState.dx > SWIPE_THRESHOLD) {
            turnPage(1);
          } else {
            animateToRest();
          }
        },
        onPanResponderTerminate: () => {
          animateToRest();
        }
      }),
    [pageWidth, dragX, turnPage]
  );

  const handleStartNarration = async () => {
    const token = `${book.id}:${page}:${Date.now()}`;

    narrationTokenRef.current = token;
    await Speech.stop();
    startNarration(book.id, page);
    Speech.speak(book.pages[page], {
      language: matchedVoice?.language ?? selectedVoicePreset.localeHints[0],
      pitch: selectedVoicePreset.pitch,
      rate: selectedVoicePreset.rate,
      voice: matchedVoice?.identifier,
      onStopped: () => {
        if (narrationTokenRef.current === token) {
          syncStopNarration();
        }
      },
      onDone: () => {
        if (narrationTokenRef.current === token) {
          syncStopNarration();
        }
      },
      onError: () => {
        if (narrationTokenRef.current === token) {
          syncStopNarration();
        }
      }
    });
  };

  const handlePauseNarration = async () => {
    if (Platform.OS === 'android') {
      await stopActiveNarration();
      return;
    }

    await Speech.pause();
    pauseNarration();
  };

  const handleResumeNarration = async () => {
    if (Platform.OS === 'android') {
      await handleStartNarration();
      return;
    }

    await Speech.resume();
    resumeNarration();
  };

  const handleStopNarration = async () => {
    await stopActiveNarration();
  };

  const handleClose = async () => {
    await stopActiveNarration();
    onClose();
  };

  const handleSelectPreset = async (presetId: string) => {
    if (presetId === selectedVoicePreset.id) {
      return;
    }

    await stopActiveNarration();
    setVoicePreset(presetId);
  };

  const voiceFootnote = !voiceLookupReady
    ? '正在读取设备可用音色...'
    : matchedVoiceResult.reason === 'unique' && matchedVoice
      ? `当前映射到 ${matchedVoice.name}`
      : matchedVoiceResult.reason === 'approximate' && matchedVoice
        ? `当前使用近似音色 ${matchedVoice.name}，设备音色有限时会自动回退`
        : '当前设备未命中预设音色，将回退到系统默认朗读';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => void handleClose()} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>返回书架</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Text numberOfLines={1} style={styles.bookTitle}>
            {book.title}
          </Text>
          <Text style={styles.author}>{book.author}</Text>
        </View>
      </View>

      <View {...panResponder.panHandlers} style={styles.readerShell}>
        <View pointerEvents="box-none" style={styles.edgeAssistOverlay}>
          <Pressable
            accessibilityLabel="上一页"
            disabled={!canGoPrevious || isAnimatingRef.current}
            onPress={() => turnPage(1)}
            style={[styles.edgeHitArea, styles.edgeHitAreaLeft]}
          >
            <View
              style={[
                styles.edgeRail,
                styles.edgeRailLeft,
                !canGoPrevious && styles.edgeRailDisabled
              ]}
            >
              <Text style={[styles.edgeHintCaption, !canGoPrevious && styles.edgeHintCaptionDisabled]}>
                {canGoPrevious ? 'PREV' : 'FIRST'}
              </Text>
              <Text style={[styles.edgeHitLabel, styles.edgeHitLabelLeft]}>上一页</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="下一页"
            disabled={!canGoNext || isAnimatingRef.current}
            onPress={() => turnPage(-1)}
            style={[styles.edgeHitArea, styles.edgeHitAreaRight]}
          >
            <View
              style={[
                styles.edgeRail,
                styles.edgeRailRight,
                !canGoNext && styles.edgeRailDisabled
              ]}
            >
              <Text style={[styles.edgeHintCaption, !canGoNext && styles.edgeHintCaptionDisabled]}>
                {canGoNext ? 'NEXT' : 'LAST'}
              </Text>
              <Text style={[styles.edgeHitLabel, styles.edgeHitLabelRight]}>下一页</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.pageFrame}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backgroundPage,
              {
                opacity: backgroundOpacity,
                transform: [{ scale: backgroundScale }]
              }
            ]}
          >
            <View style={[styles.chapterPill, styles.chapterPillMuted]}>
              <Text style={[styles.chapterPillLabel, styles.chapterPillMutedLabel]}>
                {dragDirection < 0 ? '下一页预览' : dragDirection > 0 ? '上一页预览' : '阅读中'}
              </Text>
            </View>
            <Text numberOfLines={PAGE_PREVIEW_LINE_COUNT} style={styles.pagePreview}>
              {targetPageText}
            </Text>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.spineShadow, { opacity: spineShadowOpacity }]} />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.pageCurl,
              styles.pageCurlLeft,
              {
                opacity: leftCurlOpacity,
                transform: [{ scaleX: leftCurlScale }, { rotateY: '-28deg' }]
              }
            ]}
          >
            <View style={styles.pageCurlInner}>
              <View style={styles.pageCurlShade} />
              <View style={styles.pageCurlHighlight} />
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.pageCurl,
              styles.pageCurlRight,
              {
                opacity: rightCurlOpacity,
                transform: [{ scaleX: rightCurlScale }, { rotateY: '28deg' }]
              }
            ]}
          >
            <View style={styles.pageCurlInner}>
              <View style={styles.pageCurlShade} />
              <View style={styles.pageCurlHighlight} />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.foregroundPage,
              {
                transform: [
                  { perspective: 1600 },
                  { translateX: dragX },
                  { translateY: pageLift },
                  { rotateY: foregroundRotate },
                  { scale: foregroundScale }
                ]
              }
            ]}
          >
            <Animated.View pointerEvents="none" style={[styles.pageShadow, { opacity: pageShadowOpacity }]} />
            <View style={styles.pageTopRow}>
              <View style={[styles.chapterPill, { backgroundColor: book.accentColor }]}>
                <Text style={styles.chapterPillLabel}>卷页阅读</Text>
              </View>
              <Text style={styles.pageMetaLabel}>
                第 {page + 1} 页 · 共 {book.pages.length} 页
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={styles.readerContent}
              showsVerticalScrollIndicator={false}
              style={styles.readerScroll}
            >
              <Text style={styles.pageBody}>{book.pages[page]}</Text>
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.progress}>
          第 {page + 1} 页 / 共 {book.pages.length} 页
        </Text>
        <View style={styles.voicePresetRow}>
          {voicePresets.map((preset) => {
            const isSelected = preset.id === selectedVoicePreset.id;

            return (
              <Pressable
                key={preset.id}
                onPress={() => void handleSelectPreset(preset.id)}
                style={[
                  styles.voiceChip,
                  isSelected && styles.voiceChipSelected,
                  preset.gender === 'female' ? styles.voiceChipFemale : styles.voiceChipMale
                ]}
              >
                <Text style={[styles.voiceChipLabel, isSelected && styles.voiceChipLabelSelected]}>
                  {preset.label}
                </Text>
                <Text style={[styles.voiceChipTone, isSelected && styles.voiceChipLabelSelected]}>
                  {preset.tone}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text
          style={[
            styles.voiceFootnote,
            matchedVoiceResult.reason !== 'unique' && voiceLookupReady && styles.voiceFootnoteFallback
          ]}
        >
          {voiceFootnote}
        </Text>
        <View style={styles.audioActions}>
          {isCurrentNarration ? (
            <>
              <Pressable
                onPress={() =>
                  void (isPausedNarration ? handleResumeNarration() : handlePauseNarration())
                }
                style={[styles.audioButton, styles.audioPrimaryButton]}
              >
                <Text style={styles.audioPrimaryLabel}>
                  {isPausedNarration ? '继续朗读' : Platform.OS === 'android' ? '停止朗读' : '暂停朗读'}
                </Text>
              </Pressable>
              <Pressable onPress={() => void handleStopNarration()} style={styles.audioButton}>
                <Text style={styles.audioButtonLabel}>结束</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void handleStartNarration()}
              style={[styles.audioButton, styles.audioPrimaryButton]}
            >
              <Text style={styles.audioPrimaryLabel}>开始听书</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.hint}>
          左滑下一页，右滑上一页，也可轻触纸张外两侧快速翻页
          {Platform.OS === 'android' ? '；安卓端暂停会退化为停止' : '；iOS/Web 支持暂停与继续朗读'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 64
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14
  },
  backButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  backButtonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  headerMeta: {
    flex: 1
  },
  bookTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  author: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4
  },
  readerShell: {
    flex: 1,
    position: 'relative'
  },
  edgeAssistOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4
  },
  edgeHitArea: {
    bottom: 12,
    justifyContent: 'center',
    position: 'absolute',
    top: 12,
    width: EDGE_TAP_WIDTH
  },
  edgeHitAreaLeft: {
    alignItems: 'flex-start',
    left: 0
  },
  edgeHitAreaRight: {
    alignItems: 'flex-end',
    right: 0
  },
  edgeRail: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 231, 218, 0.84)',
    borderColor: '#D7C8B4',
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
    minHeight: 124,
    paddingHorizontal: 6,
    paddingVertical: 10,
    width: 24
  },
  edgeRailLeft: {
    marginLeft: -9
  },
  edgeRailRight: {
    marginRight: -9
  },
  edgeRailDisabled: {
    opacity: 0.45
  },
  edgeHintCaption: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.9
  },
  edgeHintCaptionDisabled: {
    color: '#9E9588'
  },
  edgeHitLabel: {
    color: '#8B775D',
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.88
  },
  edgeHitLabelLeft: {
    transform: [{ rotate: '-90deg' }]
  },
  edgeHitLabelRight: {
    transform: [{ rotate: '90deg' }]
  },
  pageFrame: {
    borderRadius: 28,
    flex: 1,
    marginHorizontal: PAGE_SIDE_GUTTER,
    overflow: 'hidden',
    position: 'relative'
  },
  backgroundPage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3E8D7',
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 14
  },
  spineShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E140B',
    borderRadius: 28
  },
  pageCurl: {
    bottom: 18,
    position: 'absolute',
    top: 18,
    width: '56%',
    zIndex: 2
  },
  pageCurlLeft: {
    left: 0
  },
  pageCurlRight: {
    right: 0
  },
  pageCurlInner: {
    backgroundColor: '#F6EAD7',
    borderRadius: 24,
    flex: 1,
    overflow: 'hidden'
  },
  pageCurlShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#A88355',
    opacity: 0.26
  },
  pageCurlHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF6E9',
    opacity: 0.72
  },
  foregroundPage: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 3
  },
  pageShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.shadow
  },
  pageTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  pageMetaLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  chapterPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  chapterPillLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700'
  },
  chapterPillMuted: {
    backgroundColor: '#E4D5BF',
    marginBottom: 10
  },
  chapterPillMutedLabel: {
    color: colors.textSecondary
  },
  readerScroll: {
    flex: 1
  },
  readerContent: {
    flexGrow: 1,
    paddingBottom: 8
  },
  pagePreview: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 27
  },
  pageBody: {
    color: colors.text,
    fontSize: 16.5,
    lineHeight: 28,
    paddingBottom: 4
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 14
  },
  progress: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  voicePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  voiceChip: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 112,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  voiceChipFemale: {
    backgroundColor: '#F5E7E4',
    borderColor: '#D8B2AC'
  },
  voiceChipMale: {
    backgroundColor: '#E5ECEE',
    borderColor: '#AAC2C9'
  },
  voiceChipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  voiceChipLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  voiceChipTone: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  },
  voiceChipLabelSelected: {
    color: colors.white
  },
  voiceFootnote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center'
  },
  voiceFootnoteFallback: {
    color: colors.primary
  },
  audioActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  audioButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    minWidth: 108,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  audioPrimaryButton: {
    backgroundColor: colors.success
  },
  audioButtonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  audioPrimaryLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 360,
    textAlign: 'center'
  }
});
