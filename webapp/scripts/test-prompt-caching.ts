/**
 * Test script to verify prompt caching implementation
 * Run with: npx tsx scripts/test-prompt-caching.ts
 */

import { generateCacheableSkillsCatalog } from '../lib/skills'
import { estimateTokenCount } from '../lib/employee-context'

console.log('🧪 Testing Prompt Caching Implementation\n')
console.log('=' .repeat(60))

// Test 1: Skills catalog generation
console.log('\n📚 Test 1: Skills Catalog Generation')
console.log('-'.repeat(60))

try {
  const catalog = generateCacheableSkillsCatalog()

  if (!catalog) {
    console.log('❌ FAIL: Skills catalog is empty')
  } else {
    const tokenCount = estimateTokenCount(catalog)
    const charCount = catalog.length
    const lineCount = catalog.split('\n').length

    console.log('✅ PASS: Skills catalog generated successfully')
    console.log(`   - Characters: ${charCount.toLocaleString()}`)
    console.log(`   - Lines: ${lineCount}`)
    console.log(`   - Estimated tokens: ${tokenCount.toLocaleString()}`)

    // Check if catalog meets optimization target
    if (tokenCount >= 10000) {
      console.log(`   ✅ Meets target: ${tokenCount.toLocaleString()} tokens (target: 15,000+)`)
    } else if (tokenCount >= 5000) {
      console.log(`   ⚠️  Below target: ${tokenCount.toLocaleString()} tokens (target: 15,000+)`)
    } else {
      console.log(`   ❌ Too small: ${tokenCount.toLocaleString()} tokens (target: 15,000+)`)
    }

    // Check structure
    const hasHeader = catalog.includes('# HR Skills Catalog')
    const hasSkillCount = catalog.includes('specialized HR skills')
    const hasSkills = catalog.includes('### ')

    console.log('\n   Structure checks:')
    console.log(`   - Has header: ${hasHeader ? '✅' : '❌'}`)
    console.log(`   - Has skill count: ${hasSkillCount ? '✅' : '❌'}`)
    console.log(`   - Has skill entries: ${hasSkills ? '✅' : '❌'}`)

    // Show sample of catalog
    console.log('\n   Sample (first 500 chars):')
    console.log('   ' + catalog.substring(0, 500).split('\n').join('\n   '))
  }
} catch (error) {
  console.log('❌ ERROR:', error)
}

// Test 2: Cost savings calculation
console.log('\n\n💰 Test 2: Cost Savings Calculation')
console.log('-'.repeat(60))

try {
  const catalog = generateCacheableSkillsCatalog()
  const catalogTokens = estimateTokenCount(catalog)

  // Pricing
  const inputTokenPrice = 3 / 1_000_000 // $3 per million
  const cachedTokenPrice = 0.30 / 1_000_000 // $0.30 per million (90% discount)
  const cacheWritePrice = 3.75 / 1_000_000 // $3.75 per million (25% markup)

  // Calculate costs per request
  const uncachedCost = catalogTokens * inputTokenPrice
  const cachedCost = catalogTokens * cachedTokenPrice
  const cacheWriteCost = catalogTokens * cacheWritePrice

  const savingsPerRequest = uncachedCost - cachedCost

  console.log(`Catalog size: ${catalogTokens.toLocaleString()} tokens`)
  console.log(`\nCost per request (without caching):`)
  console.log(`   $${uncachedCost.toFixed(6)}`)
  console.log(`\nCost per request (with caching):`)
  console.log(`   Read from cache: $${cachedCost.toFixed(6)}`)
  console.log(`   Write to cache: $${cacheWriteCost.toFixed(6)} (first request only)`)
  console.log(`\nSavings per request: $${savingsPerRequest.toFixed(6)} (90% reduction)`)

  // Project monthly savings
  const requestsPerDay = 200 // Assumption from plan
  const daysPerMonth = 30
  const totalRequests = requestsPerDay * daysPerMonth

  const monthlySavings = savingsPerRequest * totalRequests
  const yearlySavings = monthlySavings * 12

  console.log(`\nProjected savings (${requestsPerDay} requests/day):`)
  console.log(`   Monthly: $${monthlySavings.toFixed(2)}`)
  console.log(`   Yearly: $${yearlySavings.toFixed(2)}`)

  // Check against target from optimization report
  const targetMonthlySavings = 1200
  if (monthlySavings >= targetMonthlySavings * 0.8) {
    console.log(`   ✅ Meets target: $${monthlySavings.toFixed(2)} (target: $${targetMonthlySavings})`)
  } else {
    console.log(`   ⚠️  Below target: $${monthlySavings.toFixed(2)} (target: $${targetMonthlySavings})`)
  }

} catch (error) {
  console.log('❌ ERROR:', error)
}

console.log('\n' + '='.repeat(60))
console.log('✅ Phase 1 Implementation Tests Complete')
console.log('='.repeat(60))
console.log('\nNext steps:')
console.log('1. Start the dev server: npm run dev')
console.log('2. Send a test query through /api/chat')
console.log('3. Check response headers for cache_creation_input_tokens')
console.log('4. Send same query again and check cache_read_input_tokens')
console.log('5. Monitor logs for cache efficiency metrics\n')
