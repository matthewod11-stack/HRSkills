# API Migration Guide: Phase 1 → Phase 2

> **Goal:** Migrate from 42+ fragmented endpoints to 12 unified endpoints

**Last Updated:** 2025-11-09
**Estimated Migration Time:** 2-3 weeks
**Breaking Changes:** None (redirect layer for 6 months)

---

## Quick Reference: Old → New

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `POST /api/chat` | `POST /api/chat` | ✅ No change (enhanced with smart routing) |
| `POST /api/analytics/chat` | `POST /api/chat` | Merged into main chat endpoint |
| `GET /api/employees` | `GET /api/employees` | ✅ Enhanced with query params |
| `GET /api/employees/:id` | `GET /api/employees/:id` | ✅ Enhanced with `include` param |
| `GET /api/analytics/headcount` | `GET /api/analytics?metric=headcount` | Query param routing |
| `GET /api/analytics/attrition` | `GET /api/analytics?metric=attrition` | Query param routing |
| `GET /api/analytics/nine-box` | `GET /api/analytics?metric=nine-box` | Query param routing |
| `GET /api/analytics/metrics` | `GET /api/analytics?metric=...` | Query param routing |
| `POST /api/ai/analyze-sentiment` | `POST /api/chat` | Handled by chat with NLP workflow |
| `POST /api/ai/extract-entities` | `POST /api/chat` | Handled by chat with NLP workflow |
| `POST /api/ai/detect-language` | `POST /api/chat` | Handled by chat with NLP workflow |
| `POST /api/ai/translate` | `POST /api/chat` | Handled by chat with translation workflow |
| `POST /api/ai/transcribe` | `POST /api/chat` | Handled by chat with transcription workflow |
| `POST /api/ai/parse-resume` | `POST /api/chat` | Handled by chat with hiring workflow |
| `POST /api/ai/predict/attrition` | `GET /api/analytics?metric=attrition` | Analytics endpoint |
| `POST /api/ai/predict/performance` | `GET /api/analytics?metric=performance` | Analytics endpoint |
| `POST /api/ai/predict/promotion` | `GET /api/analytics?metric=performance` | Analytics endpoint |
| `POST /api/ai/extract-form` | `POST /api/chat` | Handled by chat |
| `POST /api/ai/ocr-image` | `POST /api/chat` | Handled by chat |
| `POST /api/documents/export-to-google-docs` | `POST /api/documents` | Unified document endpoint |
| `POST /api/data/upload` | `POST /api/upload` | Unified upload endpoint |
| `POST /api/data/preview-upload` | `POST /api/upload?dryRun=true` | Dry-run mode |
| `POST /api/data/import` | `POST /api/upload` | Auto-import after upload |
| `GET /api/data/list` | `GET /api/conversations` | Conversation history |
| `DELETE /api/data/delete/:fileId` | `DELETE /api/conversations/:id` | Delete conversation |
| `GET /api/data/preview/:id` | `GET /api/conversations/:id` | Get conversation |
| `POST /api/surveys/analyze` | `POST /api/chat` | Survey workflow |
| `POST /api/surveys/analyze-translated` | `POST /api/chat` | Survey + translation workflow |
| `GET /api/templates` | `GET /api/documents/templates` | Template listing |
| `GET /api/templates/content` | `GET /api/documents/templates/:id` | Template content |
| `POST /api/performance/analyze` | `GET /api/analytics?metric=performance` | Analytics endpoint |
| `GET /api/auth/login` | `POST /api/auth/login` | ✅ No change |
| `GET /api/auth/demo-token` | `POST /api/auth/demo-token` | ✅ No change |
| `GET /api/auth/google` | `POST /api/integrations/google-workspace/connect` | Integration endpoint |
| `GET /api/auth/google/callback` | Handled by integration flow | OAuth callback |
| `GET /api/auth/google/status` | `GET /api/integrations/google-workspace/status` | Integration status |
| `GET /api/setup/init` | `GET /api/health` | Health check includes init status |
| `GET /api/cron/onboarding` | `GET /api/cron/onboarding` | ✅ No change |
| `GET /api/cron/metrics-sync` | `GET /api/cron/metrics-sync` | ✅ No change |
| `GET /api/health` | `GET /api/health` | ✅ No change |
| `GET /api/metrics/*` | `GET /api/analytics?metric=...` | Analytics endpoint |
| `POST /api/actions` | `POST /api/actions` | ✅ Enhanced with batch support |

---

## Migration by Category

### Category 1: Analytics (9 endpoints → 1)

