# HR Command Center - Claude Context File

> **Purpose:** This document provides essential context for Claude AI assistants to quickly understand and effectively work with the HR Command Center platform. Read this first before making changes.

**Last Updated:** 2025-11-07
**Platform Version:** 0.1.0
**Status:** Production-Ready with 27 HR Skills

---

## 🎯 What This Platform Is

HR Command Center is a **comprehensive HR automation platform** that combines:

1. **Next.js Web Application** - Full-featured dashboard with chat, analytics, employee management
2. **27 Claude Skills** - Domain-specific HR capabilities (job descriptions, performance reviews, onboarding, etc.)
3. **Python Automation Agents** - Scheduled scripts for data sync and workflow automation
4. **Multi-System Integration** - Rippling, Notion, Google Workspace, Slack, Calendly

**Core Value Proposition:** Automate 80% of repetitive HR tasks while maintaining quality, compliance, and consistency.

---

## 📊 Platform Statistics

- **27 Claude Skills** - Production-ready HR domain knowledge
- **23 API Endpoints** - RESTful API with JWT auth + RBAC
- **17 Custom React Components** - shadcn/ui + custom HR components
- **40+ shadcn/ui Components** - Full component library
- **5 User Roles** - super_admin, hr_admin, hr_manager, hr_analyst, employee
- **88% AI Cost Reduction** - Implemented via prompt caching, response caching, dynamic token limits
- **100% TypeScript** - Type-safe codebase with Zod validation
- **WCAG 2.1 AA Compliant** - Accessibility tested with jest-axe + Playwright

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 14 (App Router) + React 18 + TypeScript 5.3
- Tailwind CSS 3.4 + shadcn/ui components
- Zustand (state management) + React Hook Form + Zod
- Framer Motion (animations) + Chart.js (visualizations)

**Backend:**
- Next.js API Routes (serverless)
- JWT Authentication with RBAC
- Claude 3.5 Sonnet API (Anthropic SDK 0.68.0)
- Rate limiting + response caching + circuit breakers

**Data Layer:**
- JSON file storage (`/data/master-employees.json`)
- Google Sheets integration for exports
- Google Drive for template management
- In-memory caching (5min TTL, 100 entry max)

**Testing:**
- Jest + React Testing Library (unit/integration)
- Playwright (E2E + accessibility)
- jest-axe (WCAG 2.1 AA compliance)

### Directory Structure

```
/HRSkills/
├── webapp/                          # Next.js application (main codebase)
│   ├── app/                         # App Router pages & API routes
│   │   ├── api/                     # 23 API endpoints
│   │   │   ├── chat/                # Claude chat with skill routing
│   │   │   ├── employees/           # Employee CRUD
│   │   │   ├── analytics/           # HR metrics & dashboards
│   │   │   ├── data/                # CSV upload & data import
│   │   │   ├── templates/           # Google Drive template management
│   │   │   ├── documents/           # Google Docs export
│   │   │   └── auth/                # JWT auth + Google OAuth
│   │   ├── (pages)/                 # Client-side routes
│   │   │   ├── page.tsx             # Chat interface (main)
│   │   │   ├── employees/           # Employee directory
│   │   │   ├── analytics/           # Analytics dashboard
│   │   │   ├── data-sources/        # Data upload interface
│   │   │   └── settings/            # User settings
│   │   └── layout.tsx               # Root layout with auth
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # 40+ shadcn/ui primitives
│   │   ├── analytics/               # Chart components
│   │   ├── chat/                    # Chat interface components
│   │   ├── data-sources/            # Upload & preview
│   │   ├── employees/               # Employee management UI
│   │   └── documents/               # Document generation
│   │
│   ├── lib/                         # Core utilities & business logic
│   │   ├── auth/                    # JWT + RBAC implementation
│   │   ├── security/                # Rate limiting, audit logging
│   │   ├── api-helpers/             # API utilities, error handling
│   │   ├── analytics/               # Data processing & calculations
│   │   ├── stores/                  # Zustand state management
│   │   ├── skills.ts                # Skill loading & routing
│   │   ├── employee-context.ts      # Employee data enrichment
│   │   └── performance-monitor.ts   # Metrics tracking
│   │
│   ├── __tests__/                   # Test files (Jest + Playwright)
│   ├── public/                      # Static assets
│   └── package.json                 # Dependencies
│
├── skills/                          # 27 Claude skills (SKILL.md files)
│   ├── hr-document-generator/       # Offer letters, PIPs, termination letters
│   ├── job-description-writer/      # JD generation & optimization
│   ├── interview-guide-creator/     # Interview questions & scorecards
│   ├── performance-insights-analyst/# Performance review synthesis
│   ├── onboarding-program-builder/  # Onboarding plans & checklists
│   ├── offboarding-exit-builder/    # Exit processes & interviews
│   ├── hr-metrics-analyst/          # HR analytics & dashboards
│   ├── comp-band-designer/          # Compensation planning
│   └── ... (19 more skills)
│
├── agents/                          # Python automation scripts
│   ├── new-hire-onboarding/         # Auto-provision new hires
│   └── hr-metrics-dashboard/        # Daily metrics sync
│
├── data/                            # Data storage
│   ├── master-employees.json        # Primary employee data (enriched)
│   ├── uploads/                     # CSV upload staging
│   └── metadata/                    # Data source tracking
│
├── docs/                            # Documentation (60+ files)
│   ├── guides/                      # Setup, testing, deployment
│   ├── api/                         # API reference
│   ├── components/                  # Component library docs
│   ├── features/                    # Feature implementation docs
│   ├── architecture/                # Architecture decisions
│   └── audits/                      # Security, performance, a11y audits
│
├── scripts/                         # Utility scripts
│   ├── utilities/                   # Google Drive cleanup, quota checks
│   └── migrations/                  # Data migration scripts
│
└── tests/                           # Integration tests
    └── google-integration/          # Google API integration tests
```

