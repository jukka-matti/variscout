---
tier: living
purpose: design
title: 'View: step timings — timestamps become the process model'
audience: human
status: active
layer: L2
topic: [wireframes, step-timings, process-tab, l2, timestamps]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `step-timings`

The chain from multi-timestamp data to a timed process model. Panels 2–3 are **shipped** (`StepTimingsModal`, CCJ spec §4.3.1); panel 1 is the landing banner that gives them a front door (first-session spec §4.3). Interactive wireframe: [`assets/step-timings.html`](assets/step-timings.html).

```
1 · landing banner (NEW)
   ⛓ These look like step timestamps — 3 start/end pairs detected
     [Build process model]  Not now
                 ▼ accept
2 · StepTimingsModal (SHIPPED)
   tabs: [By step] By column
   Prep      ● Prep_start ▾   ● Prep_end ▾    ~4.2 min     ● = auto-detected
   Assembly  ● Assembly_st ▾  ● Assembly_e ▾  ~11.8 min      (pair regex)
   QC        ● QC_start ▾     ● QC_end ▾      ~2.9 min
   Or use a single duration column: — ▾
                                  [Save · 3 steps timed →]
                 ▼ save
3 · L2 flow view (SHIPPED rendering; lands here = the b0→b1 transition)
   [Prep ⏱4.2m] → [Assembly ⏱11.8m · widest] → [QC ⏱2.9m]
   derived chips: Lead_time · Total_work_time · Wait_time   (L2 by default)
```

## Interaction contract

- Pair detection pre-fills pickers (auto-detected markers); any picker is overridable; empty steps are fine ("Save · N steps timed" reflects reality, never demands all).
- Single duration column is the mutually-exclusive alternative per step.
- Accepting the banner IS the b0→b1 transition — steps materialize and the chips' world gains geography (drag-onto-steps becomes available; the transition affordance announces it).
- Derived flow metrics are process properties → L2 by default; promotable to L1 by dropping in the outcome zone (CCJ rule).
