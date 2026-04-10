CREATE TABLE `image_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` int,
	`filename` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredCustomerId` int NOT NULL,
	`invoiceId` int,
	`commissionAmount` decimal(15,2) NOT NULL,
	`status` enum('pending','approved','paid','rejected') DEFAULT 'pending',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coupons` ADD `productId` int;