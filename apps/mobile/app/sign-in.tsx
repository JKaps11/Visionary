import { useAuthActions } from "@convex-dev/auth/react";
import * as Haptics from "expo-haptics";
import { openAuthSessionAsync } from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccent } from "@/context/accent";
import { Colors, Fonts } from "@/constants/theme";

export default function SignInScreen() {
  const accent = useAccent();
  const { signIn } = useAuthActions();
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { redirect } = await signIn("google", {
        redirectTo: "visionary://",
      });
      if (redirect) {
        const result = await openAuthSessionAsync(
          redirect.toString(),
          "visionary://",
        );
        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const code = url.searchParams.get("code");
          if (code) {
            await signIn("google", { code });
          }
        }
      }
    } catch (err) {
      console.error("sign-in failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: Colors.text }]}>visionary</Text>
        <Pressable
          onPress={handleSignIn}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            { borderColor: accent, opacity: pressed || busy ? 0.5 : 1 },
          ]}
          hitSlop={12}
        >
          <Text style={[styles.buttonText, { color: accent }]}>
            {busy ? "..." : "sign in with google"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 64,
    textTransform: "lowercase",
  },
  button: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    letterSpacing: 1,
  },
});
