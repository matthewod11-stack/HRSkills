# API Reference

Complete reference for all HR Command Center API endpoints.

**Base URL:** `http://localhost:3000/api` (development)
**Production URL:** `https://your-domain.com/api`

**Last Updated:** November 11, 2025 (Phase 3.5: API Consolidation Complete)

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Common Response Format](#common-response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication APIs](#authentication-apis)
  - [Employee APIs](#employee-apis)
  - [Chat API](#chat-api)
  - [Analytics APIs](#analytics-apis)
  - [AI Service APIs](#ai-service-apis) ⭐ **NEW: Consolidated**
  - [Metrics APIs](#metrics-apis) ⭐ **UPDATED: Unified endpoint**
  - [Monitoring APIs](#monitoring-apis) ⭐ **NEW: Renamed from Performance**
  - [Data Management APIs](#data-management-apis)
  - [Performance Review APIs](#performance-review-apis)
  - [Health Check](#health-check)

---

## Authentication

All endpoints (except `/api/auth/login` and `/api/auth/demo-token`) require authentication via JWT Bearer token.

**Include in headers:**
```
Authorization: Bearer <your-jwt-token>
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication guide.

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Standard | 100 requests | 1 minute |
| AI/Chat | 20 requests | 1 minute |
| Data Upload | 10 requests | 1 minute |

**Rate limit headers returned:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1699564800
```

**Rate limit exceeded response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

---

## Error Handling

See [ERROR_HANDLING.md](./ERROR_HANDLING.md) for comprehensive error handling guide.

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## API Endpoints

---

## Authentication APIs

### POST /api/auth/login

Authenticate user and receive JWT token.

**Authentication:** None required
**Rate Limit:** 5 requests / 15 minutes
**Permissions:** None

#### Request Body

```typescript
{
  email: string;        // Valid email address
  password?: string;    // Optional in development
  role?: 'super_admin' | 'hr_admin' | 'hr_manager' | 'hr_analyst' | 'employee';
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@example.com",
    "name": "admin",
    "role": "hr_admin"
  }
}
```

#### Examples

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password",
    "role": "hr_admin"
  }'
```

**TypeScript:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password',
    role: 'hr_admin'
  })
});

const { token, user } = await response.json();
```

#### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid email address | Email format is invalid |
| 401 | Invalid credentials | Wrong email/password (production) |
| 429 | Rate limit exceeded | Too many login attempts |

---

### GET /api/auth/demo-token

Generate a demo JWT token for testing.

**Authentication:** None required
**Rate Limit:** 5 requests / 15 minutes

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | No | Role for the demo user (default: 'hr_admin') |

#### Response (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h"
}
```

#### Example

```bash
curl http://localhost:3000/api/auth/demo-token?role=hr_admin
```

---

## Employee APIs

### GET /api/employees

Get all employees with optional filtering and sorting.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `employees:read`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sortBy` | string | No | Field to sort by (e.g., 'full_name', 'hire_date') |
| `sortOrder` | 'asc' \| 'desc' | No | Sort direction (default: 'asc') |
| `status` | string | No | Filter by employment status |
| `department` | string | No | Filter by department |
| `search` | string | No | Search by name, email, or employee ID |

#### Response (200 OK)

```json
{
  "success": true,
  "employees": [
    {
      "employee_id": "EMP001",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "department": "Engineering",
      "job_title": "Senior Engineer",
      "hire_date": "2023-01-15",
      "status": "Active",
      "manager_id": "EMP100",
      "location": "San Francisco",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-11-01T00:00:00.000Z"
    }
  ],
  "count": 150
}
```

#### Examples

**Get all active employees:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/employees?status=active"
```

**Search and sort:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/employees?search=john&sortBy=hire_date&sortOrder=desc"
```

**TypeScript:**
```typescript
const response = await fetch('/api/employees?department=Engineering', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { employees, count } = await response.json();
```

---

### POST /api/employees

Create a new employee.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `employees:write`
**Required Roles:** `hr_admin`, `super_admin`

#### Request Body

```typescript
{
  employee_id: string;           // Required, must be unique
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  hire_date: string;             // ISO 8601 date
  status?: string;               // Default: 'Active'
  manager_id?: string;
  location?: string;
  // ... additional fields
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "employee": {
    "employee_id": "EMP002",
    "full_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "created_at": "2025-11-06T20:30:00.000Z",
    "updated_at": "2025-11-06T20:30:00.000Z"
  }
}
```

#### Example

```typescript
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employee_id: 'EMP002',
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    department: 'Marketing',
    job_title: 'Marketing Manager',
    hire_date: '2025-11-01'
  })
});
```

#### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | employee_id is required | Missing employee ID |
| 400 | Employee with this ID already exists | Duplicate employee ID |
| 403 | Admin role required | Insufficient permissions |

---

### PATCH /api/employees

Bulk update multiple employees.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `employees:write`
**Required Roles:** `hr_admin`, `super_admin`, `hr_manager`

#### Request Body

```typescript
{
  updates: Array<{
    employee_id: string;           // Required
    [key: string]: any;            // Fields to update
  }>;
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "updated": 5
}
```

#### Example

```typescript
await fetch('/api/employees', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    updates: [
      { employee_id: 'EMP001', department: 'Sales' },
      { employee_id: 'EMP002', job_title: 'Senior Manager' }
    ]
  })
});
```

---

### DELETE /api/employees

Bulk delete employees.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `employees:delete`
**Required Roles:** `super_admin` only

#### Request Body

```typescript
{
  employee_ids: string[];
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "deleted": 3
}
```

#### Example

```bash
curl -X DELETE http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employee_ids": ["EMP001", "EMP002", "EMP003"]}'
```

---

### GET /api/employees/[id]

Get a specific employee by ID.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `employees:read`

#### Response (200 OK)

```json
{
  "success": true,
  "employee": {
    "employee_id": "EMP001",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "department": "Engineering",
    "job_title": "Senior Engineer"
  }
}
```

#### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Employee not found | No employee with this ID |

---

## Chat API

### POST /api/chat

Send a message to Claude AI and receive a response.

**Authentication:** Required
**Rate Limit:** 20 requests / minute
**Permissions:** `chat:write`

#### Request Body

```typescript
{
  message: string;              // User's message/question
  conversationId?: string;      // Optional conversation ID
  skillId?: string;             // Optional specific skill to use
  context?: {                   // Optional context
    employeeId?: string;
    department?: string;
  };
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "reply": "Based on the employee data...",
  "detectedSkill": "skills-gap-analyzer",
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 450,
    "cache_read_tokens": 800,
    "estimated_cost": 0.0045
  },
  "conversationId": "conv_12345"
}
```

#### Features

- **Automatic skill detection** based on query keywords
- **Response caching** for repeated queries (5-minute TTL)
- **Dynamic token estimation** for cost optimization
- **Prompt caching** to reduce costs by 40%

#### Examples

**Simple query:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Show me employees in Engineering department'
  })
});

const { reply, usage } = await response.json();
```

**With specific skill:**
```typescript
await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Create a job description for Senior Engineer',
    skillId: 'job-description-writer'
  })
});
```

---

## Analytics APIs

### GET /api/analytics/metrics

Get overall HR analytics metrics.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Response (200 OK)

```json
{
  "success": true,
  "metrics": {
    "totalEmployees": 150,
    "activeEmployees": 145,
    "avgTenure": 3.2,
    "headcountTrend": [
      { "month": "2025-01", "count": 140 },
      { "month": "2025-02", "count": 145 }
    ],
    "departmentBreakdown": {
      "Engineering": 60,
      "Sales": 40,
      "Marketing": 30
    }
  }
}
```

---

### GET /api/analytics/headcount

Get headcount analytics and trends.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (ISO 8601) |
| `endDate` | string | No | End date (ISO 8601) |
| `groupBy` | 'month' \| 'quarter' \| 'year' | No | Grouping period |

#### Response (200 OK)

```json
{
  "success": true,
  "headcount": {
    "current": 150,
    "trend": [
      { "period": "2025-01", "count": 140, "change": 5 },
      { "period": "2025-02", "count": 145, "change": 5 }
    ],
    "byDepartment": {
      "Engineering": { "current": 60, "growth": 8 },
      "Sales": { "current": 40, "growth": 2 }
    }
  }
}
```

---

### GET /api/analytics/attrition

Get attrition analysis and trends.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Response (200 OK)

```json
{
  "success": true,
  "attrition": {
    "overall": {
      "rate": 12.5,
      "voluntary": 10.2,
      "involuntary": 2.3
    },
    "byDepartment": {
      "Engineering": { "rate": 15.0, "count": 9 },
      "Sales": { "rate": 10.0, "count": 4 }
    },
    "trend": [
      { "month": "2025-01", "rate": 11.5 },
      { "month": "2025-02", "rate": 12.5 }
    ]
  }
}
```

---

### GET /api/analytics/nine-box

Get nine-box grid performance data.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Response (200 OK)

```json
{
  "success": true,
  "nineBox": {
    "grid": {
      "high-high": 15,
      "high-medium": 25,
      "high-low": 10,
      "medium-high": 20,
      "medium-medium": 40,
      "medium-low": 15,
      "low-high": 5,
      "low-medium": 10,
      "low-low": 10
    },
    "employees": [
      {
        "employee_id": "EMP001",
        "performance": "high",
        "potential": "high"
      }
    ]
  }
}
```

---

### GET /api/analytics/chat

Get chat analytics and usage statistics.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Response (200 OK)

```json
{
  "success": true,
  "chatAnalytics": {
    "totalQueries": 1250,
    "uniqueUsers": 45,
    "topSkills": [
      { "skill": "job-description-writer", "count": 125 },
      { "skill": "skills-gap-analyzer", "count": 98 }
    ],
    "avgTokensPerQuery": 1500,
    "totalCost": 45.50
  }
}
```

---

### GET /api/analytics/errors

Get error tracking and analytics.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Response (200 OK)

```json
{
  "success": true,
  "errors": {
    "total": 45,
    "byType": {
      "validation": 20,
      "authentication": 15,
      "server": 10
    },
    "byEndpoint": {
      "/api/employees": 12,
      "/api/chat": 8
    },
    "recentErrors": [
      {
        "timestamp": "2025-11-06T20:00:00.000Z",
        "endpoint": "/api/employees",
        "error": "Validation error",
        "userId": "user_123"
      }
    ]
  }
}
```

---

## AI Service APIs

⭐ **Phase 3.5 Consolidation:** AI endpoints have been unified for better developer experience.

### POST /api/ai/analyze

**Unified analysis endpoint** supporting sentiment, entity extraction, language detection, classification, and summarization.

**Authentication:** Required
**Rate Limit:** 30 requests / minute
**Permissions:** `analytics:read`

#### Request Body

```typescript
{
  type: 'sentiment' | 'entities' | 'language' | 'classification' | 'summarization';
  text?: string;          // Single text analysis
  texts?: string[];       // Batch analysis (max 100)
  options?: Record<string, any>;  // Type-specific options
}
```

#### Response (200 OK)

**Single Text Analysis:**
```json
{
  "success": true,
  "data": {
    "type": "sentiment",
    "sentiment": "positive",
    "score": 0.85,
    "confidence": 0.92
  },
  "metadata": {
    "processingTime": 245,
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  }
}
```

**Batch Analysis:**
```json
{
  "success": true,
  "data": {
    "type": "sentiment",
    "results": [
      { "sentiment": "positive", "score": 0.85 },
      { "sentiment": "neutral", "score": 0.02 }
    ],
    "totalTexts": 2,
    "metadata": {
      "apiCalls": 2,
      "processingTime": 450
    }
  }
}
```

#### Examples

**Sentiment Analysis:**
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sentiment",
    "text": "The new employee onboarding process is fantastic!"
  }'
```

