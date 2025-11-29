/**
 * HR Document Templates Library
 *
 * Comprehensive collection of 18 HR document templates organized by category.
 * Each template contains generic, readable example text (not placeholders).
 *
 * Categories:
 * - Hiring: Offer Letter, Job Description, Interview Guide, Reference Check
 * - Performance: Performance Review, PIP, Coaching Plan, 90-Day Review
 * - Transitions: Promotion Letter, Transfer Letter, Termination Letter, Resignation Acceptance
 * - Compliance: Written Warning, Leave Approval, Exit Interview Guide
 * - Onboarding: Onboarding Checklist, Welcome Letter, Benefits Summary
 */

export type TemplateCategory =
  | 'hiring'
  | 'performance'
  | 'transitions'
  | 'compliance'
  | 'onboarding';

export interface HRTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  content: string;
  relatedSkills: string[];
}

export const HR_TEMPLATE_CATEGORIES: Record<
  TemplateCategory,
  { label: string; description: string }
> = {
  hiring: {
    label: 'Hiring',
    description: 'Recruitment and candidate documentation',
  },
  performance: {
    label: 'Performance',
    description: 'Reviews, improvement plans, and development',
  },
  transitions: {
    label: 'Transitions',
    description: 'Promotions, transfers, and separations',
  },
  compliance: {
    label: 'Compliance',
    description: 'Disciplinary actions and leave management',
  },
  onboarding: {
    label: 'Onboarding',
    description: 'New hire welcome and orientation',
  },
};

