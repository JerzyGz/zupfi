CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`language_code` text DEFAULT 'es' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`spent_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_amount` real NOT NULL,
	`period` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_telegram_id` integer,
	`clerk_id` text,
	`user_name` text,
	`email` text,
	`name` text,
	`last_name` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_chat_telegram_id_unique` ON `users` (`chat_telegram_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_name_unique` ON `users` (`user_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `chat_telegram_id` ON `users` (`chat_telegram_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clerk_id` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_index` ON `users` (`email`) WHERE "email" IS NOT NULL;