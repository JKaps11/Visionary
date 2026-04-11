import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@visionary/backend/convex/_generated/api";
import type { Id } from "@visionary/backend/convex/_generated/dataModel";

import { Colors, Fonts, Spacing } from "@/constants/theme";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ThoughtDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const thought = useQuery(
    api.thoughts.get,
    id ? { id: id as Id<"thoughts"> } : "skip",
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {thought === undefined ? (
        <View style={styles.center}>
          <Text style={styles.muted}>loading…</Text>
        </View>
      ) : thought === null ? (
        <View style={styles.center}>
          <Text style={styles.muted}>not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.date}>{formatDate(thought._creationTime)}</Text>
          <Text style={styles.body}>{thought.content}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  date: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.lg,
  },
  body: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 28,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
});
