import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// v1 schema — two tables, no AI, no audio, no links.
//
// Note: auth is intentionally NOT wired up in this pass. When @convex-dev/auth
// is added later, the `users` table will be replaced with the auth users table
// extended with `accentColor`. For v1 development we use a single anonymous
// "config" row to hold the accent color setting.
export default defineSchema({
  // Singleton row holding the user's settings. One row, always.
  config: defineTable({
    accentColor: v.optional(v.string()),
  }),

  // No explicit index needed — Convex orders by _creationTime by default.
  thoughts: defineTable({
    content: v.string(),
  }),
});
