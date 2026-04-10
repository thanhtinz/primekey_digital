ALTER TABLE `userSettings` ADD `featureAvatarGallery` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureThankYou` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureCustom404` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404Title` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404Message` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404ButtonText` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404ButtonUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404ImageUrl` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404BgColor` varchar(20);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `custom404TextColor` varchar(20);