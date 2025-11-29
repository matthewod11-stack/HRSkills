# Feature Parity Checklist for Desktop App Migration

**Date:** 2025-01-27  
**Purpose:** Complete inventory of all features to replicate in Electron desktop app  
**Phase:** Phase 0 - Pre-Flight Validation

---

## Overview

This document catalogs all features, skills, UI components, and API endpoints that must be replicated in the Electron desktop application to maintain feature parity with the webapp.

**Total Features:** 25 Skills + 30+ UI Features + 40+ API Endpoints

---

## 1. HR Skills Inventory (25 Skills)

### Hiring Workflow (4 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `job-description-writer` | Job Description Writer | Creates compelling, legally compliant job descriptions | 64KB | 4 | ✅ Active |
| `interview-guide-creator` | Interview Guide Creator | Develops structured interview guides with scorecards | 24KB | 1 | ✅ Active |
| `headcount-planner` | Headcount Planner | Plans headcount needs and hiring pipelines | 20KB | 1 | ✅ Active |
| `hr-document-generator` | HR Document Generator | Multi-workflow document generation (offers, PIPs, etc.) | 36KB | 3 | ✅ Active |

### Performance Workflow (8 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `pip-builder-monitor` | PIP Builder & Monitor | Creates and monitors Performance Improvement Plans | 108KB | 4 | ✅ Active |
| `one-on-one-guide` | One-on-One Guide | Frameworks for effective 1:1 meetings | 36KB | 2 | ✅ Active |
| `manager-effectiveness-coach` | Manager Effectiveness Coach | Coaching for manager development | 96KB | 4 | ✅ Active |
| `recognition-rewards-manager` | Recognition & Rewards Manager | Recognition programs and rewards (CONSOLIDATED) | 72KB | 1 | ✅ Active |
| `performance-insights-analyst` | Performance Insights Analyst | Synthesizes performance review data | 36KB | 1 | ✅ Active |
| `skills-gap-analyzer` | Skills Gap Analyzer | Identifies skill gaps and training needs | 60KB | 4 | ✅ Active |
| `career-path-planner` | Career Path Planner | Develops career progression frameworks | 72KB | 4 | ✅ Active |
| `lnd-program-designer` | L&D Program Designer | Designs learning and development programs | 100KB | 4 | ✅ Active |

### Employee Relations Workflow (3 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `employee-relations-case-manager` | Employee Relations Case Manager | Manages ER cases, investigations, documentation | 108KB | 4 | ✅ Active |
| `benefits-leave-coordinator` | Benefits & Leave Coordinator | Life events, leave policies, benefits (CONSOLIDATED) | 90KB | 2 | ✅ Active |
| `policy-lifecycle-manager` | Policy Lifecycle Manager | Creates and maintains HR policies | 96KB | 4 | ✅ Active |

### Offboarding Workflow (3 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `offboarding-exit-builder` | Offboarding & Exit Builder | Exit processes, knowledge transfer, offboarding | 64KB | 4 | ✅ Active |
| `workforce-reduction-planner` | Workforce Reduction Planner | Plans and executes RIFs with compliance | 104KB | 4 | ✅ Active |
| `corporate-communications-strategist` | Corporate Communications Strategist | Manages sensitive communications (RIFs, changes) | 80KB | 4 | ✅ Active |

### Compensation Workflow (2 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `comp-band-designer` | Comp Band Designer | Creates salary bands and comp frameworks | 68KB | 4 | ✅ Active |
| `compensation-review-cycle-manager` | Compensation Review Cycle Manager | Manages annual merit/promotion cycles | 88KB | 4 | ✅ Active |

### Analytics Workflow (2 skills)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `hr-metrics-analyst` | HR Metrics Analyst | Analyzes HR metrics, dashboards, insights | 28KB | 2 | ✅ Active |
| `survey-analyzer-action-planner` | Survey Analyzer & Action Planner | Surveys, analysis, action planning (CONSOLIDATED) | 58KB | 2 | ✅ Active |

### Compliance Workflow (1 skill)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `dei-program-designer` | DEI Program Designer | DEI programs, EEO compliance, reporting | 100KB | 5 | ✅ Active |

### Onboarding Workflow (1 skill)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `onboarding-program-builder` | Onboarding Program Builder | Designs comprehensive onboarding programs | 60KB | 3 | ✅ Active |

### General/Multi-Workflow (1 skill)

