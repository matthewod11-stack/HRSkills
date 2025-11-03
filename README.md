# HR Command Center

A comprehensive HR automation platform powered by Claude AI, integrating with Rippling, Notion, Google Workspace, Slack, and Calendly.

## 🎯 What This Platform Does

This platform provides three layers of HR automation:

1. **Claude Skills** - Extend Claude's capabilities with HR domain knowledge
2. **Automation Agents** - Scheduled scripts that sync data and automate workflows
3. **Web Dashboard** - Central interface to interact with all capabilities

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

- Node.js 20+ and npm
- Python 3.10+
- API keys for: Claude, Rippling, Notion, Google Workspace, Slack, Calendly

### Installation

1. **Clone and setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Start the web application**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🔧 Configuration

### API Keys Setup

1. **Claude AI**
   - Get API key from: https://console.anthropic.com/
   - Set `ANTHROPIC_API_KEY` in `.env.local`

2. **Rippling**
   - Generate API key in Rippling settings
   - Set `RIPPLING_API_KEY` in `.env.local`

3. **Notion**
   - Create integration at: https://www.notion.so/my-integrations
   - Set `NOTION_TOKEN` in `.env.local`

4. **Google Workspace**
   - Create service account in Google Cloud Console
   - Enable required APIs (Admin SDK, Calendar, Gmail, Drive, Sheets)
   - Download credentials JSON
   - Set `GOOGLE_CREDENTIALS_PATH` in `.env.local`

5. **Slack**
   - Create app at: https://api.slack.com/apps
   - Add bot token scopes: `chat:write`, `im:write`, `users:read`
   - Set `SLACK_BOT_TOKEN` in `.env.local`

6. **Calendly**
   - Generate API key in Calendly settings
   - Set `CALENDLY_API_KEY` in `.env.local`

## 📚 Documentation

- **[Master Capabilities Document](docs/claude-hr-capabilities-master.md)** - Complete guide to all features
- **[Quick Reference Card](docs/quick-reference-card.md)** - Fast lookup for common tasks

## 🎨 Features

### Available Skills

- **HR Document Generator** - Create offer letters, PIPs, termination letters
- **Rippling Integration** - Pull and analyze employee data
- **Interview & Hiring** - Generate job descriptions, interview guides, scorecards
- **Performance Review** - Manage review cycles, synthesize feedback
- **HR Analytics** - Turnover analysis, diversity metrics, compensation equity
- **Onboarding Orchestrator** - Coordinate new hire setup across all systems

### Automation Agents

- **New Hire Onboarding** - Auto-provision accounts and create checklists
- **HR Metrics Dashboard** - Daily sync of key metrics to Google Sheets
- **Performance Review Orchestrator** - Manage review cycle logistics
- **Exit Interview & Offboarding** - Handle employee departures
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

## 🤝 Contributing

This is a private internal tool. For questions or improvements, contact the HR team.

## 📝 License

MIT License - Internal use only

## 🆘 Support

- See [Quick Reference Card](docs/quick-reference-card.md) for troubleshooting
- Contact: hr@yourcompany.com
