---
tier: living
purpose: orient
title: 'Framing Layer V2 — Master Plan'
audience: human
category: planning
status: active
last-reviewed: 2026-05-26
layer: spec
related:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
implements:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/ia-nav-model.md
  - docs/USER-JOURNEYS.md
---

# Framing Layer V2 — Master Plan

> **Active · 2026-05-26.** Sequences the design sessions needed to complete the Framing Layer redesign under wedge V1. Each phase produces its own design doc and its own implementation plan; this is the meta-coordination doc.

## Context

The Framing Layer Spec (archived 2026-05-26 under wedge V1) committed to a five-spec decomposition:

- **Spec 1** — Hub creation + data ingestion + match-summary card (Mode B Stages 1–3 + Mode A.2). **Slices 1–3 shipped.**
- **Spec 2** — Manual canvas authoring (drag-to-connect, ProcessMap construction). **This master plan covers this and beyond.**
- **Spec 3** — Step card details + drill-down overlay UX + mode-lens reskinning
- **Spec 4** — Canvas overlays + Investigation Wall sync
- **Spec 5** — IndexedDB persistence schema

Specs 2–5 remained as planning placeholders without content. The 2026-05-26 customer-hat brainstorm session produced the Spec 2 design ([`2026-05-26-canvas-connection-journey-design.md`](2026-05-26-canvas-connection-journey-design.md)) and this sequencing plan.

This master plan covers Phases 1–3 of the V2 work. It is NOT itself an implementation plan; each phase's design doc gets its own implementation plan via `superpowers:writing-plans`.

---

## Cross-cutting concerns

Three open questions surfaced by the 2026-05-26 brainstorm affect every downstream spec. They carry as placeholders for Spec 2's design (using current terminology) and should resolve before implementation in Phase 2:

1. **Vocabulary positioning** — Explore / Analyze / Control vs Analyze / Investigation / Sustainment. Identity-level call. Sponsor of: vocabulary positioning session.
2. **Lead JTBD shape** — activity-framed (Frame / Drill / Improve / Verify) vs lifecycle-framed. Affects persona docs.
3. **Project = IP terminology cleanup** — collapse the muddle in code (`projectsByHub` legacy holdover) and docs ("promoted from hypothesis" framing).

Recommendation: carry as placeholders in Spec 2's design (use current terms, flag where the call lands). Run a focused vocabulary + JTBD + terminology sweep before any implementation plan touches L2 journey docs.

---

## Phase 1 — Mode 1 onboarding (this session + 1 follow-up)

### 📍 Spec 2 — Canvas-Connection Journey _(DESIGNED · 2026-05-26)_

Status: **draft spec at [`2026-05-26-canvas-connection-journey-design.md`](2026-05-26-canvas-connection-journey-design.md)**.

Covers: the canvas-based onboarding from paste to ready-to-analyze. Universal canvas (shape-invisible), three zones mapped to user cognitive tasks, step-bound vs global outcomes + factors, calculated columns + batch ratios, time-as-factors decomposition, inflection-point binning in probability plot, Promote-to-Project flow, exit to Explore with smart routing, 2-tier ACL.

**Next step:** `superpowers:writing-plans` to convert this design doc into an implementation plan. Sub-component scopes: column chips · zones · workflows modals · Promote-to-Project modal · probability-plot binning UX · canAccess.ts collapse · persona doc + nav-model amendments.

### Mode 1 journey doc

Status: **doc-only work; not yet started.**

Add a pre-Project journey to `docs/02-journeys/` documenting the quick-analyze flow (paste → canvas → optional Promote-to-Project). Closes finding #1 from the 2026-05-26 walkthrough (logged in `docs/ephemeral/investigations.md`). Consumes Spec 2's design as source.

