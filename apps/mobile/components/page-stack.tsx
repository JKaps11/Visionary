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
import { GestureAffordances } from "@/components/gesture-affordances";
import { SettingsSheet } from "@/components/settings-sheet";
import { Colors } from "@/constants/theme";

// PageStack — the gesture-driven container for the page-turn metaphor.
//
// Two layers stacked, capture in front. A single Reanimated `progress` shared
// value (0 = capture frontmost, 1 = archive fully revealed) drives the
// capture layer's translateY. Swipe down on capture animates progress 0→1.
// Swipe up from the bottom of archive animates 1→0.
//
// Swipe up on capture is the "save and give me a new page" gesture: capture
// lifts off the top, commitDraft fires, then snaps back to 0 with a fresh
// blank draft. Visually a quick page-turn.
//
// Swipe right on capture slides the SettingsSheet in from the right.
//
// All animations live on the UI thread. The JS thread is only touched at
// commit boundaries via runOnJS.

const { height: H, width: W } = Dimensions.get("window");

// Commit thresholds — drag distance OR velocity.
const COMMIT_DISTANCE = 80;
const COMMIT_VELOCITY = 800;
// Reveal threshold for the affordance overlay.
const AFFORDANCE_REVEAL = 8;
// Edge carve-outs (Android back, iOS home indicator).
const EDGE_LEFT = 20;
const EDGE_BOTTOM = 20;
// Archive return must originate within this band of the bottom.
const ARCHIVE_RETURN_BAND = 120;

// Paper easing — slight resistance, smooth glide, gentle settle.
const PAPER = Easing.bezier(0.32, 0.72, 0.24, 1);
const TURN_DURATION = 320;
const SNAP_DURATION = 200;
const SETTINGS_DURATION = 250;

type Layer = "capture" | "archive";

