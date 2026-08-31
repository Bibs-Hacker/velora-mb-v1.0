import { and, desc, eq, gte, inArray, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";
import { accounts, conversationMembers, conversationPresence, conversationPreferences, conversations, mediaAssets, messageAttachments, messageReactions, messages, notifications, pollOptions, pollVotes, polls, userSafetyRelations } from "../../drizzle/schema";
import { MAX_MESSAGE_LENGTH } from "../../shared/velora";
import { createId, requireDb } from "../db";
import { enforceRateLimit, notifySocialEvent, requireActiveAccount, requireOwnedMedia, sanitizePlainText } from "../services/platform";
import { protectedProcedure, router } from "../_core/trpc";

async function requireMembership(conversationId: string, accountId: string) {
  const db = await requireDb();
  const membership = await db.select().from(conversationMembers).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.accountId, accountId))).limit(1);
  if (!membership[0]) throw new Error("You are not a member of this conversation.");
  return membership[0];
}

export const messagingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const memberships = await db.select().from(conversationMembers).where(eq(conversationMembers.accountId, active.id));
    const ids = memberships.map(member => member.conversationId);
    if (!ids.length) return [];
    const rows = await db.select().from(conversations).where(inArray(conversations.id, ids)).orderBy(desc(conversations.lastMessageAt));
    const participants = await db.select({ conversationId: conversationMembers.conversationId, account: accounts }).from(conversationMembers).innerJoin(accounts, eq(conversationMembers.accountId, accounts.id)).where(inArray(conversationMembers.conversationId, ids));
    const messageRows = await db.select().from(messages).where(and(inArray(messages.conversationId, ids), ne(messages.senderAccountId, active.id), isNull(messages.deletedAt)));
    return rows.map(conversation => {
      const lastReadAt = memberships.find(item => item.conversationId === conversation.id)?.lastReadAt ?? null;
      const unreadCount = messageRows.filter(message => message.conversationId === conversation.id && (!lastReadAt || message.createdAt > lastReadAt)).length;
      return { ...conversation, members: participants.filter(item => item.conversationId === conversation.id).map(item => item.account), lastReadAt, unreadCount };
    });
  }),

  startDirect: protectedProcedure.input(z.object({ accountId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    if (active.id === input.accountId) throw new Error("You cannot start a conversation with the active account.");
    const db = await requireDb();
    const target = await db.select().from(accounts).where(and(eq(accounts.id, input.accountId), eq(accounts.status, "active"))).limit(1);
    if (!target[0]) throw new Error("This account is not available.");
    const ownMemberships = await db.select().from(conversationMembers).where(eq(conversationMembers.accountId, active.id));
    const existingIds = ownMemberships.map(member => member.conversationId);
    if (existingIds.length) {
      const shared = await db.select({ conversationId: conversationMembers.conversationId }).from(conversationMembers).where(and(eq(conversationMembers.accountId, input.accountId), inArray(conversationMembers.conversationId, existingIds)));
      if (shared.length) {
        const matched = await db.select().from(conversations).where(and(inArray(conversations.id, shared.map(item => item.conversationId)), eq(conversations.type, "direct"))).limit(1);
        if (matched[0]) return matched[0];
      }
    }
    const id = createId("cnv_");
    await db.transaction(async transaction => {
      await transaction.insert(conversations).values({ id, type: "direct" });
      await transaction.insert(conversationMembers).values([{ conversationId: id, accountId: active.id }, { conversationId: id, accountId: input.accountId }]);
    });
    return { id, type: "direct" as const };
  }),

  messages: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36), limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const blocked = await db.select({ actor: userSafetyRelations.actorAccountId, target: userSafetyRelations.targetAccountId }).from(userSafetyRelations).where(and(eq(userSafetyRelations.relation, "blocked"), or(eq(userSafetyRelations.targetAccountId, active.id), eq(userSafetyRelations.actorAccountId, active.id))));
    const blockedPairs = new Set(blocked.map(row => `${row.actor}:${row.target}`));
    const rows = await db.select({ message: messages, sender: accounts }).from(messages).innerJoin(accounts, eq(messages.senderAccountId, accounts.id)).where(and(eq(messages.conversationId, input.conversationId), isNull(messages.deletedAt))).orderBy(desc(messages.createdAt)).limit(input.limit * 2);
    const visibleRows = rows.filter(row => row.message.senderAccountId === active.id || !blockedPairs.has(`${row.message.senderAccountId}:${active.id}`));
    const ids = visibleRows.slice(0, input.limit).map(row => row.message.id);
    await db.update(messages).set({ deliveredAt: new Date() }).where(and(eq(messages.conversationId, input.conversationId), ne(messages.senderAccountId, active.id), isNull(messages.deliveredAt), isNull(messages.deletedAt)));
    const attachmentRows = ids.length ? await db.select({ messageId: messageAttachments.messageId, media: mediaAssets }).from(messageAttachments).innerJoin(mediaAssets, eq(messageAttachments.mediaId, mediaAssets.id)).where(inArray(messageAttachments.messageId, ids)) : [];
    const reactionRows = ids.length ? await db.select().from(messageReactions).where(inArray(messageReactions.messageId, ids)) : [];
    return visibleRows.slice(0, input.limit).reverse().map(row => ({ ...row.message, sender: row.sender, attachments: attachmentRows.filter(item => item.messageId === row.message.id).map(item => item.media), reactions: reactionRows.filter(item => item.messageId === row.message.id) }));
  }),

  send: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36), body: z.string().max(MAX_MESSAGE_LENGTH).default(""), attachmentIds: z.array(z.string().min(4).max(36)).max(6).default([]), replyToMessageId: z.string().min(4).max(36).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "message_send", 120, 60 * 60 * 1000);
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const body = sanitizePlainText(input.body, MAX_MESSAGE_LENGTH);
    if (!body && !input.attachmentIds.length) throw new Error("Write a message or attach media before sending.");
    await requireOwnedMedia(ctx.user.id, input.attachmentIds, "message");
    const db = await requireDb();
    const members = await db.select().from(conversationMembers).where(eq(conversationMembers.conversationId, input.conversationId));
    const recipient = members.find(member => member.accountId !== active.id);
    const blockedForRecipient = recipient ? Boolean((await db.select().from(userSafetyRelations).where(and(eq(userSafetyRelations.relation, "blocked"), or(and(eq(userSafetyRelations.actorAccountId, active.id), eq(userSafetyRelations.targetAccountId, recipient.accountId)), and(eq(userSafetyRelations.actorAccountId, recipient.accountId), eq(userSafetyRelations.targetAccountId, active.id))))).limit(1))[0]) : false;
    const mutedForRecipient = recipient ? Boolean((await db.select().from(userSafetyRelations).where(and(eq(userSafetyRelations.actorAccountId, recipient.accountId), eq(userSafetyRelations.targetAccountId, active.id), eq(userSafetyRelations.relation, "muted"))).limit(1))[0]) : false;
    const id = createId("msg_");
    await db.transaction(async transaction => {
      await transaction.insert(messages).values({ id, conversationId: input.conversationId, senderAccountId: active.id, replyToMessageId: input.replyToMessageId ?? null, body, deliveredAt: blockedForRecipient ? null : new Date() });
      if (input.attachmentIds.length) await transaction.insert(messageAttachments).values(input.attachmentIds.map((mediaId, position) => ({ id: createId("mat_"), messageId: id, mediaId, position })));
      await transaction.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, input.conversationId));
    });
    const allMembers = await db.select().from(conversationMembers).where(eq(conversationMembers.conversationId, input.conversationId));
    if (!blockedForRecipient && !mutedForRecipient) for (const member of allMembers) if (member.accountId !== active.id) await notifySocialEvent({ recipientAccountId: member.accountId, actorAccountId: active.id, type: "message", resourceType: "conversation", resourceId: input.conversationId, body: `${active.displayName} sent you a message.` });
    return { id, delivered: !blockedForRecipient, notificationsEnabled: !mutedForRecipient, blockedForRecipient };
  }),

  markRead: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const readAt = new Date();
    await db.transaction(async transaction => {
      await transaction.update(conversationMembers).set({ lastReadAt: readAt, unreadCount: 0 }).where(and(eq(conversationMembers.conversationId, input.conversationId), eq(conversationMembers.accountId, active.id)));
      await transaction.update(messages).set({ readAt }).where(and(eq(messages.conversationId, input.conversationId), ne(messages.senderAccountId, active.id), isNull(messages.readAt), isNull(messages.deletedAt)));
    });
    return { success: true, readAt };
  }),

  presence: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36), isTyping: z.boolean() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); await requireMembership(input.conversationId, active.id); const db = await requireDb();
    await db.insert(conversationPresence).values({ conversationId: input.conversationId, accountId: active.id, isTyping: input.isTyping, lastSeenAt: new Date() }).onDuplicateKeyUpdate({ set: { isTyping: input.isTyping, lastSeenAt: new Date() } });
    return { success: true };
  }),
  presenceSnapshot: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); await requireMembership(input.conversationId, active.id); const db = await requireDb(); const freshAfter = new Date(Date.now() - 20_000);
    const rows = await db.select({ presence: conversationPresence, account: accounts }).from(conversationPresence).innerJoin(accounts, eq(conversationPresence.accountId, accounts.id)).where(and(eq(conversationPresence.conversationId, input.conversationId), ne(conversationPresence.accountId, active.id), gte(conversationPresence.lastSeenAt, freshAfter)));
    return rows;
  }),
  preferences: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); await requireMembership(input.conversationId, active.id); const db = await requireDb();
    const rows = await db.select({ preference: conversationPreferences, backgroundMedia: mediaAssets }).from(conversationPreferences).leftJoin(mediaAssets, eq(conversationPreferences.backgroundMediaId, mediaAssets.id)).where(and(eq(conversationPreferences.conversationId, input.conversationId), eq(conversationPreferences.accountId, active.id))).limit(1);
    return rows[0] ? { ...rows[0].preference, backgroundMedia: rows[0].backgroundMedia } : { conversationId: input.conversationId, accountId: active.id, theme: "velora" as const, backgroundMediaId: null, backgroundMedia: null, updatedAt: new Date() };
  }),
  setPreferences: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36), theme: z.enum(["velora", "orchid", "midnight", "ocean", "sunset"]), backgroundMediaId: z.string().min(4).max(36).nullable().optional() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); await requireMembership(input.conversationId, active.id);
    if (input.backgroundMediaId) await requireOwnedMedia(ctx.user.id, [input.backgroundMediaId], "message");
    const db = await requireDb();
    await db.insert(conversationPreferences).values({ conversationId: input.conversationId, accountId: active.id, theme: input.theme, backgroundMediaId: input.backgroundMediaId ?? null }).onDuplicateKeyUpdate({ set: { theme: input.theme, backgroundMediaId: input.backgroundMediaId ?? null, updatedAt: new Date() } });
    return { success: true };
  }),
  react: protectedProcedure.input(z.object({ messageId: z.string().min(4).max(36), reaction: z.string().trim().min(1).max(32) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); const db = await requireDb(); const message = await db.select().from(messages).where(eq(messages.id, input.messageId)).limit(1); if (!message[0]) throw new Error("That message is unavailable."); await requireMembership(message[0].conversationId, active.id);
    const existing = await db.select().from(messageReactions).where(and(eq(messageReactions.messageId, input.messageId), eq(messageReactions.accountId, active.id))).limit(1);
    if (existing[0]) await db.delete(messageReactions).where(and(eq(messageReactions.messageId, input.messageId), eq(messageReactions.accountId, active.id))); else await db.insert(messageReactions).values({ messageId: input.messageId, accountId: active.id, reaction: input.reaction });
    return { active: !existing[0] };
  }),
  createPoll: protectedProcedure.input(z.object({ conversationId: z.string().min(4).max(36), question: z.string().trim().min(2).max(300), options: z.array(z.string().trim().min(1).max(160)).min(2).max(8) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "poll_create", 30, 60 * 60 * 1000); const active = await requireActiveAccount(ctx.user.id); await requireMembership(input.conversationId, active.id); const db = await requireDb(); const messageId = createId("msg_"); const pollId = createId("pol_");
    await db.transaction(async transaction => { await transaction.insert(messages).values({ id: messageId, conversationId: input.conversationId, senderAccountId: active.id, body: input.question, kind: "poll", deliveredAt: new Date() }); await transaction.insert(polls).values({ id: pollId, messageId, question: input.question }); await transaction.insert(pollOptions).values(input.options.map((label, position) => ({ pollId, label: sanitizePlainText(label, 160), position }))); await transaction.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, input.conversationId)); });
    return { messageId, pollId };
  }),
  votePoll: protectedProcedure.input(z.object({ pollId: z.string().min(4).max(36), optionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id); const db = await requireDb(); const poll = await db.select({ poll: polls, message: messages }).from(polls).innerJoin(messages, eq(polls.messageId, messages.id)).where(eq(polls.id, input.pollId)).limit(1); if (!poll[0]) throw new Error("That poll is unavailable."); await requireMembership(poll[0].message.conversationId, active.id);
    const option = await db.select().from(pollOptions).where(and(eq(pollOptions.id, input.optionId), eq(pollOptions.pollId, input.pollId))).limit(1); if (!option[0]) throw new Error("That poll option is unavailable.");
    await db.insert(pollVotes).values({ pollId: input.pollId, optionId: input.optionId, accountId: active.id }).onDuplicateKeyUpdate({ set: { optionId: input.optionId, createdAt: new Date() } }); return { success: true };
  }),
  removeMessage: protectedProcedure.input(z.object({ messageId: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const message = await db.select().from(messages).where(and(eq(messages.id, input.messageId), eq(messages.senderAccountId, active.id), isNull(messages.deletedAt))).limit(1);
    if (!message[0]) throw new Error("You can only remove an available message you sent.");
    await db.update(messages).set({ deletedAt: new Date(), body: "" }).where(eq(messages.id, input.messageId));
    return { success: true };
  }),
});

export const notificationsRouter = router({
  list: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    return db.select({ notification: notifications, actor: accounts }).from(notifications).leftJoin(accounts, eq(notifications.actorAccountId, accounts.id)).where(eq(notifications.recipientAccountId, active.id)).orderBy(desc(notifications.createdAt)).limit(input.limit);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const rows = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.recipientAccountId, active.id), isNull(notifications.readAt)));
    return rows.length;
  }),
  markRead: protectedProcedure.input(z.object({ id: z.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.id), eq(notifications.recipientAccountId, active.id)));
    return { success: true };
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.recipientAccountId, active.id), isNull(notifications.readAt)));
    return { success: true };
  }),
});
