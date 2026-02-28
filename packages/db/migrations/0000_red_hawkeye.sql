CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`amc` text NOT NULL,
	`kuveraId` text NOT NULL,
	`lump_available` text,
	`sip_available` text,
	`lump_min` real,
	`sip_min` real,
	`lock_in_period` integer,
	`detail_info` text,
	`tax_period` integer,
	`small_screen_name` text,
	`volatility` real,
	`start_date` text,
	`fund_type` text,
	`fund_category` text,
	`expense_ratio` real,
	`expense_ratio_date` text,
	`fund_manager` text,
	`crisil_rating` text,
	`investment_objective` text,
	`portfolio_turnover` real,
	`aum` real,
	`fund_rating` integer,
	`comparison` text,
	`latest_nav` real,
	`latest_nav_date` text,
	`return_1d` real,
	`return_1w` real,
	`return_1m` real,
	`return_3m` real,
	`return_6m` real,
	`return_1y` real,
	`return_2y` real,
	`return_3y` real,
	`return_5y` real,
	`return_10y` real,
	`return_since_inception` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `funds_kuveraId_unique` ON `funds` (`kuveraId`);--> statement-breakpoint
CREATE TABLE `indices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latest_date` text,
	`latest_close` real,
	`return_1d` real,
	`return_1w` real,
	`return_1m` real,
	`return_3m` real,
	`return_6m` real,
	`return_1y` real,
	`return_2y` real,
	`return_3y` real,
	`return_5y` real,
	`return_10y` real
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlists` (
	`userId` text NOT NULL,
	`fundId` text NOT NULL,
	`addedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fundId`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE cascade
);
