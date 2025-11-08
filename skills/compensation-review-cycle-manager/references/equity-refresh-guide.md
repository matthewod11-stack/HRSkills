# Equity Refresh Grant Guide

Comprehensive guide to designing and implementing equity refresh programs for stock options, RSUs, and other equity compensation.

---

## What is an Equity Refresh?

An **equity refresh grant** is a new grant of stock options or RSUs given to existing employees, separate from their initial hire grant.

**Purpose:**
- Replenish vesting equity (initial grants vest over 4 years, creating a "cliff" after Year 2-3)
- Retain top performers and critical employees
- Reward exceptional performance
- Stay competitive with market (equity is part of total comp)
- Re-recruit employees (prevent them from leaving for new equity packages)

---

## Why Equity Refreshes Matter

### The Equity Vesting Cliff Problem

**Scenario:** Employee hired with 40,000 stock options, 4-year vest with 1-year cliff

| Year | Options Vesting | Cumulative Vested | Remaining Unvested |
|------|----------------|-------------------|-------------------|
| Year 1 | 10,000 (cliff) | 10,000 | 30,000 |
| Year 2 | 10,000 | 20,000 | 20,000 |
| Year 3 | 10,000 | 30,000 | 10,000 |
| Year 4 | 10,000 | 40,000 | 0 |
| Year 5+ | **0** | 40,000 | **0** |

**Problem:** After Year 4, employee has no unvested equity → **retention risk**

**Solution:** Annual refresh grants smooth out the cliff

---

### With Refresh Grants (Annual)

| Year | Original Grant Vesting | Refresh Grant Vesting | Total Annual Vesting | Unvested Balance |
|------|----------------------|---------------------|---------------------|-----------------|
| Year 1 | 10,000 | 0 | 10,000 | 30,000 |
| Year 2 | 10,000 | 5,000 (new grant) | 10,000 | 25,000 |
| Year 3 | 10,000 | 5,000 + 1,250 (Y2 refresh) | 16,250 | 23,750 |
| Year 4 | 10,000 | 5,000 + 1,250 + 1,250 (Y3 refresh) | 17,500 | 22,500 |
| Year 5+ | 0 | ~7,500/year | 7,500/year | ~25,000 |

**Result:** Continuous vesting every year, no cliff

---

## Equity Refresh Strategies

### Strategy 1: Performance-Based Refresh (Most Common)

Grant size varies based on performance rating.

**Typical annual refresh amounts (% of initial grant or % of salary):**

| Performance Rating | Refresh Grant (Options) | Refresh Grant (RSUs, % of salary) |
|-------------------|------------------------|----------------------------------|
| **Exceptional (Top 5%)** | 25-50% of initial grant | 40-60% of salary |
| **Exceeds Expectations** | 15-25% of initial grant | 25-40% of salary |
| **Meets Expectations** | 10-15% of initial grant | 15-25% of salary |
| **Needs Improvement** | 0-5% of initial grant | 0-10% of salary |
| **Does Not Meet** | 0% | 0% |

**Example:**
- Employee hired with 40,000 options
- Performance: Exceeds Expectations
- Annual refresh: 20% of initial = **8,000 options**
- Vesting: 4 years (2,000 options/year)

---

### Strategy 2: Flat Refresh (Egalitarian)

Everyone at the same level gets the same refresh grant (no performance differentiation).

**Example:**
- Senior Engineers: 10,000 options/year
- Staff Engineers: 15,000 options/year
- Principal Engineers: 20,000 options/year

**Pros:** Simple, perceived as fair, no performance bias
**Cons:** Doesn't differentiate top performers, may lose high performers

**Use when:** Small company (<50 people), very flat culture, performance ratings not mature

---

### Strategy 3: Retention-Based Refresh (Targeted)

Grant refreshes only to critical employees at risk of leaving.

**Criteria for eligibility:**
- Top 20% performers
- Critical roles (e.g., VP Engineering, key product leads)
- Retention risk (interviewing, has outside offers)
- Long tenure (4+ years, original grant fully vested)

**Grant size:** 50-100% of initial grant (larger than standard refresh)

**Pros:** Cost-effective, targets retention spend
**Cons:** Creates haves/have-nots, can demotivate others

**Use when:** Limited equity pool, high retention risk for specific roles

---

### Strategy 4: Off-Cycle Refresh (Event-Driven)

Refreshes granted outside the annual cycle for specific events:
- **Promotion:** Grant equity as part of promotion package
- **Counter-offer:** Grant equity to retain employee with outside offer
- **M&A:**Grant equity post-acquisition to retain key talent
- **Scope increase:** Employee takes on significantly more responsibility

