CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`changes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`taxCode` varchar(50),
	`totalSpent` decimal(15,2) DEFAULT '0',
	`totalPaid` decimal(15,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('percentage','fixed') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`maxUsage` int,
	`usageCount` int DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discountCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`productId` int,
	`name` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(15,2) NOT NULL,
	`discount` decimal(15,2) DEFAULT '0',
	`taxId` int,
	`taxAmount` decimal(15,2) DEFAULT '0',
	`totalAmount` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyAddress` text,
	`companyPhone` varchar(20),
	`companyEmail` varchar(320),
	`companyTaxCode` varchar(50),
	`logo` text,
	`invoiceTitle` varchar(255) DEFAULT 'Hóa Đơn Bán Hàng',
	`footer` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`templateId` int,
	`currency` enum('VND','USD') DEFAULT 'VND',
	`subtotal` decimal(15,2) NOT NULL,
	`discountAmount` decimal(15,2) DEFAULT '0',
	`discountCodeId` int,
	`taxAmount` decimal(15,2) DEFAULT '0',
	`totalAmount` decimal(15,2) NOT NULL,
	`status` enum('PENDING','PAID','FAILED','EXPIRED') DEFAULT 'PENDING',
	`paymentMethod` enum('PAYOS','PAYPAL','BANK_TRANSFER','CASH'),
	`paymentUrl` text,
	`qrCode` text,
	`paymentTransactionId` varchar(100),
	`paidAt` timestamp,
	`expiresAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentGatewaysConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payosApiKey` text,
	`payosClientId` text,
	`payosChecksumKey` text,
	`paypalClientId` text,
	`paypalSecretKey` text,
	`paypalMode` enum('sandbox','live') DEFAULT 'sandbox',
	`invoiceExpiryHours` int DEFAULT 48,
	`enableWebhook` boolean DEFAULT true,
	`enableEmailNotification` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentGatewaysConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentGatewaysConfig_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`price` decimal(15,2) NOT NULL,
	`taxId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('percentage','fixed') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`mode` enum('inclusive','exclusive') DEFAULT 'exclusive',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`companyEmail` varchar(320),
	`companyPhone` varchar(20),
	`companyAddress` text,
	`taxId` varchar(50),
	`website` varchar(500),
	`emailNotifications` boolean DEFAULT true,
	`invoiceReminder` boolean DEFAULT true,
	`paymentConfirmation` boolean DEFAULT true,
	`weeklyReport` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `lastSignedIn`;