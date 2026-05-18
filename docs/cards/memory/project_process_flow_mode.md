---
title: 'Process Flow Analysis Mode'
description: 'Fifth analysis mode — design spec complete (2026-04-07), not yet coded as of 2026-04-16; spec status is Draft'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_process_flow_mode.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Status (verified 2026-04-16 audit): DESIGN-ONLY.** Spec `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md` is marked `Draft` in `specs/index.md`. No implementation in `packages/core/src/` or `apps/`. Absent from the feature parity matrix — correctly, since it's not shipped. Do NOT cite as delivered.

Process Flow is designed as VariScout's fifth analysis mode (alongside Standard, Performance, Yamazumi, Capability; Defect is the sixth). Will analyze how output rate, cycle time, and lead time vary across a sequential production line.

**Origin:** MBB transcript (2026-03-29, "Probability plot and commenting", 00:26–05:06). Analyst needs per-station output rates to identify bottlenecks and variation sources.

**Key decisions:**
- Output rate = actual departure rate (inter-departure time from station), NOT theoretical capacity
- Rate unit configurable by analyst (per minute/hour/day/shift)
- Line output rate = what comes out of the last station
- Data shape: one row per product, paired Start/End timestamp columns per station
- Parser detects timestamp pairs → Flow Transform derives cycle times, wait times, output rates, lead time
- Station sequence preserved from column order (never normalize away)
- Parallel machines = factor within a station, not a branching path

**Architecture:** Approach C — Flow Transform layer + lightweight mode shell. Transform creates real derived columns that flow through entire pipeline. Existing stats engine (best subsets, ANOVA) does all computation. Strategy pattern defines chart slots and question strategy.

**Phasing:** Phase 1 (foundation: parser, transform, dashboard, questions), Phase 2 (Yamazumi drill-down, parallel station split, Evidence Map), Phase 3 (quality angle, probability plot integration).

**Design spec:** docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md

**Why:** Fills the gap between Yamazumi (time composition within stations) and standard variation analysis. Connects "where in the flow" to "why does output vary." Theory of Constraints thinking.
**How to apply:** This is a major new mode. When implementing, follow the strategy pattern (ADR-047) and parser detection patterns. FlowConfig parallels StackConfig.
