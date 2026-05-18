---
name: "Agent Context Quickstart"
description: "Use at the start of any subagent dispatch to load a 5-minute VariScout orientation: current strategic direction (wedge V1), hard invariants, where to look, and common pitfalls. Use when onboarding a fresh subagent, starting a new session, or any time a subagent needs baseline project context before touching code or docs."
---

# Agent Context Quickstart

## When to Use This Skill

Use at the start of any subagent dispatch — especially:
- First action of a fresh session or a freshly dispatched subagent
- Before any code or doc edit in an unfamiliar area
- When a task touches multiple packages or layers and orientation matters

Do NOT skip this for "quick" tasks. The most common subagent errors (wrong store layer, root-cause language, hex colors, bare useStore()) stem from missing this context.

## What This Skill Does

Loads a 5-minute orientation document covering:
1. What VariScout is and its current strategic direction (wedge pivot 2026-05-16)
2. Hard invariants that must never be violated
3. Where to look for specs, decisions, and package context
4. Common pitfalls that cause ESLint failures and test breaks

## How to Use

1. Read the onboarding doc at `docs/agent-context/onboarding-quick-start.md` (in the repo root).
2. Note the **7-tab nav** (`Home · Project · Process · Analyze · Investigation · Improve · Report` — singular "Project") with Improve as a top-level verb tab driven by active-IP cascade. (Verify against any recent amendments in `docs/decision-log.md` — the wedge area is actively evolving.)
3. Read `.claude/INVARIANTS.md` for the full invariant index — canonical homes + enforcement mechanisms for every hard and soft rule. The onboarding doc §Hard Invariants gives the quick summary; INVARIANTS.md gives the authoritative detail.
4. **If your task involves editing ANY canonical doc** (design spec, ADR, decision-log, etc.): read `docs/agent-context/doc-discipline.md`. It defines the SSoT-by-doc-type rules — design specs edit-in-place, ADRs use amendment-blocks-at-bottom, decision-log appends. Anti-pattern: creating `*-amendment-*.md` side files (HARD-FAILed by validator when Play 2b ships).
5. Scan the Common Pitfalls section in the onboarding doc — check each against your planned edits before proceeding.
6. If your task involves a specific package, invoke the `package-router` skill next.
7. If your task reads or writes store state, invoke the `store-state-glossary` skill next.

## Key Facts (memorize these)

**Current direction**: Single-SKU V1 (formerly "wedge") — single-product, single SKU (€120/mo), ICP = improvement specialist. Within each Project, **3 personas** (Lead / Member / Sponsor) — per-project ACLs, no cross-AD-tenant invites. Canonical: ADR-082 + V1 architecture spec (`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`).

**7 tabs**: `Home · Project · Process · Analyze · Investigation · Improve · Report`. Improve = top-level verb tab with active-IP cascade (per 2026-05-16 Improve-tab amendment; earlier "stage inside Projects" framing superseded). Many older docs predate this; treat as historical.

**Package dependency direction**: `core → hooks → ui → apps`. Never import upward.

**Hard stops** (all ESLint-enforced):
- Never `Math.random()` in any code or test
- Never hardcoded hex colors in charts
- Never `--no-verify` on commits
- Never "root cause" language (use "contribution" / "suspected cause" / "mechanism")
- Never `'ordinal' | 'disordinal'` confusion — never call interactions "moderator" or "primary"

## Supporting Documents

- Full 5-minute onboarding: `docs/agent-context/onboarding-quick-start.md`
- Invariants index: `.claude/INVARIANTS.md`
- **Doc-update discipline (when editing any canonical doc): `docs/agent-context/doc-discipline.md`**

Related skills:
- `package-router` — which package CLAUDE.md to load for your work area
- `store-state-glossary` — what state lives in which Zustand store
- `writing-tests` — Vitest + RTL + Playwright test patterns
