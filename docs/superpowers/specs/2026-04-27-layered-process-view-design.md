---
title: Layered Process View — Three-Band Visual Language
audience: [product, designer, engineer, analyst]
category: design-spec
status: draft
related:
  [
    methodology,
    process-hub,
    process-learning-operating-model,
    product-method-roadmap,
    frame-process-map,
    evidence-sources,
    investigation-wall,
    eda-mental-model,
    adr-070,
  ]
date: 2026-04-27
---

# Layered Process View — Three-Band Visual Language

## Scope

This is a **visual-language / design spec**, not a full implementation plan. It defines the three-band layout, per-surface render rules, vocabulary, and a phased implementation direction grounded in existing FRAME / ProcessMap code. Detailed interaction model, drag/drop semantics, mobile responsive behavior, and per-band visual tokens are out of scope and belong to follow-up specs.

## Summary

A three-band visual language for understanding a process across outcome, designed flow, and actual operations. The bands stack vertically; process steps align in vertical columns; the gap-between-design-and-reality insight (Watson, in the spirit of Y / X / x EDA stratification) becomes a vertical reading. The same shape appears in three surfaces with different scope and writability:

- **FRAME** — design-time, writable. Match process knowledge to data inventory; expose gaps.
- **Process Hub current-state** — read-time, snapshot- and cadence-state-driven. Cadence review.
- **Multi-hub view** — portfolio scope. Cross-process pattern scan without false aggregation.

This spec extends the river-styled SIPOC FRAME workspace ([ADR-070](../../07-decisions/adr-070-frame-workspace.md)). The river-SIPOC stays inside the Process Flow band; the layered design adds Outcome above and Operations below. Existing `ProcessMap`, `ProcessMapBase`, `FrameView`, `detectGaps`, `inferMode`, and subgroup-axis infrastructure are reused, not replaced.

## Context

The April 2026 spec wave (operating model + product-method roadmap) named "Process Learning System" and three process-learning levels (system / outcome → flow / process model → local mechanism / evidence) but did not specify how the levels render visually or how they integrate with existing surfaces. ADR-070 and the Investigation Wall already exist as design-time and investigation surfaces. ADR-070's underlying motivation — _"the methodology was invisible at the moments users most need it"_ — points directly at what's missing: **Watson's three-level Gamba thinking needs a visible shape in the product.**

A brainstorm with the product owner produced this design.

## Three-band model

### OUTCOME band — the outcome we want

Standard performance metrics that compare across processes. Strategic / business framing. Watson called this _"productivity, units per time, rate, standards"_ — generic outcome measures.

**Content:**

- Productivity / throughput per period
- Target Cpk
- Strategic context (sustainment status at process level, response-path summary)
- Customer / business requirement framing

**Not in this band:**

- The customer's specific experience definition (that's at Process Flow's ocean as CTS)
- Spec values (USL/LSL/target — those are Operations)

### PROCESS FLOW band — the designed dynamic process

The river-styled SIPOC topology _populated_ with designed dynamics. Watson's _"Level 2 should be a flow rate. A combination of different rates."_

**Content:**

- Steps with names (the activities)
- Flow direction (left → right)
- Designed flow rate per step or per arc (units/hr, takt) — _requires data-model addition; see Data Model Gaps_
- Designed wait/delay times between steps — _requires data-model addition_
- Bottleneck markers (slowest step highlighted) — _derived from designed rates once present_
- CTQ measurement points placed on steps
- CTS marker at the ocean (right end) — the customer experience target
- Sequencing and logic structure

**Not in this band:**

- Spec values (USL/LSL/target) — Operations
- Actual measurements — Operations
- Factor data — Operations (factors live at Operations as factor chips with cross-band connectors)

### OPERATIONS band — actual control + specs + actuals

Everything operational: factor inputs (formerly tributaries), their specs, their actuals, capability metrics, events, gemba, signal cards, trust. Watson's _"X flowing with time at the 3rd tier"_ and _"real world connections."_

**Content (full vision; phased per the implementation direction below):**

