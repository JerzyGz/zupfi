PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`spent_at` integer NOT NULL,
	`created_at` text DEFAULT '2025-05-11T04:44:23.130Z' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_expenses`("id", "user_id", "category_id", "amount", "description", "spent_at", "created_at", "updated_at") SELECT "id", "user_id", "category_id", "amount", "description", "spent_at", "created_at", "updated_at" FROM `expenses`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
ALTER TABLE `__new_expenses` RENAME TO `expenses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_amount` real NOT NULL,
	`period` text NOT NULL,
	`created_at` text DEFAULT '2025-05-11T04:44:23.130Z' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_goals`("id", "user_id", "target_amount", "period", "created_at", "updated_at") SELECT "id", "user_id", "target_amount", "period", "created_at", "updated_at" FROM `goals`;--> statement-breakpoint
DROP TABLE `goals`;--> statement-breakpoint
ALTER TABLE `__new_goals` RENAME TO `goals`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`id_chat_user` integer NOT NULL,
	`user_name` text NOT NULL,
	`email` text,
	`name` text,
	`last_name` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT '2025-05-11T04:44:23.130Z' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "id_chat_user", "user_name", "email", "name", "last_name", "active", "created_at", "updated_at") SELECT "id", "id_chat_user", "user_name", "email", "name", "last_name", "active", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_chat_user_unique` ON `users` (`id_chat_user`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_name_unique` ON `users` (`user_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_index` ON `users` (`email`) WHERE "email" IS NOT NULL;