ALTER TABLE `customers` ADD `resetPasswordToken` varchar(128);--> statement-breakpoint
ALTER TABLE `customers` ADD `resetPasswordExpires` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD `loginAttempts` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customers` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD `lastLoginAt` timestamp;