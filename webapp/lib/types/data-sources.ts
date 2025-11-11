// Data source types for HR analytics

export type FileType =
  | 'employee_master'
  | 'compensation'
  | 'demographics'
  | 'performance'
  | 'turnover'
  | 'survey'
  | 'skills'
  | 'org_structure';

export interface DataFile {
  fileId: string;
  fileName: string;
  fileType: FileType;
  rowCount: number;
  columns: string[];
  uploadedAt: string;
  lastUsed?: string;
  filePath: string;
}

export interface UploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileType?: FileType;
  rowCount?: number;
  columns?: string[];
  uploadedAt?: string;
  validationErrors?: string[];
  error?: string;
}

export interface DataMetadata {
  files: DataFile[];
  lastUpdated: string | null;
}

export interface FilePreview {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

// Schema definitions for each file type
export const FILE_SCHEMAS: Record<FileType, string[]> = {
  employee_master: [
    'employee_id',
    'first_name',
    'last_name',
    'email',
    'department',
    'job_title',
    'level',
    'manager_id',
    'hire_date',
    'status',
    'location',
  ],
  compensation: [
    'employee_id',
    'base_salary',
    'bonus',
    'equity_value',
    'total_comp',
    'currency',
    'effective_date',
  ],
  demographics: ['employee_id', 'gender', 'race_ethnicity'],
  performance: [
    'employee_id',
    'review_period',
    'rating',
    'rating_scale',
    'reviewer_id',
    'reviewer_name',
    'reviewer_title',
    'question',
    'response',
    'review_type',
    'review_date',
  ],
  turnover: ['employee_id', 'termination_date', 'termination_type', 'reason_category'],
  survey: [
    'response_id',
    'employee_id',
    'survey_name',
    'question_id',
    'question_text',
    'response_value',
    'response_date',
  ],
  skills: ['employee_id', 'skill_name', 'skill_category', 'proficiency_level'],
  org_structure: ['employee_id', 'manager_id', 'department', 'team', 'location'],
};

// Human-readable labels for file types
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  employee_master: 'Employee Master Data',
  compensation: 'Compensation Data',
  demographics: 'Demographics Data',
  performance: 'Performance Reviews',
  turnover: 'Turnover/Exit Data',
  survey: 'Survey Responses',
  skills: 'Skills Data',
  org_structure: 'Org Structure',
};

// PII fields to mask in previews
export const PII_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'ssn',
  'social_security',
  'date_of_birth',
  'dob',
  'phone',
  'address',
  'bank_account',
];
