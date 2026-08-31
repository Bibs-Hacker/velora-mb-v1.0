ALTER TABLE `accounts` MODIFY COLUMN `status` enum('active','suspended','banned','deactivated') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `accounts` ADD `suspendedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `accounts` ADD `suspensionReason` varchar(1000);