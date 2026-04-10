CREATE TABLE `automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`jobType` varchar(100) NOT NULL,
	`intervalSeconds` bigint NOT NULL DEFAULT 86400,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`runCount` int DEFAULT 0,
	`createdAt_auto` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocked_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`reason` varchar(255),
	`blockedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `blocked_ips_id` PRIMARY KEY(`id`)
);
