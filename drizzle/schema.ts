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
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const accounts = mysqlTable(
  "accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ownerUserId: int("ownerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 30 }).notNull(),
    displayName: varchar("displayName", { length: 80 }).notNull(),
    status: mysqlEnum("status", ["active", "suspended", "banned", "deactivated"]).default("active").notNull(),
    suspendedUntil: timestamp("suspendedUntil"),
    suspensionReason: varchar("suspensionReason", { length: 1000 }),
    isPrivate: boolean("isPrivate").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("accounts_username_unique").on(table.username),
    index("accounts_owner_idx").on(table.ownerUserId),
    index("accounts_status_idx").on(table.status),
  ],
);

export const profiles = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("profiles_avatar_media_idx").on(table.avatarMediaId)],
);

export const userSettings = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("user_settings_active_account_idx").on(table.activeAccountId)],
);

export const accountSessions = mysqlTable(
  "account_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    deviceLabel: varchar("deviceLabel", { length: 120 }).notNull(),
    ipHash: varchar("ipHash", { length: 128 }),
    userAgent: varchar("userAgent", { length: 500 }),
    lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("account_sessions_user_active_idx").on(table.userId, table.revokedAt)],
);

export const mediaAssets = mysqlTable(
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("media_assets_storage_key_unique").on(table.storageKey),
    index("media_assets_owner_scope_idx").on(table.ownerUserId, table.scope),
  ],
);

export const posts = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("posts_author_created_idx").on(table.authorAccountId, table.createdAt),
    index("posts_visibility_created_idx").on(table.visibility, table.createdAt),
  ],
);

export const postMedia = mysqlTable(
  "post_media",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
    position: int("position").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("post_media_post_position_unique").on(table.postId, table.position),
    uniqueIndex("post_media_post_media_unique").on(table.postId, table.mediaId),
  ],
);

export const hashtags = mysqlTable(
  "hashtags",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    normalizedName: varchar("normalizedName", { length: 80 }).notNull(),
    displayName: varchar("displayName", { length: 80 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("hashtags_normalized_name_unique").on(table.normalizedName)],
);

export const postHashtags = mysqlTable(
  "post_hashtags",
  {
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    hashtagId: varchar("hashtagId", { length: 36 }).notNull().references(() => hashtags.id, { onDelete: "cascade" }),
  },
  table => [primaryKey({ columns: [table.postId, table.hashtagId] }), index("post_hashtags_hashtag_idx").on(table.hashtagId)],
);

export const postMentions = mysqlTable(
  "post_mentions",
  {
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  },
  table => [primaryKey({ columns: [table.postId, table.accountId] }), index("post_mentions_account_idx").on(table.accountId)],
);

export const comments = mysqlTable(
  "comments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    authorAccountId: varchar("authorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    parentCommentId: varchar("parentCommentId", { length: 36 }),
    body: varchar("body", { length: 1000 }).notNull(),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("comments_post_created_idx").on(table.postId, table.createdAt),
    index("comments_author_idx").on(table.authorAccountId),
  ],
);

export const likes = mysqlTable(
  "likes",
  {
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.postId, table.accountId] }), index("likes_account_created_idx").on(table.accountId, table.createdAt)],
);

export const follows = mysqlTable(
  "follows",
  {
    followerAccountId: varchar("followerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    followingAccountId: varchar("followingAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["accepted", "requested"]).default("accepted").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    primaryKey({ columns: [table.followerAccountId, table.followingAccountId] }),
    index("follows_following_status_idx").on(table.followingAccountId, table.status),
  ],
);

export const savedPosts = mysqlTable(
  "saved_posts",
  {
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.accountId, table.postId] }), index("saved_posts_account_created_idx").on(table.accountId, table.createdAt)],
);

