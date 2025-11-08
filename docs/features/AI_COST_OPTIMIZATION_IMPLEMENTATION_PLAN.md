# AI COST OPTIMIZATION - IMPLEMENTATION PLAN

**Generated:** November 5, 2025
**Target Savings:** $19,200/year (77% reduction)
**Timeline:** 5 days
**Risk Level:** Low

---

## EXECUTIVE SUMMARY

This plan implements all three optimizations from the AI Cost Optimization Report with enhanced semantic employee data filtering and comprehensive monitoring on the settings page. Based on current implementation analysis, prompt caching is already partially implemented but can be enhanced, employee data filtering exists but needs semantic intelligence, and dynamic token limits are working well.

**Current State Analysis:**
- ✅ Prompt caching: Basic implementation exists (lines 399-425 in route.ts)
- ✅ Dynamic max_tokens: Fully implemented (lines 38-59 in route.ts)
- ⚠️ Employee data filtering: Basic filtering exists, needs semantic enhancement
- ✅ Performance monitoring: Infrastructure exists (performance-monitor.ts)
- ⚠️ Monitoring UI: Needs to be added to settings page

---

## PHASE 1: ENHANCED PROMPT CACHING (Day 1-2)

### Current Implementation Assessment
File: `webapp/app/api/chat/route.ts:399-425`

**Already Working:**
- System prompt split into cacheable blocks
- Employee data separated from static content
- Cache control headers properly configured

**Enhancements Needed:**

#### 1.1 Cache Skills Catalog (15,000 tokens)
The optimization report specifically mentions caching the skills catalog. Currently, individual skills are loaded but not cached.

**Implementation:**
```typescript
// Location: webapp/lib/skills.ts (new function)
export function generateCacheableSkillsCatalog(): string {
  const skillsDir = path.join(process.cwd(), '..', 'skills')
  const skillFolders = fs.readdirSync(skillsDir)

  let catalog = `\n\n# HR Skills Catalog\n\n`
  catalog += `You have access to ${skillFolders.length} specialized HR skills:\n\n`

  for (const folder of skillFolders) {
    const skillPath = path.join(skillsDir, folder, 'SKILL.md')
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8')
      // Extract title and summary (first 200 chars)
      const title = folder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const summary = content.substring(0, 200).replace(/\n/g, ' ')
      catalog += `- **${title}**: ${summary}...\n`
    }
  }

  return catalog
}
```

**Integration in route.ts:**
```typescript
// Add to cacheable system blocks (after line 415)
const skillsCatalog = generateCacheableSkillsCatalog()
cacheableSystemBlocks.push({
  type: "text" as const,
  text: skillsCatalog,
  cache_control: { type: "ephemeral" as const }
})
```

**Expected Impact:**
- Cache 15,000 additional tokens per request
- 90% cost reduction on cached tokens ($3/M → $0.30/M)
- Monthly savings: ~$1,200

#### 1.2 Enhanced Cache Metrics
Add cache-specific metrics to track effectiveness:

```typescript
// Location: webapp/lib/performance-monitor.ts
export interface CacheMetrics {
  cacheWriteTokens: number  // Tokens written to cache
  cacheReadTokens: number   // Tokens read from cache
  cacheCreationLatency: number
  estimatedSavings: number  // In USD
}

export function calculateCacheSavings(
  cachedTokens: number,
  inputTokens: number
): number {
  // Cached tokens cost $0.30/M instead of $3/M
  const cachedCost = (cachedTokens / 1_000_000) * 0.30
  const uncachedEquivalent = (cachedTokens / 1_000_000) * 3
  return uncachedEquivalent - cachedCost
}
```

**Testing Checklist:**
- [ ] Skills catalog loads and caches correctly
- [ ] Cache hit rate improves from baseline
- [ ] First request (cache write) vs subsequent requests (cache read) timing
- [ ] Verify cache invalidation works when skills are modified
- [ ] Monitor cache_creation_input_tokens in response

---

## PHASE 2: SEMANTIC EMPLOYEE DATA OPTIMIZATION (Day 3)

### Current Implementation Assessment
File: `webapp/lib/employee-context.ts:1-163`

**Already Working:**
- Basic query pattern detection (needsEmployeeData)
- Department/name/title filtering
- 50-employee limit

**Enhancement: Semantic Analysis**

The goal is to use lightweight semantic analysis to determine which employee fields are actually needed, not just which employees.

#### 2.1 Field Relevance Scoring
```typescript
// Location: webapp/lib/employee-context.ts (new functions)

