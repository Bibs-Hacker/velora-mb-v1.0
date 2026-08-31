CREATE TABLE `platform_jobs` (
	`id` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastCompletedAt` timestamp,
	`lastError` varchar(1000),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_jobs_schedule_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
