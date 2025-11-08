# DEI Metrics Dashboard

Track diversity, equity, and inclusion progress with measurable KPIs and OKRs.

---

## Why Measure DEI?

**You can't improve what you don't measure.**

**Common mistakes:**
- ❌ "We care about diversity" (but no data to prove it)
- ❌ "We're making progress" (but no baseline or targets)
- ❌ "DEI is a priority" (but no accountability or metrics)

**Best practice:**
- ✅ Track specific metrics (representation, pay equity, retention, inclusion)
- ✅ Set targets and deadlines ("40% women engineers by 2026")
- ✅ Review quarterly with leadership
- ✅ Tie to executive compensation (optional but powerful)

---

## The 4 Categories of DEI Metrics

### 1. Representation Metrics

**What:** Who's in the company (headcount by demographics)

### 2. Pay Equity Metrics

**What:** Are people paid fairly for the same work?

### 3. Retention & Mobility Metrics

**What:** Who's staying, who's leaving, who's getting promoted?

### 4. Inclusion Metrics

**What:** Do employees feel like they belong? (from surveys)

---

## Category 1: Representation Metrics

### Overall Workforce Composition

**Track:**
- % of total workforce by gender
- % of total workforce by race/ethnicity
- % of total workforce by other dimensions (veterans, disabilities, LGBTQ+, neurodiversity)

**Example Dashboard:**

| Demographic | Current % | Target % (2026) | Change |
|-------------|-----------|-----------------|--------|
| Women | 35% | 45% | ↑ 10pp |
| Men | 64% | 54% | ↓ 10pp |
| Non-binary | 1% | 1% | → |
| **Race/Ethnicity** |
| White | 60% | 50% | ↓ 10pp |
| Black | 8% | 12% | ↑ 4pp |
| Hispanic/Latino | 12% | 15% | ↑ 3pp |
| Asian | 18% | 20% | ↑ 2pp |
| Other/Multiracial | 2% | 3% | ↑ 1pp |

**pp = percentage points**

---

### Representation by Function

**Track representation in each department:**

| Department | Women % | URM % | Target Women % | Target URM % |
|------------|---------|-------|----------------|--------------|
| Engineering | 25% | 15% | 35% | 25% |
| Product | 40% | 20% | 50% | 30% |
| Sales | 45% | 25% | 50% | 30% |
| Marketing | 55% | 30% | 55% | 35% |
| Operations | 50% | 20% | 50% | 25% |
| Leadership (VP+) | 30% | 10% | 40% | 20% |

**URM = Underrepresented Minorities (Black, Hispanic, Native American, Pacific Islander)**

---

### Representation by Level

**Track:** % women and URM at each level

| Level | Total Employees | Women % | URM % |
|-------|----------------|---------|-------|
| IC1-2 (Junior) | 150 | 40% | 30% |
| IC3-4 (Mid) | 200 | 35% | 25% |
| IC5-6 (Senior) | 100 | 30% | 20% |
| Manager (M3-4) | 50 | 35% | 15% |
| Director (M5) | 20 | 30% | 10% |
| VP (M6+) | 10 | 20% | 5% |

**Problem:** Representation decreases at senior levels (the "leaky pipeline")

**Solution:** Focus on retention and promotion of women/URM at mid-senior levels

---

### New Hire Diversity

**Track:** % of new hires by demographics (vs. overall workforce %)

**Goal:** New hires should be MORE diverse than current workforce (to shift overall composition)

**Example:**

| Demographic | Current Workforce % | New Hires % (Q1 2025) | Target New Hires % |
|-------------|---------------------|----------------------|-------------------|
| Women | 35% | 42% | ✅ 45%+ |
| URM | 20% | 28% | ✅ 30%+ |

**If new hires < current workforce %**, you're moving backward.

---

## Category 2: Pay Equity Metrics

### Unexplained Pay Gap

**What it is:** The average salary difference between demographic groups AFTER controlling for legitimate factors (performance, tenure, experience, location, role).

**Formula:**

```
Unexplained Pay Gap = Average(Actual Salary - Predicted Salary)
```

**Predicted Salary** = Salary based on regression analysis (performance, tenure, experience, education)

**Example:**

| Demographic | Average Gap | % Below Predicted |
|-------------|------------|-------------------|
| Women | -$6,500 | 65% |
| Men | +$3,200 | 35% |
| **Total Gap** | **$9,700** | |

**Interpretation:** Women are paid $9,700 less than men on average, after controlling for performance, tenure, and experience.

**Benchmark:**
- **< 2%:** Excellent (minimal gap)
- **2-5%:** Acceptable (work to reduce)
- **5-10%:** Concerning (remediate ASAP)
- **> 10%:** Critical (legal risk, immediate action)

