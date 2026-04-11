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
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </AccentProvider>
    </ConvexAuthProvider>
  );
}

// Mounting the route Stack unconditionally would let the protected index route
// (PageStack's AppState commit listener) fire createThought() before auth resolves.
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

  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "fade",
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
