# Restructuring Playbook

Step-by-step guide to reorganizations, mergers, acquisitions, and major org changes.

---

## Overview: When and Why to Reorganize

### Good Reasons to Reorganize

✅ **Business strategy changes**
- Pivot to new market/product → Need new structure to support it
- Example: Moving from B2C to B2B requires different sales org

✅ **Scaling pain**
- Teams too big (manager has 20 reports)
- Too many layers (decision takes 8 approvals)
- Unclear accountability (no one owns customer experience end-to-end)

✅ **Silos causing problems**
- Engineering and Sales don't talk
- Product teams duplicate work
- Customer complaints fall through cracks between teams

✅ **Merger or acquisition**
- Two companies becoming one → Need to integrate

✅ **Performance issues**
- Business unit consistently misses targets
- Root cause: structural (not people)

---

### Bad Reasons to Reorganize

❌ **New exec wants to "make their mark"**
- Change for change's sake
- Disrupts teams for no strategic reason

❌ **Copy another company's structure**
- "Let's organize like Google!" (but we're not Google)
- Structure must fit YOUR business, not someone else's

❌ **Avoid hard people decisions**
- Reorg to move underperformers around (instead of managing them out)
- Creates musical chairs, doesn't solve problem

❌ **React to single incident**
- One deal falls through → "We need to reorganize Sales!"
- Fix the root cause, don't blow up the org

**McKinsey research:** 50% of reorganizations fail to achieve their goals, usually because they're done for wrong reasons or poorly executed.

---

## The 8-Phase Reorg Process

### Timeline Overview

| Phase | Duration | Key Activities |
|-------|----------|---------------|
| **1. Diagnosis** | 2 weeks | Define the problem, gather data |
| **2. Design** | 2-3 weeks | Create new structure, get exec buy-in |
| **3. People Mapping** | 1-2 weeks | Map employees to new roles |
| **4. Communication Planning** | 1 week | Plan how to announce, who tells whom |
| **5. Pre-Announcement** | 1 week | Brief managers, prepare materials |
| **6. Announcement** | 1 day | CEO announces to company |
| **7. Transition** | 2-4 weeks | Teams move to new structure |
| **8. Monitor & Adjust** | 3-6 months | Track effectiveness, make tweaks |

**Total:** 8-12 weeks from decision to go-live

---

## Phase 1: Diagnosis (Weeks 1-2)

### Goal: Understand what's broken and why

---

### Step 1: Define the Problem

**Questions to answer:**
1. What's not working? (Be specific)
2. What evidence do we have? (Data, not opinions)
3. Is this a structural problem or a people problem?
4. What does success look like?

**Example:**

**Problem statement:**
_"Customer churn is 25% (industry avg: 15%). Root cause analysis shows customers are frustrated by lack of coordination between Sales (pre-sale) and Customer Success (post-sale). Sales promises features we don't have, CS doesn't know what was promised. Customers feel bait-and-switched."_

**Evidence:**
- Exit survey: 60% of churned customers cite "unmet expectations"
- Handoff SLA: Only 40% of customers get proper handoff from Sales → CS
- NPS: Sales-sourced customers have NPS 30, CS-sourced (renewals) have NPS 60

**Root cause:** Structural - Sales and CS report to different VPs, no shared accountability

**Success metric:** Reduce churn from 25% → 18% within 12 months by improving Sales ↔ CS collaboration

---

### Step 2: Gather Data

**Data to collect:**

**Quantitative:**
- Current org chart (spans of control, layers)
- Team performance metrics (revenue, retention, velocity, etc.)
- Employee survey data (engagement scores by team)
- Headcount growth projections

**Qualitative:**
- Interviews with 10-15 employees (VPs, managers, ICs)
- "What's working? What's not?"
- "If you could change one thing about the org, what would it be?"

---

### Step 3: Diagnose Root Cause

**Is this a structure problem or a people problem?**

| Symptom | Structure Problem | People Problem |
|---------|-------------------|----------------|
| **Sales and CS don't collaborate** | Sales and CS report to different VPs with different goals | Sales VP and CS VP have personal conflict |
| **Teams ship slowly** | 8 layers of approval, everyone has veto | Engineering Manager is weak, doesn't push back |
| **Unclear accountability** | No one owns end-to-end customer experience | Manager doesn't hold team accountable |

**If it's a people problem:** Coach, manage out, or replace the person. Don't reorganize.

**If it's a structure problem:** Proceed with reorg.

---

## Phase 2: Design New Structure (Weeks 3-5)

### Goal: Design org structure that solves the problem

---

### Step 1: Define Principles

**What matters most for our business?**

**Example principles:**
1. **Customer accountability:** Every customer has one owner (no handoffs)
2. **Speed:** Decisions made in <1 week (minimize layers)
3. **Collaboration:** Teams that need to work together sit under same leader

---

### Step 2: Explore Options

**Generate 2-3 structural options, evaluate trade-offs**

**Example: Solving Sales ↔ CS handoff problem**

**Option 1: Keep separate (status quo)**
```
CRO
├── VP Sales (owns new customer acquisition)
└── VP Customer Success (owns retention)
```
- ✅ **Pros:** Specialization, no change
- ❌ **Cons:** Handoff problem persists

**Option 2: Unified Go-to-Market**
```
CRO
└── VP Revenue Operations
    ├── Sales Team (acquisition)
    └── CS Team (retention)

One VP owns entire customer journey
```
- ✅ **Pros:** One owner, end-to-end accountability
- ❌ **Cons:** One VP needs to be expert in both sales AND CS (hard to find)

**Option 3: Account Teams (Divisional)**
```
CRO
├── Enterprise Accounts Team
│   ├── AEs (sales)
│   └── CSMs (customer success)
│   (Same team owns customer from sale → renewal)
│
└── SMB Accounts Team
    ├── AEs
    └── CSMs
```
- ✅ **Pros:** No handoff (AE and CSM work together), clear accountability
- ❌ **Cons:** Duplication (two sales orgs, two CS orgs)

---

### Step 3: Select Structure

**Decision criteria:**

| Criteria | Weight | Option 1 (Status Quo) | Option 2 (Unified VP) | Option 3 (Account Teams) |
|----------|--------|----------------------|---------------------|--------------------------|
| **Solves handoff problem** | 40% | 1/5 ❌ | 4/5 ✅ | 5/5 ✅ |
| **Speed of decisions** | 30% | 2/5 | 4/5 ✅ | 5/5 ✅ |
| **Talent availability** | 20% | 5/5 | 2/5 ❌ (hard to find) | 4/5 ✅ |
| **Cost** | 10% | 5/5 | 5/5 | 3/5 (duplication) |
| **Weighted Score** | | **2.3** | **3.7** | **4.6** ✅ |

**Decision:** **Option 3 (Account Teams)** scores highest

---

### Step 4: Draw New Org Chart

**New structure:**

```
CRO
├── VP Enterprise Accounts
│   ├── Enterprise AEs [10]
│   └── Enterprise CSMs [8]
│
├── VP SMB Accounts
│   ├── SMB AEs [15]
│   └── SMB CSMs [12]
│
└── VP Revenue Operations (shared services)
    ├── Sales Ops [3]
    ├── CS Ops [2]
    └── Pricing/Deal Desk [2]
```

**Reporting lines:**
- Account Executives report to VP Enterprise or VP SMB (not separate VP Sales)
- CSMs report to same VP (integrated with AEs)
- Ops teams shared across both (efficiency)

---

### Step 5: Get Executive Buy-In

**Present to CEO + exec team:**

**Deck outline:**
1. **Problem:** What's broken (data)
2. **Options:** 3 options considered
3. **Recommendation:** Option 3 (Account Teams)
4. **Trade-offs:** What we're giving up (cost)
5. **Success metrics:** How we'll measure (churn reduction)
6. **Timeline:** When it goes live

**Get sign-off before proceeding**

---

## Phase 3: People Mapping (Weeks 6-7)

### Goal: Map current employees to new roles

---

### Step 1: Identify Roles in New Structure

**New structure requires:**
- 2 VPs (Enterprise Accounts, SMB Accounts)
- 25 AEs (10 Enterprise, 15 SMB)
- 20 CSMs (8 Enterprise, 12 SMB)
- 7 Ops roles

**Total: 54 roles**

---

### Step 2: Map Current Employees

**Current structure:**
- 1 VP Sales (will become VP Enterprise Accounts)
- 1 VP CS (will become VP SMB Accounts)
- 25 AEs (all currently report to VP Sales)
- 20 CSMs (all currently report to VP CS)
- 7 Ops roles (no change)

**Mapping:**

| Current Role | Current Manager | New Role | New Manager |
|--------------|----------------|----------|-------------|
| VP Sales | CRO | VP Enterprise Accounts | CRO |
| VP CS | CRO | VP SMB Accounts | CRO |
| Enterprise AE (×10) | VP Sales | Enterprise AE | VP Enterprise Accounts |
| SMB AE (×15) | VP Sales | SMB AE | VP SMB Accounts |
| Enterprise CSM (×8) | VP CS | Enterprise CSM | VP Enterprise Accounts |
| SMB CSM (×12) | VP CS | SMB CSM | VP SMB Accounts |

**Changes:**
- **10 Enterprise AEs:** New manager (VP Enterprise)
- **8 Enterprise CSMs:** New manager (VP Enterprise)
- **15 SMB AEs:** New manager (VP SMB)
- **12 SMB CSMs:** New manager (VP SMB)

**No layoffs, no new hires needed** (clean reorg ✅)

---

### Step 3: Identify Gaps and Overlaps

**Gaps (new roles to hire):**
- None in this example

**Overlaps (redundant roles):**
- None in this example

**Complex example:**

**Scenario:** Merging two companies, both have VP Engineering

**Before merger:**
- Company A: VP Engineering (Alice)
- Company B: VP Engineering (Bob)

**After merger:**
- Need 1 VP Engineering
- **Gap:** Who gets the role? Alice or Bob?

**Options:**
1. **Alice becomes VP Engineering, Bob becomes Director** (demotion)
2. **Bob becomes VP Engineering, Alice becomes Director** (demotion)
3. **Create two VP roles: VP Backend (Alice), VP Frontend (Bob)** (split responsibilities)
4. **Hire external VP, Alice and Bob become Directors** (fresh start, but lose talent)

**Decision:** CEO decides based on performance, cultural fit

---

## Phase 4: Communication Planning (Week 8)

### Goal: Plan who tells whom, when, and how

---

### Communication Cascade

**Order matters - communicate in this sequence:**

**1. Exec Team (Day -7)**
- CEO informs exec team of decision
- Execs get details, answer questions
- Execs commit to supporting the change

**2. Managers (Day -3)**
- Execs inform all managers
- Managers learn: new structure, who they'll report to, who reports to them
- Managers prepare to tell their teams

**3. All Employees (Day 0)**
- CEO announces at all-hands + email
- Broad strokes: why, what's changing, timeline

**4. Individual 1:1s (Day 0-2)**
- Managers meet with each team member individually
- "Here's what changes for you specifically"

**5. Q&A / Office Hours (Day 1-7)**
- Leadership holds open Q&A sessions
- Employees can ask questions

---

### CEO Announcement Template

**Subject:** Organizational Update: New Customer-Focused Structure

**From:** CEO

**To:** All Employees

**Email:**

```
Hi team,

I'm writing to share an important organizational update.

**Why we're doing this:**

Over the past year, our customer churn has been 25% (industry avg: 15%). When we asked churned customers why they left, 60% said "unmet expectations" — Sales promised features we don't have, or Customer Success didn't know what was promised.

Root cause: Sales and CS are separate teams, no shared accountability for the customer.

**What's changing:**

We're moving from a functional structure to an **Account Team structure:**

**OLD:**
- VP Sales (owns new customer acquisition)
- VP CS (owns retention)
(Two separate teams, handoff at close)

**NEW:**
- VP Enterprise Accounts (owns Enterprise customers from sale → renewal)
  - Enterprise AEs + Enterprise CSMs (same team)

- VP SMB Accounts (owns SMB customers from sale → renewal)
  - SMB AEs + SMB CSMs (same team)

**What this means:**

- **For AEs:** You'll work closely with CSMs on the same team (no more handoff)
- **For CSMs:** You'll get involved in pre-sale, understand what was promised
- **For customers:** One team owns your experience end-to-end

**What's NOT changing:**

- No layoffs, no new hires
- Same role (AE or CSM)
- Same compensation, benefits, PTO

**Timeline:**

- Today: This announcement
- This week: 1:1s with your new manager
- Monday, March 1: New structure goes live

**Why this will work:**

Account teams own the customer journey from first call → renewal. No more handoffs, no more dropped balls. Shared accountability = better customer experience = lower churn.

**Questions:**

I know change is hard. Leadership will hold Q&A sessions this week:
- Tuesday 2pm PT: All-hands Q&A
- Wed-Fri: Open office hours (book time with your VP)

Thank you for your flexibility. This structure will help us hit our goal of <18% churn and $100M ARR.

— [CEO Name]
```

---

## Phase 5: Pre-Announcement (Week 9)

### Checklist: Week Before Go-Live

**Leadership Team:**
- [ ] Finalize new org chart
- [ ] Prepare FAQ document (anticipate questions)
- [ ] Rehearse messaging (CEO, VPs practice what they'll say)
- [ ] Book all-hands meeting for announcement

**Managers:**
- [ ] Inform all managers individually (before company announcement)
- [ ] Provide manager talking points ("Here's what to say to your team")
- [ ] Schedule time for managers to meet with their teams

**HR:**
- [ ] Update HRIS (new reporting lines, titles)
- [ ] Prepare new org chart visuals (for announcement deck)
- [ ] Draft employee FAQs

**Communications:**
- [ ] Draft CEO email (announcement)
- [ ] Create internal wiki page (new org chart, FAQs)
- [ ] Prepare Slack posts (#general, #ask-leadership)

---

## Phase 6: Announcement (Day 0)

### Timeline: Announcement Day

**9:00 AM: Manager Kickoff Call**
- All managers join
- CEO: "Today we're announcing the reorg. Here's what you tell your teams."
- Managers get final talking points

**10:00 AM: All-Hands Meeting**
- CEO presents new structure (slides)
- Explains why, what's changing, timeline
- Q&A (30 min)

**10:30 AM: CEO Email Sent**
- Email to entire company (same content as all-hands)
- Link to internal wiki with FAQs

**11:00 AM - 5:00 PM: Manager 1:1s**
- Every employee meets with their manager
- Manager: "Here's what changes for you specifically"

**5:00 PM: Slack AMA (Ask Me Anything)**
- CEO + VPs answer questions in #ask-leadership

---

### FAQ Document Template

**Q: Why are we doing this now?**
A: Customer churn is 25% (industry avg: 15%). Exit surveys show handoff between Sales and CS is broken. This structure fixes that.

**Q: Will I have a new manager?**
A: [Specific answer by team]
- Enterprise AEs and CSMs → VP Enterprise Accounts
- SMB AEs and CSMs → VP SMB Accounts
- Ops team → No change

**Q: Will my role/title change?**
A: No. If you're an AE today, you're still an AE. If you're a CSM, still a CSM.

**Q: Will my compensation change?**
A: No. Same salary, same commission plan, same equity.

**Q: Will there be layoffs?**
A: No. This is a reorg, not a reduction in force. Everyone has a role in the new structure.

**Q: When does this take effect?**
A: Monday, March 1. You'll start reporting to your new manager that day.

**Q: What if I don't like my new manager?**
A: Give it 90 days. If it's not working, talk to HR about options.

**Q: Can I switch from Enterprise to SMB (or vice versa)?**
A: We're assigning based on which accounts you currently manage. If you want to switch, talk to your VP after 6 months.

---

## Phase 7: Transition (Weeks 10-13)

### Week 1 (Go-Live Week)

**Monday (Day 1):**
- New reporting lines active in HRIS
- First 1:1s with new managers
- Team meetings with new teams

**Tuesday-Friday:**
- New managers onboard their teams
- Cross-functional kickoffs (Enterprise AEs meet Enterprise CSMs)

---

### Week 2-4 (Stabilization)

**Goals:**
- Teams settle into new structure
- New managers establish rhythm (1:1 cadence, team meetings)
- Address early issues

**Common issues:**

**Issue 1: Manager overwhelm**
- VP Enterprise now has 18 reports (10 AEs + 8 CSMs) → Too many

**Fix:** Add layer
- Promote Senior AE to Sales Manager (manages 10 AEs)
- Promote Senior CSM to CS Manager (manages 8 CSMs)
- VP now has 2 reports (much better)

**Issue 2: Confusion on decision rights**
- "Who decides pricing for Enterprise deals - me or my old manager?"

**Fix:** Clarify decision matrix (RACI)
- VP Enterprise Accounts: Approves all Enterprise deals >$100K
- AEs: Own deals <$100K

**Issue 3: Team morale dip**
- Employees miss their old manager
- Sentiment drops (normal)

**Fix:**
- Acknowledge it: "Change is hard. Give it time."
- Check in frequently: Extra 1:1s, pulse surveys
- Celebrate wins: First successful Enterprise → CS handoff in new structure

---

## Phase 8: Monitor & Adjust (Months 3-6)

### Goal: Measure if reorg achieved its goals

---

### Success Metrics (from Phase 1)

**Primary metric:**
- **Churn rate:** Target 25% → 18% within 12 months

**Leading indicators (track monthly):**
```
Month 1: Churn still 25% (too early to see impact)
Month 3: Churn 23% (slight improvement)
Month 6: Churn 20% (on track)
Month 12: Churn 18% ✅ (goal achieved)
```

**Process metrics:**
- **Handoff quality:** 40% → 80% of customers get proper Sales → CS handoff
- **Customer NPS:** Sales-sourced customers NPS 30 → 50

---

### Employee Sentiment Tracking

**Pulse survey (monthly):**

**Questions:**
1. "I understand the new org structure" (Track: Month 1 = 60%, Month 3 = 85% ✅)
2. "The reorg is helping us serve customers better" (Track: Month 1 = 50%, Month 6 = 75% ✅)
3. "I have what I need to be successful in my role" (Track: Month 1 = 65%, Month 3 = 70%)

**Red flag:** If scores don't improve by Month 3, investigate

---

### Common Adjustments (Months 3-6)

**Adjustment 1: Add manager layer**
- VPs have too many direct reports
- **Solution:** Promote senior ICs to managers

**Adjustment 2: Tweak reporting lines**
- Ops team reports to wrong VP
- **Solution:** Move Ops under different leader

**Adjustment 3: Merge teams**
- Two small teams (4 people each) → Combine into one 8-person team

---

## Special Case: Merger & Acquisition Integration

### M&A-Specific Challenges

**Challenge 1: Two of everything**
- Company A has VP Sales, Company B has VP Sales
- Who gets the role?

**Challenge 2: Culture clash**
- Company A is startup (flat structure)
- Company B is corporate (hierarchical)

**Challenge 3: Redundant functions**
- Both companies have Finance, HR, Legal
- Need to consolidate

---

### M&A Integration Process

**Phase 1: Day 1 Structure (Immediate)**
- Keep both companies' structures intact temporarily
- Announce: "For now, nothing changes. Integration planning starts next week."

**Phase 2: Integration Planning (Weeks 1-4)**
- Form integration team (execs from both companies)
- Design combined org structure
- Map people to roles (who stays, who goes)

**Phase 3: Announce & Execute (Weeks 5-8)**
- Announce combined structure
- Handle departures (layoffs, voluntary exits)
- Execute integration

**Phase 4: Cultural Integration (Months 3-12)**
- Merge cultures (shared values, norms)
- Cross-company team building

---

## Reorg Cheat Sheet

### DO's ✅

**✅ Start with the problem**
- What's broken? Why? What does success look like?

**✅ Design for the business, not for people**
- Structure should serve strategy (not protect jobs)

**✅ Communicate transparently**
- Why, what, when, how it affects each person

**✅ Give it time**
- Takes 3-6 months to stabilize
- Don't tweak every week

**✅ Measure success**
- Did we achieve the goal? Track metrics.

---

### DON'Ts ❌

**❌ Reorganize for wrong reasons**
- Don't copy Google's org chart
- Don't reorg to avoid hard people decisions

**❌ Surprise people**
- Managers should know before their teams
- No "Hey, you have a new boss starting Monday"

**❌ Over-communicate**
- 10 reorgs in 2 years = chaos
- Only reorg when necessary

**❌ Ignore morale**
- Change is hard. Acknowledge it.
- Provide support (extra 1:1s, Q&A sessions)

**❌ Declare victory too soon**
- Takes 6-12 months to see results
- Don't celebrate after Week 1

---

## Key Takeaways

1. **50% of reorgs fail** - Do it for the right reasons, execute well
2. **Communication is everything** - Transparent, frequent, cascading
3. **Plan for 8-12 weeks** - Don't rush (but don't drag out for months)
4. **Measure success** - Did you solve the problem?
5. **Give it time** - 3-6 months to stabilize

**Great reorgs = clear problem, well-designed structure, transparent communication, patient execution.**
