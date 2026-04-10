ALTER TABLE `customers` ADD `telegramChatId` varchar(100);--> statement-breakpoint
ALTER TABLE `customers` ADD `telegramUsername` varchar(100);--> statement-breakpoint
ALTER TABLE `customers` ADD `telegramLinkedAt` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramOrderStatus` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramPromotion` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `notifyTelegramFlashSale` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyStatusUpdate` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyNewReview` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyNewTopup` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyFlashSaleEnd` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyDailyReport` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyNewTicket` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyWithdrawal` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyOrderShipping` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyWarranty` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyFlashSale` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `telegram_bot_config` ADD `notifyPromotion` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureFlashSale` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureCoupons` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureAffiliate` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureLoyalty` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureBlog` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureWarranty` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureSpinWheel` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureTopup` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureTicket` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureReview` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureCart` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureWishlist` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `featureCompare` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxName` varchar(50) DEFAULT 'VAT';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxRate` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxIncluded` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxCompanyName` varchar(255);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `taxAddress` text;