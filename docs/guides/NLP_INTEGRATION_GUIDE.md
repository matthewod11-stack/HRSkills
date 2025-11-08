# Natural Language Processing (NLP) Integration Guide

## Overview

The HR Command Center integrates Google Cloud Natural Language API to provide powerful sentiment analysis, entity extraction, and content classification capabilities for HR text data including:

- Performance reviews
- Employee surveys (eNPS, engagement, pulse)
- Exit interview feedback
- Chat interactions
- Any employee-generated text

## Architecture

### Components

1. **NLP Service** (`/webapp/lib/ai-services/nlp-service.ts`)
   - Core service wrapping Google Cloud Natural Language API
   - Singleton client pattern for connection pooling
   - Response caching (5-min TTL, 500 entry limit)
   - Graceful degradation (fail-open)

2. **API Endpoints**
   - `POST /api/ai/analyze-sentiment` - Sentiment analysis (single or batch)
   - `GET /api/ai/analyze-sentiment/health` - Service health check
   - `POST /api/ai/extract-entities` - Entity extraction
   - `POST /api/surveys/analyze` - Comprehensive survey analysis

3. **Enhanced Endpoints**
   - `POST /api/performance/analyze` - Now includes sentiment scores
   - Performance reviews automatically analyzed for sentiment

4. **UI Components** (`/webapp/components/custom/SentimentWidgets.tsx`)
   - `<SentimentScore />` - Display single sentiment with visual indicators
   - `<SentimentDistribution />` - Stacked bar showing distribution
   - `<SentimentTrend />` - Compare current vs previous period
   - `<ActionableInsights />` - Display AI-generated recommendations
   - `<ThemeCloud />` - Word cloud of extracted themes
   - `<DepartmentSentiment />` - Breakdown by department
   - `<QuickStats />` - Stats grid

## Setup

### 1. Enable Google Cloud Natural Language API

```bash
# Enable the API in your Google Cloud project
gcloud services enable language.googleapis.com

# Verify it's enabled
gcloud services list --enabled | grep language
```

### 2. Service Account Permissions

Ensure your service account has the required role:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudlanguage.user"
```

### 3. Environment Variables

Add to `.env.local`:

```bash
# Google Cloud credentials (should already be set for DLP)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Enable NLP features
NEXT_PUBLIC_ENABLE_NLP=true
```

### 4. Install Dependencies

Already installed in Phase 1:

```bash
cd webapp
npm install @google-cloud/language
```

### 5. Verify Setup

Run the integration test:

```bash
npx tsx tests/ai-integration/test-nlp-service.ts
```

Expected output:
```
🧪 Testing Google Cloud Natural Language API Integration

Test 1: Checking NLP availability...
✅ NLP API is available

Test 2: Analyzing positive sentiment...
   Score: 0.85 (expected: > 0.5)
   Magnitude: 1.20
   Category: very_positive
   Confidence: high
✅ Positive sentiment detected correctly

...

✅ All NLP tests passed!
```

## Core Concepts

### Sentiment Analysis

Sentiment is measured on two dimensions:

**1. Score** (-1.0 to +1.0)
- **+0.6 to +1.0**: Very Positive - "love", "amazing", "outstanding"
- **+0.25 to +0.6**: Positive - "good", "helpful", "pleased"
- **-0.25 to +0.25**: Neutral - factual statements
- **-0.6 to -0.25**: Negative - "disappointed", "frustrated", "not great"
- **-1.0 to -0.6**: Very Negative - "terrible", "hate", "awful"

**2. Magnitude** (0.0 to ∞)
- Indicates the strength of emotion
- High magnitude + positive score = very enthusiastic
- High magnitude + negative score = very upset
- Low magnitude = neutral or mixed emotions

**3. Confidence** (high/medium/low)
- Calculated from magnitude
- High (>= 2.0): Strong emotional signal
- Medium (0.5 - 2.0): Moderate clarity
- Low (< 0.5): Uncertain or mixed

### Entity Extraction

Identifies and categorizes:
- **PERSON**: Names (employees, managers, customers)
- **ORGANIZATION**: Companies, departments, teams
- **LOCATION**: Offices, cities, countries
- **EVENT**: Meetings, projects, incidents
- **WORK_OF_ART**: Projects, initiatives, programs
- **CONSUMER_GOOD**: Products, tools
- **OTHER**: Miscellaneous entities

Each entity includes:
- Name
- Type
- Salience (0-1, importance in text)
- Mentions (frequency)
- Optional sentiment (if entity sentiment enabled)

### Content Classification

Categorizes text into topics:
- `/Business & Industrial/Human Resources/Compensation`
- `/Business & Industrial/Management/Leadership`
- `/People & Society/Social Issues/Work & Labor`

Minimum 20 words required for classification.

## API Usage

### Basic Sentiment Analysis

```typescript
import { analyzeSentiment } from '@/lib/ai-services/nlp-service'

