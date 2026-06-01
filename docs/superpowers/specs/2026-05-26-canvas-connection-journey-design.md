---
tier: living
purpose: design
title: 'Canvas Connection Journey — Process tab Edit mode (Spec 2 of Framing Layer V2)'
audience: human
category: design-spec
status: delivered
last-reviewed: 2026-05-26
layer: spec
related:
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-26-framing-layer-v2-master-plan.md
  - docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/03-features/analysis/probability-plot.md
  - docs/03-features/workflows/four-lenses-workflow.md
implements:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/ia-nav-model.md
---

# Canvas Connection Journey

> **Draft · 2026-05-26.** Completes the deferred Spec 2 work from the archived Framing Layer Spec (slices 1–3 shipped; this defines Spec 2 — the canvas-connection authoring layer). Aligned with wedge V1 (ADR-082). Companion plan: [Framing Layer V2 master plan](2026-05-26-framing-layer-v2-master-plan.md).

## §1 · Context

The Framing Layer Spec (archived 2026-05-26 under wedge V1) committed to a five-spec decomposition. Slices 1–3 shipped: first-time Hub creation (Mode B Stages 1–3), reopen flows, paste-driven match-summary card, multi-source ingestion via shared keys, Stage 5 modal. Specs 2–5 remained as planning placeholders without authored content.

