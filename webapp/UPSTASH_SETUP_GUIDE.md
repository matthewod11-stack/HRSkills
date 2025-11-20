# Upstash Rate Limiting Setup Guide

**Phase 8 Step 1 Documentation**
**Date:** November 18, 2024

---

## Overview

This guide walks through setting up Upstash Redis for distributed rate limiting in the HR Command Center application.

**Benefits of Upstash:**
- ✅ Distributed rate limiting (survives server restarts)
- ✅ Multi-instance support (scales horizontally)
- ✅ REST API (no VPC/networking setup needed)
- ✅ Free tier: 10,000 commands/day
- ✅ Global replication available
- ✅ Built-in analytics dashboard

**When to Use:**
- **Local Development:** Use in-memory limiter (ENABLE_UPSTASH_RATE_LIMIT=false)
- **Staging/Production:** Use Upstash (ENABLE_UPSTASH_RATE_LIMIT=true)

---

## Step 1: Create Upstash Account

1. **Visit Upstash Console**
   - Go to: https://console.upstash.com/
   - Click "Sign up" (or use GitHub/Google OAuth)

2. **Verify Email**
   - Check your inbox for verification email
   - Click the verification link

3. **Complete Profile**
   - Enter your name and company (optional)
   - Accept terms of service

---

## Step 2: Create Redis Database

1. **Create New Database**
   - Click "Create database" button
   - Or navigate to: https://console.upstash.com/redis

2. **Database Configuration**
   ```
   Name: hrskills-rate-limiting
   Type: Regional (recommended for lower latency)
   Region: Choose closest to your deployment
           - US East (N. Virginia) for Vercel us-east-1
           - US West (Oregon) for Vercel us-west-1
           - Europe (Frankfurt) for EU deployments
   Eviction: noeviction (default)
   TLS: Enabled (recommended)
   ```

3. **Create Database**
   - Click "Create" button
   - Wait 10-15 seconds for provisioning

---

## Step 3: Get API Credentials

1. **Navigate to Database**
   - Click on your newly created database
   - Go to "REST API" tab (not "Connect" tab)

2. **Copy Credentials**
   ```bash
   # You'll see two values:
   UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Add to .env.local**
   ```bash
   # Enable Upstash rate limiting
   ENABLE_UPSTASH_RATE_LIMIT=true

   # Paste your credentials
   UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 4: Verify Configuration

1. **Test Environment Variables**
   ```bash
   cd /Users/mattod/Desktop/HRSkills/webapp
   npm run build
   ```

   If successful, you'll see:
   ```
   ✓ Compiled successfully
   ```

2. **Check env.mjs Validation**
   - Credentials are validated at app startup
   - If URL is invalid, you'll see: "Expected url, received..."
   - If token is missing, you'll see: "String must contain at least 1 character(s)"

---

## Step 5: Deployment Configuration

### Local Development (Recommended)

```bash
# .env.local
ENABLE_UPSTASH_RATE_LIMIT=false
```

**Why?**
- Faster development (no network latency)
- No external dependencies
- Unlimited rate limit testing
- Free (no API costs)

### Vercel Staging

1. Navigate to: https://vercel.com/your-team/hrskills/settings/environment-variables
2. Add variables for **Preview** environment:
   ```
   ENABLE_UPSTASH_RATE_LIMIT=true
   UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxx...
   ```
3. Deploy: `git push origin staging`

### Vercel Production

1. Same as staging, but select **Production** environment
2. Deploy: `git push origin main`

---

## Rollback Plan

If Upstash causes issues in production:

### Option 1: Instant Rollback (No Deploy)

1. Go to Vercel dashboard → Environment Variables
2. Find `ENABLE_UPSTASH_RATE_LIMIT`
3. Change value to `false`
4. Click "Save"
5. **No redeployment needed** - change takes effect on next request

### Option 2: Emergency Deployment

```bash
# Update .env.local
ENABLE_UPSTASH_RATE_LIMIT=false

# Deploy immediately
git commit -am "Disable Upstash rate limiting"
git push origin main
```

Deployment time: ~2 minutes on Vercel

---

## Monitoring

### Upstash Dashboard

1. Go to: https://console.upstash.com/redis
2. Click your database
3. Go to "Metrics" tab

**Key Metrics:**
- **Commands/sec**: Rate limit checks per second
- **Latency**: P50, P95, P99 response times (should be <10ms)
- **Storage**: Memory usage (should be minimal for rate limiting)
- **Daily Requests**: Track against free tier (10,000/day)

### Expected Metrics (Production)

