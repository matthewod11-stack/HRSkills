# Development Setup Guide

Complete guide to setting up your development environment for HR Command Center.

**Last Updated:** November 11, 2025

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Development Tools](#development-tools)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [IDE Setup](#ide-setup)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

Install the following before beginning setup:

#### 1. Node.js and npm

**Required Version:** Node.js 20.x or higher

**Check current version:**
```bash
node --version  # Should be v20.x.x or higher
npm --version   # Should be 9.x.x or higher
```

**Installation:**
- **macOS:** `brew install node@20`
- **Windows:** Download from [nodejs.org](https://nodejs.org/)
- **Linux:** Use nvm: `nvm install 20 && nvm use 20`

**Using nvm (recommended):**
```bash
# Install nvm first (see https://github.com/nvm-sh/nvm)
nvm install 20
nvm use 20
nvm alias default 20
```

The project includes a `.nvmrc` file, so you can simply run:
```bash
nvm use
```

#### 2. Git

**Check current version:**
```bash
git --version
```

**Installation:**
- **macOS:** `brew install git` or install Xcode Command Line Tools
- **Windows:** Download from [git-scm.com](https://git-scm.com/)
- **Linux:** `sudo apt install git`

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HRSkills
```

### 2. Install Dependencies

**Option A: Automated setup (recommended)**
```bash
npm run setup
```

This command:
1. Installs root-level dependencies
2. Installs webapp dependencies
3. Sets up workspaces

**Option B: Manual setup**
```bash
# Install root dependencies
npm install

# Install webapp dependencies
cd webapp
npm install
cd ..
```

### 3. Verify Installation

```bash
# Check that all dependencies are installed
npm list --depth=0
cd webapp && npm list --depth=0
```

---

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

Edit `.env.local` with your configuration:

#### **Anthropic Claude API**

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**How to get:**
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Go to "API Keys" section
4. Create a new API key
5. Copy and paste into `.env.local`

#### **Rippling Integration**

```env
RIPPLING_API_KEY=your-rippling-api-key
RIPPLING_API_URL=https://api.rippling.com
```

**How to get:**
1. Log in to Rippling as an administrator
2. Navigate to Settings → Integrations → API
3. Generate a new API key
4. Copy the key and API base URL

#### **Notion Integration**

```env
NOTION_TOKEN=secret_...
```

**How to get:**
1. Visit [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Give it a name (e.g., "HR Command Center")
4. Select the workspace
5. Copy the "Internal Integration Token"
6. Share relevant databases with this integration

#### **Google Workspace**

```env
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_ADMIN_EMAIL=admin@yourcompany.com
```

**How to get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Admin SDK API
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
4. Create a service account
5. Download the JSON credentials file
6. Place it in a secure location
7. Update `GOOGLE_CREDENTIALS_PATH` with full path

#### **Slack Integration**

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

**How to get:**
1. Visit [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it and select your workspace
4. Under "OAuth & Permissions", add these scopes:
   - `chat:write`
   - `im:write`
   - `users:read`
5. Install app to workspace
6. Copy "Bot User OAuth Token" (starts with `xoxb-`)
7. Go to "Basic Information" and copy "Signing Secret"

#### **Calendly Integration**

```env
CALENDLY_API_KEY=...
```

**How to get:**
1. Log in to Calendly
2. Go to Integrations → API & Webhooks
3. Generate a new Personal Access Token
4. Copy the token

#### **Application Configuration**

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Authentication (for JWT tokens)
JWT_SECRET=your-secure-random-string-here

# Optional: AI Cost Tracking
ANTHROPIC_COST_PER_INPUT_TOKEN=0.000003
ANTHROPIC_COST_PER_OUTPUT_TOKEN=0.000015
```

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Environment File Structure

Your `.env.local` should look like this:

```env
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-...

# Rippling
RIPPLING_API_KEY=...
RIPPLING_API_URL=https://api.rippling.com

# Notion
NOTION_TOKEN=secret_...

# Google Workspace
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_ADMIN_EMAIL=admin@yourcompany.com

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Calendly
CALENDLY_API_KEY=...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here

# Optional: AI Cost Tracking
ANTHROPIC_COST_PER_INPUT_TOKEN=0.000003
ANTHROPIC_COST_PER_OUTPUT_TOKEN=0.000015
```

### 4. Verify Configuration

Create a test script to verify environment variables are loaded:

```bash
cd webapp
node -e "console.log('Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? '✓ Set' : '✗ Missing')"
```

---

## Running the Application

### Development Mode

**Start the web application:**
```bash
npm run dev
```

This starts the Next.js development server at `http://localhost:3000`

**Features in development mode:**
- Hot module replacement (HMR)
- Fast refresh for React components
- Detailed error messages
- Source maps for debugging

### Production Build

**Build for production:**
```bash
cd webapp
npm run build
```

**Start production server:**
```bash
npm run start
```

### Running Automation Agents

**New hire onboarding agent:**
```bash
npm run agent:onboarding
```

**HR metrics dashboard agent:**
```bash
npm run agent:metrics
```

**With dry-run mode:**
```bash
python3 agents/new-hire-onboarding/agent.py --dry-run
```

---

## Development Tools

### Available Scripts

From the **root directory:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start webapp development server |
| `npm run build` | Build webapp for production |
| `npm run start` | Start webapp production server |
| `npm run lint` | Lint webapp code |
| `npm run setup` | Install all dependencies |

**Note:** Python automation agents removed in Phase 2 (November 2025). All automation moved to Node.js/TypeScript workflows.

From the **webapp directory:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:analyze` | Build with bundle analyzer |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:a11y` | Run accessibility tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run validate` | Run type-check, lint, and tests |
| `npm run clean` | Clean build artifacts |

### Code Quality Tools

#### TypeScript Type Checking

```bash
cd webapp
npm run type-check
```

Checks for TypeScript errors without building.

#### ESLint

```bash
cd webapp
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

#### Prettier

```bash
cd webapp
npm run format:check  # Check formatting
npm run format        # Format all files
```

#### Bundle Analyzer

Analyze bundle size:
```bash
cd webapp
npm run build:analyze
```

This opens an interactive treemap of your bundle.

### Testing

#### Unit Tests (Jest)

```bash
cd webapp
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

**Coverage thresholds:**
- Global: 70%
- Critical paths: 90%

#### E2E Tests (Playwright)

```bash
cd webapp
npm run test:e2e         # Headless mode
npm run test:e2e:ui      # With UI
npm run test:e2e:a11y    # Accessibility E2E
```

#### Accessibility Tests

```bash
cd webapp
npm run test:a11y        # Jest + axe-core
npm run test:e2e:a11y    # Playwright + axe
```

---

## Common Issues & Troubleshooting

### Node Version Issues

**Error:** "The engine 'node' is incompatible with this module"

**Solution:**
```bash
nvm use 20
# Or update Node.js to version 20+
```

### Port Already in Use

**Error:** "Port 3000 is already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found

**Error:** "Cannot find module '@/components/...'"

**Solution:**
```bash
# Clear node_modules and reinstall
cd webapp
rm -rf node_modules .next
npm install
```

### Environment Variables Not Loading

**Error:** Environment variables are undefined

**Solution:**
1. Ensure `.env.local` is in the **webapp** directory
2. Restart the dev server after changing `.env.local`
3. Check that variable names start with `NEXT_PUBLIC_` for client-side access
4. Verify no syntax errors in `.env.local` (no quotes needed for values)

### Python Dependencies Issues

**Error:** "ModuleNotFoundError: No module named '...'"

**Solution:**
```bash
pip3 install -r requirements.txt

# Or use a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Build Errors

**Error:** Build fails with TypeScript errors

**Solution:**
```bash
cd webapp
npm run type-check  # See detailed errors
# Fix errors, then rebuild
npm run build
```

### Test Failures

**Error:** Tests failing locally

**Solution:**
```bash
cd webapp
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm run test -- --verbose
```

---

## IDE Setup

### VS Code (Recommended)

**Recommended Extensions:**
1. ESLint (`dbaeumer.vscode-eslint`)
2. Prettier (`esbenp.prettier-vscode`)
3. TypeScript and JavaScript Language Features (built-in)
4. Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
5. Path Intellisense (`christian-kohler.path-intellisense`)
6. GitLens (`eamodio.gitlens`)

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "webapp/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### WebStorm / IntelliJ

1. Open Settings → Languages & Frameworks → JavaScript
2. Set JavaScript language version to "ECMAScript 6+"
3. Enable "Code quality tools" → ESLint
4. Enable Prettier under "Prettier"
5. Set Node.js interpreter to Node 20+

---

## Next Steps

After completing setup:

1. **Explore the codebase:**
   - Review [Project Structure](CONTRIBUTING.md#project-structure)
   - Browse [Documentation Index](../README.md)

2. **Try the application:**
   - Visit `http://localhost:3000`
   - Test the chat interface
   - Upload sample employee data
   - Explore analytics dashboard

3. **Run tests:**
   ```bash
   cd webapp
   npm run validate
   ```

4. **Read documentation:**
   - [Contributing Guide](CONTRIBUTING.md)
   - [Architecture Decisions](../architecture/ARCHITECTURE_DECISIONS.md)
   - [Skills Guide](SKILLS_GUIDE.md) - Complete guide to all 25 skills
   - [Skills Index](../../skills/SKILLS_INDEX.md) - Quick skills catalog
   - [API Reference](../api/API_REFERENCE.md)

5. **Make your first contribution:**
   - Find a good first issue
   - Create a feature branch
   - Make changes and test
   - Submit a pull request

---

## Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Skills Guide](SKILLS_GUIDE.md) - Skills development and organization
- [Skills Index](../../skills/SKILLS_INDEX.md) - All 25 skills catalog
- [Security Guide](./SECURITY_IMPLEMENTATION_PLAN.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Data Sources Guide](./DATA_SOURCES_GUIDE.md)

---

## Need Help?

- **Setup issues?** Check [Troubleshooting](#common-issues--troubleshooting)
- **Questions?** Open a discussion or ask in team chat
- **Found a bug?** Open an issue with reproduction steps
- **Documentation unclear?** Open a PR to improve it

---

**Happy coding!** 🚀
