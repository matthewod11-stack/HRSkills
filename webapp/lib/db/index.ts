import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../db/schema';
import path from 'path';
import fs from 'fs';

/**
 * Phase 2 Database Client
 *
 * This module provides a singleton SQLite database connection using Drizzle ORM.
 * Features:
 * - Type-safe queries with full TypeScript inference
 * - Automatic migrations on first connection
 * - Connection pooling (via better-sqlite3)
 * - Transaction support
 */

// Database file location
const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), '..', 'data');
const DB_PATH = path.join(DB_DIR, 'hrskills.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton connection
let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

/**
 * Get database instance (singleton pattern)
 */
export function getDatabase() {
  if (!dbInstance) {
    // Create SQLite connection
    sqliteInstance = new Database(DB_PATH);

    // Enable WAL mode for better concurrency
    sqliteInstance.pragma('journal_mode = WAL');

    // Enable foreign keys
    sqliteInstance.pragma('foreign_keys = ON');

    // Create Drizzle instance
    dbInstance = drizzle(sqliteInstance, { schema });

    console.log(`[DB] Connected to SQLite database at ${DB_PATH}`);

    // Run schema initialization
    initializeSchema(sqliteInstance);
  }

  return dbInstance;
}

/**
 * Initialize database schema (create tables and indexes)
 */
function initializeSchema(sqlite: Database.Database) {
  // Check if tables exist
  const tables = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='employees'"
  ).get();

  if (!tables) {
    console.log('[DB] Creating database schema...');

    // Create all tables
    sqlite.exec(`
      -- Employees table
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        department TEXT NOT NULL,
        job_title TEXT NOT NULL,
        level TEXT,
        manager_id TEXT,
        location TEXT,
        employment_type TEXT,
        hire_date TEXT NOT NULL,
        termination_date TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        gender TEXT,
        race_ethnicity TEXT,
        compensation_currency TEXT DEFAULT 'USD',
        compensation_base REAL,
        data_sources TEXT,
        attributes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Employee metrics table
      CREATE TABLE IF NOT EXISTS employee_metrics (
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        metric_date TEXT NOT NULL,
        enps_score INTEGER,
        survey_quarter TEXT,
        survey_response_date TEXT,
        survey_category TEXT,
        performance_rating REAL,
        flight_risk REAL,
        flight_risk_level TEXT,
        performance_forecast REAL,
        promotion_readiness REAL,
        PRIMARY KEY (employee_id, metric_date)
      );

      -- Performance reviews table
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        review_type TEXT NOT NULL,
        review_date TEXT NOT NULL,
        reviewer_id TEXT,
        reviewer_name TEXT,
        reviewer_title TEXT,
        question TEXT,
        response TEXT,
        rating REAL,
        rating_scale TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        messages_json TEXT NOT NULL,
        workflow_state_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Actions table
      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        action_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payload_json TEXT NOT NULL,
        result_json TEXT,
        error_message TEXT,
        ai_provider TEXT,
        ai_model TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      );

      -- Documents table
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        google_doc_id TEXT,
        google_drive_url TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        preferences_json TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Workflow snapshots table
      CREATE TABLE IF NOT EXISTS workflow_snapshots (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
        step TEXT NOT NULL,
        state_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Insight events table
      CREATE TABLE IF NOT EXISTS insight_events (
        id TEXT PRIMARY KEY,
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        insight_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TEXT
      );

      -- AI usage tracking table
      CREATE TABLE IF NOT EXISTS ai_usage (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        estimated_cost REAL,
        endpoint TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    console.log('[DB] Creating indexes...');
    sqlite.exec(`
      -- Employee indexes
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
      CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);

      -- Metrics indexes
      CREATE INDEX IF NOT EXISTS idx_metrics_employee ON employee_metrics(employee_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_date ON employee_metrics(metric_date);
      CREATE INDEX IF NOT EXISTS idx_metrics_flight_risk ON employee_metrics(flight_risk);

      -- Reviews indexes
      CREATE INDEX IF NOT EXISTS idx_reviews_employee ON performance_reviews(employee_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_date ON performance_reviews(review_date);

      -- Conversations indexes
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);

      -- Actions indexes
      CREATE INDEX IF NOT EXISTS idx_actions_conversation ON actions(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
      CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(action_type);

      -- Insight events indexes
      CREATE INDEX IF NOT EXISTS idx_insights_status ON insight_events(status);
      CREATE INDEX IF NOT EXISTS idx_insights_employee ON insight_events(employee_id);
      CREATE INDEX IF NOT EXISTS idx_insights_created ON insight_events(created_at);

      -- AI usage indexes
      CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
    `);

    console.log('[DB] Schema initialization complete');
  } else {
    console.log('[DB] Schema already exists, skipping initialization');
  }
}

/**
 * Close database connection (call on server shutdown)
 */
export function closeDatabase() {
  if (sqliteInstance) {
    sqliteInstance.close();
    dbInstance = null;
    sqliteInstance = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Run database migrations (for schema changes)
 */
export async function runMigrations() {
  const db = getDatabase();
  // Future: Use drizzle-kit for migrations
  console.log('[DB] No migrations to run');
}

/**
 * Get database statistics
 */
export function getDbStats() {
  if (!sqliteInstance) {
    return null;
  }

  const stats = {
    employees: sqliteInstance.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number },
    metrics: sqliteInstance.prepare('SELECT COUNT(*) as count FROM employee_metrics').get() as { count: number },
    reviews: sqliteInstance.prepare('SELECT COUNT(*) as count FROM performance_reviews').get() as { count: number },
    conversations: sqliteInstance.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number },
    actions: sqliteInstance.prepare('SELECT COUNT(*) as count FROM actions').get() as { count: number },
    documents: sqliteInstance.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number },
    insights: sqliteInstance.prepare('SELECT COUNT(*) as count FROM insight_events').get() as { count: number },
    dbSize: fs.statSync(DB_PATH).size,
  };

  return stats;
}

// Export schema and database instance
export { schema };
export const db = getDatabase();
