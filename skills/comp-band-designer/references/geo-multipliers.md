# Geographic Pay Multipliers

**Purpose:** Adjust compensation fairly based on location while maintaining internal equity.

**Philosophy:** Pay for the value of the work, adjusted for local labor market conditions (NOT just cost of living).

---

## Standard Tier System

### Tier 1: Premium Markets (100% of baseline)

**Locations:**
- San Francisco Bay Area (SF, San Jose, Oakland, Palo Alto)
- New York City (Manhattan, Brooklyn, Queens)
- Seattle metro

**Why 100%:**
- Highest cost of labor
- Most competitive talent markets
- Industry hubs with highest demand
- Baseline for all other calculations

**Typical Roles:**
- All tech roles at market rates
- Example: Senior Engineer P50 = $180,000

---

### Tier 2: Major Tech Hubs (85-90%)

**90% Multiplier:**
- Los Angeles
- San Diego
- Boston
- Washington DC

**85% Multiplier:**
- Chicago
- Denver (Front Range)
- Portland, OR
- Atlanta

**Why 85-90%:**
- Significant tech presence but less competitive than Tier 1
- Lower cost of labor than SF/NYC/Seattle
- Still attracts quality talent
- Growing markets

**Example:**
- Senior Engineer P50 baseline: $180,000
- Boston (90%): $162,000
- Denver (85%): $153,000

---

### Tier 3: Secondary Markets (75-80%)

**80% Multiplier:**
- Austin, TX
- Nashville, TN
- Raleigh-Durham, NC
- Salt Lake City, UT
- Phoenix, AZ

**75% Multiplier:**
- Charlotte, NC
- Minneapolis, MN
- Pittsburgh, PA
- Boulder, CO
- Columbus, OH

**Why 75-80%:**
- Emerging tech scenes
- Lower cost of labor
- Growing talent pools
- Good quality of life
- Companies setting up satellite offices

**Example:**
- Senior Engineer P50 baseline: $180,000
- Austin (80%): $144,000
- Charlotte (75%): $135,000

---

### Tier 4: Remote Hubs / Smaller Cities (70-75%)

**75% Multiplier:**
- Sacramento, CA
- Kansas City, MO
- Indianapolis, IN
- San Antonio, TX
- Richmond, VA

**70% Multiplier:**
- Boise, ID
- Madison, WI
- Des Moines, IA
- Omaha, NE
- Smaller metro areas

**Why 70-75%:**
- Less competitive labor markets
- Smaller tech ecosystems
- Good talent available but less dense
- Often remote-first employees choosing these locations

**Example:**
- Senior Engineer P50 baseline: $180,000
- Sacramento (75%): $135,000
- Boise (70%): $126,000

---

### Tier 5: Remote Anywhere (65-70%)

**70% Multiplier:**
- Remote employees in medium COL areas
- Hybrid remote arrangements
- International (Western Europe, Canada, Australia)

**65% Multiplier:**
- Remote employees in low COL areas
- Rural locations
- International (lower COL countries)

**Why 65-70%:**
- No geographic constraint on hiring
- Employees choosing lower COL areas for lifestyle
- Balances fairness (pay premium over local market) with budget
- International: adjusted for purchasing power parity

**Example:**
- Senior Engineer P50 baseline: $180,000
- Remote (medium COL): $126,000
- Remote (low COL): $117,000

---

## Implementation Guidelines

### Setting Your Tier Structure

**Option 1: Simple (3 tiers)**
- Tier 1: 100% (SF, NYC, Seattle)
- Tier 2: 80% (All other US cities)
- Tier 3: 70% (Remote anywhere)

**Option 2: Moderate (4 tiers)**
- Tier 1: 100% (Top 3 markets)
- Tier 2: 85% (Major cities)
- Tier 3: 75% (Secondary markets)
- Tier 4: 70% (Remote)

