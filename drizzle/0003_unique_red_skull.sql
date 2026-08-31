CREATE TABLE `recent_searches` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(120) NOT NULL,
	`kind` enum('user','post','hashtag','all') NOT NULL DEFAULT 'all',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recent_searches_id` PRIMARY KEY(`id`),
	CONSTRAINT `recent_searches_user_query_kind_unique` UNIQUE(`userId`,`query`,`kind`)
);
--> statement-breakpoint
ALTER TABLE `recent_searches` ADD CONSTRAINT `recent_searches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `recent_searches_user_created_idx` ON `recent_searches` (`userId`,`createdAt`);