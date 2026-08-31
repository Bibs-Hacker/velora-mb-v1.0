var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountSessions: () => accountSessions,
  accounts: () => accounts,
  adminVerificationReviews: () => adminVerificationReviews,
  analyticsEvents: () => analyticsEvents,
  comments: () => comments,
  conversationMembers: () => conversationMembers,
  conversationPreferences: () => conversationPreferences,
  conversationPresence: () => conversationPresence,
  conversations: () => conversations,
  feedbackSubmissions: () => feedbackSubmissions,
  follows: () => follows,
  hashtags: () => hashtags,
  likes: () => likes,
  mediaAssets: () => mediaAssets,
  messageAttachments: () => messageAttachments,
  messageReactions: () => messageReactions,
  messages: () => messages,
  moderationActions: () => moderationActions,
  notifications: () => notifications,
  platformJobs: () => platformJobs,
  pollOptions: () => pollOptions,
  pollVotes: () => pollVotes,
  polls: () => polls,
  postHashtags: () => postHashtags,
  postMedia: () => postMedia,
  postMentions: () => postMentions,
  postShares: () => postShares,
  posts: () => posts,
  profiles: () => profiles,
  rateLimitEvents: () => rateLimitEvents,
  recentSearches: () => recentSearches,
  reports: () => reports,
  savedPosts: () => savedPosts,
  stories: () => stories,
  storyArchives: () => storyArchives,
  storyViews: () => storyViews,
  userSafetyRelations: () => userSafetyRelations,
  userSettings: () => userSettings,
  users: () => users
});
import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/mysql-core";
var users, accounts, profiles, userSettings, accountSessions, mediaAssets, posts, postMedia, hashtags, postHashtags, postMentions, comments, likes, follows, savedPosts, postShares, stories, storyViews, conversations, conversationMembers, messages, messageAttachments, notifications, reports, moderationActions, rateLimitEvents, platformJobs, recentSearches, storyArchives, analyticsEvents, feedbackSubmissions, userSafetyRelations, conversationPresence, conversationPreferences, messageReactions, polls, pollOptions, pollVotes, adminVerificationReviews;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    accounts = mysqlTable(
      "accounts",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        ownerUserId: int("ownerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
        username: varchar("username", { length: 30 }).notNull(),
        displayName: varchar("displayName", { length: 80 }).notNull(),
        status: mysqlEnum("status", ["active", "suspended", "banned", "deactivated"]).default("active").notNull(),
        suspendedUntil: timestamp("suspendedUntil"),
        suspensionReason: varchar("suspensionReason", { length: 1e3 }),
        isPrivate: boolean("isPrivate").default(false).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        uniqueIndex("accounts_username_unique").on(table.username),
        index("accounts_owner_idx").on(table.ownerUserId),
        index("accounts_status_idx").on(table.status)
      ]
    );
    profiles = mysqlTable(
      "profiles",
      {
        accountId: varchar("accountId", { length: 36 }).primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
        avatarUrl: varchar("avatarUrl", { length: 1024 }),
        avatarMediaId: varchar("avatarMediaId", { length: 36 }),
        coverMediaId: varchar("coverMediaId", { length: 36 }),
        bio: varchar("bio", { length: 160 }).default("").notNull(),
        website: varchar("website", { length: 500 }),
        contactEmail: varchar("contactEmail", { length: 320 }),
        contactPhone: varchar("contactPhone", { length: 40 }),
        location: varchar("location", { length: 120 }),
        dateOfBirth: timestamp("dateOfBirth"),
        avatarCrop: json("avatarCrop"),
        coverCrop: json("coverCrop"),
        verificationStatus: mysqlEnum("verificationStatus", ["none", "pending", "verified", "rejected"]).default("none").notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [index("profiles_avatar_media_idx").on(table.avatarMediaId)]
    );
    userSettings = mysqlTable(
      "user_settings",
      {
        userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
        activeAccountId: varchar("activeAccountId", { length: 36 }),
        theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
        allowMentions: mysqlEnum("allowMentions", ["everyone", "following", "none"]).default("everyone").notNull(),
        allowMessages: mysqlEnum("allowMessages", ["everyone", "following", "none"]).default("following").notNull(),
        notifyLikes: boolean("notifyLikes").default(true).notNull(),
        notifyComments: boolean("notifyComments").default(true).notNull(),
        notifyFollows: boolean("notifyFollows").default(true).notNull(),
        notifyMessages: boolean("notifyMessages").default(true).notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [index("user_settings_active_account_idx").on(table.activeAccountId)]
    );
    accountSessions = mysqlTable(
      "account_sessions",
      {
        id: varchar("id", { length: 64 }).primaryKey(),
        userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
        deviceLabel: varchar("deviceLabel", { length: 120 }).notNull(),
        ipHash: varchar("ipHash", { length: 128 }),
        userAgent: varchar("userAgent", { length: 500 }),
        lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
        revokedAt: timestamp("revokedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("account_sessions_user_active_idx").on(table.userId, table.revokedAt)]
    );
    mediaAssets = mysqlTable(
      "media_assets",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        ownerUserId: int("ownerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
        scope: mysqlEnum("scope", ["profile", "post", "story", "message"]).notNull(),
        storageKey: varchar("storageKey", { length: 1024 }).notNull(),
        url: varchar("url", { length: 1200 }).notNull(),
        originalName: varchar("originalName", { length: 255 }).notNull(),
        mimeType: varchar("mimeType", { length: 100 }).notNull(),
        sizeBytes: int("sizeBytes").notNull(),
        width: int("width"),
        height: int("height"),
        durationMs: int("durationMs"),
        altText: varchar("altText", { length: 500 }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [
        uniqueIndex("media_assets_storage_key_unique").on(table.storageKey),
        index("media_assets_owner_scope_idx").on(table.ownerUserId, table.scope)
      ]
    );
    posts = mysqlTable(
      "posts",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        authorAccountId: varchar("authorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        caption: varchar("caption", { length: 2200 }).default("").notNull(),
        location: varchar("location", { length: 120 }),
        visibility: mysqlEnum("visibility", ["public", "followers"]).default("public").notNull(),
        likeCount: int("likeCount").default(0).notNull(),
        commentCount: int("commentCount").default(0).notNull(),
        saveCount: int("saveCount").default(0).notNull(),
        shareCount: int("shareCount").default(0).notNull(),
        deletedAt: timestamp("deletedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("posts_author_created_idx").on(table.authorAccountId, table.createdAt),
        index("posts_visibility_created_idx").on(table.visibility, table.createdAt)
      ]
    );
    postMedia = mysqlTable(
      "post_media",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
        position: int("position").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [
        uniqueIndex("post_media_post_position_unique").on(table.postId, table.position),
        uniqueIndex("post_media_post_media_unique").on(table.postId, table.mediaId)
      ]
    );
    hashtags = mysqlTable(
      "hashtags",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        normalizedName: varchar("normalizedName", { length: 80 }).notNull(),
        displayName: varchar("displayName", { length: 80 }).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [uniqueIndex("hashtags_normalized_name_unique").on(table.normalizedName)]
    );
    postHashtags = mysqlTable(
      "post_hashtags",
      {
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        hashtagId: varchar("hashtagId", { length: 36 }).notNull().references(() => hashtags.id, { onDelete: "cascade" })
      },
      (table) => [primaryKey({ columns: [table.postId, table.hashtagId] }), index("post_hashtags_hashtag_idx").on(table.hashtagId)]
    );
    postMentions = mysqlTable(
      "post_mentions",
      {
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" })
      },
      (table) => [primaryKey({ columns: [table.postId, table.accountId] }), index("post_mentions_account_idx").on(table.accountId)]
    );
    comments = mysqlTable(
      "comments",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        authorAccountId: varchar("authorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        parentCommentId: varchar("parentCommentId", { length: 36 }),
        body: varchar("body", { length: 1e3 }).notNull(),
        deletedAt: timestamp("deletedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [
        index("comments_post_created_idx").on(table.postId, table.createdAt),
        index("comments_author_idx").on(table.authorAccountId)
      ]
    );
    likes = mysqlTable(
      "likes",
      {
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.postId, table.accountId] }), index("likes_account_created_idx").on(table.accountId, table.createdAt)]
    );
    follows = mysqlTable(
      "follows",
      {
        followerAccountId: varchar("followerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        followingAccountId: varchar("followingAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        status: mysqlEnum("status", ["accepted", "requested"]).default("accepted").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [
        primaryKey({ columns: [table.followerAccountId, table.followingAccountId] }),
        index("follows_following_status_idx").on(table.followingAccountId, table.status)
      ]
    );
    savedPosts = mysqlTable(
      "saved_posts",
      {
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.accountId, table.postId] }), index("saved_posts_account_created_idx").on(table.accountId, table.createdAt)]
    );
    postShares = mysqlTable(
      "post_shares",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        channel: mysqlEnum("channel", ["copy_link", "message", "external"]).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("post_shares_post_idx").on(table.postId)]
    );
    stories = mysqlTable(
      "stories",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        authorAccountId: varchar("authorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
        caption: varchar("caption", { length: 500 }),
        expiresAt: timestamp("expiresAt").notNull(),
        deletedAt: timestamp("deletedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [
        index("stories_expiry_idx").on(table.expiresAt),
        index("stories_author_expiry_idx").on(table.authorAccountId, table.expiresAt)
      ]
    );
    storyViews = mysqlTable(
      "story_views",
      {
        storyId: varchar("storyId", { length: 36 }).notNull().references(() => stories.id, { onDelete: "cascade" }),
        viewerAccountId: varchar("viewerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        viewedAt: timestamp("viewedAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.storyId, table.viewerAccountId] }), index("story_views_viewer_idx").on(table.viewerAccountId)]
    );
    conversations = mysqlTable(
      "conversations",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        type: mysqlEnum("type", ["direct", "group"]).default("direct").notNull(),
        title: varchar("title", { length: 120 }),
        lastMessageAt: timestamp("lastMessageAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [index("conversations_last_message_idx").on(table.lastMessageAt)]
    );
    conversationMembers = mysqlTable(
      "conversation_members",
      {
        conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        lastReadAt: timestamp("lastReadAt"),
        joinedAt: timestamp("joinedAt").defaultNow().notNull(),
        mutedUntil: timestamp("mutedUntil"),
        unreadCount: int("unreadCount").default(0).notNull()
      },
      (table) => [primaryKey({ columns: [table.conversationId, table.accountId] }), index("conversation_members_account_idx").on(table.accountId)]
    );
    messages = mysqlTable(
      "messages",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
        senderAccountId: varchar("senderAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        replyToMessageId: varchar("replyToMessageId", { length: 36 }),
        body: varchar("body", { length: 4e3 }).default("").notNull(),
        kind: mysqlEnum("kind", ["text", "poll", "voice", "video"]).default("text").notNull(),
        deliveredAt: timestamp("deliveredAt"),
        readAt: timestamp("readAt"),
        deletedAt: timestamp("deletedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [
        index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
        index("messages_sender_idx").on(table.senderAccountId)
      ]
    );
    messageAttachments = mysqlTable(
      "message_attachments",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        messageId: varchar("messageId", { length: 36 }).notNull().references(() => messages.id, { onDelete: "cascade" }),
        mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
        position: int("position").notNull()
      },
      (table) => [uniqueIndex("message_attachments_message_position_unique").on(table.messageId, table.position)]
    );
    notifications = mysqlTable(
      "notifications",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        recipientAccountId: varchar("recipientAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        actorAccountId: varchar("actorAccountId", { length: 36 }).references(() => accounts.id, { onDelete: "set null" }),
        type: mysqlEnum("type", ["follow", "like", "comment", "mention", "message", "story", "report_update", "security"]).notNull(),
        resourceType: varchar("resourceType", { length: 40 }),
        resourceId: varchar("resourceId", { length: 36 }),
        body: varchar("body", { length: 500 }),
        readAt: timestamp("readAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("notifications_recipient_read_created_idx").on(table.recipientAccountId, table.readAt, table.createdAt)]
    );
    reports = mysqlTable(
      "reports",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        reporterAccountId: varchar("reporterAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        targetType: mysqlEnum("targetType", ["user", "post", "comment", "story", "message"]).notNull(),
        targetId: varchar("targetId", { length: 36 }).notNull(),
        reason: mysqlEnum("reason", ["spam", "harassment", "hate", "violence", "nudity", "misinformation", "other"]).notNull(),
        details: varchar("details", { length: 1e3 }),
        status: mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"]).default("open").notNull(),
        reviewerUserId: int("reviewerUserId").references(() => users.id, { onDelete: "set null" }),
        reviewedAt: timestamp("reviewedAt"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("reports_status_created_idx").on(table.status, table.createdAt), index("reports_target_idx").on(table.targetType, table.targetId)]
    );
    moderationActions = mysqlTable(
      "moderation_actions",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        administratorUserId: int("administratorUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
        action: mysqlEnum("action", ["suspend_account", "restore_account", "remove_post", "resolve_report", "dismiss_report"]).notNull(),
        entityType: varchar("entityType", { length: 40 }).notNull(),
        entityId: varchar("entityId", { length: 36 }).notNull(),
        reason: varchar("reason", { length: 1e3 }),
        metadata: json("metadata"),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("moderation_actions_entity_idx").on(table.entityType, table.entityId), index("moderation_actions_admin_created_idx").on(table.administratorUserId, table.createdAt)]
    );
    rateLimitEvents = mysqlTable(
      "rate_limit_events",
      {
        id: varchar("id", { length: 90 }).primaryKey(),
        userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
        action: varchar("action", { length: 64 }).notNull(),
        windowStartedAt: timestamp("windowStartedAt").notNull(),
        count: int("count").default(1).notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [uniqueIndex("rate_limit_user_action_window_unique").on(table.userId, table.action, table.windowStartedAt)]
    );
    platformJobs = mysqlTable(
      "platform_jobs",
      {
        id: varchar("id", { length: 64 }).primaryKey(),
        scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
        enabled: boolean("enabled").default(true).notNull(),
        lastCompletedAt: timestamp("lastCompletedAt"),
        lastError: varchar("lastError", { length: 1e3 }),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [uniqueIndex("platform_jobs_schedule_uid_unique").on(table.scheduleCronTaskUid)]
    );
    recentSearches = mysqlTable(
      "recent_searches",
      {
        id: varchar("id", { length: 64 }).primaryKey(),
        userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
        query: varchar("query", { length: 120 }).notNull(),
        kind: mysqlEnum("kind", ["user", "post", "hashtag", "all"]).default("all").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [uniqueIndex("recent_searches_user_query_kind_unique").on(table.userId, table.query, table.kind), index("recent_searches_user_created_idx").on(table.userId, table.createdAt)]
    );
    storyArchives = mysqlTable(
      "story_archives",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        originalStoryId: varchar("originalStoryId", { length: 36 }).notNull().unique(),
        ownerAccountId: varchar("ownerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
        caption: varchar("caption", { length: 500 }),
        originalCreatedAt: timestamp("originalCreatedAt").notNull(),
        expiredAt: timestamp("expiredAt").notNull(),
        archivedAt: timestamp("archivedAt").defaultNow().notNull()
      },
      (table) => [index("story_archives_owner_archived_idx").on(table.ownerAccountId, table.archivedAt)]
    );
    analyticsEvents = mysqlTable(
      "analytics_events",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        eventType: varchar("eventType", { length: 64 }).notNull(),
        userId: int("userId").references(() => users.id, { onDelete: "set null" }),
        accountId: varchar("accountId", { length: 36 }).references(() => accounts.id, { onDelete: "set null" }),
        gender: mysqlEnum("gender", ["male", "female", "non_binary", "undisclosed"]).default("undisclosed").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("analytics_events_type_created_idx").on(table.eventType, table.createdAt), index("analytics_events_created_idx").on(table.createdAt)]
    );
    feedbackSubmissions = mysqlTable(
      "feedback_submissions",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
        type: mysqlEnum("type", ["rating", "feedback", "bug"]).notNull(),
        rating: int("rating"),
        subject: varchar("subject", { length: 160 }).notNull(),
        body: varchar("body", { length: 3e3 }).notNull(),
        status: mysqlEnum("status", ["open", "reviewing", "resolved", "closed"]).default("open").notNull(),
        reviewerUserId: int("reviewerUserId").references(() => users.id, { onDelete: "set null" }),
        adminNotes: varchar("adminNotes", { length: 1e3 }),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [index("feedback_status_created_idx").on(table.status, table.createdAt), index("feedback_user_created_idx").on(table.userId, table.createdAt)]
    );
    userSafetyRelations = mysqlTable(
      "user_safety_relations",
      {
        actorAccountId: varchar("actorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        targetAccountId: varchar("targetAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        relation: mysqlEnum("relation", ["blocked", "muted"]).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        expiresAt: timestamp("expiresAt")
      },
      (table) => [primaryKey({ columns: [table.actorAccountId, table.targetAccountId, table.relation] }), index("safety_relations_target_idx").on(table.targetAccountId, table.relation)]
    );
    conversationPresence = mysqlTable(
      "conversation_presence",
      {
        conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        isTyping: boolean("isTyping").default(false).notNull(),
        lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.conversationId, table.accountId] }), index("conversation_presence_seen_idx").on(table.conversationId, table.lastSeenAt)]
    );
    conversationPreferences = mysqlTable(
      "conversation_preferences",
      {
        conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        theme: mysqlEnum("theme", ["velora", "orchid", "midnight", "ocean", "sunset"]).default("velora").notNull(),
        backgroundMediaId: varchar("backgroundMediaId", { length: 36 }).references(() => mediaAssets.id, { onDelete: "set null" }),
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.conversationId, table.accountId] })]
    );
    messageReactions = mysqlTable(
      "message_reactions",
      {
        messageId: varchar("messageId", { length: 36 }).notNull().references(() => messages.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        reaction: varchar("reaction", { length: 32 }).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.messageId, table.accountId] })]
    );
    polls = mysqlTable(
      "polls",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        messageId: varchar("messageId", { length: 36 }).notNull().unique().references(() => messages.id, { onDelete: "cascade" }),
        question: varchar("question", { length: 300 }).notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      }
    );
    pollOptions = mysqlTable(
      "poll_options",
      {
        id: int("id").autoincrement().primaryKey(),
        pollId: varchar("pollId", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
        label: varchar("label", { length: 160 }).notNull(),
        position: int("position").notNull()
      },
      (table) => [uniqueIndex("poll_options_position_unique").on(table.pollId, table.position)]
    );
    pollVotes = mysqlTable(
      "poll_votes",
      {
        pollId: varchar("pollId", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
        optionId: int("optionId").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [primaryKey({ columns: [table.pollId, table.accountId] }), index("poll_votes_option_idx").on(table.optionId)]
    );
    adminVerificationReviews = mysqlTable(
      "admin_verification_reviews",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
        reviewerUserId: int("reviewerUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
        decision: mysqlEnum("decision", ["approved", "rejected", "revoked"]).notNull(),
        reason: varchar("reason", { length: 1e3 }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => [index("verification_reviews_account_created_idx").on(table.accountId, table.createdAt)]
    );
  }
});

// server/_core/index.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
init_schema();
import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/services/adminAllowlist.ts
function normalize(value) {
  return (value ?? "").trim().toLocaleLowerCase();
}
function getAdminAllowlist() {
  return (process.env.VELORA_ADMIN_ALLOWLIST ?? "").split(",").map(normalize).filter(Boolean);
}
function isAdminAllowlisted(identity) {
  const allowlist = getAdminAllowlist();
  if (!allowlist.length) return false;
  const email = normalize(identity.email);
  const username = normalize(identity.username);
  return email.length > 0 && allowlist.includes(email) || username.length > 0 && allowlist.includes(username);
}
function shouldBootstrapAdmin(identity) {
  return isAdminAllowlisted(identity);
}

// server/db.ts
var database = null;
async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    database = drizzle(process.env.DATABASE_URL);
  }
  return database;
}
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The Velora database is not available.");
  return db;
}
function createId(prefix = "") {
  return `${prefix}${nanoid(24)}`;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert.");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date() };
  const updateSet = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"]) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  const isConfiguredAdmin = shouldBootstrapAdmin({ email: user.email, username: user.name });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId || isConfiguredAdmin ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function ensureUserSettings(userId) {
  const db = await requireDb();
  await db.insert(userSettings).values({ userId }).onDuplicateKeyUpdate({ set: { updatedAt: /* @__PURE__ */ new Date() } });
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0];
}
async function listAccountsForUser(userId) {
  const db = await requireDb();
  return db.select().from(accounts).where(eq(accounts.ownerUserId, userId));
}
async function getOwnedAccount(userId, accountId) {
  const db = await requireDb();
  const result = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.ownerUserId, userId))).limit(1);
  return result[0];
}
async function getActiveAccountForUser(userId) {
  const db = await requireDb();
  const settings = await ensureUserSettings(userId);
  if (settings?.activeAccountId) {
    const selected = await getOwnedAccount(userId, settings.activeAccountId);
    if (selected?.status === "active") return selected;
  }
  const fallback = await db.select().from(accounts).where(and(eq(accounts.ownerUserId, userId), eq(accounts.status, "active"))).limit(1);
  const account = fallback[0];
  if (account) {
    await db.update(userSettings).set({ activeAccountId: account.id }).where(eq(userSettings.userId, userId));
  }
  return account;
}
async function setActiveAccount(userId, accountId) {
  const account = await getOwnedAccount(userId, accountId);
  if (!account || account.status !== "active") return void 0;
  const db = await requireDb();
  await db.insert(userSettings).values({ userId, activeAccountId: accountId }).onDuplicateKeyUpdate({
    set: { activeAccountId: accountId }
  });
  return account;
}
async function assertOwnedMedia(userId, mediaIds, scope) {
  const db = await requireDb();
  if (!mediaIds.length) return [];
  const rows = await db.select().from(mediaAssets).where(and(eq(mediaAssets.ownerUserId, userId), eq(mediaAssets.scope, scope)));
  const selected = rows.filter((row) => mediaIds.includes(row.id));
  if (selected.length !== mediaIds.length) throw new Error("One or more selected files are unavailable for this action.");
  return selected;
}
async function consumeRateLimit(userId, action, maximum, windowMs) {
  const db = await requireDb();
  const windowStartedAt = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const id = `${userId}:${action}:${windowStartedAt.getTime()}`;
  const existing = await db.select().from(rateLimitEvents).where(eq(rateLimitEvents.id, id)).limit(1);
  if (existing[0] && existing[0].count >= maximum) return false;
  if (existing[0]) {
    await db.update(rateLimitEvents).set({ count: sql`${rateLimitEvents.count} + 1` }).where(and(eq(rateLimitEvents.id, id), gt(rateLimitEvents.count, 0)));
  } else {
    await db.insert(rateLimitEvents).values({ id, userId, action, windowStartedAt, count: 1 });
  }
  return true;
}
async function createNotification(input) {
  if (input.actorAccountId && input.actorAccountId === input.recipientAccountId) return;
  const db = await requireDb();
  await db.insert(notifications).values({ id: createId("ntf_"), ...input });
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/accounts.ts
init_schema();
import { and as and2, eq as eq2, inArray, ne } from "drizzle-orm";
import { z as z2 } from "zod";

// shared/velora.ts
var VELORA_BRAND = {
  name: "Velora",
  tagline: "Share with intention.",
  storyLifetimeHours: 24,
  maxUploadBytes: 50 * 1024 * 1024
};
var MEDIA_SCOPES = ["profile", "post", "story", "message"];
var IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
var VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
var DOCUMENT_MIME_TYPES = ["application/pdf"];
var AUDIO_MIME_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];
var ALLOWED_MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES, ...AUDIO_MIME_TYPES];
var MAX_CAPTION_LENGTH = 2200;
var MAX_BIO_LENGTH = 160;
var MAX_COMMENT_LENGTH = 1e3;
var MAX_MESSAGE_LENGTH = 4e3;

