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
