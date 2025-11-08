# Getting Started with HR Command Center

Welcome! This guide will help you set up and start using the HR automation platform.

## 🎯 What You Have

A complete HR automation platform with three main components:

1. **Integrations** - Connect to Rippling, Notion, Google Workspace, Slack, Calendly
2. **Skills** - Claude capabilities with HR domain knowledge
3. **Agents** - Automated scripts for recurring workflows
4. **Web App** - Dashboard and chat interface

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm
- Python 3.10+ (for agents)
- API keys for:
  - Anthropic Claude
  - Rippling
  - Notion
  - Google Workspace
  - Slack
  - Calendly

## 🚀 Quick Start (15 minutes)

### Step 1: Configure API Keys

```bash
cd ~/Desktop/HRSkills

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your API keys
nano .env.local
```

**Required Keys:**
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/
- `RIPPLING_API_KEY` - Generate in Rippling settings
- (Others can be added later)

### Step 2: Install Dependencies

```bash
# Install integration dependencies
cd integrations
npm install

# Install webapp dependencies
cd ../webapp
npm install
```

### Step 3: Start the Web App

```bash
cd webapp
npm run dev
```

Visit: **http://localhost:3000**

You should see:
- HR Metrics Dashboard (left side)
- Chat Interface (right side)

### Step 4: Test the Chat

1. Select a skill from the dropdown (e.g., "Document Generator")
2. Ask: "Help me create an offer letter for a Senior Engineer"
3. Claude will ask for required information and generate the document

## 📚 Project Structure

```
HRSkills/
├── integrations/        # API clients for all systems
│   ├── rippling/       # Employee data, ATS, performance
│   ├── notion/         # Project management, checklists
│   ├── google/         # Gmail, Calendar, Drive, Sheets
│   ├── slack/          # Team communication
│   └── calendly/       # Interview scheduling
│
├── skills/             # Claude skills with HR knowledge
│   ├── hr-document-generator/
│   ├── rippling-integration/
│   ├── interview-hiring/
│   ├── performance-review/
│   ├── hr-analytics/
│   └── onboarding-orchestrator/
│
├── agents/             # Automation scripts
│   ├── new-hire-onboarding/
│   └── hr-metrics-dashboard/
│
├── webapp/             # Next.js web application
│   ├── app/           # Pages and API routes
│   ├── components/    # React components
│   └── lib/           # Utilities
│
└── docs/              # Documentation
    ├── claude-hr-capabilities-master.md
    └── quick-reference-card.md
```

## 🎨 What Each Component Does

### Integrations Layer
Shared code that connects to all your systems. Used by skills, agents, and webapp.

**Example:**
```typescript
import { getAllEmployees } from './integrations/rippling/employees'
const employees = await getAllEmployees({ status: 'active' })
```

### Skills
Teach Claude about your HR processes and give it access to templates and guidelines.

**Example Skills:**
- `hr-document-generator` - Creates offer letters, PIPs, termination letters
- `interview-hiring` - Job descriptions, interview guides, scorecards
- `performance-review` - Review synthesis, development plans

### Agents
Python scripts that run on schedules to automate workflows.

**Example Agents:**
- `new-hire-onboarding` - When someone is hired, provision all accounts automatically
- `hr-metrics-dashboard` - Daily sync of HR data to Google Sheets

### Web App
Your central interface - chat with Claude using any skill, view metrics, monitor agents.

## 🔧 Next Steps

### 1. Set Up Your First Integration (Rippling)

```bash
# Add to .env.local
RIPPLING_API_KEY=your_key_here
RIPPLING_BASE_URL=https://api.rippling.com
```

Test it:
```bash
cd integrations
npm run build
node -e "require('./rippling/employees').getAllEmployees().then(console.log)"
```

### 2. Customize Your First Skill

Edit the HR Document Generator:

```bash
cd skills/hr-document-generator/references
nano company-voice-guide.md
```

Update with your company's:
- Tone and style
- Values
- Specific terminology

