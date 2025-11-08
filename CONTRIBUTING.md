# Contributing to HR Command Center

Thank you for your interest in contributing to the HR Command Center! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** (check with `node --version`)
- **npm 9+** (check with `npm --version`)
- **Python 3.10+** (for automation agents)
- **Git** for version control

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HRSkills
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```
   This will install dependencies for both the root project and the webapp.

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys and configuration.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The webapp will be available at `http://localhost:3000`

For detailed setup instructions, see [Development Setup Guide](docs/guides/DEVELOPMENT_SETUP.md).

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/description` - New features (e.g., `feature/ai-cost-optimization`)
- `fix/description` - Bug fixes (e.g., `fix/authentication-error`)
- `docs/description` - Documentation updates (e.g., `docs/api-reference`)
- `refactor/description` - Code refactoring (e.g., `refactor/state-management`)
- `test/description` - Test additions/updates (e.g., `test/employee-store`)
- `chore/description` - Maintenance tasks (e.g., `chore/dependency-updates`)

### Commit Message Guidelines

Write clear, descriptive commit messages:

```
type(scope): brief description

Detailed explanation of what changed and why (optional)

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Examples:**
```
feat(chat): add AI cost tracking to chat interface

fix(auth): resolve token expiration handling

docs(api): add documentation for employee endpoints

refactor(components): migrate to Zustand state management
```

### Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow the code standards (see below)
   - Add tests for new functionality

3. **Test your changes**
   ```bash
   cd webapp
   npm run validate  # Runs type-check, lint, and tests
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Code Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define explicit types** - Avoid `any` unless absolutely necessary
- **Use interfaces** for object shapes
- **Export types** from dedicated files in `lib/types/`

**Example:**
```typescript
// lib/types/employee.ts
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  startDate: string;
}

// Using the type
import { Employee } from '@/lib/types/employee';

function getEmployee(id: string): Employee {
  // Implementation
}
```

### React Components

- **Use functional components** with hooks
- **Prefer named exports** for components
- **Use TypeScript interfaces** for props
- **Keep components focused** - Single responsibility principle
- **Extract reusable logic** into custom hooks

**Example:**
```typescript
// components/custom/EmployeeCard.tsx
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: string) => void;
  className?: string;
}

export function EmployeeCard({ employee, onEdit, className }: EmployeeCardProps) {
  return (
    <Card className={className}>
      {/* Component implementation */}
    </Card>
  );
}
```

### File Organization

- **Components**: `webapp/components/custom/` for custom components, `webapp/components/ui/` for shadcn components
- **API Routes**: `webapp/app/api/[feature]/route.ts`
- **Library Code**: `webapp/lib/` for utilities, helpers, and shared logic
- **Types**: `webapp/lib/types/` for TypeScript interfaces and types
- **Hooks**: `webapp/lib/hooks/` for custom React hooks
- **Tests**: `webapp/__tests__/` for unit tests, `webapp/e2e/` for E2E tests

### Code Formatting

We use **Prettier** for code formatting:

```bash
cd webapp
npm run format       # Format all files
npm run format:check # Check formatting
```

**Prettier config** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Linting

We use **ESLint** with Next.js configuration:

```bash
cd webapp
npm run lint      # Check for linting errors
npm run lint:fix  # Auto-fix linting errors
```

---

## Testing Requirements

### Unit Tests (Jest + React Testing Library)

All new features should include unit tests:

```bash
cd webapp
npm run test              # Run all tests
npm run test:watch        # Run in watch mode
npm run test:coverage     # Generate coverage report
```

**Test file naming:** `__tests__/[component-name].test.tsx`

**Example:**
```typescript
// __tests__/EmployeeCard.test.tsx
import { render, screen } from '@testing-library/react';
import { EmployeeCard } from '@/components/custom/EmployeeCard';

