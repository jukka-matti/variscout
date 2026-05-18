---
title: 'skills-for-capabilities-not-conventions'
description: 'Skills are for workflows (using-ruflo, writing-tests); codebase editing patterns belong in nested CLAUDE.md, not skills. .claude/rules/ path-scoping is broken upstream.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 58aa829e273eda6b
origin-session-id: 809b9904-f153-4cbe-92db-29203843b759
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_skills_for_capabilities_not_conventions.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

For Claude Code repositories with VariScout-style structure (multi-package monorepo, real domain conventions), guidance lives in **one mechanism per purpose**:

- **Nested `CLAUDE.md`** = conventions, invariants, "where to look". The only deterministic per-area auto-load that works in current Claude Code.
- **`.claude/skills/`** = workflows / capabilities only (using-ruflo, writing-tests, skill-builder, loppuselvitys, superpowers:*). Per Anthropic Skills spec.
- **`.claude/rules/`** = short cross-cutting non-negotiables (~15 lines). Path-scoping via `paths:` frontmatter is **broken upstream** (claude-code issues #16299/#16853/#38487) — they currently load globally regardless. Treat as session-loaded.

**Why:** Encoding "when editing X, do Y" as a Skill is a documented anti-pattern — Claude under-triggers on description matching. The April 2026 A++ initiative spawned 10 `editing-*` skills; over the following month they were never invoked (zero `Skill()` calls, only prose citations). Collapsed 2026-05-14 (commit `c7bb8553`, net −2,819 lines): all 10 deleted, load-bearing items moved to nested CLAUDE.md.

**How to apply:**
- Don't create `editing-*` / `adding-*` skills for VariScout patterns. If a convention is worth writing down, add it to the matching `packages/*/CLAUDE.md` or `apps/*/CLAUDE.md`.
- New skills only when they're true workflows with progressive disclosure (scripts, refs, multi-step) — not pattern documentation.
- When `.claude/rules/` upstream path-scoping ships, revisit; until then, keep rules terse.
- Related: [[agent-docs-architecture-collapse-2026-05-14]] for the shipped change.
