# Phase 2: HR Command Center Simplification Plan

> **Mission:** Transform from a feature-rich platform into an insanely great AI coworker that takes action

**Last Updated:** 2025-11-08 (Revised with resilience + focus feedback)
**Status:** Planning
**Expected Timeline:** 12-16 weeks (buffered for validation + rollout)
**Goal:** Action-first HR copilot with ruthless simplicity, 1 runtime, resilient AI stack

---

## 📊 Current State vs Target State

| Metric | Current (Phase 1) | Target (Phase 2) |
|--------|------------------|------------------|
| Skills | 27 separate skills | 8 consolidated workflows |
| Components | 54 shadcn + 83 custom | 15 essential components |
| API Endpoints | 42 endpoints | 12 unified endpoints |
| Data Storage | JSON files + uploads + metadata | Single SQLite database |
| Setup Time | 30+ minutes (6 API keys) | 60 seconds (zero config) |
| User Roles | 5 roles, 6 resources | 2 roles (Admin, User) |
| External APIs | 6 Google AI services | Claude-first + optional fallback provider + Google Workspace (Drive/Docs/Sheets required) |
| LOC (TypeScript) | ~50,000 lines | ~15,000 lines |
| First Value | After configuration | Immediate (demo data) |

---

## 🎯 Core Philosophy Changes

### From: Feature Platform → To: AI Coworker

**Old Mindset:**
- "We offer 27 HR capabilities"
- "Configure integrations, then use features"
- "Users navigate to different sections for different tasks"

**New Mindset:**
- "We're your AI HR assistant that takes action"
- "Works immediately, configure later if you want more"
- "One conversation handles everything"

### From: Answers → To: Actions

**Old Pattern:**
```
User: "Show me engineering headcount"
App:  "You have 47 engineers"
```

**New Pattern:**
```
User: "Show me engineering headcount"
App:  "You have 47 engineers, down 3 from last quarter.

       I found these issues:
       • 2 senior engineers are flight risks
       • You have 3 open reqs unfilled for 60+ days
       • Average time-to-hire increased 40%

       Want me to:
       [Draft job descriptions] [Create retention plan] [Analyze bottlenecks]"
```

---

## 🧭 Guiding Principles

These questions shape every deliverable in Phase 2 and keep scope honest:

1. **How can we make this simpler?** Default to one path, one runtime, one obvious CTA.
2. **What would this look like if we started from zero?** Anchor on a single chat surface plus a lightweight employee hub.
3. **What’s the one thing this must do perfectly?** Provide trustworthy, actionable HR guidance and execute the next step without extra tooling.
4. **How would we design this for someone who’s never seen it before?** Demo data on first load, progressive disclosure for everything else.
5. **What’s the most elegant solution?** Explicit workflow state, declarative actions, generated docs over bespoke screens.
6. **Where are we adding complexity users don’t value?** Kill features that only serve edge cases (< 500 employees) or vanity integrations.
7. **What would it feel like if it just worked magically?** Conversational insights + suggested follow-ups that run end-to-end.
8. **How do we make this insanely great instead of just good?** Go proactive: surface risks, not just dashboards.
9. **What are we including because we can, not because we should?** Anything requiring new API keys without measurable lift.
10. **How can we make the complex appear simple?** Hide orchestration behind chat summaries and receipts.
11. **What would we build for ourselves?** Deterministic seed scripts, typed schemas, fast local dev.
12. **Where are we compromising that we shouldn’t?** Don’t trade redundancy or data quality for arbitrary deadlines.
13. **How do we make this feel inevitable, not complicated?** Tell one story (“your AI HR coworker takes action”) and let every feature reinforce it.

---

## 🗺️ Implementation Roadmap

The roadmap shifts from “two-week sprints stuffed with features” to buffered phases. Each phase ends with a validation gate (playable demo + resilience sign-off) before the next begins.

### **Weeks 1-4: Foundation & Workflow Baseline**

#### Task 1.1: SQLite Database Setup
**Priority:** Critical
**Effort:** 3 days

**Action Items:**
- [ ] Create schema design for unified database
- [ ] Build migration script from JSON → SQLite
- [ ] Implement Drizzle ORM for type-safe queries
- [ ] Add connection pooling and transaction support
- [ ] Seed database with demo data (100 realistic employees)

**Schema Design:**
```sql
-- Core tables only (no over-engineering)
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  manager_id TEXT REFERENCES employees(id),
  location TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time','part_time','contract')),
  hire_date DATETIME NOT NULL,
  termination_date DATETIME,
  status TEXT CHECK(status IN ('active', 'terminated', 'leave')),
  compensation_currency TEXT DEFAULT 'USD',
  compensation_base REAL,
  attributes TEXT CHECK(json_valid(attributes)), -- JSON blob for optional fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_metrics (
  employee_id TEXT NOT NULL REFERENCES employees(id),
  metric_date DATE NOT NULL,
  flight_risk REAL,
  performance REAL,
  engagement REAL,
  PRIMARY KEY (employee_id, metric_date)
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  messages_json TEXT NOT NULL CHECK(json_valid(messages_json)),
  workflow_state_json TEXT CHECK(json_valid(workflow_state_json)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE actions (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  action_type TEXT NOT NULL, -- 'email_sent', 'document_created', 'slack_message', etc.
  status TEXT CHECK(status IN ('pending', 'completed', 'failed')),
  payload_json TEXT CHECK(json_valid(payload_json)),
  result_json TEXT CHECK(json_valid(result_json)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'offer_letter', 'pip', 'job_description', etc.
  employee_id TEXT REFERENCES employees(id),
  content TEXT NOT NULL,
  metadata_json TEXT CHECK(json_valid(metadata_json)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences_json TEXT CHECK(json_valid(preferences_json)),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_snapshots (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES conversations(id),
  step TEXT NOT NULL,
  state_json TEXT NOT NULL CHECK(json_valid(state_json)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insight_events (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  insight_type TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  status TEXT CHECK(status IN ('open','acknowledged','dismissed')) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Success Criteria:**
- ✅ All existing JSON data migrated without loss
- ✅ Query performance < 50ms for typical operations (indexed metrics tables)
- ✅ Demo data + demo insights load automatically on first run
- ✅ Backward compatibility maintained during transition with one-click re-runs
- ✅ Analytics (flight risk, engagement, retention) can be reproduced from normalized tables

---

#### Task 1.2: Remove Python Agents
**Priority:** High
**Effort:** 2 days

**Action Items:**
- [ ] Convert `agents/new-hire-onboarding/agent.py` → queue-driven Node worker (BullMQ / Temporal-lite)
- [ ] Convert `agents/hr-metrics-dashboard/agent.py` → queue-driven worker with resumable jobs
- [ ] Add `/api/cron/onboarding` + `/api/cron/metrics-sync` endpoints that enqueue jobs (not run work inline)
- [ ] Stand up worker container/service with retries, DLQ, and structured logging
- [ ] Remove Python dependencies from requirements.txt + Docker images
- [ ] Document how to rotate secrets + replay jobs before decommissioning Python stack

**Implementation Example:**
```typescript
// app/api/cron/onboarding/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Run onboarding automation
  const newHires = await getNewHiresStartingThisWeek()

  for (const hire of newHires) {
    await Promise.all([
      sendWelcomeEmail(hire),
      createSlackAccount(hire),
      scheduleOneOnOnes(hire),
      orderEquipment(hire)
    ])
  }

  return Response.json({ processed: newHires.length })
}
```

**Success Criteria:**
- ✅ Zero Python code remaining
- ✅ Automations run in durable workers with retries + DLQ
- ✅ Cron endpoints strictly enqueue work (idempotent)
- ✅ Easier deployment (single runtime) without regressing reliability or observability

---

#### Task 1.3: AI Provider Resilience & Abstraction
**Priority:** Critical  
**Effort:** 4 days

**Action Items:**
- [ ] Create `AIProvider` interface with Claude as primary + Gemini/GPT (or open-source) fallback
- [ ] Build routing + health checks (latency, quota, error codes) and expose via `/lib/ai/provider.ts`
- [ ] Store model + prompt metadata per action for auditability
- [ ] Add config toggles so self-hosted users can plug in their provider of choice
- [ ] Write chaos tests that simulate Claude outages + quota exhaustion

**Success Criteria:**
- ✅ Default experience uses Claude 3.5 Sonnet but can fail over within 30 seconds
- ✅ No workflow hard-codes provider-specific prompt formats
- ✅ Cost + usage dashboards show per-provider burn
- ✅ Legal/compliance reviewed before removing Google AI dependencies

---

#### Task 1.4: Google Workspace Core Integrations
**Priority:** High  
**Effort:** 3 days

**Why:** Even after deprecating Google AI services, we *must* keep Google Drive / Docs / Sheets for document workflows, approvals, and shared editing.

**Action Items:**
- [ ] Audit existing Drive/Docs/Sheets usage across workflows and note API scopes
- [ ] Move Google OAuth + service-account config into a single `integrations/google-workspace.ts`
- [ ] Build contract tests that cover: create doc from template, export to Drive folder, update Sheet range, share with user
- [ ] Ensure doc-based workflows fall back to in-app editor but sync final assets to Google Docs
- [ ] Document minimum Google Cloud project setup (only Drive/Docs/Sheets) for Phase 2

**Success Criteria:**
- ✅ All doc actions round-trip through Google Docs (creation, updates, sharing)
- ✅ Sheets sync supports analytics source-of-truth (comp bands, hiring plans)
- ✅ OAuth scopes trimmed to Drive/Docs/Sheets only
- ✅ Setup guide clearly states Google Workspace requirement (no ambiguity)

---

### **Weeks 5-8: Workflow Consolidation**

Spend four weeks ruthlessly collapsing 27 skills into the 8 workflows customers actually touch (Hiring, Retention, Performance, Comp Adjustments, Compliance, Offboarding, Pulse Surveys, Exec Briefings). Every other “skill” either becomes a step inside those workflows or gets deleted.

#### Task 2.1: Consolidate 27 Skills → 8 Workflows
**Priority:** Critical
**Effort:** 5 days

**New Workflow Structure:**

```
OLD (27 skills)                    NEW (8 workflows)
├── job-description-writer
├── interview-guide-creator
├── offer-letter-generator        ──┐
├── candidate-scorecard           ──┤
└── screening-questions           ──┴──> 1. HIRING
                                         (job descriptions, interviews,
                                          offers, candidate evaluation)

