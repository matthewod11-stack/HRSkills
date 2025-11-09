# Unified API Design (Phase 2)

> **Goal:** Consolidate 42+ fragmented endpoints into 12 unified, intelligent endpoints with smart routing

**Last Updated:** 2025-11-09
**Status:** Design Complete - Ready for Implementation
**Migration Target:** Phase 2 API Consolidation (Task 3.5)

---

## Overview

### Current State (Phase 1)
- **42+ API endpoints** across 9 categories
- Complex, fragmented routing
- Difficult to discover and use
- Inconsistent patterns

### Target State (Phase 2)
- **12 unified endpoints**
- Intelligent routing based on intent
- Query parameter-based specialization
- Consistent REST patterns

---

## The 12 Unified Endpoints

### 1. Chat Interface
**Endpoint:** `POST /api/chat`

**Purpose:** Single entry point for all conversational interactions with workflow detection and action suggestions

**Request:**
```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    employeeIds?: string[];
    department?: string;
    documentId?: string;
  };
}
```

**Response:**
```typescript
interface ChatResponse {
  conversationId: string;
  message: string;
  workflow?: {
    id: string;
    name: string;
    confidence: number;
    state?: WorkflowState;
  };
  suggestedActions?: Action[];
  attachments?: Attachment[];
}
```

**Smart Routing:**
- Detects workflow intent (hiring, performance, analytics, etc.)
- Routes to appropriate skill/workflow handler
- Maintains conversation context
- Returns suggested follow-up actions

**Consolidates:**
- `/api/chat` (original)
- `/api/analytics/chat` (analytics-specific)
- All workflow-specific chat endpoints

**Examples:**
```bash
# General query
POST /api/chat
{
  "message": "Show me engineering headcount"
}

# With context
POST /api/chat
{
  "message": "Draft an offer letter",
  "context": {
    "employeeIds": ["EMP001"]
  }
}

# Continue conversation
POST /api/chat
{
  "message": "Make the salary $150k",
  "conversationId": "conv_123"
}
```

---

### 2. Actions Execution
**Endpoint:** `POST /api/actions`

**Purpose:** Execute suggested actions from chat (emails, documents, Slack messages, etc.)

**Request:**
```typescript
interface ActionRequest {
  action: Action | Action[];  // Single or batch
  conversationId?: string;
}

type Action =
  | EmailAction
  | DocumentAction
  | SlackAction
  | CalendarAction
  | DataUpdateAction;
```

**Response:**
```typescript
interface ActionResponse {
  results: ActionResult[];
  summary: {
    successful: number;
    failed: number;
    pending: number;
  };
}
```

**Consolidates:**
- `/api/actions` (original)
- `/api/documents/export-to-google-docs`
- Email/Slack/Calendar-specific endpoints

**Examples:**
```bash
# Execute single action
POST /api/actions
{
  "action": {
    "type": "send_email",
    "to": "manager@company.com",
    "subject": "Review needed",
    "body": "..."
  }
}

# Execute batch actions
POST /api/actions
{
  "action": [
    { "type": "create_document", "documentType": "offer_letter", ... },
    { "type": "send_slack_message", "channel": "hiring", ... },
    { "type": "schedule_meeting", "title": "Offer discussion", ... }
  ],
  "conversationId": "conv_123"
}
```

---

### 3. Employee Data (CRUD)
**Endpoints:**
- `GET /api/employees` - List/search employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PATCH /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

**Query Parameters (GET):**
```typescript
interface EmployeeQueryParams {
  // Filtering
  department?: string;
  status?: 'active' | 'terminated' | 'leave';
  manager_id?: string;
  location?: string;

  // Search
  q?: string;  // Full-text search

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sort?: string;  // e.g., 'hire_date:desc'

  // Data enrichment
  include?: string[];  // ['metrics', 'reviews', 'manager']
}
```

**Response (GET):**
```typescript
interface EmployeesResponse {
  employees: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    applied: Record<string, any>;
    available: Record<string, string[]>;
  };
}
```

**Consolidates:**
- `/api/employees` (original)
- `/api/employees/:id` (original)
- Search/filter logic scattered across multiple endpoints