---

## Equity Refresh Sizing Framework

### Method 1: Percentage of Initial Grant

**Formula:**
```
Refresh Grant = Initial Grant × Performance Multiplier
```

| Performance | Multiplier | Example (40K initial grant) |
|------------|-----------|----------------------------|
| Exceptional | 0.30-0.50 | 12,000-20,000 options |
| Exceeds | 0.15-0.25 | 6,000-10,000 options |
| Meets | 0.10-0.15 | 4,000-6,000 options |
| Below | 0-0.05 | 0-2,000 options |

**Pros:** Scales with seniority (senior employees had larger initial grants)
**Cons:** Can perpetuate inequity (early hires got larger grants)

---

### Method 2: Percentage of Salary (RSUs)

**Formula:**
```
Refresh Grant Value = Annual Salary × Performance Multiplier
```

| Performance | Multiplier | Example ($150K salary) |
|------------|-----------|----------------------|
| Exceptional | 0.40-0.60 | $60,000-$90,000 in RSUs |
| Exceeds | 0.25-0.40 | $37,500-$60,000 in RSUs |
| Meets | 0.15-0.25 | $22,500-$37,500 in RSUs |
| Below | 0-0.10 | $0-$15,000 in RSUs |

**Number of RSUs = Grant Value / Current Share Price**

**Pros:** Directly tied to total compensation, easy to communicate
**Cons:** Dependent on stock price at grant date (can be arbitrary)

---

### Method 3: Basis Points (% of Company)

**Formula:**
```
Refresh Grant = Total Outstanding Shares × Basis Points
```

| Level | Performance: Exceptional | Performance: Exceeds | Performance: Meets |
|-------|------------------------|---------------------|-------------------|
| **IC (L3-L4)** | 0.005-0.01% (5-10 bps) | 0.003-0.005% (3-5 bps) | 0.001-0.003% (1-3 bps) |
| **Senior IC (L5-L6)** | 0.01-0.02% (10-20 bps) | 0.005-0.01% (5-10 bps) | 0.003-0.005% (3-5 bps) |
| **Manager (L6)** | 0.02-0.04% (20-40 bps) | 0.01-0.02% (10-20 bps) | 0.005-0.01% (5-10 bps) |
| **Director (L7)** | 0.05-0.10% (50-100 bps) | 0.03-0.05% (30-50 bps) | 0.01-0.03% (10-30 bps) |
| **VP (L8)** | 0.10-0.20% (100-200 bps) | 0.05-0.10% (50-100 bps) | 0.03-0.05% (30-50 bps) |

**Example:**
- Total shares outstanding: 10,000,000
- Senior Engineer (L5), Exceeds Expectations
- Refresh: 0.008% (8 bps) = 10,000,000 × 0.00008 = **800 shares**

**Pros:** Fair across different hire dates (not dependent on initial grant size)
**Cons:** Requires tracking total outstanding shares, dilution impact

---

## Refresh Grant Timing

### Annual Refresh (Most Common)

**When:** Once per year, aligned with performance review cycle

**Typical schedule:**
- October-December: Performance reviews
- January: Equity refresh grants issued
- Vesting starts: February 1 (aligns with new fiscal year)

**Pros:** Predictable, scales well, aligns with budget planning
**Cons:** Employees wait all year for refresh

---

### Semi-Annual Refresh

**When:** Twice per year (e.g., January + July)

**Pros:** Faster response to performance, better retention
**Cons:** More admin overhead

**Use when:** High-growth startup, frequent promotions, retention-critical

---

### Evergreen Refresh (Continuous)

**When:** Automatic grants every year on employee's work anniversary

**Example:**
- Employee hired Jan 15, 2020 with 40,000 options
- Jan 15, 2022 (Year 2): Automatic refresh of 8,000 options
- Jan 15, 2023 (Year 3): Automatic refresh of 8,000 options
- Continues every year

**Pros:** No performance bias, simple, predictable
**Cons:** No performance differentiation, can be expensive

**Use when:** Very small company (<20 people), egalitarian culture

---

## Vesting Schedules for Refresh Grants

### Standard 4-Year Vest (Most Common)

**Vesting:** 25% per year (annual vest) or monthly over 4 years

**Pros:** Consistent with initial grants, easy to explain
**Cons:** Long cliff (25% vest after Year 1)

---

### 4-Year Vest with No Cliff

**Vesting:** Monthly from day 1 (1/48 per month)

