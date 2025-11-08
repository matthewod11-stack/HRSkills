# HR Command Center - Cursor Context File

> **Purpose:** This document equips Cursor coding agents with the same high-context overview given to Claude so you can work confidently inside this repo without guesswork.

**Last Updated:** 2025-11-08  
**Platform Version:** 0.1.0  
**Status:** Production-ready with 27 HR Skills

---

## 🎯 What This Platform Is

HR Command Center is a **comprehensive HR automation platform** that combines:

1. **Next.js Web Application** – Dashboard with chat, analytics, employee management
2. **27 AI Skills** – Domain-specific HR capabilities (job descriptions, performance reviews, onboarding, etc.)
3. **Python Automation Agents** – Scheduled scripts for data sync and workflow automation
4. **Multi-System Integration** – Rippling, Notion, Google Workspace, Slack, Calendly

**Core Value Proposition:** Automate 80% of repetitive HR tasks while maintaining quality, compliance, and consistency.

---

## 📊 Platform Statistics

- **27 AI Skills** – Production-ready HR domain knowledge
- **23 API Endpoints** – RESTful API with JWT auth + RBAC
- **17 Custom React Components** – shadcn/ui + custom HR components
- **40+ shadcn/ui Components** – Full component library
- **5 User Roles** – super_admin, hr_admin, hr_manager, hr_analyst, employee
- **88% AI Cost Reduction** – Prompt caching, response caching, dynamic token limits
- **100% TypeScript** – Type-safe codebase with Zod validation
- **WCAG 2.1 AA Compliant** – Accessibility tested with jest-axe + Playwright

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend**
- Next.js 14 (App Router) + React 18 + TypeScript 5.3
- Tailwind CSS 3.4 + shadcn/ui components
- Zustand (state management) + React Hook Form + Zod
- Framer Motion (animations) + Chart.js (visualizations)

**Backend**
- Next.js API Routes (serverless)
- JWT Authentication with RBAC
- Anthropic Claude 3.5 Sonnet API (anthropic SDK 0.68.0) handled server-side
- Rate limiting + response caching + circuit breakers

**Data Layer**
- JSON file storage (`/data/master-employees.json`)
- Google Sheets integration for exports
- Google Drive for template management
- In-memory caching (5 min TTL, 100 entry max)

**Testing**
- Jest + React Testing Library (unit/integration)
- Playwright (E2E + accessibility)
- jest-axe (WCAG 2.1 AA compliance)

### Directory Structure

```
/HRSkills/
├── webapp/                          # Next.js application (main codebase)
│   ├── app/                         # App Router pages & API routes
│   │   ├── api/                     # 23 API endpoints
│   │   │   ├── chat/                # AI chat with skill routing
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
├── skills/                          # 27 AI skills (SKILL.md files)
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

**Role Types**

```typescript
super_admin   // Full access to everything
hr_admin      // All HR operations, limited settings
hr_manager    // Employee management, basic analytics
hr_analyst    // Read-only analytics & reports
employee      // Chat-only access
```

**Resources**
- `employees` – Employee CRUD operations
- `analytics` – Dashboard access & exports
- `chat` – AI chat interface
- `data_upload` – CSV data import
- `settings` – System configuration
- `audit` – Audit log access

**Middleware Usage**
```typescript
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
5. **Claude API Call** → Server invokes Anthropic API; Cursor never calls it directly  
6. **Response Caching** → Cache responses for 5 min (saves $1,350/month)  
7. **Return to User** → Streaming or complete response

### Skill Routing Logic

**Detection implementation:** `webapp/app/api/chat/route.ts:60-150`

```typescript
function detectSkill(message: string): string {
  const messageLower = message.toLowerCase()

  if (/job description|jd|posting/.test(messageLower)) {
    return 'job-description-writer'
  }
  if (/onboarding|new hire|first day/.test(messageLower)) {
    return 'onboarding-program-builder'
  }
  // ... 25 more patterns

  return '' // No skill matched, fall back to general chat
}
```

### Skill Structure

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

**SKILL.md Format**
```markdown
---
name: job-description-writer
description: Creates compelling job descriptions optimized for hiring
---

# Instructions for AI Skill

You are an expert HR recruiter...
```

### AI Cost Optimization

**Key Strategies (88% cost reduction)**

1. **Response Caching** – 5 min TTL, 100 entry max. Cache key `${message}-${skillId}-${dataHash}`  
2. **Prompt Caching** – Cache skill prompts & employee data; use `cache_control: { type: "ephemeral" }` for large contexts  
3. **Dynamic `max_tokens`** – Short answers 512, analysis 2048, long-form 4096

