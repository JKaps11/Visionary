import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all thoughts, newest first. Live-reactive — mobile useQuery gets
// updates the instant a mutation lands.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("thoughts").order("desc").collect();
  },
});

// Single thought by id. Used by ThoughtDetail.
export const get = query({
  args: { id: v.id("thoughts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Create a thought. Called from commitDraft() on the client when a capture
// session ends (swipe up, swipe down to archive, or app background).
// Empty-string drafts are filtered on the client before the mutation fires.
export const create = mutation({
  args: { content: v.string() },
  handler: async (ctx, { content }) => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return null;
    return await ctx.db.insert("thoughts", { content: trimmed });
  },
});
