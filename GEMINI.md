# HRSkills Platform - Gemini Code Configuration (Historical Guide)

> **IMPORTANT NOTE:** Google Gemini support was part of the original multi-provider AI strategy but was **removed in Phase 5** to simplify the production AI stack. See `webapp/PHASE_5_SIMPLIFY_AI.md` for full details.
>
> This document is retained as a **historical reference and guide** for re-instating Gemini as a third-level fallback provider if needed in the future. The project currently uses an Anthropic → OpenAI failover chain.

---

## Project Overview

**Project Name:** HRSkills Platform

**Description:** Chat-first HR automation platform originally designed with multi-provider failover (Anthropic, OpenAI, Gemini) and dynamic context panels.

**Tech Stack:**
- Framework: Next.js 14 with App Router
- Language: TypeScript 5.3
- Database: SQLite with Drizzle ORM
- Styling: Tailwind CSS + shadcn/ui
- Testing: Jest, Playwright, jest-axe
- Deployment: Vercel (production-ready)
- AI: Multi-provider (Anthropic → OpenAI). Extensible to include Gemini.

**Repository:** https://github.com/matthewod11-stack/HRSkills

