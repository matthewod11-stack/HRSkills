import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Phase 2 Database Schema for HR Command Center
 *
 * This schema consolidates JSON file storage into SQLite with the following design principles:
 * 1. Normalize employee data (base employee + metrics + reviews)
 * 2. Track conversations and workflow state
 * 3. Log all actions taken by the system
 * 4. Store generated documents
 * 5. Capture proactive insights
 */

// ============================================================================
// EMPLOYEES TABLE
// ============================================================================
export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(), // employee_id from JSON (e.g., "EMP001")
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  department: text('department').notNull(),
  jobTitle: text('job_title').notNull(),
  level: text('level'), // C-Level, Senior, Mid, Junior
  managerId: text('manager_id'), // References employees.id
  location: text('location'),

  // Employment details
  employmentType: text('employment_type'), // Full-time, Part-time, Contract
  hireDate: text('hire_date').notNull(), // ISO date string
  terminationDate: text('termination_date'), // ISO date string or null
  status: text('status').notNull().default('active'), // active, terminated, leave

  // Demographics (optional, for diversity analytics)
  gender: text('gender'),
  raceEthnicity: text('race_ethnicity'),

  // Compensation (optional)
  compensationCurrency: text('compensation_currency').default('USD'),
  compensationBase: real('compensation_base'),

  // Metadata
  dataSources: text('data_sources'), // JSON array of source files
  attributes: text('attributes'), // JSON blob for additional fields not in schema

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// EMPLOYEE METRICS TABLE
// ============================================================================
export const employeeMetrics = sqliteTable('employee_metrics', {
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  metricDate: text('metric_date').notNull(), // ISO date string (YYYY-MM-DD)

  // Engagement metrics
  enpsScore: integer('enps_score'), // -100 to 100 scale
  surveyQuarter: text('survey_quarter'), // e.g., "Q1 2025"
  surveyResponseDate: text('survey_response_date'),
  surveyCategory: text('survey_category'), // Promoter, Passive, Detractor

  // Performance metrics
  performanceRating: real('performance_rating'), // 1-5 scale

  // Predictive metrics (from Vertex AI or rule-based)
  flightRisk: real('flight_risk'), // 0-1 probability
  flightRiskLevel: text('flight_risk_level'), // low, medium, high, critical
  performanceForecast: real('performance_forecast'), // Predicted next rating
  promotionReadiness: real('promotion_readiness'), // 0-1 score

}, (table) => ({
  // Composite primary key (employee_id + metric_date)
  pk: sql`PRIMARY KEY (${table.employeeId}, ${table.metricDate})`,
}));

// ============================================================================
// PERFORMANCE REVIEWS TABLE
// ============================================================================
export const performanceReviews = sqliteTable('performance_reviews', {
  id: text('id').primaryKey(), // review_id from JSON
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),

  reviewType: text('review_type').notNull(), // manager, self, peer, 360
  reviewDate: text('review_date').notNull(), // ISO date string

  // Reviewer information
  reviewerId: text('reviewer_id'),
  reviewerName: text('reviewer_name'),
  reviewerTitle: text('reviewer_title'),

  // Review content
  question: text('question'),
  response: text('response'),
  rating: real('rating'), // Numeric rating if provided
  ratingScale: text('rating_scale'), // e.g., "1-5"

  // Metadata
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// CONVERSATIONS TABLE
// ============================================================================
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title'),

  // Conversation state
  messagesJson: text('messages_json').notNull(), // Array of {role, content, timestamp}
  workflowStateJson: text('workflow_state_json'), // Current workflow state

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// ACTIONS TABLE
// ============================================================================
export const actions = sqliteTable('actions', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),

  actionType: text('action_type').notNull(), // email_sent, document_created, slack_message, etc.
  status: text('status').notNull().default('pending'), // pending, completed, failed

  // Action data
  payloadJson: text('payload_json').notNull(), // Input parameters
  resultJson: text('result_json'), // Output/result data
  errorMessage: text('error_message'), // Error details if failed

  // AI provider tracking (for cost analysis)
  aiProvider: text('ai_provider'), // anthropic, openai, google
  aiModel: text('ai_model'), // claude-3-5-sonnet, gpt-4o, etc.

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
});

// ============================================================================
// DOCUMENTS TABLE
// ============================================================================
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // offer_letter, pip, job_description, retention_plan, etc.
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'set null' }),

  // Document content
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown or HTML

  // Document lifecycle
  status: text('status').notNull().default('draft'), // draft, final

  // Google Drive integration
  googleDocId: text('google_doc_id'), // If exported to Google Docs
  googleDriveUrl: text('google_drive_url'),

  // Metadata
  metadataJson: text('metadata_json'), // Additional fields (tags, category, etc.)

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// USER PREFERENCES TABLE
// ============================================================================
export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey(),

  // User settings
  preferencesJson: text('preferences_json').notNull(), // Theme, notifications, defaults, etc.

  // API keys (encrypted or for dev use only)
  anthropicApiKey: text('anthropic_api_key'), // User's personal Anthropic API key

  // Timestamps
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// WORKFLOW SNAPSHOTS TABLE
// ============================================================================
export const workflowSnapshots = sqliteTable('workflow_snapshots', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull(), // HIRING, PERFORMANCE, etc.
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),

  step: text('step').notNull(), // Current step in workflow
  stateJson: text('state_json').notNull(), // Complete state snapshot

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// INSIGHT EVENTS TABLE
// ============================================================================
export const insightEvents = sqliteTable('insight_events', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'set null' }),

  insightType: text('insight_type').notNull(), // flight_risk, hiring_bottleneck, diversity_gap, etc.
  severity: text('severity').notNull(), // low, medium, high, critical

  // Insight data
  title: text('title').notNull(),
  description: text('description'),
  payloadJson: text('payload_json').notNull(), // Full insight data

  // Status tracking
  status: text('status').notNull().default('open'), // open, acknowledged, dismissed

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  acknowledgedAt: text('acknowledged_at'),
});

