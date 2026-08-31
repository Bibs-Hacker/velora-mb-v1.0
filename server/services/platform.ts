import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { assertOwnedMedia, consumeRateLimit, createNotification, getActiveAccountForUser } from "../db";

export function sanitizePlainText(value: string, maximum: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function extractHashtags(value: string) {
  const names: string[] = [];
  const expression = /(^|\s)#([a-zA-Z0-9_]{2,80})/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(value)) !== null) {
    const name = match[2].toLowerCase();
    if (names.indexOf(name) === -1) names.push(name);
  }
  return names;
}

export function extractMentions(value: string) {
  const names: string[] = [];
  const expression = /(^|\s)@([a-z0-9_.]{3,30})/gi;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(value)) !== null) {
    const name = match[2].toLowerCase();
    if (names.indexOf(name) === -1) names.push(name);
  }
  return names;
}

export async function requireActiveAccount(userId: number) {
  const account = await getActiveAccountForUser(userId);
  if (!account) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Create a Velora profile before using this feature." });
  }
  if (account.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "This Velora account is not active." });
  }
  return account;
}

export async function enforceRateLimit(userId: number, action: string, maximum: number, windowMs: number) {
  const accepted = await consumeRateLimit(userId, action, maximum, windowMs);
  if (!accepted) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying that again." });
}

export async function requireOwnedMedia(userId: number, ids: string[], scope: "profile" | "post" | "story" | "message") {
  try {
    return await assertOwnedMedia(userId, ids, scope);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Selected media is not available.",
    });
  }
}

export async function notifySocialEvent(input: Parameters<typeof createNotification>[0]) {
  await createNotification(input);
}

export async function alertOwnerOnCriticalEvent(title: string, content: string) {
  if (process.env.VELORA_OWNER_ALERTS !== "enabled") return false;
  return notifyOwner({ title, content });
}
