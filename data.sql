-- ============================================================
-- PayOS Invoice Tool - Database Schema
-- Chỉ chứa cấu trúc bảng (không có dữ liệu người dùng)
-- Tạo tự động từ Drizzle migrations
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`changes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `coupon_usages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`customerEmail` varchar(320),
	`discountAmount` decimal(15,2) NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupon_usages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percent','fixed') NOT NULL DEFAULT 'percent',
	`discountValue` decimal(15,2) NOT NULL,
	`minOrderAmount` decimal(15,2) DEFAULT '0',
	`maxDiscountAmount` decimal(15,2),
	`maxUses` int DEFAULT 0,
	`usedCount` int DEFAULT 0,
	`maxUsesPerCustomer` int DEFAULT 1,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);

CREATE TABLE `customer_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt_cs` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_sessions_token_unique` UNIQUE(`token`)
);

CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`taxCode` varchar(50),
	`totalSpent` decimal(15,2) DEFAULT '0',
	`totalPaid` decimal(15,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);

CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('percentage','fixed') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`maxUsage` int,
	`usageCount` int DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `discountCodes_code_unique` UNIQUE(`code`)
);

CREATE TABLE `emailCampaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
	`sentAt` timestamp,
	`errorMessage` text,
	CONSTRAINT `emailCampaignRecipients_id` PRIMARY KEY(`id`)
);

CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` mediumtext NOT NULL,
	`status` enum('DRAFT','SENDING','SENT','FAILED') NOT NULL DEFAULT 'DRAFT',
	`targetType` enum('ALL','PAID','UNPAID','CUSTOM') NOT NULL DEFAULT 'ALL',
	`totalRecipients` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);

CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('CREATED','PAID','SHIPPING','WARRANTY','REVIEW') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` mediumtext NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);

CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` varchar(100) DEFAULT 'Chung',
	`sortOrder` int DEFAULT 0,
	`isPublished` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `flash_sale_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flash_sale_subscribers_id` PRIMARY KEY(`id`)
);

CREATE TABLE `flashSales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`originalPrice` decimal(15,2) NOT NULL,
	`salePrice` decimal(15,2) NOT NULL,
	`discountPercent` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`maxQuantity` int DEFAULT 0,
	`soldQuantity` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flashSales_id` PRIMARY KEY(`id`)
);

CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`productId` int,
	`name` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(15,2) NOT NULL,
	`discount` decimal(15,2) DEFAULT '0',
	`taxId` int,
	`taxAmount` decimal(15,2) DEFAULT '0',
	`totalAmount` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);

CREATE TABLE `invoiceNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceNotes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `invoiceTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL DEFAULT '',
	`companyAddress` text,
	`companyPhone` varchar(20),
	`companyEmail` varchar(320),
	`companyTaxCode` varchar(50),
	`logo` text,
	`invoiceTitle` varchar(255) DEFAULT 'Hóa Đơn Bán Hàng',
	`footer` text,
	`headerColor` varchar(20) DEFAULT '#1e40af',
	`accentColor` varchar(20) DEFAULT '#3b82f6',
	`textColor` varchar(20) DEFAULT '#111827',
	`bgColor` varchar(20) DEFAULT '#ffffff',
	`fontFamily` varchar(100) DEFAULT 'Arial',
	`showLogo` boolean DEFAULT true,
	`showTaxCode` boolean DEFAULT true,
	`showBankInfo` boolean DEFAULT false,
	`bankInfo` text,
	`notes` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceTemplates_id` PRIMARY KEY(`id`)
);

CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`templateId` int,
	`currency` enum('VND','USD') DEFAULT 'VND',
	`subtotal` decimal(15,2) NOT NULL,
	`discountAmount` decimal(15,2) DEFAULT '0',
	`discountCodeId` int,
	`taxAmount` decimal(15,2) DEFAULT '0',
	`totalAmount` decimal(15,2) NOT NULL,
	`status` enum('CREATED','PAID','SHIPPING','WARRANTY','FAILED','EXPIRED') DEFAULT 'CREATED',
	`reviewToken` varchar(64),
	`reviewSubmitted` boolean DEFAULT false,
	`paymentMethod` enum('PAYOS','PAYPAL','BANK_TRANSFER','CASH'),
	`paymentUrl` text,
	`qrCode` text,
	`paymentTransactionId` varchar(100),
	`paidAt` timestamp,
	`expiresAt` timestamp,
	`notes` text,
	`publicNote` text,
	`warrantyStartDate` timestamp,
	`warrantyExpiryDate` timestamp,
	`warrantyMonths` int DEFAULT 0,
	`isRecurring` boolean DEFAULT false,
	`recurringInterval` enum('weekly','monthly','quarterly'),
	`recurringNextDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);

CREATE TABLE `loyalty_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`points` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`invoiceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_points_id` PRIMARY KEY(`id`)
);

CREATE TABLE `loyalty_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pointsPerAmount` int DEFAULT 1000,
	`redeemRate` int DEFAULT 100,
	`isEnabled` boolean DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_settings_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `paymentGatewaysConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payosApiKey` text,
	`payosClientId` text,
	`payosChecksumKey` text,
	`paypalClientId` text,
	`paypalSecretKey` text,
	`paypalMode` enum('sandbox','live') DEFAULT 'sandbox',
	`invoiceExpiryHours` int DEFAULT 48,
	`enableWebhook` boolean DEFAULT true,
	`enableEmailNotification` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentGatewaysConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentGatewaysConfig_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`icon` varchar(100),
	`parentId` int,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`originalPrice` decimal(15,2),
	`description` text,
	`warrantyMonths` int DEFAULT 0,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_packages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`categoryId` int,
	`price` decimal(15,2) DEFAULT '0',
	`taxId` int,
	`warrantyMonths` int DEFAULT 0,
	`imageUrl` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);

CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`reason` text NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED','PROCESSED') NOT NULL DEFAULT 'PENDING',
	`adminNote` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);

CREATE TABLE `reminderLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`type` enum('24h','48h') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean DEFAULT true,
	CONSTRAINT `reminderLogs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`customerName` varchar(255),
	`productName` varchar(255),
	`isPublic` boolean DEFAULT true,
	`isApproved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_token_unique` UNIQUE(`token`)
);

CREATE TABLE `smtpConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`host` varchar(255),
	`port` int DEFAULT 587,
	`user` varchar(320),
	`password` text,
	`fromName` varchar(255),
	`fromEmail` varchar(320),
	`secure` boolean DEFAULT false,
	`enabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtpConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `smtpConfig_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `taxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('percentage','fixed') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`mode` enum('inclusive','exclusive') DEFAULT 'exclusive',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`companyEmail` varchar(320),
	`companyPhone` varchar(20),
	`companyAddress` text,
	`taxId` varchar(50),
	`website` varchar(500),
	`logoUrl` text,
	`faviconUrl` text,
	`emailNotifications` boolean DEFAULT true,
	`invoiceReminder` boolean DEFAULT true,
	`reminderHoursBefore` int DEFAULT 24,
	`paymentConfirmation` boolean DEFAULT true,
	`weeklyReport` boolean DEFAULT false,
	`weeklyReportEmail` varchar(320),
	`telegramChatId` varchar(100),
	`telegramBotToken` varchar(200),
	`telegramEnabled` boolean DEFAULT false,
	`thankYouTitle` varchar(255),
	`thankYouMessage` text,
	`thankYouSocialLinks` json,
	`thankYouBgFrom` varchar(50),
	`thankYouBgTo` varchar(50),
	`thankYouBannerUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE `vat_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int,
	`companyName` varchar(255) NOT NULL,
	`taxCode` varchar(50) NOT NULL,
	`companyAddress` text,
	`companyEmail` varchar(320),
	`vatRate` int DEFAULT 10,
	`status_vat` enum('PENDING','ISSUED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`createdAt_vat` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_vat` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vat_invoices_id` PRIMARY KEY(`id`)
);

