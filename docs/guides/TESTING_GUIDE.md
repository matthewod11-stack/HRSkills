# Testing Guide

Comprehensive testing guide for HR Command Center.

**Last Updated:** November 6, 2025

---

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Accessibility Testing](#accessibility-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

**Test Pyramid Strategy:**
```
       /\
      /E2E\        ← Few (critical user journeys)
     /------\
    /  API  \      ← Some (integration tests)
   /----------\
  / Unit Tests \   ← Many (component & function tests)
 /--------------\
```

**Goals:**
- **70% overall coverage** minimum
- **90% coverage** for critical paths (auth, payments, security)
- Fast feedback loop (unit tests < 10s)
- Reliable E2E tests (no flakiness)
- WCAG 2.1 AA accessibility compliance

---

## Testing Stack

### Unit & Integration Tests
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **jest-axe** - Accessibility testing

### E2E Tests
- **Playwright** - Cross-browser E2E testing
- **@axe-core/playwright** - Accessibility testing

### Configuration Files
- `webapp/jest.config.js` - Jest configuration
- `webapp/jest.setup.js` - Test setup and global mocks
- `webapp/playwright.config.ts` - Playwright configuration

---

## Unit Testing

### Setup

**Configuration:** `jest.config.js`
```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}
```

### Component Testing

**Example: Testing a Button Component**
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Hook Testing

**Example: Testing useLocalStorage Hook**
```typescript
// __tests__/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default value', () => {
    const { result } = renderHook(() =>
      useLocalStorage('key', 'default')
    );

    expect(result.current[0]).toBe('default');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('key', 'default')
    );

    act(() => {
      result.current[1]('new value');
    });

    expect(localStorage.getItem('key')).toBe('"new value"');
    expect(result.current[0]).toBe('new value');
  });

  it('removes value from localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('key', 'default')
    );

    act(() => {
      result.current[1]('value');
    });

    act(() => {
      result.current[2](); // removeValue
    });

    expect(localStorage.getItem('key')).toBeNull();
    expect(result.current[0]).toBe('default');
  });
});
```

### Utility Function Testing

**Example: Testing Analytics Parser**
```typescript
// __tests__/lib/analytics/parser.test.ts
import { parseEmployeeData } from '@/lib/analytics/parser';

describe('parseEmployeeData', () => {
  it('correctly parses CSV data', () => {
    const csv = `id,name,department
1,John Doe,Engineering
2,Jane Smith,Sales`;

    const result = parseEmployeeData(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      name: 'John Doe',
      department: 'Engineering'
    });
  });

  it('handles malformed data', () => {
    const csv = `id,name,department
1,John Doe`;

    expect(() => parseEmployeeData(csv)).toThrow('Invalid CSV format');
  });
});
```

---

## Integration Testing

### API Route Testing

**Example: Testing Employee API**
```typescript
// __tests__/api/employees.test.ts
import { GET, POST } from '@/app/api/employees/route';
import { NextRequest } from 'next/server';

// Mock authentication
jest.mock('@/lib/auth/middleware', () => ({
  requireAuth: jest.fn(() => ({
    success: true,
    user: { userId: 'test-user', roles: [{ name: 'hr_admin' }] }
  }))
}));

describe('/api/employees', () => {
  describe('GET', () => {
    it('returns all employees', async () => {
      const request = new NextRequest('http://localhost:3000/api/employees');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.employees)).toBe(true);
    });

    it('filters by department', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/employees?department=Engineering'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees.every(
        emp => emp.department === 'Engineering'
      )).toBe(true);
    });
  });

  describe('POST', () => {
    it('creates new employee', async () => {
      const request = new NextRequest('http://localhost:3000/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: 'EMP999',
          full_name: 'Test User',
          email: 'test@example.com'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.employee.employee_id).toBe('EMP999');
    });
  });
});
```

### Store Testing

**Example: Testing Zustand Store**
```typescript
// __tests__/stores/employee-store.test.ts
import { useEmployeeStore } from '@/lib/stores/employee-store';

describe('Employee Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useEmployeeStore.setState({ employees: [], loading: false });
  });

  it('fetches employees', async () => {
    const store = useEmployeeStore.getState();

    await store.fetchEmployees();

    const state = useEmployeeStore.getState();
    expect(state.employees.length).toBeGreaterThan(0);
    expect(state.loading).toBe(false);
  });

  it('updates employee', () => {
    const store = useEmployeeStore.getState();
    useEmployeeStore.setState({
      employees: [{ employee_id: 'EMP001', full_name: 'John Doe' }]
    });

    store.updateEmployee('EMP001', { full_name: 'Jane Doe' });

    const state = useEmployeeStore.getState();
    expect(state.employees[0].full_name).toBe('Jane Doe');
  });
});
```

---

## End-to-End Testing

### Setup

**Configuration:** `playwright.config.ts`
```typescript
{
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: ['chromium', 'firefox', 'webkit', 'Mobile Chrome']
}
```

### Critical User Journeys

**Example: Login Flow**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user menu appears
    await expect(page.getByText('admin@example.com')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});
