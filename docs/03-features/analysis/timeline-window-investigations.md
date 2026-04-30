---
title: Timeline Windows in Investigations
audience: [analyst]
category: analysis
status: delivered
related: [multi-level-dashboard, capability, process-hub-capability, staged-analysis]
---

# Timeline Windows in Investigations

VariScout investigations now carry an explicit **timeline window** — the period of time the analysis applies to. The window is a first-class part of the investigation alongside filters, factors, and findings. Choose the window once and every chart on the dashboard, every Finding you save, and every drift comparison agrees on the same temporal scope.

> **Journey phase:** SCOUT (and Process Hub Capability tab) — answers Watson's third question, _"When does this happen?"_

---

## Where the picker lives

The timeline-window picker lives in the **dashboard chrome above the chart grid**, in `DashboardLayoutBase`. It is _not_ part of `FilterContextBar` — that bar stays focused on factor filters and exports as a per-chart summary. The window picker is a peer of the filter chips and the mode selector: a single control that affects every chart in the dashboard at once.

Findings record the active window at the time they were saved. When you re-open a Finding later, the footer shows the original window and flags drift if today's window now disagrees with the data shape it was created in.

---

## The four window kinds

| Kind           | Shape                           | When to use                                                                                                          |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Fixed**      | `[start, end]` — explicit dates | Closing a PPAP submission, comparing Q1 vs Q2, before/after a known process change.                                  |
| **Rolling**    | "Last N days/weeks/months"      | Live monitoring on the Process Hub. Default for hub-time so the cadence (weekly, monthly) matches the review rhythm. |
| **Open-ended** | `[start, …)` — start, no end    | Investigation-time. The default for new investigations: capture everything since the issue surfaced and let it grow. |
| **Cumulative** | All data through `end`          | Baseline (B0) reads, regression baselining, and capability snapshots that intentionally include all history.         |

Each kind is a tagged variant of the `TimelineWindow` discriminated union, so the engine can apply the same `applyWindow()` to whichever shape the analyst chose. There is no separate "timeline filter" type — the window _is_ the temporal scope.

---

## Defaults per surface

V1 ships with sensible defaults so the picker rarely needs touching:

- **Investigation dashboard (SCOUT):** `open-ended`, starting at the earliest row in the data. The investigation grows as new data arrives.
- **Process Hub Capability tab (hub-time):** `rolling`, matched to the hub's cadence. Weekly cadence → last 7 days. Monthly cadence → last 30 days.
- **Production-line-glance baseline (B0):** `cumulative`. The baseline read intentionally includes all history.

Override the default at any time via the picker in the dashboard chrome. The choice is **session-local** in V1: it does not persist across reloads. V2 will persist the window inside the investigation envelope so re-opening an investigation restores the same window.

---

## How the choice flows through

1. The picker writes to the active investigation (or the hub-time surface) via `useTimelineWindow`.
2. The strategy's `dataRouter` reads the window and passes filtered rows to every metric module — capability, throughput, drift, output-rate.
3. Findings saved while a window is active record a `WindowContext` (the window kind + start/end + active filter chips).
4. Drift detection (`computeFindingWindowDrift`) compares the saved Finding context against today's window when you re-open the Finding. If the relative change exceeds 20% (default threshold), the Finding's footer flags drift and CoScout offers to re-run the analysis on the current window.

The window is the same primitive used by re-upload (append-mode merge) so additions are deduplicated against the existing window's data range.

---

## Common patterns

- **Closing a finding for PPAP:** switch the window from `open-ended` to `fixed [start, end]` once the analysis period is locked. Existing Findings record the lock-in window.
- **Watching the hub in real time:** leave the hub-time picker on `rolling`. Each visit shows the most recent N days against current specs.
- **Comparing before/after an improvement:** save a Finding under the "before" `fixed` window, run improvement, then switch to the "after" `fixed` window. The Finding footer will flag drift, making the comparison explicit.

---

## See also

- [Multi-Level Dashboard](multi-level-dashboard.md) — how SCOUT spans levels and where the timeline picker sits.
- [Timeline Window Architecture](../../05-technical/architecture/timeline-window-architecture.md) — the engineer-facing contract.
- [Multi-level SCOUT design spec](../../superpowers/specs/2026-04-29-multi-level-scout-design.md) — full design context.
- [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md) — surface boundary policy.
- [Staged Analysis](staged-analysis.md) — the related but distinct "phases inside one window" pattern.
