import { useRef, useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { Colors, Fonts } from "@/constants/theme";

// Editor — the blank-page TextInput.
//
// - Auto-focuses on mount so the keyboard is already up when CapturePage
//   mounts on cold start.
// - Controlled value/onChange from the parent so commitDraft() can read the
//   draft at any moment.
// - Markdown list shortcuts: typing `- ` or `1. ` at the start of a line
//   and pressing Enter continues the list. Pressing Enter on an empty list
//   item exits the list.
//
// Cursor handling: we manage `selection` ourselves only when we modify the
// text programmatically (continue list / exit list). Otherwise we leave
// selection undefined and let native handle it.

export interface EditorProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
}

interface Selection {
  start: number;
  end: number;
}

const BULLET_RE = /^- (.*)$/;
const NUMBERED_RE = /^(\d+)\. (.*)$/;

export function Editor({ value, onChangeText, placeholder }: EditorProps) {
  const ref = useRef<TextInput>(null);
  // `selection` is set to non-undefined only when we programmatically modify
  // the text and need to force the cursor somewhere specific. On the very
  // next user keystroke we clear it so native can take over again.
  const [selection, setSelection] = useState<Selection | undefined>(undefined);

  const handleChangeText = (next: string) => {
    // Quick exit: not a single-character insertion or not a newline.
    const isSingleInsert = next.length === value.length + 1;
    if (!isSingleInsert) {
      if (selection) setSelection(undefined);
      onChangeText(next);
      return;
    }

    // Find where the new character was inserted.
    let insertIdx = 0;
    while (insertIdx < value.length && value[insertIdx] === next[insertIdx]) {
      insertIdx++;
    }
    if (next[insertIdx] !== "\n") {
      if (selection) setSelection(undefined);
      onChangeText(next);
      return;
    }

    // Find the start of the line that ended with this newline.
    const prevNewline = next.lastIndexOf("\n", insertIdx - 1);
    const lineStart = prevNewline + 1;
    const line = next.slice(lineStart, insertIdx);

    // Bullet continuation
    const bullet = line.match(BULLET_RE);
    if (bullet) {
      if (bullet[1].length === 0) {
        // Empty bullet — exit the list: drop the "- " line and the newline.
        const cleaned = next.slice(0, lineStart) + next.slice(insertIdx + 1);
        setSelection({ start: lineStart, end: lineStart });
        onChangeText(cleaned);
        return;
      }
      // Continue the bullet: insert "- " after the newline.
      const continued =
        next.slice(0, insertIdx + 1) + "- " + next.slice(insertIdx + 1);
      const cursor = insertIdx + 1 + 2; // after "\n- "
      setSelection({ start: cursor, end: cursor });
      onChangeText(continued);
      return;
    }

    // Numbered continuation
    const numbered = line.match(NUMBERED_RE);
    if (numbered) {
      const [, numStr, content] = numbered;
      if (content.length === 0) {
        const cleaned = next.slice(0, lineStart) + next.slice(insertIdx + 1);
        setSelection({ start: lineStart, end: lineStart });
        onChangeText(cleaned);
        return;
      }
      const nextNum = parseInt(numStr, 10) + 1;
      const prefix = `${nextNum}. `;
      const continued =
        next.slice(0, insertIdx + 1) + prefix + next.slice(insertIdx + 1);
      const cursor = insertIdx + 1 + prefix.length;
      setSelection({ start: cursor, end: cursor });
      onChangeText(continued);
      return;
    }

    if (selection) setSelection(undefined);
    onChangeText(next);
  };

  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={handleChangeText}
      selection={selection}
      onSelectionChange={() => {
        // User moved the cursor themselves — release our grip.
        if (selection) setSelection(undefined);
      }}
      autoFocus
      multiline
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      selectionColor={Colors.text}
      keyboardAppearance="dark"
      textAlignVertical="top"
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 28,
    padding: 0,
    margin: 0,
  },
});
