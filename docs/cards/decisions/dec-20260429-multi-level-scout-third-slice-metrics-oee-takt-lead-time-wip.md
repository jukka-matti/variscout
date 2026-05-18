---
title: 'Multi-level SCOUT third-slice metrics (OEE / takt / lead time / WIP + cross-investigation hypothesis frequency)'
purpose: decide
tier: card
status: named-future
date: 2026-04-29
topic: ['named-future', 'capability', 'investigation', 'adr']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---

> **Decision card** — extracted from `docs/decision-log.md` §3 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Multi-level SCOUT third-slice metrics (OEE / takt / lead time / WIP + cross-investigation hypothesis frequency)

**Source:** [`docs/archive/specs/2026-04-29-multi-level-scout-design.md`](archive/specs/2026-04-29-multi-level-scout-design.md) §8 Sequencing — third slice

**Defer date:** 2026-04-29

**Rationale:** `computeOEE`, `computeTaktTime`, `computeLeadTime`, `computeWIP` (operational metrics); `computeCrossInvestigationHypothesisFrequency` (frequency count, not aggregation — ADR-073 holds); per-mode multi-level expansion to Yamazumi / Performance / Defect / Capability beyond Standard EDA.

**Where it'd live if built:** `packages/core/src/throughput/` + `findings/aggregate.ts`; per-mode strategies
