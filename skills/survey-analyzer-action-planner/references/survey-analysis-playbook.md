# Survey Analysis Playbook

Step-by-step guide to analyzing employee survey data, from raw responses to actionable insights.

---

## Overview: The Survey Analysis Process

**The journey:**
```
Raw Survey Data → Clean Data → Calculate Metrics → Segment Analysis → Identify Trends → Root Cause Analysis → Prioritize Actions → Communicate Results
```

**Timeline:**
- **Week 1:** Close survey, export data, clean data
- **Week 2:** Calculate metrics, run segmentation analysis
- **Week 3:** Analyze open-ended comments, identify root causes
- **Week 4:** Draft action plan, prepare communication

**Output:**
- Executive summary (1-page)
- Detailed analysis deck (10-15 slides)
- Department/team-level reports
- Action plan

---

## Step 1: Export and Clean Data

### Exporting from Survey Platform

**What to export:**
- ✅ **Response data:** All individual responses (anonymized)
- ✅ **Metadata:** Employee department, tenure, level, manager, location
- ✅ **Timestamps:** When each response was submitted
- ✅ **Open-ended comments:** All text responses

**Export format:** CSV or Excel (easiest to analyze)

**Example export structure:**

| ResponseID | Department | Tenure | Level | Manager | Q1_OverallSat | Q2_eNPS | Q3_Manager | Q4_Career | Q5_OpenEnded |
|------------|------------|--------|-------|---------|---------------|---------|------------|-----------|--------------|
| R001 | Engineering | 2 years | IC | Sarah | 5 | 9 | 5 | 3 | "Need clearer career paths" |
| R002 | Sales | 6 months | IC | Tom | 4 | 8 | 4 | 4 | "Great onboarding!" |

---

### Data Cleaning Checklist

**1. Remove incomplete responses**

**Rule:** Exclude responses <50% complete (they skew results)

**Example:**
```
Total responses: 250
Complete (>50%): 235
Incomplete (<50%): 15

Remove 15 incomplete → Analyze 235 responses
```

---

**2. Check for duplicate responses**

**Why it happens:** Employee submits survey twice (refresh, browser issue)

**How to detect:** Look for duplicate ResponseIDs or identical submission patterns

**Action:** Keep first response, delete duplicates

---

**3. Validate metadata**

