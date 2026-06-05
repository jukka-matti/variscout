---
tier: living
purpose: design
title: 'View: capture card — the one Finding draft card, four entry gestures'
audience: human
status: active
layer: L2
topic: [wireframes, capture, findings, brush, explore]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `capture-card`

Every capture gesture in Explore opens this one pre-filled draft card. Converges with the Wall's shipped `BrushToFindingFlow` — one gesture grammar everywhere. Interactive wireframe: [`assets/capture-card.html`](assets/capture-card.html).

```
 entries                              the one card
┌─────────────────────────┐   ┌────────────────────────────────────────┐
│ 📌 Pin (filter chips)    │   │ 📌 New Finding — I-Chart: Cycle_Time   │
│ 🖱 Brush (I-Chart range) │ → │ CONDITION  Step=2 × obs 32–58          │
│ 👆 Point (category/point)│   │ EVIDENCE   mean 41.2 vs 35.1 · n=26    │
│ ⚠ Engine signal chip     │   │ FACTOR     creates "obs 32–58" (edit)  │
└─────────────────────────┘   │ NOTE       what did you notice? (opt.)  │
                              │ [Save Finding]  Factor only · Esc       │
                              └────────────────────────────────────────┘
```

## Interaction contract

- **Brush is intent** (selects points, never zooms): card opens directly on release; `Esc`/click-away cancels.
- **A condition is always factor-expressed**: pointing at existing structure reuses it; carving gestures (brush, changepoint) **mint a derived factor on save** — auto-named, tagged derived, editable name, deleted-with-finding cleanup.
- Two actions on carve gestures: **Capture** (finding + factor) / **Factor only** (data-shaping, no observation claimed).
- Conditions **compose**: brushing while drilled into `Step=2` → `Step=2 × obs 32–58`; the card shows the full claim.
- **The chart remembers**: saved windows render as subtle I-Chart bands; tap a band to reopen its finding.
- Engine signals (process shift, etc.) are compact margin chips with a **Capture** action — proposed findings, not announcements; same card, pre-filled with the detected condition.
- Findings-panel empty state teaches the grammar: "Brush a range, pin your filters, or capture a detected signal."
- V1 bounds: I-Chart brush only; one range per finding.
