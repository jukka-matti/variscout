---
title: VariScout — Product Vision
audience: [product, engineer, designer, analyst, business]
category: strategy
status: accepted
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

In addition to the data-provenance arrows (§3.3 #4), users may **optionally draw a hypothesis arrow** from one column (or one step) to another, declaring "I suspect this affects that." Hypothesis arrows live as one of several canvas overlay toggles — alongside investigations, suspected causes, and recent findings (see §5.4). Default-hidden; the user toggles to reveal.

**Promoted vs draft visual distinction.** When an analysis run produces evidence sufficient to cross the threshold (ADR-064 SuspectedCause hub semantics), the hypothesis is promoted: it renders as a **node marker** on the affected step rather than as an arrow. Draft / unpromoted hypotheses render as **faint arrows between steps** when the overlay is on. Both states reflect the same underlying entity in the investigation graph — only the canvas projection changes. This prevents canvas clutter on mature Hubs (30+ hypotheses become unreadable as always-on arrows) while keeping the at-a-glance "which steps have suspected causes" read intact.

This unifies the canvas with the SuspectedCause hub construct (ADR-064): a promoted hypothesis is just a hypothesis that has crossed the evidence threshold and gets the node-marker treatment. The investigation graph (questions, findings, evidence) survives as the underlying data model; the canvas is one of two spatial expressions of it (the Investigation Wall is the other — see §5.6 for dual-home semantics).

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
- **Capability badge OR fallback** — when specs are set: Cpk vs target, color per `statusForCpk`, suppressed for n < 10, badged "trust pending" for n < 30. **When specs are absent: the card swaps the Cpk badge for `mean ± σ + n` and shows a `+ Add specs` chip.** When specs are partial (e.g., LSL only): show the side that's set + a "complete specs" chip. The chip / icon is the spec-edit affordance for the unset state.
- **Drift indicator** — recent vs prior, when snapshot history exists.
- **Spec edit affordance** — small `[✎]` icon on the card (hover-reveal on desktop, always-visible on mobile) → opens inline `SpecEditor` (existing component). When specs are absent, the `+ Add specs` chip described above replaces the icon as the primary affordance.
- **Click target** — opens drill-down (§5.3). Card click is reserved for drill-down; spec edit is always the icon / chip, never the card body.

### 5.3 Drill-down

**Modern floating overlay anchored near the clicked card with a blurred-canvas backdrop.** Dismisses on click-out / Esc / X. On desktop the overlay floats anchored to the clicked step (positioned to keep the original card visible if possible). On mobile the same content slides up from the bottom (extends today's `EvidenceMapNodeSheet` / `MobileCategorySheet` pattern). CoScout (right rail in Azure) is untouched throughout — no panel-vs-rail contention.

Contains:

- The clicked step's analysis (charts scoped to step + active context tuple).
- Linked investigations (existing investigation graph entities).
- **Five response-path CTAs (per §2.4) — mode-aware.** Cadence-mode (mature Hub) shows all five active. First-time / no-Hub mode (PWA free tier) shows Quick action + Focused investigation active; Sustainment / Charter / Handoff dimmed with a tier-upgrade hint (no Hub anchor for cadence / charter / handoff in single-Hub PWA tier).
- Any hypothesis arrows or promoted SuspectedCause markers incident to this step (per §3.4).
- **Heavy on-ramps preserved:** Focused Investigation navigates to the Investigation tab (3-column workspace, shipped); Charter promotes via `usePopoutChannel` to a separate window for long authoring sessions; Sustainment confirms inline within the overlay; Handoff opens the export modal.

The drill-down is a **bridge**, not a workspace. Long-form work (Investigation, Improvement, Charter) lives in dedicated surfaces; the overlay is the launchpad.

Rationale for the floating-overlay shape over a right side-panel: the right rail is claimed by CoScout in Azure (per `docs/decision-log.md` §1 "Plan C3 (FRAME right-hand capability drawer) — superseded 2026-04-29 by FRAME thin-spot batch"). A floating overlay anchored to the click avoids both the C3 collision and the canvas-reflow that an in-place card expansion would cause; it also unifies desktop and mobile gestures.

### 5.4 Mode lenses + canvas overlays (replaces Analysis tab)

Today's analysis modes (yamazumi / performance / defect / process-flow / capability) become **lenses** applied to the canvas. Picking a lens re-skins cards to highlight that mode's metrics. There is no separate Analysis tab. The default canvas already shows baseline overlays (capability-or-mean±σ, drift, trust per §5.2); a lens is an opt-in re-skin.

**Modes vs levels are orthogonal axes.** Levels (System / Process Flow / Local Mechanism, §2.1) are _which slice of the process_ you're scanning — expressed as a canvas pan/zoom, not a separate picker. Modes are _which analytical lens_ you apply to whatever you're scanning. The two cross-cut: a user can read at any level in any mode. ADR-068 (CoScout cognitive redesign) gets a corresponding amendment — coaching is mode-aware AND level-aware (level inferred from the canvas zoom state).

**Canvas overlays.** Independent of mode lenses, the canvas exposes a small set of toggleable overlays, each projecting investigation graph data onto map nodes:

- **Investigations** — count + status badge per step (open / supported / refuted).
- **Hypotheses** — faint arrows for draft hypotheses (per §3.4).
- **Suspected causes** — node markers for promoted hypotheses (per §3.4).
- **Recent findings** — pin-style markers anchored to map nodes.

With overlays off, the canvas is a clean live map. With overlays on, the canvas IS the Wall view (see §5.6 — dual-home).

**Mode B reuse (PWA first-time GB).** Today's silent mode auto-inference (`packages/core/src/parser/detection.ts` + `parser/stack.ts` + the wide / yamazumi / defect detection modals) survives as a **suggested lens prompt**, not a forced mode switch. The first paint always renders something deterministic; the lens suggestion appears as a non-blocking nudge.

### 5.5 Hub list

Cross-Hub navigation. Today's Dashboard hub list survives, lightly reskinned to reflect Hub-as-map semantics (each Hub preview shows its map + last snapshot summary).

### 5.6 Investigation Wall — dual-home

The Wall is **dual-home**: it remains the canonical destination in the Investigation tab (`WallCanvas` shipped — `packages/charts/src/InvestigationWall/`) AND becomes one of the canvas overlays (§5.4). Same data, two views: the destination supports deep cross-investigation work (full-screen, command palette, hypothesis-card reordering); the canvas overlay supports cadence-loop scanning (investigation density and status badges projected onto the map nodes you're already looking at).

The "destination vs overlay" framing replaces the earlier binary (separate surface vs absorbed-into-canvas) — the spec's "vs" was a false choice. Cross-investigation pattern recognition has different cognitive needs than current-investigation drill-down, so the destination stays; the overlay adds a glance read without forcing a context switch.

**Methodology integration follow-up.** The methodological picture for the Wall + SuspectedCause hubs (when does an investigator pick Wall vs Evidence Map vs Question framework? Persona-specific patterns? Missing-evidence critique as principle? AND/OR/NOT composition as teachable pattern?) is a separate doc tracked in `docs/decision-log.md` §2 "Investigation Wall methodology integration brainstorm" — belongs in `docs/01-vision/eda-mental-model.md` (or successor) once decided.

### 5.7 CoScout

CoScout has two roles in the new world (the third — "drafts the canvas" — is intentionally cut from V1; see below):

- **Coaches per step** — methodology nudges keyed to the clicked step's context (mode-aware AND level-aware coaching from existing `coScout/phases/` and `coScout/modes/` prompt modules; see §5.4 for the orthogonal mode/level axes).
- **Stays optional** — every surface works without CoScout. Free PWA tier ships without CoScout (Constitution P8). Azure tier ships with it.

CoScout does NOT make analytical claims. Its outputs are always tagged as proposals; the deterministic engine remains authoritative.

**No CoScout map drafting in V1.** Canvas authoring is 100% manual click / drag / connect: existing `detectColumns()` and `inferMode()` seed suggested column roles, and the user assembles steps + arrows + sub-step groupings + branch / join via direct manipulation. AI map drafting carries ongoing prompt / eval / variance cost, while manual canvas authoring is finite design work; most factory-floor CSVs have well-named columns where manual click / drag beats AI-draft-then-review. The V1 spec commits to manual canvas authoring as a **first-class design concern** (drag-to-connect, multi-select sub-step grouping, branch / join discoverability) — clumsy manual UI would force AI back in. Revisit AI drafting in V2 only if user research shows manual stalls.

---

## 6. What's superseded

This vision spec replaces or absorbs the following. Each item lists the disposition. **No back-compat / no migration window** — VariScout has no production users yet to preserve, and per the no-back-compat principle, deletes happen in the same PR as the replacement (see Q7 in the §8 resolution log).

- **`docs/archive/specs/2026-04-27-process-learning-operating-model-design.md`** (archived at supersession) — content absorbed into §2 (methodology) and §4 (journey).
- **`docs/archive/specs/2026-04-27-product-method-roadmap-design.md`** (archived at supersession) — horizons live there as a "delivery-sequence reference" (re-tagged); they are NOT part of this vision spec. Vision describes destination; horizons describe path.
- **`docs/01-vision/methodology.md`** — substantially absorbed into §2; remains as a longer narrative companion with a forward pointer. Methodology terms cross-reference `docs/glossary.md`, which is the canonical home for retired-terms (tributary, CTS) and their replacements.
- **Today's `Frame` and `Analysis` top-level tabs** — both retire. The Canvas (§5.1) replaces both. Cognitive grouping rationale: Frame and Analysis are the same job ("look at the live map and its current state"); Investigation, Improvement, and Report each have a distinct cognitive shape and keep their own surfaces. Top-level nav post-cutover: `[ Hubs ] [ Canvas ] [ Investigation ] [ Improvement ] [ Report ]`. `JourneyPhase = 'frame' | 'scout' | 'investigate' | 'improve'` stays internal in `packages/core/src/types` (used for CoScout tool gating + investigation-internal phase detection) but stops driving top-level nav.
- **`packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`** + `LayeredProcessViewWithCapability.tsx` — shipped via production-line-glance C2 (Apr 29). Absorbed into the Canvas as a mode lens. Deleted in the same PR that ships the Canvas.
- **`packages/ui/src/components/ProcessMap/ProcessMapBase.tsx`** (river-SIPOC, ADR-070) — absorbed into the Canvas. ADR-070 amended: "superseded by vision spec; river metaphor retired; FRAME workspace retired as a top-level route." Deleted in the same PR.
- **`apps/azure/src/components/editor/FrameView.tsx`** + `apps/pwa` `FrameView` / `FrameViewB0` — Frame route retires; b0 lightweight render becomes the sparse-Canvas first paint when no map is authored yet. Deleted in the same PR.
- **"Tributary" terminology everywhere** — UI strings (`+ add tributary…`, "Group by tributary"), i18n keys (`wall.tributary.ariaLabel`), code comments. Replaced with "factor", "input arrow", or simply removed. Glossary at `docs/glossary.md` carries the retired-terms list.
- **"CTS" as a user-facing acronym** — replaced with plain language ("outcome at the customer" or similar). The CTS-vs-CTQ methodological distinction survives as concept; the acronyms don't survive as labels.
- **SuspectedCause hubs as separate construct (ADR-064)** — become "promoted hypotheses on the canvas" (per §3.4 — node markers). The data model entity survives unchanged; the user-facing concept folds into the canvas.
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
- **Pop-out window pattern** — `usePopoutChannel` + BroadcastChannel (`packages/hooks/src/usePopoutChannel.ts`). Three live consumers today (Evidence Map, Findings Board, Improvement Window) — extended in V1 as the on-ramp for heavy drill-down work (Charter authoring) per §5.3.
- **PWA SW behavior** — autoUpdate + skipWaiting (ADR-075 Amendment). Canvas chunk wraps in `lazyWithRetry` to handle the chunk-404 failure mode when SW auto-updates between sessions. No prompt-mode SW.

### Tier split (PWA vs Azure)

The Canvas-as-home commitment requires persistence — a home that vanishes is a teaser, not a tool.

- **PWA = local Hub-of-one.** Single Hub persisted in IndexedDB (browser-tenant-only per ADR-059, Constitution P1 customer-owned data). Same Canvas UX as Azure: build the map, set specs, run analysis, return later, data persists. Single Hub only — multi-Hub portfolio is an Azure-tier feature.
- **Azure tier adds** cloud sync, multi-Hub portfolio, cadence-driven Evidence Sources, CoScout (Constitution P8 — AI is Azure-only), and team features (sharing, comments, real-time collab).

---

## 8. Resolved decisions (2026-05-03)

The 11 brainstorm-default markers that originally lived here have been resolved. A new **Q0** ("tab vs canvas scaffold") emerged during journey mapping and was answered first because §8's other questions silently assumed an answer to it. The decisions are summarized below; full rationale, rejected alternatives, and follow-up work live in `~/.claude/plans/lets-do-this-next-rustling-simon.md` (the §8 walkthrough plan) and the corresponding entry in `docs/decision-log.md` (2026-05-03 — Vision §8 open questions resolved).

| #   | Topic                                          | Decision                                                                                                                                                                                                  | Section reflected |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Q0  | Tab vs canvas scaffold (new, structural)       | Canvas eats Frame + Analysis tabs. Investigation / Improvement / Report keep own surfaces. Wall is dual-home (destination + canvas overlay). `JourneyPhase` retires as a top-level nav primitive.         | §6                |
| Q1  | Drill-down form (§5.3 — overrides default)     | Modern floating overlay anchored near clicked card with a blurred-canvas backdrop. Mobile slides up from bottom. CoScout untouched. Mode-aware CTAs.                                                      | §5.3              |
| Q2  | Spec-edit gesture (§5.2 — confirms + extends)  | Small `[✎]` icon on card → inline `SpecEditor`. Card-display fallback rule when specs are absent: swap Cpk badge for `mean ± σ + n` and add a `+ Add specs` chip.                                         | §5.2              |
| Q3  | Mode lenses vs static (§5.4 — confirms)        | Baseline overlays always shown; mode is an opt-in re-skin. Levels (System / Flow / Local) are orthogonal — canvas pan/zoom, not a picker.                                                                 | §5.4              |
| Q4  | Wall fate (§5.6 — refines binary)              | Wall is dual-home: canonical destination in Investigation tab AND a canvas overlay toggle. Same data, two views. Methodology integration doc tracked separately.                                          | §5.6              |
| Q5  | CoScout drafting authority (§5.7 — overrides)  | No CoScout map drafting in V1. Manual click / drag / connect canvas authoring as a first-class design concern. CoScout coaching role unchanged.                                                           | §5.7              |
| Q6  | Horizons appendix (§6 — confirms)              | Horizons live outside the vision spec (delivery-sequence reference at `docs/archive/specs/2026-04-27-product-method-roadmap-design.md`). Vision spec stays timeless.                                      | §6                |
| Q7  | Migration path (overrides)                     | Hard cutover. Delete Frame + Analysis routes; ship Canvas; no parallel-run window; no back-compat. No users yet to preserve.                                                                              | §6                |
| Q8  | PWA-vs-Azure tier split (confirms with detail) | PWA = local Hub-of-one with IndexedDB persistence. Azure adds cloud sync + multi-Hub + cadence-driven Evidence Sources + CoScout + team features.                                                         | §7 ("Tier split") |
| Q9  | PWA SW behavior (confirms)                     | `lazyWithRetry` on Canvas component. ADR-075 (autoUpdate + skipWaiting) stays. No prompt-mode SW.                                                                                                         | §7                |
| Q10 | Glossary / terminology guide (overrides home)  | `docs/glossary.md` is canonical for all methodology terms (including retired tributary / CTS). `docs/01-vision/methodology.md` cross-references the glossary.                                             | §6                |
| Q11 | Hypothesis overlay (§3.4 — confirms + refines) | Optional canvas overlay (one of several toggles). Promoted hypotheses (ADR-064 SuspectedCause hubs past evidence threshold) render as node markers; draft hypotheses render as faint arrows. Default off. | §3.4              |

---

## 9. Verification

How we know this vision spec is realized as the canonical artifact:

- **One canonical document.** This file lives at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`. The two superseded 2026-04-27 specs are moved to `docs/archive/specs/` with frontmatter pointing forward.
- **Every in-flight plan can be measured against the vision.** For each plan in `docs/superpowers/plans/`, the plan's frontmatter references which section of the vision it advances. Plans that don't fit get killed or rewritten.
- **New PRs cite vision sections.** PRs touching FRAME / Hub / Analysis surfaces include "Advances vision §X" in the description. Plan-status drift becomes detectable by audit.
- **Memory entries reflect the vision.** `MEMORY.md` and topic memories update to point at this spec; entries about superseded concepts are corrected or deleted.
- **The 10 canvas commitments (§3.3) become the FRAME canvas detail spec.** A separate spec at `docs/superpowers/specs/<date>-canvas-detail-design.md` will detail UX (drag affordances, hit-test rules, animation, mobile, exact card layouts), inheriting the §8 resolved decisions above. This vision spec doesn't try to do that work; the canvas detail spec is the next brainstorming target.