| Skill ID | Name | Description | Size | Ref Files | Status |
|----------|------|-------------|------|-----------|--------|
| `org-design-consultant` | Org Design Consultant | Org structure, reporting lines, team design | 92KB | 4 | ✅ Active |

**Total Skills:** 25 skills, ~1.76MB, 76 reference files

---

## 2. UI Features Inventory

### Core Chat Interface

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| Chat Interface | `ChatInterface.tsx` | Main chat UI with message history | ✅ Active |
| Message List | `MessageList.tsx` | Displays chat messages with markdown | ✅ Active |
| Chat Input | `ChatInput.tsx` | Message input with send button | ✅ Active |
| Chat Header | `ChatHeader.tsx` | Chat header with reset/clear options | ✅ Active |
| Message Actions | `MessageActions.tsx` | Copy, edit, delete message actions | ✅ Active |
| Message Markdown | `MessageMarkdown.tsx` | Renders markdown in messages | ✅ Active |
| Suggestion Cards | `SuggestionCards.tsx` | Quick action suggestion cards | ✅ Active |
| Workflow Badge | `WorkflowBadge.tsx` | Shows detected workflow in messages | ✅ Active |
| PII Warning Modal | `PIIWarningModal.tsx` | Warns when PII detected in input | ✅ Active |

### Context Panels

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| Context Panel Container | `ContextPanel.tsx` | Dynamic panel container | ✅ Active |
| Document Editor Panel | `DocumentEditorPanel.tsx` | Rich text editor for HR documents | ✅ Active |
| Analytics Chart Panel | `AnalyticsChartPanel.tsx` | Chart.js visualizations | ✅ Active |
| Performance Grid Panel | `PerformanceGridPanel.tsx` | 9-box talent matrix | ✅ Active |
| ENPS Panel | `ENPSPanel.tsx` | Employee Net Promoter Score panel | ✅ Active |

### Dashboard Components

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| Metric Cards | `MetricCard.tsx` | Dashboard metric cards (headcount, ENPS, etc.) | ✅ Active |
| Metric Details Dialog | `MetricDetailsDialog.tsx` | Detailed metric view dialog | ✅ Active |
| Floating Orbs | `FloatingOrbs.tsx` | Animated background orbs | ✅ Active |
| Quick Action Card | `QuickActionCard.tsx` | Quick action buttons | ✅ Active |
| Upcoming Events | `UpcomingEvents.tsx` | Calendar/events widget | ✅ Active |

### Data Management

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| Employee Table Editor | `EmployeeTableEditor.tsx` | Editable employee data table | ✅ Active |
| File Upload | `FileUpload.tsx` | Basic file upload component | ✅ Active |
| Smart File Upload | `SmartFileUpload.tsx` | Intelligent CSV upload with mapping | ✅ Active |
| Data Source Manager | `DataSourceManager.tsx` | Manage data sources | ✅ Active |
| Mapping Preview Modal | `MappingPreviewModal.tsx` | Preview CSV column mappings | ✅ Active |

### Navigation & UI

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| Command Palette | `CommandPalette.tsx` | Cmd+K command palette | ✅ Active |
| Welcome Dialog | `WelcomeDialog.tsx` | First-run welcome screen | ✅ Active |
| Language Selector | `LanguageSelector.tsx` | Language selection dropdown | ✅ Active |
| Notifications Panel | `NotificationsPanel.tsx` | Notification center | ✅ Active |
| Workflow Progress | `WorkflowProgress.tsx` | Shows workflow completion status | ✅ Active |
| Quota Banner | `QuotaBanner.tsx` | Shows AI quota usage | ✅ Active |

### Monitoring & Analytics

| Feature | Component | Description | Status |
|---------|-----------|-------------|--------|
| AI Metrics Dashboard | `AIMetricsDashboard.tsx` | AI usage metrics dashboard | ✅ Active |
| Monitoring Provider | `MonitoringProvider.tsx` | React context for monitoring | ✅ Active |
| Web Vitals Provider | `WebVitalsProvider.tsx` | Web vitals tracking | ✅ Active |
| Action Buttons | `ActionButtons.tsx` | Reusable action button group | ✅ Active |

### UI Foundation Components (shadcn/ui)

