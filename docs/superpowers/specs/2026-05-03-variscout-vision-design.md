---
title: VariScout — Product Vision
audience: [product, engineer, designer, analyst, business]
category: strategy
status: draft
last-reviewed: 2026-05-03
supersedes:
  - docs/archive/specs/2026-04-27-process-learning-operating-model-design.md
  - docs/archive/specs/2026-04-27-product-method-roadmap-design.md
related:
  - docs/01-vision/methodology.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-070-frame-workspace.md
---

# VariScout — Product Vision

> **Canonical product vision.** This document supersedes the 2026-04-27 operating-model + product-method-roadmap specs. It is the single source describing what VariScout is, what it does, and what's in/out of scope. Implementation plans should cite which section of this vision they advance.

## 1. Thesis

VariScout operationalizes **structured process learning for industrial operations**. Real production data goes in. A persistent **logic map** of the process that produced it comes out. Capability monitoring, investigation, and response paths all run against that same map. **The map is the product.** Everything else — modes, charts, investigations, findings, response paths — is a view onto the map or a derivation from it.

The map is owned by a **Process Hub** (one Hub per process line). Every dataset belongs to a Hub. Every Hub IS its map. Hubs persist across investigations, snapshots, and time. The user authors a Hub's map once (or refines it incrementally); analysis runs on it many times.

---

## 2. Methodology spine

VariScout's substance is methodological, not analytical fashion. The product expresses these commitments in software so that following them is the path of least resistance.

### 2.1 Three-level model

Every process is read at three levels simultaneously:

- **Level 1 — System / Outcome.** What the customer experiences. Captured as the Y measure(s) on the right end of the canvas. Per-Hub there is at least one outcome.
- **Level 2 — Process Flow.** The sequence and topology of steps that produce the outcome. Captured as the spine of the canvas: nodes (steps and sub-steps), step→step arrows (flow with branch and join).
- **Level 3 — Local Mechanism.** The inputs, settings, materials, environment, and per-step measurements that drive each step. Captured as columns of incoming data linked to specific step nodes via directed arrows.

Each level has different users (process owner / analyst / operator), different artifacts (outcome card / flow graph / column-to-step links), and different rhythms (rare / per-investigation / continuous), but they share one map.

### 2.2 Observed vs expected — the universal lens

Every analysis answers: _is what we see different from what we expected?_ This shared structure (observed value compared to a model of expected value) underlies chi-square, regression, ANOVA, and capability indices. The vision commits to making this lens explicit in coaching: when a chart surfaces an anomaly, the explanation says _"observed X vs expected Y; difference is significant by Z"_ — not just "anomaly detected."

### 2.3 Methodology rules (enforced in the engine, taught in the UI)

- **No statistical roll-up across heterogeneous units (ADR-073).** Capability, defect rates, and trend metrics are computed per (node × context-tuple). The canvas's branch/join + context-propagation model (§3.3) makes this structural — heterogeneous siblings cannot be silently averaged.
- **Contribution, not causation.** EDA reveals factors that contribute to variation; it does not prove causality. The product's language stays in contribution terms ("explains 23% of variation"), never in causal claims ("X causes Y"). CoScout coaching enforces this.
- **Sample-size honesty.** Cpk is suppressed for n < 10 (deterministic refusal, not a hint). Cpk is badged "trust pending" for n < 30. Trust is a first-class card overlay, not a footnote.
- **Target-relative Cpk grading.** Cpk grades band against the user-set target (default 1.33), never against literature constants (1.67/1.33/1.00). `statusForCpk` is the one source of truth.
- **Geometric interaction language.** Two-factor interactions are described in geometric terms (ordinal / disordinal / parallel) and their effect on Y. The product never assigns "moderator" or "primary" roles to one factor over another — that's a causal claim VariScout doesn't make.

### 2.4 The five response paths

For any current state of any step, exactly five response paths exist. The drill-down panel (§5) presents these as the explicit set:

1. **Quick action** — a fix small enough to do today, no investigation needed (e.g., re-tune a parameter back to spec).
2. **Focused investigation** — a thread of EDA on this card. Opens the Investigation graph (questions → hypotheses → evidence → findings) scoped to this step.
3. **Charter** — formal improvement project (DMAIC or similar). Promotes the situation to a tracked initiative with milestones.
4. **Sustainment** — capability is fine; schedule the cadence to verify it stays so. Sets a snapshot frequency on this step.
5. **Handoff** — document and pass to another team / shift / function. Produces a handoff package with current state + recommended next steps.

