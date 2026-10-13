CREATE TABLE `preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
