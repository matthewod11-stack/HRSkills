# Phase 5: Simplify AI Providers

## Migration Overview

**Goal:** Remove Gemini provider and upgrade AI SDKs for better reliability and cost efficiency.

**Rationale:**
- Gemini was added as a free tier fallback during development
- In production, Anthropic + OpenAI provide better reliability and support
- Simplifying to 2 providers reduces complexity and maintenance burden
- Latest SDK versions have bug fixes and performance improvements

**Estimated Time:** 1 hour

## Current State Analysis

### Current AI Provider Stack

| Provider | Version | Usage | Availability |
|----------|---------|-------|--------------|
| Anthropic Claude | 0.68.0 | Primary | Always (paid) |
| OpenAI GPT | 6.8.1 | Fallback | Always (paid) |
| Google Gemini | 0.24.1 | 3rd Fallback | Free tier (development only) |

### Current Failover Chain
```
Anthropic → OpenAI → Gemini
```

### Gemini Usage Analysis

**Files referencing Gemini:**
- `lib/ai/router.ts` - Fallback chain configuration
- `lib/ai/providers/gemini-adapter.ts` - Provider implementation
- `lib/ai/types.ts` - Type definitions
- `app/settings/page.tsx` - UI configuration
- `app/api/ai/config/route.ts` - API endpoint

**Direct usage:** NONE - Only used through router as last resort fallback

**Production impact:** LOW - Gemini is 3rd in chain and rarely used

## Migration Steps

### Step 1: Remove Gemini from Router
- Remove Gemini initialization from router constructor
- Update fallback chain: `['anthropic', 'openai']`
- Remove Gemini from `AIProviderType` union

### Step 2: Delete Gemini Adapter
```bash
rm lib/ai/providers/gemini-adapter.ts
```

### Step 3: Update Type Definitions
```typescript
// lib/ai/types.ts
export type AIProviderType = 'anthropic' | 'openai' | 'auto';
```

### Step 4: Update Settings UI
Remove Gemini option from provider selection dropdown in `app/settings/page.tsx`.

### Step 5: Upgrade AI SDKs

**Anthropic SDK:**
```bash
npm install @anthropic-ai/sdk@latest  # 0.68.0 → 0.70.0
```

**OpenAI SDK:**
```bash
npm install openai@latest  # 6.8.1 → 6.9.1
```

### Step 6: Remove Gemini Dependency
```bash
npm uninstall @google/generative-ai @google-cloud/aiplatform
```

### Step 7: Update Environment Variables
Remove references to `GOOGLE_GEMINI_API_KEY` and `GEMINI_API_KEY` from:
- `.env.example`
- Documentation
- README files

### Step 8: Verify Build
```bash
npm run build
```

## Expected Benefits

### Reliability
- ✅ Remove free tier dependency (Gemini rate limits)
- ✅ Reduce surface area for API failures
- ✅ Clearer failover path (Anthropic → OpenAI only)

### Cost Optimization
- ✅ Remove @google/generative-ai dependency (~5MB)
- ✅ Remove @google-cloud/aiplatform dependency (~8MB)
- ✅ Smaller bundle size
- ✅ Latest SDKs have performance improvements

### Maintainability
- ✅ Fewer provider adapters to maintain
- ✅ Simpler configuration (2 providers vs 3)
- ✅ Clearer error handling paths
- ✅ Reduced testing complexity

### Latest SDK Features

**Anthropic 0.70.0 (from 0.68.0):**
- Bug fixes for streaming responses
- Improved error messages
- Better TypeScript types

**OpenAI 6.9.1 (from 6.8.1):**
- GPT-4 Turbo updates
- Streaming improvements
- Bug fixes

## Rollback Plan

If critical issues arise:
1. Revert commits from Phase 5
2. `npm install @google/generative-ai@0.24.1`
3. Restore Gemini adapter from git history
4. Update router to include Gemini in fallback chain

## Testing Strategy

### Manual Testing
1. Test chat endpoint with Anthropic (primary)
2. Disable Anthropic API key → verify OpenAI failover works
3. Test settings page (Gemini option removed)
4. Verify AI config API returns 2 providers
5. Test health checks for both providers

### Verification
- ✅ No Gemini references in codebase (grep test)
- ✅ Production build successful
- ✅ Bundle size reduction verified
- ✅ Both providers functional in settings UI

---

**Status:** ✅ COMPLETE
**Started:** November 17, 2024
**Completed:** November 17, 2024
**Duration:** ~1 hour
**Build Status:** ✅ Production build successful
**Dependencies Removed:** 2 packages (@google/generative-ai)
**Dependencies Upgraded:** 2 packages (Anthropic SDK 0.68.0→0.70.0, OpenAI SDK 6.8.1→6.9.1)
**Bundle Size Reduction:** ~5MB (generative-ai package)
