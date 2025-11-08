# Skills & Agents First - Implementation Plan

## Philosophy
Build the AI automation layer **without** requiring live integrations. Use mock data and local file storage to validate workflows, then plug in real APIs later.

---

## Phase 1: Document Generation Skill (Day 1-2)
**Goal:** End-to-end document generation from chat

### 1.1 Core Document Generation
- [ ] Create `/api/skills/generate-document` endpoint
- [ ] Load HR document generator skill dynamically
- [ ] Implement conversation flow:
  ```
  User: "Generate an offer letter"
  Bot: "What's the candidate's name?"
  User: "Alex Chen"
  Bot: "What position?"
  User: "Senior Engineer"
  Bot: "What's the salary?"
  User: "$180,000"
  Bot: "Start date?"
  User: "January 15, 2025"
  Bot: [generates professional offer letter using company voice + legal language]
  ```
- [ ] Return formatted markdown document
- [ ] Add download as PDF/DOCX option

### 1.2 Document Types
Implement templates for:
- [ ] Offer letters (standard, executive, contractor)
- [ ] Performance Improvement Plans (PIPs)
- [ ] Termination letters (voluntary, involuntary, layoff)
- [ ] Promotion letters
- [ ] Reference letters

### 1.3 Quality Controls
- [ ] Use DEI language standards reference
- [ ] Apply legal language library for compliance
- [ ] Follow company voice guidelines
- [ ] State-specific variations (CA, NY, etc.)

**Demo Ready:** User can generate any HR document through chat in 2-3 minutes

---

## Phase 2: Multi-Skill Chat Architecture (Day 3-4)
**Goal:** Chat can handle different HR skills dynamically

### 2.1 Skill Selector
- [ ] Update chat UI to show available skills dropdown
- [ ] Skills list:
  - HR Document Generator
  - Interview Guide Creator
  - Job Description Writer
  - Performance Review Assistant
  - Compensation Benchmarking
  - Employee Handbook Generator

### 2.2 Dynamic Context Loading
- [ ] When skill selected, load its SKILL.md file
- [ ] Load all reference materials in `/references/` folder
- [ ] Inject into system prompt
- [ ] Show active skill in chat header with icon

### 2.3 Skill Switching
- [ ] Allow mid-conversation skill switches
- [ ] Maintain context: "I need an offer letter for the candidate we just discussed"
- [ ] Clear context when needed: "Start fresh"

**Demo Ready:** Switch between skills seamlessly, each with specialized knowledge

---

## Phase 3: Create More Skills (Day 5-7)
**Goal:** Build a library of useful HR skills

### New Skills to Build:

#### 3.1 Interview Guide Creator
`skills/interview-guide-creator/`
- [ ] SKILL.md with interview best practices
- [ ] References: behavioral questions library, technical questions, culture fit questions
- [ ] Generate custom interview guides by role
- [ ] Include scoring rubrics
- [ ] STAR method coaching

#### 3.2 Job Description Writer
`skills/job-description-writer/`
- [ ] SKILL.md with JD best practices
- [ ] References: level frameworks (IC1-IC6, M1-M3), industry benchmarks
- [ ] Generate compelling, accurate JDs
- [ ] Check for bias language
- [ ] Include realistic requirements

#### 3.3 Performance Review Assistant
`skills/performance-review-assistant/`
- [ ] SKILL.md with feedback frameworks
- [ ] References: SBI model, growth mindset language, examples library
- [ ] Help managers write constructive reviews
- [ ] Convert bullet points → professional feedback
- [ ] Calibration suggestions

#### 3.4 Compensation Benchmarking
`skills/compensation-benchmarking/`
- [ ] SKILL.md with comp philosophy
- [ ] References: salary ranges by level/role, equity guidelines, benefits packages
- [ ] Mock data: tech salaries by city/role/level
- [ ] Provide competitive offers
- [ ] Total comp calculator

#### 3.5 Employee Handbook Generator
`skills/employee-handbook-generator/`
- [ ] SKILL.md with handbook structure
- [ ] References: policy templates, legal requirements, culture examples
- [ ] Generate sections: values, benefits, PTO, code of conduct, etc.
- [ ] State-specific compliance
- [ ] Startup-friendly tone

**Demo Ready:** 6+ specialized HR skills, each with deep domain knowledge

---

## Phase 4: Agent Framework (Day 8-10)
**Goal:** Run automated workflows from UI

### 4.1 Agent Runner API
- [ ] Create `/api/agents/trigger` endpoint
- [ ] List available agents dynamically
- [ ] Run Python agents as background processes
- [ ] Stream execution logs to UI
- [ ] Handle success/failure/timeout states
- [ ] Store execution history

### 4.2 Mock Data Agents
Since we don't have Rippling yet, create agents that work with mock data:

#### Mock Employee Database Agent
`agents/employee-database-mock/`
- [ ] Create `employees.json` with 50 fake employees
- [ ] Agent syncs "changes" (simulated hires/terms/updates)
- [ ] Logs what it would do with real Rippling API
- [ ] Updates local metrics

