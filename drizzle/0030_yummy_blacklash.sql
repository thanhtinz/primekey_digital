ALTER TABLE `customers` ADD `notifyOnLogin` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyNewProduct` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyFlashSale` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyPromotion` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyOrderStatus` boolean DEFAULT true;