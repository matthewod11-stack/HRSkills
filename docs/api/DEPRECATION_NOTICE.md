# API Deprecation Notice

> **Important:** Several Phase 1 API endpoints are now deprecated in favor of the unified Phase 2 API.

**Last Updated:** 2025-11-09
**Deprecation Date:** 2025-11-09
**End of Life:** 2025-05-09 (6 months)

---

## Summary

As part of Phase 2 simplification, we've consolidated **42+ fragmented endpoints** into **12 unified endpoints**. This dramatically simplifies the API surface while maintaining all functionality.

**What this means for you:**
- Old endpoints still work (with redirects)
- You have 6 months to migrate
- Migration is straightforward (see guide below)
- New endpoints offer more features

---

## Deprecated Endpoints

### Analytics Endpoints (Deprecated)

| Old Endpoint | New Endpoint | Redirect Until |
|--------------|--------------|----------------|
| `GET /api/analytics/headcount` | `GET /api/analytics?metric=headcount` | May 2025 |
| `GET /api/analytics/attrition` | `GET /api/analytics?metric=attrition` | May 2025 |
| `GET /api/analytics/nine-box` | `GET /api/analytics?metric=nine-box` | May 2025 |
| `GET /api/analytics/metrics` | Web vitals only (not deprecated) | N/A |
| `GET /api/analytics/errors` | Error logging only (not deprecated) | N/A |
| `POST /api/analytics/chat` | Conversational AI (not deprecated) | N/A |

**Note:** The following `/api/analytics/*` endpoints are **NOT deprecated**:
- `/api/analytics/metrics` - Web vitals/performance monitoring
- `/api/analytics/errors` - Error logging
- `/api/analytics/chat` - Conversational analytics AI

These serve different purposes from business analytics and will remain as dedicated endpoints.

---

## Migration Guide

### 1. Headcount Analytics

**Before (Phase 1):**
```typescript
// All departments
const response = await fetch('/api/analytics/headcount');

// Single department
const response = await fetch('/api/analytics/headcount?department=Engineering');
```

**After (Phase 2):**
```typescript
// All departments
const response = await fetch('/api/analytics?metric=headcount');

// Single department
const response = await fetch('/api/analytics?metric=headcount&department=Engineering');

// Grouped by department
const response = await fetch('/api/analytics?metric=headcount&groupBy=department');
```

**Benefits:**
- ✅ Same response format
- ✅ Additional `groupBy` parameter
- ✅ Consistent error handling

---

### 2. Attrition Analytics

**Before (Phase 1):**
```typescript
// Default period (last 12 months)
const response = await fetch('/api/analytics/attrition');

// Specific period
const response = await fetch('/api/analytics/attrition?period=last_90_days');

// Department-specific
const response = await fetch('/api/analytics/attrition?department=Sales');
```

**After (Phase 2):**
```typescript
// Default date range (last 12 months)
const response = await fetch('/api/analytics?metric=attrition');

// Specific date range
const response = await fetch('/api/analytics?metric=attrition&dateRange=last_90_days');

// Department-specific
const response = await fetch('/api/analytics?metric=attrition&department=Sales');

// Custom date range
const response = await fetch('/api/analytics?metric=attrition&dateRange=custom&startDate=2024-01-01&endDate=2024-12-31');
```

**Changes:**
- ⚠️ `period` parameter renamed to `dateRange`
- ✅ New custom date range support
- ✅ Same response format

---

### 3. Nine-Box Grid

**Before (Phase 1):**
```typescript
// All employees
const response = await fetch('/api/analytics/nine-box');

// Department-specific
const response = await fetch('/api/analytics/nine-box?department=Engineering');
```

**After (Phase 2):**
```typescript
// All employees
const response = await fetch('/api/analytics?metric=nine-box');

// Department-specific
const response = await fetch('/api/analytics?metric=nine-box&department=Engineering');
```

**Benefits:**
- ✅ Same response format
- ✅ Consistent with other analytics
- ✅ No breaking changes

---

## New Features in Phase 2

The unified analytics endpoint adds several new metrics not available in Phase 1:

### 4. Diversity Metrics (NEW)

```typescript
// Get diversity metrics
const response = await fetch('/api/analytics?metric=diversity');

// Response:
{
  "success": true,
  "metric": "diversity",
  "data": {
    "gender": {
      "counts": { "Male": 147, "Female": 89, "Non-binary": 8 },
      "percentages": { "Male": 59.51, "Female": 36.03, "Non-binary": 3.24 }
    },
    "ethnicity": {
      "counts": { "Asian": 89, "White": 78, "Hispanic": 45, "Black": 23 },
      "percentages": { "Asian": 36.03, "White": 31.58, "Hispanic": 18.22, "Black": 9.31 }
    },
    "total": 247
  }
}
```

