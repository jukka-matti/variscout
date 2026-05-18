---
title: 'Three-Boundary Numeric Safety'
description: 'ADR-069 — three-boundary defense against NaN/Infinity propagation in stats engine, with safeMath.ts utilities and ESLint enforcement'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_three_boundary_safety.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-069 installed a three-boundary defense against NaN/Infinity propagation:

- **B1 (Input)**: `toNumericValue()` in types.ts — already existed, rejects NaN/Infinity at parse time
- **B2 (Stats Output)**: `safeMath.ts` — `finiteOrUndefined`, `safeDivide`, `computeOptimum` applied at ANOVA, bestSubsets, factorEffects, typeIIISS, evidenceMapLayout return boundaries
- **B3 (Display)**: 39 UI/AI files guarded with `Number.isFinite()` before `.toFixed()`. ESLint `no-restricted-syntax` warns on `.toFixed()` in packages/ui/ and packages/core/src/ai/prompts/

**Why:** Audit triggered by optimum NaN/Infinity bug revealed systemic gap — stats engine had no output validation, 41 UI files bypassed `formatStatistic()`. Research confirmed R/NumPy/Minitab all use three-boundary architecture.

**How to apply:** New stats functions must return `number | undefined`, never NaN/Infinity. Use `safeDivide` for any division with possible zero denominator. UI code must use `formatStatistic()` or guard with `Number.isFinite()`.

Key files: `packages/core/src/stats/safeMath.ts`, `docs/07-decisions/adr-069-three-boundary-numeric-safety.md`, `docs/05-technical/statistics-reference.md` §Numerical Safety
