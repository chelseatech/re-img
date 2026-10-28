-- Additive and repeatable. Existing counters and usage records are preserved.
CREATE TABLE IF NOT EXISTS download_dispatches (
 request_id TEXT PRIMARY KEY NOT NULL,
 count INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS download_totals (
 id INTEGER PRIMARY KEY NOT NULL,
 total INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER IF NOT EXISTS download_dispatch_count AFTER INSERT ON download_dispatches
BEGIN
 INSERT INTO download_totals(id,total) VALUES(1,NEW.count)
 ON CONFLICT(id) DO UPDATE SET total=total+NEW.count;
END;
CREATE INDEX IF NOT EXISTS download_dispatches_created_at_idx ON download_dispatches(created_at);
CREATE TABLE IF NOT EXISTS ai_daily_usage (
 day TEXT PRIMARY KEY,
 requests INTEGER NOT NULL DEFAULT 0,
 last_minute INTEGER NOT NULL,
 minute_requests INTEGER NOT NULL DEFAULT 0,
 input_tokens INTEGER NOT NULL DEFAULT 0,
 output_tokens INTEGER NOT NULL DEFAULT 0
);