**Spec 2's scope: the Process tab's Edit mode** — the canvas-based authoring experience where a user pastes data and connects columns to a process model. This pairs with the existing State mode (L1 outcome view / L2 process flow / L3 focal step) shipped via the 8f Canvas Viewport Architecture (`useCanvasViewportStore`, PRs #160–#168). Together the two modes form the Process tab.

This spec was authored 2026-05-26 in a customer-hat brainstorm session that simultaneously surfaced five vision-violation findings about the journey docs themselves (logged separately in `docs/ephemeral/investigations.md`) and reached the design choices captured below. Path B from the wedge spec §3.0 — _"paste data, then promote to Project"_ — is the primary onramp; this spec describes the canvas-onboarding experience that bridges paste to Analyze.

The session also surfaced **six wedge-spec amendments** required to align the wedge spec body with the design choices here. See §8.

### What this spec covers

- The canvas-as-primary onboarding journey from paste to ready-to-analyze
- Column chip model + parsing UX + per-chip context menu
- Three canvas zones mapped to user cognitive tasks
- Step-bound vs global model for outcomes and factors
- Workflow affordances (toolbar: only `+ Capture step timings`)
- Inflection-point binning in the Probability Plot lens
- Promote-to-Project (Charter ceremony) with multiple entry points
- Exit to Explore with Y-soft-gate + smart routing
- How Edit-mode configurations feed L1/L2/L3 State-mode rendering
- ACL simplification to 2 tiers
- Cross-doc impacts (amendments + code touches)

### What this spec does NOT cover

- L1/L2/L3 State-mode rendering — already shipped (8f Canvas Viewport Architecture)
- Manual canvas authoring beyond column-to-step connection (sub-step grouping, true branching topology) — V2
- Sub-step decomposition (sequential children inside one logical step) — V2
- Per-resource timing (separate start/end columns per parallel machine) — V2
- Step cards + drill-down floating overlays + mode-lens reskinning — Spec 3 (task #11)
- Canvas overlays for active Analyze entries + Wall sync — Spec 4
- IndexedDB persistence schema — Spec 5
- Vocabulary positioning (Explore / Analyze / Control naming) — separate session

---

## §2 · Foundation

Four locked design principles govern this spec. Each one was reached during the 2026-05-26 brainstorm session in response to a specific drift that the earlier wedge / Framing Layer thinking had: forcing shape commitment up front, treating canvas as a wizard, scattering operations across multiple modals, and adding artificial permission gates.

### §2.1 · Canvas is the primary surface; shape is invisible

The user never picks a data shape ("multi-step process flow" vs "product quality" vs "defect log"). They never see a shape-picker, a shape-selector, or a "we detected: multi-step process flow" confirmation modal. Shape categories exist as an internal mental model for the strategy layer downstream (`resolveMode()` in `packages/core/src/analysisStrategy.ts`), never imposed on the user.

Instead, **shape emerges from where the user connects columns**:

- Drop a categorical column with 3–30 distinct values into the process-structure zone → step model materializes from those distinct values
- Drop a time column into process structure → time axis emerges
- Drop nothing in process structure → no process model, single-station product-quality without anyone needing to say so

This inverts the Framing Layer Spec §5.3.3 graceful-degradation framing where "canvas paints with all columns unclassified" was the fallback path. Under this spec, that IS the front door.

### §2.2 · Three user cognitive tasks become canvas sections

A user pasting factory data asks themselves three questions. These three questions become the literal canvas sections:

| User question                  | Canvas section                 |
| ------------------------------ | ------------------------------ |
| "What do I have?"              | Palette (left side)            |
| "What do I want to analyze?"   | Outcomes + Factors zones       |
| "How does it fit the process?" | Process structure (step boxes) |

The user's own words become the section labels in the UI. This is the simplest reasonable structuring of the cognitive load; alternative orderings tested in the brainstorm (data-shape-first, outcome-first wizard) created artificial decisions that the canvas-direct approach avoids.

### §2.3 · State / Edit mode split

The Process tab has two modes already named by wedge spec §3.3.1:

- **State mode** (read-mostly, default) — L1 / L2 / L3 pan-zoom views; shipped via 8f Canvas Viewport Architecture
- **Edit mode** — structure authoring; this is Spec 2's scope

Spec 2 is the **unbuilt other half** of an already-designed pattern. Edit mode configures what State mode then renders. Most existing surface (the canvas viewport, the L1/L2/L3 navigation, the step cards) already exists; this spec defines the authoring surface that populates them.

Entry: `Edit map` affordance in the Process tab header (per wedge spec §3.3.1) or auto-default to Edit mode when the Hub is brand-new with no content yet. Exit: `Done` button returns to State mode (also already named).

### §2.4 · Design principle — _"Reuse existing surfaces over inventing new ones"_

Applied four times during the brainstorm session:

1. The wedge spec's staged Mode B (Stages 1, 3, 5) folds into canvas affordances — not separate wizards. Goal narrative is a sidebar drawer; specs entry is a popover on the outcome chip; Analyze entry is the existing Stage 5 modal triggered on demand.
2. Parsing correction folds into chip badges + per-chip override popover — not a separate "data cleaning" screen.
3. Shape detection becomes invisible emergence from connections — not a shape-picker UI.
4. Bin / time-as-factors / calculated column move from canvas toolbar workflows to per-chip context menu items reachable from both palette AND Explore tab. Same affordance, two access points.

Every application of this principle made the design simpler. Promote it explicitly so future contributors apply it reflexively: when proposing a new UI surface, first check if an existing surface can serve.

---

## §3 · Primitives

The pieces the canvas composes from. Each primitive has clear identity, predictable behavior, and a defined surface.

### §3.1 · Column chips

Each column from the parsed dataset appears as a chip in the palette. The chip displays:

- **Drag handle** (`⋮⋮`) — chip is draggable to any zone or onto a step box
- **Parsing status badge** — `✓` (silent green) for high-confidence parse; `⚠` amber for ambiguous; `✗` red for parse failure
- **Column name** — the dataset's column header
- **Interpretation** — auto-detected type + key facts (e.g., `numeric · EU decimal`, `DD/MM/YYYY`, `categorical · 4 levels`, `id · 432 unique`)
- **Sparkline** for numeric columns (mini histogram)
- **Override ▾** — opens parsing detail popover on demand

Chip state changes when dropped:

- **Dropped** (faded background) — chip is in use somewhere on the canvas
- **Ghost-suggested** (dashed cyan border) — system suggests a role with a confidence pill (`factor?`, `outcome?`)
- **Default** (white background, normal border) — unused, available

#### §3.1.1 · Parsing UX

Auto-detect aggressively. Show the detected interpretation directly on the chip — the interpretation IS the badge. Override only when the user explicitly wants to.

**Detection rules** (deterministic, no AI required per Framing Layer §5.3.3 _"deterministic learning"_):

- Numeric with consistent `,` + 1–2 digits → EU decimal
- Numeric with thousands `,` + decimal `.` → US format
- Dates: ISO first (`YYYY-MM-DD`, unambiguous). Then scan for disambiguating values (position > 12). Genuinely-ambiguous case picks a sensible default and shows the parsed result clearly.
- Numeric with prefix/suffix (`$`, `%`, `(45)`) → strip + parse the inner number
- Leading zeros + fixed-width + sequential → ID column

**Override popover** opens from chip's `▾`:

- Shows 3 sample values transformed by current interpretation (e.g., `182,5 → 182.5`)
- Confidence percentage (`92% confidence in European decimal`)
- Alternative interpretations with parse-success counts (`Numeric · thousands separator — 432 / 432 parse ✓`)
- "Apply to other similar columns →" affordance for batch fixes
- Hub remembers the user's choice — future pastes with this column name bias higher (Framing Layer Spec §5.3.3 already commits to this)

**⚠ amber chip** appears only when:

- Mixed formats in the same column (e.g., `15 min`, `0:15`, `quarter hour`)
- Parse rate < 70%
- No disambiguating values for an ambiguous date column AND user has not yet seen / accepted the default

**Aggregate banner** at top of palette: _"⚠ 3 columns may be parsed wrong — review →"_ appears when ≥ 3 columns have `⚠` status. Clicking opens a focused panel for batch review. Optional surface; per-chip popover is the canonical entry point.

#### §3.1.2 · Per-chip context menu (⋮)

Each chip has a `⋮` icon that opens a contextual menu. Items appear based on the column's type:

**Numeric column:**

- 📊 Use as continuous factor
- 🧮 Bin into categorical… _(opens binning UX in Explore tab — see §3.6)_
- 🔍 View distribution in Explore →
- 🧪 Calculate from this column…
- ⚙ Parsing & format
- ✎ Rename column…

**Time column:**

- 📅 Use as timestamp
- ⏰ Use as time factors _(week / day-of-week / hour / month — opens workflow modal)_
- 🔍 View distribution in Explore →
- ⚙ Parsing & format
- ✎ Rename column…

**Categorical column:**

- 🎯 Use as factor
- 🗺 Use as process step _(only enabled if 3–30 distinct values)_
- 🔍 View frequencies in Explore →
- 🪡 Combine levels…
- ⚙ Parsing & format
- ✎ Rename column…

**ID column:**

- 🔑 Use as scope identifier
- 📊 View uniqueness in Explore →
- ⚙ Parsing & format
- ✎ Rename column…

The "View ... in Explore →" item is the bridge: opens the column in the Explore tab where the user can see the data before deciding to bin, decompose, or transform. The same context menu is available from the chip's representation in Explore.

### §3.2 · Outcome chips + specs popover

Outcomes (Y) appear in the global outcome zone as yellow chips. Each chip carries:

- ✨ marker if derived (calculated column, time decomposition, lead time, bin)
- Column name
- Direction indicator (`higher↑` / `lower↓` / `nominal=target`)
- Spec-state pills (`target: 95`, `LSL: 90`, `USL: —`, `Cpk: 1.33`)
- `⚙` to open the specs popover

#### §3.2.1 · Specs popover

Opens from `⚙` on any outcome chip. Per-outcome configuration:

- **Direction** — derived from characteristic type (smaller-is-better, larger-is-better, nominal-is-best)
- **Target** — numeric value; system suggests dataset mean as a starting point only (per Framing Layer §3.3 — VariScout never derives spec limits from σ)
- **LSL** — disabled when smaller-is-better
- **USL** — disabled when larger-is-better
- **Cpk target** — default 1.33, customer-overridable

LSL/USL placeholders read `from customer spec` — explicit reminder that specs are customer-driven, not data-derived.

#### §3.2.2 · Multi-outcome

A Hub can have multiple outcomes simultaneously (per Framing Layer §3.2). The outcome zone wraps cards horizontally. No formal "primary" concept — left-most position is a quiet UX signal ("show this first") but doesn't lock anything.

ADR-073's _"no statistical roll-up across heterogeneous units"_ applies: outcomes are siblings, never aggregated together. Each outcome owns its own analysis surface; no "overall improvement score."

### §3.3 · Step boxes (process model)

Step boxes appear in the process-structure zone, built automatically from a categorical column dropped there. Each box displays:

- Step name (the categorical value)
- Timing badge if step timing configured (`⏱ ~ 42 min`)
- Resource indicator if a step-bound categorical of low cardinality is bound (`× 2 reactors via Reactor_id`)
- Internal Y section (step-bound outcomes)
- Internal X section (step-bound factors)

Steps are connected by simple arrows in V1. True branching topology and sub-step decomposition are V2.

#### §3.3.1 · Step-bound vs global symmetry

Outcomes and factors both follow the same drop pattern:

- **Drop in global outcome zone** → whole-process Y (feeds L1 view)
- **Drop on a specific step** → step-bound Y (feeds L3 view of that step)
- **Drop in global factors zone** → global X (applies across all steps)
- **Drop on a specific step** → step-bound X (applies only at that step's analysis)

One drag gesture, four positions, two roles. The user learns it once and predicts everything.

Step-bound chips don't have to be "resources" — any column specific to that step works the same way. The "× 2 reactors" indicator surfaces only when the categorical's name pattern + cardinality suggest a parallel-resource semantic (low cardinality, `_id` suffix, descriptive level names).

#### §3.3.2 · Step timings

Step timings come from one of two sources:

- **Paired start + end columns** (`Prep_start` + `Prep_end`) — detected automatically by column-name regex, confirmed by user in the workflow modal (§4.3)
- **Single duration column** (`Cycle_time`) — user assigns to a step in the same modal

A step's timing source is mutually exclusive: paired OR single duration, not both. Steps without timing are fine — process model still renders.

### §3.4 · Derived chips

When the user configures step timings, calculated columns, or time decomposition, derived chips appear in the palette under a **DERIVED FROM ...** section:

- **Lead_time** (auto, when ≥ 1 step has paired start+end) = max(end across steps) − min(start across steps)
- **Total_work_time** (auto) = sum of step durations
- **Wait_time** (auto) = Lead_time − Total_work_time
- **Calculated columns** (manual via the calc workflow) — e.g., `Yield_pct = (GradeA_kg + GradeB_kg) / Input_kg × 100`
- **Time-derived factors** (via the time-as-factors workflow) — e.g., `Date.week`, `Date.day-of-week`, `Date.hour`
- **Bins** (via the binning UX in Explore tab) — e.g., `Reactor_temp_bin` with levels Low / Med / High

Derived chips:

- Visually distinct (green tint + ✨ marker)
- Usable anywhere a raw column goes (outcome, factor, step-bound)
- Persisted in the `DocumentSnapshot`; survive Azure reload and `.vrs` export/import
- Recomputable — edit the underlying formula or settings
- Chainable — a derived column can feed another derivation

**Default homes for derived chips:**

- Outcome distributions (Y) → L1 by default
- Flow metrics (durations, sequence, throughput, Lead_time) → **L2 by default** — these are flow properties of the process, not outcome distributions
- Bins + time-factors → typically used as factors

Any derived chip can be promoted to L1 by dropping it in the global outcome zone (treats it as a Y for Cpk + drift analysis). The level is a property of _how the user is using it_, not the chip itself.

### §3.5 · Inflection-point binning (Probability Plot)

Binning lives in the **Probability Plot lens of the Explore tab**, not in the canvas onboarding. Rationale: the user should see the distribution structure before deciding cut points; binning blindly via "3 equal-width bins" is methodologically weaker than binning at natural breaks.

When the user is viewing a numeric column's probability plot in Explore:

- System runs inflection-point detection on the data (KDE valley detection, change-point detection on sorted data, or mixture-model fitting — all deterministic, see §3.5.1)
- Detected breaks render as cyan-dashed vertical guide lines on the plot
- Side panel offers: _"3 populations detected — create binned factor?"_
- User can:
  - Accept → bin column created with the proposed cuts
  - **Add manual cuts** (purple guide lines) — click empty x-position to add (system shows a ghost preview at the hover position)
  - **Remove auto-detected cuts** — `×` on the guide's label pill
  - **Drag any line** to adjust position
- Bin preview list updates live as cuts change

Each cut tracks its source:

- `auto` (KDE valley, change-point) — cyan
- `manual` (user-added, often domain knowledge like SOP thresholds) — purple

Two exits from the side panel:

- _Create binned factor →_ — creates `<columnname>_bin` column with the proposed cuts
- _Dismiss · keep continuous_ — no change

**Histogram does NOT also do this.** One feature, one home; binning is a probability-plot affordance only. Histogram stays focused on distribution shape diagnosis.

#### §3.5.1 · Detection methods (engineering notes)

Recommended: **KDE valley detection** (cheap, interpretable, well-behaved for unimodal-to-trimodal cases) OR **change-point detection on sorted data** (PELT or CUSUM-style, cheap). Mixture model fitting (GMM with AIC/BIC selection) is an option for overlapping populations but more compute. Probability-plot deviation analysis (find points where a single straight-line fit deviates significantly) is the most aligned with the visual diagnosis the user is doing.

System shows confidence: _"3 populations detected (92% confidence)"_. If confidence is genuinely low: _"Maybe 2 or 3 populations — drag guides to confirm."_

### §3.6 · Issue Statement vs Problem Statement

The code distinguishes these (`packages/core/src/findings/types.ts:872` for `issueStatement`; `packages/core/src/findings/problemStatement.ts` for `buildProblemStatement`). The wedge spec used "problem statement" loosely; this spec uses the code's vocabulary throughout.

**Issue Statement** (`AnalysisBrief.issueStatement`, ≤ 500 chars, free-text):

- Captured at Analyze entry (Stage 5 modal) OR at Charter ceremony
- Episodic — _"what's happening, what just changed"_
- Example: _"Reactor B yields 3% lower than Reactor A — investigate root contribution and stabilize."_

**Problem Statement** (`buildProblemStatement(input)` + `liveStatement` + `approvedProblemStatementText`):

- Auto-synthesized using Watson's 3 Questions framework
- Structured format: _"{direction verb} {outcome} ({Cpk current → target}) driven by {causes}."_
- Has maturity stages: `'partial' | 'actionable' | 'with-causes'` (per `buildAIContext.ts:110`)
- Emerges in the Approach stage as hypotheses validate
- Lead approves the live draft → becomes the immutable approved statement → goes into Report

**Implication for the Charter modal (§4.4):** the required field is **Issue Statement** (not "Problem Statement"). The auto-synthesized Problem Statement emerges downstream. This requires a wedge spec §3.2 amendment (see §8).

---

## §4 · Flows

The user-facing journeys through the canvas onboarding.

### §4.1 · First paint

User pastes data (or opens sample). Within 1–2 seconds:

1. Data is parsed (`parseText`, `detectColumns` from `@variscout/core/parser`)
2. Per-column type detection runs
3. Per-column parsing checks run (decimal format, date format, mass-balance detection)
4. Suggested roles are computed (which columns look like outcomes, factors, process structure)
5. Canvas paints:
   - **Palette** populates with column chips grouped by type (`Numeric · 5`, `Categorical · 4`, `Time / ID · 6`)
   - **Outcome zone** empty with "Drag a column here" hint
   - **Factors zone** empty with "Drag columns that vary" hint
   - **Process zone** empty with "Drag a column that identifies step / time / sequence" hint
   - **Toolbar** shows `+ Capture step timings`, `+ Goal narrative`, `+ Issue / question`, `→ Explore` (disabled until Y is dropped)
6. Contextual hints surface at top of palette where relevant:
   - _"💡 6 time columns detected. Use time as factors →"_
   - _"💡 Batch data detected. Input/output mass columns found — calculate yield ratios?"_

The high-confidence suggested role appears as a ghost-suggested chip border with a small hint pill (`factor?`, `outcome?`, `process?`). Never an assertion; always a question the user can ignore.

**Hub creation note.** First paint of a brand-new Hub puts the canvas in Edit mode by default (no content to view). Subsequent reopens default to State mode (see §5.1).

### §4.2 · Connection journey

The user connects columns to canvas zones (or step boxes within the process model) by dragging chips. Each drop:

- Updates the chip's state (faded "dropped" appearance in palette)
- Adds the chip to the destination zone or step
- Triggers downstream computation:
  - Dropping a categorical with 3–30 distinct values into process structure → emergent step boxes appear
  - Dropping a paired start/end time pair into a step → step's timing badge appears + Lead_time chip appears in palette under DERIVED FROM TIMINGS
  - Dropping in outcome zone → outcome chip with default specs (mean as suggested target, empty LSL/USL until user fills via ⚙)

**Suggestion acceptance gestures:**

- Click the ghost-suggested chip's hint pill to accept the suggested role (chip drops into the suggested zone automatically)
- Or just drag the chip somewhere else — system honors the user's call

**Removal:** drag chip back to palette OR click `×` on its dropped representation in a zone / step.

**Re-binding:** drag a chip from one position (e.g., global factors) to a different one (e.g., onto a step → step-bound). System updates the binding cleanly.

### §4.3 · Workflow affordances (canvas toolbar)

Only ONE workflow lives in the canvas toolbar: **`+ Capture step timings`**.

Other operations that were considered for the toolbar — bin, time-as-factors, calculated column, join — are column-level operations accessible via per-chip context menu (§3.1.2). They appear in the Explore tab context as well (same menu items, same access).

#### §4.3.1 · "+ Capture step timings" modal

Opens from the canvas toolbar. Two layout tabs:

- **By step** (default) — table with one row per step, columns: Start ▾ / End ▾ / Duration preview
- **By column** — table of time columns; user assigns each to a step or duration role

Pre-filled from detection: regex on column names finds pairs like `Prep_start` + `Prep_end` and pre-fills the Prep step's start/end pickers (cyan-dot "auto-detected" indicators).

Empty steps are fine. Footer reads _"Save · 2 steps timed →"_ — reflects what's actually configured, not "all 5 are required."

Alternative path for duration columns: a section below the per-step table lets the user assign a single duration column (e.g., `Cycle_time`) to a step. Mutually exclusive with paired start/end.

#### §4.3.2 · Calculated column workflow (per-chip)

Reached from any numeric chip's `⋮` menu → "🧪 Calculate from this column…" — OR from the system hint _"💡 Batch data detected. Calculate yield ratios?"_

Modal:

- **Templates** surface contextually based on detection:
  - Batch detection → ratio templates (Total yield %, Grade-A yield %, Scrap rate %, Loss %)
  - DPMO for defect data
  - Throughput when timings exist
  - Differences for paired measurements
  - Conditional logic for binary outcomes
- **Formula builder** — visual: drag chips into numerator / denominator slots, pick operators, factor multipliers
- **Live preview** — shows computed values from real rows (`Batch 0317: (85 + 10) / 100 × 100 = 95.0%`)
- **Parse-success counts** — `432 / 432 batches compute · 0 rows with division-by-zero`
- **Name field** — auto-suggests based on template (e.g., `Yield_pct`)

Result: new derived chip appears in palette under DERIVED FROM FORMULA. Original columns unchanged.

#### §4.3.3 · "Use time as factors" workflow (per-chip)

Reached from any time chip's `⋮` menu → "⏰ Use as time factors…" — OR from the system hint _"💡 N time columns detected. Use time as factors →"_

Two-step modal:

1. **Pick a time column** (radio buttons across the detected time columns)
2. **Pick dimensions** (checkbox group): Week · Day of week · Hour · Month · Year · Quarter

Result: selected derived dimensions appear in palette as chips (e.g., `Date.week`, `Date.day-of-week`). Each is independently draggable as a factor.

### §4.4 · Promote to Project (Charter ceremony)

The bridge from Mode 1 (free analysis) to Mode 2 (formal project). Reachable from multiple entry points; each pre-fills different inherited context.

#### §4.4.1 · Entry points

| Entry point             | Inherited context                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Home / Project tab      | Nothing — empty start (rare; most projects emerge from existing analysis)                |
| Explore tab             | Hub state · outcomes / factors set in canvas · current filter scope · Findings           |
| Analyze tab             | Hub state + active Hypotheses on the Wall + their Findings + evidence                    |
| Canvas L3 focal step    | Hub state + focal step + step-bound outcomes/factors + step-scoped findings              |
| Canvas L2 / Project tab | Whole-Hub state (functionally same as Explore entry; routes via Explore for consistency) |

#### §4.4.2 · The modal

Header: `📋 Promote to Project · Charter ceremony` — subtitle reflects entry point.

Inherited-context block (top of modal): displays what got pre-filled from the user's current state. For Canvas L3 entry: Hub name, focal step name + timing + resource indicator, outcomes list, factors list, findings list, hypotheses list (or "none yet").

Form fields:

| Field           | Required | Source                                              |
| --------------- | -------- | --------------------------------------------------- |
| Issue statement | yes      | auto-suggested from inherited Findings; ≤ 500 chars |
| Title           | no       | auto-extracted from issue statement first sentence  |
| Members         | no       | Lead = current user; invite others (Azure only)     |
| Refined goal    | no       | placeholder shows inherited outcome targets         |

Footer: `Cancel` · `Save as draft` · `Create Project →` (primary).

Behavior on submit:

- Creates an `ImprovementProject` with `status: 'draft'` (Charter stage)
- `metadata.title` set; `metadata.members` set (Lead = current user; invited members if any)
- `sections.investigationLineage.findingIds` populated from inherited Findings (if any)
- `sections.investigationLineage.hypothesisIds` populated from inherited Hypotheses (if any from Analyze entry)
- `goal.outcomeGoal` set from current Hub outcome
- `sections.background.snapshotText` captures the capability summary at this moment
- Navigates to the Project tab (or to L3 focal step inside the new IP if entered from Canvas L3)

#### §4.4.3 · What the modal explicitly does NOT do

- No "pick a Hub" step — Charter always ties to current Hub (1:1 per wedge V1 intent)
- No re-collection of outcome / factor specs — those come from the Hub
- No "is this hypothesis validated?" gate — Charter is the formalization gesture, not the reward for proven hypotheses (retires the legacy "promoted from validated hypothesis" framing — see §8 amendment item 3)
- No tier / payment check — single SKU per ADR-082

### §4.5 · Exit "→ Explore"

The primary exit from the canvas-onboarding journey.

**Soft gate on Y.** The `→ Explore` button enables as soon as one outcome chip is dropped. Until then it's visually quieter with a small hint: _"Set an outcome to unlock Explore."_ No hard gates.

**Smart destination routing.** Same button label; destination's content adapts to what's configured:

| State                 | Explore tab opens to                                          |
| --------------------- | ------------------------------------------------------------- |
| Y only                | I-Chart of Y (CHANGE lens — stability over time)              |
| Y + 1 factor          | I-Chart + Boxplot side-by-side                                |
| Y + 2+ factors        | I-Chart + Boxplot with factor picker (default = first)        |
| Y + process structure | Step-aware view (per-step I-Chart OR stacked Boxplot by step) |
| Y + multiple outcomes | Y selector tabs (default = leftmost canvas outcome)           |
| No outcome            | (button disabled; hint shown)                                 |

Subtitle under the button shows the destination preview: _"will land on I-Chart + Boxplot by Vessel."_ Power-user shortcut: `Enter` triggers the exit.

### §4.6 · 3 response paths at Canvas L3

Click a step on L2 → drill to L3 focal-step view → three response-path CTAs surface (per wedge §3.3.4, with one amendment):

1. **Capture as Finding** — lightweight observation; no IP commitment. Records "saw this at this step" as a Hub-level Finding. Replaces the wedge spec's original "Quick Action" (see §8 amendment item 1).
2. **Investigate** — opens Analyze Wall + Evidence Map pre-scoped to this step.
3. **Charter** — opens the Promote-to-Project modal from §4.4 with focal-step context inherited.

Three exits at the granularity of _record → explore → commit_. Control is auto-fired (ADR-080), never a user-triggered response path at L3.

---

## §5 · Mode A reopen + empty states

### §5.1 · Mode A.1 (reopen existing Hub, no new data)

User opens an existing Hub from the Hub list. Per Framing Layer §6.1:

- Hub state restored
- Latest snapshot's capability badges + drift indicators visible
- **Defaults to State mode** (L1 / L2 / L3 via pan-zoom)
- Edit mode is one click away via `Edit map` affordance in Process tab header
- Stage 5 modal opens on demand via `+ New analyze` button in canvas chrome

The canvas-onboarding experience (Spec 2) is for first-paint and for explicit Edit-mode entry; it does not re-show on every reopen.

### §5.2 · Mode A.2 (paste into existing Hub)

Already shipped in Framing Layer slice 3. The paste-driven **match-summary card** classifies the new data along source × temporal axes, surfaces block cases (overlap, different grain) that require user choice, otherwise proceeds with single confirmation.

No redesign in this spec. The match-summary card is the canonical entry surface for "I have new data for this existing Hub."

### §5.3 · Empty states

#### §5.3.1 · Hub with no data yet

Palette shows: _"Paste data here, or try a sample dataset"_ with a paste-zone affordance and 2–3 sample-dataset chips (matching `PasteScreen` from Framing Layer Stage 2). All zones empty with their default hint text. Toolbar workflows are disabled until data exists.

#### §5.3.2 · Parsing entirely failed

Rare case: malformed CSV, unrecognizable structure. Palette shows: _"⚠ Could not parse the pasted data — check format"_ with a "View raw" affordance for debugging and a "Try again" affordance. No chips; user re-pastes.

#### §5.3.3 · Partial connections

Most common state. Some columns connected (Y set; one factor in); others ignored. _Status is fine; not an error._ Footer shows: _"1 outcome · 2 factors · 3 columns unassigned · ✓ Ready to analyze"_. The `→ Explore` button is enabled.

#### §5.3.4 · No outcome set yet

`→ Explore` disabled. Quiet hint near the button: _"Set an outcome to unlock Explore."_ The outcome zone has a more prominent empty state than the others (since this is the gating one): _"Drag a column you want to measure success by."_

---

## §6 · Integration — how Edit mode feeds L1 / L2 / L3 (State mode)

The two modes of the Process tab. Edit mode (Spec 2) configures the Hub; State mode (L1 / L2 / L3, already shipped) renders the configured Hub.

| Edit-mode setup                                                 | State-mode level                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Global outcomes in outcome zone (with specs)                    | **L1** — outcome distribution + Cpk vs spec + drift                                              |
| Process model + step cards + step timings + Lead_time (derived) | **L2** — process flow view; step-card timing badges; Yamazumi stack; Lead_time as whole-flow KPI |
| Step-bound outcomes + step-bound factors                        | **L3** — focal-step view content                                                                 |
| Parsing settings + derived chips                                | Clean data feeding all three levels                                                              |

### §6.1 · Default homes for derived metrics

- Outcome distributions (Y) — natural fit for L1
- Flow metrics (durations, sequence, throughput, Lead_time) — natural fit for L2
- Step-bound content — natural fit for L3

Any chip can be promoted to L1 by dropping it as a global outcome — that's the user's gesture for "treat this as a Y." The level isn't a property of the metric; it's a property of how the user is using it.

### §6.2 · L1/L2/L3 navigation already shipped

Pan/zoom via `useCanvasViewportStore` per 8f Canvas Viewport Architecture (PRs #160–#168). The viewport state stores cross-level navigation per `(ProjectId, userId)` per ADR-078. Edit mode honors the same viewport — the user's last canvas position is preserved across mode switches.

### §6.3 · ADR-074 multi-level boundary policy

ADR-074 names SCOUT (investigation-time picker) and Hub Capability tab (hub-time, rolling default) as peer surfaces — neither is the "real" level. The Spec 2 design mirrors this: whole-process and step-bound content are peer levels, not hierarchical. The user moves between them via canvas pan/zoom; analyses don't roll up across them (per ADR-073 — no statistical roll-up across heterogeneous units; step-bound outcomes at React vs QA are heterogeneous).

---

## §7 · ACL — 2-tier model

The wedge V1 ACL was originally six actions × three roles. The 2026-05-26 session collapsed it to two tiers + identity/notification labels.

### §7.1 · The two tiers

| Tier              | Members                | Capabilities                                                                                               |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Lead**          | Lead role (1 person)   | Read everything + Edit-everything + advance stages + close hypotheses + compile Report + manage membership |
| **Everyone else** | Member + Sponsor roles | Read everything + edit contributions (Findings, evidence on hypotheses, action items, ideas, comments)     |

That's it. No further role-tier distinctions.

### §7.2 · No in-product approval gates

Per wedge spec line 288: signoff at gates (Charter approval, Control closure) is **out-of-band** in V1 — Lead presents in a meeting, Sponsor approves verbally / by reply, Lead records the signoff as a note in the relevant stage's metadata. This loses the in-app audit trail but keeps V1 scope minimal.

No in-product "Approve Charter" button. No "Sign off Report" button. No "Sanction IP" button. Re-evaluate adding in-app Sponsor signoff in V2 if customer demand surfaces.

### §7.3 · Sponsor is identity / notification, not gating

Sponsor role persists as a label for:

- **Identity / accountability** — _"Project X is sponsored by Jane Doe (VP Operations)"_ — appears in Charter + Report attribution
- **Notification routing** — drift signals during Control go to Sponsor explicitly
- **Inbox filtering** — Sponsor's inbox surfaces signoff-relevant items differently from a Member's contribution queue
- **Real-world signoff workflow** — happens out-of-band; Lead records the result

Persona docs still describe different intent (Lead drives, Member contributes, Sponsor approves and reviews); the ACL just doesn't enforce a Member/Sponsor distinction.

### §7.4 · canAccess implementation

`packages/core/src/projectMembership/canAccess.ts` collapses from the current 6-action × 3-role table to:

```ts
type Action = 'edit' | 'edit-contributions' | 'manage-membership' | 'view-report';

const ROLE_PERMISSIONS = {
  lead: ['edit', 'edit-contributions', 'manage-membership', 'view-report'],
  member: ['edit-contributions', 'view-report'],
  sponsor: ['edit-contributions', 'view-report'],
};
```

Drop the previous `'edit-charter'` / `'edit-approach'` / `'edit-improve'` / `'edit-sustainment'` actions — replace with a single `'edit'` for Lead-only structural writes. Drop the previous `'approve-*'` actions entirely (out-of-band).

This change is part of the cross-doc impact list in §8.

---

## §8 · Cross-doc impacts

### §8.1 · Wedge spec amendments (six)

Required to align the wedge V1 architecture spec with the design choices here:

1. **§3.3.4 — retire "Quick Action"; replace with "Capture as Finding".** Three response paths at Canvas L3 become: Capture as Finding (lightweight observation) / Investigate (Wall scoped to step) / Charter (formalize into Project). The user-intent gradient becomes _record → explore → commit_.

2. **§3.2 — Charter UI field: "Problem statement form" → "Issue statement form".** Per code's vocabulary (`AnalysisBrief.issueStatement`). Problem Statement is auto-synthesized later in Approach stage via `buildProblemStatement()`. See §3.6 of this spec.

3. **§3.0 — retire "promoted from validated hypothesis" framing.** Charter is the formalization gesture; hypotheses are inherited context, not a precondition. The current `ia-nav-model.md:79–92` text _"An active IP is an Improvement Project the Lead has promoted from a validated hypothesis"_ is wrong and should be replaced with framing around Charter ceremony.

4. **§4.1 + canAccess.ts code — collapse to 2 ACL tiers.** Lead + Everyone-else; drop role-level approval gates (signoff is out-of-band per wedge line 288). See §7.4.

5. **Sponsor persona doc (`docs/02-journeys/personas/sponsor.md:61`) — remove "skips Explore + Analyze entirely".** Replace with prose around _"Sponsor reads Explore + Analyze when engaged; active gestures bounded to approval gates which happen out-of-band."_ The persona × tab matrix in `docs/02-journeys/ia-nav-model.md` changes Sponsor's `(no touch)` cells to `Read`.

6. **Tab vocabulary positioning (Explore / Analyze / Control)** — deferred to a separate vocabulary session (task pending). Current spec uses `Explore / Analyze / Control` per the wedge V1 7-tab nav; rename completed in PR-WV1-NAV (2026-05-27).

### §8.2 · Code touches

| File                                                 | Change                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/projectMembership/canAccess.ts`   | Collapse 6 actions → 2 tiers (§7.4)                                                                                    |
| `packages/core/src/improvementProject/types.ts`      | `ImprovementProjectGoal.outcomeGoal` extends to a list with optional `stepId` for step-bound outcomes (§3.3.1)         |
| `packages/core/src/findings/problemStatement.ts`     | Live + approved problem statement state machine fully wired                                                            |
| `packages/ui/src/components/Canvas/EditMode/*` (new) | The canvas-onboarding components themselves — palette, zones, modals, etc.                                             |
| `packages/stores/src/improvementProjectStore.ts`     | `projectsByHub: Record<HubId, IP[]>` → `projectsById: Record<ProjectId, IP>` (separate cleanup PR per the master plan) |
| `apps/azure/src/components/editor/FrameView.tsx`     | Existing FrameView shell — wires up the new Edit-mode components                                                       |
| `apps/pwa/src/components/views/FrameView.tsx`        | PWA equivalent                                                                                                         |

### §8.3 · Doc touches

| Doc                                                                     | Change                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`        | Six amendments listed in §8.1                                            |
| `docs/02-journeys/personas/sponsor.md`                                  | Amendment item 5 (Sponsor visibility)                                    |
| `docs/02-journeys/personas/lead.md`                                     | JTBD restructure (activity-framed) — deferred to vocabulary session      |
| `docs/02-journeys/ia-nav-model.md`                                      | Persona × tab matrix Sponsor cells (Read, not no-touch)                  |
| `docs/02-journeys/use-cases/{bottleneck-analysis,batch-consistency}.md` | Annotate Mode 1 vs Mode 2 narratives                                     |
| `docs/USER-JOURNEYS.md` + `docs/02-journeys/personas/index.md`          | Add Mode 1 (quick-analyze, no Project) journey — deferred to a follow-up |
| `docs/07-decisions/adr-082-wedge-architecture.md`                       | Reflect the 2-tier ACL collapse if codified                              |

---

## §9 · Open questions deferred

Explicitly named so future sessions can pick them up without re-derivation:

1. **Vocabulary positioning — RESOLVED 2026-05-27 (PR-WV1-NAV).** Settled on `Home · Project · Process · Explore · Analyze · Improve · Report`. The previous Investigation tab is now Analyze; the previous Analyze EDA-tab vocabulary moved to Explore; Sustainment stage is now Control. The 13-commit nav vocabulary sweep + this cleanup pass (commits 9a0fb769..32df82f2) implemented the rename.
2. **Lead JTBD restructure** — activity-framed (Frame / Drill / Improve / Verify) instead of lifecycle-framed (Charter → Approach → Control). Logged as finding; doc-only fix when settled.
3. **Mode 1 journey doc** — add a pre-Project journey to `docs/02-journeys/`; currently the L2 journey corpus is silent on quick-analyze.
4. **Project = IP terminology cleanup** — collapse the muddle in code (`projectsByHub` legacy holdover) and docs ("Active IP promoted from hypothesis" wrong framing).
5. **Spec 3** — step cards + drill-down floating overlays + mode-lens reskinning. Companion task #11 (Analyze-tab Pareto / lens design) lives here.
6. **Spec 4** — canvas overlays + Analyze Wall sync. Aligns with 3-response-path model.
7. **Spec 5** — IndexedDB persistence schema.
8. **ControlHandoff retention** — Control closure data model. Task #12.
9. **True branching topology** — different paths through the process based on a categorical (e.g., defective → Rework before Pack; good → straight to Pack). V2.
10. **Sequential sub-step decomposition** — one step has ordered children (Prep = Heat → Mix → Cool). V2.
11. **Per-resource timing** — separate start/end columns per parallel machine. V2.

---

## §10 · Verification

To validate this spec's design end-to-end before implementation:

1. **Drive the walkthrough HTML** (`/tmp/variscout-walkthrough.html` from the 2026-05-26 session) through each section and reconcile any drift.
2. **Customer-conversation precondition** (wedge spec §8.3) — surface this design with at least one improvement specialist customer; capture their reaction to the canvas-as-primary onramp.
3. **Implementation plan** — invoke `superpowers:writing-plans` on this spec; the plan will surface any sub-component scopes that need refinement before implementation.
4. **Test plan** — Spec 2's canvas-onboarding flow needs E2E coverage in both `apps/azure` and `apps/pwa`. Per `feedback_wedge_v1_no_migration_no_backcompat`, no users yet; no migration tests required.

### §10.1 · Acceptance criteria for "Spec 2 designed end-to-end"

- [x] Three canvas zones map to user cognitive tasks (§2.2)
- [x] Column chip parsing UX with override on demand (§3.1.1)
- [x] Per-chip context menu for column-level operations (§3.1.2)
- [x] Outcome chips + specs popover + multi-outcome (§3.2)
- [x] Step boxes with step-bound Y + X sections (§3.3)
- [x] Step timings workflow modal (§4.3.1)
- [x] Calculated columns + batch ratio templates (§4.3.2)
- [x] Time-as-factors workflow (§4.3.3)
- [x] Inflection-point binning in probability plot (§3.5)
- [x] Promote-to-Project modal + 5 entry points (§4.4)
- [x] Exit "→ Explore" with Y soft-gate + smart routing (§4.5)
- [x] 3 response paths at Canvas L3 (Capture as Finding / Investigate / Charter) (§4.6)
- [x] Mode A reopen behavior (§5)
- [x] L1/L2/L3 integration (§6)
- [x] 2-tier ACL (§7)
- [x] 6 wedge spec amendments enumerated (§8.1)
- [x] Open questions deferred explicitly (§9)
