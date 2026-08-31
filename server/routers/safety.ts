import { and, count, desc, eq, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import { accounts, moderationActions, posts, reports, users } from "../../drizzle/schema";
import { createId, requireDb } from "../db";
import { alertOwnerOnCriticalEvent, enforceRateLimit, requireActiveAccount, sanitizePlainText } from "../services/platform";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const reportReasonSchema = z.enum(["spam", "harassment", "hate", "violence", "nudity", "misinformation", "other"]);

export const safetyRouter = router({
  createReport: protectedProcedure.input(z.object({ targetType: z.enum(["user", "post", "comment", "story", "message"]), targetId: z.string().min(4).max(36), reason: reportReasonSchema, details: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "report_create", 20, 24 * 60 * 60 * 1000);
    const reporter = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const id = createId("rpt_");
    await db.insert(reports).values({ id, reporterAccountId: reporter.id, targetType: input.targetType, targetId: input.targetId, reason: input.reason, details: input.details ? sanitizePlainText(input.details, 1000) : null });
    if (["violence", "hate", "nudity"].indexOf(input.reason) !== -1) {
      await alertOwnerOnCriticalEvent("Velora priority report", `A priority ${input.reason} report was submitted for ${input.targetType} ${input.targetId}.`);
    }
    return { id };
  }),
});

export const adminRouter = router({
  statistics: adminProcedure.query(async () => {
    const db = await requireDb();
    const [userCount] = await db.select({ value: count() }).from(users);
    const [accountCount] = await db.select({ value: count() }).from(accounts).where(eq(accounts.status, "active"));
    const [postCount] = await db.select({ value: count() }).from(posts).where(isNull(posts.deletedAt));
    const [openReportCount] = await db.select({ value: count() }).from(reports).where(or(eq(reports.status, "open"), eq(reports.status, "reviewing")));
    return { users: Number(userCount?.value ?? 0), activeAccounts: Number(accountCount?.value ?? 0), visiblePosts: Number(postCount?.value ?? 0), openReports: Number(openReportCount?.value ?? 0) };
  }),

  users: adminProcedure.input(z.object({ query: z.string().trim().max(120).default("") })).query(async ({ input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120);
    const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;
    return db.select({ account: accounts, user: users }).from(accounts).innerJoin(users, eq(accounts.ownerUserId, users.id)).where(or(like(accounts.username, pattern), like(accounts.displayName, pattern), like(users.email, pattern))).orderBy(desc(accounts.createdAt)).limit(100);
  }),

  setAccountStatus: adminProcedure.input(z.object({ accountId: z.string().min(4).max(36), status: z.enum(["active", "suspended"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const account = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);
    if (!account[0]) throw new Error("The selected account does not exist.");
    await db.update(accounts).set({ status: input.status }).where(eq(accounts.id, input.accountId));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: input.status === "suspended" ? "suspend_account" : "restore_account", entityType: "account", entityId: input.accountId, reason: input.reason ? sanitizePlainText(input.reason, 1000) : null });
    return { success: true };
  }),

  reports: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ report: reports, reporter: accounts }).from(reports).innerJoin(accounts, eq(reports.reporterAccountId, accounts.id)).orderBy(desc(reports.createdAt)).limit(100);
  }),

  resolveReport: adminProcedure.input(z.object({ reportId: z.string().min(4).max(36), status: z.enum(["reviewing", "resolved", "dismissed"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const report = await db.select().from(reports).where(eq(reports.id, input.reportId)).limit(1);
    if (!report[0]) throw new Error("This report is unavailable.");
    await db.update(reports).set({ status: input.status, reviewerUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(reports.id, input.reportId));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: input.status === "dismissed" ? "dismiss_report" : "resolve_report", entityType: "report", entityId: input.reportId, reason: input.reason ? sanitizePlainText(input.reason, 1000) : null });
    return { success: true };
  }),

  removePost: adminProcedure.input(z.object({ postId: z.string().min(4).max(36), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(posts).set({ deletedAt: new Date() }).where(and(eq(posts.id, input.postId), isNull(posts.deletedAt)));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: "remove_post", entityType: "post", entityId: input.postId, reason: input.reason ? sanitizePlainText(input.reason, 1000) : null });
    return { success: true };
  }),

  content: adminProcedure.input(z.object({ query: z.string().trim().max(120).default("") })).query(async ({ input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120);
    const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;
    return db.select({ post: posts, author: accounts }).from(posts).innerJoin(accounts, eq(posts.authorAccountId, accounts.id)).where(or(like(posts.caption, pattern), like(accounts.username, pattern), like(accounts.displayName, pattern))).orderBy(desc(posts.createdAt)).limit(100);
  }),

  activity: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ action: moderationActions, administrator: users }).from(moderationActions).innerJoin(users, eq(moderationActions.administratorUserId, users.id)).orderBy(desc(moderationActions.createdAt)).limit(100);
  }),
});
