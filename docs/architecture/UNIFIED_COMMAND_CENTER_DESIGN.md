# Unified Command Center Dashboard - Design Spec

> **Phase 2 - Task 3.2**
> A single-page, context-aware dashboard that adapts based on conversation intent

---

## 🎯 Design Philosophy

**One conversation surface + adaptive context panel = everything you need**

The Unified Command Center eliminates the need to navigate between separate pages for analytics, documents, or performance reviews. Instead, the right panel intelligently adapts based on what you're discussing in chat.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HR Command Center                    [Settings] [@user]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┬───────────────────────────────────┐  │
│  │                      │                                   │  │
│  │   CHAT (2fr)         │   CONTEXT PANEL (1fr)            │  │
│  │   Always visible     │   Adapts to conversation         │  │
│  │                      │                                   │  │
│  │  ┌─────────────────┐ │  [Doc | Analytics | Grid | Help] │  │
│  │  │ Today's Insights│ │                                   │  │
│  │  │ • 3 flight risks│ │   ┌─────────────────────────┐    │  │
│  │  │ • 2 open reqs   │ │   │                         │    │  │
│  │  └─────────────────┘ │   │    ADAPTIVE CONTENT     │    │  │
│  │                      │   │                         │    │  │
│  │  💬 Chat History     │   │  • Document Editor      │    │  │
│  │  ────────────────    │   │  • Chart/Graph          │    │  │
│  │  You: Show eng...   │   │  • 9-Box Grid           │    │  │
│  │  AI: Here's your... │   │  • Helper Panel         │    │  │
│  │  You: Who are...    │   │                         │    │  │
│  │  AI: I found 4...   │   │                         │    │  │
│  │                      │   │                         │    │  │
│  │  ┌─────────────────┐ │   │                         │    │  │
│  │  │ Type message... │ │   │                         │    │  │
│  │  └─────────────────┘ │   │                         │    │  │
│  │                      │   └─────────────────────────┘    │  │
│  └──────────────────────┴───────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Context Detection Intelligence

The system analyzes your message and automatically selects the right context panel:

### Detection Flow

```typescript
User Message
     ↓
┌────────────────────────────────────┐
│ deriveContext(message, workflow)  │
└────────────────────────────────────┘
     ↓
     ├─→ Keywords: "offer", "policy", "plan", "letter"
     │   + Workflow: HIRING
     │   → Context: DOC EDITOR
     │
     ├─→ Keywords: "9-box", "talent grid", "succession"
     │   OR "top performers", "flight risk"
     │   → Context: PERFORMANCE GRID
     │
     ├─→ Keywords: "chart", "graph", "trend", "analytics"
     │   OR metrics like "headcount", "turnover"
     │   → Context: ANALYTICS
     │
     └─→ No match
         → Context: HELPER PANEL
```

---

## 🎨 Context Panel States

### State 1: Document Editor

**Triggers:**
- "Create an offer letter for Sarah"
- "Draft a job description for senior engineer"
- "Write a PIP for underperforming team member"

**Panel Contents:**
```
┌──────────────────────────────┐
│ 📄 Offer Letter              │
│ ────────────────────────────  │
│                              │
│ [Monaco/TipTap Editor]       │
│                              │
│ Dear Sarah,                  │
│                              │
│ We are pleased to offer...  │
│                              │
│ ────────────────────────────  │
│ ✓ Synced with Google Docs    │
│ [Share] [Export] [Templates] │
└──────────────────────────────┘
```

**Key Features:**
- Live sync with Google Docs (Drive API)
- Inline suggestions from Claude
- Template library
- Auto-save every 3 seconds

---

### State 2: Analytics Canvas

**Triggers:**
- "Show engineering headcount trends"
- "Compare turnover by department"
- "What's our diversity breakdown?"

