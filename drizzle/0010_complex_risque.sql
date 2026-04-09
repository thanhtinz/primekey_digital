CREATE TABLE `site_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`sa_type` enum('info','success','warning','error') DEFAULT 'info',
	`isActive` boolean DEFAULT true,
	`showAsPopup` boolean DEFAULT false,
	`startAt` timestamp NOT NULL DEFAULT (now()),
	`endAt` timestamp,
	`createdAt_sa` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `emailVerificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `invoices` ADD `orderInfo` text;