export const postShares = mysqlTable(
  "post_shares",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    postId: varchar("postId", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    channel: mysqlEnum("channel", ["copy_link", "message", "external"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("post_shares_post_idx").on(table.postId)],
);

export const stories = mysqlTable(
  "stories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    authorAccountId: varchar("authorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
    caption: varchar("caption", { length: 500 }),
    expiresAt: timestamp("expiresAt").notNull(),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("stories_expiry_idx").on(table.expiresAt),
    index("stories_author_expiry_idx").on(table.authorAccountId, table.expiresAt),
  ],
);

export const storyViews = mysqlTable(
  "story_views",
  {
    storyId: varchar("storyId", { length: 36 }).notNull().references(() => stories.id, { onDelete: "cascade" }),
    viewerAccountId: varchar("viewerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.storyId, table.viewerAccountId] }), index("story_views_viewer_idx").on(table.viewerAccountId)],
);

export const conversations = mysqlTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: mysqlEnum("type", ["direct", "group"]).default("direct").notNull(),
    title: varchar("title", { length: 120 }),
    lastMessageAt: timestamp("lastMessageAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("conversations_last_message_idx").on(table.lastMessageAt)],
);

export const conversationMembers = mysqlTable(
  "conversation_members",
  {
    conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("lastReadAt"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    mutedUntil: timestamp("mutedUntil"),
    unreadCount: int("unreadCount").default(0).notNull(),
  },
  table => [primaryKey({ columns: [table.conversationId, table.accountId] }), index("conversation_members_account_idx").on(table.accountId)],
);

export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderAccountId: varchar("senderAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    replyToMessageId: varchar("replyToMessageId", { length: 36 }),
    body: varchar("body", { length: 4000 }).default("").notNull(),
    kind: mysqlEnum("kind", ["text", "poll", "voice", "video"]).default("text").notNull(),
    deliveredAt: timestamp("deliveredAt"),
    readAt: timestamp("readAt"),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
    index("messages_sender_idx").on(table.senderAccountId),
  ],
);

export const messageAttachments = mysqlTable(
  "message_attachments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    messageId: varchar("messageId", { length: 36 }).notNull().references(() => messages.id, { onDelete: "cascade" }),
    mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
    position: int("position").notNull(),
  },
  table => [uniqueIndex("message_attachments_message_position_unique").on(table.messageId, table.position)],
);

export const notifications = mysqlTable(
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_recipient_read_created_idx").on(table.recipientAccountId, table.readAt, table.createdAt)],
);

export const reports = mysqlTable(
  "reports",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    reporterAccountId: varchar("reporterAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    targetType: mysqlEnum("targetType", ["user", "post", "comment", "story", "message"]).notNull(),
    targetId: varchar("targetId", { length: 36 }).notNull(),
    reason: mysqlEnum("reason", ["spam", "harassment", "hate", "violence", "nudity", "misinformation", "other"]).notNull(),
    details: varchar("details", { length: 1000 }),
    status: mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"]).default("open").notNull(),
    reviewerUserId: int("reviewerUserId").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("reports_status_created_idx").on(table.status, table.createdAt), index("reports_target_idx").on(table.targetType, table.targetId)],
);

export const moderationActions = mysqlTable(
  "moderation_actions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    administratorUserId: int("administratorUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    action: mysqlEnum("action", ["suspend_account", "restore_account", "remove_post", "resolve_report", "dismiss_report"]).notNull(),
    entityType: varchar("entityType", { length: 40 }).notNull(),
    entityId: varchar("entityId", { length: 36 }).notNull(),
    reason: varchar("reason", { length: 1000 }),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("moderation_actions_entity_idx").on(table.entityType, table.entityId), index("moderation_actions_admin_created_idx").on(table.administratorUserId, table.createdAt)],
);

export const rateLimitEvents = mysqlTable(
  "rate_limit_events",
  {
    id: varchar("id", { length: 90 }).primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    windowStartedAt: timestamp("windowStartedAt").notNull(),
    count: int("count").default(1).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("rate_limit_user_action_window_unique").on(table.userId, table.action, table.windowStartedAt)],
);

export const platformJobs = mysqlTable(
  "platform_jobs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    enabled: boolean("enabled").default(true).notNull(),
    lastCompletedAt: timestamp("lastCompletedAt"),
    lastError: varchar("lastError", { length: 1000 }),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("platform_jobs_schedule_uid_unique").on(table.scheduleCronTaskUid)],
);

