# Pay Equity Audit Template

Step-by-step guide to conducting a pay equity analysis and closing gender/racial pay gaps.

---

## Why Pay Equity Audits Matter

**Legal requirement in some states:**
- California (SB 1162): Annual pay data reporting for 100+ employees
- Illinois (Equal Pay Act): Requires pay equity certificates
- Massachusetts: Proactive pay equity audits

**Business case:**
- Avoid lawsuits (pay discrimination class actions are expensive)
- Retain talent (employees leave when they discover pay gaps)
- Attract talent (candidates ask about pay equity)

---

## The 5-Step Pay Equity Audit Process

### Step 1: Prepare the Data

**Collect for each employee:**
- Current base salary
- Job title and level
- Department/function
- Location (city/state)
- Performance rating (most recent)
- Tenure (years at company)
- Years of total professional experience
- Education level
- Manager
- Demographic data (gender, race/ethnicity—from HRIS or voluntary self-ID)

**Export from:** Workday, Rippling, BambooHR, or your HRIS

---

### Step 2: Segment into "Similarly Situated" Groups

**Group employees who:**
- Have the same job title and level
- Work in the same location (or location tier)
- Perform substantially similar work

**Example Cohorts:**
- All Software Engineer IIIs in San Francisco
- All Account Executives in New York
- All Product Managers (L5) in Remote Tier 1

**Minimum cohort size:** 5-10 employees (smaller = hard to analyze statistically)

---

### Step 3: Run Regression Analysis

**Goal:** Predict salary based on legitimate factors, then identify unexplained gaps.

#### Legitimate Factors (Control Variables):
- **Performance rating** (Exceeds, Meets, Below)
- **Tenure** (years at company)
- **Experience** (total years of professional experience)
- **Education** (Bachelor's, Master's, PhD)
- **Department** (if role spans multiple departments)

#### Regression Formula:

```
Predicted Salary =
  Base Amount
  + (Performance Coefficient × Performance Rating)
  + (Tenure Coefficient × Years at Company)
  + (Experience Coefficient × Years of Experience)
  + (Education Coefficient × Degree Level)
```

**Tools:**
- Excel (Data Analysis Toolpak)
- Google Sheets (add-ons: XLMiner, Regression)
- R or Python (statsmodels library)
- Tableau, Power BI

---

#### Example Regression Output

**Cohort:** Software Engineer III, San Francisco (n=30)

| Variable | Coefficient | Impact |
|----------|------------|--------|
| Base (Intercept) | $145,000 | Starting salary |
| Performance (Exceeds vs. Meets) | +$8,000 | Exceeds adds $8K |
| Tenure (per year) | +$2,500 | Each year adds $2.5K |
| Experience (per year) | +$1,200 | Each year of total exp adds $1.2K |
| Master's Degree | +$5,000 | Master's adds $5K |

**Interpretation:**
- A "Meets Expectations" engineer with 3 years tenure, 8 years experience, Bachelor's degree:
  - Predicted Salary = $145K + $0 + ($2.5K × 3) + ($1.2K × 8) + $0 = **$160,100**

---

### Step 4: Identify Gaps

**Calculate gap for each employee:**

```
Gap = Actual Salary - Predicted Salary
```

**Example:**
- **Employee A (Woman):** Actual $152K, Predicted $160K → **Gap: -$8K (underpaid)**
- **Employee B (Man):** Actual $168K, Predicted $160K → **Gap: +$8K (overpaid)**

---

#### Analyze Gaps by Demographic

**Group gaps by gender/race and calculate averages:**

| Demographic | Average Gap | % Below Predicted |
|-------------|------------|-------------------|
| Women | -$6,500 | 65% |
| Men | +$3,200 | 35% |
| **Total Gap** | **$9,700** | |

**Interpretation:** Women in this cohort are paid $9,700 less than men on average, after controlling for performance, tenure, and experience.

---

### Step 5: Remediate Gaps

**Options for closing gaps:**

#### Option A: Full Remediation (Close All Gaps)

**Action:** Bring all underpaid employees up to predicted salary.

**Example:**
- 10 women paid average $6.5K below predicted
- Total cost: 10 × $6.5K = **$65,000**

**Pros:** Fully closes gap, strong retention signal
**Cons:** Expensive

---

#### Option B: Partial Remediation (Close 70-80% of Gap)

**Action:** Close most of the gap, leave small amount for next merit cycle.

**Example:**
- Close 75% of gap now ($4,875/person)
- Total cost: 10 × $4,875 = **$48,750**
- Remaining 25% addressed in annual merit increases

**Pros:** Lower cost, still meaningful
**Cons:** Gap not fully closed

---

#### Option C: Tiered Remediation (Prioritize Largest Gaps)

**Action:** Fix gaps > $10K immediately, defer smaller gaps.

**Example:**
- 3 employees with gaps > $10K: Adjust immediately ($36K)
- 7 employees with gaps < $10K: Address at merit cycle

**Pros:** Focuses budget on worst cases
**Cons:** Doesn't fix systemic issue

---

## Pay Equity Audit Spreadsheet Template

