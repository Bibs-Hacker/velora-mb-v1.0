import { and, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import { accounts, hashtags, posts, recentSearches } from "../../drizzle/schema";
import { createId, requireDb } from "../db";
import { sanitizePlainText } from "../services/platform";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const searchInput = z.object({ query: z.string().trim().min(1).max(120), kind: z.enum(["user", "post", "hashtag", "all"]).default("all") });

export const discoveryRouter = router({
  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const db = await requireDb();
    const value = sanitizePlainText(input.query, 120).toLowerCase();
    const pattern = `%${value.replace(/[%_]/g, "\\$&")}%`;
    const users = input.kind === "post" || input.kind === "hashtag" ? [] : await db.select().from(accounts).where(and(eq(accounts.status, "active"), or(like(accounts.username, pattern), like(accounts.displayName, pattern)))).limit(12);
    const tags = input.kind === "user" || input.kind === "post" ? [] : await db.select().from(hashtags).where(like(hashtags.normalizedName, pattern)).limit(12);
    const matchingPosts = input.kind === "user" || input.kind === "hashtag" ? [] : await db.select({ post: posts, author: accounts }).from(posts).innerJoin(accounts, eq(posts.authorAccountId, accounts.id)).where(and(eq(posts.visibility, "public"), isNull(posts.deletedAt), eq(accounts.status, "active"), like(posts.caption, pattern))).orderBy(desc(posts.createdAt)).limit(18);
    return { users, hashtags: tags, posts: matchingPosts };
  }),

  recordRecent: protectedProcedure.input(searchInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120).toLowerCase();
    const existing = await db.select().from(recentSearches).where(and(eq(recentSearches.userId, ctx.user.id), eq(recentSearches.query, query), eq(recentSearches.kind, input.kind))).limit(1);
    if (existing[0]) await db.update(recentSearches).set({ createdAt: new Date() }).where(eq(recentSearches.id, existing[0].id));
    else await db.insert(recentSearches).values({ id: createId("srch_"), userId: ctx.user.id, query, kind: input.kind });
    return { success: true };
  }),

  recent: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(recentSearches).where(eq(recentSearches.userId, ctx.user.id)).orderBy(desc(recentSearches.createdAt)).limit(12);
  }),

  clearRecent: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.delete(recentSearches).where(eq(recentSearches.userId, ctx.user.id));
    return { success: true };
  }),
});
