---
tier: stable
purpose: orient
title: 'Three-level methodology — Outcome / Process Flow / Local Mechanism'
audience: human
category: methodology
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/01-vision/methodology.md
  - docs/archive/specs/2026-04-29-multi-level-scout-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
layer: L1
---

# Three-level methodology — Outcome / Process Flow / Local Mechanism

> **Status: named-future capture (methodology shared with V1; persona-aware layering is Process scope).** The three-level methodology is the substrate for both products. What's named-future is the persona-aware layering: in Process, each level has a primary persona that consumes it; in V1, one Specialist persona reads all three levels.

## §1 The three levels

Every process is read at three levels simultaneously. The levels are different shapes of question about the same process; they share one map but reveal different cognitive surfaces.

| #   | Level                | What it answers                                                                                                                                      | Captured as                                                         |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **System / Outcome** | What the customer or business must experience.                                                                                                       | Outcome distribution + Cpk vs spec + drift, at L1 on the canvas     |
| 2   | **Process Flow**     | The sequence and topology of steps that produce the outcome — what flows through which steps, at what rate, with which waits, handoffs, bottlenecks. | The canonical map (DAG) of process steps, at L2 on the canvas       |
| 3   | **Local Mechanism**  | The inputs, settings, materials, environment, operator, and per-step measurements that drive each step. The physics and the recipe.                  | Per-step factor analysis + Hypothesis evidence, at L3 on the canvas |

The three levels are **orthogonal to the analysis modes** (Capability / Performance / Yamazumi / Defect / Process Flow). A user can read at any level in any mode; the level is which slice of the process you're scanning, the mode is which analytical lens you apply.

## §2 Level × primary persona (Process-scope mapping)

In V1, one Specialist persona reads all three levels — they monkey-bar between L1 outcome scans (for context), L2 step navigation (to choose where to investigate), and L3 mechanism work (where their primary effort lives). The single-persona V1 design intentionally collapses the persona × level grid.

In Process, the levels acquire **primary persona affinities**:

| Level                    | Primary persona                                         | Default reading shape                                                                               |
| ------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **L1 — Outcome**         | Process Owner (monitoring) + Leader (portfolio)         | "Is this process meeting its outcome target? What's drifting?" Cadence-shaped, decision-oriented.   |
| **L2 — Process Flow**    | Process Engineer (authoring) + Process Owner (scanning) | Process Engineer maintains the canonical map; Process Owner scans state badges per step at cadence. |
| **L3 — Local Mechanism** | Specialist (analyzing)                                  | Where the EDA work happens. Hypothesis-driven, evidence-collecting, Findings-producing.             |

A given person may operate at multiple levels — a Process Owner who personally investigates a finding zooms into L3, a Specialist who needs context for their L3 work zooms out to L1. The affinity assigns the **default** view for each persona on a given level.

This persona × level grid is the conceptual core of the Process product. V1 doesn't implement it because V1 has one persona.

## §3 Watson invariants — methodology rules that hold across both products

These methodology rules are enforced in the engine and taught in the UI. They're invariants — they hold regardless of product (V1 or Process) and regardless of level (L1 / L2 / L3).

### §3.1 No statistical rollup across heterogeneous units

Capability, defect rates, and trend metrics are computed per `(node × context-tuple)`. The canvas's branch / join + context-propagation model makes this structural — heterogeneous siblings cannot be silently averaged. Per [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md).

**Why.** A Cpk of 1.0 against `[349, 359]` (12 oz fill) and a Cpk of 1.0 against `[468, 478]` (16 oz fill) live on unrelated physics. Averaging or min-collapsing them yields a number no Master Black Belt can interpret. The same prohibition holds across machines, lines, shifts, suppliers, paint classes, or any other dimension that resolves to a different `SpecRule`.

**How it shows up in Process.** The Hub-of-hubs portfolio view ([hub-portfolios.md §3](hub-portfolios.md)) renders child Hub miniatures side-by-side; each child computes locally; no `meanCpkAcrossHubs()` exists. The Process Owner's monitoring dashboard ([monitoring.md](monitoring.md)) surfaces per-Hub drift indicators; no cross-Hub summary metric.

**Structural absence enforcement.** The engine exposes no function that collapses Cp/Cpk across investigations, Hubs, or context-tuples with heterogeneous specs. The rule holds by structural absence — the unsafe operation does not exist to be misused.

### §3.2 Contribution, not causation

EDA reveals factors that **contribute to** variation; it does not prove causality. The product's language stays in contribution terms ("explains 23% of variation"), never in causal claims ("X causes Y"). CoScout coaching enforces this. Pre-commit ESLint enforces this.

The Six Sigma "root cause" framing is replaced with **contribution** / **suspected cause** / **mechanism**. The "suspected cause" terminology is V1's surface vocabulary; it persists into Process unchanged.

### §3.3 Observed vs expected — the universal lens

Every analysis answers: _is what we see different from what we expected?_ This shared structure (observed value compared to a model of expected value) underlies chi-square, regression, ANOVA, and capability indices.

The product commits to making this lens explicit in coaching. When a chart surfaces an anomaly, the explanation says _"observed X vs expected Y; difference is significant by Z"_ — not just "anomaly detected." This is a universal lens that operates identically across V1 and Process.

### §3.4 Sample-size honesty

- Cpk is **suppressed for n < 10** (deterministic refusal, not a hint).
- Cpk is **badged "trust pending" for n < 30**.
- Trust is a first-class card overlay, not a footnote.

In Process, sample-size honesty becomes visible at additional surfaces — Hub-overview cards inherit the same trust badging; PMS Signal Cards inherit the same refusal at n<10. The Survey readiness check ([measurement-system.md §6](measurement-system.md)) institutionalizes this discipline at the cadence layer.