├── performance-insights-analyst
├── pip-generator
├── performance-review-cycle      ──┐
├── feedback-synthesizer          ──┤
└── 360-review-coordinator        ──┴──> 2. PERFORMANCE
                                         (reviews, feedback, PIPs,
                                          coaching, development)

├── onboarding-program-builder
├── first-day-coordinator         ──┐
├── 30-60-90-planner             ──┤
└── buddy-program-matcher         ──┴──> 3. ONBOARDING
                                         (new hire setup, schedules,
                                          documentation, integration)

├── offboarding-exit-builder
├── exit-interview-analyzer       ──┐
├── knowledge-transfer-planner    ──┤
└── departure-comms               ──┴──> 4. OFFBOARDING
                                         (exits, transitions,
                                          knowledge capture, comms)

├── hr-metrics-analyst
├── turnover-insights             ──┐
├── diversity-reporter            ──┤
├── headcount-planner             ──┴──> 5. ANALYTICS
└── survey-analyzer                    (metrics, trends, insights,
                                        forecasting, reporting)

├── comp-band-designer
├── equity-grant-advisor          ──┐
├── salary-benchmarking           ──┤
└── pay-equity-analyzer           ──┴──> 6. COMPENSATION
                                         (salary bands, equity,
                                          benchmarking, pay equity)

├── er-case-manager
├── investigation-coordinator     ──┐
├── accommodation-planner         ──┤
└── policy-interpreter            ──┴──> 7. EMPLOYEE_RELATIONS
                                         (cases, investigations,
                                          accommodations, policies)

├── compliance-tracker
├── i9-coordinator                ──┐
├── benefit-enrollment            ──┤
└── document-organizer            ──┴──> 8. COMPLIANCE
                                         (I-9, benefits, docs,
                                          regulatory requirements)
```

**Implementation:**
```typescript
// lib/workflows/workflows.config.ts
export const workflows = {
  HIRING: {
    id: 'hiring',
    name: 'Hiring & Recruitment',
    description: 'End-to-end hiring workflows',

    triggers: [
      /hiring|recruit|job description|jd|interview|candidate|offer letter/i,
      /posting|applicant|screening|scorecard/i
    ],

    capabilities: [
      'job_descriptions',
      'interview_guides',
      'offer_letters',
      'candidate_scorecards',
      'screening_questions'
    ],

    systemPrompt: `You are an expert HR recruiting partner. You help with:
    - Crafting compelling job descriptions
    - Creating structured interview guides
    - Generating offer letters
    - Evaluating candidates objectively
    - Streamlining the hiring process

    When a user asks about hiring, be proactive:
    1. Understand their need
    2. Suggest related tasks they might need
    3. Offer to complete entire workflows, not just single documents

    Example: If they ask for a job description, also offer to create
    the interview guide and offer letter template.`,

    actions: {
      draft_job_description: async (data) => { /* ... */ },
      create_interview_guide: async (data) => { /* ... */ },
      generate_offer_letter: async (data) => { /* ... */ },
      create_slack_channel: async (data) => { /* ... */ },
      schedule_interviews: async (data) => { /* ... */ }
    }
  },

  PERFORMANCE: {
    id: 'performance',
    name: 'Performance Management',
    triggers: [
      /performance|review|feedback|pip|coaching|development/i,
      /360|evaluation|rating|goal/i
    ],
    capabilities: [
      'performance_reviews',
      'feedback_synthesis',
      'pip_creation',
      'coaching_plans',
      'development_plans'
    ],
    systemPrompt: `You are an expert performance management partner...`,
    actions: { /* ... */ }
  },

  // ... 6 more workflows
}
```

**Migration Strategy:**
- [ ] Create new `lib/workflows/` directory
- [ ] Build workflow detection engine (replaces skill detection)
- [ ] Create unified workflow executor
- [ ] Move SKILL.md content into workflow configs
- [ ] Add workflow state tracking (multi-step conversations)
- [ ] Archive old `skills/` directory (keep for reference)

**Success Criteria:**
- ✅ All 27 skill capabilities preserved in 8 workflows
- ✅ Workflow detection accuracy ≥ 95%
- ✅ Users can complete multi-step tasks in one conversation
- ✅ Code reduced by ~60%

---

#### Task 2.2: Implement Workflow State Machine
**Priority:** High
**Effort:** 3 days

**Purpose:** Enable multi-step workflows where Claude remembers context and guides users through complex processes.

**Example Workflow State:**
```typescript
// User: "We're hiring a senior engineer"