#### Before (Phase 1):
```typescript
// Headcount
GET /api/analytics/headcount

// Attrition
GET /api/analytics/attrition

// Nine-box grid
GET /api/analytics/nine-box

// Performance metrics
POST /api/ai/predict/performance

// Metrics dashboard
GET /api/metrics
GET /api/metrics/details
GET /api/metrics/ai-costs
```

#### After (Phase 2):
```typescript
// All analytics use unified endpoint with metric parameter
GET /api/analytics?metric=headcount
GET /api/analytics?metric=attrition
GET /api/analytics?metric=nine-box&department=Engineering
GET /api/analytics?metric=performance&groupBy=department
GET /api/analytics?metric=costs&type=ai
```

#### Migration Steps:
1. **Update API calls:**
   ```typescript
   // Old
   const headcount = await fetch('/api/analytics/headcount')

   // New
   const headcount = await fetch('/api/analytics?metric=headcount')
   ```

2. **Update query parameters:**
   ```typescript
   // Old (custom params per endpoint)
   GET /api/analytics/headcount?department=Engineering

   // New (unified params)
   GET /api/analytics?metric=headcount&department=Engineering&groupBy=location
   ```

3. **Handle response format:**
   ```typescript
   // Response format stays the same, just wrapped in standard envelope
   {
     metric: 'headcount',
     data: { /* same as before */ },
     metadata: { generatedAt, filters, dataPoints }
   }
   ```

---

### Category 2: AI Services (10 endpoints → 1)

#### Before (Phase 1):
```typescript
POST /api/ai/analyze-sentiment
POST /api/ai/extract-entities
POST /api/ai/detect-language
POST /api/ai/translate
POST /api/ai/transcribe
POST /api/ai/parse-resume
POST /api/ai/predict/attrition
POST /api/ai/predict/performance
POST /api/ai/extract-form
POST /api/ai/ocr-image
```

#### After (Phase 2):
```typescript
// All AI operations route through chat with workflow detection
POST /api/chat
{
  "message": "Analyze the sentiment of this review: 'Great work environment!'"
}

POST /api/chat
{
  "message": "Parse this resume",
  "attachments": [{ type: "file", url: "..." }]
}

POST /api/chat
{
  "message": "Translate this to Spanish: 'Welcome to the team'"
}
```

#### Migration Steps:
1. **Convert API calls to chat messages:**
   ```typescript
   // Old
   const sentiment = await fetch('/api/ai/analyze-sentiment', {
     method: 'POST',
     body: JSON.stringify({ text: 'Great work!' })
   })

   // New
   const response = await fetch('/api/chat', {
     method: 'POST',
     body: JSON.stringify({
       message: 'Analyze sentiment: "Great work!"'
     })
   })
   ```

2. **Extract data from chat response:**
   ```typescript
   // Chat response includes structured data
   {
     message: "The sentiment is positive (score: 0.85)",
     data: {
       sentiment: "positive",
       score: 0.85,
       reasoning: "..."
     }
   }
   ```

3. **Use analytics endpoint for predictions:**
   ```typescript
   // Old
   POST /api/ai/predict/attrition

   // New
   GET /api/analytics?metric=attrition&include=predictions
   ```

---

### Category 3: Data Upload (5 endpoints → 1)

#### Before (Phase 1):
```typescript
POST /api/data/upload
POST /api/data/preview-upload
POST /api/data/import
GET /api/data/list
DELETE /api/data/delete/:fileId
```

#### After (Phase 2):
```typescript
// Upload with auto-import
POST /api/upload

// Preview before importing (dry-run)
POST /api/upload?dryRun=true

// List uploaded data (now conversations)
GET /api/conversations

// Delete uploaded data
DELETE /api/conversations/:id
```

#### Migration Steps:
1. **Update upload endpoint:**
   ```typescript
   // Old
   const upload = await fetch('/api/data/upload', {
     method: 'POST',
     body: formData
   })

   // New
   const upload = await fetch('/api/upload', {
     method: 'POST',
     body: formData
   })
   ```

2. **Use dry-run for preview:**
   ```typescript
   // Old (separate endpoint)
   POST /api/data/preview-upload

   // New (same endpoint with flag)
   POST /api/upload?dryRun=true
   ```

3. **Use conversations for history:**
   ```typescript
   // Old
   GET /api/data/list

   // New
   GET /api/conversations?type=upload
   ```

---

### Category 4: Documents (3 endpoints → 1)

#### Before (Phase 1):
```typescript
POST /api/documents/export-to-google-docs
GET /api/templates
GET /api/templates/content
```