- **Factor chips** (formerly tributaries) per step — one per process input/X
- **Specs per factor**: USL / LSL / target / target Cpk / designed operating window
- **Snapshot-backed actuals per factor**: latest values, current Cp/Cpk
- **Cp/Cpk-over-batches mini-i-chart** per step (Watson's design from the second transcript: each batch produces one Cp/Cpk point; the i-chart of these over time IS the capability-stability view)
- **Recipe deviations** — actual factors outside their designed operating windows
- **Process-scoped observations**: events, Signal Cards, gemba notes, MSA records
- **Trust signals**: sample size, n<30 warnings, MSA freshness, subgroup integrity

**Render-mode variation by surface** (see "Surfaces" below):

- Config mode (FRAME): factor chips as drag targets, spec entry fields, subgroup axis selector
- Snapshot/cadence mode (Process Hub current-state): factor chips with spec/actual badges, capability sparklines, response-path triggers — based on latest cadence-state data, not live monitoring
- Aggregate mode (multi-hub): per-hub state badges only

**VariScout is not live monitoring.** All "actual" data in Operations comes from snapshots and cadence-state items. Updates happen at the cadence the customer chooses (hourly, shiftly, daily, weekly).

## Cross-band design

**Vertical step alignment.** Each process step in Process Flow has a vertical column descending into Operations. Factor chips at Operations align under the step where the factor enters. Reading vertically per step shows: declared Process Flow content (CTQs, designed rate) → actual Operations content (factors, specs, current Cp/Cpk).

**Cross-band connector lines.** Subtle dashed lines from each Operations factor chip up to the corresponding Process Flow step. The lines visually answer "which step does this factor connect to?"

**Capability gaps as vertical reads.** Step 2 designed for 180/hr (Process Flow) operating at 165/hr (Operations) — the vertical gap IS the methodology made visible. The same vertical read shows USL/LSL designed (Operations spec) vs. actual values (Operations actuals).

## Surfaces

The same `<LayeredProcessView>` composed view renders in three surfaces with mode-specific Operations content.

### Component placement

- **Pure chart primitives** (band rendering, river-SIPOC, factor chip glyph, mini-i-chart sparkline) live in `@variscout/charts` alongside existing `EvidenceMap` and `ProcessMap` primitives.
- **Composed writable view** (`<LayeredProcessView>`) lives in `@variscout/ui` because it composes interactive controls (drag/drop, spec inputs, factor mapping). This matches the existing pattern: `ProcessMapBase` is in `@variscout/ui` while raw map primitives are in `@variscout/charts`.
- **App wrappers** (`FrameView`, `ProcessHubCurrentStatePanel`, multi-hub view) consume `<LayeredProcessView>` and pass surface-specific props (mode, data sources, response-path callbacks).

### FRAME workspace (design-time, writable)

Primary user job: **match process knowledge to data inventory; expose gaps.**

The user has two implicit lists:

- "Things that could affect outcomes at step N" — process knowledge (CTQs declared)
- "Columns I have in this Excel" — data inventory (factor data available)

The FRAME workflow puts these side-by-side at the right step:

1. **Data ingestion** — columns appear as unmapped factor candidates
2. **Build Process Flow** — name steps, set order, declare CTQs per step (process knowledge entry)
3. **Map columns to steps** — drag each candidate factor chip into its step's column under Operations
4. **Set specs** — per factor, define USL / LSL / target / operating window (V3+ once data-model supports it; see Data Model Gaps)
5. **Inspect gaps** — every step's vertical read shows what's complete and what's missing
6. **Decide on each gap** — ignore (CTQ doesn't matter), collect data (measurement plan), or remove from CTQ list

Gap categories made visible (with current `detectGaps()` implementation):

- CTQ declared in Process Flow with no factor in Operations → "no data for this CTQ"
- Factor in Operations with no CTQ binding → "data column not yet linked to process knowledge"
- CTS at ocean with no Cpk target → "target Cpk not set" (already detected)

Gap categories that need data-model additions before they can render:

- Factor in Operations with no spec → needs per-factor spec data model
- Step with no designed flow rate → needs per-step rate data model

### Process Hub current-state (read-time, cadence-state)

Primary user job: **cadence review — see what's drifting; choose response path.**

The Process Flow band is the same shape as in FRAME (the process is fixed; it doesn't redesign itself). The Operations band shifts to read-mode against the latest cadence-state data:

- Factor chips show **state badge** (green/amber/red vs. spec compliance) — initially aggregated from existing `CurrentProcessState` items; per-factor actuals later
- Capability mini-i-charts show Cp/Cpk **over recent snapshots** — phased; not in V1
- Recent events / Signal Cards / gemba notes from last cadence period
- Trust indicator per factor (suppress conclusions when trust is low) — phased
- One-click affordance per anomaly to start an investigation, mark as quick action, enter sustainment review, or hand off (response-path routing)

Response-path chip placement: per-anomaly affordance docked to the anomalous factor chip; summary roll-up in the Outcome band footer ("3 quick actions / 2 focused investigations / 1 charter open").

### Multi-hub view (portfolio scope)

Primary user job: **cross-process pattern scan without false aggregation.**

The layered shape persists, but heavily summarized:

- Outcome band: portfolio rollup (counts, status mix)
- Process Flow band: collapsed to one row per hub (hub name, overall state)
- Operations band: per-hub state badge (green/amber/red); click to expand to that hub's full Hub current-state

**Aggregation rule** (ties to A3 of the critique on Cp/Cpk additivity): the multi-hub view never sums Cp/Cpk across hubs. It shows distributions or per-hub badges. The "no false aggregation" rule is structural: the multi-hub Operations band has no "summed Cpk" or "average capability" widget by design.

## Reconciliation with existing `ProcessStateLens`

Code today defines `ProcessStateLens = 'outcome' | 'flow' | 'conversion' | 'measurement' | 'sustainment'` in `packages/core/src/processState.ts:10`. The new 3-band model is `Outcome | Process Flow | Operations`. Mapping:

| `ProcessStateLens` (existing 5-lens) | 3-band placement                                                  | Notes                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outcome`                            | **Outcome band**                                                  | Direct map                                                                                                                                                                                                                                                                         |
| `flow`                               | **Process Flow band**                                             | Direct map                                                                                                                                                                                                                                                                         |
| `conversion`                         | **Process Flow band** (designed) AND **Operations band** (actual) | "Conversion" = how the process transforms entities. Designed conversion (recipe spec) is Process Flow; actual conversion (measured at CTQ points) is Operations. Conceptually wants splitting; in V1 keep `conversion` items at Operations as "what's happening in the conversion" |
| `measurement`                        | **Operations band**                                               | Direct map                                                                                                                                                                                                                                                                         |
| `sustainment`                        | **Outcome band**                                                  | "Did the improvement hold?" is an outcome question over time                                                                                                                                                                                                                       |

**V1 strategy: don't rename the lens enum.** The 3-band visual is a _render-time_ projection over the 5-lens taxonomy. Each lens item is positioned in the correct band by the renderer. This keeps `ProcessStateLens`, `lensCounts`, and existing Process Hub aggregation working unchanged.

**V2+ option: converge `conversion` into `operations`.** Once the 3-band model is settled and `conversion` items can all be re-classified as `measurement`-or-similar, deprecate `conversion` and rename the enum to align. Not in V1 scope.

## Six user needs the Operations band serves

| #   | Need                                                      | Render                                                                              | Phase                                             |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | "Is the process running OK right now?"                    | Traffic-light per factor based on spec compliance                                   | V2 (needs spec data)                              |
| 2   | "Where did this anomaly come from?" (Watson's trace-back) | Click-to-trace; highlight upstream factors and what changed when                    | V4 (needs snapshot history)                       |
| 3   | "Can I trust this Cp/Cpk?"                                | Trust indicator: sample size, MSA, n<30 warning. Suppress conclusions on low trust. | V4 (needs trust data)                             |
| 4   | "How is capability evolving?"                             | Cp/Cpk-over-batches mini-i-chart per step                                           | V4 (needs Cp/Cpk-over-time records)               |
| 5   | "Should I act now or investigate?"                        | Response-path chip suggestions per anomaly                                          | V2 (anomaly = current `CurrentProcessState` item) |
| 6   | "Where in the process is this?"                           | Vertical alignment from Operations factor chip up to Process Flow step              | V1 (the layout itself)                            |

## Evidence scope (load-bearing for Process Hub current-state)

The Operations band in Hub current-state aggregates evidence across investigations on the same process. The data model is **tiered by artifact type and status**:

| Artifact                                                    | Scope                      | Rationale                                                                 |
| ----------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Hypotheses, gates, contribution trees, problem statement    | **Investigation only**     | These are the structure of one reasoning attempt — not reusable as-is     |
| Findings at status `observed` / `investigating`             | **Investigation only**     | Rough observations from one drill-down; may not survive scrutiny          |
| Findings at status `analyzed` and above                     | **Promoted to process**    | Status `analyzed` means "verified contribution to understanding"          |
| Gemba notes, Signal Cards, MSA records, recipe observations | **Process from inception** | Observations about the actual process, not interpretations of an analysis |

**Hub Operations band aggregation rule:**

- Always show: gemba notes, Signal Cards, MSA records, recipe observations (process-scoped from inception)
- Show: findings with status ≥ `analyzed` from any investigation on this hub
- Hide: investigation-scoped artifacts (hypotheses, in-progress findings, one project's gates)

**Implementation approach (no `hubId` field needed initially):** derive hub membership from existing project metadata. The Hub view already has access to its member projects' state; aggregating findings at status ≥ `analyzed` across them is a `selectProcessRelevantFindings(hubId)` selector that walks the Hub's project list and filters per status. A `hubId` reference on findings can be added later if perf or query semantics demand it; not required for V1.

## Vocabulary changes

Per [VariScout Product Vision](2026-05-03-variscout-vision-design.md) §2 — methodology spine (supersedes the 2026-04-27 operating-model spec which sanctioned the internal/external split):

| Old (UI)  | New (UI)   | Code                                                                                                                                                                                              |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tributary | **Factor** | `tributary` stays internal in V1 — rename to `factor` is a separate follow-up PR that touches ADR-070, Wall spec, processMap types. UI strings change first; code rename is sequenced separately. |

## Data Model Gaps

Current `ProcessMap` has: `nodes`, `tributaries` (factors), `ctqColumn`, `ctsColumn`, `subgroupAxes`, `hunches`. The full vision needs the following additions, none of which exist today:

| Gap                                                                                 | Needed for                                                    | Phase to add |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------ |
| Per-factor spec / operating window (USL/LSL/target/range per tributary)             | Operations band specs; gap detection of "factor without spec" | V3           |
| Per-step designed flow rate / wait / takt                                           | Process Flow band rate labels and bottleneck detection        | V3           |
| Per-step CTQ list (separate from `ctqColumn` for the whole process)                 | Multiple CTQs per step, gap detection of "CTQ without factor" | V3           |
| Snapshot-backed actuals (factor latest values per snapshot)                         | Operations band actuals and Cp/Cpk per batch                  | V4           |
| Cp/Cpk-over-batches records by step / factor                                        | Capability mini-i-chart                                       | V4           |
| Process-scoped gemba/MSA/recipe observations (separate from investigation findings) | Operations band non-investigation evidence                    | V4           |
| Factor-to-CurrentProcessState item binding                                          | Linking state items to specific factors at specific steps     | V2           |

V1 and V2 use only what's already in `ProcessMap` plus the existing `CurrentProcessState` items. V3 adds the minimum data model for designed operating windows and per-step rates. V4 adds snapshot-backed actuals and capability-over-time. V5 is multi-hub.

## Phased Implementation Direction

Each phase ships independently. V1 is the minimum slice that delivers user value (visible bands without new data model).

### V1 — Layer existing FRAME map into three visual bands

- Wrap the existing `ProcessMapBase` river-SIPOC in a Process Flow band.
- Add an Outcome band above (initially showing Cpk target if set, plus simple metadata from `CurrentProcessState` outcome lens).
- Add an Operations band below (initially showing existing `tributaries` as factor chips, with cross-band connector lines to their parent step).
- No new data model. Read/write only what `ProcessMap` already supports.
- Renames "tributary" → "factor" in UI strings only; code stays `tributary`.
- Outcome label: **"Outcome"**; middle: **"Process Flow"**; bottom: **"Operations"**.

### V2 — Read-only Process Hub current-state overlay

- Add `<LayeredProcessView mode="snapshot">` rendering in `ProcessHubCurrentStatePanel.tsx`.
- Operations band populates from existing `CurrentProcessState` items grouped by lens, projected into the 3-band model (per the reconciliation table above).
- Factor chips show state badges from the parent state items (no per-factor actuals yet).
- Response-path chip placement per anomaly: docked to the anomalous factor chip; summary in Outcome band footer.

### V3 — Minimal data model for factor operating windows / specs

- Add `factor.targetRange?` (or equivalent) to `ProcessMap.tributaries[]`. Optional field; existing maps load unchanged.
- Add per-step CTQ list as `node.ctqs?: string[]` (factor IDs). Optional.
- Add `node.designedRate?` for designed flow rate at step level.
- Update `detectGaps()` to recognize the new fields and surface gap rows: "factor without spec", "step without designed rate", "step CTQ without factor binding".
- FRAME UI gains spec entry per factor and rate entry per step.

### V4 — Snapshot-backed actuals, trust, capability-state mini charts

- Wire existing snapshot system (`evidenceSources` for Agent Review Log; general path TBD) into Operations band.
- Per-factor latest actuals appear in factor chips.
- Cp/Cpk per snapshot is computed and recorded; the i-chart-over-batches becomes a mini sparkline in each step's Operations column.
- Trust indicator per factor (n<30 warning, MSA freshness).

### V5 — Multi-hub pattern scan

- Aggregate-mode rendering of the layered view at portfolio scope.
- Per-hub state badges; no Cp/Cpk aggregation (the no-false-aggregation rule).
- Cross-process pattern primitives: distribution comparison, hub-by-hub state matrix.

## Resolved design decisions (from brainstorm)

These were open questions during the brainstorm; all are now resolved. They land in the implementation phases as called out:

| #   | Decision                                                                                                                                                                                                                                                                                                                          | Phase                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | **Code rename `tributary` → `factor`** is a **separate cleanup PR before V3**. UI strings change in V1; code rename is sequenced as its own PR (touches ADR-070, Wall spec, ProcessMap types).                                                                                                                                    | between V1 and V3       |
| 2   | **Empty states**: all three bands always render; empty bands show inline placeholder text ("No outcome data yet" / "No factors mapped yet"). Layout stays consistent across full and empty states; first-time users see the three-level structure even before data.                                                               | V1                      |
| 3   | **Animation / motion on Process Flow band**: static by default. User toggle to enable subtle flow-direction dashes. `prefers-reduced-motion` overrides to always-static. Accessibility-first; methodologically meaningful when on.                                                                                                | V2+ (toggle is post-V1) |
| 4   | **Mode × level interaction (V1)**: existing modes drive band content; bands always visible. Each mode has a primary band of focus + supporting content in others. Bands are structural; modes select which content fills each band. (See Future Directions for Way 3.)                                                            | V1                      |
| 5   | **Capability mode in the layered context**: subsumed by decision 4 — Capability mode emphasizes Operations band's Cp/Cpk content (factor chips show Cp/Cpk badges; mini-i-chart of Cp/Cpk-over-batches becomes prominent). Outcome band shows Cpk vs target. Process Flow band shows step-level Cpk if data is available.         | V1 / V4                 |
| 6   | **Cross-investigation evidence flow UI**: click a finding chip → side sheet docks with read-only preview (finding context, source investigation reference, snapshot context). Side sheet has "open in project" button that nav-replaces to that investigation. Pattern: quick context without losing place; full nav when needed. | V2                      |

## Future directions

These are aspirational candidates for V3+ that require their own design exploration before commitment. They are _not_ part of this spec's scope but are recorded so the design vocabulary doesn't paint itself into a corner.

### Band × Lens grid (Way 3)

The Four Lenses (CHANGE / FLOW / FAILURE / VALUE — pedagogical labels per `mental-model-hierarchy.md`, not in code today) could be folded with the three bands into a 3 × 4 grid. Each cell = one analytical view. Current six modes become emergent shortcuts (named (band, lens) presets):

|                  | CHANGE (I-Chart)                               | FLOW (Boxplot)                                  | FAILURE (Pareto)                               | VALUE (Capability)    |
| ---------------- | ---------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- | --------------------- |
| **Outcome**      | Outcome trend over time                        | Outcome distribution                            | Top-N outcome failures                         | Outcome Cpk vs target |
| **Process Flow** | Throughput trend; Yamazumi-style time-trend    | Step-level variation; Performance multi-channel | Failure concentration per step                 | Step-level Cp/Cpk     |
| **Operations**   | Cp/Cpk-over-batches (=current Capability mode) | Factor variation (=current Standard mode)       | Defect rates per factor (=current Defect mode) | Cp/Cpk per factor     |

This would unify modes and lenses under one mental model. **Requires careful end-to-end thinking across use cases and user personas before commitment** — not a V1 add. Worth its own ADR + design spec when explored.

### Other candidates worth exploring later

- Animated flow on Process Flow band as a methodology teaching aid (only when motion is on)
- Mode-as-contextual-suggestion (Way 2 from the brainstorm) if Way 1 feels too disconnected after V1 lands
- Smart band-emphasis based on entry path (Routine Check defaults to Outcome focus; Problem to Solve defaults to Operations focus)

## Out of scope

Explicitly not in this spec, deferred to follow-up specs:

- Investigation Wall layered-or-not decision (Wall keeps current structure)
- Real-time / live presence on the Hub Operations band — VariScout is not live monitoring
- Detailed FRAME drag/drop interaction model (drop targets, error states, undo)
- Mobile / responsive collapse implementation
- CoScout coaching prompt updates for level-aware guidance (touches ADR-068)
- `tributary` → `factor` code rename (separate PR; touches ADR-070, Wall spec, ProcessMap types)
- Renaming `ProcessStateLens` to align with 3-band model (V2+ migration)

## References

- [VariScout Product Vision](2026-05-03-variscout-vision-design.md) — supersedes the 2026-04-27 operating-model + roadmap specs; §2 holds the three-level methodology this design renders, §3 holds the canvas commitments that supersede this V1 design's surface choices
- [FRAME Workspace](2026-04-18-frame-process-map-design.md) and [ADR-070](../../07-decisions/adr-070-frame-workspace.md) — predecessor; the river-SIPOC stays inside Process Flow band; existing `ProcessMap` / `ProcessMapBase` / `FrameView` / `detectGaps` / `inferMode` / subgroup axes are reused
- [Investigation Wall](2026-04-19-investigation-wall-design.md) — separate paradigm (hypothesis-centric), out of scope here
- [EDA Mental Model](../../01-vision/eda-mental-model.md) — Y/X/x three-level structure that the bands generalize
- [Methodology](../../01-vision/methodology.md) — "Process Learning Levels" section maps Y/X/x to System/Flow/Local-mechanism; this design renames to Outcome/Process Flow/Operations
- `packages/core/src/processState.ts` — existing `ProcessStateLens` enum reconciled in this spec
- Devil's-advocate critique at `~/.claude/plans/i-would-need-to-drifting-hummingbird.md` — input artifact that drove this brainstorm; full transcript-vs-spec drift memo at Section G

## Implementation plan

V1 implementation plan: [`2026-04-27-layered-process-view-v1.md`](../plans/2026-04-27-layered-process-view-v1.md) — 11 tasks covering the new `<LayeredProcessView>` component, FRAME app-wrapper swaps in PWA + Azure, end-to-end verification, and documentation updates (ADR-070 amendment, methodology.md, mental-model-hierarchy.md, llms.txt).
