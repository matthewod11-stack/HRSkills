# HR Command Center - Implementation Roadmap

## Current State
✅ **UI/UX Complete** - Dark theme, chat interface, metrics dashboard, command palette
✅ **Architecture Built** - Integration layer, skills folder, agent templates
✅ **Chat Functional** - CPO persona embedded, responds to questions
✅ **Documentation** - Comprehensive HR capabilities loaded into chat

## What's NOT Working Yet
❌ Integrations are placeholders (not connected to real APIs)
❌ Metrics dashboard shows mock data
❌ Chat can't execute actions (generate docs, create records, etc.)
❌ Skills aren't dynamically loaded
❌ Agents can't be triggered from UI
❌ Command palette is static

---

## Phase 1: First Complete Workflow (2-3 days)
**Goal:** End-to-end HR document generation that demonstrates real value

### 1.1 Make Document Generation Work
**Priority: CRITICAL** | **Effort: Medium**

- [ ] Create `/api/generate-document` endpoint
- [ ] Load skill context from `skills/hr-document-generator/SKILL.md`
- [ ] Load reference materials (company voice, DEI standards, legal library)
- [ ] Implement multi-turn conversation (gather info → confirm → generate)
- [ ] Generate PDF/DOCX output
- [ ] Return downloadable document to chat

**Why First:**
- Immediate business value (replace manual doc writing)
- Shows AI capability
- Validates skills architecture
- No external API dependencies yet

### 1.2 Add Notion Integration for Document Storage
**Priority: HIGH** | **Effort: Low**

- [ ] Connect Notion client (real API key in `.env.local`)
- [ ] Create "HR Documents" database in Notion
- [ ] Save generated documents to Notion with metadata
- [ ] Return Notion link in chat

**Why Second:**
- Shows integration layer working
- Creates audit trail
- Easy to implement (Notion SDK is straightforward)

---

## Phase 2: Live Metrics Dashboard (1-2 days)
**Goal:** Replace mock metrics with real Rippling data

### 2.1 Connect Rippling API
**Priority: HIGH** | **Effort: Medium**

- [ ] Set up Rippling API credentials
- [ ] Test connection with `/integrations/rippling/client.ts`
- [ ] Implement real data fetch in `/api/metrics`
  - Headcount (total employees)
  - Turnover rate (calculate from hire/term dates)
  - Open positions (from ATS)
  - Time to fill (average days from post to accept)

### 2.2 Add Real-Time Data Refresh
**Priority: MEDIUM** | **Effort: Low**

- [ ] Add refresh button to metrics cards
- [ ] Implement SWR or React Query for auto-refresh
- [ ] Show last updated timestamp

**Why This Phase:**
- Validates integration architecture
- Shows live HR analytics
- Builds trust in data accuracy

---

## Phase 3: Actionable Chat (2-3 days)
**Goal:** Chat can execute workflows, not just answer questions

### 3.1 Function Calling Architecture
**Priority: HIGH** | **Effort: Medium**

- [ ] Add Claude function calling to `/api/chat`
- [ ] Define tools:
  - `generate_offer_letter`
  - `create_pip_document`
  - `schedule_interview` (Calendly integration)
  - `send_slack_message`
  - `create_notion_page`
- [ ] Implement tool execution logic
- [ ] Return results back to chat context

### 3.2 Dynamic Skill Loading
**Priority: MEDIUM** | **Effort: Low**

- [ ] Update chat UI to show available skills
- [ ] Load skill SKILL.md + references when selected
- [ ] Inject into system prompt dynamically
- [ ] Show active skill in chat header

**Why This Phase:**
- Makes chat actually DO things, not just talk
- Unlocks automation workflows
- Demonstrates integration power

---

## Phase 4: Agent Triggers (1-2 days)
**Goal:** Run Python agents from the UI

### 4.1 Agent Runner API
**Priority: MEDIUM** | **Effort: Medium**

- [ ] Create `/api/agents/run` endpoint
- [ ] Execute Python agents as child processes
- [ ] Stream logs back to UI
- [ ] Handle success/failure states

### 4.2 Command Palette Integration
**Priority: LOW** | **Effort: Low**

- [ ] Make command palette commands functional:
  - "Run New Hire Onboarding" → triggers agent
  - "Generate Report" → opens skill selector
  - "Schedule Interview" → opens Calendly modal
- [ ] Add keyboard shortcuts (already have ⌘K)

**Why This Phase:**
- Enables scheduled/triggered automation
- Shows agents in action
- Complete the automation picture

---

## Phase 5: Advanced Features (3-5 days)
**Goal:** Production-ready polish

### 5.1 Multi-User Support
- [ ] Add authentication (Clerk or NextAuth)
- [ ] User roles (admin, manager, employee)
- [ ] Permission-based access to features
- [ ] Audit logging

### 5.2 Workflow Builder
- [ ] Visual workflow designer
- [ ] Combine skills + agents into multi-step flows
- [ ] Save/load custom workflows
- [ ] Schedule recurring workflows

### 5.3 Analytics & Reporting
- [ ] Dashboard for document generation usage
- [ ] Agent execution history
- [ ] Cost tracking (Anthropic API usage)
- [ ] HR metrics trends over time

---

## Recommended Starting Point

**START HERE: Phase 1.1 - Document Generation**

Why this is the perfect first implementation:
1. **Immediate value** - Saves hours of manual work
2. **No external dependencies** - Works standalone
3. **Validates architecture** - Tests skills system
4. **Demonstrates AI** - Shows what makes this platform special
5. **Quick win** - Can demo in 2-3 days

### Quick Start Steps:
1. Create `/api/generate-document` route
2. Load `skills/hr-document-generator/SKILL.md`
3. Add conversation flow: ask questions → gather data → generate doc
4. Return markdown/PDF to user
5. Demo: "Generate an offer letter for a Senior Engineer"

Once document generation works, add Notion integration to show end-to-end workflow.

---

## Alternative Starting Point (If you have Rippling API access)

**START HERE: Phase 2 - Live Metrics**

If you already have Rippling credentials and want to show data integration first:
1. Test Rippling API connection
2. Fetch real headcount, turnover, openings
3. Update metrics dashboard to show live data
4. Add refresh capability

This shows "real HR system" immediately and validates your integration layer.

---

## Success Metrics

**Phase 1 Success:**
- User asks: "Generate offer letter for Alex Chen, Senior Engineer, $180k, start Jan 15"
- System responds with questions about details
- Generates professional offer letter
- Saves to Notion
- Returns download link

**Phase 2 Success:**
- Dashboard shows real headcount from Rippling
- Metrics update when data changes
- No more mock data

**Phase 3 Success:**
- User says: "Schedule interview with Sarah for next Tuesday at 2pm"
- System creates Calendly event
- Sends Slack notification
- Confirms in chat

**Full Platform Success:**
- HR team uses this daily instead of manual processes
- Documents generated in minutes, not hours
- Metrics dashboard is source of truth
- Workflows run automatically

---

## Questions to Answer Before Starting

1. **Do you have API access to:**
   - ✅ Anthropic (have key)
   - ❓ Rippling
   - ❓ Notion
   - ❓ Google Workspace
   - ❓ Slack
   - ❓ Calendly

2. **What's most valuable to implement first?**
   - Option A: Document generation (no external APIs needed)
   - Option B: Live metrics (requires Rippling)
   - Option C: Something else?

3. **What's the target timeline?**
   - MVP in 1 week?
   - Full platform in 1 month?
   - Production-ready in 3 months?

Let me know your priorities and I'll create detailed implementation tasks!
