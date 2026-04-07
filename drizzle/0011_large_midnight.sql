ALTER TABLE `invoices` ADD `warrantyStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `warrantyExpiryDate` timestamp;--> statement-breakpoint
ALTER TABLE `invoices` ADD `warrantyMonths` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `warrantyMonths` int DEFAULT 0;