// server/services/platform.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
function sanitizePlainText(value, maximum) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}
function normalizeUsername(value) {
  return value.trim().toLowerCase();
}
function extractHashtags(value) {
  const names = [];
  const expression = /(^|\s)#([a-zA-Z0-9_]{2,80})/g;
  let match;
  while ((match = expression.exec(value)) !== null) {
    const name = match[2].toLowerCase();
    if (names.indexOf(name) === -1) names.push(name);
  }
  return names;
}
function extractMentions(value) {
  const names = [];
  const expression = /(^|\s)@([a-z0-9_.]{3,30})/gi;
  let match;
  while ((match = expression.exec(value)) !== null) {
    const name = match[2].toLowerCase();
    if (names.indexOf(name) === -1) names.push(name);
  }
  return names;
}
async function requireActiveAccount(userId) {
  const account = await getActiveAccountForUser(userId);
  if (!account) {
    throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "Create a Velora profile before using this feature." });
  }
  if (account.status !== "active") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "This Velora account is not active." });
  }
  return account;
}
async function enforceRateLimit(userId, action, maximum, windowMs) {
  const accepted = await consumeRateLimit(userId, action, maximum, windowMs);
  if (!accepted) throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying that again." });
}
async function requireOwnedMedia(userId, ids, scope) {
  try {
    return await assertOwnedMedia(userId, ids, scope);
  } catch (error) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Selected media is not available."
    });
  }
}
async function notifySocialEvent(input) {
  await createNotification(input);
}
async function alertOwnerOnCriticalEvent(title, content) {
  if (process.env.VELORA_OWNER_ALERTS !== "enabled") return false;
  return notifyOwner({ title, content });
}

