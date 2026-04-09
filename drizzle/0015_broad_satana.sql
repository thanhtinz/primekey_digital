ALTER TABLE `invoiceItems` ADD `productReviewToken` varchar(64);--> statement-breakpoint
ALTER TABLE `invoiceItems` ADD `productReviewSubmitted` boolean DEFAULT false;