# Merit Matrix Calculator

Tools and templates for building custom merit matrices based on your budget and performance distribution.

---

## Merit Matrix Formula

**Target Raise % = Base Rate × Performance Multiplier × Position Multiplier**

Where:
- **Base Rate:** Average raise percentage (budget / headcount)
- **Performance Multiplier:** Adjustment based on performance rating
- **Position Multiplier:** Adjustment based on compa-ratio (position in pay range)

---

## Step-by-Step: Build Your Merit Matrix

### Step 1: Calculate Your Base Rate

**Formula:**
```
Base Rate = (Total Merit Budget / Total Payroll) × 100
```

**Example:**
- Total Merit Budget: $500,000
- Total Payroll: $15,000,000
- Base Rate: ($500,000 / $15,000,000) × 100 = **3.33%**

---

### Step 2: Define Performance Multipliers

Based on your performance rating distribution:

| Performance Rating | % of Employees | Multiplier | Rationale |
|-------------------|---------------|------------|-----------|
| Exceptional (Top 5%) | 5% | 2.0x | Double the base rate |
| Exceeds Expectations | 20% | 1.3-1.5x | 30-50% above base |
| Meets Expectations | 60% | 0.9-1.1x | At or slightly below base |
| Needs Improvement | 10% | 0.3-0.5x | Below base |
| Does Not Meet | 5% | 0x | No raise (PIP or exit) |

**Total Check:** Weighted average of multipliers should equal 1.0

**Calculation:**
```
(5% × 2.0) + (20% × 1.4) + (60% × 1.0) + (10% × 0.4) + (5% × 0) = 1.02 ✓
```

---

### Step 3: Define Position Multipliers (Compa-Ratio)

| Compa-Ratio | Position in Range | Multiplier | Rationale |
|------------|------------------|------------|-----------|
| < 0.80 | Well below midpoint | 1.3-1.5x | Needs catch-up |
| 0.80-0.90 | Below midpoint | 1.1-1.2x | Room to grow |
| 0.90-1.10 | At midpoint | 1.0x | Market rate |
| 1.10-1.20 | Above midpoint | 0.8-0.9x | Well-paid |
| > 1.20 | At/above max | 0.5-0.7x | Limited room |

---

### Step 4: Build the Matrix

**Formula:**
```
Raise % = Base Rate × Performance Multiplier × Position Multiplier
```

**Example Matrix (3.33% base rate):**

| Performance | CR <0.80 | CR 0.80-0.90 | CR 0.90-1.00 | CR 1.00-1.10 | CR 1.10-1.20 | CR >1.20 |
|------------|---------|-------------|-------------|-------------|-------------|----------|
| **Exceptional** | 3.33 × 2.0 × 1.4 = **9.3%** | 3.33 × 2.0 × 1.2 = **8.0%** | 3.33 × 2.0 × 1.0 = **6.7%** | 3.33 × 2.0 × 0.9 = **6.0%** | 3.33 × 2.0 × 0.8 = **5.3%** | 3.33 × 2.0 × 0.6 = **4.0%** |
| **Exceeds** | 3.33 × 1.4 × 1.4 = **6.5%** | 3.33 × 1.4 × 1.2 = **5.6%** | 3.33 × 1.4 × 1.0 = **4.7%** | 3.33 × 1.4 × 0.9 = **4.2%** | 3.33 × 1.4 × 0.8 = **3.7%** | 3.33 × 1.4 × 0.6 = **2.8%** |
| **Meets** | 3.33 × 1.0 × 1.4 = **4.7%** | 3.33 × 1.0 × 1.2 = **4.0%** | 3.33 × 1.0 × 1.0 = **3.3%** | 3.33 × 1.0 × 0.9 = **3.0%** | 3.33 × 1.0 × 0.8 = **2.7%** | 3.33 × 1.0 × 0.6 = **2.0%** |
| **Needs Improvement** | 3.33 × 0.4 × 1.4 = **1.9%** | 3.33 × 0.4 × 1.2 = **1.6%** | 3.33 × 0.4 × 1.0 = **1.3%** | 3.33 × 0.4 × 0.9 = **1.2%** | 3.33 × 0.4 × 0.8 = **1.1%** | 3.33 × 0.4 × 0.6 = **0.8%** |
| **Does Not Meet** | **0%** | **0%** | **0%** | **0%** | **0%** | **0%** |

---

## Pre-Built Merit Matrices

### Conservative Matrix (2.5% average budget)

