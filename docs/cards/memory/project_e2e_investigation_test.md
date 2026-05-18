---
title: 'E2E Investigation Flow Test (Apr 4 2026)'
description: 'Browser E2E test results for full investigation spine — sample load to Suspected Cause hub creation. Discovered and fixed 3 critical bugs.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_e2e_investigation_test.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## E2E Test: Coffee Moisture → Suspected Cause Hub

Full investigation journey tested via Claude Code --chrome browser testing against Azure dev server (localhost:5173).

**Dataset:** Coffee Moisture (30 rows, 1 factor: Drying_Bed, specs: USL=12, Target=11, LSL=10)

### Verified PASS
- Sample loading + spec detection modal (Cpk 0.26, Cp 1.01)
- All 4 chart slots render (I-Chart, Boxplot, Pareto, Histogram/Probability)
- Stats compute correctly (n=30, Mean 11.74, σ 1.05)
- Process shift warning detected
- Filter drill-down via boxplot click
- PI Panel Stats/Questions/Journal tabs
- Question added via PI panel persists to Investigation workspace
- Tree view shows QuestionNode with SUSPECT badge
- InvestigationConclusion section appears when cause role set
- HubComposer form opens and accepts name + synthesis
- Hub "Drying Bed C Overheating" created with R²adj badge
- All 5 workspace tabs accessible (Overview, Analysis, Investigation, Improvement, Report)
- Zero console errors

### Key UX observations
- **Cause-role button** only appears on questions with status `answered` or `investigating` (by design — methodology guard)
- **Factor Intelligence** requires ≥2 factors for auto-question generation — single-factor datasets rely on manual questions
- **Finland Arrivals** sample not accessible from empty state grid (cut off by `.slice(0, 8)` — only 8 samples shown)
- **Boxplot right-click context menu** works for color highlights and "Add observation"

**How to apply:** Use this as baseline for future E2E regression tests. The investigation flow is now verified working.
