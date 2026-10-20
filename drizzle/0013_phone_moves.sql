CREATE TABLE `phone_moves` (
	`id` text PRIMARY KEY NOT NULL,
	`sealed` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `phone_moves_expires_idx` ON `phone_moves` (`expires_at`);