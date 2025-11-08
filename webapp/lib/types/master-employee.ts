/**
 * Master Employee Record Schema
 *
 * This defines the canonical fields for employee records.
 * Data from all uploads merges into this master schema.
 */

export interface MasterEmployeeRecord {
  // Core Identity
  employee_id: string;                    // Primary key - HRIS ID
  external_id?: string;                   // External system ID (e.g., cap table)
  first_name?: string;
  last_name?: string;
  full_name?: string;                     // Auto-generated from first + last
  preferred_name?: string;
  email?: string;
  personal_email?: string;
  phone?: string;

  // Employment Details
  employee_type?: string;                 // Full-time, Part-time, Contractor, Intern
  relationship?: string;                  // Employee, Former Employee, Founder, Consultant, Board Member
  status?: string;                        // Active, Terminated, Leave
  hire_date?: string;                     // ISO date string
  termination_date?: string;
  termination_type?: string;              // Voluntary, Involuntary
  termination_reason?: string;
  regrettable_loss?: boolean;

  // Organizational
  department?: string;
  team?: string;
  sub_team?: string;
  job_title?: string;
  level?: string;                         // IC1, IC2, M1, etc.
  job_family?: string;                    // Engineering, Product, Sales, etc.
  manager_id?: string;                    // References another employee_id
  manager_name?: string;                  // Denormalized for display
  location?: string;
  office?: string;
  remote?: boolean;
  timezone?: string;

  // Compensation
  base_salary?: number;
  currency?: string;
  salary_effective_date?: string;
  bonus_target?: number;
  bonus_actual?: number;
  commission_target?: number;
  commission_actual?: number;
  equity_shares?: number;
  equity_value?: number;
  total_comp?: number;
  salary_range_min?: number;
  salary_range_max?: number;
  compa_ratio?: number;

  // Performance
  current_performance_rating?: string;
  previous_performance_rating?: string;
  last_review_date?: string;
  next_review_date?: string;
  promotion_eligible?: boolean;
  pip_status?: boolean;

  // Performance Reviews (array of reviews from different sources)
  performance_reviews?: PerformanceReview[];

  // Demographics (sensitive - for DEI analysis only)
  gender?: string;
  race_ethnicity?: string;
  veteran_status?: string;
  disability_status?: string;
  lgbtq?: string;
  age_range?: string;
  pronouns?: string;

  // Skills & Development
  primary_skills?: string[];              // Array of skill names
  skill_proficiency?: Record<string, number>;  // skill_name: proficiency_level
  certifications?: string[];
  languages?: string[];
  career_interests?: string[];

  // Engagement & Satisfaction
  latest_enps_score?: number;             // Employee Net Promoter Score
  latest_engagement_score?: number;
  pulse_survey_scores?: Record<string, number>;  // survey_name: score
  exit_survey_score?: number;

  // Time & Attendance
  pto_balance?: number;
  pto_used_ytd?: number;
  sick_leave_balance?: number;
  tenure_days?: number;                   // Auto-calculated
  tenure_years?: number;                  // Auto-calculated

  // Onboarding/Offboarding
  onboarding_completion?: number;         // Percentage
  onboarding_buddy?: string;              // employee_id
  exit_interview_completed?: boolean;
  knowledge_transfer_completed?: boolean;

  // Custom Fields (dynamic)
  custom_fields?: Record<string, any>;    // For any unmapped columns

  // Metadata
  created_at?: string;
  updated_at?: string;
  last_sync?: string;
  data_source?: string;                   // Primary/original data source
  data_sources?: string[];                // All files this employee appears in
}

/**
 * Performance Review record
 */
export interface PerformanceReview {
  review_id?: string;                     // Unique ID for this review
  review_period?: string;                 // Q1 2024, 2024 Annual, etc.
  review_date?: string;                   // ISO date string
  reviewer_id?: string;                   // Employee ID of reviewer
  reviewer_name?: string;                 // Name of reviewer
  reviewer_title?: string;                // Title of reviewer
  review_type: 'self' | 'peer' | 'manager' | 'upward'; // Type of review
  question?: string;                      // Question being answered
  response?: string;                      // Text response
  rating?: number;                        // Numeric rating (if applicable)
  rating_scale?: string;                  // e.g., "1-5"
}

/**
 * Field metadata for smart mapping
 */
export interface FieldMetadata {
  canonical_name: string;
  display_name: string;
  aliases: string[];                      // Common variations
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  category: 'identity' | 'employment' | 'org' | 'compensation' | 'performance' | 'demographics' | 'skills' | 'engagement' | 'time' | 'other';
  sensitive: boolean;                     // PII or sensitive data
  required: boolean;
  description: string;
}

