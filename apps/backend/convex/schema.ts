import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// v1 schema. authTables ships the user, account, session, etc. tables that
// @convex-dev/auth requires.
//
// `config` and `thoughts` are scoped per user via a `userId` ref so a user
// only ever sees their own thoughts and settings.
export default defineSchema({
  ...authTables,

  config: defineTable({
    userId: v.id("users"),
    accentColor: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  thoughts: defineTable({
    userId: v.id("users"),
    content: v.string(),
  }).index("by_user", ["userId"]),
});
