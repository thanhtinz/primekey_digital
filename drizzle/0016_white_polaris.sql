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
