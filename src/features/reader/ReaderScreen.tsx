import * as Speech from 'expo-speech';
import { Voice } from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';

import { cloudNarrationTargetsByPresetId, voicePresets } from '../../data/voicePresets';
import { useLibrary } from '../../state/library-context';
import { colors, readerThemeIds, ReaderThemeId, readerThemes } from '../../theme/tokens';
import { Book } from '../../types/book';
import { synthesizeNarrationWithElevenLabs } from './elevenlabs';
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

const DEFAULT_PROVIDER_FOOTNOTE = '当前朗读使用设备语音。中文预设可尝试 ElevenLabs PoC，失败时会自动回退本地朗读。';

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
  const [readerThemeId, setReaderThemeId] = useState<ReaderThemeId>('paper');
  const [providerFootnote, setProviderFootnote] = useState(DEFAULT_PROVIDER_FOOTNOTE);
  const dragX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const narrationTokenRef = useRef<string | null>(null);
  const webNarrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const webNarrationUrlRef = useRef<string | null>(null);

  const selectedVoicePreset =
    voicePresets.find((preset) => preset.id === selectedVoicePresetId) ?? voicePresets[0];
  const selectedCloudNarrationTarget = cloudNarrationTargetsByPresetId[selectedVoicePreset.id] ?? null;
  const voiceAssignments = useMemo(
    () => resolveVoiceAssignments(availableVoices, voicePresets),
    [availableVoices]
  );
  const matchedVoiceResult = voiceAssignments[selectedVoicePreset.id] ?? DEFAULT_VOICE_MATCH;
  const matchedVoice = matchedVoiceResult.voice;
  const readerTheme = readerThemes[readerThemeId];
  const nextReaderThemeId =
    readerThemeIds[(readerThemeIds.indexOf(readerThemeId) + 1) % readerThemeIds.length];

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

  const clearWebNarrationAudio = () => {
    const currentAudio = webNarrationAudioRef.current;

    if (currentAudio) {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.src = '';
      webNarrationAudioRef.current = null;
    }

    if (webNarrationUrlRef.current) {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(webNarrationUrlRef.current);
      }
      webNarrationUrlRef.current = null;
    }
  };

  const stopActiveNarration = async () => {
    narrationTokenRef.current = null;
    clearWebNarrationAudio();
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
      clearWebNarrationAudio();
      void Speech.stop();
      syncStopNarration();
    };
  }, []);

  useEffect(() => {
    if (!selectedCloudNarrationTarget) {
      setProviderFootnote(DEFAULT_PROVIDER_FOOTNOTE);
      return;
    }

    setProviderFootnote(
      `${selectedCloudNarrationTarget.label} 已就绪，中文朗读会优先请求云端音色；若环境不支持会自动回退本地朗读。`
    );
  }, [selectedCloudNarrationTarget]);

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
    const pageText = book.pages[page];

    narrationTokenRef.current = token;
    await Speech.stop();
    clearWebNarrationAudio();

    if (selectedCloudNarrationTarget) {
      setProviderFootnote(`正在连接 ${selectedCloudNarrationTarget.label}...`);

      const cloudResult = await synthesizeNarrationWithElevenLabs({
        target: selectedCloudNarrationTarget,
        text: pageText
      });

      if (narrationTokenRef.current !== token) {
        if (cloudResult.ok) {
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(cloudResult.audioUrl);
          }
        }
        return;
      }

      if (cloudResult.ok) {
        try {
          const audio = new globalThis.Audio(cloudResult.audioUrl);

          webNarrationAudioRef.current = audio;
          webNarrationUrlRef.current = cloudResult.audioUrl;
          startNarration(book.id, page);
          setProviderFootnote(`${cloudResult.providerLabel} 播放中，当前页中文朗读已切到云端 PoC。`);

          audio.onended = () => {
            if (narrationTokenRef.current === token) {
              clearWebNarrationAudio();
              syncStopNarration();
            }
          };
          audio.onerror = () => {
            if (narrationTokenRef.current === token) {
              clearWebNarrationAudio();
              syncStopNarration();
              setProviderFootnote(`${cloudResult.providerLabel} 播放失败，已停止本次朗读。`);
            }
          };

          await audio.play();
          return;
        } catch (error) {
          clearWebNarrationAudio();
          const detail = error instanceof Error ? error.message : '浏览器拒绝播放';

          setProviderFootnote(
            `${cloudResult.providerLabel} 播放未成功（${detail}），已回退设备语音朗读。`
          );
        }
      } else {
        setProviderFootnote(`${cloudResult.providerLabel} 不可用：${cloudResult.detail}`);
      }
    }

    startNarration(book.id, page);
    Speech.speak(pageText, {
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
    if (webNarrationAudioRef.current) {
      webNarrationAudioRef.current.pause();
      pauseNarration();
      return;
    }

    if (Platform.OS === 'android') {
      await stopActiveNarration();
      return;
    }

    await Speech.pause();
    pauseNarration();
  };

  const handleResumeNarration = async () => {
    if (webNarrationAudioRef.current) {
      await webNarrationAudioRef.current.play();
      resumeNarration();
      return;
    }

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

  const handleCycleTheme = () => {
    setReaderThemeId(nextReaderThemeId);
  };

  const voiceFootnote = !voiceLookupReady
    ? `正在扫描 ${selectedVoicePreset.label} 目标音色...`
    : matchedVoiceResult.reason === 'unique' && matchedVoice
      ? `${selectedVoicePreset.label} · 目标 ${selectedVoicePreset.tone} · 已命中 ${matchedVoice.name}`
      : matchedVoiceResult.reason === 'approximate' && matchedVoice
        ? `${selectedVoicePreset.label} · 目标 ${selectedVoicePreset.tone} · 当前回退到近似音色 ${matchedVoice.name}`
        : `${selectedVoicePreset.label} · 目标 ${selectedVoicePreset.tone} · 当前设备未命中，将回退到系统默认朗读`;
  const nextThemeLabel = readerThemes[nextReaderThemeId].label;
  const narrationStatusLabel = isCurrentNarration
    ? isPausedNarration
      ? '朗读已暂停'
      : '正在朗读当前页'
    : '准备开始听书';
  const toneStatusLabel = matchedVoice ? matchedVoice.name : '系统默认';

  return (
    <View style={[styles.screen, { backgroundColor: readerTheme.screenBackground }]}>
      <View pointerEvents="none" style={styles.ambientLayer}>
        <View
          style={[
            styles.ambientOrb,
            styles.ambientOrbPrimary,
            { backgroundColor: readerTheme.heroGlow }
          ]}
        />
        <View
          style={[
            styles.ambientOrb,
            styles.ambientOrbSecondary,
            { backgroundColor: readerTheme.heroGlowSecondary }
          ]}
        />
        <View style={[styles.ambientFrame, { borderColor: readerTheme.shellBorder }]} />
      </View>

      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: readerTheme.panelBackground,
            borderColor: readerTheme.panelBorder,
            shadowColor: readerTheme.shadow
          }
        ]}
      >
        <Pressable
          onPress={() => void handleClose()}
          style={[styles.backButton, { backgroundColor: readerTheme.surfaceMuted }]}
        >
          <Text style={[styles.backButtonLabel, { color: readerTheme.text }]}>返回书架</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Text style={[styles.headerEyebrow, { color: readerTheme.primary }]}>沉浸阅读</Text>
          <Text numberOfLines={1} style={[styles.bookTitle, { color: readerTheme.text }]}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: readerTheme.textSecondary }]}>{book.author}</Text>
        </View>
        <Pressable
          accessibilityLabel="切换阅读主题"
          onPress={handleCycleTheme}
          style={[
            styles.themeButton,
            {
              backgroundColor: readerTheme.primary,
              borderColor: readerTheme.border
            }
          ]}
        >
          <Text style={[styles.themeButtonEyebrow, { color: readerTheme.primaryText }]}>
            主题
          </Text>
          <Text style={[styles.themeButtonLabel, { color: readerTheme.primaryText }]}>
            {readerTheme.label}
          </Text>
          <Text style={[styles.themeButtonNextLabel, { color: readerTheme.primaryText }]}>
            切到 {nextThemeLabel}
          </Text>
        </Pressable>
      </View>

      <View
        {...panResponder.panHandlers}
        style={[
          styles.readerShell,
          {
            backgroundColor: readerTheme.shellBackground,
            borderColor: readerTheme.shellBorder
          }
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.readerShellInset, { borderColor: readerTheme.shellInset }]}
        />
        <View style={styles.readerShellTopbar}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: readerTheme.panelBackground,
                borderColor: readerTheme.panelBorder
              }
            ]}
          >
            <Text style={[styles.statusBadgeEyebrow, { color: readerTheme.textSecondary }]}>
              当前状态
            </Text>
            <Text style={[styles.statusBadgeValue, { color: readerTheme.text }]}>
              {narrationStatusLabel}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              styles.statusBadgeCompact,
              {
                backgroundColor: readerTheme.panelBackground,
                borderColor: readerTheme.panelBorder
              }
            ]}
          >
            <Text style={[styles.statusBadgeEyebrow, { color: readerTheme.textSecondary }]}>
              命中音色
            </Text>
            <Text numberOfLines={1} style={[styles.statusBadgeValue, { color: readerTheme.text }]}>
              {toneStatusLabel}
            </Text>
          </View>
        </View>
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
                {
                  backgroundColor: readerTheme.edgeRail,
                  borderColor: readerTheme.edgeRailBorder
                },
                !canGoPrevious && styles.edgeRailDisabled
              ]}
            >
              <Text
                style={[
                  styles.edgeHintCaption,
                  { color: readerTheme.textSecondary },
                  !canGoPrevious && styles.edgeHintCaptionDisabled
                ]}
              >
                {canGoPrevious ? 'PREV' : 'FIRST'}
              </Text>
              <Text
                style={[
                  styles.edgeHitLabel,
                  styles.edgeHitLabelLeft,
                  { color: readerTheme.edgeLabel }
                ]}
              >
                上一页
              </Text>
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
                {
                  backgroundColor: readerTheme.edgeRail,
                  borderColor: readerTheme.edgeRailBorder
                },
                !canGoNext && styles.edgeRailDisabled
              ]}
            >
              <Text
                style={[
                  styles.edgeHintCaption,
                  { color: readerTheme.textSecondary },
                  !canGoNext && styles.edgeHintCaptionDisabled
                ]}
              >
                {canGoNext ? 'NEXT' : 'LAST'}
              </Text>
              <Text
                style={[
                  styles.edgeHitLabel,
                  styles.edgeHitLabelRight,
                  { color: readerTheme.edgeLabel }
                ]}
              >
                下一页
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.pageFrame}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backgroundPage,
              {
                backgroundColor: readerTheme.surfaceRaised,
                borderColor: readerTheme.border
              },
              {
                opacity: backgroundOpacity,
                transform: [{ scale: backgroundScale }]
              }
            ]}
          >
            <View
              style={[
                styles.chapterPill,
                styles.chapterPillMuted,
                { backgroundColor: readerTheme.accent }
              ]}
            >
              <Text
                style={[
                  styles.chapterPillLabel,
                  styles.chapterPillMutedLabel,
                  { color: readerTheme.textSecondary }
                ]}
              >
                {dragDirection < 0 ? '下一页预览' : dragDirection > 0 ? '上一页预览' : '阅读中'}
              </Text>
            </View>
            <Text
              numberOfLines={PAGE_PREVIEW_LINE_COUNT}
              style={[styles.pagePreview, { color: readerTheme.textSecondary }]}
            >
              {targetPageText}
            </Text>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[styles.spineShadow, { backgroundColor: readerTheme.shadow, opacity: spineShadowOpacity }]}
          />

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
                backgroundColor: readerTheme.surface,
                borderColor: readerTheme.border
              },
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
            <Animated.View
              pointerEvents="none"
              style={[styles.pageShadow, { backgroundColor: readerTheme.shadow, opacity: pageShadowOpacity }]}
            />
            <View pointerEvents="none" style={[styles.pageTrim, { borderColor: readerTheme.pageTrim }]} />
            <View style={styles.pageTopRow}>
              <View style={[styles.chapterPill, { backgroundColor: book.accentColor }]}>
                <Text style={styles.chapterPillLabel}>卷页阅读</Text>
              </View>
              <Text style={[styles.pageMetaLabel, { color: readerTheme.textSecondary }]}>
                第 {page + 1} 页 · 共 {book.pages.length} 页
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={styles.readerContent}
              showsVerticalScrollIndicator={false}
              style={styles.readerScroll}
            >
              <Text style={[styles.pageBody, { color: readerTheme.text }]}>{book.pages[page]}</Text>
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      <View
        style={[
          styles.footerPanel,
          {
            backgroundColor: readerTheme.panelBackground,
            borderColor: readerTheme.panelBorder,
            shadowColor: readerTheme.shadow
          }
        ]}
      >
        <View style={styles.footerTopRow}>
          <Text style={[styles.progress, { color: readerTheme.text }]}>
            第 {page + 1} 页 / 共 {book.pages.length} 页
          </Text>
          <View style={[styles.footerThemeBadge, { backgroundColor: readerTheme.panelAccent }]}>
            <Text style={[styles.footerThemeBadgeLabel, { color: readerTheme.textSecondary }]}>
              主题 {readerTheme.label}
            </Text>
          </View>
        </View>
        <View style={styles.voicePresetRow}>
          {voicePresets.map((preset) => {
            const isSelected = preset.id === selectedVoicePreset.id;

            return (
              <Pressable
                key={preset.id}
                onPress={() => void handleSelectPreset(preset.id)}
                style={[
                  styles.voiceChip,
                  preset.gender === 'female' ? styles.voiceChipFemale : styles.voiceChipMale,
                  {
                    borderColor: isSelected
                      ? readerTheme.text
                      : preset.gender === 'female'
                        ? '#D8B2AC'
                        : '#AAC2C9',
                    backgroundColor: isSelected
                      ? readerTheme.text
                      : preset.gender === 'female'
                        ? readerTheme.accentSoft
                        : readerTheme.surfaceMuted
                  },
                  isSelected && styles.voiceChipSelected
                ]}
              >
                <Text
                  style={[
                    styles.voiceChipLabel,
                    { color: isSelected ? readerTheme.surface : readerTheme.text },
                    isSelected && styles.voiceChipLabelSelected
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.voiceChipTone,
                    { color: isSelected ? readerTheme.surface : readerTheme.textSecondary },
                    isSelected && styles.voiceChipLabelSelected
                  ]}
                >
                  {preset.tone}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text
          style={[
            styles.voiceFootnote,
            {
              backgroundColor: readerTheme.surfaceMuted,
              color:
                matchedVoiceResult.reason !== 'unique' && voiceLookupReady
                  ? readerTheme.primary
                  : readerTheme.textSecondary
            },
            matchedVoiceResult.reason !== 'unique' && voiceLookupReady && styles.voiceFootnoteFallback
          ]}
        >
          {voiceFootnote}
        </Text>
        <Text
          style={[
            styles.providerFootnote,
            {
              backgroundColor: readerTheme.surfaceMuted,
              color: selectedCloudNarrationTarget ? readerTheme.primary : readerTheme.textSecondary
            }
          ]}
        >
          {providerFootnote}
        </Text>
        <View style={styles.audioActions}>
          {isCurrentNarration ? (
            <>
              <Pressable
                onPress={() =>
                  void (isPausedNarration ? handleResumeNarration() : handlePauseNarration())
                }
                style={[
                  styles.audioButton,
                  styles.audioPrimaryButton,
                  { backgroundColor: readerTheme.success }
                ]}
              >
                <Text style={[styles.audioPrimaryLabel, { color: readerTheme.successText }]}>
                  {isPausedNarration ? '继续朗读' : Platform.OS === 'android' ? '停止朗读' : '暂停朗读'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleStopNarration()}
                style={[styles.audioButton, { backgroundColor: readerTheme.surfaceMuted }]}
              >
                <Text style={[styles.audioButtonLabel, { color: readerTheme.text }]}>结束</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void handleStartNarration()}
              style={[
                styles.audioButton,
                styles.audioPrimaryButton,
                { backgroundColor: readerTheme.success }
              ]}
            >
              <Text style={[styles.audioPrimaryLabel, { color: readerTheme.successText }]}>
                开始听书
              </Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.hint, { color: readerTheme.textSecondary }]}>
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
    overflow: 'hidden',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 56
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject
  },
  ambientOrb: {
    borderRadius: 999,
    position: 'absolute'
  },
  ambientOrbPrimary: {
    height: 220,
    opacity: 0.92,
    right: -40,
    top: 36,
    width: 220
  },
  ambientOrbSecondary: {
    bottom: 168,
    height: 280,
    left: -72,
    opacity: 0.7,
    width: 280
  },
  ambientFrame: {
    borderRadius: 32,
    borderWidth: 1,
    bottom: 14,
    left: 12,
    opacity: 0.3,
    position: 'absolute',
    right: 12,
    top: 36
  },
  headerCard: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.12,
    shadowRadius: 24
  },
  backButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    minHeight: 42,
    justifyContent: 'center',
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
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  themeButton: {
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  themeButtonEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    opacity: 0.8,
    textAlign: 'center'
  },
  themeButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center'
  },
  themeButtonNextLabel: {
    fontSize: 10,
    marginTop: 3,
    opacity: 0.7,
    textAlign: 'center'
  },
  bookTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700'
  },
  author: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4
  },
  readerShell: {
    borderRadius: 34,
    borderWidth: 1,
    flex: 1,
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 16
    },
    shadowOpacity: 0.16,
    shadowRadius: 32
  },
  readerShellInset: {
    borderRadius: 28,
    borderWidth: 1,
    bottom: 8,
    left: 8,
    opacity: 0.5,
    position: 'absolute',
    right: 8,
    top: 8
  },
  readerShellTopbar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 6
  },
  statusBadge: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  statusBadgeCompact: {
    flex: 0.78
  },
  statusBadgeEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  statusBadgeValue: {
    fontSize: 14,
    fontWeight: '700'
  },
  edgeAssistOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4
  },
  edgeHitArea: {
    bottom: 12,
    justifyContent: 'center',
    position: 'absolute',
    top: 84,
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
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
    minHeight: 132,
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
    marginTop: 2,
    overflow: 'hidden',
    position: 'relative'
  },
  backgroundPage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  spineShadow: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 3
  },
  pageShadow: {
    ...StyleSheet.absoluteFillObject
  },
  pageTrim: {
    borderRadius: 22,
    borderWidth: 1,
    bottom: 10,
    left: 10,
    opacity: 0.9,
    position: 'absolute',
    right: 10,
    top: 10
  },
  pageTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
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
    marginBottom: 12
  },
  chapterPillMutedLabel: {
    color: colors.textSecondary
  },
  readerScroll: {
    flex: 1
  },
  readerContent: {
    flexGrow: 1,
    paddingBottom: 12
  },
  pagePreview: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 28
  },
  pageBody: {
    color: colors.text,
    fontSize: 17,
    letterSpacing: 0.2,
    lineHeight: 30,
    paddingBottom: 6
  },
  footerPanel: {
    borderRadius: 26,
    borderWidth: 1,
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowOpacity: 0.12,
    shadowRadius: 28
  },
  footerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progress: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  footerThemeBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  footerThemeBadgeLabel: {
    fontSize: 11,
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
    borderWidth: 1
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
    opacity: 1
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
  providerFootnote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
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
    borderWidth: 0
  },
  audioButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  audioPrimaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 360,
    textAlign: 'center',
    alignSelf: 'center'
  }
});
