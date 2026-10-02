CREATE TABLE `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` text NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `foreign_currency` text;--> statement-breakpoint
ALTER TABLE `assets` ADD `foreign_amount` real;--> statement-breakpoint
ALTER TABLE `assets` ADD `fx_rate` real;--> statement-breakpoint
ALTER TABLE `settings` ADD `timezone` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `hijri_calendar` text DEFAULT 'tabular' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `calendar_token_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `recovery_code_hash` text;