export function PageStack() {
  const [draft, setDraft] = useState("");
  const [layer, setLayer] = useState<Layer>("capture");
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

  // Voice transcripts append into the same draft state the keyboard writes
  // to. Add a separator only when the existing draft doesn't already end in
  // whitespace.
  const appendDraft = useCallback((text: string) => {
    setDraft((prev) => {
      if (prev.length === 0) return text;
      const sep = /\s$/.test(prev) ? "" : " ";
      return prev + sep + text;
    });
  }, []);

  // Commit on background — phone lock, home, call interrupts.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        void commitDraft();
      }
    });
    return () => sub.remove();
  }, [commitDraft]);

  // ---- Reanimated state ----
  // 0 = capture front, 1 = archive front. Drives capture's translateY.
  const progress = useSharedValue(0);
  // Tracks the swipe-up "save + new" lift. -H = lifted, 0 = at rest.
  const liftY = useSharedValue(0);
  // Settings sheet horizontal progress. 0 = hidden, 1 = fully in.
  const settingsX = useSharedValue(0);
  // Active layer mirror for worklet reads. 0 = capture, 1 = archive.
  const layerSV = useSharedValue(0);
  // Mirror of which axis the user is currently leaning into. 0 none, 1 up,
  // 2 down, 3 right. Read by GestureAffordances.
  const dominantDirection = useSharedValue(0);
  // Whether the current pan is valid (passed edge carve-out check).
  const valid = useSharedValue(true);

  // ---- JS-side bridges from gestures ----
  const haptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const goArchive = useCallback(() => {
    setLayer("archive");
    layerSV.value = 1;
    editorRef.current?.blur();
    haptic();
  }, [haptic, layerSV]);

  const goCapture = useCallback(() => {
    setLayer("capture");
    layerSV.value = 0;
    // Refocus on the next tick so the focus call lands after layout settles.
    requestAnimationFrame(() => editorRef.current?.focus());
    haptic();
  }, [haptic, layerSV]);

  const commitAndReset = useCallback(() => {
    void commitDraft();
    // Snap the lifted page back instantly with the fresh empty draft.
    liftY.value = 0;
    haptic();
  }, [commitDraft, haptic, liftY]);

  const commitAndArchive = useCallback(() => {
    void commitDraft();
    goArchive();
  }, [commitDraft, goArchive]);

  // ---- Pan recognizer ----
  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onBegin((e) => {
      "worklet";
      if (layerSV.value === 0) {
        valid.value = e.x >= EDGE_LEFT && e.y <= H - EDGE_BOTTOM;
      } else {
        // Archive return — must originate near the bottom.
        valid.value = e.y >= H - ARCHIVE_RETURN_BAND;
      }
      dominantDirection.value = 0;
    })
    .onUpdate((e) => {
      "worklet";
      if (!valid.value) return;
      const ax = Math.abs(e.translationX);
      const ay = Math.abs(e.translationY);
      const dist = Math.max(ax, ay);

      if (layerSV.value === 0) {
        // Capture layer — three directions allowed.
        if (dist < AFFORDANCE_REVEAL) {
          dominantDirection.value = 0;
          return;
        }
        if (ay > ax) {
          if (e.translationY < 0) {
            dominantDirection.value = 1; // up
            liftY.value = Math.max(e.translationY, -H);
          } else {
            dominantDirection.value = 2; // down
            progress.value = Math.min(e.translationY / H, 1);
          }
        } else if (e.translationX > 0) {
          dominantDirection.value = 3; // right
          settingsX.value = Math.min(e.translationX / W, 1);
        } else {
          dominantDirection.value = 0;
        }
      } else {
        // Archive layer — only return-up.
        if (e.translationY < 0) {
          progress.value = Math.max(1 + e.translationY / H, 0);
        }
      }
    })
    .onEnd((e) => {
      "worklet";
      dominantDirection.value = 0;

      if (!valid.value) {
        progress.value = withTiming(layerSV.value, {
          duration: SNAP_DURATION,
          easing: PAPER,
        });
        liftY.value = withTiming(0, { duration: SNAP_DURATION, easing: PAPER });
        settingsX.value = withTiming(0, {
          duration: SNAP_DURATION,
          easing: PAPER,
        });
        return;
      }

      if (layerSV.value === 0) {
        const upCommit =
          e.translationY < -COMMIT_DISTANCE || e.velocityY < -COMMIT_VELOCITY;
        const downCommit =
          e.translationY > COMMIT_DISTANCE || e.velocityY > COMMIT_VELOCITY;
        const rightCommit =
          e.translationX > COMMIT_DISTANCE || e.velocityX > COMMIT_VELOCITY;

        const ax = Math.abs(e.translationX);
        const ay = Math.abs(e.translationY);

        if (upCommit && ay >= ax) {
          liftY.value = withTiming(
            -H,
            { duration: TURN_DURATION, easing: PAPER },
            () => {
              runOnJS(commitAndReset)();
            },
          );
        } else if (downCommit && ay >= ax) {
          progress.value = withTiming(
            1,
            { duration: TURN_DURATION, easing: PAPER },
            () => {
              runOnJS(commitAndArchive)();
            },
          );
        } else if (rightCommit && ax > ay) {
          settingsX.value = withTiming(1, {
            duration: SETTINGS_DURATION,
            easing: PAPER,
          });
        } else {
          progress.value = withTiming(0, {
            duration: SNAP_DURATION,
            easing: PAPER,
          });
          liftY.value = withTiming(0, {
            duration: SNAP_DURATION,
            easing: PAPER,
          });
          settingsX.value = withTiming(0, {
            duration: SNAP_DURATION,
            easing: PAPER,
          });
        }
      } else {
        // Archive layer.
        const upCommit =
          e.translationY < -COMMIT_DISTANCE || e.velocityY < -COMMIT_VELOCITY;
        if (upCommit) {
          progress.value = withTiming(
            0,
            { duration: TURN_DURATION, easing: PAPER },
            () => {
              runOnJS(goCapture)();
            },
          );
        } else {
          progress.value = withTiming(1, {
            duration: SNAP_DURATION,
            easing: PAPER,
          });
        }
      }
    });

  // Capture layer animated style — translateY blends progress (0..H) with
  // liftY (-H..0). Shadow grows as the page leaves its resting position.
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
          {/* Archive layer (behind) */}
          <View style={styles.layer} pointerEvents={layer === "archive" ? "auto" : "none"}>
            <ArchiveContent />
          </View>

          {/* Capture layer (front) */}
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

          {/* Affordance overlay — only meaningful while on capture. */}
          {layer === "capture" ? (
            <GestureAffordances dominantDirection={dominantDirection} />
          ) : null}

          {/* Settings sheet — slides in from right on swipe-right. */}
          <SettingsSheet progress={settingsX} duration={SETTINGS_DURATION} />
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
