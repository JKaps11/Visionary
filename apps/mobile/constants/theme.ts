// Visionary theme. One background, one ink, one accent, one font.
// Values come straight from about/mobile_design.md.

export const Colors = {
  background: "#2C2C2C",
  text: "#E4E4E4",
  // Dimmed text for day labels, metadata, etc.
  textMuted: "#888888",
};

// Accent palette. The user picks one from the settings sheet.
// First entry is the v1 default until settings are wired up.
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