**Examples:**
```bash
# List all active employees in Engineering
GET /api/employees?department=Engineering&status=active

# Search for employees
GET /api/employees?q=sarah

# Get employee with enriched data
GET /api/employees/EMP001?include=metrics,reviews,manager

# Update employee
PATCH /api/employees/EMP001
{
  "job_title": "Senior Engineer",
  "compensation_base": 150000
}
```

---

### 4. Analytics
**Endpoint:** `GET /api/analytics`

**Purpose:** Unified analytics endpoint with metric-based routing

**Query Parameters:**
```typescript
interface AnalyticsQueryParams {
  // Metric selection
  metric: 'headcount' | 'attrition' | 'diversity' | 'performance' | 'nine-box' | 'engagement';

  // Filters
  department?: string;
  location?: string;
  dateRange?: 'ytd' | 'qtd' | 'mtd' | 'custom';
  startDate?: string;
  endDate?: string;

  // Grouping
  groupBy?: 'department' | 'location' | 'level' | 'manager';

  // Format
  format?: 'json' | 'csv';
}
```

**Response:**
```typescript
interface AnalyticsResponse {
  metric: string;
  data: any;  // Shape varies by metric
  metadata: {
    generatedAt: string;
    filters: Record<string, any>;
    dataPoints: number;
  };
}
```

**Metric-Specific Responses:**

**Headcount:**
```typescript
{
  metric: 'headcount',
  data: {
    total: 247,
    byDepartment: { Engineering: 89, Sales: 56, ... },
    byLocation: { 'San Francisco': 120, ... },
    trend: [
      { date: '2024-01', count: 235 },
      { date: '2024-02', count: 241 },
      ...
    ]
  }
}
```

**Attrition:**
```typescript
{
  metric: 'attrition',
  data: {
    rate: 12.5,
    voluntary: 8.2,
    involuntary: 4.3,
    byDepartment: { ... },
    topReasons: [
      { reason: 'Better opportunity', count: 12 },
      ...
    ]
  }
}
```

**Nine-Box Grid:**
```typescript
{
  metric: 'nine-box',
  data: {
    grid: [
      {
        performance: 'High',
        potential: 'High',
        count: 23,
        employees: [{ id: 'EMP001', name: 'Sarah Chen', ... }]
      },
      ...
    ],
    summary: {
      highPerformers: 67,
      developmentNeeded: 12,
      flightRisks: 8
    }
  }
}
```

**Consolidates:**
- `/api/analytics/headcount`
- `/api/analytics/attrition`
- `/api/analytics/nine-box`
- `/api/analytics/metrics`
- `/api/analytics/errors`
- `/api/performance/analyze`

**Examples:**
```bash
# Headcount by department
GET /api/analytics?metric=headcount&groupBy=department

# Attrition for last quarter
GET /api/analytics?metric=attrition&dateRange=qtd

# Nine-box grid for Engineering
GET /api/analytics?metric=nine-box&department=Engineering

# Export diversity metrics to CSV
GET /api/analytics?metric=diversity&format=csv
```

---

### 5. Documents
**Endpoint:** `POST /api/documents`

**Purpose:** Generate HR documents from templates with optional Google Drive export

**Request:**
```typescript
interface DocumentRequest {
  type: 'offer_letter' | 'job_description' | 'pip' | 'review' | 'policy';
  data: Record<string, any>;
  options?: {
    format?: 'markdown' | 'html' | 'pdf' | 'docx';
    saveToGoogleDrive?: boolean;
    folderId?: string;
    shareWith?: string[];
  };
}
```

