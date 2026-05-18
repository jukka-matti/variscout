---
title: 'Problem Statement — IMPLEMENTED as Living Document'
description: 'Watson''s 3Q implemented — Q1+Q2 deterministic from FRAME, Q3 from SCOUT Loop 1, hasScope + liveStatement + canGenerateDraft'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 4311fa4bf2e0af3f
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_problem_statement.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Problem statement model **reframed and implemented Apr 3 2026** — forms early as a living document.

**Watson's 3 questions — all answerable early:**
- Q1 (What measure?) = Y column (FRAME)
- Q2 (How to change?) = `inferCharacteristicType(specs)` — nominal→reduce variation, smaller→decrease, larger→increase
- Q3 (Where?) = first significant factor from Factor Intelligence (`LocationFactor`)

**Implementation:**
- `buildProblemStatement()` accepts `characteristicType`, derives direction via `resolveDirection()`. Explicit `targetDirection` takes precedence.
- `useProblemStatement` returns: `q1Ready`, `q2Ready`, `hasScope` (renamed from q3Ready), `isFormable`, `liveStatement`, `canGenerateDraft`
- `LocationFactor` interface: `{ factor, level?, evidence? }` — represents Q3 scope
- `hasScope` = locationFactor present OR legacy causeRole questions exist
- `isFormable` = q1Ready + q2Ready + locationFactor present (early formation path)
- `canGenerateDraft` = q1Ready + hasScope (works for both early and legacy paths)
- `liveStatement` auto-builds when isFormable — no "Generate" button needed
- Legacy `isReady` retained for backward compat

**How to apply:** Problem Statement is the anchor visible from SCOUT onward. Suspected causes are separate — the investigation output that accumulates beneath it. See `project_investigation_reframing.md`.
