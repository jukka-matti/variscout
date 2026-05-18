---
title: 'Per-node distinct context dimensions'
purpose: decide
tier: card
status: named-future
date: 2026-04-28
topic: ['named-future', 'capability']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §3 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Per-node distinct context dimensions

**Source:** Yesterday's brainstorm at `~/.claude/plans/we-just-implemented-phase-delightful-adleman.md` line 101

**Defer date:** 2026-04-28

**Rationale:** A tributary-attached column that differs from sibling tributaries' columns. Edge case; `null` default rule covers the 95% case. V2 of production-line-glance.

**Where it'd live if built:** Engine extension to `calculateNodeCapability` lookup
