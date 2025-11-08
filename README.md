# HR Command Center

> A comprehensive HR automation platform powered by Claude AI, integrating with Rippling, Notion, Google Workspace, Slack, and Calendly.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)

**Features:** 23 HR Skills • 15+ AI-Powered API Endpoints • 10+ AI Components • Full RBAC • 6 Google Cloud AI Services • Production-Ready

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

This is a **complete AI-powered HR automation platform** that combines Claude AI with Google Cloud AI services to provide:

1. **Claude Skills** - 23 specialized HR capabilities with domain knowledge
2. **AI Services** - 6 Google Cloud AI integrations (NLP, Translation, Speech, Document AI, Vertex AI, Vision)
3. **Automation Agents** - Scheduled scripts that sync data and automate workflows
4. **Web Dashboard** - Central interface to interact with all capabilities

**AI Capabilities:**
- 📄 Intelligent document processing (resumes, forms, IDs)
- 💬 Advanced sentiment analysis and entity extraction
- 🎯 Predictive analytics (attrition, performance, promotion)
- 🌍 Multilingual support (100+ languages)
- 🎤 Interview transcription with speaker identification
- 🔒 ID verification and content moderation

## 📁 Project Structure

```
hrskills/
├── integrations/        # Shared integration layer for all systems
├── skills/             # Claude skills with HR domain knowledge
├── agents/             # Automation agents (Python scripts)
├── webapp/             # Next.js web application
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x+ (check: `node --version`)
- **npm** 10.x+ (check: `npm --version`)
- **Python** 3.11+ for automation agents (check: `python3 --version`)
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
   # Install all dependencies (webapp + agents)
   make install

   # Or manually:
   npm install
   cd webapp && npm install
   pip3 install -r requirements.txt
   ```

4. **Start the development server**
   ```bash
   make dev

   # Or manually:
   cd webapp && npm run dev
   ```

5. **Access the application**
   - Web app: http://localhost:3000
   - Login with demo credentials (see webapp for details)

### Alternative: Docker Setup

```bash
# Start all services (webapp, postgres, redis, agents)
make docker-up

# Access at http://localhost:3000

# Stop services
make docker-down
```

For detailed setup instructions, see **[Development Setup Guide](docs/guides/DEVELOPMENT_SETUP.md)**.

## 🔧 Configuration

### API Keys Setup

1. **Claude AI**
   - Get API key from: https://console.anthropic.com/
   - Set `ANTHROPIC_API_KEY` in `.env.local`