// Step 1: Gather requirements
{
  workflow: 'HIRING',
  step: 'gather_requirements',
  state: {
    role: 'Senior Engineer',
    status: 'in_progress'
  },
  nextActions: ['confirm_details', 'draft_jd']
}

// Step 2: Draft documents
{
  workflow: 'HIRING',
  step: 'draft_documents',
  state: {
    role: 'Senior Engineer',
    job_description: { id: 'doc_123', status: 'drafted' },
    interview_guide: { id: 'doc_124', status: 'drafted' },
    offer_template: { id: 'doc_125', status: 'drafted' }
  },
  nextActions: ['review_docs', 'post_job', 'schedule_interviews']
}

// Step 3: Take actions
{
  workflow: 'HIRING',
  step: 'execute_actions',
  state: {
    posted_to_linkedin: true,
    slack_channel_created: 'hiring-senior-eng',
    interviews_scheduled: 5
  },
  nextActions: ['track_candidates', 'close_workflow']
}
```

**Implementation:**
```typescript
// lib/workflows/state-machine.ts
export class WorkflowStateMachine {
  async executeStep(conversationId: string, userMessage: string) {
    const conversation = await db.conversations.findById(conversationId)
    const currentState = conversation.workflow_state_json

    // Determine next step based on current state + user input
    const nextStep = await this.determineNextStep(currentState, userMessage)

    // Execute actions for this step
    const results = await this.executeActions(nextStep)

    // Update state
    const newState = await this.updateState(currentState, nextStep, results)

    // Save to DB
    await db.conversations.update(conversationId, {
      workflow_state_json: newState
    })

    return {
      response: this.generateResponse(newState, results),
      suggestedActions: this.getSuggestedActions(newState)
    }
  }
}
```

**Success Criteria:**
- ✅ Workflows maintain context across multiple messages
- ✅ Users can pause and resume workflows
- ✅ System suggests logical next steps
- ✅ Failed actions can be retried

---

### **Weeks 9-10: Zero-Config First Run**

Goal: ship a no-config experience that feels magical. Treat this as a product release inside the project—dogfood with the core team before tackling component work.

#### Task 3.1: Zero-Config First Run Experience
**Priority:** Critical
**Effort:** 4 days

**Implementation:**

**1. Anthropic Key Pre-Configuration (Real Responses)**
```typescript
// lib/ai/server-provider.ts
export const serverAnthropicClient = anthropicSdk.createClient({
  apiKey: process.env.ANTHROPIC_MANAGED_KEY!, // project-level key
  label: 'shared-zero-config',
  maxRequestsPerDay: 100
})

export function getAnthropicClient(user?: User) {
  if (user?.anthropic_api_key) {
    return anthropicSdk.createClient({ apiKey: user.anthropic_api_key })
  }
  return serverAnthropicClient
}
```

- Store the managed key in server env only, never exposed to client.
- Enforce daily usage quota + rate limiting to protect spend.
- Surface banner (“Powered by shared Anthropic key • add your own for unlimited usage”).
- Rotate key via secrets manager and alert when 80% of quota used.

**2. Precomputed Analytics Reality**
```ts
// scripts/seed-demo-analytics.ts
await db.employee_metrics.insertMany(generateMetrics(demoEmployees))
await db.insight_events.insertMany(generateInsightsFromMetrics())
await pushMetricsToSheets(demoEmployees)
```
- Populate `employee_metrics` + `insight_events` so analytics answers are grounded in data.
- Sync the same dataset to a demo Google Sheet; analytics panel pulls from DB but export button writes to sheet.
- Add integration tests ensuring `/api/analytics/headcount` returns non-empty, realistic values out of the box.

**3. Demo Data Auto-Loading:**
```typescript
// app/api/setup/init/route.ts
export async function GET() {
  const db = getDatabase()

  // Check if this is first run
  const employeeCount = await db.employees.count()

  if (employeeCount === 0) {
    // Load 100 realistic demo employees
    await seedDemoData()

    // Create demo admin user
    await createDemoUser({
      email: 'demo@hrcommand.center',
      name: 'Demo User',
      role: 'admin'
    })

    // Pre-populate with sample conversations
    await seedDemoConversations()
  }

  return Response.json({ initialized: true })
}
```

**4. Welcome Experience:**
```typescript
// app/page.tsx - First load
export default function ChatPage() {
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem('has_visited')
    if (!hasVisited) {
      setIsFirstVisit(true)
      localStorage.setItem('has_visited', 'true')
    }
  }, [])

  return (
    <div>
      {isFirstVisit && (
        <WelcomeDialog>
          <h2>Welcome to HR Command Center!</h2>
          <p>You're using demo data (100 employees). Try asking:</p>
          <SuggestionChips>
            <Chip onClick={sendMessage}>Show engineering headcount</Chip>
            <Chip onClick={sendMessage}>Who are my flight risks?</Chip>
            <Chip onClick={sendMessage}>Create a job description</Chip>
          </SuggestionChips>
          <p className="text-sm">You can upload your own data anytime.</p>
        </WelcomeDialog>
      )}

      <ChatInterface />
    </div>
  )
}
```

**5. Progressive Disclosure Settings:**
```typescript
// app/settings/page.tsx
export default function Settings() {
  return (
    <div>
      <Section title="Data">
        <Card>
          <p>Currently using demo data (100 employees)</p>
          <Button>Upload my employee CSV</Button>
        </Card>
      </Section>

      {/* Only show after they upload data */}
      {hasUploadedData && (
        <Section title="AI Configuration">
          <Card>
            <p>Using shared Claude API (100 messages/day limit)</p>
            <Button>Add my Anthropic API key for unlimited</Button>
          </Card>
        </Section>
      )}

      {/* Only show after they add API key */}
      {hasApiKey && (
        <Section title="Integrations">
          <IntegrationCards>
            <IntegrationCard name="Rippling" />
            <IntegrationCard name="Google Workspace" />
            <IntegrationCard name="Slack" />
          </IntegrationCards>
        </Section>
      )}
    </div>
  )
}
```

**Success Criteria:**
- ✅ New user sees working chat in < 10 seconds
- ✅ No personal API key required for first 100 real Anthropic messages
- ✅ Analytics answers backed by real seeded metrics + Google Sheet export
- ✅ Demo data (existing mock DB + downloadable CSVs) is realistic and useful for drag-and-drop demos
- ✅ Settings reveal progressively, not all at once

---

#### Task 3.2: Unified Command Center Dashboard
**Priority:** Critical
**Effort:** 5 days

**Goal:** Centralize the entire experience into one dashboard where chat is always visible and the right pane adapts (document editor, analytics canvas, or 9-box performance grid) based on intent. Keep the current Settings + Data Input pages intact, just expose them via quick-access icons (next to Settings) and remove the three hero metric tiles so the chat takes center stage.

**Layout:**
```tsx
// app/(dashboard)/page.tsx
<main className="grid grid-cols-[2fr_1fr] gap-6 h-[calc(100vh-80px)]">
  <section className="col-span-1 flex flex-col border rounded-xl">
    <ChatHeader />
    <ChatHistory />
    <Composer />
  </section>

  <aside className="col-span-1 flex flex-col border rounded-xl overflow-hidden">
    <ContextSwitcher state={contextState} />
    {contextState.type === 'doc' && <DocEditor docId={contextState.docId} />}
    {contextState.type === 'analytics' && <InsightPanel insight={contextState.insight} />}
    {contextState.type === 'performance_grid' && <NineBoxGrid compact={true} interactive={true} />}
    {contextState.type === 'empty' && <HelperPanel />}
  </aside>
