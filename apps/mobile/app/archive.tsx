import { useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline } from "react-native-svg";

import { api } from "@visionary/backend/convex/_generated/api";
import type { Doc } from "@visionary/backend/convex/_generated/dataModel";

import { DayLabel } from "@/components/day-label";
import { ThoughtCard } from "@/components/thought-card";
import { Colors, DefaultAccent, Fonts, Spacing } from "@/constants/theme";

// ArchivePage — reached by swipe-down-from-capture (later) or, for now, the
// temporary "archive →" link on the capture page.
//
// Uses a live useQuery over thoughts.list — the list updates the moment a
// new thought lands in Convex, no refetch.

type Thought = Doc<"thoughts">;

// Flat list items: either a day header or a thought row.
type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "thought"; key: string; thought: Thought };

function formatDayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupByDay(thoughts: Thought[], query: string): Row[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? thoughts.filter((t) => t.content.toLowerCase().includes(q))
    : thoughts;

  const rows: Row[] = [];
  let currentDayKey: string | null = null;
  for (const thought of filtered) {
    const date = new Date(thought._creationTime);
    const key = dayKey(date);
    if (key !== currentDayKey) {
      rows.push({ kind: "day", key: `day-${key}`, label: formatDayLabel(date) });
      currentDayKey = key;
    }
    rows.push({ kind: "thought", key: thought._id, thought });
  }
  return rows;
}

export default function ArchivePage() {
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
        />
      )}

      {/* Static bottom chevron indicator: swipe-up-to-return. */}
      {/* Temporary tap target in lieu of the gesture. */}
      <Link href="/" asChild>
        <Pressable style={styles.returnIndicator} hitSlop={12}>
          <Svg width={40} height={24} viewBox="0 0 40 24">
            <Polyline
              points="4,16 20,6 36,16"
              fill="none"
              stroke={DefaultAccent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points="4,21 20,11 36,21"
              fill="none"
              stroke={DefaultAccent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />
          </Svg>
        </Pressable>
      </Link>
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
  returnIndicator: {
    position: "absolute",
    bottom: Spacing.lg,
    alignSelf: "center",
    padding: Spacing.sm,
  },
});
