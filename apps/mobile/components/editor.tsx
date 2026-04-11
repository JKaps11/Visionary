import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { Colors, Fonts } from "@/constants/theme";

export interface EditorProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
}

export interface EditorHandle {
  focus: () => void;
  blur: () => void;
}

interface Selection {
  start: number;
  end: number;
}

const BULLET_RE = /^- (.*)$/;
const NUMBERED_RE = /^(\d+)\. (.*)$/;

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { value, onChangeText, placeholder },
  outerRef,
) {
  const ref = useRef<TextInput>(null);
  useImperativeHandle(outerRef, () => ({
    focus: () => ref.current?.focus(),
    blur: () => ref.current?.blur(),
  }));
  const [selection, setSelection] = useState<Selection | undefined>(undefined);

  const handleChangeText = (next: string) => {
    const isSingleInsert = next.length === value.length + 1;
    if (!isSingleInsert) {
      if (selection) setSelection(undefined);
      onChangeText(next);
      return;
    }

    let insertIdx = 0;
    while (insertIdx < value.length && value[insertIdx] === next[insertIdx]) {
      insertIdx++;
    }
    if (next[insertIdx] !== "\n") {
      if (selection) setSelection(undefined);
      onChangeText(next);
      return;
    }

    const prevNewline = next.lastIndexOf("\n", insertIdx - 1);
    const lineStart = prevNewline + 1;
    const line = next.slice(lineStart, insertIdx);

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      if (bullet[1].length === 0) {
        const cleaned = next.slice(0, lineStart) + next.slice(insertIdx + 1);
        setSelection({ start: lineStart, end: lineStart });
        onChangeText(cleaned);
        return;
      }
      const continued =
        next.slice(0, insertIdx + 1) + "- " + next.slice(insertIdx + 1);
      const cursor = insertIdx + 1 + 2;
      setSelection({ start: cursor, end: cursor });
      onChangeText(continued);
      return;
    }

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
        if (selection) setSelection(undefined);
      }}
      autoFocus
      multiline
      scrollEnabled={false}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      selectionColor={Colors.text}
      keyboardAppearance="dark"
      textAlignVertical="top"
      style={styles.input}
    />
  );
});

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
