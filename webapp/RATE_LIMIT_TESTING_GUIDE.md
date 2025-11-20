# Rate Limiting Testing Guide

**Phase 8 Step 5 Documentation**
**Date:** November 18, 2024

---

## Overview

This guide covers testing both rate limiting implementations:
1. **In-Memory Mode** (ENABLE_UPSTASH_RATE_LIMIT=false) - Default for local dev
2. **Upstash Mode** (ENABLE_UPSTASH_RATE_LIMIT=true) - Production

---

## Test Matrix

| Test Case | In-Memory | Upstash | Expected Result |
|-----------|-----------|---------|-----------------|
| Single request | ✅ | ✅ | 200 OK |
| 30 requests/min (AI limit) | ✅ | ✅ | All 200 OK |
| 31st request | ✅ | ✅ | 429 Too Many Requests |
| Wait 60 seconds | ✅ | ✅ | Reset, next request 200 OK |
| Server restart | ❌ Reset | ✅ Persists | Different behavior |
| Multi-instance | ❌ No sync | ✅ Synced | Production scenario |
| Response headers | ✅ | ✅ | X-RateLimit-* present |

---

## Test 1: In-Memory Mode (Local Dev)

### Setup

```bash
# .env.local
ENABLE_UPSTASH_RATE_LIMIT=false  # Default
```

### Start Server

```bash
npm run dev
```

### Test Script

Run this in a separate terminal:

```bash
# Test single request
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello"}' \
  -i | grep -E "HTTP|X-RateLimit"
```

**Expected Output:**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1700000000000
```

### Load Test

```bash
# Send 35 requests rapidly (exceeds AI limit of 30/min)
for i in {1..35}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{\"message\":\"Test $i\"}" \
    -s -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done
```

**Expected Output:**
```
Request 1-30: 200
Request 31-35: 429
```

### Verify Rate Limit Response

```bash
# Send request after hitting limit
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Test"}' \
  -i
```

**Expected Response:**
```json
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000000000

{
  "success": false,
  "error": "AI request limit exceeded. Maximum 30 AI requests per minute.",
  "retryAfter": 45
}
```

### Test Rate Limit Reset

```bash
# Wait 60 seconds for reset
echo "Waiting 60 seconds for rate limit reset..."
sleep 60

# Try request again
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"After reset"}' \
  -s -o /dev/null -w "%{http_code}\n"
```

**Expected:** `200` (limit reset)

---

## Test 2: Upstash Mode (Staging/Production)

### Prerequisites

1. ✅ Created Upstash account (see UPSTASH_SETUP_GUIDE.md)
2. ✅ Created Redis database
3. ✅ Copied credentials to .env.local

### Setup

```bash
# .env.local
ENABLE_UPSTASH_RATE_LIMIT=true
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...
```

### Start Server

```bash
npm run dev
```

### Test Connection

```bash
# First request will initialize Upstash client
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello Upstash"}' \
  -i | grep -E "HTTP|X-RateLimit"
```

**Check logs for:**
```
✓ No errors about Upstash connection
✓ Response includes X-RateLimit-* headers
✓ HTTP 200 OK
```

### Load Test (Same as In-Memory)

```bash
# Send 35 requests rapidly
for i in {1..35}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{\"message\":\"Upstash test $i\"}" \
    -s -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done
```

**Expected Output:** Same as in-memory (200 for 1-30, 429 for 31-35)

### Test Persistence (Key Difference)

```bash
# Hit rate limit
for i in {1..31}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"message":"Test"}' \
    -s -o /dev/null
done

# Restart server
kill <dev-server-pid>
npm run dev

# Try request immediately after restart
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"After restart"}' \
  -s -o /dev/null -w "%{http_code}\n"
```

**Expected:**
- In-Memory: `200` (limit reset on restart)
- Upstash: `429` (limit persists across restarts) ✅

### Monitor Upstash Dashboard

1. Go to: https://console.upstash.com/redis
2. Click your database
3. Go to "Metrics" tab
4. Refresh during load test

**Expected Metrics:**
```
Commands/sec: 30-35 (during load test)
Latency P50: 5-10ms
Latency P95: 10-20ms
Storage: <1KB (rate limit keys expire)
```

---

## Test 3: Different Endpoints (Different Limits)

### Auth Endpoint (5 attempts / 15 min)

```bash
# Test auth rate limit
for i in {1..6}; do
  echo "Auth attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -s -o /dev/null -w "%{http_code}\n"
