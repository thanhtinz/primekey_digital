CREATE TABLE `product_tag_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `product_tag_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#3b82f6',
	`createdAt_pt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_tags_id` PRIMARY KEY(`id`)
);
