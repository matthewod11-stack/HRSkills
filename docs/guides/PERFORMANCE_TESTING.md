# Performance Testing Guide

**Last Updated:** November 13, 2025
**Audience:** Developers maintaining the HRSkills platform
**Phase:** 1 Week 4 - Performance Testing Infrastructure Complete

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Performance Budgets](#performance-budgets)
3. [Bundle Analysis](#bundle-analysis)
4. [Lighthouse CI](#lighthouse-ci)
5. [Web Vitals Monitoring](#web-vitals-monitoring)
6. [Automated Tests](#automated-tests)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization Workflow](#performance-optimization-workflow)

---

## Overview

The HRSkills platform uses a comprehensive performance testing infrastructure to ensure optimal user experience. This guide covers all performance monitoring and testing tools available.

### Key Performance Metrics

| Metric | Target | Tool | Description |
|--------|--------|------|-------------|
| **First Contentful Paint (FCP)** | <1.5s | Lighthouse | Time to first visible content |
| **Largest Contentful Paint (LCP)** | <2.5s | Lighthouse | Time to largest visible element |
| **Total Blocking Time (TBT)** | <300ms | Lighthouse | Main thread blocking time |
| **Cumulative Layout Shift (CLS)** | <0.1 | Web Vitals | Visual stability score |
| **Time to Interactive (TTI)** | <3.5s | Lighthouse | Time until page is interactive |
| **Interaction to Next Paint (INP)** | <200ms | Web Vitals | Responsiveness |
| **Main Bundle Size** | <150KB | Bundle Analyzer | Initial JavaScript size |
| **Total Bundle Size** | <500KB | Bundle Analyzer | All JavaScript combined |

---

## Performance Budgets

### Bundle Size Budgets

```typescript
// Defined in __tests__/performance/bundle-performance.test.ts
const BUDGETS = {
  mainBundle: 150, // KB
  frameworkBundle: 200, // KB
  totalChunks: { min: 10, max: 100 }, // Code splitting indicator
};
```

### Page Load Budgets

```typescript
// Defined in .lighthouserc.json
const LOAD_BUDGETS = {
  FCP: 1500, // ms
  LCP: 2500, // ms
  TTI: 3500, // ms
  SpeedIndex: 3000, // ms
};
```

### Monitoring Thresholds

Performance metrics are color-coded based on thresholds:
- 🟢 **Good:** Meets or exceeds targets
- 🟡 **Needs Improvement:** Between good and poor
- 🔴 **Poor:** Below minimum acceptable

---

## Bundle Analysis

### Running Bundle Analyzer

```bash
# Build with bundle analysis
npm run build:analyze

# Open the generated report
open .next/analyze/client.html  # macOS
xdg-open .next/analyze/client.html  # Linux
start .next/analyze/client.html  # Windows
```

### What to Look For

1. **Largest Packages**
   - Identify packages >50KB
   - Consider lazy loading or alternatives

2. **Duplicate Dependencies**
   - Multiple versions of same package
   - Resolve to single version if possible

3. **Unused Code**
   - Check for packages in bundle but not used
   - Verify tree-shaking is working

4. **Code Splitting**
   - Verify separate chunks for lazy-loaded components
   - Should see chunks for: DocumentEditorPanel, PerformanceGridPanel, ENPSPanel

### Bundle Analyzer Reports

Reports are saved to `.next/analyze/`:
- `client.html` - Client-side JavaScript bundles (most important)
- `nodejs.html` - Server-side bundles
- `edge.html` - Edge runtime bundles (if using)

### Example Analysis

```
Route (pages)                                Size     First Load JS
┌ ○ / (Static)                              5.2 kB          280 kB
├ ○ /analytics                              12 kB           287 kB
├ ○ /settings                               8.1 kB          285 kB
└ ○ /nine-box                               15 kB           290 kB

+ First Load JS shared by all              275 kB
  ├ chunks/framework-*.js                  137 kB  ← React, Next.js core
  ├ chunks/main-*.js                       122 kB  ← App initialization
  └ chunks/pages/_app-*.js                 16 kB   ← Custom App wrapper

Lazy Loaded Chunks:
├ DocumentEditorPanel                      ~25 kB  ← Lazy loaded ✅
├ PerformanceGridPanel                     ~15 kB  ← Lazy loaded ✅
└ ENPSPanel                                ~20 kB  ← Lazy loaded ✅
```

---

## Lighthouse CI

Lighthouse CI runs automated performance, accessibility, SEO, and best practices audits.

### Configuration

**File:** `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.80}],
        "first-contentful-paint": ["warn", {"maxNumericValue": 1500}]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lighthouse-reports"
    }
  }
}
```

### Running Lighthouse

```bash
# Run Lighthouse CI (requires running dev server)
npm run dev  # In one terminal
npm run test:lighthouse  # In another terminal

# Or manually
npx lhci autorun
```

### Understanding Lighthouse Scores

Lighthouse provides scores from 0-100:

| Score | Rating | Action Required |
|-------|--------|-----------------|
| 90-100 | 🟢 Good | Maintain current performance |
| 50-89 | 🟡 Needs Improvement | Investigate warnings |
| 0-49 | 🔴 Poor | Immediate action required |

### Common Lighthouse Issues

**1. Unused JavaScript**
```

### Automated Performance Test Checklist

| Test | Command | Prerequisite |
|------|---------|--------------|
| **Bundle performance unit tests** | `npm run test -- __tests__/performance/bundle-performance.test.ts` | Run `npm run build` first so `.next/static/chunks` exists |
| **Playwright performance spec** | `npx playwright test e2e/performance.spec.ts` | Start the dev server with `npm run dev` in another terminal |

- Bundle tests will automatically skip (and warn) if the production build artifacts are missing.
- The Playwright spec targets the live chat input (`#chat-input`), so make sure the UI is available at `http://localhost:3000` before running.
Solution: Verify lazy loading and tree-shaking
Check: dynamic imports, named imports (not `import *`)
```

**2. Large Layout Shifts**
```
Solution: Add explicit width/height to images
Fix: Use aspect-ratio CSS or skeleton loaders
```

**3. Long Tasks**
```
Solution: Code split large components
Fix: Use React.lazy() and dynamic imports
```

### Lighthouse Reports

Reports are saved to `./lighthouse-reports/`:
```
lighthouse-reports/
├── manifest.json           # Summary of all runs
├── lhr-TIMESTAMP-1.html    # First run
├── lhr-TIMESTAMP-2.html    # Second run
└── lhr-TIMESTAMP-3.html    # Third run
```

---

## Web Vitals Monitoring

Web Vitals are real-user performance metrics tracked in the browser.

### Metrics Tracked

**1. Cumulative Layout Shift (CLS)** - Visual Stability
- **Good:** <0.1
- **Needs Improvement:** 0.1-0.25
- **Poor:** >0.25

**2. Largest Contentful Paint (LCP)** - Loading Performance
- **Good:** <2.5s
- **Needs Improvement:** 2.5-4.0s
- **Poor:** >4.0s

**3. First Input Delay (FID)** - Interactivity
- **Good:** <100ms
- **Needs Improvement:** 100-300ms
- **Poor:** >300ms

**4. Interaction to Next Paint (INP)** - Responsiveness
- **Good:** <200ms
- **Needs Improvement:** 200-500ms
- **Poor:** >500ms

**5. Time to First Byte (TTFB)** - Server Response
- **Good:** <800ms
- **Needs Improvement:** 800-1800ms
- **Poor:** >1800ms

### Viewing Web Vitals

**Development:**
- Open browser console
- Web Vitals automatically log with color coding
- Example output:
  ```
  CLS 0.05 (good)
  LCP 1800ms (good)
  FID 50ms (good)
  INP 150ms (good)
  TTFB 600ms (good)
  ```

**Production:**
- Metrics sent to `/api/monitoring` endpoint
- Can be integrated with analytics services:
  - Google Analytics 4
  - Vercel Analytics
  - Custom analytics dashboard

### Implementation

**File:** `/webapp/lib/web-vitals.ts`
**Integration:** `/webapp/app/layout.tsx` (WebVitalsProvider)

```typescript
// Example: Add custom analytics
import { initWebVitals } from '@/lib/web-vitals';

// In _app.tsx or layout.tsx
useEffect(() => {
  initWebVitals();
}, []);
```

### Improving Web Vitals

**CLS (Layout Shift):**
- Add `width` and `height` to images
- Use `aspect-ratio` CSS
- Reserve space for dynamic content
- Avoid inserting content above existing content

**LCP (Largest Content):**
- Optimize images (WebP, AVIF)
- Lazy load below-the-fold content
- Preload critical resources
- Use CDN for static assets

**FID/INP (Interactivity):**
- Minimize JavaScript execution time
- Code split large bundles
- Use web workers for heavy computations
- Defer non-critical JavaScript

**TTFB (Server Response):**
- Enable HTTP/2 or HTTP/3
- Use CDN for static assets
- Optimize database queries
- Implement caching strategies

---

## Automated Tests

### Bundle Performance Tests

**File:** `__tests__/performance/bundle-performance.test.ts`

```bash
# Run bundle tests
npm run build  # Must build first
npm test __tests__/performance/bundle-performance.test.ts
```

**Tests Include:**
- Main bundle size budget (<150KB)
- Framework bundle size budget (<200KB)
- Lazy loading verification
- Tree-shaking verification
- Dynamic imports validation
- Recharts removal verification

### E2E Performance Tests

**File:** `e2e/performance.spec.ts`

```bash
# Run E2E performance tests
npm run test:e2e e2e/performance.spec.ts

# Run with UI mode
npm run test:e2e:ui e2e/performance.spec.ts
```

**Tests Include:**
- FCP < 1.5s
- LCP < 2.5s
- TTI < 3.5s
- Chat typing lag < 50ms
- Panel open time < 500ms
- Chart render time < 1000ms
- Lazy loading verification
- Code splitting verification

### Running All Performance Tests

```bash
# Complete performance test suite
npm run test:performance

# This runs:
# 1. Lighthouse CI audit
# 2. Database performance tests
# 3. Bundle analysis (manual review)
```

---

## Troubleshooting

### Issue: Build Fails with Linting Errors

**Symptoms:**
```
Error: `"` can be escaped with `&quot;`
```

**Solution:**
```bash
# Auto-fix linting errors
npm run lint:fix

# Or disable specific rules in .eslintrc.json
{
  "rules": {
    "react/no-unescaped-entities": "off"
  }
}
```

### Issue: Bundle Analyzer Not Generating Reports

**Symptoms:**
- Build completes but no HTML files in `.next/analyze/`

**Solution:**
```bash
# Verify ANALYZE environment variable
ANALYZE=true npm run build

# Check if @next/bundle-analyzer is installed
npm list @next/bundle-analyzer

# Reinstall if needed
npm install --save-dev @next/bundle-analyzer
```

### Issue: Lighthouse CI Fails to Connect

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
```bash
# Ensure dev server is running first
npm run dev  # Terminal 1
npm run test:lighthouse  # Terminal 2

# Or use production build
npm run build && npm start  # Terminal 1
npm run test:lighthouse  # Terminal 2
```

### Issue: Web Vitals Not Logging

**Symptoms:**
- No Web Vitals output in console

**Solution:**
1. Check if WebVitalsProvider is in layout.tsx
2. Verify web-vitals package is installed:
   ```bash
   npm list web-vitals
   ```
3. Check browser console for errors
4. Clear browser cache and hard reload

### Issue: Performance Regression Detected

**Symptoms:**
- Tests failing after changes
- Bundle size increased

**Investigation Steps:**
```bash
# 1. Run bundle analyzer to identify growth
npm run build:analyze

# 2. Check what changed
git diff HEAD~1 package.json

# 3. Review recent commits
git log --oneline -10

# 4. Compare with baseline
# Open .next/analyze/client.html
# Look for new large dependencies
```

**Common Causes:**
- Added new dependency without lazy loading
- Imported barrel exports (`import * as`)
- Removed tree-shaking configuration
- Added large images/assets to bundle

---

## Performance Optimization Workflow

### Before Making Changes

```bash
# 1. Create performance baseline
npm run build:analyze
# Save report: .next/analyze/client-BEFORE.html

# 2. Document current metrics
npm run test:lighthouse
# Note: Performance score, FCP, LCP

# 3. Run bundle tests
npm run build && npm test __tests__/performance/
```

### During Development

```bash
# 1. Use React DevTools Profiler
# - Install React DevTools browser extension
# - Record user interactions
# - Look for unnecessary re-renders

# 2. Monitor Web Vitals in console
# - Check for CLS during interactions
# - Verify FID < 100ms on button clicks

# 3. Test lazy loading
# - Open Network tab
# - Verify components load on-demand
```

### After Making Changes

```bash
# 1. Run full test suite
npm run validate

# 2. Compare bundle sizes
npm run build:analyze
# Compare with client-BEFORE.html

# 3. Run Lighthouse audit
npm run test:lighthouse
# Ensure scores didn't regress

# 4. Verify performance tests pass
npm test __tests__/performance/
npm run test:e2e e2e/performance.spec.ts
```

### Commit Message Template

```
perf: [description of optimization]

Bundle Impact:
- Main bundle: 120KB → 105KB (-15KB)
- Lazy loaded: DocumentEditor → separate chunk (+25KB)
- Removed: recharts (~95KB)

Performance Impact:
- FCP: 2.1s → 1.4s (-700ms)
- LCP: 3.2s → 2.3s (-900ms)
- Lighthouse: 78 → 85 (+7 points)

Tests:
- ✅ Bundle performance tests passing
- ✅ E2E performance tests passing
- ✅ Lighthouse audit passing (score: 85)
```

---

## Continuous Monitoring

### Weekly Performance Review

**Checklist:**
- [ ] Run `npm run build:analyze` and review largest chunks
- [ ] Run `npm run test:lighthouse` and check scores
- [ ] Review Web Vitals in production (if tracking)
- [ ] Check for new dependency additions
- [ ] Verify bundle size trend (should be stable or decreasing)

### Monthly Deep Dive

**Tasks:**
1. Compare current vs. 1 month ago bundle sizes
2. Audit unused dependencies with `npm run test -- --coverage`
3. Review lazy loading opportunities for new features
4. Update performance budgets if justified
5. Test on low-end devices/networks

### Pre-Release Checklist

Before deploying to production:
- [ ] Lighthouse performance score >80
- [ ] All bundle tests passing
- [ ] All E2E performance tests passing
- [ ] Web Vitals all "good" in staging
- [ ] No performance regressions vs. previous release
- [ ] Bundle size increase <10% (or justified)

---

## Resources

### Tools

- **Bundle Analyzer:** https://www.npmjs.com/package/@next/bundle-analyzer
- **Lighthouse CI:** https://github.com/GoogleChrome/lighthouse-ci
- **Web Vitals:** https://web.dev/vitals/
- **React DevTools Profiler:** https://react.dev/learn/react-developer-tools

### Documentation

- **Next.js Performance:** https://nextjs.org/docs/advanced-features/measuring-performance
- **Web Vitals Guide:** https://web.dev/vitals/
- **Lighthouse Scoring:** https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/

### Internal Docs

- `/docs/PHASE1_WEEK3_PROGRESS.md` - Bundle optimization implementation
- `/docs/REMEDIATION_PLAN.md` - Performance improvement roadmap
- `/docs/ARCHITECTURE_DECISIONS.md` - Technical decisions affecting performance

---

## Summary

This performance testing infrastructure provides:
- ✅ **Automated bundle size monitoring** (Webpack Bundle Analyzer)
- ✅ **Lighthouse CI for continuous audits** (Performance, A11y, SEO)
- ✅ **Real-user metrics with Web Vitals** (CLS, LCP, FID, INP, TTFB)
- ✅ **Comprehensive test suite** (Bundle + E2E performance tests)
- ✅ **Clear performance budgets** (150KB main, <2.5s LCP, etc.)
- ✅ **Troubleshooting guides** (Common issues + solutions)
- ✅ **Optimization workflows** (Before/during/after development)

**Next Steps:**
- Integrate Lighthouse CI into CI/CD pipeline (GitHub Actions)
- Set up Web Vitals dashboard for production monitoring
- Create performance budget alerts
- Schedule monthly performance reviews

**Questions or Issues?**
- Review troubleshooting section above
- Check `/docs/guides/` for related documentation
- Open GitHub issue with `performance` label
