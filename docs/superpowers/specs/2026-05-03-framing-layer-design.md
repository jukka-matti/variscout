---
title: VariScout Framing Layer — Hub Creation, Data Ingestion, and Investigation Entry
audience: [product, engineer, designer]
category: design-spec
status: draft
last-reviewed: 2026-05-03
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/decision-log.md
  - docs/glossary.md
  - docs/07-decisions/adr-059-web-first-deployment-architecture.md
  - docs/07-decisions/adr-068-coscout-cognitive-redesign.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
---

# VariScout Framing Layer

> **First of five canvas-detail specs** decomposed from the 2026-05-03 vision §8 walkthrough. Covers Hub creation, data ingestion, and investigation entry — everything _before_ canvas authoring proper. Inherits the 12 locked decisions from the §8 resolution. Sibling specs (deferred): Spec 2 manual canvas authoring, Spec 3 cards / drill-down / mode lenses, Spec 4 canvas overlays + Wall sync, Spec 5 IndexedDB persistence schema.

## 1. Context

The 2026-05-03 vision spec commits to a unified Canvas that absorbs the Frame and Analysis tabs (Q0). What it doesn't detail is _how data and analyst intent enter the canvas_ — the entry-to-canvas pathway. This spec fills that gap.

Two things drive the design:

1. **The mental model the analyst should develop over years of usage.** Watson's three questions ("what's happening / what does it cost / what do we want") lifted into the product structure. The analyst's reflexive starting point becomes "why does this process exist?", "how is it doing against that purpose?", "where is it deviating?" — not "I have data, what does it tell me?"
2. **Reality of multi-source factory data.** Production telemetry, QC inspection, maintenance logs come from different upstream systems on different cadences. They join via shared identifiers (`lot_id` / `batch_id` / `part_id`). Treating each source as a separate Hub loses methodological coherence. The Hub spine is the process line; data flows in from multiple sources via join keys.

The spec describes the complete framing-layer design. V1/V2 partitioning at §15 is _delivery phasing_, not design phasing (per `feedback_full_vision_spec`).

### What this spec covers

- The two-layer model (Hub-level durable + investigation-level episodic)
- Hub-level primitives: process goal, outcome measures, specs, primary scope dimensions
- Investigation-level grammar: Issue → Question → Hypothesis (CTP→CTQ) → Evidence → Finding
- Mode B (first-time Hub creation) — Stages 1–5
- Mode A (reopening existing Hub) — three sub-cases including paste-driven match and Evidence Source auto-ingestion
- Match-summary card with two-axis classifier (source × temporal)
- Multi-source ingestion via shared keys
- Defect data anchoring and Pareto integration on the canvas
- Three composable canvas filter states (time window / scope / Pareto group-by)
- Graceful degradation when detection fails

### What this spec does NOT cover (sibling specs)

- Manual canvas authoring (drag-to-connect, sub-step grouping, branch/join) — Spec 2
- Step card details, drill-down floating overlay UX, mode-lens reskinning — Spec 3
- Canvas overlays (investigations / hypotheses / suspected causes / findings) and Wall projection sync — Spec 4
- IndexedDB persistence schema for PWA Hub-of-one — Spec 5

This spec ends at _"canvas first paint with goal banner + outcome pin"_ (Mode B) or _"canvas with restored state + new-snapshot indicator"_ (Mode A). What happens _on_ the canvas is downstream.

## 2. The two-layer model

VariScout's framing has two layers with different durability and cognitive shape:

| Layer                   | Durability                                          | Cognitive shape                                      | Where it lives       |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------- | -------------------- |
| **Hub-level**           | Persistent across investigations / sessions / years | Authored once at Hub creation; refined incrementally | Hub config           |
| **Investigation-level** | Per-session; comes and goes                         | Episodic; "what's deviating today?"                  | Investigation entity |

The Hub layer teaches the methodology habit. Every time the analyst opens or creates a Hub, they engage with "why does this process exist?" — Watson VOC at the door of the product. The investigation layer is where today's deviation gets investigated against the durable goal.

After 6+ months of use, the analyst's reflex becomes:

1. **Why does this process exist?** _(Hub-level, durable)_
2. **How is it doing against that purpose right now?** _(cadence read on the canvas)_
3. **Where is it deviating?** _(drill-down + 5 response paths, vision §2.4)_
4. **Is the deviation explained?** _(investigation graph)_
5. **Did our action close the gap?** _(sustainment)_

This is a far better operator habit than "I have data; what does it tell me?" — which is what most data-first tools teach.

## 3. Hub-level primitives

A Process Hub holds these durable artifacts. The first three are authored at Hub creation; the fourth and fifth grow incrementally.

### 3.1 Process goal

A short narrative covering: **purpose** (what does this process produce?), **customer** (for whom?), and **what matters** about the output. One paragraph; 1–5 sentences typical.

