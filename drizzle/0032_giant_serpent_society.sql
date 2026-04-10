ALTER TABLE `userSettings` ADD `requireLoginToView` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showSoldCount` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `allowProductReview` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `telegramOrderChatId` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `orderCodeType` varchar(20) DEFAULT 'random';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `orderCodeLength` int DEFAULT 8;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `orderCodePrefix` varchar(20);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteAddress` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `siteCopyright` varchar(500);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxLoginAttempts` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxAccountAttempts` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxApiAttempts` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMax2faAttempts` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxOtpAttempts` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxTopupAttempts` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxPasswordResetAttempts` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `bfMaxApiWhitelistAttempts` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `adminPanelMaxWrongUrl` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `adminSingleIp` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `adminSingleDevice` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `clientSingleDevice` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `adminPanelPath` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showAdminPanelButton` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `maxRegisterPerIp` int DEFAULT 1000;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `sessionDuration` int DEFAULT 86400;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `cronJobSecret` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `requireStrongPassword` boolean DEFAULT false;