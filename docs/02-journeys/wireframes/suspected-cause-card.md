---
tier: living
purpose: design
title: 'View: Suspected-cause card — facts × one call × activity'
audience: human
status: active
layer: L2
topic: [wireframes, wall, analyze, hypothesis, suspected-cause, evidence-angles]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/02-journeys/wireframes/wall-arrival.md
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
---

# View: `suspected-cause-card`

The redesigned hypothesis card (user-facing label: **Suspected cause**). Replaces the "MECHANISM BRANCH · PROPOSED" card + the status-ladder explainer. HTML assets: [suspected-cause-card.html](assets/suspected-cause-card.html) (three settle moments), [suspected-cause-activity.html](assets/suspected-cause-activity.html) (the activity line / Measure⇄Analyze loop).

```
┌──────────────────────────────────────────────┐
│ SUSPECTED CAUSE                  [Suspected] │  ← 1 of 3 displayed states:
│ Night shift staffing gap drives late starts. │    Suspected / Verified / Ruled out
│                                              │
│ 📊 Data: shift boxplot (1 finding)           │  ← typed evidence facts
│ 👁 Gemba · 💬 Expert: none yet                │    (FindingEvidenceType: data/gemba/expert)
│ ⚠ One angle only — and never tested          │  ← the gap nags about ANGLES + break attempts
│                                              │
│ Answerable now: Shift × CycleTime  [Check it]│  ← run-now check = a button, never a plan
│ ── In flight — evidence being collected ──── │
│ 👁 Gemba walk, night start — Matti           │  ← MeasurementPlan rows (owner · due · n/N)
│ 📋 Roster vs starts — you · ask HR           │
└──────────────────────────────────────────────┘

 stalled variant (amber border):
│ ⚠ Nothing in flight for 5 days               │
│ [Plan a check] [Go look] [Rule it out]       │

 settled variant:
│ SUSPECTED CAUSE                   [Verified] │
│ Verified on: data (2-sample, survived) +     │  ← grounds recorded = the
│ gemba (jig) + operator account · date · who  │    cause-verification-matrix row
│ → [Charter the fix]                          │
```

## Interaction contract

- **Display states are a presentation mapping** over the stored 5-value `HypothesisStatus` (untouched, per the [wall-arrival](wall-arrival.md) enum fence): `proposed|evidenced|needs-disconfirmation → Suspected`, `evidence-survived-test → Verified`, `refuted → Ruled out`. The internal rungs surface as card **facts**, not as named states the user must learn.
- The Verified suggestion stays an advisory chip (CS-10 — analyst-owned status; never auto-applies). It fires on the existing rule: ≥2 distinct evidence types AND a survived disconfirmation attempt (`deriveHypothesisStatus`, `survey/wall.ts`).
- Settling (Verified / Ruled out) records grounds: contributing angles, break attempts, timestamp, author.
- Evidence angles come from `Finding.evidenceType` — set via the capture/edit picker (the L-1 build item; today every finding hard-defaults `data`).
- "In flight" rows project `MeasurementPlan` (status Planned/In progress, owner, method) + pending `DisconfirmationAttempt` verdicts. Run-now checks (existing data) render as immediate buttons.
- **Stalled** = unsettled + run-now checks exhausted + no open collection plan + N days quiet (N: spec §5).
- When pasted data matches an open plan (factor + window), the finding auto-suggests the link; accepting completes the plan and lights the angle (the Measure⇄Analyze loop, glossary "Measurement Plan").