</main>
```

**Enhanced Detection Logic:**
```ts
function deriveContext(message: string, workflow: Workflow | null) {
  // Document creation contexts
  if (workflow === 'HIRING' && /doc|offer|policy|plan|letter/i.test(message)) {
    return { type: 'doc', docTemplate: pickTemplate(message) }
  }

  // Performance/talent review contexts
  if (/9[-\s]?box|performance grid|talent matrix|succession/i.test(message)) {
    return { type: 'performance_grid', filters: detectFilters(message) }
  }

  if (/top performers|high potential|flight risk|talent review/i.test(message)) {
    return {
      type: 'performance_grid',
      filters: detectFilters(message),
      highlight: detectCategory(message) // e.g., "High-High" for top performers
    }
  }

  // Analytics/metrics contexts
  if (/chart|graph|trend|analytics|show|compare|headcount|turnover|diversity/i.test(message)) {
    return { type: 'analytics', metric: detectMetric(message) }
  }

  return { type: 'empty' }
}

function detectCategory(message: string): string | null {
  const categoryMap = {
    'top performer|star|high performer': 'High-High',
    'high potential|hipo|future leader': 'High-High',
    'solid performer|core contributor': 'High-Medium',
    'key talent|growth potential': 'Medium-High',
    'development needed|underperformer': 'Low-Low',
    'flight risk': null // Determined by employee_metrics.flight_risk score
  }

  for (const [pattern, category] of Object.entries(categoryMap)) {
    if (new RegExp(pattern, 'i').test(message)) {
      return category
    }
  }
  return null
}