// server/routers/accounts.ts
var usernameSchema = z2.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/, "Use letters, numbers, periods, or underscores.");
var displayNameSchema = z2.string().trim().min(1).max(80);
var cropSchema = z2.object({ scale: z2.number().min(0.5).max(4), x: z2.number().min(-1).max(1), y: z2.number().min(-1).max(1), rotation: z2.number().min(-180).max(180) });
var dateOfBirthSchema = z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").nullable().optional();
async function accountSummaries(userId) {
  const db = await requireDb();
  const ownedAccounts = await listAccountsForUser(userId);
  const ids = ownedAccounts.map((account) => account.id);
  const profileRows = ids.length ? await db.select().from(profiles).where(inArray(profiles.accountId, ids)) : [];
  const settings = await ensureUserSettings(userId);
  return {
    activeAccountId: settings?.activeAccountId ?? null,
    theme: settings?.theme ?? "system",
    accounts: ownedAccounts.map((account) => ({ ...account, profile: profileRows.find((profile) => profile.accountId === account.id) ?? null }))
  };
}
var accountsRouter = router({
  overview: protectedProcedure.query(({ ctx }) => accountSummaries(ctx.user.id)),
  create: protectedProcedure.input(z2.object({ username: usernameSchema, displayName: displayNameSchema })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const username = normalizeUsername(input.username);
    const duplicate = await db.select({ id: accounts.id }).from(accounts).where(eq2(accounts.username, username)).limit(1);
    if (duplicate[0]) throw new Error("That username is already taken.");
    const id = createId("acc_");
    await db.insert(accounts).values({ id, ownerUserId: ctx.user.id, username, displayName: sanitizePlainText(input.displayName, 80) });
    await db.insert(profiles).values({ accountId: id, bio: "" });
    await db.insert(userSettings).values({ userId: ctx.user.id, activeAccountId: id }).onDuplicateKeyUpdate({ set: { activeAccountId: id } });
    return accountSummaries(ctx.user.id);
  }),
  switchActive: protectedProcedure.input(z2.object({ accountId: z2.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await setActiveAccount(ctx.user.id, input.accountId);
    if (!account) throw new Error("That account is unavailable.");
    return accountSummaries(ctx.user.id);
  }),
  updateActiveProfile: protectedProcedure.input(z2.object({
    username: usernameSchema.optional(),
    displayName: displayNameSchema.optional(),
    bio: z2.string().max(MAX_BIO_LENGTH).optional(),
    website: z2.string().trim().url().max(500).or(z2.literal("")).optional(),
    location: z2.string().trim().max(120).optional(),
    avatarMediaId: z2.string().min(4).max(36).nullable().optional(),
    coverMediaId: z2.string().min(4).max(36).nullable().optional(),
    avatarCrop: cropSchema.nullable().optional(),
    coverCrop: cropSchema.nullable().optional(),
    contactEmail: z2.string().trim().email().max(320).or(z2.literal("")).nullable().optional(),
    dateOfBirth: dateOfBirthSchema,
    isPrivate: z2.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const active = await getActiveAccountForUser(ctx.user.id);
    if (!active) throw new Error("Create a Velora account before updating a profile.");
    if (input.avatarMediaId) await requireOwnedMedia(ctx.user.id, [input.avatarMediaId], "profile");
    if (input.coverMediaId) await requireOwnedMedia(ctx.user.id, [input.coverMediaId], "profile");
    const dateOfBirth = input.dateOfBirth === void 0 || input.dateOfBirth === null ? input.dateOfBirth : /* @__PURE__ */ new Date(`${input.dateOfBirth}T00:00:00.000Z`);
    if (dateOfBirth instanceof Date && (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now())) throw new Error("Date of birth must be a valid date in the past.");
    if (input.username) {
      const username = normalizeUsername(input.username);
      const duplicate = await db.select({ id: accounts.id }).from(accounts).where(and2(eq2(accounts.username, username), ne(accounts.id, active.id))).limit(1);
      if (duplicate[0]) throw new Error("That username is already taken.");
    }
    await db.update(accounts).set({
      ...input.username ? { username: normalizeUsername(input.username) } : {},
      ...input.displayName ? { displayName: sanitizePlainText(input.displayName, 80) } : {},
      ...input.isPrivate !== void 0 ? { isPrivate: input.isPrivate } : {}
    }).where(eq2(accounts.id, active.id));
    await db.insert(profiles).values({
      accountId: active.id,
      bio: input.bio === void 0 ? "" : sanitizePlainText(input.bio, MAX_BIO_LENGTH),
      website: input.website ? input.website : null,
      location: input.location ? sanitizePlainText(input.location, 120) : null,
      avatarMediaId: input.avatarMediaId ?? null
    }).onDuplicateKeyUpdate({
      set: {
        ...input.bio !== void 0 ? { bio: sanitizePlainText(input.bio, MAX_BIO_LENGTH) } : {},
        ...input.website !== void 0 ? { website: input.website || null } : {},
        ...input.location !== void 0 ? { location: input.location ? sanitizePlainText(input.location, 120) : null } : {},
        ...input.avatarMediaId !== void 0 ? { avatarMediaId: input.avatarMediaId } : {},
        ...input.coverMediaId !== void 0 ? { coverMediaId: input.coverMediaId } : {},
        ...input.avatarCrop !== void 0 ? { avatarCrop: input.avatarCrop } : {},
        ...input.coverCrop !== void 0 ? { coverCrop: input.coverCrop } : {},
        ...input.contactEmail !== void 0 ? { contactEmail: input.contactEmail || null } : {},
        ...input.dateOfBirth !== void 0 ? { dateOfBirth: dateOfBirth ?? null } : {}
      }
    });
    return accountSummaries(ctx.user.id);
  }),
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => ensureUserSettings(ctx.user.id)),
    update: protectedProcedure.input(z2.object({
      theme: z2.enum(["light", "dark", "system"]).optional(),
      allowMentions: z2.enum(["everyone", "following", "none"]).optional(),
      allowMessages: z2.enum(["everyone", "following", "none"]).optional(),
      notifyLikes: z2.boolean().optional(),
      notifyComments: z2.boolean().optional(),
      notifyFollows: z2.boolean().optional(),
      notifyMessages: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.insert(userSettings).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: input });
      return ensureUserSettings(ctx.user.id);
    })
  }),
  brand: protectedProcedure.query(() => VELORA_BRAND),
  ownedAccount: protectedProcedure.input(z2.object({ accountId: z2.string() })).query(({ ctx, input }) => getOwnedAccount(ctx.user.id, input.accountId))
});

// server/routers/sessions.ts
init_schema();
import { and as and3, desc, eq as eq3, isNull } from "drizzle-orm";
import { z as z3 } from "zod";
var sessionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(accountSessions).where(and3(eq3(accountSessions.userId, ctx.user.id), isNull(accountSessions.revokedAt))).orderBy(desc(accountSessions.lastActiveAt));
  }),
  register: protectedProcedure.input(z3.object({ deviceId: z3.string().min(12).max(64), deviceLabel: z3.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select().from(accountSessions).where(eq3(accountSessions.id, input.deviceId)).limit(1);
    if (existing[0] && existing[0].userId !== ctx.user.id) throw new Error("This device identifier cannot be used.");
    if (existing[0]?.revokedAt) throw new Error("This device session was revoked. Restart the application to create a new session.");
    if (existing[0]) {
      await db.update(accountSessions).set({ lastActiveAt: /* @__PURE__ */ new Date(), deviceLabel: sanitizePlainText(input.deviceLabel, 120) }).where(eq3(accountSessions.id, input.deviceId));
      return existing[0];
    }
    const id = input.deviceId || createId("ses_");
    await db.insert(accountSessions).values({ id, userId: ctx.user.id, deviceLabel: sanitizePlainText(input.deviceLabel, 120), userAgent: sanitizePlainText(ctx.req.headers["user-agent"] || "", 500) || null });
    const created = await db.select().from(accountSessions).where(eq3(accountSessions.id, id)).limit(1);
    return created[0];
  }),
  revoke: protectedProcedure.input(z3.object({ sessionId: z3.string().min(12).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(accountSessions).set({ revokedAt: /* @__PURE__ */ new Date() }).where(and3(eq3(accountSessions.id, input.sessionId), eq3(accountSessions.userId, ctx.user.id), isNull(accountSessions.revokedAt)));
    return { success: true };
  })
});

