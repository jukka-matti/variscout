---
tier: living
purpose: design
title: 'Investigation Surface — unified canvas, scope-vs-cause entity model, level-native contribution'
audience: human
status: draft
date: 2026-05-29
last-reviewed: 2026-05-29
layer: spec
topic: [investigation, canvas, findings, methodology, capability, wedge-v1]
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/specs/2026-04-19-investigation-wall-design.md
  - docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/07-decisions/adr-087-process-step-model-reconciliation.md
  - docs/07-decisions/adr-088-level-native-contribution.md
  - docs/07-decisions/adr-089-retire-mode-lens-user-axis.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-084-capability-indices-cp-cpk-only.md
implements:
  - docs/01-vision/methodology.md
  - docs/01-vision/eda-mental-model.md
  - docs/01-vision/positioning.md
  - docs/02-journeys/ia-nav-model.md
  - docs/02-journeys/personas/sponsor.md
  - docs/03-features/workflows/analyze-wall.md
  - docs/03-features/workflows/control.md
  - docs/03-features/analysis/subgroup-capability.md
---

# Investigation Surface

> **Draft · 2026-05-29.** Graduates the holistic investigation-model design (Clusters A + B + C, settled 2026-05-29) from a decision-log candidate into a buildable spec. Promoted from `docs/ephemeral/investigations.md` → "Investigation-model design direction". Decisions captured here are recorded in five ADRs ([ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md) … [ADR-089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md)); delivery is sequenced by the companion master plan. **This is full-vision (PWA + Azure); the plan sequences V1 delivery.** Grounded against actual source via 8 grounding agents + the methodology author's GB "Measure" decks (~144 pp).

---

## §1 · Context

Three entangled open-thread clusters were settled in the 2026-05-29 holistic brainstorm and are now graduated together because they share one substrate — the investigation graph and the canvas that projects it:

- **Cluster A** — the PWA/Azure seam + closure model (#12).
- **Cluster B** — analysis surfaces (#11 / #50 / #51): mode/lens axes, Values⇄Capability, outcome+decomposition.
- **Cluster C** — the Findings/Hypotheses domain + the unified canvas.

The clusters are not independent features; B and C both rest on the entity model A reframes. A combined spec keeps the WHERE≠WHY distinction coherent across all three rather than letting three PRs re-derive it.

### Vocabulary + the Project ↔ Hub model

One entity carries the work: the **Improvement Project (IP)** — "the Project," one LSSGB-style project (`ImprovementProject`, `status: draft → active → closed`). Fixed terms used throughout this spec and the ADRs:

- **Improvement Project (IP)** — _the_ unit. Many per user. The user-facing thing.
- **"Investigation"** — the **activity** done inside an IP (drill, Wall, Evidence Map; the "investigation surface"). **Not an entity** — there is no `Investigation` type in code, and none is introduced.
- **Hub** — the IP's **internal substrate** (dataset, process map, findings, measurement plans). **One Project wraps one Hub, 1:1** (decision-log 2026-05-18); multi-Hub portfolios are deferred to the future **VariScout Process** product. The Hub is internal; the user thinks in Projects.
- **Solo vs collaborative** — a **state** of the IP (has anyone been invited?), not a different entity (§9).

> **Legacy to collapse (IM-0a).** The code still carries 1:many machinery — `ProcessHub.improvementProjects: ImprovementProject[]` (`processHub.ts:154`) and `projectsByHub: Record<hubId, ImprovementProject[]>` — flagged as a holdover by the 2026-05-18 decision. The first prereq (§8 / IM-0a) enforces the 1:1 model and re-keys project-scoped state by `ProjectId`. Hub and IP stay **two entities at a clean 1:1** (Single Responsibility — analytical substrate vs project/lifecycle wrapper; the Hub also holds the deferred VariScout-Process seam). A full Hub→IP merge is a possible future domain-consolidation, not V1.

### What this spec covers

- The investigation spine: Issue → Outcome → **scope (WHERE)** → **causes (WHY)** → contribution → Measurement Plans (§2).
- The entity model: dropping `Question`, making the Problem-Statement scope first-class, retiring the `causeRole` taxonomy (§3, [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md)).
- The unified investigation canvas: one bipartite factor↔hypothesis surface with a Focus lens (§4, [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)).
- Level-native contribution, What-If-anchored (§5, [ADR-088](../../07-decisions/adr-088-level-native-contribution.md)).
- Analysis-surface simplification: retire mode/lens as user axes; Values⇄Capability as the one surviving view; outcome+decomposition (§6, [ADR-089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md)).
- The iterative Measure⇄Analyze loop and the Measurement-Plan-as-DCP (§7).
- The process-step model reconciliation (§8, [ADR-087](../../07-decisions/adr-087-process-step-model-reconciliation.md)).
- Cluster A: Project = collaboration container; optional/non-blocking closure (§9).
- The trust model, open questions, build reality, doc-propagation map, and ADR index (§10–§14).

### What this spec does NOT cover

- Re-litigating settled decisions — the design is closed; this is graduation.
- The CoScout prompt-vocabulary alignment (separate investigation entry).
- The `investigationId` FK-token rename (separate investigation entry; stable token).
- New stats methods — the engines exist; this re-routes and re-projects them.

### Invariants this spec is bound by

| Invariant                                                                                                                     | How it binds this spec                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHERE ≠ WHY**                                                                                                               | Scope (the drilled `{factor=level}` condition) is the WHERE; causes (Hypotheses) are mechanisms nested _within_ a scope (the WHY). They are separate types and never conflated. |
| **Contribution, not causation**                                                                                               | No "root cause" anywhere. The canvas, contribution numbers, and link labels say _contribution / suspected cause / mechanism_ and _support/refute_, never _causes/proves_.       |
| **Distribution, not aggregation** ([ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md)) | No Cpk roll-up across heterogeneous units. Contribution-to-total chains only _within one homogeneous outcome/spec context_. Outcome+decomposition is part-whole only.           |
| **Cp/Cpk only** ([ADR-084](../../07-decisions/adr-084-capability-indices-cp-cpk-only.md))                                     | No Pp/Ppk reintroduced anywhere, including the Values⇄Capability survivor view.                                                                                                 |
| **No method bridges**                                                                                                         | No Lean / Six-Sigma labels in product wording. VariScout-native vocabulary (Frame / Explore / Analyze / Improve / Control; Outcome / Flow / Local).                             |
| **Prefer pragmatic**                                                                                                          | Trust is a soft caveat, not a gate. Op-def + MSA are optional notes. No stability gate.                                                                                         |

---

## §2 · The investigation spine

An investigation is one continuous `y = f(x)` deepened iteratively. Its skeleton is a strict layering, and the WHERE/WHY seam runs straight through the middle:

```
Issue Statement (1)         the felt problem ("late shipments hurt us")
   └─ Outcome Y (1)         the one measured outcome (lead_time)        ── distribution, not a rollup (ADR-073)
        └─ Problem-Statement SCOPE(s)   the WHERE — drilled {factor=level} conditions      ╮
             (MANY; e.g. Machine B ∩ Night)   found by drilling / Progressive Sharpening   │  scope = WHERE
                 └─ Suspected Causes          the WHY — mechanisms (worn spindle, coolant)  │  cause  = WHY
                      (MANY per scope; = Hypothesis in code)                                ╯
                          ├─ contribution (level-native share + What-If)
                          └─ Measurement Plan (a DCP — the data we still need)
```

Two things make this spine the product rather than a diagram:

1. **The drilled condition _is_ the Problem-Statement scope — not a hypothesis.** When an analyst drills to "Machine B on the night shift," they have sharpened _where_ the problem lives, not asserted _why_. Causes (Hypotheses) are then proposed _within_ that scope. `methodology.md` already says it: _"VariScout finds WHERE to focus."_ The rest — the WHY — is further investigation, not a label the tool stamps. (The methodology doc's current "apply Lean to find WHY" line drops the "Lean" bridge per the no-method-bridges invariant; see §13.)

2. **The spine grows.** A scope opens a new _local_ `y = f(x)` (local Y = "outcome | condition"); new causes there may need data the current dataset can't answer; a Measurement Plan captures that need; re-ingest deepens every surface at once (§7). The investigation is a tree that grows, not a single pass.

Everything downstream (canvas, contribution, Measurement Plans, closure) is a projection or consequence of this spine.

---

## §3 · Entity model — drop `Question`, make the scope first-class

**Canonical decision: [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md).**

### §3.1 · Drop `Question` as a tracked entity

The Investigation Wall (Findings + Hypotheses) is the centerpiece. `Question` (`packages/core/src/findings/types.ts:342`) is retired as a tracked entity; its value re-homes:

| `Question`'s role                          | New home                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Generative ("what should we look at?")     | **Factor Intelligence** — ranked factor nodes on the Evidence Map       |
| Completeness ("what haven't we examined?") | **Un-examined-factor nodes** (the `explored?` flag on `FactorNodeData`) |
| Interpretive ("what does this mean?")      | **Finding / Hypothesis**                                                |

This retires the `Question.causeRole?` taxonomy (`'suspected-cause' | 'contributing' | 'ruled-out'`, `types.ts:380`) and the phantom "SuspectedCause" naming. **There is no `SuspectedCause` type** — the first-class cause is `Hypothesis`. (`packages/stores/CLAUDE.md`'s claim that "SuspectedCause is a first-class entity (ADR-064)" is stale and is corrected in the Apply phase.) `causeRole` collapses onto `Hypothesis.status` (`proposed | evidenced | confirmed | refuted | needs-disconfirmation`) + `GateNode` membership.

> **Cascade (atomic).** `Question` is ~550 non-test occurrences across ~153 files (`questionIds` is a _required_ field on the central `Hypothesis` type — `types.ts:740` — plus `checkQuestionIds`, `AnalysisBrief.questions`, `Finding.questionId`, `CausalLink.questionIds`, `WallCanvas.questions`, and the CoScout tool registry). This is a tsc-wide breaking change → ONE Opus dispatch (Architect → Migration → Validator), not split, per the CLAUDE.md atomic-deletion-cascade carve-out. `causeRole` is ~92 occ / 34 files. Non-code surfaces (`packages/data` fixtures, i18n keys, `.vrs` serialization) are in scope.

### §3.2 · `ProblemStatementScope` — the WHERE, first-class

Today the WHERE is scattered across four partial representations and never named: `Finding.context.activeFilters` (a per-finding `Record<col, values[]>`, `types.ts:514`), the transient drill chips (`analysisScopeStore.categoricalFilters`, `analysisScopeStore.ts:14`), the single-factor `ScopeFilter` (`processHub.ts:203`), and a synthesized string (`buildProblemStatement()`, `problemStatement.ts:66`).

Introduce a first-class persisted entity:

```ts
interface ProblemStatementScope extends EntityBase {
  investigationId: string;
  outcome: string; // the Y this scope sharpens
  predicates: ConditionLeaf[]; // the {factor=level} WHERE — reuse the hypothesisCondition leaf shape
  hypothesisIds: Hypothesis['id'][]; // the MANY causes (WHY) nested within this scope
  whatIfProjection?: number; // optional 'if-fixed' overall-impact projection for this scope (§5) — not a variance multiplication
}
```

Three deliberate calls:

- **Encode the WHERE as `ConditionLeaf[]`, not `Record<col, values[]>`.** The leaf shape (`hypothesisCondition.ts:14`) expresses `eq/neq/lt/gt/between/in`; the `Record` form cannot hold the numeric ranges that a brushed I-Chart or probability-plot finding produces (`deriveConditionFromFindingSource` already yields `gte`/`between` leaves). `activeFilters` is converted to predicates at the Finding boundary.
- **Avoid the name collisions.** `ProblemCondition` (`ai/types.ts:31`) already exists — it is the metric/target _HOW-MUCH_ gap, **not** the WHERE. `ScopeFilter` is single-factor. `ProblemStatementScope` is the new, distinct, compound WHERE; the spec states this so neither existing type is silently overloaded.
- **Causes nest under the scope.** `Hypothesis.condition` is _retained_ but demoted to the cause's own disconfirmable HOLDS-claim — it no longer carries the scope's where. The net-new `buildConditionFromCategoricalFilters` bridges drill chips → a compound scope condition (the reverse of the existing capture bridge).

> **Decided — per-scope.** Each `ProblemStatementScope` owns its own `hypothesisIds[]` and its own `GateNode` composition; contribution composes _within_ the scope. This keeps WHERE≠WHY clean and supports many parallel scopes (Machine B∩Night and Line A as separate _where_'s). The investigation-global `problemContributionTree` (`analyzeStore.ts`) is re-homed as per-scope trees; `gateNodeOps.ts` (which already composes many causes) operates per scope.

### §3.3 · The kept graph

Three entities, no `Question`:

- **`Finding`** — an observation with a `context` (the scope it was seen under) and a `findingSource` (the chart it came from).
- **`Hypothesis`** — a suspected cause; carries `condition` (its HOLDS-claim), `status`, `disconfirmationAttempts`, `measurementPlanIds`.
- **`CausalLink`** — a typed edge (`drives | modulates | confounds`; geometric/`relationshipType`, never "moderator/primary"). Its `questionIds` field is dropped with §3.1.

---

## §4 · The unified investigation canvas

**Canonical decision: [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md).**

### §4.1 · One surface, two projections

The Evidence Map (factor-centric — the _muuttuja kartta_) and the Investigation Wall (hypothesis-centric) are **two projections of one `y = f(x)` graph**, presented on a single **bipartite canvas**:

```
   FACTORS (left)                         HYPOTHESES (right)
   ranked, contribution bars              named cards · status color · mini-chart · HOLDS X/Y
   ┌─────────────────┐                    ┌──────────────────────────┐
   │ ▇▇▇▇ spindle 34% │ ── support ──────▶ │ "worn spindle drives Ø"  │  evidence chips D/G/E
   │ ▇▇   coolant 12% │ ╌╌ refute ╌╌╌╌╌╌▶ │   needs-disconfirmation  │
   │ ░░   unexamined  │                    └──────────────────────────┘
   └─────────────────┘
```

- Evidence = **typed support/refute links** between factors and hypotheses. **Refute is visually loud** (count what is inconsistent, not what piles on) — the disconfirmation posture, not a tally of agreements.
- Today these are _two components_ glued by overlay/stacking (`EvidenceMapBase` in `@variscout/charts`; `WallCanvas` in `@variscout/ui`; co-rendered in `LocalMechanismView` and `CanvasWallOverlay`). The unified canvas is a **new bipartite layout** — it re-lays-out factor `x/y` (in `useEvidenceMapData`) and restructures the Wall's river layout. This is net-new, not "assembling primitives."

### §4.2 · Focus lens, not a hairball

Clutter is solved by a **Focus lens**, never a global force-graph:

- **Furnas degree-of-interest dimming + Kumu focus-by-degree:** visible detail ∝ contribution × graph-distance from the **focused hypothesis**.
- **Semantic-zoom LOD:** when zoomed out, **cluster factors into families** while keeping hypotheses individual; **edge bundling** reduces line clutter. This is a _new factor-projection coarsening_ — it does **not** ride the 8f renderer-altitude LOD (`CanvasLevel` l1/l2/l3, `viewport.ts:1`), which swaps whole renderers by zoom and gives us no factor-family clustering.
- **Optional ACH matrix lens** (evidence × hypotheses grid) as a **toggle on the same data** for dense cases — the only justified second view, and it is a toggle, not a split. (Distinct from the existing defect-mode `CrossTypeEvidenceMap` radial — see §4.4.)
- **Mobile = focus-only:** one entity + a ranked linked list.

### §4.3 · Node states + the disconfirmation gate

`FactorNode` already sizes by contribution and greys weak factors (`< 10%`) and dims un-examined ones (`explored === false`). The spec adds a **distinct `ruledOut` flag**: _ruled-out_ is an **analyst decision** (`< 5%`, greyed as decided), distinct from _low-contribution_ (a **statistical** tier). The two must not conflate.

The **disconfirmation gate**: a hypothesis is not `confirmed` until **≥ 2 evidence types** AND a **survived disconfirmation attempt** (`deriveHypothesisStatus`, `survey/wall.ts:24`). The derivation is wired and tested; what is **net-new is the recording UX** — a gesture + a new `HYPOTHESIS_RECORD_DISCONFIRMATION` HubAction (`HypothesisAction` has only ADD/UPDATE/ARCHIVE today) that writes `disconfirmationAttempts[]`. The orphaned `setHubStatus` manual override is either wired to a UI or deleted (pinned in §11).

### §4.4 · The two "Evidence Maps"

There are two components named for evidence maps; the spec keeps them distinct:

- **`EvidenceMapBase`** (`packages/charts/src/EvidenceMap/`, ADR-074 factor network) — **this is the unified-canvas factor projection.**
- **`CrossTypeEvidenceMap`** (`packages/ui/src/components/EvidenceMap/`, radial defect-mode "systemic cause" map) — **not** the unified canvas. With mode dissolving into the Frame (§6), it survives only as a defect-frame view; its fate is to be retained as that frame's view or retired (pinned in §11).

---

## §5 · Level-native contribution

**Canonical decision: [ADR-088](../../07-decisions/adr-088-level-native-contribution.md).**

### §5.1 · Native share per level, routed by Y/X/x

Contribution is **always a native share chosen by the level**, never one universal number:

| Level (`ProcessLevel`) | =   | Native contribution share                                           |
| ---------------------- | --- | ------------------------------------------------------------------- |
| **Outcome (Y)**        | l1  | Cpk vs spec — _is there a gap?_                                     |
| **Flow (X)**           | l2  | step/factor share — η² / Pareto count-% / bottleneck-sec / VA%      |
| **Local (x)**          | l3  | native share for the specific condition — Cpk-per-condition / count |

"Level before mode." `ProcessLevel` (Outcome / Flow / Local = Y / X / x) is a **thin named type mapped onto the existing `CanvasLevel`** (`viewport.ts:1`) — there is no Outcome/Flow/Local concept in code today, only l1/l2/l3 + a `'process-flow'` lens. The intent (NÄHDÄ / VERRATA / KVANTIFIOIDA / AJALLINEN → which native share) is **derived from Frame + level**, not a user-facing picker.

### §5.2 · The engine stays; only the surfaced metric changes

> **Critical guard.** "No bespoke SS-share" means _do not surface a sum-of-squares-% contribution metric to the user_ — it would be more formal than the methodology author's own course. It does **not** mean removing the η² engine: `computeMainEffects` / `getEtaSquared` legitimately use `ssBetween/ssTotal` + F-ratios _internally_ (`factorEffects.ts:121`, `anova.ts:25`) and stay. Distinguish engine-internal math from the user-facing number.

### §5.3 · Three contribution surfaces — none multiplied across levels

A statistical-validity decision (raised in review): **multiplying marginal η² down a drill is not a valid variance decomposition** — that needs nested ANOVA / variance components, the formal machinery the methodology deliberately avoids — and "two conditions ANDed together → one %" reads as confusing. So contribution is shown three ways, kept distinct, and **nothing is multiplied across levels**:

1. **Level-local native share (per lens, valid in its own context).** η² of a factor _in the current view_ / Cpk-per-group / Pareto count-% / regression slope / VA% / bottleneck-sec. Answers "how much _here_?" — each valid for its own subset; none is chained.
2. **What-If "if-fixed" — the cross-level "how much of the problem" anchor (valid + already built).** `computeCumulativeProjection` (`variation/projection.ts:110`) chains `simulateOverallImpact` (`simulation.ts:285`) over scoped fixes → a projected overall Cpk: _"bring Machine B∩Night up to the rest and overall Cpk moves 0.7 → 1.2."_ This is a **simulation**, not a variance-decomposition claim — honest, actionable, unit-safe. Net-new work = binding it to the live drill chip (today keyed on `Finding.activeFilters`); the engine is reused, not rebuilt.
3. **Descriptive coverage (optional, clearly-labelled prevalence).** "This condition holds _N%_ of the units / _X%_ of the defect count." A count/coverage fact, not an inferential share — no validity claim. For "do these factors _together_ explain the spread," the honest number is the **R²adj of the combined model** (`computeBestSubsets`), a real model R² — not a chain.

**The eda-mental-model §3.3 "cumulative-variation bar" is reinterpreted** as the What-If if-fixed projection (or the coverage %), banded blue/amber/green — _not_ a multiplied-η² chain. The §3.3 doc is updated to match (§13). **Not** `computeCoverage.exploredPercent` (`bestSubsets.ts:1137`) — that is exploration coverage, a different quantity.

**Guard:** every cross-level number (What-If, coverage) stays **within one homogeneous outcome/spec context** (ADR-073) — no Cpk roll-up across heterogeneous units. Avoid forbidden aggregation names (`architecture.noCrossInvestigationAggregation.test.ts`); respect `scripts/check-level-boundaries.sh` (ADR-074).

---

## §6 · Analysis surfaces — retire mode/lens as user axes

**Canonical decision: [ADR-089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md).**

### §6.1 · The model: measure + factor → always-on charts + drill

The user picks a **measure (Y) + factor(s)**; the four charts (I-Chart / Boxplot / Pareto / Stats) are **always shown** (Explore = grid; mobile = carousel) + drill. "Level" = which measure (global vs step-local). "Mode" = data shape. "Lens" = the chart set.

- **`AnalysisMode` (`standard | performance | defect`) is retained — but as a Frame-derived data-shape discriminant, not a user axis.** It is set automatically at Frame/setup time (`performance` = wide-channel transform; `defect` = `computeDefectRates` transform); there is **no mode picker**. This is a doc/UX reframe, **not a deletion cascade** — `resolveMode`/`getStrategy` and the ~45 referencing files stay. `capability` is **never** an `AnalysisMode` value (it is a derived `ResolvedMode` from `StandardIChartMetric === 'capability'`).
- **The four CHANGE/FLOW/FAILURE/VALUE lenses are pedagogy only** — no type, no picker (already shipped reality). _Do not_ touch the unrelated live `ProcessStateLens` or `TimeLens` types.

### §6.2 · Values ⇄ Capability — the one surviving view

The genuine survivor is **Values ⇄ Capability**: a specs-gated distinct **view** (the `StandardIChartMetric` toggle, [ADR-038], per-subgroup Cp/Cpk **stability** — "don't Pp on my Cp"). It is explicitly **not a lens and not an `AnalysisMode`**. Engine: `calculateSubgroupCapability` + `SubgroupConfig` (`method: 'column' | 'fixed-size'`, default `n=5`, min `2`; `subgroupCapability.ts`). Cp/Cpk only (ADR-084) — the survivor view never reintroduces Pp/Ppk.

### §6.3 · Outcome + decomposition (the bottleneck view)

A Frame-aware pairing: **I-Chart = framed outcome** (e.g. `lead_time`, L1) while **Boxplot = framed per-step measures by step** (e.g. `cycle_time` by step, L2) — `lead_time = f(step cycle_times)`, the L1+L2 bottleneck view.

- **Net-new: per-chart measure binding.** Today the Dashboard reads ONE shared `outcome` string (`Dashboard.tsx:216`) feeding all four charts. The data model already supports per-chart binding (`outcomeGoals[].stepId` + `ProcessMapNode.ctqColumn`); the render layer does not. This touches the shared-Y reverse-mirror (`Dashboard.tsx:465-478`) — judgment-heavy multi-file integration.
- **Part-whole only (ADR-073).** Related, Frame-derived measures are supported; **two unrelated Ys** (lead-time + defect-rate) are forbidden and stay separate investigations — they cannot share a coverage/contribution bar.

`#11` (Analyze-tab) and `#51` (Phase-2 bidirectional cross-filter) fall out of Cluster C: drop-Question + Wall-centric + drill-to-condition, where condition = scope, so bidirectional cross-filtering is the same object viewed from each side.

---

## §7 · The iterative Measure⇄Analyze loop — Measurement Plan = DCP

The investigation is iterative: drill → isolate a condition → spawn new hypotheses → the current data can't answer them → **collect additional data** → re-ingest → continue. The Measurement Plan is the first-class "data we still need" node.

### §7.1 · Measurement Plan = a Data Collection Plan

The current `MeasurementPlan` (`measurementPlan/types.ts:15`) carries only `{hypothesisId, factor, method, sampleSize, owner, status, linkedFindingIds?, msaRequired?}`. The settled DCP shape:

```ts
interface MeasurementPlan extends EntityBase {
  hypothesisId: Hypothesis['id']; // hypothesis-exclusive (see §11)
  outcome: string; // Y
  primaryFactor: string; // (renamed from `factor`)
  neededFactors: string[]; // stratifiers — captured alongside, NOT folded into primaryFactor
  sampleSize: number;
  method: MeasurementMethod;
  owner: ProjectMember['id'];
  status: MeasurementPlanStatus;
  scope: ConditionLeaf[]; // the {factor=level} WHERE (distinct from the cause)
  processLocation: string; // stepId join key — resolves against the canonical step model (§8)
  opDef?: string; // optional operational-definition note (not a 5-point maturity test)
  msaNote?: string; // optional MSA/Gage-R&R comment (not a boolean, not a gate)
  linkedFindingIds?: Finding['id'][];
}
```

**Trims:** `msaRequired: boolean` is removed (MSA = optional free-text `msaNote`, never a gate); **no randomized-order field** (VariScout is not a DOE tool). `neededFactors[]` is the DCP's "stratification / Where?" question — capturing the relevant accompanying factors (`nozzle_type`, `batch`, `temp`, `humidity`) so the data is analyzable (rule out confounds, find interactions, enable drill).

### §7.2 · Auto-link engine + re-load cascade (net-new)

- **Auto-link** is aspirational today (a manual 3-step picker). The engine: re-ingest → detect new column → generate a Finding → match by factor name (column overlap) → link to the Plan → progress its status. Matching reuses the column-overlap join (`conditionReferencesStep`, `getStepColumnAssignments`).
- **Re-load cascade.** `mergeRows`/`mergeColumns` mutate only `rawData` + re-validate; they never re-evaluate Findings/Hypotheses/conditions/plan-links. Append silently preserves without rematching; replace would orphan. The cascade re-evaluates scope/findings/hypotheses against new data. Pin append (preserve + rematch) vs replace (re-evaluate) semantics precisely.
- **Growth payoff:** on re-ingest all the `neededFactors[]` columns land at the step at once (via `processLocation`) → the local _muuttuja kartta_ gains several `x`'s together → drill across them to find the interaction. The local map / Wall / η² **populate automatically** via the column-mediated binding — the cascade is concentrated at the join (the auto-attach + the Finding auto-link); the L3 recursion comes for free.

---

## §8 · Process-step model reconciliation (the prereq)

**Canonical decision: [ADR-087](../../07-decisions/adr-087-process-step-model-reconciliation.md). This gates the growth/join logic (§7); it is the second prereq build (IM-0b), after the Project↔Hub 1:1 collapse (IM-0a, §1).**

There are **three step homes**, not two:

1. **Rich, canonical:** `ProcessContext.processMap?: ProcessMap` (`ai/types.ts:142`, Hub-owned, persisted per ADR-070). `ProcessMapNode` carries `parentStepId`, `ctqColumn`, `capabilityScope`, tributaries — everything the join and L2/L3 recursion need.
2. **Working-copy projection:** `canvasStore.canonicalMap` (`canvasStore.ts:13`), hydrated from #1.
3. **Flat, separate:** `IP.processSteps: ProcessStepEntry[]` (`improvementProject/types.ts:161`), referenced by `stepTimings.stepId`, `goal.outcomeGoals[].stepId`, `goal.factorControls[].stepId`.

There is **no sync code** between #1 and #3 (grep returns zero); the IP's `goal.stepId` references the map on its 1:1 Hub (`ProcessContext`, §1), not on the IP record itself. Two ID schemes diverge (`step-${slug}-${seq}` vs `step-${columnName}-${idx}`) → a silent orphaning risk for persisted `goal.stepId`.

**Decisions:**

- The **rich `ProcessMap` is canonical** and stays **Hub-owned on `ProcessContext`** — and since one Project wraps one Hub 1:1 (§1), Hub-owned _is_ Project-owned.
- **Flat `IP.processSteps` becomes a derived projection** of `map.nodes {id,name,order}`; consumers repoint to the projection.
- **Unify on one step-ID scheme** with a **no-data-migration IDB version bump** (wedge "no migration, no users" stance — no `migrateX()` helper). The orphaning risk is acceptable pre-launch; state it.
- Add the **`processLocation` (stepId) join key** (used by the DCP, §7) resolving against the canonical node id.
- Move rich-map authoring (`ctqColumn` / `capabilityScope` / tributaries) **off the deprecated `ProcessMapBase`** into `canvasStore` actions + Canvas Edit-mode UI; wire `onFactorControlAdd` (currently `undefined`).
  <!-- STALE as of IM-0b / IM-0b-2 (2026-05-30): onFactorControlAdd was already wired in IM-0b. IM-0b-2 moved ctqColumn / tributaries / subgroupAxes / hunch authoring into canvasStore (ProcessMapBase dispatches; second persistence path retired). Per-step `capabilityScope` (SpecRule[]) authoring was DEFERRED to the IM-5/IM-6 holistic design — the per-step specs editor still routes to project-wide `measureSpecs` via `setMeasureSpec`. Full visual retirement of ProcessMapBase also deferred (now a thin dispatcher). See investigations.md "IM-0b-2 deferrals". -->
- Resolve the contradictory doc comments (`types.ts:52` vs `:166`) to state exactly what `stepId` resolves against.

> Cascade is concentrated on the small flat-model side (~9 files + ~6 `ProcessStepEntry` consumers + tests); the rich-map surface (~53 files) stays canonical and is not churned. `capabilityScope` is per-step — preserve per-step capability, introduce no roll-up across steps (ADR-073).

---

## §9 · Cluster A — Project = collaboration container

The "quick-analysis vs Project" duality collapses: there is **one entity, the Improvement Project (IP)** (§1), and "investigation" is the activity inside it. **Inviting people is the trigger** that turns a solo IP into a collaborative one (→ Azure features). A solo user who names/saves/closes/reports but never invites has a **solo (un-shared) Improvement Project** — still an IP, just not collaborative; the full solo flow (lifecycle Approach→Control + Cpk verify + Report) lives in the **PWA**. Only collaboration + cloud + CoScout + audit are Azure. No Charter ceremony (already gone — decision-log 2026-05-28).

### §9.1 · The invite-trigger needs a durable marker (net-new)

Every saved unit is an `ImprovementProject` (`status: draft | active | closed`); there is **no solo-vs-collaborative signal at all**. **Decided:** an invite **adds the member immediately** (current `PROJECT_MEMBER_ADD` — simple, and in a single Azure AD tenant the invitee is already a colleague) **and sets a durable `collaboratedAt` marker** on first invite. That marker — not a derived `members.length > 1` (which would flip back to solo if a member is removed) — gates the Azure-only surfaces. `isPaidTier()` is **fully deleted** (0 refs; the MEMORY/decision-log "signoff gated by isPaidTier" note is stale), so collaboration-gating rests on `collaboratedAt`, not a tier flag. The formal pending-`Invitation` + accept flow (the wired-but-unused `INVITATION_ACCEPT`) is the natural **VariScout Process** upgrade, not V1.

### §9.2 · Closure (#12) — optional, non-blocking, hidden solo

`ImprovementProjectSignoff` (`requestedAt`/`approvedAt`/`approvedBy`) is retained but reshaped:

- **Optional + non-blocking** — never a hard gate; _not_ a prerequisite to "close."
- **Hidden when solo** — gated by the §9.1 predicate; the PWA `ProjectsTabView` does not expose it.
- **Decoupled from `processOwner`.** Today `canApprove = pendingSignoff && Boolean(activeHub?.processOwner)` and the approver is hard-bound to `activeHub.processOwner` in both apps. The new gating is collaboration-based, not processOwner-based.
- **Reconcile the two signoff surfaces** — `IP.signoff` (`IPDetailTeamRail`) vs `ControlHandoff.signoff` (`CONTROL_HANDOFF_SIGNOFF`). Pick one canonical closure path (pinned in §11).
- **Sponsor stays an identity/notification label, not an ACL boundary** — `ROLE_PERMISSIONS` keeps `member === sponsor`; no `approve-*` action. The personas/ia-nav "gatekeeper/approval-gate" wording is stale and is corrected (§13).

A new **L2 #37 "Mode-1 solo-investigation" journey** documents the full PWA solo flow (no signoff, no invite).

---

## §10 · Trust model — soft caveat, not a gate

Operational-definition and MSA/Gage-R&R are **optional free-text notes** (`opDef?`, `msaNote?` on the Plan) surfaced beside the contribution. **No stability gate** — in EDA you investigate _because_ the process is unstable; instability (special causes / sub-populations) **is** the signal you drill into. Gating on stability would block the exploration. Contribution on un-validated data is _caveated_, never _blocked_. Per the prefer-pragmatic invariant.

---

## §11 · Open questions (carried as investigation entries)

1. **Overlap apportionment** when two hypothesis conditions share rows (coverage double-counts).
2. **Measurement-Plan hypothesis-exclusivity** — confirm a plan always requires a `hypothesisId` (no plan on a bare condition). The current type makes `hypothesisId` required + immutable; confirm this is intent.
3. **Freeze vs auto-sync** a hypothesis's condition at capture (lean: freeze + allow refine).
4. **`setHubStatus` fate** (§4.3) — wire a manual-override UI or delete the orphan.
5. **`CrossTypeEvidenceMap` fate** (§4.4) — retain as a defect-frame view or retire.
6. **Two signoff surfaces** (§9.2) — `IP.signoff` vs `ControlHandoff.signoff`; pick canonical.

These do not block the spec; they are resolved per-PR at execution and graduate to the decision-log when locked.

---

## §12 · Build reality & net-new

**~70% built.** Reusable: the `MeasurementPlan` primitive (wired end-to-end through `AddPlanForm`/`HypothesisCardWithPlans`/HubRepository + a dedicated Dexie table); the per-step local `y=f(x)` (`LocalMechanismView` = local Evidence Map + local Wall + η²); `HypothesisCondition` + HOLDS evaluator; drill chips (`analysisScopeStore`); the river Wall (`AnalyzeWall/`); the What-If chain (`computeCumulativeProjection`); the disconfirmation _derivation_; the 2-tier ACL; the Values⇄Capability engine.

**Net-new (the build list):**

| #   | Net-new work                                                                                                                                                                    | ADR                | Depends on        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------- |
| 0   | **Project↔Hub 1:1 collapse** — retire `improvementProjects[]` + `projectsByHub`; re-key project-scoped state by `ProjectId`; one Hub per IP (no `migrateX`)                     | dec-log 2026-05-18 | — (prereq, IM-0a) |
| 1   | Step-model reconciliation: rich-map canonical, flat→projection, one ID scheme, `processLocation`, authoring off `ProcessMapBase`                                                | 087                | — (prereq)        |
| 2   | Drop `Question`; `ProblemStatementScope` first-class; retire `causeRole`; `buildConditionFromCategoricalFilters`                                                                | 085                | — (atomic)        |
| 3   | Measurement-Plan-as-DCP fields (`outcome`/`primaryFactor`/`neededFactors[]`/`scope`/`processLocation`/`opDef`/`msaNote`; drop `msaRequired`)                                    | 085/087            | 1, 2              |
| 4   | Auto-link engine + re-load cascade (re-ingest → detect → Finding → match → link → progress)                                                                                     | —                  | 3                 |
| 5   | Unified bipartite canvas + Focus lens + factor-family LOD + edge bundling + ACH toggle + `ruledOut` flag + disconfirmation-recording UX (+ `HYPOTHESIS_RECORD_DISCONFIRMATION`) | 086                | 2                 |
| 6   | `ProcessLevel` mapping + contribution-to-total + cumulative-variation bar + What-If→drill-chip binding                                                                          | 088                | 1, 2              |
| 7   | Per-chart measure binding (outcome+decomposition); retire mode/lens picker; Values⇄Capability reframe                                                                           | 089                | 6                 |
| 8   | Cluster A: invite-trigger predicate; optional/non-blocking closure; Azure-gate signoff; #37 journey                                                                             | —                  | —                 |

---

## §13 · Doc-layer propagation map

Per SDD, this spec's `implements:` clause obliges amending the doc layers. Each change site is classified **drift-now** (pre-existing, safe to fix on main independent of the build) or **apply-phase** (lands with the PR that implements it, so docs never describe unbuilt behavior).

### L1 · Vision

| Doc                   | Site                                                                        | Change                                                                                                                                                                                                                                                                                                                                             | When                                         |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `methodology.md`      | `:34` "apply Lean to find WHY"                                              | Keep WHERE≠WHY; drop the "Lean" bridge → "apply further investigation to find WHY".                                                                                                                                                                                                                                                                | apply-phase (085)                            |
| `methodology.md`      | `:340` "One Graph, Three Projections" (names `SuspectedCause` + `Question`) | Collapse to **two** projections (Evidence Map + Wall) over Finding+Hypothesis+CausalLink; drop `SuspectedCause`/`Question`.                                                                                                                                                                                                                        | apply-phase (085)                            |
| `methodology.md`      | `:312-326` "Analysis Modes"                                                 | Reframe mode → Frame data-shape + Values⇄Capability view.                                                                                                                                                                                                                                                                                          | apply-phase (089)                            |
| `eda-mental-model.md` | §2.4, §3.2, §4.x, §7 (built _on_ the Question framework)                    | **Supersession banner + re-home map** (not a 706-line re-spine): point to this spec as canonical for the entity model; map Question → {Factor Intelligence / un-examined factors / Finding+Hypothesis}. Remove stale Yamazumi-as-live-mode (§7); reinterpret §3.3's cumulative-variation bar as the What-If / coverage anchor (not multiplied-η²). | apply-phase (085/089)                        |
| `positioning.md`      | §3.4/§4/§7 Sustainment; §5.2 Question-tree                                  | Sustainment→Control (laggard); drop Question-tree status machine.                                                                                                                                                                                                                                                                                  | drift-now (Control) / apply-phase (Question) |

### L2 · Journeys

| Doc                            | Site                                            | Change                                                                                                                                                                           | When                |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `ia-nav-model.md`              | `:51-52` "Sign-off gates … live here"           | The #12 closure call **overrides** the gate wording → "optional, non-blocking sign-off (Azure collaboration affordance; hidden solo)". _Straddles_ drift/design — lands with §9. | apply-phase (A)     |
| `ia-nav-model.md`              | `:81` "IPs are created via Charter ceremony"    | Project = collaboration via invite; no Charter ceremony.                                                                                                                         | apply-phase (A)     |
| `personas/sponsor.md`          | `:19,:51,:58` "approval gate / gatekeeper"      | De-gatekeeper: Sponsor is identity/notification, not an ACL boundary. (The doc already says signoff is out-of-band at `:58` — resolve the self-contradiction.)                   | drift-now (wording) |
| `personas/lead.md`             | `:55` "Elevate work into a Project via Charter" | Project = collaboration via invite.                                                                                                                                              | apply-phase (A)     |
| **NEW** `personas/` or journey | #37 Mode-1 solo-investigation journey           | Author the full PWA solo flow (no signoff, no invite).                                                                                                                           | apply-phase (A)     |

### L3 · Features

| Doc                                               | Site                                                                | Change                                                                                                                              | When                  |
| ------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `workflows/analyze-wall.md`                       | `:19,:70` graph naming + Question-framework row                     | Two projections; drop `SuspectedCause`/`Question`.                                                                                  | apply-phase (085)     |
| `workflows/control.md`                            | title + body "Sustainment Phase" / Charter→Approach→**Sustainment** | Retitle "Control Phase"; presentation-only rename (keep code identifiers per Task #40).                                             | drift-now             |
| `analysis/subgroup-capability.md`                 | `:22` stray "Pp/Ppk" mention                                        | Fix-at-the-seam: remove Pp/Ppk (ADR-084) while this is the Values⇄Capability home.                                                  | drift-now             |
| **NEW** `03-features/.../evidence-map.md`         | — (only an archived spec exists)                                    | Create the L3 Evidence-Map (muuttuja kartta) feature doc; disambiguate the two Evidence Maps.                                       | apply-phase (086)     |
| **NEW** `03-features/.../measurement-plan-dcp.md` | —                                                                   | Create the L3 Measurement-Plan-as-DCP doc (full field list; `neededFactors[]` plural; `processLocation` join; op-def/MSA optional). | apply-phase (085/087) |

### L4 · Engineering

| Doc                         | Site                                                           | Change                                                                                                           | When                    |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `mental-model-hierarchy.md` | `:120-128` Performance/Yamazumi/Capability as "Analysis Modes" | Highest-priority mode-reframe: modes dissolve into Frame; Capability is the one _view_; remove Yamazumi-as-mode. | apply-phase (089)       |
| `mental-model-hierarchy.md` | `:84,:176` `SuspectedCauseHub` + Question tree                 | Re-home to Hypothesis + `ProblemStatementScope`.                                                                 | apply-phase (085)       |
| `packages/stores/CLAUDE.md` | "SuspectedCause is a first-class entity (ADR-064)"             | **Stale — correct it:** there is no `SuspectedCause` type; the first-class cause is `Hypothesis`.                | drift-now (stale claim) |

### L5 · ADR amendments

- **ADR-038** — calls capability "a capability mode" and references Pp/Ppk in its Context. Amend: capability is a **view**, and Pp/Ppk is gone (ADR-084). | apply-phase (089)
- **`question-driven-analyze.md`** (L3, not in the original scope list) is a major Question-centric dependent — flagged so the drop-Question cascade does not undercount it.

---

## §14 · ADR index

| ADR                                                                            | Title                                                           | Scope                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------ |
| [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md) | Drop `Question`; Problem-Statement scope first-class            | Entity model — the WHERE≠WHY surgery |
| [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)          | Unified investigation canvas (bipartite + Focus lens)           | Canvas / UI architecture             |
| [ADR-087](../../07-decisions/adr-087-process-step-model-reconciliation.md)     | Process-step model reconciliation (rich `ProcessMap` canonical) | Data model — the prereq              |
| [ADR-088](../../07-decisions/adr-088-level-native-contribution.md)             | Level-native contribution (Y/X/x; no SS-share)                  | Stats / contribution                 |
| [ADR-089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md)            | Retire mode/lens user axes; Values⇄Capability as the one view   | Analysis surfaces                    |

---

## §15 · Delivery

Sequenced by the companion master plan (`docs/superpowers/plans/2026-05-29-investigation-surface-master-plan.md`) at PR granularity (IM-0a, IM-0b, IM-1…IM-7), subagent-driven, per-PR sub-plans written as-you-execute. Each PR's Apply phase lands its §13 doc amendments. Build halts at plan-ready for ADR review before IM-0.