**Pros:** Immediate retention benefit, no cliff
**Cons:** Employee can leave after 6 months with partial vest

**Use when:** Retention risk, need immediate golden handcuffs

---

### 2-Year Vest (Accelerated)

**Vesting:** 50% per year or monthly over 2 years

**Pros:** Faster vesting, strong retention signal
**Cons:** Employee vests faster (less long-term retention)

**Use when:** Counter-offer, retention emergency, senior executives

---

### Backloaded Vest (Retention-Focused)

**Vesting:** 10% / 20% / 30% / 40% over 4 years

**Example:**
- Year 1: 10% vest (4,000 options)
- Year 2: 20% vest (8,000 options)
- Year 3: 30% vest (12,000 options)
- Year 4: 40% vest (16,000 options)

**Pros:** Strong retention in Years 3-4 (when employees most likely to leave)
**Cons:** Employees vest less early (may feel unfair)

---

## Equity Refresh Communication

### Template 1: Annual Refresh Grant Email

**Subject:** Your 2024 Equity Refresh Grant

> Hi [Name],
>
> I'm excited to share that you've been granted an equity refresh as part of our annual compensation review.
>
> **Equity Refresh Details:**
> - **Grant:** [X] stock options (or [Y] RSUs)
> - **Vesting:** 4 years, [monthly / annual] vesting starting [Date]
> - **Strike Price (options only):** $[Price] (fair market value as of [Date])
> - **Estimated Value:** ~$[Value]* based on current [409A / stock price]
>
> **Why you're receiving this grant:**
> This refresh recognizes your [Exceptional / Strong] performance this year, particularly your work on [specific achievement]. Equity refreshes are how we retain and reward our top talent as we grow.
>
> **What this means:**
> This grant is in addition to your initial equity grant from [hire date]. You now have [total unvested options/RSUs] vesting over the next 4 years.
>
> **Next Steps:**
> - You'll receive official grant documents from [Carta / Schwab / E*TRADE] within [X days]
> - Review and sign the grant agreement
> - Track your equity in [equity management platform]
>
> **Questions?** Let me know if you'd like to discuss your equity package or total compensation.
>
> Congratulations!
>
> [Manager Name]
>
> *Value is an estimate based on [409A valuation / current stock price]. Actual value will depend on company performance and future stock price.

---

### Template 2: No Refresh (Needs Improvement Performance)

**Subject:** 2024 Equity Refresh Update

> Hi [Name],
>
> As part of our annual compensation review, we evaluate equity refresh grants based on performance, scope, and retention priorities.
>
> **Equity refresh grants for 2024 were awarded to employees who:**
> - Met or exceeded performance expectations
> - Demonstrated significant impact on company goals
> - Are in critical roles or have retention risk
>
> **Your situation:**
> Based on our performance discussions this year, you did not receive an equity refresh grant this cycle. As we discussed in your performance review, we identified areas where you're [below expectations / need development]:
> - [Specific performance gap 1]
> - [Specific performance gap 2]
>
> **Path Forward:**
> I'm committed to helping you improve performance and earn an equity refresh in the next cycle. Here's the plan:
> 1. [Action item 1]
> 2. [Action item 2]
> 3. Check-in meetings every [2 weeks / month]
>
> If you meet expectations in the next review cycle, you'll be eligible for an equity refresh grant.
>
> Let's schedule time to discuss this in more detail.
>
> [Manager Name]

---

## Equity Pool Management

### How Much Equity to Reserve for Refreshes?

**Rule of Thumb:** Reserve **1-3% of fully diluted shares annually** for refresh grants

**Example:**
- Fully diluted shares: 10,000,000
- Annual refresh pool: 1.5% = 150,000 shares
- Covers ~50-100 employees (avg 1,500-3,000 shares each)

**Allocation by Performance:**
- Top 20% performers: 60% of refresh pool
- Next 50% performers: 35% of refresh pool
- Bottom 30% performers: 5% of refresh pool

---

### Dilution Impact

**Dilution** = (New Shares Granted / Total Outstanding Shares) × 100

**Example:**
- Total shares: 10,000,000
- Annual refresh pool: 150,000 shares
- **Dilution:** (150,000 / 10,000,000) × 100 = **1.5% annual dilution**

**Acceptable dilution rates:**
- **< 2% per year:** Conservative (typical for mature companies)
- **2-5% per year:** Moderate (typical for growth-stage startups)
- **5-10% per year:** Aggressive (high-growth, pre-IPO startups)
- **> 10% per year:** Unsustainable (investor pushback)

