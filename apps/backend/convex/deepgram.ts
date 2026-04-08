"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { action } from "./_generated/server";

// Server-side Deepgram bridge.
//
// The mobile client records a short clip with `expo-audio`, reads it as
// bytes, and calls this action. The action forwards the bytes to Deepgram's
// REST listen endpoint and returns the transcript text. The Deepgram API key
// lives in Convex env (`DEEPGRAM_API_KEY`) and never touches the device.
//
// Why batch (REST) instead of streaming (WebSocket)?
//   `expo-audio` records to a file on disk and does not expose live PCM
//   chunks to JS. Streaming would require a custom native module. Batch
//   transcription on a short voice clip is good enough for v1 — the user
//   taps the mic, says a sentence, taps to stop, and sees text appear.
//   Streaming can replace this in a follow-up without changing the client
//   contract beyond the action signature.

const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true";

export const transcribe = action({
  args: {
    audio: v.bytes(),
    mimeType: v.string(),
  },
  handler: async (ctx, { audio, mimeType }) => {
    // Gate Deepgram credit usage on a valid session — anonymous callers must
    // not be able to invoke this action.
    const userId = await getAuthUserId(ctx as any);
    if (!userId) throw new Error("Not signed in");

    // `process` is provided by the Node runtime that backs `"use node"`
    // actions; the convex tsconfig doesn't ship Node types so we read it
    // through globalThis.
    const apiKey = (globalThis as { process?: { env?: Record<string, string> } })
      .process?.env?.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPGRAM_API_KEY is not set. Run `bunx convex env set DEEPGRAM_API_KEY <key>` in apps/backend.",
      );
    }

    const res = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": mimeType,
      },
      body: audio,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Deepgram ${res.status}: ${body}`);
    }

    const json = (await res.json()) as {
      results?: {
        channels?: { alternatives?: { transcript?: string }[] }[];
      };
    };

    const alt = json.results?.channels?.[0]?.alternatives?.[0];
    if (alt?.transcript === undefined) {
      // Surface malformed responses instead of returning a silent empty
      // string — without this an upstream API change would look like a
      // user holding the mic and saying nothing.
      console.warn(
        `Deepgram response missing transcript (status=${res.status}): ${JSON.stringify(
          json,
        ).slice(0, 500)}`,
      );
      return "";
    }
    return alt.transcript.trim();
  },
});