CREATE TABLE `warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(20),
	`productNames` text,
	`reason` text,
	`status` enum('PENDING','IN_PROGRESS','COMPLETED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`resolution` text,
	`warrantyStartDate` timestamp,
	`warrantyExpiryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warranties_id` PRIMARY KEY(`id`)
);

CREATE TABLE `warranty_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`warrantyId` int,
	`invoiceCode` varchar(100),
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`customerPhone` varchar(20),
	`description` text NOT NULL,
	`imageUrls` text,
	`status` enum('PENDING','PROCESSING','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warranty_requests_id` PRIMARY KEY(`id`)
);

CREATE TABLE `warrantySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultMonths` int DEFAULT 12,
	`termsAndConditions` text,
	`contactInfo` text,
	`autoActivateOnPaid` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warrantySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `warrantySettings_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionEmail` varchar(320) NOT NULL,
	`productId` int NOT NULL,
	`packageId` int,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt_cart` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_cart` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);

CREATE TABLE `customer_referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(50) NOT NULL,
	`totalReferrals` int DEFAULT 0,
	`totalRewards` decimal(15,2) DEFAULT '0',
	`createdAt_crc` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_referral_codes_email_unique` UNIQUE(`email`),
	CONSTRAINT `customer_referral_codes_code_unique` UNIQUE(`code`)
);

CREATE TABLE `product_custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`fieldName` varchar(255) NOT NULL,
	`fieldValue` text,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `product_custom_fields_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`rating` int NOT NULL,
	`comment` text,
	`invoiceId` int,
	`isApproved` boolean DEFAULT false,
	`createdAt_pr` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_reviews_id` PRIMARY KEY(`id`)
);

CREATE TABLE `referral_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean DEFAULT false,
	`rewardType` enum('percentage','fixed','points') DEFAULT 'fixed',
	`rewardAmount` decimal(10,2) DEFAULT '0',
	`minOrderAmount` decimal(15,2) DEFAULT '0',
	`description` text,
	`createdAt_rs` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_rs` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_settings_id` PRIMARY KEY(`id`)
);

CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerEmail` varchar(320) NOT NULL,
	`refereeEmail` varchar(320) NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`invoiceId` int,
	`rewardAmount` decimal(10,2) DEFAULT '0',
	`status_ref` enum('pending','completed','cancelled') DEFAULT 'pending',
	`createdAt_ref` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);

CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionEmail` varchar(320) NOT NULL,
	`productId` int NOT NULL,
	`createdAt_wl` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`)
);

ALTER TABLE `products` ADD `isFeatured` boolean DEFAULT false;

ALTER TABLE `users` ADD `avatarUrl` text;

ALTER TABLE `users` ADD `referralCode` varchar(50);

ALTER TABLE `cart_items` ADD `customFieldValues` text;

ALTER TABLE `customer_sessions` ADD `avatarUrl` text;

CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`imageUrl` text NOT NULL,
	`linkUrl` varchar(500),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt_bn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);

CREATE TABLE `tax_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taxName` varchar(100) DEFAULT 'VAT',
	`taxRate` decimal(5,2) DEFAULT '0',
	`isEnabled` boolean DEFAULT false,
	`apply_to` enum('all','specific') DEFAULT 'all',
	`createdAt_ts` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_ts` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_settings_id` PRIMARY KEY(`id`)
);

CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`wt_type` enum('topup','spend','refund','reward') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`balanceBefore` decimal(15,2) DEFAULT '0',
	`balanceAfter` decimal(15,2) DEFAULT '0',
	`description` varchar(500),
	`invoiceId` int,
	`payosOrderCode` int,
	`wt_status` enum('pending','completed','failed') DEFAULT 'completed',
	`createdAt_wt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);

ALTER TABLE `customers` ADD `passwordHash` varchar(255);

ALTER TABLE `customers` ADD `emailVerified` boolean DEFAULT false;

ALTER TABLE `customers` ADD `walletBalance` decimal(15,2) DEFAULT '0';

CREATE TABLE `loyalty_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`pointsUsed` int NOT NULL,
	`redemption_status` enum('pending','fulfilled','cancelled') DEFAULT 'pending',
	`couponCode` varchar(50),
	`adminNote` text,
	`createdAt_lrd` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_redemptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `loyalty_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`pointsCost` int NOT NULL,
	`reward_type` enum('discount_code','wallet_credit','physical','custom') DEFAULT 'discount_code',
	`rewardValue` decimal(15,2) DEFAULT '0',
	`stock` int DEFAULT -1,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt_lr` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_rewards_id` PRIMARY KEY(`id`)
);