**Entity Extraction:**
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "entities",
    "text": "Sarah Johnson from the Engineering team in San Francisco"
  }'
```

**Batch Analysis:**
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sentiment",
    "texts": ["Great work!", "Needs improvement", "Outstanding performance"]
  }'
```

---

### POST /api/ai/transform

**Unified transformation endpoint** for translation, transcription, and OCR operations.

**Authentication:** Required
**Rate Limit:** 30 requests / minute
**Permissions:** `analytics:read`

#### Request Body

```typescript
{
  type: 'translate' | 'transcribe' | 'ocr';
  text?: string;           // Single text transformation
  texts?: string[];        // Batch transformation (translate only, max 100)
  targetLanguage?: string; // Required for translation
  options?: Record<string, any>;
}
```

#### Response (200 OK)

**Single Translation:**
```json
{
  "success": true,
  "data": {
    "type": "translate",
    "text": "Hola, ¿cómo estás?",
    "originalText": "Hello, how are you?",
    "targetLanguage": "Spanish"
  },
  "metadata": {
    "processingTime": 180
  }
}
```

**Batch Translation:**
```json
{
  "success": true,
  "data": {
    "type": "translate",
    "translations": [
      {
        "text": "Bonjour",
        "originalText": "Hello",
        "targetLanguage": "French"
      },
      {
        "text": "Au revoir",
        "originalText": "Goodbye",
        "targetLanguage": "French"
      }
    ],
    "totalTexts": 2
  }
}
```

