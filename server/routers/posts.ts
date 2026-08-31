import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { accounts, comments, follows, hashtags, likes, mediaAssets, postHashtags, postMedia, postMentions, postShares, posts, savedPosts } from "../../drizzle/schema";
import { MAX_CAPTION_LENGTH, MAX_COMMENT_LENGTH } from "../../shared/velora";
import { createId, getActiveAccountForUser, requireDb } from "../db";
import { enforceRateLimit, extractHashtags, extractMentions, notifySocialEvent, requireActiveAccount, requireOwnedMedia, sanitizePlainText } from "../services/platform";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const postInput = z.object({
  caption: z.string().max(MAX_CAPTION_LENGTH).default(""),
  location: z.string().trim().max(120).optional(),
  visibility: z.enum(["public", "followers"]).default("public"),
  mediaIds: z.array(z.string().min(4).max(36)).min(1).max(10),
});

async function getReadablePost(postId: string, viewerAccountId?: string) {
  const db = await requireDb();
  const row = await db
    .select({ post: posts, account: accounts })
    .from(posts)
    .innerJoin(accounts, eq(posts.authorAccountId, accounts.id))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!row[0]) return undefined;
  const post = row[0].post;
  if (row[0].account.status !== "active") return undefined;
  if (post.visibility === "followers" && viewerAccountId !== post.authorAccountId) {
    if (!viewerAccountId) return undefined;
    const relationship = await db.select().from(follows).where(and(eq(follows.followerAccountId, viewerAccountId), eq(follows.followingAccountId, post.authorAccountId), eq(follows.status, "accepted"))).limit(1);
    if (!relationship[0]) return undefined;
  }
  return row[0];
}

async function hydratePosts(postRows: Array<{ post: typeof posts.$inferSelect; account: typeof accounts.$inferSelect }>, viewerAccountId?: string) {
  const db = await requireDb();
  const ids = postRows.map(item => item.post.id);
  if (!ids.length) return [];
  const mediaRows = await db.select({ postId: postMedia.postId, position: postMedia.position, media: mediaAssets }).from(postMedia).innerJoin(mediaAssets, eq(postMedia.mediaId, mediaAssets.id)).where(inArray(postMedia.postId, ids));
  const commentRows = await db.select({ postId: comments.postId, count: sql<number>`count(*)` }).from(comments).where(and(inArray(comments.postId, ids), isNull(comments.deletedAt))).groupBy(comments.postId);
  const viewerLikes = viewerAccountId ? await db.select({ postId: likes.postId }).from(likes).where(and(eq(likes.accountId, viewerAccountId), inArray(likes.postId, ids))) : [];
  const viewerSaves = viewerAccountId ? await db.select({ postId: savedPosts.postId }).from(savedPosts).where(and(eq(savedPosts.accountId, viewerAccountId), inArray(savedPosts.postId, ids))) : [];

  return postRows.map(({ post, account }) => ({
    ...post,
    author: { id: account.id, username: account.username, displayName: account.displayName },
    media: mediaRows.filter(item => item.postId === post.id).sort((a, b) => a.position - b.position).map(item => item.media),
    commentCount: Number(commentRows.find(item => item.postId === post.id)?.count ?? post.commentCount),
    likedByViewer: viewerLikes.some(item => item.postId === post.id),
    savedByViewer: viewerSaves.some(item => item.postId === post.id),
  }));
}

