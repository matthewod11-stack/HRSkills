-- Align ai_quota_usage schema with the Phase 2 quota manager expectations
-- Run inside the project root (working directory where data/hrskills.db lives):
--   sqlite3 data/hrskills.db < scripts/migration/align-ai-quota-usage.sql

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Rename legacy columns if they exist
-- SQLite ignores the statement if the column is already renamed
ALTER TABLE ai_quota_usage RENAME COLUMN usage_date TO date;
ALTER TABLE ai_quota_usage RENAME COLUMN token_count TO tokens_used;

-- Ensure the new quota_limit column exists with a reasonable default
ALTER TABLE ai_quota_usage ADD COLUMN quota_limit INTEGER NOT NULL DEFAULT 100;

COMMIT;
PRAGMA foreign_keys = ON;

-- Rebuild supporting indexes so they point at the new column names
CREATE INDEX IF NOT EXISTS idx_quota_user_date ON ai_quota_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quota_date ON ai_quota_usage(date);