const review = "Sarah demonstrates exceptional leadership..."
const result = await analyzeSentiment(review)

console.log(result)
// {
//   score: 0.85,
//   magnitude: 1.2,
//   sentiment: 'very_positive',
//   confidence: 'high'
// }
```

### Batch Analysis (Efficient for Multiple Texts)

```typescript
import { analyzeSentimentBatch } from '@/lib/ai-services/nlp-service'

const exitInterviews = [
  "Limited growth opportunities...",
  "Great team but compensation not competitive...",
  "Best job I've ever had!"
]

const result = await analyzeSentimentBatch(exitInterviews)

console.log(result.overall)
// {
//   avgScore: -0.15,
//   avgMagnitude: 0.8,
//   positiveCount: 1,
//   neutralCount: 0,
//   negativeCount: 2,
//   totalAnalyzed: 3
// }
```

### Entity Extraction

```typescript
import { extractEntities } from '@/lib/ai-services/nlp-service'

const text = "Sarah from Engineering mentioned that the San Francisco office needs more headcount."
const entities = await extractEntities(text)

console.log(entities)
// [
//   { name: "Sarah", type: "PERSON", salience: 0.8, mentions: 1 },
//   { name: "Engineering", type: "ORGANIZATION", salience: 0.6, mentions: 1 },
//   { name: "San Francisco", type: "LOCATION", salience: 0.5, mentions: 1 }
// ]
```

### Full Text Analysis

```typescript
import { analyzeText } from '@/lib/ai-services/nlp-service'

const result = await analyzeText(text, {
  includeEntitySentiment: true
})

console.log(result)
// {
//   sentiment: { score: -0.3, magnitude: 1.5, ... },
//   entities: [...],
//   categories: [...],
//   language: 'en'
// }
```

### Survey Analysis Endpoint

```bash
curl -X POST http://localhost:3000/api/surveys/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "surveyResponses": [
      {
        "employee_id": "EMP001",
        "response": "Limited growth opportunities",
        "department": "Engineering"
      }
    ],
    "analyzeDepartments": true
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalResponses": 50,
      "avgSentiment": -0.25,
      "sentimentDistribution": {
        "veryPositive": 5,
        "positive": 10,
        "neutral": 15,
        "negative": 15,
        "veryNegative": 5
      }
    },
    "byDepartment": {
      "Engineering": {
        "count": 20,
        "avgSentiment": -0.35,
        "topConcerns": ["Limited growth", "Compensation below market"]
      }
    },
    "themes": [...],
    "topConcerns": [...],
    "topStrengths": [...],
    "actionableInsights": [
      "⚠️ High negative sentiment detected (>30% of responses)",
      "🏢 Departments needing attention: Engineering, Sales"
    ]
  }
}
```

## Integration with Existing Skills

### Performance Review Analysis

The `/api/performance/analyze` endpoint now automatically includes sentiment:

```typescript
const response = await fetch('/api/performance/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'EMP001',
    employeeName: 'Sarah Chen'
  })
})

const { analysis } = await response.json()

