CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`imageUrl` text NOT NULL,
	`linkUrl` varchar(500),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt_bn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taxName` varchar(100) DEFAULT 'VAT',
	`taxRate` decimal(5,2) DEFAULT '0',
	`isEnabled` boolean DEFAULT false,
	`apply_to` enum('all','specific') DEFAULT 'all',
	`createdAt_ts` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_ts` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`wt_type` enum('topup','spend','refund','reward') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`balanceBefore` decimal(15,2) DEFAULT '0',
	`balanceAfter` decimal(15,2) DEFAULT '0',
	`description` varchar(500),
	`invoiceId` int,
	`payosOrderCode` int,
	`wt_status` enum('pending','completed','failed') DEFAULT 'completed',
	`createdAt_wt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `customers` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `walletBalance` decimal(15,2) DEFAULT '0';