2. **Google Cloud AI Services** (6 APIs)
   - Create project at: https://console.cloud.google.com/
   - Enable APIs: Natural Language, Translation, Speech-to-Text, Document AI, Vertex AI, Vision
   - Create service account and download JSON key
   - Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local`
   - Copy `.env.ai.example` to `.env.local` and configure AI services
   - See [AI Services Setup](#ai-services-implementation) for detailed instructions

3. **Rippling**
   - Generate API key in Rippling settings
   - Set `RIPPLING_API_KEY` in `.env.local`

4. **Notion**
   - Create integration at: https://www.notion.so/my-integrations
   - Set `NOTION_TOKEN` in `.env.local`

5. **Slack**
   - Create app at: https://api.slack.com/apps
   - Add bot token scopes: `chat:write`, `im:write`, `users:read`
   - Set `SLACK_BOT_TOKEN` in `.env.local`

6. **Calendly**
   - Generate API key in Calendly settings
   - Set `CALENDLY_API_KEY` in `.env.local`

## 📚 Documentation

### 🚀 Getting Started
- **[Getting Started Guide](GETTING_STARTED.md)** - Detailed setup and onboarding
- **[Quick Reference Card](quick-reference-card.md)** - Fast lookup for common tasks
- **[Development Setup](docs/guides/DEVELOPMENT_SETUP.md)** - Complete development environment setup

### 📖 Core Documentation
- **[Master Capabilities Document](claude-hr-capabilities-master.md)** - Complete guide to all 27 HR skills
- **[API Reference](docs/api/API_REFERENCE.md)** - All 23 API endpoints with examples
- **[Component Library](docs/components/COMPONENT_LIBRARY.md)** - 17 custom components with usage examples

### 🔧 Development & Testing
- **[Testing Guide](docs/guides/TESTING_GUIDE.md)** - Unit, integration, E2E, and accessibility testing
- **[Contributing Guidelines](CONTRIBUTING.md)** - Development workflow and code standards
- **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)** - Technical decisions and rationale

### 🚢 Deployment & Operations
- **[Deployment Guide](docs/guides/DEPLOYMENT_GUIDE.md)** - Deploy to Docker, Kubernetes, or cloud platforms
- **[Operations Guide](docs/guides/OPERATIONS.md)** - Monitoring, maintenance, and incident response
- **[Security Implementation](docs/guides/SECURITY_IMPLEMENTATION_SUMMARY.md)** - Security features and best practices

### 📑 All Documentation
- **[Documentation Summary](DOCUMENTATION_SUMMARY.md)** - Quick navigation guide to all docs (60+ files)
- **[Full Documentation Index](docs/README.md)** - Browse all documentation organized by topic

## 🎨 Features

### AI Services Implementation

This platform includes **6 Google Cloud AI services** for comprehensive HR automation:

#### Phase 1: Natural Language Processing ✅
- Sentiment analysis for reviews and surveys
- Entity extraction (people, organizations, locations)
- Content classification and categorization
- **Cost:** $5-8/month | **ROI:** 90% time savings on feedback analysis

#### Phase 2: Multilingual Support ✅
- Translation API for 100+ languages
- Automatic language detection
- Multilingual survey analysis
- **Cost:** $0/month (free tier) | **ROI:** Global workforce support

#### Phase 3: Interview Intelligence ✅
- Speech-to-text transcription with speaker diarization
- Real-time voice input for chat
- Searchable interview transcripts
- **Cost:** $15-25/month | **ROI:** Automated transcription, searchable archives

#### Phase 4: Document Intelligence ✅
- Resume parsing with auto-population
- Form extraction (W-4, I-9, W-2)
- General OCR for scanned documents
- **Cost:** $0-15/month | **ROI:** 90% reduction in manual data entry

#### Phase 5: Predictive Analytics ✅
- Attrition prediction with flight risk scoring
- Performance forecasting
- Promotion readiness assessment
- **Cost:** $0-1/month | **ROI:** Each prevented departure saves $50-100K

#### Phase 6: Vision & OCR ✅
- ID verification for I-9 compliance
- Profile photo moderation
- Evidence analysis for ER cases
- **Cost:** $0-2/month | **ROI:** Automated verification, compliance

**Total AI Cost:** $20-50/month | **Total ROI:** Hundreds of hours saved monthly

### Available Skills (23 Total)

- **HR Document Generator** - Create offer letters, PIPs, termination letters
- **Rippling Integration** - Pull and analyze employee data
- **Interview & Hiring** - Generate job descriptions, interview guides, scorecards
- **Performance Review** - Manage review cycles, synthesize feedback with AI sentiment analysis
- **HR Analytics** - Turnover analysis, diversity metrics, compensation equity, predictive insights
- **Onboarding Orchestrator** - Coordinate new hire setup with automated ID verification
- **Employee Relations** - Case management with AI-powered evidence analysis
- **Survey Analyzer** - Multilingual survey analysis with translation
- **Resume Parser** - Automated candidate data extraction
- **Flight Risk Dashboard** - Proactive retention with ML predictions

### Automation Agents

- **New Hire Onboarding** - Auto-provision accounts and create checklists
- **HR Metrics Dashboard** - Daily sync of key metrics to Google Sheets
- **Performance Review Orchestrator** - Manage review cycle logistics
- **Exit Interview & Offboarding** - Handle employee departures with transcription
- **Compliance Monitoring** - Track expiring documents and requirements
- **Candidate Pipeline** - Monitor recruiting funnel health

## 🔄 Development Workflow

### Working with Skills

Skills are located in `skills/[skill-name]/SKILL.md`. Each skill has:
- Main skill definition (SKILL.md)
- Reference documents (references/)
- Assets (assets/)
- Helper scripts (scripts/)

### Running Agents

Agents can be run manually or scheduled:

```bash
# Run new hire onboarding agent
npm run agent:onboarding

# Run metrics dashboard agent
npm run agent:metrics
```

For production, set up cron jobs or use a scheduler like GitHub Actions.

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
- Rate limiting & caching
- Claude 3.5 Sonnet API

**AI Services (Google Cloud):**
- Natural Language API (sentiment, entities, classification)
- Translation API (100+ languages)
- Speech-to-Text API (transcription, diarization)
- Document AI (resume parsing, form extraction, OCR)
- Vertex AI (predictive analytics, ML models)
- Vision API (ID verification, image moderation)

**Infrastructure:**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- PostgreSQL (future)
- Redis (caching)

**Testing:**
- Jest + React Testing Library
- Playwright (E2E)
- jest-axe (accessibility)
- AI Integration Tests (6 test suites)

For detailed architecture decisions, see **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)**.

## 🤝 Contributing

Want to contribute? Check out our comprehensive guides:

- **[Contributing Guidelines](CONTRIBUTING.md)** - Development workflow, code standards, and PR process
- **[Development Setup](docs/guides/DEVELOPMENT_SETUP.md)** - Complete setup instructions
- **[Architecture Decisions](docs/architecture/ARCHITECTURE_DECISIONS.md)** - Technical decisions and rationale
- **[Changelog](CHANGELOG.md)** - Version history and recent changes

## 📝 License

MIT License - Internal use only

## 🆘 Support

- See [Quick Reference Card](quick-reference-card.md) for troubleshooting
- Browse [Documentation Index](docs/README.md) for guides and references
- Contact: hr@yourcompany.com
