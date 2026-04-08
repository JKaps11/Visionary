import * as Haptics from "expo-haptics";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { api } from "@visionary/backend/convex/_generated/api";

import { ArchiveContent } from "@/components/archive-content";
import { CaptureContent } from "@/components/capture-content";
import type { EditorHandle } from "@/components/editor";
import { Direction, GestureAffordances } from "@/components/gesture-affordances";
import { SettingsSheet } from "@/components/settings-sheet";
import { Colors } from "@/constants/theme";

const { height: H, width: W } = Dimensions.get("window");

const COMMIT_DISTANCE = 80;
const COMMIT_VELOCITY = 800;
const AFFORDANCE_REVEAL = 8;
const EDGE_LEFT = 20;
const EDGE_BOTTOM = 20;
const ARCHIVE_RETURN_BAND = 120;

const PAPER = Easing.bezier(0.32, 0.72, 0.24, 1);
const TURN = { duration: 320, easing: PAPER };
const SNAP = { duration: 200, easing: PAPER };
const SETTINGS = { duration: 250, easing: PAPER };

const Layer = {
  Capture: 0,
  Archive: 1,
} as const;

type LayerName = "capture" | "archive";

export function PageStack() {
  const [draft, setDraft] = useState("");
  const [layer, setLayer] = useState<LayerName>("capture");
  const draftRef = useRef(draft);
  const editorRef = useRef<EditorHandle>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const createThought = useMutation(api.thoughts.create);

  const commitDraft = useCallback(async () => {
    const current = draftRef.current.trim();
    if (current.length === 0) return;
    setDraft("");
    draftRef.current = "";
    try {
      await createThought({ content: current });
    } catch (err) {
      console.error("Failed to commit draft:", err);
      setDraft(current);
      draftRef.current = current;
    }
  }, [createThought]);

  const appendDraft = useCallback((text: string) => {
    setDraft((prev) => {
      if (prev.length === 0) return text;
      const sep = /\s$/.test(prev) ? "" : " ";
      return prev + sep + text;
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        void commitDraft();
      }
    });
    return () => sub.remove();
  }, [commitDraft]);

  const progress = useSharedValue(0);
  const liftY = useSharedValue(0);
  const settingsX = useSharedValue(0);
  const layerSV = useSharedValue(0);
  const dominantDirection = useSharedValue(0);
  const valid = useSharedValue(true);

  const haptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const goArchive = useCallback(() => {
    setLayer("archive");
    layerSV.value = Layer.Archive;
    editorRef.current?.blur();
    haptic();
  }, [haptic, layerSV]);

  const goCapture = useCallback(() => {
    setLayer("capture");
    layerSV.value = Layer.Capture;
    // Refocus on the next tick so the focus call lands after layout settles.
    requestAnimationFrame(() => editorRef.current?.focus());
    haptic();
  }, [haptic, layerSV]);

  const commitAndReset = useCallback(() => {
    void commitDraft();
    liftY.value = 0;
    haptic();
  }, [commitDraft, haptic, liftY]);

  const commitAndArchive = useCallback(() => {
    void commitDraft();
    goArchive();
  }, [commitDraft, goArchive]);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onBegin((e) => {
      "worklet";
      if (layerSV.value === Layer.Capture) {
        valid.value = e.x >= EDGE_LEFT && e.y <= H - EDGE_BOTTOM;
      } else {
        valid.value = e.y >= H - ARCHIVE_RETURN_BAND;
      }
      dominantDirection.value = Direction.None;
    })
    .onUpdate((e) => {
      "worklet";
      if (!valid.value) return;
      const ax = Math.abs(e.translationX);
      const ay = Math.abs(e.translationY);
      const dist = Math.max(ax, ay);

      if (layerSV.value === Layer.Capture) {
        if (dist < AFFORDANCE_REVEAL) {
          dominantDirection.value = Direction.None;
          return;
        }
        if (ay > ax) {
          if (e.translationY < 0) {
            dominantDirection.value = Direction.Up;
            liftY.value = Math.max(e.translationY, -H);
          } else {
            dominantDirection.value = Direction.Down;
            progress.value = Math.min(e.translationY / H, 1);
          }
        } else if (e.translationX > 0) {
          dominantDirection.value = Direction.Right;
          settingsX.value = Math.min(e.translationX / W, 1);
        } else {
          dominantDirection.value = Direction.None;
        }
      } else {
        if (e.translationY < 0) {
          progress.value = Math.max(1 + e.translationY / H, 0);
        }
      }
    })
    .onEnd((e) => {
      "worklet";
      dominantDirection.value = Direction.None;

      if (!valid.value) {
        progress.value = withTiming(layerSV.value, SNAP);
        liftY.value = withTiming(0, SNAP);
        settingsX.value = withTiming(0, SNAP);
        return;
      }

      if (layerSV.value === Layer.Capture) {
        const upCommit =
          e.translationY < -COMMIT_DISTANCE || e.velocityY < -COMMIT_VELOCITY;
        const downCommit =
          e.translationY > COMMIT_DISTANCE || e.velocityY > COMMIT_VELOCITY;
        const rightCommit =
          e.translationX > COMMIT_DISTANCE || e.velocityX > COMMIT_VELOCITY;

        const ax = Math.abs(e.translationX);
        const ay = Math.abs(e.translationY);

        if (upCommit && ay >= ax) {
          liftY.value = withTiming(-H, TURN, () => {
            runOnJS(commitAndReset)();
          });
        } else if (downCommit && ay >= ax) {
          progress.value = withTiming(1, TURN, () => {
            runOnJS(commitAndArchive)();
          });
        } else if (rightCommit && ax > ay) {
          settingsX.value = withTiming(1, SETTINGS);
        } else {
          progress.value = withTiming(0, SNAP);
          liftY.value = withTiming(0, SNAP);
          settingsX.value = withTiming(0, SNAP);
        }
      } else {
        const upCommit =
          e.translationY < -COMMIT_DISTANCE || e.velocityY < -COMMIT_VELOCITY;
        if (upCommit) {
          progress.value = withTiming(0, TURN, () => {
            runOnJS(goCapture)();
          });
        } else {
          progress.value = withTiming(1, SNAP);
        }
      }
    });

  const captureStyle = useAnimatedStyle(() => {
    const ty = progress.value * H + liftY.value;
    const lifted = Math.min(Math.abs(ty) / H, 1);
    return {
      transform: [{ translateY: ty }],
      shadowOpacity: 0.45 * lifted,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: ty > 0 ? -8 : 8 },
      shadowColor: "#000",
      elevation: 12 * lifted,
    };
  });

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <View style={styles.root} collapsable={false}>
          <View style={styles.layer} pointerEvents={layer === "archive" ? "auto" : "none"}>
            <ArchiveContent />
          </View>

          <Animated.View
            style={[styles.layer, captureStyle]}
            pointerEvents={layer === "capture" ? "auto" : "none"}
          >
            <CaptureContent
              ref={editorRef}
              draft={draft}
              onChangeDraft={setDraft}
              onAppendDraft={appendDraft}
            />
          </Animated.View>

          {layer === "capture" ? (
            <GestureAffordances dominantDirection={dominantDirection} />
          ) : null}

          <SettingsSheet progress={settingsX} duration={SETTINGS.duration} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
});
