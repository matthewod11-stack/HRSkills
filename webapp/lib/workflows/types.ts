/**
 * Workflow System - Type Definitions
 *
 * Consolidates 27 skills into 8 workflows with automatic detection,
 * stateful conversations, and action execution capabilities.
 */

// ============================================================================
// Workflow Core Types
// ============================================================================

export type WorkflowId =
  | 'hiring'
  | 'performance'
  | 'onboarding'
  | 'offboarding'
  | 'analytics'
  | 'compensation'
  | 'employee_relations'
  | 'compliance'
  | 'general'; // Fallback for non-workflow conversations

export interface Workflow {
  id: WorkflowId;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  capabilities: WorkflowCapability[];
  systemPrompt: string;
  actions: Record<string, WorkflowActionDefinition>;
  steps?: WorkflowStep[];
  keywords?: string[]; // Additional keywords for detection boosting
}

export interface WorkflowTrigger {
  pattern: RegExp;
  weight: number; // Higher weight = higher priority when multiple matches
  contextHints?: string[]; // Additional context that increases confidence
  capability?: string; // Specific capability this trigger relates to
}

export interface WorkflowCapability {
  id: string;
  name: string;
  description: string;
  requirements?: string[]; // e.g., ['google_drive', 'employee_data']
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  nextSteps: string[]; // Possible next steps from here
  requiredData?: string[]; // Required data fields for this step
  optionalData?: string[]; // Optional data fields for this step
  isTerminal?: boolean; // Whether this is a final step (workflow completion)
}

/** Flexible workflow data value type */
export type WorkflowDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | WorkflowDataValue[]
  | { [key: string]: WorkflowDataValue };

export interface WorkflowActionDefinition {
  type: ActionType;
  label: string;
  description: string;
  defaultPayload?: Record<string, WorkflowDataValue>;
  requiresApproval?: boolean;
  requiredPermissions?: string[];
}

// ============================================================================
// Workflow Detection
// ============================================================================

export interface WorkflowMatch {
  workflowId: WorkflowId;
  confidence: number; // 0-100
  matchedTriggers: WorkflowTrigger[];
  contextFactors: string[]; // What influenced the detection
  capability?: string; // Specific capability matched (for context-based routing)
}

export interface DetectionContext {
  message: string;
  conversationHistory?: ConversationMessage[];
  currentWorkflow?: WorkflowId;
  userData?: Record<string, WorkflowDataValue>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  workflowId?: WorkflowId;
}

// ============================================================================
// Workflow State
// ============================================================================

