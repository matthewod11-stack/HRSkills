# HR Command Center - Development Guide

Complete guide for developers working on the HR Command Center application.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Testing](#testing)
4. [Code Quality](#code-quality)
5. [Architecture](#architecture)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here

# Optional: External APIs
RIPPLING_API_KEY=your_rippling_key
NOTION_TOKEN=your_notion_token

# App Configuration
NEXT_PUBLIC_APP_NAME=HR Command Center
NEXT_PUBLIC_APP_VERSION=0.1.0
```

---

## Development Workflow

### Available Scripts

#### Development
```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Create production build
npm run start         # Start production server
```

#### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without changes
npm run type-check    # Run TypeScript compiler check
npm run validate      # Run type-check, lint, and test
```

#### Testing
```bash
npm run test              # Run Jest unit tests
npm run test:watch        # Run Jest in watch mode
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run Playwright with UI
npm run test:all          # Run all accessibility tests
```

#### Build Analysis
```bash
npm run build:analyze # Build and analyze bundle size
```

#### Maintenance
```bash
npm run clean         # Clean build artifacts
```

---

## Testing

### Unit Tests (Jest + React Testing Library)

**Location:** `__tests__/`

**Running Tests:**
```bash
npm run test                    # All tests
npm run test:watch              # Watch mode
npm run test -- MonitoringTest  # Specific test file
npm run test:coverage           # With coverage
```

**Writing Unit Tests:**
```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Test Coverage Goals:**
- Overall: 80%+
- Critical paths: 95%+
- Utility functions: 100%

---

### Integration Tests (API Routes)

**Location:** `__tests__/api/`

**Running Tests:**
```bash
npm run test -- __tests__/api
```

**Writing Integration Tests:**
```typescript
import { POST } from '@/app/api/my-route/route';
import { NextRequest } from 'next/server';

describe('POST /api/my-route', () => {
  it('should handle valid requests', async () => {
    const request = new NextRequest('http://localhost/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

### E2E Tests (Playwright)

**Location:** `e2e/`

**Running Tests:**
```bash
npm run test:e2e          # Headless mode
npm run test:e2e:ui       # Interactive UI mode
npx playwright test --debug  # Debug mode
```

**Writing E2E Tests:**
```typescript
import { test, expect } from '@playwright/test';

test('should navigate to analytics', async ({ page }) => {
  await page.goto('/');
  await page.click('text=/Analytics/i');
  await expect(page).toHaveURL('/analytics');
});
```

**Test Structure:**
- `e2e/critical-flows.spec.ts` - Core user journeys
- `e2e/accessibility.spec.ts` - Accessibility tests (if exists)

---

## Code Quality

### VS Code Setup

**Recommended Extensions:**
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Playwright Test for VSCode (`ms-playwright.playwright`)
- Jest Runner (`firsttris.vscode-jest-runner`)

**Auto-Install:**
Open the project in VS Code and it will prompt to install recommended extensions.

---

### Linting & Formatting

**ESLint Configuration:**
- Extends Next.js defaults
- TypeScript rules enabled
- React Hooks rules enabled

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

**Pre-commit Checklist:**
```bash
npm run format        # Format all files
npm run lint:fix      # Fix linting issues
npm run type-check    # Check TypeScript
npm run test          # Run tests
```

---

## Architecture

### Project Structure

```
webapp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   └── custom/            # Feature-specific components
├── lib/                   # Utility functions
│   ├── monitoring.ts      # Performance monitoring
│   └── image-utils.ts     # Image optimization
├── __tests__/             # Unit & integration tests
├── e2e/                   # E2E tests
└── public/                # Static assets
```

---

### Key Technologies

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Animation:** Framer Motion
- **Charts:** Chart.js, Recharts
- **State:** Zustand
- **Testing:** Jest, Playwright, React Testing Library
- **AI:** Anthropic Claude API

---

### Code Organization

**Component Structure:**
```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // 4. Hooks
  const [count, setCount] = useState(0);

  // 5. Handlers
  const handleClick = () => setCount(c => c + 1);

  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Count: {count}</Button>
    </div>
  );
}
```

---

## Best Practices

### React Components

**Do:**
- ✅ Use TypeScript for all components
- ✅ Memoize expensive components with `memo()`
- ✅ Use custom hooks for reusable logic
- ✅ Keep components small and focused
- ✅ Use proper ARIA labels for accessibility

**Don't:**
- ❌ Use `any` type without good reason
- ❌ Create deep component nesting (> 3 levels)
- ❌ Put business logic in components
- ❌ Forget error boundaries

---

### Performance

**Optimization Checklist:**
- ✅ Use dynamic imports for heavy components
- ✅ Implement code splitting with `next/dynamic`
- ✅ Add suspense boundaries with loading states
- ✅ Optimize images with `next/image`
- ✅ Use SmartPrefetch for route prefetching

**Monitoring:**
- Core Web Vitals tracked automatically in production
- Check performance in Chrome DevTools Lighthouse
- Monitor bundle size with `npm run build:analyze`

---

### Accessibility

**WCAG AA Compliance:**
- ✅ Semantic HTML with proper landmarks
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ 4.5:1 color contrast minimum
- ✅ Focus indicators on interactive elements

**Testing:**
```bash
npm run test:a11y          # Automated accessibility tests
npm run test:e2e:a11y      # E2E accessibility tests
```

**Resources:**
- Accessibility Statement: `/accessibility`
- Audit Report: `webapp/PHASE_6_PRODUCTION_READY_COMPLETE.md`

---

### Git Workflow

**Branch Naming:**
```
feature/add-new-feature
fix/bug-description
refactor/component-name
docs/update-readme
```

**Commit Messages:**
```
feat: Add user profile dashboard
fix: Resolve metric calculation error
refactor: Extract custom hooks from MetricCard
docs: Update API documentation
test: Add unit tests for monitoring system
```

**Before Committing:**
```bash
npm run validate  # Type-check, lint, test
npm run format    # Format code
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

#### TypeScript Errors
```bash
# Clear Next.js cache
npm run clean

# Rebuild
npm run build
```

#### Module Not Found
```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Test Failures
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm run test -- --verbose
```

#### PWA Not Working
- PWA only works in production builds
- Service worker disabled in development
- Build and serve: `npm run build && npm run start`

---

### Performance Issues

**Slow Build Times:**
```bash
# Clear cache
npm run clean

# Disable type checking during build (not recommended)
SKIP_TYPE_CHECK=true npm run build
```

**Large Bundle Size:**
```bash
# Analyze bundle
npm run build:analyze

# Check for:
- Unused dependencies
- Large libraries that should be code-split
- Duplicate packages
```

---

### Getting Help

**Documentation:**
- This file (`DEVELOPMENT.md`)
- Phase completion docs (`PHASE_*_COMPLETE.md`)
- Next.js docs: https://nextjs.org/docs
- Tailwind docs: https://tailwindcss.com/docs

**Debugging:**
- Use Chrome DevTools for React/network debugging
- Use VS Code debugger for server-side code
- Check `console.log` output in terminal (server) and browser (client)

---

## Quick Reference

### Most Used Commands
```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run tests
npm run lint:fix      # Fix code issues
npm run format        # Format code
npm run validate      # Full validation
```

### File Paths
```
Components:     components/
Pages:          app/
API Routes:     app/api/
Tests:          __tests__/
E2E Tests:      e2e/
Utilities:      lib/
Styles:         app/globals.css
```

### Important URLs
```
Development:    http://localhost:3000
Accessibility:  /accessibility
Offline Page:   /offline
```

---

**Happy Coding! 🚀**

For questions or issues, refer to project documentation or contact the development team.