// server/routers/posts.ts
init_schema();
import { and as and4, desc as desc2, eq as eq4, inArray as inArray2, isNull as isNull2, sql as sql2 } from "drizzle-orm";
import { z as z4 } from "zod";
var postInput = z4.object({
  caption: z4.string().max(MAX_CAPTION_LENGTH).default(""),
  location: z4.string().trim().max(120).optional(),
  visibility: z4.enum(["public", "followers"]).default("public"),
  mediaIds: z4.array(z4.string().min(4).max(36)).min(1).max(10)
});
async function getReadablePost(postId, viewerAccountId) {
  const db = await requireDb();
  const row = await db.select({ post: posts, account: accounts }).from(posts).innerJoin(accounts, eq4(posts.authorAccountId, accounts.id)).where(and4(eq4(posts.id, postId), isNull2(posts.deletedAt))).limit(1);
  if (!row[0]) return void 0;
  const post = row[0].post;
  if (row[0].account.status !== "active") return void 0;
  if (post.visibility === "followers" && viewerAccountId !== post.authorAccountId) {
    if (!viewerAccountId) return void 0;
    const relationship = await db.select().from(follows).where(and4(eq4(follows.followerAccountId, viewerAccountId), eq4(follows.followingAccountId, post.authorAccountId), eq4(follows.status, "accepted"))).limit(1);
    if (!relationship[0]) return void 0;
  }
  return row[0];
}
async function hydratePosts(postRows, viewerAccountId) {
  const db = await requireDb();
  const ids = postRows.map((item) => item.post.id);
  if (!ids.length) return [];
  const mediaRows = await db.select({ postId: postMedia.postId, position: postMedia.position, media: mediaAssets }).from(postMedia).innerJoin(mediaAssets, eq4(postMedia.mediaId, mediaAssets.id)).where(inArray2(postMedia.postId, ids));
  const commentRows = await db.select({ postId: comments.postId, count: sql2`count(*)` }).from(comments).where(and4(inArray2(comments.postId, ids), isNull2(comments.deletedAt))).groupBy(comments.postId);
  const viewerLikes = viewerAccountId ? await db.select({ postId: likes.postId }).from(likes).where(and4(eq4(likes.accountId, viewerAccountId), inArray2(likes.postId, ids))) : [];
  const viewerSaves = viewerAccountId ? await db.select({ postId: savedPosts.postId }).from(savedPosts).where(and4(eq4(savedPosts.accountId, viewerAccountId), inArray2(savedPosts.postId, ids))) : [];
  return postRows.map(({ post, account }) => ({
    ...post,
    author: { id: account.id, username: account.username, displayName: account.displayName },
    media: mediaRows.filter((item) => item.postId === post.id).sort((a, b) => a.position - b.position).map((item) => item.media),
    commentCount: Number(commentRows.find((item) => item.postId === post.id)?.count ?? post.commentCount),
    likedByViewer: viewerLikes.some((item) => item.postId === post.id),
    savedByViewer: viewerSaves.some((item) => item.postId === post.id)
  }));
}
var postsRouter = router({
  feed: publicProcedure.input(z4.object({ limit: z4.number().int().min(1).max(60).default(24), mode: z4.enum(["home", "explore", "saved"]).default("home") })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    if (input.mode === "saved") {
      if (!viewer) return [];
      const saved = await db.select({ post: posts, account: accounts }).from(savedPosts).innerJoin(posts, eq4(savedPosts.postId, posts.id)).innerJoin(accounts, eq4(posts.authorAccountId, accounts.id)).where(and4(eq4(savedPosts.accountId, viewer.id), isNull2(posts.deletedAt))).orderBy(desc2(savedPosts.createdAt)).limit(input.limit);
      return hydratePosts(saved, viewer.id);
    }
    const all = await db.select({ post: posts, account: accounts }).from(posts).innerJoin(accounts, eq4(posts.authorAccountId, accounts.id)).where(and4(isNull2(posts.deletedAt), eq4(accounts.status, "active"))).orderBy(desc2(posts.createdAt)).limit(60);
    const following = viewer ? await db.select({ followingAccountId: follows.followingAccountId }).from(follows).where(and4(eq4(follows.followerAccountId, viewer.id), eq4(follows.status, "accepted"))) : [];
    const allowedAuthors = following.map((item) => item.followingAccountId).concat(viewer ? [viewer.id] : []);
    const visible = all.filter((item) => item.post.visibility === "public" || viewer && allowedAuthors.indexOf(item.post.authorAccountId) !== -1);
    const selected = input.mode === "home" && viewer ? visible.filter((item) => allowedAuthors.indexOf(item.post.authorAccountId) !== -1).concat(visible.filter((item) => allowedAuthors.indexOf(item.post.authorAccountId) === -1)).slice(0, input.limit) : visible.slice(0, input.limit);
    return hydratePosts(selected, viewer?.id);
  }),
  byId: publicProcedure.input(z4.object({ postId: z4.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    const row = await getReadablePost(input.postId, viewer?.id);
    if (!row) return null;
    const [hydrated] = await hydratePosts([row], viewer?.id);
    return hydrated;
  }),
  create: protectedProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_create", 15, 60 * 60 * 1e3);
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const caption = sanitizePlainText(input.caption, MAX_CAPTION_LENGTH);
    await requireOwnedMedia(ctx.user.id, input.mediaIds, "post");
    const postId = createId("pst_");
    await db.transaction(async (transaction) => {
      await transaction.insert(posts).values({
        id: postId,
        authorAccountId: account.id,
        caption,
        location: input.location ? sanitizePlainText(input.location, 120) : null,
        visibility: input.visibility
      });
      await transaction.insert(postMedia).values(input.mediaIds.map((mediaId, position) => ({ id: createId("pmd_"), postId, mediaId, position })));
    });
    for (const normalizedName of extractHashtags(caption)) {
      const existing = await db.select().from(hashtags).where(eq4(hashtags.normalizedName, normalizedName)).limit(1);
      const hashtagId = existing[0]?.id ?? createId("tag_");
      if (!existing[0]) await db.insert(hashtags).values({ id: hashtagId, normalizedName, displayName: normalizedName });
      await db.insert(postHashtags).values({ postId, hashtagId }).onDuplicateKeyUpdate({ set: { postId } });
    }
    const mentionNames = extractMentions(caption);
    if (mentionNames.length) {
      const mentioned = await db.select().from(accounts).where(inArray2(accounts.username, mentionNames));
      for (const mentionedAccount of mentioned) {
        await db.insert(postMentions).values({ postId, accountId: mentionedAccount.id }).onDuplicateKeyUpdate({ set: { postId } });
        await notifySocialEvent({ recipientAccountId: mentionedAccount.id, actorAccountId: account.id, type: "mention", resourceType: "post", resourceId: postId, body: `${account.displayName} mentioned you in a post.` });
      }
    }
    const result = await getReadablePost(postId, account.id);
    const [hydrated] = result ? await hydratePosts([result], account.id) : [];
    return hydrated;
  }),
  update: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36), caption: z4.string().max(MAX_CAPTION_LENGTH), location: z4.string().max(120).optional(), visibility: z4.enum(["public", "followers"]).optional() })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const post = await db.select().from(posts).where(and4(eq4(posts.id, input.postId), eq4(posts.authorAccountId, account.id), isNull2(posts.deletedAt))).limit(1);
    if (!post[0]) throw new Error("You can only edit your own available posts.");
    await db.update(posts).set({ caption: sanitizePlainText(input.caption, MAX_CAPTION_LENGTH), location: input.location ? sanitizePlainText(input.location, 120) : null, ...input.visibility ? { visibility: input.visibility } : {} }).where(eq4(posts.id, input.postId));
    return { success: true };
  }),
  remove: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(posts).set({ deletedAt: /* @__PURE__ */ new Date() }).where(and4(eq4(posts.id, input.postId), eq4(posts.authorAccountId, account.id), isNull2(posts.deletedAt)));
    return { success: true };
  }),
  toggleLike: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_like", 180, 60 * 60 * 1e3);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const existing = await db.select().from(likes).where(and4(eq4(likes.postId, input.postId), eq4(likes.accountId, account.id))).limit(1);
    if (existing[0]) {
      await db.delete(likes).where(and4(eq4(likes.postId, input.postId), eq4(likes.accountId, account.id)));
      await db.update(posts).set({ likeCount: sql2`greatest(${posts.likeCount} - 1, 0)` }).where(eq4(posts.id, input.postId));
      return { liked: false };
    }
    await db.insert(likes).values({ postId: input.postId, accountId: account.id });
    await db.update(posts).set({ likeCount: sql2`${posts.likeCount} + 1` }).where(eq4(posts.id, input.postId));
    await notifySocialEvent({ recipientAccountId: post.post.authorAccountId, actorAccountId: account.id, type: "like", resourceType: "post", resourceId: input.postId, body: `${account.displayName} liked your post.` });
    return { liked: true };
  }),
  toggleSave: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const existing = await db.select().from(savedPosts).where(and4(eq4(savedPosts.postId, input.postId), eq4(savedPosts.accountId, account.id))).limit(1);
    if (existing[0]) {
      await db.delete(savedPosts).where(and4(eq4(savedPosts.postId, input.postId), eq4(savedPosts.accountId, account.id)));
      await db.update(posts).set({ saveCount: sql2`greatest(${posts.saveCount} - 1, 0)` }).where(eq4(posts.id, input.postId));
      return { saved: false };
    }
    await db.insert(savedPosts).values({ postId: input.postId, accountId: account.id });
    await db.update(posts).set({ saveCount: sql2`${posts.saveCount} + 1` }).where(eq4(posts.id, input.postId));
    return { saved: true };
  }),
  share: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36), channel: z4.enum(["copy_link", "message", "external"]).default("copy_link") })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "post_share", 80, 60 * 60 * 1e3);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    await db.insert(postShares).values({ id: createId("shr_"), postId: input.postId, accountId: account.id, channel: input.channel });
    await db.update(posts).set({ shareCount: sql2`${posts.shareCount} + 1` }).where(eq4(posts.id, input.postId));
    return { success: true };
  })
});
var commentsRouter = router({
  list: publicProcedure.input(z4.object({ postId: z4.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    const post = await getReadablePost(input.postId, viewer?.id);
    if (!post) return [];
    const db = await requireDb();
    return db.select({ comment: comments, author: accounts }).from(comments).innerJoin(accounts, eq4(comments.authorAccountId, accounts.id)).where(and4(eq4(comments.postId, input.postId), isNull2(comments.deletedAt))).orderBy(desc2(comments.createdAt));
  }),
  create: protectedProcedure.input(z4.object({ postId: z4.string().min(4).max(36), body: z4.string().min(1).max(MAX_COMMENT_LENGTH), parentCommentId: z4.string().min(4).max(36).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "comment_create", 60, 60 * 60 * 1e3);
    const account = await requireActiveAccount(ctx.user.id);
    const post = await getReadablePost(input.postId, account.id);
    if (!post) throw new Error("This post is not available.");
    const db = await requireDb();
    const id = createId("cmt_");
    await db.insert(comments).values({ id, postId: input.postId, authorAccountId: account.id, parentCommentId: input.parentCommentId ?? null, body: sanitizePlainText(input.body, MAX_COMMENT_LENGTH) });
    await db.update(posts).set({ commentCount: sql2`${posts.commentCount} + 1` }).where(eq4(posts.id, input.postId));
    await notifySocialEvent({ recipientAccountId: post.post.authorAccountId, actorAccountId: account.id, type: "comment", resourceType: "post", resourceId: input.postId, body: `${account.displayName} commented on your post.` });
    return { id };
  }),
  remove: protectedProcedure.input(z4.object({ commentId: z4.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const existing = await db.select({ comment: comments, post: posts }).from(comments).innerJoin(posts, eq4(comments.postId, posts.id)).where(and4(eq4(comments.id, input.commentId), isNull2(comments.deletedAt))).limit(1);
    if (!existing[0]) throw new Error("That comment is unavailable.");
    if (existing[0].comment.authorAccountId !== account.id && existing[0].post.authorAccountId !== account.id) throw new Error("You are not allowed to delete this comment.");
    await db.update(comments).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq4(comments.id, input.commentId));
    await db.update(posts).set({ commentCount: sql2`greatest(${posts.commentCount} - 1, 0)` }).where(eq4(posts.id, existing[0].comment.postId));
    return { success: true };
  })
});

// server/routers/profiles.ts
init_schema();
import { and as and5, count, desc as desc3, eq as eq5, inArray as inArray3, isNull as isNull3 } from "drizzle-orm";
import { z as z5 } from "zod";
async function accountWithProfile(username) {
  const db = await requireDb();
  const result = await db.select({ account: accounts, profile: profiles }).from(accounts).leftJoin(profiles, eq5(accounts.id, profiles.accountId)).where(eq5(accounts.username, username.toLowerCase())).limit(1);
  const target = result[0];
  if (!target) return void 0;
  const mediaIds = [target.profile?.avatarMediaId, target.profile?.coverMediaId].filter((id) => Boolean(id));
  const media = mediaIds.length ? await db.select().from(mediaAssets).where(inArray3(mediaAssets.id, mediaIds)) : [];
  const avatar = media.find((item) => item.id === target.profile?.avatarMediaId);
  const cover = media.find((item) => item.id === target.profile?.coverMediaId);
  return { ...target, profile: target.profile ? { ...target.profile, avatarUrl: avatar?.url ?? null, coverUrl: cover?.url ?? null, avatarMedia: avatar ?? null, coverMedia: cover ?? null } : null };
}
async function accountStatistics(accountId) {
  const db = await requireDb();
  const [postsTotal] = await db.select({ value: count() }).from(posts).where(and5(eq5(posts.authorAccountId, accountId), isNull3(posts.deletedAt)));
  const [followersTotal] = await db.select({ value: count() }).from(follows).where(and5(eq5(follows.followingAccountId, accountId), eq5(follows.status, "accepted")));
  const [followingTotal] = await db.select({ value: count() }).from(follows).where(and5(eq5(follows.followerAccountId, accountId), eq5(follows.status, "accepted")));
  return { postCount: Number(postsTotal?.value ?? 0), followerCount: Number(followersTotal?.value ?? 0), followingCount: Number(followingTotal?.value ?? 0) };
}
var profilesRouter = router({
  byUsername: publicProcedure.input(z5.object({ username: z5.string().trim().min(3).max(30) })).query(async ({ ctx, input }) => {
    const target = await accountWithProfile(input.username);
    if (!target || target.account.status !== "active") return null;
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    const relationship = viewer ? await (await requireDb()).select().from(follows).where(and5(eq5(follows.followerAccountId, viewer.id), eq5(follows.followingAccountId, target.account.id))).limit(1) : [];
    const isOwner = viewer?.id === target.account.id;
    const isAllowed = !target.account.isPrivate || isOwner || relationship[0]?.status === "accepted";
    return {
      account: target.account,
      profile: target.profile,
      statistics: await accountStatistics(target.account.id),
      relationship: relationship[0]?.status ?? null,
      isOwner,
      isAllowed
    };
  }),
  posts: publicProcedure.input(z5.object({ username: z5.string().trim().min(3).max(30), limit: z5.number().int().min(1).max(60).default(30) })).query(async ({ ctx, input }) => {
    const target = await accountWithProfile(input.username);
    if (!target || target.account.status !== "active") return [];
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    if (target.account.isPrivate && viewer?.id !== target.account.id) {
      const accepted = viewer ? await (await requireDb()).select().from(follows).where(and5(eq5(follows.followerAccountId, viewer.id), eq5(follows.followingAccountId, target.account.id), eq5(follows.status, "accepted"))).limit(1) : [];
      if (!accepted[0]) return [];
    }
    const db = await requireDb();
    const postRows = await db.select().from(posts).where(and5(eq5(posts.authorAccountId, target.account.id), isNull3(posts.deletedAt))).orderBy(desc3(posts.createdAt)).limit(input.limit);
    const ids = postRows.map((post) => post.id);
    const assets = ids.length ? await db.select({ postId: postMedia.postId, position: postMedia.position, media: mediaAssets }).from(postMedia).innerJoin(mediaAssets, eq5(postMedia.mediaId, mediaAssets.id)).where(inArray3(postMedia.postId, ids)) : [];
    return postRows.map((post) => ({ ...post, media: assets.filter((asset) => asset.postId === post.id).sort((a, b) => a.position - b.position).map((asset) => asset.media) }));
  }),
  toggleFollow: protectedProcedure.input(z5.object({ accountId: z5.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "follow_toggle", 100, 60 * 60 * 1e3);
    const actor = await requireActiveAccount(ctx.user.id);
    if (actor.id === input.accountId) throw new Error("You cannot follow your own account.");
    const db = await requireDb();
    const target = await db.select().from(accounts).where(and5(eq5(accounts.id, input.accountId), eq5(accounts.status, "active"))).limit(1);
    if (!target[0]) throw new Error("This account is not available.");
    const current = await db.select().from(follows).where(and5(eq5(follows.followerAccountId, actor.id), eq5(follows.followingAccountId, input.accountId))).limit(1);
    if (current[0]) {
      await db.delete(follows).where(and5(eq5(follows.followerAccountId, actor.id), eq5(follows.followingAccountId, input.accountId)));
      return { following: false, requested: false };
    }
    const status = target[0].isPrivate ? "requested" : "accepted";
    await db.insert(follows).values({ followerAccountId: actor.id, followingAccountId: input.accountId, status });
    await notifySocialEvent({ recipientAccountId: input.accountId, actorAccountId: actor.id, type: "follow", resourceType: "account", resourceId: actor.id, body: status === "accepted" ? `${actor.displayName} started following you.` : `${actor.displayName} requested to follow you.` });
    return { following: status === "accepted", requested: status === "requested" };
  }),
  followers: publicProcedure.input(z5.object({ accountId: z5.string().min(4).max(36), limit: z5.number().int().min(1).max(100).default(40) })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ account: accounts, status: follows.status, createdAt: follows.createdAt }).from(follows).innerJoin(accounts, eq5(follows.followerAccountId, accounts.id)).where(and5(eq5(follows.followingAccountId, input.accountId), eq5(follows.status, "accepted"))).orderBy(desc3(follows.createdAt)).limit(input.limit);
    return rows.filter((row) => row.account.status === "active");
  }),
  following: publicProcedure.input(z5.object({ accountId: z5.string().min(4).max(36), limit: z5.number().int().min(1).max(100).default(40) })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ account: accounts, status: follows.status, createdAt: follows.createdAt }).from(follows).innerJoin(accounts, eq5(follows.followingAccountId, accounts.id)).where(and5(eq5(follows.followerAccountId, input.accountId), eq5(follows.status, "accepted"))).orderBy(desc3(follows.createdAt)).limit(input.limit);
    return rows.filter((row) => row.account.status === "active");
  }),
  pendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const rows = await db.select({ account: accounts }).from(follows).innerJoin(accounts, eq5(follows.followerAccountId, accounts.id)).where(and5(eq5(follows.followingAccountId, account.id), eq5(follows.status, "requested"))).orderBy(desc3(follows.createdAt));
    return rows;
  }),
  resolveRequest: protectedProcedure.input(z5.object({ accountId: z5.string().min(4).max(36), accepted: z5.boolean() })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const relationship = await db.select().from(follows).where(and5(eq5(follows.followingAccountId, account.id), eq5(follows.followerAccountId, input.accountId), eq5(follows.status, "requested"))).limit(1);
    if (!relationship[0]) throw new Error("That follow request is unavailable.");
    if (input.accepted) await db.update(follows).set({ status: "accepted" }).where(and5(eq5(follows.followingAccountId, account.id), eq5(follows.followerAccountId, input.accountId)));
    else await db.delete(follows).where(and5(eq5(follows.followingAccountId, account.id), eq5(follows.followerAccountId, input.accountId)));
    return { success: true };
  })
});

