ALTER TABLE `userSettings` ADD `siteTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteDescription` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteKeywords` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteAuthor` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteTimezone` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `hotline` varchar(50);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `fanpageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `copyrightFooter` varchar(500);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `maintenanceMode` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `autoUpdate` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `debugMode` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `debugAutoBank` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `debugApiSuppliers` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `fontFamily` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showApiDocs` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showAvatar` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showTelegramReminder` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showSlider` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showBanner` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showRecentlyViewed` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `headerScript` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `footerScript` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `adminFooterScript` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `themeColor` varchar(20);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `themeColor1` varchar(20);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `logoDarkUrl` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteImageUrl` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `avatarImageUrl` text;