**Response:**
```typescript
interface DocumentResponse {
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

**Consolidates:**
- `/api/documents/export-to-google-docs`
- Document generation logic from chat workflows
- Template rendering

**Examples:**
```bash
# Generate offer letter
POST /api/documents
{
  "type": "offer_letter",
  "data": {
    "candidateName": "Sarah Chen",
    "position": "Senior Engineer",
    "salary": 150000,
    "startDate": "2024-12-01"
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
    "level": "IC5"
  }
}
```

---

### 6. Data Upload
**Endpoint:** `POST /api/upload`

**Purpose:** Unified data upload with automatic format detection and validation

**Request (multipart/form-data):**
```typescript
interface UploadRequest {
  file: File;
  type: 'employee_data' | 'performance_reviews' | 'surveys' | 'skills';
  options?: {
    skipValidation?: boolean;
    dryRun?: boolean;
    mergeStrategy?: 'replace' | 'merge' | 'append';
  };
}
```

**Response:**
```typescript
interface UploadResponse {
  uploadId: string;
  status: 'validating' | 'importing' | 'completed' | 'failed';
  stats: {
    rowsProcessed: number;
    rowsImported: number;
    rowsSkipped: number;
    errors: ValidationError[];
  };
  preview?: {
    columns: string[];
    sampleRows: any[];
  };
}
```

**Consolidates:**
- `/api/data/upload`
- `/api/data/preview-upload`
- `/api/data/import`
- Format-specific upload endpoints

**Examples:**
```bash
# Upload employee CSV
POST /api/upload
Content-Type: multipart/form-data

file: employees.csv
type: employee_data
options: { "dryRun": true }

# Upload performance reviews
POST /api/upload
file: reviews.json
type: performance_reviews
```

---

### 7. Conversations
**Endpoints:**
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation details
- `DELETE /api/conversations/:id` - Delete conversation

**Query Parameters (GET):**
```typescript
interface ConversationQueryParams {
  // Filtering
  workflow?: string;
  userId?: string;