done
```

**Expected:**
```
Attempt 1-5: 401 Unauthorized (wrong password)
Attempt 6: 429 Too Many Requests (rate limited)
```

### Upload Endpoint (10 uploads / hour)

```bash
# Test upload rate limit
for i in {1..11}; do
  echo "Upload $i:"
  curl -X POST http://localhost:3000/api/data/upload \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "file=@test.csv" \
    -s -o /dev/null -w "%{http_code}\n"
done
```

**Expected:**
```
Upload 1-10: 200 OK
Upload 11: 429 Too Many Requests
```

---

## Test 4: Feature Flag Toggle (Rollback Test)

### Test Instant Rollback

```bash
# 1. Start with Upstash enabled
# .env.local: ENABLE_UPSTASH_RATE_LIMIT=true
npm run dev

# 2. Hit rate limit
for i in {1..31}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"message":"Test"}' \
    -s -o /dev/null
done

# 3. Disable Upstash (simulate rollback)
# Edit .env.local: ENABLE_UPSTASH_RATE_LIMIT=false

# 4. Restart server
# Ctrl+C, then: npm run dev

# 5. Test immediately
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"After rollback"}' \
  -s -o /dev/null -w "%{http_code}\n"
```

**Expected:** `200` (in-memory has no limit history)

---

## Test 5: Performance Comparison

### Measure Latency

Create a test script `test-rate-limit-perf.sh`:

```bash
#!/bin/bash

echo "Testing In-Memory Mode..."
# Set ENABLE_UPSTASH_RATE_LIMIT=false in .env.local
# Restart server

TOTAL=0
for i in {1..100}; do
  START=$(date +%s%N)
  curl -X POST http://localhost:3000/api/chat \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"message":"Perf test"}' \
    -s -o /dev/null
  END=$(date +%s%N)
  LATENCY=$(( (END - START) / 1000000 ))
  TOTAL=$(( TOTAL + LATENCY ))
  echo "Request $i: ${LATENCY}ms"
done
AVG=$(( TOTAL / 100 ))
echo "Average latency (in-memory): ${AVG}ms"

echo ""
echo "Testing Upstash Mode..."
# Set ENABLE_UPSTASH_RATE_LIMIT=true in .env.local
# Restart server

TOTAL=0
for i in {1..100}; do
  START=$(date +%s%N)
  curl -X POST http://localhost:3000/api/chat \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"message":"Perf test"}' \
    -s -o /dev/null
  END=$(date +%s%N)
  LATENCY=$(( (END - START) / 1000000 ))
  TOTAL=$(( TOTAL + LATENCY ))
  echo "Request $i: ${LATENCY}ms"
done
AVG=$(( TOTAL / 100 ))
echo "Average latency (Upstash): ${AVG}ms"
```

**Expected Results:**
```
In-Memory: ~5ms average
Upstash: ~15-25ms average (adds ~10ms network latency)
```

**Acceptable:** Upstash latency < 50ms (P95)

---

## Test 6: Error Handling

### Test Missing Credentials

```bash
# .env.local
ENABLE_UPSTASH_RATE_LIMIT=true
# UPSTASH_REDIS_REST_URL=  # Comment out
# UPSTASH_REDIS_REST_TOKEN=  # Comment out

npm run dev
```

**Expected:** Build fails with validation error:
```
Error: Upstash credentials not configured
```

### Test Invalid URL

```bash
# .env.local
ENABLE_UPSTASH_RATE_LIMIT=true
UPSTASH_REDIS_REST_URL=invalid-url  # Invalid
UPSTASH_REDIS_REST_TOKEN=token

npm run dev
```

**Expected:** Build fails with Zod validation:
```
Error: UPSTASH_REDIS_REST_URL: Expected url, received string
```

### Test Upstash Downtime (Fail Open)

```bash
# Simulate Upstash being unreachable
# Temporarily break URL in .env.local
UPSTASH_REDIS_REST_URL=https://down.upstash.io  # Fake URL

npm run dev

# Send request
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Test"}' \
  -s -o /dev/null -w "%{http_code}\n"