#### Examples

**Translation:**
```bash
curl -X POST http://localhost:3000/api/ai/transform \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "translate",
    "text": "Performance review scheduled for next week",
    "targetLanguage": "Spanish"
  }'
```

---

### GET /api/ai/transform/languages

Get list of supported languages for translation.

**Authentication:** Required
**Rate Limit:** 100 requests / minute

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "languages": [
      { "code": "es", "name": "Spanish", "nativeName": "Español" },
      { "code": "fr", "name": "French", "nativeName": "Français" },
      { "code": "zh", "name": "Chinese", "nativeName": "中文" }
    ],
    "count": 20
  }
}
```

---

### GET /api/ai/analyze/health

Check AI provider health for analysis operations.

**Authentication:** Required
**Rate Limit:** 100 requests / minute

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "available": true,
    "providers": {
      "anthropic": { "healthy": true, "latency": 150 },
      "openai": { "healthy": true, "latency": 200 },
      "gemini": { "healthy": true, "latency": 180 }
    },
    "service": "Unified AI Analysis (Claude/GPT/Gemini)",
    "supportedTypes": ["sentiment", "entities", "language", "classification", "summarization"]
  }
}
```

---

### GET/PATCH /api/ai/config

Manage AI provider configuration.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `settings:write`

See existing documentation for details.