The narrative implicitly carries the methodological CTS (customer-language expectation). It is **not** broken into separate fields — the goal sentence holds them together. Watson's three Qs survive as scaffolding, not as form fields (§5.1).

The goal also seeds:

- **Hub name** — auto-extracted from the first sentence (editable). e.g., "Syringe-barrel injection line."
- **Outcome detection bias** — keywords from the goal narrative bias the deterministic detection at Stage 3.
- **CoScout coaching anchor** (Azure tier) — feeds tier1 prompt context per ADR-068 amendment.

### 3.2 Outcome measure(s)

One or more columns from the dataset that quantify delivery on the goal. Plain-language label is **"outcome"** — the methodological concept is CTQ, but the acronym is retired user-facing per vision §3.3 commitment 9 (see `docs/glossary.md` retired-terms section).

Multiple outcomes are supported: a Hub can have both `weight_g` (continuous, dimensional) and `defect_count` (discrete, count) as outcomes simultaneously. Each outcome is independently:

- Pinned at the right edge of the canvas
- Tied to its own specs (§3.3)
- Capable of receiving its own drill-down

### 3.3 Specs per outcome

For each outcome column: **target**, **LSL**, **USL**, **cpkTarget**. These are _customer-driven_ values from the quality contract / drawing tolerances / regulatory limits — not derived from the data's variability.

VariScout does **not** suggest LSL/USL based on `target ± 3σ`. Such suggestions silently teach the wrong mental model — they conflate spec limits (customer requirement) with control limits (process behavior). The two are different concepts; the glossary documents the distinction. Spec inputs are placeholders ("from customer spec") or empty by default.

What VariScout _does_ offer:

- **Target suggestion** = dataset mean for nominal-is-best characteristic type, with a clear hint "starting point — replace with customer target"
- **Smart defaults adapt to characteristic type**: smaller-is-better disables LSL; larger-is-better disables USL
- **`cpkTarget` default = 1.33** (literature standard, customer-overridable)

Specs are **optional at Hub creation**. The skip-spec path falls through to the canvas's outcome-pin fallback rule (per Q2): outcome card swaps the Cpk badge for `mean ± σ + n` and shows a `+ Add specs` chip until specs are added. Methodology habit preserved without front-loading numeric inputs.

### 3.4 Primary scope dimensions

Discrete columns the analyst will slice analysis by most often: typically 2–4 columns out of 10–30. Examples: `product_id`, `lot_id`, `shift`, `machine_id`, `supplier`.

Marked dimensions get prominent picker access across the canvas:

- Pareto group-by dropdown shows them at the top
- Canvas filter chips offer one-click "Filter by [primary dim]"
- Drill-down panel uses them as default filter axes

VariScout suggests dimensions based on column cardinality (3–50 levels typical) plus name heuristics (`*_id`, `lot`, `batch`, `product`, `customer`, `shift`, `operator`, `machine`, `supplier`). User confirms or overrides. Skippable — system falls back to first-name-keyword-match plus cardinality.

High-cardinality columns (e.g., `batch_id` with 412 levels) are flagged as "join keys, not Pareto candidates" — they make poor Pareto X-axes but valuable join keys.

### 3.5 ProcessMap structure

The DAG of steps + sub-steps + arrows + branches/joins is a Hub-level primitive but its design lives in **Spec 2 (manual canvas authoring)**. Spec 1 doesn't author the map; it ensures the entry-to-canvas pathway delivers the user to a canvas where Spec 2 takes over.

For Spec 1 purposes: the ProcessMap exists in the data model (per vision §3.3 ten commitments), and Mode A reopen restores it from persistence.

## 4. Investigation-level grammar

When an analyst opens an investigation on a Hub that has its goal + outcomes defined, every session follows the same shape:

```
ISSUE          →   QUESTION         →   HYPOTHESIS              →   EVIDENCE         →   FINDING
"what's            "what would          CTP → CTQ relationship       statistical           what the
happening"         tell us?"           ("a change in factor X         tests on              evidence shows
                                        caused a shift in Y")         canvas data
```

The hypothesis shape — **"a change in [process input] caused a shift in [outcome]"** — is exactly how factory-floor investigations look. It maps directly to existing entities in code:

| Conceptual primitive          | Existing entity / file                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| Issue statement               | `ProcessContext` / Issue Statement (`project_problem_statement` in memory) |
| Question                      | `Question` entity in `investigationStore`                                  |
| Hypothesis (CTP→CTQ)          | `SuspectedCause` hub (ADR-064) + `CausalLink` (`fromFactor → toFactor`)    |
| Evidence                      | Findings linked to charts via `buildFindingSource`                         |
| Finding                       | `Finding` entity in `useFindingStore`                                      |
| Promoted hypothesis on canvas | Q11 node marker (when evidence crossed threshold)                          |

This isn't new infrastructure — it's connecting infrastructure that already exists with a coherent grammar instead of three disconnected entry points.