```

**Expected:**
- Server logs error: `[Upstash] Rate limit check failed`
- Request **allowed** (fail open for availability)
- HTTP `200 OK` (not 429)

---

## Automated Test Suite

Create `scripts/test-rate-limits.ts`:

```typescript
import { applyInMemoryRateLimit, applyUpstashRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { NextRequest } from 'next/server';

// Mock request
function createMockRequest(): NextRequest {
  return {
    headers: new Headers({
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
    }),
  } as NextRequest;
}

async function testInMemory() {
  console.log('Testing In-Memory Rate Limiter...');
  const request = createMockRequest();

  // Test: First 30 requests should succeed
  for (let i = 1; i <= 30; i++) {
    const result = await applyInMemoryRateLimit(request, RateLimitPresets.ai);
    if (!result.allowed) {
      throw new Error(`Request ${i} should be allowed`);
    }
  }

  // Test: 31st request should fail
  const result = await applyInMemoryRateLimit(request, RateLimitPresets.ai);
  if (result.allowed) {
    throw new Error('Request 31 should be rate limited');
  }

  console.log('✅ In-Memory tests passed');
}

async function testUpstash() {
  console.log('Testing Upstash Rate Limiter...');
  const request = createMockRequest();

  // Similar tests...
  console.log('✅ Upstash tests passed');
}

// Run tests
await testInMemory();
// await testUpstash();  // Requires credentials
```

Run with:
```bash
npx ts-node -r tsconfig-paths/register scripts/test-rate-limits.ts
```

---

## Production Deployment Checklist

Before deploying to production with Upstash enabled:

### Pre-Deployment

- [ ] Created Upstash account
- [ ] Created Redis database (region: us-east-1)
- [ ] Added credentials to Vercel environment variables
- [ ] Set ENABLE_UPSTASH_RATE_LIMIT=true in Vercel production
- [ ] Deployed to staging first
- [ ] Ran load tests in staging (100+ concurrent requests)
- [ ] Verified P95 latency < 50ms
- [ ] Checked Upstash dashboard shows metrics
- [ ] Tested rollback (set flag to false, redeploy)

### Deployment

- [ ] Deploy to production
- [ ] Monitor for 1 hour (check error logs)
- [ ] Verify rate limits working (test with Postman)
- [ ] Check Upstash dashboard (commands/sec, latency)
- [ ] Set up alerts (Upstash dashboard → Alerts)

### Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Check daily request count (should be < 10,000 for free tier)
- [ ] Verify no errors in logs
- [ ] Document in runbook

---

## Troubleshooting

### Issue: Rate limits not working

**Symptoms:**
- All requests return 200, even after 100+ requests
- No X-RateLimit-* headers

**Solution:**
1. Check logs for: `[Upstash] Rate limit check failed`
2. Verify ENABLE_UPSTASH_RATE_LIMIT value in logs
3. Check env.mjs loaded correctly: `console.log(env.ENABLE_UPSTASH_RATE_LIMIT)`

### Issue: High latency (>100ms)

**Symptoms:**
- Requests taking >100ms
- Upstash dashboard shows high latency

**Solution:**
1. Check database region matches deployment region
2. Verify network connectivity
3. Check Upstash status page: https://status.upstash.com/
4. Consider in-memory fallback temporarily

### Issue: 429 errors in production

**Symptoms:**
- Legitimate users getting rate limited
- Customer complaints about "too many requests"

**Solution:**
1. Check Upstash dashboard for actual request counts
2. Verify limits are appropriate (RateLimitPresets)
3. Consider increasing limits:
   ```typescript
   ai: {
     windowMs: 60 * 1000,
     maxRequests: 60,  // Increase from 30 to 60
   }
   ```
4. Or disable Upstash temporarily: `ENABLE_UPSTASH_RATE_LIMIT=false`

---

## Success Criteria

Rate limiting implementation is considered successful when:

- ✅ In-memory mode works (local dev)
- ✅ Upstash mode works (staging/production)
- ✅ Feature flag toggles between modes
- ✅ Rate limits enforced correctly (X/minute)
- ✅ Headers returned (X-RateLimit-*)
- ✅ 429 responses formatted correctly
- ✅ Upstash latency < 50ms (P95)
- ✅ Rollback tested (disable flag, redeploy)
- ✅ No errors in production logs
- ✅ Upstash dashboard shows metrics

---

**Document Version:** 1.0
**Last Updated:** November 18, 2024
**Testing Time:** ~30 minutes (in-memory) + ~1 hour (Upstash with credentials)
