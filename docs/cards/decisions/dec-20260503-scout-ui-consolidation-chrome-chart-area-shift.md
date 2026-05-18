---
title: 'Scout UI consolidation (chrome → chart-area shift)'
purpose: decide
tier: card
status: active
date: 2026-05-03
topic: ['decisions', 'chart', 'stats', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Scout UI consolidation (chrome → chart-area shift)

Phase tabs collapse into the top app bar; the Process Health Bar gains a global **Time lens** (Cumulative / Rolling / Fixed / Open-ended) that filters every chart and the page-level stats; per-chart cards collapse to a single header row (controls inline with title); Boxplot factor tabs become one dropdown; the Verify card's segmented control IS the title (no separate title text). The four-button Fixed/Rolling/Open/Cumulative cluster previously buried inside the I-Chart card is removed in favour of the global lens — `Set specs` continues to apply to the unfiltered population. Findings recorded under a non-Cumulative lens snapshot the lens state for replay. Source: [`docs/superpowers/specs/2026-05-03-scout-ui-consolidation-design.md`](superpowers/specs/2026-05-03-scout-ui-consolidation-design.md); execution plan at [`docs/superpowers/plans/2026-05-03-scout-ui-consolidation.md`](superpowers/plans/2026-05-03-scout-ui-consolidation.md). _Pinned 2026-05-03; in flight on `scout-ui-consolidation` worktree._
