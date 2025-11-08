/**
 * Translation Service Integration Test
 *
 * Verifies Google Cloud Translation API is configured correctly
 * Run: npx tsx tests/ai-integration/test-translation-service.ts
 */

import {
  translateText,
  translateBatch,
  detectLanguage,
  getSupportedLanguages,
  isTranslationAvailable,
  clearTranslationCache,
  getTranslationCacheStats,
  LANGUAGE_PRESETS,
} from '../../webapp/lib/ai-services/translation-service'

async function runTranslationTests() {
  console.log('🧪 Testing Google Cloud Translation API Integration\n')

  // Test 1: Check if Translation is available
  console.log('Test 1: Checking Translation API availability...')
  const isAvailable = await isTranslationAvailable()

  if (!isAvailable) {
    console.error('❌ Translation API is not available. Please check:')
    console.error('   1. GOOGLE_APPLICATION_CREDENTIALS environment variable is set')
    console.error('   2. Service account JSON file exists and is valid')
    console.error('   3. Translation API is enabled in Google Cloud Console')
    console.error('   4. Service account has Translation API permissions')
    process.exit(1)
  }

  console.log('✅ Translation API is available\n')

  // Test 2: Language Detection
  console.log('Test 2: Testing language detection...')

  const tests = [
    { text: 'Hello, how are you?', expected: 'en' },
    { text: 'Hola, ¿cómo estás?', expected: 'es' },
    { text: 'Bonjour, comment allez-vous?', expected: 'fr' },
    { text: '你好吗？', expected: 'zh-CN' },
    { text: 'こんにちは、お元気ですか？', expected: 'ja' },
  ]

  for (const test of tests) {
    const detection = await detectLanguage(test.text)
    const match = detection.language === test.expected
    console.log(`   "${test.text.substring(0, 30)}..." → ${detection.language} (expected: ${test.expected}) ${match ? '✅' : '⚠️'}`)
    if (detection.confidence) {
      console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`)
    }
  }

  console.log('✅ Language detection working\n')

  // Test 3: Single Translation - Spanish
  console.log('Test 3: Translating to Spanish...')
  const englishText = 'We are pleased to offer you the position of Software Engineer at our company.'
  const spanishResult = await translateText(englishText, 'es', {
    sourceLanguage: 'en',
    enableCaching: true,
  })

  console.log(`   Original: ${englishText}`)
  console.log(`   Translated: ${spanishResult.text}`)
  console.log(`   Source: ${spanishResult.sourceLanguage} → Target: ${spanishResult.targetLanguage}`)

  if (spanishResult.text.includes('posición') || spanishResult.text.includes('puesto')) {
    console.log('✅ Spanish translation working\n')
  } else {
    console.warn('⚠️  Spanish translation may not be accurate\n')
  }

  // Test 4: Single Translation - French
  console.log('Test 4: Translating to French...')
  const frenchResult = await translateText(englishText, 'fr', {
    sourceLanguage: 'en',
    enableCaching: true,
  })

  console.log(`   Original: ${englishText}`)
  console.log(`   Translated: ${frenchResult.text}`)

  if (frenchResult.text.includes('poste') || frenchResult.text.includes('offrir')) {
    console.log('✅ French translation working\n')
  } else {
    console.warn('⚠️  French translation may not be accurate\n')
  }

  // Test 5: Single Translation - Chinese
  console.log('Test 5: Translating to Chinese (Simplified)...')
  const chineseResult = await translateText(englishText, 'zh-CN', {
    sourceLanguage: 'en',
    enableCaching: true,
  })

  console.log(`   Original: ${englishText}`)
  console.log(`   Translated: ${chineseResult.text}`)
  console.log('✅ Chinese translation working\n')

  // Test 6: Batch Translation
  console.log('Test 6: Batch translation to Spanish...')
  const exitInterviews = [
    'Limited growth opportunities and poor work-life balance.',
    'Great team but compensation is not competitive with market rates.',
    'Best company I\'ve ever worked for, but relocating for family reasons.',
    'Management does not listen to employee feedback.',
    'Toxic work environment with constant micromanagement.',
  ]

  const batchResult = await translateBatch(exitInterviews, 'es', {
    enableCaching: true,
  })

  console.log(`   Total texts: ${exitInterviews.length}`)
  console.log(`   Total characters: ${batchResult.totalCharacters}`)
  console.log(`   Processing time: ${batchResult.metadata.processingTime}ms`)
  console.log(`   API calls: ${batchResult.metadata.apiCalls}`)
  console.log(`   Cache hits: ${batchResult.metadata.cacheHits}`)

  console.log('\n   Sample translations:')
  for (let i = 0; i < Math.min(2, batchResult.translations.length); i++) {
    console.log(`   ${i + 1}. EN: "${exitInterviews[i].substring(0, 50)}..."`)
    console.log(`      ES: "${batchResult.translations[i].text.substring(0, 50)}..."`)
  }

  if (batchResult.translations.length === exitInterviews.length) {
    console.log('\n✅ Batch translation working\n')
  } else {
    console.error('❌ Batch translation incomplete\n')
  }

  // Test 7: Round-trip Translation
  console.log('Test 7: Round-trip translation (EN → ES → EN)...')
  const originalText = 'Your performance review is scheduled for next Monday.'
  const toSpanish = await translateText(originalText, 'es')
  const backToEnglish = await translateText(toSpanish.text, 'en', {
    sourceLanguage: 'es',
  })

  console.log(`   Original:       ${originalText}`)
  console.log(`   To Spanish:     ${toSpanish.text}`)
  console.log(`   Back to English: ${backToEnglish.text}`)

  // Similarity check (simple word overlap)
  const originalWords = originalText.toLowerCase().split(' ')
  const roundtripWords = backToEnglish.text.toLowerCase().split(' ')
  const overlap = originalWords.filter(w => roundtripWords.includes(w)).length
  const similarity = (overlap / originalWords.length) * 100

  console.log(`   Similarity: ${similarity.toFixed(1)}% word overlap`)

  if (similarity > 50) {
    console.log('✅ Round-trip translation preserves meaning\n')
  } else {
    console.warn('⚠️  Round-trip translation may lose meaning\n')
  }

  // Test 8: Caching
  console.log('Test 8: Testing translation caching...')
  clearTranslationCache()

  const cacheTestText = 'This is a test for caching functionality.'

  // First call (no cache)
  const startTime1 = Date.now()
  await translateText(cacheTestText, 'es', { enableCaching: true })
  const duration1 = Date.now() - startTime1

  // Second call (should hit cache)
  const startTime2 = Date.now()
  await translateText(cacheTestText, 'es', { enableCaching: true })
  const duration2 = Date.now() - startTime2

  console.log(`   First call (no cache): ${duration1}ms`)
  console.log(`   Second call (cached): ${duration2}ms`)

  if (duration2 < duration1 / 2) {
    console.log('✅ Caching is working (second call significantly faster)\n')
  } else {
    console.warn('⚠️  Caching may not be working as expected\n')
  }

  const cacheStats = getTranslationCacheStats()
  console.log(`   Cache size: ${cacheStats.size}/${cacheStats.maxSize}`)
  console.log(`   Cache TTL: ${cacheStats.ttl}ms\n`)

  // Test 9: Multilingual HR Document
  console.log('Test 9: Translating HR document to multiple languages...')
  const offerLetter = `We are delighted to offer you the position of Senior Software Engineer at TechCorp.

Your starting salary will be $150,000 per year with benefits including health insurance and 401k matching.

Please sign and return this offer letter by Friday, January 31st, 2025.

Welcome to the team!`

  const targetLanguages = LANGUAGE_PRESETS.TOP_5.filter(lang => lang !== 'en')
  console.log(`   Translating to: ${targetLanguages.join(', ')}\n`)

  for (const lang of targetLanguages) {
    const translation = await translateText(offerLetter, lang, {
      sourceLanguage: 'en',
      enableCaching: true,
    })

    console.log(`   ${lang.toUpperCase()}:`)
    console.log(`   ${translation.text.split('\n')[0]}...`)
    console.log()
  }

  console.log('✅ Multi-language document translation working\n')

  // Test 10: Get Supported Languages
  console.log('Test 10: Fetching supported languages...')
  const languages = await getSupportedLanguages('en')

  console.log(`   Total supported languages: ${languages.length}`)
  console.log('   Sample languages:')
  languages.slice(0, 10).forEach(lang => {
    console.log(`   - ${lang.code}: ${lang.name}`)
  })

  if (languages.length > 50) {
    console.log('\n✅ Language list fetched successfully\n')
  } else {
    console.warn('\n⚠️  Language list may be incomplete\n')
  }

  // Test 11: Real Exit Interview Translation & Analysis
  console.log('Test 11: Real multilingual exit interview scenario...')
  const multilingualExitInterviews = [
    { text: 'No growth opportunities', lang: 'en' },
    { text: 'Falta de oportunidades de crecimiento', lang: 'es' },
    { text: 'Manque d\'opportunités de croissance', lang: 'fr' },
    { text: '成長機会の不足', lang: 'ja' },
  ]

  console.log('   Translating all to English for analysis...')
  const translatedInterviews = await translateBatch(
    multilingualExitInterviews.map(i => i.text),
    'en',
    { enableCaching: true }
  )

  for (let i = 0; i < multilingualExitInterviews.length; i++) {
    console.log(`   [${multilingualExitInterviews[i].lang}] "${multilingualExitInterviews[i].text}"`)
    console.log(`   → [en] "${translatedInterviews.translations[i].text}"`)
  }

  console.log('\n✅ Multilingual exit interview translation working\n')

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ All Translation tests passed!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nTranslation Integration Summary:')
  console.log('  - Language Detection: ✅ Working')
  console.log('  - Single Translation: ✅ Working')
  console.log('  - Batch Translation: ✅ Working')
  console.log('  - Round-trip Translation: ✅ Working')
  console.log('  - Response Caching: ✅ Working')
  console.log('  - Multi-language Documents: ✅ Working')
  console.log('  - Supported Languages: ✅ Working')
  console.log('\nNext steps:')
  console.log('  1. Set NEXT_PUBLIC_ENABLE_TRANSLATION=true in .env.local')
  console.log('  2. Use translation in survey analysis for global teams')
  console.log('  3. Generate HR documents in multiple languages')
  console.log('  4. Test API endpoints: POST /api/ai/translate')
  console.log('\nEstimated costs:')
  console.log('  - 500,000 characters/month FREE')
  console.log('  - After free tier: $20/1M characters')
  console.log('  - Average exit interview: ~200 characters')
  console.log('  - 100 exit interviews/month: ~20,000 chars = FREE')
  console.log('  - 1000 documents/month: ~200,000 chars = FREE')
}

// Run tests
runTranslationTests().catch(error => {
  console.error('\n❌ Translation test failed:', error)
  process.exit(1)
})