| Component | Location | Description | Status |
|-----------|----------|-------------|--------|
| Button | `ui/button.tsx` | Primary button component | ✅ Active |
| Card | `ui/card.tsx` | Card container | ✅ Active |
| Dialog | `ui/dialog.tsx` | Modal dialog | ✅ Active |
| Input | `ui/input.tsx` | Text input | ✅ Active |
| Textarea | `ui/textarea.tsx` | Multi-line input | ✅ Active |
| Select | `ui/select.tsx` | Dropdown select | ✅ Active |
| Tabs | `ui/tabs.tsx` | Tab navigation | ✅ Active |
| Table | `ui/table.tsx` | Data table | ✅ Active |
| Badge | `ui/badge.tsx` | Status badge | ✅ Active |
| Avatar | `ui/avatar.tsx` | User avatar | ✅ Active |
| Popover | `ui/popover.tsx` | Popover tooltip | ✅ Active |
| Dropdown Menu | `ui/dropdown-menu.tsx` | Dropdown menu | ✅ Active |
| Form | `ui/form.tsx` | Form wrapper with validation | ✅ Active |
| Label | `ui/label.tsx` | Form label | ✅ Active |
| Error Boundary | `ui/ErrorBoundary.tsx` | Error boundary wrapper | ✅ Active |
| Error Fallbacks | `ui/ErrorFallbacks.tsx` | Error fallback components | ✅ Active |
| Skeletons | `ui/skeletons/*` | Loading skeleton components | ✅ Active |
| Sonner Toast | `ui/sonner.tsx` | Toast notifications | ✅ Active |

**Total UI Components:** 50+ components

---

## 3. API Endpoints Inventory

### Chat & AI Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/chat` | POST | Main chat endpoint with AI routing | ✅ Active |
| `/api/ai/config` | GET | AI provider configuration | ✅ Active |
| `/api/ai/quota` | GET | AI quota usage and limits | ✅ Active |
| `/api/ai/analyze` | POST | AI text analysis | ✅ Active |
| `/api/ai/extract-form` | POST | Extract form data from documents | ✅ Active |
| `/api/ai/ocr-image` | POST | OCR image to text | ✅ Active |
| `/api/ai/parse-resume` | POST | Parse resume data | ✅ Active |
| `/api/ai/transcribe` | POST | Audio transcription | ✅ Active |
| `/api/ai/transform` | POST | Data transformation | ✅ Active |
| `/api/actions` | POST | Workflow action suggestions | ✅ Active |

### Analytics Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/analytics` | GET | Unified analytics endpoint | ✅ Active |
| `/api/analytics/headcount` | GET | Headcount analytics | ✅ Active |
| `/api/analytics/attrition` | GET | Attrition/turnover analytics | ✅ Active |
| `/api/analytics/nine-box` | GET | 9-box performance grid | ✅ Active |
| `/api/analytics/enps-sentiment` | GET | ENPS and sentiment analysis | ✅ Active |
| `/api/analytics/chat` | POST | Analytics chat queries | ✅ Active |
| `/api/analytics/errors` | GET | Error analytics | ✅ Active |
| `/api/metrics` | GET | Unified metrics endpoint | ✅ Active |

### Employee Management

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/employees` | GET, POST | List/create employees | ✅ Active |
| `/api/employees/[id]` | GET, PUT, DELETE | Get/update/delete employee | ✅ Active |

### Data Import/Export

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/data/upload` | POST | Upload CSV/data files | ✅ Active |
| `/api/data/preview-upload` | POST | Preview upload before import | ✅ Active |
| `/api/data/preview/[id]` | GET | Preview uploaded data | ✅ Active |
| `/api/data/list` | GET | List uploaded files | ✅ Active |
| `/api/data/import` | POST | Import previewed data | ✅ Active |
| `/api/data/delete/[fileId]` | DELETE | Delete uploaded file | ✅ Active |

### Document Management

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/documents` | GET, POST | List/create documents | ✅ Active |
| `/api/documents/[id]` | GET, PUT, DELETE | Get/update/delete document | ✅ Active |
| `/api/documents/export-to-google-docs` | POST | Export to Google Docs | ⚠️ Disabled* |

*Disabled due to Next.js 16 compatibility issues with googleapis

### Authentication

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/auth/login` | POST | User login | ✅ Active |
| `/api/auth/demo-token` | POST | Generate demo token | ✅ Active |
| `/api/auth/google` | GET | Google OAuth initiation | ⚠️ Disabled* |
| `/api/auth/google/callback` | GET | Google OAuth callback | ⚠️ Disabled* |
| `/api/auth/google/status` | GET | Google OAuth status | ⚠️ Disabled* |

