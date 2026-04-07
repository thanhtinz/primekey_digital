CREATE TABLE `product_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`originalPrice` decimal(15,2),
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_packages_id` PRIMARY KEY(`id`)
);