| Performance | CR <0.80 | CR 0.80-0.90 | CR 0.90-1.00 | CR 1.00-1.10 | CR 1.10-1.20 | CR >1.20 |
|------------|---------|-------------|-------------|-------------|-------------|----------|
| **Exceptional** | 7.0% | 6.0% | 5.0% | 4.5% | 4.0% | 3.0% |
| **Exceeds** | 5.0% | 4.5% | 3.5% | 3.0% | 2.5% | 2.0% |
| **Meets** | 3.5% | 3.0% | 2.5% | 2.0% | 1.5% | 1.0% |
| **Needs Improvement** | 1.5% | 1.0% | 0.5% | 0% | 0% | 0% |
| **Does Not Meet** | 0% | 0% | 0% | 0% | 0% | 0% |

**Use when:** Tight budget, economic downturn, low revenue growth

---

### Moderate Matrix (4% average budget)

| Performance | CR <0.80 | CR 0.80-0.90 | CR 0.90-1.00 | CR 1.00-1.10 | CR 1.10-1.20 | CR >1.20 |
|------------|---------|-------------|-------------|-------------|-------------|----------|
| **Exceptional** | 10% | 8.5% | 7.0% | 6.0% | 5.0% | 4.0% |
| **Exceeds** | 7.0% | 6.0% | 5.0% | 4.5% | 4.0% | 3.0% |
| **Meets** | 5.0% | 4.5% | 4.0% | 3.5% | 3.0% | 2.0% |
| **Needs Improvement** | 2.0% | 1.5% | 1.0% | 0.5% | 0% | 0% |
| **Does Not Meet** | 0% | 0% | 0% | 0% | 0% | 0% |

**Use when:** Standard economic conditions, competitive market

---

### Aggressive Matrix (6% average budget)

| Performance | CR <0.80 | CR 0.80-0.90 | CR 0.90-1.00 | CR 1.00-1.10 | CR 1.10-1.20 | CR >1.20 |
|------------|---------|-------------|-------------|-------------|-------------|----------|
| **Exceptional** | 15% | 12% | 10% | 8% | 7% | 5% |
| **Exceeds** | 10% | 8.5% | 7.0% | 6.0% | 5.5% | 4.5% |
| **Meets** | 7.0% | 6.0% | 5.5% | 5.0% | 4.5% | 3.5% |
| **Needs Improvement** | 3.0% | 2.0% | 1.5% | 1.0% | 0.5% | 0% |
| **Does Not Meet** | 0% | 0% | 0% | 0% | 0% | 0% |

**Use when:** High growth, talent war, retention crisis, underpaid workforce

---

## Budget Testing Tool

Use this to verify your matrix fits within budget:

### Employee Distribution Assumptions

| Performance | % of Employees | CR <0.80 | CR 0.80-0.90 | CR 0.90-1.00 | CR 1.00-1.10 | CR 1.10-1.20 | CR >1.20 |
|------------|---------------|---------|-------------|-------------|-------------|-------------|----------|
| **Exceptional (5%)** | 5% | 0.5% | 1.0% | 1.5% | 1.0% | 0.5% | 0.5% |
| **Exceeds (20%)** | 20% | 2.0% | 4.0% | 6.0% | 4.0% | 2.0% | 2.0% |
| **Meets (60%)** | 60% | 5.0% | 10% | 20% | 15% | 5.0% | 5.0% |
| **Needs Improvement (10%)** | 10% | 1.0% | 2.0% | 3.0% | 2.0% | 1.0% | 1.0% |
| **Does Not Meet (5%)** | 5% | 0.5% | 1.0% | 1.5% | 1.0% | 0.5% | 0.5% |
| **Total** | 100% | 9% | 18% | 32% | 23% | 9% | 9% |

**Weighted Average Raise Calculation (Moderate Matrix):**

```
(0.5% × 10%) + (1.0% × 8.5%) + (1.5% × 7.0%) + ... + (0.5% × 0%) = 4.12%
```

**Budget Check:**
- Target: 4.0%
- Actual: 4.12%
- **Over budget by 0.12%** → Trim high compa-ratio cells by 0.2-0.3%

---

## Adjusting the Matrix to Fit Budget

### If Over Budget:

1. **Reduce high compa-ratio raises** (CR >1.10) by 0.5-1.0%
2. **Reduce "Meets" raises** by 0.2-0.5%
3. **Cap max raise** at 10% (reduce Exceptional + low CR cells)

### If Under Budget:

1. **Increase "Exceeds" and "Exceptional" raises** by 0.5-1.0%
2. **Add market adjustment budget** (0.3-0.5% of payroll)
3. **Create retention bonus pool** for critical roles

---

## Special Cases

### No Performance Ratings (Flat Organization)

If you don't have formal performance ratings, use:

**Proxy for Performance:**
- Manager discretion (A/B/C players)
- Peer feedback / 360 scores
- OKR achievement
- Promotion readiness

**Simple Matrix:**

| Category | Compa-Ratio <1.0 | Compa-Ratio 1.0-1.2 | Compa-Ratio >1.2 |
|----------|----------------|-------------------|----------------|
| **Top Performer (20%)** | 6-7% | 5-6% | 4-5% |
| **Solid Contributor (60%)** | 4-5% | 3-4% | 2-3% |
| **Needs Development (20%)** | 2-3% | 1-2% | 0-1% |

---

### Role-Specific Matrices

Different matrices for different functions (e.g., Engineering vs. Sales):

**Engineering Matrix (4% avg):**
- Standard merit matrix (see above)

**Sales Matrix (3% avg):**
- Lower base raises (most comp is commission)
- Focus on OTE (on-target earnings) increases

**Executive Matrix (5% avg):**
- Higher raises to retain leadership
- More equity, less cash

---

## Communication: How to Explain the Matrix to Managers

### Manager Training Script

> "Here's our merit matrix for this year's comp review. We have a [X%] average budget, which means the typical employee will get around [X%].
>
> **How to use this matrix:**
> 1. Look up the employee's performance rating (Exceeds, Meets, etc.)
> 2. Calculate their compa-ratio: Current Salary / Midpoint of Pay Range
> 3. Find the intersection in the matrix - that's the recommended raise %
>
> **You have +/- 0.5% flexibility** to adjust for special circumstances (retention risk, market gaps, internal equity).
>
> **If you want to go outside the range,** you need HR approval and a strong business case.
>
> **Your team's total raises must average [X%].** If you give one person 7%, you'll need to balance with others at 2-3%."

---

## Legal Considerations

### Pay Equity Compliance

**Risk:** Merit matrices can perpetuate existing pay gaps if not carefully designed.

**Mitigation:**
1. **Run pay equity audit before applying matrix** (identify and fix gaps first)
2. **Test matrix for disparate impact** (does it disproportionately benefit one demographic?)
3. **Override matrix for equity fixes** (e.g., woman underpaid by 10% gets 12% raise, not 4%)
4. **Document rationale** for all raises (performance, market, equity)

**States with pay equity laws requiring proactive audits:**
- California (SB 1162)
- Colorado (Equal Pay for Equal Work Act)
- Massachusetts
- Washington

---

### Documentation Requirements

**For each employee raise decision, document:**
- Performance rating and justification
- Compa-ratio calculation
- Matrix-recommended raise %
- Actual raise % (and reason if different from matrix)
- Manager approval
- HR/calibration approval

**Retain records for 3+ years** (may be requested in pay discrimination lawsuit)

---

## Copy-Paste Matrix Template (Excel/Google Sheets)

```
| Performance ↓ / Compa-Ratio → | <0.80 | 0.80-0.90 | 0.90-1.00 | 1.00-1.10 | 1.10-1.20 | >1.20 |
|-------------------------------|-------|----------|----------|----------|----------|--------|
| Exceptional                   | 10%   | 8.5%     | 7.0%     | 6.0%     | 5.0%     | 4.0%   |
| Exceeds Expectations          | 7.0%  | 6.0%     | 5.0%     | 4.5%     | 4.0%     | 3.0%   |
| Meets Expectations            | 5.0%  | 4.5%     | 4.0%     | 3.5%     | 3.0%     | 2.0%   |
| Needs Improvement             | 2.0%  | 1.5%     | 1.0%     | 0.5%     | 0%       | 0%     |
| Does Not Meet Expectations    | 0%    | 0%       | 0%       | 0%       | 0%       | 0%     |
```

**Formulas (for Google Sheets):**
- **Compa-Ratio:** `=B2/C2` (where B2 = current salary, C2 = range midpoint)
- **Recommended Raise %:** `=VLOOKUP(D2, MatrixTable, MATCH(E2, CompRatioHeaders, 1), FALSE)`
- **New Salary:** `=B2 * (1 + F2)` (where F2 = raise %)

---

**END OF MERIT MATRIX CALCULATOR**
