export const Colors = {
  background: "#2C2C2C",
  text: "#E4E4E4",
  textMuted: "#888888",
};

export const AccentPalette = ["#B39CD0", "#FFC1CC", "#A8DADC"] as const;
export type Accent = (typeof AccentPalette)[number];
export const DefaultAccent: Accent = AccentPalette[0];

// This matches the font family name exposed by @expo-google-fonts/ibm-plex-mono
// when IBMPlexMono_400Regular is loaded via useFonts().
export const Fonts = {
  mono: "IBMPlexMono_400Regular",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