CREATE TABLE `referral_withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`amount` decimal(15,2) NOT NULL,
	`withdraw_type` enum('atm','wallet') NOT NULL,
	`bankName` varchar(100),
	`bankAccount` varchar(50),
	`bankHolder` varchar(255),
	`withdraw_status` enum('pending','processing','completed','rejected') DEFAULT 'pending',
	`adminNote` text,
	`createdAt_rw` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_rw` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_withdrawals_id` PRIMARY KEY(`id`)
);

CREATE TABLE `spin_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`spinWheelItemId` int NOT NULL,
	`prizeType` varchar(50),
	`prizeValue` decimal(15,2) DEFAULT '0',
	`pointsUsed` int DEFAULT 0,
	`createdAt_sh` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spin_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE `spin_wheel_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean DEFAULT false,
	`pointsPerSpin` int DEFAULT 50,
	`spinsPerDay` int DEFAULT 1,
	`updatedAt_swc` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spin_wheel_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `spin_wheel_config_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `spin_wheel_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`prize_type` enum('points','wallet_credit','coupon','nothing') DEFAULT 'points',
	`prizeValue` decimal(15,2) DEFAULT '0',
	`probability` decimal(5,2) DEFAULT '10',
	`color` varchar(20) DEFAULT '#4F46E5',
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `spin_wheel_items_id` PRIMARY KEY(`id`)
);

ALTER TABLE `customers` ADD `resetPasswordToken` varchar(128);

ALTER TABLE `customers` ADD `resetPasswordExpires` timestamp;

ALTER TABLE `customers` ADD `loginAttempts` int DEFAULT 0;

ALTER TABLE `customers` ADD `lockedUntil` timestamp;

ALTER TABLE `customers` ADD `lastLoginAt` timestamp;

ALTER TABLE `invoices` ADD `payosOrderCode` varchar(50);

CREATE TABLE `customer_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`cn_type` enum('info','success','warning','order','payment','promo') DEFAULT 'info',
	`isRead` boolean DEFAULT false,
	`link` varchar(500),
	`cn_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_notifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`ticket_status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
	`ticket_priority` enum('low','medium','high') DEFAULT 'medium',
	`adminReply` text,
	`repliedAt` timestamp,
	`invoiceId` int,
	`ticket_createdAt` timestamp NOT NULL DEFAULT (now()),
	`ticket_updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_tag_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `product_tag_mappings_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#3b82f6',
	`createdAt_pt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_tags_id` PRIMARY KEY(`id`)
);

CREATE TABLE `site_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`sa_type` enum('info','success','warning','error') DEFAULT 'info',
	`isActive` boolean DEFAULT true,
	`showAsPopup` boolean DEFAULT false,
	`startAt` timestamp NOT NULL DEFAULT (now()),
	`endAt` timestamp,
	`createdAt_sa` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_announcements_id` PRIMARY KEY(`id`)
);

ALTER TABLE `customers` ADD `emailVerificationToken` varchar(128);

ALTER TABLE `invoices` ADD `orderInfo` text;

ALTER TABLE `invoices` MODIFY COLUMN `status` enum('CREATED','PAID','SHIPPING','WARRANTY','FAILED','EXPIRED','REFUNDED') DEFAULT 'CREATED';

ALTER TABLE `customers` ADD `totpSecret` varchar(64);

ALTER TABLE `customers` ADD `totpEnabled` boolean DEFAULT false;

CREATE TABLE `blog_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`sortOrder` int DEFAULT 0,
	`createdAt_bc` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_categories_id` PRIMARY KEY(`id`)
);

CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`title` varchar(255) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`coverImage` varchar(500),
	`isPublished` boolean DEFAULT false,
	`publishedAt` timestamp,
	`viewCount` int DEFAULT 0,
	`createdAt_bp` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_bp` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`)
);

ALTER TABLE `customers` ADD `avatarUrl` text;

ALTER TABLE `invoiceItems` ADD `productReviewToken` varchar(64);

