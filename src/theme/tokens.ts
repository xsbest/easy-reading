export const colors = {
  background: '#F6F1E8',
  surface: '#FFFDFC',
  surfaceMuted: '#EFE7DA',
  text: '#231F1A',
  textSecondary: '#6E655A',
  border: '#D9CDBD',
  primary: '#6A4E2F',
  white: '#FFFFFF',
  shadow: '#1C140B',
  success: '#335F4B'
};

export type ReaderThemeId = 'paper' | 'mist' | 'night';

export type ReaderTheme = {
  id: ReaderThemeId;
  label: string;
  screenBackground: string;
  shellBackground: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  edgeRail: string;
  edgeRailBorder: string;
  edgeLabel: string;
  shadow: string;
  success: string;
  successText: string;
};

export const readerThemes: Record<ReaderThemeId, ReaderTheme> = {
  paper: {
    id: 'paper',
    label: '羊皮纸',
    screenBackground: '#F6F1E8',
    shellBackground: '#E9DECF',
    surface: '#FFFDFC',
    surfaceMuted: '#EFE7DA',
    surfaceRaised: '#F3E8D7',
    border: '#D9CDBD',
    text: '#231F1A',
    textSecondary: '#6E655A',
    primary: '#6A4E2F',
    primaryText: '#FFFFFF',
    accent: '#E4D5BF',
    accentSoft: '#F6EBDC',
    edgeRail: 'rgba(239, 231, 218, 0.84)',
    edgeRailBorder: '#D7C8B4',
    edgeLabel: '#8B775D',
    shadow: '#1C140B',
    success: '#335F4B',
    successText: '#FFFFFF'
  },
  mist: {
    id: 'mist',
    label: '雾青',
    screenBackground: '#E7EEF0',
    shellBackground: '#CEDDE1',
    surface: '#F8FBFC',
    surfaceMuted: '#DCE8EB',
    surfaceRaised: '#E6F0F2',
    border: '#B4CAD0',
    text: '#1C2B30',
    textSecondary: '#5D747B',
    primary: '#325460',
    primaryText: '#FFFFFF',
    accent: '#9BBBC3',
    accentSoft: '#EEF5F7',
    edgeRail: 'rgba(220, 232, 235, 0.9)',
    edgeRailBorder: '#AFC6CD',
    edgeLabel: '#4F6971',
    shadow: '#132127',
    success: '#2D6A61',
    successText: '#FFFFFF'
  },
  night: {
    id: 'night',
    label: '夜读',
    screenBackground: '#111722',
    shellBackground: '#1B2230',
    surface: '#1B2433',
    surfaceMuted: '#273142',
    surfaceRaised: '#202A39',
    border: '#344154',
    text: '#EEF3FF',
    textSecondary: '#A3B1C7',
    primary: '#8FB7FF',
    primaryText: '#10161F',
    accent: '#37517A',
    accentSoft: '#223047',
    edgeRail: 'rgba(39, 49, 66, 0.92)',
    edgeRailBorder: '#435066',
    edgeLabel: '#C2D2F2',
    shadow: '#06080D',
    success: '#5E9B88',
    successText: '#08120E'
  }
};

export const readerThemeIds = Object.keys(readerThemes) as ReaderThemeId[];
