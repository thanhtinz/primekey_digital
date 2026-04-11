CREATE TABLE `mini_banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`linkUrl` varchar(500),
	`title` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mini_banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `side_banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`position` varchar(10) NOT NULL,
	`imageUrl` text NOT NULL,
	`linkUrl` varchar(500),
	`title` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `side_banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramOrderPaid` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramOrderShipping` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramOrderCompleted` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramWarranty` boolean DEFAULT false;