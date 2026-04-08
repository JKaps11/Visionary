import Constants from "expo-constants";
import { useFonts, IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";

import { AccentProvider } from "@/context/accent";
import { secureStorage } from "@/lib/secure-storage";
import { Colors } from "@/constants/theme";

// CONVEX_URL is read from app.json `extra.convexUrl` or from
// EXPO_PUBLIC_CONVEX_URL at build time.
const CONVEX_URL =
  (Constants.expoConfig?.extra?.convexUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  "";

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ IBMPlexMono_400Regular });

  useEffect(() => {
    if (!CONVEX_URL) {
      console.warn(
        "Convex URL is not set. Run `bunx convex dev` in apps/backend and " +
          "set EXPO_PUBLIC_CONVEX_URL before starting the app.",
      );
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <AccentProvider>
        <GestureHandlerRootView style={styles.root}>
          <AuthGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: "fade",
            }}
          />
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </AccentProvider>
    </ConvexAuthProvider>
  );
}

// Side-effect component: redirects to /sign-in when unauthenticated and back
// to / once a session lands. Renders nothing.
function AuthGate() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const segments = useSegments();
  const onSignIn = segments[0] === "sign-in";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !onSignIn) {
      router.replace("/sign-in");
    } else if (isAuthenticated && onSignIn) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, onSignIn, router]);

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