interface FieldRelevance {
  field: string
  relevanceScore: number
  reason: string
}

/**
 * Analyze query to determine which employee fields are relevant
 * Uses keyword matching and semantic understanding
 */
export function analyzeRequiredFields(query: string): string[] {
  const queryLower = query.toLowerCase()
  const requiredFields = new Set<string>(['employee_id', 'full_name'])

  // Always include these core fields
  const fieldPatterns: Record<string, string[]> = {
    // Job & Role
    'job_title': ['title', 'role', 'position', 'job'],
    'department': ['department', 'dept', 'team', 'org', 'division'],
    'manager_name': ['manager', 'reports to', 'supervisor', 'boss'],
    'level': ['level', 'seniority', 'grade', 'band'],

    // Compensation
    'salary': ['salary', 'pay', 'compensation', 'comp', 'earnings'],
    'bonus': ['bonus', 'incentive', 'variable pay'],
    'equity': ['equity', 'stock', 'rsu', 'options'],

    // Time & Status
    'hire_date': ['tenure', 'hire date', 'start date', 'hired', 'joined'],
    'status': ['status', 'active', 'terminated', 'inactive'],

    // Demographics (for DEI analysis)
    'gender': ['gender', 'women', 'men', 'diversity', 'dei'],
    'ethnicity': ['ethnicity', 'race', 'diversity', 'dei', 'underrepresented'],
    'location': ['location', 'office', 'site', 'remote', 'geo'],

    // Performance
    'performance_rating': ['performance', 'rating', 'review', 'evaluation'],
    'promotion_date': ['promotion', 'promoted', 'advancement'],
  }

  // Score each field based on query content
  for (const [field, keywords] of Object.entries(fieldPatterns)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        requiredFields.add(field)
        break
      }
    }
  }

  // Context-aware additions
  if (queryLower.includes('turnover') || queryLower.includes('attrition')) {
    requiredFields.add('hire_date')
    requiredFields.add('termination_date')
    requiredFields.add('status')
  }

  if (queryLower.includes('headcount') || queryLower.includes('count')) {
    // For simple counts, only need minimal fields
    return ['employee_id', 'status', 'department']
  }

  return Array.from(requiredFields)
}

/**
 * Filter employee data to only include relevant fields
 */
export function filterEmployeeFields(
  employees: Employee[],
  requiredFields: string[]
): Partial<Employee>[] {
  return employees.map(emp => {
    const filtered: Partial<Employee> = {}
    for (const field of requiredFields) {
      if (field in emp) {
        filtered[field] = emp[field]
      }
    }
    return filtered
  })
}

/**
 * Enhanced context generation with field-level filtering
 */
