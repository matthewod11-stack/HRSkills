/**
 * Workflow Action Types
 *
 * Defines the type system for executable workflow actions.
 * Actions are suggested by Claude during workflows and executed by the user.
 */

// ============================================================================
// Core Action Types
// ============================================================================

/**
 * Action type identifier
 */
export type ActionType =
  | 'create_document'
  | 'send_email'
  | 'send_slack_message'
  | 'create_calendar_event'
  | 'update_database'
  | 'api_call'
  | 'webhook'
  | 'custom';

/**
 * Action status
 */
export type ActionStatus =
  | 'pending' // Suggested but not yet executed
  | 'approved' // User approved for execution
  | 'executing' // Currently running
  | 'completed' // Successfully executed
  | 'failed' // Execution failed
  | 'cancelled'; // User cancelled

/**
 * Action priority
 */
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Action Definition
// ============================================================================

/**
 * Base action interface
 * All actions extend this base structure
 */
export interface BaseAction {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  priority?: ActionPriority;
  requiresApproval: boolean;
  requiredPermissions?: string[];
  status: ActionStatus;
  createdAt: string;
  updatedAt?: string;
  executedAt?: string;
  payload: Record<string, any>;
  metadata?: {
    workflowId?: string;
    conversationId?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Action execution context
 */
export interface ActionContext {
  userId: string;
  conversationId: string;
  workflowId: string;
  workflowStep?: string;
  userPermissions: string[];
  organizationId?: string;
}

/**
 * Action execution result
 */
export interface ActionResult {
  success: boolean;
  actionId: string;
  executedAt: string;
  duration: number; // Execution time in milliseconds
  output?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// Specific Action Payloads
// ============================================================================

/**
 * Create Document Action
 * Generates and saves a document to Google Drive or local storage
 */
export interface CreateDocumentPayload {
  documentType:
    | 'job_description'
    | 'offer_letter'
    | 'pip'
    | 'termination_letter'
    | 'interview_guide'
    | 'performance_review'
    | 'onboarding_checklist'
    | 'custom';
  title: string;
  content: string;
  employeeId?: string;
  format?: 'markdown' | 'html' | 'plain';
  destination?: {
    type: 'google_drive' | 'local' | 's3';
    folderId?: string;
    folderPath?: string;
    fileName?: string;
  };
  templateId?: string;
  variables?: Record<string, any>;
}

/**
 * Send Email Action
 */
export interface SendEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  format?: 'html' | 'plain';
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  replyTo?: string;
  sendAt?: string; // ISO timestamp for scheduled sending
}

/**
 * Send Slack Message Action
 */
export interface SendSlackMessagePayload {
  channel?: string;
  user?: string;
  text: string;
  blocks?: any[]; // Slack Block Kit
  threadTs?: string;
  createChannel?: {
    name: string;
    isPrivate?: boolean;
    members?: string[];
  };
}

/**
 * Create Calendar Event Action
 */
export interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  attendees?: string[];
  location?: string;
  conferenceData?: {
    createRequest?: boolean;
    entryPoints?: Array<{
      entryPointType: 'video' | 'phone';
      uri: string;
      label?: string;
    }>;
  };
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
}

/**
 * Update Database Action
 */
export interface UpdateDatabasePayload {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data: Record<string, any>;
  where?: Record<string, any>;
  returning?: string[];
}

/**
 * API Call Action
 */
export interface ApiCallPayload {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * Webhook Action
 */
export interface WebhookPayload {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  body: any;
  secret?: string; // For HMAC signature
}

// ============================================================================
// Action Validation
// ============================================================================

/**
 * Action validation result
 */
export interface ActionValidationResult {
  valid: boolean;
  errors: ActionValidationError[];
  warnings?: ActionValidationWarning[];
}

export interface ActionValidationError {
  field: string;
  message: string;
  code: 'missing_required' | 'invalid_format' | 'permission_denied' | 'invalid_value';
}

export interface ActionValidationWarning {
  field: string;
  message: string;
}

// ============================================================================
// Action Handler Interface
// ============================================================================

/**
 * Action handler interface
 * Each action type has a corresponding handler implementation
 */
export interface ActionHandler<TPayload = any, TResult = any> {
  type: ActionType;

  /**
   * Validate action payload before execution
   */
  validate(action: BaseAction, context: ActionContext): Promise<ActionValidationResult>;

  /**
   * Execute the action
   */
  execute(action: BaseAction, context: ActionContext): Promise<ActionResult>;

  /**
   * Rollback the action if it fails
   */
  rollback?(action: BaseAction, context: ActionContext, result: ActionResult): Promise<void>;

  /**
   * Estimate execution time in milliseconds
   */
  estimateDuration?(): number;
}

// ============================================================================
// Action Registry
// ============================================================================

/**
 * Action registry entry
 */
export interface ActionRegistryEntry {
  type: ActionType;
  handler: ActionHandler;
  enabled: boolean;
  requiredPermissions: string[];
  rateLimitPerHour?: number;
}

/**
 * Action execution options
 */
export interface ActionExecutionOptions {
  dryRun?: boolean; // Validate but don't execute
  timeout?: number; // Max execution time in ms
  retries?: number; // Number of retry attempts
  onProgress?: (progress: number) => void;
  signal?: AbortSignal; // For cancellation
}

// ============================================================================
// Action History
// ============================================================================

/**
 * Action history entry for audit trail
 */
export interface ActionHistoryEntry {
  id: string;
  actionId: string;
  action: BaseAction;
  result: ActionResult;
  context: ActionContext;
  timestamp: string;
}

/**
 * Action statistics
 */
export interface ActionStatistics {
  totalExecuted: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  byType: Record<
    ActionType,
    {
      count: number;
      successRate: number;
      avgDuration: number;
    }
  >;
  byWorkflow: Record<
    string,
    {
      count: number;
      successRate: number;
    }
  >;
}

// ============================================================================
// Action Batch Execution
// ============================================================================

/**
 * Batch action execution request
 */
export interface BatchActionRequest {
  actions: BaseAction[];
  context: ActionContext;
  options?: ActionExecutionOptions;
  sequential?: boolean; // Execute one at a time vs. parallel
}

/**
 * Batch action execution result
 */
export interface BatchActionResult {
  results: ActionResult[];
  totalDuration: number;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    actionId: string;
    error: ActionResult['error'];
  }>;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isCreateDocumentAction(
  action: BaseAction
): action is BaseAction & { payload: CreateDocumentPayload } {
  return action.type === 'create_document';
}

export function isSendEmailAction(
  action: BaseAction
): action is BaseAction & { payload: SendEmailPayload } {
  return action.type === 'send_email';
}

export function isSendSlackMessageAction(
  action: BaseAction
): action is BaseAction & { payload: SendSlackMessagePayload } {
  return action.type === 'send_slack_message';
}

export function isCreateCalendarEventAction(
  action: BaseAction
): action is BaseAction & { payload: CreateCalendarEventPayload } {
  return action.type === 'create_calendar_event';
}

export function isUpdateDatabaseAction(
  action: BaseAction
): action is BaseAction & { payload: UpdateDatabasePayload } {
  return action.type === 'update_database';
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Partial action for creation (before ID assignment)
 */
export type CreateActionInput = Omit<BaseAction, 'id' | 'status' | 'createdAt'>;

/**
 * Action update input
 */
export type UpdateActionInput = Partial<Pick<BaseAction, 'status' | 'payload' | 'metadata'>>;
