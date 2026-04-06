CREATE TABLE `emailCampaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
	`sentAt` timestamp,
	`errorMessage` text,
	CONSTRAINT `emailCampaignRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` mediumtext NOT NULL,
	`status` enum('DRAFT','SENDING','SENT','FAILED') NOT NULL DEFAULT 'DRAFT',
	`targetType` enum('ALL','PAID','UNPAID','CUSTOM') NOT NULL DEFAULT 'ALL',
	`totalRecipients` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