---

## 🔐 Authentication & Authorization

### Auth Flow

1. **Login:** POST `/api/auth/login` → Returns JWT token (8h expiry)
2. **Demo Mode:** POST `/api/auth/demo-token` → Returns demo JWT (no validation)
3. **Google OAuth:** `/api/auth/google` → OAuth flow for Google Workspace integration
4. **Token Validation:** All API routes use `requireAuth()` middleware

### RBAC Model

**5 Role Types:**

```typescript
super_admin   // Full access to everything
hr_admin      // All HR operations, limited settings
hr_manager    // Employee management, basic analytics
hr_analyst    // Read-only analytics & reports
employee      // Chat-only access
```

**6 Resources:**
- `employees` - Employee CRUD operations
- `analytics` - Dashboard access & exports
- `chat` - Claude chat interface
- `data_upload` - CSV data import
- `settings` - System configuration
- `audit` - Audit log access

**Middleware Usage:**
```typescript
// In API routes:
const authResult = await requireAuth(request)
if (!authResult.success) return authErrorResponse(authResult)

if (!hasPermission(authResult.user, 'employees', 'write')) {
  return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
}
```

---

## 💬 Chat & Skill System

### How Chat Works

1. **User Message** → POST `/api/chat/route.ts`
2. **Skill Detection** → `detectSkill(message)` uses keyword matching
3. **Data Enrichment** → Load employee data, context, templates
4. **Skill Loading** → `loadSkill(skillId)` or `loadSkillWithDriveTemplates(skillId)`
5. **Claude API Call** → With prompt caching, optimized max_tokens
6. **Response Caching** → Cache responses for 5min (saves $1,350/month)
7. **Return to User** → Streaming or complete response

### Skill Routing Logic

**Detection:** `/webapp/app/api/chat/route.ts:60-150`

```typescript
// Example skill detection
function detectSkill(message: string): string {
  const messageLower = message.toLowerCase()

  // Pattern matching
  if (/job description|jd|posting/.test(messageLower)) {
    return 'job-description-writer'
  }
  if (/onboarding|new hire|first day/.test(messageLower)) {
    return 'onboarding-program-builder'
  }
  // ... 25 more patterns

  return '' // No skill matched, use general chat
}
```

### Skill Structure

**Each skill has:**
```
skills/{skill-name}/
├── SKILL.md              # Skill definition & instructions
├── references/           # Reference documents, examples
│   ├── examples.md
│   └── best-practices.md
├── assets/               # Images, templates
└── templates/            # Google Drive template IDs (optional)
    └── template-map.json
```

**SKILL.md Format:**
```markdown
---
name: job-description-writer
description: Creates compelling job descriptions optimized for hiring
---

# Instructions for Claude

You are an expert HR recruiter...

## Context Available
- {{EMPLOYEE_CONTEXT}} - Full employee dataset
- {{COMPANY_INFO}} - Company details
- {{REFERENCES}} - Best practices, examples

## Task
Generate job descriptions that...
```