/**
 * Canonical field definitions with aliases for smart mapping
 */
export const CANONICAL_FIELDS: Record<string, FieldMetadata> = {
  // Core Identity
  employee_id: {
    canonical_name: 'employee_id',
    display_name: 'Employee ID',
    aliases: ['employee_id', 'employee id', 'employeeid', 'emp_id', 'emp id', 'empid', 'hris_id', 'hris id', 'hrisid', 'id', 'user_id', 'userid', 'employee_number', 'employee number', 'employee#'],
    data_type: 'string',
    category: 'identity',
    sensitive: false,
    required: true,
    description: 'Unique employee identifier (primary key)'
  },
  external_id: {
    canonical_name: 'external_id',
    display_name: 'External ID',
    aliases: ['external_id', 'external id', 'externalid', 'external_system_id', 'cap_table_id', 'carta_id'],
    data_type: 'string',
    category: 'identity',
    sensitive: false,
    required: false,
    description: 'External system identifier (e.g., cap table, equity platform)'
  },
  first_name: {
    canonical_name: 'first_name',
    display_name: 'First Name',
    aliases: ['first_name', 'first name', 'firstname', 'fname', 'given_name', 'given name'],
    data_type: 'string',
    category: 'identity',
    sensitive: true,
    required: false,
    description: 'Employee first name'
  },
  last_name: {
    canonical_name: 'last_name',
    display_name: 'Last Name',
    aliases: ['last_name', 'last name', 'lastname', 'lname', 'surname', 'family_name', 'family name'],
    data_type: 'string',
    category: 'identity',
    sensitive: true,
    required: false,
    description: 'Employee last name'
  },
  full_name: {
    canonical_name: 'full_name',
    display_name: 'Full Name',
    aliases: ['full_name', 'full name', 'fullname', 'name', 'employee_name', 'employee name', 'display_name', 'display name'],
    data_type: 'string',
    category: 'identity',
    sensitive: true,
    required: false,
    description: 'Employee full name'
  },
  email: {
    canonical_name: 'email',
    display_name: 'Email',
    aliases: ['email', 'email_address', 'email address', 'work_email', 'work email', 'company_email', 'company email', 'business_email'],
    data_type: 'string',
    category: 'identity',
    sensitive: true,
    required: false,
    description: 'Work email address'
  },
  phone: {
    canonical_name: 'phone',
    display_name: 'Phone Number',
    aliases: ['phone', 'phone_number', 'phone number', 'phonenumber', 'mobile', 'mobile_phone', 'cell', 'cell_phone', 'work_phone'],
    data_type: 'string',
    category: 'identity',
    sensitive: true,
    required: false,
    description: 'Contact phone number'
  },

  // Employment Details
  employee_type: {
    canonical_name: 'employee_type',
    display_name: 'Employee Type',
    aliases: ['employee_type', 'employee type', 'type', 'employment_type', 'employment type', 'worker_type', 'classification'],
    data_type: 'string',
    category: 'employment',
    sensitive: false,
    required: false,
    description: 'Employment classification (Full-time, Part-time, Contractor, etc.)'
  },
  relationship: {
    canonical_name: 'relationship',
    display_name: 'Relationship',
    aliases: ['relationship', 'relation', 'employee_relationship', 'stakeholder_type'],
    data_type: 'string',
    category: 'employment',
    sensitive: false,
    required: false,
    description: 'Relationship to company (Employee, Former Employee, Founder, etc.)'
  },
  status: {
    canonical_name: 'status',
    display_name: 'Employment Status',
    aliases: ['status', 'employment_status', 'employment status', 'active', 'active_status', 'employee_status'],
    data_type: 'string',
    category: 'employment',
    sensitive: false,
    required: false,
    description: 'Current employment status (Active, Terminated, Leave)'
  },
  hire_date: {
    canonical_name: 'hire_date',
    display_name: 'Hire Date',
    aliases: ['hire_date', 'hire date', 'hiredate', 'start_date', 'start date', 'startdate', 'employment_start', 'join_date', 'date_hired'],
    data_type: 'date',
    category: 'employment',
    sensitive: false,
    required: false,
    description: 'Date employee was hired'
  },
  termination_date: {
    canonical_name: 'termination_date',
    display_name: 'Termination Date',
    aliases: ['termination_date', 'termination date', 'term_date', 'end_date', 'end date', 'exit_date', 'exit date', 'last_day', 'separation_date'],
    data_type: 'date',
    category: 'employment',
    sensitive: false,
    required: false,
    description: 'Date employment ended'
  },

  // Organizational
  department: {
    canonical_name: 'department',
    display_name: 'Department',
    aliases: ['department', 'dept', 'division', 'business_unit', 'bu', 'org', 'organization'],
    data_type: 'string',
    category: 'org',
    sensitive: false,
    required: false,
    description: 'Department or division'
  },
  job_title: {
    canonical_name: 'job_title',
    display_name: 'Job Title',
    aliases: ['job_title', 'job title', 'title', 'position', 'role', 'job', 'position_title'],
    data_type: 'string',
    category: 'org',
    sensitive: false,
    required: false,
    description: 'Job title or position'
  },
  level: {
    canonical_name: 'level',
    display_name: 'Level',
    aliases: ['level', 'grade', 'job_level', 'job level', 'career_level', 'band', 'tier'],
    data_type: 'string',
    category: 'org',
    sensitive: false,
    required: false,
    description: 'Career level (IC1, M2, etc.)'
  },
  manager_id: {
    canonical_name: 'manager_id',
    display_name: 'Manager ID',
    aliases: ['manager_id', 'manager id', 'managerid', 'supervisor_id', 'supervisor id', 'reports_to', 'manager_employee_id'],
    data_type: 'string',
    category: 'org',
    sensitive: false,
    required: false,
    description: 'Employee ID of direct manager'
  },
  location: {
    canonical_name: 'location',
    display_name: 'Location',
    aliases: ['location', 'work_location', 'work location', 'city', 'office_location', 'site', 'geo'],
    data_type: 'string',
    category: 'org',
    sensitive: false,
    required: false,
    description: 'Work location or office'
  },

  // Compensation
  base_salary: {
    canonical_name: 'base_salary',
    display_name: 'Base Salary',
    aliases: ['base_salary', 'base salary', 'salary', 'base_pay', 'base pay', 'annual_salary', 'compensation'],
    data_type: 'number',
    category: 'compensation',
    sensitive: true,
    required: false,
    description: 'Annual base salary'
  },
  bonus_target: {
    canonical_name: 'bonus_target',
    display_name: 'Target Bonus',
    aliases: ['bonus_target', 'bonus target', 'target_bonus', 'bonus', 'annual_bonus', 'bonus_amount'],
    data_type: 'number',
    category: 'compensation',
    sensitive: true,
    required: false,
    description: 'Target bonus amount'
  },
  equity_shares: {
    canonical_name: 'equity_shares',
    display_name: 'Equity Shares',
    aliases: ['equity_shares', 'equity shares', 'shares', 'stock_options', 'options', 'rsu', 'equity'],
    data_type: 'number',
    category: 'compensation',
    sensitive: true,
    required: false,
    description: 'Number of equity shares/options'
  },

  // Performance
  current_performance_rating: {
    canonical_name: 'current_performance_rating',
    display_name: 'Performance Rating',
    aliases: ['current_performance_rating', 'performance_rating', 'performance rating', 'rating', 'review_rating', 'latest_rating', 'performance', 'manager_rating'],
    data_type: 'string',
    category: 'performance',
    sensitive: true,
    required: false,
    description: 'Most recent performance rating'
  },
  reviewer_id: {
    canonical_name: 'reviewer_id',
    display_name: 'Reviewer ID',
    aliases: ['reviewer_id', 'reviewer id', 'reviewerid', 'review_by_id', 'rater_id'],
    data_type: 'string',
    category: 'performance',
    sensitive: false,
    required: false,
    description: 'Employee ID of the person who gave the review'
  },
  reviewer_name: {
    canonical_name: 'reviewer_name',
    display_name: 'Reviewer Name',
    aliases: ['reviewer_name', 'reviewer name', 'reviewername', 'reviewer', 'review_by', 'rater_name', 'rater'],
    data_type: 'string',
    category: 'performance',
    sensitive: false,
    required: false,
    description: 'Name of the person who gave the review'
  },
  reviewer_title: {
    canonical_name: 'reviewer_title',
    display_name: 'Reviewer Title',
    aliases: ['reviewer_title', 'reviewer title', 'reviewertitle', 'reviewer_job_title', 'rater_title'],
    data_type: 'string',
    category: 'performance',
    sensitive: false,
    required: false,
    description: 'Job title of the reviewer'
  },
  question: {
    canonical_name: 'question',
    display_name: 'Question',
    aliases: ['question', 'review_question', 'review question', 'assessment_question', 'feedback_question', 'prompt'],
    data_type: 'string',
    category: 'performance',
    sensitive: false,
    required: false,
    description: 'The performance review question being answered'
  },
  response: {
    canonical_name: 'response',
    display_name: 'Response',
    aliases: ['response', 'answer', 'review_response', 'review response', 'feedback', 'comment', 'comments', 'review_text', 'assessment_response'],
    data_type: 'string',
    category: 'performance',
    sensitive: true,
    required: false,
    description: 'The response/answer to the review question'
  },
  review_type: {
    canonical_name: 'review_type',
    display_name: 'Review Type',
    aliases: ['review_type', 'review type', 'reviewtype', 'assessment_type', 'feedback_type', 'type'],
    data_type: 'string',
    category: 'performance',
    sensitive: false,
    required: false,
    description: 'Type of review (self, peer, manager)'
  },

  // Engagement & Surveys
  enps_score: {
    canonical_name: 'enps_score',
    display_name: 'eNPS Score',
    aliases: ['enps_score', 'enps score', 'enps', 'score', 'engagement_score', 'engagement score', 'nps_score', 'nps', 'promoter_score'],
    data_type: 'number',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'Employee Net Promoter Score (0-10)'
  },
  survey_comment: {
    canonical_name: 'survey_comment',
    display_name: 'Survey Comment',
    aliases: ['survey_comment', 'comment', 'comments', 'feedback', 'response_text', 'open_response', 'verbatim', 'survey_response'],
    data_type: 'string',
    category: 'engagement',
    sensitive: true,
    required: false,
    description: 'Open-ended survey feedback or comments'
  },
  survey_quarter: {
    canonical_name: 'survey_quarter',
    display_name: 'Survey Quarter',
    aliases: ['survey_quarter', 'quarter', 'period', 'survey_period', 'survey_date', 'quarter_year', 'fiscal_quarter'],
    data_type: 'string',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'Quarter or period when survey was conducted'
  },
  survey_response_date: {
    canonical_name: 'survey_response_date',
    display_name: 'Survey Response Date',
    aliases: ['survey_response_date', 'response_date', 'survey_date', 'date', 'response_timestamp', 'submitted_date', 'completion_date'],
    data_type: 'date',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'Date the survey was completed'
  },
  survey_category: {
    canonical_name: 'survey_category',
    display_name: 'Survey Category',
    aliases: ['survey_category', 'category', 'survey_type', 'segment', 'response_category', 'classification'],
    data_type: 'string',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'Survey category or classification (Promoter, Passive, Detractor)'
  },
  survey_name: {
    canonical_name: 'survey_name',
    display_name: 'Survey Name',
    aliases: ['survey_name', 'survey', 'survey_title', 'questionnaire', 'survey_type'],
    data_type: 'string',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'Name or title of the survey'
  },
  question_text: {
    canonical_name: 'question_text',
    display_name: 'Question Text',
    aliases: ['question_text', 'question', 'survey_question', 'prompt', 'question_id'],
    data_type: 'string',
    category: 'engagement',
    sensitive: false,
    required: false,
    description: 'The survey question text'
  },

  // Demographics
  gender: {
    canonical_name: 'gender',
    display_name: 'Gender',
    aliases: ['gender', 'gender_identity', 'gender identity', 'sex'],
    data_type: 'string',
    category: 'demographics',
    sensitive: true,
    required: false,
    description: 'Gender identity'
  },
  race_ethnicity: {
    canonical_name: 'race_ethnicity',
    display_name: 'Race/Ethnicity',
    aliases: ['race_ethnicity', 'race/ethnicity', 'race', 'ethnicity', 'race_and_ethnicity'],
    data_type: 'string',
    category: 'demographics',
    sensitive: true,
    required: false,
    description: 'Race and ethnicity'
  }
};

/**
 * Column mapping result from smart detection
 */
export interface ColumnMapping {
  source_column: string;                  // Original column name from upload
  canonical_field: string | null;         // Mapped canonical field name
  confidence: number;                     // 0-1 confidence score
  is_custom: boolean;                     // True if no canonical match found
  data_type: string;
  sample_values: any[];                   // First few values for preview
}

/**
 * Upload preview with suggested mappings
 */
export interface UploadPreview {
  file_name: string;
  row_count: number;
  column_mappings: ColumnMapping[];
  conflicts: FieldConflict[];             // Fields that exist but have different values
  new_employees: number;                  // Count of new records
  existing_employees: number;             // Count of updates to existing records
  sample_data: Record<string, any>[];     // First 5 rows
}

/**
 * Field conflict when merging data
 */
export interface FieldConflict {
  employee_id: string;
  field_name: string;
  existing_value: any;
  new_value: any;
  resolution: 'keep_existing' | 'use_new' | 'manual';
}
