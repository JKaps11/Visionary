import * as SecureStore from "expo-secure-store";

import type { TokenStorage } from "@convex-dev/auth/react";

// SecureStore keys must match `[A-Za-z0-9._-]`.
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

export const secureStorage: TokenStorage = {
  getItem: (key) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(safeKey(key)),
};
