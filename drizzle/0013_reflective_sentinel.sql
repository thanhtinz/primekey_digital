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