#### After (Phase 2):
```typescript
// Generate and optionally export to Google Docs
POST /api/documents
{
  "type": "offer_letter",
  "data": { ... },
  "options": {
    "saveToGoogleDrive": true
  }
}

// List templates (embedded in documents endpoint)
GET /api/documents/templates

// Get template content
GET /api/documents/templates/:id
```

#### Migration Steps:
1. **Update document creation:**
   ```typescript
   // Old (two-step: generate, then export)
   const doc = await generateDocument(data)
   await fetch('/api/documents/export-to-google-docs', {
     method: 'POST',
     body: JSON.stringify({ content: doc })
   })

   // New (one-step)
   await fetch('/api/documents', {
     method: 'POST',
     body: JSON.stringify({
       type: 'offer_letter',
       data,
       options: { saveToGoogleDrive: true }
     })
   })
   ```

---

### Category 5: Integrations (3 endpoints → 1)

#### Before (Phase 1):
```typescript
GET /api/auth/google
GET /api/auth/google/callback
GET /api/auth/google/status
```

#### After (Phase 2):
```typescript
// Connect integration
POST /api/integrations/google-workspace/connect

// OAuth callback (automatic)
GET /api/integrations/google-workspace/callback

// Check status
GET /api/integrations/google-workspace/status

// List all integrations
GET /api/integrations
```

#### Migration Steps:
1. **Update OAuth flow:**
   ```typescript
   // Old
   window.location.href = '/api/auth/google'

   // New
   window.location.href = '/api/integrations/google-workspace/connect'
   ```

2. **Check integration status:**
   ```typescript
   // Old
   GET /api/auth/google/status

   // New
   GET /api/integrations/google-workspace/status
   // Or get all integrations
   GET /api/integrations
   ```

---

## Frontend Migration Examples

### Example 1: Analytics Dashboard Component

#### Before:
```typescript
// components/analytics/AnalyticsDashboard.tsx
const AnalyticsDashboard = () => {
  const { data: headcount } = useSWR('/api/analytics/headcount')
  const { data: attrition } = useSWR('/api/analytics/attrition')
  const { data: nineBox } = useSWR('/api/analytics/nine-box')

  return (
    <div>
      <HeadcountChart data={headcount} />
      <AttritionChart data={attrition} />
      <NineBoxGrid data={nineBox} />
    </div>
  )
}
```

#### After:
```typescript
// components/analytics/AnalyticsDashboard.tsx
const AnalyticsDashboard = () => {
  const { data: headcount } = useSWR('/api/analytics?metric=headcount')
  const { data: attrition } = useSWR('/api/analytics?metric=attrition')
  const { data: nineBox } = useSWR('/api/analytics?metric=nine-box')

  return (
    <div>
      <HeadcountChart data={headcount?.data} />
      <AttritionChart data={attrition?.data} />
      <NineBoxGrid data={nineBox?.data} />
    </div>
  )
}
```

**Changes:**
- Updated endpoint URLs to use query parameters
- Access data from `response.data` instead of root

---

### Example 2: Employee Table Component

#### Before:
```typescript
const EmployeeTable = ({ department }: { department?: string }) => {
  const url = department
    ? `/api/employees?department=${department}`
    : '/api/employees'

  const { data } = useSWR(url)

  return <Table data={data} />
}
```

#### After:
```typescript
const EmployeeTable = ({
  department,
  status = 'active',
  include = ['metrics']
}: EmployeeTableProps) => {
  // Build query params
  const params = new URLSearchParams()
  if (department) params.append('department', department)
  if (status) params.append('status', status)
  if (include) params.append('include', include.join(','))

  const { data } = useSWR(`/api/employees?${params}`)

  return <Table data={data?.employees} pagination={data?.pagination} />
}
```

**Changes:**
- Enhanced with more query parameters
- Access employees from `data.employees`
- Use pagination metadata

---

### Example 3: Document Generation

#### Before:
```typescript
const generateOfferLetter = async (candidateData) => {
  // Step 1: Generate document
  const doc = await fetch('/api/documents/generate', {
    method: 'POST',
    body: JSON.stringify({ type: 'offer_letter', data: candidateData })
  }).then(r => r.json())

  // Step 2: Export to Google Docs
  const exported = await fetch('/api/documents/export-to-google-docs', {
    method: 'POST',
    body: JSON.stringify({ content: doc.content })
  }).then(r => r.json())

  return exported.url
}
```

#### After:
```typescript
const generateOfferLetter = async (candidateData) => {
  // Single API call
  const doc = await fetch('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      type: 'offer_letter',
      data: candidateData,
      options: {
        format: 'pdf',
        saveToGoogleDrive: true,
        shareWith: ['hiring-manager@company.com']
      }
    })
  }).then(r => r.json())

  return doc.googleDrive.url
}
```

