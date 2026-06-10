---
tier: living
purpose: design
title: 'View: control verification band'
audience: human
status: active
layer: L2
topic: [wireframes, control, verification, baseline, report]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md
  - docs/03-features/workflows/control.md
---

# View: `control-verification-band`

The Control verification band is the Project-stage evidence surface for "is the improvement holding?" It uses the analyst's improvement date, a frozen baseline, and the latest re-check to show before / after / now on one storyboard. Interactive wireframe: [`assets/control-verification-band.html`](assets/control-verification-band.html).

```
Control · Verification
┌────────────────────────────────────────────────────────────────────────────┐
│ Re-check due by suggestion only: Jun 17      [Log re-check] [Edit setup]  │
│ Measure: Fill Weight · baseline frozen Apr 1-30 · ladder 7 / 30 / 90 /180 │
├────────────────────────────────────────────────────────────────────────────┤
│ I-Chart                                                                    │
│   before baseline      improvement date       current re-check             │
│   ────────●●●●●●●●●────│────────●●●●●─────────│────●●●●●────               │
│              baseline limits                  now limits    drift flag     │
├──────────────────────────┬──────────────────────────┬──────────────────────┤
│ Before                   │ After                    │ Now                  │
│ n 30 · mean 100          │ n 28 · mean 99.2         │ n 24 · mean 99.4     │
│ sigma 1.00 · Cpk 0.86    │ sigma 0.76 · Cpk 1.21    │ sigma 0.72 · Cpk 1.28│
│ frozen baseline anchor   │ first effect check       │ latest re-check      │
└──────────────────────────┴──────────────────────────┴──────────────────────┘
```

## Interaction contract

- The top band is a phase-split I-Chart. The improvement date is the primary split marker.
- Baseline limits and now limits are visually distinct; they are evidence, not verdicts.
- The three comparison panels share units and scale language: Before / After / Now.
- The band can render from live rows, or from the frozen baseline when the baseline-period rows are no longer available.
- The primary action is **Log re-check**. Logging a re-check records an analyst verdict and frozen now-stats; it never auto-promotes the Control record.
- Suggested dates are calm prompts. No overdue/amber/red states are part of this view.
- Closure happens below this band in the Control stage checklist: handoff recorded, owner accepted, ladder walked or override reason, and analyst-confirmed sustainment.
