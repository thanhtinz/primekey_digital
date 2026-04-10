CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`target` enum('_self','_blank') NOT NULL DEFAULT '_self',
	`order` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`packageId` int,
	`stockData` text NOT NULL,
	`status` enum('available','used','reserved') NOT NULL DEFAULT 'available',
	`assignedOrderId` int,
	`assignedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `static_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` text DEFAULT (''),
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `static_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `static_pages_slug_unique` UNIQUE(`slug`)
);
