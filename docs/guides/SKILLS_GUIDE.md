# Skills Guide

Comprehensive guide to the 25 HR skills in the platform, including usage patterns, maintenance guidelines, and development workflows.

**Last Updated:** 2025-11-11
**Status:** 25 Active Skills (Optimized)

---

## Table of Contents

1. [Overview](#overview)
2. [How Skills Work](#how-skills-work)
3. [Skill Catalog](#skill-catalog)
4. [Development Guide](#development-guide)
5. [Maintenance](#maintenance)
6. [Best Practices](#best-practices)

---

## Overview

The HR Command Center includes **25 specialized skills** that provide domain-specific expertise across 8 core HR workflows. Skills are automatically detected based on user queries and provide:

- **Domain expertise** via SKILL.md prompts
- **Reference materials** (templates, playbooks, frameworks)
- **Workflow integration** via pattern matching

**Architecture:**
```
User Query → Workflow Detection → Skill Loading → AI Response with Domain Context
```

---

## How Skills Work

### 1. Automatic Detection

Skills are detected automatically based on keywords in user messages:

**Example:**
```
User: "Help me create a job description for a senior engineer"
→ Detected workflow: HIRING
→ Loaded skill: job-description-writer
→ Claude responds with JD expertise + templates
```

**Detection happens in:** `/webapp/app/api/chat/route.ts:60-150`

---

### 2. Skill Structure

Each skill directory contains:

```
/skills/my-skill/
├── SKILL.md                 # Core instructions for Claude (required)
└── references/              # Supporting materials (optional)
    ├── template-1.md
    ├── playbook-2.md
    └── framework-3.md
```

**SKILL.md format:**
```markdown
---
name: my-skill
description: Brief description of what this skill does
---

# Expert Instructions

You are an expert in [domain]. When helping users with [task]:

1. Understand their specific need
2. Ask clarifying questions if needed
3. Provide actionable guidance
4. Reference templates from /references/ when applicable

## Key Principles

- Principle 1
- Principle 2

## Common Tasks

### Task 1: [Description]
[Instructions...]

### Task 2: [Description]
[Instructions...]
```

---

### 3. Reference Files

Reference files provide:
- **Templates** - Ready-to-use documents (offer letters, PIPs, job descriptions)
- **Playbooks** - Step-by-step guides (onboarding processes, ER investigations)
- **Frameworks** - Structured approaches (comp band design, survey analysis)
- **Examples** - Real-world samples for guidance

**Best practices:**
- Keep individual files <1,000 lines
- Use clear section headers for navigation
- Include real examples, not just descriptions
- Consolidate if >4 files per skill

---

## Skill Catalog

### By Workflow

#### 🎯 Hiring (4 skills)

**job-description-writer** (64KB, 4 refs)
- Creates compelling, legally compliant job descriptions
- Templates: IC roles, manager roles, executive roles
- Includes: Requirements, responsibilities, qualifications

**interview-guide-creator** (24KB, 1 ref)
- Develops structured interview guides
- Scorecards, behavioral questions, evaluation criteria
- Reduces bias, improves candidate experience

**headcount-planner** (20KB, 1 ref)
- Plans headcount needs and hiring pipelines
- Forecasting, budget planning, growth scenarios
- Integrates with analytics for data-driven decisions

**hr-document-generator** (36KB, 3 refs)
- Multi-workflow document generation
- Offer letters, PIPs, termination docs, policies
- Ensures legal compliance and consistency

---

#### 📊 Performance (8 skills)

**pip-builder-monitor** (108KB, 4 refs)
- Creates and monitors Performance Improvement Plans
- Templates, legal compliance, progress tracking
- Manager coaching on PIP execution

**one-on-one-guide** (36KB, 2 refs)
- Frameworks for effective 1:1 meetings
- Agendas, coaching techniques, feedback delivery
- Builds manager-employee relationships

**manager-effectiveness-coach** (96KB, 4 refs)
- Coaching for manager development
- Leadership competencies, difficult conversations
- Manager training programs

**recognition-rewards-manager** (72KB, 1 ref)
- Recognition programs and reward systems
- Peer recognition, milestone rewards, values awards
- **Consolidated Nov 2025:** 4 files → 1 comprehensive playbook

**performance-insights-analyst** (36KB, 1 ref)
- Synthesizes performance review data
- Identifies trends, calibration support
- 360 feedback analysis

**skills-gap-analyzer** (60KB, 4 refs)
- Identifies skill gaps and training needs
- Competency frameworks, development plans
- Learning recommendations

**career-path-planner** (72KB, 4 refs)
- Develops career progression frameworks
- Career ladders, promotion criteria
- Internal mobility programs

**lnd-program-designer** (100KB, 4 refs)
- Designs learning and development programs
- Training curriculums, onboarding programs
- ROI measurement and vendor selection

---

#### 🤝 Employee Relations (3 skills)

**employee-relations-case-manager** (108KB, 4 refs)
- Manages ER cases and investigations
- Documentation, legal compliance, remediation
- Harassment, discrimination, policy violations

**benefits-leave-coordinator** (90KB, 2 refs)
- Life events, leave policies, benefits administration
- **Consolidated Nov 2025:** 4 files → 2 logical groups
  - Life events + leave policies
  - Benefits enrollment + return-to-work

**policy-lifecycle-manager** (96KB, 4 refs)
- Creates and maintains HR policies
- Policy templates, compliance requirements
- Communication and rollout strategies

---

#### 🚪 Offboarding (3 skills)

**offboarding-exit-builder** (64KB, 4 refs)
- Exit processes and knowledge transfer
- Exit interviews, transition planning
- Alumni networks and boomerang programs

**workforce-reduction-planner** (104KB, 4 refs)
- Plans and executes RIFs with compliance
- Legal requirements (WARN Act), severance
- Communication strategies, survivor support

**corporate-communications-strategist** (80KB, 4 refs)
- Manages sensitive communications
- RIFs, reorganizations, policy changes
- Stakeholder mapping, message development

---

#### 💰 Compensation (2 skills)

**comp-band-designer** (68KB, 4 refs)
- Creates salary bands and comp frameworks
- Market data analysis, pay equity
- Band structures and leveling

**compensation-review-cycle-manager** (88KB, 4 refs)
- Manages annual merit/promotion cycles
- Budget allocation, calibration
- Manager training on comp conversations

---

#### 📈 Analytics (2 skills)

**hr-metrics-analyst** (28KB, 2 refs)
- Analyzes HR metrics and creates dashboards
- Turnover, headcount, diversity metrics
- Predictive analytics, forecasting

**survey-analyzer-action-planner** (58KB, 2 refs)
- Survey design, analysis, and action planning
- **Consolidated Nov 2025:** 4 files → 2 comprehensive guides
  - Survey playbook (analysis + design)
  - Communications + action planning

---

#### ✅ Compliance (1 skill)

**dei-program-designer** (100KB, 5 refs)
- DEI programs and EEO compliance
- Affirmative action plans, reporting
- Inclusive hiring, bias reduction

---

#### 👋 Onboarding (1 skill)

**onboarding-program-builder** (60KB, 3 refs)
- Designs comprehensive onboarding programs
- 30-60-90 day plans, buddy programs
- New hire experience optimization

---

#### 🔧 General (1 skill)

**org-design-consultant** (92KB, 4 refs)
- Org structure and team design
- Reporting lines, spans of control
- Reorganization planning and change management

---

## Development Guide

### Adding a New Skill

**Step 1: Create Skill Directory**

```bash
mkdir -p skills/my-new-skill/references
```

**Step 2: Create SKILL.md**

```markdown
---
name: my-new-skill
description: Brief description (used in skill detection)
---

# Expert Instructions for Claude

You are an expert in [domain]. Your role is to help users with:

1. [Primary capability]
2. [Secondary capability]
3. [Tertiary capability]

## When to Use This Skill

This skill is triggered when users ask about:
- [Trigger 1]
- [Trigger 2]
- [Trigger 3]

## Core Principles

- Principle 1: [Description]
- Principle 2: [Description]

## Reference Materials

See the /references/ directory for:
- template-name.md: [Description]
- playbook-name.md: [Description]
```

**Step 3: Add Detection Pattern**

Edit `/webapp/app/api/chat/route.ts`:

```typescript
// Add your detection pattern
if (/my-skill|related-keywords/.test(messageLower)) {
  return 'my-new-skill'
}
```

**Step 4: Create Reference Materials**

```bash
# Create reference files as needed
touch skills/my-new-skill/references/template.md
touch skills/my-new-skill/references/playbook.md
```

**Step 5: Test Detection**

```bash
# Test in chat
User: "Help me with [your skill domain]"
# Verify skill is detected and loaded
```

---

### Modifying Existing Skills

**Update Prompts:**
```bash
# Edit SKILL.md for prompt changes
nano skills/existing-skill/SKILL.md
```

**Update Templates:**
```bash
# Edit reference files
nano skills/existing-skill/references/template.md
```

**Update Detection:**
```bash
# Add new trigger keywords
nano webapp/app/api/chat/route.ts
```

**Test Changes:**
```bash
# Verify skill still triggers correctly
# Test with sample queries
```

---

## Maintenance

### Quarterly Review Checklist

- [ ] Review skill usage analytics (which skills are most used?)
- [ ] Check for outdated content (legal updates, best practices)
- [ ] Identify consolidation opportunities (>4 reference files per skill)
- [ ] Update detection patterns (new keywords, better matching)
- [ ] Test all skills with sample queries
- [ ] Update SKILLS_INDEX.md if changes made

---

### Consolidation Guidelines

**When to consolidate:**
- Skill has >4 reference files
- Reference files are related/overlapping
- Files are frequently accessed together
- Total size >100KB with redundant content

**How to consolidate:**

1. **Analyze files:**
   ```bash
   ls -lh skills/my-skill/references/
   # Identify logical groupings
   ```

2. **Create consolidated files:**
   ```bash
   cat file1.md file2.md > consolidated.md
   ```

3. **Test skill loading:**
   ```bash
   # Verify chat still works with new structure
   ```

4. **Delete old files:**
   ```bash
   rm file1.md file2.md
   ```

5. **Update documentation:**
   - Update SKILLS_INDEX.md
   - Update CLAUDE.md if significant changes
   - Git commit with descriptive message

---

### Version Control Best Practices

**Commit messages:**
```bash
# Good examples
git commit -m "feat(skills): add benefits-enrollment skill with 3 templates"
git commit -m "refactor(skills): consolidate survey analyzer refs (4→2 files)"
git commit -m "fix(skills): update job-description-writer for remote roles"

# Bad examples
git commit -m "update skill"  # Too vague
git commit -m "wip"           # Not descriptive
```

**Branching:**
```bash
# Feature branches for new skills
git checkout -b feature/add-talent-acquisition-skill

# Bug fix branches
git checkout -b fix/pip-builder-legal-compliance
```

---

## Best Practices

### 1. Skill Design

✅ **Do:**
- Keep SKILL.md focused on core instructions (< 200 lines)
- Move detailed content to reference files
- Use real examples and templates
- Include legal compliance notes where applicable
- Write clear, actionable prompts

❌ **Don't:**
- Embed large templates in SKILL.md
- Use vague instructions ("be helpful")
- Skip real examples
- Ignore legal/compliance requirements
- Create duplicate skills

---

### 2. Reference Files

✅ **Do:**
- Use descriptive filenames (`onboarding-checklist.md`)
- Group related content logically
- Include table of contents for long files
- Provide real-world examples
- Keep files <1,000 lines when possible

❌ **Don't:**
- Create 10+ micro-files per skill
- Use generic names (`template1.md`)
- Mix unrelated content
- Skip section headers
- Duplicate content across files

---

### 3. Detection Patterns

✅ **Do:**
- Use specific, unique keywords
- Test with real user queries
- Handle variations (plurals, synonyms)
- Order patterns from specific to general
- Document trigger keywords in SKILL.md

❌ **Don't:**
- Use overly broad patterns
- Create conflicting patterns
- Skip testing
- Hard-code specific names/companies
- Forget edge cases

---

### 4. Documentation

✅ **Do:**
- Update SKILLS_INDEX.md when adding/removing skills
- Document consolidations in PHASE_2_SIMPLIFICATION_PLAN.md
- Keep CLAUDE.md current with skill count
- Include examples in SKILL.md
- Maintain changelog for major updates

❌ **Don't:**
- Skip documentation updates
- Leave outdated skill counts
- Forget to update detection code
- Omit usage examples
- Ignore version history

---

## Troubleshooting

### Skill Not Detected

**Problem:** User query doesn't trigger expected skill

**Solutions:**
1. Check detection pattern in `/webapp/app/api/chat/route.ts`
2. Add missing keywords to pattern
3. Test with exact user query
4. Verify skill name matches directory name
5. Check for conflicting patterns (more specific patterns first)

---

### Reference Files Not Loading

**Problem:** Skill loads but reference content missing

**Solutions:**
1. Verify files exist in `/skills/{skill-name}/references/`
2. Check file permissions (should be readable)
3. Ensure correct file paths in SKILL.md
4. Check for typos in filenames
5. Restart dev server to clear cache

---

### Slow Skill Loading

**Problem:** Skills take too long to load

**Solutions:**
1. Consolidate >4 reference files per skill
2. Reduce file sizes (split files >2,000 lines)
3. Remove unused reference files
4. Optimize file reads (caching)
5. Consider lazy loading for large skills

---

## Migration Notes

### Nov 2025 Cleanup

**Changes Made:**
- Removed 2 empty legacy skills (rippling-integration, interview-hiring)
- Consolidated 3 heavy skills (survey, recognition, benefits)
- 12 files → 5 files (~180KB saved)
- Created SKILLS_INDEX.md for discoverability
- Updated all documentation

**Backward Compatibility:**
- All 25 active skills preserved
- No changes to skill detection
- Workflow routing unchanged
- Reference content consolidated but not removed

---

## Quick Reference

### Common Commands

```bash
# List all skills with sizes
du -sh skills/*/ | sort -h

# Find skills by keyword
grep -r "keyword" skills/*/SKILL.md

# Count reference files per skill
find skills/*/references -type f | wc -l

# Test skill detection (manual)
# 1. Start dev server
npm run dev

# 2. Test in chat
# Send query and verify skill detection
```

---

### File Locations

- **Skill definitions:** `/skills/{skill-name}/SKILL.md`
- **Reference materials:** `/skills/{skill-name}/references/`
- **Detection logic:** `/webapp/app/api/chat/route.ts`
- **Skill index:** `/skills/SKILLS_INDEX.md`
- **This guide:** `/docs/guides/SKILLS_GUIDE.md`

---

## Support

**Questions?**
- See CLAUDE.md for architecture overview
- Check SKILLS_INDEX.md for complete skill catalog
- Review detection code in `/webapp/app/api/chat/route.ts`

**Report Issues:**
- Skills not detected → Check detection patterns
- Missing content → Verify reference files
- Performance issues → Consider consolidation

---

**Last Updated:** Nov 11, 2025 | **Maintainer:** Platform Team