Promotion path: small doc-only PR, ~4–6 files. Should pair with the persona × tab matrix update for Sponsor and the JTBD restructure (cross-cutting concern #2) if those are resolved by the time this lands.

---

## Phase 2 — Canvas substrate completion (2 sessions)

### Spec 3 — Step cards + drill-down + mode lenses _(task #11 queued)_

Status: **placeholder; task #11 already queued for this design session.**

Covers: per-step card design at L2 view, drill-down floating overlay UX at L3, mode-lens reskinning when mode changes (standard / capability / performance / yamazumi / defect). **Includes the Pareto / Analyze-tab lens-switcher question** surfaced in today's audit.

Sponsor of: customer-hat design session on the Analyze (Explore) tab layout under wedge V1.

### Spec 4 — Canvas overlays + Wall sync

Status: **placeholder; not yet started.**

Covers: active-IP investigation overlays on canvas (hypotheses, findings as pins), sync between canvas state and Investigation Wall view, 3-response-path triggers from Canvas L2 → L3 drill (per wedge §3.3.4 amended by this session). Smaller change than Spec 3 — most surface already exists; this is about overlay + sync semantics.

---

## Phase 3 — Closure + persistence (2 sessions, parallelizable)

### ControlHandoff retention design _(task #12 queued)_

Status: **placeholder; task #12 already queued.**

Sustainment closure data model. Three options surfaced in today's audit: (a) keep `ControlHandoff` as-is, fix naming/JSDoc only; (b) fold fields into `SustainmentRecord`; (c) drop entirely per `feedback_wedge_v1_no_migration_no_backcompat`. Real operational semantics live in the existing entity (surface enum, retainSustainmentReview, lifecycle states) — design call cannot be a refactor alone.

### Spec 5 — Snapshot persistence schema

Status: **placeholder; engineering-shaped.**

Storage schema for PWA snapshot `.vrs` export/import and Azure `DocumentSnapshot` cloud sync. Largely derives from what Specs 2–4 commit to in terms of state shape. May not need a full brainstorm — could go straight to `superpowers:writing-plans` once Phase 2 finalizes.

---

## Dependencies (low — most sessions can overlap)

```
Cross-cutting (vocabulary, JTBD, Project=IP)
    │
    ▼ (placeholder usage; resolve before implementation)
Spec 2 ──→ Spec 5 (persistence shape depends on what Spec 2 produces)
   │
   ├──→ Spec 3 (step cards consume Spec 2's process-model output)
   │
   └──→ Spec 4 (canvas overlays consume Spec 2's canvas + Spec 3's step cards)

ControlHandoff (task #12) — orthogonal to Specs 2–5; can run anytime in Phase 3
```

In practice: design Spec 2 cleanly without locking Specs 3 / 4 / 5; let downstream sessions amend Spec 2 if they hit conflicts.

---

## Spec amendments accumulated by the 2026-05-26 session

These need to land alongside Spec 2's implementation plan. Detailed in [`2026-05-26-canvas-connection-journey-design.md`](2026-05-26-canvas-connection-journey-design.md) §8:

1. Wedge §3.3.4 — retire Quick Action → Capture as Finding
2. Wedge §3.2 — Charter UI: "Problem statement" → "Issue statement"
3. Wedge §3.0 — retire "promoted from validated hypothesis" framing
4. Wedge §4.1 + canAccess.ts — collapse to 2-tier ACL
5. Sponsor persona doc — remove "skips Analyze + Investigation entirely"
6. Tab vocabulary positioning — deferred to a vocabulary session

Plus the 5 walkthrough findings logged in `docs/ephemeral/investigations.md` (Mode 1 invisibility, Lead JTBD shape, Project=IP muddle, vocabulary positioning, Sponsor visibility) — each may produce its own small doc-only PR.

---

## Deliverables track

- [x] Phase 1 / Spec 2 — design doc ([this file is companion to it](2026-05-26-canvas-connection-journey-design.md))
- [x] Phase 1 / master plan — this file
- [ ] Phase 1 / Mode 1 journey doc — pending
- [ ] Phase 1 / Spec 2 implementation plan — invoke `superpowers:writing-plans`
- [ ] Phase 2 / Spec 3 — task #11 brainstorm
- [ ] Phase 2 / Spec 4 — design session
- [ ] Phase 3 / ControlHandoff — task #12 brainstorm
- [ ] Phase 3 / Spec 5 — engineering-shaped; may go directly to writing-plans
- [ ] Cross-cutting / vocabulary + JTBD + Project=IP — sessions before any L2 journey-doc implementation