### AI Cost Optimization

**3 Key Strategies (88% cost reduction):**

1. **Response Caching** (saves $1,350/month)
   - 5min TTL, 100 entry max
   - Cache key: `${message}-${skillId}-${dataHash}`

2. **Prompt Caching** (saves $1,200/month)
   - Cache skill prompts & employee data
   - Use `cache_control: { type: "ephemeral" }` on large contexts

3. **Dynamic max_tokens** (saves $100/month)
   ```typescript
   // Short answer queries: 512 tokens
   // Analysis queries: 2048 tokens
   // Long-form content: 4096 tokens
   ```

**Implementation:** `/webapp/app/api/chat/route.ts:36-57`

---

## 📊 Data Model

### Master Employee Schema

**File:** `/data/master-employees.json`

```typescript
interface Employee {
  // Core Identity
  employee_id: string              // Primary key (e.g., "EMP001")
  full_name: string
  first_name: string
  last_name: string
  email: string

  // Organizational
  department: string               // Engineering, Sales, etc.
  job_title: string
  level: string                    // IC1-5, M1-3, C-Level
  manager_id: string | null

  // Employment
  hire_date: string                // ISO date
  termination_date: string | null
  status: 'active' | 'terminated'
  location: string
  employee_type: 'Full-time' | 'Part-time' | 'Contractor'

  // Demographics (optional)
  gender?: string
  race_ethnicity?: string

  // Metadata
  data_source: string              // Original source file
  data_sources: string[]           // All contributing files
  created_at: string
  updated_at: string

  // Enriched Data (from CSV merges)
  enps_score?: number              // -100 to 100
  survey_quarter?: string
  survey_response_date?: string
  survey_category?: 'Promoter' | 'Passive' | 'Detractor'

  performance_reviews?: Array<{
    review_id: string
    review_type: 'self' | 'manager' | 'peer' | 'upward'
    reviewer_id?: string
    reviewer_name?: string
    response: string
    rating_scale: string
    review_date: string
  }>

  skills?: Array<{
    skill_name: string
    proficiency_level: string
    years_experience: number
    last_assessed: string
  }>
}
```

### Data Flow

```
CSV Upload → /api/data/upload
    ↓
Preview & Validation → /api/data/preview-upload
    ↓
Merge with Master → /api/data/import
    ↓
Update master-employees.json
    ↓
Reload in Memory → employeeStore.ts
```

**Key Files:**
- `/webapp/lib/types/master-employee.ts` - TypeScript schema
- `/webapp/lib/analytics/utils.ts` - Data loading utilities
- `/webapp/app/api/data/import/route.ts` - Import logic

---

## 🔧 Key Implementation Patterns

### Error Handling

**Centralized Pattern:**
```typescript
// Use in API routes
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'

try {
  const result = await someOperation()
  return createSuccessResponse(result)
} catch (error) {
  return handleApiError(error, 'Operation failed')
}
```

**Types:** `/webapp/lib/api-helpers/error-handler.ts`

### Rate Limiting

```typescript
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'

// In API route
const rateLimitResult = await applyRateLimit(
  request,
  RateLimitPresets.CHAT // 30 requests/min
)
if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

**Presets:**
- `STANDARD` - 100 req/min
- `CHAT` - 30 req/min
- `AUTH` - 10 req/min
- `UPLOAD` - 20 req/min

### State Management (Zustand)

```typescript
// Employee store
import { useEmployeeStore } from '@/lib/stores/employee-store'

const { employees, loadEmployees, isLoading } = useEmployeeStore()

// Load data
await loadEmployees()

// Access data
const activeEmployees = employees.filter(e => e.status === 'active')
```

**Stores:**
- `employee-store.ts` - Employee data cache
- More stores can be added as needed

### Form Validation (Zod)

```typescript
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

---

## 🎨 Component Patterns

### Custom Components

**Location:** `/webapp/components/`

**Key Components:**
1. **ChatInterface** - Main chat UI with skill detection indicator
2. **EmployeeTable** - Virtualized table with 1000+ rows support
3. **AnalyticsDashboard** - Multi-chart dashboard with drill-down
4. **DataSourcesManager** - CSV upload with preview & validation
5. **MetricCard** - Animated metric displays with popups
6. **SkillBadge** - Visual skill indicators in chat
7. **ErrorBoundary** - Graceful error handling

