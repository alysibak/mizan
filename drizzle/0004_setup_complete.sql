ALTER TABLE `settings` ADD `setup_complete` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `settings` ADD `trusted_ack_at` text;
