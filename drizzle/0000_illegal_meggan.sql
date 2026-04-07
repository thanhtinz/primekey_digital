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
--> statement-breakpoint
CREATE TABLE `coupon_usages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`customerEmail` varchar(320),
	`discountAmount` decimal(15,2) NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupon_usages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `flash_sale_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flash_sale_subscribers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `invoiceNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `reminderLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`type` enum('24h','48h') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean DEFAULT true,
	CONSTRAINT `reminderLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
