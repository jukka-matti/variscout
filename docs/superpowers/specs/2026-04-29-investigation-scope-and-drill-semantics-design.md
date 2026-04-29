---
title: Investigation Scope and Drill Semantics
audience: [product, designer, engineer, analyst]
category: design-spec
status: stable
related:
  [
    process-hub,
    production-line-glance,
    layered-process-view,
    methodology,
    evidence-sources,
    process-learning,
  ]
date: 2026-04-29
---

# Investigation Scope and Drill Semantics

## §1 Context

VariScout's process-learning operating model commits to one Watson invariant
above all others: capability indices computed against different specs cannot
be combined arithmetically. A Cpk of 1.0 against [349, 359] (a 12 oz fill
target) and a Cpk of 1.0 against [468, 478] (a 16 oz fill target) live on
unrelated physics; averaging or min-collapsing them yields a number no Master
Black Belt can interpret. The same prohibition holds across machines, lines,
shifts, suppliers, paint classes, or any other dimension that resolves to a
different `SpecRule`. This is the locality rule — the methodological floor
that the rest of the design rests on.

Two paths exist to honor that rule. The first is to engineer a permission
predicate (a `processFamily` taxonomy, a `canAggregate(a, b)` function, a UI
checkpoint that warns when an aggregation looks unsafe). The second is to
remove the unsafe primitive from the engine: do not expose any function that
collapses Cp/Cpk across investigations, hubs, or context-tuples with
heterogeneous specs. The locality rule then holds by **structural absence** —
the unsafe operation does not exist to be misused.

The April 28 brainstorm session ([source plan]
(/Users/jukka-mattiturtiainen/.claude/plans/we-just-implemented-phase-delightful-adleman.md))
locked the second path. The reasoning is captured in
`feedback_aggregation_heterogeneous_specs.md`: the heterogeneous-physics
hazard exists wherever specs differ, even within a single investigation, and
the only categorically safe primitive is the per-step distribution. The
visualization that replaces aggregation is a **per-step Cpk boxplot**: each
step contributes a box (or dot when N is small) representing the local Cpks
across the context-tuples the data exposes. Side-by-side comparison is
visual; the analyst's eye does the pattern recognition; no arithmetic spans
heterogeneous physics.

This spec captures the consequences of that locked decision for the
Investigation entity, the drill-down navigation patterns that connect a hub
to its analytical surfaces, the spec-rule lookup model that supports
multi-product / multi-supplier reality, the cross-hub view that global
process owners need, and the governance discipline that keeps a hub's
canonical map coherent over time.

## §2 Investigation scope model

A VariScout investigation describes one analyst's structured engagement with
a dataset. Historically, an investigation carried one global specs singleton
(USL/LSL/target) for one outcome column. That shape worked for a single
deep-dive on one machine but broke the moment a single dataset described
multiple steps, multiple products, or multiple decision points in a business
flow.

The locked model unifies historic scopes under one field on the investigation:

```typescript
interface Investigation {
  // ...existing fields
  hubId?: string;
  canonicalMapVersion?: string; // pinned version of the hub's canonical map
  nodeMappings?: Array<{
    nodeId: string;
    measurementColumn: string; // column in THIS investigation's data
    specsOverride?: Specs; // optional; flagged local fork
  }>;
  // legacy global specs stay for un-mapped (B0) investigations
}
```

The cardinality of `nodeMappings` is the unification:

- **B0 (legacy)** — `nodeMappings` empty or absent. Investigation uses its
  global investigation-level specs. No per-step capability available; the
  investigation does not appear in production-line-glance views.
- **B1 (multi-step)** — `nodeMappings.length > 1`. One investigation covers
  many canonical-map nodes via column mappings.
- **B2 (single-step)** — `nodeMappings.length === 1`. One investigation IS
  one step's deep-dive.
- **Mixed** — any combination supported with no special casing.

Three concrete scenarios live under the same model:

**Production line covering many machines or steps (B1).** A bottling line
exports a CSV with columns `Fill_Weight`, `Cap_Torque`, `Label_Position`,
`Crown_Engagement`. Each column maps to a different node in the canonical
ProcessMap (`Fill`, `Cap`, `Label`, `Crown`). One investigation, four
mappings, four per-step capabilities visible in the boxplot.

**Single-machine deep dive (B2).** A Master Black Belt charters work on the
filling station alone — many subgroups, time-of-day breakdown, supplier
breakdown. The investigation has one mapping (`Fill_Weight` → `Fill` node)
and lives in the same hub as the line-level investigation above. From the
hub view, both contribute to the `Fill` node's per-step distribution.

