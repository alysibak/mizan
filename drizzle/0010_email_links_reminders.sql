CREATE TABLE `email_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`purpose` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_tokens_user_idx` ON `email_tokens` (`user_id`);--> statement-breakpoint
ALTER TABLE `settings` ADD `email_reminders` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `reminder_sent_for` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` text;