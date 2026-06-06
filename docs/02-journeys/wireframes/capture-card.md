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
│ 👆 Point (cat/pt/band)   │   │ EVIDENCE   mean 41.2 vs 35.1 · n=26    │
│ ⚠ Engine signal chip     │   │ FACTOR     creates "obs 32–58" (edit)  │
└─────────────────────────┘   │ NOTE       what did you notice? (opt.)  │
                              │ [Save Finding]  Factor only · Esc       │
                              └────────────────────────────────────────┘
```

## Interaction contract

- **Brush is intent** (selects points, never zooms): card opens directly on release; `Esc`/click-away cancels.
- **A condition is always factor-expressed**: pointing at existing structure reuses it; carving gestures (brush, changepoint, probability value-band) **mint a derived factor on save** — auto-named, tagged derived, editable name, deleted-with-finding cleanup.
- **Probability plot (spec §5 amendment 2026-06-06)**: point-at-plot opens the card with the value-band condition pre-filled (`Y between 4.2–5.1` — `FindingSource chart:'probability'` is shipped); inflection binning's _"Create binned factor"_ exit routes through this card's **Factor only** path — one grammar, not two (converges CCJ §3.5; see [probability-plot.md § Inflection-Point Binning](../../03-features/analysis/probability-plot.md)). Probability-plot **brush** stays out of V1 (archived 2026-03-29 enhancement spec is the revive pointer).
- Two actions on carve gestures: **Capture** (finding + factor) / **Factor only** (data-shaping, no observation claimed).
- Conditions **compose**: brushing while drilled into `Step=2` → `Step=2 × obs 32–58`; the card shows the full claim.
- **The chart remembers**: saved windows render as subtle I-Chart bands; tap a band to reopen its finding.
- Engine signals (process shift, etc.) are compact margin chips with a **Capture** action — proposed findings, not announcements; same card, pre-filled with the detected condition.
- Findings-panel empty state teaches the grammar: "Brush a range, pin your filters, or capture a detected signal."
- V1 bounds: I-Chart brush only; one range per finding. **Mobile: tap-capture only** (pin / point / engine chips); brush is desktop-only; the card renders as a bottom sheet. **Performance mode:** point-at works on cross-channel boxplot categories; no capture on the per-channel Cpk scatter (no `FindingSource` variant — deferred).
