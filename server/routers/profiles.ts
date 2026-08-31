import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { accounts, follows, mediaAssets, postMedia, posts, profiles } from "../../drizzle/schema";
import { getActiveAccountForUser, requireDb } from "../db";
import { enforceRateLimit, notifySocialEvent, requireActiveAccount } from "../services/platform";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

async function accountWithProfile(username: string) {
  const db = await requireDb();
  const result = await db.select({ account: accounts, profile: profiles }).from(accounts).leftJoin(profiles, eq(accounts.id, profiles.accountId)).where(eq(accounts.username, username.toLowerCase())).limit(1);
  const target = result[0];
  if (!target) return undefined;
  const mediaIds = [target.profile?.avatarMediaId, target.profile?.coverMediaId].filter((id): id is string => Boolean(id));
  const media = mediaIds.length ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds)) : [];
  const avatar = media.find(item => item.id === target.profile?.avatarMediaId);
  const cover = media.find(item => item.id === target.profile?.coverMediaId);
  return { ...target, profile: target.profile ? { ...target.profile, avatarUrl: avatar?.url ?? null, coverUrl: cover?.url ?? null, avatarMedia: avatar ?? null, coverMedia: cover ?? null } : null };
}

async function accountStatistics(accountId: string) {
  const db = await requireDb();
  const [postsTotal] = await db.select({ value: count() }).from(posts).where(and(eq(posts.authorAccountId, accountId), isNull(posts.deletedAt)));
  const [followersTotal] = await db.select({ value: count() }).from(follows).where(and(eq(follows.followingAccountId, accountId), eq(follows.status, "accepted")));
  const [followingTotal] = await db.select({ value: count() }).from(follows).where(and(eq(follows.followerAccountId, accountId), eq(follows.status, "accepted")));
  return { postCount: Number(postsTotal?.value ?? 0), followerCount: Number(followersTotal?.value ?? 0), followingCount: Number(followingTotal?.value ?? 0) };
}

export const profilesRouter = router({
  byUsername: publicProcedure.input(z.object({ username: z.string().trim().min(3).max(30) })).query(async ({ ctx, input }) => {
    const target = await accountWithProfile(input.username);
    if (!target || target.account.status !== "active") return null;
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
    const relationship = viewer ? await (await requireDb()).select().from(follows).where(and(eq(follows.followerAccountId, viewer.id), eq(follows.followingAccountId, target.account.id))).limit(1) : [];
    const isOwner = viewer?.id === target.account.id;
    const isAllowed = !target.account.isPrivate || isOwner || relationship[0]?.status === "accepted";
    return {
      account: target.account,
      profile: target.profile,
      statistics: await accountStatistics(target.account.id),
      relationship: relationship[0]?.status ?? null,
      isOwner,
      isAllowed,
    };
  }),

  posts: publicProcedure.input(z.object({ username: z.string().trim().min(3).max(30), limit: z.number().int().min(1).max(60).default(30) })).query(async ({ ctx, input }) => {
    const target = await accountWithProfile(input.username);
    if (!target || target.account.status !== "active") return [];
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
    if (target.account.isPrivate && viewer?.id !== target.account.id) {
      const accepted = viewer ? await (await requireDb()).select().from(follows).where(and(eq(follows.followerAccountId, viewer.id), eq(follows.followingAccountId, target.account.id), eq(follows.status, "accepted"))).limit(1) : [];
      if (!accepted[0]) return [];
    }
    const db = await requireDb();
    const postRows = await db.select().from(posts).where(and(eq(posts.authorAccountId, target.account.id), isNull(posts.deletedAt))).orderBy(desc(posts.createdAt)).limit(input.limit);
    const ids = postRows.map(post => post.id);
    const assets = ids.length ? await db.select({ postId: postMedia.postId, position: postMedia.position, media: mediaAssets }).from(postMedia).innerJoin(mediaAssets, eq(postMedia.mediaId, mediaAssets.id)).where(inArray(postMedia.postId, ids)) : [];
    return postRows.map(post => ({ ...post, media: assets.filter(asset => asset.postId === post.id).sort((a, b) => a.position - b.position).map(asset => asset.media) }));
  }),

  toggleFollow: protectedProcedure.input(z.object({ accountId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "follow_toggle", 100, 60 * 60 * 1000);
    const actor = await requireActiveAccount(ctx.user.id);
    if (actor.id === input.accountId) throw new Error("You cannot follow your own account.");
    const db = await requireDb();
    const target = await db.select().from(accounts).where(and(eq(accounts.id, input.accountId), eq(accounts.status, "active"))).limit(1);
    if (!target[0]) throw new Error("This account is not available.");
    const current = await db.select().from(follows).where(and(eq(follows.followerAccountId, actor.id), eq(follows.followingAccountId, input.accountId))).limit(1);
    if (current[0]) {
      await db.delete(follows).where(and(eq(follows.followerAccountId, actor.id), eq(follows.followingAccountId, input.accountId)));
      return { following: false, requested: false };
    }
    const status = target[0].isPrivate ? "requested" : "accepted";
    await db.insert(follows).values({ followerAccountId: actor.id, followingAccountId: input.accountId, status });
    await notifySocialEvent({ recipientAccountId: input.accountId, actorAccountId: actor.id, type: "follow", resourceType: "account", resourceId: actor.id, body: status === "accepted" ? `${actor.displayName} started following you.` : `${actor.displayName} requested to follow you.` });
    return { following: status === "accepted", requested: status === "requested" };
  }),

  followers: publicProcedure.input(z.object({ accountId: z.string().min(4).max(36), limit: z.number().int().min(1).max(100).default(40) })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ account: accounts, status: follows.status, createdAt: follows.createdAt }).from(follows).innerJoin(accounts, eq(follows.followerAccountId, accounts.id)).where(and(eq(follows.followingAccountId, input.accountId), eq(follows.status, "accepted"))).orderBy(desc(follows.createdAt)).limit(input.limit);
    return rows.filter(row => row.account.status === "active");
  }),

  following: publicProcedure.input(z.object({ accountId: z.string().min(4).max(36), limit: z.number().int().min(1).max(100).default(40) })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ account: accounts, status: follows.status, createdAt: follows.createdAt }).from(follows).innerJoin(accounts, eq(follows.followingAccountId, accounts.id)).where(and(eq(follows.followerAccountId, input.accountId), eq(follows.status, "accepted"))).orderBy(desc(follows.createdAt)).limit(input.limit);
    return rows.filter(row => row.account.status === "active");
  }),

  pendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const rows = await db.select({ account: accounts }).from(follows).innerJoin(accounts, eq(follows.followerAccountId, accounts.id)).where(and(eq(follows.followingAccountId, account.id), eq(follows.status, "requested"))).orderBy(desc(follows.createdAt));
    return rows;
  }),

  resolveRequest: protectedProcedure.input(z.object({ accountId: z.string().min(4).max(36), accepted: z.boolean() })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const relationship = await db.select().from(follows).where(and(eq(follows.followingAccountId, account.id), eq(follows.followerAccountId, input.accountId), eq(follows.status, "requested"))).limit(1);
    if (!relationship[0]) throw new Error("That follow request is unavailable.");
    if (input.accepted) await db.update(follows).set({ status: "accepted" }).where(and(eq(follows.followingAccountId, account.id), eq(follows.followerAccountId, input.accountId)));
    else await db.delete(follows).where(and(eq(follows.followingAccountId, account.id), eq(follows.followerAccountId, input.accountId)));
    return { success: true };
  }),
});