ALTER TABLE `invoiceItems` ADD `productReviewSubmitted` boolean DEFAULT false;

ALTER TABLE `customer_sessions` ADD `isAdminSession` boolean DEFAULT false;

CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`label` varchar(200) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`category` varchar(100) DEFAULT 'general',
	`updatedAt_ff` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`),
	CONSTRAINT `feature_flags_key_unique` UNIQUE(`key`)
);

ALTER TABLE `wallet_transactions` MODIFY COLUMN `payosOrderCode` bigint;

CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(64),
	`userAgent` text,
	`deviceInfo` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'success',
	`failReason` varchar(255),
	`sessionToken` varchar(128),
	`createdAt_lh` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE `avatar_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`label` varchar(100),
	`category` varchar(50) DEFAULT 'default',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt_ai` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avatar_images_id` PRIMARY KEY(`id`)
);

ALTER TABLE `invoices` MODIFY COLUMN `status` enum('CREATED','PAID','SHIPPING','COMPLETED','WARRANTY','FAILED','EXPIRED','REFUNDED','CANCELLED') DEFAULT 'CREATED';

ALTER TABLE `product_tags` ADD `icon` varchar(50);

CREATE TABLE `automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`jobType` varchar(100) NOT NULL,
	`intervalSeconds` bigint NOT NULL DEFAULT 86400,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`runCount` int DEFAULT 0,
	`createdAt_auto` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);

CREATE TABLE `blocked_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`reason` varchar(255),
	`blockedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `blocked_ips_id` PRIMARY KEY(`id`)
);

CREATE TABLE `image_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` int,
	`filename` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_files_id` PRIMARY KEY(`id`)
);

CREATE TABLE `image_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_folders_id` PRIMARY KEY(`id`)
);

CREATE TABLE `referral_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredCustomerId` int NOT NULL,
	`invoiceId` int,
	`commissionAmount` decimal(15,2) NOT NULL,
	`status` enum('pending','approved','paid','rejected') DEFAULT 'pending',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_commissions_id` PRIMARY KEY(`id`)
);

ALTER TABLE `coupons` ADD `productId` int;

ALTER TABLE `customers` ADD `customerRole` enum('customer','vip','wholesale','partner') DEFAULT 'customer';

CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`target` enum('_self','_blank') NOT NULL DEFAULT '_self',
	`order` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`packageId` int,
	`stockData` text NOT NULL,
	`status` enum('available','used','reserved') NOT NULL DEFAULT 'available',
	`assignedOrderId` int,
	`assignedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_inventory_id` PRIMARY KEY(`id`)
);

CREATE TABLE `static_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` text DEFAULT (''),
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `static_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `static_pages_slug_unique` UNIQUE(`slug`)
);

ALTER TABLE `static_pages` MODIFY COLUMN `content` text;

ALTER TABLE `products` ADD `inventoryType` enum('manual','warehouse') DEFAULT 'manual' NOT NULL;

ALTER TABLE `product_packages` ADD `priceVip` decimal(15,2);

ALTER TABLE `product_packages` ADD `priceWholesale` decimal(15,2);

ALTER TABLE `product_packages` ADD `pricePartner` decimal(15,2);

ALTER TABLE `customers` ADD `notifyOnLogin` boolean DEFAULT false;

ALTER TABLE `customers` ADD `notifyNewProduct` boolean DEFAULT false;

ALTER TABLE `customers` ADD `notifyFlashSale` boolean DEFAULT false;

ALTER TABLE `customers` ADD `notifyPromotion` boolean DEFAULT true;

ALTER TABLE `customers` ADD `notifyOrderStatus` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `siteTitle` varchar(255);

ALTER TABLE `userSettings` ADD `siteDescription` text;

ALTER TABLE `userSettings` ADD `siteKeywords` text;

ALTER TABLE `userSettings` ADD `siteAuthor` varchar(255);

ALTER TABLE `userSettings` ADD `siteTimezone` varchar(100);

ALTER TABLE `userSettings` ADD `hotline` varchar(50);

ALTER TABLE `userSettings` ADD `fanpageUrl` varchar(500);

