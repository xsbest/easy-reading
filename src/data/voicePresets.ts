import { VoicePreset } from '../types/book';

export const voicePresets: VoicePreset[] = [
  {
    id: 'warm-female',
    label: '知性女声',
    gender: 'female',
    tone: '温柔叙述',
    rate: 0.94,
    pitch: 1.08,
    keywords: ['xiaoxiao', 'xiaoyi', 'tingting', 'huihui', 'aria', 'ava', 'serena', 'grace'],
    localeHints: ['zh-CN', 'zh', 'en-US', 'en'],
    avoidKeywords: ['male', 'man', 'aaron', 'liam', 'david', 'tom', 'narrator']
  },
  {
    id: 'bright-female',
    label: '元气女声',
    gender: 'female',
    tone: '轻快陪读',
    rate: 1.01,
    pitch: 1.16,
    keywords: ['xiaomo', 'jenny', 'emma', 'luna', 'mei-jia', 'siri female', 'sunny', 'cheer'],
    localeHints: ['zh-CN', 'zh', 'en-US', 'en'],
    avoidKeywords: ['male', 'man', 'narrator', 'david', 'tom', 'huihui', 'tingting']
  },
  {
    id: 'steady-male',
    label: '沉稳男声',
    gender: 'male',
    tone: '低频播报',
    rate: 0.92,
    pitch: 0.9,
    keywords: ['yunxi', 'david', 'tom', 'daniel', 'alex', 'fred', 'male', 'man'],
    localeHints: ['zh-CN', 'zh', 'en-US', 'en'],
    avoidKeywords: ['female', 'woman', 'jenny', 'emma', 'aria', 'ava', 'narrator']
  },
  {
    id: 'podcast-male',
    label: '播客男声',
    gender: 'male',
    tone: '清晰讲述',
    rate: 0.98,
    pitch: 0.98,
    keywords: ['aaron', 'narrator', 'liam', 'samuel', 'google us english', 'news', 'studio'],
    localeHints: ['en-US', 'en', 'zh-CN', 'zh'],
    avoidKeywords: ['female', 'woman', 'xiaoxiao', 'xiaoyi', 'tingting', 'huihui']
  }
];