These paths are H1's thesis made concrete. Every card and every drill-down surfaces them.

---

## 3. The artifact — Process Hub = Canvas = Logic Map

### 3.1 The map IS the Hub

A Process Hub holds the persistent logic map of a process line. There is no separate "Hub model" and "FRAME map model" — they are the same artifact. Every operation that today asks "where does this go?" (Hub or investigation? Map or specs?) collapses into operations on the Hub's canvas.

A Hub holds:

- **Map structure** — DAG of steps (see §3.3).
- **Specs per column / per step** — target, USL, LSL, cpkTarget, characteristic type. Per the existing per-characteristic spec model.
- **Named contexts** — context dimensions discovered through branch/join (§3.3).
- **Cadence definition** — manual / hourly / shiftly / daily / weekly. Drives Evidence Source semantics.
- **Snapshot history** — every dataset matched to this Hub becomes a snapshot in its history.
- **Finding history** — findings that have crossed the evidence threshold are anchored to map nodes.
- **Investigation history** — every investigation run on this Hub is preserved.

### 3.2 Net-new datasets match a Hub

When a user uploads / pastes a new dataset, the system attempts to match its column structure to an existing Hub's map. Match → the Hub's map auto-populates the canvas → user confirms. No match → create a new Hub (optionally from a template).

Today's hub-migration `suggestNodeMappings` engine (Azure) is the matcher. The vision moves it from the migration wizard into the upload entry path itself.

### 3.3 Canvas structure (the 10 commitments)

The canvas is a directed acyclic graph with the following primitives.

| #   | Commitment                      | Detail                                                                                                                                                                                                                                   |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | One continuous canvas           | Replaces today's FRAME (`ProcessMapBase` river-SIPOC, `LayeredProcessView`, `LayeredProcessViewWithCapability`) with a single growing surface. No b0 → b1/b2 transition shock.                                                           |
| 2   | Logic map semantic              | Every column maps to a step (or is marked unassigned). The map answers _which column came from which step?_ Hypotheses are an optional overlay (§3.4).                                                                                   |
| 3   | Hub IS the map                  | One persistent map per process line. Investigations on the same Hub share the SAME map. Never redrawn per investigation.                                                                                                                 |
| 4   | Directed arrows for column↔step | Direction encodes meaning: column → step = input/control to the step. Step → column = measured AT the step (an output / intermediate Y).                                                                                                 |
| 5   | Two-level nesting               | A step can contain sub-steps. One level of nesting only. Sub-steps tagged **parallel** (default; like chambers) or **sequential** (like a sub-sequence inside a parent).                                                                 |
| 6   | Full DAG with branch + join     | Steps can branch (one→many) and join (many→one). Real processes do both.                                                                                                                                                                 |
| 7   | Context propagation             | When parallel sub-steps converge to a downstream step, that step's analysis is automatically grouped BY upstream origin. ADR-073 enforced structurally — context follows the path.                                                       |
| 8   | Arrow scope = arrow target      | Drag an arrow to the parent step → applies to all children. Drag to a specific child → child-only. Drag to a multi-selection → subset. No new construct; falls out of the graph model.                                                   |
| 9   | Plain-language terminology      | "Tributary" and "CTS" are retired as user-facing terms. The canvas uses _step_, _sub-step_, _column_, _input_, _output_, _outcome_. The methodological distinction CTS-vs-CTQ survives as concept; the acronyms don't survive as labels. |
| 10  | Process steps are optional      | A minimal canvas is just Y + X columns (no steps). Steps are added when X's belong to specific stages — _useful when relevant, never required_. The canvas grows from declaration to fully structured map.                               |

### 3.4 Hypotheses as optional overlay