**Multi-team business-process investigation (B1, non-manufacturing).** A
credit-decision flow has steps `Application_Intake`, `Underwriting_Review`,
`Risk_Decision`, `Approval_Hold`, `Funding_Disbursement`. The ProcessMap
nodes are teams or decision points; "measurement column" is decision-quality,
cycle-time, or rework-rate; "specs" express SLA bounds. Same model, no
manufacturing assumption baked in.

The unification matters because it lets the engine treat all three uniformly.
A hub's investigations contribute per-step capabilities through the same
`nodeMappings` walk, and the per-step boxplot composes them without caring
which scope produced each box.

## §3 Drill patterns

The dashboard supports four navigation operations. Three are drills (each
moves analytical focus to a finer scope); one is an organizational hierarchy
view. Each has its own aggregation rule and its own visual shape. The
naming-and-rules table is the contract: any new analytical surface must fit
into one of these patterns or be added explicitly to the framework.

### Drill A — Hub → Step (the production-line-glance dashboard)

Click a step node in the canonical map. The step's per-step capability detail
panel renders, scoped to that node's data across all contributing
investigations and context-tuples. Aggregation rule: per
`(canonical-node × context-tuple)` Cpk computed locally; visualized as a
distribution.

**Example.** On a coffee-roasting line hub, click the `Roast` node. The
detail panel shows a boxplot of per-context Cpks for `Roast_Color`, with
boxes for each lot batch the data carries. A target line at the hub's
`targetCpk` runs across; n<30 badges decorate the boxes for batches with
thin samples.

**Status.** Shipped via PRs `gh pr view 103` (engine layer), `gh pr view 105`
(charts), `gh pr view 106` (data layer + Process Hub Capability tab),
`gh pr view 107` (LayeredProcessView Operations band wiring). The dashboard
is live in azure-app's Process Hub Capability tab and inside the
LayeredProcessView Operations band.

### Drill B — Step → Channels (existing Performance mode, unchanged)

A step with replicated equipment — four cavities of a multi-cavity press,
eight heads of a filling carousel, two parallel underwriting queues — already
has a within-step comparison surface: Performance mode. Each replica is a
channel; the question is "which channel is weakest?". Aggregation rule:
same physics, same measurement column — comparison across channels is
methodologically valid, because the channels share specs.

**Example.** Inside the `Fill` step's investigation, switch to Performance
mode. The Cpk-per-head bar chart shows heads 5–8 running tighter than heads
1–4. The analyst opens an i-chart filtered to head 6 to see a downward
drift over the last four hours.

**Status.** Already exists in `packages/core/src/analysisStrategy.ts`. No
change in this spec; no change in Phase 4. Performance mode keeps its
within-step axis.

### Drill C — Step → Sub-flow (recursive ProcessMap)

A step CAN reference a sub-ProcessMap when the step is itself a complex
sub-process. `Underwriting_Review` opens into `Document_Verify → Risk_Score
→ Compliance_Check → Approve_or_Refer`. Aggregation rule: same as Drill A
applied at the sub-flow scope. The sub-flow has its own canonical-node set,
its own spec rules, its own per-step boxplot.

**Example.** A claims-processing flow has an `Adjudicate` step that hides a
five-step sub-flow. Click `Adjudicate` to drill in; the production-line-
glance dashboard re-anchors on the sub-flow; per-step boxplots reveal that
the `Manual_Triage` sub-step is the contribution leader, not the
`Auto_Triage` sub-step the team had been instrumenting.

**Status.** NOT YET BUILT. The data model already supports it (a node may
reference a child ProcessMap), and the dashboard primitive is ready to
re-anchor. The remaining work is the Drill C navigation affordance, the
recursion guard (max 1 level in V1), and the breadcrumb UX. Sequencing is
named in §8.

### Org Hub-of-Hubs view (organizational hierarchy)

Plant > Line > Station modeled as nested hubs, not as nested ProcessMaps.
The plant hub renders line-hub cards side-by-side. Aggregation rule: visual
side-by-side only, never arithmetic. Each child hub computes its own per-
step boxplots locally against its own specs; the plant hub renders them
adjacent. There is no `meanCpkAcrossLines()` and never will be.

