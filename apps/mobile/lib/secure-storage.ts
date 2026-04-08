import * as SecureStore from "expo-secure-store";

import type { TokenStorage } from "@convex-dev/auth/react";

// Wraps expo-secure-store as the @convex-dev/auth TokenStorage interface.
// Tokens persist across launches in the OS keystore (Keychain on iOS,
// Keystore on Android).
//
// SecureStore keys must match `[A-Za-z0-9._-]`. The auth provider hands us
// keys derived from the deployment URL which contain dots and hyphens —
// safe — but we replace any other characters defensively.
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

export const secureStorage: TokenStorage = {
  getItem: (key) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(safeKey(key)),
};