console.log(analysis.sentiment)
// {
//   overall: { score: 0.75, sentiment: 'positive', ... },
//   byReviewType: {
//     manager: { score: 0.80, ... },
//     self: { score: 0.70, ... },
//     peer: { score: 0.72, ... }
//   }
// }
```

### Exit Interview Analysis

```bash
# Get all exit interviews
curl http://localhost:3000/api/surveys/analyze/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Analyze them
curl -X POST http://localhost:3000/api/surveys/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{ "surveyResponses": [...] }'
```

## Response Caching

NLP API calls are automatically cached for 5 minutes to reduce costs:

```typescript
// First call - hits API
await analyzeSentiment("I love working here!", { enableCaching: true })

// Second call within 5 min - returns cached result
await analyzeSentiment("I love working here!", { enableCaching: true })
```

Cache statistics:
```typescript
import { getCacheStats, clearSentimentCache } from '@/lib/ai-services/nlp-service'

const stats = getCacheStats()
console.log(stats)
// { size: 125, maxSize: 500, ttl: 300000 }

// Clear cache if needed (e.g., testing)
clearSentimentCache()
```

## UI Component Examples

### Display Single Sentiment Score

```tsx
import { SentimentScore } from '@/components/custom/SentimentWidgets'

<SentimentScore
  sentiment={result}
  label="Overall Team Sentiment"
  showDetails={true}
/>
```

### Show Distribution

```tsx
import { SentimentDistribution } from '@/components/custom/SentimentWidgets'

<SentimentDistribution
  distribution={{
    veryPositive: 10,
    positive: 25,
    neutral: 30,
    negative: 20,
    veryNegative: 5
  }}
  total={90}
/>
```

### Department Comparison

```tsx
import { DepartmentSentiment } from '@/components/custom/SentimentWidgets'

<DepartmentSentiment
  departments={{
    Engineering: {
      count: 45,
      avgSentiment: -0.25,
      topConcerns: ["Compensation", "Work-life balance"]
    },
    Sales: {
      count: 30,
      avgSentiment: 0.15,
      topConcerns: ["Quota pressure"]
    }
  }}
/>
```

### Action Items

```tsx
import { ActionableInsights } from '@/components/custom/SentimentWidgets'

<ActionableInsights
  insights={[
    "⚠️ High negative sentiment in Engineering (avg: -0.35)",
    "🎯 Key themes: compensation, growth, work-life balance",
    "✅ Sales sentiment improved +0.20 from last quarter"
  ]}
/>
```

## Cost Optimization

### 1. Caching

```typescript
// Enable caching (default)
await analyzeSentiment(text, { enableCaching: true })

// Disable for real-time analysis
await analyzeSentiment(text, { enableCaching: false })
```

### 2. Batch Processing

```typescript
// ❌ Inefficient - 100 API calls
for (const review of reviews) {
  await analyzeSentiment(review)
}

// ✅ Efficient - 1 batch call with caching
const result = await analyzeSentimentBatch(reviews)
```

### 3. Sampling Large Datasets

```typescript
// For datasets > 500 responses, sample
const sampleSize = Math.min(500, responses.length)
const sample = responses.slice(0, sampleSize)
const result = await analyzeSentimentBatch(sample)
```

### 4. Feature Flags

Disable NLP during development:

```bash
# .env.local
NEXT_PUBLIC_ENABLE_NLP=false
```

All NLP endpoints will return 503 Service Unavailable.

## Cost Estimates

Google Cloud Natural Language API pricing (as of 2024):

| Operation | Price (per 1000 units) | Notes |
|-----------|----------------------|-------|
| Sentiment Analysis | $1.00 | Document = 1 text |
| Entity Analysis | $1.00 | Per document |
| Entity Sentiment | $2.00 | Combined analysis |
| Classification | $1.00 | Min 20 words |

**Monthly estimates with caching:**

- 1,000 performance reviews: ~$1-2 (60% cache hit rate)
- 500 exit interviews: ~$0.50-1
- Daily sentiment monitoring: ~$10-15/month
- **Total: ~$15-25/month**

## Troubleshooting

### Error: "NLP API is not available"

1. Check credentials:
```bash
echo $GOOGLE_APPLICATION_CREDENTIALS
cat $GOOGLE_APPLICATION_CREDENTIALS | jq '.project_id'
```

2. Verify API is enabled:
```bash
gcloud services list --enabled | grep language
```

3. Test authentication:
```bash
gcloud auth application-default print-access-token
```

### Error: "Service account lacks permissions"

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudlanguage.user"
```

