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
