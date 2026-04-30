---
title: Multi-Level Dashboard
audience: [analyst]
category: analysis
status: delivered
related: [timeline-window-investigations, capability, process-hub-capability, stats-panel]
---

# Multi-Level Dashboard

SCOUT's analysis dashboard now spans the three Process Learning Levels. The same screen reads the **system outcome** (L1 Y), the **process flow** (L2 X), and the **local mechanism** (L3 x) — without re-rendering the workspace for each level and without the analyst leaving SCOUT.

> **Journey phase:** SCOUT — multi-level reading. FRAME owns L2 authoring; Investigation Wall owns L3 hypothesis canvas.

---

## What "multi-level" means here

Each VariScout surface owns exactly one level and lenses the others by linking, never by re-rendering. The boundary is enforced structurally; see [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).

| Level                  | Owned by                                         | Lensed by                                            |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **L1 — Outcome (Y)**   | SCOUT dashboard                                  | Hub Capability tab, Investigation Wall, Evidence Map |
| **L2 — Flow (X)**      | FRAME (authoring) + Hub Capability tab (reading) | SCOUT chrome, Investigation Wall                     |
| **L3 — Mechanism (x)** | Investigation Wall                               | SCOUT (factor selectors), Evidence Map, INVESTIGATE  |

In SCOUT V1, the multi-level reading is delivered by:

1. **Scope detection** — the strategy detects whether the data covers a baseline (B0), a single-node investigation (B1), or multiple nodes (B2) and routes data to the four chart slots accordingly. No new charts; the existing four-slot grid stays the same.
2. **Timeline windows** — every chart, every metric, and every Finding agrees on the same temporal scope. See [Timeline Windows in Investigations](timeline-window-investigations.md).
3. **Throughput basics** — `computeOutputRate` and `computeBottleneck` ship in V1 to give L2 (flow) reading a baseline. Cycle time, FPY, RTY arrive in the second slice; OEE, takt, lead time, and WIP in the third. See spec §8.

---

## How the surfaces relate

SCOUT, the Process Hub Capability tab, the Evidence Map, and the Investigation Wall are **peers** in V1 — not siblings inside one pane. The dashboard is the entry point; the others are link targets.

| Surface                | Role                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **SCOUT dashboard**    | Outcome reading. Four chart slots. Timeline window in chrome. Findings saved with window context. |
| **Hub Capability tab** | Flow reading. Per-step Cpk distribution, capability over time, hub-time rolling default.          |
| **Evidence Map**       | Factor network. Click a factor → focus its statistical context. Receives links from Findings.     |
| **Investigation Wall** | Hypothesis canvas. Hubs accumulate evidence (data + Gemba + expert) per SuspectedCause.           |

Crossing surfaces preserves the active timeline window. When you click from a Finding to its Evidence Map factor, or from a Hub Capability bar to a SuspectedCause hub, the window context travels with you. Drift detection runs on entry: if today's window has shifted more than 20% from the saved Finding context, the Finding flags it.

---

## What V1 does not change

- The four chart slots (I-Chart, Variation Sources, Adaptive Lens, Pareto/Capability) keep their roles.
- Drill A (drill into a single factor) keeps its existing semantics.
- No new chart types. No Drill C, no Plan D, no per-mode multi-level expansion beyond Standard EDA.
- FRAME thin-spot helpers stay deferred — see decision-log §5.

---

## When to use which surface

- **Outcome question** ("Is the customer-facing measurement in spec? When did it shift?") → SCOUT dashboard with the timeline picker.
- **Flow question** ("Which step is the bottleneck? Which step has the worst Cpk?") → Process Hub Capability tab.
- **Mechanism question** ("What evidence supports this suspected cause? What's missing?") → Investigation Wall.
- **Factor question** ("Which factors drive this Y? How are they connected?") → Evidence Map.

The dashboard does not try to answer all four — it is the L1 reading surface. The other three are one click away.

---

## See also

- [Timeline Windows in Investigations](timeline-window-investigations.md)
- [Timeline Window Architecture](../../05-technical/architecture/timeline-window-architecture.md)
- [Multi-level SCOUT design spec](../../superpowers/specs/2026-04-29-multi-level-scout-design.md)
- [ADR-074 — surface boundary policy](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md)
- [Process Hub Capability](process-hub-capability.md)
- [Statistics Panel](stats-panel.md)
