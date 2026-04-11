import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";

import { useAccent } from "@/context/accent";
import { Fonts } from "@/constants/theme";

export const Direction = {
  None: 0,
  Up: 1,
  Down: 2,
} as const;

interface Props {
  dominantDirection: SharedValue<number>;
}

const TRANSLATE = 8;
const SPRING = { duration: 150, easing: Easing.bezier(0.32, 0.72, 0.24, 1) };

export function GestureAffordances({ dominantDirection }: Props) {
  const accent = useAccent();
  const march = useSharedValue(0);

  useEffect(() => {
    march.value = 0;
    march.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(march);
  }, [march]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Indicator
        edge="top"
        direction={Direction.Up}
        dominant={dominantDirection}
        march={march}
        accent={accent}
        label="new"
      />
      <Indicator
        edge="bottom"
        direction={Direction.Down}
        dominant={dominantDirection}
        march={march}
        accent={accent}
        label="archive"
      />
    </View>
  );
}

interface IndicatorProps {
  edge: "top" | "bottom";
  direction: number;
  dominant: SharedValue<number>;
  march: SharedValue<number>;
  accent: string;
  label: string;
}

function Indicator({
  edge,
  direction,
  dominant,
  march,
  accent,
  label,
}: IndicatorProps) {
  const containerStyle = useAnimatedStyle(() => {
    const isSelected = dominant.value === direction;
    const isActive = dominant.value !== Direction.None;
    const opacity = withTiming(isActive ? (isSelected ? 1 : 0.6) : 0, SPRING);
    const ty = isSelected ? (edge === "top" ? -TRANSLATE : TRANSLATE) : 0;
    return {
      opacity,
      transform: [
        { translateY: withTiming(ty, SPRING) },
      ],
    };
  });

  const c0 = useChevronOpacity(march, dominant, direction, 0);
  const c1 = useChevronOpacity(march, dominant, direction, 0.11);
  const c2 = useChevronOpacity(march, dominant, direction, 0.22);

  const positionStyle = positionStyles[edge];
  const rotation = rotations[edge];

  return (
    <Animated.View style={[styles.indicator, positionStyle, containerStyle]}>
      <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
        <Animated.View style={c0}>
          <Chevron color={accent} />
        </Animated.View>
        <Animated.View style={[c1, styles.chevronGap]}>
          <Chevron color={accent} />
        </Animated.View>
        <Animated.View style={[c2, styles.chevronGap]}>
          <Chevron color={accent} />
        </Animated.View>
        <View style={[styles.baseline, { backgroundColor: accent }]} />
      </View>
      <Animated.Text
        style={[styles.label, { color: accent, fontFamily: Fonts.mono }]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

function useChevronOpacity(
  march: SharedValue<number>,
  dominant: SharedValue<number>,
  direction: number,
  offset: number,
) {
  return useAnimatedStyle(() => {
    if (dominant.value !== direction) return { opacity: 0.6 };
    const t = (march.value + offset) % 1;
    const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 - Math.PI / 2));
    return { opacity: pulse };
  });
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={28} height={10} viewBox="0 0 28 10">
      <Polyline
        points="2,8 14,2 26,8"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const positionStyles = StyleSheet.create({
  top: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottom: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

const rotations = {
  top: 0,
  bottom: 180,
};

export function ArchiveReturnIndicator() {
  const accent = useAccent();

  return (
    <View pointerEvents="none" style={archiveStyles.container}>
      <Chevron color={accent} />
      <View style={styles.chevronGap}>
        <Chevron color={accent} />
      </View>
      <View style={styles.chevronGap}>
        <Chevron color={accent} />
      </View>
    </View>
  );
}

const archiveStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
  indicator: {
    alignItems: "center",
  },
  chevronGap: {
    marginTop: 2,
  },
  baseline: {
    marginTop: 4,
    height: 1,
    width: 28,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "lowercase",
  },
});