export interface WorkflowState {
  workflowId: WorkflowId;
  step: string;
  data: Record<string, WorkflowDataValue>; // Workflow-specific data collected so far
  completedSteps: string[];
  nextActions: SuggestedAction[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, WorkflowDataValue>; // Additional context
}

export interface SuggestedAction {
  id: string;
  type: ActionType;
  label: string; // User-facing label: "Save to Google Drive"
  description: string; // Longer description of what this does
  payload: Record<string, WorkflowDataValue>; // Action-specific payload
  requiresApproval: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  icon?: string; // Icon name for UI
}

// ============================================================================
// Actions
// ============================================================================

export type ActionType =
  | 'create_document'
  | 'send_email'
  | 'send_slack_message'
  | 'schedule_meeting'
  | 'update_employee'
  | 'create_drive_folder'
  | 'analyze_data'
  | 'export_to_sheets';

export type Action =
  | DocumentAction
  | EmailAction
  | SlackAction
  | CalendarAction
  | DataUpdateAction
  | DriveFolderAction
  | AnalyzeDataAction
  | ExportSheetsAction;

// Document Actions
export interface DocumentAction {
  type: 'create_document';
  documentType: DocumentType;
  data: Record<string, WorkflowDataValue>;
  saveToGoogleDrive?: boolean;
  driveFolder?: string;
  templateId?: string; // Google Docs template ID
  fileName?: string;
  metadata?: DocumentMetadata;
}

export type DocumentType =
  | 'offer_letter'
  | 'job_description'
  | 'pip'
  | 'performance_review'
  | 'termination_letter'
  | 'onboarding_plan'
  | 'exit_checklist'
  | 'policy_document'
  | 'compensation_proposal'
  | 'investigation_report';

export interface DocumentMetadata {
  employeeId?: string;
  department?: string;
  templateVersion?: string;
  createdBy?: string;
  tags?: string[];
}

// Email Actions
export interface EmailAction {
  type: 'send_email';
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyFormat?: 'text' | 'html';
  attachments?: EmailAttachment[];
  requiresApproval: boolean;
  metadata?: EmailMetadata;
}

export interface EmailAttachment {
  filename: string;
  content?: string; // Base64 encoded
  url?: string; // Or URL to download
  mimeType?: string;
}

export interface EmailMetadata {
  campaignId?: string;
  category?: string;
  tags?: string[];
}

// Slack Actions
export interface SlackAction {
  type: 'send_slack_message';
  channel: string;
  message: string;
  threadTs?: string; // Reply to thread
  createChannel?: {
    name: string;
    members: string[];
    isPrivate?: boolean;
    topic?: string;
  };
  metadata?: SlackMetadata;
}

export interface SlackMetadata {
  priority?: 'normal' | 'urgent';
  category?: string;
}

// Calendar Actions
export interface CalendarAction {
  type: 'schedule_meeting';
  title: string;
  description?: string;
  attendees: string[];
  duration: number; // minutes
  suggestedTimes: Date[];
  location?: string;
  conferenceLink?: string;
  requiresApproval: boolean;
  metadata?: CalendarMetadata;
}

export interface CalendarMetadata {
  meetingType?: string;
  recurring?: boolean;
  recurrencePattern?: string;
}

// Data Update Actions
export interface DataUpdateAction {
  type: 'update_employee';
  employeeId: string;
  updates: Partial<EmployeeData>;
  requiresApproval: boolean;
  reason?: string;
  metadata?: DataUpdateMetadata;
}

export interface EmployeeData {
  full_name?: string;
  email?: string;
  department?: string;
  job_title?: string;
  manager_id?: string;
  location?: string;
  compensation_base?: number;
  status?: 'active' | 'terminated' | 'leave';
  [key: string]: WorkflowDataValue;
}

export interface DataUpdateMetadata {
  source?: string;
  verifiedBy?: string;
  effectiveDate?: string;
}

// Drive Folder Actions
export interface DriveFolderAction {
  type: 'create_drive_folder';
  folderName: string;
  parentFolder?: string;
  shareWith?: string[];
  permissions?: 'view' | 'edit' | 'comment';
}

// Analyze Data Actions
export interface AnalyzeDataAction {
  type: 'analyze_data';
  analysisType: string;
  filters?: Record<string, WorkflowDataValue>;
  outputFormat?: 'json' | 'chart' | 'report';
}

// Export to Sheets Actions
export interface ExportSheetsAction {
  type: 'export_to_sheets';
  data: Record<string, WorkflowDataValue>[];
  sheetId?: string;
  sheetName?: string;
  range?: string;
  createNew?: boolean;
}

// ============================================================================
// Action Results
// ============================================================================

export interface ActionResult {
  success: boolean;
  actionId?: string;
  data?: WorkflowDataValue | Record<string, WorkflowDataValue>;
  error?: string;
  metadata?: ActionResultMetadata;
}

export interface ActionResultMetadata {
  executionTimeMs?: number;
  provider?: string;
  resourceUrl?: string; // e.g., Google Doc URL
  resourceId?: string;
}

// ============================================================================
// Workflow Context
// ============================================================================

export interface WorkflowContext {
  workflow: Workflow;
  state?: WorkflowState;
  employeeData?: EmployeeData[];
  analyticsData?: Record<string, WorkflowDataValue>;
  templates?: WorkflowTemplate[];
  userPermissions?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  content?: string;
  driveId?: string; // Google Drive file ID
  type: 'local' | 'drive';
}

// ============================================================================
// Legacy Skill Mapping
// ============================================================================

export interface SkillToWorkflowMapping {
  skillId: string;
  workflowId: WorkflowId;
  capability?: string;
  notes?: string;
}