**Panel Contents:**
```
┌──────────────────────────────┐
│ 📊 Engineering Headcount     │
│ ────────────────────────────  │
│  ┌──────────────────┐        │
│  │  47 Engineers    │        │
│  │  ↓ -3 from Q3    │        │
│  └──────────────────┘        │
│                              │
│  [Interactive Line Chart]    │
│   Q1  Q2  Q3  Q4             │
│   52  50  50  47             │
│                              │
│ ────────────────────────────  │
│ [Export to Sheets] [↓ CSV]   │
└──────────────────────────────┘
```

**Key Features:**
- Real-time data from employee_metrics table
- Interactive charts (Recharts/Victory)
- Export to Google Sheets
- Drill-down capabilities

---

### State 3: Performance Grid (NEW)

**Triggers:**
- "Show me engineering talent"
- "Who are my flight risks?"
- "Create succession plan for VP role"
- "Show 9-box grid"

**Panel Contents:**
```
┌──────────────────────────────┐
│ 🎯 Talent Grid - Engineering │
│ ────────────────────────────  │
│  High Perf: 3  Dev Needed: 2 │
│                              │
│  ┌────┬────┬────┐            │
│  │ 2  │ 3  │ 5  │← High Pot  │
│  ├────┼────┼────┤            │
│  │ 1  │ 12 │ 8  │← Med Pot   │
│  ├────┼────┼────┤            │
│  │ 0  │ 4  │ 2  │← Low Pot   │
│  └────┴────┴────┘            │
│    ↑    ↑    ↑               │
│   Low  Med High (Performance)│
│                              │
│ ────────────────────────────  │
│ [Retention Plan] [Export]    │
└──────────────────────────────┘
```

**Key Features:**
- Compact 3x3 grid optimized for side panel
- Hover to see employee names
- Click cell → expand employee list
- Click employee → inject into chat
- Auto-filter by department from chat
- Highlight categories (e.g., High-High for "top performers")
- Quick actions: Retention plans, calibration sessions

---

### State 4: Helper Panel (Default)

**Triggers:**
- First load
- No specific context detected
- User clears context

**Panel Contents:**
```
┌──────────────────────────────┐
│ 💡 Suggested Actions         │
│ ────────────────────────────  │
│                              │
│  Try asking:                 │
│                              │
│  • "Show engineering talent" │
│  • "Draft offer letter"      │
│  • "Analyze Q4 reviews"      │
│  • "Who needs development?"  │
│                              │
│ ────────────────────────────  │
│  Recent Documents            │
│  • Offer - Sarah Chen        │
│  • PIP - John Smith          │
│                              │
└──────────────────────────────┘
```

---

## 🔄 Context Switching Flow

### Example Conversation Flow

```
1. User: "Show me engineering talent"
   ↓
   Context: PERFORMANCE_GRID (filtered to Engineering)
   Chat: "Here's your Engineering talent grid. You have 3 high
          performers (Sarah, James, Maria)..."
   Grid: Shows 9-box with Engineering employees only

2. User clicks Sarah in grid
   ↓
   Chat auto-populates: "Tell me about Sarah's performance"
   Context: PERFORMANCE_GRID (Sarah highlighted)
   Chat: "Sarah is a High-High performer. She's exceeded goals
          for 3 consecutive quarters..."

3. User: "Draft a retention plan for her"
   ↓
   Context: DOC_EDITOR (Retention Plan template)
   Chat: "I've drafted a retention plan for Sarah. Key elements:
          - Promotion to Senior Engineer
          - Equity refresh
          - Leadership track..."
   Editor: Shows retention plan document syncing to Google Docs

4. User: "What's our engineering turnover?"
   ↓
   Context: ANALYTICS (turnover metric)
   Chat: "Engineering turnover is 15% (company avg: 12%).
          Trend shows +3% over last quarter..."
   Chart: Line graph showing quarterly turnover rates
```

### Transition Behavior

