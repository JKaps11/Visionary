import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// All thought operations are scoped to the signed-in user. Anonymous calls
// throw — the mobile app will only mount the editor inside the
// `<Authenticated>` gate so this is the right behavior.

async function requireUserId(ctx: { auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("thoughts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("thoughts") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const thought = await ctx.db.get(id);
    if (!thought || thought.userId !== userId) return null;
    return thought;
  },
});

export const create = mutation({
  args: { content: v.string() },
  handler: async (ctx, { content }) => {
    const userId = await requireUserId(ctx);
    const trimmed = content.trim();
    if (trimmed.length === 0) return null;
    return await ctx.db.insert("thoughts", { userId, content: trimmed });
  },
});
