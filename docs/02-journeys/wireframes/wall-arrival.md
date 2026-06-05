---
tier: living
purpose: design
title: 'View: Wall arrival — findings-forward empty state + the status ladder'
audience: human
status: active
layer: L2
topic: [wireframes, wall, analyze, findings, hypothesis-status]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `wall-arrival`

What greets a user crossing into Analyze with captured Findings but no hypotheses yet (first-session spec §6). Replaces the current "Write hypothesis" void. (HTML asset to be added with the P3 build wireframe pass.)

```
┌──────────────────────────────────────────────────────────────┐
│  You've observed:                                              │
│   ┌──────────────────────────┐  ┌──────────────────────────┐  │
│   │ 📌 obs 32–58 elevated     │  │ 📌 Step=2 wider           │  │
│   │ mean 41.2 vs 35.1 · n=26 │  │ via brush · 2 min ago     │  │
│   │ [What might cause this?] │  │ [What might cause this?]  │  │
│   └──────────────────────────┘  └──────────────────────────┘  │
│                                                                │
│  …or start from a hunch:  [Write hypothesis]  [Seed from      │
│                                               factor intel]   │
└──────────────────────────────────────────────────────────────┘

 status ladder (per hypothesis card — replaces the flat dropdown)
 Proposed → Evidenced → Needs disconfirmation → Supported
                                             ↘ Refuted
 · gestures drive transitions (proposal chips: "3 supporting
   findings — mark Evidenced?"); the dropdown is the override
 · one-line microcopy per rung ("Supported — survived an
   attempt to break it")
```

## Interaction contract

- "What might cause this?" promotes the finding's factor into a hypothesis hub — CS-12 derived edges connect them automatically. **Promotion prompts for a plain-language hypothesis name** — an auto-minted factor label (`obs 32–58 in/out`) never becomes a hypothesis title unedited (hypothesis names reach the executive Report verbatim; spec §6 humanization boundary).
- The afterglow path (one-time "Take it to Analyze →" on the capture confirmation) lands identically.
- `HypothesisStatus` enum untouched (feeds Report composition); this view changes **presentation only** — the ladder ordering is what makes Evidenced vs Supported legible.
- Analyst-owned status survives (CS-10): suggestions are chips, never auto-applied.
