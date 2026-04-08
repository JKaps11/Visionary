import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Editor, type EditorHandle } from "@/components/editor";
import { MicButton } from "@/components/mic-button";
import { Colors, Spacing } from "@/constants/theme";

export interface CaptureContentProps {
  draft: string;
  onChangeDraft: (next: string) => void;
  onAppendDraft: (text: string) => void;
}

export const CaptureContent = forwardRef<EditorHandle, CaptureContentProps>(
  function CaptureContent(
    { draft, onChangeDraft, onAppendDraft },
    editorRef,
  ) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
  page: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
});