// server/routers/stories.ts
init_schema();
import { and as and6, desc as desc4, eq as eq6, gt as gt2, inArray as inArray4, isNull as isNull4 } from "drizzle-orm";
import { z as z6 } from "zod";
async function canAccessStory(storyId, viewerAccountId) {
  const db = await requireDb();
  const row = await db.select({ story: stories, author: accounts }).from(stories).innerJoin(accounts, eq6(stories.authorAccountId, accounts.id)).where(and6(eq6(stories.id, storyId), gt2(stories.expiresAt, /* @__PURE__ */ new Date()), isNull4(stories.deletedAt), eq6(accounts.status, "active"))).limit(1);
  if (!row[0]) return void 0;
  if (!row[0].author.isPrivate || viewerAccountId === row[0].author.id) return row[0];
  if (!viewerAccountId) return void 0;
  const relation = await db.select().from(follows).where(and6(eq6(follows.followerAccountId, viewerAccountId), eq6(follows.followingAccountId, row[0].author.id), eq6(follows.status, "accepted"))).limit(1);
  return relation[0] ? row[0] : void 0;
}
var storiesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const viewer = ctx.user ? await getActiveAccountForUser(ctx.user.id) : void 0;
    const rows = await db.select({ story: stories, author: accounts, media: mediaAssets }).from(stories).innerJoin(accounts, eq6(stories.authorAccountId, accounts.id)).innerJoin(mediaAssets, eq6(stories.mediaId, mediaAssets.id)).where(and6(gt2(stories.expiresAt, /* @__PURE__ */ new Date()), isNull4(stories.deletedAt), eq6(accounts.status, "active"))).orderBy(desc4(stories.createdAt)).limit(80);
    const followingRows = viewer ? await db.select({ id: follows.followingAccountId }).from(follows).where(and6(eq6(follows.followerAccountId, viewer.id), eq6(follows.status, "accepted"))) : [];
    const allowed = followingRows.map((row) => row.id).concat(viewer ? [viewer.id] : []);
    const visible = rows.filter((row) => !row.author.isPrivate || allowed.indexOf(row.author.id) !== -1);
    const storyIds = visible.map((row) => row.story.id);
    const viewed = viewer && storyIds.length ? await db.select({ storyId: storyViews.storyId }).from(storyViews).where(and6(eq6(storyViews.viewerAccountId, viewer.id), inArray4(storyViews.storyId, storyIds))) : [];
    return visible.map((row) => ({ ...row.story, author: row.author, media: row.media, viewedByViewer: viewed.some((item) => item.storyId === row.story.id) }));
  }),
  create: protectedProcedure.input(z6.object({ mediaId: z6.string().min(4).max(36), caption: z6.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "story_create", 30, 24 * 60 * 60 * 1e3);
    const account = await requireActiveAccount(ctx.user.id);
    await requireOwnedMedia(ctx.user.id, [input.mediaId], "story");
    const db = await requireDb();
    const id = createId("stry_");
    await db.insert(stories).values({ id, authorAccountId: account.id, mediaId: input.mediaId, caption: input.caption ? sanitizePlainText(input.caption, 500) : null, expiresAt: new Date(Date.now() + VELORA_BRAND.storyLifetimeHours * 60 * 60 * 1e3) });
    return { id, expiresAt: new Date(Date.now() + VELORA_BRAND.storyLifetimeHours * 60 * 60 * 1e3) };
  }),
  markViewed: protectedProcedure.input(z6.object({ storyId: z6.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const viewer = await requireActiveAccount(ctx.user.id);
    const story = await canAccessStory(input.storyId, viewer.id);
    if (!story) throw new Error("This story is no longer available.");
    const db = await requireDb();
    await db.insert(storyViews).values({ storyId: input.storyId, viewerAccountId: viewer.id }).onDuplicateKeyUpdate({ set: { viewedAt: /* @__PURE__ */ new Date() } });
    return { success: true };
  }),
  viewers: protectedProcedure.input(z6.object({ storyId: z6.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const owned = await db.select().from(stories).where(and6(eq6(stories.id, input.storyId), eq6(stories.authorAccountId, account.id))).limit(1);
    if (!owned[0]) throw new Error("You can only view analytics for your own story.");
    return db.select({ account: accounts, viewedAt: storyViews.viewedAt }).from(storyViews).innerJoin(accounts, eq6(storyViews.viewerAccountId, accounts.id)).where(eq6(storyViews.storyId, input.storyId)).orderBy(desc4(storyViews.viewedAt));
  }),
  remove: protectedProcedure.input(z6.object({ storyId: z6.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(stories).set({ deletedAt: /* @__PURE__ */ new Date() }).where(and6(eq6(stories.id, input.storyId), eq6(stories.authorAccountId, account.id), isNull4(stories.deletedAt)));
    return { success: true };
  })
});

// server/routers/messaging.ts
init_schema();
import { and as and7, desc as desc5, eq as eq7, gte, inArray as inArray5, isNull as isNull5, ne as ne2, or } from "drizzle-orm";
import { z as z7 } from "zod";
async function requireMembership(conversationId, accountId) {
  const db = await requireDb();
  const membership = await db.select().from(conversationMembers).where(and7(eq7(conversationMembers.conversationId, conversationId), eq7(conversationMembers.accountId, accountId))).limit(1);
  if (!membership[0]) throw new Error("You are not a member of this conversation.");
  return membership[0];
}
var messagingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const memberships = await db.select().from(conversationMembers).where(eq7(conversationMembers.accountId, active.id));
    const ids = memberships.map((member) => member.conversationId);
    if (!ids.length) return [];
    const rows = await db.select().from(conversations).where(inArray5(conversations.id, ids)).orderBy(desc5(conversations.lastMessageAt));
    const participants = await db.select({ conversationId: conversationMembers.conversationId, account: accounts }).from(conversationMembers).innerJoin(accounts, eq7(conversationMembers.accountId, accounts.id)).where(inArray5(conversationMembers.conversationId, ids));
    const messageRows = await db.select().from(messages).where(and7(inArray5(messages.conversationId, ids), ne2(messages.senderAccountId, active.id), isNull5(messages.deletedAt)));
    return rows.map((conversation) => {
      const lastReadAt = memberships.find((item) => item.conversationId === conversation.id)?.lastReadAt ?? null;
      const unreadCount = messageRows.filter((message) => message.conversationId === conversation.id && (!lastReadAt || message.createdAt > lastReadAt)).length;
      return { ...conversation, members: participants.filter((item) => item.conversationId === conversation.id).map((item) => item.account), lastReadAt, unreadCount };
    });
  }),
  startDirect: protectedProcedure.input(z7.object({ accountId: z7.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    if (active.id === input.accountId) throw new Error("You cannot start a conversation with the active account.");
    const db = await requireDb();
    const target = await db.select().from(accounts).where(and7(eq7(accounts.id, input.accountId), eq7(accounts.status, "active"))).limit(1);
    if (!target[0]) throw new Error("This account is not available.");
    const ownMemberships = await db.select().from(conversationMembers).where(eq7(conversationMembers.accountId, active.id));
    const existingIds = ownMemberships.map((member) => member.conversationId);
    if (existingIds.length) {
      const shared = await db.select({ conversationId: conversationMembers.conversationId }).from(conversationMembers).where(and7(eq7(conversationMembers.accountId, input.accountId), inArray5(conversationMembers.conversationId, existingIds)));
      if (shared.length) {
        const matched = await db.select().from(conversations).where(and7(inArray5(conversations.id, shared.map((item) => item.conversationId)), eq7(conversations.type, "direct"))).limit(1);
        if (matched[0]) return matched[0];
      }
    }
    const id = createId("cnv_");
    await db.transaction(async (transaction) => {
      await transaction.insert(conversations).values({ id, type: "direct" });
      await transaction.insert(conversationMembers).values([{ conversationId: id, accountId: active.id }, { conversationId: id, accountId: input.accountId }]);
    });
    return { id, type: "direct" };
  }),
  messages: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36), limit: z7.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const blocked = await db.select({ actor: userSafetyRelations.actorAccountId, target: userSafetyRelations.targetAccountId }).from(userSafetyRelations).where(and7(eq7(userSafetyRelations.relation, "blocked"), or(eq7(userSafetyRelations.targetAccountId, active.id), eq7(userSafetyRelations.actorAccountId, active.id))));
    const blockedPairs = new Set(blocked.map((row) => `${row.actor}:${row.target}`));
    const rows = await db.select({ message: messages, sender: accounts }).from(messages).innerJoin(accounts, eq7(messages.senderAccountId, accounts.id)).where(and7(eq7(messages.conversationId, input.conversationId), isNull5(messages.deletedAt))).orderBy(desc5(messages.createdAt)).limit(input.limit * 2);
    const visibleRows = rows.filter((row) => row.message.senderAccountId === active.id || !blockedPairs.has(`${row.message.senderAccountId}:${active.id}`));
    const ids = visibleRows.slice(0, input.limit).map((row) => row.message.id);
    await db.update(messages).set({ deliveredAt: /* @__PURE__ */ new Date() }).where(and7(eq7(messages.conversationId, input.conversationId), ne2(messages.senderAccountId, active.id), isNull5(messages.deliveredAt), isNull5(messages.deletedAt)));
    const attachmentRows = ids.length ? await db.select({ messageId: messageAttachments.messageId, media: mediaAssets }).from(messageAttachments).innerJoin(mediaAssets, eq7(messageAttachments.mediaId, mediaAssets.id)).where(inArray5(messageAttachments.messageId, ids)) : [];
    const reactionRows = ids.length ? await db.select().from(messageReactions).where(inArray5(messageReactions.messageId, ids)) : [];
    return visibleRows.slice(0, input.limit).reverse().map((row) => ({ ...row.message, sender: row.sender, attachments: attachmentRows.filter((item) => item.messageId === row.message.id).map((item) => item.media), reactions: reactionRows.filter((item) => item.messageId === row.message.id) }));
  }),
  send: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36), body: z7.string().max(MAX_MESSAGE_LENGTH).default(""), attachmentIds: z7.array(z7.string().min(4).max(36)).max(6).default([]), replyToMessageId: z7.string().min(4).max(36).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "message_send", 120, 60 * 60 * 1e3);
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const body = sanitizePlainText(input.body, MAX_MESSAGE_LENGTH);
    if (!body && !input.attachmentIds.length) throw new Error("Write a message or attach media before sending.");
    await requireOwnedMedia(ctx.user.id, input.attachmentIds, "message");
    const db = await requireDb();
    const members = await db.select().from(conversationMembers).where(eq7(conversationMembers.conversationId, input.conversationId));
    const recipient = members.find((member) => member.accountId !== active.id);
    const blockedForRecipient = recipient ? Boolean((await db.select().from(userSafetyRelations).where(and7(eq7(userSafetyRelations.relation, "blocked"), or(and7(eq7(userSafetyRelations.actorAccountId, active.id), eq7(userSafetyRelations.targetAccountId, recipient.accountId)), and7(eq7(userSafetyRelations.actorAccountId, recipient.accountId), eq7(userSafetyRelations.targetAccountId, active.id))))).limit(1))[0]) : false;
    const mutedForRecipient = recipient ? Boolean((await db.select().from(userSafetyRelations).where(and7(eq7(userSafetyRelations.actorAccountId, recipient.accountId), eq7(userSafetyRelations.targetAccountId, active.id), eq7(userSafetyRelations.relation, "muted"))).limit(1))[0]) : false;
    const id = createId("msg_");
    await db.transaction(async (transaction) => {
      await transaction.insert(messages).values({ id, conversationId: input.conversationId, senderAccountId: active.id, replyToMessageId: input.replyToMessageId ?? null, body, deliveredAt: blockedForRecipient ? null : /* @__PURE__ */ new Date() });
      if (input.attachmentIds.length) await transaction.insert(messageAttachments).values(input.attachmentIds.map((mediaId, position) => ({ id: createId("mat_"), messageId: id, mediaId, position })));
      await transaction.update(conversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, input.conversationId));
    });
    const allMembers = await db.select().from(conversationMembers).where(eq7(conversationMembers.conversationId, input.conversationId));
    if (!blockedForRecipient && !mutedForRecipient) {
      for (const member of allMembers) if (member.accountId !== active.id) await notifySocialEvent({ recipientAccountId: member.accountId, actorAccountId: active.id, type: "message", resourceType: "conversation", resourceId: input.conversationId, body: `${active.displayName} sent you a message.` });
    }
    return { id, delivered: !blockedForRecipient, notificationsEnabled: !mutedForRecipient, blockedForRecipient };
  }),
  markRead: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const readAt = /* @__PURE__ */ new Date();
    await db.transaction(async (transaction) => {
      await transaction.update(conversationMembers).set({ lastReadAt: readAt, unreadCount: 0 }).where(and7(eq7(conversationMembers.conversationId, input.conversationId), eq7(conversationMembers.accountId, active.id)));
      await transaction.update(messages).set({ readAt }).where(and7(eq7(messages.conversationId, input.conversationId), ne2(messages.senderAccountId, active.id), isNull5(messages.readAt), isNull5(messages.deletedAt)));
    });
    return { success: true, readAt };
  }),
  presence: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36), isTyping: z7.boolean() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    await db.insert(conversationPresence).values({ conversationId: input.conversationId, accountId: active.id, isTyping: input.isTyping, lastSeenAt: /* @__PURE__ */ new Date() }).onDuplicateKeyUpdate({ set: { isTyping: input.isTyping, lastSeenAt: /* @__PURE__ */ new Date() } });
    return { success: true };
  }),
  presenceSnapshot: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const freshAfter = new Date(Date.now() - 2e4);
    const rows = await db.select({ presence: conversationPresence, account: accounts }).from(conversationPresence).innerJoin(accounts, eq7(conversationPresence.accountId, accounts.id)).where(and7(eq7(conversationPresence.conversationId, input.conversationId), ne2(conversationPresence.accountId, active.id), gte(conversationPresence.lastSeenAt, freshAfter)));
    return rows;
  }),
  preferences: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const rows = await db.select({ preference: conversationPreferences, backgroundMedia: mediaAssets }).from(conversationPreferences).leftJoin(mediaAssets, eq7(conversationPreferences.backgroundMediaId, mediaAssets.id)).where(and7(eq7(conversationPreferences.conversationId, input.conversationId), eq7(conversationPreferences.accountId, active.id))).limit(1);
    return rows[0] ? { ...rows[0].preference, backgroundMedia: rows[0].backgroundMedia } : { conversationId: input.conversationId, accountId: active.id, theme: "velora", backgroundMediaId: null, backgroundMedia: null, updatedAt: /* @__PURE__ */ new Date() };
  }),
  setPreferences: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36), theme: z7.enum(["velora", "orchid", "midnight", "ocean", "sunset"]), backgroundMediaId: z7.string().min(4).max(36).nullable().optional() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    if (input.backgroundMediaId) await requireOwnedMedia(ctx.user.id, [input.backgroundMediaId], "message");
    const db = await requireDb();
    await db.insert(conversationPreferences).values({ conversationId: input.conversationId, accountId: active.id, theme: input.theme, backgroundMediaId: input.backgroundMediaId ?? null }).onDuplicateKeyUpdate({ set: { theme: input.theme, backgroundMediaId: input.backgroundMediaId ?? null, updatedAt: /* @__PURE__ */ new Date() } });
    return { success: true };
  }),
  react: protectedProcedure.input(z7.object({ messageId: z7.string().min(4).max(36), reaction: z7.string().trim().min(1).max(32) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const message = await db.select().from(messages).where(eq7(messages.id, input.messageId)).limit(1);
    if (!message[0]) throw new Error("That message is unavailable.");
    await requireMembership(message[0].conversationId, active.id);
    const existing = await db.select().from(messageReactions).where(and7(eq7(messageReactions.messageId, input.messageId), eq7(messageReactions.accountId, active.id))).limit(1);
    if (existing[0]) await db.delete(messageReactions).where(and7(eq7(messageReactions.messageId, input.messageId), eq7(messageReactions.accountId, active.id)));
    else await db.insert(messageReactions).values({ messageId: input.messageId, accountId: active.id, reaction: input.reaction });
    return { active: !existing[0] };
  }),
  createPoll: protectedProcedure.input(z7.object({ conversationId: z7.string().min(4).max(36), question: z7.string().trim().min(2).max(300), options: z7.array(z7.string().trim().min(1).max(160)).min(2).max(8) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "poll_create", 30, 60 * 60 * 1e3);
    const active = await requireActiveAccount(ctx.user.id);
    await requireMembership(input.conversationId, active.id);
    const db = await requireDb();
    const messageId = createId("msg_");
    const pollId = createId("pol_");
    await db.transaction(async (transaction) => {
      await transaction.insert(messages).values({ id: messageId, conversationId: input.conversationId, senderAccountId: active.id, body: input.question, kind: "poll", deliveredAt: /* @__PURE__ */ new Date() });
      await transaction.insert(polls).values({ id: pollId, messageId, question: input.question });
      await transaction.insert(pollOptions).values(input.options.map((label, position) => ({ pollId, label: sanitizePlainText(label, 160), position })));
      await transaction.update(conversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, input.conversationId));
    });
    return { messageId, pollId };
  }),
  votePoll: protectedProcedure.input(z7.object({ pollId: z7.string().min(4).max(36), optionId: z7.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const poll = await db.select({ poll: polls, message: messages }).from(polls).innerJoin(messages, eq7(polls.messageId, messages.id)).where(eq7(polls.id, input.pollId)).limit(1);
    if (!poll[0]) throw new Error("That poll is unavailable.");
    await requireMembership(poll[0].message.conversationId, active.id);
    const option = await db.select().from(pollOptions).where(and7(eq7(pollOptions.id, input.optionId), eq7(pollOptions.pollId, input.pollId))).limit(1);
    if (!option[0]) throw new Error("That poll option is unavailable.");
    await db.insert(pollVotes).values({ pollId: input.pollId, optionId: input.optionId, accountId: active.id }).onDuplicateKeyUpdate({ set: { optionId: input.optionId, createdAt: /* @__PURE__ */ new Date() } });
    return { success: true };
  }),
  removeMessage: protectedProcedure.input(z7.object({ messageId: z7.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const message = await db.select().from(messages).where(and7(eq7(messages.id, input.messageId), eq7(messages.senderAccountId, active.id), isNull5(messages.deletedAt))).limit(1);
    if (!message[0]) throw new Error("You can only remove an available message you sent.");
    await db.update(messages).set({ deletedAt: /* @__PURE__ */ new Date(), body: "" }).where(eq7(messages.id, input.messageId));
    return { success: true };
  })
});
var notificationsRouter = router({
  list: protectedProcedure.input(z7.object({ limit: z7.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    return db.select({ notification: notifications, actor: accounts }).from(notifications).leftJoin(accounts, eq7(notifications.actorAccountId, accounts.id)).where(eq7(notifications.recipientAccountId, active.id)).orderBy(desc5(notifications.createdAt)).limit(input.limit);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const rows = await db.select({ id: notifications.id }).from(notifications).where(and7(eq7(notifications.recipientAccountId, active.id), isNull5(notifications.readAt)));
    return rows.length;
  }),
  markRead: protectedProcedure.input(z7.object({ id: z7.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(notifications).set({ readAt: /* @__PURE__ */ new Date() }).where(and7(eq7(notifications.id, input.id), eq7(notifications.recipientAccountId, active.id)));
    return { success: true };
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const active = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(notifications).set({ readAt: /* @__PURE__ */ new Date() }).where(and7(eq7(notifications.recipientAccountId, active.id), isNull5(notifications.readAt)));
    return { success: true };
  })
});

// server/routers/discovery.ts
init_schema();
import { and as and8, desc as desc6, eq as eq8, isNull as isNull6, like, or as or2 } from "drizzle-orm";
import { z as z8 } from "zod";
var searchInput = z8.object({ query: z8.string().trim().min(1).max(120), kind: z8.enum(["user", "post", "hashtag", "all"]).default("all") });
var discoveryRouter = router({
  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const db = await requireDb();
    const value = sanitizePlainText(input.query, 120).toLowerCase();
    const pattern = `%${value.replace(/[%_]/g, "\\$&")}%`;
    const users2 = input.kind === "post" || input.kind === "hashtag" ? [] : await db.select().from(accounts).where(and8(eq8(accounts.status, "active"), or2(like(accounts.username, pattern), like(accounts.displayName, pattern)))).limit(12);
    const tags = input.kind === "user" || input.kind === "post" ? [] : await db.select().from(hashtags).where(like(hashtags.normalizedName, pattern)).limit(12);
    const matchingPosts = input.kind === "user" || input.kind === "hashtag" ? [] : await db.select({ post: posts, author: accounts }).from(posts).innerJoin(accounts, eq8(posts.authorAccountId, accounts.id)).where(and8(eq8(posts.visibility, "public"), isNull6(posts.deletedAt), eq8(accounts.status, "active"), like(posts.caption, pattern))).orderBy(desc6(posts.createdAt)).limit(18);
    return { users: users2, hashtags: tags, posts: matchingPosts };
  }),
  recordRecent: protectedProcedure.input(searchInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120).toLowerCase();
    const existing = await db.select().from(recentSearches).where(and8(eq8(recentSearches.userId, ctx.user.id), eq8(recentSearches.query, query), eq8(recentSearches.kind, input.kind))).limit(1);
    if (existing[0]) await db.update(recentSearches).set({ createdAt: /* @__PURE__ */ new Date() }).where(eq8(recentSearches.id, existing[0].id));
    else await db.insert(recentSearches).values({ id: createId("srch_"), userId: ctx.user.id, query, kind: input.kind });
    return { success: true };
  }),
  recent: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(recentSearches).where(eq8(recentSearches.userId, ctx.user.id)).orderBy(desc6(recentSearches.createdAt)).limit(12);
  }),
  clearRecent: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.delete(recentSearches).where(eq8(recentSearches.userId, ctx.user.id));
    return { success: true };
  })
});