### 5. Performance Metrics (NEW)

```typescript
// Get performance distribution
const response = await fetch('/api/analytics?metric=performance');

// Response:
{
  "success": true,
  "metric": "performance",
  "data": {
    "average": 3.72,
    "distribution": {
      "5": 34,
      "4": 89,
      "3": 98,
      "2": 23,
      "1": 3
    },
    "total": 247
  }
}
```

### 6. Compensation Analytics (NEW)

```typescript
// Get compensation metrics
const response = await fetch('/api/analytics?metric=compensation');

// Grouped by department
const response = await fetch('/api/analytics?metric=compensation&groupBy=department');

// Response:
{
  "success": true,
  "metric": "compensation",
  "data": {
    "average": {
      "base": 125000,
      "bonus": 18750,
      "equity": 25000,
      "total": 168750
    },
    "byDepartment": { ... },
    "byLevel": { ... }
  }
}
```

### 7. CSV Export (NEW)

All metrics now support CSV export:

```typescript
// Export any metric to CSV
const response = await fetch('/api/analytics?metric=headcount&format=csv');
const blob = await response.blob();

// Downloads: headcount-2024-11-09.csv
```

---

## Backward Compatibility

### Redirects (6 months)

Old endpoints will **redirect** to new endpoints for 6 months:

```bash
# Old endpoint (Phase 1)
GET /api/analytics/headcount
→ 308 Permanent Redirect
→ GET /api/analytics?metric=headcount

# Client automatically follows redirect
```

**Status Code:** `308 Permanent Redirect`
**Duration:** Until May 9, 2025
**Action Required:** Update your code to use new endpoints

### Response Format

Response formats are **backward compatible**:

```typescript
// Old response (Phase 1)
{
  "success": true,
  "data": { ... }
}

// New response (Phase 2)
{
  "success": true,
  "metric": "headcount",  // Added
  "data": { ... },
  "metadata": { ... }      // Added
}
```

Your existing code will continue to work since the `data` field structure is unchanged.

---

## Migration Checklist

### For Frontend Developers

- [ ] Search codebase for `/api/analytics/headcount`
- [ ] Search codebase for `/api/analytics/attrition`
- [ ] Search codebase for `/api/analytics/nine-box`
- [ ] Replace with unified `/api/analytics?metric=X`
- [ ] Update query parameter `period` → `dateRange` (attrition only)
- [ ] Test all analytics pages/components
- [ ] Update any documentation/comments

### For Backend Developers

- [ ] Review API logs for usage of deprecated endpoints
- [ ] Identify internal services using old endpoints
- [ ] Update service-to-service API calls
- [ ] Update integration tests
- [ ] Document migration in team wiki

### For Third-Party Integrations

- [ ] Notify integration partners of deprecation
- [ ] Provide migration guide and timeline
- [ ] Monitor redirect usage in logs
- [ ] Follow up before end-of-life date

---

## Timeline

| Date | Event |
|------|-------|
| **Nov 9, 2024** | Deprecation announced, redirects active |
| **Dec 9, 2024** | First reminder (1 month) |
| **Feb 9, 2025** | Second reminder (3 months) |
| **Apr 9, 2025** | Final warning (1 month remaining) |
| **May 9, 2025** | **End of Life - Redirects removed** |

---

## Need Help?

### Documentation
- [Unified API Design](/docs/api/UNIFIED_API_DESIGN.md)
- [API Reference V2](/docs/api/API_REFERENCE_V2.md)
- [Migration Guide](/docs/api/API_MIGRATION_GUIDE.md)
- [Analytics API Guide](/docs/api/ANALYTICS_API_GUIDE.md)

### Support
- Open an issue on GitHub
- Contact the API team
- Check the migration FAQ

---

## FAQ

**Q: Do I need to migrate immediately?**
A: No, you have 6 months. But we recommend migrating soon to take advantage of new features.

**Q: Will my existing code break?**
A: No, old endpoints will redirect automatically for 6 months.

**Q: Are response formats changing?**
A: No, the `data` field structure remains the same. New fields are added but existing fields are unchanged.

**Q: What happens after May 2025?**
A: Old endpoints will return `410 Gone` errors. You must use the new unified endpoint.

**Q: Can I use both old and new endpoints?**
A: Yes, during the 6-month transition period.

**Q: What about the /api/analytics/metrics and /api/analytics/errors endpoints?**
A: These are NOT deprecated. They serve different purposes (web vitals and error logging) and will remain as dedicated endpoints.

**Q: What about /api/analytics/chat?**
A: The conversational analytics AI endpoint is NOT deprecated. It remains a dedicated endpoint for AI-powered analytics queries.

---

**Last Updated:** 2025-11-09
**Questions?** See the [API Reference](./API_REFERENCE_V2.md) or open an issue.