export function generateEmployeeContext(
  employees: Employee[],
  query: string
): string {
  // Strategy 1: Check if query needs employee data
  if (!needsEmployeeData(query)) {
    return '' // Save 2,000-5,000 tokens
  }

  // Strategy 2: Filter to relevant employees
  const relevantEmployees = filterRelevantEmployees(employees, query)
  const limitedEmployees = relevantEmployees.slice(0, 50)

  // Strategy 3: ENHANCED - Filter to relevant fields only
  const requiredFields = analyzeRequiredFields(query)
  const optimizedEmployees = filterEmployeeFields(limitedEmployees, requiredFields)

  // Active employees only
  const activeEmployees = optimizedEmployees.filter((emp: Partial<Employee>) =>
    !emp.status || emp.status.toLowerCase() === 'active'
  )

  if (activeEmployees.length === 0) {
    return ''
  }

  // Generate summary statistics
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))]
  const totalCount = employees.length
  const activeCount = employees.filter(emp =>
    !emp.status || emp.status.toLowerCase() === 'active'
  ).length

  let context = `\n\n---\n\n# Employee Data Context\n\n`
  context += `You have access to real employee data:\n\n`
  context += `- **Total Employees**: ${totalCount}\n`
  context += `- **Active Employees**: ${activeCount}\n`
  context += `- **Departments**: ${departments.join(', ')}\n`
  context += `- **Included Fields**: ${requiredFields.join(', ')}\n\n`

  if (limitedEmployees.length < activeCount) {
    context += `**Note**: Showing ${limitedEmployees.length} most relevant employees for this query.\n\n`
  }

  context += `When answering questions about employees, departments, or team composition, reference this actual data.\n\n`
  context += `Here is the employee roster:\n\n`

  // Add condensed employee data with only relevant fields
  const employeeSummary = activeEmployees.map((emp: Partial<Employee>) => {
    const fullName = emp.full_name || `${emp.first_name} ${emp.last_name}`
    const fields = requiredFields
      .filter(f => f !== 'employee_id' && f !== 'full_name' && f in emp)
      .map(f => `${f}: ${emp[f]}`)
      .join(', ')

    return `- ${fullName} (${emp.employee_id}): ${fields}`
  }).join('\n')

  context += employeeSummary

  return context
}
```

**Expected Impact:**
- Reduce employee data tokens by 40-60%
- Monthly savings: ~$300
- Better context relevance for AI responses

**Testing Checklist:**
- [ ] "Show me engineering headcount" → Only includes employee_id, department, status
- [ ] "What's the average salary in sales?" → Includes salary, department
- [ ] "Who reports to Jane Smith?" → Includes manager_name, full_name
- [ ] "DEI breakdown by department" → Includes gender, ethnicity, department
- [ ] Compare token counts before/after for 10 sample queries

---

## PHASE 3: MONITORING DASHBOARD (Day 4)

### Integration with Settings Page
File: `webapp/app/settings/page.tsx`

Add a new "AI Cost Monitoring" section with real-time metrics.

#### 3.1 New Settings Section
```typescript
// Add to sections array in page.tsx
{
  id: 'ai-monitoring',
  title: 'AI Cost Monitoring',
  icon: Activity, // Import from lucide-react
  settings: [
    {
      id: 'cachingEnabled',
      label: 'Prompt Caching',
      type: 'toggle',
      value: true,
      description: 'Cache static prompts to reduce token costs by 90%'
    },
    {
      id: 'smartDataFiltering',
      label: 'Smart Data Filtering',
      type: 'toggle',
      value: true,
      description: 'Use semantic analysis to include only relevant employee fields'
    },
    {
      id: 'dynamicTokens',
      label: 'Dynamic Token Limits',
      type: 'toggle',
      value: true,
      description: 'Automatically adjust max_tokens based on query type'
    }
  ]
}
```

#### 3.2 Live Metrics Display Component
```typescript
// Location: webapp/components/custom/AIMetricsDashboard.tsx (new file)

'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, Zap, DollarSign, Database } from 'lucide-react'
import { motion } from 'framer-motion'

interface MetricsSummary {
  cacheHitRate: number
  avgCachedTokens: number
  avgInputTokens: number
  avgOutputTokens: number
  totalCost: number
  estimatedMonthlyCost: number
  savingsVsBaseline: number
}