The vocabulary `CTP` and `CTQ` survives in **CoScout methodology coaching** (where teaching the language is the point, Azure tier) but not in user-facing primitives. User-facing labels are _input_ / _factor_ / _outcome_ per glossary canonicalization.

## 5. Mode B — first-time Hub creation

Five stages. Stages 1–3 set up the Hub (durable). Stage 4 = canvas authoring (Spec 2). Stage 5 = investigation entry (episodic, optional).

### 5.1 Stage 1 — Process goal narrative

A textarea labeled "Why does this process exist?" with three **scaffold chips** above it:

- `+ Purpose`
- `+ Customer`
- `+ What matters`

Clicking a chip inserts a labeled prompt chunk into the textarea (e.g., `Purpose: ` followed by cursor) — the user fills in. Chips are optional; the textarea accepts free-form prose without using them. This balances Mode B friction (one line gets you through) with methodology scaffolding (the chips teach the Watson VOC habit by example).

A "See examples" link surfaces 2–3 anonymized goal narratives (syringe-barrel / baker / assembly station) for first-time users who'd benefit from priors.

**Hub name** auto-extracts from the first sentence after Continue. Editable inline at any time.

**Skip path:** "Skip framing (advanced)" link for power users who want to land on the canvas immediately. Skipped Hubs use the dataset filename as the Hub name and have no goal narrative until later edited.

### 5.2 Stage 2 — Paste / upload data

Existing UX preserved (`PasteScreen`, drop zone, sample dataset chips). Detection runs with goal context: keywords from the Stage 1 narrative bias the outcome ranking at Stage 3.

### 5.3 Stage 3 — Outcome confirmation, specs, scope dimensions

Three sub-concerns on one screen, ordered by importance:

#### 5.3.1 Outcome confirmation

One row per candidate column, horizontal layout:

`[radio] [name + type] [sparkline] [inline spec inputs (when selected)] [data quality stack] [match confidence]`

Specs appear inline only on **selected** candidates. Multi-select supported (a Hub can have multiple outcomes). Smart spec defaults adapt to characteristic type (nominal-best / smaller-best / larger-best). LSL/USL placeholders say "from customer spec" — no σ-based suggestions.

Each row shows:

- **Sparkline** (mini histogram) — distribution shape at a glance
- **Data quality** — inline `n=` count, `% missing`, NaN/Inf flags from `validateData()` / `DataQualityReport` (ADR-069 B1)
- **Match confidence** — % keyword match against the goal narrative + bonus from name patterns (`weight`, `defect`, `cycle_time`, `quality`, etc.)

Skip-specs path: confirms the outcome but defers spec entry to the canvas (Q2 fallback rule).

#### 5.3.2 Primary scope dimensions sub-step

After outcome confirmation, a small expandable section: "Which columns will you slice analysis by most often?" (§3.4). System pre-checks suggested dimensions based on cardinality + name heuristics; user confirms or overrides. Skippable.

#### 5.3.3 Graceful degradation when no outcome candidate has goal-keyword match

Trigger: vague goal narrative OR cryptic column names (`Var1`, `X23`, `Quality`). All candidates score below ~30% match.

UX:

- Banner: "No clear outcome match. Either rename a column to match your outcome (best for the long term) or pick manually below."
- Inline rename affordance (✎ icon) next to each column name
- Free-text "I expected the outcome to be: \_\_\_" note
- Skip-outcome path: canvas paints with all columns unclassified; user assigns roles via the canvas later
- Hub records the user's pick — future paste of a column with this name will rank higher (deterministic learning, no AI required)

### 5.4 Stage 4 — Canvas first paint (Spec 2 territory)

The framing-layer spec ends here. Stage 4 transitions to the canvas with:

- **Goal banner** at the top of the canvas (auto-extracted from goal narrative)
- **Outcome pin** at the right edge with confirmed outcome columns + their specs (or fallback)
- **Auto-classified factor / metadata chips** waiting to be placed on steps (Spec 2 details the placement UX)

### 5.5 Stage 5 — Investigation entry (optional, floating modal)

Form factor: **floating modal** over the canvas, consistent with Q1 drill-down overlay. Same modal shape, different content.

Fields:

- **Issue** (free-text) — what's happening, what just changed
- **Question** (free-text) — what would tell us?
- **Hypothesis** (optional) — pin on canvas later if skipped here

Two buttons:

- **"Open investigation →"** opens the Investigation tab with the active context
- **"Skip — explore canvas instead"** lands on the canvas with no active investigation context (observation-triggered EDA per Constitution P5)

The three Constitution P5 entry points map cleanly:

| Entry point           | Stage 5 path                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Upfront hypothesis    | Fill the framing card → investigation opened with hypothesis pinned                         |
| Evidence-ranked       | Fill issue + question → investigation opened, hypothesis discovered via Factor Intelligence |
| Observation-triggered | Skip → canvas → discover something → `QuestionLinkPrompt` formalizes retroactively          |