// server/routers/safety.ts
init_schema();
import { and as and9, count as count2, desc as desc7, eq as eq9, isNull as isNull7, like as like2, or as or3 } from "drizzle-orm";
import { z as z9 } from "zod";
var reportReasonSchema = z9.enum(["spam", "harassment", "hate", "violence", "nudity", "misinformation", "other"]);
var safetyRouter = router({
  createReport: protectedProcedure.input(z9.object({ targetType: z9.enum(["user", "post", "comment", "story", "message"]), targetId: z9.string().min(4).max(36), reason: reportReasonSchema, details: z9.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "report_create", 20, 24 * 60 * 60 * 1e3);
    const reporter = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const id = createId("rpt_");
    await db.insert(reports).values({ id, reporterAccountId: reporter.id, targetType: input.targetType, targetId: input.targetId, reason: input.reason, details: input.details ? sanitizePlainText(input.details, 1e3) : null });
    if (["violence", "hate", "nudity"].indexOf(input.reason) !== -1) {
      await alertOwnerOnCriticalEvent("Velora priority report", `A priority ${input.reason} report was submitted for ${input.targetType} ${input.targetId}.`);
    }
    return { id };
  })
});
var adminRouter = router({
  statistics: adminProcedure.query(async () => {
    const db = await requireDb();
    const [userCount] = await db.select({ value: count2() }).from(users);
    const [accountCount] = await db.select({ value: count2() }).from(accounts).where(eq9(accounts.status, "active"));
    const [postCount] = await db.select({ value: count2() }).from(posts).where(isNull7(posts.deletedAt));
    const [openReportCount] = await db.select({ value: count2() }).from(reports).where(or3(eq9(reports.status, "open"), eq9(reports.status, "reviewing")));
    return { users: Number(userCount?.value ?? 0), activeAccounts: Number(accountCount?.value ?? 0), visiblePosts: Number(postCount?.value ?? 0), openReports: Number(openReportCount?.value ?? 0) };
  }),
  users: adminProcedure.input(z9.object({ query: z9.string().trim().max(120).default("") })).query(async ({ input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120);
    const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;
    return db.select({ account: accounts, user: users }).from(accounts).innerJoin(users, eq9(accounts.ownerUserId, users.id)).where(or3(like2(accounts.username, pattern), like2(accounts.displayName, pattern), like2(users.email, pattern))).orderBy(desc7(accounts.createdAt)).limit(100);
  }),
  setAccountStatus: adminProcedure.input(z9.object({ accountId: z9.string().min(4).max(36), status: z9.enum(["active", "suspended"]), reason: z9.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const account = await db.select().from(accounts).where(eq9(accounts.id, input.accountId)).limit(1);
    if (!account[0]) throw new Error("The selected account does not exist.");
    await db.update(accounts).set({ status: input.status }).where(eq9(accounts.id, input.accountId));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: input.status === "suspended" ? "suspend_account" : "restore_account", entityType: "account", entityId: input.accountId, reason: input.reason ? sanitizePlainText(input.reason, 1e3) : null });
    return { success: true };
  }),
  reports: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ report: reports, reporter: accounts }).from(reports).innerJoin(accounts, eq9(reports.reporterAccountId, accounts.id)).orderBy(desc7(reports.createdAt)).limit(100);
  }),
  resolveReport: adminProcedure.input(z9.object({ reportId: z9.string().min(4).max(36), status: z9.enum(["reviewing", "resolved", "dismissed"]), reason: z9.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const report = await db.select().from(reports).where(eq9(reports.id, input.reportId)).limit(1);
    if (!report[0]) throw new Error("This report is unavailable.");
    await db.update(reports).set({ status: input.status, reviewerUserId: ctx.user.id, reviewedAt: /* @__PURE__ */ new Date() }).where(eq9(reports.id, input.reportId));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: input.status === "dismissed" ? "dismiss_report" : "resolve_report", entityType: "report", entityId: input.reportId, reason: input.reason ? sanitizePlainText(input.reason, 1e3) : null });
    return { success: true };
  }),
  removePost: adminProcedure.input(z9.object({ postId: z9.string().min(4).max(36), reason: z9.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(posts).set({ deletedAt: /* @__PURE__ */ new Date() }).where(and9(eq9(posts.id, input.postId), isNull7(posts.deletedAt)));
    await db.insert(moderationActions).values({ id: createId("mod_"), administratorUserId: ctx.user.id, action: "remove_post", entityType: "post", entityId: input.postId, reason: input.reason ? sanitizePlainText(input.reason, 1e3) : null });
    return { success: true };
  }),
  content: adminProcedure.input(z9.object({ query: z9.string().trim().max(120).default("") })).query(async ({ input }) => {
    const db = await requireDb();
    const query = sanitizePlainText(input.query, 120);
    const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;
    return db.select({ post: posts, author: accounts }).from(posts).innerJoin(accounts, eq9(posts.authorAccountId, accounts.id)).where(or3(like2(posts.caption, pattern), like2(accounts.username, pattern), like2(accounts.displayName, pattern))).orderBy(desc7(posts.createdAt)).limit(100);
  }),
  activity: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ action: moderationActions, administrator: users }).from(moderationActions).innerJoin(users, eq9(moderationActions.administratorUserId, users.id)).orderBy(desc7(moderationActions.createdAt)).limit(100);
  })
});