ALTER TABLE `userSettings` ADD `copyrightFooter` varchar(500);

ALTER TABLE `userSettings` ADD `maintenanceMode` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `autoUpdate` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `debugMode` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `debugAutoBank` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `debugApiSuppliers` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `fontFamily` varchar(100);

ALTER TABLE `userSettings` ADD `showApiDocs` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `showAvatar` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `showTelegramReminder` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `showSlider` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `showBanner` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `showRecentlyViewed` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `headerScript` text;

ALTER TABLE `userSettings` ADD `footerScript` text;

ALTER TABLE `userSettings` ADD `adminFooterScript` text;

ALTER TABLE `userSettings` ADD `themeColor` varchar(20);

ALTER TABLE `userSettings` ADD `themeColor1` varchar(20);

ALTER TABLE `userSettings` ADD `logoDarkUrl` text;

ALTER TABLE `userSettings` ADD `siteImageUrl` text;

ALTER TABLE `userSettings` ADD `avatarImageUrl` text;

ALTER TABLE `userSettings` ADD `requireLoginToView` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `showSoldCount` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `allowProductReview` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `telegramOrderChatId` varchar(100);

ALTER TABLE `userSettings` ADD `orderCodeType` varchar(20) DEFAULT 'random';

ALTER TABLE `userSettings` ADD `orderCodeLength` int DEFAULT 8;

ALTER TABLE `userSettings` ADD `orderCodePrefix` varchar(20);

ALTER TABLE `userSettings` ADD `siteAddress` text;

ALTER TABLE `userSettings` ADD `siteCopyright` varchar(500);

ALTER TABLE `userSettings` ADD `bfMaxLoginAttempts` int DEFAULT 5;

ALTER TABLE `userSettings` ADD `bfMaxAccountAttempts` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `bfMaxApiAttempts` int DEFAULT 20;

ALTER TABLE `userSettings` ADD `bfMax2faAttempts` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `bfMaxOtpAttempts` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `bfMaxTopupAttempts` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `bfMaxPasswordResetAttempts` int DEFAULT 5;

ALTER TABLE `userSettings` ADD `bfMaxApiWhitelistAttempts` int DEFAULT 20;

ALTER TABLE `userSettings` ADD `adminPanelMaxWrongUrl` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `adminSingleIp` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `adminSingleDevice` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `clientSingleDevice` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `adminPanelPath` varchar(100);

ALTER TABLE `userSettings` ADD `showAdminPanelButton` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `maxRegisterPerIp` int DEFAULT 1000;

ALTER TABLE `userSettings` ADD `sessionDuration` int DEFAULT 86400;

ALTER TABLE `userSettings` ADD `cronJobSecret` varchar(100);

ALTER TABLE `userSettings` ADD `requireStrongPassword` boolean DEFAULT false;

CREATE TABLE `telegram_bot_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`botType` enum('admin','user') NOT NULL,
	`botToken` varchar(200),
	`botUsername` varchar(100),
	`chatId` varchar(100),
	`enabled` boolean NOT NULL DEFAULT false,
	`webhookSet` boolean NOT NULL DEFAULT false,
	`notifyNewOrder` boolean DEFAULT true,
	`notifyPayment` boolean DEFAULT true,
	`notifyRefund` boolean DEFAULT true,
	`notifyNewCustomer` boolean DEFAULT false,
	`notifyLowStock` boolean DEFAULT false,
	`notifyOrderStatus` boolean DEFAULT true,
	`notifyOrderCreated` boolean DEFAULT true,
	`notifyOrderPaid` boolean DEFAULT true,
	`notifyOrderCompleted` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_bot_config_id` PRIMARY KEY(`id`)
);

CREATE TABLE `telegram_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` int NOT NULL,
	`chatId` varchar(100) NOT NULL,
	`username` varchar(100),
	`firstName` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`lastInteraction` timestamp,
	CONSTRAINT `telegram_subscribers_id` PRIMARY KEY(`id`)
);

ALTER TABLE `customers` ADD `telegramChatId` varchar(100);

ALTER TABLE `customers` ADD `telegramUsername` varchar(100);

ALTER TABLE `customers` ADD `telegramLinkedAt` timestamp;

