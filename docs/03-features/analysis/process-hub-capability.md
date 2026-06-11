---
tier: living
purpose: design
title: 'Process Hub Capability Tab'
audience: human
category: analysis
status: active
last-reviewed: 2026-06-11
related: [production-line-glance, process-hub, capability, hub-cadence-review]
layer: L3
kind: ui
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
---

# Process Hub Capability Tab

The Process Hub Capability tab is the process-owner cadence-review surface for hub-level capability. Olivia (OpEx) and Gary (Green Belt) use it to answer "is this hub meeting its capability target across its steps, where is the gap widening, and which step deserves attention this week?" — without leaving the Hub view, and without ever seeing a single aggregated hub-level Cpk number.

## Problem

A hub contains many steps, each with its own spec context. Process owners need a weekly cadence view: which steps are on target, which are drifting, and which contribute most to defect volume. Aggregating across heterogeneous specs into a single hub-level Cpk hides the heterogeneity (ADR-073). The tab solves this by showing the per-step Cpk **distribution** — the analyst's eye does the pattern recognition.

## Capability claim

When a process owner opens the Capability tab on a Hub, four charts render the per-step Cpk trend, the Cp-Cpk centering gap over time, the per-step Cpk distribution, and the per-step error Pareto — all within a hub-level URL-shareable filter context. The Cpk trend uses the shared `CpkTrajectoryChart` grammar that Explore's **Capability over time** lens uses for subgroup Cpk. Clicking any step opens the investigation that maps it (Drill A); unmapped scopes surface a non-blocking B0 banner to FRAME.

## Intent diagram (2x2 chart grid)

```
┌─ Hub Capability tab (route: /hub/:hubId/capability) ────────────────┐
│  Filter strip (URL-serialized)                                      │
├──────────────────────────────────┬──────────────────────────────────┤
│  Cpk vs target i-chart           │  Cp-Cpk gap trend                │
│  (per-step trend + target)       │  (centering loss over time)      │
├──────────────────────────────────┼──────────────────────────────────┤
│  Per-step Cpk boxplot            │  Per-step error Pareto           │
│  (load-bearing distribution view)│  (defect-volume contribution)    │
└──────────────────────────────────┴──────────────────────────────────┘
   ↳ Drill A on any step → investigation that maps that step
```

The boxplot is the load-bearing visualization: it shows the per-step Cpk _distribution_ without collapsing it into a mean.

## Acceptance signals

- Opening the tab on a hub with mapped steps renders all four charts.
- A hub with unmapped nodes (B0 scope) shows a non-blocking banner linking to the FRAME mapper; the dashboard still renders for the mapped portion.
- Clicking a step in any chart opens the mapping investigation (Drill A). If no investigation maps it, the drill becomes "create investigation here".
- The tab never displays a single hub-level Cpk number — confirmed structurally by the architecture test (no `meanCapability` / `aggregateCpk` import anywhere in the tab subtree).
- URL-serialized filter state round-trips: paste a shared URL → identical filter strip state.

## Coexistence with Performance mode

Performance mode (per-channel Cpk inside one investigation) is _within-step_: how do the cavities/heads/lanes of a single station compare? The Hub Capability tab is _across-step_: how do the steps of a hub compare? Both can be open at once for the same hub; they answer different questions.

## Out of scope

- Any hub-level aggregate Cpk number (ADR-073 invariant).
- PWA support — Hub IA is Azure-only today.
- New Drill B / C semantics — Drill A is the only drill type the tab supports.

## Engineering detail

See [`05-technical/hub-capability-tab.md`](../../05-technical/hub-capability-tab.md) for the route mount, slot contract, B0 banner mechanism, no-aggregation structural enforcement, and testing approach.

## See also

- [Production-Line-Glance design](../../superpowers/specs/2026-04-28-production-line-glance-design.md) — the dashboard primitive.
- [Investigation Scope and Drill Semantics](../../archive/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) — B0/B1/B2 scope, Drill A/B/C.
- [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md) — no statistical roll-up across heterogeneous units.
- [Process Hub design](../../archive/specs/2026-04-25-process-hub-design.md) — the operating spine the tab plugs into.