| Employee Name | Gender | Race | Salary | Predicted Salary | Gap | Gap % | Priority |
|--------------|--------|------|--------|-----------------|-----|-------|----------|
| Jane Doe | F | White | $152,000 | $160,000 | -$8,000 | -5.0% | High |
| John Smith | M | White | $168,000 | $160,000 | +$8,000 | +5.0% | Low |
| Maria Garcia | F | Hispanic | $148,000 | $162,000 | -$14,000 | -8.6% | **Critical** |
| Alex Chen | M | Asian | $165,000 | $159,000 | +$6,000 | +3.8% | Low |

**Priority:**
- **Critical:** Gap > $10K (fix immediately)
- **High:** Gap $5K-$10K (fix within 6 months)
- **Medium:** Gap $2K-$5K (address at next merit cycle)
- **Low:** Gap < $2K (monitor)

---

## Communication Templates

### Template 1: Announcing the Audit (To Leadership)

**Subject:** Pay Equity Audit - [Year]

> We're conducting our annual pay equity audit to ensure employees are compensated fairly regardless of gender, race, or other protected characteristics.
>
> **Timeline:**
> - Data collection: [Dates]
> - Analysis: [Dates]
> - Remediation plan: [Date]
> - Implementation: [Date]
>
> **Budget estimate:** $[X] (0.5-1.5% of payroll)
>
> **Legal compliance:** Required in [CA, IL, etc.] and recommended as best practice nationwide.

---

### Template 2: Communicating Adjustment (To Employee)

**Subject:** Compensation Adjustment

> Hi [Name],
>
> As part of our ongoing commitment to pay equity, we conducted an audit to ensure employees are compensated fairly for their role, performance, and experience.
>
> **Based on this analysis, we're adjusting your salary to $[New Salary], effective [Date].**
>
> This is a **$[Adjustment] increase** (a [X%] increase from your current salary of $[Old Salary]).
>
> This adjustment is separate from your annual merit increase, which you'll receive during the [Month] review cycle.
>
> We're committed to ensuring fair compensation for all employees. If you have questions, please reach out.
>
> Best,
> [Manager/HR]

**Note:** Don't explicitly say "pay equity adjustment" (could be admission of discrimination). Use "market adjustment" or "salary alignment."

---

### Template 3: Explaining No Adjustment (Overpaid Employee)

**Most companies don't communicate this**, but if asked:

> "We conduct regular compensation reviews to ensure employees are paid competitively. Your salary is currently [at the top of the range / above market rate] for your role and level, so you won't receive an adjustment at this time. You'll still be eligible for merit increases based on performance."

---

## Legal Considerations

### What's Legal:
✅ Paying different salaries based on:
- Performance
- Experience
- Tenure
- Education
- Market rates for different locations
- Specialized skills

### What's Illegal:
❌ Paying different salaries based on:
- Gender
- Race
- Age (if 40+)
- Religion
- National origin
- Disability
- Any other protected class

---

### Adverse Impact Analysis

**Even if you didn't intend to discriminate, pay gaps can be illegal if they have "adverse impact."**

**Test:** If one demographic group is paid significantly less (> 5-10%) than another group for the same work, it may be discriminatory.

**Example:**
- Women paid 15% less than men for same role → **Adverse impact**
- Even if based on "negotiation" → **Still illegal** (negotiation perpetuates bias)

---

## Pay Equity Audit Checklist

**Preparation:**
- [ ] Extract salary data from HRIS
- [ ] Extract demographic data (gender, race)
- [ ] Gather performance ratings, tenure, experience
- [ ] Define cohorts (same role, level, location)

**Analysis:**
- [ ] Run regression analysis for each cohort
- [ ] Calculate predicted salary for each employee
- [ ] Identify gaps (actual vs. predicted)
- [ ] Analyze gaps by gender, race

**Remediation:**
- [ ] Prioritize gaps (> $10K critical, $5-10K high, etc.)
- [ ] Calculate budget needed
- [ ] Get leadership approval
- [ ] Communicate adjustments to employees

**Documentation:**
- [ ] Document methodology (for legal defense)
- [ ] Retain analysis for 3+ years
- [ ] Track progress year-over-year

---

## Benchmarking: What's a "Good" Pay Equity Score?

**Unexplained pay gap (after controlling for legitimate factors):**
- **< 2%:** Excellent (minimal gap)
- **2-5%:** Acceptable (work to reduce)
- **5-10%:** Concerning (remediate ASAP)
- **> 10%:** Critical (legal risk, immediate action)

**Example:**
- Women paid 2.5% less than predicted → **Acceptable, but aim to close it**
- Women paid 12% less than predicted → **Critical, legal liability**

---

## Ongoing Monitoring

**Conduct pay equity audits:**
- **Annually** (minimum)
- **After merit cycles** (ensure raises don't create new gaps)
- **After promotions** (ensure promotion salary bumps are equitable)

**Track:**
- Year-over-year gap trends (is it shrinking?)
- New hire salaries (are we bringing in new gaps?)
- Promotion salaries (are promotions equitable?)

---

**Remember:** Pay equity isn't a one-time project. It's an ongoing practice.
