ALTER TABLE `userSettings` ADD `licenseKey` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseActivated` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseActivatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licensePlan` varchar(50) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseOwner` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `licenseMessage` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `githubRepo` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `githubBranch` varchar(100) DEFAULT 'main';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `githubToken` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `githubWebhookSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `lastUpdateCheck` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `lastUpdateAt` timestamp;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `currentVersion` varchar(50) DEFAULT '1.0.0';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `latestVersion` varchar(50);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `updateAvailable` boolean DEFAULT false;