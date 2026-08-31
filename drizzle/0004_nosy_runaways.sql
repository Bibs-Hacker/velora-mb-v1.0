CREATE TABLE `admin_verification_reviews` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`reviewerUserId` int NOT NULL,
	`decision` enum('approved','rejected','revoked') NOT NULL,
	`reason` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_verification_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` varchar(36) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`userId` int,
	`accountId` varchar(36),
	`gender` enum('male','female','non_binary','undisclosed') NOT NULL DEFAULT 'undisclosed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_presence` (
	`conversationId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`isTyping` boolean NOT NULL DEFAULT false,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_presence_conversationId_accountId_pk` PRIMARY KEY(`conversationId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `feedback_submissions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('rating','feedback','bug') NOT NULL,
	`rating` int,
	`subject` varchar(160) NOT NULL,
	`body` varchar(3000) NOT NULL,
	`status` enum('open','reviewing','resolved','closed') NOT NULL DEFAULT 'open',
	`reviewerUserId` int,
	`adminNotes` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`messageId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`reaction` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_reactions_messageId_accountId_pk` PRIMARY KEY(`messageId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `poll_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` varchar(36) NOT NULL,
	`label` varchar(160) NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `poll_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `poll_options_position_unique` UNIQUE(`pollId`,`position`)
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`pollId` varchar(36) NOT NULL,
	`optionId` int NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poll_votes_pollId_accountId_pk` PRIMARY KEY(`pollId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` varchar(36) NOT NULL,
	`messageId` varchar(36) NOT NULL,
	`question` varchar(300) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `polls_id` PRIMARY KEY(`id`),
	CONSTRAINT `polls_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `story_archives` (
	`id` varchar(36) NOT NULL,
	`originalStoryId` varchar(36) NOT NULL,
	`ownerAccountId` varchar(36) NOT NULL,
	`mediaId` varchar(36) NOT NULL,
	`caption` varchar(500),
	`originalCreatedAt` timestamp NOT NULL,
	`expiredAt` timestamp NOT NULL,
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_archives_id` PRIMARY KEY(`id`),
	CONSTRAINT `story_archives_originalStoryId_unique` UNIQUE(`originalStoryId`)
);
--> statement-breakpoint
CREATE TABLE `user_safety_relations` (
	`actorAccountId` varchar(36) NOT NULL,
	`targetAccountId` varchar(36) NOT NULL,
	`relation` enum('blocked','muted') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `user_safety_relations_actorAccountId_targetAccountId_relation_pk` PRIMARY KEY(`actorAccountId`,`targetAccountId`,`relation`)
);
--> statement-breakpoint
ALTER TABLE `conversation_members` ADD `unreadCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `kind` enum('text','poll','voice','video') DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `profiles` ADD `coverMediaId` varchar(36);--> statement-breakpoint
ALTER TABLE `profiles` ADD `dateOfBirth` timestamp;--> statement-breakpoint
ALTER TABLE `profiles` ADD `avatarCrop` json;--> statement-breakpoint
ALTER TABLE `profiles` ADD `coverCrop` json;--> statement-breakpoint
ALTER TABLE `profiles` ADD `verificationStatus` enum('none','pending','verified','rejected') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_verification_reviews` ADD CONSTRAINT `admin_verification_reviews_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_verification_reviews` ADD CONSTRAINT `admin_verification_reviews_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_presence` ADD CONSTRAINT `conversation_presence_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_presence` ADD CONSTRAINT `conversation_presence_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD CONSTRAINT `feedback_submissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_submissions` ADD CONSTRAINT `feedback_submissions_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poll_options` ADD CONSTRAINT `poll_options_pollId_polls_id_fk` FOREIGN KEY (`pollId`) REFERENCES `polls`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_pollId_polls_id_fk` FOREIGN KEY (`pollId`) REFERENCES `polls`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_optionId_poll_options_id_fk` FOREIGN KEY (`optionId`) REFERENCES `poll_options`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `polls` ADD CONSTRAINT `polls_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `story_archives` ADD CONSTRAINT `story_archives_ownerAccountId_accounts_id_fk` FOREIGN KEY (`ownerAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `story_archives` ADD CONSTRAINT `story_archives_mediaId_media_assets_id_fk` FOREIGN KEY (`mediaId`) REFERENCES `media_assets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_safety_relations` ADD CONSTRAINT `user_safety_relations_actorAccountId_accounts_id_fk` FOREIGN KEY (`actorAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_safety_relations` ADD CONSTRAINT `user_safety_relations_targetAccountId_accounts_id_fk` FOREIGN KEY (`targetAccountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `verification_reviews_account_created_idx` ON `admin_verification_reviews` (`accountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_created_idx` ON `analytics_events` (`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `analytics_events_created_idx` ON `analytics_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `conversation_presence_seen_idx` ON `conversation_presence` (`conversationId`,`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `feedback_status_created_idx` ON `feedback_submissions` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `feedback_user_created_idx` ON `feedback_submissions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `poll_votes_option_idx` ON `poll_votes` (`optionId`);--> statement-breakpoint
CREATE INDEX `story_archives_owner_archived_idx` ON `story_archives` (`ownerAccountId`,`archivedAt`);--> statement-breakpoint
CREATE INDEX `safety_relations_target_idx` ON `user_safety_relations` (`targetAccountId`,`relation`);