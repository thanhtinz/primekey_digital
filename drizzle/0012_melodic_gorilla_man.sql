ALTER TABLE `customers` ADD `totpSecret` varchar(64);--> statement-breakpoint
ALTER TABLE `customers` ADD `totpEnabled` boolean DEFAULT false;