---

### Compa-Ratio by Demographic

**Compa-Ratio** = Actual Salary ÷ Midpoint of Salary Range

**Goal:** Compa-ratio should be similar across demographics

**Example:**

| Demographic | Average Compa-Ratio |
|-------------|---------------------|
| Women | 0.95 |
| Men | 1.02 |

**Interpretation:** Women are paid 5% below range midpoint, men are paid 2% above. **Potential pay inequity.**

---

### Promotion Salary Increases by Demographic

**Track:** Are promotion bumps equitable?

**Example:**

| Demographic | Average Promotion Increase |
|-------------|---------------------------|
| Women | 12% |
| Men | 15% |

**Problem:** Men get larger promotion bumps than women.

**Solution:** Set standardized promotion increase guidelines (see `promotion-guidelines.md`)

---

## Category 3: Retention & Mobility Metrics

### Attrition Rate by Demographic

**Formula:**

```
Attrition Rate = (# of Departures / Average Headcount) × 100
```

**Track by:**
- Gender
- Race/ethnicity
- Tenure (0-1 yr, 1-3 yr, 3+ yr)
- Level
- Department

**Example:**

| Demographic | Attrition Rate | Company Avg | Concern? |
|-------------|---------------|-------------|----------|
| Women | 18% | 15% | ⚠️ Yes (3pp higher) |
| Men | 14% | 15% | ✅ No |
| URM | 22% | 15% | 🚨 Yes (7pp higher) |
| White | 13% | 15% | ✅ No |

**Red flag:** URM attrition is 7 percentage points higher than average.

**Action:** Conduct exit interviews, analyze themes, address root causes.

---

### Voluntary vs. Involuntary Attrition

**Track separately:**
- **Voluntary:** Employee chose to leave
- **Involuntary:** Termination, layoff, PIP

**Why it matters:** High voluntary attrition = retention problem. High involuntary attrition = performance or bias in firing decisions.

**Example:**

| Demographic | Voluntary | Involuntary |
|-------------|-----------|-------------|
| Women | 15% | 3% |
| Men | 12% | 2% |

**Problem:** Women have higher voluntary attrition (leaving on their own).

**Solution:** Conduct stay interviews, improve inclusion, address pay equity.

---

### Promotion Rate by Demographic

**Formula:**

```
Promotion Rate = (# Promoted / # Eligible) × 100
```

**Track by:**
- Gender
- Race/ethnicity
- Department

**Example:**

| Demographic | Promotion Rate | Company Avg | Concern? |
|-------------|---------------|-------------|----------|
| Women | 8% | 10% | ⚠️ Yes (2pp lower) |
| Men | 11% | 10% | ✅ No |
| URM | 6% | 10% | 🚨 Yes (4pp lower) |
| White | 12% | 10% | ✅ No |

**Problem:** Women and URM are promoted at lower rates.

**Action:** Audit promotion process for bias, set promotion targets, train managers.

---

### Internal Mobility

**Track:** % of employees who moved to a new role internally (lateral or promotion)

**Why it matters:** Internal mobility = career growth opportunities

**Example:**

| Demographic | Internal Mobility Rate |
|-------------|------------------------|
| Women | 12% |
| Men | 15% |

**Problem:** Women have fewer internal mobility opportunities.

**Solution:** Encourage managers to support internal transfers, create internal job board.

---

## Category 4: Inclusion Metrics

**Source:** Employee engagement surveys (quarterly or annual)

### Sense of Belonging

**Survey Question:**
> "I feel like I belong at [Company]." (Agree / Neutral / Disagree)

**Track by demographic:**

| Demographic | % Agree | Company Avg | Concern? |
|-------------|---------|-------------|----------|
| Women | 68% | 75% | ⚠️ Yes (7pp lower) |
| Men | 78% | 75% | ✅ No |
| URM | 62% | 75% | 🚨 Yes (13pp lower) |
| White | 80% | 75% | ✅ No |

**Problem:** URM employees feel significantly less belonging.

**Action:** Launch ERGs, address microaggressions, improve psychological safety.

---

### Psychological Safety

**Survey Question:**
> "I feel safe speaking up and sharing my opinions at work." (Agree / Neutral / Disagree)

**Example:**

| Demographic | % Agree |
|-------------|---------|
| Women | 65% |
| Men | 72% |

**Problem:** Women feel less safe speaking up.

**Action:** Train managers on inclusive meeting facilitation, punish interruptions/dismissive behavior.

---

### Career Growth Perception

**Survey Question:**
> "I see a clear path for career growth at [Company]." (Agree / Neutral / Disagree)

