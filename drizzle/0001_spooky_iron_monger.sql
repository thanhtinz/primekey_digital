CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionEmail` varchar(320) NOT NULL,
	`productId` int NOT NULL,
	`packageId` int,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt_cart` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_cart` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(50) NOT NULL,
	`totalReferrals` int DEFAULT 0,
	`totalRewards` decimal(15,2) DEFAULT '0',
	`createdAt_crc` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_referral_codes_email_unique` UNIQUE(`email`),
	CONSTRAINT `customer_referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `product_custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`fieldName` varchar(255) NOT NULL,
	`fieldValue` text,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `product_custom_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`rating` int NOT NULL,
	`comment` text,
	`invoiceId` int,
	`isApproved` boolean DEFAULT false,
	`createdAt_pr` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean DEFAULT false,
	`rewardType` enum('percentage','fixed','points') DEFAULT 'fixed',
	`rewardAmount` decimal(10,2) DEFAULT '0',
	`minOrderAmount` decimal(15,2) DEFAULT '0',
	`description` text,
	`createdAt_rs` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_rs` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerEmail` varchar(320) NOT NULL,
	`refereeEmail` varchar(320) NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`invoiceId` int,
	`rewardAmount` decimal(10,2) DEFAULT '0',
	`status_ref` enum('pending','completed','cancelled') DEFAULT 'pending',
	`createdAt_ref` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionEmail` varchar(320) NOT NULL,
	`productId` int NOT NULL,
	`createdAt_wl` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `isFeatured` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(50);