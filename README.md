# HR Command Center

> A comprehensive HR automation platform powered by Claude AI, integrating with Rippling, Notion, Google Workspace, Slack, and Calendly.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)

**Features:** 23 HR Skills • SQLite Database • Multi-Provider AI (Anthropic/OpenAI/Gemini) • Full RBAC • Production-Ready

---

## Table of Contents

- [What This Platform Does](#-what-this-platform-does)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Documentation](#-documentation)
- [Features](#-features)
- [Development Workflow](#-development-workflow)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

---

## 🎯 What This Platform Does

This is a **complete AI-powered HR automation platform** with multi-provider AI resilience and modern data infrastructure:

1. **Claude Skills** - 23 specialized HR capabilities with domain knowledge
2. **SQLite Database** - Production-ready data persistence with Drizzle ORM
3. **Multi-Provider AI** - Automatic failover across Anthropic, OpenAI, and Gemini
4. **Google Workspace Integration** - Seamless Drive, Docs, and Sheets connectivity
5. **Web Dashboard** - Modern Next.js interface with real-time updates

**Core Capabilities:**
- 🤖 Intelligent AI routing with automatic provider failover
- 💾 Normalized SQLite database with sub-50ms analytics queries
- 📊 Real-time HR metrics and predictive analytics
- 🔄 Google OAuth integration for Drive/Docs/Sheets
- ⚡ Production-ready with comprehensive testing
- 🔒 Built-in security with RBAC and audit logging

## 📁 Project Structure

```
hrskills/
├── integrations/        # Shared integration layer for all systems
├── skills/             # Claude skills with HR domain knowledge
├── webapp/             # Next.js web application
│   ├── app/           # Next.js App Router (pages + API routes)
│   ├── components/    # React components (UI + custom)
│   ├── lib/           # Core libraries
│   │   ├── ai/       # Multi-provider AI abstraction layer
│   │   ├── db/       # SQLite database with Drizzle ORM
│   │   ├── analytics/# SQL-based analytics queries
│   │   └── google/   # Google Workspace integration
│   └── db/           # Database schema definitions
├── scripts/            # Utility scripts (migrations, seeding)
└── docs/              # Comprehensive documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x+ (check: `node --version`)
- **npm** 10.x+ (check: `npm --version`)
- **Docker** (optional) for containerized deployment

### Installation (5 minutes)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hrskills.git
   cd hrskills
   ```

2. **Set up environment variables**
   ```bash
   cp .env.development .env.local
   # Edit .env.local with your API keys (see Configuration section below)
   ```

3. **Install dependencies**
   ```bash
   # Install webapp dependencies
   cd webapp && npm install
   ```

4. **Initialize database with demo data**
   ```bash
   npm run migrate:json-to-sqlite -- --demo
   ```

5. **Start the development server**
   ```bash
   cd webapp && npm run dev
   ```

6. **Access the application**
   - Web app: http://localhost:3000
   - Login with demo credentials (see webapp for details)

For detailed setup instructions, see **[Development Setup Guide](docs/guides/DEVELOPMENT_SETUP.md)**.

## 🔧 Configuration

### API Keys Setup

1. **AI Providers** (Configure at least one)
   - **Anthropic Claude** (Primary): Get API key from https://console.anthropic.com/
     - Set `ANTHROPIC_API_KEY` in `.env.local`
   - **OpenAI** (Fallback): Get API key from https://platform.openai.com/
     - Set `OPENAI_API_KEY` in `.env.local`
   - **Google Gemini** (Free tier): Get API key from https://ai.google.dev/
     - Set `GEMINI_API_KEY` in `.env.local`

2. **Google Workspace** (Required for Drive/Docs/Sheets integration)
   - Create OAuth 2.0 client at: https://console.cloud.google.com/
   - Download credentials JSON
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
   - First login will prompt OAuth flow and store tokens in database

3. **Optional Integrations**
   - **Rippling**: Set `RIPPLING_API_KEY` in `.env.local`
   - **Notion**: Set `NOTION_TOKEN` in `.env.local`
   - **Slack**: Set `SLACK_BOT_TOKEN` in `.env.local`
   - **Calendly**: Set `CALENDLY_API_KEY` in `.env.local`

## 📚 Documentation

### 🚀 Getting Started
- **[Getting Started Guide](docs/guides/GETTING_STARTED.md)** - Detailed setup and onboarding
- **[Quick Reference Card](quick-reference-card.md)** - Fast lookup for common tasks
- **[Development Setup](docs/guides/DEVELOPMENT_SETUP.md)** - Complete development environment setup

### 📖 Core Documentation
- **[Master Capabilities Document](claude-hr-capabilities-master.md)** - Complete guide to all 27 HR skills
- **[API Reference](docs/api/API_REFERENCE.md)** - All 23 API endpoints with examples
- **[Component Library](docs/components/COMPONENT_LIBRARY.md)** - 17 custom components with usage examples

### 🔧 Development & Testing
- **[Testing Guide](docs/guides/TESTING_GUIDE.md)** - Unit, integration, E2E, and accessibility testing
- **[Contributing Guidelines](docs/guides/CONTRIBUTING.md)** - Development workflow and code standards
- **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)** - Technical decisions and rationale

### 🚢 Deployment & Operations
- **[Deployment Guide](docs/guides/DEPLOYMENT_GUIDE.md)** - Deploy to Docker, Kubernetes, or cloud platforms
- **[Operations Guide](docs/guides/OPERATIONS.md)** - Monitoring, maintenance, and incident response
- **[Security Implementation](docs/guides/SECURITY_IMPLEMENTATION_SUMMARY.md)** - Security features and best practices

### 📑 All Documentation
- **[Documentation Summary](docs/overview/DOCUMENTATION_SUMMARY.md)** - Quick navigation guide to all docs (60+ files)
- **[Full Documentation Index](docs/README.md)** - Browse all documentation organized by topic

## 🎨 Features

### Phase 2 Simplification (COMPLETE ✅)

**Completion Date:** November 8, 2025

This platform has been modernized with a focus on resilience, simplicity, and production-readiness:

#### 1. SQLite Database Infrastructure ✅
- **Normalized schema** with 10 tables (employees, metrics, reviews, audit logs, etc.)
- **Drizzle ORM** for type-safe queries with full TypeScript support
- **Sub-50ms analytics** with indexed queries for headcount and attrition
- **Production-ready** with WAL mode, foreign key enforcement, and transactions
- **Migration tooling** with dry-run support and demo data generation
- **Cost:** $0 (embedded database)

#### 2. Multi-Provider AI Abstraction ✅
- **Automatic failover** across 3 providers: Anthropic Claude → OpenAI GPT-4o → Google Gemini 2.0 Flash
- **Health monitoring** with 30-second cache and circuit breaker pattern
- **Unified interface** for chat, analysis, and translation tasks
- **Usage tracking** to database for cost monitoring
- **Provider flexibility** configurable via Settings UI (admin only)
- **Free tier option** with Gemini 2.0 Flash as fallback
- **Cost:** Pay only for what you use with intelligent routing

#### 3. Google Workspace Integration ✅
- **OAuth 2.0 flow** with refresh token storage in database
- **Drive API** for template storage and document management
- **Docs API** for offer letters, PIPs, and other HR documents
- **Sheets API** for employee data exports and analytics dashboards
- **Secure token storage** with encrypted credentials
- **Cost:** Free (uses existing Google Workspace)

#### 4. Simplified Architecture ✅
- **Removed 5 Google AI packages** (NLP, Translation, Speech, Document AI, Vision)
- **Removed Python agents** and deprecated non-functional automation
- **Consolidated documentation** into organized `/docs` structure
- **Unified command center design** documented in `/docs/UNIFIED_COMMAND_CENTER_DESIGN.md`
- **Production testing** with comprehensive integration tests

### Available Skills (23 Total)

- **HR Document Generator** - Create offer letters, PIPs, termination letters via Google Docs
- **Rippling Integration** - Pull and analyze employee data
- **Interview & Hiring** - Generate job descriptions, interview guides, scorecards
- **Performance Review** - Manage review cycles, synthesize feedback with AI
- **HR Analytics** - SQL-powered turnover analysis, diversity metrics, compensation equity
- **Employee Relations** - Case management with AI-powered analysis
- **Survey Analyzer** - AI-powered survey analysis with intelligent routing
- **Flight Risk Dashboard** - Proactive retention with predictive analytics

## 🔄 Development Workflow

### Working with Skills

Skills are located in `skills/[skill-name]/SKILL.md`. Each skill has:
- Main skill definition (SKILL.md)
- Reference documents (references/)
- Assets (assets/)

### Database Management

```bash
# Migrate from JSON to SQLite
npm run migrate:json-to-sqlite

# Generate demo data (100 employees)
npm run migrate:json-to-sqlite -- --demo

# Run dry-run to preview migration
npm run migrate:json-to-sqlite -- --dry-run
```

### Web Application Development

```bash
cd webapp
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## 📊 Architecture

### System Overview

```
┌─────────────────────────────────────────┐
│         Next.js Web App                 │
│  (Chat Interface + HR Dashboard)        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Integrations Layer                 │
│  (Rippling, Notion, Google, Slack)      │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│    Skills    │  │    Agents    │
│  (Claude AI) │  │  (Scheduled) │
└──────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5.3
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Framer Motion (animations)

**Backend:**
- Next.js API Routes
- JWT Authentication + RBAC
- SQLite with Drizzle ORM
- Rate limiting & caching

**AI Services:**
- Multi-provider abstraction layer (Anthropic, OpenAI, Gemini)
- Automatic failover with health monitoring
- Usage tracking and cost optimization
- Claude 3.5 Sonnet primary model

**Database:**
- SQLite (embedded, production-ready)
- Drizzle ORM (type-safe queries)
- WAL mode for concurrent access
- Indexed analytics queries (<50ms)

**Integrations:**
- Google Workspace (Drive, Docs, Sheets) with OAuth 2.0
- Rippling, Notion, Slack, Calendly (optional)

**Testing:**
- Jest + React Testing Library
- Playwright (E2E)
- jest-axe (accessibility)
- Integration tests for AI providers

For detailed architecture decisions, see **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)**.

## 🤝 Contributing

Want to contribute? Check out our comprehensive guides:

- **[Contributing Guidelines](docs/guides/CONTRIBUTING.md)** - Development workflow, code standards, and PR process
- **[Development Setup](docs/guides/DEVELOPMENT_SETUP.md)** - Complete setup instructions
- **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)** - Technical decisions and rationale
- **[Changelog](docs/releases/CHANGELOG.md)** - Version history and recent changes

## 📝 License

MIT License - Internal use only

## 🆘 Support

- See [Quick Reference Card](quick-reference-card.md) for troubleshooting
- Browse [Documentation Index](docs/README.md) for guides and references
- Contact: hr@yourcompany.com
