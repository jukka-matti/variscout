---
title: 'Watson Expert Testing Sessions'
description: 'March 29 2026 MBB expert testing — validated question-driven EDA on non-manufacturing data'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_watson_testing.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

On March 29, 2026, MBB expert Greg Watson tested VariScout with visitor/tourism data (non-manufacturing). Three recorded sessions in `docs/10-development/discussions/`:

**Why:** These sessions are the primary expert validation evidence for the positioning shift.

**How to apply:**
- `2026-03-29-dataset-analysis.txt` (4 min): Watson naturally followed question-driven investigation on visitor data. Created "summer visitors" factor, asked "which countries?" — validated methodology works beyond manufacturing. Gap found (multi-factor drill on wide-form) → led to ADR-050/051.
- `2026-03-29-probability-plot-and-commenting.txt` (16 min): Deep methodology teaching. Inflection points = process transitions. Steepness = capability. Chi-square connection. Key quote: "Don't search for the function first. Search for which variables make a difference."
- `2026-03-29-probability-plot.txt` (6 min): Usability testing. Font size issues, Cp/Cpk not visible on chart, stats panel toggle confusing → led to UI improvements.
- Watson's teaching progression (understand variables before modeling) is the design philosophy behind Factor Intelligence and progressive stratification.
- Referenced in Positioning Bible §1 (The Watson Moment) and §8 (Expert Validation).
