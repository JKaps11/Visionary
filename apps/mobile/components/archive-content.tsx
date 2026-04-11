import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlatList, TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@visionary/backend/convex/_generated/api";
import type { Doc } from "@visionary/backend/convex/_generated/dataModel";

import { DayLabel } from "@/components/day-label";
import { ThoughtCard } from "@/components/thought-card";
import { Colors, Fonts, Spacing } from "@/constants/theme";

type Thought = Doc<"thoughts">;

type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "thought"; key: string; thought: Thought };

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date, today: Date, yesterday: Date): string {
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function groupByDay(thoughts: Thought[], query: string): Row[] {
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? thoughts.filter((thought) => thought.content.toLowerCase().includes(normalized))
    : thoughts;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const rows: Row[] = [];
  let currentDayKey: string | null = null;
  for (const thought of filtered) {
    const date = new Date(thought._creationTime);
    const key = dayKey(date);
    if (key !== currentDayKey) {
      rows.push({
        kind: "day",
        key: `day-${key}`,
        label: formatDayLabel(date, today, yesterday),
      });
      currentDayKey = key;
    }
    rows.push({ kind: "thought", key: thought._id, thought });
  }
  return rows;
}

export function ArchiveContent() {
  const router = useRouter();
  const thoughts = useQuery(api.thoughts.list);
  const [search, setSearch] = useState("");

  const rows = useMemo<Row[]>(
    () => (thoughts ? groupByDay(thoughts, search) : []),
    [thoughts, search],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TextInput
          placeholder="search"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          selectionColor={Colors.text}
          keyboardAppearance="dark"
        />
      </View>

      {thoughts === undefined ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {search ? "no matches" : "nothing yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) =>
            item.kind === "day" ? (
              <DayLabel label={item.label} />
            ) : (
              <ThoughtCard
                content={item.thought.content}
                onPress={() => router.push(`/thought/${item.thought._id}`)}
              />
            )
          }
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  search: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  list: {
    paddingBottom: 80,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
});
