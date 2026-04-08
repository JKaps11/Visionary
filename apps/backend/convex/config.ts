import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Per-user singleton config row. Holds accent color for now; future settings
// land here.

// Mirror of AccentPalette in apps/mobile/constants/theme.ts. Keep in sync.
// Validated at the API boundary so the database can never hold a value
// outside the supported set.
const AccentColor = v.union(
  v.literal("#B39CD0"),
  v.literal("#FFC1CC"),
  v.literal("#A8DADC"),
);

async function requireUserId(ctx: { auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx as any);
    if (!userId) return null;
    return await ctx.db
      .query("config")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const setAccentColor = mutation({
  args: { accentColor: AccentColor },
  handler: async (ctx, { accentColor }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("config")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { accentColor });
    } else {
      await ctx.db.insert("config", { userId, accentColor });
    }
  },
});
