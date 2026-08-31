import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { accountSessions } from "../../drizzle/schema";
import { createId, requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { sanitizePlainText } from "../services/platform";

export const sessionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(accountSessions).where(and(eq(accountSessions.userId, ctx.user.id), isNull(accountSessions.revokedAt))).orderBy(desc(accountSessions.lastActiveAt));
  }),
  register: protectedProcedure.input(z.object({ deviceId: z.string().min(12).max(64), deviceLabel: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select().from(accountSessions).where(eq(accountSessions.id, input.deviceId)).limit(1);
    if (existing[0] && existing[0].userId !== ctx.user.id) throw new Error("This device identifier cannot be used.");
    if (existing[0]?.revokedAt) throw new Error("This device session was revoked. Restart the application to create a new session.");
    if (existing[0]) {
      await db.update(accountSessions).set({ lastActiveAt: new Date(), deviceLabel: sanitizePlainText(input.deviceLabel, 120) }).where(eq(accountSessions.id, input.deviceId));
      return existing[0];
    }
    const id = input.deviceId || createId("ses_");
    await db.insert(accountSessions).values({ id, userId: ctx.user.id, deviceLabel: sanitizePlainText(input.deviceLabel, 120), userAgent: sanitizePlainText(ctx.req.headers["user-agent"] || "", 500) || null });
    const created = await db.select().from(accountSessions).where(eq(accountSessions.id, id)).limit(1);
    return created[0];
  }),
  revoke: protectedProcedure.input(z.object({ sessionId: z.string().min(12).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(accountSessions).set({ revokedAt: new Date() }).where(and(eq(accountSessions.id, input.sessionId), eq(accountSessions.userId, ctx.user.id), isNull(accountSessions.revokedAt)));
    return { success: true };
  }),
});