**Example:**

| Demographic | % Agree |
|-------------|---------|
| Women | 55% |
| Men | 68% |

**Problem:** Women don't see clear career path.

**Action:** Offer mentorship, transparent promotion criteria, sponsor high-potential women.

---

### Fairness of Pay

**Survey Question:**
> "I believe I'm paid fairly for my role and contributions." (Agree / Neutral / Disagree)

**Example:**

| Demographic | % Agree |
|-------------|---------|
| Women | 48% |
| Men | 62% |

**Problem:** Women don't feel paid fairly.

**Action:** Conduct pay equity audit, communicate results, remediate gaps.

---

## Sample DEI OKRs (Objectives & Key Results)

### Objective 1: Increase Engineering Diversity

**Key Results:**
- **KR1:** 40% of engineering new hires are women (up from 25%)
- **KR2:** 30% of engineering new hires are URM (up from 15%)
- **KR3:** Launch "Women in Tech" ERG with 50+ members

---

### Objective 2: Close Gender Pay Gap

**Key Results:**
- **KR1:** Conduct pay equity audit and identify all gaps > $5K
- **KR2:** Remediate 100% of identified gaps within 6 months
- **KR3:** Achieve < 2% unexplained gender pay gap by year-end

---

### Objective 3: Improve URM Retention

**Key Results:**
- **KR1:** Reduce URM attrition to < 15% (down from 22%)
- **KR2:** 70% of URM employees report "I feel like I belong" in engagement survey (up from 62%)
- **KR3:** Launch Black Employee Network ERG with 30+ members

---

### Objective 4: Increase Women in Leadership

**Key Results:**
- **KR1:** 40% of director+ promotions go to women (up from 30%)
- **KR2:** Launch women's leadership development program with 20 participants
- **KR3:** 100% of senior leaders complete inclusive leadership training

---

## DEI Dashboard Template (Quarterly Review)

**Use this template for quarterly board/exec presentations:**

```markdown
# DEI Dashboard - Q[X] 20XX

## 1. Representation

### Overall Workforce
- Women: [X%] (Target: [Y%]) [↑/↓ Zpp vs. last quarter]
- URM: [X%] (Target: [Y%]) [↑/↓ Zpp vs. last quarter]

### New Hires
- Women: [X%] (Target: [Y%])
- URM: [X%] (Target: [Y%])

### Leadership (VP+)
- Women: [X%] (Target: [Y%])
- URM: [X%] (Target: [Y%])

---

## 2. Pay Equity

### Unexplained Pay Gap
- Gender: [$X,XXX] ([X%]) [Status: Green/Yellow/Red]
- Race: [$X,XXX] ([X%]) [Status: Green/Yellow/Red]

### Remediation
- Gaps identified: [#]
- Gaps remediated: [#] ([X%] complete)
- Total cost: [$X,XXX]

---

## 3. Retention & Mobility

### Attrition Rate
- Women: [X%] (vs. [Y%] company avg)
- URM: [X%] (vs. [Y%] company avg)

### Promotion Rate
- Women: [X%] (vs. [Y%] company avg)
- URM: [X%] (vs. [Y%] company avg)

---

## 4. Inclusion (Survey Results)

### Sense of Belonging
- Women: [X%] agree (vs. [Y%] company avg)
- URM: [X%] agree (vs. [Y%] company avg)

### Psychological Safety
- Women: [X%] agree (vs. [Y%] company avg)
- URM: [X%] agree (vs. [Y%] company avg)

---

## 5. Key Wins This Quarter
- [Win 1]
- [Win 2]
- [Win 3]

## 6. Challenges & Next Steps
- [Challenge 1] → [Action plan]
- [Challenge 2] → [Action plan]

---

## 7. OKR Progress

### Objective 1: [Name]
- KR1: [Progress] ([X%] complete)
- KR2: [Progress] ([X%] complete)
- KR3: [Progress] ([X%] complete)

[Repeat for each OKR]
```

---

## How to Collect DEI Data

### Data Sources:

**1. HRIS (Workday, Rippling, BambooHR):**
- Demographic data (gender, race/ethnicity)
- Salary data
- Job title, level, department
- Hire date, tenure
- Performance ratings
- Promotion history
- Termination date and reason

**2. Applicant Tracking System (Greenhouse, Lever, Ashby):**
- Candidate demographics (voluntary self-ID)
- Offer acceptance rates by demographics
- Pipeline conversion rates (application → phone screen → onsite → offer)

**3. Engagement Surveys (Culture Amp, Lattice, Glint):**
- Inclusion questions
- Belonging, psychological safety, fairness
- Breakdowns by demographics