describe('EmployeeCard', () => {
  it('renders employee information correctly', () => {
    const employee = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      department: 'Engineering',
      startDate: '2024-01-01',
    };

    render(<EmployeeCard employee={employee} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

Include accessibility tests for UI components:

```bash
cd webapp
npm run test:a11y  # Run accessibility tests
```

**Example:**
```typescript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<EmployeeCard employee={employee} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Tests (Playwright)

Add E2E tests for critical user flows:

```bash
cd webapp
npm run test:e2e       # Run E2E tests headless
npm run test:e2e:ui    # Run with UI
```

**Test file naming:** `e2e/[feature].spec.ts`

### Coverage Requirements

- **Minimum coverage**: 70% overall
- **Critical paths**: 90% coverage for authentication, data handling, and security features
- **New features**: Must include tests before merging

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   cd webapp
   npm run validate
   ```

2. **Run type checking**
   ```bash
   cd webapp
   npm run type-check
   ```

3. **Update documentation** if you've changed:
   - API endpoints
   - Component interfaces
   - Configuration options
   - User-facing features

4. **Add entries to CHANGELOG.md** under "Unreleased" section

### PR Title Format

Use the same format as commit messages:

```
type(scope): brief description
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
Describe how you tested this change:
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Accessibility tested (for UI changes)
```

### Review Process

1. **At least one approval** required before merging
2. **All CI checks must pass** (tests, linting, type checking)
3. **Address review comments** - Don't merge with unresolved threads
4. **Squash commits** when merging to keep history clean

---

## Project Structure

```
HRSkills/
├── webapp/                 # Next.js web application
│   ├── app/               # Next.js App Router pages and API routes
│   │   ├── api/          # API endpoints
│   │   ├── [feature]/    # Feature pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/
│   │   ├── custom/       # Custom components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities and shared logic
│   │   ├── api-helpers/  # API utilities
│   │   ├── auth/         # Authentication
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── utils.ts      # Utility functions
│   ├── __tests__/        # Unit tests
│   └── e2e/              # E2E tests
├── skills/                # Claude skills (27 skills)
├── agents/                # Python automation agents
├── integrations/          # Third-party API integrations
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── data/                  # Runtime data files
```

---

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `webapp/app/api/[feature]/route.ts`
2. Implement handler with proper error handling:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { validateRequest } from '@/lib/api-helpers/validation';
   import { handleError } from '@/lib/api-helpers/error-handler';

   export async function GET(request: NextRequest) {
     try {
       // Validate authentication
       // Implement logic
       return NextResponse.json({ data: result });
     } catch (error) {
       return handleError(error);
     }
   }
   ```
3. Add validation schema if needed in `lib/api-helpers/schemas.ts`
4. Add tests in `__tests__/api/[feature].test.ts`
5. Document in API reference (coming soon)

### Adding a New Component

1. Create component file: `components/custom/ComponentName.tsx`
2. Define TypeScript interface for props
3. Implement component with accessibility in mind
4. Add unit tests in `__tests__/ComponentName.test.tsx`
5. Add accessibility tests
6. Document component usage

### Adding a New Claude Skill

1. Create directory: `skills/[skill-name]/`
2. Create `SKILL.md` with skill definition
3. Add reference documents in `references/`
4. Update skills index in `lib/skills.ts`
5. Test skill in Claude interface
6. Document skill in capabilities guide

### Updating Dependencies

1. **Check for updates:**
   ```bash
   cd webapp
   npm outdated
   ```

2. **Update specific dependency:**
   ```bash
   npm update [package-name]
   ```

3. **Test thoroughly** after updates
4. **Update CHANGELOG.md** with dependency changes
5. **Run security audit:**
   ```bash
   npm audit
   ```

---

## Code Review Checklist

### For Reviewers

- [ ] Code follows project style guidelines
- [ ] Changes are well-documented
- [ ] Tests are included and passing
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Accessibility maintained (for UI changes)
- [ ] Error handling is robust
- [ ] TypeScript types are properly defined
- [ ] No unnecessary dependencies added
- [ ] Documentation updated if needed

### For Authors

Before requesting review:

- [ ] Self-reviewed code
- [ ] All tests passing locally
- [ ] No console errors or warnings
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] PR description is complete
- [ ] Screenshots added (for UI changes)

---

## Getting Help

- **Questions?** Open a discussion or ask in team chat
- **Bug found?** Open an issue with reproduction steps
- **Documentation unclear?** Open an issue or PR to improve it

---

## Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [Development Setup Guide](docs/guides/DEVELOPMENT_SETUP.md)
- [Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)
- [API Documentation](docs/api/) (coming soon)
- [Component Library](docs/components/) (coming soon)
- [Full Documentation Index](docs/README.md)

---

**Thank you for contributing to HR Command Center!** 🎉