export function AIMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/ai-costs')
      const data = await response.json()
      setMetrics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch AI metrics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-white/5 rounded-lg"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-gray-400 text-sm">
        No metrics available yet. Start using the chat to collect data.
      </div>
    )
  }

  const metricCards = [
    {
      icon: Zap,
      label: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate.toFixed(1)}%`,
      target: '85%',
      color: 'from-blue-500 to-cyan-500',
      status: metrics.cacheHitRate >= 85 ? 'good' : 'warning'
    },
    {
      icon: Database,
      label: 'Avg Cached Tokens',
      value: metrics.avgCachedTokens.toLocaleString(),
      target: '15,000',
      color: 'from-purple-500 to-pink-500',
      status: metrics.avgCachedTokens >= 15000 ? 'good' : 'warning'
    },
    {
      icon: DollarSign,
      label: 'Estimated Monthly Cost',
      value: `$${metrics.estimatedMonthlyCost.toFixed(0)}`,
      target: '$1,100',
      color: 'from-green-500 to-emerald-500',
      status: metrics.estimatedMonthlyCost <= 1500 ? 'good' : 'warning'
    },
    {
      icon: TrendingDown,
      label: 'Monthly Savings',
      value: `$${metrics.savingsVsBaseline.toFixed(0)}`,
      target: '$3,700',
      color: 'from-orange-500 to-red-500',
      status: 'good'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Real-Time AI Cost Metrics</h3>
          <p className="text-xs text-gray-400">Last 24 hours</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/20 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              {card.status === 'good' ? (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">On Target</span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Monitor</span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{card.value}</div>
            <div className="text-xs text-gray-400">{card.label}</div>
            <div className="text-xs text-gray-500 mt-2">Target: {card.target}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-black/40 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-bold mb-2">Token Usage Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Input Tokens:</span>
            <span className="font-mono">{metrics.avgInputTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Output Tokens:</span>
            <span className="font-mono">{metrics.avgOutputTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Cached Tokens:</span>
            <span className="font-mono text-green-400">{metrics.avgCachedTokens.toLocaleString()}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold">
            <span>Current Session Cost:</span>
            <span>${metrics.totalCost.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 3.3 Metrics API Endpoint
```typescript
// Location: webapp/app/api/metrics/ai-costs/route.ts (new file)

import { NextRequest, NextResponse } from 'next/server'
import { getAggregatedMetrics, calculateTokenCost } from '@/lib/performance-monitor'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  try {
    // Get last 24 hours of metrics
    const metrics = getAggregatedMetrics(24 * 60)

    // Calculate monthly projections
    const dailyCost = metrics.totalTokenCost / (metrics.sampleCount || 1) * 200 // Assume 200 requests/day
    const monthlyCost = dailyCost * 30

    // Baseline cost before optimizations: $4,800/month
    const baselineMonthlyCost = 4800
    const savings = baselineMonthlyCost - monthlyCost

    return NextResponse.json({
      cacheHitRate: metrics.cacheHitRate,
      avgCachedTokens: metrics.avgCachedTokens,
      avgInputTokens: metrics.avgInputTokens,
      avgOutputTokens: metrics.avgOutputTokens,
      totalCost: metrics.totalTokenCost,
      estimatedMonthlyCost: monthlyCost,
      savingsVsBaseline: savings,
      sampleCount: metrics.sampleCount,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd
    })
  } catch (error) {
    console.error('Failed to calculate AI cost metrics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}
```

**Testing Checklist:**
- [ ] Metrics dashboard loads on settings page
- [ ] Real-time data updates every 30 seconds
- [ ] All four metric cards display correctly
- [ ] Target indicators show green/yellow status appropriately
- [ ] Token breakdown shows accurate numbers
- [ ] Refresh button works immediately

---

## PHASE 4: VALIDATION & TESTING (Day 5)

### 4.1 Cost Comparison Testing

**Baseline Measurement (Before Optimizations):**
```typescript
// Test script: webapp/scripts/measure-baseline-costs.ts

import { anthropic } from '@/lib/anthropic-client'

const testQueries = [
  "Show me all engineering employees",
  "What's the average salary in sales?",
  "Who reports to Jane Smith?",
  "Analyze our DEI metrics by department",
  "Count active employees by location",
  "Create an offer letter for a senior engineer",
  "What's our turnover rate?",
  "Show me high performers in product",
  "Draft a job description for a data scientist",
  "Analyze promotion patterns over the last year"
]

async function measureCosts() {
  const results = []

  for (const query of testQueries) {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        skill: 'auto-detect',
        history: []
      })
    })

    const data = await response.json()
    // Log token usage from response headers or monitoring
    results.push({
      query,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      cachedTokens: data.usage?.cache_read_input_tokens || 0
    })
  }

  console.table(results)

  // Calculate total cost
  const totalCost = results.reduce((sum, r) => {
    const inputCost = (r.inputTokens / 1_000_000) * 3
    const outputCost = (r.outputTokens / 1_000_000) * 15
    const cachedCost = (r.cachedTokens / 1_000_000) * 0.30
    return sum + inputCost + outputCost + cachedCost
  }, 0)

  console.log(`\nTotal cost for ${testQueries.length} queries: $${totalCost.toFixed(4)}`)
  console.log(`Projected monthly cost (20,000 queries): $${(totalCost / testQueries.length * 20000).toFixed(2)}`)
}

