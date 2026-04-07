ALTER TABLE `invoices` ADD `publicNote` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `isRecurring` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `invoices` ADD `recurringInterval` enum('weekly','monthly','quarterly');--> statement-breakpoint
ALTER TABLE `invoices` ADD `recurringNextDate` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `weeklyReportEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `telegramChatId` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `telegramBotToken` varchar(200);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `telegramEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `thankYouTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `thankYouMessage` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `thankYouSocialLinks` json;