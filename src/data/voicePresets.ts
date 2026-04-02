import { VoicePreset } from '../types/book';

export type CloudNarrationTarget = {
  label: string;
  locale: string;
  modelId: string;
  provider: 'elevenlabs';
  voiceId: string;
};

export const voicePresets: VoicePreset[] = [
  {
    id: 'mandarin-soft-female',
    label: '中文女声',
    gender: 'female',
    tone: '晓晓 / Tingting',
    rate: 0.94,
    pitch: 1.08,
    keywords: [
      'xiaoxiao',
      'xiaoyi',
      'tingting',
      'huihui',
      'mei jia',
      'meijia',
      'sin ji',
      'zhiyu'
    ],
    localeHints: ['zh-CN', 'zh-Hans', 'zh'],
    avoidKeywords: ['male', 'man', 'aaron', 'liam', 'david', 'tom', 'narrator', 'daniel']
  },
  {
    id: 'english-natural-female',
    label: '英文女声',
    gender: 'female',
    tone: 'Samantha / Ava',
    rate: 1.01,
    pitch: 1.16,
    keywords: [
      'samantha',
      'ava',
      'allison',
      'susan',
      'victoria',
      'karen',
      'serena',
      'aria'
    ],
    localeHints: ['en-US', 'en-GB', 'en-AU', 'en'],
    avoidKeywords: ['male', 'man', 'narrator', 'david', 'tom', 'huihui', 'tingting', 'yunxi']
  },
  {
    id: 'mandarin-steady-male',
    label: '中文男声',
    gender: 'male',
    tone: '云希 / Kangkang',
    rate: 0.92,
    pitch: 0.9,
    keywords: ['yunxi', 'yunyang', 'kangkang', 'jun', 'siqi', 'bo', 'male chinese'],
    localeHints: ['zh-CN', 'zh-Hans', 'zh'],
    avoidKeywords: ['female', 'woman', 'jenny', 'emma', 'aria', 'ava', 'narrator', 'samantha']
  },
  {
    id: 'english-podcast-male',
    label: '英文男声',
    gender: 'male',
    tone: 'Daniel / Aaron',
    rate: 0.98,
    pitch: 0.98,
    keywords: [
      'daniel',
      'aaron',
      'alex',
      'fred',
      'tom',
      'narrator',
      'google us english',
      'news'
    ],
    localeHints: ['en-GB', 'en-US', 'en-AU', 'en'],
    avoidKeywords: ['female', 'woman', 'xiaoxiao', 'xiaoyi', 'tingting', 'huihui', 'samantha']
  }
];

export const cloudNarrationTargetsByPresetId: Partial<Record<VoicePreset['id'], CloudNarrationTarget>> = {
  'mandarin-soft-female': {
    label: 'ElevenLabs 中文女声 PoC',
    locale: 'zh-CN',
    modelId: 'eleven_multilingual_v2',
    provider: 'elevenlabs',
    voiceId: 'EXAVITQu4vr4xnSDxMaL'
  },
  'mandarin-steady-male': {
    label: 'ElevenLabs 中文男声 PoC',
    locale: 'zh-CN',
    modelId: 'eleven_multilingual_v2',
    provider: 'elevenlabs',
    voiceId: 'onwK4e9ZLuTAKqWW03F9'
  }
};