---

## Options vs. RSUs: What to Grant?

### Stock Options

**How they work:**
- Employee has the right to buy shares at a fixed price (strike price)
- Value = (Current Share Price - Strike Price) × Number of Options
- Employee must exercise (buy) options to own shares

**Pros:**
- Tax-advantaged (ISOs have preferential tax treatment if held >1 year)
- Upside potential (if company grows significantly)
- Lower dilution (employees don't own shares until exercise)

**Cons:**
- Worthless if company fails or stock price drops below strike price
- Requires cash to exercise (can be expensive)
- Complex to explain to employees

**Best for:** Early-stage startups (pre-IPO), high-growth companies

---

### RSUs (Restricted Stock Units)

**How they work:**
- Employee receives shares directly upon vesting (no purchase required)
- Value = Current Share Price × Number of RSUs
- Taxed as ordinary income when vested

**Pros:**
- Always have value (even if stock price drops)
- No cash needed to acquire shares
- Simpler to understand ("you get X shares")

**Cons:**
- Taxed as income at vest (employee may owe taxes before selling)
- Higher dilution (shares issued immediately at vest)
- Less upside potential vs options (if company 10xs)

**Best for:** Public companies (post-IPO), mature startups (Series C+)

---

## Special Situations

### Promotion Equity Grants

**Guideline:** Promotions should include equity in addition to cash increase

**Example:**
- Promoted from Engineer III → Staff Engineer
- Cash increase: 15% ($150K → $172.5K)
- Equity: 1.5x standard refresh grant (or 0.015% of company)

---

### Retention Grants (Counter-Offers)

**Guideline:** If employee has outside offer, grant 1-2 years' worth of equity upfront

**Example:**
- Employee has offer from competitor: $200K + 0.10% equity
- Your counter: $190K + 0.08% equity **with 2-year vest** (accelerated)
- **Rationale:** Shorter vest = stronger retention signal

---

### M&A Retention Grants

**After acquisition:** Grant new equity in parent company to retain key employees

**Example:**
- Startup acquired by BigCo
- Key employees receive "retention bonuses" in the form of BigCo RSUs
- Vesting: 2 years (to retain through integration)

---

## Legal & Tax Considerations

### 409A Valuation (Private Companies)

**What:** IRS-compliant valuation of company stock (determines strike price for options)

**Required:** At least annually or after major events (fundraising, M&A)

**Cost:** $2,000-$10,000 per valuation

**Importance:** If you grant options below 409A fair market value, employees face tax penalties

---

### ISO vs. NSO Options

**ISOs (Incentive Stock Options):**
- Can only grant to employees (not contractors)
- Max $100K worth of options can vest per year
- Tax benefit: No tax at exercise if held >1 year post-exercise and >2 years post-grant

**NSOs (Non-Qualified Stock Options):**
- Can grant to employees, contractors, advisors
- Taxed at exercise as ordinary income (on spread)

**Most companies grant ISOs up to $100K/year limit, then NSOs for remainder**

---

### RSU Tax Withholding

**Problem:** RSUs are taxed as income at vest, but employee doesn't have cash

**Solutions:**

**Option 1: Sell-to-Cover**
- Company sells enough shares to cover tax withholding
- Employee receives net shares

**Example:**
- 1,000 RSUs vest
- Share price: $50
- Tax rate: 40%
- Tax owed: $20,000
- Shares sold to cover: 400 shares
- Employee receives: 600 shares

**Option 2: Cash Payment**
- Employee pays tax withholding in cash
- Employee receives all shares

---

## Equity Refresh Checklist

**Planning (3-4 months before grant date):**
- [ ] Determine total equity pool size (% of company)
- [ ] Review performance ratings and distribution
- [ ] Design refresh matrix (performance × level)
- [ ] Model total dilution impact
- [ ] Get board approval for equity pool

**Execution (Grant cycle):**
- [ ] Calculate individual grants for each employee
- [ ] Calibrate across departments (ensure fairness)
- [ ] Prepare grant agreements and documentation
- [ ] Communicate to managers (talking points, FAQs)
- [ ] Managers communicate to employees (1:1 meetings)
- [ ] Issue grants via equity management platform (Carta, Shareworks, etc.)

**Post-Grant:**
- [ ] Track acceptance of grant agreements
- [ ] Update equity management system
- [ ] Monitor dilution and remaining pool
- [ ] Collect feedback (were grants well-received?)

---

**END OF EQUITY REFRESH GUIDE**