function detectFilters(message: string): { department?: string } {
  const deptMatch = message.match(/\b(engineering|sales|marketing|product|finance|hr)\b/i)
  return deptMatch ? { department: deptMatch[1] } : {}
}
```

**Doc Context Panel:**
- Embed Monaco/TipTap-based editor that mirrors Google Docs template structure.
- Auto-create a Google Doc via Drive API when the panel opens; all edits auto-sync to Google Doc (Drive remains source of truth).
- Provide inline doc suggestions ("Insert retention plan outline") driven by chat context.

**Analytics Context Panel:**
- Split view: top = sparkline or key stat, bottom = interactive graph (Recharts/Victory) powered by `/api/analytics`.
- Default to "half chat / half graph" by showing last two chat turns stacked to the left plus graph callouts on the right.
- Support screenshot/export to Google Sheets range.

**Performance Grid Context Panel (NEW):**
- Compact 9-box grid view optimized for dashboard side panel.
- Interactive cells that expand on hover to show employee names.
- Click employee → inject context into chat ("Tell me about Sarah's performance").
- Support filters from chat context (e.g., "Show engineering talent grid" → auto-filter to Engineering).
- Highlight specific categories based on chat query (e.g., "Who are my high performers?" → highlight High-High, High-Medium cells).
- Quick actions: "Draft retention plan for [category]", "Schedule calibration session", "Export to Sheets".

**Performance Grid Implementation:**
```tsx
// components/dashboard/NineBoxGridCompact.tsx
export function NineBoxGridCompact({
  filters,
  highlight,
  onEmployeeClick
}: {
  filters?: { department?: string }
  highlight?: string  // e.g., "High-High"
  onEmployeeClick: (employee: Employee) => void
}) {
  const { data: gridData } = useSWR('/api/analytics/nine-box', fetcher)

  const filteredData = React.useMemo(() => {
    if (!gridData || !filters?.department) return gridData

    return {
      ...gridData,
      grid: gridData.grid.map(cell => ({
        ...cell,
        employees: cell.employees.filter(e => e.department === filters.department),
        count: cell.employees.filter(e => e.department === filters.department).length
      }))
    }
  }, [gridData, filters])

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Compact Summary */}
      <div className="flex gap-2 mb-4">
        <StatBadge
          label="High Performers"
          value={filteredData?.summary.highPerformers}
          color="green"
        />
        <StatBadge
          label="Dev Needed"
          value={filteredData?.summary.developmentNeeded}
          color="orange"
        />
      </div>

      {/* Compact 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {(['High', 'Medium', 'Low'] as const).map(performance => (
          (['Low', 'Medium', 'High'] as const).map(potential => {
            const cell = getCell(filteredData, performance, potential)
            const isHighlighted = highlight === `${performance}-${potential}`

            return (
              <Cell
                key={`${performance}-${potential}`}
                cell={cell}
                isHighlighted={isHighlighted}
                onEmployeeClick={onEmployeeClick}
              />
            )
          })
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('retention_plan', highlight)}
        >
          Draft Retention Plan
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('calibration', filters)}
        >
          Schedule Calibration
        </Button>
      </div>
    </div>
  )
}
```

**Chat Integration Examples:**

```
User: "Show me engineering talent"
→ Right panel: 9-box grid filtered to Engineering department
→ Chat response: "Here's your Engineering talent grid. You have 3 high performers
   (Sarah, James, Maria) and 2 employees needing development. Click any cell
   to see details or ask me about specific employees."

User: "Who are my flight risks?"
→ Right panel: 9-box grid with flight risk employees highlighted across all categories
→ Chat response: "I've identified 4 flight risks based on engagement scores and
   tenure patterns. See them highlighted on the grid. Would you like me to:
   [Draft retention plans] [Schedule 1:1s] [Analyze root causes]"

User: "Create a succession plan for VP Engineering"
→ Right panel: 9-box grid highlighting High-High and Medium-High categories
→ Chat response: "I've identified 5 strong succession candidates for VP Engineering
   (highlighted on grid). Based on their skills and experience, I recommend:
   1. Sarah (High-High) - Ready now
   2. James (High-High) - 6-12 months
   3. Maria (Medium-High) - 12-18 months

   Would you like me to create development plans for each?"

User: "Draft a PIP for John in Engineering"
→ Right panel: Document editor with PIP template
→ 9-box grid collapses but shows John's position in grid as context
→ Chat: Generates PIP with performance context from grid data
```

**Action Items:**
- [ ] Build enhanced context detection pipeline with performance grid triggers
- [ ] Create compact NineBoxGridCompact component optimized for side panel
- [ ] Implement cell highlighting based on chat queries
- [ ] Add employee click handler that injects context into chat
- [ ] Wire grid to `employee_metrics` table with real-time flight risk data
- [ ] Build filter pipeline (department, date range, custom cohorts)
- [ ] Add quick action buttons (retention plans, calibration, exports)
- [ ] Integrate Google Docs editor state with Drive/Docs APIs (create/update/share)
- [ ] Wire analytics panel to `employee_metrics` + `insight_events` tables
- [ ] Add smooth transitions when switching between doc/analytics/grid contexts
- [ ] Implement keyboard shortcuts (cmd+1 for doc, cmd+2 for analytics, cmd+3 for grid)
- [ ] Add Cypress/Playwright tests for all three context types

**Success Criteria:**
- ✅ Chat is the single entry point; dashboard never navigates away
- ✅ Doc-related prompts surface an editor with live Google Doc sync in < 2s
- ✅ Analytics prompts surface charts with relevant metrics in < 2s
- ✅ Performance/talent prompts surface 9-box grid with correct filters in < 2s
- ✅ Users can click employee in grid → chat auto-populates with context
- ✅ Grid automatically filters based on chat context (dept, role, tenure)
- ✅ Users can jump between doc + analytics + grid without losing chat history
- ✅ Quick actions from grid trigger appropriate workflows (retention, succession, etc.)

---

#### Task 3.3: Data Input Hub + Document Library
**Priority:** High  
**Effort:** 3 days

**Goal:** Keep the current `/data-sources` experience (so mock CSV uploads keep working) but give it prominent navigation and embed a document library so demos don’t have to jump between multiple pages.

**Action Items:**
- [ ] Add a "Data Inputs" icon next to Settings in the main header (no removal of existing Settings page).
- [ ] Preserve the current SmartFileUpload + file listing; layer on helper cards that reference the saved desktop CSVs for drag-and-drop demos.
- [ ] Embed a "Document Library" section on the Data Input page that surfaces recent policies/templates and links to the full `/documents` view.
- [ ] Allow dragging files directly into the Document Library cards to auto-tag/upload them.
- [ ] Keep the Data Input quick action tile (left rail) but update copy to highlight mock data + CSV parity.

**Success Criteria:**
- ✅ Settings and Data Input pages stay as-is functionally, just easier to reach
- ✅ Document Library preview lives on the Data Input page
- ✅ Drag-and-drop demos clearly reference the included mock CSV files
- ✅ No regressions in file upload/delete/preview

---

#### Task 3.4: Simplify RBAC (5 roles → 2 roles)
**Priority:** Medium
**Effort:** 2 days

**Current (Complex):**
```typescript
// 5 roles, 6 resources, 24 permission combinations
roles: ['super_admin', 'hr_admin', 'hr_manager', 'hr_analyst', 'employee']
resources: ['employees', 'analytics', 'chat', 'data_upload', 'settings', 'audit']
```

**New (Simple):**
```typescript
// 2 roles, clear permissions
export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'HR Admin',
    description: 'Full access to all features',
    permissions: {
      chat: true,
      view_employees: true,
      edit_employees: true,
      view_analytics: true,
      export_data: true,
      upload_data: true,
      manage_settings: true,
      take_actions: true, // Send emails, create docs, etc.
    }
  },

  USER: {
    id: 'user',
    name: 'User',
    description: 'Chat access with limited actions',
    permissions: {
      chat: true,
      view_employees: true,
      edit_employees: false,
      view_analytics: true,
      export_data: false,
      upload_data: false,
      manage_settings: false,
      take_actions: false, // Can't send emails, create docs
    }
  }
}

// Simple permission check
function can(user: User, action: string): boolean {
  return ROLES[user.role].permissions[action] === true
}
```

**Migration:**
```typescript
// Map old roles to new roles
const roleMapping = {
  'super_admin': 'admin',
  'hr_admin': 'admin',
  'hr_manager': 'admin',
  'hr_analyst': 'user',
  'employee': 'user'
}
```

**Success Criteria:**
- ✅ Simpler mental model (admin vs user)
- ✅ 90% reduction in RBAC code
- ✅ Easier to explain to users
- ✅ No loss of essential security

---

#### Task 3.5: Consolidate API Endpoints (42 → 12)
**Priority:** Medium
**Effort:** 3 days

**Current (Fragmented):**
```
POST /api/ai/analyze-sentiment
POST /api/ai/extract-entities
POST /api/ai/detect-language
POST /api/ai/translate
POST /api/ai/transcribe
POST /api/ai/parse-resume
POST /api/ai/predict/attrition
POST /api/ai/predict/performance
... (35+ more)
```

**New (Unified):**
```typescript
// 12 total endpoints

// 1. Main chat interface
POST /api/chat
{
  message: "Show engineering headcount",
  conversation_id?: string
}

// 2. Execute actions
POST /api/actions
{
  action: "send_email" | "create_document" | "schedule_meeting",
  payload: { ... }
}

// 3. Employee data
GET    /api/employees
POST   /api/employees
PATCH  /api/employees/:id
DELETE /api/employees/:id

// 4. Analytics
GET /api/analytics?metric=turnover|headcount|diversity

// 5. Document generation
POST /api/documents
{
  type: "offer_letter" | "pip" | "job_description",
  data: { ... }
}

// 6. Data upload
POST /api/upload
{
  type: "csv" | "json",
  file: File
}

// 7. Conversations
GET /api/conversations
GET /api/conversations/:id

// 8. Auth
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// 9. Settings
GET   /api/settings
PATCH /api/settings

// 10. Integrations
GET  /api/integrations
POST /api/integrations/:provider/connect

// 11. Cron jobs
GET /api/cron/onboarding
GET /api/cron/metrics-sync

// 12. Health check
GET /api/health
```

**Smart Routing:**
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { message, conversation_id } = await request.json()

  // Detect workflow
  const workflow = detectWorkflow(message)

  // If Claude can handle it, use Claude
  if (workflow) {
    return await executeWorkflow(workflow, message, conversation_id)
  }

  // Otherwise, route to appropriate service
  if (isAnalyticsQuery(message)) {
    return await handleAnalytics(message)
  }

  if (isDataQuery(message)) {
    return await handleDataQuery(message)
  }

  // Default: general chat with Claude
  return await handleGeneralChat(message)
}
```

**Success Criteria:**
- ✅ Developers understand API in < 5 minutes
- ✅ Users never interact with APIs directly (chat handles everything)
- ✅ 70% reduction in API surface area
- ✅ Easier to document and test

---

### **Weeks 11-12: Component Simplification**

#### Task 4.1: Reduce shadcn Components (54 → 15)
**Priority:** Medium
**Effort:** 3 days

**Keep (Essential 15):**
```typescript
// Only install/keep these
const ESSENTIAL_COMPONENTS = [
  'button',
  'input',
  'textarea',
  'select',
  'dialog',
  'card',
  'table',
  'badge',
  'avatar',
  'dropdown-menu',
  'toast',
  'form',
  'label',
  'tabs',
  'popover'
]
```

**Remove (Unnecessary 39):**
```typescript
const REMOVE_COMPONENTS = [
  'accordion', 'alert-dialog', 'aspect-ratio', 'checkbox',
  'collapsible', 'context-menu', 'hover-card', 'menubar',
  'navigation-menu', 'progress', 'radio-group', 'scroll-area',
  'separator', 'slider', 'switch', 'toggle', 'toggle-group',
  'tooltip', 'calendar', 'carousel', 'chart', 'command',
  'drawer', 'input-otp', 'pagination', 'resizable',
  'sheet', 'skeleton', 'sonner', 'breadcrumb',
  // ... 10+ more
]
```

**Action Items:**
- [ ] Audit component usage across app
- [ ] Replace complex components with simple alternatives
- [ ] Remove unused component files
- [ ] Update imports
- [ ] Test UI still works

**Success Criteria:**
- ✅ UI remains functional and beautiful
- ✅ Bundle size reduced by ~200KB
- ✅ Simpler component library to maintain

---

#### Task 4.2: Remove Complex Features
**Priority:** Medium
**Effort:** 2 days

**Remove:**

1. **Virtualized Tables** - Use regular tables (< 500 employees is fine)
   ```typescript
   // Before (complex)
   import { useVirtualizer } from '@tanstack/react-virtual'

   // After (simple)
   <table>
     {employees.map(emp => <EmployeeRow key={emp.id} employee={emp} />)}
   </table>
   ```

2. **Complex State Management** - Replace Zustand with React Context
   ```typescript
   // Before: Zustand store with middleware
   export const useEmployeeStore = create<EmployeeStore>()(
     devtools(
       persist(
         (set, get) => ({ ... }),
         { name: 'employee-store' }
       )
     )
   )

   // After: Simple context
   const EmployeeContext = createContext<Employee[]>([])

   export function EmployeeProvider({ children }) {
     const [employees, setEmployees] = useState<Employee[]>([])

     useEffect(() => {
       fetch('/api/employees').then(r => r.json()).then(setEmployees)
     }, [])

     return (
       <EmployeeContext.Provider value={employees}>
         {children}
       </EmployeeContext.Provider>
     )
   }
   ```

3. **Advanced Caching** - Use simple SWR instead of custom caching
   ```typescript
   // Before: Custom cache with TTL, limits, etc.

   // After: SWR with defaults
   import useSWR from 'swr'

   function useEmployees() {
     const { data, error } = useSWR('/api/employees', fetcher)
     return { employees: data, isLoading: !error && !data, error }
   }
   ```

**Success Criteria:**
- ✅ Code is easier to understand
- ✅ Performance remains acceptable (< 500 employees)
- ✅ Developer velocity increases

---

### **Weeks 13-14: Proactive Actions & Intelligence**

Before launch we need proactive insights plus an action system that can be trusted. This phase also stress-tests provider failover and worker reliability.

#### Task 5.1: Implement Action Execution System
**Priority:** Critical
**Effort:** 8 days (originally estimated 5 days)
**Status:** ✅ COMPLETED

**Purpose:** Transform from "AI that answers" to "AI that does"

**Actual Implementation Timeline:**
- **Days 1-3:** Workflow infrastructure (detection, routing, configuration)
- **Day 4:** State persistence & database integration
- **Day 5:** State machine logic & transitions
- **Day 6:** UI integration & progress tracking
- **Day 7:** Action types & executor framework
- **Day 8:** Action UI components & document handler

**Action Types:**
```typescript
// lib/actions/types.ts
export type Action =
  | EmailAction
  | DocumentAction
  | SlackAction
  | CalendarAction
  | DataUpdateAction

interface EmailAction {
  type: 'send_email'
  to: string | string[]
  subject: string
  body: string
  attachments?: File[]
  requiresApproval: boolean
}

interface DocumentAction {
  type: 'create_document'
  documentType: 'offer_letter' | 'job_description' | 'pip' | 'review'
  data: Record<string, any>
  saveToGoogleDrive?: boolean
}

interface SlackAction {
  type: 'send_slack_message'
  channel: string
  message: string
  createChannel?: {
    name: string
    members: string[]
  }
}

interface CalendarAction {
  type: 'schedule_meeting'
  title: string
  attendees: string[]
  duration: number
  suggestedTimes: Date[]
}

interface DataUpdateAction {
  type: 'update_employee'
  employeeId: string
  updates: Partial<Employee>
  requiresApproval: boolean
}
```

**Action Executor:**
```typescript
// lib/actions/executor.ts
export class ActionExecutor {
  async execute(action: Action, user: User): Promise<ActionResult> {
    // Check permissions
    if (!this.canExecute(user, action)) {
      throw new Error('Insufficient permissions')
    }

    // Check if approval needed
    if (action.requiresApproval) {
      return await this.requestApproval(action, user)
    }

    // Execute action
    switch (action.type) {
      case 'send_email':
        return await this.sendEmail(action)

      case 'create_document':
        return await this.createDocument(action)

      case 'send_slack_message':
        return await this.sendSlackMessage(action)

      case 'schedule_meeting':
        return await this.scheduleMeeting(action)

      case 'update_employee':
        return await this.updateEmployee(action)
    }
  }

  private async sendEmail(action: EmailAction): Promise<ActionResult> {
    // Use Resend or similar
    const result = await resend.emails.send({
      from: 'HR Command Center <hr@yourcompany.com>',
      to: action.to,
      subject: action.subject,
      html: action.body
    })

    // Log action
    await db.actions.create({
      type: 'email_sent',
      status: 'completed',
      payload_json: JSON.stringify(action),
      result_json: JSON.stringify(result)
    })

    return { success: true, data: result }
  }

  // ... other action handlers
}
```

**Claude Integration:**
```typescript
// Update workflow system to suggest actions
const hiringWorkflow = {
  systemPrompt: `...

  When appropriate, suggest concrete actions:

  User: "We're hiring a senior engineer"

  You should respond with:
  1. The requested information/documents
  2. Suggested next actions in JSON format

  Example response:
  "I've drafted a job description for Senior Engineer (attached below).

  [Job Description content...]

  Would you like me to take these actions?

  <suggested_actions>
  [
    {
      "type": "create_document",
      "label": "Save job description to Google Drive",
      "documentType": "job_description",
      "data": { ... }
    },
    {
      "type": "send_slack_message",
      "label": "Create #hiring-senior-eng Slack channel",
      "channel": "hiring-senior-eng",
      "createChannel": {
        "name": "hiring-senior-eng",
        "members": ["hiring-manager", "recruiter"]
      }
    },
    {
      "type": "send_email",
      "label": "Email hiring manager with JD for review",
      "to": "manager@company.com",
      "subject": "Review: Senior Engineer Job Description",
      "requiresApproval": false
    }
  ]
  </suggested_actions>"
  `
}
```

**UI for Action Approval:**
```typescript
// components/chat/ActionButtons.tsx
export function ActionButtons({ actions }: { actions: Action[] }) {
  const [executing, setExecuting] = useState<string[]>([])

  async function executeAction(action: Action) {
    setExecuting(prev => [...prev, action.type])

    try {
      const result = await fetch('/api/actions', {
        method: 'POST',
        body: JSON.stringify(action)
      })

      toast.success(`${action.label} completed!`)
    } catch (error) {
      toast.error(`Failed: ${error.message}`)
    } finally {
      setExecuting(prev => prev.filter(t => t !== action.type))
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map(action => (
        <Button
          key={action.type}
          variant="outline"
          onClick={() => executeAction(action)}
          disabled={executing.includes(action.type)}
        >
          {executing.includes(action.type) ? (
            <>
              <Spinner /> Executing...
            </>
          ) : (
            <>
              <Icon name={getIconForAction(action.type)} />
              {action.label}
            </>
          )}
        </Button>
      ))}
    </div>
  )
}
```

**Success Criteria:**
- ✅ Claude can suggest concrete actions, not just answers
- ✅ Users can execute actions with one click
- ✅ All actions are logged and auditable
- ✅ Dangerous actions require approval

**Actual Deliverables (Completed):**

1. **Workflow System** (`lib/workflows/`)
   - Automatic workflow detection (8 workflows: hiring, performance, onboarding, etc.)
   - Confidence-based routing with context factors
   - Hybrid state tracking (stateless → stateful at 75% confidence)
   - Complete workflow catalog with capabilities

2. **State Machine** (`lib/workflows/state-machine/`)
   - WorkflowStateMachine class with full lifecycle management
   - Database persistence (conversations.workflowStateJson + workflowSnapshots)
   - Step tracking, progress calculation, validation
   - Transition history and rollback support

3. **Action Framework** (`lib/workflows/actions/`)
   - 8 action types (create_document, send_email, send_slack_message, etc.)
   - ActionExecutor with timeout, retries, rate limiting
   - Permission checks and validation pipeline
   - Audit trail with execution statistics
   - Handler pattern for extensibility

4. **UI Components** (`components/custom/`)
   - WorkflowProgress: Visual progress bars with step tracking
   - ActionButtons: Interactive action cards with execution feedback
   - Real-time status updates (pending → executing → completed/failed)
   - Batch execution support

5. **API Endpoints** (`app/api/`)
   - POST /api/chat - Enhanced with workflow state & suggested actions
   - POST /api/actions - Single action execution
   - PUT /api/actions - Batch action execution
   - GET /api/actions/history - Audit trail

6. **Document Handler** (`lib/workflows/actions/handlers/`)
   - Complete create_document implementation
   - Support for 8 document types (job descriptions, offers, PIPs, etc.)
   - Format conversion (markdown, HTML, plain text)
   - Validation with permission checks

**Files Created:** 15+ files, ~3,000 lines of code
**TypeScript Coverage:** 100% type-safe
**Integration:** Full end-to-end workflow → state → actions → UI

---

#### Task 5.2: Implement Proactive Intelligence
**Priority:** High
**Effort:** 4 days

**Purpose:** Surface insights automatically, don't wait for users to ask

**Background Job:**
```typescript
// app/api/cron/daily-insights/route.ts
export async function GET(request: NextRequest) {
  // Run daily at 8am
  const users = await db.users.findAll({ role: 'admin' })

  for (const user of users) {
    const insights = await generateInsights(user)

    if (insights.length > 0) {
      // Create notification
      await db.notifications.create({
        user_id: user.id,
        title: 'Daily HR Insights',
        insights_json: JSON.stringify(insights),
        created_at: new Date().toISOString()
      })

      // Optional: Send email digest
      await sendInsightsEmail(user, insights)
    }
  }

  return Response.json({ processed: users.length })
}
```

**Insight Generation:**
```typescript
// lib/intelligence/insights.ts
export async function generateInsights(user: User): Promise<Insight[]> {
  const insights: Insight[] = []

  // 1. Flight risk detection
  const flightRisks = await detectFlightRisks()
  if (flightRisks.length > 0) {
    insights.push({
      type: 'flight_risk',
      severity: 'high',
      title: `${flightRisks.length} employees are flight risks`,
      description: flightRisks.map(e => e.full_name).join(', '),
      suggestedActions: [
        {
          type: 'create_document',
          label: 'Draft retention plan',
          documentType: 'retention_plan',
          data: { employees: flightRisks }
        }
      ]
    })
  }

  // 2. Hiring bottlenecks
  const openReqs = await getOpenRequisitions()
  const staleReqs = openReqs.filter(r => r.days_open > 60)
  if (staleReqs.length > 0) {
    insights.push({
      type: 'hiring_bottleneck',
      severity: 'medium',
      title: `${staleReqs.length} reqs open >60 days`,
      description: 'Your hiring process may have bottlenecks',
      suggestedActions: [
        {
          type: 'analyze',
          label: 'Analyze hiring pipeline',
          query: 'Show me why our senior engineer req is taking so long'
        }
      ]
    })
  }

  // 3. Performance review season
  const reviewsDue = await getUpcomingReviews(30) // next 30 days
  if (reviewsDue.length > 0) {
    insights.push({
      type: 'upcoming_reviews',
      severity: 'low',
      title: `${reviewsDue.length} reviews due this month`,
      suggestedActions: [
        {
          type: 'send_email',
          label: 'Remind managers',
          to: getManagerEmails(reviewsDue),
          subject: 'Performance reviews due this month'
        }
      ]
    })
  }

  // 4. Diversity insights
  const diversityGaps = await analyzeDiversity()
  if (diversityGaps.length > 0) {
    insights.push({
      type: 'diversity',
      severity: 'medium',
      title: 'Diversity gaps identified',
      description: diversityGaps.map(g => g.description).join('; '),
      suggestedActions: [
        {
          type: 'analyze',
          label: 'View full diversity report',
          query: 'Show me diversity metrics by department'
        }
      ]
    })
  }

  return insights
}
```

**UI:**
```typescript
// app/page.tsx - Show insights on dashboard
export default function Dashboard() {
  const { data: insights } = useSWR('/api/insights', fetcher)

  return (
    <div>
      {/* Insights Panel */}
      {insights && insights.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.map(insight => (
              <InsightCard key={insight.type} insight={insight} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  )
}
```

**Success Criteria:**
- ✅ Users see important insights without asking
- ✅ Insights are actionable (not just FYI)
- ✅ System learns what users care about over time
- ✅ No noise - only show meaningful insights

---

### **Weeks 15-16: Polish & Launch**

Nothing new ships here—only polish, docs, demos, and hardening. Any unfinished scope goes to a future phase.

#### Task 6.1: Rationalize AI Services (Claude-first, fallback-ready)
**Priority:** High
**Effort:** 3 days

**Rationale:** Claude 3.5 Sonnet now covers 90% of workloads, but we still need a tested escape hatch (Gemini/GPT/open-source) for outages, cost spikes, or customer preference. Default experience = Claude, fallback available via provider abstraction built in Phase 1.

**Migration:**

1. **Sentiment Analysis** - Use Claude by default, fallback if provider unhealthy
   ```typescript
   // Before: Google Natural Language API
   const sentiment = await languageClient.analyzeSentiment({ document })

   // After: Claude with structured output
   const sentiment = await anthropic.messages.create({
     model: 'claude-3-5-sonnet-20241022',
     messages: [{
       role: 'user',
       content: `Analyze the sentiment of this text. Return JSON only.

       Text: "${text}"

       Response format:
       {
         "sentiment": "positive" | "negative" | "neutral",
         "score": -1.0 to 1.0,
         "reasoning": "brief explanation"
       }`
     }]
   })
   ```

2. **Translation** - Use Claude with provider health check + optional fallback that reuses same structured output contract
   ```typescript
   // Before: Google Translate API
   const translation = await translateClient.translate(text, targetLanguage)

   // After: Claude
   const translation = await anthropic.messages.create({
     messages: [{
       role: 'user',
       content: `Translate this to ${targetLanguage}: "${text}"`
     }]
   })
   ```

3. **Document Parsing** - Use Claude with vision, retain optional connector for Google Document AI behind provider flag
   ```typescript
   // Before: Document AI
   const parsed = await documentAI.processDocument(document)

   // After: Claude with vision
   const parsed = await anthropic.messages.create({
     model: 'claude-3-5-sonnet-20241022',
     messages: [{
       role: 'user',
       content: [
         { type: 'image', source: { ... } },
         { type: 'text', text: 'Extract all fields from this resume...' }
       ]
     }]
   })
   ```

**Action Items:**
- [ ] Remove unused Google SDKs from default install; keep optional adapter package (`integrations/google-ai.ts`)
- [ ] Route `/app/api/ai/*` through provider abstraction with providerId parameter
- [ ] Update workflows to consume provider responses via common schema (sentiment/translation/doc parsing)
- [ ] Keep `GOOGLE_APPLICATION_CREDENTIALS` optional (only required when fallback enabled)
- [ ] Update documentation so customers know how to bring their own provider + how failover behaves

**Benefits:**
- ✅ Claude-first path is simpler but outages no longer block launches
- ✅ Billing clarity (Anthropic primary) while keeping leverage in negotiations
- ✅ Optional service accounts rather than mandatory setup
- ✅ Better quality for core flows + measurable cost savings

---

#### Task 6.2: Final UI Polish
**Priority:** Medium
**Effort:** 3 days

**Action Items:**

1. **Consolidate Pages**
   ```
   Before:                    After:
   ├── /                     ├── /            (chat + insights)
   ├── /chat                 ├── /employees   (simple table)
   ├── /employees            ├── /settings    (progressive disclosure)
   ├── /analytics            └── That's it.
   ├── /data-sources
   ├── /settings
   └── /nine-box
   ```

2. **Simplify Navigation**
   ```typescript
   // Before: Complex sidebar with many sections

   // After: Minimal header
   <Header>
     <Logo />
     <Nav>
       <NavLink href="/">Chat</NavLink>
       <NavLink href="/employees">Employees</NavLink>
       <NavLink href="/settings">Settings</NavLink>
     </Nav>
     <UserMenu />
   </Header>
   ```

3. **Clean Up Settings**
   ```typescript
   // Only show what users need
   <Settings>
     <Section title="Data">
       {!hasUploadedData ? (
         <UploadCSV />
       ) : (
         <DataStats employees={employeeCount} lastSync={lastSync} />
       )}
     </Section>

     <Section title="AI">
       <Toggle
         label="Optimize AI costs"
         description="Enable prompt caching and smart limits (saves ~$150/month)"
         defaultChecked
       />
     </Section>

     {/* Only show if they've used the app for 7+ days */}
     {user.daysActive > 7 && (
       <Section title="Integrations">
         <IntegrationCards />
       </Section>
     )}
   </Settings>
   ```

4. **Improve Chat UX**
   - Add typing indicators when Claude is thinking
   - Show workflow state ("Step 2 of 3: Reviewing documents...")
   - Add example prompts if conversation is empty
   - Add "Suggested follow-up questions" after each response

**Success Criteria:**
- ✅ UI feels spacious and uncluttered
- ✅ Users understand where to go for what they need
- ✅ No overwhelming options or settings

---

#### Task 6.3: Documentation Update
**Priority:** Medium
**Effort:** 2 days

**New Documentation Structure:**
```
docs/
├── README.md                    # Quick start (< 500 words)
├── ARCHITECTURE.md              # Technical overview
├── WORKFLOWS.md                 # 8 workflows explained
├── API.md                       # 12 endpoints documented
└── DEPLOYMENT.md                # Deploy to Vercel/Railway
```

**Action Items:**
- [ ] Rewrite README for Phase 2
- [ ] Create workflow documentation
- [ ] Document 12 API endpoints (not 42)
- [ ] Add video demo (2 minutes)
- [ ] Create "Migrating from Phase 1" guide

**Success Criteria:**
- ✅ Docs are ≤ 5 pages total
- ✅ Users can onboard in < 5 minutes
- ✅ Video shows full workflow in 2 minutes

---

## 📊 Success Metrics

### Quantitative Goals

| Metric | Phase 1 | Phase 2 Target |
|--------|---------|----------------|
| Time to first value | 30+ minutes | < 60 seconds |
| Lines of TypeScript | ~50,000 | ~15,000 |
| API endpoints | 42 | 12 |
| Required API keys | 6 | 0 (optional 1) |
| External dependencies | 8 services | 2 managed AI providers + Google Workspace (Drive/Docs/Sheets) |
| npm packages | 125+ | ~50 |
| Setup steps | 15+ | 0 |
| Documentation pages | 60+ | 5 |
| User roles | 5 | 2 |
| Skills/Workflows | 27 | 8 |

### Qualitative Goals

- **User Feedback:** "This just works" vs "I need to read docs"
- **Developer Experience:** New dev productive in 1 day vs 1 week
- **Maintenance:** Simple enough for 1 person to maintain
- **Deployment:** One-click deploy to Vercel
- **Support:** 90% of questions answered by trying it, not reading docs

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Schedule creep** from rewriting data layer + workflows | Buffer baked in (16 weeks), phase gates require demo + resiliency checks before progressing |
| **Single AI provider outage** | Provider abstraction, health checks, automated failover, optional customer-provided provider |
| **Data migration bugs** hurting trust | Deterministic migration scripts, snapshot + rollback tooling, dual-write period during beta |
| **Automation reliability regressions when removing Python** | Dedicated worker service with retries/DLQ + monitoring dashboard |
| **Scope creep (keeping vanity features)** | Guiding principles + “delete unless critical” reviews at end of each phase |

---

## 🚀 Migration Strategy

### For Existing Users

**Option 1: Clean Install (Recommended)**
```bash
# Start fresh with Phase 2
git clone https://github.com/your-org/hrskills.git -b phase-2
cd hrskills
npm install
npm run dev

