CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`page` text NOT NULL,
	`easy` integer NOT NULL,
	`note` text,
	`locale` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_created_idx` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `journey_counts` (
	`day` text NOT NULL,
	`step` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`day`, `step`)
);