Implementation lives in `webapp/app/api/chat/route.ts`.

---

## 📊 Data Model

### Master Employee Schema

**File:** `data/master-employees.json`

```typescript
interface Employee {
  employee_id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  department: string
  job_title: string
  level: string
  manager_id: string | null
  hire_date: string
  termination_date: string | null
  status: 'active' | 'terminated'
  location: string
  employee_type: 'Full-time' | 'Part-time' | 'Contractor'
  gender?: string
  race_ethnicity?: string
  data_source: string
  data_sources: string[]
  created_at: string
  updated_at: string
  enps_score?: number
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

**Key Files**
- `webapp/lib/types/master-employee.ts` – TypeScript schema  
- `webapp/lib/analytics/utils.ts` – Data loading utilities  
- `webapp/app/api/data/import/route.ts` – Import logic

---

## 🔧 Key Implementation Patterns

### Error Handling

```typescript
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'

try {
  const result = await someOperation()
  return createSuccessResponse(result)
} catch (error) {
  return handleApiError(error, 'Operation failed')
}
```

Types & helpers: `webapp/lib/api-helpers/error-handler.ts`.

### Rate Limiting

```typescript
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'

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

Presets: `STANDARD` (100/min), `CHAT` (30/min), `AUTH` (10/min), `UPLOAD` (20/min).

### State Management (Zustand)

```typescript
import { useEmployeeStore } from '@/lib/stores/employee-store'

const { employees, loadEmployees, isLoading } = useEmployeeStore()
await loadEmployees()
const activeEmployees = employees.filter(e => e.status === 'active')
```

Primary store: `webapp/lib/stores/employee-store.ts`.

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

Located in `webapp/components/`.

1. **ChatInterface** – Main chat UI with skill detection indicator  
2. **EmployeeTable** – Virtualized table supporting 1000+ rows  
3. **AnalyticsDashboard** – Multi-chart dashboard with drill-down  
4. **DataSourcesManager** – CSV upload with preview & validation  
5. **MetricCard** – Animated metric displays with popups  
6. **SkillBadge** – Visual skill indicators in chat  
7. **ErrorBoundary** – Graceful error handling

Usage examples mirror the Claude doc; import patterns via `@/components/...`.

### shadcn/ui Components

- 40+ primitives in `webapp/components/ui/`  
- Import pattern:
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

Documentation: `webapp/docs/components/UI_COMPONENTS.md`.

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

Run `npm test`.

```typescript
import { useEmployeeStore } from '@/lib/stores/employee-store'

describe('Employee Store', () => {
  it('loads employees', async () => {
    const store = useEmployeeStore.getState()
    await store.loadEmployees()
    expect(store.employees.length).toBeGreaterThan(0)
  })
})
```

### E2E Tests (Playwright)

Run `npm run test:e2e`.

```typescript
test('chat flow', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.fill('[data-testid="chat-input"]', 'Show me engineering headcount')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('.chat-message')).toBeVisible()
})
```

### Accessibility Tests

Run `npm run test:a11y`.