- **Smooth fade** (300ms) when switching contexts
- **Preserve scroll position** in chat when context changes
- **Breadcrumb trail** shows context history
- **Keyboard shortcuts:**
  - `cmd+1` → Force Doc Editor
  - `cmd+2` → Force Analytics
  - `cmd+3` → Force Performance Grid
  - `cmd+\` → Toggle context panel

---

## 🎭 Performance Grid Deep Dive

### Compact Design for Side Panel

**Full-screen (current):**
- 4 summary cards
- Large 3x3 grid with cell details
- Department filter dropdown
- Upload button

**Compact (new):**
- 2 mini stat badges
- Tight 3x3 grid (minimal padding)
- Integrated filters (from chat)
- Quick action buttons at bottom

### Cell Interaction

```
Hover State:
┌─────────┐
│ 5       │  →  ┌─────────────┐
│         │     │ 5 employees │
│ High-   │     │ Sarah, James│
│ High    │     │ Maria, ...  │
└─────────┘     └─────────────┘

Click State:
Opens modal with full employee list + quick actions
```

### Smart Highlighting

```typescript
// Chat: "Who are my flight risks?"
highlight = (employee) => {
  return employee.flight_risk > 0.7 ? 'border-red-500 pulse' : ''
}

// Chat: "Show high performers"
highlight = (cell) => {
  return (cell.performance === 'High' && cell.potential === 'High') ||
         (cell.performance === 'High' && cell.potential === 'Medium')
    ? 'border-green-500 glow'
    : ''
}
```

### Integration with Workflows

**PERFORMANCE Workflow:**
```
User: "Sarah needs a development plan"
→ Workflow detects: PERFORMANCE
→ Context: DOC_EDITOR (Development Plan template)
→ Grid: Minimized but shows Sarah's current position
→ Chat: Generates plan using Sarah's data from grid
```

**COMPENSATION Workflow:**
```
User: "What should we pay a High-High engineer?"
→ Workflow detects: COMPENSATION
→ Context: ANALYTICS (compensation bands by performance tier)
→ Grid: Highlighted to show all High-High employees
→ Chat: "High-High engineers are currently paid $150-200K.
        Market rate is $180-220K. Consider adjustments for..."
```

---

## 🛠️ Technical Implementation

### Context State Management

```typescript
// State
type ContextState =
  | { type: 'doc'; docId: string; template: string }
  | { type: 'analytics'; metric: string; filters: Filters }
  | { type: 'performance_grid'; filters: GridFilters; highlight?: string }
  | { type: 'empty' }

// Provider
<ContextProvider initialState={{ type: 'empty' }}>
  <Dashboard />
</ContextProvider>

// Hook
const { context, setContext } = useContext()
```

### Message Handler with Context Detection

```typescript
async function handleMessage(message: string) {
  // 1. Detect workflow
  const workflow = detectWorkflow(message)

  // 2. Derive context from message + workflow
  const context = deriveContext(message, workflow)

  // 3. Update context panel
  setContext(context)

  // 4. Execute workflow with context awareness
  const response = await executeWorkflow(workflow, message, {
    currentContext: context
  })

  // 5. Return response + suggested actions
  return {
    response,
    actions: generateActions(workflow, context)
  }
}
```

### Grid Data Flow

```
employee_metrics table (SQLite)
         ↓
GET /api/analytics/nine-box
         ↓
useSWR hook (auto-refresh every 5min)
         ↓
NineBoxGridCompact component
         ↓
Filter by chat context (dept, cohort, etc.)
         ↓
Render + highlight based on query
```

### Performance Optimizations

1. **Lazy loading:** Context panels only render when active
2. **SWR caching:** Grid data cached client-side for 5min
3. **Virtual scrolling:** Employee lists in grid cells
4. **Debounced search:** 300ms delay on filter changes
5. **Memoization:** Cell rendering memoized by position

---

## 📊 Success Metrics

### Quantitative

- **Context switch time:** < 200ms
- **Grid render time:** < 500ms with 100 employees
- **Chat response time:** < 2s (unchanged)
- **Memory footprint:** < 50MB for all contexts loaded

### Qualitative

- **Single-page navigation:** Users never leave dashboard
- **Context awareness:** 95% accuracy in detecting correct panel
- **Conversation flow:** Seamless transitions between doc/analytics/grid
- **Discoverability:** Users discover grid without training

---

## 🎯 Example User Journeys

### Journey 1: Talent Review Preparation

```
1. User opens app → Helper Panel suggests "Show me talent grid"
2. User: "Show engineering talent"
   → Grid appears filtered to Engineering
