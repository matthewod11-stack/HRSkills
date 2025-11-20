# Environment Variable Inventory

**Generated:** November 18, 2024
**Purpose:** Complete inventory for Phase 7 T3 Env migration
**Total Count:** 55+ variables (including dynamic patterns)

---

## Server-Only Variables (32)

Variables that MUST NOT be exposed to the client (API keys, secrets, server configs).

| Variable | Type | Used In | Files | Required | Default | Notes |
|----------|------|---------|-------|----------|---------|-------|
| `ANTHROPIC_API_KEY` | string | AI Provider | lib/ai/providers/anthropic-adapter.ts<br>lib/ai/shared-key-manager.ts<br>lib/api-helpers/anthropic-client.ts | ✅ Yes | - | Primary AI provider |
| `ANTHROPIC_MANAGED_KEY` | string | AI Provider | lib/ai/shared-key-manager.ts | ❌ No | - | Shared managed key alternative |
| `OPENAI_API_KEY` | string | AI Provider | lib/ai/providers/openai-adapter.ts | ❌ No | - | Fallback AI provider |
| `JWT_SECRET` | string | Auth | lib/auth/middleware.ts<br>lib/auth/middleware-v2.ts | ✅ Yes | 'CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS' | Min 32 characters |
| `DATABASE_URL` | string | Database | - | ❌ No | - | SQLite connection (optional) |
| `DB_DIR` | string | Database | lib/db/index.ts<br>scripts/apply-performance-indexes.ts | ❌ No | '../data' | Database directory |
| `ANALYTICS_DATA_DIR` | string | Analytics | lib/analytics/utils.ts | ❌ No | - | Analytics data storage |
| `GOOGLE_CREDENTIALS_PATH` | string | Google | lib/google/workspace-client.ts<br>lib/workflows/actions/handlers/document-handler.ts<br>scripts/utilities/*.js | ❌ No | - | Service account JSON path |
| `GOOGLE_APPLICATION_CREDENTIALS` | string | Google | lib/security/dlp-service.ts<br>lib/ai-services/vertex-ai-service.ts | ❌ No | - | GCP default credentials |
| `GOOGLE_CLIENT_ID` | string | Google OAuth | lib/google/workspace-client.ts<br>lib/workflows/actions/handlers/document-handler.ts | ❌ No | - | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | string | Google OAuth | lib/google/workspace-client.ts<br>lib/workflows/actions/handlers/document-handler.ts | ❌ No | - | OAuth 2.0 secret |
| `GOOGLE_REDIRECT_URI` | string | Google OAuth | lib/google/workspace-client.ts | ❌ No | 'http://localhost:3000/api/auth/google/callback' | OAuth redirect |
| `GOOGLE_CLOUD_PROJECT` | string | Google Cloud | lib/ai-services/vertex-ai-service.ts | ❌ No | - | GCP project ID |
| `VERTEX_AI_LOCATION` | string | Vertex AI | lib/ai-services/vertex-ai-service.ts | ❌ No | 'us-central1' | Vertex AI region |
| `VERTEX_AI_ATTRITION_ENDPOINT_ID` | string | Vertex AI | lib/ai-services/vertex-ai-service.ts | ❌ No | - | Attrition model endpoint |
| `VERTEX_AI_PERFORMANCE_ENDPOINT_ID` | string | Vertex AI | lib/ai-services/vertex-ai-service.ts | ❌ No | - | Performance model endpoint |
| `VERTEX_AI_PROMOTION_ENDPOINT_ID` | string | Vertex AI | lib/ai-services/vertex-ai-service.ts | ❌ No | - | Promotion model endpoint |
| `HR_DRIVE_FOLDER_ID` | string | Google Drive | app/api/documents/export-to-google-docs/route.ts | ❌ No | - | HR documents folder |
| `GOOGLE_TEMPLATE_*_ID` | string | Google Templates | lib/templates-drive.ts | ❌ No | - | **DYNAMIC:** Multiple template IDs |
| `CRON_SECRET` | string | Cron Jobs | app/api/cron/onboarding/route.ts<br>app/api/cron/metrics-sync/route.ts | ❌ No | - | Cron job authentication |
| `SHARED_KEY_DAILY_LIMIT` | string | Rate Limiting | lib/ai/shared-key-manager.ts | ❌ No | '100' | Daily quota limit |
| `ALLOWED_ORIGIN` | string | CORS | next.config.js | ❌ No | 'http://localhost:3000' | CORS allowed origin |
| `SENTRY_DSN` | string | Monitoring | sentry.client.config.ts<br>next.config.js | ❌ No | - | Sentry error tracking |
| `SENTRY_ORG` | string | Monitoring | next.config.js | ❌ No | 'foundryhr' | Sentry organization |
| `SENTRY_PROJECT` | string | Monitoring | next.config.js | ❌ No | 'hrcommandcenter' | Sentry project |
| `SENTRY_AUTH_TOKEN` | string | Monitoring | next.config.js | ❌ No | - | Sentry auth token |
| `SENTRY_RELEASE` | string | Monitoring | sentry.client.config.ts | ❌ No | - | Release version |

**Total Server Variables:** 27 unique + dynamic GOOGLE_TEMPLATE_*

---

## Client-Public Variables (10)

Variables exposed to the browser (NEXT_PUBLIC_* prefix required).

| Variable | Type | Used In | Files | Required | Default | Notes |
|----------|------|---------|-------|----------|---------|-------|
| `NEXT_PUBLIC_APP_NAME` | string | UI | next.config.js | ❌ No | 'HR Command Center' | Application name |
| `NEXT_PUBLIC_APP_VERSION` | string | UI | next.config.js | ❌ No | npm_package_version | App version |
| `NEXT_PUBLIC_SENTRY_DSN` | string | Monitoring | sentry.client.config.ts<br>next.config.js | ❌ No | - | Client-side Sentry DSN |
| `NEXT_PUBLIC_ENABLE_NLP` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable NLP service |
| `NEXT_PUBLIC_ENABLE_TRANSLATION` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable translation |
| `NEXT_PUBLIC_ENABLE_SPEECH` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable speech |
| `NEXT_PUBLIC_ENABLE_DOCUMENT_AI` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable Document AI |
| `NEXT_PUBLIC_ENABLE_VERTEX_AI` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable Vertex AI |
| `NEXT_PUBLIC_ENABLE_VISION` | boolean | Feature Flags | lib/types/ai-services.ts | ❌ No | 'false' | Enable Vision AI |
| `NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT` | boolean | Feature Flags | app/api/chat/route.ts | ❌ No | 'false' | Enable DLP deidentification |

**Total Client Variables:** 10

---

## Build-Time Variables (5)

Variables used during build/test, not in runtime application code.

| Variable | Type | Used In | Files | Required | Default | Notes |
|----------|------|---------|-------|----------|---------|-------|
| `NODE_ENV` | string | Build/Runtime | Multiple (50+ files) | ✅ Yes | - | 'development' \| 'production' \| 'test' |
| `CI` | boolean | Testing | playwright.config.ts<br>next.config.js | ❌ No | - | CI environment flag |
| `NEXT_RUNTIME` | string | Next.js | instrumentation.ts | ❌ No | - | 'nodejs' \| 'edge' |
| `ANALYZE` | boolean | Bundle Analysis | next.config.js | ❌ No | - | Enable bundle analyzer |
| `npm_package_version` | string | Build | next.config.js | ❌ No | - | Package version from package.json |

**Total Build Variables:** 5

---

## Dynamic Access Patterns (1)

Special handling required - cannot use standard T3 Env validation.

| Pattern | Location | Purpose | Solution |
|---------|----------|---------|----------|
| `process.env[GOOGLE_TEMPLATE_${documentType.toUpperCase()}_ID]` | lib/templates-drive.ts:395 | Dynamic Google Drive template IDs | Create explicit mapping function |

**Example Dynamic Keys:**
- `GOOGLE_TEMPLATE_OFFER_LETTER_ID`
- `GOOGLE_TEMPLATE_ONBOARDING_ID`
- `GOOGLE_TEMPLATE_PERFORMANCE_REVIEW_ID`
- `GOOGLE_TEMPLATE_TERMINATION_ID`
- etc.

**Refactoring Strategy:**
```typescript
// Before (dynamic access)
function getEnvTemplateOverride(documentType: string): string | undefined {
  const envKey = `GOOGLE_TEMPLATE_${documentType.toUpperCase()}_ID`;
  return process.env[envKey];  // ❌ Breaks type safety
}

// After (explicit mapping)
function getEnvTemplateOverride(documentType: string): string | undefined {
  const templateIds = {
    'offer_letter': env.GOOGLE_TEMPLATE_OFFER_LETTER_ID,
    'onboarding': env.GOOGLE_TEMPLATE_ONBOARDING_ID,
    'performance_review': env.GOOGLE_TEMPLATE_PERFORMANCE_REVIEW_ID,
    'termination': env.GOOGLE_TEMPLATE_TERMINATION_ID,
  };
  return templateIds[documentType.toLowerCase()];
}
```

---

## Edge Cases & Exceptions

### instrumentation.ts

**Issue:** Runs before Next.js initialization, before env validation possible.

**Current Usage:**
```typescript
if (process.env.NEXT_RUNTIME === 'nodejs') {
  // Initialize Sentry
}
```

**Solution:** Keep direct `process.env` access for this file only. Document exception.

### Middleware (Edge Runtime)

**Issue:** Runs in Edge runtime with limited Node.js APIs.

**Current Usage:**
- `JWT_SECRET` in lib/auth/middleware.ts
- `JWT_SECRET` in lib/auth/middleware-v2.ts

**Solution:** Test thoroughly. T3 Env should work in Edge runtime, but verify.

### Test Files

**Issue:** Tests modify `process.env.NODE_ENV` directly.

**Current Usage:**
```typescript
process.env.NODE_ENV = 'development';  // Test setup
```

**Solution:** Keep direct access in test files. T3 Env validation runs before tests.

---

## File Categories

### High Priority (Batch 1: AI Providers - 1 hour)
- lib/ai/providers/anthropic-adapter.ts
- lib/ai/providers/openai-adapter.ts
- lib/ai/shared-key-manager.ts
- lib/api-helpers/anthropic-client.ts

### High Priority (Batch 2: Authentication - 1 hour)
- lib/auth/middleware.ts
- lib/auth/middleware-v2.ts
- app/api/auth/login/route.ts
- app/api/auth/demo-token/route.ts

### Medium Priority (Batch 3: Integrations - 1-2 hours)
- lib/google/workspace-client.ts
- lib/workflows/actions/handlers/document-handler.ts
- lib/ai-services/vertex-ai-service.ts
- lib/security/dlp-service.ts
- lib/templates-drive.ts (dynamic access!)
- app/api/documents/export-to-google-docs/route.ts

### Medium Priority (Batch 4: Scripts - 1 hour)
- scripts/utilities/cleanup-drive.js
- scripts/utilities/list-all-accessible.js
- scripts/utilities/check-quota.js
- scripts/apply-performance-indexes.ts

### Low Priority (Batch 5: Config - 1 hour)
- next.config.js
- sentry.client.config.ts
- playwright.config.ts
- lib/db/index.ts
- lib/analytics/utils.ts
- lib/monitoring.ts
- lib/performance-monitor.ts
- lib/web-vitals.ts
- app/api/cron/onboarding/route.ts
- app/api/cron/metrics-sync/route.ts
- app/api/analytics/metrics/route.ts
- app/api/chat/route.ts (feature flags)
- app/providers.tsx (React Query DevTools)
- components/custom/SmartPrefetch.tsx
- components/ui/ErrorBoundary.tsx
- lib/errorLogging.ts
- lib/auth/auth-context.tsx
- lib/api-helpers/error-handler.ts
- lib/api-helpers/fetch-with-retry.ts
- lib/security/audit-logger.ts
- lib/types/ai-services.ts
- app/api/health/route.ts
- app/api/setup/init/route.ts

### Exceptions (Keep Direct Access)
- instrumentation.ts (runs before env validation)
- __tests__/**/*.test.ts (test environment setup)
- __tests__/**/*.test.tsx (test environment setup)

---

## Summary Statistics

- **Total Variables:** 42 unique + dynamic patterns
- **Server-Only:** 27 variables
- **Client-Public:** 10 variables
- **Build-Time:** 5 variables
- **Dynamic Patterns:** 1 pattern (multiple variables)
- **Files to Migrate:** 40+ files
- **Scripts to Migrate:** 4 files
- **Exceptions:** instrumentation.ts + test files

---

## Next Steps

1. ✅ **Complete** - Environment variable inventory
2. **TODO** - Create env.mjs with T3 Env configuration
3. **TODO** - Migrate code in 5 batches
4. **TODO** - Handle edge cases (dynamic access, instrumentation, middleware)
5. **TODO** - Validation and testing

