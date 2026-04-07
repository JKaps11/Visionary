import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Single-row config table. In v1 (pre-auth) this holds user settings like
// accent color. When auth lands, this moves onto the Convex Auth users table.

async function getOrCreateConfig(ctx: any) {
  const existing = await ctx.db.query("config").first();
  if (existing) return existing;
  const id = await ctx.db.insert("config", {});
  return await ctx.db.get(id);
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("config").first();
  },
});

export const setAccentColor = mutation({
  args: { accentColor: v.string() },
  handler: async (ctx, { accentColor }) => {
    const config = await getOrCreateConfig(ctx);
    await ctx.db.patch(config._id, { accentColor });
  },
});
