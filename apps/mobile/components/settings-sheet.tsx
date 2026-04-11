import { useAuthActions } from "@convex-dev/auth/react";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAccentControls } from "@/context/accent";
import { Colors, Fonts, Spacing, type Accent } from "@/constants/theme";

interface Props {
  open: boolean;
  onClose: () => void;
}

const { width: W } = Dimensions.get("window");
const SHEET_W = Math.min(320, Math.round(W * 0.8));
const PAPER = Easing.bezier(0.32, 0.72, 0.24, 1);
const ANIM = { duration: 250, easing: PAPER };

export function SettingsSheet({ open, onClose }: Props) {
  const { accent, setAccent, palette } = useAccentControls();
  const { signOut } = useAuthActions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, ANIM);
  }, [open, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * SHEET_W }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
    pointerEvents: progress.value > 0.01 ? "auto" : "none",
  }));

  const handleAccentTap = (next: Accent) => {
    void Haptics.selectionAsync();
    setAccent(next);
  };

  const handleSignOut = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void signOut();
  };

  return (
    <>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>accent</Text>
          <View style={styles.swatchRow}>
            {palette.map((color) => {
              const selected = color === accent;
              return (
                <Pressable
                  key={color}
                  onPress={() => handleAccentTap(color)}
                  style={({ pressed }) => [
                    styles.swatch,
                    { backgroundColor: color, opacity: pressed ? 0.7 : 1 },
                    selected && styles.swatchSelected,
                  ]}
                  hitSlop={8}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable onPress={handleSignOut} hitSlop={8}>
            <Text style={[styles.action, { color: accent }]}>sign out</Text>
          </Pressable>
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.version}>
            v{Constants.expoConfig?.version ?? "0.0.0"}
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: SHEET_W,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl * 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#3A3A3A",
  },
  section: {
    paddingVertical: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  swatchRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: Colors.text,
  },
  action: {
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
  versionRow: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
  },
  version: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 11,
  },
});