**Usage Examples:**
```tsx
// Chat with skill detection
<ChatInterface
  userId={user.userId}
  skillDetectionEnabled={true}
/>

// Employee table with filters
<EmployeeTable
  employees={employees}
  onEmployeeSelect={handleSelect}
  enableVirtualization={true}
/>

// Analytics with drill-down
<AnalyticsDashboard
  metrics={hrMetrics}
  enableExport={true}
  onDrillDown={handleDrillDown}
/>
```

### shadcn/ui Components

**40+ components available:** Button, Card, Dialog, Table, Form, Select, etc.

**Import pattern:**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

**Documentation:** `webapp/docs/components/UI_COMPONENTS.md`

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

**Run:** `npm test`

```typescript
// Example: Testing employee store
import { useEmployeeStore } from '@/lib/stores/employee-store'

describe('Employee Store', () => {
  it('should load employees', async () => {
    const store = useEmployeeStore.getState()
    await store.loadEmployees()
    expect(store.employees.length).toBeGreaterThan(0)
  })
})
```

### E2E Tests (Playwright)

**Run:** `npm run test:e2e`

```typescript
// Example: Testing chat flow
test('should send chat message', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.fill('[data-testid="chat-input"]', 'Show me engineering headcount')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('.chat-message')).toBeVisible()
})
```

### Accessibility Tests

**Run:** `npm run test:a11y`

```typescript
import { axe } from 'jest-axe'

test('should have no accessibility violations', async () => {
  const { container } = render(<ChatInterface />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 🚀 Common Development Tasks

### Adding a New Skill

1. **Create skill directory:**
   ```bash
   mkdir -p skills/my-new-skill/references
   ```

2. **Create SKILL.md:**
   ```markdown
   ---
   name: my-new-skill
   description: What this skill does
   ---

   # Instructions for Claude

   You are an expert in...
   ```

3. **Add detection pattern:**
   ```typescript
   // In /webapp/app/api/chat/route.ts
   {
     id: 'my-new-skill',
     keywords: ['relevant', 'keywords', 'here']
   }
   ```

4. **Test:**
   ```bash
   # Start dev server
   npm run dev

   # Try chat query with your keywords
   ```

### Adding a New API Endpoint

1. **Create route file:**
   ```typescript
   // /webapp/app/api/my-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { requireAuth, hasPermission } from '@/lib/auth/middleware'
   import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'

   export async function GET(request: NextRequest) {
     const authResult = await requireAuth(request)
     if (!authResult.success) return authErrorResponse(authResult)

     try {
       // Your logic here
       return createSuccessResponse({ data: 'result' })
     } catch (error) {
       return handleApiError(error, 'Operation failed')
     }
   }
   ```

2. **Add to API reference:**
   - Update `docs/api/API_REFERENCE.md`

3. **Add tests:**
   ```typescript
   // __tests__/api/my-endpoint.test.ts
   describe('GET /api/my-endpoint', () => {
     it('should return data', async () => {
       // Test implementation
     })
   })
   ```

### Modifying Employee Data Schema

1. **Update TypeScript types:**
   ```typescript
   // /webapp/lib/types/master-employee.ts
   export interface Employee {
     // Add new field
     new_field?: string
   }
   ```

2. **Update import logic:**
   ```typescript
   // /webapp/app/api/data/import/route.ts
   // Handle new field in CSV processing
   ```

3. **Update UI:**
   - Add to EmployeeTable columns
   - Add to employee detail views

4. **Update documentation:**
   - Update this file (Data Model section)
   - Update API_REFERENCE.md

### Deploying Changes

1. **Run validation:**
   ```bash
   npm run validate  # type-check + lint + test
   ```

2. **Build production:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   # Vercel (recommended)
   vercel deploy --prod

   # Or Docker
   docker build -t hr-command-center .
   docker run -p 3000:3000 hr-command-center
   ```

---

## 🔍 Debugging & Troubleshooting

### Common Issues

**Issue: "Skill not detected"**
- Check keyword patterns in `/webapp/app/api/chat/route.ts:60-150`
- Ensure SKILL.md exists in `/skills/{skill-name}/`
- Check skill name matches exactly (case-sensitive)

