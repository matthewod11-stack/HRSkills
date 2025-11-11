# Phase 5: Resource Optimization (Images, Fonts, CSS) - Implementation Plan

**Status:** In Progress
**Started:** November 5, 2025
**Estimated Completion Time:** ~2.5 hours

---

## 📋 OVERVIEW

Phase 5 focuses on optimizing static resources (images, fonts, CSS) and implementing smart prefetching strategies to further improve performance. This builds on Phase 4's code splitting by ensuring all assets are optimized and loaded efficiently.

---

## 🎯 GOALS

1. **Image Optimization** - Implement next/image for automatic optimization
2. **Font Optimization** - Use next/font for optimal font loading
3. **CSS Optimization** - Remove unused styles and optimize Tailwind
4. **Prefetching Strategy** - Smart prefetch for instant interactions
5. **Service Worker** - Cache assets for offline support
6. **Performance Monitoring** - Measure and verify improvements

---

## 🔍 CURRENT STATE ANALYSIS

### Images Currently Used:

Let me audit the codebase for image usage...

**Expected Findings:**

- Background gradient orbs (CSS-based, not image files) ✅
- Icons (Lucide React, SVG-based) ✅
- No heavy image files detected (good!)
- No user-uploaded images yet
- No logo/branding images

**Recommendation:**

- Prepare infrastructure for future images
- Add image optimization helpers
- Document best practices

---

### Fonts Currently Used:

**Analysis Needed:**

- Check `app/layout.tsx` for font imports
- Identify Google Fonts or custom fonts
- Measure font file sizes
- Check if fonts are already optimized

---

### CSS Currently Used:

**Tailwind Configuration:**

- Global styles in `app/globals.css`
- Tailwind classes throughout components
- Potential for unused CSS purging
- Current CSS bundle size unknown

**Goals:**

- Identify unused Tailwind classes
- Configure PurgeCSS properly
- Extract critical CSS
- Measure CSS bundle reduction

---

## 📦 IMPLEMENTATION STRATEGY

### 1. **Image Optimization Infrastructure** 🎯

Even without current images, prepare for future use:

#### Step 1: Create Image Optimization Utilities

**File:** `lib/image-utils.ts`

```typescript
/**
 * Image Optimization Utilities
 *
 * Helpers for optimizing images with next/image
 */

export const IMAGE_SIZES = {
  thumbnail: 64,
  small: 128,
  medium: 256,
  large: 512,
  xlarge: 1024,
  full: 1920,
} as const;

export const IMAGE_QUALITY = {
  low: 60,
  medium: 75,
  high: 90,
  max: 100,
} as const;

// Blurhash placeholder generator
export function getBlurDataURL(width: number, height: number): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}
```

#### Step 2: Update next.config.js

Add image domains and formats:

```javascript
images: {
  formats: ['image/avif', 'image/webp'], // Modern formats
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
  domains: [], // Add external image domains here
  dangerouslyAllowSVG: true,
  contentDispositionType: 'attachment',
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
},
```

#### Step 3: Create Optimized Image Component

**File:** `components/ui/OptimizedImage.tsx`

```tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        placeholder="blur"
        blurDataURL={getBlurDataURL(width, height)}
        onLoadingComplete={() => setIsLoading(false)}
        className={`duration-300 ${isLoading ? 'blur-sm' : 'blur-0'}`}
      />
    </div>
  );
}
```

**Expected Savings:** 200-300KB (when images are added)

---

### 2. **Font Optimization** 🎯

#### Step 1: Audit Current Fonts

Check what fonts are currently loaded and how.

#### Step 2: Migrate to next/font

**File:** `app/layout.tsx`

```tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
  preload: false, // Only preload critical fonts
  fallback: ['Courier New', 'monospace'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

#### Step 3: Update Tailwind Config

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-roboto-mono)', 'Courier New', 'monospace']
    }
  }
}
```

**Benefits:**

- Automatic font optimization
- Self-hosted (no external requests)
- Automatic subset selection
- Zero layout shift

**Expected Savings:** 50-100KB

---

### 3. **CSS Optimization** 🎯

#### Step 1: Configure Tailwind Purging

**File:** `tailwind.config.js`

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Add dynamic classes here
    'from-blue-500',
    'to-purple-600',
    // Animation classes
    'animate-pulse',
    'animate-spin',
  ],
  theme: {
    extend: {
      // Custom theme
    },
  },
};
```

#### Step 2: Extract Critical CSS

Create utility for critical CSS extraction:

**File:** `lib/critical-css.ts`

```typescript
// Critical CSS for above-the-fold content
export const criticalCSS = `
  /* Reset & base styles */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-inter); }

  /* Critical layout */
  .min-h-screen { min-height: 100vh; }
  .flex { display: flex; }
  .grid { display: grid; }

  /* Critical background */
  .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
`;
```

#### Step 3: Optimize Global CSS

**File:** `app/globals.css`

```css
/* Use CSS layers for better organization */
@layer base, components, utilities;

@layer base {
  /* Only critical base styles */
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    @apply antialiased;
  }
}

@layer components {
  /* Component-specific styles */
  .card {
    @apply rounded-2xl border-2 border-white/30 bg-black/40 backdrop-blur-xl;
  }
}
```

**Expected Savings:** 30-50KB

---

### 4. **Intelligent Prefetching** 🎯

#### Strategy 1: Link Prefetching

Use Next.js's built-in prefetching:

```tsx
import Link from 'next/link';

// Automatic prefetch on hover (production only)
<Link href="/analytics" prefetch={true}>
  Analytics
