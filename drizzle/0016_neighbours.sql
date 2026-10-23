CREATE TABLE `need_events` (
	`id` text PRIMARY KEY NOT NULL,
	`need_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `need_events_need_idx` ON `need_events` (`need_id`);--> statement-breakpoint
CREATE TABLE `need_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`need_id` text NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `need_reports_need_idx` ON `need_reports` (`need_id`);--> statement-breakpoint
CREATE TABLE `needs` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`story` text DEFAULT '' NOT NULL,
	`amount` real NOT NULL,
	`received` real DEFAULT 0 NOT NULL,
	`zakat` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`paused` integer DEFAULT false NOT NULL,
	`days` integer DEFAULT 30 NOT NULL,
	`created_by` text,
	`approved_by` text,
	`published_at` text,
	`expires_at` text,
	`closed_at` text,
	`thanks` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `needs_partner_status_idx` ON `needs` (`partner_id`,`status`);--> statement-breakpoint
CREATE TABLE `partner_members` (
	`partner_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`partner_id`, `user_id`),
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `partner_members_user_idx` ON `partner_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`about` text DEFAULT '' NOT NULL,
	`how_to_give` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`two_person` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`example` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_slug_unique` ON `partners` (`slug`);--> statement-breakpoint
CREATE TABLE `pledges` (
	`id` text PRIMARY KEY NOT NULL,
	`need_id` text NOT NULL,
	`code` text NOT NULL,
	`amount` real NOT NULL,
	`received` real,
	`name` text,
	`contact` text,
	`status` text DEFAULT 'pledged' NOT NULL,
	`received_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pledges_code_unique` ON `pledges` (`code`);--> statement-breakpoint
CREATE INDEX `pledges_need_idx` ON `pledges` (`need_id`);--> statement-breakpoint
CREATE TABLE `problem_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`page` text NOT NULL,
	`note` text NOT NULL,
	`contact` text,
	`locale` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `problem_reports_created_idx` ON `problem_reports` (`created_at`);