**Issue: "Rate limit exceeded"**
- Check rate limit preset in API route
- Adjust limits in `/webapp/lib/security/rate-limiter.ts`
- Clear rate limit cache (restart server)

**Issue: "Authentication failed"**
- Check JWT token expiry (8 hours default)
- Verify `JWT_SECRET` environment variable
- Use demo token endpoint for testing: POST `/api/auth/demo-token`

**Issue: "Employee data not loading"**
- Check `/data/master-employees.json` exists
- Verify file permissions
- Check console for JSON parse errors
- Reload: `useEmployeeStore.getState().loadEmployees()`

**Issue: "Claude API errors"**
- Check `ANTHROPIC_API_KEY` environment variable
- Verify API quota: Check Anthropic console
- Check prompt cache headers (max 4 cache points)
- Review error logs: `/webapp/lib/errorLogging.ts`

### Logging

**Client-side:**
```typescript
// Automatic error logging
import { logError } from '@/lib/errorLogging'
logError(error, { context: 'Component name', userId })
```

**Server-side:**
```typescript
// API routes auto-log via handleApiError
console.error('[API Error]', error)
```

**Metrics:**
```typescript
import { trackMetric } from '@/lib/performance-monitor'
trackMetric('operation_name', duration)
```

---

## 📚 Key Documentation Files

**Must-Read:**
1. `README.md` - Project overview & quick start
2. `DOCUMENTATION_SUMMARY.md` - All docs index
3. `docs/api/API_REFERENCE.md` - Complete API docs
4. `docs/components/COMPONENT_LIBRARY.md` - Component usage
5. `docs/guides/TESTING_GUIDE.md` - Testing strategy
6. `docs/architecture/ARCHITECTURE_DECISIONS.md` - Technical decisions

**Feature Deep-Dives:**
- `docs/features/AI_COST_OPTIMIZATION_COMPLETE.md` - Cost reduction strategies
- `docs/features/STATE_MANAGEMENT_REFACTOR_COMPLETE.md` - Zustand implementation
- `docs/features/ACCESSIBILITY_AUDIT_SUMMARY.md` - A11y compliance

**Skills Documentation:**
- `docs/claude-hr-capabilities-master.md` - All 27 skills overview
- Individual skill SKILL.md files in `/skills/`

---

## 🎓 Best Practices

### Code Style

1. **TypeScript Everywhere** - No any types, use Zod for runtime validation
2. **Component Structure** - Small, focused components with single responsibility
3. **Error Handling** - Always use try/catch with handleApiError
4. **Authentication** - Always use requireAuth + hasPermission in API routes
5. **State Management** - Use Zustand for global state, local state for UI
6. **Testing** - Write tests for all new features (unit + E2E)

### Performance

1. **Virtualization** - Use for tables with 100+ rows
2. **Memoization** - Use React.memo for expensive components
3. **Code Splitting** - Dynamic imports for large features
4. **API Caching** - Use response cache for repeated queries
5. **Prompt Caching** - Use Claude prompt caching for large contexts
6. **Dynamic Tokens** - Adjust max_tokens based on query type

### Security

1. **Input Validation** - Always validate with Zod schemas
2. **Rate Limiting** - Apply to all public endpoints
3. **RBAC** - Check permissions on every protected operation
4. **Audit Logging** - Log all data modifications
5. **Secrets** - Never commit API keys, use env variables
6. **SQL Injection** - N/A (JSON file storage), but validate all inputs

### Accessibility

1. **Semantic HTML** - Use proper HTML5 elements
2. **ARIA Labels** - Add to all interactive elements
3. **Keyboard Nav** - Ensure all features keyboard-accessible
4. **Color Contrast** - Maintain WCAG AA standards
5. **Screen Readers** - Test with VoiceOver/NVDA
6. **Focus Management** - Proper focus states and trap in modals

---

## 🚨 Critical Information

### Environment Variables

**Required:**
```bash
ANTHROPIC_API_KEY=sk-ant-...           # Claude API key
JWT_SECRET=your-secret-key             # JWT signing key (32+ chars)
NEXT_PUBLIC_API_URL=http://localhost:3000  # API base URL
```

**Optional (Google Integration):**
```bash
GOOGLE_CLIENT_ID=...                   # For Google OAuth
GOOGLE_CLIENT_SECRET=...               # For Google OAuth
GOOGLE_DRIVE_FOLDER_ID=...            # Template storage folder
NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=true  # Enable template features
```

### Data Backup

