# Desktop App — Session Protocol for Long-Running Implementation

> **Purpose:** Ensure continuity across multiple Claude Code sessions during desktop app implementation.
> **Based on:** [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [PROGRESS.md](./PROGRESS.md) | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

---

## Core Principle

> "Each new session begins with no memory of what came before."

Context compaction alone is insufficient for multi-session projects. We use **structured artifacts** to maintain continuity:

| Artifact | Purpose | Location |
|----------|---------|----------|
| **PROGRESS.md** | Log of completed work with timestamps | `docs/desktop/PROGRESS.md` |
| **ROADMAP.md** | Checkbox tracking of phases/tasks | `docs/desktop/ROADMAP.md` |
| **features.json** | Machine-readable feature list with pass/fail | `desktop/features.json` |
| **Git commits** | Recovery points with descriptive messages | Repository history |
| **KNOWN_ISSUES.md** | Parking lot for blockers and deferred items | `docs/desktop/KNOWN_ISSUES.md` |

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║  DESKTOP APP SESSION MANAGEMENT - QUICK REFERENCE                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  SESSION START:                                                       ║
║    ./desktop/scripts/dev-init.sh                                      ║
║                                                                       ║
║  DURING SESSION:                                                      ║
║    • Work on ONE task at a time                                       ║
║    • Update docs after each completed task                            ║
║    • Commit frequently with descriptive messages                      ║
║                                                                       ║
║  CHECKPOINT (anytime, especially if context getting long):            ║
║    "Update PROGRESS.md and features.json with current state"          ║
║                                                                       ║
║  SESSION END (before compaction or stopping work):                    ║
║    "Before ending: Please follow session end protocol:                ║
║     1. Run verification (npm run type-check && npm test)              ║
║     2. Add session entry to TOP of docs/desktop/PROGRESS.md           ║
║     3. Update desktop/features.json with pass/fail status             ║
║     4. Check off completed task in docs/desktop/ROADMAP.md            ║
║     5. Commit with descriptive message                                ║
║     What's the 'Next Session Should' note for PROGRESS.md?"           ║
║                                                                       ║
║  KEY FILES:                                                           ║
║    docs/desktop/PROGRESS.md   ← Session log (newest at TOP)           ║
║    docs/desktop/ROADMAP.md    ← Task checkboxes                       ║
║    desktop/features.json      ← Pass/fail tracking                    ║
║    docs/desktop/KNOWN_ISSUES.md ← Park blockers here                  ║
║                                                                       ║
║  IF BLOCKED:                                                          ║
║    Add to KNOWN_ISSUES.md → Move to next independent task             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Session Start Protocol

**Every session MUST begin with these steps in order:**

### Step 1: Confirm Environment
```bash
pwd
# Expected: /Users/mattod/Desktop/HRSkills
```

### Step 2: Read Progress Files
```bash
# Read these files to understand current state:
cat docs/desktop/PROGRESS.md      # What's been done
cat docs/desktop/ROADMAP.md       # What's next (look for [ ] checkboxes)
cat desktop/features.json         # Feature pass/fail status (if exists)
git log --oneline -10             # Recent commits
```

### Step 3: Verify Previous Work Still Functions
```bash
# Run verification based on current phase:
cd webapp && npm run type-check   # Always run
cd webapp && npm test             # Always run

# If Phase 3+ (Next.js integration exists):
cd webapp && npm run build        # Verify build works

# If desktop/ exists:
cd desktop && npm run type-check  # Verify Electron compiles
```

### Step 4: Check for Blockers
```bash
cat docs/desktop/KNOWN_ISSUES.md  # Any open blockers?
```

### Step 5: Select Next Task
- Find the **first unchecked item** in ROADMAP.md
- Work on **ONE feature/task per session** (prevents scope creep)
- If blocked, add to KNOWN_ISSUES.md and move to next item

### Step 6: Run Init Script (if exists)
```bash
# After Phase 3, use the init script to start dev environment:
./desktop/scripts/dev-init.sh
```

---

## Session End Protocol

**Every session MUST end with these steps:**

### Step 1: Verify Work
```bash
# Run full verification:
cd webapp && npm run type-check && npm test
cd desktop && npm run type-check  # If desktop exists

# Run E2E if UI was modified:
cd webapp && npm run test:e2e
```

### Step 2: Update Progress File
Add entry to `docs/desktop/PROGRESS.md`:
```markdown
## Session [DATE]

### Completed
- [x] Task description (Phase X.Y)
- [x] Another task

### Verified
- Type checking passes
- Unit tests pass
- [Specific verification for this work]

### Next Session Should
- Start with [specific task]
- Be aware of [any gotchas]
```

### Step 3: Update ROADMAP.md Checkboxes
Mark completed tasks with `[x]` in ROADMAP.md.

### Step 4: Update features.json (if applicable)
```json
{
  "electron-scaffolding": { "status": "pass", "verified": "2025-11-27" },
  "next-integration": { "status": "in-progress", "notes": "Server starts, window loads" }
}
```

### Step 5: Commit with Descriptive Message
```bash
git add .
git commit -m "feat(desktop): [Phase X.Y] Description of what was done

- Specific change 1
- Specific change 2

Verified: type-check, unit tests
Next: [what comes next]"
```

### Step 6: Leave Environment Clean
- No uncommitted changes (unless intentional WIP)
- No running processes that would block next session
- No broken tests or type errors

---

## Single-Feature-Per-Session Rule

> "Restricting the agent to single-feature-per-session work" prevents scope creep and incomplete features.

### What Counts as "One Feature"
- One checkbox item from ROADMAP.md
- One complete, verified, committed unit of work
- Something that can be fully tested before session ends

### Examples
| Good (One Feature) | Bad (Too Much) |
|--------------------|----------------|
| Create desktop/package.json with dependencies | Set up entire Electron scaffolding |
| Implement findAvailablePort() | Implement all IPC handlers |
| Add icon.icns to desktop/icons/ | Create all app icons for all platforms |
| Create first-run detection in getStartUrl() | Build entire setup wizard |

### If You Finish Early
- Run additional verification
- Improve test coverage
- Update documentation
- **DO NOT** start the next feature unless there's significant time remaining

---

## Preventing Common Failures

### Problem: Premature Completion Declaration
**Symptom:** Marking phase complete without thorough verification
**Prevention:**
- ROADMAP.md has explicit verification steps for each phase
- features.json requires explicit "pass"/"fail" status
- Session end protocol requires running tests

### Problem: Undocumented Changes Breaking Later Sessions
**Symptom:** Next session fails because of unknown state changes
**Prevention:**
- PROGRESS.md logs all changes
- Git commits with descriptive messages
- "Next Session Should" section in progress log

### Problem: Testing Inadequacy
**Symptom:** Code looks correct but doesn't actually work
**Prevention:**
- Type checking is mandatory (catches compile errors)
- Unit tests must pass (catches logic errors)
- E2E tests for UI changes (catches integration errors)
- Manual verification for platform-specific features

### Problem: Context Loss After Compaction
**Symptom:** Claude forgets critical implementation details
**Prevention:**
- All implementation code in CODE_EXAMPLES.md
- All decisions documented in ARCHITECTURE.md
- features.json captures what's done vs. not done
- PROGRESS.md captures session-specific context

---

## Recovery Procedures

### If Tests Fail at Session Start
1. Check git log for recent changes
2. Read PROGRESS.md for context on what was done
3. Check if dependencies need reinstalling: `npm install`
4. If still failing, consider `git revert` to last known good commit

### If Feature List Diverges from Code
1. Trust git history over documentation
2. Run full verification to see actual state
3. Update ROADMAP.md and features.json to match reality

### If Blocked by External Issue
1. Add to KNOWN_ISSUES.md with full context
2. Note workaround if possible
3. Move to next independent task
4. Flag in PROGRESS.md for next session

---

## Session Kickoff Prompts

### Standard Session Start
```
I'm continuing the Electron desktop app implementation.

Please:
1. Read docs/desktop/PROGRESS.md for recent work
2. Read docs/desktop/ROADMAP.md to find next task
3. Run verification (npm run type-check && npm test)
4. Continue with the next unchecked item

Update PROGRESS.md and ROADMAP.md checkboxes as you complete work.
```

### After Long Break
```
I'm resuming the Electron desktop app after a break.

Please:
1. Read docs/desktop/PROGRESS.md to understand current state
2. Read docs/desktop/ROADMAP.md for phase progress
3. Read docs/desktop/KNOWN_ISSUES.md for any blockers
4. Run full verification to confirm everything still works
5. Summarize the current state before continuing
```

### For Specific Phase Work
```
I'm working on Phase [X] of the desktop app.

Please:
1. Read docs/desktop/ROADMAP.md Phase [X] section
2. Read docs/desktop/CODE_EXAMPLES.md for implementation reference
3. Start with the first unchecked item in Phase [X]
4. Verify each task before checking it off
```

---

## File Templates

### PROGRESS.md Entry Template
```markdown
## Session YYYY-MM-DD

**Phase:** X.Y
**Focus:** [One sentence describing the session goal]

### Completed
- [x] Task 1 description
- [x] Task 2 description

### Verified
- [ ] `npm run type-check` passes
- [ ] `npm test` passes
- [ ] [Phase-specific verification]

### Notes
[Any important context for future sessions]

### Next Session Should
- Start with: [specific task or verification]
- Be aware of: [any gotchas or considerations]
```

### features.json Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "properties": {
      "status": { "enum": ["not-started", "in-progress", "pass", "fail", "blocked"] },
      "verified": { "type": "string", "format": "date" },
      "notes": { "type": "string" },
      "blockedBy": { "type": "string" }
    },
    "required": ["status"]
  }
}
```

---

## Verification Checklist by Phase

### Phase 0 (Pre-flight)
- [ ] Webapp builds: `npm run build`
- [ ] Webapp starts: `npm run dev`
- [ ] Tests pass: `npm test`
- [ ] Type check passes: `npm run type-check`

### Phase 1 (Electron Scaffolding)
- [ ] desktop/package.json exists with correct dependencies
- [ ] desktop/tsconfig.json compiles without errors
- [ ] `npm run type-check` in desktop/ passes

### Phase 2 (Icons)
- [ ] desktop/icons/icon.icns exists (macOS)
- [ ] Icon visible in Finder when viewing .app

### Phase 3 (Next.js Integration)
- [ ] `npm run dev` in desktop/ starts Next.js
- [ ] BrowserWindow opens and displays webapp
- [ ] Server shutdown on app quit

### Phase 4+
- [ ] See ROADMAP.md for phase-specific verification

---

**Document Version:** 1.0
**Created:** 2025-11-27
**Based On:** Anthropic Engineering Blog - Effective Harnesses for Long-Running Agents
