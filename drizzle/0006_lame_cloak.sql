CREATE TABLE `conversation_preferences` (
	`conversationId` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`theme` enum('velora','orchid','midnight','ocean','sunset') NOT NULL DEFAULT 'velora',
	`backgroundMediaId` varchar(36),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_preferences_conversationId_accountId_pk` PRIMARY KEY(`conversationId`,`accountId`)
);
--> statement-breakpoint
ALTER TABLE `conversation_preferences` ADD CONSTRAINT `conversation_preferences_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_preferences` ADD CONSTRAINT `conversation_preferences_accountId_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_preferences` ADD CONSTRAINT `conversation_preferences_backgroundMediaId_media_assets_id_fk` FOREIGN KEY (`backgroundMediaId`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;