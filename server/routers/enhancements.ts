import { and, asc, count, desc, eq, gte, inArray, isNull, like, lt, sql } from "drizzle-orm";
import { z } from "zod";
import {
  accounts,
  adminVerificationReviews,
  analyticsEvents,
  conversationMembers,
  feedbackSubmissions,
  mediaAssets,
  messages,
  storyArchives,
  userSafetyRelations,
  users,
  profiles,
} from "../../drizzle/schema";
import { createId, getActiveAccountForUser, requireDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { enforceRateLimit, requireActiveAccount, sanitizePlainText } from "../services/platform";

const feedbackType = z.enum(["rating", "feedback", "bug"]);
const analyticsType = z.enum(["registration", "session_active", "post_created", "message_sent", "story_viewed"]);
const relationType = z.enum(["blocked", "muted"]);

export const archivesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    return db.select({ archive: storyArchives, media: mediaAssets }).from(storyArchives).innerJoin(mediaAssets, eq(storyArchives.mediaId, mediaAssets.id)).where(eq(storyArchives.ownerAccountId, account.id)).orderBy(desc(storyArchives.archivedAt));
  }),
  delete: protectedProcedure.input(z.object({ archiveId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.delete(storyArchives).where(and(eq(storyArchives.id, input.archiveId), eq(storyArchives.ownerAccountId, account.id)));
    return { success: true };
  }),
});

export const analyticsRouter = router({
  track: protectedProcedure.input(z.object({ eventType: analyticsType, gender: z.enum(["male", "female", "non_binary", "undisclosed"]).default("undisclosed") })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "analytics_track", 120, 60 * 60 * 1000);
    const account = await getActiveAccountForUser(ctx.user.id);
    const db = await requireDb();
    await db.insert(analyticsEvents).values({ id: createId("evt_"), eventType: input.eventType, userId: ctx.user.id, accountId: account?.id ?? null, gender: input.gender });
    return { success: true };
  }),
  dashboard: adminProcedure.input(z.object({ rangeDays: z.number().int().min(7).max(365).default(30), granularity: z.enum(["day", "week", "month"]).default("day") })).query(async ({ input }) => {
    const db = await requireDb();
    const start = new Date(Date.now() - input.rangeDays * 24 * 60 * 60 * 1000);
    const dateBucket = input.granularity === "month" ? sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m')` : input.granularity === "week" ? sql<string>`YEARWEEK(${users.createdAt}, 1)` : sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m-%d')`;
    const eventBucket = input.granularity === "month" ? sql<string>`DATE_FORMAT(${analyticsEvents.createdAt}, '%Y-%m')` : input.granularity === "week" ? sql<string>`YEARWEEK(${analyticsEvents.createdAt}, 1)` : sql<string>`DATE_FORMAT(${analyticsEvents.createdAt}, '%Y-%m-%d')`;
    const registrations = await db.select({ day: dateBucket, value: count() }).from(users).where(gte(users.createdAt, start)).groupBy(dateBucket).orderBy(asc(dateBucket));
    const activeUsers = await db.select({ day: eventBucket, value: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})` }).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt, start), eq(analyticsEvents.eventType, "session_active"))).groupBy(eventBucket).orderBy(asc(eventBucket));
    const genderRows = await db.select({ gender: analyticsEvents.gender, value: count() }).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt, start), eq(analyticsEvents.eventType, "registration"))).groupBy(analyticsEvents.gender);
    const gender = genderRows.filter(row => Number(row.value) >= 5).map(row => ({ gender: row.gender, value: Number(row.value) }));
    const active = await db.select({ userId: analyticsEvents.userId, value: count() }).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt, start), eq(analyticsEvents.eventType, "session_active"))).groupBy(analyticsEvents.userId).orderBy(desc(count())).limit(10);
    const activeIds = active.map(row => row.userId).filter((id): id is number => Boolean(id));
    const activePeople = activeIds.length ? await db.select({ user: users }).from(users).where(inArray(users.id, activeIds)) : [];
    const activeById = new Map(activePeople.map(row => [row.user.id, row.user]));
    return {
      rangeDays: input.rangeDays,
      registrations: registrations.map(row => ({ day: row.day, value: Number(row.value) })),
      activeUsers: activeUsers.map(row => ({ day: row.day, value: Number(row.value) })),
      gender,
      genderSuppressed: genderRows.length !== gender.length,
      mostActive: active.map(row => ({ user: row.userId ? activeById.get(row.userId) ? { id: row.userId, name: activeById.get(row.userId)?.name, email: activeById.get(row.userId)?.email } : null : null, value: Number(row.value) })).filter(row => row.user),
    };
  }),
});

