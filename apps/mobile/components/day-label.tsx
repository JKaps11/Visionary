import { StyleSheet, Text } from "react-native";

import { Colors, Fonts, Spacing } from "@/constants/theme";

export interface DayLabelProps {
  label: string;
}

// Small mono date header in the archive. Formatted upstream.
export function DayLabel({ label }: DayLabelProps) {
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});
