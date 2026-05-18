---
title: 'Model informs, analyst estimates'
description: 'Improvement ideas target root causes not factor levels — regression provides ceiling, analyst estimates achievable fraction'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_model_informs_analyst_estimates.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Never frame the What-If as "set Factor X to Level Y" — that's a diagnostic finding, not an improvement action. The analyst discovers WHY a factor matters (e.g., Night shift has temperature drift) and creates an action targeting the cause (e.g., "add calibration to handover").

**Why:** In real Six Sigma practice, "Switch to Day shift" is not actionable — you need to understand and fix WHY Night is different. The regression model gives the gap (1.9g between shifts) and the ceiling (what's achievable). The analyst estimates what fraction their specific action will close.

**How to apply:** What-If UI shows the model gap as context + a "how much will this close?" estimation slider (0-100%), not factor-level controls pretending the action IS the factor change. Reference markers (current, best performer, model optimum) provide benchmarks for target-setting.
