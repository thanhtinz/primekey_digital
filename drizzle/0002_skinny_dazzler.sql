CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`customerName` varchar(255),
	`productName` varchar(255),
	`isPublic` boolean DEFAULT true,
	`isApproved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `smtpConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`host` varchar(255),
	`port` int DEFAULT 587,
	`user` varchar(320),
	`password` text,
	`fromName` varchar(255),
	`fromEmail` varchar(320),
	`secure` boolean DEFAULT false,
	`enabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtpConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `smtpConfig_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('CREATED','PAID','SHIPPING','WARRANTY','FAILED','EXPIRED') DEFAULT 'CREATED';--> statement-breakpoint
ALTER TABLE `invoices` ADD `reviewToken` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `reviewSubmitted` boolean DEFAULT false;