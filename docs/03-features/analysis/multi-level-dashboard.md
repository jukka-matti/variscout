---
tier: living
purpose: design
title: Multi-Level Dashboard
audience: human
category: analysis
status: active
related: [timeline-window-investigations, capability, process-hub-capability, stats-panel]
layer: L3
kind: ui
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
last-reviewed: 2026-05-18
---

# Multi-Level Dashboard

SCOUT's analysis dashboard reads the three Process Learning Levels — system **outcome (L1 Y)**, **process flow (L2 X)**, and **local mechanism (L3 x)** — on the same screen without re-rendering the workspace for each level and without the analyst leaving SCOUT. Each surface owns exactly one level and lenses the others by linking, never by re-rendering.

> **Journey phase:** SCOUT — multi-level reading. FRAME owns L2 authoring; Investigation Wall owns L3 hypothesis canvas.

## Problem

A typical process question crosses levels: "the outcome shifted last month — is the flow worse, or is a specific step worse?" Tools that force the analyst to switch workspaces for each level break the reasoning chain. SCOUT solves this by keeping the L1 reading surface as the entry point and making the other three surfaces one click away with timeline-window context preserved.

## Capability claim

When an analyst opens SCOUT, the four chart slots route data based on whether the scope is baseline (B0), single-node (B1), or multi-node (B2). Crossing to the Hub Capability tab, Evidence Map, or Investigation Wall preserves the active timeline window. Findings save with window context; entering a saved Finding with a window shift >20% triggers a drift flag.

## Intent diagram (peer-surface layout)

```
┌─ SCOUT dashboard (L1 Outcome) ─────────────────────────────┐
│  [I-Chart]  [Variation Sources]                            │
│  [Adaptive Lens]  [Pareto / Capability]                    │
│  ── timeline window in chrome ──────────────────           │
└────────────────────────────────────────────────────────────┘
        ↕ link (window context preserved)        ↕
┌─ Hub Capability tab ─┐  ┌─ Evidence Map ─┐  ┌─ Investigation Wall ─┐
│   L2 Flow reading    │  │  Factor net    │  │  L3 Mechanism canvas │
└──────────────────────┘  └────────────────┘  └──────────────────────┘
```

## When to use which surface

- **Outcome question** ("Is the customer-facing measurement in spec? When did it shift?") → SCOUT dashboard with the timeline picker.
- **Flow question** ("Which step is the bottleneck? Which step has the worst Cpk?") → Process Hub Capability tab.
- **Mechanism question** ("What evidence supports this suspected cause? What's missing?") → Investigation Wall.
- **Factor question** ("Which factors drive this Y? How are they connected?") → Evidence Map.

The dashboard does not try to answer all four — it is the L1 reading surface. The other three are one click away.

## Acceptance signals

- Opening SCOUT with B0/B1/B2 data routes the four chart slots correctly (no manual mode switch).
- Clicking a Finding to its Evidence Map factor preserves the timeline window in the URL.
- Entering a Finding whose saved window has drifted >20% surfaces a drift badge.
- No analyst-visible Cpk number aggregates across heterogeneous steps (ADR-073).

## Out of scope

- New chart types in V1.
- Drill C, Plan D, or per-mode multi-level expansion beyond Standard EDA.
- FRAME thin-spot helpers (deferred — see decision-log §5).
- Re-rendering the workspace per level (rejected; see L4 alternatives).

## Engineering detail

See [`05-technical/scout-level-spanning.md`](../../05-technical/scout-level-spanning.md) for the boundary-enforcement mechanism, scope detection strategy, drift threshold, and testing approach.

## See also

- [Timeline Windows in Investigations](timeline-window-investigations.md)
- [Multi-level SCOUT design spec](../../superpowers/specs/2026-04-29-multi-level-scout-design.md)
- [ADR-074 — surface boundary policy](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md)
- [Process Hub Capability](process-hub-capability.md)
- [Statistics Panel](stats-panel.md)