export const HR_TEMPLATES: HRTemplate[] = [
  // ============================================
  // HIRING TEMPLATES (4)
  // ============================================
  {
    id: 'offer-letter',
    name: 'Offer Letter',
    category: 'hiring',
    description: 'Standard employment offer with compensation details',
    relatedSkills: ['hr-document-generator', 'offer-letter-builder'],
    content: `# Offer of Employment

**CONFIDENTIAL**

**Date:** November 15, 2024

**To:** Sarah Chen
**From:** Acme Corporation
**Subject:** Employment Offer - Senior Product Manager

---

Dear Sarah,

We are pleased to offer you the position of **Senior Product Manager** at Acme Corporation. After meeting with our team, we are confident that your experience in product strategy and your track record of launching successful products make you an excellent fit for our organization.

## Position Details

- **Title:** Senior Product Manager
- **Department:** Product
- **Reporting To:** VP of Product, Michael Torres
- **Start Date:** December 2, 2024
- **Employment Type:** Full-time, Exempt

## Compensation Package

- **Base Salary:** $145,000 per year, paid bi-weekly
- **Annual Bonus:** Target 15% of base salary, based on individual and company performance
- **Equity:** 10,000 stock options, vesting over 4 years with a 1-year cliff

## Benefits

You will be eligible for our comprehensive benefits package, which includes:

- Medical, dental, and vision insurance (company covers 90% of premiums)
- 401(k) with 4% company match
- 20 days PTO plus 10 company holidays
- 12 weeks paid parental leave
- $2,000 annual professional development budget
- Flexible work arrangements (hybrid schedule available)

## Terms & Conditions

This offer is contingent upon:
- Successful completion of background verification
- Proof of eligibility to work in the United States
- Execution of our standard confidentiality and intellectual property agreement

This offer is valid for 7 business days from the date of this letter. Employment at Acme Corporation is at-will, meaning either party may terminate the relationship at any time with or without cause.

## Next Steps

To accept this offer, please sign and return this letter by November 22, 2024. We will then send you onboarding materials and coordinate your first day logistics.

We are excited about the possibility of you joining our team and contributing to our mission of building products that matter.

Sincerely,

**Jennifer Walsh**
Chief People Officer
Acme Corporation

---

## Acceptance

I, Sarah Chen, accept this offer of employment under the terms described above.

**Signature:** _________________________

**Date:** _________________________
`,
  },

  {
    id: 'job-description',
    name: 'Job Description',
    category: 'hiring',
    description: 'Role overview with responsibilities and requirements',
    relatedSkills: ['job-description-writer', 'hiring-manager-support'],
    content: `# Job Description

## Software Engineer II

**Department:** Engineering
**Location:** San Francisco, CA (Hybrid)
**Reports To:** Engineering Manager
**Employment Type:** Full-time

---

## About the Role

We are looking for a Software Engineer II to join our Platform team. In this role, you will design and build the infrastructure that powers our core product, working on challenges related to scalability, reliability, and developer experience.

You will collaborate with product managers, designers, and fellow engineers to ship features that impact millions of users. We value engineers who take ownership, communicate clearly, and care deeply about code quality.

## What You'll Do

- Design and implement backend services using Python and Go
- Build and maintain APIs that serve 50,000+ requests per second
- Improve system reliability through monitoring, alerting, and incident response
- Participate in code reviews and mentor junior engineers
- Collaborate with cross-functional teams to define technical requirements
- Contribute to architectural decisions and technical documentation

## What We're Looking For

### Required Qualifications

- 3-5 years of professional software development experience
- Strong proficiency in at least one backend language (Python, Go, Java, or similar)
- Experience with relational databases (PostgreSQL, MySQL) and SQL
- Familiarity with cloud platforms (AWS, GCP, or Azure)
- Understanding of distributed systems concepts
- Bachelor's degree in Computer Science or equivalent practical experience

### Preferred Qualifications

- Experience with Kubernetes and containerization
- Familiarity with event-driven architectures (Kafka, RabbitMQ)
- Background in building developer tools or platform infrastructure
- Contributions to open-source projects

## What Success Looks Like

In your first 90 days, you will:
- Complete onboarding and ship your first production code
- Own a small feature from design through deployment
- Build relationships with teammates and stakeholders

In your first year, you will:
- Lead a medium-sized project with multiple engineers
- Improve a key system metric (latency, reliability, or scalability)
- Become a subject matter expert in your area of the codebase

## Compensation & Benefits

- **Salary Range:** $130,000 - $170,000 (based on experience)
- **Equity:** Stock options included
- **Benefits:** Medical, dental, vision, 401(k) with match, unlimited PTO

## About Our Team

The Platform team is a group of 8 engineers focused on building the foundation that other teams build upon. We value pragmatic solutions, clear communication, and continuous learning. We work in 2-week sprints and have a strong culture of code review and pair programming.

---

*Acme Corporation is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.*
`,
  },

  {
    id: 'interview-guide',
    name: 'Interview Guide',
    category: 'hiring',
    description: 'Structured interview questions and evaluation criteria',
    relatedSkills: ['interview-guide-creator', 'hiring-manager-support'],
    content: `# Interview Guide

## Candidate Information

- **Candidate:** David Park
- **Position:** Senior Data Analyst
- **Interview Date:** November 18, 2024
- **Interviewer:** Maria Santos, Analytics Manager

---

## Interview Structure (60 minutes)

| Section | Duration | Focus Area |
|---------|----------|------------|
| Introduction | 5 min | Rapport building, role overview |
| Background Review | 10 min | Experience and career trajectory |
| Technical Assessment | 20 min | SQL, data analysis, visualization |
| Behavioral Questions | 15 min | Problem-solving, collaboration |
| Candidate Questions | 10 min | Address candidate's questions |

---

## Background Questions

### Career Journey
**Question:** Walk me through your career path and what led you to data analytics.

**What to listen for:**
- Clear narrative connecting experiences
- Genuine interest in data-driven decision making
- Growth mindset and learning orientation

**Notes:** _____________________________________________

---

### Relevant Experience
**Question:** Tell me about a project where you used data to influence a significant business decision.

**What to listen for:**
- Clear problem definition
- Appropriate methodology
- Measurable impact
- Stakeholder communication

**Notes:** _____________________________________________

---

## Technical Assessment

### SQL Proficiency
**Question:** You have a table called \`orders\` with columns \`order_id\`, \`customer_id\`, \`order_date\`, and \`amount\`. Write a query to find the top 10 customers by total spend in the last 90 days.

**Expected Answer Elements:**
- Correct use of aggregation (SUM)
- Proper date filtering (WHERE or HAVING)
- Appropriate grouping and ordering
- Limit clause

**Rating:** [ ] Exceeds  [ ] Meets  [ ] Below

**Notes:** _____________________________________________

---

### Data Analysis Scenario
**Question:** Our marketing team reports that email open rates dropped 15% last month. How would you investigate this?

**Strong Response Includes:**
- Clarifying questions (segment, device type, timing)
- Hypothesis generation (deliverability, content, competition)
- Data sources needed (email platform data, A/B test results)
- Suggested visualizations
- Next steps and recommendations

**Rating:** [ ] Exceeds  [ ] Meets  [ ] Below

**Notes:** _____________________________________________

---

## Behavioral Questions

### Collaboration
**Question:** Describe a time when you had to work with a stakeholder who had unrealistic expectations about what data could deliver. How did you handle it?

**STAR Evaluation:**
- **Situation:** Clear context
- **Task:** Their specific responsibility
- **Action:** Steps taken, emphasis on communication
- **Result:** Outcome and lessons learned

**Rating:** [ ] Exceeds  [ ] Meets  [ ] Below

---

### Problem-Solving Under Pressure
**Question:** Tell me about a time when you discovered an error in data that had already been shared with leadership. What did you do?

**What to listen for:**
- Accountability and transparency
- Quick action to assess impact
- Clear communication with stakeholders
- Process improvements implemented

**Rating:** [ ] Exceeds  [ ] Meets  [ ] Below

---

## Overall Evaluation

### Technical Skills
| Skill | Rating |
|-------|--------|
| SQL Proficiency | [ ] Strong  [ ] Adequate  [ ] Weak |
| Data Visualization | [ ] Strong  [ ] Adequate  [ ] Weak |
| Statistical Thinking | [ ] Strong  [ ] Adequate  [ ] Weak |

### Soft Skills
| Skill | Rating |
|-------|--------|
| Communication | [ ] Strong  [ ] Adequate  [ ] Weak |
| Problem-Solving | [ ] Strong  [ ] Adequate  [ ] Weak |
| Collaboration | [ ] Strong  [ ] Adequate  [ ] Weak |

---

## Recommendation

[ ] **Strong Hire** - Exceptional candidate, move forward immediately
[ ] **Hire** - Good fit, recommend next round
[ ] **Lean Hire** - Potential, but have concerns
[ ] **No Hire** - Does not meet requirements

**Summary Comments:**

_____________________________________________

_____________________________________________

**Interviewer Signature:** _________________ **Date:** _________
`,
  },

  {
    id: 'reference-check',
    name: 'Reference Check Form',
    category: 'hiring',
    description: 'Questions for contacting professional references',
    relatedSkills: ['hiring-manager-support'],
    content: `# Reference Check Form

## Candidate & Reference Information

| Field | Value |
|-------|-------|
| **Candidate Name:** | Emily Martinez |
| **Position Applied For:** | Marketing Director |
| **Reference Name:** | James Thompson |
| **Reference Title:** | Former VP of Marketing |
| **Reference Company:** | Previous Employer Inc. |
| **Relationship:** | Direct Manager (2 years) |
| **Contact Date:** | November 15, 2024 |
| **Conducted By:** | HR Coordinator |

---

## Introduction Script

*"Hello, this is [Your Name] from Acme Corporation. We're considering Emily Martinez for a Marketing Director position, and she provided your name as a reference. Do you have about 10-15 minutes to answer some questions about your experience working with her?"*

---

## Reference Questions

### Employment Verification

**1. Can you confirm Emily's employment dates and title at your organization?**

**Stated:** Marketing Manager, January 2020 - March 2024

**Confirmed:** [ ] Yes  [ ] No - Discrepancy: _____________

---

### Performance & Skills

**2. What were Emily's primary responsibilities?**

Response: _____________________________________________

_____________________________________________

---

**3. How would you describe Emily's performance overall?**

[ ] Exceptional  [ ] Strong  [ ] Satisfactory  [ ] Below Expectations

Comments: _____________________________________________

---

**4. What are Emily's greatest strengths?**

Response: _____________________________________________

_____________________________________________

---

**5. What areas could Emily develop further?**

Response: _____________________________________________

_____________________________________________

---

### Work Style & Collaboration

**6. How did Emily work with team members and cross-functional partners?**

Response: _____________________________________________

---

**7. How did Emily handle pressure or tight deadlines?**

Response: _____________________________________________

---

**8. Can you describe Emily's leadership or management style?**

Response: _____________________________________________

---

### Specific Role Questions

**9. This role requires managing a team of 8 and a $2M budget. Based on your experience, how prepared is Emily for this scope?**

Response: _____________________________________________

---

### Final Questions

**10. What advice would you give to Emily's new manager to help her succeed?**

Response: _____________________________________________

---

**11. Would you rehire Emily if given the opportunity?**

[ ] Definitely Yes  [ ] Probably Yes  [ ] Unsure  [ ] No

Comments: _____________________________________________

---

**12. Is there anything else we should know about Emily?**

Response: _____________________________________________

---

## Reference Check Summary

**Overall Impression:** [ ] Very Positive  [ ] Positive  [ ] Mixed  [ ] Concerning

**Key Takeaways:**

1. _____________________________________________

2. _____________________________________________

3. _____________________________________________

**Red Flags Identified:** [ ] None  [ ] Yes - Details: _____________

**Recommendation:** [ ] Proceed with offer  [ ] Gather more information  [ ] Reconsider candidacy

---

**Reference Check Completed By:** _________________ **Date:** _________
`,
  },

  // ============================================
  // PERFORMANCE TEMPLATES (4)
  // ============================================
  {
    id: 'performance-review',
    name: 'Performance Review',
    category: 'performance',
    description: 'Annual or quarterly performance evaluation',
    relatedSkills: ['performance-insights-analyst', 'hr-document-generator'],
    content: `# Annual Performance Review

## Employee Information

| Field | Value |
|-------|-------|
| **Employee:** | Alex Rivera |
| **Title:** | Customer Success Manager |
| **Department:** | Customer Success |
| **Manager:** | Lisa Chen |
| **Review Period:** | November 2023 - October 2024 |
| **Review Date:** | November 12, 2024 |

---

## Performance Summary

### Overall Rating: **Exceeds Expectations**

Alex has demonstrated exceptional performance this year, consistently exceeding targets and taking on additional responsibilities. His customer retention rate of 94% is the highest on the team, and his proactive approach to identifying at-risk accounts has saved approximately $450,000 in potential churn.

---

## Goal Achievement

### Goal 1: Maintain 90% Customer Retention Rate
- **Target:** 90%
- **Actual:** 94%
- **Rating:** Exceeds Expectations

Alex not only met but exceeded this goal by 4 percentage points. He implemented a new early warning system for at-risk accounts that the entire team has since adopted.

---

### Goal 2: Increase NPS Score for Assigned Accounts
- **Target:** Improve from 42 to 50
- **Actual:** 56
- **Rating:** Exceeds Expectations

Through consistent engagement and proactive problem-solving, Alex achieved a 14-point NPS improvement, surpassing the target by 6 points.

---

### Goal 3: Complete Customer Success Certification
- **Target:** Complete by Q2 2024
- **Actual:** Completed March 2024
- **Rating:** Meets Expectations

Alex completed the certification on schedule and has been applying the frameworks to his daily work.

---

## Competency Assessment

| Competency | Rating | Comments |
|------------|--------|----------|
| Customer Focus | Exceeds | Consistently prioritizes customer needs; receives regular praise in feedback |
| Communication | Exceeds | Clear, empathetic communicator; excellent at de-escalating tense situations |
| Problem Solving | Meets | Identifies solutions effectively; could improve on documenting patterns |
| Collaboration | Exceeds | Highly collaborative; frequently helps teammates with challenging accounts |
| Initiative | Exceeds | Created the at-risk account playbook that's now team standard |

---

## Key Accomplishments

1. **At-Risk Account Playbook** - Developed a systematic approach to identifying and saving at-risk accounts, now used by the entire CS team

2. **Enterprise Account Win** - Personally managed the renewal of our largest enterprise account ($1.2M ARR), negotiating a 3-year contract

3. **Team Training** - Led 4 training sessions on product updates for the CS team, reducing time-to-competency for new features

4. **Process Improvement** - Streamlined the quarterly business review process, reducing prep time from 8 hours to 3 hours per account

---

## Areas for Development

### Strategic Thinking
Alex excels at tactical execution but could develop stronger strategic planning skills. Recommend participating in the company's leadership development program in Q1 2025.

### Data Analysis
While Alex uses data effectively, deeper analytical skills would help identify trends across his portfolio. Consider advanced Excel/Looker training.

### Delegation
As Alex takes on more responsibilities, learning to delegate effectively will be important for scaling his impact.

---

## Goals for Next Review Period

### Goal 1: Achieve 95% Customer Retention
Continue building on success with enhanced early warning indicators.

### Goal 2: Mentor 2 Junior CSMs
Develop leadership skills through formal mentorship program.

### Goal 3: Complete Leadership Development Program
Build strategic thinking and management capabilities.

### Goal 4: Lead Cross-Functional Initiative
Own at least one initiative involving Product and Engineering teams.

---

## Compensation Discussion

Based on Alex's exceptional performance, I recommend the following:

- **Merit Increase:** 8% (above standard 4% for Exceeds rating)
- **Bonus:** 110% of target (reflecting exceptional results)
- **Promotion Eligibility:** Ready for Senior CSM title in Q2 2025

---

## Signatures

**Employee Signature:** _________________ **Date:** _________

*I acknowledge that I have read and discussed this review with my manager.*

**Manager Signature:** _________________ **Date:** _________

**HR Approval:** _________________ **Date:** _________
`,
  },

  {
    id: 'pip',
    name: 'Performance Improvement Plan',
    category: 'performance',
    description: '30/60/90 day improvement plan with clear expectations',
    relatedSkills: ['pip-builder-monitor', 'hr-document-generator'],
    content: `# Performance Improvement Plan

## Employee Information

| Field | Value |
|-------|-------|
| **Employee:** | Jordan Williams |
| **Title:** | Sales Development Representative |
| **Department:** | Sales |
| **Manager:** | Rachel Kim |
| **HR Partner:** | Marcus Johnson |
| **PIP Start Date:** | November 15, 2024 |
| **PIP End Date:** | February 14, 2025 |
| **Duration:** | 90 Days |

---

## Purpose

This Performance Improvement Plan (PIP) is designed to provide Jordan with clear expectations, targeted support, and regular feedback to achieve the performance standards required for the Sales Development Representative role. The goal is successful improvement and continued employment at Acme Corporation.

---

## Performance Concerns

### Issue 1: Below Target on Qualified Opportunities

**Current Performance:** 8 qualified opportunities per month (average over last quarter)
**Expected Performance:** 15 qualified opportunities per month (team minimum standard)
**Gap:** 47% below target

**Specific Examples:**
- September 2024: 7 qualified opportunities (53% of target)
- October 2024: 9 qualified opportunities (60% of target)
- November 2024 (MTD): 3 qualified opportunities (on track for ~8)

**Impact:** Pipeline contribution is 40% below team average, affecting quarterly revenue targets.

---

### Issue 2: Inconsistent Activity Levels

**Current Performance:** Average 45 calls and 30 emails per day
**Expected Performance:** Minimum 75 calls and 50 emails per day
**Gap:** 40% below call target, 40% below email target

**Specific Examples:**
- Week of October 28: 35 calls/day average, 22 emails/day average
- Frequent extended breaks observed (1.5-2 hours lunch vs. 1-hour standard)
- Late arrivals 6 times in October (9:15-9:30 vs. 9:00 AM start)

**Impact:** Lower activity directly correlates with lower opportunity generation.

---

### Issue 3: CRM Data Quality

**Current Performance:** 60% of leads have complete, accurate notes
**Expected Performance:** 95% of leads have complete, accurate notes within 24 hours
**Gap:** 35% below standard

**Specific Examples:**
- Multiple leads transferred to AEs with missing qualification notes
- BANT criteria incomplete on 40% of qualified opportunities
- Duplicate entries created due to not checking existing records

**Impact:** AEs spending extra time re-qualifying leads, slowing deal cycles.

---

## Improvement Goals

### Goal 1: Achieve Qualified Opportunity Target

**Success Criteria:**
- Month 1: 12 qualified opportunities (80% of target)
- Month 2: 14 qualified opportunities (93% of target)
- Month 3: 15 qualified opportunities (100% of target)

**Support Provided:**
- Weekly 1:1 pipeline review with Rachel
- Shadow top performer (Jessica Chen) for 2 days
- Access to Gong call recordings library for best practice examples

**Measurement:** Weekly pipeline report from Salesforce

---

### Goal 2: Meet Daily Activity Minimums

**Success Criteria:**
- Minimum 75 calls per day, tracked in Salesforce
- Minimum 50 emails per day, tracked in Outreach
- Consistent 9:00 AM start time with standard 1-hour lunch

**Support Provided:**
- Morning stand-up at 9:15 AM to review daily plan
- Time blocking template provided
- Outreach sequence optimization with Sales Ops

**Measurement:** Daily activity dashboard reviewed each morning

---

### Goal 3: Maintain CRM Data Quality Standards

**Success Criteria:**
- 95% of leads updated with complete notes within 24 hours
- All qualified opportunities have full BANT criteria documented
- Zero duplicate entries created

**Support Provided:**
- CRM training refresher session scheduled
- Checklist template for lead qualification notes
- Weekly data quality audit with feedback

**Measurement:** Weekly data quality report from Sales Ops

---

## Check-In Schedule

| Date | Type | Focus |
|------|------|-------|
| Nov 22, 2024 | Weekly Check-in | Review first week activity and pipeline |
| Nov 29, 2024 | Weekly Check-in | Assess progress on daily minimums |
| Dec 6, 2024 | Weekly Check-in | Mid-point Month 1 review |
| Dec 13, 2024 | **Month 1 Review** | Formal assessment of all goals |
| Dec 20, 2024 | Weekly Check-in | Holiday week planning |
| Jan 3, 2025 | Weekly Check-in | Resume regular cadence |
| Jan 10, 2025 | **Month 2 Review** | Formal assessment of all goals |
| Feb 7, 2025 | Weekly Check-in | Final week preparation |
| Feb 14, 2025 | **Final Review** | PIP conclusion and determination |

---

## Possible Outcomes

### Successful Completion
All goals met by February 14, 2025. PIP closed, expectations reaffirmed, regular performance management resumes.

### Extension
Substantial progress demonstrated but goals not yet fully met. PIP may be extended by up to 30 days at management discretion.

### Termination
If improvement is insufficient or expectations are not met by the end of the PIP period, employment may be terminated.

---

## Acknowledgment

I acknowledge that I have received and understand this Performance Improvement Plan. I understand the expectations, the support that will be provided, and the potential outcomes.

**Employee Signature:** _________________ **Date:** _________

**Employee Comments (optional):**

_____________________________________________

_____________________________________________

**Manager Signature:** _________________ **Date:** _________

**HR Signature:** _________________ **Date:** _________

---

*A copy of this document will be placed in the employee's personnel file.*
`,
  },

  {
    id: 'coaching-plan',
    name: 'Coaching Plan',
    category: 'performance',
    description: 'Development-focused coaching outline',
    relatedSkills: ['performance-insights-analyst', 'coaching-support'],
    content: `# Coaching Plan

## Overview

| Field | Value |
|-------|-------|
| **Employee:** | Maya Patel |
| **Title:** | Product Designer |
| **Coach:** | Kevin O'Brien, Senior Design Manager |
| **Focus Area:** | User Research & Stakeholder Communication |
| **Duration:** | 12 Weeks (November 15, 2024 - February 7, 2025) |
| **Coaching Type:** | Development (not performance-related) |

---

## Background & Context

Maya joined the Product Design team 8 months ago and has shown strong visual design skills and attention to detail. She has expressed interest in taking on more strategic work and eventually moving into a senior designer role.

Through our recent conversations and 360 feedback, we've identified two areas that will accelerate her growth:
1. **User Research** - Conducting and synthesizing qualitative research
2. **Stakeholder Communication** - Presenting design decisions confidently to non-design audiences

This coaching plan is developmental in nature, focused on building skills for future career growth.

---

## Development Goals

### Goal 1: Lead Independent User Research

**Current State:**
Maya has participated in user interviews but hasn't led research independently. She tends to defer to researchers and feels uncertain about when she has "enough" data.

**Desired State:**
Maya can plan, conduct, and synthesize a complete user research study. She feels confident moderating interviews and identifying patterns in qualitative data.

**Success Indicators:**
- Successfully lead 2 user research studies from planning to insight synthesis
- Create a research findings presentation that influences product decisions
- Demonstrate confidence in interview moderation (self-assessment and peer feedback)

---

### Goal 2: Present Design Decisions Effectively

**Current State:**
Maya's design critiques with the design team are strong, but she becomes quieter in cross-functional meetings. She sometimes struggles to explain design rationale in non-design terms.

**Desired State:**
Maya presents design decisions confidently to stakeholders (PM, Engineering, Leadership). She frames designs in terms of user and business outcomes.

**Success Indicators:**
- Lead 3 design presentations to cross-functional teams
- Receive positive feedback on clarity from at least 2 stakeholders
- Successfully handle pushback or questions without becoming defensive

---

## Coaching Sessions

### Week 1-2: Foundation

**Focus:** Assess current skills, set goals, identify resources

**Activities:**
- Complete self-assessment on research and presentation skills
- Shadow a user researcher during 2 interview sessions
- Review exemplary research reports and design presentations
- Identify a pilot project for research goal

**Coaching Session Topics:**
- Discuss career aspirations and how these goals fit
- Review self-assessment together
- Identify specific fears or blockers around each goal

---

### Week 3-4: User Research Deep Dive

**Focus:** Research planning and methodology

**Activities:**
- Create research plan for pilot project
- Draft interview script with feedback from UX Researcher
- Conduct 2 practice interviews with team members

**Coaching Session Topics:**
- Review research plan together
- Discuss interview techniques and common pitfalls
- Practice handling difficult interview situations

---

### Week 5-6: Research Execution

**Focus:** Conduct real user research

**Activities:**
- Conduct 5-6 user interviews for pilot project
- Document observations and initial themes
- Debrief after each session

**Coaching Session Topics:**
- Review recordings/notes from interviews
- Discuss what went well and what to improve
- Practice synthesis techniques

---

### Week 7-8: Presentation Skills Building

**Focus:** Communication and stakeholder management

**Activities:**
- Complete presentation skills course (LinkedIn Learning)
- Observe Kevin in 2 stakeholder presentations
- Draft presentation for research findings
- Practice presentation with design team

**Coaching Session Topics:**
- Review presentation draft
- Role-play handling tough questions
- Discuss reading the room and adapting on the fly

---

### Week 9-10: Real-World Application

**Focus:** Present to real stakeholders

**Activities:**
- Deliver research findings presentation to Product + Engineering
- Lead a design review with cross-functional team
- Collect feedback from attendees

**Coaching Session Topics:**
- Debrief on presentations
- Process feedback received
- Identify patterns and growth areas

---

### Week 11-12: Consolidation & Planning

**Focus:** Reflect, document learnings, plan next steps

**Activities:**
- Complete second user research study (smaller scope)
- Lead one more stakeholder presentation
- Document personal learnings and updated best practices
- Create development plan for next 6 months

**Coaching Session Topics:**
- Review progress against success indicators
- Discuss what to continue practicing
- Identify next development goals

---

## Resources & Support

**Courses & Materials:**
- "User Research Fundamentals" (Interaction Design Foundation)
- "Presentation Skills for Designers" (LinkedIn Learning)
- "Communicating Design" by Dan Brown (book)

**People:**
- Sarah Kim (UX Researcher) - available for shadowing and feedback
- David Chen (Product Manager) - practice stakeholder for presentations
- Design team - peer feedback on presentations

**Time Allocation:**
- 2-3 hours per week for learning activities
- 1 hour biweekly coaching sessions
- Research and presentation work integrated into regular projects

---

## Measurement & Check-ins

### Formal Check-ins

| Date | Milestone |
|------|-----------|
| November 29, 2024 | Foundation complete, research plan ready |
| December 20, 2024 | First research study complete |
| January 17, 2025 | First stakeholder presentation delivered |
| February 7, 2025 | Coaching period complete, review outcomes |

### Success Metrics

- [ ] Led 2 user research studies from planning to synthesis
- [ ] Created 2 research presentations shared with stakeholders
- [ ] Led 3 design presentations to cross-functional teams
- [ ] Received positive stakeholder feedback on communication clarity
- [ ] Self-reported confidence increase (scale of 1-10)

---

## Signatures

**Employee Signature:** _________________ **Date:** _________

*I am committed to actively participating in this coaching plan and completing the activities described.*

**Coach Signature:** _________________ **Date:** _________

*I am committed to providing the time, feedback, and support described in this plan.*
`,
  },

  {
    id: '90-day-review',
    name: '90-Day Review',
    category: 'performance',
    description: 'New hire probationary period review',
    relatedSkills: ['onboarding-program-builder', 'performance-insights-analyst'],
    content: `# 90-Day Performance Review

## Employee Information

| Field | Value |
|-------|-------|
| **Employee:** | Chris Nguyen |
| **Title:** | Financial Analyst |
| **Department:** | Finance |
| **Manager:** | Angela Foster |
| **Start Date:** | August 15, 2024 |
| **Review Date:** | November 13, 2024 |
| **Review Type:** | 90-Day Probationary Review |

---

## Executive Summary

Chris has successfully completed the 90-day probationary period and is recommended for continued employment. He has demonstrated strong analytical skills, a collaborative attitude, and a genuine commitment to learning our financial systems and processes.

**Recommendation:** ✅ **Confirm Employment**

---

## Onboarding Goals Assessment

### Goal 1: Complete Finance Systems Training

**Expectation:** Complete training on NetSuite, Adaptive Insights, and expense reporting system within 60 days.

**Result:** ✅ Completed

Chris completed all required system training ahead of schedule (Day 45). He has demonstrated proficiency in generating standard reports and processing transactions independently.

---

### Goal 2: Own Monthly Close Activities

**Expectation:** Successfully complete 2 monthly closes with decreasing supervision.

**Result:** ✅ Completed

- **September Close:** Participated with direct oversight, completed all assigned tasks accurately
- **October Close:** Worked more independently, required minimal manager review
- Chris caught a $15K accrual error that would have gone unnoticed

---

### Goal 3: Build Cross-Functional Relationships

**Expectation:** Establish working relationships with key partners in Sales Ops, HR, and Procurement.

**Result:** ✅ Completed

Chris has introduced himself to key partners and been responsive to their requests. Sales Ops specifically mentioned his helpfulness in providing commission data quickly.

---

### Goal 4: Demonstrate Financial Analysis Skills

**Expectation:** Complete at least one ad-hoc analysis project demonstrating analytical capabilities.

**Result:** ✅ Exceeds Expectations

Chris completed an excellent analysis of G&A cost trends that identified $50K in potential savings. The analysis was presented to the CFO and recommendations are being implemented in Q1.

---

## Performance by Competency

### Technical Skills

| Skill | Rating | Comments |
|-------|--------|----------|
| Financial Analysis | Strong | G&A analysis was thorough and well-structured |
| Excel/Google Sheets | Strong | Comfortable with advanced formulas and pivots |
| Financial Systems | Developing | Proficient in core tasks, still learning advanced features |
| Attention to Detail | Strong | Caught accrual error, consistently accurate work |

---

### Soft Skills

| Skill | Rating | Comments |
|-------|--------|----------|
| Communication | Strong | Clear in written and verbal communication |
| Collaboration | Strong | Works well with team and cross-functional partners |
| Initiative | Strong | Proactively asks questions, seeks feedback |
| Time Management | Developing | Still calibrating on how long tasks take |

---

## Strengths Observed

1. **Analytical Mindset** - Chris approaches problems systematically and asks good clarifying questions before diving into analysis

2. **Positive Attitude** - Consistently upbeat and willing to help teammates, even during busy close periods

3. **Learning Orientation** - Takes notes, asks follow-up questions, and applies feedback quickly

4. **Quality Focus** - Produces accurate, well-organized work products

---

## Development Areas

### Time Estimation

Chris sometimes underestimates how long tasks will take, leading to tight deadlines. We've discussed breaking work into smaller chunks and building in buffer time.

**Action Plan:** Angela will continue to check on progress mid-task for the next 60 days, gradually reducing oversight.

---

### System Expertise

Chris is proficient in core NetSuite functions but could deepen expertise in reporting and automation features.

**Action Plan:** Complete advanced NetSuite training by end of Q1 2025. Pair with Sarah Chen on one automation project.

---

### Broader Business Context

As a new analyst, Chris sometimes focuses on the numbers without fully understanding the business context.

**Action Plan:** Schedule shadow sessions with FP&A and department leads to understand how financial data connects to operations.

---

## Goals for Next Review Period (6-Month Review)

### Goal 1: Own Full Close Responsibilities
Take ownership of assigned close tasks with minimal oversight, including variance analysis and commentary.

### Goal 2: Complete Advanced Training
Complete advanced NetSuite training and one automation/workflow improvement project.

### Goal 3: Present to Leadership
Present at least one analysis to director-level or above audience.

### Goal 4: Support Budget Process
Actively contribute to the Q2 budget/forecast process for at least one department.

---

## Confirmation of Employment

Based on Chris's successful completion of the 90-day probationary period, I recommend confirming his employment as Financial Analyst.

**Manager Recommendation:** ✅ Confirm Employment

**HR Approval:** _________________ **Date:** _________

---

## Signatures

**Employee Signature:** _________________ **Date:** _________

*I have reviewed and discussed this evaluation with my manager.*

**Manager Signature:** _________________ **Date:** _________

---

*Next Review: 6-month review scheduled for February 2025*
`,
  },

  // ============================================
  // TRANSITIONS TEMPLATES (4)
  // ============================================
  {
    id: 'promotion-letter',
    name: 'Promotion Letter',
    category: 'transitions',
    description: 'Congratulatory letter with new role details',
    relatedSkills: ['hr-document-generator', 'career-progression-support'],
    content: `# Promotion Letter

**CONFIDENTIAL**

**Date:** November 15, 2024

**To:** Amanda Brooks
**From:** HR Department, Acme Corporation
**Subject:** Promotion to Director of Engineering

---

Dear Amanda,

Congratulations! It is with great pleasure that I inform you of your promotion to **Director of Engineering**, effective December 1, 2024.

This promotion is a recognition of your exceptional contributions to Acme Corporation over the past three years. Your leadership during the platform migration project, your commitment to developing talent on your team, and your consistent delivery of high-quality technical solutions have made you the clear choice for this role.

---

## New Role Details

| Field | Value |
|-------|-------|
| **New Title:** | Director of Engineering |
| **Previous Title:** | Senior Engineering Manager |
| **Department:** | Engineering |
| **Reporting To:** | CTO, Robert Hayes |
| **Effective Date:** | December 1, 2024 |

---

## Updated Compensation

| Component | Current | New |
|-----------|---------|-----|
| **Base Salary:** | $165,000/year | $195,000/year |
| **Bonus Target:** | 15% | 20% |
| **Equity Refresh:** | — | 15,000 options (4-year vest) |
| **Title Level:** | L6 | L7 |

Your updated compensation reflects both the increased scope of responsibility and your demonstrated performance.

---

## New Responsibilities

In your role as Director of Engineering, you will:

- Lead a team of 4 engineering managers and approximately 35 engineers
- Own the technical roadmap for the Platform and Infrastructure domains
- Partner with Product and Design leadership on company strategy
- Represent Engineering in executive leadership meetings
- Drive engineering excellence through hiring, development, and culture-building
- Manage a budget of approximately $5M annually

---

## Transition Plan

To ensure a smooth transition, we have outlined the following plan:

**November 15-30:**
- Complete current projects and begin handoff to your successor
- Shadow Robert in executive meetings
- Meet 1:1 with each of your new direct reports

**December 1-15:**
- Formally assume Director responsibilities
- Present 90-day plan to executive team
- Begin quarterly planning for Q1 2025

**December 16-31:**
- Lead first full team all-hands as Director
- Complete first cycle of 1:1s with all managers
- Finalize Q1 roadmap

---

## Resources & Support

To support your success in this new role, we are providing:

- **Executive Coaching:** 6 sessions with an external coach, starting January 2025
- **Leadership Development:** Enrollment in Director Leadership Program (Q1 2025)
- **Peer Network:** Introduction to Director peer group for mentorship and collaboration

---

## Next Steps

Please review this letter and confirm your acceptance by November 22, 2024. HR will process the compensation changes, and you will see the updated salary reflected in your December 15 paycheck.

We will make a formal announcement to the organization on November 25, 2024, unless you prefer a different timing.

---

Amanda, this promotion is well-deserved. Your technical expertise, leadership skills, and commitment to building an excellent engineering culture have been invaluable to our company. We are excited to see what you will accomplish in this new role.

Congratulations again!

Sincerely,

**Jennifer Walsh**
Chief People Officer
Acme Corporation

---

## Acceptance

I accept this promotion and the terms described in this letter.

**Signature:** _________________ **Date:** _________

cc: Robert Hayes (CTO), Personnel File
`,
  },

  {
    id: 'transfer-letter',
    name: 'Transfer Letter',
    category: 'transitions',
    description: 'Internal transfer notification',
    relatedSkills: ['hr-document-generator', 'career-progression-support'],
    content: `# Internal Transfer Letter

**Date:** November 15, 2024

**To:** Daniel Kim
**From:** HR Department, Acme Corporation
**Subject:** Internal Transfer to Customer Experience Team

---

Dear Daniel,

Following your request and discussions with both your current and future managers, we are pleased to confirm your internal transfer to the **Customer Experience team** as a **Senior Customer Success Manager**.

---

## Transfer Details

| Field | Current | New |
|-------|---------|-----|
| **Title:** | Senior Account Executive | Senior Customer Success Manager |
| **Department:** | Sales | Customer Experience |
| **Manager:** | Patricia Gomez | Michael Chen |
| **Location:** | San Francisco HQ | San Francisco HQ |
| **Effective Date:** | December 16, 2024 |

---

## Compensation

Your compensation will remain unchanged during this lateral transfer:

| Component | Value |
|-----------|-------|
| **Base Salary:** | $125,000/year |
| **Variable Compensation:** | 20% target (transitioning from commission to bonus structure) |
| **Benefits:** | No changes |
| **PTO Balance:** | Carries over in full |

**Note:** Your variable compensation will transition from a sales commission plan to a customer success bonus plan. Michael Chen will review the bonus structure details during your first week.

---

## Transition Timeline

### November 15-30: Preparation Phase
- Complete handoff documentation for current accounts
- Meet with Patricia to finalize transition plan for your book of business
- Introduction calls with Michael and CX team

### December 1-15: Transition Phase
- Shadow top CSM (Jennifer) for 3-5 days
- Complete Customer Success training modules
- Gradual handoff of sales accounts

### December 16: Official Transfer Date
- Join Customer Experience team
- Begin managing assigned customer portfolio
- Move to CX team workspace (4th floor)

---

## Handoff Responsibilities

Before your transfer date, please complete the following:

**Account Transition:**
- [ ] Document status of all active deals in Salesforce
- [ ] Introduce new account owners to key contacts
- [ ] Complete handoff meetings with replacement AE
- [ ] Transfer all relevant notes and materials

**Knowledge Transfer:**
- [ ] Record Loom videos for top 5 accounts
- [ ] Update CRM with latest activity notes
- [ ] Brief Patricia on any in-progress negotiations

---

## What to Expect in Your New Role

As a Senior Customer Success Manager, you will:

- Manage a portfolio of 25-30 mid-market accounts
- Own customer health, retention, and expansion
- Conduct Quarterly Business Reviews with customers
- Partner with Sales on expansion opportunities
- Contribute to customer success playbooks and processes

**Your sales experience is highly valuable in this role.** Your understanding of customer needs and relationship-building skills will translate well to customer success.

---

## Administrative Updates

**IT/Access:**
- Salesforce access will be updated to CSM role
- New Gainsight access will be provisioned
- Slack channel additions: #cx-team, #customer-health

**Facilities:**
- Desk assignment: 4th floor, CX team area
- Building access unchanged

**HR:**
- Manager change will be reflected in Workday by December 16
- Please update your LinkedIn profile after the announcement

---

## Announcement

We will announce your transfer to the broader organization on December 10, 2024, giving you time to personally inform key stakeholders beforehand.

---

Daniel, we are excited about your move to Customer Experience. Your account management skills, customer relationships, and passion for client success make you an excellent addition to the CX team. This transfer aligns well with your expressed career interests, and we believe you will thrive in this new role.

Please reach out to Michael Chen or HR with any questions.

Sincerely,

**Jennifer Walsh**
Chief People Officer
Acme Corporation

---

## Acknowledgment

I acknowledge and accept this internal transfer as described above.

**Signature:** _________________ **Date:** _________

cc: Patricia Gomez (Current Manager), Michael Chen (New Manager), Personnel File
`,
  },

  {
    id: 'termination-letter',
    name: 'Termination Letter',
    category: 'transitions',
    description: 'Employment separation notice',
    relatedSkills: ['offboarding-exit-builder', 'hr-document-generator'],
    content: `# Employment Termination Letter

**CONFIDENTIAL**

**Date:** November 15, 2024

**To:** [Employee Name]
**From:** HR Department, Acme Corporation
**Subject:** Termination of Employment

---

Dear [Employee Name],

This letter confirms that your employment with Acme Corporation is terminated effective **November 15, 2024**. Your last day of active work was today.

---

## Termination Details

| Field | Value |
|-------|-------|
| **Employee:** | [Employee Name] |
| **Employee ID:** | [ID] |
| **Department:** | [Department] |
| **Position:** | [Title] |
| **Hire Date:** | [Date] |
| **Termination Date:** | November 15, 2024 |
| **Reason:** | Position Elimination / Role Restructuring |

---

## Final Compensation

You will receive your final paycheck on the next regular pay date (November 30, 2024), which will include:

| Component | Amount |
|-----------|--------|
| **Salary through November 15:** | [Amount] |
| **Accrued, unused PTO:** | [X days = $X] |
| **Less standard deductions:** | [Amount] |
| **Net Final Pay:** | [Amount] |

---

## Severance Package

We are offering the following severance package, contingent upon signing the attached Separation Agreement and General Release:

| Component | Details |
|-----------|---------|
| **Severance Pay:** | [X] weeks of base salary ([Amount]) |
| **Health Insurance:** | COBRA coverage subsidized for 3 months |
| **Outplacement Services:** | 3 months career transition support |
| **Reference Letter:** | Neutral employment verification provided |

The Separation Agreement must be signed and returned by **December 2, 2024** (21 days from today) to receive severance benefits. You have 7 days after signing to revoke your acceptance.

---

## Benefits Continuation

### Health Insurance (COBRA)
You are eligible to continue your current health, dental, and vision coverage under COBRA. Detailed COBRA information will be mailed to your home address within 14 days. Subsidized coverage will apply for the first 3 months if you sign the Separation Agreement.

### 401(k) Retirement Plan
Your vested 401(k) balance remains yours. You will receive information from Fidelity regarding your options: leave funds in the plan, roll over to another qualified plan, or take a distribution.

### Other Benefits
- Life insurance and disability coverage end on November 30, 2024
- FSA claims for expenses incurred before termination must be submitted by March 1, 2025
- Employee Assistance Program (EAP) available through December 31, 2024

---

## Company Property Return

Please return all company property by **November 22, 2024**, including:

- [ ] Laptop and charger
- [ ] Company credit card
- [ ] Building access badge
- [ ] Parking pass
- [ ] Any company documents, files, or materials

A prepaid shipping label is enclosed for mailing equipment. Alternatively, property can be returned to the front desk during business hours.

---

## Final Steps

### Today (November 15):
- Collect personal belongings
- Return badge and credit card
- Complete exit interview with HR (optional)

### By November 22:
- Return laptop and remaining equipment
- Complete offboarding checklist (sent via email)

### By December 2:
- Return signed Separation Agreement (if accepting severance)

---

## Ongoing Obligations

Please remember that your obligations under the following agreements survive your employment:

- **Confidentiality Agreement** - signed [date]
- **Non-Solicitation Clause** - 12 months from termination date
- **Intellectual Property Agreement** - signed [date]

---

## Support Resources

**Outplacement Services:**
- Provider: Career Transitions, Inc.
- Contact: 1-800-XXX-XXXX
- Services include: Resume review, interview coaching, job search support

**Employee Assistance Program:**
- Available through December 31, 2024
- Contact: 1-800-XXX-XXXX
- Services include: Counseling, stress management, financial guidance

---

We genuinely appreciate your contributions to Acme Corporation during your time with us. We wish you success in your future endeavors.

If you have questions about this letter or the separation process, please contact [HR Contact Name] at [email] or [phone].

Sincerely,

**[HR Representative Name]**
Human Resources
Acme Corporation

---

## Acknowledgment

I acknowledge receipt of this termination letter and the information contained within.

**Signature:** _________________ **Date:** _________

*Note: Signing this acknowledgment does not constitute agreement with the decision or waiver of any rights.*

**Enclosures:**
- Separation Agreement and General Release
- COBRA Election Notice
- 401(k) Distribution Information
- Prepaid Shipping Label
`,
  },

  {
    id: 'resignation-acceptance',
    name: 'Resignation Acceptance',
    category: 'transitions',
    description: 'Acknowledging voluntary departure',
    relatedSkills: ['offboarding-exit-builder', 'hr-document-generator'],
    content: `# Resignation Acceptance Letter

**Date:** November 15, 2024

**To:** Taylor Rodriguez
**From:** Karen Miller, VP of Marketing
**Subject:** Acceptance of Resignation

---

Dear Taylor,

I am writing to confirm receipt and acceptance of your resignation letter dated November 13, 2024. We understand your decision to leave Acme Corporation, and while we are sorry to see you go, we wish you the very best in your future endeavors.

---

## Departure Details

| Field | Value |
|-------|-------|
| **Employee:** | Taylor Rodriguez |
| **Current Title:** | Senior Marketing Manager |
| **Department:** | Marketing |
| **Resignation Received:** | November 13, 2024 |
| **Last Working Day:** | November 29, 2024 |
| **Notice Period:** | 2 weeks |

---

## Transition Responsibilities

During your remaining two weeks, we would appreciate your assistance with the following:

### Knowledge Transfer
- Document current project status for ongoing campaigns
- Create handoff notes for the Q1 product launch campaign
- Record Loom walkthrough videos for recurring reporting processes
- Update the marketing playbook with any recent process changes

### Project Handoffs
| Project | Handoff To | Deadline |
|---------|------------|----------|
| Q4 Brand Campaign | Jessica Chen | Nov 22 |
| Partner Marketing Program | Marcus Williams | Nov 25 |
| Annual Report Design | Sara Kim | Nov 27 |
| Website Refresh | Miguel Torres | Nov 29 |

### Team Introductions
- Introduce Jessica to key vendor contacts
- Brief incoming team members on stakeholder relationships
- Attend handoff meeting with product marketing (scheduled Nov 25)

---

## Final Compensation & Benefits

### Final Paycheck
Your final paycheck, including salary through November 29, 2024, and any accrued, unused PTO, will be issued on the next regular pay date (December 15, 2024) via your normal payment method.

**Estimated Final Pay:**
| Component | Value |
|-----------|-------|
| Salary (through Nov 29) | [Amount] |
| Accrued PTO (12 days) | [Amount] |
| Less deductions | [Amount] |
| **Net Pay** | [Amount] |

### Benefits Continuation
- **Health Insurance:** Coverage ends November 30, 2024. COBRA information will be mailed within 14 days.
- **401(k):** Your vested balance remains yours. Fidelity will contact you with options.
- **Life/Disability:** Coverage ends November 30, 2024.

---

## Exit Process

### Exit Interview
We value your feedback and would appreciate your participation in an exit interview. HR will reach out to schedule a 30-minute conversation during your final week. This is voluntary and your feedback will be kept confidential.

### Return of Company Property
Please return the following items on or before your last day:

- [ ] Laptop and charger
- [ ] Building access badge
- [ ] Company credit card
- [ ] Parking pass
- [ ] Any company documents or materials

You may leave items with IT or at the front desk.

### Access & Accounts
- Email access will be disabled at 5:00 PM on November 29
- Slack access will be removed on November 29
- Please download any personal files before your last day
- Set up email auto-reply directing contacts to Jessica Chen

---

## References

We are happy to provide a positive reference for your future employment. Employment verification requests should be directed to HR at hr@acmecorp.com.

If you would like a personal reference, please let me know and I would be glad to speak to prospective employers about your contributions.

---

## Staying Connected

We'd love to keep in touch! Consider joining:

- **Acme Alumni LinkedIn Group** - [Link]
- **Quarterly Alumni Newsletter** - [Sign up link]

Many of our former employees have returned to Acme, and we would welcome the opportunity to work with you again in the future.

---

Taylor, it has been a genuine pleasure working with you over the past four years. Your creativity, leadership, and dedication to the marketing team have made a lasting impact. The brand campaign you led last year directly contributed to our 25% growth in brand awareness, and your mentorship of junior team members has strengthened our entire department.

You will be missed, and we wish you every success in your next chapter.

Sincerely,

**Karen Miller**
VP of Marketing
Acme Corporation

---

## Acknowledgment

I acknowledge receipt of this letter and confirm my last working day will be November 29, 2024.

**Signature:** _________________ **Date:** _________

cc: Human Resources, Personnel File
`,
  },

  // ============================================
  // COMPLIANCE TEMPLATES (3)
  // ============================================
  {
    id: 'written-warning',
    name: 'Written Warning',
    category: 'compliance',
    description: 'Formal disciplinary notice',
    relatedSkills: ['hr-document-generator', 'employee-relations-support'],
    content: `# Written Warning

**CONFIDENTIAL - Personnel Action**

**Date:** November 15, 2024

**To:** [Employee Name]
**From:** [Manager Name], [Title]
**Subject:** Formal Written Warning - [Issue Category]

---

## Employee Information

| Field | Value |
|-------|-------|
| **Employee:** | [Employee Name] |
| **Employee ID:** | [ID] |
| **Department:** | [Department] |
| **Position:** | [Title] |
| **Manager:** | [Manager Name] |
| **HR Representative:** | [HR Name] |

---

## Purpose

This is a formal Written Warning for [specific violation/issue]. This warning follows a verbal coaching conversation on [date] and represents the second step in our progressive discipline process.

---

## Description of Issue

### Policy Violation / Performance Issue

**Policy Reference:** [Company policy name and section, if applicable]

**Issue Description:**
[Clear, specific description of the violation or issue. Include dates, times, and specific examples.]

**Specific Incidents:**

| Date | Incident | Documentation |
|------|----------|---------------|
| [Date] | [Description of incident 1] | [Witness, email, etc.] |
| [Date] | [Description of incident 2] | [Evidence type] |
| [Date] | [Description of incident 3] | [Evidence type] |

---

### Impact

This behavior/performance has impacted the team and organization in the following ways:

- [Impact 1 - be specific about business impact]
- [Impact 2 - effect on team, customers, or operations]
- [Impact 3 - additional consequences]

---

## Prior Discussion

| Date | Type | Summary |
|------|------|---------|
| [Date] | Verbal Coaching | [Brief summary of discussion and expectations set] |
| [Date] | Follow-up Check-in | [What was discussed, any progress or continued concerns] |

Despite the above conversations, the concerning behavior has continued, necessitating this formal written warning.

---

## Expected Improvement

To maintain employment with Acme Corporation, you must immediately and consistently demonstrate the following:

### Immediate Requirements (Effective Today)
1. [Specific requirement 1 - clear, measurable]
2. [Specific requirement 2 - clear, measurable]
3. [Specific requirement 3 - clear, measurable]

### Ongoing Expectations
1. [Standard of conduct or performance expected going forward]
2. [How this will be measured or monitored]

---

## Support Provided

To assist you in meeting these expectations, we will provide:

- [Support item 1 - training, resources, equipment, etc.]
- [Support item 2 - check-in schedule, mentorship, etc.]
- [Support item 3 - any accommodations if applicable]

---

## Consequences

**Immediate Consequence:**
This Written Warning will be placed in your personnel file and will remain active for 12 months.

**Future Violations:**
If the behavior continues or recurs within the next 12 months, you will be subject to further disciplinary action, up to and including termination of employment.

**Monitoring Period:**
Your conduct/performance will be closely monitored for the next 90 days. We will have weekly check-ins for the first month and biweekly thereafter.

---

## Follow-Up Schedule

| Date | Meeting Type | Purpose |
|------|--------------|---------|
| [Date] | 1-week check-in | Review initial progress |
| [Date] | 2-week check-in | Assess continued compliance |
| [Date] | 30-day review | Formal progress assessment |
| [Date] | 60-day review | Continued monitoring |
| [Date] | 90-day review | End of monitoring period |

---

## Employee Response

You have the right to provide a written response to this warning within 5 business days. Your response will be attached to this document in your personnel file.

**Employee Comments (optional):**

_____________________________________________

_____________________________________________

_____________________________________________

---

## Acknowledgment

**By signing below, you acknowledge that:**
- You have received and read this Written Warning
- The expectations and consequences have been explained to you
- You understand that failure to improve may result in further discipline, up to and including termination
- Your signature does not necessarily indicate agreement with the contents

**Employee Signature:** _________________ **Date:** _________

**Manager Signature:** _________________ **Date:** _________

**HR Representative Signature:** _________________ **Date:** _________

---

*Distribution: Employee (copy), Personnel File (original), Manager (copy)*

*If you have questions about this warning or the process, please contact HR at [contact info].*
`,
  },

  {
    id: 'leave-approval',
    name: 'Leave Approval',
    category: 'compliance',
    description: 'FMLA or PTO approval documentation',
    relatedSkills: ['hr-document-generator', 'leave-management-support'],
    content: `# Leave of Absence Approval

**Date:** November 15, 2024

**To:** Michelle Thompson
**From:** HR Department, Acme Corporation
**Subject:** Approval of Family and Medical Leave (FMLA)

---

## Leave Summary

| Field | Value |
|-------|-------|
| **Employee:** | Michelle Thompson |
| **Employee ID:** | 10482 |
| **Department:** | Product Management |
| **Position:** | Senior Product Manager |
| **Manager:** | David Chen |
| **HR Representative:** | Lisa Martinez |

---

## Leave Details

| Component | Details |
|-----------|---------|
| **Leave Type:** | FMLA - Serious Health Condition (Personal) |
| **Leave Start Date:** | December 2, 2024 |
| **Expected Return Date:** | February 24, 2025 |
| **Leave Duration:** | 12 weeks (60 business days) |
| **Leave Schedule:** | Continuous |

---

## Approval Confirmation

Your request for Family and Medical Leave under the Family and Medical Leave Act (FMLA) has been **APPROVED**. This letter confirms the details of your leave and outlines your rights and responsibilities during this period.

---

## FMLA Entitlement Status

| Entitlement | Value |
|-------------|-------|
| **12-Month Period:** | Rolling 12 months (measured backward from leave start) |
| **Total FMLA Entitlement:** | 12 weeks (480 hours) |
| **FMLA Previously Used:** | 0 weeks |
| **FMLA Remaining After This Leave:** | 0 weeks |
| **Leave Counted Against FMLA:** | 12 weeks (this request) |

---

## Pay Status During Leave

### Paid Leave Usage (First 8 Weeks)

| Leave Type | Hours/Days | Pay Rate | Dates |
|------------|------------|----------|-------|
| Short-Term Disability | 8 weeks | 60% of salary | Dec 2 - Jan 24 |
| PTO Supplement | N/A | Tops up to 100% | Dec 2 - Jan 24 |

**Note:** You may elect to use accrued PTO to supplement STD payments to maintain 100% pay for the first 8 weeks.

### Unpaid Leave (Weeks 9-12)

| Dates | Status |
|-------|--------|
| January 27 - February 21, 2025 | Unpaid FMLA (4 weeks) |

You may use any remaining accrued PTO to cover unpaid weeks.

**Current PTO Balance:** 120 hours (15 days)

---

## Benefits During Leave

### Health Insurance
Your health, dental, and vision coverage will continue during your FMLA leave. Acme Corporation will continue paying the employer portion of premiums.

**Your Responsibility:**
- Continue paying your employee portion of premiums
- Current deduction: $125.50/pay period
- Deductions will continue from any paid leave payments
- For unpaid weeks, you will receive an invoice by mail

### Other Benefits

| Benefit | Status During Leave |
|---------|---------------------|
| 401(k) | Contributions pause; balance remains |
| Life Insurance | Continues (company-paid) |
| Disability Insurance | Continues |
| FSA | Contributions pause; funds available for eligible expenses |
| EAP | Fully available throughout leave |

---

## Your Responsibilities

### During Leave

1. **Maintain Contact:** Check in with Lisa Martinez (HR) every 2 weeks with a status update
2. **Medical Certification:** Submit updated medical certification if leave needs to be extended
3. **Return to Work:** Provide at least 2 days notice before returning, if earlier than expected
4. **Fitness for Duty:** Obtain a fitness-for-duty certification from your healthcare provider before returning

### Contact Information Updates
If your address, phone number, or email changes during leave, please notify HR immediately.

---

## Return to Work

### Expected Return Date: February 24, 2025

**Before Returning:**
- Submit Fitness for Duty certification to HR at least 3 days before your return date
- Coordinate with David Chen for transition back to your role
- Review any updates to policies or systems

**Job Protection:**
Under FMLA, you are entitled to return to the same position or an equivalent position with equivalent pay, benefits, and working conditions.

---

## Extension Requests

If you need to extend your leave beyond February 21, 2025:

1. Notify HR in writing at least 5 business days before your expected return date
2. Submit updated medical certification
3. HR will review and respond within 2 business days

Note: Extensions beyond your FMLA entitlement may be considered as a reasonable accommodation under the ADA, depending on circumstances.

---

## Contact Information

**During your leave, please direct questions to:**

| Topic | Contact | Email | Phone |
|-------|---------|-------|-------|
| FMLA/Leave Questions | Lisa Martinez | lisa.martinez@acmecorp.com | (555) 123-4567 |
| Benefits Questions | Benefits Team | benefits@acmecorp.com | (555) 123-4500 |
| Work/Project Updates | David Chen | david.chen@acmecorp.com | As needed |
| IT/System Access | IT Help Desk | helpdesk@acmecorp.com | (555) 123-4600 |

---

We hope your recovery goes smoothly, Michelle. Please don't hesitate to reach out if you have any questions.

Take care,

**Lisa Martinez**
HR Business Partner
Acme Corporation

---

## Acknowledgment

I acknowledge receipt of this leave approval letter and understand my rights and responsibilities during my FMLA leave.

**Signature:** _________________ **Date:** _________

**Attachments:**
- Fitness for Duty Certification Form
- Benefits Payment Schedule for Unpaid Period
- FMLA Rights & Responsibilities Notice
`,
  },

  {
    id: 'exit-interview-guide',
    name: 'Exit Interview Guide',
    category: 'compliance',
    description: 'Departure interview questions',
    relatedSkills: ['offboarding-exit-builder', 'hr-analytics-support'],
    content: `# Exit Interview Guide

## Interview Information

| Field | Value |
|-------|-------|
| **Departing Employee:** | Ryan Mitchell |
| **Current Position:** | Software Engineer II |
| **Department:** | Engineering |
| **Manager:** | Sarah Patel |
| **Tenure:** | 2 years, 4 months |
| **Last Day:** | November 29, 2024 |
| **Reason for Leaving:** | Voluntary - New Opportunity |
| **Interviewer:** | HR Business Partner |
| **Interview Date:** | November 22, 2024 |

---

## Interview Purpose & Guidelines

**Purpose:**
To gather candid feedback about Ryan's experience at Acme Corporation to help us:
- Understand factors contributing to voluntary turnover
- Identify opportunities to improve employee retention
- Ensure a positive offboarding experience

**Guidelines for Interviewer:**
- Create a comfortable, confidential environment
- Use open-ended questions and probe for specifics
- Listen without being defensive
- Take detailed notes
- Thank the employee for their honesty

**Confidentiality Statement:**
*"Everything you share today will be kept confidential. Your feedback will be summarized and themes will be shared with leadership, but your name will not be attached to specific comments unless you give permission."*

---

## Section 1: Decision to Leave

### Primary Question
**What led to your decision to leave Acme Corporation?**

*Probing questions:*
- Was there a specific event or was it a gradual decision?
- How long have you been considering leaving?
- What was the "tipping point"?

**Response:**

_____________________________________________

_____________________________________________

---

### Contributing Factors
**What factors contributed most to your decision?** *(Rate importance: High/Medium/Low/Not a factor)*

| Factor | Rating | Comments |
|--------|--------|----------|
| Compensation | | |
| Career growth opportunities | | |
| Relationship with manager | | |
| Work-life balance | | |
| Company culture | | |
| Benefits | | |
| Work content/projects | | |
| Remote work policy | | |
| Recognition | | |
| Other: ____________ | | |

---

### Alternative Offers
**Did you receive a counteroffer or were you offered anything to stay?**

[ ] Yes - what was offered? _____________
[ ] No - would anything have changed your mind? _____________

---

## Section 2: Manager & Team Experience

### Manager Relationship
**How would you describe your relationship with your direct manager?**

*Probing questions:*
- Did you feel supported in your role?
- How was communication with your manager?
- Did you receive regular feedback?
- Did you feel comfortable raising concerns?

**Response:**

_____________________________________________

---

### Team Dynamics
**How would you describe the team environment and collaboration?**

*Probing questions:*
- Did you feel like part of the team?
- How well did the team work together?
- Were there any challenges with team dynamics?

**Response:**

_____________________________________________

---

### Development & Growth
**Did you have opportunities for professional development and career growth?**

*Probing questions:*
- Were there clear paths for advancement?
- Did you have access to learning and development?
- Were your career goals discussed and supported?

**Response:**

_____________________________________________

---

## Section 3: Job & Work Environment

### Role Satisfaction
**How satisfied were you with your actual job responsibilities?**

*Probing questions:*
- Did the role match what was described when you were hired?
- Were you able to use your skills effectively?
- Did you have the resources you needed?

**Rating:** [ ] Very Satisfied  [ ] Satisfied  [ ] Neutral  [ ] Dissatisfied  [ ] Very Dissatisfied

**Comments:**

_____________________________________________

---

### Workload & Balance
**How would you describe your workload and work-life balance?**

*Probing questions:*
- Was the workload manageable?
- Did you feel pressure to work outside normal hours?
- How was your stress level?

**Response:**

_____________________________________________

---

### Tools & Resources
**Did you have the tools, resources, and information needed to do your job effectively?**

[ ] Yes, always
[ ] Usually
[ ] Sometimes
[ ] Rarely

**What was missing or could be improved?**

_____________________________________________

---

## Section 4: Company Culture & Leadership

### Company Culture
**How would you describe the company culture at Acme Corporation?**

*Probing questions:*
- Did the actual culture match what was presented during hiring?
- What aspects of culture did you appreciate?
- What aspects would you change?

**Response:**

_____________________________________________

---

### Leadership & Communication
**How effectively did company leadership communicate and demonstrate values?**

*Probing questions:*
- Did you feel informed about company direction?
- Did you trust leadership?
- Were company values lived, not just stated?

**Response:**

_____________________________________________

---

### Diversity & Inclusion
**Did you feel the company was genuinely committed to diversity and inclusion?**

[ ] Strongly Agree  [ ] Agree  [ ] Neutral  [ ] Disagree  [ ] Strongly Disagree

**Comments:**

_____________________________________________

---

## Section 5: Feedback & Recommendations

### What Worked Well
**What did Acme Corporation do well as an employer? What should we keep doing?**

1. _____________________________________________

2. _____________________________________________

3. _____________________________________________

---

### Areas for Improvement
**What could Acme Corporation improve to be a better place to work?**

1. _____________________________________________

2. _____________________________________________

3. _____________________________________________

---

### Advice for Leadership
**If you could give one piece of advice to company leadership, what would it be?**

_____________________________________________

_____________________________________________

---

### Recommend as Employer
**Would you recommend Acme Corporation as a place to work?**

[ ] Definitely Yes  [ ] Probably Yes  [ ] Unsure  [ ] Probably No  [ ] Definitely No

**Why or why not?**

_____________________________________________

---

### Return to Company
**Would you consider returning to Acme Corporation in the future?**

[ ] Yes, under any circumstances
[ ] Yes, if things changed
[ ] Unlikely
[ ] No

**What would need to change?**

_____________________________________________

---

## Closing

**Is there anything else you'd like to share that we haven't covered?**

_____________________________________________

_____________________________________________

---

*Thank you for taking the time to share your feedback. Your insights will help us improve the experience for current and future employees. We wish you all the best in your next role.*

---

## HR Summary (Internal Use Only)

**Key Takeaways:**

1. _____________________________________________

2. _____________________________________________

3. _____________________________________________

**Risk Factors Identified:**
[ ] Manager relationship  [ ] Compensation  [ ] Career growth
[ ] Work-life balance  [ ] Culture  [ ] Other: _____________

**Recommended Actions:**

_____________________________________________

**Follow-up Required:** [ ] Yes  [ ] No

If yes, with whom and about what?

_____________________________________________

**Interviewer Signature:** _________________ **Date:** _________
`,
  },

  // ============================================
  // ONBOARDING TEMPLATES (3)
  // ============================================
  {
    id: 'onboarding-checklist',
    name: 'Onboarding Checklist',
    category: 'onboarding',
    description: 'First week and month task list',
    relatedSkills: ['onboarding-program-builder'],
    content: `# New Hire Onboarding Checklist

## Employee Information

| Field | Value |
|-------|-------|
| **New Hire:** | Jordan Lee |
| **Position:** | Marketing Coordinator |
| **Department:** | Marketing |
| **Manager:** | Patricia Gomez |
| **Start Date:** | December 2, 2024 |
| **Onboarding Buddy:** | Marcus Williams |
| **HR Contact:** | Lisa Martinez |

---

## Before Start Date (Pre-boarding)

### HR & Administrative

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Send offer letter and receive signed copy | HR | Nov 8 | ✅ |
| Complete background check | HR | Nov 15 | ✅ |
| Verify I-9 documentation | HR | Nov 22 | ⏳ |
| Set up payroll and direct deposit | HR | Nov 25 | ⏳ |
| Add to benefits enrollment system | HR | Nov 25 | ⏳ |
| Create employee record in HRIS | HR | Nov 25 | ⏳ |
| Assign employee ID number | HR | Nov 25 | ⏳ |
| Send welcome email with first-day details | HR | Nov 27 | ⬜ |

### IT & Equipment

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Order laptop and equipment | IT | Nov 15 | ✅ |
| Create email account | IT | Nov 27 | ⬜ |
| Set up Slack account | IT | Nov 27 | ⬜ |
| Create accounts for marketing tools (HubSpot, Canva) | IT | Nov 29 | ⬜ |
| Provision VPN access | IT | Nov 29 | ⬜ |
| Prepare building access badge | Facilities | Nov 29 | ⬜ |

### Manager Preparation

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Prepare 30-60-90 day plan | Patricia | Nov 27 | ⬜ |
| Assign onboarding buddy | Patricia | Nov 20 | ✅ |
| Schedule first-week meetings | Patricia | Nov 27 | ⬜ |
| Prepare desk/workspace | Patricia | Nov 29 | ⬜ |
| Create Slack channel introductions | Marcus | Dec 2 | ⬜ |

---

## Day 1: Welcome & Orientation

### Morning (9:00 AM - 12:00 PM)

| Time | Activity | Owner | Location | Status |
|------|----------|-------|----------|--------|
| 9:00 | Greet at reception, building tour | Patricia | Lobby | ⬜ |
| 9:30 | Desk setup, equipment overview | IT | Desk | ⬜ |
| 10:00 | HR orientation (paperwork, policies, benefits) | Lisa | HR Office | ⬜ |
| 11:00 | IT setup (email, Slack, passwords) | IT | Desk | ⬜ |
| 11:30 | Meet with onboarding buddy | Marcus | Cafe | ⬜ |

### Afternoon (12:00 PM - 5:00 PM)

| Time | Activity | Owner | Location | Status |
|------|----------|-------|----------|--------|
| 12:00 | Team welcome lunch | Marketing Team | Conference Room | ⬜ |
| 1:00 | Manager 1:1: Role overview, 90-day plan | Patricia | Patricia's Office | ⬜ |
| 2:30 | Department overview presentation | Patricia | Conference Room | ⬜ |
| 3:30 | Self-paced: Complete required training modules | Jordan | Desk | ⬜ |
| 4:30 | End of day check-in with buddy | Marcus | Desk | ⬜ |

---

## Week 1: Foundation

### Required Training (Complete by End of Week 1)

| Training Module | Duration | Status |
|-----------------|----------|--------|
| Security Awareness | 45 min | ⬜ |
| Harassment Prevention | 60 min | ⬜ |
| Code of Conduct | 30 min | ⬜ |
| Data Privacy | 30 min | ⬜ |
| Emergency Procedures | 15 min | ⬜ |

### Key Meetings

| Meeting | With | Purpose | Scheduled |
|---------|------|---------|-----------|
| Daily check-in | Patricia | Progress review | Mon-Fri 9:00 AM |
| Team standup | Marketing Team | Daily sync | Mon-Fri 10:00 AM |
| HR benefits enrollment | Lisa | Complete enrollment | Wed 2:00 PM |
| Cross-functional intro | Sales Lead | Understand sales/marketing partnership | Thu 11:00 AM |
| Week 1 recap | Patricia | Feedback and Week 2 planning | Fri 4:00 PM |

### Week 1 Tasks

| Task | Due | Status |
|------|-----|--------|
| Complete all required training | Dec 6 | ⬜ |
| Set up all software accounts | Dec 4 | ⬜ |
| Read marketing team wiki/documentation | Dec 6 | ⬜ |
| Complete benefits enrollment | Dec 6 | ⬜ |
| Submit I-9 documentation | Dec 4 | ⬜ |
| Meet all marketing team members | Dec 6 | ⬜ |

---

## Week 2-4: Learning & Integration

### Week 2 Focus: Tools & Processes

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Complete HubSpot training | Jordan | Dec 13 | ⬜ |
| Shadow team member on current campaign | Marcus | Dec 11 | ⬜ |
| Review brand guidelines | Jordan | Dec 10 | ⬜ |
| Attend marketing planning meeting | Jordan | Dec 12 | ⬜ |
| Complete first small project (assigned by Patricia) | Jordan | Dec 13 | ⬜ |

### Week 3 Focus: Building Relationships

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Meet with product team lead | Jordan | Dec 18 | ⬜ |
| Meet with sales team lead | Jordan | Dec 19 | ⬜ |
| Attend all-hands meeting | Jordan | Dec 17 | ⬜ |
| Complete stakeholder coffee chats (3) | Jordan | Dec 20 | ⬜ |

### Week 4 Focus: Contributing

| Task | Owner | Due | Status |
|------|-------|-----|--------|
| Take ownership of first ongoing project | Jordan | Dec 27 | ⬜ |
| Present 30-day reflections to manager | Jordan | Dec 30 | ⬜ |
| Draft 60-day goals with manager | Jordan + Patricia | Dec 30 | ⬜ |

---

## 30-Day Checkpoint

**Review Meeting:** December 30, 2024 with Patricia Gomez

### Assessment Areas

| Area | Rating | Comments |
|------|--------|----------|
| Role Understanding | ☐ On Track  ☐ Needs Support | |
| Tool Proficiency | ☐ On Track  ☐ Needs Support | |
| Team Integration | ☐ On Track  ☐ Needs Support | |
| Initial Contributions | ☐ On Track  ☐ Needs Support | |

### Questions for New Hire

1. What has been going well so far?
2. What has been challenging?
3. What additional support do you need?
4. Do you have clear goals for the next 30 days?
5. Any concerns or questions?

---

## 60-Day & 90-Day Milestones

### 60-Day Goals

| Goal | Success Metric | Status |
|------|----------------|--------|
| Own 2 marketing campaigns end-to-end | Campaigns launched | ⬜ |
| Establish working rhythm with key stakeholders | Positive feedback | ⬜ |
| Complete all role-specific training | Certifications done | ⬜ |

### 90-Day Goals

| Goal | Success Metric | Status |
|------|----------------|--------|
| Contribute to quarterly planning | Proposals submitted | ⬜ |
| Demonstrate role proficiency | Manager assessment | ⬜ |
| Complete 90-day review | Review completed | ⬜ |

---

## Resources & Contacts

### Key Contacts

| Role | Name | Contact | Purpose |
|------|------|---------|---------|
| Manager | Patricia Gomez | patricia@acmecorp.com | Day-to-day guidance |
| Onboarding Buddy | Marcus Williams | marcus@acmecorp.com | Informal support |
| HR Contact | Lisa Martinez | lisa@acmecorp.com | HR questions |
| IT Help Desk | Help Desk | helpdesk@acmecorp.com | Tech issues |

### Useful Links

- Employee Handbook: [link]
- Marketing Team Wiki: [link]
- Brand Guidelines: [link]
- Benefits Portal: [link]
- Learning Platform: [link]

---

**Onboarding Checklist Completed:** _________________ **Date:** _________

**Manager Signature:** _________________ **Date:** _________
`,
  },

  {
    id: 'welcome-letter',
    name: 'Welcome Letter',
    category: 'onboarding',
    description: 'New hire welcome message',
    relatedSkills: ['onboarding-program-builder', 'hr-document-generator'],
    content: `# Welcome to Acme Corporation!

**Date:** November 27, 2024

**Dear Jordan,**

On behalf of everyone at Acme Corporation, welcome to the team! We are thrilled that you have accepted the Marketing Coordinator position and can't wait to have you join us on December 2nd.

---

## Your First Day

**Date:** Monday, December 2, 2024
**Arrival Time:** 9:00 AM
**Location:** Acme Corporation Headquarters
123 Innovation Drive, San Francisco, CA 94105

**What to bring:**
- Government-issued photo ID (for I-9 verification)
- Social Security card or other acceptable I-9 documents
- Voided check or bank information for direct deposit setup
- Any questions you've been saving up!

**Dress code:** Business casual. Most people wear jeans and nice shirts on regular days. We're a pretty relaxed bunch.

---

## Your First Day Schedule

| Time | Activity | Location |
|------|----------|----------|
| 9:00 AM | Arrival & Welcome | Main Lobby (Patricia will greet you) |
| 9:30 AM | Desk setup & IT orientation | 3rd Floor, Marketing Area |
| 10:00 AM | HR Orientation | HR Office |
| 11:30 AM | Coffee with your buddy, Marcus | Kitchen area |
| 12:00 PM | Team welcome lunch | Conference Room B |
| 1:00 PM | 1:1 with Patricia | Patricia's office |
| 2:30 PM | Department overview | Conference Room B |
| 3:30 PM | Complete online training | Your desk |
| 4:30 PM | End of day wrap-up | With Marcus |

---

## Meet Your Team

You'll be joining the Marketing team, a group of 8 creative, collaborative professionals who are genuinely excited to work with you.

**Your Manager: Patricia Gomez, Marketing Director**
Patricia has been with Acme for 5 years and leads all marketing initiatives. She's known for her strategic thinking, mentorship, and excellent taste in coffee.

**Your Onboarding Buddy: Marcus Williams, Marketing Specialist**
Marcus joined us 18 months ago and remembers what it's like to be new. He'll be your go-to person for questions about everything from where to find the best lunch spots to how our marketing tech stack works.

**The Team:**
- Jessica Chen, Content Marketing Manager
- David Park, Digital Marketing Specialist
- Sara Thompson, Brand Designer
- Miguel Torres, Marketing Analyst
- And a few more friendly faces you'll meet!

---

## What We're Working On

Right now, the marketing team is focused on some exciting initiatives:

- **Q1 Product Launch Campaign** - You'll have a chance to contribute to this major campaign
- **Brand Refresh** - We're updating our visual identity
- **Customer Advocacy Program** - Building a community of brand champions
- **Marketing Automation** - Optimizing our HubSpot workflows

We can't wait to get your fresh perspective on these projects!

---

## Before You Arrive

To make your first week smoother, you might want to:

**Get familiar with who we are:**
- Check out our website: www.acmecorp.com
- Follow us on LinkedIn and Twitter
- Read our recent press releases in the News section

**Prepare your questions:**
- What would you like to learn about in your first month?
- What are you most excited about?
- What support do you need to succeed?

**Relax:**
- We know starting a new job can be overwhelming
- We've designed your first week to be welcoming, not stressful
- There's no expectation that you'll know everything on Day 1 (or Day 30!)

---

## Practical Information

**Building Access:**
Your access badge will be ready when you arrive. Patricia will give you a tour of the building, including coffee machines (critical!), restrooms, and meeting rooms.

**Parking:**
We have a parking garage at 125 Innovation Drive. Your badge will work for the garage after Day 1. For your first day, there's visitor parking at the front entrance.

**Lunch:**
We have a cafeteria on the 2nd floor with good options, plus plenty of restaurants within walking distance. The team usually eats together on Mondays.

**Questions before you start?**
Contact Lisa Martinez in HR: lisa.martinez@acmecorp.com or (555) 123-4567

---

## A Note From Your Manager

*"Jordan, I'm really excited to have you join our team. When we met during the interviews, your creativity and enthusiasm stood out immediately. The marketing team is a supportive, collaborative group, and I know you'll fit right in.*

*Don't worry about hitting the ground running on Day 1. Your first few weeks are about learning, asking questions, and getting to know us. We'll have plenty of time to ramp you up on projects.*

*See you on Monday!"*

— Patricia

---

## Our Culture in a Nutshell

**We value:**
- **Collaboration** - The best ideas come from diverse perspectives
- **Curiosity** - Keep learning, keep asking why
- **Ownership** - Take initiative and see things through
- **Balance** - Do great work and have a life outside of it
- **Fun** - We take our work seriously, but not ourselves

**Some traditions you'll experience:**
- Monday marketing team standup (with snacks!)
- Monthly all-hands with pizza
- Quarterly team outings
- Friday afternoon "wins of the week" Slack thread
- The legendary annual holiday party

---

## Quick Links

Once your accounts are set up, bookmark these:

- **Employee Portal:** [link]
- **Benefits Information:** [link]
- **Learning Platform:** [link]
- **IT Help Desk:** helpdesk@acmecorp.com
- **Marketing Team Wiki:** [link]

---

Jordan, we are genuinely excited to welcome you to Acme Corporation. This is a special place with talented, kind people who care about what they do. We believe you're going to do amazing things here.

If you have any questions before Monday, please don't hesitate to reach out.

See you soon!

**The Acme Corporation Team**

---

*P.S. We almost forgot—we have a tradition of welcoming new team members with their favorite coffee drink on their first morning. What's yours? Email Patricia or Marcus and we'll have it waiting!*
`,
  },

  {
    id: 'benefits-summary',
    name: 'Benefits Summary',
    category: 'onboarding',
    description: 'Overview of available employee benefits',
    relatedSkills: ['onboarding-program-builder', 'benefits-administration'],
    content: `# Employee Benefits Summary

## Acme Corporation Benefits Guide 2025

**Prepared for:** New Hires
**Benefits Effective Date:** First of the month following hire date
**Enrollment Deadline:** Within 30 days of hire date

---

## Benefits at a Glance

| Benefit Category | Highlights |
|------------------|------------|
| Medical Insurance | 3 plan options, 80-90% company paid |
| Dental Insurance | 100% preventive coverage |
| Vision Insurance | Annual exam + frames/contacts allowance |
| 401(k) Retirement | 4% company match, immediate vesting |
| Paid Time Off | 20 days PTO + 10 holidays |
| Parental Leave | 16 weeks paid (all parents) |
| Life Insurance | 2x salary (company-paid) |
| Disability | Short-term and long-term coverage |
| Wellness | $1,500 annual wellness stipend |
| Professional Development | $2,500 annual learning budget |

---

## Medical Insurance

### Plan Options

| Plan | Premium (Employee) | Premium (Family) | Deductible | Out-of-Pocket Max |
|------|-------------------|------------------|------------|-------------------|
| **PPO Gold** | $75/month | $275/month | $500 | $3,000 |
| **PPO Silver** | $50/month | $200/month | $1,000 | $5,000 |
| **HDHP + HSA** | $25/month | $100/month | $2,000 | $6,000 |

**Company Contribution:** Acme pays 80-90% of premiums across all plans.

### What's Covered

- Preventive care: 100% covered (no deductible)
- Primary care visits: $20-$30 copay (PPO) or subject to deductible (HDHP)
- Specialist visits: $40-$50 copay (PPO) or subject to deductible (HDHP)
- Prescription drugs: Tiered copays ($10/$30/$50)
- Mental health: Parity with medical (same copays)
- Telehealth: $0 copay for virtual visits

### Health Savings Account (HSA)

Available with HDHP plan only:
- **Company Contribution:** $750/year (individual) or $1,500/year (family)
- **Employee Contribution Limit:** Up to IRS maximum
- **Triple Tax Advantage:** Pre-tax in, tax-free growth, tax-free for medical expenses
- Funds roll over year to year and are yours forever

---

## Dental Insurance

**Plan:** Delta Dental PPO

| Coverage | In-Network | Out-of-Network |
|----------|------------|----------------|
| Preventive (cleanings, exams) | 100% | 80% |
| Basic (fillings, extractions) | 80% | 60% |
| Major (crowns, bridges) | 50% | 40% |
| Orthodontia (adults & children) | 50% up to $2,000 lifetime | 50% up to $1,500 lifetime |

**Annual Maximum:** $2,000
**Employee Premium:** $10/month (individual), $30/month (family)

---

## Vision Insurance

**Plan:** VSP Vision Care

| Coverage | In-Network Benefit |
|----------|-------------------|
| Eye Exam | $10 copay, once per year |
| Frames | $200 allowance, once per year |
| Lenses | $25 copay, once per year |
| Contact Lenses | $200 allowance (in lieu of glasses) |
| Laser Surgery | 15% discount at participating providers |

**Employee Premium:** $5/month (individual), $15/month (family)

---

## 401(k) Retirement Plan

**Eligibility:** Immediately upon hire

| Feature | Details |
|---------|---------|
| **Company Match** | 100% match on first 4% of salary |
| **Vesting** | Immediate vesting on all contributions |
| **Contribution Limit** | IRS maximum ($23,000 in 2024, $30,500 if 50+) |
| **Investment Options** | 20+ funds including target-date, index, and managed |
| **Roth 401(k)** | Available as alternative to traditional |
| **Auto-Enrollment** | 6% default (can change anytime) |
| **Auto-Escalation** | 1% annual increase (opt-out available) |

**Provider:** Fidelity Investments
**Financial Wellness:** Free 1:1 sessions with Fidelity advisor

---

## Paid Time Off (PTO)

### PTO Accrual

| Tenure | Annual PTO | Max Accrual |
|--------|-----------|-------------|
| Year 1-2 | 20 days | 30 days |
| Year 3-5 | 25 days | 35 days |
| Year 6+ | 30 days | 40 days |

**Accrual Method:** PTO accrues each pay period
**Unused PTO:** Up to 5 days can be carried over to next year

### Company Holidays (10 days)

| Holiday | 2025 Date |
|---------|-----------|
| New Year's Day | January 1 |
| MLK Jr. Day | January 20 |
| Presidents Day | February 17 |
| Memorial Day | May 26 |
| Independence Day | July 4 |
| Labor Day | September 1 |
| Thanksgiving | November 27-28 |
| Winter Break | December 24-26 |
| New Year's Eve | December 31 |

### Other Leave Types

| Leave Type | Duration | Pay Status |
|------------|----------|------------|
| Sick Leave | As needed | Paid |
| Bereavement | 5 days (immediate family) | Paid |
| Jury Duty | As required | Paid |
| Voting | 2 hours | Paid |

---

## Parental Leave

**Acme offers generous parental leave for all parents:**

| Parent Type | Duration | Pay |
|-------------|----------|-----|
| Birth Parent | 16 weeks | 100% |
| Non-Birth Parent | 12 weeks | 100% |
| Adoption/Foster | 12 weeks | 100% |

**Additional Support:**
- Gradual return-to-work option (part-time for 2 weeks)
- Lactation rooms available
- Dependent care FSA available
- Backup childcare benefit (10 days/year)

---

## Life & Disability Insurance

### Life Insurance (Company-Paid)

| Coverage | Details |
|----------|---------|
| Basic Life | 2x annual salary (up to $500,000) |
| AD&D | 2x annual salary (same as life) |
| Supplemental Life | Available at group rates (optional) |
| Spouse/Dependent Life | Available (optional) |

### Disability Insurance

| Coverage | Waiting Period | Duration | Benefit |
|----------|---------------|----------|---------|
| Short-Term Disability | 7 days | Up to 12 weeks | 60% of salary |
| Long-Term Disability | 12 weeks | To age 65 | 60% of salary |

**Note:** STD and LTD are company-paid.

---

## Wellness Benefits

### Wellness Stipend: $1,500/year

Use for any wellness-related expense:
- Gym memberships
- Fitness classes or equipment
- Mental health apps (Calm, Headspace)
- Nutrition counseling
- Massage or physical therapy
- Sports leagues or recreation

**Reimbursement:** Submit receipts through Expensify

### Employee Assistance Program (EAP)

Free, confidential support for:
- Counseling (up to 8 sessions)
- Legal consultations
- Financial planning
- Work-life resources (childcare, elder care)
- Crisis support (24/7)

**Provider:** ComPsych
**Access:** 1-800-XXX-XXXX or online portal

### Other Wellness Perks

- Standing desks provided upon request
- Healthy snacks and drinks in office
- On-site flu shots
- Meditation room available
- Monthly wellness workshops

---

## Professional Development

### Learning Budget: $2,500/year

Use for:
- Online courses and certifications
- Conferences and workshops
- Books and learning materials
- Professional memberships

### Internal Development

- LinkedIn Learning access (free)
- Manager training programs
- Leadership development cohorts
- Cross-functional projects

---

## Additional Benefits

### Commuter Benefits
- Pre-tax transit and parking
- $150/month company contribution

### Employee Referral Program
- $2,500 bonus for successful hires

### Employee Discounts
- AT&T/Verizon: 15% off
- Gyms: Various partnerships
- Tech: Apple, Dell discounts
- Travel: Hotel and car rental discounts

### Flexible Work
- Hybrid schedule (3 days in office)
- Remote work Wednesdays and Fridays
- Flexible hours (core hours 10 AM - 4 PM)

---

## How to Enroll

### Enrollment Deadline: Within 30 days of hire date

**Steps:**
1. Log in to benefits portal: benefits.acmecorp.com
2. Review plan details and comparison tools
3. Add dependents (if applicable)
4. Upload required documents
5. Confirm elections

**Need Help?**
- Benefits email: benefits@acmecorp.com
- Benefits hotline: (555) 123-4500
- 1:1 enrollment session: Schedule with Lisa Martinez

---

## Important Contacts

| Resource | Contact |
|----------|---------|
| Benefits Questions | benefits@acmecorp.com |
| Medical Claims | Anthem: 1-800-XXX-XXXX |
| Dental Claims | Delta Dental: 1-800-XXX-XXXX |
| Vision Claims | VSP: 1-800-XXX-XXXX |
| 401(k) | Fidelity: 1-800-XXX-XXXX |
| EAP | ComPsych: 1-800-XXX-XXXX |
| Leave of Absence | Lisa Martinez, HR |

---

*This summary is for informational purposes. Please refer to plan documents for complete details. In the event of a discrepancy, the official plan documents govern.*

**Last Updated:** November 2024
`,
  },
];

// Helper functions
export function getTemplateById(id: string): HRTemplate | undefined {
  return HR_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): HRTemplate[] {
  return HR_TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): HRTemplate[] {
  const lowerQuery = query.toLowerCase();
  return HR_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
  );
}

export function getTemplateForSkill(skillName: string): HRTemplate | undefined {
  return HR_TEMPLATES.find((t) =>
    t.relatedSkills.some((s) => s.toLowerCase().includes(skillName.toLowerCase()))
  );
}
