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
--> statement-breakpoint
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
