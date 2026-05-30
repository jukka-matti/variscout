---
tier: living
purpose: design
title: 'Investigation Wall'
audience: human
category: workflow
status: active
last-reviewed: 2026-04-29
related:
  [
    investigation-spine,
    evidence-map,
    problem-statement-scope,
    hypothesis,
    hmw-brainstorm,
    adr-085,
    adr-086,
  ]
layer: L3
kind: ui
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
---

# Investigation Wall

The Investigation Wall is a hypothesis-centric projection of the investigation graph. Where the Evidence Map asks _"which factors contribute to variation?"_, the Wall asks _"which hypotheses are we betting on, what evidence holds them, and what's missing?"_ Both are projections of the same `ProblemStatementScope + Hypothesis + CausalLink + Finding` graph — same data, different lens. See [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md) and [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md).

## What the Wall does

The Wall turns suspected causes into **disconfirmable claims**, not labels. It surfaces investigation gaps proactively: missing disconfirmation, orphan questions, uncovered high-R² columns. The "missing evidence — the detective move nobody ships" critique strip is the load-bearing methodological move; it nudges investigators to ask what would _contradict_ a hypothesis, not just what supports it.

## What's on it

Five horizontal bands stack vertically inside the Investigation workspace canvas:

| Band                 | Contents                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**          | Problem condition card — CTS column, live Cpk, events/wk                                                                                                                        |
| **Waterline**        | Dashed labeled divider                                                                                                                                                          |
| **Hypothesis**       | Hypothesis cards with embedded interactive mini-charts and `Hypothesis.status`-tinted borders; AND / OR / NOT gate nodes connecting down from Problem into convergence branches |
| **Evidence**         | Finding chips, gemba chips, best-subsets suggestion cards, tethered by dashed lines to their parent hub                                                                         |
| **Tributary footer** | Live chip row from `processMap.tributaries`; each chip labeled with column and referencing hypotheses (derived); orphan tributaries dimmed                                      |

A collapsed "missing evidence" digest bar sits below the canvas. Per-hypothesis warning badges are the primary gap signal; the digest bar is a secondary expandable list.

## Intent diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Problem │ CTS: cycle_time_s    Cpk 0.74   events/wk 12              │
├─────────────────────────────────────────────────────────────────────┤
│ Waterline ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                              ┌───AND───┐                            │
│ Hypothesis  ┌──────────────┐ │    ▼    │ ┌──────────────┐  ⚠ gap   │
│             │ Hub: Nozzle  │ │         │ │ Hub: Shift   │           │
│             │ wear         │ │   OR    │ │ handover     │           │
│             │ [mini I-Ch.] │ │         │ │ [mini boxpl.]│           │
│             │ HOLDS 3/4    │ │         │ │ HOLDS 1/3    │           │
│             └──────┬───────┘ └────┬────┘ └──────┬───────┘           │
│ Evidence    F#12 ──┘    Q#7 ──┘  gemba ──┘   best-subset card       │
├─────────────────────────────────────────────────────────────────────┤
│ Tributaries │ machine │ shift │ operator(dim) │ material            │
└─────────────────────────────────────────────────────────────────────┘
  Missing-evidence digest (collapsed) ▾   │  Map │ Wall ◀── view toggle
```

Five horizontal bands stack inside the Investigation workspace canvas; hub cards reposition via @dnd-kit and `wallLayoutStore` persists layout per project.

## How it sits alongside Evidence Map

The Investigation workspace has a `Map | Wall` view toggle in its header (persisted per project). Map remains the default — ADR-066 stands. Both views read the same investigation graph; switching is non-destructive and instant.

| Surface            | Lens               | Best for                                                                 |
| ------------------ | ------------------ | ------------------------------------------------------------------------ |
| Evidence Map       | Factor-centric     | "Which columns / factors contribute to variation?"                       |
| Investigation Wall | Hypothesis-centric | "What hypotheses do we hold, what backs each, what would contradict it?" |

> **Note (ADR-085):** The Question framework is no longer a third projection surface. `Question` as a tracked entity has been retired; question generation is transient ranked factor-node metadata. The Wall subsumes the completeness-tracking role the question checklist previously played.

## Interactions

- **Drag-to-arrange** — hub cards reposition via @dnd-kit; layout persists in `wallLayoutStore`.
- **Command palette** (`Cmd-K` / `Ctrl-K`) — quick navigation: jump to hub, create hypothesis, run AND-check.
- **Minimap** — top-right miniature of the canvas for orientation when zoomed in.
- **Mobile cards** — on phone widths the Wall renders as a vertical card stack (`MobileCardList`) rather than the SVG canvas.

## Tier availability

Azure-only (single €120 SKU). Shipped via PRs #75 and #76, merged 2026-04-24. PWA does not include the Wall; PWA's investigation flow stays Map-only by design.

## See also

- [Investigation Wall design spec](../../superpowers/specs/2026-04-19-investigation-wall-design.md) — full design, including non-goals (live presence, per-step Cpk).
- [Evidence Map design](../../archive/specs/2026-04-05-evidence-map-design.md) — the factor-centric companion projection.
- [Investigation Spine](../../superpowers/specs/2026-04-04-investigation-spine-design.md) — three threads, the methodology backbone the Wall plugs into.
- [Methodology — two projections](../../01-vision/methodology.md) — how Map / Wall relate as projections of one investigation graph (ADR-085/ADR-086).
