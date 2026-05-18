---
title: 'Capability view needs rational subgroups to be useful'
description: 'Samples that rely on capability view must seed subgroupConfig with n=5+ rolling subgroups; default size=1 produces an empty chart'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 49cf181f3792200b
origin-session-id: 0ae19f95-e263-4761-a944-87c150a32a2f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_capability_view_defaults.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When building a seeded sample that tells a capability-gap story, DO NOT rely on the default `subgroupConfig`. Set `{method:'fixed-size', size:5}` (or 10) in the sample's config.

**Why:** `DEFAULT_SUBGROUP_CONFIG = {size:1, method:'fixed-size'}` in `projectStore.ts`. With size=1, each observation is its own "subgroup" of 1, so Cpk can't be computed per-subgroup (needs within-group variance). The capability I-chart ends up rendering 3 points or fewer from fallback behavior — pedagogically empty. Same issue kills the capability-mode boxplot of per-subgroup Cpk distributions. Discovered while shipping the syringe-barrel-weight demo (PR #65) after the first browser walkthrough showed an almost-empty capability chart.

**How to apply:**
- For a 300-row sample, `size:5` → ~60 meaningful Cpk-over-time points
- For blocked-by-factor data (e.g. 100 rows per lot sequentially), rolling subgroups naturally fall within factor blocks — good for per-factor Cpk boxplots
- Alternative: `{method:'column', column:'Lot_ID'}` if you want Cpk-per-factor-level
- Also seed `displayOptions.standardIChartMetric:'measurement'` so the sample lands on the raw-value I-chart, not capability — capability becomes a deliberate user toggle in the demo walkthrough
