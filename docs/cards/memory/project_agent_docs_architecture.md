---
title: 'agent-docs-architecture'
description: 'A++ guidance system collapsed 2026-05-14 — all editing-* skills deleted; nested CLAUDE.md is the single authority. Phases 1-7 (Apr 2026) shipped the original 3-layer system; Phase 8 (May 2026) collapsed it.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 809b9904-f153-4cbe-92db-29203843b759
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_agent_docs_architecture.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Agent Docs Architecture — current state

**Authority order (post-collapse 2026-05-14):**

1. **Nested `CLAUDE.md`** (root + 8 per-package/app) — conventions, invariants, "where to look". Deterministic auto-load by subtree.
2. **`.claude/rules/`** (6 files, ~15 lines each) — short cross-cutting non-negotiables (charts/stats/i18n/coscout-prompts/azure-storage/testing). Currently load globally; path-scoping broken upstream (claude-code issues #16299/#16853/#38487).
3. **`.claude/skills/`** — workflows only (`using-ruflo`, `writing-tests`, `skill-builder`, plus non-VariScout skills). Zero VariScout-specific editing patterns.

**Phase 8 — Collapse SHIPPED 2026-05-14** (commit `c7bb8553`, direct to main per doc/config tier).

- Deleted 10 skills (editing-charts/statistics/coscout-prompts/azure-storage-auth/monorepo-structure/analysis-modes/evidence-map/investigation-workflow + adding-i18n-messages + maintaining-documentation). 43 files, ~2,930 lines.
- Migrated load-bearing items into nested CLAUDE.md (~136 lines added). Updated 7 live `docs/` citations; historical baselines + plans intentionally untouched.
- Trimmed `.claude/rules/*.md` to ~15 lines each (cross-cutting non-negotiables only).
- Net: −2,819 lines.
- Rationale: Skills are designed for capabilities (workflows w/ progressive disclosure), not codebase conventions — encoding "edit X this way" as a Skill is anti-pattern (Claude under-triggers). Nested CLAUDE.md is the only deterministic per-area auto-load. See [[skills-for-capabilities-not-conventions]] for the durable rule.
- Bug fixed: `apps/pwa/CLAUDE.md` was actively misleading — listed `useSessionStore` + `useImprovementStore` as active stores months after F4 deleted them (2026-05-07).

**Phases 1-7 (Apr 2026)** — shipped the original A++ architecture (12 skills + nested CLAUDE.mds + ESLint plugin + pre-commit hooks + frontmatter validation). Detailed phase-by-phase history is in `git log --grep "agent-docs"` and the design spec `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md`. Key persisting deliverables from those phases:

- `eslint-plugin-variscout` with 4 AST rules (`no-tofixed-on-stats`, `no-hardcoded-chart-colors`, `no-root-cause-language`, `no-interaction-moderator`).
- Pre-commit hooks: `check-ssot.sh`, `check-claude-md-size.sh` (per-file budgets), `check-dead-links.sh`.
- Pre-edit advisories for ADR + spec frontmatter.
- `scripts/docs-frontmatter-schema.mjs` SSOT + `check-doc-frontmatter.mjs` (warn → fail cutoff was 2026-05-15).
- `docs/llms.txt` agent manifest.
- Local workflow guardrails (Phase 7): `scripts/check-git-hygiene.sh`, `scripts/classify-change.sh`, `scripts/pr-ready-check.sh`, `.husky/pre-push`.

**Drift findings captured during Apr migration** (still authoritative — these were code-vs-doc drifts the migration surfaced; do NOT re-introduce the legacy claims):

- NIST test file: `packages/core/src/stats/__tests__/olsRegression.nist.test.ts` (NOT `nistLongley.test.ts`).
- `safeMath.ts` exports: `finiteOrUndefined`, `safeDivide`, `computeOptimum` only (no `safeSqrt`/`safeLog`).
- CoScout `role.ts` is a FILE not a directory.
- `chartColors.spec` is `#f97316` (orange), not `#ef4444`.
- `ResolvedMode` has 5 values incl. `defect` (ADR-047 says 4).
- ADR-034 uses `SNVA`; code's canonical key is `'nva-required'` with display label "NVA Required".
- `FindingSource` has 5+ variants incl. `probability` (not the original 4).
- Azure: `/.auth/me` (EasyAuth) — no `/api/me` endpoint.
- Chinese locales: `zhHans.ts` / `zhHant.ts` (camelCase) via `LOCALE_TO_FILENAME`.
