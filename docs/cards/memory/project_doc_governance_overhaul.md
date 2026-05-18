---
title: 'Documentation Governance Overhaul'
description: 'Apr 6 2026 deduplication + ownership model; Apr 16–17 enforcement tooling (pre-commit gate, auto-sync scripts, auto-archive)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 79b4dc79f01968d1
origin-session-id: 8b348e90-6a85-4d30-878e-0a31557b1f90
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_doc_governance_overhaul.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## What Was Done

Comprehensive audit and overhaul of CLAUDE.md, .claude/rules/, and MEMORY.md:
- Deleted 5 superseded memory files (teams, event bus, old investigation, AI phases 1&2)
- Fixed 4 stale/wrong file paths in CLAUDE.md
- Removed repo structure tree from CLAUDE.md (duplicated monorepo.md)
- Trimmed Key Entry Points to 1-sentence Purpose column
- Replaced 100+ lines of hook/component enumerations in monorepo.md with key examples
- Replaced stale test counts in testing.md with stable percentages
- Trimmed charts.md reference sections
- Rewrote MEMORY.md as lean routing table (~80 lines from 142)

## Ownership Model

Each fact has exactly one authoritative home:

| Information | Authority | Others may... |
|---|---|---|
| Task → docs routing | CLAUDE.md | Not duplicate |
| Package architecture | monorepo.md | CLAUDE.md: 1-line summary |
| What hooks/components exist | Source code (`ls`) | monorepo.md: key examples only |
| Sub-path imports | monorepo.md | — |
| Chart API + patterns | charts.md | CLAUDE.md routes to it |
| Test conventions | testing.md | CLAUDE.md routes to it |
| Project decisions/rationale | Memory files + ADRs | MEMORY.md: 1-line pointer |
| Implementation status | Code + git log | Not in memory |

**Why:** ~23% token reduction on every interaction. Stale info was causing confusion (e.g., improvementStore "deleted" when domain store still exists).

**How to apply:** When adding new info, check which file owns it before writing. Don't enumerate things discoverable via `ls` or `grep`. Keep MEMORY.md entries to 1 line.

---

## April 16–17 Follow-up: Enforcement Tooling (PR #60 + #61)

Governance shifted from *detect-only* to *enforce-at-commit + auto-generate + lifecycle management*.

### New scripts in `scripts/`

- **`sync-monorepo-counts.sh`** (run via `pnpm docs:sync`) — idempotent auto-fixer for Mermaid subgraph count labels in `component-map.md`. Reads actual exports from `@variscout/ui`, `@variscout/hooks`, `@variscout/charts`, updates diagram counts. Safe to run anytime. No diff = already in sync.
- **`archive-delivered-plans.sh`** — moves plans from `docs/superpowers/plans/` → `docs/archive/plans/` when the linked spec's `status:` reaches `delivered` or `superseded`. Relies on a `spec:` frontmatter field in plan files. PR #60 auto-archived 10 of 12 plans; 1 remains active (coscout-intelligence-architecture, spec still draft).

### Hardened existing scripts

- **`check-doc-health.sh`** — now exits non-zero on warnings (was hardcoded `exit 0`). This is what makes pre-commit blocking actually block.
- **`check-diagram-health.sh`** — stale `HypothesisStatus` check replaced with `QuestionStatus` (per ADR-053). The old check had been a permanent false positive.

### Pre-commit gate

**`.husky/pre-commit`** now runs `pnpm docs:check` after lint-staged. Any doc drift (broken refs, stale diagram counts, orphan files, missing frontmatter) blocks the commit. Proven end-to-end during PR #60 verification.

### Plan file convention

Plans in `docs/superpowers/plans/` now require a `spec:` frontmatter field pointing at the linked design spec. PR #60 backfilled 11 plans with this field so the archive script could discover them.

### Why this matters for future sessions

- When shipping a feature: the Feature Delivery Checklist in `.claude/rules/documentation.md` (now tracked in git as of PR #61) includes a "Update specs/index.md" reminder — because `docs:check` will fail at commit otherwise.
- When adding a new plan file: include `spec: <spec-filename>` in frontmatter.
- When renaming or deleting docs: `docs:check` catches broken inbound refs at commit time. No more silent drift like the ADR-059 `onedrive-sync.md` rename (which had left 9 broken refs for weeks).
- Running `pnpm docs:sync` before committing is usually unnecessary (counts self-correct lazily), but safe anytime.

### Follow-up PR #61 additions

- `feature-backlog.md` restructured into **Active / Candidate / Delivered** sections — it's now a decision tool, not a wishlist. Read Active + Candidate when planning next work.
- Best subsets regression marked Delivered (ADR-067 shipped it; earlier "Deferred per ADR-014" note was stale).
- `.claude/rules/documentation.md` force-added to git — was locally present but untracked despite CLAUDE.md referencing it. Peer rule files were all already tracked; this was pure oversight cleanup.
