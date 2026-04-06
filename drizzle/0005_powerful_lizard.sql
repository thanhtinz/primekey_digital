CREATE TABLE `invoiceNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminderLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`type` enum('24h','48h') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean DEFAULT true,
	CONSTRAINT `reminderLogs_id` PRIMARY KEY(`id`)
);