**Common issues:**
- ❌ Department field blank (employee's department not in HRIS)
- ❌ Manager field wrong (employee recently changed teams)
- ❌ Tenure field incorrect (HRIS data out of sync)

**Action:** Cross-check with HRIS, fix manually if needed

---

**4. Code open-ended responses**

**For analysis, tag each comment with themes:**

**Example:**
```
Comment: "I love my team but wish I had more growth opportunities"

Tags:
- Positive: Team collaboration
- Negative: Career development
```

**Common themes to tag:**
- Manager (positive/negative)
- Career development
- Workload/burnout
- Compensation
- Work-life balance
- Culture
- Tools/resources
- Specific initiatives (e.g., "new office policy")

**Tool:** Use Excel/Google Sheets, create columns for each theme, mark 1 (mentioned) or 0 (not mentioned)

---

## Step 2: Calculate Core Metrics

### Response Rate

**Formula:**
```
Response Rate = (Total Responses / Total Employees Invited) × 100%
```

**Example:**
```
Invited: 300 employees
Responded: 240 employees

Response Rate = (240 / 300) × 100% = 80% ✅ [Excellent]
```

**Benchmark:**
- 80%+: Excellent (high trust)
- 60-80%: Good
- 40-60%: Concerning (survey fatigue or low trust)
- <40%: Critical (employees don't believe surveys lead to action)

---

### Response Rate by Segment

**Why:** Low response rates in specific groups signal issues

**Example:**
```
Overall response rate: 75% ✅

By department:
- Engineering: 85% ✅
- Sales: 80% ✅
- Operations: 45% ❌ [RED FLAG]

Action: Investigate Operations - do they not trust surveys? Is manager discouraging participation?
```

---

### Engagement Score (% Favorable)

**For each question, calculate % favorable:**

**Formula:**
```
% Favorable = (# of "Agree" + "Strongly Agree") / Total Responses × 100%
```

**Example:**

**Question:** "I would recommend [Company] as a great place to work"

**Responses (n=200):**
- Strongly Agree: 80 (40%)
- Agree: 70 (35%)
- Neutral: 30 (15%)
- Disagree: 15 (7.5%)
- Strongly Disagree: 5 (2.5%)

**Calculation:**
```
Favorable = (80 + 70) / 200 = 150 / 200 = 75% ✅
Neutral = 30 / 200 = 15%
Unfavorable = (15 + 5) / 200 = 20 / 200 = 10%
```

**Interpretation:**
- 75% favorable is **GOOD** (benchmark: 70%+)
- 10% unfavorable is small but worth investigating (who are the detractors?)

---

### Overall Engagement Score

**Approach 1: Average all questions**

```
Company has 40 questions
Average % favorable across all 40 questions = 72% ✅
```

**Approach 2: Index of core questions**

Create engagement index from 5 core questions:
1. Overall satisfaction
2. eNPS (recommend as place to work)
3. Intent to stay
4. Pride in company
5. Alignment (understand how work contributes)

```
Average of 5 core questions = 68% favorable

This is your "Engagement Score" (track year-over-year)
```

---

### Employee Net Promoter Score (eNPS)

**Question:** "On a scale of 0-10, how likely are you to recommend [Company] as a great place to work?"

**Scoring:**
- **9-10:** Promoters (highly engaged)
- **7-8:** Passives (satisfied but not enthusiastic)
- **0-6:** Detractors (disengaged)

**Formula:**
```
eNPS = % Promoters - % Detractors
```

**Example:**
```
Responses (n=200):
- Promoters (9-10): 100 employees (50%)
- Passives (7-8): 60 employees (30%)
- Detractors (0-6): 40 employees (20%)

eNPS = 50% - 20% = +30
```

**Benchmark:**
- +50 to +100: Excellent (world-class)
- +10 to +50: Good
- -10 to +10: Needs improvement
- -100 to -10: Critical

**Interpretation:**
- eNPS of +30 is **GOOD** but not excellent
- 20% detractors (40 employees) is concerning - who are they? Why are they unhappy?

---

## Step 3: Segmentation Analysis

**Why segment?** Company-wide averages hide problems.

**Example:**
```
Company-wide engagement: 70% favorable ✅

Looks good! But...

By department:
- Engineering: 85% ✅
- Marketing: 75% ✅
- Sales: 72% ✅
- Operations: 40% ❌ [MAJOR PROBLEM HIDDEN]

Operations has 50 employees - this is a crisis masked by company average.
```

---

### Common Segmentation Cuts

**1. By Department**

**Why:** Different departments have different experiences (culture, managers, workload)

**How to analyze:**
```
Department        | Engagement | eNPS | Top Issue
------------------|------------|------|------------------
Engineering       | 80%        | +40  | Career development
Sales             | 75%        | +30  | Quota/comp fairness
Marketing         | 70%        | +20  | Budget/resources
Operations        | 50%        | -5   | Manager effectiveness ❌
```

**Insight:** Operations is dragging down company scores. Dig deeper - is it the manager? Workload? Resources?

---

**2. By Manager**

**Critical:** Manager quality is #1 driver of engagement

**Example:**
```
Manager      | Team Size | Engagement | Manager Effectiveness Q
-------------|-----------|------------|------------------------
Sarah (Eng)  | 12        | 90%        | 95% ✅
Tom (Sales)  | 8         | 80%        | 85% ✅
Linda (Ops)  | 15        | 45%        | 30% ❌ [RED FLAG]
```

**Insight:** Linda's team has 30% favorable on "Manager Effectiveness" - clear performance issue.

**Action:** Coach Linda (or move her off people management)

---

**3. By Tenure**

**Why:** New hires vs. tenured employees have different perspectives

**Example:**
```
Tenure         | Engagement | Top Issue
---------------|------------|--------------------
<6 months      | 85%        | Onboarding quality ✅
6-24 months    | 70%        | Career clarity
2-5 years      | 65%        | Growth opportunities
5+ years       | 75%        | Comp competitiveness
```

**Insight:** Mid-tenure employees (6mo-2yrs) score lowest - this is "the valley" where people question if they have a future at company.

**Action:** Create clear career paths, improve promotion process

---

**4. By Level**

**Example:**
```
Level               | Engagement | Top Issue
--------------------|------------|----------------------
IC (Individual)     | 68%        | Career growth
Manager             | 75%        | Workload (managing + IC work)
Senior Leader       | 85%        | Alignment (they're closer to strategy)
```

**Insight:** ICs feel stuck (68% engagement, career growth is top issue)

---

**5. By Location**

**Example (hybrid/remote):**
```
Location        | Engagement | Top Issue
----------------|------------|----------------------
Office (5 days) | 70%        | Commute/flexibility
Hybrid (2-3)    | 78%        | Collaboration tools
Fully remote    | 72%        | Isolation/belonging
```

---

### Creating Heat Maps

**Visual representation of scores by segment:**

**Example: Engagement by Department and Manager**

|                     | Engineering | Sales | Marketing | Operations |
|---------------------|-------------|-------|-----------|------------|
| **Overall Dept**    | 🟢 80%      | 🟢 75% | 🟡 70%     | 🔴 50%      |
| **Manager: Sarah**  | 🟢 90%      | -     | -         | -          |
| **Manager: Tom**    | -           | 🟢 80% | -         | -          |
| **Manager: Linda**  | -           | -     | -         | 🔴 45%      |
| **Manager: Alex**   | -           | -     | 🟡 70%     | -          |

**Legend:**
- 🟢 Green: 75%+ (strong)
- 🟡 Yellow: 60-74% (needs attention)
- 🔴 Red: <60% (critical)

**Insight:** Linda's Operations team is the clear outlier.

---

## Step 4: Identify Key Drivers

**Question:** What factors drive engagement most?

**Two approaches:**

---

### Approach 1: Correlation Analysis (Statistical)

**Goal:** Find which questions correlate most with overall engagement/eNPS

**Example:**

**Run correlation between each question and eNPS:**

| Question | Correlation to eNPS |
|----------|---------------------|
| "I have opportunities for career growth" | 0.75 (strong) |
| "My manager provides clear direction" | 0.72 (strong) |
| "I receive recognition for good work" | 0.65 (moderate) |
| "I have work-life balance" | 0.60 (moderate) |
| "The office space is comfortable" | 0.20 (weak) |
| "I am paid fairly" | 0.40 (weak-moderate) |

**Insight:**
- **Career growth** and **manager quality** are strongest drivers of engagement (0.75, 0.72)
- **Compensation** has weaker correlation (0.40) - throwing money won't fix engagement
- **Office space** barely matters (0.20)

**Action:** Prioritize career development and manager training (high-impact areas)

---

### Approach 2: Gap Analysis (Non-Statistical)

**Goal:** Find questions with lowest scores (biggest gaps)

**Example:**

**Sort all questions by % favorable (lowest to highest):**

| Rank | Question | % Favorable | Gap to Target (75%) |
|------|----------|-------------|---------------------|
| 1 | "I have opportunities for career growth" | 45% | -30 points ❌ |
| 2 | "The promotion process is fair" | 50% | -25 points ❌ |
| 3 | "I am paid fairly" | 55% | -20 points ❌ |
| 4 | "My workload is manageable" | 60% | -15 points 🟡 |
| 5 | "I trust leadership" | 65% | -10 points 🟡 |

**Insight:** Career growth and promotion process are bottom 2 scores.

**Action:** Focus action plan on career development and promotion transparency.

---

### Combining Both Approaches

**Prioritization matrix:**

|                        | High Impact (High Correlation) | Low Impact (Low Correlation) |
|------------------------|--------------------------------|------------------------------|
| **Low Score (Gap)**    | 🔴 **PRIORITY 1: Fix first** | 🟡 Nice to have (low urgency) |
| **High Score (Strength)** | 🟢 Protect (keep doing well) | ⚪ Maintain (no action needed) |

**Example:**

| Question | Score | Impact | Priority |
|----------|-------|--------|----------|
| Career growth | 45% | High (0.75 correlation) | 🔴 **PRIORITY 1** |
| Manager effectiveness | 85% | High (0.72 correlation) | 🟢 **Protect** (keep doing well) |
| Office comfort | 50% | Low (0.20 correlation) | 🟡 Nice to have (deprioritize) |

**Action plan:**
1. 🔴 Fix career growth (high impact, low score)
2. 🟢 Protect manager effectiveness (high impact, high score - don't break what works)
3. 🟡 Deprioritize office comfort (low impact)

---

## Step 5: Analyze Open-Ended Comments

**Most valuable data in survey = open-ended comments**

**Why:** Reveals the "why" behind scores

---

### Step-by-Step Comment Analysis

**1. Read ALL comments (yes, all of them)**

**Why:** You'll spot patterns humans catch that text analysis misses

**Time investment:** Budget 3-5 hours for 200-300 comments

---

**2. Thematic coding**

**Create tags for common themes:**

**Example tags:**
- Career development (lack of growth)
- Manager (positive)
- Manager (negative)
- Workload (burnout)
- Compensation (unfair)
- Recognition (lack of)
- Tools/resources (missing)
- Culture (positive)
- Culture (negative)
- Specific initiatives (e.g., RTO policy)

**As you read, tag each comment:**

| Comment | Tags |
|---------|------|
| "Love my team, but no career path" | Team+ / Career- |
| "Manager never gives feedback" | Manager- / Feedback- |
| "Great benefits, need better pay" | Benefits+ / Comp- |
| "Burned out, too much on my plate" | Workload- / Burnout |

---

**3. Count theme frequency**

**Example:**

| Theme | # Mentions | % of Comments |
|-------|------------|---------------|
| Career development (negative) | 75 | 38% ❌ [TOP ISSUE] |
| Workload/burnout | 50 | 25% ❌ |
| Manager (negative) | 40 | 20% ❌ |
| Compensation | 35 | 18% |
| Manager (positive) | 30 | 15% ✅ |
| Culture (positive) | 25 | 13% ✅ |

**Insight:** Career development mentioned in 38% of comments (by far the top issue)

---

**4. Segment comments by score**

**Compare what Promoters vs. Detractors say:**

**Promoters (eNPS 9-10):**
- "Love the mission and team"
- "Great manager, very supportive"
- "Exciting projects"

**Detractors (eNPS 0-6):**
- "No career path, feel stuck"
- "Workload is unsustainable"
- "Manager doesn't listen"

**Insight:** Detractors consistently mention lack of career growth and poor manager relationships.

---

**5. Pull representative quotes**

**For your executive summary and communications, include verbatim quotes (anonymized):**

**Example:**

**Theme: Career Development**

**Quotes:**
- _"I don't know what the next step in my career is here. There's no clear path."_
- _"I've been asking for promotion criteria for 6 months. Still no answer."_
- _"I love the company, but I'm going to leave if I don't see growth opportunities soon."_

**Why use quotes:** Makes data real (executives respond to emotion, not just numbers)

---

## Step 6: Root Cause Analysis

**Don't just identify problems - understand WHY they exist.**

---

### The 5 Whys Technique

**Example:**

**Problem:** Career development scored 45% favorable

**Why?**
1. "Employees don't see growth opportunities"
   **Why?**
2. "No clear career paths or promotion criteria"
   **Why?**
3. "We never documented career ladders"
   **Why?**
4. "Company grew fast, HR didn't keep up"
   **Why?**
5. "HR is under-resourced (1 HRBP for 300 employees)"

**Root cause:** HR capacity issue (not lack of will, but lack of resources)

**Solution:** Hire HR to build career frameworks OR give managers tools to create team-specific paths

---

### Focus Groups (Post-Survey)

**After analyzing data, run focus groups to dig deeper:**

**Format:**
- **Size:** 6-8 employees per session
- **Duration:** 60 minutes
- **Facilitator:** Neutral party (not their manager)
- **Questions:** Open-ended, based on survey themes

**Example focus group questions:**

**Theme: Career Development**
- "The survey showed career growth scored low. Why do you think that is?"
- "What would a good career development program look like to you?"
- "What's preventing you from growing in your role?"

**Output:** Qualitative insights to inform action plan

---

## Step 7: Create Executive Summary

**1-page summary for leadership:**

---

### Template: Survey Results Executive Summary

**Survey:** Annual Engagement Survey 2024
**Audience:** All employees (300 invited)
**Response Rate:** 240 responses (80%) ✅
**Survey Period:** Oct 1-15, 2024

---

#### Key Metrics

| Metric | Score | Benchmark | Status |
|--------|-------|-----------|--------|
| Overall Engagement | 70% favorable | 70%+ | ✅ Met |
| eNPS | +25 | +30+ | 🟡 Below target |
| Manager Effectiveness | 75% favorable | 75%+ | ✅ Met |
| Career Development | 45% favorable | 70%+ | ❌ Critical gap |

---

#### Top Strengths (Keep Doing)

1. **Manager Effectiveness** (75% favorable)
   _"My manager is supportive and gives clear direction"_

2. **Team Collaboration** (80% favorable)
   _"I work well with my team and feel included"_

3. **Company Mission** (78% favorable)
   _"I'm proud of the work we do"_

---

#### Top Opportunities (Action Needed)

1. **Career Development** (45% favorable) 🔴
   - 38% of comments mentioned lack of growth opportunities
   - Root cause: No clear career paths or promotion criteria
   - **Action:** Create career ladders, train managers on career conversations

2. **Workload/Burnout** (60% favorable) 🟡
   - 25% of comments mentioned unsustainable workload
   - Root cause: Headcount hasn't kept up with growth
   - **Action:** Hiring plan + workload audit

3. **Compensation Transparency** (55% favorable) 🟡
   - Employees don't understand how pay is determined
   - **Action:** Publish compensation philosophy, create pay bands

---

#### Segmentation Insights

**By Department:**
- Engineering: 80% engagement ✅
- Sales: 75% ✅
- Marketing: 70% ✅
- **Operations: 50%** ❌ [Requires urgent attention]

**By Manager:**
- Linda's team (Operations): 45% engagement, 30% manager effectiveness ❌
  **Action:** Manager coaching + team focus group

---

#### Next Steps

1. **Week 1:** Share results with leadership, prioritize actions
2. **Week 2:** Build action plan (career development, workload, comp transparency)
3. **Week 3:** Communicate results + action plan to all employees
4. **Q1 2025:** Implement action plan
5. **Q2 2025:** Pulse survey to measure progress

---

## Step 8: Create Detailed Analysis Deck

**10-15 slide presentation for broader leadership:**

**Slide structure:**

1. **Slide 1:** Title + Key Metrics Summary
2. **Slide 2:** Response Rate (overall + by segment)
3. **Slide 3:** Overall Engagement Score (trend over time if available)
4. **Slide 4:** eNPS (distribution: Promoters/Passives/Detractors)
5. **Slide 5:** Top Strengths (highest scoring questions)
6. **Slide 6:** Top Opportunities (lowest scoring questions)
7. **Slide 7:** Engagement by Department (heat map)
8. **Slide 8:** Engagement by Manager (anonymized if <10 reports)
9. **Slide 9:** Key Drivers Analysis (correlation or gap analysis)
10. **Slide 10:** Open-Ended Themes (word cloud + top themes)
11. **Slide 11:** Representative Quotes (by theme)
12. **Slide 12:** Root Cause Analysis (for top 2-3 issues)
13. **Slide 13:** Recommended Actions (prioritized)
14. **Slide 14:** Action Plan Timeline
15. **Slide 15:** Next Steps + Communication Plan

---

## Step 9: Create Team-Level Reports

**For each manager, provide:**

**1. Team Summary**
- Team response rate
- Team engagement score vs. company average
- Team eNPS

**2. Team Strengths**
- Top 3 questions where team scored highest

**3. Team Opportunities**
- Top 3 questions where team scored lowest

**4. Team Comments**
- Anonymized comments from team members (if >5 responses)

**5. Suggested Actions**
- 2-3 recommended actions based on team data

---

**Example Team Report:**

**Manager:** Sarah (Engineering Team)
**Team Size:** 12 employees
**Response Rate:** 12/12 (100%) ✅

---

**Team Engagement:** 90% favorable (vs. 70% company average) ✅

**Team eNPS:** +60 (vs. +25 company average) ✅

---

**Team Strengths:**

1. "My manager provides clear direction" (100% favorable)
2. "I feel supported by my team" (95% favorable)
3. "I have the tools I need" (92% favorable)

---

**Team Opportunities:**

1. "I have opportunities for career growth" (58% favorable)
2. "I am paid fairly" (67% favorable)
3. "My workload is manageable" (75% favorable)

---

**What Your Team Said (Anonymized):**

_"Sarah is an amazing manager - clear, supportive, always available."_

_"Love my team, but unclear where my career goes from here."_

_"Wish I had more time for deep work (too many meetings)."_

---

**Suggested Actions:**

1. **Career Development:** Discuss career paths in 1:1s, create growth plan for each team member
2. **Compensation:** Ensure team is paid competitively (review with People team)
3. **Workload:** Audit meeting load, identify what can be cut or delegated

---

## Common Pitfalls to Avoid

**1. Analyzing too soon**

❌ **Don't:** Close survey Friday, present results Monday (you'll miss issues)

✅ **Do:** Take 2-3 weeks to thoroughly analyze, find root causes

---

**2. Hiding bad news**

❌ **Don't:** Only share positive results ("We scored 70%! Great job!")

✅ **Do:** Be transparent about gaps ("Career development is a problem. Here's our plan to fix it.")

---

**3. Segmenting with <5 responses**

❌ **Don't:** Show "Linda's team: 45% engagement (n=3)" (not statistically valid, breaks anonymity)

✅ **Do:** Only show segments with 5+ responses

---

**4. Analysis paralysis**

❌ **Don't:** Spend 6 weeks perfecting analysis (employees forget they even took survey)

✅ **Do:** 80/20 rule - get to insights quickly, communicate fast

---

**5. No action plan**

❌ **Don't:** Share results without actions ("Thanks for your feedback!" then nothing happens)

✅ **Do:** Always pair results with action plan ("Here's what we heard. Here's what we're doing.")

---

## Tools for Survey Analysis

**Excel/Google Sheets:**
- **Pros:** Free, flexible, everyone knows how to use
- **Cons:** Manual work, limited visualization

**Survey Platform Analytics (Qualtrics, Culture Amp, Glint):**
- **Pros:** Built-in dashboards, auto-segmentation, benchmarking
- **Cons:** Expensive, less customizable

**Tableau/Power BI:**
- **Pros:** Advanced visualization, interactive dashboards
- **Cons:** Requires technical skill, expensive

**Recommendation:** Start with Excel for small companies (<200 employees), invest in survey platform analytics at scale.

---

## Key Takeaways

1. **Clean your data first** - Garbage in, garbage out
2. **Segment ruthlessly** - Company averages hide problems
3. **Find key drivers** - Focus on what actually moves engagement (not pet projects)
4. **Read all comments** - Qualitative data reveals the "why"
5. **Do root cause analysis** - Don't just identify problems, understand why they exist
6. **Communicate fast** - Don't let survey results sit for months
7. **Always pair results with action plan** - Surveys without action destroy trust

**Great analysis = actionable insights delivered fast.**
