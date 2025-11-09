# API Reference v2

> **Complete reference for the 12 unified API endpoints**

**Version:** 2.0.0
**Base URL:** `https://api.hrcommand.center` or `http://localhost:3000`
**Authentication:** JWT Bearer token in `Authorization` header

---

## Table of Contents

1. [Authentication](#authentication)
2. [Chat Interface](#1-chat-interface)
3. [Actions Execution](#2-actions-execution)
4. [Employee Data](#3-employee-data)
5. [Analytics](#4-analytics)
6. [Documents](#5-documents)
7. [Data Upload](#6-data-upload)
8. [Conversations](#7-conversations)
9. [Authentication Endpoints](#8-authentication-endpoints)
10. [Settings](#9-settings)
11. [Integrations](#10-integrations)
12. [Cron Jobs](#11-cron-jobs)
13. [Health Check](#12-health-check)
14. [Error Handling](#error-handling)
15. [Rate Limits](#rate-limits)

---

## Authentication

All API requests (except `/api/auth/login` and `/api/health`) require authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Development Mode:**
In development, authentication is bypassed and you're auto-authenticated as admin.

---

## 1. Chat Interface

### POST /api/chat

Main entry point for conversational interactions with workflow detection and action suggestions.

**Request:**
```typescript
{
  message: string;              // Required: User message
  conversationId?: string;      // Optional: Continue existing conversation
  context?: {
    employeeIds?: string[];     // Optional: Employee context
    department?: string;        // Optional: Department context
    documentId?: string;        // Optional: Document context
  };
}
```

**Response:**
```typescript
{
  conversationId: string;       // Conversation ID
  message: string;              // AI response
  workflow?: {
    id: string;                 // Workflow ID (e.g., "hiring", "performance")
    name: string;               // Workflow name
    confidence: number;         // 0-100 confidence score
    state?: WorkflowState;      // Current workflow state
  };
  suggestedActions?: Action[];  // Suggested follow-up actions
  attachments?: Attachment[];   // Attached documents/data
  metadata: {
    tokensUsed: number;
    model: string;
    duration: number;
  };
}
```

**Examples:**

```bash
# Simple query
POST /api/chat
{
  "message": "Show me engineering headcount"
}

# With employee context
POST /api/chat
{
  "message": "Draft an offer letter for this candidate",
  "context": {
    "employeeIds": ["EMP001"]
  }
}

# Continue conversation
POST /api/chat
{
  "message": "Make the salary $150k instead",
  "conversationId": "conv_abc123"
}
```

**Workflow Detection:**

The chat endpoint automatically detects intent and routes to appropriate workflows:

| Keywords | Workflow | Example |
|----------|----------|---------|
| `hiring`, `job description`, `interview`, `offer` | `hiring` | "Create a job description for Senior Engineer" |
| `performance`, `review`, `feedback`, `pip` | `performance` | "Draft a performance review for Sarah" |
| `onboarding`, `new hire`, `first day` | `onboarding` | "Create onboarding plan for John" |
| `headcount`, `turnover`, `analytics` | `analytics` | "Show me engineering headcount trends" |
| `survey`, `engagement`, `pulse` | `surveys` | "Analyze Q4 engagement survey results" |

**Suggested Actions:**

```typescript
{
  suggestedActions: [
    {
      type: "create_document",
      label: "Save job description to Google Drive",
      documentType: "job_description",
      data: { ... }
    },
    {
      type: "send_slack_message",
      label: "Create #hiring-senior-eng channel",
      channel: "hiring-senior-eng",
      message: "New role: Senior Engineer"
    },
    {
      type: "send_email",
      label: "Email hiring manager for review",
      to: "manager@company.com",
      subject: "Review: Senior Engineer JD"
    }
  ]
}
```

---

## 2. Actions Execution

### POST /api/actions

Execute suggested actions (single or batch).

**Request:**
```typescript
{
  action: Action | Action[];    // Single action or array
  conversationId?: string;      // Optional: Link to conversation
}

// Action types
type Action =
  | EmailAction
  | DocumentAction
  | SlackAction
  | CalendarAction
  | DataUpdateAction;

interface EmailAction {
  type: "send_email";
  to: string | string[];
  subject: string;
  body: string;
  attachments?: File[];
  requiresApproval?: boolean;
}

interface DocumentAction {
  type: "create_document";
  documentType: string;
  data: Record<string, any>;
  saveToGoogleDrive?: boolean;
}

// ... other action types
```

**Response:**
```typescript
{
  results: Array<{
    actionId: string;
    type: string;
    status: "completed" | "failed" | "pending";
    result?: any;
    error?: string;
  }>;
  summary: {
    successful: number;
    failed: number;
    pending: number;
  };
}
```

**Examples:**

```bash
# Execute single action
POST /api/actions
{
  "action": {
    "type": "send_email",
    "to": "manager@company.com",
    "subject": "Review Needed: Offer Letter",
    "body": "Please review the attached offer letter."
  }
}

# Execute batch actions
POST /api/actions
{
  "action": [
    {
      "type": "create_document",
      "documentType": "offer_letter",
      "data": { "candidateName": "Sarah Chen", ... },
      "saveToGoogleDrive": true
    },
    {
      "type": "send_slack_message",
      "channel": "hiring",
      "message": "New offer letter ready for review"
    },
    {
      "type": "schedule_meeting",
      "title": "Offer Discussion",
      "attendees": ["hiring-manager@company.com"],
      "duration": 30
    }
  ],
  "conversationId": "conv_abc123"
}
```

---

## 3. Employee Data

### GET /api/employees

List and search employees with filtering, pagination, and data enrichment.

**Query Parameters:**
```typescript
{
  // Filtering
  department?: string;
  status?: "active" | "terminated" | "leave";
  manager_id?: string;
  location?: string;
  level?: string;

  // Search
  q?: string;                   // Full-text search

  // Pagination
  page?: number;                // Default: 1
  limit?: number;               // Default: 50, Max: 200

  // Sorting
  sort?: string;                // Format: "field:direction" (e.g., "hire_date:desc")

  // Data enrichment
  include?: string;             // Comma-separated: "metrics,reviews,manager"
}
```

**Response:**
```typescript
{
  employees: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      departments: string[];
      locations: string[];
      levels: string[];
    };
  };
}
```

**Examples:**

```bash
# List all active employees
GET /api/employees?status=active

# Search employees
GET /api/employees?q=sarah

# Filter by department
GET /api/employees?department=Engineering&status=active

# Get employees with metrics
GET /api/employees?include=metrics,reviews

# Pagination and sorting
GET /api/employees?page=2&limit=25&sort=hire_date:desc
```

### POST /api/employees

Create new employee.

**Request:**
```typescript
{
  email: string;                // Required
  full_name: string;            // Required
  department: string;           // Required
  job_title: string;            // Required
  hire_date: string;            // Required (ISO date)
  manager_id?: string;
  location?: string;
  employment_type?: "full_time" | "part_time" | "contract";
  compensation_base?: number;
  // ... other fields
}
```

**Response:**
```typescript
{
  employee: Employee;
  created: true;
}
```

### GET /api/employees/:id

Get employee details.

**Query Parameters:**
```typescript
{
  include?: string;             // "metrics,reviews,manager,direct_reports"
}
```

**Response:**
```typescript
{
  employee: Employee;
  metrics?: EmployeeMetrics;
  reviews?: PerformanceReview[];
  manager?: Employee;
  direct_reports?: Employee[];
}
```

**Example:**
```bash
GET /api/employees/EMP001?include=metrics,manager,direct_reports
```

### PATCH /api/employees/:id

Update employee.

**Request:**
```typescript
{
  // Any employee field can be updated
  job_title?: string;
  compensation_base?: number;
  department?: string;
  manager_id?: string;
  // ...
}
```

**Response:**
```typescript
{
  employee: Employee;
  updated: true;
}
```

### DELETE /api/employees/:id

Delete (or soft-delete) employee.

**Query Parameters:**
```typescript
{
  soft?: boolean;               // Default: true (sets status="terminated")
}
```

**Response:**
```typescript
{
  deleted: true;
  employee_id: string;
}
```

---

## 4. Analytics

### GET /api/analytics

Unified analytics endpoint with metric-based routing.

**Query Parameters:**
```typescript
{
  // Metric selection (required)
  metric: "headcount" | "attrition" | "diversity" | "performance" | "nine-box" | "engagement" | "costs";

  // Filters
  department?: string;
  location?: string;
  level?: string;
  manager_id?: string;

  // Date range
  dateRange?: "ytd" | "qtd" | "mtd" | "custom";
  startDate?: string;           // ISO date
  endDate?: string;             // ISO date

  // Grouping
  groupBy?: "department" | "location" | "level" | "manager";

  // Format
  format?: "json" | "csv";
}
```

**Response:**
```typescript
{
  metric: string;
  data: any;                    // Shape varies by metric
  metadata: {
    generatedAt: string;
    filters: Record<string, any>;
    dataPoints: number;
  };
}
```

### Metric-Specific Responses

#### Headcount
```bash
GET /api/analytics?metric=headcount&groupBy=department
```

```typescript
{
  metric: "headcount",
  data: {
    total: 247,
    byDepartment: {
      "Engineering": 89,
      "Sales": 56,
      "Marketing": 34,
      ...
    },
    byLocation: {
      "San Francisco": 120,
      "New York": 85,
      ...
    },
    trend: [
      { date: "2024-01", count: 235 },
      { date: "2024-02", count: 241 },
      { date: "2024-03", count: 247 }
    ]
  }
}
```

#### Attrition
```bash
GET /api/analytics?metric=attrition&dateRange=ytd
```

```typescript
{
  metric: "attrition",
  data: {
    rate: 12.5,
    voluntary: 8.2,
    involuntary: 4.3,
    byDepartment: {
      "Engineering": 10.2,
      "Sales": 18.5,
      ...
    },
    topReasons: [
      { reason: "Better opportunity", count: 12 },
      { reason: "Compensation", count: 8 },
      { reason: "Career growth", count: 6 }
    ],
    trend: [
      { month: "2024-01", rate: 11.2 },
      { month: "2024-02", rate: 12.8 },
      { month: "2024-03", rate: 12.5 }
    ]
  }
}
```

#### Nine-Box Grid
```bash
GET /api/analytics?metric=nine-box&department=Engineering
```

```typescript
{
  metric: "nine-box",
  data: {
    grid: [
      {
        performance: "High",
        potential: "High",
        count: 23,
        percentage: 26.1,
        employees: [
          { id: "EMP001", name: "Sarah Chen", ... },
          { id: "EMP002", name: "James Wilson", ... }
        ]
      },
      // ... 8 more cells
    ],
    summary: {
      highPerformers: 67,         // High-High + High-Medium
      developmentNeeded: 12,      // Low-Low + Low-Medium
      flightRisks: 8,             // High performers with low engagement
      readyForPromotion: 23       // High-High
    }
  }
}
```

#### Performance
```bash
GET /api/analytics?metric=performance&groupBy=department
```

```typescript
{
  metric: "performance",
  data: {
    averageRating: 3.8,
    distribution: {
      "5": 15,  // Exceptional
      "4": 45,  // Exceeds
      "3": 30,  // Meets
      "2": 8,   // Needs improvement
      "1": 2    // Unsatisfactory
    },
    byDepartment: {
      "Engineering": 3.9,
      "Sales": 3.7,
      ...
    },
    topPerformers: [
      { id: "EMP001", name: "Sarah Chen", rating: 5 },
      ...
    ]
  }
}
```

---

## 5. Documents

### POST /api/documents

Generate HR documents from templates with optional Google Drive export.

**Request:**
```typescript
{
  type: "offer_letter" | "job_description" | "pip" | "review" | "policy" | "termination" | "onboarding_plan";
  data: Record<string, any>;   // Template-specific data
  options?: {
    format?: "markdown" | "html" | "pdf" | "docx";
    saveToGoogleDrive?: boolean;
    folderId?: string;          // Google Drive folder ID
    shareWith?: string[];       // Email addresses
  };
}
```

**Response:**
```typescript
{
  documentId: string;
  type: string;
  content: string;
  format: string;
  googleDrive?: {
    fileId: string;
    url: string;
    sharedWith: string[];
  };
  createdAt: string;
}
```

**Examples:**

```bash
# Generate offer letter
POST /api/documents
{
  "type": "offer_letter",
  "data": {
    "candidateName": "Sarah Chen",
    "position": "Senior Software Engineer",
    "department": "Engineering",
    "salary": 150000,
    "equity": 10000,
    "startDate": "2024-12-01",
    "manager": "John Smith"
  },
  "options": {
    "format": "pdf",
    "saveToGoogleDrive": true,
    "shareWith": ["hiring-manager@company.com"]
  }
}

# Generate job description
POST /api/documents
{
  "type": "job_description",
  "data": {
    "title": "Senior Software Engineer",
    "department": "Engineering",
    "level": "IC5",
    "location": "San Francisco, CA (Hybrid)",
    "salaryRange": "$140k - $180k",
    "keyResponsibilities": [
      "Lead technical architecture decisions",
      "Mentor junior engineers",
      "Drive cross-team initiatives"
    ],
    "requirements": [
      "5+ years of software engineering experience",
      "Strong system design skills",
      "Experience with React and Node.js"
    ]
  }
}
```

---

## 6. Data Upload

### POST /api/upload

Upload employee data or other HR data files with automatic format detection.

**Request (multipart/form-data):**
```typescript
{
  file: File;                   // CSV, JSON, or XLSX
  type: "employee_data" | "performance_reviews" | "surveys" | "skills";
  options?: {
    skipValidation?: boolean;
    dryRun?: boolean;           // Preview only, don't import
    mergeStrategy?: "replace" | "merge" | "append";
  };
}
```

**Response:**
```typescript
{
  uploadId: string;
  status: "validating" | "importing" | "completed" | "failed";
  stats: {
    rowsProcessed: number;
    rowsImported: number;
    rowsSkipped: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
  };
  preview?: {
    columns: string[];
    sampleRows: any[];
  };
}
```

**Examples:**

```bash
# Upload employee CSV
POST /api/upload
Content-Type: multipart/form-data

file: employees.csv
type: employee_data

# Dry-run (preview only)
POST /api/upload
file: employees.csv
type: employee_data
options: { "dryRun": true }

# Merge strategy
POST /api/upload
file: new_employees.csv
type: employee_data
options: { "mergeStrategy": "merge" }
```

---

## 7. Conversations

### GET /api/conversations

List conversation history.

**Query Parameters:**
```typescript
{
  // Filtering
  workflow?: string;
  userId?: string;

  // Search
  q?: string;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sort?: "created_at:desc" | "updated_at:desc";
}
```

**Response:**
```typescript
{
  conversations: Array<{
    id: string;
    title: string;
    workflow?: string;
    messageCount: number;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: PaginationMeta;
}
```

### GET /api/conversations/:id

Get conversation details with messages.

**Response:**
```typescript
{
  conversation: {
    id: string;
    title: string;
    workflow?: {
      id: string;
      name: string;
      state: WorkflowState;
    };
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
      attachments?: Attachment[];
    }>;
    actions: Action[];
    createdAt: string;
    updatedAt: string;
  };
}
```

### DELETE /api/conversations/:id

Delete conversation.

**Response:**
```typescript
{
  deleted: true;
  conversationId: string;
}
```

---

## 8. Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  token: string;
  user: {
    userId: string;
    email: string;
    name: string;
    role: "admin" | "user";
  };
  expiresAt: string;
}
```

### POST /api/auth/logout

Invalidate current JWT token.

**Response:**
```typescript
{
  success: true;
}
```

### GET /api/auth/me

Get current authenticated user.

**Response:**
```typescript
{
  user: {
    userId: string;
    email: string;
    name: string;
    role: "admin" | "user";
    permissions: Record<string, boolean>;
  };
}
```

### POST /api/auth/demo-token

Generate demo token (development only).

**Request:**
```typescript
{
  email: string;
  role: "admin" | "user";
}
```

**Response:**
```typescript
{
  token: string;
  expiresAt: string;
}
```

---

## 9. Settings

### GET /api/settings

Get user settings and preferences.

**Response:**
```typescript
{
  userId: string;
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: {
      email: boolean;
      slack: boolean;
    };
  };
  integrations: {
    configured: string[];       // ["google-workspace", "slack"]
    available: string[];        // ["rippling", "notion"]
  };
  aiProvider: {
    current: "anthropic" | "openai" | "gemini";
    hasPersonalKey: boolean;
  };
  updatedAt: string;
}
```

### PATCH /api/settings

Update user settings.

**Request:**
```typescript
{
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: {
      email?: boolean;
      slack?: boolean;
    };
  };
  integrations?: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    slackToken?: string;
  };
}
```

**Response:**
```typescript
{
  updated: true;
  settings: Settings;
}
```

---

## 10. Integrations

### GET /api/integrations

List available integrations and their status.

**Response:**
```typescript
{
  integrations: Array<{
    provider: string;
    name: string;
    status: "connected" | "disconnected" | "error";
    connectedAt?: string;
    scopes?: string[];
    error?: string;
  }>;
}
```

### POST /api/integrations/:provider/connect

Connect integration (initiates OAuth flow for supported providers).

**Request:**
```typescript
{
  scopes?: string[];            // Optional: specific scopes to request
  redirectUrl?: string;         // Optional: custom redirect URL
}
```

**Response:**
```typescript
{
  authUrl: string;              // Redirect user to this URL
  state: string;                // OAuth state token
}
```

### GET /api/integrations/:provider/status

Check integration status.

**Response:**
```typescript
{
  provider: string;
  status: "connected" | "disconnected" | "error";
  connectedAt?: string;
  scopes?: string[];
  error?: string;
}
```

### DELETE /api/integrations/:provider

Disconnect integration.

**Response:**
```typescript
{
  disconnected: true;
  provider: string;
}
```

---

## 11. Cron Jobs

**Authentication:** Requires `CRON_SECRET` in Authorization header.

### GET /api/cron/onboarding

Run onboarding automation for new hires.

**Response:**
```typescript
{
  job: "onboarding";
  status: "completed" | "failed";
  processed: number;
  newHires: Array<{
    employeeId: string;
    name: string;
    startDate: string;
    tasksCompleted: string[];
  }>;
  errors?: string[];
  duration: number;
}
```

### GET /api/cron/metrics-sync

Sync metrics from external systems.

**Response:**
```typescript
{
  job: "metrics-sync";
  status: "completed" | "failed";
  processed: number;
  metrics: {
    synced: number;
    failed: number;
  };
  errors?: string[];
  duration: number;
}
```

---

## 12. Health Check

### GET /api/health

System health status.

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  services: {
    database: "up" | "down";
    ai: {
      anthropic: "up" | "down";
      openai: "up" | "down";
      gemini: "up" | "down";
    };
    googleWorkspace: "up" | "down" | "not_configured";
  };
  uptime: number;
  timestamp: string;
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```typescript
{
  success: false;
  error: string;              // Human-readable error message
  code: string;               // Machine-readable error code
  details?: any;              // Additional error context
  timestamp: string;
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid auth token |
| `PERMISSION_DENIED` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `WORKFLOW_ERROR` | Workflow execution failed |
| `AI_PROVIDER_ERROR` | AI provider API error |
| `DATABASE_ERROR` | Database operation failed |

### Example Error Responses

```typescript
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "timestamp": "2024-11-09T10:30:00Z"
}

// 400 Validation Error
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": {
      "email": "Invalid email format",
      "salary": "Must be a positive number"
    }
  },
  "timestamp": "2024-11-09T10:30:00Z"
}

// 429 Rate Limit
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 30,
    "resetAt": "2024-11-09T10:31:00Z"
  },
  "timestamp": "2024-11-09T10:30:00Z"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 10 requests | per minute |
| `/api/chat` | 30 requests | per minute |
| `/api/actions` | 30 requests | per minute |
| `/api/upload` | 20 requests | per minute |
| All other endpoints | 100 requests | per minute |

**Headers:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1699520400
```

---

## Changelog

### v2.0.0 (2024-11-09)
- Initial Phase 2 release
- Consolidated 42+ endpoints into 12 unified endpoints
- Added smart routing to chat endpoint
- Added metric-based routing to analytics endpoint
- Added batch action execution
- Enhanced employee endpoint with query parameters
- Unified document generation with Google Drive integration

---

**Questions?** See the [Migration Guide](./API_MIGRATION_GUIDE.md) or open an issue.
