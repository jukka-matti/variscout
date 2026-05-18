---
title: 'Multi-level SCOUT second-slice metrics (cycle time / FPY / RTY + drift coaching)'
purpose: decide
tier: card
status: named-future
date: 2026-04-29
topic: ['named-future', 'coscout', 'wall', 'stats']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §3 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Multi-level SCOUT second-slice metrics (cycle time / FPY / RTY + drift coaching)

**Source:** [`docs/superpowers/specs/2026-04-29-multi-level-scout-design.md`](superpowers/specs/2026-04-29-multi-level-scout-design.md) §8 Sequencing — second slice

**Defer date:** 2026-04-29

**Rationale:** `computeCycleTime` (hub-time, distinct from Yamazumi's activity framing), `computeFirstPassYield`, `computeRolledThroughputYield`, CoScout drift hint when finding-window stats diverge from current-window beyond threshold, badge-driven Wall handoff refinement. Deferred behind first-slice landing (architecture + window primitive + L2 throughput basics).

**Where it'd live if built:** `packages/core/src/throughput/` extension; `findings/drift.ts` coaching wiring