export const postsRouter = router({
  feed: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(60).default(24), mode: z.enum(["home", "explore", "saved"]).default("home") }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
      if (input.mode === "saved") {
        if (!viewer) return [];
        const saved = await db.select({ post: posts, account: accounts }).from(savedPosts).innerJoin(posts, eq(savedPosts.postId, posts.id)).innerJoin(accounts, eq(posts.authorAccountId, accounts.id)).where(and(eq(savedPosts.accountId, viewer.id), isNull(posts.deletedAt))).orderBy(desc(savedPosts.createdAt)).limit(input.limit);
        return hydratePosts(saved, viewer.id);
      }
      const all = await db.select({ post: posts, account: accounts }).from(posts).innerJoin(accounts, eq(posts.authorAccountId, accounts.id)).where(and(isNull(posts.deletedAt), eq(accounts.status, "active"))).orderBy(desc(posts.createdAt)).limit(60);
      const following = viewer ? await db.select({ followingAccountId: follows.followingAccountId }).from(follows).where(and(eq(follows.followerAccountId, viewer.id), eq(follows.status, "accepted"))) : [];
      const allowedAuthors = following.map(item => item.followingAccountId).concat(viewer ? [viewer.id] : []);
      const visible = all.filter(item => item.post.visibility === "public" || (viewer && allowedAuthors.indexOf(item.post.authorAccountId) !== -1));
      const selected = input.mode === "home" && viewer ? visible.filter(item => allowedAuthors.indexOf(item.post.authorAccountId) !== -1).concat(visible.filter(item => allowedAuthors.indexOf(item.post.authorAccountId) === -1)).slice(0, input.limit) : visible.slice(0, input.limit);
      return hydratePosts(selected, viewer?.id);
    }),

  byId: publicProcedure.input(z.object({ postId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
    const row = await getReadablePost(input.postId, viewer?.id);
    if (!row) return null;
    const [hydrated] = await hydratePosts([row], viewer?.id);
    return hydrated;
  }),

  create: protectedProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_create", 15, 60 * 60 * 1000);
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const caption = sanitizePlainText(input.caption, MAX_CAPTION_LENGTH);
    await requireOwnedMedia(ctx.user.id, input.mediaIds, "post");
    const postId = createId("pst_");
    await db.transaction(async transaction => {
      await transaction.insert(posts).values({
        id: postId,
        authorAccountId: account.id,
        caption,
        location: input.location ? sanitizePlainText(input.location, 120) : null,
        visibility: input.visibility,
      });
      await transaction.insert(postMedia).values(input.mediaIds.map((mediaId, position) => ({ id: createId("pmd_"), postId, mediaId, position })));
    });

    for (const normalizedName of extractHashtags(caption)) {
      const existing = await db.select().from(hashtags).where(eq(hashtags.normalizedName, normalizedName)).limit(1);
      const hashtagId = existing[0]?.id ?? createId("tag_");
      if (!existing[0]) await db.insert(hashtags).values({ id: hashtagId, normalizedName, displayName: normalizedName });
      await db.insert(postHashtags).values({ postId, hashtagId }).onDuplicateKeyUpdate({ set: { postId } });
    }
    const mentionNames = extractMentions(caption);
    if (mentionNames.length) {
      const mentioned = await db.select().from(accounts).where(inArray(accounts.username, mentionNames));
      for (const mentionedAccount of mentioned) {
        await db.insert(postMentions).values({ postId, accountId: mentionedAccount.id }).onDuplicateKeyUpdate({ set: { postId } });
        await notifySocialEvent({ recipientAccountId: mentionedAccount.id, actorAccountId: account.id, type: "mention", resourceType: "post", resourceId: postId, body: `${account.displayName} mentioned you in a post.` });
      }
    }
    const result = await getReadablePost(postId, account.id);
    const [hydrated] = result ? await hydratePosts([result], account.id) : [];
    return hydrated;
  }),

  update: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36), caption: z.string().max(MAX_CAPTION_LENGTH), location: z.string().max(120).optional(), visibility: z.enum(["public", "followers"]).optional() })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const post = await db.select().from(posts).where(and(eq(posts.id, input.postId), eq(posts.authorAccountId, account.id), isNull(posts.deletedAt))).limit(1);
    if (!post[0]) throw new Error("You can only edit your own available posts.");
    await db.update(posts).set({ caption: sanitizePlainText(input.caption, MAX_CAPTION_LENGTH), location: input.location ? sanitizePlainText(input.location, 120) : null, ...(input.visibility ? { visibility: input.visibility } : {}) }).where(eq(posts.id, input.postId));
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(posts).set({ deletedAt: new Date() }).where(and(eq(posts.id, input.postId), eq(posts.authorAccountId, account.id), isNull(posts.deletedAt)));
    return { success: true };
  }),

  toggleLike: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_like", 180, 60 * 60 * 1000);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const existing = await db.select().from(likes).where(and(eq(likes.postId, input.postId), eq(likes.accountId, account.id))).limit(1);
    if (existing[0]) {
      await db.delete(likes).where(and(eq(likes.postId, input.postId), eq(likes.accountId, account.id)));
      await db.update(posts).set({ likeCount: sql`greatest(${posts.likeCount} - 1, 0)` }).where(eq(posts.id, input.postId));
      return { liked: false };
    }
    await db.insert(likes).values({ postId: input.postId, accountId: account.id });
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, input.postId));
    await notifySocialEvent({ recipientAccountId: post.post.authorAccountId, actorAccountId: account.id, type: "like", resourceType: "post", resourceId: input.postId, body: `${account.displayName} liked your post.` });
    return { liked: true };
  }),

  toggleSave: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const existing = await db.select().from(savedPosts).where(and(eq(savedPosts.postId, input.postId), eq(savedPosts.accountId, account.id))).limit(1);
    if (existing[0]) {
      await db.delete(savedPosts).where(and(eq(savedPosts.postId, input.postId), eq(savedPosts.accountId, account.id)));
      await db.update(posts).set({ saveCount: sql`greatest(${posts.saveCount} - 1, 0)` }).where(eq(posts.id, input.postId));
      return { saved: false };
    }
    await db.insert(savedPosts).values({ postId: input.postId, accountId: account.id });
    await db.update(posts).set({ saveCount: sql`${posts.saveCount} + 1` }).where(eq(posts.id, input.postId));
    return { saved: true };
  }),

  share: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36), channel: z.enum(["copy_link", "message", "external"]).default("copy_link") })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_share", 80, 60 * 60 * 1000);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    await db.insert(postShares).values({ id: createId("shr_"), postId: input.postId, accountId: account.id, channel: input.channel });
    await db.update(posts).set({ shareCount: sql`${posts.shareCount} + 1` }).where(eq(posts.id, input.postId));
    return { success: true };
  }),
});

