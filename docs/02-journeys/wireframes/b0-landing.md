---
tier: living
purpose: design
title: 'View: b0 landing — paste/sample arrival on the Process tab'
audience: human
status: active
layer: L2
topic: [wireframes, b0, landing, framing, process-tab]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `b0-landing`

Fresh data with no process map lands here (the altitude rule: "land at the highest altitude your data has established"). This is the shipped `FrameViewB0` composition (`packages/ui/src/components/FrameViewB0/`), arriving **pre-filled by inference**. Interactive wireframe: [`assets/b0-landing.html`](assets/b0-landing.html).

```
┌──────────────────────────────────────────────────────────────────┐
│ ⩓ VariScout   Untitled project · unsaved        Home Project     │
│                                                 [Process] Explore │
│                                                 Analyze … Report  │
├──────────────────────────────────────────────────────────────────┤
│ Pasted · 800 rows · 6 columns · 0.4% missing        Fix data…    │ ← provenance + hatch
│                                                                    │
│ ⏱ Dates detected in Timestamp — added Day of Week + Month         │ ← quiet chip (undoable)
│    as factors.  Adjust ▾                                    ✕     │
│ ⛓ These look like step timestamps — 3 start/end pairs.            │ ← loud banner
│    [Build process model]  Not now                                  │   (unit-of-analysis tier)
│                                                                    │
│ What do you want to investigate?                                   │
│ your Y / output measurement  (run order: Timestamp)                │
│  [● Cycle_Time_sec ▂▅▃▇▂ ✓]  [ Temp_C ▃▃▄▃▃ ]  [ Pressure ]       │ ← top Y pre-selected,
│  + add spec limits (USL / LSL / target)                            │   siblings visible
│                                                                    │
│ What might be affecting it?                                        │
│ your X's / inputs                                                  │
│  SELECTED   [Step ✓] [Operator ✓] [Day of Week · derived ✓]        │
│  AVAILABLE  [Month · derived] [Batch_ID · 42 levels]               │
│                                                                    │
│ ▸ Add process steps   (optional — when X's belong to stages)       │
│                                                                    │
│ [ See the data → ]   opens Explore with this Y and these X's       │
└──────────────────────────────────────────────────────────────────┘
```

## Interaction contract

- **Click assigns a role** (Y chip, X toggle). No drag at b0 — there are no places yet (see the click-vs-drag continuity rule, spec §2).
- Top Y **pre-selected, never alone**: top-3 sibling candidates stay visible; a wrong pick is one click to fix.
- **No-numeric-Y guard:** empty `rankYCandidates` → "I expected the outcome to be \_\_\_" banner + skip, never a disabled dead-end CTA.
- **Detection tiers:** quiet chips auto-apply + undo; loud banners (defect / wide / step-timestamps) confirm-not-auto.
- **"Fix data…"** opens the demoted ColumnMapping (messy pastes, stack names, type overrides); auto-surfaces on low inference confidence; never wipes pasted data on cancel.
- "See the data →" gates on Y selected; carries Y/X into Explore.
- Multi-outcome selection must reach parity with the old wizard before it demotes (spec §7 guarded regression).
