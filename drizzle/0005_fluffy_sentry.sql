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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
