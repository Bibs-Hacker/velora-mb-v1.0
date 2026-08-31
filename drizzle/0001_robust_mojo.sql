CREATE TABLE `account_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`deviceLabel` varchar(120) NOT NULL,
	`ipHash` varchar(128),
	`userAgent` varchar(500),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`ownerUserId` int NOT NULL,
	`username` varchar(30) NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`status` enum('active','suspended','deactivated') NOT NULL DEFAULT 'active',
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(36) NOT NULL,
	`postId` varchar(36) NOT NULL,
	`authorAccountId` varchar(36) NOT NULL,
	`parentCommentId` varchar(36),
	`body` varchar(1000) NOT NULL,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_members` (
	`conversationId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`lastReadAt` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`mutedUntil` timestamp,
	CONSTRAINT `conversation_members_conversationId_accountId_pk` PRIMARY KEY(`conversationId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(36) NOT NULL,
	`type` enum('direct','group') NOT NULL DEFAULT 'direct',
	`title` varchar(120),
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`followerAccountId` varchar(36) NOT NULL,
	`followingAccountId` varchar(36) NOT NULL,
	`status` enum('accepted','requested') NOT NULL DEFAULT 'accepted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_followerAccountId_followingAccountId_pk` PRIMARY KEY(`followerAccountId`,`followingAccountId`)
);
--> statement-breakpoint
CREATE TABLE `hashtags` (
	`id` varchar(36) NOT NULL,
	`normalizedName` varchar(80) NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hashtags_id` PRIMARY KEY(`id`),
	CONSTRAINT `hashtags_normalized_name_unique` UNIQUE(`normalizedName`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`postId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_postId_accountId_pk` PRIMARY KEY(`postId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` varchar(36) NOT NULL,
	`ownerUserId` int NOT NULL,
	`scope` enum('profile','post','story','message') NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`url` varchar(1200) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`sizeBytes` int NOT NULL,
	`width` int,
	`height` int,
	`durationMs` int,
	`altText` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_storage_key_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `message_attachments` (
	`id` varchar(36) NOT NULL,
	`messageId` varchar(36) NOT NULL,
	`mediaId` varchar(36) NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `message_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_attachments_message_position_unique` UNIQUE(`messageId`,`position`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`conversationId` varchar(36) NOT NULL,
	`senderAccountId` varchar(36) NOT NULL,
	`replyToMessageId` varchar(36),
	`body` varchar(4000) NOT NULL DEFAULT '',
	`deliveredAt` timestamp,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` varchar(36) NOT NULL,
	`administratorUserId` int NOT NULL,
	`action` enum('suspend_account','restore_account','remove_post','resolve_report','dismiss_report') NOT NULL,
	`entityType` varchar(40) NOT NULL,
	`entityId` varchar(36) NOT NULL,
	`reason` varchar(1000),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`recipientAccountId` varchar(36) NOT NULL,
	`actorAccountId` varchar(36),
	`type` enum('follow','like','comment','mention','message','story','report_update','security') NOT NULL,
	`resourceType` varchar(40),
	`resourceId` varchar(36),
	`body` varchar(500),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_hashtags` (
	`postId` varchar(36) NOT NULL,
	`hashtagId` varchar(36) NOT NULL,
	CONSTRAINT `post_hashtags_postId_hashtagId_pk` PRIMARY KEY(`postId`,`hashtagId`)
);
--> statement-breakpoint
CREATE TABLE `post_media` (
	`id` varchar(36) NOT NULL,
	`postId` varchar(36) NOT NULL,
	`mediaId` varchar(36) NOT NULL,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_media_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_media_post_position_unique` UNIQUE(`postId`,`position`),
	CONSTRAINT `post_media_post_media_unique` UNIQUE(`postId`,`mediaId`)
);
--> statement-breakpoint
CREATE TABLE `post_mentions` (
	`postId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	CONSTRAINT `post_mentions_postId_accountId_pk` PRIMARY KEY(`postId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `post_shares` (
	`id` varchar(36) NOT NULL,
	`postId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`channel` enum('copy_link','message','external') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(36) NOT NULL,
	`authorAccountId` varchar(36) NOT NULL,
	`caption` varchar(2200) NOT NULL DEFAULT '',
	`location` varchar(120),
	`visibility` enum('public','followers') NOT NULL DEFAULT 'public',
	`likeCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`saveCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`accountId` varchar(36) NOT NULL,
	`avatarUrl` varchar(1024),
	`avatarMediaId` varchar(36),
	`bio` varchar(160) NOT NULL DEFAULT '',
	`website` varchar(500),
	`contactEmail` varchar(320),
	`contactPhone` varchar(40),
	`location` varchar(120),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_accountId` PRIMARY KEY(`accountId`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_events` (
	`id` varchar(90) NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`windowStartedAt` timestamp NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rate_limit_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limit_user_action_window_unique` UNIQUE(`userId`,`action`,`windowStartedAt`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` varchar(36) NOT NULL,
	`reporterAccountId` varchar(36) NOT NULL,
	`targetType` enum('user','post','comment','story','message') NOT NULL,
	`targetId` varchar(36) NOT NULL,
	`reason` enum('spam','harassment','hate','violence','nudity','misinformation','other') NOT NULL,
	`details` varchar(1000),
	`status` enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
	`reviewerUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_posts` (
	`accountId` varchar(36) NOT NULL,
	`postId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_posts_accountId_postId_pk` PRIMARY KEY(`accountId`,`postId`)
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` varchar(36) NOT NULL,
	`authorAccountId` varchar(36) NOT NULL,
	`mediaId` varchar(36) NOT NULL,
	`caption` varchar(500),
	`expiresAt` timestamp NOT NULL,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_views` (
	`storyId` varchar(36) NOT NULL,
	`viewerAccountId` varchar(36) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_views_storyId_viewerAccountId_pk` PRIMARY KEY(`storyId`,`viewerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`userId` int NOT NULL,
	`activeAccountId` varchar(36),
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`allowMentions` enum('everyone','following','none') NOT NULL DEFAULT 'everyone',
	`allowMessages` enum('everyone','following','none') NOT NULL DEFAULT 'following',
	`notifyLikes` boolean NOT NULL DEFAULT true,
	`notifyComments` boolean NOT NULL DEFAULT true,
	`notifyFollows` boolean NOT NULL DEFAULT true,
	`notifyMessages` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `account_sessions` ADD CONSTRAINT `account_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorAccountId_accounts_id_fk` FOREIGN KEY (`authorAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_followerAccountId_accounts_id_fk` FOREIGN KEY (`followerAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_followingAccountId_accounts_id_fk` FOREIGN KEY (`followingAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `likes` ADD CONSTRAINT `likes_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `likes` ADD CONSTRAINT `likes_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_mediaId_media_assets_id_fk` FOREIGN KEY (`mediaId`) REFERENCES `media_assets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderAccountId_accounts_id_fk` FOREIGN KEY (`senderAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderation_actions` ADD CONSTRAINT `moderation_actions_administratorUserId_users_id_fk` FOREIGN KEY (`administratorUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientAccountId_accounts_id_fk` FOREIGN KEY (`recipientAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_actorAccountId_accounts_id_fk` FOREIGN KEY (`actorAccountId`) REFERENCES `accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_hashtags` ADD CONSTRAINT `post_hashtags_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_hashtags` ADD CONSTRAINT `post_hashtags_hashtagId_hashtags_id_fk` FOREIGN KEY (`hashtagId`) REFERENCES `hashtags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_media` ADD CONSTRAINT `post_media_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_media` ADD CONSTRAINT `post_media_mediaId_media_assets_id_fk` FOREIGN KEY (`mediaId`) REFERENCES `media_assets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorAccountId_accounts_id_fk` FOREIGN KEY (`authorAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate_limit_events` ADD CONSTRAINT `rate_limit_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterAccountId_accounts_id_fk` FOREIGN KEY (`reporterAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_posts` ADD CONSTRAINT `saved_posts_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_posts` ADD CONSTRAINT `saved_posts_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stories` ADD CONSTRAINT `stories_authorAccountId_accounts_id_fk` FOREIGN KEY (`authorAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stories` ADD CONSTRAINT `stories_mediaId_media_assets_id_fk` FOREIGN KEY (`mediaId`) REFERENCES `media_assets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `story_views` ADD CONSTRAINT `story_views_storyId_stories_id_fk` FOREIGN KEY (`storyId`) REFERENCES `stories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `story_views` ADD CONSTRAINT `story_views_viewerAccountId_accounts_id_fk` FOREIGN KEY (`viewerAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_sessions_user_active_idx` ON `account_sessions` (`userId`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `accounts_owner_idx` ON `accounts` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `accounts_status_idx` ON `accounts` (`status`);--> statement-breakpoint
CREATE INDEX `comments_post_created_idx` ON `comments` (`postId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `comments_author_idx` ON `comments` (`authorAccountId`);--> statement-breakpoint
CREATE INDEX `conversation_members_account_idx` ON `conversation_members` (`accountId`);--> statement-breakpoint
CREATE INDEX `conversations_last_message_idx` ON `conversations` (`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `follows_following_status_idx` ON `follows` (`followingAccountId`,`status`);--> statement-breakpoint
CREATE INDEX `likes_account_created_idx` ON `likes` (`accountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `media_assets_owner_scope_idx` ON `media_assets` (`ownerUserId`,`scope`);--> statement-breakpoint
CREATE INDEX `messages_conversation_created_idx` ON `messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `messages_sender_idx` ON `messages` (`senderAccountId`);--> statement-breakpoint
CREATE INDEX `moderation_actions_entity_idx` ON `moderation_actions` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `moderation_actions_admin_created_idx` ON `moderation_actions` (`administratorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_created_idx` ON `notifications` (`recipientAccountId`,`readAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `post_hashtags_hashtag_idx` ON `post_hashtags` (`hashtagId`);--> statement-breakpoint
CREATE INDEX `post_mentions_account_idx` ON `post_mentions` (`accountId`);--> statement-breakpoint
CREATE INDEX `post_shares_post_idx` ON `post_shares` (`postId`);--> statement-breakpoint
CREATE INDEX `posts_author_created_idx` ON `posts` (`authorAccountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_visibility_created_idx` ON `posts` (`visibility`,`createdAt`);--> statement-breakpoint
CREATE INDEX `profiles_avatar_media_idx` ON `profiles` (`avatarMediaId`);--> statement-breakpoint
CREATE INDEX `reports_status_created_idx` ON `reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `saved_posts_account_created_idx` ON `saved_posts` (`accountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `stories_expiry_idx` ON `stories` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `stories_author_expiry_idx` ON `stories` (`authorAccountId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `story_views_viewer_idx` ON `story_views` (`viewerAccountId`);--> statement-breakpoint
CREATE INDEX `user_settings_active_account_idx` ON `user_settings` (`activeAccountId`);