  // Search
  q?: string;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sort?: 'created_at:desc' | 'updated_at:desc';
}
```

**Response:**
```typescript
interface ConversationsResponse {
  conversations: Array<{
    id: string;
    title: string;
    workflow?: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: PaginationMeta;
}
```

**Examples:**
```bash
# List recent conversations
GET /api/conversations?sort=updated_at:desc&limit=20

# Search conversations
GET /api/conversations?q=engineering headcount

# Get conversation with messages
GET /api/conversations/conv_123
```

---

### 8. Authentication
**Endpoints:**
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/demo-token` - Generate demo token (dev only)
- `GET /api/auth/google` - Google OAuth (optional)

**Consolidates:**
- `/api/auth/login`
- `/api/auth/demo-token`
- `/api/auth/google/*`

**Examples:**
```bash
# Login
POST /api/auth/login
{
  "email": "admin@company.com",
  "password": "..."
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>

# Generate demo token (dev only)
POST /api/auth/demo-token
{
  "email": "test@example.com",
  "role": "admin"
}
```

---

### 9. Settings
**Endpoints:**
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings

**Request (PATCH):**
```typescript
interface SettingsUpdateRequest {
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      slack?: boolean;
    };
  };
  integrations?: {
    anthropicApiKey?: string;
    slackToken?: string;
    notionToken?: string;
  };
}
```

**Response:**
```typescript
interface SettingsResponse {
  userId: string;
  preferences: UserPreferences;
  integrations: {
    configured: string[];
    available: string[];
  };
  updatedAt: string;
}
```

**Examples:**
```bash
# Get settings
GET /api/settings

# Update Anthropic API key
PATCH /api/settings
{
  "integrations": {
    "anthropicApiKey": "sk-ant-..."
  }
}
```

---

### 10. Integrations
**Endpoints:**
- `GET /api/integrations` - List available integrations
- `POST /api/integrations/:provider/connect` - Connect integration
- `DELETE /api/integrations/:provider` - Disconnect integration
- `GET /api/integrations/:provider/status` - Check integration status

**Providers:**
- `google-workspace` - Drive, Docs, Sheets
- `slack`
- `rippling`
- `notion`
- `calendly`

**Response (GET):**
```typescript
interface IntegrationsResponse {
  integrations: Array<{
    provider: string;
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    connectedAt?: string;
    scopes?: string[];
  }>;
}
```

**Consolidates:**
- `/api/auth/google/*` (OAuth flow)
- Integration-specific status endpoints

**Examples:**
```bash
# List integrations
GET /api/integrations

# Connect Google Workspace
POST /api/integrations/google-workspace/connect
{
  "scopes": ["drive", "docs", "sheets"]
}

# Check Slack status
GET /api/integrations/slack/status
```

---

### 11. Cron Jobs
**Endpoints:**
- `GET /api/cron/onboarding` - Run onboarding automation
- `GET /api/cron/metrics-sync` - Sync metrics

**Authentication:**
```typescript
// Requires cron secret
Authorization: Bearer ${CRON_SECRET}
```

**Response:**
```typescript
interface CronResponse {
  job: string;
  status: 'completed' | 'failed';
  processed: number;
  errors?: string[];
  duration: number;
}
```

**Consolidates:**
- `/api/cron/onboarding`
- `/api/cron/metrics-sync`

**Examples:**
```bash
# Run onboarding automation
GET /api/cron/onboarding
Authorization: Bearer cron_secret_123

# Sync metrics
GET /api/cron/metrics-sync
Authorization: Bearer cron_secret_123
```

---

### 12. Health Check
**Endpoint:** `GET /api/health`

**Purpose:** System health monitoring

**Response:**
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: {
    database: 'up' | 'down';
    ai: {
      anthropic: 'up' | 'down';
      openai: 'up' | 'down';
      gemini: 'up' | 'down';
    };
    googleWorkspace: 'up' | 'down' | 'not_configured';
  };
  uptime: number;
  timestamp: string;
}
```

**Examples:**
```bash
GET /api/health
```

---

## Migration Strategy

### Phase 1: Preparation (Week 1)
1. **Create unified endpoints** (keep old endpoints running)
2. **Add deprecation warnings** to old endpoints
3. **Update documentation**
4. **Create migration guide**

### Phase 2: Frontend Migration (Week 2)
1. **Update API client** to use new endpoints
2. **Migrate frontend components** one by one
3. **Test thoroughly**

### Phase 3: Cleanup (Week 3)
1. **Remove old endpoints**
2. **Clean up unused code**
3. **Update tests**

### Backward Compatibility
- Old endpoints will **redirect** to new endpoints for 6 months
- Response format stays the same where possible
- New query parameters are optional

---

## Implementation Checklist

### Endpoint Creation
- [ ] Create `/api/chat/route.ts` with smart routing
- [ ] Create `/api/actions/route.ts` with batch support
- [ ] Update `/api/employees/route.ts` with unified query params
- [ ] Create `/api/analytics/route.ts` with metric routing
- [ ] Create `/api/documents/route.ts` with template system
- [ ] Update `/api/upload/route.ts` with format detection
- [ ] Update `/api/conversations/route.ts` with search
- [ ] Keep `/api/auth/*` endpoints (already clean)
- [ ] Keep `/api/settings/route.ts` (already clean)
- [ ] Create `/api/integrations/route.ts`
- [ ] Keep `/api/cron/*` endpoints (already clean)
- [ ] Keep `/api/health/route.ts` (already clean)

### Smart Routing Logic
- [ ] Implement workflow detection in chat endpoint
- [ ] Add metric-based routing in analytics endpoint
- [ ] Create document type routing system
- [ ] Build integration provider routing

### Documentation
- [ ] API reference for each endpoint
- [ ] Migration guide for frontend
- [ ] Example requests/responses
- [ ] Postman collection

### Testing
- [ ] Unit tests for routing logic
- [ ] Integration tests for each endpoint
- [ ] Migration tests (old → new)
- [ ] Load tests for consolidated endpoints

---

## Benefits

### For Users
- **Simpler mental model** - 12 endpoints vs 42+
- **Easier to discover** - Clear, logical organization
- **More powerful** - Query parameters for customization
- **Faster responses** - Smart routing reduces overhead

### For Developers
- **90% less API surface area** to maintain
- **Consistent patterns** across all endpoints
- **Easier testing** - Fewer endpoints to cover
- **Better error handling** - Centralized logic

### For Operations
- **Easier monitoring** - Fewer endpoints to track
- **Better caching** - More predictable patterns
- **Simpler deployment** - Less code to deploy
- **Clearer logs** - Unified logging patterns

---

## Next Steps

1. **Review this design** with team
2. **Start implementation** with Task 3.5.2 (smart routing in chat endpoint)
3. **Create API client** wrapper for frontend
4. **Update Postman collection**
5. **Write migration scripts**

---

**Questions or feedback?** Open an issue or discuss in team sync.
