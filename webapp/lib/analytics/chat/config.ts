import Anthropic from '@anthropic-ai/sdk';

/**
 * Cache configuration for analytics chat responses
 */
export const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * In-memory cache for demo purposes
 * In production, use Redis or similar distributed cache
 */
export const responseCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Anthropic Tool definition for SQL generation and analysis
 */
export const SQL_ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'generate_sql_and_analysis',
  description:
    'Generate a SQLite query and analysis framework to answer HR analytics questions. Returns sql, intent, explanation, and analysis guidance.',
  input_schema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'The SQLite SELECT query (read-only, must start with SELECT)',
      },
      intent: {
        type: 'string',
        enum: [
          'simple_metric',
          'filtered',
          'comparative',
          'temporal',
          'aggregation',
          'correlation',
        ],
        description:
          'The query intent type: simple_metric for single values, filtered for WHERE clauses, comparative for group comparisons, temporal for time series, aggregation for complex aggregates, correlation for multi-metric relationships',
      },
      explanation: {
        type: 'string',
        description: 'Brief explanation of what the query does and what insight it provides',
      },
      analysis_template: {
        type: 'string',
        description:
          'Template for analyzing the results once data is retrieved. Include placeholders like {total_count}, {key_metric}, etc.',
      },
    },
    required: ['sql', 'intent', 'explanation', 'analysis_template'],
  },
};

/**
 * Database schema definitions for available HR data tables
 */
export const TABLE_SCHEMAS = {
  employees: {
    name: 'employees',
    description:
      'Employee master data including demographics, department, level, and employment status',
    columns: [
      { name: 'id', type: 'INTEGER', description: 'Primary key' },
      { name: 'employee_id', type: 'TEXT', description: 'Unique employee identifier' },
      { name: 'first_name', type: 'TEXT', description: 'First name' },
      { name: 'last_name', type: 'TEXT', description: 'Last name' },
      { name: 'email', type: 'TEXT', description: 'Email address' },
      {
        name: 'department',
        type: 'TEXT',
        description: 'Department name (Engineering, Sales, Marketing, etc.)',
      },
      { name: 'level', type: 'TEXT', description: 'Job level (IC1, IC2, M1, M2, etc.)' },
      { name: 'subteam', type: 'TEXT', description: 'Team within department' },
      { name: 'hire_date', type: 'TEXT', description: 'Hire date (YYYY-MM-DD format)' },
      { name: 'status', type: 'TEXT', description: 'Employment status (Active, Terminated)' },
      { name: 'termination_date', type: 'TEXT', description: 'Termination date if applicable' },
      { name: 'termination_reason', type: 'TEXT', description: 'Reason for termination' },
      { name: 'manager_id', type: 'INTEGER', description: 'Foreign key to manager employee_id' },
    ],
  },
  reviews: {
    name: 'reviews',
    description: 'Performance review data including ratings and feedback',
    columns: [
      { name: 'id', type: 'INTEGER', description: 'Primary key' },
      { name: 'employee_id', type: 'INTEGER', description: 'Foreign key to employees.id' },
      { name: 'review_date', type: 'TEXT', description: 'Review date (YYYY-MM-DD)' },
      { name: 'review_type', type: 'TEXT', description: 'Type of review (Annual, Mid-Year, etc.)' },
      { name: 'reviewer_id', type: 'INTEGER', description: 'Foreign key to reviewer employee_id' },
      { name: 'review_text', type: 'TEXT', description: 'Review content' },
      {
        name: 'performance_band_actual',
        type: 'TEXT',
        description: 'Performance rating (Exceeds, Meets, Needs Improvement)',
      },
      { name: 'potential_band_actual', type: 'TEXT', description: 'Potential rating' },
    ],
  },
  enps: {
    name: 'enps_responses',
    description: 'Employee Net Promoter Score survey responses',
    columns: [
      { name: 'id', type: 'TEXT', description: 'Primary key' },
      { name: 'employee_id', type: 'TEXT', description: 'Employee identifier' },
      { name: 'score', type: 'INTEGER', description: 'eNPS score (0-10)' },
      { name: 'comment', type: 'TEXT', description: 'Survey comment' },
      { name: 'quarter', type: 'TEXT', description: 'Quarter (e.g., Q1 2024)' },
      { name: 'response_date', type: 'TEXT', description: 'Response date' },
      {
        name: 'category',
        type: 'TEXT',
        description: 'Score category (Promoter, Passive, Detractor)',
      },
      { name: 'department', type: 'TEXT', description: 'Employee department' },
    ],
  },
};

/**
 * Type definitions
 */
export type QueryIntent =
  | 'simple_metric'
  | 'filtered'
  | 'comparative'
  | 'temporal'
  | 'aggregation'
  | 'correlation';
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie';

export interface SQLAnalysisResult {
  sql: string;
  intent: QueryIntent;
  explanation: string;
  analysis_template: string;
}
