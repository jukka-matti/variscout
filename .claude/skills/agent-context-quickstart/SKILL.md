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
2. Note the 6-tab nav (`Home · Projects · Process · Analyze · Investigation · Report`) and that "Improve" is a stage inside Projects, not a tab.
3. Internalize the 4 hard invariants (browser-only, 6 stores × 3 layers, no cross-unit aggregation, language rules).
4. Scan the Common Pitfalls section — check each against your planned edits before proceeding.
5. If your task involves a specific package, invoke the `package-router` skill next.
6. If your task reads or writes store state, invoke the `store-state-glossary` skill next.

## Key Facts (memorize these)

**Current direction**: Wedge V1 — single-product, single SKU (€99/mo), single persona (improvement specialist). Canonical: ADR-082 + wedge spec (`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`).

**6 tabs**: `Home · Projects · Process · Analyze · Investigation · Report`. Improve = stage inside Projects. Many older docs predate this; treat as historical.

**Package dependency direction**: `core → hooks → ui → apps`. Never import upward.

**Hard stops** (all ESLint-enforced):
- Never `Math.random()` in any code or test
- Never hardcoded hex colors in charts
- Never `--no-verify` on commits
- Never "root cause" language (use "contribution" / "suspected cause" / "mechanism")
- Never `'ordinal' | 'disordinal'` confusion — never call interactions "moderator" or "primary"

## Supporting Document

Full 5-minute onboarding: `docs/agent-context/onboarding-quick-start.md`

Related skills:
- `package-router` — which package CLAUDE.md to load for your work area
- `store-state-glossary` — what state lives in which Zustand store
- `writing-tests` — Vitest + RTL + Playwright test patterns