### Low Confidence Scores

- **Cause**: Short text or ambiguous language
- **Solution**: Combine related texts or focus on magnitude

### Cache Not Working

```typescript
import { getCacheStats } from '@/lib/ai-services/nlp-service'

const stats = getCacheStats()
console.log('Cache size:', stats.size)
console.log('Max size:', stats.maxSize)
```

## Best Practices

### 1. Text Preprocessing

```typescript
// Clean text before analysis
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, '') // Remove special chars
    .trim()
}

const cleaned = preprocessText(reviewText)
const result = await analyzeSentiment(cleaned)
```

### 2. Aggregate Scores Properly

```typescript
// ❌ Wrong - simple average loses information
const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

// ✅ Better - use batch analysis with metadata
const result = await analyzeSentimentBatch(texts)
const { avgScore, avgMagnitude, positiveCount } = result.overall
```

### 3. Handle Edge Cases

```typescript
try {
  const result = await analyzeSentiment(text)

  if (result.confidence === 'low') {
    console.warn('Low confidence score - consider manual review')
  }

  if (result.magnitude < 0.5 && Math.abs(result.score) < 0.25) {
    console.log('Neutral or mixed sentiment - unclear signal')
  }
} catch (error) {
  // Graceful degradation - NLP service fails open
  console.warn('Sentiment analysis unavailable:', error)
  return { score: 0, sentiment: 'neutral', confidence: 'low' }
}
```

### 4. Respect Rate Limits

NLP endpoints use `RateLimitPresets.ai`:
- **30 requests per minute**
- Use batch processing for large datasets

```typescript
// Split large datasets into batches
const BATCH_SIZE = 100
for (let i = 0; i < texts.length; i += BATCH_SIZE) {
  const batch = texts.slice(i, i + BATCH_SIZE)
  const result = await analyzeSentimentBatch(batch)

  // Small delay between batches
  if (i + BATCH_SIZE < texts.length) {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

## Security Considerations

### 1. PII in Sentiment Analysis

NLP service sees full text - ensure PII is handled:

```typescript
import { deidentifyText } from '@/lib/security/dlp-service'

// Deidentify before sentiment analysis if needed
const deidentified = await deidentifyText(reviewText)
const sentiment = await analyzeSentiment(deidentified)
```

### 2. Permission Checks

All NLP endpoints require:
- Valid JWT authentication
- `analytics:read` permission

```typescript
// Implemented in all endpoints
if (!hasPermission(authResult.user, 'analytics', 'read')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 3. Audit Logging

Sentiment analysis is logged:

```typescript
console.log('[NLP] Sentiment analysis:', {
  user: userId,
  textsAnalyzed: count,
  avgScore: result.overall.avgScore,
  processingTime: `${duration}ms`
})
```

## Next Steps

Phase 1 (NLP) is complete. Next phases:

- **Phase 2**: Translation API for multilingual support
- **Phase 3**: Speech-to-Text for interview transcription
- **Phase 4**: Document AI for resume parsing
- **Phase 5**: Vertex AI for predictive analytics
- **Phase 6**: Vision API for ID verification

## Support

For issues or questions:

1. Check test script: `npx tsx tests/ai-integration/test-nlp-service.ts`
2. Review logs in browser console and server logs
3. Verify environment variables
4. Check Google Cloud quotas and billing

## Additional Resources

- [Google Cloud Natural Language Documentation](https://cloud.google.com/natural-language/docs)
- [NLP Service Source Code](/webapp/lib/ai-services/nlp-service.ts)
- [API Endpoints](/webapp/app/api/ai/)
- [UI Components](/webapp/components/custom/SentimentWidgets.tsx)
- [Integration Tests](/tests/ai-integration/test-nlp-service.ts)