---

### Privacy & Legal Considerations

**1. Voluntary Self-Identification**
- Demographic data must be voluntarily provided by employees
- Cannot require employees to disclose (in most states)
- Store separately from HR records (to prevent bias)

**2. Aggregate Reporting Only**
- Never show data for groups < 5 people (to protect anonymity)
- Example: If you only have 2 Black employees, don't report "Black attrition rate" separately

**3. Legal Compliance**
- Some states require DEI reporting (California SB 1162, Illinois Equal Pay Act)
- Be ready to share data with regulators if requested

---

## Benchmarking: How Do You Compare?

**Tech Industry Benchmarks (2024):**

| Metric | Tech Industry Avg | Your Company | Status |
|--------|------------------|--------------|--------|
| Women in Engineering | 25% | [Your %] | [↑/↓/→] |
| Women in Leadership | 28% | [Your %] | [↑/↓/→] |
| URM in Workforce | 18% | [Your %] | [↑/↓/→] |
| URM in Leadership | 10% | [Your %] | [↑/↓/→] |
| Gender Pay Gap | 3.5% | [Your %] | [↑/↓/→] |

**Sources:** Reveal by Center for Employment Equity, LinkedIn Workforce Report, Levels.fyi

---

## Red Flags to Watch For

**1. Representation decreases at senior levels**
- Example: 40% women at IC1, but only 10% at VP+
- **Cause:** Leaky pipeline (women leaving or not getting promoted)

**2. Higher attrition for underrepresented groups**
- Example: URM attrition is 22% vs. 12% for white employees
- **Cause:** Lack of belonging, bias, limited career growth

**3. Pay gaps that are growing, not shrinking**
- Example: Gender pay gap was 3% last year, now it's 5%
- **Cause:** Inequitable merit increases or promotion bumps

**4. Low inclusion scores for underrepresented groups**
- Example: 80% of white employees feel they belong, but only 60% of URM employees
- **Cause:** Microaggressions, exclusion, lack of representation

---

## Communicating DEI Metrics

### Transparency Best Practices

**What to share publicly (external):**
- Overall representation (% women, % URM)
- Leadership representation
- Pay equity commitment ("We conduct annual audits and remediate gaps")
- DEI goals ("We're committed to 40% women in engineering by 2026")

**What to share internally (with employees):**
- All of the above, plus:
- New hire diversity
- Attrition rates by demographics
- Survey results (inclusion, belonging)
- Progress on OKRs

**What to keep confidential:**
- Individual salary data
- Small group data (< 5 people)
- Detailed exit interview themes (if identifiable)

---

### Sample Transparency Report

**[Company Name] DEI Report - 2024**

**Our Commitment:**
At [Company], we're committed to building a diverse, equitable, and inclusive workplace. This report shares our progress and the work ahead.

---

**Representation (as of Dec 31, 2024)**

**Overall Workforce:**
- Women: 38% (up from 35% in 2023)
- URM: 22% (up from 20% in 2023)

**Leadership (VP+):**
- Women: 30% (up from 25% in 2023)
- URM: 12% (up from 10% in 2023)

---

**Pay Equity**
- We conducted our annual pay equity audit in Q1 2024
- Identified and remediated gaps totaling $325K
- Current unexplained gender pay gap: 1.8% (down from 3.2% in 2023)
- Current unexplained racial pay gap: 2.1% (down from 4.5% in 2023)

---

**What We Did in 2024**
- Launched 3 ERGs: Women in Tech, Black Employee Network, LGBTQ+ & Allies
- Trained 100% of interviewers on inclusive interviewing
- Partnered with CodePath, Rewriting the Code, and NSBE for diverse recruiting
- Extended parental leave from 12 to 16 weeks

---

**What's Next (2025 Goals)**
- Increase women in engineering to 45% (from 38%)
- Increase URM in leadership to 18% (from 12%)
- Reduce URM attrition to < 12% (from 18%)
- Achieve < 1% unexplained pay gap for both gender and race

---

**Have feedback?** Email dei@company.com

---

## Final Thoughts

**DEI metrics are lagging indicators.** They show you what happened, not what's happening now.

**Leading indicators to watch:**
- Diverse candidate pipeline (are you sourcing diverse candidates?)
- Offer acceptance rates (are diverse candidates accepting your offers?)
- Inclusion survey scores (are people feeling included before they leave?)

**The goal isn't perfect metrics.** The goal is continuous improvement.

**Track quarterly, adjust strategy, and be transparent about progress and setbacks.**

---

**Need help?** Reference `pay-equity-audit-template.md` for conducting audits and `erg-setup-guide.md` for launching ERGs.
