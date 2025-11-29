# Desktop App — Known Issues & Parking Lot

> **Purpose:** Track issues, blockers, and deferred decisions during desktop implementation.
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [CODE_EXAMPLES.md](./CODE_EXAMPLES.md)

---

## How to Use This Document

**Add issues here when:**
- You encounter a bug that isn't blocking current work
- You discover something that needs investigation later
- A decision needs to be made but can wait
- You find edge cases that need handling eventually

**Format:**
```markdown
### [PHASE-X] Brief description
**Status:** Open | In Progress | Resolved | Deferred
**Severity:** Blocker | High | Medium | Low
**Discovered:** YYYY-MM-DD
**Description:** What happened / what's the issue
**Workaround:** (if any)
**Resolution:** (when resolved)
```

---

## Open Issues

### [PHASE-0] Example issue template
**Status:** Open
**Severity:** Low
**Discovered:** 2025-11-26
**Description:** This is a template entry. Delete it when you add your first real issue.
**Workaround:** N/A
**Resolution:** N/A

---

## Resolved Issues

*(Move issues here when resolved)*

---

## Deferred Decisions

### Port Selection Strategy
**Context:** Currently using `detect-port` to find available port starting at 3000.
**Decision Needed:** Should we allow users to configure a fixed port in settings?
**Defer Until:** Phase 8 (Settings UI) or post-v1.0

### Windows Support Timeline
**Context:** macOS only for v1.0
**Decision Needed:** When to start Windows implementation?
**Defer Until:** 3 months post-macOS launch, based on customer demand

### Keychain vs Encrypted DB for API Keys
**Context:** Currently using macOS Keychain via `keytar`
**Decision Needed:** For Windows support, need cross-platform solution (electron safeStorage?)
**Defer Until:** Windows implementation phase

---

## Edge Cases to Handle

| Case | Phase | Priority | Notes |
|------|-------|----------|-------|
| User changes port while app running | 3 | Low | Requires restart |
| Multiple Anthropic keys (personal + org) | 8 | Medium | V1 supports one key per provider |
| Database > 1GB | 5 | Low | Backup performance may degrade |
| User deletes config.json manually | 8 | Medium | Should trigger setup wizard |
| Offline during license validation | 0.5 | High | Need offline grace period |

---

## Investigation Notes

*(Use this for debugging notes, research findings, etc.)*

---

## Changelog

| Date | Change |
|------|--------|
| 2025-11-26 | Document created |