export const feedbackRouter = router({
  create: protectedProcedure.input(z.object({ type: feedbackType, rating: z.number().int().min(1).max(5).optional(), subject: z.string().trim().min(3).max(160), body: z.string().trim().min(3).max(3000) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "feedback_create", 10, 24 * 60 * 60 * 1000);
    if (input.type === "rating" && input.rating === undefined) throw new Error("A rating is required for rating feedback.");
    const db = await requireDb();
    const id = createId("fdb_");
    await db.insert(feedbackSubmissions).values({ id, userId: ctx.user.id, type: input.type, rating: input.rating ?? null, subject: sanitizePlainText(input.subject, 160), body: sanitizePlainText(input.body, 3000) });
    return { id };
  }),
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(feedbackSubmissions).where(eq(feedbackSubmissions.userId, ctx.user.id)).orderBy(desc(feedbackSubmissions.createdAt)).limit(50);
  }),
  adminList: adminProcedure.input(z.object({ status: z.enum(["open", "reviewing", "resolved", "closed"]).optional() })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ feedback: feedbackSubmissions, user: users }).from(feedbackSubmissions).innerJoin(users, eq(feedbackSubmissions.userId, users.id)).where(input.status ? eq(feedbackSubmissions.status, input.status) : undefined).orderBy(desc(feedbackSubmissions.createdAt)).limit(200);
    return rows;
  }),
  adminUpdate: adminProcedure.input(z.object({ id: z.string().min(4).max(36), status: z.enum(["reviewing", "resolved", "closed"]), adminNotes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(feedbackSubmissions).set({ status: input.status, reviewerUserId: ctx.user.id, adminNotes: input.adminNotes ? sanitizePlainText(input.adminNotes, 1000) : null }).where(eq(feedbackSubmissions.id, input.id));
    return { success: true };
  }),
});

export const userSafetyRouter = router({
  toggle: protectedProcedure.input(z.object({ targetAccountId: z.string().min(4).max(36), relation: relationType })).mutation(async ({ ctx, input }) => {
    const actor = await requireActiveAccount(ctx.user.id);
    if (actor.id === input.targetAccountId) throw new Error("You cannot apply this control to yourself.");
    const db = await requireDb();
    const target = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, input.targetAccountId)).limit(1);
    if (!target[0]) throw new Error("That account does not exist.");
    const existing = await db.select().from(userSafetyRelations).where(and(eq(userSafetyRelations.actorAccountId, actor.id), eq(userSafetyRelations.targetAccountId, input.targetAccountId), eq(userSafetyRelations.relation, input.relation))).limit(1);
    if (existing[0]) await db.delete(userSafetyRelations).where(and(eq(userSafetyRelations.actorAccountId, actor.id), eq(userSafetyRelations.targetAccountId, input.targetAccountId), eq(userSafetyRelations.relation, input.relation)));
    else await db.insert(userSafetyRelations).values({ actorAccountId: actor.id, targetAccountId: input.targetAccountId, relation: input.relation });
    return { active: !existing[0], relation: input.relation };
  }),
  status: protectedProcedure.input(z.object({ targetAccountId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const actor = await requireActiveAccount(ctx.user.id); const db = await requireDb();
    const rows = await db.select({ relation: userSafetyRelations.relation }).from(userSafetyRelations).where(and(eq(userSafetyRelations.actorAccountId, actor.id), eq(userSafetyRelations.targetAccountId, input.targetAccountId)));
    return { blocked: rows.some(row => row.relation === "blocked"), muted: rows.some(row => row.relation === "muted") };
  }),
});

export const verificationRouter = router({
  pending: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ account: accounts, profile: profiles }).from(profiles).innerJoin(accounts, eq(profiles.accountId, accounts.id)).where(eq(profiles.verificationStatus, "pending")).orderBy(desc(profiles.updatedAt)).limit(100);
  }),
  request: protectedProcedure.mutation(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id); const db = await requireDb();
    await db.update(accounts).set({ updatedAt: new Date() }).where(eq(accounts.id, account.id));
    await db.update((await import("../../drizzle/schema")).profiles).set({ verificationStatus: "pending" }).where(eq((await import("../../drizzle/schema")).profiles.accountId, account.id));
    return { submitted: true };
  }),
  adminReview: adminProcedure.input(z.object({ accountId: z.string().min(4).max(36), decision: z.enum(["approved", "rejected", "revoked"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update((await import("../../drizzle/schema")).profiles).set({ verificationStatus: input.decision === "approved" ? "verified" : input.decision === "revoked" ? "none" : "rejected" }).where(eq((await import("../../drizzle/schema")).profiles.accountId, input.accountId));
    await db.insert(adminVerificationReviews).values({ id: createId("ver_"), accountId: input.accountId, reviewerUserId: ctx.user.id, decision: input.decision, reason: input.reason ? sanitizePlainText(input.reason, 1000) : null });
    return { success: true };
  }),
});