```typescript
import { axe } from 'jest-axe'

test('no accessibility violations', async () => {
  const { container } = render(<ChatInterface />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 🚀 Common Development Tasks (Cursor Tips Included)

### Adding a New Skill

1. Create `skills/my-new-skill/` (use `mkdir -p` via `run_terminal_cmd` if needed).  
2. Write `SKILL.md` following the existing template.  
3. Add detection keywords in `webapp/app/api/chat/route.ts`.  
4. Test via `npm run dev`; use Cursor's integrated terminal if available.

### Adding a New API Endpoint

1. Create `webapp/app/api/my-endpoint/route.ts`.  
2. Use the `requireAuth` + `hasPermission` pattern; import helpers from `@/lib/api-helpers`.  
3. Document in `docs/api/API_REFERENCE.md`.  
4. Add Jest tests under `webapp/__tests__/api/`.

### Modifying Employee Data Schema

1. Update `webapp/lib/types/master-employee.ts`.  
2. Adjust CSV import logic in `webapp/app/api/data/import/route.ts`.  
3. Update UI components displaying the field.  
4. Refresh docs (`cursor.md`, API reference, data model notes).

---

## 🛠️ Cursor-Specific Practices

- Prefer repository tools over shell equivalents (`read_file`, `apply_patch`, `todo_write`, etc.).  
- Respect existing git changes; never revert unless requested.  
- Follow editing constraints (ASCII only unless file already uses Unicode).  
- For reviews, lead with findings before summaries.  
- Reference files and symbols with backticks (`file.ts`, `myFunction`).  
- Summaries should be concise; no raw large diffs in responses.  
- Use plan/todo flow when tasks are multi-step.  
- Invoke `read_lints` after significant edits if linting is available.

---

## 🔄 Development Workflow

### Starting Development

```bash
npm install
cp .env.development .env.local
npm run dev
open http://localhost:3000
```

### Making Changes

```bash
git checkout -b feature/my-feature
# edit files with Cursor workflows
npm run validate
git add .
git commit -m "feat: Add my feature"
git push origin feature/my-feature
```

### Code Review Checklist
- TypeScript types complete (no `any`)  
- Tests added/updated  
- Documentation updated  
- Error handling via `handleApiError`  
- RBAC checks for protected endpoints  
- Rate limiting applied for public endpoints  
- Accessibility verified for UI work  
- Performance impact considered  
- Security implications reviewed

---

## 📚 Key Documentation Files

1. `README.md` – Project overview & quick start  
2. `DOCUMENTATION_SUMMARY.md` – Docs index  
3. `docs/api/API_REFERENCE.md` – Complete API docs  
4. `docs/components/COMPONENT_LIBRARY.md` – Component usage  
5. `docs/guides/TESTING_GUIDE.md` – Testing strategy  
6. `docs/architecture/ARCHITECTURE_DECISIONS.md` – Technical decisions  
7. `docs/claude-hr-capabilities-master.md` – AI skill catalogue

---

## 🔍 Debugging & Troubleshooting

- **Skill not detected:** Check keyword patterns and SKILL.md names.  
- **Rate limit exceeded:** Review presets in `webapp/lib/security/rate-limiter.ts`.  
- **Authentication failed:** Verify JWT expiry, `JWT_SECRET`, or use demo token.  
- **Employee data not loading:** Validate `data/master-employees.json`; ensure parsable JSON.  
- **Claude API errors:** Confirm `ANTHROPIC_API_KEY`, review prompt caching headers, inspect server logs.

Logging helpers in `webapp/lib/errorLogging.ts`; metrics via `webapp/lib/performance-monitor.ts`.

---

## 🚨 Critical Information

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...           
JWT_SECRET=your-secret-key             
NEXT_PUBLIC_API_URL=http://localhost:3000  
GOOGLE_CLIENT_ID=...                   
GOOGLE_CLIENT_SECRET=...               
GOOGLE_DRIVE_FOLDER_ID=...            
NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=true
```

### Data Backup

- `data/master-employees.json` – Primary dataset  
- `data/uploads/*.csv` – Uploaded data sources  
- `data/metadata/*.json` – Metadata  
- `webapp/.google-oauth-token.json` – Google OAuth credentials (gitignored)  
- Store backups off-repo (S3, Google Drive) with 30-day retention.

### API Rate Limits

- Claude API: 50 requests/min (default tier) – leverage caching  
- Internal: Auth 10/min, Chat 30/min, Data Upload 20/min, Standard 100/min

---

## 📝 Notes for Cursor Agents

### When Adding Features

1. Inspect existing patterns before coding.  
2. Update types in `webapp/lib/types/`.  
3. Add unit + E2E tests.  
4. Update relevant docs (include this file when context changes).  
5. Consider performance & prompt caching.  
6. Enforce RBAC where applicable.  
7. Validate accessibility (keyboard, contrast, ARIA).

### When Debugging

1. Verify authentication first.  
2. Confirm data files are present and valid JSON.  
3. Review recent git history.  
4. Reproduce in isolation.  
5. Check environment variables.  
6. Monitor metrics/perf data.

### When Refactoring

1. Run tests frequently (`npm run test:watch`).  
2. Commit incrementally.  
3. Update docs alongside code.  
4. Adjust imports/types across the codebase.  
5. Track performance baselines pre/post change.  
6. Re-run accessibility checks.

### Architecture Principles

1. Modularity – small, composable pieces  
2. Type Safety – TypeScript + Zod  
3. Performance – optimize AI costs and UI rendering  
4. Security – auth on every endpoint, validate inputs  
5. Accessibility – WCAG 2.1 AA compliance  
6. Testability – mock external APIs, keep logic pure  
7. Documentation – explain “why”, not just “what”

---

**Maintainers:** HR Command Center development team  
**Last comprehensive review:** 2025-11-08


