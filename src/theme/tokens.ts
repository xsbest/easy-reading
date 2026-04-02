export const colors = {
  background: "#F6F1E8",
  surface: "#FFFDFC",
  surfaceMuted: "#EFE7DA",
  text: "#231F1A",
  textSecondary: "#6E655A",
  border: "#D9CDBD",
  primary: "#6A4E2F",
  white: "#FFFFFF",
  shadow: "#1C140B",
  success: "#335F4B",
};

export type ReaderThemeId = "paper" | "mist" | "night" | "cyber";

export type ReaderTheme = {
  id: ReaderThemeId;
  label: string;
  screenBackground: string;
  shellBackground: string;
  shellBorder: string;
  shellInset: string;
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
  panelBackground: string;
  panelBorder: string;
  panelAccent: string;
  heroGlow: string;
  heroGlowSecondary: string;
  pageTrim: string;
};

export const readerThemes: Record<ReaderThemeId, ReaderTheme> = {
  paper: {
    id: "paper",
    label: "皮纸",
    screenBackground: "#F6F1E8",
    shellBackground: "#E9DECF",
    shellBorder: "rgba(120, 93, 62, 0.18)",
    shellInset: "rgba(255, 255, 255, 0.52)",
    surface: "#FFFDFC",
    surfaceMuted: "#EFE7DA",
    surfaceRaised: "#F3E8D7",
    border: "#D9CDBD",
    text: "#231F1A",
    textSecondary: "#6E655A",
    primary: "#6A4E2F",
    primaryText: "#FFFFFF",
    accent: "#E4D5BF",
    accentSoft: "#F6EBDC",
    edgeRail: "rgba(239, 231, 218, 0.84)",
    edgeRailBorder: "#D7C8B4",
    edgeLabel: "#8B775D",
    shadow: "#1C140B",
    success: "#335F4B",
    successText: "#FFFFFF",
    panelBackground: "rgba(255, 253, 249, 0.88)",
    panelBorder: "rgba(160, 133, 101, 0.18)",
    panelAccent: "#F7E8D5",
    heroGlow: "rgba(227, 200, 165, 0.45)",
    heroGlowSecondary: "rgba(255, 248, 235, 0.82)",
    pageTrim: "#E7D8C5",
  },
  mist: {
    id: "mist",
    label: "雾青",
    screenBackground: "#E7EEF0",
    shellBackground: "#CEDDE1",
    shellBorder: "rgba(74, 108, 119, 0.18)",
    shellInset: "rgba(255, 255, 255, 0.48)",
    surface: "#F8FBFC",
    surfaceMuted: "#DCE8EB",
    surfaceRaised: "#E6F0F2",
    border: "#B4CAD0",
    text: "#1C2B30",
    textSecondary: "#5D747B",
    primary: "#325460",
    primaryText: "#FFFFFF",
    accent: "#9BBBC3",
    accentSoft: "#EEF5F7",
    edgeRail: "rgba(220, 232, 235, 0.9)",
    edgeRailBorder: "#AFC6CD",
    edgeLabel: "#4F6971",
    shadow: "#132127",
    success: "#2D6A61",
    successText: "#FFFFFF",
    panelBackground: "rgba(248, 251, 252, 0.86)",
    panelBorder: "rgba(80, 113, 123, 0.14)",
    panelAccent: "#E4F0F3",
    heroGlow: "rgba(155, 187, 195, 0.5)",
    heroGlowSecondary: "rgba(238, 245, 247, 0.86)",
    pageTrim: "#D1E1E6",
  },
  night: {
    id: "night",
    label: "夜读",
    screenBackground: "#111722",
    shellBackground: "#1B2230",
    shellBorder: "rgba(149, 173, 214, 0.18)",
    shellInset: "rgba(255, 255, 255, 0.04)",
    surface: "#1B2433",
    surfaceMuted: "#273142",
    surfaceRaised: "#202A39",
    border: "#344154",
    text: "#EEF3FF",
    textSecondary: "#A3B1C7",
    primary: "#8FB7FF",
    primaryText: "#10161F",
    accent: "#37517A",
    accentSoft: "#223047",
    edgeRail: "rgba(39, 49, 66, 0.92)",
    edgeRailBorder: "#435066",
    edgeLabel: "#C2D2F2",
    shadow: "#06080D",
    success: "#5E9B88",
    successText: "#08120E",
    panelBackground: "rgba(26, 35, 49, 0.86)",
    panelBorder: "rgba(138, 168, 214, 0.16)",
    panelAccent: "#223047",
    heroGlow: "rgba(62, 113, 196, 0.35)",
    heroGlowSecondary: "rgba(125, 165, 255, 0.16)",
    pageTrim: "#263449",
  },
  cyber: {
    id: "cyber",
    label: "赛博",
    screenBackground: "#070711",
    shellBackground: "#111124",
    shellBorder: "rgba(61, 255, 231, 0.22)",
    shellInset: "rgba(255, 255, 255, 0.06)",
    surface: "#111426",
    surfaceMuted: "#171C31",
    surfaceRaised: "#0C1020",
    border: "#2E3A5C",
    text: "#F5F7FF",
    textSecondary: "#94A7D6",
    primary: "#36FCE0",
    primaryText: "#051017",
    accent: "#FF3CA6",
    accentSoft: "#19152D",
    edgeRail: "rgba(12, 17, 34, 0.92)",
    edgeRailBorder: "#2B4A68",
    edgeLabel: "#62F9E8",
    shadow: "#02030A",
    success: "#58F3C3",
    successText: "#04130F",
    panelBackground: "rgba(14, 19, 38, 0.88)",
    panelBorder: "rgba(70, 248, 230, 0.16)",
    panelAccent: "#151B34",
    heroGlow: "rgba(255, 60, 166, 0.34)",
    heroGlowSecondary: "rgba(54, 252, 224, 0.24)",
    pageTrim: "#253253",
  },
};

export const readerThemeIds = Object.keys(readerThemes) as ReaderThemeId[];