---

## Metrics APIs

⭐ **Phase 3.5 Update:** All metrics endpoints consolidated into a single unified endpoint with query parameters.

### GET /api/metrics

**Unified metrics endpoint** supporting dashboard summary, headcount details, attrition data, AI costs, and system performance.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Metric type: `dashboard`, `headcount`, `attrition`, `openPositions`, `ai-costs`, `performance` (default: `dashboard`) |
| `details` | boolean | No | Include drill-down data (default: `false`) |

#### Response (200 OK)

**Dashboard Summary** (`?type=dashboard` or no params):
```json
{
  "headcount": 150,
  "attritionRate": 12.5,
  "openPositions": 8,
  "lastUpdated": "2025-11-11T20:30:00.000Z"
}
```

**Headcount Details** (`?type=headcount&details=true`):
```json
{
  "success": true,
  "metric": "headcount",
  "total": 150,
  "data": [
    {
      "name": "John Doe",
      "role": "Senior Engineer",
      "date": "2025-01-15"
    }
  ]
}
```

**Attrition Details** (`?type=attrition&details=true`):
```json
{
  "success": true,
  "metric": "attrition",
  "rate": 12.5,
  "count": 18,
  "data": [
    {
      "name": "Jane Smith",
      "role": "Product Manager",
      "date": "2025-03-01"
    }
  ]
}
```

**AI Costs** (`?type=ai-costs`):
```json
{
  "cacheHitRate": 85.5,
  "avgCachedTokens": 12500,
  "avgInputTokens": 8000,
  "avgOutputTokens": 2500,
  "totalCost": 45.50,
  "estimatedMonthlyCost": 1250.00,
  "savingsVsBaseline": 3550.00,
  "sampleCount": 1250,
  "periodStart": "2025-11-10T00:00:00.000Z",
  "periodEnd": "2025-11-11T00:00:00.000Z"
}
```

#### Examples