*Disabled due to Next.js 16 compatibility issues with googleapis

### Templates

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/templates` | GET | List available templates | ⚠️ Disabled* |
| `/api/templates/content` | GET | Get template content | ⚠️ Disabled* |

*Disabled due to Next.js 16 compatibility issues with googleapis

### Surveys

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/surveys/analyze` | POST | Analyze survey responses | ✅ Active |

### Monitoring & Health

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/health` | GET | Health check endpoint | ✅ Active |
| `/api/monitoring` | GET | Monitoring metrics | ✅ Active |

### Setup & Initialization

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/setup/init` | POST | Initialize application setup | ✅ Active |

### Cron Jobs

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/cron/metrics-sync` | POST | Sync metrics (cron) | ✅ Active |
| `/api/cron/onboarding` | POST | Onboarding automation (cron) | ✅ Active |

**Total API Endpoints:** 40+ endpoints

---

## 4. Feature Parity Status Summary

### Skills
- **Total:** 25 skills
- **Status:** ✅ All active and functional
- **Desktop Migration:** Must replicate all 25 skills with reference files

### UI Features
- **Total:** 50+ components
- **Core Features:** ✅ Chat, Context Panels, Dashboard, Data Management
- **Desktop Migration:** Must replicate all UI components with Electron-compatible alternatives

### API Endpoints
- **Total:** 40+ endpoints
- **Active:** 35+ endpoints
- **Disabled:** 5 endpoints (Google Workspace integration)
- **Desktop Migration:** Must replicate API routes in local Next.js server

---

## 5. Desktop Migration Considerations

### Skills Migration
- ✅ **Easy:** Skills are markdown files - can be bundled with desktop app
- ✅ **Easy:** Reference files (~1.76MB) can be included in app bundle
- ⚠️ **Consider:** Skills loading performance (may need caching)

### UI Migration
- ✅ **Easy:** React components can be reused as-is
- ⚠️ **Consider:** Electron-specific UI adjustments (window controls, menus)
- ⚠️ **Consider:** File system access for uploads/exports
- ⚠️ **Consider:** Offline functionality for context panels

### API Migration
- ✅ **Easy:** Next.js API routes can run locally in Electron
- ⚠️ **Consider:** Port management (avoid conflicts)
- ⚠️ **Consider:** Database file location (user data directory)
- ⚠️ **Consider:** Google Workspace integration (may need re-enable or alternative)

### Critical Features for Desktop
1. **Chat Interface** - Core feature, must work offline-capable
2. **Context Panels** - Document editor, charts, performance grid
3. **Employee Data** - CRUD operations, CSV import/export
4. **Analytics** - Metrics dashboard, charts
5. **AI Integration** - Multi-provider failover must work

### Optional Features (Can Defer)
1. **Google Workspace Integration** - Currently disabled anyway
2. **Voice Input** - Nice to have, not critical
3. **Real-time Collaboration** - Not implemented in webapp

---

## 6. Testing Checklist for Desktop Migration

### Skills Testing
- [ ] All 25 skills load correctly
- [ ] Skill detection works in chat
- [ ] Reference files accessible
- [ ] Skill prompts generate correctly

### UI Testing
- [ ] Chat interface functional
- [ ] All context panels render correctly
- [ ] Dashboard metrics display
- [ ] File upload/download works
- [ ] Command palette functional
- [ ] Error boundaries catch errors

### API Testing
- [ ] All active endpoints respond correctly
- [ ] Database queries work
- [ ] File uploads save to correct location
- [ ] Authentication works (if implemented)
- [ ] AI failover chain works

### Integration Testing
- [ ] Chat → Context Panel flow works
- [ ] Data import → Analytics flow works
- [ ] Document generation → Export works
- [ ] Multi-provider AI failover works

---

## 7. Migration Priority

### Phase 1 (Critical - MVP)
1. Chat interface
2. Core context panels (document editor, analytics chart)
3. Employee data management
4. Basic analytics/metrics
5. AI chat with failover

### Phase 2 (Important)
1. All 25 skills
2. Performance grid panel
3. ENPS panel
4. File upload/import
5. Command palette

### Phase 3 (Nice to Have)
1. Google Workspace integration (if re-enabled)
2. Voice input
3. Advanced monitoring
4. Workflow progress tracking

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-27  
**Next Review:** Before Phase 1 Desktop Implementation







