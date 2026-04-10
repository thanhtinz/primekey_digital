ALTER TABLE `product_custom_fields` ADD `label` varchar(255);--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `fieldType` varchar(50) DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `placeholder` varchar(500);--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `description` text;--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `options` text;--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `isRequired` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `product_custom_fields` ADD `isVisible` boolean DEFAULT true;