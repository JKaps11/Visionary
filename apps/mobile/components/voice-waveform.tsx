import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useAccent } from "@/context/accent";

// Accent-colored bar waveform driven by a `level` shared value (0..1) which
// the recording status listener writes from `metering`. We render a row of
// bars whose individual heights interpolate from a baseline up to the level.

interface Props {
  level: SharedValue<number>;
}

const BAR_COUNT = 21;
const BAR_W = 3;
const BAR_GAP = 4;
const BASE_H = 4;
const MAX_H = 32;

// Each bar amplitude is shaped by a fixed sine envelope so the middle bars
// react more than the edges, giving the line a soft hump.
const ENVELOPE: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / (BAR_COUNT - 1);
  return Math.sin(t * Math.PI);
});

export function VoiceWaveform({ level }: Props) {
  const accent = useAccent();
  return (
    <View style={styles.row}>
      {ENVELOPE.map((env, i) => (
        <Bar key={i} env={env} level={level} color={accent} />
      ))}
    </View>
  );
}

function Bar({
  env,
  level,
  color,
}: {
  env: number;
  level: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const h = BASE_H + env * level.value * (MAX_H - BASE_H);
    return {
      height: withTiming(h, { duration: 80 }),
    };
  });
  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: BAR_GAP,
    height: MAX_H,
  },
  bar: {
    width: BAR_W,
    borderRadius: BAR_W / 2,
  },
});
