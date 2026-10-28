CREATE TABLE `download_dispatches` (
	`request_id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `download_totals` (
	`id` integer PRIMARY KEY NOT NULL,
	`total` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER download_dispatch_count AFTER INSERT ON download_dispatches
BEGIN
 INSERT INTO download_totals(id,total) VALUES(1,NEW.count)
 ON CONFLICT(id) DO UPDATE SET total=total+NEW.count;
END;