// server/routers/enhancements.ts
init_schema();
import { and as and10, asc, count as count3, desc as desc8, eq as eq10, gte as gte2, inArray as inArray7, sql as sql3 } from "drizzle-orm";
import { z as z10 } from "zod";
var feedbackType = z10.enum(["rating", "feedback", "bug"]);
var analyticsType = z10.enum(["registration", "session_active", "post_created", "message_sent", "story_viewed"]);
var relationType = z10.enum(["blocked", "muted"]);
var archivesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    return db.select({ archive: storyArchives, media: mediaAssets }).from(storyArchives).innerJoin(mediaAssets, eq10(storyArchives.mediaId, mediaAssets.id)).where(eq10(storyArchives.ownerAccountId, account.id)).orderBy(desc8(storyArchives.archivedAt));
  }),
  delete: protectedProcedure.input(z10.object({ archiveId: z10.string().min(4).max(36) })).mutation(async ({ ctx, input }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.delete(storyArchives).where(and10(eq10(storyArchives.id, input.archiveId), eq10(storyArchives.ownerAccountId, account.id)));
    return { success: true };
  })
});
var analyticsRouter = router({
  track: protectedProcedure.input(z10.object({ eventType: analyticsType, gender: z10.enum(["male", "female", "non_binary", "undisclosed"]).default("undisclosed") })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "analytics_track", 120, 60 * 60 * 1e3);
    const account = await getActiveAccountForUser(ctx.user.id);
    const db = await requireDb();
    await db.insert(analyticsEvents).values({ id: createId("evt_"), eventType: input.eventType, userId: ctx.user.id, accountId: account?.id ?? null, gender: input.gender });
    return { success: true };
  }),
  dashboard: adminProcedure.input(z10.object({ rangeDays: z10.number().int().min(7).max(365).default(30), granularity: z10.enum(["day", "week", "month"]).default("day") })).query(async ({ input }) => {
    const db = await requireDb();
    const start = new Date(Date.now() - input.rangeDays * 24 * 60 * 60 * 1e3);
    const dateBucket = input.granularity === "month" ? sql3`DATE_FORMAT(${users.createdAt}, '%Y-%m')` : input.granularity === "week" ? sql3`YEARWEEK(${users.createdAt}, 1)` : sql3`DATE_FORMAT(${users.createdAt}, '%Y-%m-%d')`;
    const eventBucket = input.granularity === "month" ? sql3`DATE_FORMAT(${analyticsEvents.createdAt}, '%Y-%m')` : input.granularity === "week" ? sql3`YEARWEEK(${analyticsEvents.createdAt}, 1)` : sql3`DATE_FORMAT(${analyticsEvents.createdAt}, '%Y-%m-%d')`;
    const registrations = await db.select({ day: dateBucket, value: count3() }).from(users).where(gte2(users.createdAt, start)).groupBy(dateBucket).orderBy(asc(dateBucket));
    const activeUsers = await db.select({ day: eventBucket, value: sql3`COUNT(DISTINCT ${analyticsEvents.userId})` }).from(analyticsEvents).where(and10(gte2(analyticsEvents.createdAt, start), eq10(analyticsEvents.eventType, "session_active"))).groupBy(eventBucket).orderBy(asc(eventBucket));
    const genderRows = await db.select({ gender: analyticsEvents.gender, value: count3() }).from(analyticsEvents).where(and10(gte2(analyticsEvents.createdAt, start), eq10(analyticsEvents.eventType, "registration"))).groupBy(analyticsEvents.gender);
    const gender = genderRows.filter((row) => Number(row.value) >= 5).map((row) => ({ gender: row.gender, value: Number(row.value) }));
    const active = await db.select({ userId: analyticsEvents.userId, value: count3() }).from(analyticsEvents).where(and10(gte2(analyticsEvents.createdAt, start), eq10(analyticsEvents.eventType, "session_active"))).groupBy(analyticsEvents.userId).orderBy(desc8(count3())).limit(10);
    const activeIds = active.map((row) => row.userId).filter((id) => Boolean(id));
    const activePeople = activeIds.length ? await db.select({ user: users }).from(users).where(inArray7(users.id, activeIds)) : [];
    const activeById = new Map(activePeople.map((row) => [row.user.id, row.user]));
    return {
      rangeDays: input.rangeDays,
      registrations: registrations.map((row) => ({ day: row.day, value: Number(row.value) })),
      activeUsers: activeUsers.map((row) => ({ day: row.day, value: Number(row.value) })),
      gender,
      genderSuppressed: genderRows.length !== gender.length,
      mostActive: active.map((row) => ({ user: row.userId ? activeById.get(row.userId) ? { id: row.userId, name: activeById.get(row.userId)?.name, email: activeById.get(row.userId)?.email } : null : null, value: Number(row.value) })).filter((row) => row.user)
    };
  })
});
var feedbackRouter = router({
  create: protectedProcedure.input(z10.object({ type: feedbackType, rating: z10.number().int().min(1).max(5).optional(), subject: z10.string().trim().min(3).max(160), body: z10.string().trim().min(3).max(3e3) })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(ctx.user.id, "feedback_create", 10, 24 * 60 * 60 * 1e3);
    if (input.type === "rating" && input.rating === void 0) throw new Error("A rating is required for rating feedback.");
    const db = await requireDb();
    const id = createId("fdb_");
    await db.insert(feedbackSubmissions).values({ id, userId: ctx.user.id, type: input.type, rating: input.rating ?? null, subject: sanitizePlainText(input.subject, 160), body: sanitizePlainText(input.body, 3e3) });
    return { id };
  }),
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(feedbackSubmissions).where(eq10(feedbackSubmissions.userId, ctx.user.id)).orderBy(desc8(feedbackSubmissions.createdAt)).limit(50);
  }),
  adminList: adminProcedure.input(z10.object({ status: z10.enum(["open", "reviewing", "resolved", "closed"]).optional() })).query(async ({ input }) => {
    const db = await requireDb();
    const rows = await db.select({ feedback: feedbackSubmissions, user: users }).from(feedbackSubmissions).innerJoin(users, eq10(feedbackSubmissions.userId, users.id)).where(input.status ? eq10(feedbackSubmissions.status, input.status) : void 0).orderBy(desc8(feedbackSubmissions.createdAt)).limit(200);
    return rows;
  }),
  adminUpdate: adminProcedure.input(z10.object({ id: z10.string().min(4).max(36), status: z10.enum(["reviewing", "resolved", "closed"]), adminNotes: z10.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(feedbackSubmissions).set({ status: input.status, reviewerUserId: ctx.user.id, adminNotes: input.adminNotes ? sanitizePlainText(input.adminNotes, 1e3) : null }).where(eq10(feedbackSubmissions.id, input.id));
    return { success: true };
  })
});
var userSafetyRouter = router({
  toggle: protectedProcedure.input(z10.object({ targetAccountId: z10.string().min(4).max(36), relation: relationType })).mutation(async ({ ctx, input }) => {
    const actor = await requireActiveAccount(ctx.user.id);
    if (actor.id === input.targetAccountId) throw new Error("You cannot apply this control to yourself.");
    const db = await requireDb();
    const target = await db.select({ id: accounts.id }).from(accounts).where(eq10(accounts.id, input.targetAccountId)).limit(1);
    if (!target[0]) throw new Error("That account does not exist.");
    const existing = await db.select().from(userSafetyRelations).where(and10(eq10(userSafetyRelations.actorAccountId, actor.id), eq10(userSafetyRelations.targetAccountId, input.targetAccountId), eq10(userSafetyRelations.relation, input.relation))).limit(1);
    if (existing[0]) await db.delete(userSafetyRelations).where(and10(eq10(userSafetyRelations.actorAccountId, actor.id), eq10(userSafetyRelations.targetAccountId, input.targetAccountId), eq10(userSafetyRelations.relation, input.relation)));
    else await db.insert(userSafetyRelations).values({ actorAccountId: actor.id, targetAccountId: input.targetAccountId, relation: input.relation });
    return { active: !existing[0], relation: input.relation };
  }),
  status: protectedProcedure.input(z10.object({ targetAccountId: z10.string().min(4).max(36) })).query(async ({ ctx, input }) => {
    const actor = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    const rows = await db.select({ relation: userSafetyRelations.relation }).from(userSafetyRelations).where(and10(eq10(userSafetyRelations.actorAccountId, actor.id), eq10(userSafetyRelations.targetAccountId, input.targetAccountId)));
    return { blocked: rows.some((row) => row.relation === "blocked"), muted: rows.some((row) => row.relation === "muted") };
  })
});
var verificationRouter = router({
  pending: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ account: accounts, profile: profiles }).from(profiles).innerJoin(accounts, eq10(profiles.accountId, accounts.id)).where(eq10(profiles.verificationStatus, "pending")).orderBy(desc8(profiles.updatedAt)).limit(100);
  }),
  request: protectedProcedure.mutation(async ({ ctx }) => {
    const account = await requireActiveAccount(ctx.user.id);
    const db = await requireDb();
    await db.update(accounts).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq10(accounts.id, account.id));
    await db.update((await Promise.resolve().then(() => (init_schema(), schema_exports))).profiles).set({ verificationStatus: "pending" }).where(eq10((await Promise.resolve().then(() => (init_schema(), schema_exports))).profiles.accountId, account.id));
    return { submitted: true };
  }),
  adminReview: adminProcedure.input(z10.object({ accountId: z10.string().min(4).max(36), decision: z10.enum(["approved", "rejected", "revoked"]), reason: z10.string().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update((await Promise.resolve().then(() => (init_schema(), schema_exports))).profiles).set({ verificationStatus: input.decision === "approved" ? "verified" : input.decision === "revoked" ? "none" : "rejected" }).where(eq10((await Promise.resolve().then(() => (init_schema(), schema_exports))).profiles.accountId, input.accountId));
    await db.insert(adminVerificationReviews).values({ id: createId("ver_"), accountId: input.accountId, reviewerUserId: ctx.user.id, decision: input.decision, reason: input.reason ? sanitizePlainText(input.reason, 1e3) : null });
    return { success: true };
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  accounts: accountsRouter,
  sessions: sessionsRouter,
  posts: postsRouter,
  comments: commentsRouter,
  profiles: profilesRouter,
  stories: storiesRouter,
  messaging: messagingRouter,
  notifications: notificationsRouter,
  discovery: discoveryRouter,
  safety: safetyRouter,
  admin: adminRouter,
  archives: archivesRouter,
  analytics: analyticsRouter,
  feedback: feedbackRouter,
  userSafety: userSafetyRouter,
  verification: verificationRouter
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/mediaRoutes.ts
import express2 from "express";
init_schema();

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/mediaRoutes.ts
function normalizeFileName(value) {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();
  const safe = decoded.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
  return safe || "upload";
}
function isExpectedFileSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (mimeType === "image/png") return buffer.length > 7 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/gif") return buffer.length > 5 && (buffer.subarray(0, 6).toString() === "GIF87a" || buffer.subarray(0, 6).toString() === "GIF89a");
  if (mimeType === "image/webp") return buffer.length > 11 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (mimeType === "video/webm" || mimeType === "audio/webm") return buffer.length > 3 && buffer.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]));
  if (mimeType === "application/pdf") return buffer.length > 4 && buffer.subarray(0, 5).toString() === "%PDF-";
  if (mimeType === "audio/ogg") return buffer.length > 3 && buffer.subarray(0, 4).toString() === "OggS";
  if (mimeType === "audio/mpeg") return buffer.length > 3 && (buffer.subarray(0, 3).toString() === "ID3" || buffer[0] === 255 && (buffer[1] & 224) === 224);
  if (VIDEO_MIME_TYPES.indexOf(mimeType) !== -1 || mimeType === "audio/mp4") return buffer.length > 11 && buffer.subarray(4, 8).toString() === "ftyp";
  return false;
}
function hasExpectedExtension(fileName, mimeType) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const expected = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
    "video/mp4": ["mp4"],
    "video/webm": ["webm"],
    "video/quicktime": ["mov"],
    "application/pdf": ["pdf"],
    "audio/webm": ["webm"],
    "audio/ogg": ["ogg"],
    "audio/mp4": ["m4a", "mp4"],
    "audio/mpeg": ["mp3"]
  };
  return Boolean(extension && expected[mimeType]?.indexOf(extension) !== -1);
}
async function uploadMedia(req, res) {
  try {
    const user = await sdk.authenticateRequest(req);
    const scope = req.header("x-velora-media-scope");
    const mimeType = (req.header("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const originalName = normalizeFileName(req.header("x-velora-file-name") ?? "upload");
    const altText = sanitizePlainText(req.header("x-velora-alt-text") ?? "", 500);
    const body = req.body;
    if (!scope || MEDIA_SCOPES.indexOf(scope) === -1) return res.status(400).json({ error: "Invalid media scope." });
    if (ALLOWED_MEDIA_MIME_TYPES.indexOf(mimeType) === -1) return res.status(415).json({ error: "This file type is not supported." });
    if (!Buffer.isBuffer(body) || body.length === 0) return res.status(400).json({ error: "Select a file before uploading." });
    if (body.length > VELORA_BRAND.maxUploadBytes) return res.status(413).json({ error: "Files must be 50 MB or smaller." });
    if (!hasExpectedExtension(originalName, mimeType) || !isExpectedFileSignature(body, mimeType)) return res.status(415).json({ error: "File contents do not match the declared media type." });
    await enforceRateLimit(user.id, "media_upload", 20, 60 * 60 * 1e3);
    const mediaId = createId("med_");
    const { key, url } = await storagePut(`velora/${user.id}/${scope}/${mediaId}-${originalName}`, body, mimeType);
    const db = await requireDb();
    await db.insert(mediaAssets).values({
      id: mediaId,
      ownerUserId: user.id,
      scope,
      storageKey: key,
      url,
      originalName,
      mimeType,
      sizeBytes: body.length,
      altText: altText || null
    });
    const kind = IMAGE_MIME_TYPES.indexOf(mimeType) !== -1 ? "image" : VIDEO_MIME_TYPES.indexOf(mimeType) !== -1 ? "video" : mimeType.startsWith("audio/") ? "audio" : "document";
    return res.status(201).json({ id: mediaId, url, mimeType, originalName, sizeBytes: body.length, kind });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload this file.";
    const status = /wait before trying/i.test(message) ? 429 : 500;
    return res.status(status).json({ error: message });
  }
}
function registerMediaRoutes(app) {
  app.post(
    "/api/media/upload",
    express2.raw({
      type: (req) => ALLOWED_MEDIA_MIME_TYPES.indexOf((req.headers["content-type"] ?? "").split(";")[0].toLowerCase()) !== -1,
      limit: VELORA_BRAND.maxUploadBytes
    }),
    uploadMedia
  );
}

// server/scheduledRoutes.ts
init_schema();
import { and as and11, eq as eq11, inArray as inArray8, lte } from "drizzle-orm";
var STORY_EXPIRY_JOB_ID = "story-expiry";
async function cleanupExpiredStories(req, res) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await requireDb();
    const job = await db.select().from(platformJobs).where(and11(eq11(platformJobs.id, STORY_EXPIRY_JOB_ID), eq11(platformJobs.scheduleCronTaskUid, cronUser.taskUid), eq11(platformJobs.enabled, true))).limit(1);
    if (!job[0]) return res.json({ ok: true, skipped: "unregistered-schedule" });
    const expired = await db.select().from(stories).where(lte(stories.expiresAt, /* @__PURE__ */ new Date())).limit(500);
    const storyIds = expired.map((story) => story.id);
    if (storyIds.length) {
      await db.transaction(async (transaction) => {
        for (const story of expired) {
          await transaction.insert(storyArchives).values({ id: `arch_${story.id}`, originalStoryId: story.id, ownerAccountId: story.authorAccountId, mediaId: story.mediaId, caption: story.caption, originalCreatedAt: story.createdAt, expiredAt: story.expiresAt }).onDuplicateKeyUpdate({ set: { archivedAt: /* @__PURE__ */ new Date() } });
        }
        await transaction.delete(storyViews).where(inArray8(storyViews.storyId, storyIds));
        await transaction.delete(stories).where(inArray8(stories.id, storyIds));
      });
    }
    await db.update(platformJobs).set({ lastCompletedAt: /* @__PURE__ */ new Date(), lastError: null }).where(eq11(platformJobs.id, STORY_EXPIRY_JOB_ID));
    return res.json({ ok: true, removedStories: storyIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected story cleanup failure.";
    console.error("[Story cleanup]", error);
    return res.status(500).json({ error: message, timestamp: (/* @__PURE__ */ new Date()).toISOString(), context: { path: "/api/scheduled/story-expiry" } });
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express3();
  const server = createServer(app);
  registerMediaRoutes(app);
  app.post("/api/scheduled/story-expiry", cleanupExpiredStories);
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
