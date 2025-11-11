/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for API requests and responses
 * using Zod for runtime type safety and validation.
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// EMPLOYEE SCHEMAS
// ============================================================================

export const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  employeeId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  department: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  manager: z.string().max(200).optional(),
  hireDate: z.string().datetime(),
  salary: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  location: z.string().max(200).optional(),
  workload: z.number().min(0).max(100).optional(),
});

export const createEmployeeSchema = employeeSchema.omit({ id: true });

export const updateEmployeeSchema = employeeSchema.partial().required({ id: true });

export const bulkEmployeeSchema = z.object({
  employees: z.array(createEmployeeSchema).min(1).max(1000),
});

// ============================================================================
// CHAT SCHEMAS
// ============================================================================

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  timestamp: z.string().datetime().optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
  conversationHistory: z.array(chatMessageSchema).max(50).optional(),
  context: z
    .object({
      employeeData: z.array(z.any()).optional(),
      dataSource: z.string().optional(),
      filters: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

export const chatResponseSchema = z.object({
  success: z.boolean(),
  response: z.string(),
  sessionId: z.string().uuid(),
  tokensUsed: z
    .object({
      input: z.number().int().nonnegative(),
      output: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    })
    .optional(),
  metadata: z
    .object({
      model: z.string(),
      processingTime: z.number().nonnegative(),
      cached: z.boolean().optional(),
    })
    .optional(),
});

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const analyticsQuerySchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
  conversationHistory: z.array(chatMessageSchema).max(20).optional(),
});

export const analyticsResponseSchema = z.object({
  success: z.boolean(),
  response: z.string(),
  sql: z.string().optional(),
  data: z.array(z.any()).optional(),
  visualization: z
    .object({
      type: z.enum(['bar', 'line', 'pie', 'scatter', 'table']),
      config: z.record(z.string(), z.any()),
    })
    .optional(),
  sessionId: z.string().uuid(),
});

// ============================================================================
// PERFORMANCE REVIEW SCHEMAS
// ============================================================================

export const performanceReviewSchema = z.object({
  employeeId: z.string().min(1),
  reviewPeriod: z.string().min(1),
  overallRating: z.number().min(1).max(5),
  competencies: z.record(z.string(), z.number().min(1).max(5)),
  strengths: z.string().max(5000),
  areasForImprovement: z.string().max(5000),
  goals: z.string().max(5000),
  reviewerComments: z.string().max(5000),
  employeeComments: z.string().max(5000).optional(),
  status: z.enum(['draft', 'submitted', 'acknowledged']).default('draft'),
});

export const analyzePerformanceSchema = z.object({
  reviews: z.array(performanceReviewSchema).min(1).max(100),
  analysisType: z.enum(['individual', 'team', 'department', 'company']).default('individual'),
  includeRecommendations: z.boolean().default(true),
});

// ============================================================================
// DATA SOURCE SCHEMAS
// ============================================================================

export const dataSourceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['csv', 'xlsx', 'json']),
  uploadedAt: z.string().datetime(),
  rowCount: z.number().int().nonnegative(),
  columns: z.array(z.string()),
  size: z.number().nonnegative(),
  userId: z.string().uuid(),
});

export const uploadDataSchema = z.object({
  file: z.instanceof(File).optional(), // For multipart uploads
  fileName: z.string().min(1).max(500),
  fileType: z.enum(['csv', 'xlsx', 'json']),
  overwrite: z.boolean().default(false),
});

// ============================================================================
// METRICS SCHEMAS
// ============================================================================

export const metricsResponseSchema = z.object({
  headcount: z.number().int().nonnegative(),
  attritionRate: z.number().nonnegative(),
  openPositions: z.number().int().nonnegative(),
  averageTenure: z.number().nonnegative().optional(),
  diversityMetrics: z
    .object({
      gender: z.record(z.string(), z.number()),
      ethnicity: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  departmentMetrics: z
    .array(
      z.object({
        department: z.string(),
        headcount: z.number().int().nonnegative(),
        attritionRate: z.number().nonnegative(),
      })
    )
    .optional(),
});

export const aiCostMetricsSchema = z.object({
  totalCost: z.number().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  requestCount: z.number().int().nonnegative(),
  averageCostPerRequest: z.number().nonnegative(),
  breakdown: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cachedTokens: z.number().int().nonnegative().optional(),
  }),
  timeRange: dateRangeSchema,
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const demoTokenSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
});

export const authResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().min(1),
  user: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.string(),
  }),
  expiresIn: z.number().int().positive(),
});

// ============================================================================
// ANTHROPIC API RESPONSE SCHEMAS
// ============================================================================

export const anthropicTextBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const anthropicMessageSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(anthropicTextBlockSchema),
  model: z.string(),
  stop_reason: z.string().nullable(),
  usage: z.object({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
  }),
});

// ============================================================================
// ERROR RESPONSE SCHEMA
// ============================================================================

export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  code: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a schema and return typed result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  error?: z.ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod validation errors for API responses
 */
export function formatZodError(error: z.ZodError<any>): {
  message: string;
  fields: Record<string, string[]>;
} {
  const fields: Record<string, string[]> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(err.message);
  });

  return {
    message: 'Validation failed',
    fields,
  };
}

/**
 * Middleware helper to validate request body
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ valid: true; data: T } | { valid: false; error: any }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { valid: true, data: result.data };
    }

    return {
      valid: false,
      error: formatZodError(result.error),
    };
  } catch (error) {
    return {
      valid: false,
      error: { message: 'Invalid JSON in request body' },
    };
  }
}
