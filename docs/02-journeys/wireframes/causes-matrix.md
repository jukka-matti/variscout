---
tier: living
purpose: design
title: 'View: Causes matrix — the cause-verification table (ADR-086 matrix lens)'
audience: human
status: active
layer: L2
topic: [wireframes, wall, analyze, causes-matrix, ach-lens, verification]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/02-journeys/wireframes/suspected-cause-card.md
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
---

# View: `causes-matrix`

The all-causes overview ("see the different hypotheses nicely") as a **cause-verification matrix** — the concrete V1 form of ADR-086's "optional ACH matrix lens (evidence × hypotheses grid) … a toggle on the same data". HTML asset: [causes-matrix.html](assets/causes-matrix.html) (matrix section at the bottom).

```
 [Map] [Wall] [Causes]                                    4 causes · 1 verified
┌────────────────────┬─────────┬─────────┬─────────┬───────────┬─────────────────┬───────────┐
│ Suspected cause    │ 📊 Data │ 👁 Gemba │ 💬 Expert│ Break     │ In flight       │ Verdict   │
│                    │         │         │         │ attempts  │                 │           │
├────────────────────┼─────────┼─────────┼─────────┼───────────┼─────────────────┼───────────┤
│ Equipment diff A→B │ 2-smp ✓ │ jig     │ operator│ 1 survived│ —               │ Verified  │
│ Night shift staff  │ boxplot │ —       │ —       │ none      │ gemba·Matti·Tue │ Suspected │
│ Material batch     │ —       │ —       │ buyer   │ none      │ ⚠ stalled 6d    │ Suspected │
│ Maintenance sched  │ —       │ —       │ —       │ 1 failed  │ —               │ Ruled out │
└────────────────────┴─────────┴─────────┴─────────┴───────────┴─────────────────┴───────────┘
 Sponsor digest: 4 causes · 1 verified · 1 in flight · 1 stalled · 1 ruled out
```

## Interaction contract

- **Read-only projection** over `deriveHypothesisStatus` + `evidenceTypesForHypothesis` + `disconfirmationAttempts` + `MeasurementPlan` status — never re-derives, never writes. Row click → focuses the card on the Wall (spatial lens).
- Rendered as the third value on the existing `canvasViewportStore.viewMode` toggle (`map | wall | causes`). **Taxonomy: one investigation canvas, two lenses** (spatial = Wall, matrix = this). The `map` slot is interim pending the logged "does the Evidence Map survive post-Model-B?" decision (investigations.md) — this view does not cement it.
- Angle columns are populated by `Finding.evidenceType`; until the L-1 picker ships, gemba/expert columns are structurally empty — the build order gates this view on L-1.
- "In flight" = the collection logbook (owner · started/due · progress). "Stalled" highlights are the Lead's scan target.
- The digest line is the Sponsor/report summary; Report composition keeps consuming the stored 5-state statuses (ADR-090) — this view changes presentation only.