In Mode A (cadence), Stage 5 opens on demand via a "+ New investigation" button in the canvas chrome. The same modal serves both modes.

## 6. Mode A — reopening an existing Hub

Three sub-cases. The Hub already has goal + outcomes + specs + scope dimensions; Stages 1–3 are bypassed.

### 6.1 A.1 — Reopen, no new data

User clicks Hub from the Hub list. Hub state restored to the canvas. Latest snapshot's capability badges + drift indicators visible. Stage 5 modal opens on demand via "+ New investigation" button.

### 6.2 A.2-paste — Reopen + manual paste

User pastes a new CSV onto the canvas (or via "Paste new snapshot" affordance). System runs the **match-summary card** (§7) classifying the paste along source and temporal axes. User confirms an action; canvas updates with the new snapshot.

### 6.3 A.2-evidence-source — Auto-ingestion (Azure only)

Cadence-driven Evidence Source (Blob Storage push or scheduled pull) lands a new snapshot while the user is offline. Background job runs match logic. PWA Hub-of-one has no cloud sync per Q8 — A.2-evidence-source is Azure-tier only.

What the user sees on next open:

- **"X new snapshots ↑"** chip in the goal banner
- Snapshot timeline strip on the canvas chrome highlights new snapshots in green
- Cpk drift indicator updates to reflect new data
- If column drift was detected during background ingestion, a one-line yellow banner: "Snapshot S26 had a new column `defect_type` — review map?"
- Click the chip → quick "what's new" summary (capability change vs prior; column drift)

## 7. Match-summary card (Mode A.2-paste)

The match-summary card is the most novel surface in this spec. It opens whenever a user pastes new data into an existing Hub.

### 7.1 Two-axis classifier

The card classifies the paste along two independent axes:

#### Source axis (where from)

| Case                           | Description                                         | Default action                           |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| 1. Same source                 | Snapshot of existing telemetry                      | Add as new snapshot                      |
| 2. Different source · joinable | New source matching via shared key (`lot_id`, etc.) | Suggest join key; multi-source flow (§8) |
| 3. Different source · no key   | Entirely different shape, no shared key             | Suggest creating a new Hub               |
| 4. Mixed                       | Some columns match, some are from a new source      | Confirm column-by-column                 |

#### Temporal axis (when)

| Case                   | Description                                 | Default action                                                |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| 1. Append              | New range > existing max                    | Add as new snapshot                                           |
| 2. Backfill            | New range < existing min                    | Add as backfill + warn drift may shift                        |
| 3. **Overlap**         | Ranges intersect                            | **Block** — force user to choose replace / keep both / cancel |
| 4. Replace             | ~Same range; high duplicate-row rate (>70%) | Suggest "replace this period?"                                |
| 5. No timestamp        | No time column in dataset                   | Treat as anonymous batch with import-time                     |
| 6. **Different grain** | Hourly raw vs daily aggregates, etc.        | **Block** — separate Hub or aggregate first                   |