### §3.5 Target-relative Cpk grading

Cpk grades band against the **user-set target** (default 1.33), never against literature constants (1.67 / 1.33 / 1.00). `statusForCpk` is the one source of truth.

This is per-Hub configurable in Process — different processes have different capability targets (a medical-device fill line aims higher than a sandwich-factory fill line). The Process Engineer per Hub may set the `targetCpk` once during canonical-map authoring; the UI honors it across all per-Hub renderings.

### §3.6 Geometric interaction language

Two-factor interactions are described in **geometric terms** (ordinal / disordinal / parallel) and their effect on Y. The product never assigns "moderator" or "primary" roles to one factor over another — that's a causal claim VariScout doesn't make.

Pre-commit ESLint enforces this. Holds across V1 and Process.

## §4 The five response paths (pre-wedge) → three (V1) → ?

The pre-wedge VariScout vision named five response paths for any current state of any step:

1. Quick action
2. Focused investigation
3. Charter (formal Improvement Project)
4. Sustainment
5. Handoff

V1 reduced to **three canvas response paths** (Capture as Finding, Investigate, Charter), with Sustainment auto-firing per [ADR-080](../../07-decisions/adr-080-sustainment-auto-fire-pattern.md) and Handoff folded into Sustainment closure.

**Process likely re-expands.** The original five-path framing serves multi-persona reality better than three. Specifically:

- **Handoff** as an explicit response path matters when work crosses persona boundaries (Process Engineer hands off a mechanism finding to a Specialist; Specialist hands off a sustained improvement to a Process Owner).
- **Sustainment as an explicit user choice** (not auto-fire) matters when the Process Owner is doing cadence review and consciously deciding "this capability is fine; schedule the next review."

Whether Process re-expands to five paths or stays with three + auto-firing for some paths is a Process-era design decision. The pre-wedge five-path design is preserved here as the starting point for that future conversation.

## §5 The investigation lifecycle (project-bounded)

Within any one Improvement Project, the investigation traces this lifecycle:

1. **Frame.** Author / inherit the canonical map. Set CTQ specs. Identify the outcome measure(s). (V1: this is the Process tab Edit mode + Charter; Process: same, with the Hub's canonical map as starting point.)
2. **Scout.** Read Current Process State at L1, identify where to investigate. (V1: per-project state; Process: cadence-driven Current Process State from PMS.)
3. **Investigate.** L3 mechanism work — Hypotheses, Findings, factor analysis on the Investigation Wall + Evidence Map.
4. **Improve.** Action authoring + tracking. Capture as Finding observations or improvement-project-scoped change packages.
5. **Sustain.** Did it work? Schedule cadence to verify it stays so.

This lifecycle is **shared across V1 and Process**. The wrapping context differs (V1: project as primary; Process: project nested under a Hub on a cadence-review surface), but the methodology is identical.

## §6 Multi-level navigation as canvas pan/zoom

The three levels are **expressed as pan/zoom** on the canvas, not as a separate picker. ADR-074 locked this — the canvas is the viewport surface; level changes happen via pan/zoom; owner-surface components render at each level.

- L1 outcome view (zoom out): outcome distribution + Cpk vs spec + drift + time series.
- L2 process flow view (zoom out → middle): full process map with step cards, mini-charts on steps, state badges.
- L3 focal step view (zoom in): focal step detail + Evidence Map / Wall mirror for that step's investigation.

ADR-074 also locked the boundary policy: **owner surfaces own their level**. The Investigation Wall owns L3 mechanism work; the canvas embeds the Wall at L3 rather than reimplementing hypothesis-card rendering. SCOUT (multi-level dashboard) owns L1; the canvas embeds the L1 dashboard at L1. The architecture protects against the "every surface becomes a dashboard" failure mode.

This is shared across V1 and Process. In Process the canvas pan/zoom traverses an additional outer level (Hub portfolio above L1) and additional inner levels (recursive sub-flows below L2 — Drill C per [hub-portfolios.md §4.3](hub-portfolios.md)).

## §7 The locality rule and the canvas's role

The methodology floor is the **locality rule**: capability indices computed against different specs cannot be combined arithmetically. The canvas's branch / join + context-propagation model honors the locality rule structurally:

- **Branch.** When a parallel sub-step diverges from upstream, downstream analysis automatically groups by upstream origin.
- **Join.** When parallel sub-steps converge, the joined-into step's analysis is automatically grouped BY upstream origin. ADR-073 enforced structurally — context follows the path.

This means **the user cannot accidentally roll up across heterogeneous specs** by navigating the canvas. The default visualization at every join is per-origin distribution; no `meanCpkAcrossPaths()` exists.

In Process, the locality rule extends to the Hub-of-hubs view — child Hubs render side-by-side; the parent never produces a single statistical metric across them. The cross-Hub context filter chip strip is a parameter that propagates to each child Hub's local computation, not an aggregation.

## §8 Cross-references

- The canonical statement of the three levels is in [`docs/01-vision/methodology.md`](../methodology.md) lines 76-100 (the original methodology doc, pre-wedge).
- The multi-level surface architecture (how the levels become navigable in software) is in [Multi-level SCOUT design](../../archive/specs/2026-04-29-multi-level-scout-design.md).
- The level × owner-surface boundary policy is [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).
- The locality-rule + structural-absence enforcement is [ADR-073](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md).
- The PMS layer that operationalizes the methodology at cadence is [measurement-system.md](measurement-system.md).
- The persona-aware default landings per level live in [four-personas.md §5](four-personas.md).
