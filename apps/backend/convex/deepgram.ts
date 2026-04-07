"use node";

import { action } from "./_generated/server";

// Returns a short-lived Deepgram WebSocket auth token so the mobile client
// can open a streaming connection directly to Deepgram. The permanent API
// key lives in Convex env (`DEEPGRAM_API_KEY`) and never touches the device.
//
// STUB in v1. Voice ships later; this exists so the mobile voice code has a
// clear target function to call. Once you set DEEPGRAM_API_KEY in Convex env,
// replace the throw with a call to Deepgram's key-creation endpoint.
export const token = action({
  args: {},
  handler: async () => {
    throw new Error(
      "deepgram.token is not yet implemented. Set DEEPGRAM_API_KEY in Convex env and wire up the Deepgram temporary-key endpoint.",
    );
  },
});