**Critical Files:**
- `/data/master-employees.json` - Primary employee data
- `/data/uploads/*.csv` - Uploaded data sources
- `/data/metadata/*.json` - Data source metadata
- `/webapp/.google-oauth-token.json` - Google OAuth credentials (gitignored)

**Backup Strategy:**
- Daily automated backups recommended
- Store backups outside repo (S3, Google Drive, etc.)
- Retain 30 days of history

### API Rate Limits

**Claude API:**
- 50 requests/min (default tier)
- Use prompt caching to reduce token usage
- Monitor usage: https://console.anthropic.com/

**Internal Rate Limits:**
- Auth: 10 req/min per IP
- Chat: 30 req/min per user
- Data Upload: 20 req/min per user
- Standard: 100 req/min per user

---

## 🔄 Development Workflow

### Starting Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.development .env.local
# Edit .env.local with your API keys

# 3. Start dev server
npm run dev

# 4. Access app
open http://localhost:3000
```

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Run tests
npm run validate  # type-check + lint + test

# 4. Commit changes
git add .
git commit -m "feat: Add my feature"

# 5. Push and create PR
git push origin feature/my-feature
```

### Code Review Checklist

- [ ] TypeScript types complete (no any)
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] RBAC checks added (if protected endpoint)
- [ ] Rate limiting applied (if public endpoint)
- [ ] Accessibility verified (if UI change)
- [ ] Performance impact considered
- [ ] Security implications reviewed

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript check
npm run format           # Format with Prettier
npm run validate         # All checks (type + lint + test)

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:a11y        # Accessibility tests
npm run test:all         # All tests (a11y + e2e)

# Python Agents
npm run agent:onboarding # Run onboarding agent
npm run agent:metrics    # Run metrics agent

# Utilities
npm run clean            # Clean build artifacts
npm run build:analyze    # Bundle size analysis
```

---

## 🆘 Getting Help

**Documentation:**
- Browse `/docs/` directory
- Check `DOCUMENTATION_SUMMARY.md` for full index
- Read `docs/api/API_REFERENCE.md` for API details

**Debugging:**
- Check browser console for client errors
- Check server logs for API errors
- Use `errorLogging.ts` for structured logging
- Review `/docs/guides/OPERATIONS.md` for monitoring

**Code Examples:**
- `/webapp/components/` - Component patterns
- `/webapp/app/api/` - API route examples
- `/__tests__/` - Test examples
- `/skills/` - Skill definition examples

**External Resources:**
- Next.js Docs: https://nextjs.org/docs
- Anthropic Docs: https://docs.anthropic.com/
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/docs

---

## 📝 Notes for Future Claude Instances

### When Adding Features

1. **Check existing patterns first** - Review similar features before implementing
2. **Update types** - Add TypeScript types in `/lib/types/`
3. **Add tests** - Unit + E2E coverage required
4. **Update docs** - Keep API_REFERENCE.md and this file current
5. **Consider performance** - Large contexts? Add prompt caching
6. **Think RBAC** - What permissions does this feature need?
7. **Accessibility** - Test with keyboard nav and screen readers

### When Debugging

1. **Check auth first** - Most API issues are auth/RBAC related
2. **Verify data files** - Ensure master-employees.json is valid
3. **Review recent changes** - Check git history for context
4. **Test in isolation** - Simplify to find root cause
5. **Check environment** - Verify all required env vars set
6. **Monitor metrics** - Use performance-monitor.ts to track

### When Refactoring

1. **Run tests constantly** - `npm run test:watch` during refactor
2. **Small commits** - Incremental changes easier to debug
3. **Update docs inline** - Don't leave for later
4. **Check dependencies** - Update types/imports across codebase
5. **Performance baseline** - Measure before/after
6. **Accessibility regression** - Re-run a11y tests

### Architecture Principles

1. **Modularity** - Small, composable pieces
2. **Type Safety** - TypeScript + Zod validation everywhere
3. **Performance** - Optimize AI costs, virtualize large lists
4. **Security** - Auth on all endpoints, validate all inputs
5. **Accessibility** - WCAG 2.1 AA compliance mandatory
6. **Testability** - Write testable code, mock external APIs
7. **Documentation** - Code should be self-documenting, comments for "why" not "what"

---

**This file is maintained by the development team. Last comprehensive update: 2025-11-07**

For questions or suggestions, please update this file or create an issue in the repository.
