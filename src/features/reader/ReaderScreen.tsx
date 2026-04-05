import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { Voice } from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  PanResponder,
  Platform,
  Pressable,
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
const CHROME_AUTO_HIDE_DELAY_MS = 2200;
const DEFAULT_VOICE_MATCH: VoiceMatchResult = {
  reason: 'default',
  score: 0,
  voice: null
};

const DEFAULT_PROVIDER_FOOTNOTE = '当前朗读使用设备语音。中文预设可尝试 ElevenLabs PoC，失败时会自动回退本地朗读。';
const DEFAULT_RESOURCE_FOOTNOTE = '英文页支持一键跳转 Google Translate；若已导入本机 PDF，也可直接打开原始文件。';
const THEME_GLYPHS: Record<ReaderThemeId, string> = {
  paper: '◐',
  mist: '◌',
  night: '☾',
  cyber: '✦'
};

function getTranslationUrl(text: string, sourceLocale: string, targetLocale: string) {
  const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 1400);

  return `https://translate.google.com/?sl=${encodeURIComponent(sourceLocale)}&tl=${encodeURIComponent(
    targetLocale
  )}&text=${encodeURIComponent(snippet)}&op=translate`;
}

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
    goToPage,
    startNarration,
    pauseNarration,
    resumeNarration,
    stopNarration,
    setVoicePreset
  } = useLibrary();
  const { height, width } = useWindowDimensions();
  const horizontalInset = Math.min(Math.max(width * 0.04, 12), 22);
  const shellVerticalInset = Math.min(Math.max(height * 0.018, 8), 18);
  const shellRadius = width < 390 ? 26 : 32;
  const pageFrameHorizontalInset = width < 390 ? 12 : 16;
  const pageWidth = Math.max(width - horizontalInset * 2 - PAGE_SIDE_GUTTER * 2, 248);
  const page = currentPageByBookId[book.id] ?? 0;
  const [dragDirection, setDragDirection] = useState<-1 | 0 | 1>(0);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceLookupReady, setVoiceLookupReady] = useState(false);
  const [readerThemeId, setReaderThemeId] = useState<ReaderThemeId>('paper');
  const [providerFootnote, setProviderFootnote] = useState(DEFAULT_PROVIDER_FOOTNOTE);
  const [resourceFootnote, setResourceFootnote] = useState(DEFAULT_RESOURCE_FOOTNOTE);
  const [isChromeVisible, setIsChromeVisible] = useState(false);
  const [isThemeTrayOpen, setIsThemeTrayOpen] = useState(false);
  const [isVoiceTrayOpen, setIsVoiceTrayOpen] = useState(false);
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [isTocVisible, setIsTocVisible] = useState(false);
  const [isAiGuideVisible, setIsAiGuideVisible] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const chromeProgress = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const narrationTokenRef = useRef<string | null>(null);
  const webNarrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const webNarrationUrlRef = useRef<string | null>(null);
  const chromeHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const translatedPage = book.translatedPages?.[page] ?? null;
  const translatedTargetPage = book.translatedPages?.[targetPage] ?? null;
  const displayPageText = isTranslationEnabled && translatedPage ? translatedPage : book.pages[page];
  const targetPageText =
    isTranslationEnabled && translatedTargetPage
      ? translatedTargetPage
      : (book.pages[targetPage] ?? book.pages[page]);
  const translationModeLabel = translatedPage
    ? isTranslationEnabled
      ? '当前显示中文译文'
      : '当前显示英文原文'
    : '当前页暂无内置译文';
  const translationToggleLabel =
    translatedPage && isTranslationEnabled ? '查看原文' : translatedPage ? '自动翻译' : '暂无译文';
  const tocItems = book.tableOfContents ?? [];
  const aiGuide = book.aiGuide ?? null;
  const pdfStatusLabel = book.totalPdfPages ? `原 PDF ${book.totalPdfPages} 页已挂接` : '已挂接原 PDF';
  const guideToggleLabel = isTocVisible ? '收起目录导读' : '目录导读';
  const aiGuideToggleLabel = isAiGuideVisible ? '收起 AI 导读' : 'AI 导读';

  const backgroundOpacity = dragX.interpolate({
    inputRange: [-pageWidth * MAX_DRAG_RATIO, 0, pageWidth * MAX_DRAG_RATIO],
    outputRange: [1, 0.26, 1]
  });
  const headerTranslateY = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-96, 0]
  });
  const footerTranslateY = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0]
  });
  const chromeOpacity = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const chromeDrawerShadowOpacity = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.16]
  });
  const edgeRailOpacity = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const resetDrag = () => {
    dragX.setValue(0);
    setDragDirection(0);
    isAnimatingRef.current = false;
  };

  const clearChromeHideTimeout = () => {
    if (chromeHideTimeoutRef.current) {
      clearTimeout(chromeHideTimeoutRef.current);
      chromeHideTimeoutRef.current = null;
    }
  };

  const scheduleChromeAutoHide = () => {
    clearChromeHideTimeout();
    chromeHideTimeoutRef.current = setTimeout(() => {
      setIsThemeTrayOpen(false);
      setIsVoiceTrayOpen(false);
      Animated.spring(chromeProgress, {
        toValue: 0,
        bounciness: 0,
        speed: 16,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setIsChromeVisible(false);
        }
      });
    }, CHROME_AUTO_HIDE_DELAY_MS);
  };

  const revealChrome = () => {
    setIsChromeVisible(true);
    Animated.spring(chromeProgress, {
      toValue: 1,
      bounciness: 0,
      speed: 16,
      useNativeDriver: true
    }).start();
    scheduleChromeAutoHide();
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
        duration: 180,
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
      clearChromeHideTimeout();
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

  useEffect(() => {
    if (book.sourcePdfUri) {
      setResourceFootnote(
        `${book.language} 原书已导入，${pdfStatusLabel}，支持打开 ${book.sourcePdfLabel ?? 'PDF'}；翻译按钮会把当前页带到 Google Translate。`
      );
      return;
    }

    setResourceFootnote(DEFAULT_RESOURCE_FOOTNOTE);
  }, [book.language, book.sourcePdfLabel, book.sourcePdfUri, pdfStatusLabel]);

  useEffect(() => {
    if (!isChromeVisible) {
      clearChromeHideTimeout();
      return;
    }

    if (isThemeTrayOpen || isVoiceTrayOpen) {
      clearChromeHideTimeout();
      return;
    }

    scheduleChromeAutoHide();

    return () => {
      clearChromeHideTimeout();
    };
  }, [isChromeVisible, isThemeTrayOpen, isVoiceTrayOpen, page]);

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
    const pageText = displayPageText;

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
    revealChrome();
  };

  const handleToggleChrome = () => {
    if (isChromeVisible) {
      clearChromeHideTimeout();
      setIsThemeTrayOpen(false);
      setIsVoiceTrayOpen(false);
      Animated.spring(chromeProgress, {
        toValue: 0,
        bounciness: 0,
        speed: 16,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setIsChromeVisible(false);
        }
      });
      return;
    }

    revealChrome();
  };

  const handleTranslatePage = async () => {
    try {
      const translationUrl = getTranslationUrl(
        book.pages[page],
        book.translationSourceLocale ?? 'auto',
        book.translationTargetLocale ?? 'zh-CN'
      );

      await Linking.openURL(translationUrl);
      setResourceFootnote('已打开 Google Translate，本页英文内容会自动带入翻译页面。');
    } catch {
      setResourceFootnote('当前环境无法直接打开 Google Translate。');
    }
  };

  const handleToggleInlineTranslation = () => {
    if (!translatedPage) {
      setResourceFootnote('当前页还没有内置中文译文，已保留英文原文。');
      return;
    }

    setIsTranslationEnabled((value) => !value);
    setResourceFootnote(
      isTranslationEnabled
        ? '已切回英文原文；如需机翻，可继续打开 Google Translate。'
        : '已切到当前页中文译文；原文仍可通过按钮随时切回。'
    );
  };

  const handleOpenPdf = async () => {
    if (!book.sourcePdfUri) {
      setResourceFootnote('当前书籍没有可打开的原始 PDF。');
      return;
    }

    try {
      await Linking.openURL(book.sourcePdfUri);
      setResourceFootnote(`已尝试打开 ${book.sourcePdfLabel ?? '原始 PDF'}。`);
    } catch {
      setResourceFootnote('当前环境无法直接打开本机 PDF，请确认文件路径仍然有效。');
    }
  };

  const handleToggleToc = () => {
    revealChrome();
    setIsTocVisible((value) => !value);
    setIsAiGuideVisible(false);
    setResourceFootnote(`${pdfStatusLabel}，目录导读可直接跳转到对应章节导读页。`);
  };

  const handleToggleAiGuide = () => {
    revealChrome();
    setIsAiGuideVisible((value) => !value);
    setIsTocVisible(false);
    setResourceFootnote('AI 导读会根据本书结构给出阅读顺序、理解重点和思考问题。');
  };

  const handleJumpToGuidePage = async (nextPageIndex: number, title: string) => {
    await stopActiveNarration();
    goToPage(book.id, nextPageIndex);
    setIsTocVisible(false);
    setResourceFootnote(`已跳转到 ${title}。`);
    revealChrome();
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
  const voiceShortcutLabel = selectedVoicePreset.label.replace('声音', '').replace('女声', '女').replace('男声', '男');
  const compactNarrationButtonLabel = isCurrentNarration
    ? isPausedNarration
      ? '继续'
      : Platform.OS === 'android'
        ? '停止'
        : '暂停'
    : '听书';
  const isFullBleedMode = !isChromeVisible;

  const handlePrimaryNarrationAction = async () => {
    if (!isCurrentNarration) {
      await handleStartNarration();
      return;
    }

    if (isPausedNarration) {
      await handleResumeNarration();
      return;
    }

    if (Platform.OS === 'android') {
      await handleStopNarration();
      return;
    }

    await handlePauseNarration();
  };

  return (
    <View style={[styles.screen, { backgroundColor: readerTheme.screenBackground }]}>
      <StatusBar hidden={!isChromeVisible} style={readerThemeId === 'paper' || readerThemeId === 'mist' ? 'dark' : 'light'} />
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

      <Animated.View
        pointerEvents={isChromeVisible ? 'auto' : 'none'}
        style={[
          styles.headerCard,
          {
            backgroundColor: readerTheme.panelBackground,
            borderColor: readerTheme.panelBorder,
            shadowColor: readerTheme.shadow,
            left: horizontalInset,
            right: horizontalInset,
            top: shellVerticalInset,
            opacity: chromeOpacity,
            shadowOpacity: chromeDrawerShadowOpacity,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        <View style={styles.headerDrawerHandleWrap}>
          <View
            style={[
              styles.headerDrawerHandle,
              { backgroundColor: readerTheme.border }
            ]}
          />
        </View>
        <Pressable
          onPress={() => void handleClose()}
          style={[styles.backButton, { backgroundColor: readerTheme.surfaceMuted }]}
        >
          <Text style={[styles.backButtonLabel, { color: readerTheme.text }]}>返回书架</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Text numberOfLines={1} style={[styles.bookTitle, { color: readerTheme.text }]}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: readerTheme.textSecondary }]}>
            {book.author} · 第 {page + 1} / {book.pages.length} 页
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="打开主题切换"
            onPress={() => {
              revealChrome();
              setIsThemeTrayOpen((value) => !value);
              setIsVoiceTrayOpen(false);
            }}
            style={[
              styles.iconButton,
              {
                backgroundColor: readerTheme.surfaceMuted,
                borderColor: readerTheme.panelBorder
              }
            ]}
          >
            <Text style={[styles.iconButtonGlyph, { color: readerTheme.primary }]}>
              {THEME_GLYPHS[readerThemeId]}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="打开听书设置"
            onPress={() => {
              revealChrome();
              setIsVoiceTrayOpen((value) => !value);
              setIsThemeTrayOpen(false);
            }}
            style={[
              styles.iconButton,
              {
                backgroundColor: readerTheme.surfaceMuted,
                borderColor: readerTheme.panelBorder
              }
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.iconButtonGlyph, styles.iconButtonGlyphCompact, { color: readerTheme.primary }]}
            >
              {voiceShortcutLabel}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <View
        {...panResponder.panHandlers}
        style={[
          styles.readerShell,
          {
            backgroundColor: isFullBleedMode ? 'transparent' : readerTheme.shellBackground,
            borderColor: isFullBleedMode ? 'transparent' : readerTheme.shellBorder,
            borderRadius: isFullBleedMode ? 0 : shellRadius,
            borderWidth: isFullBleedMode ? 0 : 1,
            marginHorizontal: isFullBleedMode ? 0 : horizontalInset,
            marginVertical: isFullBleedMode ? 0 : shellVerticalInset,
            paddingBottom: isFullBleedMode ? 0 : 8,
            paddingHorizontal: isFullBleedMode ? 0 : 8,
            paddingTop: isFullBleedMode ? 0 : 8,
            shadowOpacity: isFullBleedMode ? 0 : 0.16
          }
        ]}
      >
        {isFullBleedMode ? null : (
          <View
            pointerEvents="none"
            style={[styles.readerShellInset, { borderColor: readerTheme.shellInset, borderRadius: shellRadius - 6 }]}
          />
        )}
        {isThemeTrayOpen ? (
          <View
            style={[
              styles.floatingTray,
              styles.themeTray,
              {
                backgroundColor: readerTheme.panelBackground,
                borderColor: readerTheme.panelBorder,
                shadowColor: readerTheme.shadow,
                top: 74
              }
            ]}
          >
            <View style={styles.trayHeader}>
              <Text style={[styles.trayTitle, { color: readerTheme.text }]}>阅读主题</Text>
              <Pressable
                onPress={handleCycleTheme}
                style={[styles.trayActionPill, { backgroundColor: readerTheme.surfaceMuted }]}
              >
                <Text style={[styles.trayActionLabel, { color: readerTheme.primary }]}>
                  切到 {nextThemeLabel}
                </Text>
              </Pressable>
            </View>
            <View style={styles.themeOptionRow}>
              {readerThemeIds.map((themeId) => {
                const theme = readerThemes[themeId];
                const isSelected = themeId === readerThemeId;

                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setReaderThemeId(themeId)}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: isSelected ? theme.primary : readerTheme.surfaceMuted,
                        borderColor: isSelected ? theme.primary : readerTheme.border
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeOptionSwatch,
                        { color: isSelected ? theme.primaryText : theme.primary }
                      ]}
                    >
                      {THEME_GLYPHS[theme.id]}
                    </Text>
                    <Text
                      style={[
                        styles.themeOptionLabel,
                        { color: isSelected ? theme.primaryText : readerTheme.text }
                      ]}
                    >
                      {theme.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        {isVoiceTrayOpen ? (
          <View
            style={[
              styles.floatingTray,
              styles.voiceTray,
              {
                backgroundColor: readerTheme.panelBackground,
                borderColor: readerTheme.panelBorder,
                shadowColor: readerTheme.shadow,
                top: 74
              }
            ]}
          >
            <Text style={[styles.trayTitle, { color: readerTheme.text }]}>听书声音</Text>
            <View style={styles.voicePresetRow}>
              {voicePresets.map((preset) => {
                const isSelected = preset.id === selectedVoicePreset.id;

                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => void handleSelectPreset(preset.id)}
                    style={[
                      styles.voiceChip,
                      {
                        borderColor: isSelected ? readerTheme.primary : readerTheme.border,
                        backgroundColor: isSelected ? readerTheme.primary : readerTheme.surfaceMuted
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.voiceChipLabel,
                        { color: isSelected ? readerTheme.primaryText : readerTheme.text }
                      ]}
                    >
                      {preset.label}
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
                }
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
          </View>
        ) : null}
        <View pointerEvents="box-none" style={styles.edgeAssistOverlay}>
          <Pressable
            accessibilityLabel="上一页"
            disabled={!canGoPrevious || isAnimatingRef.current}
            onPress={() => turnPage(1)}
            style={[
              styles.edgeHitArea,
              styles.edgeHitAreaLeft,
              {
                top: isChromeVisible ? 92 : 24
              }
            ]}
          >
            <Animated.View
              style={[
                styles.edgeRail,
                styles.edgeRailLeft,
                {
                  backgroundColor: readerTheme.edgeRail,
                  borderColor: readerTheme.edgeRailBorder,
                  opacity: edgeRailOpacity
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
            </Animated.View>
          </Pressable>
          <Pressable
            accessibilityLabel="下一页"
            disabled={!canGoNext || isAnimatingRef.current}
            onPress={() => turnPage(-1)}
            style={[
              styles.edgeHitArea,
              styles.edgeHitAreaRight,
              {
                top: isChromeVisible ? 92 : 24
              }
            ]}
          >
            <Animated.View
              style={[
                styles.edgeRail,
                styles.edgeRailRight,
                {
                  backgroundColor: readerTheme.edgeRail,
                  borderColor: readerTheme.edgeRailBorder,
                  opacity: edgeRailOpacity
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
            </Animated.View>
          </Pressable>
        </View>

        <View
          style={[
            styles.pageFrame,
            {
              borderRadius: isFullBleedMode ? 0 : 28,
              marginHorizontal: isFullBleedMode ? 0 : pageFrameHorizontalInset,
              marginTop: isFullBleedMode ? 0 : 8
            }
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backgroundPage,
              {
                backgroundColor: readerTheme.surfaceRaised,
                borderColor: readerTheme.border,
                borderRadius: isFullBleedMode ? 0 : shellRadius - 4,
                borderWidth: isFullBleedMode ? 0 : 1
              },
              {
                opacity: backgroundOpacity
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
            style={[
              styles.foregroundPage,
              {
                backgroundColor: readerTheme.surface,
                borderColor: readerTheme.border,
                borderRadius: isFullBleedMode ? 0 : shellRadius - 4,
                borderWidth: isFullBleedMode ? 0 : 1
              },
              {
                transform: [{ translateX: dragX }]
              }
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.pageTrim,
                {
                  borderColor: readerTheme.pageTrim,
                  borderRadius: isFullBleedMode ? 0 : shellRadius - 10,
                  opacity: isFullBleedMode ? 0 : 0.9
                }
              ]}
            />
            <View style={[styles.pageTopRow, isFullBleedMode && styles.pageTopRowCompact]}>
              <View style={[styles.chapterPill, { backgroundColor: book.accentColor }]}>
                <Text style={styles.chapterPillLabel}>沉浸阅读</Text>
              </View>
              <View style={styles.pageMetaCluster}>
                <Text style={[styles.pageMetaLabel, { color: readerTheme.textSecondary }]}>
                  第 {page + 1} 页 · 共 {book.pages.length} 页
                </Text>
                <Text style={[styles.translationModeLabel, { color: readerTheme.primary }]}>
                  {translationModeLabel}
                </Text>
              </View>
            </View>
            <View style={styles.utilityRow}>
              <Pressable
                disabled={!translatedPage}
                onPress={handleToggleInlineTranslation}
                style={[
                  styles.utilityButton,
                  { backgroundColor: readerTheme.surfaceMuted, borderColor: translatedPage ? readerTheme.primary : readerTheme.border },
                  !translatedPage && styles.utilityButtonDisabled
                ]}
              >
                <Text
                  style={[
                    styles.utilityButtonLabel,
                    { color: translatedPage ? readerTheme.primary : readerTheme.textSecondary }
                  ]}
                >
                  {translationToggleLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleTranslatePage()}
                style={[styles.utilityButton, { backgroundColor: readerTheme.surfaceMuted, borderColor: readerTheme.border }]}
              >
                <Text style={[styles.utilityButtonLabel, { color: readerTheme.primary }]}>Google 翻译</Text>
              </Pressable>
              <Pressable
                disabled={!book.sourcePdfUri}
                onPress={() => void handleOpenPdf()}
                style={[
                  styles.utilityButton,
                  { backgroundColor: readerTheme.surfaceMuted, borderColor: readerTheme.border },
                  !book.sourcePdfUri && styles.utilityButtonDisabled
                ]}
              >
                <Text
                  style={[
                    styles.utilityButtonLabel,
                    { color: book.sourcePdfUri ? readerTheme.text : readerTheme.textSecondary }
                  ]}
                >
                  打开 PDF
                </Text>
              </Pressable>
            </View>
            <View style={styles.utilityRow}>
              <Pressable
                onPress={handleToggleToc}
                style={[styles.utilityButton, { backgroundColor: readerTheme.surfaceMuted, borderColor: readerTheme.border }]}
              >
                <Text style={[styles.utilityButtonLabel, { color: readerTheme.primary }]}>{guideToggleLabel}</Text>
              </Pressable>
              <Pressable
                disabled={!aiGuide}
                onPress={handleToggleAiGuide}
                style={[
                  styles.utilityButton,
                  { backgroundColor: readerTheme.surfaceMuted, borderColor: readerTheme.border },
                  !aiGuide && styles.utilityButtonDisabled
                ]}
              >
                <Text
                  style={[
                    styles.utilityButtonLabel,
                    { color: aiGuide ? readerTheme.primary : readerTheme.textSecondary }
                  ]}
                >
                  {aiGuideToggleLabel}
                </Text>
              </Pressable>
            </View>
            <Text
              style={[
                styles.resourceFootnote,
                {
                  backgroundColor: readerTheme.surfaceMuted,
                  color: readerTheme.textSecondary
                }
              ]}
            >
              {resourceFootnote}
            </Text>
            <Pressable onPress={handleToggleChrome} style={styles.readerTapZone}>
              <ScrollView
                contentContainerStyle={styles.readerContent}
                showsVerticalScrollIndicator={false}
                style={styles.readerScroll}
              >
                {isTocVisible && tocItems.length ? (
                  <View
                    style={[
                      styles.guidePanel,
                      {
                        backgroundColor: readerTheme.surfaceMuted,
                        borderColor: readerTheme.border
                      }
                    ]}
                  >
                    <Text style={[styles.guidePanelTitle, { color: readerTheme.text }]}>目录导读</Text>
                    <Text style={[styles.guidePanelSummary, { color: readerTheme.textSecondary }]}>
                      共 {tocItems.length} 个导读页，覆盖 {pdfStatusLabel} 的主要章节脉络。
                    </Text>
                    <View style={styles.guideList}>
                      {tocItems.map((item) => (
                        <Pressable
                          key={`${item.title}-${item.pageIndex}`}
                          onPress={() => void handleJumpToGuidePage(item.pageIndex, item.title)}
                          style={[
                            styles.guideRow,
                            {
                              backgroundColor:
                                item.pageIndex === page ? readerTheme.panelBackground : readerTheme.surface,
                              borderColor:
                                item.pageIndex === page ? readerTheme.primary : readerTheme.border
                            }
                          ]}
                        >
                          <View style={styles.guideRowMeta}>
                            <Text style={[styles.guideRowIndex, { color: readerTheme.primary }]}>
                              {item.pageIndex + 1}
                            </Text>
                            <View style={styles.guideRowText}>
                              <Text style={[styles.guideRowTitle, { color: readerTheme.text }]}>{item.title}</Text>
                              <Text style={[styles.guideRowSummary, { color: readerTheme.textSecondary }]}>
                                {item.summary}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.guideRowPdfLabel, { color: readerTheme.textSecondary }]}>
                            {item.pdfPageLabel ?? `第 ${item.pageIndex + 1} 页`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
                {isAiGuideVisible && aiGuide ? (
                  <View
                    style={[
                      styles.guidePanel,
                      {
                        backgroundColor: readerTheme.surfaceMuted,
                        borderColor: readerTheme.border
                      }
                    ]}
                  >
                    <Text style={[styles.guidePanelTitle, { color: readerTheme.text }]}>AI 导读</Text>
                    <Text style={[styles.guidePanelSummary, { color: readerTheme.textSecondary }]}>
                      {aiGuide.summary}
                    </Text>
                    <View style={styles.aiGuideSection}>
                      <Text style={[styles.aiGuideSectionTitle, { color: readerTheme.primary }]}>建议读法</Text>
                      {aiGuide.recommendedPath.map((item) => (
                        <Text key={item} style={[styles.aiGuideBullet, { color: readerTheme.text }]}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.aiGuideSection}>
                      <Text style={[styles.aiGuideSectionTitle, { color: readerTheme.primary }]}>理解抓手</Text>
                      {aiGuide.understandingTips.map((item) => (
                        <Text key={item} style={[styles.aiGuideBullet, { color: readerTheme.text }]}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.aiGuideSection}>
                      <Text style={[styles.aiGuideSectionTitle, { color: readerTheme.primary }]}>思考问题</Text>
                      {aiGuide.reflectionQuestions.map((item) => (
                        <Text key={item} style={[styles.aiGuideBullet, { color: readerTheme.text }]}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : null}
                <Text style={[styles.pageBody, { color: readerTheme.text }]}>{displayPageText}</Text>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        pointerEvents={isChromeVisible ? 'auto' : 'none'}
        style={[
          styles.footerPanel,
          {
            backgroundColor: readerTheme.panelBackground,
            borderColor: readerTheme.panelBorder,
            bottom: shellVerticalInset,
            left: horizontalInset,
            opacity: chromeOpacity,
            right: horizontalInset,
            shadowColor: readerTheme.shadow,
            shadowOpacity: chromeDrawerShadowOpacity,
            transform: [{ translateY: footerTranslateY }]
          }
        ]}
      >
        <View
          style={[
            styles.compactAudioBar,
            {
              backgroundColor: readerTheme.surfaceMuted,
              borderColor: readerTheme.panelBorder
            }
          ]}
        >
          <View style={styles.compactAudioMeta}>
            <Text numberOfLines={1} style={[styles.compactAudioVoice, { color: readerTheme.text }]}>
              {selectedVoicePreset.label}
            </Text>
            <Text numberOfLines={1} style={[styles.compactAudioStatus, { color: readerTheme.textSecondary }]}>
              {toneStatusLabel} · {narrationStatusLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => void handlePrimaryNarrationAction()}
            style={[
              styles.compactAudioButton,
              { backgroundColor: isCurrentNarration ? readerTheme.primary : readerTheme.success }
            ]}
          >
            <Text
              style={[
                styles.compactAudioButtonLabel,
                {
                  color: isCurrentNarration
                    ? readerTheme.primaryText
                    : readerTheme.successText
                }
              ]}
            >
              {compactNarrationButtonLabel}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: 'hidden',
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0
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
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingVertical: 10,
    position: 'absolute',
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowRadius: 24,
    zIndex: 8
  },
  headerDrawerHandleWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 7
  },
  headerDrawerHandle: {
    borderRadius: 999,
    height: 4,
    opacity: 0.72,
    width: 48
  },
  backButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  backButtonLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700'
  },
  headerMeta: {
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  iconButtonGlyph: {
    fontSize: 15,
    fontWeight: '800'
  },
  iconButtonGlyphCompact: {
    fontSize: 11,
    fontWeight: '800'
  },
  floatingTray: {
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 286,
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'absolute',
    right: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    zIndex: 7
  },
  themeTray: {
    minWidth: 220
  },
  voiceTray: {
    minWidth: 260
  },
  trayHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  trayTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  trayActionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  trayActionLabel: {
    fontSize: 11,
    fontWeight: '700'
  },
  themeOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  themeOption: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  themeOptionSwatch: {
    fontSize: 12,
    fontWeight: '800'
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  bookTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700'
  },
  author: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  readerShell: {
    borderRadius: 34,
    borderWidth: 1,
    flex: 1,
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
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
    marginTop: 8,
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
  foregroundPage: {
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 3
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
    marginBottom: 6
  },
  pageTopRowCompact: {
    paddingTop: 14
  },
  pageMetaCluster: {
    alignItems: 'flex-end',
    gap: 4
  },
  pageMetaLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  translationModeLabel: {
    fontSize: 11,
    fontWeight: '700'
  },
  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  utilityButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  utilityButtonDisabled: {
    opacity: 0.5
  },
  utilityButtonLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  guidePanel: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 14
  },
  guidePanelTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  guidePanelSummary: {
    fontSize: 12,
    lineHeight: 18
  },
  guideList: {
    gap: 8
  },
  guideRow: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  guideRowMeta: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10
  },
  guideRowIndex: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 18
  },
  guideRowText: {
    flex: 1,
    gap: 4
  },
  guideRowTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  guideRowSummary: {
    fontSize: 12,
    lineHeight: 18
  },
  guideRowPdfLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  aiGuideSection: {
    gap: 6
  },
  aiGuideSectionTitle: {
    fontSize: 12,
    fontWeight: '800'
  },
  aiGuideBullet: {
    fontSize: 13,
    lineHeight: 21
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
  readerTapZone: {
    flex: 1
  },
  readerContent: {
    flexGrow: 1,
    paddingBottom: 26
  },
  resourceFootnote: {
    borderRadius: 14,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  pagePreview: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 25
  },
  pageBody: {
    color: colors.text,
    fontSize: 17,
    letterSpacing: 0.2,
    lineHeight: 31,
    paddingBottom: 6
  },
  footerPanel: {
    borderRadius: 26,
    borderWidth: 1,
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    zIndex: 8
  },
  voicePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  voiceChip: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  voiceChipLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  voiceFootnote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    marginTop: 10
  },
  providerFootnote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    marginTop: 8
  },
  compactAudioBar: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  compactAudioMeta: {
    flex: 1,
    minWidth: 0
  },
  compactAudioVoice: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
  },
  compactAudioStatus: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2
  },
  compactAudioButton: {
    borderRadius: 999,
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  compactAudioButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  }
});