// ============================================================================
// AI USAGE TRACKING TABLE (for cost monitoring)
// ============================================================================
export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(),

  // Provider information
  provider: text('provider').notNull(), // anthropic, openai
  model: text('model').notNull(), // claude-3-5-sonnet, gpt-4o

  // Usage metrics
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  // Cost (estimated)
  estimatedCost: real('estimated_cost'), // In USD

  // Context
  endpoint: text('endpoint'), // API route that triggered this
  userId: text('user_id'),

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// AI QUOTA USAGE TABLE (for shared key rate limiting)
// ============================================================================
export const aiQuotaUsage = sqliteTable('ai_quota_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // User ID or 'shared-demo'
  date: text('date').notNull(), // ISO date string (YYYY-MM-DD)

  // Daily quota tracking
  requestCount: integer('request_count').notNull().default(0),
  tokensUsed: integer('tokens_used').notNull().default(0),
  quotaLimit: integer('quota_limit').notNull(), // Daily limit for this user

  // Timestamps
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Unique constraint on user_id + date
  userDateIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_quota_user_date ON ai_quota_usage(user_id, date)`,
}));

// ============================================================================
// INDEXES FOR QUERY PERFORMANCE
// ============================================================================

// Employee indexes
export const employeesIndexes = {
  departmentIdx: sql`CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department)`,
  managerIdx: sql`CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id)`,
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)`,
  hireDateIdx: sql`CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date)`,
};

// Metrics indexes
export const metricsIndexes = {
  employeeIdx: sql`CREATE INDEX IF NOT EXISTS idx_metrics_employee ON employee_metrics(employee_id)`,
  dateIdx: sql`CREATE INDEX IF NOT EXISTS idx_metrics_date ON employee_metrics(metric_date)`,
  flightRiskIdx: sql`CREATE INDEX IF NOT EXISTS idx_metrics_flight_risk ON employee_metrics(flight_risk)`,
};

// Reviews indexes
export const reviewsIndexes = {
  employeeIdx: sql`CREATE INDEX IF NOT EXISTS idx_reviews_employee ON performance_reviews(employee_id)`,
  dateIdx: sql`CREATE INDEX IF NOT EXISTS idx_reviews_date ON performance_reviews(review_date)`,
};

// Conversations indexes
export const conversationsIndexes = {
  userIdx: sql`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)`,
  createdIdx: sql`CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at)`,
};

// Actions indexes
export const actionsIndexes = {
  conversationIdx: sql`CREATE INDEX IF NOT EXISTS idx_actions_conversation ON actions(conversation_id)`,
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status)`,
  typeIdx: sql`CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(action_type)`,
};

// Insight events indexes
export const insightsIndexes = {
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_insights_status ON insight_events(status)`,
  employeeIdx: sql`CREATE INDEX IF NOT EXISTS idx_insights_employee ON insight_events(employee_id)`,
  createdIdx: sql`CREATE INDEX IF NOT EXISTS idx_insights_created ON insight_events(created_at)`,
};

// AI usage indexes
export const aiUsageIndexes = {
  providerIdx: sql`CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider)`,
  createdIdx: sql`CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at)`,
  userIdx: sql`CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id)`,
};

// AI quota usage indexes
export const aiQuotaIndexes = {
  userIdx: sql`CREATE INDEX IF NOT EXISTS idx_quota_user ON ai_quota_usage(user_id)`,
  dateIdx: sql`CREATE INDEX IF NOT EXISTS idx_quota_date ON ai_quota_usage(date)`,
};

// Document indexes
export const documentsIndexes = {
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`,
  typeCreatedIdx: sql`CREATE INDEX IF NOT EXISTS idx_documents_type_created ON documents(type, created_at DESC)`,
  employeeIdx: sql`CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id)`,
};

// ============================================================================
// TYPE EXPORTS (for TypeScript type inference)
// ============================================================================

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type EmployeeMetric = typeof employeeMetrics.$inferSelect;
export type NewEmployeeMetric = typeof employeeMetrics.$inferInsert;

export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type NewPerformanceReview = typeof performanceReviews.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type WorkflowSnapshot = typeof workflowSnapshots.$inferSelect;
export type NewWorkflowSnapshot = typeof workflowSnapshots.$inferInsert;

export type InsightEvent = typeof insightEvents.$inferSelect;
export type NewInsightEvent = typeof insightEvents.$inferInsert;

export type AIUsage = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;

export type AIQuotaUsage = typeof aiQuotaUsage.$inferSelect;
export type NewAIQuotaUsage = typeof aiQuotaUsage.$inferInsert;