**Option 3: Granular (5+ tiers)**
- Use the full tier system above
- More precision, more complexity
- Best for larger companies with distributed teams

### Applying Multipliers

**To salary bands:**
```
Location Band = Baseline Band × Geo Multiplier

Example:
Senior Engineer (IC3) SF baseline
- Min: $160K, Mid: $180K, Max: $200K

Senior Engineer (IC3) Austin (80% multiplier)
- Min: $160K × 0.80 = $128K
- Mid: $180K × 0.80 = $144K
- Max: $200K × 0.80 = $160K
```

**To existing salaries:**
```
New Location Salary = Current Salary × (New Geo / Old Geo)

Example:
Employee moving SF → Austin
- Current SF salary: $180K
- SF multiplier: 100% (1.0)
- Austin multiplier: 80% (0.8)
- New salary: $180K × (0.8 / 1.0) = $144K
```

### Special Considerations

**Remote employees changing locations:**
- **Moving to higher tier:** Generally do NOT increase (unfair to existing employees in that tier)
- **Moving to lower tier:** Grandfather for 6-12 months, then adjust downward
- **Exception:** Promotion or market adjustment timing

**New hires in different locations:**
- Apply multiplier from day 1
- Be transparent in offer: "This is our Austin range for this role"
- Ensure internal equity (same level, same adjusted pay)

**International employees:**
- More complex: currency, taxes, benefits, cost of labor
- Often use EOR (Employer of Record) services
- Consider separate band structure
- Account for mandatory benefits differences

---

## Location-Specific Market Data

### High-Level Comparison

| Market | Median Rent (1BR) | Eng Talent Pool | Startup Density | Recommended Tier |
|--------|-------------------|-----------------|-----------------|------------------|
| SF Bay Area | $3,000 | Very High | Very High | 1 (100%) |
| NYC | $3,500 | Very High | High | 1 (100%) |
| Seattle | $2,200 | Very High | High | 1 (100%) |
| LA | $2,400 | High | Medium | 2 (90%) |
| Boston | $2,600 | High | Medium | 2 (90%) |
| Denver | $1,800 | Medium | Medium | 2 (85%) |
| Austin | $1,600 | High | High | 3 (80%) |
| Chicago | $1,700 | Medium | Low | 2 (85%) |
| Portland | $1,500 | Medium | Medium | 2 (85%) |
| Phoenix | $1,300 | Medium | Low | 3 (80%) |
| Nashville | $1,500 | Low-Medium | Low | 3 (80%) |
| Raleigh | $1,300 | Medium | Medium | 3 (75%) |
| Remote (avg) | $1,000-$1,500 | Varies | N/A | 4-5 (70%) |

**Note:** Rent is illustrative; actual multiplier based on labor market competitiveness.

---

## Common Scenarios

### Scenario 1: Opening First Remote Office

**Situation:** Currently all SF-based, opening Austin office.

**Approach:**
1. Decide on Austin multiplier (recommend 80%)
2. Create Austin-adjusted bands for all roles
3. Communicate transparently: "We pay based on location, here's why"
4. Ensure new Austin hires paid fairly vs. local market (not just vs. SF)