export const recentSearches = mysqlTable(
  "recent_searches",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    query: varchar("query", { length: 120 }).notNull(),
    kind: mysqlEnum("kind", ["user", "post", "hashtag", "all"]).default("all").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("recent_searches_user_query_kind_unique").on(table.userId, table.query, table.kind), index("recent_searches_user_created_idx").on(table.userId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;

export const storyArchives = mysqlTable(
  "story_archives",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    originalStoryId: varchar("originalStoryId", { length: 36 }).notNull().unique(),
    ownerAccountId: varchar("ownerAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    mediaId: varchar("mediaId", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
    caption: varchar("caption", { length: 500 }),
    originalCreatedAt: timestamp("originalCreatedAt").notNull(),
    expiredAt: timestamp("expiredAt").notNull(),
    archivedAt: timestamp("archivedAt").defaultNow().notNull(),
  },
  table => [index("story_archives_owner_archived_idx").on(table.ownerAccountId, table.archivedAt)],
);

export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    accountId: varchar("accountId", { length: 36 }).references(() => accounts.id, { onDelete: "set null" }),
    gender: mysqlEnum("gender", ["male", "female", "non_binary", "undisclosed"]).default("undisclosed").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("analytics_events_type_created_idx").on(table.eventType, table.createdAt), index("analytics_events_created_idx").on(table.createdAt)],
);

export const feedbackSubmissions = mysqlTable(
  "feedback_submissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["rating", "feedback", "bug"]).notNull(),
    rating: int("rating"),
    subject: varchar("subject", { length: 160 }).notNull(),
    body: varchar("body", { length: 3000 }).notNull(),
    status: mysqlEnum("status", ["open", "reviewing", "resolved", "closed"]).default("open").notNull(),
    reviewerUserId: int("reviewerUserId").references(() => users.id, { onDelete: "set null" }),
    adminNotes: varchar("adminNotes", { length: 1000 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("feedback_status_created_idx").on(table.status, table.createdAt), index("feedback_user_created_idx").on(table.userId, table.createdAt)],
);

export const userSafetyRelations = mysqlTable(
  "user_safety_relations",
  {
    actorAccountId: varchar("actorAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    targetAccountId: varchar("targetAccountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    relation: mysqlEnum("relation", ["blocked", "muted"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  table => [primaryKey({ columns: [table.actorAccountId, table.targetAccountId, table.relation] }), index("safety_relations_target_idx").on(table.targetAccountId, table.relation)],
);

export const conversationPresence = mysqlTable(
  "conversation_presence",
  {
    conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    isTyping: boolean("isTyping").default(false).notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.conversationId, table.accountId] }), index("conversation_presence_seen_idx").on(table.conversationId, table.lastSeenAt)],
);

export const conversationPreferences = mysqlTable(
  "conversation_preferences",
  {
    conversationId: varchar("conversationId", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    theme: mysqlEnum("theme", ["velora", "orchid", "midnight", "ocean", "sunset"]).default("velora").notNull(),
    backgroundMediaId: varchar("backgroundMediaId", { length: 36 }).references(() => mediaAssets.id, { onDelete: "set null" }),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [primaryKey({ columns: [table.conversationId, table.accountId] })],
);

export const messageReactions = mysqlTable(
  "message_reactions",
  {
    messageId: varchar("messageId", { length: 36 }).notNull().references(() => messages.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    reaction: varchar("reaction", { length: 32 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.messageId, table.accountId] })],
);

export const polls = mysqlTable(
  "polls",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    messageId: varchar("messageId", { length: 36 }).notNull().unique().references(() => messages.id, { onDelete: "cascade" }),
    question: varchar("question", { length: 300 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
);

export const pollOptions = mysqlTable(
  "poll_options",
  {
    id: int("id").autoincrement().primaryKey(),
    pollId: varchar("pollId", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    position: int("position").notNull(),
  },
  table => [uniqueIndex("poll_options_position_unique").on(table.pollId, table.position)],
);

export const pollVotes = mysqlTable(
  "poll_votes",
  {
    pollId: varchar("pollId", { length: 36 }).notNull().references(() => polls.id, { onDelete: "cascade" }),
    optionId: int("optionId").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.pollId, table.accountId] }), index("poll_votes_option_idx").on(table.optionId)],
);

export const adminVerificationReviews = mysqlTable(
  "admin_verification_reviews",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("accountId", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
    reviewerUserId: int("reviewerUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    decision: mysqlEnum("decision", ["approved", "rejected", "revoked"]).notNull(),
    reason: varchar("reason", { length: 1000 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("verification_reviews_account_created_idx").on(table.accountId, table.createdAt)],
);

export type StoryArchive = typeof storyArchives.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type FeedbackSubmission = typeof feedbackSubmissions.$inferSelect;
export type UserSafetyRelation = typeof userSafetyRelations.$inferSelect;
export type ConversationPresence = typeof conversationPresence.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