**Example.** A regional plant has four lines (A, B, C, D). The plant hub
view shows four cards, each card is a miniature production-line-glance
dashboard for that line. Lines A and B run a `Coke 12oz` SKU; lines C and D
run a `Sprite 16oz` SKU. The plant manager sees that A and B's `Cap` boxes
sit visibly lower than C and D's, prompting a focused investigation on A's
capping torque calibration. No arithmetic was performed; the visual side-
by-side carries the signal.

**Status.** NOT YET BUILT. The same dashboard primitive multiplies across
child hubs trivially. The remaining work is the plant-hub layout, the
side-by-side card composition, and the cross-hub context filter strip
(designed in §6 — the structural answer to "compare across multiple
production lines"). Sequencing is named in §8.

## §4 Specs and context model

Real factories and real business processes have specs that vary by product,
supplier, paint class, region, regulatory tier, customer segment, or any
combination. The specs model must be a lookup, indexed by context, not a
singleton.

### Per-(node × context-tuple) lookup

Each canonical-node carries a `capabilityScope` with a sparse list of
spec rules:

```typescript
interface ProcessMapNode {
  // ...existing fields
  capabilityScope?: {
    measurementColumn: string;
    specRules: Array<SpecRule>;
  };
}

interface SpecRule {
  when?: Record<string, string | null>; // contextColumn → contextValue; null = any/default
  specs: Specs; // USL, LSL, target, targetCpk, characteristicType
}
```

Lookup is **most-specific match across all declared dimensions**. A row
tagged `{ product: 'Coke 12oz', supplier: 'TightCorp' }` picks the rule
that names both keys; a row tagged `{ product: 'Coke 12oz', supplier:
'WideCorp' }` falls back to the rule that names only `product`; a row with
no context columns set picks the default rule (`when: { ... }` empty or
all-null).

Sparse rules are encouraged. Most products use the line's default specs;
exceptions are named explicitly. A bottling-line `Fill` node typically has
one rule per SKU; an aluminum-mill `Cast` node typically has one default
rule plus one or two supplier exceptions.

### Hub-level vs tributary-attached context columns

Context columns can be declared in two places:

```typescript
interface ProcessHub {
  contextColumns?: string[]; // hub-wide, e.g., ['product', 'shift']
}

interface Tributary {
  contextColumns?: string[]; // attached to a specific input, e.g., supplier on Steel tributary
}
```

The engine treats both uniformly at lookup time. The split is UX metadata:
hub-level chips render at the top of the filter strip; tributary-attached
chips render under their tributary label. A coffee-roasting hub might have
hub-level `shift` and tributary-attached `green_bean_lot` on the Beans
tributary. Both contribute to the context tuple at any node that the
tributary feeds.

### Multi-product, multi-supplier, multi-class — handled by sparseness

A line that runs five products with three shared upstream steps and two
product-specific downstream steps is described by:

- The shared upstream steps carry one `null`-rule (default specs that apply
  to all products).
- The product-specific downstream steps carry per-product rules.
- A supplier-specific exception on one upstream step is one extra rule.

The combinatorial explosion that taxonomy-based approaches suffer is
avoided because rules are sparse and lookup falls back to less-specific
rules silently.

### Bounded scope

Locked decision: typically 0–3 context dimensions per hub. More than three
is a sign the model is being abused — the analyst should split into multiple
hubs. The bound is a guidance affordance; the engine does not enforce it.

## §5 Governance

The canonical ProcessMap evolves over time as the line is redesigned, specs
change, or measurement columns are re-mapped. Governance follows a Git-like
discipline:

| Actor                            | Edits                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Hub owner (global process owner) | Canonical map structure (nodes, flow, top-level specs, context columns)                                           |
| Local step owners                | Per-node `capabilityScope` (specs, measurement column hints) — V2+ delegation; V1 owns this in the hub-owner role |
| Analysts / GBs / BBs             | Inherit the canonical at investigation creation; can fork locally with `specsOverride` (flagged in UI)            |

Investigations pin a `canonicalMapVersion` at creation. Hub owner edits
create a new version. In-flight investigations continue against their pinned
version; they can `pull-latest` explicitly when ready (analogous to a Git
fetch + checkout). Forks (`specsOverride` set) are flagged in the UI so the
analyst sees they have diverged from canonical.

**Migration of legacy investigations.** When an existing B0 investigation is
added to a hub with a canonical map, the analyst is prompted to map the
investigation's measurement columns to canonical nodes. Decline: the
investigation keeps its global investigation-level specs and stays out of
the per-step views. Accept: the analyst fills `nodeMappings` and the
investigation joins.

The B0 migration banner shipped in PR #106 is the first user-facing surface
of this governance model. It surfaces unmapped investigations as a
non-blocking notification on the Process Hub Capability tab; the analyst
chooses when to map.

## §6 Cross-hub context analysis (Org Hub-of-Hubs view design)

Global process owners — a plant manager who owns four lines, a quality
director who owns six factories, a regional operations head who owns twenty
distribution centers — need to answer questions whose scope crosses local
hubs. Three families of questions are common:

- **Multi-product** — "is paint class 'premium' underperforming everywhere?"
- **Multi-supplier** — "is TightCorp's steel a problem?"
- **Multi-shift / multi-region / multi-batch** — "does shift B systematically
  run worse?", "does this lot batch cause issues wherever it appears?"

The locked design answer is the **cross-hub context-filtered view**, the
visual surface of the Org Hub-of-Hubs hierarchy. The same per-step boxplot
primitive multiplies across child hubs; an opt-in context-filter chip strip
applies across children; each child computes locally against its own specs;
no cross-hub arithmetic ever happens.

```
Plant 1 hub (org level)
├─ Filter: steel_supplier = "TightCorp"
│
├─ Line A (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line A specs
├─ Line B (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line B specs
├─ Line C (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line C specs
└─ Line D (child hub)  →  no steel_supplier column; excluded with note "context dimension absent"
```

The methodology answer ("is TightCorp a problem across our lines?") emerges
from visual pattern across N independent valid local computations. If
TightCorp's box shifts left consistently across Lines A/B/C, that is the
contribution signal. The view never produces a single cross-line number.

The view is read-only / analytical — it does not create a sustained
investigation. Quick-action or focused-investigation paths can spawn from a
finding spotted in this view, but they land in their respective child hubs
as normal investigations. Sustained cross-hub work belongs to the
Portfolio Investigation entity (named-future, see §9).

This view is the structural answer to the question "how do we compare
across multiple production lines without violating the locality rule?".
Because the answer is structural — a layout that multiplies a safe
primitive — there is nothing in the engine to misuse. A future engineer
who searches for `meanCapabilityAcrossHubs` will find that no such function
exists. The design absence is the design.

## §7 UI surface summary

| Drill / view             | Where today                                                                | Where planned                                                                                                 | Status                          |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Drill A: Hub → Step      | Process Hub Capability tab (azure-app); LayeredProcessView Operations band | LayeredProcessView snapshot mode (H3, separate)                                                               | Shipped                         |
| Drill B: Step → Channels | Performance mode inside investigation editor                               | unchanged                                                                                                     | Shipped                         |
| Drill C: Step → Sub-flow | (none)                                                                     | Recursive ProcessMap, max 1 level; navigation affordance + breadcrumb on Hub Capability tab + Operations band | Named-future                    |
| Org Hub-of-Hubs view     | (none)                                                                     | Plant > Line layout; side-by-side child-hub cards; cross-hub context filter strip                             | Named-future                    |
| FRAME live preview       | (none)                                                                     | FRAME workspace right-hand drawer hosting the dashboard live-bound to authoring state                         | Named-future (Plan C3 deferred) |

## §8 Sequencing

This spec is the full vision per `feedback_full_vision_spec.md`. Phasing
within the spec is rejected; the spec describes the complete design.
Implementation sequencing belongs to delivery plans. The current state of
delivery is:

1. **Drill A — shipped.** Engine (PR #103), charts (PR #105), data layer +
   Process Hub Capability tab (PR #106), LayeredProcessView Operations band
   wiring (PR #107). The shared `ProductionLineGlanceDashboard` primitive
   serves both surfaces with progressive reveal between `mode='spatial'`
   (Operations band default) and `mode='full'` (Capability tab and
   line-level expanded view).

2. **Drill C — named-future.** The recursive ProcessMap navigation, the
   1-level recursion guard, and the breadcrumb UX get their own
   implementation plan when scheduled. The dashboard primitive is ready;
   the wiring is the work.

3. **Org Hub-of-Hubs view — named-future.** The plant-hub layout, the
   side-by-side child-hub composition, and the cross-hub context-filter
   chip strip get their own implementation plan. This was the original
   "Plan D" in the surface-wiring spec at line 232; this spec promotes the
   design from "out of scope (Plan D)" to "named-future, design locked".

4. **Portfolio Investigation as first-class entity — H3.** Sustained
   cross-hub investigation with its own questions, findings, actions, and
   sustainment. The data shape supports it; the workflow surface does not
   yet. This entity is named here so future product work has a target;
   building it is a separate spec that lives inside the H3 horizon.

## §9 Out of scope

The following items are deliberately not included. Each has a reason that
ties back to the locked decisions, not to delivery convenience.

- **Portfolio Investigation as a first-class workflow entity.** The data
  shape is ready; the workflow surface (sustained cross-hub investigation
  with own questions, findings, actions, sustainment, owners, CoScout
  coaching) is H3-shaped. The Org Hub-of-Hubs view's read-only analytical
  surface supports the question-spotting workflow without introducing the
  entity.

- **Hub-level statistical aggregation across investigations or hubs.**
  Forbidden by design absence per ADR-073, not by complexity. The engine
  does not, will not, and cannot expose `meanCapabilityAcrossHubs` or any
  named variant. Architectural guard tests in
  `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`
  enforce the absence at CI time.

- **Per-node distinct context dimensions** (a single hub having different
  context dimensions per node, not just per tributary). Edge case;
  deferrable because the `null` default rule covers the 95% case ("this
  dimension doesn't apply at this node, fall back to default").

- **Investigation-level context overrides**
  (`nodeMappings[i].contextOverride`) for retrospective analysis. Useful
  for back-tagging a historical dataset to a context value the source data
  did not carry, but not in the locked V1 scope.

- **Drill C beyond 1 level of recursion.** Bounded for V1 to keep the
  breadcrumb readable and the navigation predictable. Deeper recursion is
  a future enhancement, not an architectural constraint.

- **Real-time collaborative editing of the canonical map.** The
  versioned-pull model from §5 is sufficient for V1; concurrent multi-user
  editing is its own collaboration-infrastructure spec.

- **Mobile-specific responsive treatment of the cross-hub context-filtered
  view.** The dashboard primitive is responsive; the plant-hub layout's
  small-viewport behavior is a future polish task that ships with the
  Org Hub-of-Hubs implementation plan.

## §10 References

### Source brainstorm and locked decisions

- Brainstorm output (April 28, 2026):
  `/Users/jukka-mattiturtiainen/.claude/plans/we-just-implemented-phase-delightful-adleman.md`
  — locked decisions block (lines 19–38) is the spec's source of truth.

### Spec context

- Production-line-glance design:
  `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- Production-line-glance surface wiring (Plan A/B/C/D framing):
  `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`
  (line 26: original Plan D out-of-scope statement that this spec resolves)
- Process Hub design (the gap this spec fills):
  `docs/superpowers/specs/2026-04-25-process-hub-design.md`
  (lines 138–140: deferred `relatedProcessHubIds` / `improvementProgramId`
  framing)
- Layered Process View design:
  `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`
- Process Learning Operating Model:
  `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`
- Product-Method Roadmap (horizon framing):
  `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md`
- Investigation Wall design (format precedent):
  `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`

### Shipped pull requests

- PR #103 — production-line-glance engine layer
  (`gh pr view 103`).
- PR #105 — production-line-glance charts (Plan B)
  (`gh pr view 105`).
- PR #106 — data layer + Process Hub Capability tab (Plan C1)
  (`gh pr view 106`).
- PR #107 — LayeredProcessView Operations band + progressive reveal
  (Plan C2) (`gh pr view 107`).

### Decisions and policies

- ADR-073 — no-aggregation policy at decision-record durability (the
  structural-absence rule for cross-investigation / cross-hub Cp/Cpk
  aggregation).
- ADR-069 — three-boundary numeric safety (sample-confidence integration
  on `calculateNodeCapability` results).
- ADR-053 — question-driven EDA (informs the "question, not hypothesis"
  vocabulary used throughout).
- ADR-067 — continuous regression engine (boundary precedent for
  deterministic stats authority).

### Memory references

- `feedback_aggregation_heterogeneous_specs.md` — the locality rule
  generalizes to any heterogeneity dimension; the originating reasoning
  for structural absence.
- `feedback_full_vision_spec.md` — design the whole vision; sequence
  delivery in plans.
- `feedback_no_gates_language.md` — the framing-language prohibition
  that this spec honors (use guidance, scaffolding, checkpoint, step,
  lens, or affordance instead).
- `feedback_no_backcompat_clean_architecture.md` — required-props-by-
  default discipline that informs the `nodeMappings` API shape.
