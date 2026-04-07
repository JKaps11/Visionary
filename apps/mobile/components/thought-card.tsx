import { Pressable, StyleSheet, Text } from "react-native";

import { Colors, Fonts, Spacing } from "@/constants/theme";

export interface ThoughtCardProps {
  content: string;
  onPress?: () => void;
}

// A single thought in the archive list. One or two lines of mono text.
// Tap to open ThoughtDetail.
export function ThoughtCard({ content, onPress }: ThoughtCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text numberOfLines={3} style={styles.text}>
        {content}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pressed: {
    opacity: 0.5,
  },
  text: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 16,
    lineHeight: 24,
  },
});
