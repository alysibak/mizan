ALTER TABLE `users` ADD `failed_login_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locked_until` text;--> statement-breakpoint
ALTER TABLE `assets` ADD `grams` real;--> statement-breakpoint
ALTER TABLE `assets` ADD `purity` real;--> statement-breakpoint
ALTER TABLE `assets` ADD `metal` text;--> statement-breakpoint
CREATE INDEX `assets_user_idx` ON `assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `liabilities_user_idx` ON `liabilities` (`user_id`);--> statement-breakpoint
CREATE INDEX `giving_records_user_date_idx` ON `giving_records` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);