ALTER TABLE `customers` ADD `notifyTelegramOrderStatus` boolean DEFAULT true;

ALTER TABLE `customers` ADD `notifyTelegramPromotion` boolean DEFAULT false;

ALTER TABLE `customers` ADD `notifyTelegramFlashSale` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyStatusUpdate` boolean DEFAULT true;

ALTER TABLE `telegram_bot_config` ADD `notifyNewReview` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyNewTopup` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyFlashSaleEnd` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyDailyReport` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyNewTicket` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyWithdrawal` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyOrderShipping` boolean DEFAULT true;

ALTER TABLE `telegram_bot_config` ADD `notifyWarranty` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyFlashSale` boolean DEFAULT false;

ALTER TABLE `telegram_bot_config` ADD `notifyPromotion` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `featureFlashSale` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureCoupons` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureAffiliate` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureLoyalty` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureBlog` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureWarranty` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureSpinWheel` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `featureTopup` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureTicket` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureReview` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureCart` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureWishlist` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureCompare` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `taxEnabled` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `taxName` varchar(50) DEFAULT 'VAT';

ALTER TABLE `userSettings` ADD `taxRate` int DEFAULT 10;

ALTER TABLE `userSettings` ADD `taxIncluded` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `taxNumber` varchar(50);

ALTER TABLE `userSettings` ADD `taxCompanyName` varchar(255);

ALTER TABLE `userSettings` ADD `taxAddress` text;

ALTER TABLE `userSettings` ADD `featureAvatarGallery` boolean DEFAULT true;

ALTER TABLE `userSettings` ADD `featureThankYou` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `featureCustom404` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `custom404Title` varchar(255);

ALTER TABLE `userSettings` ADD `custom404Message` text;

ALTER TABLE `userSettings` ADD `custom404ButtonText` varchar(100);

ALTER TABLE `userSettings` ADD `custom404ButtonUrl` varchar(500);

ALTER TABLE `userSettings` ADD `custom404ImageUrl` text;

ALTER TABLE `userSettings` ADD `custom404BgColor` varchar(20);

ALTER TABLE `userSettings` ADD `custom404TextColor` varchar(20);

ALTER TABLE `banners` ADD `targetPages` text;

ALTER TABLE `site_announcements` ADD `targetPages` text;

ALTER TABLE `product_custom_fields` ADD `label` varchar(255);

ALTER TABLE `product_custom_fields` ADD `fieldType` varchar(50) DEFAULT 'text';

ALTER TABLE `product_custom_fields` ADD `placeholder` varchar(500);

ALTER TABLE `product_custom_fields` ADD `description` text;

ALTER TABLE `product_custom_fields` ADD `options` text;

ALTER TABLE `product_custom_fields` ADD `isRequired` boolean DEFAULT false;

ALTER TABLE `product_custom_fields` ADD `isVisible` boolean DEFAULT true;

CREATE TABLE `system_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`isPinned` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_broadcasts_id` PRIMARY KEY(`id`)
);

ALTER TABLE `userSettings` ADD `licenseKey` varchar(255);

ALTER TABLE `userSettings` ADD `licenseActivated` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `licenseActivatedAt` timestamp;

ALTER TABLE `userSettings` ADD `licenseExpiresAt` timestamp;

ALTER TABLE `userSettings` ADD `licensePlan` varchar(50) DEFAULT 'standard';

ALTER TABLE `userSettings` ADD `licenseDomain` varchar(255);

ALTER TABLE `userSettings` ADD `licenseOwner` varchar(255);

ALTER TABLE `userSettings` ADD `licenseMessage` text;

ALTER TABLE `userSettings` ADD `githubRepo` varchar(255);

ALTER TABLE `userSettings` ADD `githubBranch` varchar(100) DEFAULT 'main';

ALTER TABLE `userSettings` ADD `githubToken` varchar(255);

ALTER TABLE `userSettings` ADD `githubWebhookSecret` varchar(255);

ALTER TABLE `userSettings` ADD `lastUpdateCheck` timestamp;

ALTER TABLE `userSettings` ADD `lastUpdateAt` timestamp;

ALTER TABLE `userSettings` ADD `currentVersion` varchar(50) DEFAULT '1.0.0';

ALTER TABLE `userSettings` ADD `latestVersion` varchar(50);

ALTER TABLE `userSettings` ADD `updateAvailable` boolean DEFAULT false;

ALTER TABLE `userSettings` ADD `licenseEmail` varchar(255);

ALTER TABLE `userSettings` ADD `licenseSignature` varchar(512);

ALTER TABLE `userSettings` ADD `featureLeaderboard` boolean DEFAULT true;

-- ============================================================
-- Email Templates mẫu (cần thay userId = 1 bằng userId thực)
-- ============================================================

INSERT INTO `emailTemplates` (`userId`, `type`, `subject`, `htmlBody`, `isActive`) VALUES
(1, 'CREATED', 'Đơn hàng #{{orderCode}} đã được tạo', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Xác nhận đơn hàng</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được tạo thành công.</p><p><strong>Tổng tiền:</strong> {{totalAmount}}</p><p><strong>Trạng thái:</strong> Chờ thanh toán</p><p>Vui lòng thanh toán để hoàn tất đơn hàng.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'PAID', 'Đơn hàng #{{orderCode}} đã được thanh toán', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#34a853">Thanh toán thành công</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> đã được thanh toán thành công.</p><p><strong>Tổng tiền:</strong> {{totalAmount}}</p><p>Chúng tôi sẽ xử lý và giao hàng cho bạn sớm nhất có thể.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'SHIPPING', 'Đơn hàng #{{orderCode}} đang được giao', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#ff6d00">Đơn hàng đang giao</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> đang được xử lý/giao đến bạn.</p><p>Vui lòng kiểm tra email hoặc liên hệ hỗ trợ nếu cần thêm thông tin.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'WARRANTY', 'Thông tin bảo hành đơn hàng #{{orderCode}}', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Thông tin bảo hành</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được kích hoạt bảo hành.</p><p>Mã bảo hành: <strong>{{warrantyCode}}</strong></p><p>Thời hạn bảo hành: {{warrantyExpiry}}</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'REVIEW', 'Đánh giá sản phẩm từ đơn hàng #{{orderCode}}', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Đánh giá sản phẩm</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi!</p><p>Vui lòng dành ít phút để đánh giá sản phẩm từ đơn hàng <strong>#{{orderCode}}</strong>.</p><p>Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và giúp khách hàng khác đưa ra quyết định tốt hơn.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1);

-- ============================================================
-- Feature Flags mặc định
-- ============================================================

INSERT INTO `feature_flags` (`userId`, `key`, `enabled`, `label`, `description`) VALUES
(1, 'points', 0, 'Tích Điểm', 'Hệ thống tích điểm khách hàng'),
(1, 'warranty', 1, 'Bảo Hành', 'Quản lý bảo hành sản phẩm'),
(1, 'referral', 0, 'Giới Thiệu', 'Chương trình giới thiệu khách hàng'),
(1, 'flash_sale', 0, 'Flash Sale', 'Chương trình flash sale'),
(1, 'wishlist', 1, 'Yêu Thích', 'Danh sách sản phẩm yêu thích'),
(1, 'leaderboard', 1, 'Bảng Xếp Hạng', 'Bảng xếp hạng khách hàng'),
(1, 'blog', 1, 'Blog', 'Trang blog tin tức'),
(1, 'coupon', 0, 'Mã Giảm Giá', 'Hệ thống mã giảm giá'),
(1, 'wallet', 1, 'Ví Điện Tử', 'Ví điện tử và nạp tiền'),
(1, 'review', 1, 'Đánh Giá', 'Đánh giá sản phẩm'),
(1, 'spin_wheel', 0, 'Vòng Quay', 'Vòng quay may mắn'),
(1, 'ticket', 1, 'Ticket Hỗ Trợ', 'Hệ thống ticket hỗ trợ'),
(1, 'cart', 1, 'Giỏ Hàng', 'Giỏ hàng mua sắm'),
(1, 'compare', 0, 'So Sánh', 'So sánh sản phẩm');

SET FOREIGN_KEY_CHECKS = 1;