export const commentsRouter = router({
  list: publicProcedure.input(z.object({ postId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : undefined;
    const post = await getReadablePost(input.postId, viewer?.id);
    if (!post) return [];
    const db = await requireDb();
    return db.select({ comment: comments, author: accounts }).from(comments).innerJoin(accounts, eq(comments.authorAccountId, accounts.id)).where(and(eq(comments.postId, input.postId), isNull(comments.deletedAt))).orderBy(desc(comments.createdAt));
  }),

  create: protectedProcedure.input(z.object({ postId: z.string().min(4).max(36), body: z.string().min(1).max(MAX_COMMENT_LENGTH), parentCommentId: z.string().min(4).max(36).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "comment_create", 60, 60 * 60 * 1000);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const id = createId("cmt_");
    await db.insert(comments).values({ id, postId: input.postId, authorAccountId: account.id, parentCommentId: input.parentCommentId ?? null, body: sanitizePlainText(input.body, MAX_COMMENT_LENGTH) });
    await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, input.postId));
    await notifySocialEvent({ recipientAccountId: post.post.authorAccountId, actorAccountId: account.id, type: "comment", resourceType: "post", resourceId: input.postId, body: `${account.displayName} commented on your post.` });
    return { id };
  }),

  remove: protectedProcedure.input(z.object({ commentId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const existing = await db.select({ comment: comments, post: posts }).from(comments).innerJoin(posts, eq(comments.postId, posts.id)).where(and(eq(comments.id, input.commentId), isNull(comments.deletedAt))).limit(1);
    if (!existing[0]) throw new Error("That comment is unavailable.");
    if (existing[0].comment.authorAccountId !== account.id && existing[0].post.authorAccountId !== account.id) throw new Error("You are not allowed to delete this comment.");
    await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, input.commentId));
    await db.update(posts).set({ commentCount: sql`greatest(${posts.commentCount} - 1, 0)` }).where(eq(posts.id, existing[0].comment.postId));
    return { success: true };
  }),
});
