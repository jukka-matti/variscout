---
title: Response Path System V1 — Design
audience: [product, engineer, designer]
category: design-spec
status: delivered
last-reviewed: 2026-05-13
supersedes:
  - docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md
  - docs/01-vision/methodology.md
  - docs/01-vision/constitution.md
  - docs/07-decisions/adr-053-question-driven-investigation.md
  - docs/07-decisions/adr-064-suspected-cause-hub-model.md
  - docs/07-decisions/adr-066-evidence-map-investigation-center.md
  - docs/07-decisions/adr-070-frame-workspace.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
---

> **⚠️ Amended 2026-05-16** by [ADR-082](../../07-decisions/adr-082-wedge-architecture.md) + the [wedge architecture spec](./2026-05-16-wedge-architecture-design.md). RPS V1 shipped 5 response paths off a Process Hub. Under the wedge, **3 paths** surface at V1 from canvas drill (Investigate, Quick Action, Charter). Sustainment auto-fires per [ADR-080](../../07-decisions/adr-080-sustainment-auto-fire-pattern.md); **Handoff is deleted everywhere** and its close-project logic folds into Sustainment closure per wedge spec §3.2 + §3.3.4. All shipped RPS V1 code stays — the wedge gates the canvas drill-down menu to 3 paths rather than deleting infrastructure.

---

# Response Path System V1 — Design

> **What this spec covers.** The unified architectural design for VariScout's **5 response paths** from the canvas-card drill-down (per vision §2.4) — Quick Action, Focused Investigation, Improvement Project, Sustainment, Handoff — and the system-level design that holds them together (cross-surface navigation, naming reconciliation, Wall package re-home, Survey UI surface, live-document state machine).
>
> **This spec supersedes `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`** (the earlier Improvement Project V1 design). The earlier spec designed IP as a standalone QC Story / Toyota TBP-shaped artifact in isolation. After E2E flow audit, three reframings forced a system-level redesign:
>
> 1. **DMAIC / QC Story bridges dropped** — VariScout already has its own opinionated journey (FRAME → SCOUT → INVESTIGATE → IMPROVE) and primitives (Hub, OutcomeSpec, Hypothesis, Finding, ImprovementIdea, Sustainment, Handoff). Methodology bridges to external frameworks were unnecessary.
> 2. **5 response paths designed as a system, not piecewise** — IP / Sustainment / Handoff chain via FK; Quick Action + Focused Investigation are the lighter-weight responses; all 5 share Survey-driven cross-surface UX patterns.
> 3. **Investigation Wall vision audit revealed structural debt** — naming overlap (Hypothesis / Question / SuspectedCause / MechanismBranch / WallStatus), Wall in wrong package (`packages/charts` vs `packages/ui`), 4 Wall vision UX gaps still open. These needed addressing as part of the system design, not as separate workstreams.
>
> **Backward compatibility: explicitly NOT required.** VariScout is in active design phase, not maintaining live customers across versions. Renames, migrations, and structural changes ship as clean breaks. No deprecated aliases, no migration cushions, no transition periods. Where this is materially relevant to a decision, the spec calls it out.

---

## 1. Why this spec exists — the system-level view

PR8 (canvas migration) shipped 8a's mode-aware response-path CTAs as the entry point to all 5 paths. 8a wired stub destinations for Charter / Sustainment / Handoff — the formal-project chain — but didn't design the system that holds them together.

A piecewise-design approach (Charter V1 → Sustainment V1 → Handoff V1 as separate workstreams per `docs/roadmap.md`) was the original plan. Mid-brainstorm review of the Investigation Wall vision (slides shared 2026-05-08) revealed:

- The Wall is structurally shipped (PR #75 + #76 + 8e) but **4 vision UX gaps remain** (mini-charts inside hypothesis cards, brush-to-pin gesture, 5th hypothesis status "Needs Disconfirmation," inline best-subsets suggestions)
- The Wall lives in `packages/charts/` — wrong layer per `editing-monorepo-structure` rules
- **Naming debt** spans 5 entity-ish names + 3 status enums for what is essentially one investigation graph
- The 5 response paths were designed in isolation; the cross-surface flows + chain transitions were undesigned

Designing IP V1 alone would have produced an artifact that doesn't compose with paths 4+5 (Sustainment + Handoff) when they ship later, would have inherited the Wall's UX debt, and would have ossified the naming overlap in another generation of types.

This spec corrects that by producing a **system-level design** — one architectural backbone that covers all 5 response paths, the Survey methodology layer, the naming model, the cross-surface navigation, and the Wall completion. V1 implementation will be sliced into multiple PRs, but the design is unified.

---

## 2. Foundational decisions (D1–D7)

### D1 — Five response paths from canvas-card drill-down

Per vision §2.4, every card's drill-down surfaces exactly five response options:

| #   | Path                      | Lifecycle                                          |
| --- | ------------------------- | -------------------------------------------------- |
| 1   | **Quick Action**          | Ephemeral fix; logged for audit; no formal project |
| 2   | **Focused Investigation** | Open-ended EDA work surface (the Wall)             |
| 3   | **Improvement Project**   | Formal tracked project artifact                    |
| 4   | **Sustainment**           | Cadence-monitored verification of a sustained gain |
| 5   | **Handoff**               | Control-plan ownership transfer to process owner   |

The canonical 5-path commitment is preserved. PR8-8a's prerequisite-locked CTA design stays in force at the canvas-card level (per D10 below).

### D2 — Drop DMAIC / QC Story methodology bridges

The earlier IP V1 spec used QC Story / Toyota TBP as the methodological bridge for stakeholder familiarity. **This spec drops all external-methodology bridges.** VariScout has its own opinionated investigation methodology (FRAME → SCOUT → INVESTIGATE → IMPROVE per Constitution P1 + Watson 2019 / Turtiainen question-driven EDA per ADR-053) and its own primitives (Hub, OutcomeSpec, Hypothesis, Finding, ImprovementIdea, SustainmentRecord, ControlHandoff, ProcessMap).

The artifacts and surfaces designed in this spec use **VariScout-native vocabulary** end-to-end. Methodology lineage (where ideas came from) is documented for engineers but absent from user-facing UI copy.

### D3 — Three-altitude framing

The system has three altitudes that must coexist:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ALTITUDE 1 — MACRO: Hub cadence loop                                  │
│   Evidence Source tick → EvidenceSnapshot → Current Process State    │
│   refresh → response decision per card → repeat. Always-on,           │
│   cadence-driven (manual / hourly / shiftly / daily / weekly).        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ALTITUDE 2 — CROSS-PHASE: Survey                                       │
│   "What evidence is enough? What's missing? Collect or check what     │
│   next?" Runs in FRAME, SCOUT, INVESTIGATE, IMPROVE, IP, Sustainment, │
│   Handoff. Always-on. Surfaces inline at every surface (D11) AND as   │
│   Inbox digest at Hub-overview (D10.C).                                │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ALTITUDE 3 — MICRO: per-response project lifecycles                    │
│   Each response path has its own state machine.                        │
│   1. Quick Action — single-step, ephemeral                             │
│   2. Focused Investigation — open-ended Wall surface                   │
│   3. Improvement Project — Draft / Active / Closed                     │
│   4. Sustainment — Pending / Confirmed-Sustained / Drifted             │
│   5. Handoff — Pending / Acknowledged / Operational                    │
└──────────────────────────────────────────────────────────────────────┘
```

Constitution P1's 4-phase journey (FRAME → SCOUT → INVESTIGATE → IMPROVE) is the **investigation-reasoning loop INSIDE Focused Investigation + Improvement Project**, not the top-level system shape.

### D4 — Eight-station canonical journey arc

The mature-Hub analyst's full lifecycle traverses 8 stations. Quick Action + Focused Investigation are visited any number of times across the journey; the formal-project chain (IP → Sustainment → Handoff) is traversed in sequence.

```
1. CADENCE WAKE         Evidence Source tick → snapshot → state refresh.
                        Survey scans for what changed across cards.

2. CARD TRIAGE          Analyst opens canvas. Cards show Survey badges.
                        Picks a card to act on.

3. DRILL → CHOICE       Card overlay opens. 5 response-path CTAs with
                        states (active / prerequisite-locked). Picks one.

                        ┌── Quick Action ────────────► back to canvas
                        ├── Focused Investigation ──► station 4
                        ├── Improvement Project ────► station 5
                        ├── Sustainment ────────────► station 7
                        └── Handoff ────────────────► station 8

4. INVESTIGATION CYCLE  Wall surface. Brushing, pinning, hypothesizing,
                        gates, disconfirmation. Hypotheses accumulate
                        evidence (data / gemba / expert). Survey runs
                        continuously.

5. PROJECT FORMALIZATION Findings/Hypotheses promoted to Improvement
                         Project artifact. IP form opens with FK-linked
                         lineage from Wall state. Status: Draft.

6. IMPROVEMENT CYCLE    ImprovementIdea selected, What-If projected,
                        ActionItem dispatched. Off-system implementation.
                        New data ticks back. IP Section 6 (Outcome
                        reference) shows next Sustainment when ready.
                        Status: Active → Closed.

7. SUSTAINMENT CYCLE    Sustainment artifact. Cadence-based monitoring.
                        Survey re-evaluates each tick. Status: Pending
                        → Confirmed-Sustained → (Drifted if recurrence).

8. HANDOFF              Sustainment confirmed. Handoff artifact opens
                        with control plan, owner, sponsor sign-off (paid).
                        Status: Pending → Acknowledged → Operational.
                        Loop closes; canvas card shows ✓.
```

Stations 4–8 can run **in parallel across different cards** of the same Hub. Station 1 (cadence wake) re-fires per Hub config.

### D5 — Survey is the cross-phase methodology layer

Survey (per `docs/01-vision/methodology.md` §256) is the cross-phase evaluator that answers _"what can I do with this evidence, what would I miss, and what should I collect or check next?"_

| Context             | Survey evaluates                                       |
| ------------------- | ------------------------------------------------------ |
| FRAME               | Data affordance, missing columns, process-map gaps     |
| SCOUT               | Available analysis modes, practical next checks        |
| INVESTIGATE         | Branch trust, power, counter-checks, blind spots       |
| IMPROVE             | Verification data + before/after evidence readiness    |
| Improvement Project | Goal completeness, lineage gaps, drift indicators      |
| Sustainment         | Cadence-tick verdicts, drift detection                 |
| Handoff             | Control-plan completeness, owner-acknowledgement state |

Existing data model already has `SurveyStatus` and `ProcessHubSurveyReadinessSummary`. V1 surfaces Survey as a **first-class user-visible layer** (per D11) — not just backend computation.

### D6 — "Improvement Project" is the canonical name

Path 3's artifact is named "Improvement Project" (locked from prior brainstorm; vision §2.4 amendment carries forward).

- Code shape: `ProcessHub.improvementProjects: ImprovementProject[]` (in-memory hydrated projection); separate Dexie table for persistence
- Canvas card response-path button: "Improvement Project"
- Form title: "Improvement Project — _[OutcomeSpec name]_"

### D7 — IP ↔ Focused Investigation are separate response paths, FK-linked, peers

Two related but distinct concepts:

- **Focused Investigation** = the work surface (the Wall) — open-ended EDA. Outputs (Hypothesis, Finding, Question, CausalLink) accumulate organically.
- **Improvement Project** = the formal tracked artifact. References Wall outputs via FK; never duplicates them.

Three real use cases require separation:

1. Casual investigation that never formalizes (most analyst time)
2. Charter authoring without prior investigation (LSSGB student / consultant pre-engagement)
3. Both happening in parallel with cross-links

Vision §2.4's five separate response paths got this right — they're peers, not stages. The user picks the path based on intent.

```
   ┌────────────────────────────────────────────────────────────┐
   │  CANVAS CARD                                                 │
   └────────────────────────────────────────────────────────────┘
              │                                  │
              │ picks Focused Investigation     │ picks Improvement
              ▼                                  ▼  Project
   ┌──────────────────────┐         ┌──────────────────────────┐
   │ Wall surface          │ ◄─FK──► │  Improvement Project    │
   │ (open-ended)          │ links   │  (formal artifact)      │
   │                       │ both    │                          │
   │ ─ Findings            │ ways    │ Investigation lineage:  │
   │ ─ Hypotheses          │         │   hypothesisIds          │
   │ ─ Questions           │         │   findingIds             │
   │ ─ Gates / disconfirm  │         │                          │
   │ ─ Survey nudges       │         │ Status, team, goal, etc. │
   └──────────────────────┘         └──────────────────────────┘
```

---

## 3. The 6-section Improvement Project shape (D8) + multi-level goals (D9)

### D8 — Six sections, lean and FK-driven

| #   | Section                        | Content                                                                                                                                                                                                  | Source                                                          |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | **Project metadata**           | Title (required), sponsor, project lead, team, deadline, business case, financial impact                                                                                                                 | New fields on IP                                                |
| 2   | **Background / Current State** | Auto-pulled snapshot at IP open: capability summary + Pareto top-5 + Watson `liveStatement` + `problemCondition.summary`. Editable narrative below.                                                      | Reuse `processUnderstanding` + `OutcomeSpec` + Hub canvas state |
| 3   | **Goal**                       | Multi-level (D9 below)                                                                                                                                                                                   | Reuse `OutcomeSpec` (Y) + `Hypothesis` FK (X/x)                 |
| 4   | **Investigation lineage**      | FK list: `hypothesisIds[]` + `findingIds[]` (auto-collected when investigation linked). Brief inline preview per linked entity. Click-through to Wall. **No manual narrative** — that lives on the Wall. | Reuse `Hypothesis` + `Finding`                                  |
| 5   | **Approach / Countermeasures** | FK list: `improvementIdeaIds[]` + `actionItemIds[]` + author-owned narrative paragraph for "why this approach"                                                                                           | Reuse `ImprovementIdea` + `ActionItem`                          |
| 6   | **Outcome reference**          | Read-only forward-references: linked `sustainmentRecordId?` + `controlHandoffId?`. NO content — just shows linked artifact summaries with click-through.                                                 | Reuse `SustainmentRecord` + `ControlHandoff`                    |

**Removed from earlier IP V1 spec** (the QC Story 8-section structure):

- "Issue" + "Current Situation" + "Problem Statement" → merged into Section 2
- "Cause Analysis" with manual narrative → replaced with Section 4 (FK only)
- "Effect Confirmation" → removed entirely (Sustainment artifact's job)
- "Standardization & Reflection" → removed entirely (Handoff artifact's job)

**Required-fields rule:** only `metadata.title` is required to save. All other fields optional. Status transitions impose no extra requirements.

**Status enum:** `'draft' | 'active' | 'closed'` (V1). V2 paid-tier adds `'under-review'` + `'approved'` between draft and active for signoff workflow.

### D9 — Multi-level goals (Y / X / x)

Goal section supports three goal levels reflecting Y → X → x causal chain:

```ts
interface ImprovementProjectGoal {
  // Y-level — outcome target. Required for any IP.
  outcomeGoal: {
    outcomeSpecId: OutcomeSpec['id'];
    baseline?: number;
    target: number;
    deadline?: string; // ISO 8601
  };

  // X-level — derived from confirmed Hypotheses; user-editable.
  // Auto-suggests when a Hypothesis becomes 'confirmed' on the Wall.
  factorControls?: Array<{
    factor: string; // column name (e.g., 'nozzle.temp')
    targetCondition: string; // human-readable: "in control 95±2°C"
    linkedHypothesisId?: Hypothesis['id'];
  }>;

  // x-level — sub-mechanism specifics. Optional; for late-stage mature
  // investigations where local mechanism is the lever.
  mechanismGoals?: Array<{
    description: string; // "Eliminate Supplier B viscosity drift on night-shift lots"
    linkedFindingIds?: Finding['id'][];
  }>;
}
```

The journey:

- **Project start (Draft IP):** only Y-goal. We know what we want; we don't yet know which X drives it.
- **Investigation matures:** Hypothesis confirms → IP adopts X-goal.
- **Late investigation:** L3 SCOUT identifies a sub-mechanism → x-goal.
- **Project closes:** Y achieved because Xs are in control.

**Survey nudges differentiate by level:**

- "Y-goal set, no X-goals yet — open Wall to find which factors drive [outcome]"
- "X-goal defined for `nozzle.temp` but no recent in-control evidence — schedule a SCOUT L2 check"
- "All X-goals satisfied; Y-goal still 0.91 — what's the missing driver?"

**Multi-level propagates through chain** — Sustainment + Handoff inherit the same multi-level structure (Y / X / x targets at each phase).

---

## 4. Chain transitions — the world-class hybrid model (D10)

### Three-layer chain model

| Layer                            | Behavior                                                                                                                                     | Concern addressed                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **A. Canvas card drill-down**    | CTAs prerequisite-locked per 8a's design (`isSustainmentReady` requires `hasIntervention`; `isHandoffReady` requires `sustainmentConfirmed`) | Per-card UX: which response is appropriate for THIS card right now?                        |
| **B. Hub-overview entry points** | "+ New Sustainment" / "+ New Handoff" buttons always-active, NOT prerequisite-locked                                                         | Process-owner reality: ad-hoc creation needs (baseline monitoring, retrospective handoffs) |
| **C. Survey-Inbox prompts**      | Hub-overview top-of-page Inbox shows "things needing attention" each cadence tick                                                            | Forgetfulness: process owner returns weekly/monthly and needs to be reminded               |

Inbox digest example:

```
3 things need attention:
  • IP "Heads 5-8 lift" closed 30 days ago — record sustainment? [Set up]
  • Sustainment "Mix temp control" confirmed 6 weeks — record handoff? [Set up]
  • IP "Operator training" stalled — last update 14 days [Open]
```

Click → opens the relevant form prefilled. Skip → dismissed for this cycle. Snooze → re-prompts next cycle.

### Concrete signal definitions

```ts
// packages/core/src/responsePathReadiness.ts (extends existing module)

export function hasIntervention(hub: ProcessHub): boolean {
  return (
    hub.improvementProjects?.some(
      ip =>
        ip.status === 'closed' &&
        ip.sections.approach.improvementIdeaIds?.some(ideaId => {
          const idea = lookupIdea(ideaId);
          return (
            idea.selected === true &&
            idea.linkedActionItemIds?.some(aiId => lookupAction(aiId).status === 'done')
          );
        })
    ) ?? false
  );
}

export function sustainmentConfirmed(record: SustainmentRecord): boolean {
  // Manual: explicit review event with verdict
  if (record.latestReviewId) {
    const review = lookupReview(record.latestReviewId);
    if (review.verdict === 'confirmed-sustained') return true;
  }
  // Auto-fire: N=4 consecutive ticks within target without drift
  return record.consecutiveOnTargetTicks >= 4 && !record.hasOverride;
}
```

Process owner can override the auto-fire (mark "needs human verification") and can re-open if drift returns.

### Sustainment + Handoff state enums

```ts
type SustainmentStatus = 'pending' | 'confirmed-sustained' | 'drifted';
type HandoffStatus = 'pending' | 'acknowledged' | 'operational';
```

**Sustainment transitions:**

- `pending` → `confirmed-sustained` (manual review OR auto-fire after N=4 ticks)
- `confirmed-sustained` → `drifted` (any subsequent tick fails target; re-opens for re-investigation)
- `drifted` → `confirmed-sustained` (re-confirmation per pending logic)

**Handoff transitions:**

- `pending` → `acknowledged` (process owner reads + acknowledges)
- `acknowledged` → `operational` (sponsor signs off paid-tier; analyst marks free-tier)

---

## 5. Survey UI — Pattern X: dual surface (D11)

Survey renders at TWO surfaces, serving different jobs:

### Inline (active analyst working)

At every surface (Wall, IP form, Sustainment form, Handoff form, canvas card overlay), Survey hints render contextually next to the relevant content:

| Surface          | Survey rendering examples                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Canvas card      | Card-corner badges: "1 step away to confirm H1," "Drift detected since last tick"                                                          |
| Wall             | Missing-evidence panel ("THE DETECTIVE MOVE NOBODY SHIPS") + per-hypothesis "1 STEP AWAY" badges + brush-to-pin affordances on empty cards |
| IP form          | Per-section hints: "Goal not set — pick OutcomeSpec," "No Hypothesis linked — open Wall," "Effect not yet recorded"                        |
| Sustainment form | "3 of 4 ticks confirmed — 1 more before auto-confirm"                                                                                      |
| Handoff form     | "Owner not acknowledged yet — share via..."                                                                                                |

### Inbox digest (passive process owner during cadence review)

At Hub-overview top, Inbox aggregates cross-cutting prompts. See D10.C above.

### Why dual

Vision slides 3 + 4 explicitly show inline Survey ("MISSING EVIDENCE · THE DETECTIVE MOVE NOBODY SHIPS" panel; "1 STEP AWAY" badge with confirmation copy). These are exactly the moments Survey's value is highest — analyst mid-thought. Forcing them to context-switch to an inbox destroys the "process detective" experience.

Inline + Inbox together mean **Survey unifies the four Wall vision UX gaps** (D12 below) — they're not separate features, they're four ways Survey renders inline on the Wall.

### The 6 Survey rule categories

Survey rules in V1 fall into six categories. Each rule is `(context: SurveyContext) => SurveyHint[]`. The rule registry (per §15 OQ1, locked) lives in `packages/core/src/survey/{wall,improvementProject,sustainment,handoff,inbox}.ts`.

| #   | Category                         | Examples                                                                                                                                          | Renders at                                                                                                                |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Status derivation**            | `needs-disconfirmation` (≥2 evidence types but no falsification attempt); auto-promote `evidenced` → `confirmed` when triangulation passes        | Hypothesis status badge on Wall + IP Section 4 lineage                                                                    |
| 2   | **Data-collection prompts**      | _"H1 has data only — needs gemba walk to triangulate"_; _"H2 has data + gemba — try disconfirmation"_; _"OPERATOR.ID unused — brush it for H3"_   | Wall missing-evidence panel (vision slide 3 "THE DETECTIVE MOVE NOBODY SHIPS") + per-hypothesis card hints + IP Section 4 |
| 3   | **Triangulation readiness**      | _"1 STEP AWAY — adding one expert observation OR closing the disconfirmation task would promote H1 from evidenced to confirmed"_ (vision slide 4) | Per-hypothesis card "1 step away" badge + IP Section 4 lineage hints                                                      |
| 4   | **Power / sample-size warnings** | _"H2 boxplot has n=4 in category B — ANOVA may be unstable, collect more samples"_; _"Cpk computed on n=12 — wide confidence interval"_           | Inline on Wall mini-charts + IP Section 2 Background snapshot                                                             |
| 5   | **Drift detection**              | _"Sustainment Mix-temp control: tick 3 of 4 below target — drift detected"_; _"IP closed 30 days; capability dropped from 1.41 → 1.32 — review"_  | Inbox digest + Sustainment form + IP Section 6 outcome reference                                                          |
| 6   | **Lifecycle gaps**               | _"IP active but no ImprovementIdea selected"_; _"Goal Y-target met but no X-control linked"_; _"Handoff pending owner acknowledgment 7 days"_     | Inbox digest + IP Section 6 outcome reference + Handoff form                                                              |

**Category 2 (data-collection prompts)** explicitly addresses the _"hypothesis needs additional data"_ concern — Survey notices when an evidenced Hypothesis has only one evidence type AND prompts the analyst to collect the missing types. The prompt is contextual (what specifically to brush, what gemba walk to take, what expert to consult) — derivable from the Hypothesis's `condition` predicate (which columns are referenced) + the existing FindingSource shapes (which columns each evidence type can target).

**Category 3 (triangulation readiness)** is the "1 step away" badge from vision slide 4 — Survey detects when one more action (one disconfirmation, or one expert observation) would promote a Hypothesis from `evidenced` to `confirmed`, and renders that as a prominent prompt on the hypothesis card.

These six categories define V1's Survey scope. Cross-card pattern detection ("5 quick actions on this card → promote?") is V2 named-future per D14. Multi-hypothesis cluster analysis (the Fishbone view) is V2 per D16.

---

## 6. Wall vision V1 scope — Detective-pack (D12)

The Investigation Wall (PR #75 + #76 + 8e) is structurally shipped but has 4 vision UX gaps. V1 closes 3; defers 1 to V2.

| Gap                                                                                                                                                                                                                                            | V1 scope | Effort        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- |
| **1. Mini-charts inside HypothesisCard** — populate the existing chart slot at `HypothesisCard.tsx:170` with the appropriate chart type per hypothesis evidence (I-Chart for time-series, Boxplot for categorical X, scatter for continuous X) | ✓ V1     | M (~4–6 days) |
| **2. Brush-to-pin-finding gesture** — interactive brush on the mini-chart that creates a `Finding` from the brushed region, auto-links to the hypothesis                                                                                       | ✓ V1     | M (~3–5 days) |
| **3. 5th hypothesis status `needs-disconfirmation` + confirm-gate rule** — extends `HypothesisStatus` from 4 to 5; rule: "≥2 evidence types AND no open disconfirmation = ready to confirm"                                                    | ✓ V1     | S (~2 days)   |
| **4. Best-subsets inline suggestions** — render best-subsets engine output as inline cards on the Wall ("+ add AMBIENT.TEMP? R²adj gains 0.11")                                                                                                | **V2**   | M (~3–5 days) |

Total V1 (Detective-pack): ~10–13 days of focused work. Lands as 2–3 PRs off the RPS V1 branch.

---

## 7. Cross-surface navigation — context badges (D13)

### Unified badge pattern

Every surface that's a connection point renders **context badges** (icon + count) for outward links. Click navigates; multi-link shows a picker overlay.

**Canvas card drill-down:**

```
┌─────────────────────────────────────────────────────┐
│  Step: Mix · Outcome: Thickness                       │
│  Cpk 0.78 · n=42                                      │
│                                                         │
│  🎯 2 IPs   🔍 3 Wall threads   ✓ 5 actions   🔄 1 Sustain  │
│                                                         │
│  [Quick Action] [Focused Inv.] [Improvement Project] [Sustainment] [Handoff] │
│                                                         │
│  Recent activity (collapsed by default)                 │
└─────────────────────────────────────────────────────┘
```

**Bidirectional links:**

- IP form Section 4: each Hypothesis FK clickable → opens Wall focused on that node, with "← Back to IP" return badge
- Wall HypothesisCard: tiny "↗ X IPs" reverse-link badge → navigates to IP scrolled to the linked Hypothesis
- Wall canvas top: "Investigating for: IP '[title]'" context badge when navigated TO from an IP

**Multi-link is degenerate to single:**

- N=1 → direct navigate
- N>1 → picker overlay (same UI used by canvas-card → "2+ existing IPs — pick one")

**State preservation (single-level back via session storage):**

```ts
sessionStorage.setItem(
  'variscout:nav:return',
  JSON.stringify({
    surface: 'improvementProject',
    params: { ipId: 'ip-1' },
    scroll: 420,
    expand: { section3: true, section4: false },
  })
);
```

V2 may add multi-level breadcrumb if depth-3+ navigation patterns emerge.

---

## 8. Naming reconciliation (D15) — the canonical entity inventory

### Final entity inventory

| Entity       | Role                                                                             | Change                        |
| ------------ | -------------------------------------------------------------------------------- | ----------------------------- |
| `Question`   | Stratification factor query (open inquiry)                                       | unchanged                     |
| `Hypothesis` | Single testable mechanism with condition + evidence + status                     | RENAMED from `SuspectedCause` |
| `GateNode`   | Boolean composition tree of Hypotheses (AND/OR/NOT); evaluates Problem Condition | unchanged                     |
| `Finding`    | Evidence pinned to chart region                                                  | unchanged                     |
| `CausalLink` | Proven causal relationship                                                       | unchanged                     |

### Final status enums

| Enum               | States                                                                   | Change                                              |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- |
| `QuestionStatus`   | `open / investigating / answered / ruled-out` (4)                        | unchanged                                           |
| `HypothesisStatus` | `proposed / evidenced / confirmed / refuted / needs-disconfirmation` (5) | RENAMED from `MechanismBranchStatus`, extended to 5 |

### Removed types

- `MechanismBranchStatus` (collapsed into `HypothesisStatus`)
- `MechanismBranchReadiness` (replaced by Survey-derived computation)
- `WallStatus` (was duplicate of `MechanismBranchStatus`; Wall renders `HypothesisStatus` directly)
- `Hypothesis` deprecated type from ADR-053 era (the word is now used for the renamed entity; ADR-053's "primary artifact" role is filled by `Question` as designed)

### Hypothesis grouping (D16) — lightweight tags

Add `themeTags?: string[]` field to `Hypothesis`. Users tag with free-form themes (`#nozzle`, `#material`, `#operator`). Wall renders tag chips on hypothesis cards + "Group by theme" toggle (off by default).

**V2 named-future:** Promote tags to first-class `HypothesisGroup` entity + Fishbone view (Ishikawa 6 M's preset + free-form themes). V2 design answers: hierarchical tags? Group state? AND-gate at group level vs hypothesis level? V1 captures usage signal via tags so V2 design is data-informed.

### Hypothesis structure — name + condition + evidence + status

The renamed `Hypothesis` entity preserves the _suspected-cause-with-specific-condition_ semantics that the prior `SuspectedCause` name implied. Each Hypothesis carries:

| Field                                        | Role                                                                                         | Example                                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `name: string`                               | Analyst-chosen mechanism name                                                                | _"Nozzle runs hot on night shift, line 2"_                                                                                                  |
| `synthesis: string`                          | Analyst's narrative — how the evidence connects                                              | _"On line 2 night shifts, nozzle thermostat drifts beyond 95°C; observed thermal cycling in I-Chart and physical drips at 23:14 walkdown."_ |
| `condition: HypothesisCondition`             | **Precise predicate tree describing the specific contextual scope where the problem occurs** | _(see below)_                                                                                                                               |
| `questionIds[]`, `findingIds[]`              | FK lists to evidence                                                                         | data + gemba + expert evidence threads                                                                                                      |
| `status: HypothesisStatus`                   | Current state (5-state lifecycle)                                                            | `proposed / evidenced / confirmed / refuted / needs-disconfirmation`                                                                        |
| `tributaryIds?: ProcessMapTributary['id'][]` | Links back to Process Map step(s)                                                            | drives the "tributaries" footer band on the Wall                                                                                            |
| `themeTags?: string[]` (D16)                 | Lightweight grouping                                                                         | `['nozzle', 'thermal']`                                                                                                                     |

**`HypothesisCondition`** (defined in `packages/core/src/findings/hypothesisCondition.ts`) is a predicate tree of column-level comparisons composed by AND/OR/NOT:

```ts
type HypothesisCondition = ConditionLeaf | ConditionBranch;

interface ConditionLeaf {
  kind: 'leaf';
  column: string; // e.g., 'SHIFT', 'MACHINE_ID', 'SUPPLIER', 'NOZZLE.TEMP'
  op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'in';
  value: string | number | [number, number] | string[] | number[];
}

type ConditionAndOr = { kind: 'and' | 'or'; children: HypothesisCondition[] };
type ConditionNot = { kind: 'not'; child: HypothesisCondition };
```

**Example** — _"Nozzle runs hot on night shift, line 2, supplier B"_ renders as:

```ts
{
  kind: 'and',
  children: [
    { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
    { kind: 'leaf', column: 'LINE', op: 'eq', value: 2 },
    { kind: 'leaf', column: 'SUPPLIER', op: 'in', value: ['B'] },
    { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 95 },
  ]
}
```

The condition is **what makes a hypothesis disconfirmable** — `runAndCheck()` (`packages/core/src/findings/hypothesisConditionEvaluator.ts`) evaluates the predicate against the dataset and returns `{ holds: 38, total: 42, matchingRowIndices }`. Vision slide 2's "AND-gate HOLDS 38/42" label is exactly this evaluation rendered in the Wall.

**Top-level `GateNode`** composes multiple Hypotheses via AND/OR/NOT to form the Problem Condition's overall causal claim:

```
Problem Condition (e.g., "Fill < LSL on night shift · Cpk 0.78")
        │
   GateNode (kind: 'and', holds: 38/42)
        │
        ├── Hypothesis "Nozzle runs hot on night shift" → its condition
        ├── Hypothesis "Low-viscosity lots from Supplier B" → its condition
        └── Hypothesis "New operators during ramp" → its condition
```

So the user-facing concept _"a hypothesis with a specific condition (night shift + machine + part + supplier) describing where the problem occurs"_ IS the canonical data model — preserved entirely through the rename `SuspectedCause` → `Hypothesis`.

### Methodological grounding

The rename uses "Hypothesis" in its **scientific-method-correct downstream role**: a testable candidate explanation that emerges DOWNSTREAM of question-driven inquiry. Per question-driven EDA (Watson 2019 / Turtiainen 2019 / ADR-053):

```
   QUESTION                       (open inquiry — "what factors affect Y?")
       │
       ▼
   ANSWER                         (statistical statement — "shift does, η²=0.42")
       │
       ▼
   HYPOTHESIS                     ("nozzle runs hot on night shift")
       │
       ▼
   FINDINGS                       (evidence pieces)
       │
       ▼
   CAUSAL LINK                    (proven relationship, structural)
```

Question is primary (open inquiry); Hypothesis is downstream (candidate explanation testable by data + gemba + expert evidence). ADR-053 retired Hypothesis-as-PRIMARY; this spec uses the word for Hypothesis-as-DOWNSTREAM. Different role; same word.

### No backward compatibility

Per `2026-05-09` user direction: **VariScout is in design phase; no live customers to preserve.** Renames ship as clean breaks:

- No deprecated type aliases
- No transition period preserving old field names
- No migration cushion in persistence layer
- `suspectedCauseId` → `hypothesisId` in `CausalLink` + `Comment` is a direct refactor
- `SUSPECTED_CAUSE_*` HubAction kinds → `HYPOTHESIS_*` direct refactor
- Existing Dexie data (only dev fixtures + sample data) gets cleaned in migration scripts that don't preserve old shape

---

## 9. Wall package re-home (D17)

### Move

```
packages/charts/src/InvestigationWall/   →   packages/ui/src/components/InvestigationWall/
```

15 files (CommandPalette, MobileCardList, NarratorRail, EmptyState, MissingEvidenceDigest, GateBadge, HypothesisCard, ProblemConditionCard, FindingChip, TributaryFooter, Minimap, QuestionPill, DraggableHypothesisCard, DroppableGateBadge, WallCanvas).

### Why

Wall is investigation-surface UI, not chart UI. Per `editing-monorepo-structure` (downward dependency flow `core → hooks → ui → apps`), it belongs in `packages/ui`. Wall in `packages/charts` is a layering violation that's been sitting since PR #75/#76.

The Wall vision V1 Detective-pack adds mini-charts INSIDE `HypothesisCard` (D12). That import direction (Wall imports IChart/Boxplot from charts) requires Wall to be in `packages/ui` (charts can't depend on ui, but ui can depend on charts).

### Coupling with other V1 work

Same PR slice as the naming reconciliation (D15) — both are structural cleanup against the same files. Separating them would mean touching the same files twice, which slice-cap rules counsel against (~30-50 file touch).

### No backward compatibility

Per D15 + 2026-05-09 user direction: imports are direct refactor. No re-export shim from `packages/charts`. Consumer apps update their import paths in the same PR.

---

## 10. Quick Action surface (D14)

### Design

Quick Action is **an `ActionItem` created with no parent project**, linked directly to a card's step. No new entity; no new HubAction set. The "Quick" in Quick Action is about UX (lightweight inline creation), not data shape.

### UX

Canvas-card drill-down has a "Log action" CTA. Click → small modal:

```
┌─────────────────────────────────────────────┐
│ Log action — [Card title]                    │
│                                                │
│ What ┌─────────────────────────────────────┐ │
│      │ Refilled buffer tank                 │ │
│      └─────────────────────────────────────┘ │
│                                                │
│  ◯ Done now                                   │
│  ◯ Assign to: [_____] · due [____]            │
│                                                │
│ [Cancel]                          [Log it]    │
└─────────────────────────────────────────────┘
```

**"Done now"** flavor: creates `ActionItem` with `status: 'done'`, no owner, no deadline.
**"Assign to..."** flavor: creates `ActionItem` with `status: 'open'`, required owner, optional deadline.

### Orphan ActionItem properties

```ts
interface ActionItem extends EntityBase {
  text: string;
  stepId: ProcessMapNode['id']; // always present
  parentImprovementIdeaId: null | ImprovementIdea['id'];
  parentImprovementProjectId: null | ImprovementProject['id'];
  assignedTo: null | ProcessParticipantRef;
  dueAt: null | string;
  status: 'open' | 'in-progress' | 'done';
  doneAt: null | string;
  doneBy: null | ProcessParticipantRef;
  createdBy: ProcessParticipantRef;
  createdAt: number;
}

// Quick Action = orphan ActionItem
function isQuickAction(ai: ActionItem): boolean {
  return (
    ai.parentImprovementIdeaId === null &&
    ai.parentImprovementProjectId === null &&
    ai.stepId !== null
  );
}
```

### Discovery + promotion

- Canvas card "Recent activity" expandable section shows the orphan ActionItems linked to the step (audit trail visibility)
- When user creates an IP from a card with orphan ActionItems, the IP form's Approach section offers an "Import recent actions on this step" affordance

### Out of V1

- Survey-driven "N+ orphan actions on this card — pattern worth investigating?" Inbox prompt — V2
- Cross-card pattern detection ("tank refill logged 5 times this quarter") — V2

---

## 11. Live-document state machine (D18) — per-section policies

Improvement Project sections use **two different policies** depending on data type:

| Section                       | Data type                                                                  | Policy                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1. Project metadata           | User-entered                                                               | Local state only; no upstream tie                                                         |
| 2. Background / Current State | Hub canvas state + capability projection (auto) + narrative (author-owned) | **Snapshot + drift indicator** for narrative; live for projection panel                   |
| 3. Goal — Y-level             | OutcomeSpec FK                                                             | **Reactive** for FK target (auto-follow renames); **snapshot** for baseline/target values |
| 3. Goal — X/x-level           | Hypothesis FK + condition                                                  | **Reactive** (auto-suggest from confirmed Hypotheses)                                     |
| 4. Investigation lineage      | Hypothesis + Finding FK lists                                              | **Reactive** (pure projection of FKs)                                                     |
| 5. Approach / Countermeasures | ImprovementIdea + ActionItem FK lists + narrative                          | **Reactive** for FK list; **stable** for narrative                                        |
| 6. Outcome reference          | Sustainment FK + Handoff FK                                                | **Reactive** (forward-references, one-to-one chains)                                      |
| Section header status         | IP status                                                                  | User-set; no upstream tie                                                                 |

### Implementation primitives

```ts
// packages/ui/src/components/ImprovementProject/hooks/useLiveProjection.ts
function useLiveProjection<T>(
  fkList: string[],
  fetchBatch: (ids: string[]) => Map<string, T>
): T[] {
  // Subscribes to relevant store; re-renders on change.
}

// packages/core/src/improvementProject/snapshot.ts
function shouldShowDrift<T>(
  snapshot: { value: T; sourceHash: string },
  current: { value: T; hash: string }
): boolean {
  return snapshot.sourceHash !== current.hash;
}

// "↻ Refresh from live" button shown when shouldShowDrift returns true
```

**Survey hints (per D11) are always reactive** — computed against current data on render; not stored on the IP entity.

---

## 12. V1 implementation slicing (PRs)

The V1 work is significantly larger than the prior IP V1 plan (which was 19 tasks across 3 PRs). RPS V1 adds: naming reconciliation, Wall re-home, Wall vision Detective-pack, Survey UI dual-surface, Quick Action, cross-surface navigation, Sustainment + Handoff surfaces, Inbox digest.

Total estimated: **8–10 PRs across ~6–8 weeks** off branch `response-path-system-v1`. Sequenced as:

| PR            | Slice                                                              | Tasks (est) | Depends on |
| ------------- | ------------------------------------------------------------------ | ----------- | ---------- |
| **PR-RPS-1**  | Naming + Wall re-home                                              | ~6          | None       |
| **PR-RPS-2**  | Wall Detective-pack: 5th status + confirm-gate                     | ~3          | PR-RPS-1   |
| **PR-RPS-3**  | Wall Detective-pack: mini-charts inside HypothesisCard             | ~6          | PR-RPS-2   |
| **PR-RPS-4**  | Wall Detective-pack: brush-to-pin gesture                          | ~5          | PR-RPS-3   |
| **PR-RPS-5**  | IP V1: types, persistence, store, .vrs                             | ~7          | PR-RPS-1   |
| **PR-RPS-6**  | IP V1: 6-section UI + multi-level Goal                             | ~7          | PR-RPS-5   |
| **PR-RPS-7**  | IP V1: per-app shells + canvas-card pickers + cross-surface badges | ~5          | PR-RPS-6   |
| **PR-RPS-8**  | Quick Action surface + Recent activity panel                       | ~4          | PR-RPS-1   |
| **PR-RPS-9**  | Sustainment V1 + Inbox prompts + signal computation                | ~6          | PR-RPS-7   |
| **PR-RPS-10** | Handoff V1 + Inbox prompts + sponsor signoff (paid)                | ~5          | PR-RPS-9   |

Each PR uses `superpowers:subagent-driven-development` per `feedback_subagent_driven_default`. Sonnet workhorse for ≥70%; Opus for final-PR review.

The earlier IP V1 plan (`docs/superpowers/plans/2026-05-08-improvement-project-v1.md`) is **superseded**; PR-RPS-5 + PR-RPS-6 + PR-RPS-7 cover IP work with the corrected design.

### Plan-level partial-integration policy (per `feedback_partial_integration_policy`)

- **PR-RPS-1** stands alone — naming + Wall re-home are pure refactor; merge to main even if no other RPS work follows
- **PR-RPS-2/3/4** can land independently on the Wall — Detective-pack incremental; merge to main per gap closure
- **PR-RPS-5** stands alone — engine layer for IP; visible no UX
- **PR-RPS-6** mounts on dev pages without app integration — UI primitive layer
- **PR-RPS-7** integrates IP into apps; user-visible
- **PR-RPS-8** parallel-track Quick Action; can merge anytime after PR-RPS-1
- **PR-RPS-9 + PR-RPS-10** sequential after IP integration

---

## 13. ADR amendments + new ADRs

### Amendments to existing ADRs

**ADR-053 (Question-driven Investigation):** Add amendment block clarifying that "Hypothesis" word is now used for the downstream candidate-explanation role (renamed from `SuspectedCause`); ADR-053's commitment that **questions are primary, hypotheses are downstream** is unchanged.

**ADR-064 (SuspectedCause Hub Model):** Add amendment block: `SuspectedCause` entity renamed to `Hypothesis`. The "hub" word in the original title was descriptive (entity hubs evidence threads), not a separate parent level. After rename, `Hypothesis` IS the entity hubbing together findings + questions for one mechanism. No structural change.

**ADR-066 (Evidence Map Investigation Center):** verify naming references — update if any.

**ADR-070 (FRAME Workspace):** verify naming references — update if any.

**Vision spec §2.4 + §5.3:** apply the "Improvement Project" rename amendment (carry forward from earlier IP V1 spec); update any "Charter" or "SuspectedCause" references.

### New ADRs needed

**ADR-080: Hypothesis grouping (named-future)** — when V2 promotes themeTags to first-class HypothesisGroup entity. Not in V1 scope.

---

## 14. Out of V1 scope (explicitly named-future)

- **Best-subsets inline suggestions in Wall** (vision slide 3 gap #4) — V2
- **HypothesisGroup as first-class entity + Fishbone view** — V2
- **Survey orphan-ActionItem pattern detection** ("5 quick actions on this card → promote?") — V2
- **Multi-level breadcrumb navigation** (depth-3+) — V2
- **Pop-out window authoring (`usePopoutChannel`) for IP / Sustainment / Handoff** — V2 (vision §5.3 commitment deferred)
- **Multi-tier signoff workflow** (Under Review + Approved status states for IP) — V2 paid-tier
- **Audit trail per-section change log** — relies on Azure tenant logging at platform level; not a V1 in-product feature
- **Comments / threads on artifact sections** — V2 paid-tier (heavy SSE / pub-sub infra)
- **RACI tracking per artifact** — V2 paid-tier
- **Change notifications (email / push)** — V2 paid-tier
- **Cross-card pattern detection in Survey** — V2
- **DMAIC / QC Story / TBP-explicit phase labels in UI copy** — explicitly NOT planned (D2 commitment to VariScout-native vocabulary)

---

## 15. Resolved during spec review (2026-05-09)

All 7 architectural questions answered during user spec review. Each had reasonable architectural confidence; none required external research. Locked answers below feed directly into the V1 implementation plan.

### OQ1 — Survey rule registry location

**Resolved: per-domain files + shared engine.**

```
packages/core/src/survey/
  ├── index.ts                  # Engine: collect rules, evaluate, return SurveyHint[]
  ├── types.ts                  # SurveyHint, SurveyRule, SurveyContext
  ├── wall.ts                   # Wall-domain rules (needs-disconfirmation, 1-step-away, etc.)
  ├── improvementProject.ts     # IP-domain rules (Goal not set, lineage gaps)
  ├── sustainment.ts            # Sustainment-domain rules (drift detected)
  ├── handoff.ts                # Handoff-domain rules (owner not acknowledged)
  └── inbox.ts                  # Hub-overview Inbox aggregator (chain transitions)
```

Each rule is `(context: SurveyContext) => SurveyHint[]`. Engine in `index.ts` collates results across rules per surface. Domain rules co-locate with their domain.

### OQ2 — Inbox digest computation cadence

**Resolved: compute on render + reactive via store subscription.**

Hub-overview is opened weekly/monthly by process owners. Computing on render is fast for typical hub sizes (≤100 entities → sub-millisecond rule eval). When user is actively in a session, store-subscriptions auto-refresh visible Inbox items. **No background pre-computation; no scheduled job.**

### OQ3 — Cross-surface badge data source

**Resolved: computed live via store subscriptions; memoize per render (`React.useMemo`).**

Badges are simple counts. Live computation is fast at typical hub sizes; memoization prevents re-computation on unrelated re-renders. If perf becomes an issue at very large hubs (V2+), specific high-traffic counts denormalize to entity metadata. V1 ships live everywhere.

### OQ4 — Wall mini-chart data scope

**Resolved: factor + outcome columns from `Hypothesis.condition`; chart type derived from factor data type; linked findings highlighted.**

```ts
function deriveMiniChartConfig(h: Hypothesis): MiniChartConfig {
  const factor = h.condition.kind === 'leaf' ? h.condition.column : firstLeafColumn(h.condition);
  const outcome = h.outcomeColumn; // resolved from linked Question/Finding
  const factorDataType = parseColumn(factor).type;

  if (factorDataType === 'numeric') return { type: 'i-chart', factor, outcome };
  if (factorDataType === 'categorical') return { type: 'boxplot', factor, outcome };
  if (factorDataType === 'continuous-x') return { type: 'scatter', factor, outcome };
  return { type: 'placeholder', factor };
}
```

Findings linked to the hypothesis render as highlighted brushed regions / categories on the mini-chart (matches vision slide 2's H1 brushed-9-pts I-Chart + H2 highlighted-Supplier-B Boxplot).

### OQ5 — Sustainment cadence-tick evaluator

**Resolved: stored counter on `SustainmentRecord`; incremented via HubAction dispatch when a new EvidenceSnapshot arrives.**

```ts
// New HubAction kind
| { kind: 'SUSTAINMENT_TICK_EVALUATED';
    sustainmentRecordId: SustainmentRecord['id'];
    snapshotId: EvidenceSnapshot['id'];
    onTarget: boolean }
```

Auto-triggered when `EVIDENCE_ADD_SNAPSHOT` lands on a Hub with active SustainmentRecords. Handler increments `consecutiveOnTargetTicks` if `onTarget=true`; resets to 0 if `false`. Auto-fire `confirmed-sustained` when counter hits N=4 (per D10).

Cleanly integrates with existing F-series HubAction-dispatched persistence.

### OQ6 — Handoff sponsor sign-off mechanism

**Resolved: in-app signoff request → state change. No email/SSE in V1.**

Flow:

1. Process owner clicks "Request approval" on Handoff form → creates `pending` SignoffRequest event
2. Sponsor opens VariScout (their normal weekly cadence); Inbox shows _"1 Handoff awaiting your approval"_
3. Click → opens Handoff form scrolled to signoff section
4. Click "Approve" → state transitions `pending` → `acknowledged` → `operational`

No email integration. No real-time SSE notifications. Sponsor discovery via existing Inbox at next visit. V2 may add email + SSE when paid-tier customer demand materializes.

### OQ7 — Dev-fixture migration

**Resolved: `pnpm dev:reset` clears local IndexedDB; new schema auto-creates on next dev run.**

Per D15 (no backward compat in design phase): no migration logic. Documented as a dev-onboarding step in `apps/pwa/CLAUDE.md` + `apps/azure/CLAUDE.md`. The reset script clears `variscout-pwa-normalized` + `variscout-azure-app` Dexie databases; downstream apps re-bootstrap on next `pnpm dev`.

---

## 16. References

### VariScout context

- Vision spec at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (§2.4 response paths, §3.4 hypothesis arrows, §5.3 surface commitments)
- `docs/01-vision/methodology.md` (§37 methodology hierarchy, §256 Survey readiness)
- `docs/01-vision/constitution.md` (Principle 1 — FRAME→SCOUT→INVESTIGATE→IMPROVE)
- ADR-053 question-driven investigation
- ADR-064 SuspectedCause hub model
- ADR-066 Evidence Map investigation center
- ADR-070 FRAME workspace
- ADR-078 PWA + Azure architecture alignment
- Memory: `project_investigation_wall_vision_ui_mock` (slide 3/5 of "Investigation on the River" deck, 2026-05-08 reference)

### Superseded by this spec

- `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md` (the earlier standalone IP V1 design)
- `docs/superpowers/plans/2026-05-08-improvement-project-v1.md` (the earlier IP V1 implementation plan)

Both remain in the repo as historical record of the iteration; status will be marked `superseded` when this spec is approved.

### Methodological grounding

- Watson 2019 / Turtiainen 2019 — question-driven EDA foundation
- VariScout's own primitives in `packages/core/src/findings/types.ts` + `packages/core/src/processHub.ts`

---

## 17. Decision log update

When this spec is approved + committed, add to `docs/decision-log.md` under "Replayed Decisions":

> **2026-05-09 — Response Path System V1 unified design supersedes piecewise IP V1**
> Per `docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md`. Earlier IP V1 spec (2026-05-08) and plan (2026-05-08) marked superseded. RPS V1 unifies design across all 5 response paths + Survey UI + naming reconciliation + Wall re-home + Wall Detective-pack + Quick Action surface. ~8–10 PRs across ~6–8 weeks off branch `response-path-system-v1`. No backward compatibility (design phase).