measureCosts()
```

### 4.2 A/B Testing Approach

Create feature flags to enable/disable optimizations:

```typescript
// Location: webapp/lib/optimization-flags.ts

export const OPTIMIZATION_FLAGS = {
  ENABLE_PROMPT_CACHING: process.env.ENABLE_PROMPT_CACHING !== 'false',
  ENABLE_SEMANTIC_FILTERING: process.env.ENABLE_SEMANTIC_FILTERING !== 'false',
  ENABLE_DYNAMIC_TOKENS: process.env.ENABLE_DYNAMIC_TOKENS !== 'false',
}

export function getOptimizationConfig() {
  return {
    promptCaching: OPTIMIZATION_FLAGS.ENABLE_PROMPT_CACHING,
    semanticFiltering: OPTIMIZATION_FLAGS.ENABLE_SEMANTIC_FILTERING,
    dynamicTokens: OPTIMIZATION_FLAGS.ENABLE_DYNAMIC_TOKENS,
  }
}
```

### 4.3 Success Metrics

Track these KPIs daily for one week:

| Metric | Baseline Target | Optimized Target | Measurement |
|--------|----------------|------------------|-------------|
| Cache Hit Rate | N/A | 85%+ | Performance monitor |
| Avg Cached Tokens | 0 | 15,000+ | API response usage |
| Avg Input Tokens | 8,000 | 3,500 | API response usage |
| P95 Latency | <5s | <3s | Performance monitor |
| Daily Cost | $160 | $37 | Token usage × pricing |
| Monthly Projection | $4,800 | $1,100 | Daily cost × 30 |

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Prompt Caching (Days 1-2)
- [ ] Add `generateCacheableSkillsCatalog()` to `webapp/lib/skills.ts`
- [ ] Update `route.ts` to cache skills catalog
- [ ] Add cache-specific metrics to `performance-monitor.ts`
- [ ] Test cache write on first request
- [ ] Test cache read on subsequent requests
- [ ] Verify 15,000+ tokens cached per request
- [ ] Measure cache hit rate over 100 requests

### Phase 2: Semantic Employee Data (Day 3)
- [ ] Add `analyzeRequiredFields()` to `employee-context.ts`
- [ ] Add `filterEmployeeFields()` to `employee-context.ts`
- [ ] Update `generateEmployeeContext()` with field filtering
- [ ] Test 10 sample queries with before/after token counts
- [ ] Verify accuracy: responses still contain correct data
- [ ] Measure average token reduction (target: 40-60%)
- [ ] Update documentation with field analysis examples

### Phase 3: Monitoring Dashboard (Day 4)
- [ ] Create `AIMetricsDashboard.tsx` component
- [ ] Create `/api/metrics/ai-costs/route.ts` endpoint
- [ ] Add AI Monitoring section to settings page
- [ ] Import and render `AIMetricsDashboard` in settings
- [ ] Test real-time metric updates
- [ ] Verify monthly cost projections are accurate
- [ ] Add loading states and error handling

### Phase 4: Validation (Day 5)
- [ ] Create `measure-baseline-costs.ts` test script
- [ ] Run baseline measurements (optimizations disabled)
- [ ] Run optimized measurements (all optimizations enabled)
- [ ] Compare token usage across 10 queries
- [ ] Calculate actual savings percentage
- [ ] Document findings in validation report
- [ ] Update monitoring dashboard with real targets
- [ ] Deploy to production with feature flags

---

## RISK MITIGATION

### Risk 1: Cache invalidation issues
**Impact:** Stale data served to users
**Mitigation:**
- Set cache TTL to 5 minutes (Anthropic default)
- Add cache versioning based on skills directory hash
- Monitor cache age in metrics dashboard

### Risk 2: Semantic filtering removes needed data
**Impact:** AI provides incomplete answers
**Mitigation:**
- Start with conservative field inclusion
- Log queries where AI mentions "insufficient data"
- A/B test with 20% of traffic first
- Add override flag for complex queries

### Risk 3: Increased latency from analysis
**Impact:** Slower response times
**Mitigation:**
- Profile field analysis performance (target: <10ms)
- Use simple regex patterns, not ML models
- Cache field analysis results per query type
- Fallback to full data if analysis takes >50ms

### Risk 4: Metrics endpoint performance
**Impact:** Settings page loads slowly
**Mitigation:**
- Implement 30-second client-side caching
- Use incremental metric calculation (not full scan)
- Add request debouncing on refresh button
- Lazy load dashboard component

---

## EXPECTED OUTCOMES

### Cost Reduction
- **Month 1:** $4,800 → $2,500 (48% reduction)
  - Prompt caching partially effective during rollout
  - Semantic filtering in testing phase

- **Month 2:** $2,500 → $1,400 (71% total reduction)
  - Full prompt caching deployment
  - Semantic filtering at 50% traffic

- **Month 3+:** $1,400 → $1,100 (77% total reduction)
  - All optimizations at 100% traffic
  - Cache hit rate stabilized at 85%+

### Performance Improvements
- P95 latency: Maintain <3s (cache reads are faster)
- Cache hit rate: 85%+ after warm-up period
- Token efficiency: 60% reduction in input tokens

### Monitoring Benefits
- Real-time cost visibility for stakeholders
- Early warning system for cost spikes
- A/B testing framework for future optimizations
- Historical trend analysis

---

## DEPLOYMENT STRATEGY

### Week 1: Development & Testing
- Days 1-2: Implement Phase 1 (caching)
- Day 3: Implement Phase 2 (semantic filtering)
- Day 4: Implement Phase 3 (monitoring)
- Day 5: Testing & validation

### Week 2: Staged Rollout
- Day 1-2: Deploy to development environment
- Day 3-4: Deploy to 20% of production traffic (feature flag)
- Day 5-7: Monitor metrics, compare to baseline

### Week 3: Full Deployment
- Day 1: Increase to 50% of traffic if metrics look good
- Day 3: Increase to 100% of traffic
- Day 5-7: Final validation, generate savings report

---

## MAINTENANCE & MONITORING

### Daily (Automated)
- Alert if cache hit rate drops below 70%
- Alert if daily cost exceeds $50
- Alert if P95 latency exceeds 5s

### Weekly (Manual Review)
- Review top 20 queries by cost
- Identify opportunities for further optimization
- Check for new query patterns that need field mapping

### Monthly (Strategic Review)
- Compare actual vs projected savings
- Analyze trends over time
- Report to stakeholders
- Plan next optimization iteration

---

## SUCCESS CRITERIA

This implementation will be considered successful if:

1. ✅ **Cost Reduction:** Monthly cost reduced to $1,500 or less (69%+ savings)
2. ✅ **Performance:** P95 latency remains under 3 seconds
3. ✅ **Accuracy:** No increase in user-reported data quality issues
4. ✅ **Visibility:** Stakeholders can view real-time cost metrics
5. ✅ **Sustainability:** Optimizations work without manual intervention

---

## APPENDIX A: File Changes Summary

### New Files
- `webapp/components/custom/AIMetricsDashboard.tsx` (~150 lines)
- `webapp/app/api/metrics/ai-costs/route.ts` (~60 lines)
- `webapp/lib/optimization-flags.ts` (~15 lines)
- `webapp/scripts/measure-baseline-costs.ts` (~50 lines)

### Modified Files
- `webapp/lib/skills.ts` - Add `generateCacheableSkillsCatalog()`
- `webapp/app/api/chat/route.ts` - Enhanced caching logic
- `webapp/lib/employee-context.ts` - Semantic field filtering
- `webapp/lib/performance-monitor.ts` - Cache-specific metrics
- `webapp/app/settings/page.tsx` - Add monitoring section

### Total Lines of Code: ~800 lines

---

## NEXT STEPS

1. **Review this plan** - Confirm approach aligns with expectations
2. **Set up feature flags** - Create environment variables for A/B testing
3. **Begin Phase 1** - Implement prompt caching enhancements
4. **Schedule check-ins** - Daily standups during implementation week

**Estimated Completion:** November 12, 2025 (7 days from now)

---

**Questions or concerns?** Reach out before implementation begins.