3. User clicks "High-High" cell
   → Sees Sarah, James, Maria
4. User clicks Sarah
   → Chat: "Sarah is exceeding expectations in all areas..."
5. User: "Compare her comp to market"
   → Analytics panel shows compensation analysis
6. User: "Draft promotion letter"
   → Doc editor appears with promotion template
7. User edits, saves → Google Doc created + shared with manager
```

**Result:** Entire talent review workflow in ONE conversation, ONE page.

---

### Journey 2: Flight Risk Intervention

```
1. User sees insight: "3 employees are flight risks"
2. User: "Who are my flight risks?"
   → Grid appears with red highlights on cells
3. User hovers High-High cell with red border
   → Sees "John Smith - 85% flight risk"
4. User clicks John
   → Chat: "John is a high performer but engagement scores
           dropped 40% since manager change..."
5. User: "Draft retention plan for John"
   → Doc editor with retention plan template
   → Pre-filled with John's data from grid
6. User: "Schedule 1:1 with John next week"
   → Action executed: Calendar invite sent
```

**Result:** Proactive retention from insight → action in 6 steps.

---

### Journey 3: Succession Planning

```
1. User: "Create succession plan for VP Engineering"
   → Grid highlights High-High + Medium-High cells
2. User: "Show me their experience levels"
   → Analytics panel shows tenure + skill matrix
3. User clicks each candidate in grid
   → Chat provides detailed profiles
4. User: "Draft development plans for top 3"
   → Doc editor generates 3 development plans
   → Each synced to separate Google Docs
5. User: "Export succession matrix to Sheets"
   → Action executed: Google Sheet created with candidate data
```

**Result:** Complete succession plan from analysis → documentation → export.

---

## 🚀 Future Enhancements (Post-Phase 2)

### Advanced Context Types

- **Org Chart View:** For restructuring conversations
- **Timeline View:** For onboarding/offboarding checklists
- **Kanban View:** For hiring pipeline discussions
- **Comparison View:** Side-by-side employee comparisons

### AI-Suggested Contexts

```
User: "Sarah has been underperforming"
AI: "I notice you're discussing performance. Would you like me to:
     [Show 9-box grid] [Open PIP template] [View performance history]"
```

### Multi-Panel Mode

Allow power users to split context panel:
```
┌────────────┬──────────┬──────────┐
│    Chat    │   Grid   │  Editor  │
└────────────┴──────────┴──────────┘
```

---

## ✅ Implementation Checklist

### Week 1: Foundation
- [ ] Build ContextProvider state management
- [ ] Implement deriveContext detection logic
- [ ] Create ContextSwitcher component
- [ ] Add smooth transitions between states

### Week 2: Performance Grid
- [ ] Create NineBoxGridCompact component
- [ ] Wire to employee_metrics table
- [ ] Implement filter pipeline
- [ ] Add cell highlighting logic
- [ ] Build employee click handler

### Week 3: Integration
- [ ] Connect grid to chat (inject employee context)
- [ ] Add quick actions (retention plans, calibration)
- [ ] Implement keyboard shortcuts
- [ ] Add breadcrumb trail

### Week 4: Polish
- [ ] Performance optimizations
- [ ] Error states + loading skeletons
- [ ] Responsive design for smaller screens
- [ ] E2E tests for all contexts

### Week 5: Launch
- [ ] User testing with 5 beta testers
- [ ] Fix critical bugs
- [ ] Documentation + video demo
- [ ] Ship to production

---

**This is the future of HR software: conversational, context-aware, action-oriented.**