#### Document Generation Agent
`agents/bulk-document-generator/`
- [ ] Input: CSV of data (new hires, promotions, etc.)
- [ ] Output: Batch of documents
- [ ] Use skills for generation
- [ ] Save to local `/generated-docs/` folder

#### Onboarding Checklist Agent
`agents/onboarding-checklist/`
- [ ] For new hire (from mock data), create checklist
- [ ] Generate welcome email draft
- [ ] Create 30-60-90 day plan
- [ ] Mock "sending" notifications

### 4.3 Agent UI
- [ ] Command palette: "Run Agent" option
- [ ] Select agent from list
- [ ] Show parameters (if needed)
- [ ] Real-time log output
- [ ] Completion notification

**Demo Ready:** Trigger agents from UI, watch them execute, see results

---

## Phase 5: Advanced Skill Features (Day 11-14)
**Goal:** Make skills more powerful and useful

### 5.1 Multi-Document Workflows
- [ ] "Generate complete new hire packet"
  - Offer letter
  - Welcome email
  - First day agenda
  - Benefits overview
  - Equity grant letter
- [ ] "Manager toolkit for performance review season"
  - Review templates
  - 1:1 guides
  - Promotion packets
  - Calibration worksheets

### 5.2 Skill Memory & Learning
- [ ] Save generated documents to local storage
- [ ] Learn from user edits/feedback
- [ ] Build company-specific examples library
- [ ] "This is how we usually word promotions" context

### 5.3 Prompt Engineering Lab
- [ ] `/skills/[skill-name]/prompts/` folder
- [ ] Version different system prompts
- [ ] A/B test outputs
- [ ] Iterate on quality

### 5.4 Validation Layer
- [ ] Check generated docs for:
  - Missing required fields
  - Bias language
  - Legal compliance issues
  - Tone consistency
- [ ] Show warnings before finalizing

**Demo Ready:** Production-quality document generation with validation

---

## Phase 6: Skill Marketplace Prep (Day 15+)
**Goal:** Make skills shareable and extensible

### 6.1 Skill Package Format
```
skills/
  [skill-name]/
    SKILL.md          # Core instructions
    README.md         # User-facing documentation
    references/       # Knowledge base
    examples/         # Sample inputs/outputs
    prompts/          # Tested prompt variations
    schema.json       # Input/output structure
```

### 6.2 Skill Testing Framework
- [ ] Unit tests for each skill
- [ ] Example conversations that should succeed
- [ ] Quality checks (no bias, proper legal language, etc.)
- [ ] Automated testing in CI/CD

### 6.3 Skill Contribution Guide
- [ ] Template for new skills
- [ ] How to add reference materials
- [ ] Prompt engineering best practices
- [ ] Testing requirements

**Demo Ready:** Anyone can create a new skill following the framework

---

## Recommended: START HERE

### Week 1 Sprint: Core Document Generation

**Day 1:** Basic document generation working
- Generate offer letters through chat
- Use existing skill files
- Return markdown output

**Day 2:** Add document types and polish
- PIPs, termination letters, promotions
- PDF download
- Apply company voice + legal language

**Day 3-4:** Multi-skill architecture
- Skill selector UI
- Dynamic loading
- Switch between skills

**Day 5:** Add one more skill (Interview Guide or Job Description)
- Proves architecture scales
- More useful workflows

**End of Week Demo:**
- Generate 5 types of HR documents
- Switch between 2-3 different skills
- Professional quality output
- No external APIs needed

### Week 2 Sprint: Agents + More Skills

**Day 6-7:** Create 2-3 more skills

**Day 8-10:** Agent framework with mock data

**Day 11-14:** Advanced features and polish

---

## Success Metrics

### Phase 1 Success:
```
User: "I need an offer letter"
Bot: [gathers info through conversation]
Bot: [generates professional offer letter with correct legal language]
User: Downloads PDF
Time: 3 minutes (vs 30 minutes manual)
```

### Phase 3 Success:
- 5+ production-ready skills
- Can generate any common HR document
- Quality matches or exceeds manual drafts
- CPO persona consistently applied

### Phase 4 Success:
- Trigger agent from command palette
- Watch real-time execution logs
- Agent completes workflow
- Results saved/displayed

### Overall Success:
- HR team prefers using chat over manual doc writing
- Documents are legally sound and professionally written
- New skills can be added in 1-2 hours
- Ready to plug in real APIs when available

---

## What to Build First?

**My recommendation: Start with Phase 1 (Document Generation)**

Why:
1. Uses existing skill structure
2. Immediate productivity value
3. No external dependencies
4. Can demo quickly
5. Validates the core concept

Once that's solid, add more skills (Phase 3) to prove the architecture scales, THEN build the agent framework (Phase 4).

---

## Next Steps

Want me to:
1. **Implement Phase 1 now** - Build the document generation endpoint and chat flow?
2. **Create more skill templates** - Write SKILL.md files for 3-4 new skills?
3. **Build the agent runner** - Create the framework to trigger Python agents from UI?
4. **Something else?**

Let me know which direction and I'll start building!
