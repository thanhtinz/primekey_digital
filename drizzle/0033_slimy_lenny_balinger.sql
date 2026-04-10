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
--> statement-breakpoint
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
