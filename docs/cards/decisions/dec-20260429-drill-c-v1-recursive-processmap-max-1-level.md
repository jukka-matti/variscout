---
title: 'Drill C V1 (recursive ProcessMap, max 1 level)'
purpose: decide
tier: card
status: named-future
date: 2026-04-29
topic: ['named-future', 'capability']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---

> **Decision card** — extracted from `docs/decision-log.md` §3 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Drill C V1 (recursive ProcessMap, max 1 level)

**Source:** [`docs/archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md`](archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) §3 (Drill C), §8 step 2

**Defer date:** 2026-04-29

**Rationale:** Step → sub-flow navigation when a step references a child ProcessMap. Data model supports it; dashboard primitive ready; navigation affordance + recursion guard + breadcrumb UX is the work.

**Where it'd live if built:** Hub Capability tab + Operations band wiring
