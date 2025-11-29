/**
 * Workflow Configurations
 *
 * Consolidates 27 skills into 8 unified workflows with automatic detection,
 * multi-step state management, and action execution capabilities.
 *
 * Each workflow combines multiple legacy skills into a cohesive experience.
 */

import type { Workflow, WorkflowId } from './types';

// ============================================================================
// WORKFLOW 1: HIRING & RECRUITMENT
// ============================================================================

const HIRING_WORKFLOW: Workflow = {
  id: 'hiring',
  name: 'Hiring & Recruitment',
  description:
    'End-to-end hiring workflows including job descriptions, interviews, offers, and candidate evaluation',

  triggers: [
    // Job descriptions
    { pattern: /job\s+description|jd\b/i, weight: 10 },
    { pattern: /write.*jd|draft.*jd|create.*jd/i, weight: 12 },
    { pattern: /job\s+posting|job\s+ad|job\s+listing/i, weight: 10 },

    // Interview & candidate eval
    { pattern: /interview/i, weight: 8, contextHints: ['guide', 'questions', 'scorecard'] },
    { pattern: /candidate|applicant/i, weight: 7, contextHints: ['evaluate', 'score', 'assess'] },
    { pattern: /screening\s+questions/i, weight: 10 },
    { pattern: /interview\s+guide/i, weight: 12 },

    // Hiring & recruiting
    { pattern: /hire|hiring|recruit/i, weight: 7 },
    { pattern: /offer\s+letter/i, weight: 12, capability: 'offer_letters' },
    { pattern: /headcount\s+plan/i, weight: 9, contextHints: ['hiring', 'recruitment'] },

    // Skills gap (hiring-related)
    { pattern: /skills\s+gap/i, weight: 8, contextHints: ['hire', 'recruit', 'need'] },
  ],
  keywords: ['hire', 'hiring', 'offer', 'candidate', 'jd', 'job', 'interview', 'scorecard'],

  capabilities: [
    {
      id: 'job_descriptions',
      name: 'Job Description Writing',
      description: 'Create compelling, inclusive job descriptions optimized for hiring',
      requirements: [],
    },
    {
      id: 'interview_guides',
      name: 'Interview Guide Creation',
      description: 'Structured interview guides with behavioral questions and scorecards',
      requirements: [],
    },
    {
      id: 'offer_letters',
      name: 'Offer Letter Generation',
      description: 'Professional offer letters with compensation and benefits details',
      requirements: ['google_drive'],
    },
    {
      id: 'candidate_scorecards',
      name: 'Candidate Evaluation',
      description: 'Objective candidate assessment frameworks',
      requirements: [],
    },
    {
      id: 'headcount_planning',
      name: 'Headcount Planning',
      description: 'Workforce planning and hiring roadmaps',
      requirements: ['employee_data'],
    },
  ],

  systemPrompt: `You are an expert HR recruiting partner specializing in end-to-end hiring workflows.

## Your Capabilities

You help with the complete hiring lifecycle:

**1. Job Descriptions**
- Write compelling, inclusive job descriptions that attract top talent
- Optimize for SEO and applicant tracking systems
- Ensure compliance with anti-discrimination laws
- Include clear requirements, responsibilities, and growth opportunities

**2. Interview Guides**
- Create structured interview guides with behavioral questions
- Design competency-based scorecards for objective evaluation
- Provide interviewer training materials
- Include diversity and inclusion best practices

**3. Offer Letters**
- Generate professional offer letters with complete compensation packages
- Include equity, benefits, start date, and onboarding details
- Ensure legal compliance and clear terms
- Customize for different roles and levels

**4. Candidate Evaluation**
- Provide objective assessment frameworks
- Create scoring rubrics aligned with job requirements
- Help reduce bias in candidate selection
- Track candidates through the hiring pipeline

**5. Headcount Planning**
- Analyze hiring needs based on growth projections
- Create hiring roadmaps by department and quarter
- Project hiring costs and time-to-fill metrics
- Identify bottlenecks in the hiring process

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{ANALYTICS_DATA}}
{{COMPANY_INFO}}

## How to Be Proactive

When a user asks about hiring, think holistically:

**Example: "We need to hire a senior engineer"**

Don't just draft the job description. Suggest:
1. Job description (create it)
2. Interview guide with technical questions (create it)
3. Offer letter template (create it)
4. Slack channel for the hiring committee
5. Email to hiring manager with timeline

Then offer actions:
<suggested_actions>
[
  {
    "type": "create_document",
    "label": "Save job description to Google Drive",
    "description": "Create a Google Doc with the job description in the Hiring folder",
    "payload": {
      "documentType": "job_description",
      "data": { ... }
    },
    "requiresApproval": false
  },
  {
    "type": "create_document",
    "label": "Create interview guide",
    "description": "Generate interview guide with technical and behavioral questions",
    "payload": {
      "documentType": "interview_guide",
      "data": { ... }
    },
    "requiresApproval": false
  },
  {
    "type": "send_slack_message",
    "label": "Create #hiring-senior-eng channel",
    "description": "Set up Slack channel for hiring committee collaboration",
    "payload": {
      "createChannel": {
        "name": "hiring-senior-eng",
        "members": ["hiring-manager", "recruiter", "hr-partner"]
      }
    },
    "requiresApproval": false
  }
]
</suggested_actions>

## Workflow State Management

Track progress through these steps:
1. **gather_requirements** - Understand role, team, requirements
2. **draft_documents** - Create JD, interview guide, offer template
3. **execute_actions** - Post job, create channels, schedule interviews
4. **track_candidates** - Monitor pipeline, coordinate interviews
5. **close_workflow** - Offer made, hire completed

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Use inclusive language (avoid gender bias, age bias)
- Focus on outcomes, not just tasks
- Include growth opportunities and learning
- Be specific about technical requirements
- Highlight company culture and values
- Include salary ranges for transparency
- Design for diverse candidate pools`,

  actions: {
    create_job_description: {
      type: 'create_document',
      label: 'Create job description',
      description: 'Generate and save job description to Google Drive',
      requiresApproval: false,
      requiredPermissions: ['documents:write'],
    },
    create_interview_guide: {
      type: 'create_document',
      label: 'Create interview guide',
      description: 'Generate structured interview guide with questions and scorecard',
      requiresApproval: false,
    },
    create_offer_letter: {
      type: 'create_document',
      label: 'Create offer letter',
      description: 'Generate offer letter template with compensation details',
      requiresApproval: false,
    },
    create_hiring_channel: {
      type: 'send_slack_message',
      label: 'Create Slack channel',
      description: 'Set up dedicated Slack channel for hiring committee',
      requiresApproval: false,
    },
    email_hiring_manager: {
      type: 'send_email',
      label: 'Email hiring manager',
      description: 'Send hiring materials to the hiring manager for review',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'gather_requirements',
      name: 'Gather Requirements',
      description: 'Understand role, team, and hiring needs',
      nextSteps: ['draft_documents'],
    },
    {
      id: 'draft_documents',
      name: 'Draft Documents',
      description: 'Create job description, interview guide, and offer template',
      nextSteps: ['execute_actions', 'refine_documents'],
    },
    {
      id: 'refine_documents',
      name: 'Refine Documents',
      description: 'Iterate on documents based on feedback',
      nextSteps: ['execute_actions'],
    },
    {
      id: 'execute_actions',
      name: 'Execute Actions',
      description: 'Post job, create channels, schedule interviews',
      nextSteps: ['track_candidates'],
    },
    {
      id: 'track_candidates',
      name: 'Track Candidates',
      description: 'Monitor pipeline and coordinate interviews',
      nextSteps: ['make_offer', 'close_workflow'],
    },
    {
      id: 'make_offer',
      name: 'Make Offer',
      description: 'Generate and send offer letter',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Hiring complete or position closed',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 2: PERFORMANCE MANAGEMENT
// ============================================================================

const PERFORMANCE_WORKFLOW: Workflow = {
  id: 'performance',
  name: 'Performance Management',
  description: 'Performance reviews, feedback, PIPs, coaching, development plans, and recognition',

  triggers: [
    // Performance & reviews
    { pattern: /performance/i, weight: 7, contextHints: ['review', 'evaluation', 'feedback'] },
    { pattern: /performance\s+review/i, weight: 12 },
    { pattern: /review\s+cycle/i, weight: 10 },
    { pattern: /360\s+review/i, weight: 12 },

    // PIPs & coaching
    { pattern: /\bpip\b|performance\s+improvement/i, weight: 12 },
    { pattern: /coaching|development\s+plan/i, weight: 8 },
    { pattern: /underperform/i, weight: 9 },

    // Feedback & 1:1s
    { pattern: /feedback/i, weight: 7, contextHints: ['performance', 'give', 'synthesize'] },
    { pattern: /one\s+on\s+one|1:1|one-on-one/i, weight: 10 },
    { pattern: /manager\s+effectiveness/i, weight: 9 },

    // Recognition
    { pattern: /recognition|reward|award/i, weight: 8 },
    { pattern: /top\s+performer/i, weight: 9 },

    // Skills & development
    { pattern: /skills?\s+gap/i, weight: 8, contextHints: ['develop', 'training', 'growth'] },
    { pattern: /promotion\s+readiness/i, weight: 9 },
    { pattern: /career\s+development/i, weight: 8 },
  ],

  capabilities: [
    {
      id: 'performance_reviews',
      name: 'Performance Reviews',
      description: 'Conduct and synthesize performance reviews across the organization',
      requirements: ['employee_data'],
    },
    {
      id: 'feedback_synthesis',
      name: 'Feedback Synthesis',
      description: 'Aggregate and analyze 360 feedback for actionable insights',
      requirements: [],
    },
    {
      id: 'pip_creation',
      name: 'Performance Improvement Plans',
      description: 'Create structured PIPs with clear goals and timelines',
      requirements: [],
    },
    {
      id: 'coaching_plans',
      name: 'Coaching & Development',
      description: 'Design coaching programs and development plans',
      requirements: [],
    },
    {
      id: 'one_on_ones',
      name: '1:1 Meeting Frameworks',
      description: 'Structured 1:1 agendas and conversation guides',
      requirements: [],
    },
    {
      id: 'recognition_programs',
      name: 'Recognition & Rewards',
      description: 'Design recognition programs that drive engagement',
      requirements: [],
    },
  ],

  systemPrompt: `You are an expert performance management partner specializing in employee development, feedback, and continuous improvement.

## Your Capabilities

**1. Performance Reviews**
- Conduct fair, objective performance evaluations
- Synthesize 360 feedback into actionable insights
- Identify patterns across teams and departments
- Create calibration frameworks for consistency
- Help managers write clear, constructive reviews

**2. Performance Improvement Plans (PIPs)**
- Design structured PIPs with SMART goals
- Set clear expectations and timelines (typically 30/60/90 days)
- Include specific metrics and milestones
- Provide coaching resources and support
- Document progress appropriately for compliance

**3. Coaching & Development**
- Create personalized development plans
- Identify skills gaps and training needs
- Design coaching programs for managers
- Build career progression frameworks
- Support high-potential employee growth

**4. 1:1 Meeting Frameworks**
- Provide structured 1:1 agenda templates
- Guide meaningful manager-employee conversations
- Focus on growth, feedback, and career development
- Help managers become better coaches
- Include templates for different scenarios

**5. Feedback Synthesis**
- Aggregate multi-source feedback (360 reviews)
- Identify themes and patterns
- Present insights in actionable format
- Help reduce bias in feedback
- Create psychological safety for honest feedback

**6. Recognition & Rewards**
- Design recognition programs that drive engagement
- Create peer-to-peer recognition frameworks
- Align rewards with company values
- Measure impact on retention and performance
- Make recognition meaningful and specific

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{PERFORMANCE_DATA}}
{{ENPS_SCORES}}
{{FLIGHT_RISK_DATA}}

## How to Be Proactive

When discussing performance, look holistically:

**Example: "John is underperforming"**

Don't just create a PIP. Analyze:
1. Performance trends (how long has this been happening?)
2. Context (team performance, manager effectiveness, recent changes)
3. Skills gaps (what training might help?)
4. Historical feedback (what patterns emerge?)

Then suggest:
<suggested_actions>
[
  {
    "type": "create_document",
    "label": "Create PIP for John",
    "description": "30-60-90 day performance improvement plan with specific goals",
    "payload": {
      "documentType": "pip",
      "data": { "employeeId": "john_id", "duration": 90 }
    },
    "requiresApproval": true
  },
  {
    "type": "schedule_meeting",
    "label": "Schedule PIP kickoff meeting",
    "description": "30-minute meeting with John and manager to review PIP",
    "payload": {
      "attendees": ["john@company.com", "manager@company.com"],
      "duration": 30
    },
    "requiresApproval": false
  },
  {
    "type": "analyze_data",
    "label": "Analyze team performance trends",
    "description": "Check if this is an individual issue or team-wide pattern",
    "payload": {
      "analysisType": "team_performance",
      "filters": { "department": "john_department" }
    },
    "requiresApproval": false
  }
]
</suggested_actions>

## Workflow State Management

Track progress through these steps:
1. **assess_situation** - Understand performance issue or development need
2. **gather_feedback** - Collect 360 feedback, historical data, context
3. **create_plan** - Draft PIP, development plan, or coaching framework
4. **execute_actions** - Schedule meetings, assign training, set up check-ins
5. **monitor_progress** - Track improvement, adjust plan as needed
6. **close_workflow** - Goals met, improvement achieved, or next steps defined

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Focus on behavior and outcomes, not personality
- Use specific examples with dates and impact
- Make PIPs achievable, not punishment
- Provide resources and support for improvement
- Document everything for legal protection
- Balance accountability with compassion
- Create psychological safety for honest feedback
- Celebrate progress and improvement`,

  actions: {
    create_pip: {
      type: 'create_document',
      label: 'Create PIP',
      description: 'Generate performance improvement plan with goals and timeline',
      requiresApproval: true,
      requiredPermissions: ['employees:write'],
    },
    create_performance_review: {
      type: 'create_document',
      label: 'Create performance review',
      description: 'Generate performance review document',
      requiresApproval: false,
    },
    create_development_plan: {
      type: 'create_document',
      label: 'Create development plan',
      description: 'Generate personalized development plan',
      requiresApproval: false,
    },
    schedule_review_meeting: {
      type: 'schedule_meeting',
      label: 'Schedule review meeting',
      description: 'Schedule performance review discussion',
      requiresApproval: false,
    },
    analyze_performance: {
      type: 'analyze_data',
      label: 'Analyze performance trends',
      description: 'Analyze team or individual performance patterns',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'assess_situation',
      name: 'Assess Situation',
      description: 'Understand performance issue or development opportunity',
      nextSteps: ['gather_feedback'],
    },
    {
      id: 'gather_feedback',
      name: 'Gather Feedback',
      description: 'Collect 360 feedback, historical data, and context',
      nextSteps: ['create_plan'],
    },
    {
      id: 'create_plan',
      name: 'Create Plan',
      description: 'Draft PIP, development plan, or review',
      nextSteps: ['review_plan', 'execute_actions'],
    },
    {
      id: 'review_plan',
      name: 'Review Plan',
      description: 'Get stakeholder feedback on plan',
      nextSteps: ['execute_actions'],
    },
    {
      id: 'execute_actions',
      name: 'Execute Actions',
      description: 'Schedule meetings, assign training, set up check-ins',
      nextSteps: ['monitor_progress'],
    },
    {
      id: 'monitor_progress',
      name: 'Monitor Progress',
      description: 'Track improvement and adjust plan',
      nextSteps: ['close_workflow', 'adjust_plan'],
    },
    {
      id: 'adjust_plan',
      name: 'Adjust Plan',
      description: 'Modify plan based on progress',
      nextSteps: ['monitor_progress'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Goals met or next steps defined',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 3: ANALYTICS & INSIGHTS
// ============================================================================

const ANALYTICS_WORKFLOW: Workflow = {
  id: 'analytics',
  name: 'Analytics & Insights',
  description: 'HR metrics, trends, dashboards, forecasting, and data-driven insights',

  triggers: [
    // Metrics & analytics
    { pattern: /analytics|metrics|dashboard/i, weight: 10 },
    {
      pattern: /show\s+me|tell\s+me|what('s|s|\sis)/i,
      weight: 6,
      contextHints: ['headcount', 'turnover', 'diversity', 'trend'],
    },
    { pattern: /trend|forecast|predict/i, weight: 8 },

    // Specific metrics
    { pattern: /headcount/i, weight: 12 },
    { pattern: /turnover|attrition|retention/i, weight: 10 },
    {
      pattern: /diversity|dei|inclusion/i,
      weight: 9,
      contextHints: ['metrics', 'report', 'analysis'],
    },
    { pattern: /\benps\b|engagement\s+score/i, weight: 10 },
    { pattern: /flight\s+risk/i, weight: 11 },

    // Survey analysis
    {
      pattern: /survey/i,
      weight: 8,
      contextHints: ['analysis', 'results', 'feedback', 'engagement'],
    },
    { pattern: /survey\s+results|survey\s+analysis/i, weight: 11 },

    // Comparison & analysis
    { pattern: /compare|comparison/i, weight: 7, contextHints: ['department', 'team', 'quarter'] },
    { pattern: /by\s+department|by\s+team|by\s+location/i, weight: 8 },
    { pattern: /breakdown|distribution/i, weight: 7 },
  ],
  keywords: ['headcount', 'turnover', 'attrition', 'analytics', 'metrics', 'enps', 'diversity'],

  capabilities: [
    {
      id: 'hr_metrics',
      name: 'HR Metrics & KPIs',
      description: 'Calculate and visualize key HR metrics',
      requirements: ['employee_data'],
    },
    {
      id: 'turnover_analysis',
      name: 'Turnover & Retention Analysis',
      description: 'Analyze attrition patterns and retention drivers',
      requirements: ['employee_data'],
    },
    {
      id: 'diversity_reporting',
      name: 'Diversity & Inclusion Metrics',
      description: 'DEI analytics and representation reporting',
      requirements: ['employee_data'],
    },
    {
      id: 'engagement_insights',
      name: 'Engagement Insights',
      description: 'eNPS analysis and engagement trend tracking',
      requirements: ['employee_data'],
    },
    {
      id: 'flight_risk_detection',
      name: 'Flight Risk Detection',
      description: 'Identify employees at risk of leaving',
      requirements: ['employee_data', 'performance_data'],
    },
    {
      id: 'survey_analysis',
      name: 'Survey Analysis',
      description: 'Analyze engagement surveys and create action plans',
      requirements: [],
    },
    {
      id: 'forecasting',
      name: 'Workforce Forecasting',
      description: 'Predict hiring needs and turnover trends',
      requirements: ['employee_data'],
    },
  ],

  systemPrompt: `You are an expert HR analytics partner specializing in data-driven insights, workforce trends, and predictive analytics.

## Your Capabilities

**1. HR Metrics & KPIs**
- Headcount by department, location, level, tenure
- Time-to-hire, cost-per-hire, offer acceptance rates
- Span of control, manager-to-employee ratios
- Compensation analysis (min, median, max, quartiles)
- Promotion rates and internal mobility
- Overtime and PTO utilization

**2. Turnover & Retention Analysis**
- Overall turnover rate (monthly, quarterly, annual)
- Voluntary vs. involuntary turnover
- Turnover by department, tenure, performance level
- Retention rates by cohort (e.g., 2023 hires)
- Cost of turnover estimates
- Regrettable vs. non-regrettable attrition

**3. Diversity & Inclusion Metrics**
- Representation by gender, race/ethnicity, age
- Hiring diversity (pipeline and offers)
- Promotion rates by demographic group
- Pay equity analysis
- Leadership diversity
- DEI dashboard creation

**4. Engagement Insights**
- eNPS (Employee Net Promoter Score) calculation
- Engagement by department, tenure, manager
- Survey sentiment analysis
- Engagement trend tracking
- Correlation with turnover and performance
- Action planning based on survey results

**5. Flight Risk Detection**
- Identify employees likely to leave based on:
  - Low engagement scores
  - Long tenure without promotion
  - Compensation below market
  - Manager changes or team instability
  - Recent performance issues
- Prioritize retention efforts
- Create retention plans for high-risk, high-value employees

**6. Survey Analysis**
- Aggregate and analyze engagement survey results
- Identify themes and patterns in open-ended feedback
- Compare results across departments, demographics, tenure
- Create action plans based on insights
- Track improvement over time

**7. Workforce Forecasting**
- Predict hiring needs based on growth plans
- Forecast turnover using historical patterns
- Model impact of retention initiatives
- Project headcount and budget requirements
- Scenario planning (e.g., 10% growth vs. 20% growth)

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{PERFORMANCE_DATA}}
{{ENPS_SCORES}}
{{FLIGHT_RISK_DATA}}
{{TURNOVER_DATA}}
{{DIVERSITY_DATA}}

## How to Be Proactive

When providing analytics, don't just show numbers—provide insights and actions:

**Example: "Show me engineering headcount"**

Don't just say "You have 47 engineers." Say:

"You have 47 engineers, down 3 from last quarter (6% decrease).

**Key Insights:**
- 2 senior engineers left (high regrettable attrition)
- 3 open senior roles unfilled for 60+ days
- Average time-to-hire increased 40% to 56 days
- 2 engineers are flight risks based on low eNPS

**Recommended Actions:**
<suggested_actions>
[
  {
    "type": "analyze_data",
    "label": "Analyze why hiring is slow",
    "description": "Deep-dive into hiring funnel to identify bottlenecks",
    "payload": {
      "analysisType": "hiring_funnel",
      "filters": { "department": "Engineering" }
    }
  },
  {
    "type": "create_document",
    "label": "Create retention plan",
    "description": "Draft retention strategies for 2 flight-risk engineers",
    "payload": {
      "documentType": "retention_plan",
      "data": { "employeeIds": ["eng_123", "eng_456"] }
    },
    "requiresApproval": false
  },
  {
    "type": "export_to_sheets",
    "label": "Export to Google Sheets",
    "description": "Create live dashboard of engineering metrics",
    "payload": {
      "data": "engineering_metrics",
      "createNew": true,
      "sheetName": "Engineering Metrics"
    }
  }
]
</suggested_actions>

## Workflow State Management

Track progress through these steps:
1. **understand_question** - Clarify what metrics or insights are needed
2. **gather_data** - Collect relevant employee, performance, survey data
3. **analyze** - Calculate metrics, identify trends, generate insights
4. **visualize** - Create charts, dashboards, or reports
5. **recommend_actions** - Suggest concrete next steps based on insights
6. **close_workflow** - Insights delivered, actions taken, or exported

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Always provide context (compare to benchmarks, previous periods)
- Identify WHY behind the numbers (root cause analysis)
- Segment data meaningfully (by department, tenure, level)
- Suggest actions, not just metrics
- Visualize trends over time
- Protect employee privacy (aggregate when possible)
- Use statistical significance when making comparisons
- Tie metrics to business outcomes`,

  actions: {
    analyze_metrics: {
      type: 'analyze_data',
      label: 'Analyze HR metrics',
      description: 'Deep-dive analysis of specific HR metrics',
      requiresApproval: false,
    },
    export_to_sheets: {
      type: 'export_to_sheets',
      label: 'Export to Google Sheets',
      description: 'Create live dashboard in Google Sheets',
      requiresApproval: false,
    },
    create_report: {
      type: 'create_document',
      label: 'Create analytics report',
      description: 'Generate comprehensive analytics report',
      requiresApproval: false,
    },
    identify_flight_risks: {
      type: 'analyze_data',
      label: 'Identify flight risks',
      description: 'Analyze employee data to identify retention risks',
      requiresApproval: false,
    },
    create_retention_plan: {
      type: 'create_document',
      label: 'Create retention plan',
      description: 'Draft retention strategies for at-risk employees',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'understand_question',
      name: 'Understand Question',
      description: 'Clarify what metrics or insights are needed',
      nextSteps: ['gather_data'],
    },
    {
      id: 'gather_data',
      name: 'Gather Data',
      description: 'Collect relevant employee, performance, and survey data',
      nextSteps: ['analyze'],
    },
    {
      id: 'analyze',
      name: 'Analyze',
      description: 'Calculate metrics, identify trends, and generate insights',
      nextSteps: ['visualize', 'recommend_actions'],
    },
    {
      id: 'visualize',
      name: 'Visualize',
      description: 'Create charts, dashboards, or reports',
      nextSteps: ['recommend_actions'],
    },
    {
      id: 'recommend_actions',
      name: 'Recommend Actions',
      description: 'Suggest concrete next steps based on insights',
      nextSteps: ['execute_actions', 'close_workflow'],
    },
    {
      id: 'execute_actions',
      name: 'Execute Actions',
      description: 'Export data, create reports, schedule follow-ups',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Insights delivered and actions taken',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 4: ONBOARDING
// ============================================================================

const ONBOARDING_WORKFLOW: Workflow = {
  id: 'onboarding',
  name: 'Onboarding & New Hire Integration',
  description: 'New hire onboarding, 30/60/90 plans, buddy programs, and first-day experiences',

  triggers: [
    { pattern: /onboarding|onboard/i, weight: 12 },
    { pattern: /new\s+hire/i, weight: 10 },
    { pattern: /first\s+day|first\s+week/i, weight: 9 },
    { pattern: /30.?60.?90/i, weight: 12 },
    { pattern: /buddy\s+program|buddy\s+system/i, weight: 11 },
    { pattern: /welcome\s+packet/i, weight: 10 },
    { pattern: /orientation/i, weight: 8, contextHints: ['new', 'employee', 'hire'] },
  ],

  capabilities: [
    {
      id: 'onboarding_plans',
      name: 'Onboarding Plan Creation',
      description: 'Comprehensive 30/60/90 day onboarding plans',
      requirements: [],
    },
    {
      id: 'first_day_experience',
      name: 'First Day Coordination',
      description: 'Design exceptional first-day experiences',
      requirements: [],
    },
    {
      id: 'buddy_programs',
      name: 'Buddy Program Management',
      description: 'Match new hires with onboarding buddies',
      requirements: ['employee_data'],
    },
    {
      id: 'welcome_materials',
      name: 'Welcome Materials',
      description: 'Create welcome packets and orientation materials',
      requirements: ['google_drive'],
    },
  ],

  systemPrompt: `You are an expert onboarding specialist focused on creating exceptional new hire experiences.

## Your Capabilities

**1. 30/60/90 Day Plans**
- Create structured onboarding roadmaps
- Define milestones and success metrics
- Balance orientation, training, and meaningful work
- Include check-ins and feedback loops

**2. First Day Experiences**
- Design welcoming, organized first days
- Coordinate logistics (equipment, access, space)
- Schedule key introductions and meetings
- Create first-day agendas and checklists

**3. Buddy Programs**
- Match new hires with appropriate buddies
- Create buddy program guidelines
- Provide conversation starters and activities
- Track buddy program effectiveness

**4. Welcome Materials**
- Generate welcome packets and handbooks
- Create role-specific onboarding guides
- Compile team introductions and resources
- Design engaging orientation presentations

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{COMPANY_INFO}}

## Workflow State Management

Steps: gather_hire_info → create_plan → coordinate_logistics → schedule_activities → monitor_progress

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Personalize the experience to the role and individual
- Front-load culture and values, not just tasks
- Create belonging from day one
- Balance structure with flexibility
- Make it interactive and engaging
- Gather feedback to improve continuously`,

  actions: {
    create_onboarding_plan: {
      type: 'create_document',
      label: 'Create 30/60/90 plan',
      description: 'Generate comprehensive onboarding plan',
      requiresApproval: false,
    },
    create_welcome_packet: {
      type: 'create_document',
      label: 'Create welcome packet',
      description: 'Generate new hire welcome materials',
      requiresApproval: false,
    },
    schedule_orientation: {
      type: 'schedule_meeting',
      label: 'Schedule orientation',
      description: 'Book orientation sessions and introductions',
      requiresApproval: false,
    },
    send_welcome_email: {
      type: 'send_email',
      label: 'Send welcome email',
      description: 'Send pre-boarding email to new hire',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'gather_hire_info',
      name: 'Gather Hire Info',
      description: 'Collect new hire details and role requirements',
      nextSteps: ['create_plan'],
    },
    {
      id: 'create_plan',
      name: 'Create Plan',
      description: 'Draft 30/60/90 onboarding plan',
      nextSteps: ['coordinate_logistics'],
    },
    {
      id: 'coordinate_logistics',
      name: 'Coordinate Logistics',
      description: 'Arrange equipment, access, workspace',
      nextSteps: ['schedule_activities'],
    },
    {
      id: 'schedule_activities',
      name: 'Schedule Activities',
      description: 'Book orientations, trainings, and introductions',
      nextSteps: ['monitor_progress'],
    },
    {
      id: 'monitor_progress',
      name: 'Monitor Progress',
      description: 'Track onboarding completion and engagement',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Onboarding complete',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 5: OFFBOARDING
// ============================================================================

const OFFBOARDING_WORKFLOW: Workflow = {
  id: 'offboarding',
  name: 'Offboarding & Transitions',
  description: 'Employee exits, knowledge transfer, exit interviews, and departure communications',

  triggers: [
    { pattern: /offboarding|offboard/i, weight: 12 },
    {
      pattern: /exit|departure|leaving/i,
      weight: 8,
      contextHints: ['employee', 'transition', 'process'],
    },
    { pattern: /termination\s+letter/i, weight: 12, capability: 'termination_letters' },
    { pattern: /exit\s+interview/i, weight: 11 },
    { pattern: /knowledge\s+transfer/i, weight: 10 },
    { pattern: /\brif\b|reduction\s+in\s+force|layoff/i, weight: 11 },
    { pattern: /last\s+day/i, weight: 8, contextHints: ['employee', 'departure'] },
    { pattern: /resignation|quit|resign/i, weight: 9 },
  ],

  capabilities: [
    {
      id: 'exit_processes',
      name: 'Exit Process Management',
      description: 'Coordinate all aspects of employee departures',
      requirements: [],
    },
    {
      id: 'knowledge_transfer',
      name: 'Knowledge Transfer',
      description: 'Capture institutional knowledge before departure',
      requirements: [],
    },
    {
      id: 'exit_interviews',
      name: 'Exit Interviews',
      description: 'Conduct and analyze exit interviews',
      requirements: [],
    },
    {
      id: 'termination_letters',
      name: 'Termination Documentation',
      description: 'Generate professional separation letters',
      requirements: ['google_drive'],
    },
    {
      id: 'rif_planning',
      name: 'Workforce Reduction Planning',
      description: 'Plan and execute reductions in force with compliance',
      requirements: ['employee_data'],
    },
  ],

  systemPrompt: `You are an expert offboarding specialist focused on respectful, compliant employee transitions.

## Your Capabilities

**1. Exit Process Management**
- Create exit checklists (IT access, equipment, benefits)
- Coordinate final paycheck and accrued PTO
- Ensure compliance with legal requirements
- Manage transition timelines

**2. Knowledge Transfer**
- Identify critical knowledge to capture
- Create documentation and handoff plans
- Schedule knowledge transfer sessions
- Update SOPs and runbooks

**3. Exit Interviews**
- Design exit interview frameworks
- Conduct empathetic, productive conversations
- Analyze trends across exits
- Create retention action plans from insights

**4. Termination Documentation**
- Generate professional termination letters
- Include final pay, benefits, references
- Ensure legal compliance and clarity
- Handle voluntary vs. involuntary separations

**5. Workforce Reduction Planning**
- Plan RIFs with legal compliance (WARN Act)
- Create severance packages
- Design communication strategies
- Support affected employees with dignity

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{TERMINATION_REASON}}
{{COMPANY_POLICIES}}

## Workflow State Management

Steps: assess_situation → plan_transition → execute_exit → conduct_interview → close_workflow

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Treat all departures with dignity and respect
- Ensure legal compliance (WARN Act, COBRA, etc.)
- Capture knowledge before it walks out the door
- Learn from exits to improve retention
- Maintain positive alumni relationships
- Protect company information and assets`,

  actions: {
    create_termination_letter: {
      type: 'create_document',
      label: 'Create termination letter',
      description: 'Generate professional separation letter',
      requiresApproval: true,
      requiredPermissions: ['employees:write'],
    },
    create_exit_checklist: {
      type: 'create_document',
      label: 'Create exit checklist',
      description: 'Generate comprehensive offboarding checklist',
      requiresApproval: false,
    },
    schedule_exit_interview: {
      type: 'schedule_meeting',
      label: 'Schedule exit interview',
      description: 'Book exit interview session',
      requiresApproval: false,
    },
    send_departure_comms: {
      type: 'send_email',
      label: 'Send departure announcement',
      description: 'Notify team of departure (with permission)',
      requiresApproval: true,
    },
  },

  steps: [
    {
      id: 'assess_situation',
      name: 'Assess Situation',
      description: 'Understand departure reason and context',
      nextSteps: ['plan_transition'],
    },
    {
      id: 'plan_transition',
      name: 'Plan Transition',
      description: 'Create exit timeline and checklist',
      nextSteps: ['execute_exit'],
    },
    {
      id: 'execute_exit',
      name: 'Execute Exit',
      description: 'Coordinate all exit activities',
      nextSteps: ['conduct_interview'],
    },
    {
      id: 'conduct_interview',
      name: 'Conduct Interview',
      description: 'Hold exit interview and gather feedback',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Exit complete, analyze insights',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 6: COMPENSATION
// ============================================================================

const COMPENSATION_WORKFLOW: Workflow = {
  id: 'compensation',
  name: 'Compensation & Equity',
  description: 'Salary bands, merit cycles, equity grants, benchmarking, and pay equity',

  triggers: [
    { pattern: /compensation|comp\s+band/i, weight: 10 },
    { pattern: /salary|pay/i, weight: 7, contextHints: ['band', 'range', 'equity', 'benchmark'] },
    { pattern: /equity|stock|rsu|options/i, weight: 9 },
    { pattern: /merit\s+cycle|merit\s+increase|annual\s+raise/i, weight: 11 },
    { pattern: /pay\s+equity|pay\s+gap/i, weight: 11 },
    { pattern: /market\s+rate|benchmarking/i, weight: 9 },
    { pattern: /raise|promotion\s+increase/i, weight: 7, contextHints: ['salary', 'compensation'] },
  ],

  capabilities: [
    {
      id: 'salary_bands',
      name: 'Salary Band Design',
      description: 'Create competitive, equitable salary structures',
      requirements: ['employee_data'],
    },
    {
      id: 'merit_cycles',
      name: 'Merit Cycle Management',
      description: 'Plan and execute annual compensation reviews',
      requirements: ['employee_data', 'performance_data'],
    },
    {
      id: 'equity_programs',
      name: 'Equity Grant Administration',
      description: 'Manage stock options, RSUs, and equity grants',
      requirements: [],
    },
    {
      id: 'benchmarking',
      name: 'Market Benchmarking',
      description: 'Compare compensation to market rates',
      requirements: [],
    },
    {
      id: 'pay_equity',
      name: 'Pay Equity Analysis',
      description: 'Ensure fair pay across demographics',
      requirements: ['employee_data'],
    },
  ],

  systemPrompt: `You are an expert compensation specialist focused on competitive, equitable pay structures.

## Your Capabilities

**1. Salary Band Design**
- Create role-based salary ranges
- Define min, mid, max by level and function
- Account for location adjustments
- Balance internal equity with market competitiveness

**2. Merit Cycle Management**
- Plan annual compensation review cycles
- Create merit increase guidelines
- Model budget impact
- Ensure fair distribution across teams

**3. Equity Grant Administration**
- Design equity grant programs
- Calculate grant amounts by level
- Create vesting schedules
- Communicate equity value to employees

**4. Market Benchmarking**
- Compare compensation to market data
- Identify over/under paid roles
- Recommend adjustments for competitiveness
- Track compensation trends

**5. Pay Equity Analysis**
- Analyze pay by gender, race, other demographics
- Identify unexplained pay gaps
- Create remediation plans
- Ensure compliance with pay equity laws

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{PERFORMANCE_DATA}}
{{MARKET_DATA}}

## Workflow State Management

Steps: understand_need → analyze_data → design_structure → model_impact → execute_changes

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Ensure pay equity across all demographics
- Balance competitiveness with sustainability
- Communicate compensation philosophy clearly
- Make data-driven decisions
- Consider total rewards, not just salary
- Plan for career progression`,

  actions: {
    create_comp_proposal: {
      type: 'create_document',
      label: 'Create compensation proposal',
      description: 'Generate detailed compensation proposal',
      requiresApproval: false,
    },
    analyze_pay_equity: {
      type: 'analyze_data',
      label: 'Analyze pay equity',
      description: 'Run pay equity analysis across demographics',
      requiresApproval: false,
    },
    export_comp_data: {
      type: 'export_to_sheets',
      label: 'Export to Google Sheets',
      description: 'Create compensation planning spreadsheet',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'understand_need',
      name: 'Understand Need',
      description: 'Clarify compensation question or initiative',
      nextSteps: ['analyze_data'],
    },
    {
      id: 'analyze_data',
      name: 'Analyze Data',
      description: 'Review current comp and market data',
      nextSteps: ['design_structure'],
    },
    {
      id: 'design_structure',
      name: 'Design Structure',
      description: 'Create salary bands or grant framework',
      nextSteps: ['model_impact'],
    },
    {
      id: 'model_impact',
      name: 'Model Impact',
      description: 'Project budget and equity impact',
      nextSteps: ['execute_changes'],
    },
    {
      id: 'execute_changes',
      name: 'Execute Changes',
      description: 'Implement compensation updates',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Changes complete',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 7: EMPLOYEE RELATIONS
// ============================================================================

const EMPLOYEE_RELATIONS_WORKFLOW: Workflow = {
  id: 'employee_relations',
  name: 'Employee Relations',
  description: 'ER cases, investigations, accommodations, leaves, and policy management',

  triggers: [
    { pattern: /employee\s+relations|\ber\s+case|\ber\b/i, weight: 11 },
    { pattern: /investigation|investigate|complaint/i, weight: 10 },
    { pattern: /accommodation|ada|disability/i, weight: 11 },
    { pattern: /\bfmla\b|leave\s+of\s+absence|parental\s+leave/i, weight: 11 },
    {
      pattern: /policy|handbook|code\s+of\s+conduct/i,
      weight: 8,
      contextHints: ['employee', 'create', 'update'],
    },
    { pattern: /harassment|discrimination|hostile\s+work/i, weight: 12 },
    { pattern: /grievance|dispute|conflict/i, weight: 9 },
  ],

  capabilities: [
    {
      id: 'er_case_management',
      name: 'ER Case Management',
      description: 'Manage employee relations cases and investigations',
      requirements: [],
    },
    {
      id: 'investigations',
      name: 'Workplace Investigations',
      description: 'Conduct fair, thorough investigations',
      requirements: [],
    },
    {
      id: 'accommodations',
      name: 'Accommodation Management',
      description: 'Handle ADA and reasonable accommodation requests',
      requirements: [],
    },
    {
      id: 'leave_administration',
      name: 'Leave Administration',
      description: 'Manage FMLA, parental, and other leave types',
      requirements: ['employee_data'],
    },
    {
      id: 'policy_management',
      name: 'Policy Management',
      description: 'Create and update employee policies',
      requirements: [],
    },
  ],

  systemPrompt: `You are an expert employee relations specialist focused on fair, compliant case resolution.

## Your Capabilities

**1. ER Case Management**
- Track and manage ER cases
- Document issues thoroughly
- Coordinate with legal when needed
- Ensure confidentiality and fairness

**2. Workplace Investigations**
- Design investigation plans
- Conduct impartial interviews
- Analyze evidence and credibility
- Write investigation reports
- Make recommendations

**3. Accommodation Management**
- Process ADA accommodation requests
- Engage in interactive process
- Identify reasonable accommodations
- Document accommodation plans
- Ensure compliance

**4. Leave Administration**
- Manage FMLA, parental, medical leaves
- Calculate leave entitlements
- Coordinate with payroll and benefits
- Track return-to-work
- Ensure legal compliance

**5. Policy Management**
- Draft employee handbooks
- Create clear, compliant policies
- Update policies for legal changes
- Communicate policy updates
- Train managers on policies

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{COMPANY_POLICIES}}
{{LEGAL_REQUIREMENTS}}

## Workflow State Management

Steps: receive_issue → assess_severity → investigate → recommend_action → close_case

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Maintain strict confidentiality
- Document everything thoroughly
- Act quickly on serious allegations
- Ensure fair, impartial process
- Consult legal when appropriate
- Focus on resolution and prevention`,

  actions: {
    create_investigation_plan: {
      type: 'create_document',
      label: 'Create investigation plan',
      description: 'Generate investigation framework',
      requiresApproval: false,
    },
    create_policy: {
      type: 'create_document',
      label: 'Create policy document',
      description: 'Draft employee policy or handbook section',
      requiresApproval: false,
    },
    document_accommodation: {
      type: 'create_document',
      label: 'Document accommodation',
      description: 'Create accommodation agreement',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'receive_issue',
      name: 'Receive Issue',
      description: 'Log ER case or request',
      nextSteps: ['assess_severity'],
    },
    {
      id: 'assess_severity',
      name: 'Assess Severity',
      description: 'Determine urgency and response needed',
      nextSteps: ['investigate', 'recommend_action'],
    },
    {
      id: 'investigate',
      name: 'Investigate',
      description: 'Conduct investigation if needed',
      nextSteps: ['recommend_action'],
    },
    {
      id: 'recommend_action',
      name: 'Recommend Action',
      description: 'Propose resolution or next steps',
      nextSteps: ['close_case'],
    },
    {
      id: 'close_case',
      name: 'Close Case',
      description: 'Resolve case and document outcome',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// WORKFLOW 8: COMPLIANCE
// ============================================================================

const COMPLIANCE_WORKFLOW: Workflow = {
  id: 'compliance',
  name: 'Compliance & Regulatory',
  description: 'I-9, EEO, benefits enrollment, regulatory compliance, and legal documentation',

  triggers: [
    { pattern: /compliance|regulatory|legal\s+requirement/i, weight: 10 },
    { pattern: /\bi-?9\b|employment\s+eligibility/i, weight: 12 },
    { pattern: /\beeo\b|equal\s+employment|affirmative\s+action/i, weight: 11 },
    { pattern: /benefits?\s+enrollment|open\s+enrollment/i, weight: 10 },
    { pattern: /\bwarn\s+act\b/i, weight: 12 },
    { pattern: /\bcobra\b/i, weight: 10 },
    { pattern: /audit|compliance\s+check/i, weight: 9 },
    { pattern: /mandatory\s+training|compliance\s+training/i, weight: 9 },
  ],

  capabilities: [
    {
      id: 'i9_management',
      name: 'I-9 Compliance',
      description: 'Manage employment eligibility verification',
      requirements: [],
    },
    {
      id: 'eeo_reporting',
      name: 'EEO Reporting',
      description: 'File EEO-1 and track compliance',
      requirements: ['employee_data'],
    },
    {
      id: 'benefits_enrollment',
      name: 'Benefits Enrollment',
      description: 'Coordinate benefits enrollment and compliance',
      requirements: [],
    },
    {
      id: 'regulatory_compliance',
      name: 'Regulatory Compliance',
      description: 'Ensure compliance with employment laws',
      requirements: [],
    },
    {
      id: 'legal_documentation',
      name: 'Legal Documentation',
      description: 'Create compliant HR documentation',
      requirements: [],
    },
  ],

  systemPrompt: `You are an expert HR compliance specialist focused on regulatory adherence and risk mitigation.

## Your Capabilities

**1. I-9 Management**
- Track I-9 completion and reverification
- Ensure timely completion (within 3 days)
- Maintain compliant documentation
- Prepare for I-9 audits

**2. EEO Reporting**
- File EEO-1 reports accurately
- Track workforce demographics
- Ensure affirmative action compliance
- Respond to OFCCP requests

**3. Benefits Enrollment**
- Coordinate open enrollment
- Ensure ACA compliance
- Track enrollment deadlines
- Communicate COBRA rights

**4. Regulatory Compliance**
- Monitor changing employment laws
- Ensure FLSA, ADA, FMLA compliance
- Implement WARN Act requirements
- Prepare for DOL audits

**5. Legal Documentation**
- Create compliant forms and policies
- Maintain required postings
- Document compliance efforts
- Coordinate with legal counsel

## Context You Have Access To

{{EMPLOYEE_CONTEXT}}
{{COMPLIANCE_REQUIREMENTS}}
{{LEGAL_UPDATES}}

## Workflow State Management

Steps: identify_requirement → assess_compliance → create_documentation → implement_process → monitor_ongoing

Current state: {{WORKFLOW_STATE}}

## Best Practices

- Stay current on legal changes
- Document everything for audits
- Consult legal when uncertain
- Train managers on compliance
- Build compliance into processes
- Conduct regular audits`,

  actions: {
    create_compliance_doc: {
      type: 'create_document',
      label: 'Create compliance document',
      description: 'Generate compliant form or policy',
      requiresApproval: false,
    },
    run_compliance_audit: {
      type: 'analyze_data',
      label: 'Run compliance audit',
      description: 'Check compliance across requirements',
      requiresApproval: false,
    },
  },

  steps: [
    {
      id: 'identify_requirement',
      name: 'Identify Requirement',
      description: 'Understand compliance need',
      nextSteps: ['assess_compliance'],
    },
    {
      id: 'assess_compliance',
      name: 'Assess Compliance',
      description: 'Check current compliance status',
      nextSteps: ['create_documentation'],
    },
    {
      id: 'create_documentation',
      name: 'Create Documentation',
      description: 'Generate required documentation',
      nextSteps: ['implement_process'],
    },
    {
      id: 'implement_process',
      name: 'Implement Process',
      description: 'Put compliance process in place',
      nextSteps: ['monitor_ongoing'],
    },
    {
      id: 'monitor_ongoing',
      name: 'Monitor Ongoing',
      description: 'Track ongoing compliance',
      nextSteps: ['close_workflow'],
    },
    {
      id: 'close_workflow',
      name: 'Close Workflow',
      description: 'Compliance achieved',
      nextSteps: [],
    },
  ],
};

// ============================================================================
// GENERAL FALLBACK
// ============================================================================

const GENERAL_WORKFLOW: Workflow = {
  id: 'general',
  name: 'General HR Assistant',
  description: "General HR guidance and support for queries that don't match specific workflows",

  triggers: [], // No triggers - this is the fallback

  capabilities: [
    {
      id: 'general_guidance',
      name: 'General HR Guidance',
      description: 'Provide general HR advice and support',
      requirements: [],
    },
  ],

  systemPrompt: `You are a helpful HR assistant providing general guidance and support.

When users have general questions or need help understanding what you can do, provide clear, helpful responses.

If their question relates to a specific workflow (hiring, performance, analytics, etc.), guide them toward that workflow's capabilities.

Available workflows:
- HIRING: Job descriptions, interviews, offers, candidate evaluation
- PERFORMANCE: Reviews, PIPs, coaching, feedback, development
- ANALYTICS: Metrics, trends, dashboards, insights, forecasting
- ONBOARDING: New hire integration, 30/60/90 plans, buddy programs
- OFFBOARDING: Exits, knowledge transfer, termination documentation
- COMPENSATION: Salary bands, merit cycles, equity, pay equity
- EMPLOYEE_RELATIONS: ER cases, investigations, accommodations, policies
- COMPLIANCE: I-9, EEO, benefits, regulatory requirements

Be helpful, professional, and guide users to the right workflow when appropriate.`,

  actions: {},
  steps: [],
};

// ============================================================================
// WORKFLOW REGISTRY
// ============================================================================

export const WORKFLOWS: Record<WorkflowId, Workflow> = {
  hiring: HIRING_WORKFLOW,
  performance: PERFORMANCE_WORKFLOW,
  analytics: ANALYTICS_WORKFLOW,
  onboarding: ONBOARDING_WORKFLOW,
  offboarding: OFFBOARDING_WORKFLOW,
  compensation: COMPENSATION_WORKFLOW,
  employee_relations: EMPLOYEE_RELATIONS_WORKFLOW,
  compliance: COMPLIANCE_WORKFLOW,
  general: GENERAL_WORKFLOW,
};

/**
 * Get workflow by ID
 */
export function getWorkflow(workflowId: WorkflowId): Workflow | null {
  return WORKFLOWS[workflowId] || null;
}

/**
 * Get all workflow IDs
 */
export function getAllWorkflowIds(): WorkflowId[] {
  return Object.keys(WORKFLOWS) as WorkflowId[];
}

/**
 * Get workflow name
 */
export function getWorkflowName(workflowId: WorkflowId): string {
  return WORKFLOWS[workflowId]?.name || workflowId;
}