# Import your Phase 1 data
npm run migrate:from-phase1 -- --data-path=/path/to/phase1/data
```

**Option 2: In-Place Upgrade**
```bash
# Backup first!
cp -r data data-backup
cp -r webapp/app webapp/app-backup

# Run migration script
npm run migrate:to-phase2

# This will:
# 1. Convert JSON → SQLite
# 2. Consolidate skills → workflows
# 3. Update API routes
# 4. Simplify components
```

### Backward Compatibility

- Phase 1 API endpoints will redirect to Phase 2 equivalents for 6 months
- Old skill IDs will map to new workflow IDs
- JSON data files will still load (but recommend migrating to SQLite)

---

## 🎯 Launch Checklist

### Pre-Launch (Week 16)

- [ ] All migrations tested with real Phase 1 data
- [ ] Zero-config first run works perfectly
- [ ] Demo data is realistic and useful
- [ ] All 8 workflows tested end-to-end
- [ ] Action execution system works (email, Slack, docs)
- [ ] Proactive insights generate daily
- [ ] Documentation complete (5 pages max)
- [ ] Video demo recorded (2 minutes)
- [ ] Performance: Chat response < 2 seconds
- [ ] Security audit passed
- [ ] Accessibility: WCAG AA compliance maintained
- [ ] AI provider failover + worker chaos tests green

### Launch Week (16)

- [ ] Deploy to production (Vercel)
- [ ] Announce Phase 2 to existing users
- [ ] Post demo video
- [ ] Open beta for new users
- [ ] Monitor error rates
- [ ] Collect feedback
- [ ] Run live failover drill + share status page update

### Post-Launch (Week 17+)

- [ ] Week 1 post-launch: Fix critical bugs
- [ ] Week 2 post-launch: Add top 3 requested features
- [ ] Month 1: Analyze usage patterns
- [ ] Month 2: Optimize based on real usage
- [ ] Month 3: Plan Phase 3 (if needed)

---

## 💡 Phase 3 Ideas (Future)

Based on Phase 2 learnings, potential future enhancements:

1. **Mobile App** - React Native app for on-the-go HR tasks
2. **Voice Interface** - "Hey HR, show me turnover" voice commands
3. **Slack Bot** - Use HR Command Center directly in Slack
4. **Advanced ML** - Train custom models on company data
5. **Workflow Marketplace** - Users share custom workflows
6. **Multi-tenant SaaS** - Serve multiple companies from one instance
7. **Integration Marketplace** - Community-built integrations

But only if Phase 2 proves the simplified approach works!

---

## 📞 Support & Feedback

**Questions?** Open an issue on GitHub
**Feedback?** Email: feedback@hrcommand.center
**Contributing?** See CONTRIBUTING.md

---

**Let's ship Phase 2 and make HR software insanely great! 🚀**
