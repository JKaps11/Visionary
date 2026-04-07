import { useMutation } from "convex/react";
import { Link } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@visionary/backend/convex/_generated/api";

import { Editor } from "@/components/editor";
import { MicButton } from "@/components/mic-button";
import { Colors, Fonts, Spacing } from "@/constants/theme";

// CapturePage — the front door. Every app open lands here.
//
// The draft lives in local React state. A single `commitDraft()` function
// runs the thoughts.create mutation if the draft is non-empty and then
// resets state. In this scaffolding pass, commitDraft is wired to:
//   - AppState background (phone lock, home, call interrupts)
//   - Tapping the temporary "Archive →" navigation link
//
// When the gesture system lands, the same commitDraft will fire from
// swipe-up and swipe-down-to-archive.

export default function CapturePage() {
  const [draft, setDraft] = useState("");
  // Always read the freshest draft inside effects/listeners.
  const draftRef = useRef(draft);
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
      // If the mutation fails, restore the draft so the user doesn't lose it.
      // Convex will retry automatically for network errors, so this branch
      // only really fires for validation failures.
      console.error("Failed to commit draft:", err);
      setDraft(current);
      draftRef.current = current;
    }
  }, [createThought]);

  // Commit on background. This is the "life happened" safety net — phone
  // lock, home button, incoming call all fire AppState "background".
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        void commitDraft();
      }
    });
    return () => sub.remove();
  }, [commitDraft]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.page}>
        {/* Temporary archive link — replaced by swipe-down gesture later. */}
        <Link href="/archive" asChild>
          <Pressable
            onPress={() => void commitDraft()}
            style={styles.tempNav}
            hitSlop={8}
          >
            <Text style={styles.tempNavText}>archive →</Text>
          </Pressable>
        </Link>

        <Editor value={draft} onChangeText={setDraft} />

        <MicButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  tempNav: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.lg,
    zIndex: 1,
  },
  tempNavText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
