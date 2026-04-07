import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { DefaultAccent } from "@/constants/theme";

// MicButton — the single icon in the app, seated in the thumb-rest position.
//
// In this scaffolding pass the button is visually present but inert. Voice
// input (expo-audio recording + Deepgram streaming into the draft state)
// ships in a follow-up pass.

const SIZE = 56;
const ICON = 24;

export interface MicButtonProps {
  onPress?: () => void;
  accent?: string;
}

export function MicButton({ onPress, accent = DefaultAccent }: MicButtonProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: accent, opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={12}
      >
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
          {/* Mic body */}
          <Rect x={9} y={3} width={6} height={11} rx={3} fill="#2C2C2C" />
          {/* Mic stand arc */}
          <Path
            d="M5 11a7 7 0 0 0 14 0"
            stroke="#2C2C2C"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          {/* Stem */}
          <Path
            d="M12 18v3"
            stroke="#2C2C2C"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
