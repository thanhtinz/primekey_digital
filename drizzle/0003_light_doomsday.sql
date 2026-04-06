CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('CREATED','PAID','SHIPPING','WARRANTY','REVIEW') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` mediumtext NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `headerColor` varchar(20) DEFAULT '#1e40af';--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `accentColor` varchar(20) DEFAULT '#3b82f6';--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `textColor` varchar(20) DEFAULT '#111827';--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `bgColor` varchar(20) DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `fontFamily` varchar(100) DEFAULT 'Arial';--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `showLogo` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `showTaxCode` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `showBankInfo` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `bankInfo` text;--> statement-breakpoint
ALTER TABLE `invoiceTemplates` ADD `notes` text;