```
Commands/sec: 10-50 (depends on traffic)
Latency P50: 5-8ms
Latency P95: 10-15ms
Storage: <1MB (rate limit keys expire quickly)
Daily Requests: ~500-2000 (typical small app)
```

### Alerts

**Set up alerts for:**
- Latency P95 > 50ms (performance degradation)
- Daily requests > 9,000 (approaching free tier limit)
- Error rate > 1% (connection issues)

---

## Cost Estimation

### Free Tier (Current Plan)

```
Limit: 10,000 commands/day
Cost: $0/month

Typical usage:
- Rate limit check: 1 command
- 500 API requests/day: 500 commands
- Well within free tier ✓
```

### If You Outgrow Free Tier

**Pay-as-you-go:**
- $0.2 per 100,000 commands
- Example: 100,000 API requests/day = 100,000 commands = $0.20/day = $6/month

**Fixed Plans:**
- Pro 3K: $10/month (300,000 commands/day)
- Pro 10K: $80/month (1M commands/day)

---

## Testing Checklist

Before enabling in production:

- [ ] Created Upstash account
- [ ] Created Redis database (choose nearest region)
- [ ] Copied REST API credentials
- [ ] Added credentials to .env.local
- [ ] Set ENABLE_UPSTASH_RATE_LIMIT=true (local test)
- [ ] Ran `npm run build` (verify no errors)
- [ ] Tested rate limiting in local dev
- [ ] Deployed to Vercel staging
- [ ] Load tested staging environment
- [ ] Checked Upstash dashboard metrics
- [ ] Verified P95 latency <20ms
- [ ] Tested rollback (set flag to false)
- [ ] Documented credentials in password manager

---

## Troubleshooting

### Issue: "Module not found: @upstash/ratelimit"

**Solution:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Issue: "UPSTASH_REDIS_REST_URL must be a valid URL"

**Solution:**
- Check .env.local has correct URL format
- URL should start with `https://`
- URL should end with `.upstash.io`
- Example: `https://us1-merry-goldfish-12345.upstash.io`

### Issue: "Unauthorized" or "Invalid token"

**Solution:**
- Verify UPSTASH_REDIS_REST_TOKEN is correct
- Go to Upstash console → Database → REST API tab
- Copy token again (may have trailing whitespace)
- Restart development server after updating .env.local

### Issue: High latency (>100ms)

**Solution:**
- Check database region matches deployment region
- If database in `eu-west-1` but app in `us-east-1`, latency will be high
- Create new database in correct region
- Update credentials in .env

### Issue: "Daily request limit exceeded"

**Solution:**
- Free tier: 10,000 commands/day
- Check Upstash dashboard for current usage
- Options:
  1. Temporarily disable: `ENABLE_UPSTASH_RATE_LIMIT=false`
  2. Upgrade to paid tier ($10/month)
  3. Optimize: Cache rate limit results for 1 second

---

## Security Best Practices

### Credential Management

1. **Never commit credentials**
   ```bash
   # .env.local is already in .gitignore ✓
   # Verify:
   cat .gitignore | grep .env.local
   ```

2. **Use environment variables**
   - Local: .env.local
   - Vercel: Environment Variables dashboard
   - Never hardcode in code

3. **Rotate tokens periodically**
   - Go to Upstash console → Database → Settings → Rotate Token
   - Update all environments (local, staging, production)

4. **Restrict access**
   - Upstash console: Add team members with specific roles
   - Don't share credentials via email/Slack
   - Use password manager (1Password, LastPass, etc.)

### Network Security

1. **Use TLS**
   - Always use `https://` URLs (TLS enabled by default)
   - Never use `http://` (unencrypted)

2. **IP Allowlist (Optional)**
   - Upstash console → Database → Security → IP Allowlist
   - Add Vercel IP ranges if needed
   - Not required for REST API (token-based auth sufficient)

---

## Next Steps

After completing this setup:

1. ✅ **Mark Step 1 Complete** - Upstash account and env configuration done
2. ⏭️ **Proceed to Step 2** - Implement feature flag strategy (30 min)
3. ⏭️ **Proceed to Step 3** - Create async Upstash wrapper (2 hours)

---

## Additional Resources

- **Upstash Docs**: https://docs.upstash.com/redis
- **Rate Limiting Guide**: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- **REST API Reference**: https://docs.upstash.com/redis/features/restapi
- **Pricing**: https://upstash.com/pricing
- **Status Page**: https://status.upstash.com/

---

**Document Version:** 1.0
**Last Updated:** November 18, 2024
**Setup Time:** ~15 minutes (account creation + database setup)
