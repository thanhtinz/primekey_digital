CREATE TABLE `avatar_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`label` varchar(100),
	`category` varchar(50) DEFAULT 'default',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt_ai` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avatar_images_id` PRIMARY KEY(`id`)
);
