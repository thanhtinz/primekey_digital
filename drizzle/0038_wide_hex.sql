CREATE TABLE `system_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`isPinned` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_broadcasts_id` PRIMARY KEY(`id`)
);