**Block cases** (Source #3, Temporal #3, Temporal #6) force the user to make a choice rather than silently merging incompatible data. World-class minimum: never silently double-count or merge incompatible grains. Methodology rationale: rational subgrouping (Watson) requires that pooled samples were drawn under similar conditions; silent merging of overlapping or different-grain data violates this and makes Cpk lie.

### 7.2 Timeline preview

The card leads with a horizontal timeline strip:

- **Existing snapshots** rendered as green segments
- **New dataset range** rendered as a blue overlay
- **Overlap region** (if any) rendered in orange

Reuses the shipped `TimelineWindow` primitive from Multi-level SCOUT V1 (per memory `project_multi_level_scout`).

### 7.3 Action choices per case

For block cases (overlap, different grain), the card surfaces explicit options:

**Overlap:**

- Replace overlap with new data (default; archives replaced rows with `replaced-by:<import-id>` tag)
- Keep both — separate snapshots / sources (treats as different cadences)
- Cancel and check (don't import; investigate why overlap exists)

**Different grain:**

- No silent default. User chooses: separate Hub / aggregate the new data first / cancel.

For non-block cases, default action proceeds with single confirmation.

### 7.4 Column shape sub-summary

Independent of the temporal classification, the card shows column-shape match status (reuses shipped `suggestNodeMappings` engine):

- **✓ matched columns** — render existing
- **+ new columns** — user assigns role (factor / metadata / ignore) and connects to a step
- **⚠ missing columns** — flagged as gap; doesn't block ingestion (could be sensor outage)

## 8. Multi-source ingestion via shared keys

Real factories have data from multiple upstream systems: production telemetry, QC inspection, MES, lab LIMS, maintenance logs. Each on its own cadence with its own time anchor. The Hub spine is the process line; sources join via shared identifiers.

### 8.1 Detection

Triggers when pasted data has:

- Column shape significantly different from Hub map AND
- At least one column matches a Hub column by name (or by `*_id` / `lot` / `batch` / `serial` / `part` naming heuristic)

System suggests join-key candidates ranked by:

- **Name match score** — column name in both Hub and pasted data
- **Value overlap** — what % of values intersect between the two columns
- **Cardinality compatibility** — joinable to existing data structure

User confirms or picks an alternative key.

### 8.2 Join semantics

Once joined:

- Each row is tagged with `source=<id>`
- Hub map includes columns from both sources
- Canvas treats joined-source columns as **context dimensions** (vision §3.3 commitment 7) — context propagates downstream just like step-of-origin propagation
- Per-source independent timelines preserved (V1; V2 derives lot windows from telemetry per §15)

### 8.3 Per-row provenance

Every imported row stores:

```
source           = <A | B | C ...>           // source identifier
origin           = <import-id>                // which paste / file / Evidence Source
imported_at      = <wall-clock>              // when it was added to VariScout
row_timestamp    = <from data, if present>   // original timestamp
snapshot_id      = <Hub-assigned>            // which logical snapshot
join_key         = <key column name>          // when joined via shared key
```

Replace-overlap actions archive replaced rows with `replaced-by:<import-id>` rather than deleting them. Provenance is recoverable.

### 8.4 Methodological alignment

The architecture honors:

- **ADR-073 (no statistical roll-up across heterogeneous units):** multi-source data joined via key gives per-(source × key × scope) cells. The join key is the structural anchor preventing illegitimate aggregation across sources.
- **Vision §3.3 commitment 7 (context propagation):** lot/batch/part IDs become context tuples that QC defects inherit from production telemetry.
- **Vision §2.3 (sample-size honesty):** per-source `n` counts preserved; the canvas can show "n=1842 telemetry points · n=87 inspections per lot" — different sampling cadences made visible.

Industry analogs: process mining (Celonis case ID), data warehouses (fact + dimension foreign keys), time-series + event correlation (Splunk entity ID), manufacturing analytics (PTC ThingWorx equipment ID).

## 9. Defect data and Pareto integration

Defect / rejection data lands on the canvas at multiple anchor points and powers a canvas-attached Pareto with two pickers.

### 9.1 Defect anchoring (multi-anchor)

When a dataset includes a `step_rejected_at` (or equivalent) column, defect rows anchor to specific step nodes:

- **End-of-line / outcome defects** — pin at the right edge alongside the outcome
- **Per-step rejects** — anchor to the specific step that caught them
- **Per-lot rolled-up defects** — multi-source via `lot_id`, attribute to system or step depending on data shape
- **Mixed** — real factories have all three at once

Detection at Stage 3 (Mode B) or A.2-paste (Mode A): when defect-mode column shape detected, system asks "Which column tells you which step caught this defect?" with the column picker. Optional; default = outcome / end-of-line anchoring.

### 9.2 Pareto on the canvas

Per-step mini-Pareto chips appear inline on step cards that have rejection data. System Pareto card attaches to the outcome pin. Without rejection data, neither appears (canvas stays clean).

The Pareto card is a first-class canvas element — visible in flow context, not buried behind a click. Click a bar → canvas-wide scope filter (§10). Multi-select for top-N investigation. **"Make this the investigation scope"** affordance promotes the selection to a Stage 5 investigation with the issue auto-filled.

### 9.3 Two pickers — group-by and weighted-by

The Pareto card has two independent pickers in its header:

- **Group by (X axis)** — categorical dimension to bin the bars by. Available list = primary scope dimensions (top of dropdown) + any other discrete column with reasonable cardinality. Examples: `defect_type` (default in defect mode) · `product_id` · `lot_id` · `supplier` · `operator` · `shift`.
- **Weighted by (Y axis)** — what determines bar height. Adapts to active mode lens (§9.4).

### 9.4 Y axis adapts to mode lens

Pareto generalizes from "defect Pareto" to a "where to focus" chart that adapts to data shape:

| Mode lens         | Y axis options                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------- | ------------- | --- |
| Defect mode       | count · time (downtime) · cost · severity-weighted (V2 — Watson G11)                     |
| Capability mode   | % out-of-spec · Cpk gap · σ-distance ·                                                   | mean − target |     |
| Performance mode  | Cpk · % out-of-spec (already shipped — `cpk-pareto` chart slot in `analysisStrategy.ts`) |
| Yamazumi mode     | cycle time · waste time                                                                  |
| Process-flow mode | step duration · throughput                                                               |

Same chart card primitive across modes; content adapts. User's Pareto-driven scoping habit transfers across modes.

Y-axis defaults to the characteristic-type-appropriate quality metric:

- Nominal-is-best: `|mean − target|` or `Cpk gap`
- Smaller-is-better: `% over USL` or upper-tail mean
- Larger-is-better: `% under LSL` or lower-tail mean

### 9.5 Methodological alignment (multi-axis Pareto)

A Cpk improvement project anchored on count would target Surface defects first (most common). A project anchored on cost would target Cracks first (most expensive). Both are right answers to _different_ questions. Locking the analyst into one axis silently forces a methodology choice. World-class systems make the axis explicit and switchable.

ADR-073 stays satisfied because Pareto-by-X creates per-X cells; bars are visible side-by-side rather than aggregated.

### 9.6 Edge cases

- **No defect data, no group-by dimension** — Pareto card simply doesn't appear. Outcome pin shows histogram + Cpk + drift + spec band.
- **Single-product / single-shift line** — same as above. No useful slicing.
- **Defects but no step-of-origin column** — system Pareto only; per-step Paretos absent.

## 10. Three composable canvas filter states

The canvas has three independent filter states that compose declaratively:

| State               | Source                             | Persistence                          |
| ------------------- | ---------------------------------- | ------------------------------------ |
| **Time window**     | `TimelineWindow` filter            | Per-investigation                    |
| **Scope filter**    | Pareto bar selection (or chip add) | Per-investigation                    |
| **Pareto group-by** | Pareto picker setting              | Per chart card; investigation-scoped |

Visual: three filter chip rows at the top of the canvas (purple / blue / amber respectively) with `×` to clear.

All three compose without new aggregation primitives. The canvas renders against the filtered + grouped data; Cpk + drift + Pareto bars all read the same filtered set. ADR-073 holds: per-(node × context-tuple × scope) buckets stay heterogeneity-aware.

Examples of legitimate compound state:

- "Last 30 days, scoped to top-3 products, Pareto by lot_id"
- "Tuesday's shift, all products, Pareto by defect_type weighted by cost"
- "Investigation window (rolling), scoped to ProductC, Pareto by operator weighted by % out-of-spec"

## 11. Graceful degradation

Three failure modes the design handles explicitly:

| Failure mode                                    | UX response                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **No outcome candidate has goal-keyword match** | Banner + rename affordance + free-text "I expected outcome to be" note + skip path. System learns from user's pick (§5.3.3) |
| **Vague goal narrative**                        | Outcome detection falls back to keyword + cardinality heuristics; same banner if no candidate scores well                   |
| **No useful scope dimensions**                  | Pareto card omitted; `+ add scope dimension` hint near outcome (or surfaced via CoScout coaching in Azure tier)             |
| **Cryptic column names**                        | Outcome detection low-confidence; user picks manually + can rename inline                                                   |
| **Different-shape paste**                       | Source axis classifier suggests "create new Hub instead"                                                                    |
| **Overlap or different-grain paste**            | Block — explicit user choice required                                                                                       |

Pattern: VariScout never silently _guesses_ on methodology-load-bearing questions. It surfaces uncertainty and asks; it does not hide it.

## 12. Engine reuse

Almost no new infrastructure is required. The framing layer connects shipped pieces:

| Existing piece                                                    | Used for                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `detectColumns()` + `inferMode()`                                 | Stage 3 outcome detection + lens suggestion              |
| `validateData()` + `DataQualityReport` (ADR-069 B1)               | Stage 3 inline missing-pct + NaN/Inf flags               |
| `suggestNodeMappings` (Azure migration engine)                    | A.2-paste match summary card                             |
| `SpecEditor` + `InlineSpecEditor`                                 | Stage 3 spec inputs                                      |
| `TimelineWindow` primitive (Multi-level SCOUT V1)                 | Match-summary timeline preview                           |
| `statusForCpk` + characteristic-type detection                    | Capability badges + spec-default heuristics              |
| `ParetoChart` + `StepErrorPareto` (production-line-glance C2)     | Canvas-attached Pareto                                   |
| `useFilterHandlers` / `applyFilter` (PWA dashboard)               | Cross-chart filter propagation extended to canvas        |
| `Question` / `SuspectedCause` / `CausalLink` / `Finding` entities | Investigation-grammar primitives                         |
| ADR-038 staged analysis                                           | Watson rational-subgroup gate when temporal gap detected |

New surfaces (this spec introduces):

- The framing card / Stages 1, 3, 5 forms in the entry-to-canvas path
- The match-summary card with two-axis classifier
- The join-key suggestion sub-card for multi-source detection
- Per-row provenance fields (`source`, `origin`, `imported_at`, `snapshot_id`, `join_key`, `row_timestamp`)
- `primaryScopeDimensions` Hub config field
- Pareto two-picker header (group-by + weighted-by)
- "Make this the investigation scope" affordance from Pareto selection

## 13. Out of scope

These are deferred to sibling specs:

- **Spec 2 — Manual canvas authoring:** drag-to-connect, multi-select sub-step grouping, branch / join arrow drawing, naming defaults, hit-test rules, two-level nesting enforcement
- **Spec 3 — Cards / drill-down / mode lenses:** detailed step card design, drill-down floating overlay UX, mode-lens reskin mechanism, Pareto axis switcher implementation
- **Spec 4 — Canvas overlays:** investigations / hypotheses / suspected causes / findings overlay rail, Wall projection sync (Q4 dual-home)
- **Spec 5 — IndexedDB persistence schema:** PWA Hub-of-one storage shape, migration handling, multi-tab sync

This spec ends at _"canvas first paint"_ (Mode B) or _"canvas with restored state"_ (Mode A).

## 14. Inheritance — anchors from §8 walkthrough

| Anchor | Locked decision                                                                                                                                                                   | This spec                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Q0     | Canvas eats Frame + Analysis tabs                                                                                                                                                 | Stage 4 = canvas first paint (no Frame tab)                                               |
| Q1     | Drill-down = floating overlay                                                                                                                                                     | Stage 5 modal uses same form factor                                                       |
| Q2     | Spec edit = `[✎]` icon + fallback rule                                                                                                                                            | Stage 3 spec inputs + skip-spec → fallback                                                |
| Q3     | Modes / levels orthogonal                                                                                                                                                         | Pareto Y axis adapts to mode; level inferred from canvas zoom (§9.4)                      |
| Q4     | Wall dual-home                                                                                                                                                                    | Investigation tab still the canonical destination; canvas overlay deferred to Spec 4      |
| Q5     | No CoScout map drafting in V1                                                                                                                                                     | Manual canvas authoring (Spec 2); CoScout coaches but doesn't draft                       |
| Q7     | Hard cutover, no migration                                                                                                                                                        | Mode A.2-paste UX is the data-migration path; existing Hubs are net-new (no users yet)    |
| Q8     | PWA = session-only by default; opt-in IndexedDB Hub-of-one AND `.vrs` export/import (Option 4 hybrid; revised 2026-05-03). `.vrs` doubles as shareable training scenario package. | A.2-evidence-source is Azure-only; PWA gets A.1 (after opt-in) + A.2-paste only           |
| Q9     | `lazyWithRetry` on Canvas                                                                                                                                                         | Implementation detail; framing card lazy-loads consistently                               |
| Q10    | `docs/glossary.md` canonical                                                                                                                                                      | All term references go to glossary, not re-defined here                                   |
| Q11    | Hypothesis overlay (promoted vs draft)                                                                                                                                            | Deferred to Spec 4 (canvas overlays); investigation grammar surfaces hypotheses textually |

## 15. Delivery phasing (V1 vs V2)

Per `feedback_full_vision_spec`, the design above is the complete vision. Phasing here describes _delivery sequencing_, not design partitioning.

### V1 (this spec's first delivery)

- Two-layer model + investigation grammar
- Mode B Stages 1–3 + Stage 5
- Mode A.1 + A.2-paste (PWA + Azure)
- Mode A.2-evidence-source background ingestion (Azure)
- **PWA persistence (Q8-revised — Option 4 hybrid):** session-only by default; opt-in "Save to this browser" surfaces an IndexedDB-backed Hub-of-one (`apps/pwa` Dexie schema with single Hub row); `.vrs` file export/import always available as escape hatch. Constitution P1 + P8 preserved. `apps/pwa/CLAUDE.md` hard rule updated.
- Match-summary card: 2-axis classifier with all 4 source cases + 6 temporal cases
- Block on overlap and different-grain
- Multi-source via shared keys: detection + name+overlap join-key suggestion + per-source provenance + per-source independent timelines
- Defect anchoring (multi-anchor) + Pareto on canvas (per-step mini + system) + two pickers + Y axis adapts to mode
- Three composable filter states
- Graceful degradation paths
- Primary scope dimensions sub-step at Stage 3
- Hub config: `primaryScopeDimensions`, `processGoal`, `outcomes[]`, `specs{}`
- Schema for per-row provenance fields

### V2 (later delivery cycles)

- **Auto-detect join keys via value overlap** (no name heuristic; works on cryptic IDs)
- **Hierarchical temporal alignment** — lot windows derived from telemetry, defect events placed within lot windows; canvas shows time at the lot grain
- **Late-arriving data reconciliation + auto-deduplication** (overlap handling without forcing user choice for every paste)
- **Time-travel queries** — Cpk AS OF date; capability over investigation period
- **Composite group-by** — heatmap Pareto (`defect_type × product_id`)
- **Pareto trend over time** — Pareto shifts week-by-week
- **Severity-weighted Y axis** — Watson G11 methodology addendum (separate severity-rank table per defect type)
- **Linked Hubs** (Option C from multi-source design) — cross-Hub views for org-level analysis
- **Multi-step source-shaping transforms** — pivot / unpivot / aggregate / filter pre-join
- **Industry templates** — "Pick a starting template: Injection molding / Assembly / Baking" for Stage 1
- **"Paste spec table"** — bulk import of customer specs
- **Stage auto-suggestion** — when temporal gap suggests process-state change, suggest staging analysis (per ADR-038)

## 16. Verification (acceptance criteria)

V1 delivery is complete when:

### End-to-end Mode B (PWA + Azure)

- [ ] First-time user pastes a CSV; framing card appears with goal narrative scaffold chips
- [ ] Detection runs with goal context; outcome candidates ranked with sparkline + missing-% + match confidence
- [ ] User multi-selects 2 outcomes; inline spec forms appear under each (no σ defaults)
- [ ] Skip-spec path produces canvas with `mean ± σ + n` fallback chip on outcome pin
- [ ] Primary scope dimensions sub-step suggests + accepts user override
- [ ] Stage 5 modal opens with skip path → canvas-only (observation-triggered EDA)
- [ ] Canvas first paint shows goal banner + outcome pin + auto-classified factor / metadata chips
- [ ] Hub name auto-extracts from goal first sentence; editable

### End-to-end Mode A (PWA + Azure)

- [ ] A.1: reopen Hub → canvas with restored state, no framing card, "+ New investigation" button visible
- [ ] A.2-paste: paste new CSV → match-summary card with timeline preview + 2-axis classification + per-case actions
- [ ] Block cases (overlap, different grain) prevent silent merge; user must choose
- [ ] Action choices preserve provenance (replaced-rows archived with `replaced-by` tag)
- [ ] Multi-source: paste of QC defect data joins via `lot_id` with cardinality preview
- [ ] Per-source independent timelines render correctly
- [ ] A.2-evidence-source (Azure only): background ingestion shows "X new snapshots ↑" indicator on canvas reopen

### Defect data + Pareto

- [ ] Defect-mode data anchors to step (when `step_rejected_at` column present) or outcome (when absent)
- [ ] Per-step mini-Pareto chips render on step cards with rejection data
- [ ] System Pareto card on outcome pin with two pickers (group-by + weighted-by)
- [ ] Pareto bar click → canvas-wide scope filter; multi-select supported
- [ ] "Make this the investigation scope" promotes selection to Stage 5 with issue auto-filled
- [ ] Y axis adapts to active mode lens (count / cost / time / Cpk gap / etc.)
- [ ] Edge case: no group-by dimension → Pareto card omitted, canvas stays clean

### Graceful degradation

- [ ] Cryptic column names + vague goal: low-confidence banner + rename + skip-outcome path
- [ ] Hub records user's pick → future paste of similar shape ranks higher

### Engine reuse

- [ ] No new chart primitives introduced; canvas Pareto reuses shipped `ParetoChart` + `StepErrorPareto`
- [ ] Match-summary timeline reuses `TimelineWindow`
- [ ] Outcome detection reuses `detectColumns()` + `inferMode()` + `DataQualityReport`
- [ ] `suggestNodeMappings` powers A.2-paste column match
- [ ] No new persistence primitives in V1 (Spec 5 details schema)

### Methodology guards (CI-checkable)

- [ ] No σ-based suggestions for LSL/USL anywhere in code (CI guard test)
- [ ] No silent merge on overlap or different-grain paste (block-case guard test)
- [ ] Per-row provenance fields present on all imported rows (schema test)
- [ ] ADR-073 structural absence preserved — no aggregation primitive across heterogeneous sources / specs / contexts

---

**Predecessor brainstorm:** the §8 vision walkthrough at `~/.claude/plans/lets-do-this-next-rustling-simon.md` locked Q0 + Q1–Q11; this spec inherits those anchors (§14).

**Implementation plans:** V1 is delivered in 4 slices.

- **Slice 1 (in flight):** [`docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1.md`](../plans/2026-05-03-framing-layer-v1-slice-1.md) — Mode B Stages 1–3 + canvas first paint + Mode A.1 reopen + PWA opt-in IndexedDB persistence + `.vrs` export/import (Q8-revised hybrid).
- **Slice 2 (planned):** Mode A.2-paste match-summary card + Mode A.2-evidence-source background ingestion + per-row provenance fields + Stage 5 modal full implementation.
- **Slice 3 (planned):** Multi-source via shared keys (join detection + per-source provenance + per-source independent timelines).
- **Slice 4 (planned):** Defect anchoring (multi-anchor) + Pareto on canvas (per-step mini + system) + two pickers + Y-axis adapts to mode + canvas-wide scope filter + three composable filter states UI.

**Visual companion mockups** archived at `.superpowers/brainstorm/6149-1777834116/content/` (gitignored; preserved locally for reference). Mockups: `framing-layer-flow-v4.html` (Stage 3 inline specs); `mode-a-temporal-alignment.html` (match-summary card with timeline preview); `multi-source-join.html` (join-key suggestion); `pareto-on-canvas.html` (defect-mode Pareto integration); `pareto-multi-product.html` (two pickers + scope selection); `pareto-no-defects.html` (capability-mode Pareto Y-axis adaptation).

**Next:** brainstorming Spec 2 (manual canvas authoring) — drag-to-connect, multi-select sub-step grouping, branch/join. The Frame layer's anchored decisions (process goal banner; outcome pin; primary scope dimensions; canvas first paint expectations) carry into Spec 2.