**Example:**
- Senior Eng SF: $160K-$200K (mid $180K)
- Senior Eng Austin: $128K-$160K (mid $144K)
- Austin P50 local market: ~$130K (you're competitive at $144K ✅)

### Scenario 2: Employee Relocation

**Situation:** Employee moving from SF to Austin, currently paid $180K.

**Options:**
- **Option A (Immediate adjustment):** Drop to $144K immediately (80% × $180K)
  - Pros: Fair to Austin peers, budget savings
  - Cons: Big pay cut, retention risk

- **Option B (Grandfathered):** Keep at $180K for 12 months, adjust at next review
  - Pros: Softer landing, retention
  - Cons: Internal equity issue (overpaid vs. Austin peers)

- **Option C (Partial adjustment):** Meet halfway at $162K, adjust fully in 12 months
  - Pros: Balanced approach
  - Cons: Still creates temporary inequity

**Recommendation:** Option B or C depending on performance/retention risk.

### Scenario 3: Hybrid/Remote Policy

**Situation:** Allowing employees to be remote from anywhere.

**Approach:**
- **Option A (Location-based):** Pay based on where employee lives (tier system)
  - Pros: Budget efficient, scales well
  - Cons: Complex to manage, pay differences for same work

- **Option B (Role-based):** Pay same regardless of location
  - Pros: Simple, no pay difference debates
  - Cons: Expensive, overpaying for low COL areas

- **Option C (Blended):** Pay at Tier 2-3 level (80-85%) for all remote
  - Pros: Balances fairness and budget
  - Cons: May underpay in high COL, overpay in low COL

**Recommendation:** Option A for budget control, Option C for simplicity.

### Scenario 4: Pay Transparency Compliance

**Situation:** Must post salary ranges in job listings (CA, NY, CO, WA laws).

**Approach:**
1. Decide which location(s) you're hiring for
2. Post the location-adjusted range for that tier
3. Be explicit: "This range is for [location]. Other locations may differ."
4. If remote: Post range for baseline tier or state "location-adjusted"

**Example Job Posting:**
```
Senior Software Engineer - Remote (US)
Salary Range: $128,000 - $200,000

Note: Final offer depends on candidate location. Range shown
reflects our full geographic pay scale from Tier 3 (secondary
markets) to Tier 1 (SF/NYC/Seattle).
```

---

## Best Practices

**Do:**
- ✅ Be transparent about your tier system
- ✅ Document the methodology
- ✅ Apply consistently (same role, same tier = same pay)
- ✅ Review tiers annually (markets change)
- ✅ Pay competitively within each local market
- ✅ Consider total comp (equity can help offset lower base)

**Don't:**
- ❌ Use cost of living as the only factor (talent market matters more)
- ❌ Create too many tiers (complexity nightmare)
- ❌ Change tiers frequently (destabilizing)
- ❌ Ignore local market competitiveness
- ❌ Grandfather indefinitely (creates equity issues)
- ❌ Punish remote workers (70% can still be very competitive locally)

---

## Legal & Compliance

**Pay Transparency Laws (as of 2024):**
- **Must disclose ranges:** CA, NY, CO, WA, RI, CT, MD, NV
- **Trends:** More states adopting
- **Recommendation:** Just be transparent everywhere

**Equal Pay Considerations:**
- Location-based pay is generally legal IF applied consistently
- Cannot discriminate based on protected characteristics
- Document job-related reasons for any pay differences
- Regular pay equity audits recommended

**Remote Work Considerations:**
- Tax implications (nexus, state income tax)
- Benefits variations by state
- Workers' comp insurance
- Consult legal/tax advisors for compliance

---

## Example Company Policy

**TechCo Geographic Pay Policy**

**Effective Date:** January 1, 2024

**Philosophy:** We pay competitively for the value of work performed, adjusted for local labor market conditions.

**Tier Structure:**

| Tier | Multiplier | Locations |
|------|------------|-----------|
| 1 | 100% | SF Bay Area, NYC, Seattle |
| 2 | 85% | LA, Boston, DC, Chicago, Denver, Portland |
| 3 | 75% | Austin, Raleigh, Nashville, Phoenix, other major metros |
| 4 | 70% | Remote (anywhere in US) |

**Application:**
- All salary bands baseline: SF Bay Area (Tier 1)
- Multiply by tier percentage for other locations
- New hires placed in tier based on work location
- Relocations adjusted within 12 months

**Transparency:**
- Employees can view tier structure in handbook
- Job postings include location-specific ranges
- HR available to answer questions

**Review:**
- Tiers reviewed annually
- Market data updated annually
- Adjustments communicated 30 days in advance
