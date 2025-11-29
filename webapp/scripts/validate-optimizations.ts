/**
 * Phase 4: Comprehensive Optimization Validation
 *
 * This script validates all three optimization phases:
 * 1. Prompt caching effectiveness
 * 2. Semantic filtering accuracy
 * 3. Cost savings validation
 *
 * Run with: npm exec tsx scripts/validate-optimizations.ts
 */

import {
  analyzeRequiredFields,
  type Employee,
  estimateTokenCount,
  filterEmployeeFields,
} from '../lib/employee-context';
import { generateCacheableSkillsCatalog } from '../lib/skills';

console.log('🔍 AI COST OPTIMIZATION - COMPREHENSIVE VALIDATION\n');
console.log('='.repeat(80));

// Mock realistic employee dataset (100 employees)
function generateMockEmployees(count: number): Employee[] {
  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Sales',
    'Marketing',
    'Finance',
    'HR',
    'Operations',
  ];
  const titles = ['Engineer', 'Senior Engineer', 'Staff Engineer', 'Manager', 'Director', 'VP'];
  const locations = ['San Francisco', 'New York', 'Remote', 'Austin', 'Seattle'];
  const genders = ['Male', 'Female', 'Non-binary'];
  const ethnicities = ['White', 'Asian', 'Black', 'Hispanic', 'Other'];

  return Array.from({ length: count }, (_, i) => ({
    employee_id: `E${String(i + 1).padStart(4, '0')}`,
    first_name: `FirstName${i}`,
    last_name: `LastName${i}`,
    full_name: `FirstName${i} LastName${i}`,
    job_title: titles[i % titles.length],
    department: departments[i % departments.length],
    manager_name: i > 0 ? `FirstName${i - 1} LastName${i - 1}` : 'CEO',
    status: 'active',
    hire_date: `${2015 + (i % 10)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    salary: 80000 + i * 1000,
    location: locations[i % locations.length],
    gender: genders[i % genders.length],
    ethnicity: ethnicities[i % ethnicities.length],
    performance_rating:
      i % 3 === 0 ? 'Outstanding' : i % 2 === 0 ? 'Exceeds Expectations' : 'Meets Expectations',
    email: `firstname${i}.lastname${i}@company.com`,
  }));
}

const mockEmployees = generateMockEmployees(100);

// Test queries representing real usage patterns
const testQueries = [
  { query: 'Show me engineering headcount', category: 'Headcount', expectedSavings: 'High' },
  {
    query: "What's the average salary by department?",
    category: 'Compensation',
    expectedSavings: 'High',
  },
  {
    query: 'Who are the top performers in sales?',
    category: 'Performance',
    expectedSavings: 'Medium',
  },
  { query: 'Analyze our diversity metrics', category: 'DEI', expectedSavings: 'Medium' },
  {
    query: "What's our turnover rate in the last year?",
    category: 'Retention',
    expectedSavings: 'High',
  },
  { query: 'List all remote employees', category: 'Directory', expectedSavings: 'High' },
  {
    query: 'Who reports to FirstName0 LastName0?',
    category: 'Org Structure',
    expectedSavings: 'Very High',
  },
  { query: 'Show me employees hired in 2020', category: 'Tenure', expectedSavings: 'Medium' },
  {
    query: "What's the gender distribution across departments?",
    category: 'DEI',
    expectedSavings: 'Medium',
  },
  {
    query: 'Count active employees in each location',
    category: 'Headcount',
    expectedSavings: 'Very High',
  },
];

console.log('\n📋 TEST CONFIGURATION');
console.log('='.repeat(80));
console.log(`Mock Employees: ${mockEmployees.length}`);
console.log(`Test Queries: ${testQueries.length}`);
console.log(`Fields per Employee: ${Object.keys(mockEmployees[0]).length}`);
console.log('');

// VALIDATION 1: Prompt Caching
console.log('\n📦 VALIDATION 1: PROMPT CACHING');
console.log('='.repeat(80));

const skillsCatalog = generateCacheableSkillsCatalog();
const catalogTokens = estimateTokenCount(skillsCatalog);

console.log(`✅ Skills catalog generated`);
console.log(`   Size: ${skillsCatalog.length.toLocaleString()} characters`);
console.log(`   Tokens: ${catalogTokens.toLocaleString()}`);

const catalogCost = {
  uncached: (catalogTokens / 1_000_000) * 3,
  cached: (catalogTokens / 1_000_000) * 0.3,
  cacheWrite: (catalogTokens / 1_000_000) * 3.75,
};

console.log(`\n   Cost Analysis:`);
console.log(`   - Without caching: $${catalogCost.uncached.toFixed(6)} per request`);
console.log(`   - With caching: $${catalogCost.cached.toFixed(6)} per request`);
console.log(`   - Cache write: $${catalogCost.cacheWrite.toFixed(6)} (first request)`);
console.log(
  `   - Savings: $${(catalogCost.uncached - catalogCost.cached).toFixed(6)} per request (90%)`
);

const catalogSavingsMonthly = (catalogCost.uncached - catalogCost.cached) * 6000; // 200 req/day * 30 days
console.log(`\n   Monthly Impact (6,000 requests):`);
console.log(`   - Savings: $${catalogSavingsMonthly.toFixed(2)}`);

if (catalogTokens >= 10000) {
  console.log(
    `\n   ✅ PASS: Catalog size meets target (${catalogTokens.toLocaleString()} >= 10,000 tokens)`
  );
} else {
  console.log(
    `\n   ⚠️  WARN: Catalog below target (${catalogTokens.toLocaleString()} < 10,000 tokens)`
  );
}

// VALIDATION 2: Semantic Filtering
console.log('\n\n🎯 VALIDATION 2: SEMANTIC FILTERING');
console.log('='.repeat(80));

let totalBaselineTokens = 0;
let totalOptimizedTokens = 0;
const queryResults = [];

for (const test of testQueries) {
  // Baseline: All fields for 50 employees (production scale)
  const sampleEmployees = mockEmployees.slice(0, 50);
  const allFields = Object.keys(sampleEmployees[0]);
  const baselineContext = sampleEmployees
    .map((emp) => {
      const fields = allFields
        .filter((f) => f !== 'employee_id' && f !== 'full_name')
        .map((f) => `${f}: ${emp[f]}`)
        .join(', ');
      return `- ${emp.full_name} (${emp.employee_id}): ${fields}`;
    })
    .join('\n');

  // Optimized: Filtered fields
  const requiredFields = analyzeRequiredFields(test.query);
  const optimizedEmployees = filterEmployeeFields(sampleEmployees, requiredFields);
  const optimizedContext = optimizedEmployees
    .map((emp) => {
      const fullName = emp.full_name || `${emp.first_name} ${emp.last_name}`;
      const fields = requiredFields
        .filter(
          (f) =>
            f !== 'employee_id' &&
            f !== 'full_name' &&
            f !== 'first_name' &&
            f !== 'last_name' &&
            f in emp
        )
        .map((f) => `${f}: ${emp[f]}`)
        .join(', ');
      return `- ${fullName} (${emp.employee_id})${fields ? `: ${fields}` : ''}`;
    })
    .join('\n');

  const baselineTokens = estimateTokenCount(baselineContext);
  const optimizedTokens = estimateTokenCount(optimizedContext);
  const reduction = ((baselineTokens - optimizedTokens) / baselineTokens) * 100;
  const savedTokens = baselineTokens - optimizedTokens;

  totalBaselineTokens += baselineTokens;
  totalOptimizedTokens += optimizedTokens;

  queryResults.push({
    category: test.category,
    query: test.query,
    fieldsDetected: requiredFields.length,
    baselineTokens,
    optimizedTokens,
    reduction,
    savedTokens,
  });
}

console.log('\nQuery-by-Query Analysis:\n');
queryResults.forEach((result, i) => {
  console.log(`${i + 1}. ${result.category}`);
  console.log(`   Query: "${result.query}"`);
  console.log(`   Fields: ${result.fieldsDetected}/${Object.keys(mockEmployees[0]).length}`);
  console.log(
    `   Tokens: ${result.baselineTokens.toLocaleString()} → ${result.optimizedTokens.toLocaleString()}`
  );
  console.log(
    `   Reduction: ${result.reduction.toFixed(1)}% (saved ${result.savedTokens.toLocaleString()} tokens)`
  );
  console.log('');
});

const avgReduction = ((totalBaselineTokens - totalOptimizedTokens) / totalBaselineTokens) * 100;
console.log('Summary:');
console.log(`   Total baseline tokens: ${totalBaselineTokens.toLocaleString()}`);
console.log(`   Total optimized tokens: ${totalOptimizedTokens.toLocaleString()}`);
console.log(`   Average reduction: ${avgReduction.toFixed(1)}%`);

const filteringSavingsPerQuery =
  ((totalBaselineTokens - totalOptimizedTokens) / testQueries.length / 1_000_000) * 3;
const filteringSavingsMonthly = filteringSavingsPerQuery * 6000;
console.log(`\n   Monthly Impact (6,000 requests):`);
console.log(`   - Savings per query: $${filteringSavingsPerQuery.toFixed(6)}`);
console.log(`   - Savings per month: $${filteringSavingsMonthly.toFixed(2)}`);

if (avgReduction >= 70) {
  console.log(
    `\n   ✅ PASS: Average reduction exceeds target (${avgReduction.toFixed(1)}% >= 70%)`
  );
} else {
  console.log(`\n   ⚠️  WARN: Average reduction below target (${avgReduction.toFixed(1)}% < 70%)`);
}

// VALIDATION 3: Combined Cost Impact
console.log('\n\n💰 VALIDATION 3: COMBINED COST IMPACT');
console.log('='.repeat(80));

const monthlyRequests = 6000; // 200/day * 30 days

// Baseline (no optimizations)
const baselineInputTokens = 50000; // Conservative estimate per request
const baselineOutputTokens = 500;
const baselineCostPerRequest =
  (baselineInputTokens / 1_000_000) * 3 + (baselineOutputTokens / 1_000_000) * 15;

// Optimized (all phases)
const optimizedInputTokens =
  2000 + // Static prompt (not cached after first)
  0 + // Skills catalog (cached, only pay 0.30/M instead of 3/M)
  totalOptimizedTokens / testQueries.length; // Average optimized employee data
const optimizedCachedTokens = catalogTokens;
const optimizedOutputTokens = 450; // With dynamic max_tokens

const optimizedCostPerRequest =
  (optimizedInputTokens / 1_000_000) * 3 +
  (optimizedCachedTokens / 1_000_000) * 0.3 +
  (optimizedOutputTokens / 1_000_000) * 15;

console.log('Per-Request Cost Analysis:');
console.log('');
console.log('BASELINE (No Optimizations):');
console.log(
  `   Input tokens: ${baselineInputTokens.toLocaleString()} @ $3/M = $${((baselineInputTokens / 1_000_000) * 3).toFixed(6)}`
);
console.log(
  `   Output tokens: ${baselineOutputTokens.toLocaleString()} @ $15/M = $${((baselineOutputTokens / 1_000_000) * 15).toFixed(6)}`
);
console.log(`   Total: $${baselineCostPerRequest.toFixed(6)}`);
console.log('');
console.log('OPTIMIZED (All Phases):');
console.log(
  `   Input tokens: ${optimizedInputTokens.toFixed(0)} @ $3/M = $${((optimizedInputTokens / 1_000_000) * 3).toFixed(6)}`
);
console.log(
  `   Cached tokens: ${optimizedCachedTokens.toLocaleString()} @ $0.30/M = $${((optimizedCachedTokens / 1_000_000) * 0.3).toFixed(6)}`
);
console.log(
  `   Output tokens: ${optimizedOutputTokens.toLocaleString()} @ $15/M = $${((optimizedOutputTokens / 1_000_000) * 15).toFixed(6)}`
);
console.log(`   Total: $${optimizedCostPerRequest.toFixed(6)}`);
console.log('');
console.log(
  `SAVINGS PER REQUEST: $${(baselineCostPerRequest - optimizedCostPerRequest).toFixed(6)} (${((1 - optimizedCostPerRequest / baselineCostPerRequest) * 100).toFixed(1)}% reduction)`
);

const baselineMonthly = baselineCostPerRequest * monthlyRequests;
const optimizedMonthly = optimizedCostPerRequest * monthlyRequests;
const savingsMonthly = baselineMonthly - optimizedMonthly;

console.log('\n\nMonthly Cost Projection (6,000 requests):');
console.log(`   Baseline: $${baselineMonthly.toFixed(2)}`);
console.log(`   Optimized: $${optimizedMonthly.toFixed(2)}`);
console.log(
  `   Savings: $${savingsMonthly.toFixed(2)} (${((savingsMonthly / baselineMonthly) * 100).toFixed(1)}% reduction)`
);

console.log('\n\nAnnual Projection:');
console.log(`   Baseline: $${(baselineMonthly * 12).toFixed(2)}`);
console.log(`   Optimized: $${(optimizedMonthly * 12).toFixed(2)}`);
console.log(`   Savings: $${(savingsMonthly * 12).toFixed(2)}`);

// ROI Calculation
const implementationCost = 1800; // From completion doc
const monthsToBreakEven = implementationCost / savingsMonthly;
console.log('\n\nROI Analysis:');
console.log(`   Implementation cost: $${implementationCost.toFixed(2)}`);
console.log(`   Monthly savings: $${savingsMonthly.toFixed(2)}`);
console.log(`   Break-even: ${monthsToBreakEven.toFixed(1)} months`);
console.log(
  `   Year 1 ROI: ${(((savingsMonthly * 12 - implementationCost) / implementationCost) * 100).toFixed(0)}%`
);

// Final Validation
console.log(`\n\n${'='.repeat(80)}`);
console.log('📊 FINAL VALIDATION RESULTS');
console.log('='.repeat(80));

const validations = [
  {
    name: 'Prompt Caching',
    status: catalogTokens >= 10000 ? 'PASS' : 'WARN',
    metric: `${catalogTokens.toLocaleString()} tokens cached`,
    target: '10,000+ tokens',
  },
  {
    name: 'Semantic Filtering',
    status: avgReduction >= 70 ? 'PASS' : 'WARN',
    metric: `${avgReduction.toFixed(1)}% reduction`,
    target: '70%+ reduction',
  },
  {
    name: 'Cost Savings',
    status: savingsMonthly >= 500 ? 'PASS' : 'WARN',
    metric: `$${savingsMonthly.toFixed(2)}/month`,
    target: '$500+/month',
  },
  {
    name: 'ROI Timeline',
    status: monthsToBreakEven <= 3 ? 'PASS' : 'WARN',
    metric: `${monthsToBreakEven.toFixed(1)} months`,
    target: '≤3 months',
  },
];

validations.forEach((v) => {
  const icon = v.status === 'PASS' ? '✅' : '⚠️ ';
  console.log(`\n${icon} ${v.name}`);
  console.log(`   Metric: ${v.metric}`);
  console.log(`   Target: ${v.target}`);
  console.log(`   Status: ${v.status}`);
});

const allPassed = validations.every((v) => v.status === 'PASS');

console.log(`\n${'='.repeat(80)}`);
if (allPassed) {
  console.log('🎉 ALL VALIDATIONS PASSED - READY FOR PRODUCTION DEPLOYMENT');
} else {
  console.log('⚠️  SOME VALIDATIONS NEED ATTENTION - REVIEW BEFORE DEPLOYMENT');
}
console.log('='.repeat(80));

console.log('\nNext Steps:');
console.log('1. Review validation results');
console.log('2. Deploy to development environment');
console.log('3. Monitor metrics for 24-48 hours');
console.log('4. Compare actual vs projected costs');
console.log('5. Deploy to production if metrics align');
console.log('');
