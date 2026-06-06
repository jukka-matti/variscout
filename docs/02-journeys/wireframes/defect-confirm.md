---
tier: living
purpose: design
title: 'View: defect confirm — event logs re-frame b0'
audience: human
status: active
layer: L2
topic: [wireframes, defect, b0, landing, mode-detection]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `defect-confirm`

The b0 loud-banner path for defect-shaped data (first-session spec §4.2a). A defect event log does not skip framing: accepting the proposal confirms the real role decisions, sets defect mode, and makes the derived defect metric the b0 Y choice. (HTML asset deferred until the FSJ-5 build pass.)

```
┌──────────────────────────────────────────────────────────────────┐
│ Pasted Data · 800 rows · 6 columns                   Fix data…    │
│                                                                  │
│ ⚠ These rows look like defect events — one row per defect.        │
│   Confirm how to count them before choosing an outcome.           │
│   [Confirm defect setup]  Not now                                 │
│                                                                  │
│   ▼ expanded confirm sequence  OWNER-CALL-PENDING                 │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │ DATA TYPE                                                  │   │
│   │  [Event log ✓]  Pre-aggregated counts  Pass/fail results   │   │
│   │                                                            │   │
│   │ COUNT / RESULT                                             │   │
│   │  Defect type:      Defect_Type ▾                           │   │
│   │  Count column:     — event rows count as 1 each             │   │
│   │  Result column:    — not needed for event logs              │   │
│   │                                                            │   │
│   │ UNITS                                                      │   │
│   │  Group by:         Batch ▾                                  │   │
│   │  Units produced:   Units_Produced ▾   None                  │   │
│   │                                                            │   │
│   │  [Use defect framing]  Cancel                               │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ What do you want to investigate?                                 │
│ defect outcome derived from the event log                         │
│  [● DefectRate ▂▅▃▇ ✓]  [ DefectCount ▃▃▄ ]                      │
│                                                                  │
│ What might be affecting it?                                      │
│  SELECTED   [Defect_Type ✓] [Shift ✓] [Machine ✓]                │
│  AVAILABLE  [Batch] [Operator]                                   │
│                                                                  │
│ [ See the data → ] opens Explore with defect framing              │
└──────────────────────────────────────────────────────────────────┘
```

## Interaction contract

- The proposal renders above the b0 picker and pre-empts ordinary measurement picking until accepted or dismissed.
- Accepting is a short confirm sequence, not one tap: data type, count/result role, grouping unit, and units-produced role are all real decisions.
- The default presentation is an inline expanded panel directly under the loud banner inside b0's top slot. **OWNER-CALL-PENDING:** exact visual treatment may change, but it must stay on the landing surface and never become a modal.
- Event-log defaults: rows count as one defect each; `DefectType` is optional but shown when detected; units-produced is optional and controls whether `DefectRate` is available.
- After accept, `analysisMode='defect'` and the derived metric picker is the Y choice: `DefectRate` when units are mapped, otherwise `DefectCount`; if both are available, both stay visible.
- "Not now" dismisses the proposal and leaves standard b0 available; "Fix data..." opens the demoted ColumnMapping hatch for role corrections.
