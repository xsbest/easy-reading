export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  accentColor: string;
  language: string;
  sourcePdfLabel?: string;
  sourcePdfUri?: string;
  translationSourceLocale?: string;
  translationTargetLocale?: string;
  pages: string[];
};

export type VoicePreset = {
  id: string;
  label: string;
  gender: 'female' | 'male';
  tone: string;
  rate: number;
  pitch: number;
  keywords: string[];
  localeHints: string[];
  avoidKeywords?: string[];
};

export type LibraryState = {
  books: Book[];
  selectedBookId: string | null;
  lastOpenedBookId: string | null;
  currentPageByBookId: Record<string, number>;
  isNarrationActive: boolean;
  isNarrationPaused: boolean;
  narrationBookId: string | null;
  narrationPageByBookId: Record<string, number>;
  selectedVoicePresetId: string;
};