**Dashboard Summary:**
```bash
curl http://localhost:3000/api/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Headcount with Details:**
```bash
curl "http://localhost:3000/api/metrics?type=headcount&details=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**AI Cost Tracking:**
```bash
curl "http://localhost:3000/api/metrics?type=ai-costs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Management APIs

### GET /api/data/list

List all uploaded data sources.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `data_upload:read`

#### Response (200 OK)

```json
{
  "success": true,
  "dataSources": [
    {
      "id": "source_1",
      "filename": "employees.csv",
      "type": "employees",
      "uploadedAt": "2025-11-01T00:00:00.000Z",
      "recordCount": 150,
      "status": "active"
    }
  ]
}
```

---

### POST /api/data/upload

Upload a new data file.

**Authentication:** Required
**Rate Limit:** 10 requests / minute
**Permissions:** `data_upload:write`

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | CSV or Excel file |
| `type` | string | Yes | Data type ('employees', 'performance', etc.) |

#### Response (201 Created)

```json
{
  "success": true,
  "dataSource": {
    "id": "source_2",
    "filename": "new_employees.csv",
    "recordCount": 25,
    "uploadedAt": "2025-11-06T20:30:00.000Z"
  }
}
```

---

### POST /api/data/preview-upload

Preview data file before uploading.

**Authentication:** Required
**Rate Limit:** 10 requests / minute
**Permissions:** `data_upload:read`

#### Response (200 OK)

```json
{
  "success": true,
  "preview": {
    "columns": ["employee_id", "full_name", "email"],
    "sampleRows": [ ... ],
    "recordCount": 150
  }
}
```

---

### GET /api/data/preview/[id]

Preview a specific data source.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `data_upload:read`

---

### POST /api/data/import

Import data from uploaded source.

**Authentication:** Required
**Rate Limit:** 10 requests / minute
**Permissions:** `data_upload:write`

---

### DELETE /api/data/delete/[fileId]

Delete a data source.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `data_upload:delete`

#### Response (200 OK)

```json
{
  "success": true,
  "deleted": true
}
```

---

## Monitoring APIs

⭐ **Phase 3.5 Update:** Renamed from `/api/performance` to `/api/monitoring` for clarity (system monitoring vs HR performance reviews).

### GET /api/monitoring

Get system performance and monitoring metrics.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `admin`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | number | No | Minutes to aggregate (default: 60) |
| `format` | string | No | Response format: `json` | `text` (default: `json`) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "metrics": {
      "avgResponseTime": 145,
      "requestCount": 1250,
      "errorRate": 0.02,
      "cacheHitRate": 0.85
    },
    "thresholds": {
      "status": "healthy",
      "alerts": []
    },
    "period": {
      "minutes": 60,
      "start": "2025-11-11T19:30:00.000Z",
      "end": "2025-11-11T20:30:00.000Z"
    }
  }
}
```

#### Examples

**Get Last Hour:**
```bash
curl "http://localhost:3000/api/monitoring?period=60" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Text Summary:**
```bash
curl "http://localhost:3000/api/monitoring?format=text" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/monitoring

System monitoring operations (export, clear metrics).

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `admin`

#### Request Body

```typescript
{
  action: 'export' | 'clear';
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Metrics cleared"
}
```

---

## Performance Review APIs

**Note:** HR performance review analysis remains at `/api/performance/analyze` (separate from system monitoring).

### POST /api/performance/analyze

Analyze employee performance data.

**Authentication:** Required
**Rate Limit:** 100 requests / minute
**Permissions:** `analytics:read`

---

## Health Check

### GET /api/health

System health check endpoint.

**Authentication:** None required
**Rate Limit:** None

#### Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T20:30:00.000Z",
  "version": "0.1.0",
  "uptime": 86400
}
```

---

## Best Practices

### Authentication
1. Store tokens securely (not in localStorage)
2. Refresh tokens before expiration
3. Use HTTPS in production
4. Include tokens in Authorization header

### Rate Limiting
1. Implement exponential backoff for retries
2. Cache responses when appropriate
3. Batch requests when possible
4. Monitor rate limit headers

### Error Handling
1. Always check `success` field in response
2. Handle all error status codes
3. Display user-friendly error messages
4. Log errors for debugging

### Performance
1. Use query parameters for filtering
2. Implement pagination for large datasets
3. Cache responses when data doesn't change frequently
4. Use compression for large payloads

---

## SDK Examples

### TypeScript SDK

```typescript
class HRCommandCenterClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getEmployees(params?: {
    status?: string;
    department?: string;
    search?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/employees?${query}`);
  }

  async chat(message: string, skillId?: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, skillId })
    });
  }

  async getMetrics() {
    return this.request('/api/metrics');
  }
}

// Usage
const client = new HRCommandCenterClient('http://localhost:3000', token);
const employees = await client.getEmployees({ department: 'Engineering' });
```

---

## Additional Resources

- [Authentication Guide](./AUTHENTICATION.md) - Detailed authentication and authorization
- [Error Handling Guide](./ERROR_HANDLING.md) - Comprehensive error handling patterns
- [Contributing Guidelines](../guides/CONTRIBUTING.md) - How to contribute
- [Architecture Decisions](../architecture/ARCHITECTURE_DECISIONS.md) - Technical decisions

---

**Questions or issues?** Open an issue or consult the [Documentation Index](../README.md).
