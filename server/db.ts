import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  accounts,
  mediaAssets,
  notifications,
  rateLimitEvents,
  userSettings,
  users,
  type Account,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldBootstrapAdmin } from "./services/adminAllowlist";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    database = drizzle(process.env.DATABASE_URL);
  }
  return database;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The Velora database is not available.");
  return db;
}

export function createId(prefix = "") {
  return `${prefix}${nanoid(24)}`;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert.");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  const isConfiguredAdmin = shouldBootstrapAdmin({ email: user.email, username: user.name });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId || isConfiguredAdmin ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureUserSettings(userId: number) {
  const db = await requireDb();
  await db.insert(userSettings).values({ userId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0];
}

export async function listAccountsForUser(userId: number) {
  const db = await requireDb();
  return db.select().from(accounts).where(eq(accounts.ownerUserId, userId));
}

export async function getOwnedAccount(userId: number, accountId: string) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.ownerUserId, userId)))
    .limit(1);
  return result[0];
}

export async function getActiveAccountForUser(userId: number): Promise<Account | undefined> {
  const db = await requireDb();
  const settings = await ensureUserSettings(userId);
  if (settings?.activeAccountId) {
    const selected = await getOwnedAccount(userId, settings.activeAccountId);
    if (selected?.status === "active") return selected;
  }

  const fallback = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.ownerUserId, userId), eq(accounts.status, "active")))
    .limit(1);
  const account = fallback[0];
  if (account) {
    await db.update(userSettings).set({ activeAccountId: account.id }).where(eq(userSettings.userId, userId));
  }
  return account;
}

export async function setActiveAccount(userId: number, accountId: string) {
  const account = await getOwnedAccount(userId, accountId);
  if (!account || account.status !== "active") return undefined;
  const db = await requireDb();
  await db.insert(userSettings).values({ userId, activeAccountId: accountId }).onDuplicateKeyUpdate({
    set: { activeAccountId: accountId },
  });
  return account;
}

export async function assertOwnedMedia(userId: number, mediaIds: string[], scope: "profile" | "post" | "story" | "message") {
  const db = await requireDb();
  if (!mediaIds.length) return [];
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.ownerUserId, userId), eq(mediaAssets.scope, scope)));
  const selected = rows.filter(row => mediaIds.includes(row.id));
  if (selected.length !== mediaIds.length) throw new Error("One or more selected files are unavailable for this action.");
  return selected;
}

export async function consumeRateLimit(userId: number, action: string, maximum: number, windowMs: number) {
  const db = await requireDb();
  const windowStartedAt = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const id = `${userId}:${action}:${windowStartedAt.getTime()}`;
  const existing = await db.select().from(rateLimitEvents).where(eq(rateLimitEvents.id, id)).limit(1);
  if (existing[0] && existing[0].count >= maximum) return false;

  if (existing[0]) {
    await db
      .update(rateLimitEvents)
      .set({ count: sql`${rateLimitEvents.count} + 1` })
      .where(and(eq(rateLimitEvents.id, id), gt(rateLimitEvents.count, 0)));
  } else {
    await db.insert(rateLimitEvents).values({ id, userId, action, windowStartedAt, count: 1 });
  }
  return true;
}

export async function createNotification(input: {
  recipientAccountId: string;
  actorAccountId?: string | null;
  type: "follow" | "like" | "comment" | "mention" | "message" | "story" | "report_update" | "security";
  resourceType?: string;
  resourceId?: string;
  body?: string;
}) {
  if (input.actorAccountId && input.actorAccountId === input.recipientAccountId) return;
  const db = await requireDb();
  await db.insert(notifications).values({ id: createId("ntf_"), ...input });
}
