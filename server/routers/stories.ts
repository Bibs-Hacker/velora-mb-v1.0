import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { accounts, follows, mediaAssets, stories, storyViews } from "../../drizzle/schema";
import { VELORA_BRAND } from "../../shared/velora";
import { createId, getActiveAccountForUser, requireDb } from "../db";
import { enforceRateLimit, requireActiveAccount, requireOwnedMedia, sanitizePlainText } from "../services/platform";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

async function canAccessStory(storyId: string, viewerAccountId?: string) {
  const db = await requireDb();
  const row = await db.select({ story: stories, author: accounts }).from(stories).innerJoin(accounts, eq(stories.authorAccountId, accounts.id)).where(and(eq(stories.id, storyId), gt(stories.expiresAt, new Date()), isNull(stories.deletedAt), eq(accounts.status, "active"))).limit(1);
  if (!row[0]) return undefined;
  if (!row[0].author.isPrivate || viewerAccountId === row[0].author.id) return row[0];
  if (!viewerAccountId) return undefined;
  const relation = await db.select().from(follows).where(and(eq(follows.followerAccountId, viewerAccountId), eq(follows.followingAccountId, row[0].author.id), eq(follows.status, "accepted"))).limit(1);
  return relation[0] ? row[0] : undefined;
}

export const storiesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
    const rows = await db.select({ story: stories, author: accounts, media: mediaAssets }).from(stories).innerJoin(accounts, eq(stories.authorAccountId, accounts.id)).innerJoin(mediaAssets, eq(stories.mediaId, mediaAssets.id)).where(and(gt(stories.expiresAt, new Date()), isNull(stories.deletedAt), eq(accounts.status, "active"))).orderBy(desc(stories.createdAt)).limit(80);
    const followingRows = viewer ? await db.select({ id: follows.followingAccountId }).from(follows).where(and(eq(follows.followerAccountId, viewer.id), eq(follows.status, "accepted"))) : [];
    const allowed = followingRows.map(row => row.id).concat(viewer ? [viewer.id] : []);
    const visible = rows.filter(row => !row.author.isPrivate || allowed.indexOf(row.author.id) !== -1);
    const storyIds = visible.map(row => row.story.id);
    const viewed = viewer && storyIds.length ? await db.select({ storyId: storyViews.storyId }).from(storyViews).where(and(eq(storyViews.viewerAccountId, viewer.id), inArray(storyViews.storyId, storyIds))) : [];
    return visible.map(row => ({ ...row.story, author: row.author, media: row.media, viewedByViewer: viewed.some(item => item.storyId === row.story.id) }));
  }),

  create: protectedProcedure.input(z.object({ mediaId: z.string().min(4).max(36), caption: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "story_create", 30, 24 * 60 * 60 * 1000);
    const account = await requireActiveAccount(ctx.user.id);
    await requireOwnedMedia(ctx.user.id, [input.mediaId], "story");
    const db = await requireDb();
    const id = createId("stry_");
    await db.insert(stories).values({ id, authorAccountId: account.id, mediaId: input.mediaId, caption: input.caption ? sanitizePlainText(input.caption, 500) : null, expiresAt: new Date(Date.now() + VELORA_BRAND.storyLifetimeHours * 60 * 60 * 1000) });
    return { id, expiresAt: new Date(Date.now() + VELORA_BRAND.storyLifetimeHours * 60 * 60 * 1000) };
  }),

  markViewed: protectedProcedure.input(z.object({ storyId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const viewer = await requireActiveAccount(ctx.user.id);
    const story = await canAccessStory(input.storyId, viewer.id);
    if (!story) throw new Error("This story is no longer available.");
    const db = await requireDb();
    await db.insert(storyViews).values({ storyId: input.storyId, viewerAccountId: viewer.id }).onDuplicateKeyUpdate({ set: { viewedAt: new Date() } });
    return { success: true };
  }),

  viewers: protectedProcedure.input(z.object({ storyId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const owned = await db.select().from(stories).where(and(eq(stories.id, input.storyId), eq(stories.authorAccountId, account.id))).limit(1);
    if (!owned[0]) throw new Error("You can only view analytics for your own story.");
    return db.select({ account: accounts, viewedAt: storyViews.viewedAt }).from(storyViews).innerJoin(accounts, eq(storyViews.viewerAccountId, accounts.id)).where(eq(storyViews.storyId, input.storyId)).orderBy(desc(storyViews.viewedAt));
  }),

  remove: protectedProcedure.input(z.object({ storyId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(stories).set({ deletedAt: new Date() }).where(and(eq(stories.id, input.storyId), eq(stories.authorAccountId, account.id), isNull(stories.deletedAt)));
    return { success: true };
  }),
});