### 3. Run Your First Agent

```bash
cd agents/new-hire-onboarding
python3 agent.py --dry-run
```

This will show you what the agent would do without actually making changes.

### 4. Enhance the Web App

The webapp currently shows mock data. Connect it to real Rippling data:

Edit `webapp/app/api/metrics/route.ts`:
```typescript
import { getAllEmployees } from '@/../../integrations/rippling/employees'

export async function GET() {
  const employees = await getAllEmployees({ status: 'active' })

  return NextResponse.json({
    headcount: employees.length,
    // ... calculate other metrics
  })
}
```

## 📖 Learning Resources

- **[Master Capabilities Document](claude-hr-capabilities-master.md)** - Complete feature list and implementation guide
- **[Quick Reference Card](quick-reference-card.md)** - Fast lookup for common tasks
- **[Documentation Index](docs/README.md)** - Browse all guides, features, and references
- **Individual READMEs** - Each component has its own README with detailed instructions

## 🎯 Common Use Cases

### "I want to create an offer letter"

1. Open web app (http://localhost:3000)
2. Select "Document Generator" skill
3. Ask: "Create an offer letter for [role]"
4. Provide requested details
5. Review and edit generated document

### "I want to see current headcount by department"

1. Set up Rippling integration
2. Web app will automatically show real metrics
3. Or ask in chat: "Show me headcount by department"

### "I want to automate new hire onboarding"

1. Configure all API keys (Rippling, Notion, Google, Slack)
2. Customize the onboarding checklist template
3. Run agent: `python3 agents/new-hire-onboarding/agent.py`
4. Set up daily cron job to run automatically

## 🆘 Troubleshooting

### Web app won't start
```bash
cd webapp
rm -rf node_modules .next
npm install
npm run dev
```

### Chat returns errors
- Check `ANTHROPIC_API_KEY` in `.env.local`
- Verify API key has credits at console.anthropic.com

### Can't connect to Rippling
- Verify API key is correct
- Check key has required permissions
- Test with: `curl -H "Authorization: Bearer $RIPPLING_API_KEY" https://api.rippling.com/platform/api/employees`

### Agent fails
- Run with `--dry-run` first to see what it would do
- Check all required API keys are set
- Review logs for specific error messages

## 🚢 Deployment

### Web App to Vercel

```bash
cd webapp
npm install -g vercel
vercel deploy
```

Add environment variables in Vercel dashboard.

### Agents to Cloud

The agents can run as:
- **Cron jobs** on any Linux server
- **AWS Lambda** functions
- **Google Cloud Functions**
- **GitHub Actions** (scheduled workflows)

## 📊 Metrics & Monitoring

Once fully configured, your dashboard will show:

- Total headcount (live from Rippling)
- Turnover rate (calculated)
- Open positions (from ATS)
- Time to fill (average for recent hires)
- New hires this month

All updating in real-time!

## 🎓 Advanced Topics

### Building a New Skill

See: `claude-hr-capabilities-master.md` → "Custom Skills Library"

### Creating a New Agent

See: `claude-hr-capabilities-master.md` → "Claude Code Agents"

### Adding a New Integration

Follow the pattern in `integrations/rippling/` - create client, types, and API methods.

## 🤝 Support

For questions or issues:
1. Check this guide
2. Review component-specific READMEs
3. Consult master documentation
4. Contact: [your HR team email]

## ✅ Success Checklist

- [ ] API keys configured in .env.local
- [ ] Integrations dependencies installed
- [ ] Webapp dependencies installed
- [ ] Web app running at localhost:3000
- [ ] Chat interface responding
- [ ] First skill tested (Document Generator)
- [ ] Rippling connection working
- [ ] First agent tested with --dry-run

Once all checked, you're ready to go! 🎉

---

**Next:** Read the [Master Capabilities Document](claude-hr-capabilities-master.md) to see everything this platform can do, or browse the [Documentation Index](docs/README.md) for specific guides.
