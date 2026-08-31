import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { accounts, profiles, userSettings } from "../../drizzle/schema";
import { createId, ensureUserSettings, getActiveAccountForUser, getOwnedAccount, listAccountsForUser, requireDb, setActiveAccount } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { MAX_BIO_LENGTH, VELORA_BRAND } from "../../shared/velora";
import { normalizeUsername, sanitizePlainText, requireOwnedMedia } from "../services/platform";

const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/, "Use letters, numbers, periods, or underscores.");
const displayNameSchema = z.string().trim().min(1).max(80);
const cropSchema = z.object({ scale: z.number().min(0.5).max(4), x: z.number().min(-1).max(1), y: z.number().min(-1).max(1), rotation: z.number().min(-180).max(180) });
const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").nullable().optional();

async function accountSummaries(userId: number) {
  const db = await requireDb();
  const ownedAccounts = await listAccountsForUser(userId);
  const ids = ownedAccounts.map(account => account.id);
  const profileRows = ids.length ? await db.select().from(profiles).where(inArray(profiles.accountId, ids)) : [];
  const settings = await ensureUserSettings(userId);
  return {
    activeAccountId: settings?.activeAccountId ?? null,
    theme: settings?.theme ?? "system",
    accounts: ownedAccounts.map(account => ({ ...account, profile: profileRows.find(profile => profile.accountId === account.id) ?? null })),
  };
}

export const accountsRouter = router({
  overview: protectedProcedure.query(({ ctx }) => accountSummaries(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({ username: usernameSchema, displayName: displayNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const username = normalizeUsername(input.username);
      const duplicate = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.username, username)).limit(1);
      if (duplicate[0]) throw new Error("That username is already taken.");
      const id = createId("acc_");
      await db.insert(accounts).values({ id, ownerUserId: ctx.user.id, username, displayName: sanitizePlainText(input.displayName, 80) });
      await db.insert(profiles).values({ accountId: id, bio: "" });
      await db.insert(userSettings).values({ userId: ctx.user.id, activeAccountId: id }).onDuplicateKeyUpdate({ set: { activeAccountId: id } });
      return accountSummaries(ctx.user.id);
    }),

  switchActive: protectedProcedure
    .input(z.object({ accountId: z.string().min(4).max(36) }))
    .mutation(async ({ ctx, input }) => {
      const account = await setActiveAccount(ctx.user.id, input.accountId);
      if (!account) throw new Error("That account is unavailable.");
      return accountSummaries(ctx.user.id);
    }),

  updateActiveProfile: protectedProcedure
    .input(z.object({
      username: usernameSchema.optional(),
      displayName: displayNameSchema.optional(),
      bio: z.string().max(MAX_BIO_LENGTH).optional(),
      website: z.string().trim().url().max(500).or(z.literal("")).optional(),
      location: z.string().trim().max(120).optional(),
      avatarMediaId: z.string().min(4).max(36).nullable().optional(),
      coverMediaId: z.string().min(4).max(36).nullable().optional(),
      avatarCrop: cropSchema.nullable().optional(),
      coverCrop: cropSchema.nullable().optional(),
      contactEmail: z.string().trim().email().max(320).or(z.literal("")).nullable().optional(),
      dateOfBirth: dateOfBirthSchema,
      isPrivate: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const active = await getActiveAccountForUser(ctx.user.id);
      if (!active) throw new Error("Create a Velora account before updating a profile.");

      if (input.avatarMediaId) await requireOwnedMedia(ctx.user.id, [input.avatarMediaId], "profile");
      if (input.coverMediaId) await requireOwnedMedia(ctx.user.id, [input.coverMediaId], "profile");
      const dateOfBirth = input.dateOfBirth === undefined || input.dateOfBirth === null ? input.dateOfBirth : new Date(`${input.dateOfBirth}T00:00:00.000Z`);
      if (dateOfBirth instanceof Date && (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now())) throw new Error("Date of birth must be a valid date in the past.");

      if (input.username) {
        const username = normalizeUsername(input.username);
        const duplicate = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.username, username), ne(accounts.id, active.id))).limit(1);
        if (duplicate[0]) throw new Error("That username is already taken.");
      }
      await db.update(accounts).set({
        ...(input.username ? { username: normalizeUsername(input.username) } : {}),
        ...(input.displayName ? { displayName: sanitizePlainText(input.displayName, 80) } : {}),
        ...(input.isPrivate !== undefined ? { isPrivate: input.isPrivate } : {}),
      }).where(eq(accounts.id, active.id));
      await db.insert(profiles).values({
        accountId: active.id,
        bio: input.bio === undefined ? "" : sanitizePlainText(input.bio, MAX_BIO_LENGTH),
        website: input.website ? input.website : null,
        location: input.location ? sanitizePlainText(input.location, 120) : null,
        avatarMediaId: input.avatarMediaId ?? null,
      }).onDuplicateKeyUpdate({
        set: {
          ...(input.bio !== undefined ? { bio: sanitizePlainText(input.bio, MAX_BIO_LENGTH) } : {}),
          ...(input.website !== undefined ? { website: input.website || null } : {}),
          ...(input.location !== undefined ? { location: input.location ? sanitizePlainText(input.location, 120) : null } : {}),
          ...(input.avatarMediaId !== undefined ? { avatarMediaId: input.avatarMediaId } : {}),
          ...(input.coverMediaId !== undefined ? { coverMediaId: input.coverMediaId } : {}),
          ...(input.avatarCrop !== undefined ? { avatarCrop: input.avatarCrop } : {}),
          ...(input.coverCrop !== undefined ? { coverCrop: input.coverCrop } : {}),
          ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail || null } : {}),
          ...(input.dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ?? null } : {}),
        },
      });
      return accountSummaries(ctx.user.id);
    }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => ensureUserSettings(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        allowMentions: z.enum(["everyone", "following", "none"]).optional(),
        allowMessages: z.enum(["everyone", "following", "none"]).optional(),
        notifyLikes: z.boolean().optional(),
        notifyComments: z.boolean().optional(),
        notifyFollows: z.boolean().optional(),
        notifyMessages: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db.insert(userSettings).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: input });
        return ensureUserSettings(ctx.user.id);
      }),
  }),

  brand: protectedProcedure.query(() => VELORA_BRAND),
  ownedAccount: protectedProcedure.input(z.object({ accountId: z.string() })).query(({ ctx, input }) => getOwnedAccount(ctx.user.id, input.accountId)),
});