```

**Example: Employee Data Upload**
```typescript
// e2e/data-upload.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Data Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('uploads employee CSV file', async ({ page }) => {
    await page.goto('/data-sources');

    // Upload file
    const filePath = path.join(__dirname, 'fixtures', 'employees.csv');
    await page.setInputFiles('input[type="file"]', filePath);

    // Wait for preview
    await expect(page.getByText('Preview')).toBeVisible();

    // Confirm upload
    await page.click('button:has-text("Import")');

    // Verify success
    await expect(page.getByText('Data imported successfully')).toBeVisible();
  });
});
```

---

## Accessibility Testing

### Automated Accessibility Testing

**Unit Test Level:**
```typescript
// __tests__/accessibility/Button.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA label when icon-only', async () => {
    const { container } = render(
      <Button aria-label="Delete">
        <TrashIcon />
      </Button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**E2E Test Level:**
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Press Enter on focused button
    await page.keyboard.press('Enter');
    // Verify action occurred
  });
});
```

### Manual Accessibility Checklist

- [ ] **Keyboard Navigation:** All interactive elements accessible via keyboard
- [ ] **Screen Reader:** Test with NVDA/JAWS (Windows) or VoiceOver (macOS)
- [ ] **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- [ ] **Focus Indicators:** Visible focus states for all interactive elements
- [ ] **ARIA Labels:** Proper labels for icon buttons and complex widgets
- [ ] **Form Labels:** All form inputs have associated labels
- [ ] **Headings:** Proper heading hierarchy (h1 → h2 → h3)
- [ ] **Alt Text:** All images have descriptive alt text

---

## Running Tests

### Unit & Integration Tests

```bash
cd webapp

# Run all tests
npm run test

# Run in watch mode (during development)
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### Accessibility Tests

```bash
# Run accessibility-specific tests
npm run test:a11y

# Jest accessibility tests
npm test -- __tests__/accessibility
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run specific browser
npm run test:e2e -- --project=chromium

# Run specific test file
npm run test:e2e -- e2e/auth.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

### All Tests

```bash
# Run complete test suite
npm run validate
# Runs: type-check + lint + unit tests

# Run all tests including E2E
npm run test:all
# Runs: unit + accessibility + E2E
```

---

## Writing Tests

### Test Structure

```typescript
describe('Component/Feature Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state, clear mocks, etc.
  });

  // Cleanup after each test
  afterEach(() => {
    // Cleanup, restore mocks, etc.
  });

  // Group related tests
  describe('when user is authenticated', () => {
    it('displays user menu', () => {
      // Arrange
      const user = { name: 'John Doe' };

      // Act
      render(<UserMenu user={user} />);

      // Assert
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    it('displays login button', () => {
      render(<UserMenu user={null} />);
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

**1. Test Behavior, Not Implementation**
```typescript
// ❌ Bad - tests implementation details
it('sets state to true', () => {
  const { result } = renderHook(() => useToggle());
  act(() => result.current[1]());
  expect(result.current[0]).toBe(true);
});

// ✅ Good - tests behavior
it('toggles visibility', () => {
  render(<Modal />);
  fireEvent.click(screen.getByText('Open'));
  expect(screen.getByRole('dialog')).toBeVisible();
});
```

**2. Use Semantic Queries**
```typescript
// Prefer semantic queries in order:
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')
screen.getByText('Welcome')
screen.getByTestId('custom-element') // Last resort
```

**3. Async Testing**
```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Find element (automatically waits)
const element = await screen.findByText('Success');
expect(element).toBeInTheDocument();
```

**4. Mocking**
```typescript
// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchEmployees: jest.fn(() => Promise.resolve([...mockData]))
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));
```

---

## Coverage Requirements

### Coverage Thresholds

**Global:** 70% minimum
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

**Critical Paths:** 90% minimum
- Authentication (`lib/auth/`)
- API routes (`app/api/`)
- Security (`lib/security/`)
- Data validation (`lib/validation/`)

### Viewing Coverage

```bash
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Report Example
```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   75.23 |    68.45 |   72.11 |   76.89 |
 components/           |   82.45 |    76.32 |   79.23 |   83.12 |
 lib/api-helpers/      |   91.23 |    87.45 |   88.92 |   92.34 |
 lib/auth/             |   95.67 |    92.13 |   93.45 |   96.23 |
-----------------------|---------|----------|---------|---------|
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install
        working-directory: ./webapp

      - name: Run type check
        run: npm run type-check
        working-directory: ./webapp

      - name: Run linter
        run: npm run lint
        working-directory: ./webapp

      - name: Run unit tests
        run: npm run test:coverage
        working-directory: ./webapp

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./webapp

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./webapp/coverage/lcov.info
```

---

## Troubleshooting

### Common Issues

**1. Tests timing out**
```typescript
// Increase timeout for slow tests
it('fetches data', async () => {
  // ...
}, 10000); // 10 second timeout
```

**2. Mock not working**
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

**3. E2E test flakiness**
```typescript
// Use waitFor instead of hardcoded delays
await page.waitForSelector('[data-testid="success"]');
// Instead of: await page.waitForTimeout(1000);
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Component Library](../components/COMPONENT_LIBRARY.md)
- [API Reference](../api/API_REFERENCE.md)

---

**Questions?** Open an issue or consult the [Documentation Index](../README.md).