**Changes:**
- Single API call instead of two
- Options embedded in request
- Response includes Google Drive metadata

---

## API Client Wrapper (Recommended)

Create a unified API client to handle all endpoint changes:

```typescript
// lib/api-client.ts
export class APIClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

  // Chat
  async chat(message: string, options?: ChatOptions) {
    return this.post('/api/chat', { message, ...options })
  }

  // Analytics
  async getAnalytics(metric: string, filters?: Record<string, any>) {
    const params = new URLSearchParams({ metric, ...filters })
    return this.get(`/api/analytics?${params}`)
  }

  // Employees
  async getEmployees(filters?: EmployeeFilters) {
    const params = new URLSearchParams(filters as any)
    return this.get(`/api/employees?${params}`)
  }

  async getEmployee(id: string, include?: string[]) {
    const params = include ? `?include=${include.join(',')}` : ''
    return this.get(`/api/employees/${id}${params}`)
  }

  // Documents
  async generateDocument(request: DocumentRequest) {
    return this.post('/api/documents', request)
  }

  // Upload
  async uploadData(file: File, options?: UploadOptions) {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      formData.append('options', JSON.stringify(options))
    }
    return this.post('/api/upload', formData)
  }

  // Actions
  async executeAction(action: Action | Action[]) {
    return this.post('/api/actions', { action })
  }

  // Helper methods
  private async get(url: string) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: this.getHeaders()
    })
    return this.handleResponse(response)
  }

  private async post(url: string, body: any) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
    return this.handleResponse(response)
  }

  private getHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }
    return response.json()
  }
}

// Export singleton
export const apiClient = new APIClient()
```

**Usage:**
```typescript
// Instead of direct fetch calls
import { apiClient } from '@/lib/api-client'

// Get analytics
const headcount = await apiClient.getAnalytics('headcount', {
  department: 'Engineering'
})

// Generate document
const doc = await apiClient.generateDocument({
  type: 'offer_letter',
  data: candidateData,
  options: { saveToGoogleDrive: true }
})

// Execute action
await apiClient.executeAction({
  type: 'send_email',
  to: 'manager@company.com',
  subject: 'Review needed',
  body: '...'
})
```

---

## Testing Migration

### 1. Unit Tests

Update unit tests to use new endpoints:

```typescript
// __tests__/api/analytics.test.ts
describe('Analytics API', () => {
  it('should return headcount data', async () => {
    // Old
    const response = await fetch('/api/analytics/headcount')

    // New
    const response = await fetch('/api/analytics?metric=headcount')

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.metric).toBe('headcount')
    expect(data.data).toBeDefined()
  })
})
```

### 2. Integration Tests

Test old → new endpoint redirects:

```typescript
describe('Backward Compatibility', () => {
  it('should redirect old analytics endpoints', async () => {
    // Old endpoint should redirect to new
    const response = await fetch('/api/analytics/headcount', {
      redirect: 'manual'
    })

    expect(response.status).toBe(307)  // Temporary redirect
    expect(response.headers.get('Location')).toBe('/api/analytics?metric=headcount')
  })
})
```

---

## Rollback Plan

If issues arise during migration:

### Step 1: Identify Issue
```bash
# Check error logs
grep "API Error" /var/log/app.log

# Monitor error rates
GET /api/health
```

### Step 2: Rollback
```bash
# Revert to Phase 1 endpoints
git revert <migration-commit>
git push

# Or toggle feature flag
ENABLE_UNIFIED_API=false
```

### Step 3: Fix & Retry
- Fix identified issues
- Test in staging
- Deploy to production

---

## Timeline & Checklist

### Week 1: Backend
- [ ] Create 12 unified endpoints
- [ ] Add redirect layer for old endpoints
- [ ] Add deprecation warnings to old endpoints
- [ ] Write unit tests for new endpoints
- [ ] Deploy to staging

### Week 2: Frontend
- [ ] Create API client wrapper
- [ ] Update components to use new endpoints
- [ ] Update tests
- [ ] Test in staging
- [ ] Deploy to production (with feature flag)

### Week 3: Cleanup
- [ ] Monitor error rates
- [ ] Fix any issues
- [ ] Remove feature flag (enable by default)
- [ ] Schedule old endpoint deprecation (6 months)

### Week 28: Final Cleanup (6 months later)
- [ ] Remove redirect layer
- [ ] Delete old endpoint code
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## Support

**Questions?** Check the [Unified API Design](./UNIFIED_API_DESIGN.md) doc or open an issue.

**Found a bug?** Report it with:
- Old endpoint URL
- New endpoint URL
- Expected vs actual response
- Error logs