In addition to the data-provenance arrows (§3.3 #4), users may **optionally draw a hypothesis arrow** from one column (or one step) to another, declaring "I suspect this affects that." Hypothesis arrows are visually distinct, default-hidden, and toggle on per investigation. When an analysis run produces evidence, the hypothesis arrow gains an evidence-status color (supported / refuted / unclear / not yet tested).

This unifies the canvas with what today is the SuspectedCause hub construct: a "promoted hypothesis" is just a hypothesis arrow that has crossed an evidence threshold. The investigation graph (questions, findings, evidence) survives as the underlying data model; the canvas is the spatial expression of it.

---

## 4. The user journey

The journey loop. Each step references which canvas commitment or methodology rule it expresses.

1. **Upload** — paste / file / sample / Evidence Source (recurring data contract). All paths converge to the same column-detection + parsing step. Today's PWA `PasteScreen` + Azure `EditorEmptyState` already do this; the vision doesn't change ingestion mechanics, only what happens next.
2. **Match-or-create-Hub** — the system attempts to match incoming columns to an existing Hub's map. Match found → Hub's map applies → user confirms. No match → create new Hub (optionally from template).
3. **Refine the canvas** — confirm column-to-step assignments. Auto-suggestions from column names (`Chamber_3_*` → step "Chamber 3"). Add or refine structure if helpful (process steps, sub-steps, branches). Mark unassigned columns explicitly. Set specs (target / USL / LSL / cpkTarget) per column or per step.
4. **See the data** — canvas re-renders with **cards-per-step**. Each card shows inline mini-chart (histogram for measurements, distribution for categoricals) and capability badge (Cpk vs target, sample-size trust, drift indicator).
5. **Click a card** — drill-down opens. Shows: that step's analysis, recent values, related context tuples (per §3.3 #7), linked investigations, and the **five response-path CTAs**.
6. **Choose a response path** — quick action / focused investigation / charter / sustainment / handoff. Each has its own continuation; focused investigation opens the Investigation graph (questions → hypotheses → evidence → findings) pre-loaded with the clicked step's context and any hypothesis arrows from §3.4.
7. **Findings link back to cards** — when an investigation produces a finding, the finding becomes visible on the relevant card (badge + link). Cross-investigation patterns surface in the Wall (§5.6).
8. **Sustain** — cadence triggers the next snapshot; the Hub's history grows; capability and findings update; loop returns to step 4 with fresher data.

The journey has one entry, one continuous canvas through the middle, five exits (response paths), and a loop back to the top. Today's tab-switching between Frame / Analysis / Investigation / Hub flattens into this single loop.

---

## 5. Surfaces (concrete UI commitments)

### 5.1 The Canvas

Central spatial home for everything. Replaces today's FRAME workspace (`ProcessMapBase`, `LayeredProcessView`, `LayeredProcessViewWithCapability`). Shipped in both PWA and Azure. Same component, same data model, same gestures.

### 5.2 Cards

Per-step rendering. Each card shows:

- **Step name** + (if nested) parent context.
- **Inline mini-chart** — histogram for measurements, distribution for categoricals, mini-time-series for high-cardinality.
- **Capability badge** — Cpk vs target, color per `statusForCpk`. Suppressed for n < 10. Badged "trust pending" for n < 30.
- **Drift indicator** — recent vs prior, when snapshot history exists.
- **Spec edit affordance** — gesture TBD per FRAME canvas detail spec; _brainstorm default: small icon on card opens an inline spec editor (`SpecEditor` component already exists)_.
- **Click target** — opens drill-down (§5.3).

### 5.3 Drill-down panel

_Brainstorm default — confirm in §8._ Side-panel attached to the canvas (preserves spatial context — canvas stays visible on the left, panel slides in from the right). Contains:

- The clicked step's analysis (charts scoped to step + active context tuple).
- Linked investigations (existing investigation graph entities).
- Five response-path CTAs (per §2.4).
- Any hypothesis arrows incident to this step (per §3.4).

### 5.4 Mode lenses (replaces Analysis tab)

_Brainstorm default — confirm in §8._ Today's six analysis modes (yamazumi / performance / defect / process-flow / capability) become **lenses** applied to the canvas. Picking a lens re-skins cards to highlight that mode's metrics. There is no separate Analysis tab. The default canvas already shows baseline overlays (capability, drift, trust); a lens is an opt-in re-skin.

### 5.5 Hub list

Cross-Hub navigation. Today's Dashboard hub list survives, lightly reskinned to reflect Hub-as-map semantics (each Hub preview shows its map + last snapshot summary).

### 5.6 Investigation Wall

_Brainstorm default — confirm in §8._ Survives as a cross-investigation projection layer accessible from any Hub. The Wall projects all investigations and their findings onto the Hub's canvas, showing patterns across investigations (e.g., "this step has been investigated 7 times for the same hypothesis, 4 supported"). Alternative considered: absorb the Wall into the canvas as an "show all investigations" overlay; rejected because the Wall serves a different intent (cross-investigation pattern recognition vs current-investigation drill-down).

### 5.7 CoScout

_Brainstorm default — confirm in §8._ CoScout has three roles in the new world:

- **Drafts the canvas** — when a new dataset arrives without a matching Hub, CoScout proposes a candidate map (steps inferred from column naming, sub-step grouping inferred from prefix patterns, suggested column→step arrows). The user accepts, edits, or rejects.
- **Coaches per step** — methodology nudges keyed to the clicked step's context (mode-aware coaching from existing `coScout/phases/` and `coScout/modes/` prompt modules).
- **Stays optional** — every surface works without CoScout. Free PWA tier ships without CoScout (Constitution P8). Azure tier ships with it.

CoScout does NOT make analytical claims. Its outputs are always tagged as proposals; the deterministic engine remains authoritative.

---

## 6. What's superseded

This vision spec replaces or absorbs the following. Each item lists the disposition.

- **`docs/archive/specs/2026-04-27-process-learning-operating-model-design.md`** (archived at supersession) — content absorbed into §2 (methodology) and §4 (journey).
- **`docs/archive/specs/2026-04-27-product-method-roadmap-design.md`** (archived at supersession) — horizons collapsed into a delivery-sequence appendix outside the vision (_brainstorm default — confirm in §8_).
- **`docs/01-vision/methodology.md`** — substantially absorbed into §2; remains as a longer narrative companion with a forward pointer. Content reconciliation is a follow-up edit.
- **`packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`** + `LayeredProcessViewWithCapability.tsx` — shipped via production-line-glance C2 (Apr 29). Absorbed into the Canvas. Retained until the new Canvas component ships, then deleted.
- **`packages/ui/src/components/ProcessMap/ProcessMapBase.tsx`** (river-SIPOC, ADR-070) — absorbed into the Canvas. ADR-070 to be amended with "superseded by vision spec; river metaphor retired." Retained until the new Canvas ships.
- **"Tributary" terminology everywhere** — UI strings (`+ add tributary…`, "Group by tributary"), i18n keys (`wall.tributary.ariaLabel`), code comments. Replaced with "factor", "input arrow", or simply removed.
- **"CTS" as a user-facing acronym** — replaced with plain language ("outcome at the customer" or similar). The CTS-vs-CTQ methodological distinction survives as concept; the acronyms don't survive as labels.
- **SuspectedCause hubs as separate construct (ADR-064)** — become "promoted hypotheses on the canvas" (per §3.4). The data model entity survives; the user-facing concept folds into the canvas.
- **Today's Analysis tab as separate destination from FRAME** — consolidated into the Canvas with mode lenses (§5.4).
- **The 5-lens `ProcessStateLens` render-time projection** — reconciled with the new card overlay model. Lens semantics preserved (`outcome | flow | conversion | measurement | sustainment`); rendering shape changes from "stacked bands" to "card overlays + mode-lens reskin."

---

## 7. What stays

- **Production-line-glance C2 engine** — per-(node × context-tuple) capability computation (PR #107). The Canvas exposes this engine; the math doesn't change.
- **ADR-073, ADR-074, and all methodology rules.**
- **Investigation graph data model** — questions, hypotheses, findings, SuspectedCauses as entities. Surface changes; data model survives.
- **Hub data model** — already supports most of what's described here (map structure, specs, cadence, snapshots, findings).
- **Per-characteristic spec model** — shipped (target, USL, LSL, cpkTarget, characteristicType per column).
- **PWA + Azure dual deployment** (ADR-059 web-first stays).
- **CoScout system architecture** — existing prompts, tool registry, knowledge model; role refinement is the change, not architecture.
- **Evidence Source concept** — recurring data contracts. Folded into "Hub with cadence" semantics; not a separate construct.
- **Customer-owned-data principle (ADR-059)** — browser-only processing; data stays in customer's tenant.

---

## 8. Open questions (confirm before writing implementation plans)

These are the **brainstorm defaults** carried forward from sections 5–6. Each one needs an explicit yes / change-direction before the vision is operationalized into implementation plans.

1. **Drill-down form (§5.3)** — _default: side-panel attached to canvas._ Alternatives: modal overlay (more focused, hides canvas); routed view (full-page, loses spatial context). Affects how much of canvas stays visible during investigation.
2. **Spec-editing gesture on cards (§5.2)** — _default: small icon on card opens inline `SpecEditor`._ Alternatives: card click as the spec edit (then drill-down moves to a different gesture); drawer; context menu.
3. **Mode lenses vs static overlays (§5.4)** — _default: baseline overlays always shown (capability + drift + trust); mode is opt-in lens that re-skins._ Alternative: user must pick a mode for the canvas to render any analytical content. Affects first-experience friction.
4. **Wall fate (§5.6)** — _default: Wall survives as a separate cross-investigation surface._ Alternative: absorb Wall into the canvas as a toggleable overlay. Question is whether cross-investigation pattern recognition has different cognitive needs than current-investigation drill-down.
5. **CoScout's drafting authority (§5.7)** — _default: drafts a candidate map from the dataset; user accepts / edits / rejects._ Alternatives: only suggests within user's draft (no drafting); fully autonomous draft (no user confirmation needed). Affects free-tier behavior.
6. **Horizons appendix (§6)** — _default: H0–H4 collapsed to a "delivery sequence" appendix separate from this vision spec._ Alternatives: horizons stay structural in this vision spec; horizons stripped entirely. Affects how vision communicates roadmap to stakeholders.
7. **Migration path** — how do existing investigations on today's FRAME / `LayeredProcessView` get carried forward? _Default: auto-migrate (existing maps become Canvas maps; ProcessMap data model is unchanged)._ Question is whether to do parallel-run period for safety.
8. **Pricing/tier implications** — does canvas-as-everything change the PWA-free vs Azure-paid feature split? Today: PWA = single-investigation flow; Azure = Hubs + Evidence Sources. Vision implies Hubs are central. _Default: PWA gets Hubs (a project IS a Hub of one process line); Azure adds multi-Hub portfolio + cadence-driven Evidence Sources + cloud sync._
9. **PWA SW behavior under canvas swap** — the recent revert to autoUpdate (ADR-075) means a Canvas-rollout PWA will auto-deploy. _Default: lazyWithRetry on Canvas component for safety._
10. **Glossary / terminology guide** — when "tributary" and "CTS" disappear, the methodology glossary needs an update. _Default: amend `docs/01-vision/methodology.md` (or its successor) with the canonical term list._
11. **Hypothesis overlay (§3.4)** — _default: hypothesis arrows survive as an optional overlay on top of the logic map._ Alternatives: pure logic map, no hypothesis arrows in the canvas at all (hypotheses live only in the existing investigation graph, surfaced via drill-down); or full first-class hypothesis arrows always visible. Affects whether the canvas IS the investigation spine or is upstream of it.

---

## 9. Verification

How we know this vision spec is realized as the canonical artifact:

- **One canonical document.** This file lives at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`. The two superseded 2026-04-27 specs are moved to `docs/archive/specs/` with frontmatter pointing forward.
- **Every in-flight plan can be measured against the vision.** For each plan in `docs/superpowers/plans/`, the plan's frontmatter references which section of the vision it advances. Plans that don't fit get killed or rewritten.
- **New PRs cite vision sections.** PRs touching FRAME / Hub / Analysis surfaces include "Advances vision §X" in the description. Plan-status drift becomes detectable by audit.
- **Memory entries reflect the vision.** `MEMORY.md` and topic memories update to point at this spec; entries about superseded concepts are corrected or deleted.
- **The 10 canvas commitments (§3.3) become the FRAME canvas detail spec.** A separate spec at `docs/superpowers/specs/<date>-canvas-detail-design.md` will detail UX (drag affordances, hit-test rules, animation, mobile, exact card layouts). This vision spec doesn't try to do that work.