</Link>

// Disable for non-critical routes
<Link href="/settings" prefetch={false}>
  Settings
</Link>
```

#### Strategy 2: Component Prefetching

Prefetch lazy-loaded components on hover:

```tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const HeavyDialog = dynamic(() => import('./HeavyDialog'));

export function TriggerButton() {
  const [prefetched, setPrefetched] = useState(false);

  const prefetchDialog = () => {
    if (!prefetched) {
      import('./HeavyDialog');
      setPrefetched(true);
    }
  };

  return (
    <button onMouseEnter={prefetchDialog} onFocus={prefetchDialog}>
      Open Dialog
    </button>
  );
}
```

#### Strategy 3: Route-Based Prefetching

**File:** `components/custom/SmartPrefetch.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PREFETCH_MAP = {
  '/': ['/analytics', '/data-sources'], // From home, likely to go here
  '/analytics': ['/nine-box', '/data-sources'],
  '/data-sources': ['/analytics'],
};

export function SmartPrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    const routesToPrefetch = PREFETCH_MAP[pathname] || [];

    routesToPrefetch.forEach((route) => {
      // Prefetch after idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        });
      }
    });
  }, [pathname]);

  return null;
}
```

**User Experience Improvement:** Instant page transitions

---

### 5. **Service Worker & PWA** 🎯

#### Step 1: Install next-pwa

```bash
npm install --save next-pwa
```

#### Step 2: Configure PWA

**File:** `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png|gif|webp|svg|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

module.exports = withBundleAnalyzer(withPWA(nextConfig));
```

#### Step 3: Add manifest.json

**File:** `public/manifest.json`

```json
{
  "name": "HR Command Center",
  "short_name": "HR Center",
  "description": "AI-powered HR automation platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#9333ea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Step 4: Add Offline Fallback

**File:** `app/offline/page.tsx`

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-400 mb-8">Please check your internet connection</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

**User Experience:** App works offline with cached data

---

## 📊 EXPECTED IMPROVEMENTS

### Current State (After Phase 4):

- **Homepage Bundle:** ~750KB
- **CSS Bundle:** ~50KB (estimated)
- **Font Loading:** Render-blocking
- **Time to Interactive:** ~2.2s

### Target State (After Phase 5):

- **Homepage Bundle:** ~700KB (-50KB from CSS)
- **CSS Bundle:** ~30KB (-40% reduction)
- **Font Loading:** Non-blocking, optimized
- **Time to Interactive:** ~1.8s (-18% improvement)
- **Offline Support:** ✅ Full PWA
- **Prefetching:** ✅ Instant transitions

**Total Cumulative Improvement (Phases 4 + 5):**

- **Bundle Size:** 800KB → 700KB (-12.5%)
- **TTI:** 2.5s → 1.8s (-28%)
- **User Experience:** Offline support, instant nav

---

## 🛠 IMPLEMENTATION CHECKLIST

### Round 1: Font Optimization (30 min)

- [ ] Audit current font usage
- [ ] Install and configure next/font
- [ ] Update layout.tsx with optimized fonts
- [ ] Update Tailwind config
- [ ] Test font loading and fallbacks
- [ ] Measure font bundle size reduction

### Round 2: CSS Optimization (30 min)

- [ ] Configure Tailwind purging
- [ ] Identify unused classes
- [ ] Reorganize globals.css with layers
- [ ] Extract critical CSS
- [ ] Run build and measure CSS reduction
- [ ] Verify no visual regressions

### Round 3: Image Infrastructure (20 min)

- [ ] Create image optimization utilities
- [ ] Create OptimizedImage component
- [ ] Update next.config.js for images
- [ ] Document image best practices
- [ ] Add examples to docs

### Round 4: Prefetching (30 min)

- [ ] Implement hover prefetching for dialogs
- [ ] Add route-based prefetching
- [ ] Create SmartPrefetch component
- [ ] Test prefetch behavior
- [ ] Measure perceived performance improvement

### Round 5: PWA & Service Worker (40 min)

- [ ] Install next-pwa
- [ ] Configure service worker
- [ ] Create manifest.json
- [ ] Add app icons
- [ ] Create offline fallback page
- [ ] Test offline functionality
- [ ] Test install prompt

### Round 6: Performance Audit (30 min)

- [ ] Run Lighthouse audit (before)
- [ ] Implement all optimizations
- [ ] Run Lighthouse audit (after)
- [ ] Document improvements
- [ ] Create performance comparison

### Round 7: Testing & Documentation (30 min)

- [ ] Create automated tests
- [ ] Manual testing all optimizations
- [ ] Create quick reference guide
- [ ] Create completion documentation
- [ ] Update README

---

## 📈 SUCCESS METRICS

### Performance:

- ✅ Lighthouse Performance Score > 90
- ✅ TTI < 2s
- ✅ FCP < 1s
- ✅ LCP < 2.5s
- ✅ CLS < 0.1

### Bundle Size:

- ✅ CSS bundle < 35KB
- ✅ Font files optimized
- ✅ Total bundle < 700KB

### User Experience:

- ✅ PWA installable
- ✅ Offline support working
- ✅ Instant route transitions (with prefetch)
- ✅ No render-blocking resources

---

## 🔗 RELATED DOCUMENTATION

- **Phase 1:** Error Boundaries
- **Phase 2:** Custom Hooks
- **Phase 3:** Memoization
- **Phase 4:** Code Splitting & Lazy Loading
- **Phase 5:** Resource Optimization (this phase)

---

_Created: November 5, 2025_
_Status: Ready to implement_
