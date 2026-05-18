---
title: 'Development Folder & Feature Backlog'
description: 'docs/10-development/ stores user testing transcripts, feature backlog, and analysis notes'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, reference]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_development_folder.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

`docs/10-development/` — development notes, user testing feedback, feature planning, expert transcripts.

- `feature-backlog.md` — Prioritized feature list organized by theme (Chart Interaction, Probability Plot Enhancement, Statistical Features, Analysis Modes, UX). Sourced from user testing discussions. Includes "Already Implemented" section.
- `discussions/` — Raw transcripts from user testing sessions (2026-03-29: dataset analysis, probability plot, probability plot + commenting)
- `discussions/2026-03-29-probability-plot-analysis.md` — Multi-angle analysis (statistical methodology, usability, practical workflow)
- `transcripts/` — Expert voice memos and validation interviews (added Apr 5 2026):
  - `best-subset-regression-approach.md` — Finnish, best-subset as first analysis step
  - `projects-at-hp.md` — HP 1980s: supplier rationalization, injection molding Y=f(X), JIT line, Smalltalk
  - `probability-plot-in-analysis-flow.md` — Subgroup distribution checks, per-region regression
  - `dataset-analysis-discussion.md` — Watson testing session with live dataset
  - `mbb-investigation-spine-validation.md` — MBB validates Investigation Spine (6 topics, 5 action items)

**Why:** User testing discussions and expert transcripts contain rich domain expertise that informs feature priorities. The Apr 5 transcripts directly led to the Evidence Map Spine design.
**How to apply:** Check feature-backlog.md before planning new work. Read transcripts/ for domain context and methodology insights.
