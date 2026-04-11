import { forwardRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Editor, type EditorHandle } from "@/components/editor";
import { MicButton } from "@/components/mic-button";
import { useAccent } from "@/context/accent";
import { Colors, Spacing } from "@/constants/theme";

export interface CaptureContentProps {
  draft: string;
  onChangeDraft: (next: string) => void;
  onAppendDraft: (text: string) => void;
  onOpenSettings: () => void;
}

export const CaptureContent = forwardRef<EditorHandle, CaptureContentProps>(
  function CaptureContent(
    { draft, onChangeDraft, onAppendDraft, onOpenSettings },
    editorRef,
  ) {
    const accent = useAccent();
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.spacer} />
          <Pressable
            onPress={onOpenSettings}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.4 })}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke={accent}
                strokeWidth={1.5}
              />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
        <View style={styles.page}>
          <Editor ref={editorRef} value={draft} onChangeText={onChangeDraft} />
          <MicButton onAppendText={onAppendDraft} />
        </View>
      </SafeAreaView>
    );
  },
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});
