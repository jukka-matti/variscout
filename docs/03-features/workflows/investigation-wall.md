---
title: 'Investigation Wall'
audience: [analyst, engineer]
category: workflow
status: stable
last-reviewed: 2026-04-29
related: [investigation-spine, evidence-map, suspected-cause, question-driven-eda, hmw-brainstorm]
---

# Investigation Wall

The Investigation Wall is a hypothesis-centric projection of the investigation graph. Where the Evidence Map asks _"which factors matter?"_, the Wall asks _"which hypotheses are we betting on, what evidence holds them, and what's missing?"_ Both are projections of the same `SuspectedCause + CausalLink + Finding + Question` graph — same data, different lens.

## What the Wall does

The Wall turns suspected causes into **disconfirmable claims**, not labels. It surfaces investigation gaps proactively: missing disconfirmation, orphan questions, uncovered high-R² columns. The "missing evidence — the detective move nobody ships" critique strip is the load-bearing methodological move; it nudges investigators to ask what would _contradict_ a hypothesis, not just what supports it.

## What's on it

Five horizontal bands stack vertically inside the Investigation workspace canvas:

| Band                 | Contents                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**          | Problem condition card — CTS column, live Cpk, events/wk                                                                                                                    |
| **Waterline**        | Dashed labeled divider                                                                                                                                                      |
| **Hypothesis**       | Hub cards with embedded interactive mini-charts and status-tinted borders; question pills; AND / OR / NOT gate nodes connecting down from Problem into convergence branches |
| **Evidence**         | Finding chips, gemba chips, best-subsets suggestion cards, tethered by dashed lines to their parent hub                                                                     |
| **Tributary footer** | Live chip row from `processMap.tributaries`; each chip labeled with column and referencing hypotheses (derived); orphan tributaries dimmed                                  |

A collapsed "missing evidence" digest bar sits below the canvas. Per-hypothesis warning badges are the primary gap signal; the digest bar is a secondary expandable list.

## How it sits alongside Evidence Map

The Investigation workspace has a `Map | Wall` view toggle in its header (persisted per project). Map remains the default — ADR-066 stands. Both views read the same investigation graph; switching is non-destructive and instant.

| Surface            | Lens               | Best for                                                                 |
| ------------------ | ------------------ | ------------------------------------------------------------------------ |
| Evidence Map       | Factor-centric     | "Which columns / factors explain variation?"                             |
| Investigation Wall | Hypothesis-centric | "What hypotheses do we hold, what backs each, what would contradict it?" |
| Question framework | Question-centric   | "What are we trying to answer, and have we answered it yet?"             |

## Interactions

- **Drag-to-arrange** — hub cards reposition via @dnd-kit; layout persists in `wallLayoutStore`.
- **Command palette** (`Cmd-K` / `Ctrl-K`) — quick navigation: jump to hub, create hypothesis, run AND-check.
- **Minimap** — top-right miniature of the canvas for orientation when zoomed in.
- **Mobile cards** — on phone widths the Wall renders as a vertical card stack (`MobileCardList`) rather than the SVG canvas.

## Tier availability

Azure-only (Standard and Team tiers). Shipped via PRs #75 and #76, merged 2026-04-24. PWA does not include the Wall; PWA's investigation flow stays Map-only by design.

## See also

- [Investigation Wall design spec](../../superpowers/specs/2026-04-19-investigation-wall-design.md) — full design, including non-goals (live presence, per-step Cpk).
- [Evidence Map design](../../superpowers/specs/2026-04-05-evidence-map-design.md) — the factor-centric companion projection.
- [Investigation Spine](../../superpowers/specs/2026-04-04-investigation-spine-design.md) — three threads, the methodology backbone the Wall plugs into.
- [Methodology — three projections](../../01-vision/methodology.md) — how Map / Wall / Question framework relate as projections of one graph.
