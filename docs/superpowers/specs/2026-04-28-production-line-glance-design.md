---
title: Production-Line-Glance Dashboard — Per-Step Capability with Context-Aware Specs
audience: [product, designer, engineer, analyst, manager]
category: design-spec
status: draft
related:
  [
    layered-process-view,
    process-learning-operating-model,
    product-method-roadmap,
    process-hub,
    methodology,
    frame-process-map,
    eda-mental-model,
    capability,
    subgroup-capability,
    adr-069,
    adr-070,
  ]
date: 2026-04-28
---

# Production-Line-Glance Dashboard — Per-Step Capability with Context-Aware Specs

## Scope

This is a **design spec**, not an implementation plan. It defines the data model, drill semantics, governance model, specs/context structure, and UI surface placement for a per-step capability dashboard primitive that closes Watson's Cp/Cpk aggregation-safety gap (devil's-advocate critique A3, D3) by structural design rather than by guard rule. The same primitive serves as the implementation of the Layered Process View Operations band V2, the Product-Method Roadmap H2 line 2 capability cards, and the Global-Process-Owner cross-hub analytical view.

Implementation sequencing, exact chart visual tokens, mobile responsive specifics, and the future Portfolio Investigation entity are out of scope and belong to follow-up specs/plans.

## Summary

A unified per-step capability primitive computes Cp/Cpk **per (canonical-node × context-tuple)** and displays the resulting array as a distribution (boxplot) rather than an aggregate. The **engine has no function for aggregating Cp/Cpk across investigations or hubs** — Watson's "Cpks are not additive across heterogeneous local processes" rule is preserved by _structural absence_ of the unsafe primitive, not by a permission gate.

The primitive surfaces in three places (LayeredProcessView Operations band, Process Hub view, FRAME workspace) and one cross-hub view (Org Hub-of-Hubs filtered by context). Specs live per canonical-node and are looked up by context tuple (product, supplier, paint class, etc.). The data model is a small bounded extension of existing ProcessMap and Investigation primitives; it adds no new entities, only fields and one engine API.

This spec replaces the original W1 ("engineer cross-hub Cpk eligibility taxonomy") proposal with a methodologically purer alternative that emerged from a multi-round brainstorming session on 2026-04-28.

## Why this design exists

The new operating model (`docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md:291-293, 456`) makes a verbal commitment: _"Cp/Cpk from unrelated local processes should not be treated as additive."_ The current code (`packages/core/src/processHub.ts:815-822`) flattens per-investigation Cpk into a hub-level `metrics` array with no eligibility check. There is no `processFamily` taxonomy, no `aggregatable` flag, no `canAggregate` predicate anywhere in the codebase.

Two paths were considered:

1. **Engineer the rule**: define a process-family taxonomy, add eligibility predicates, gate every aggregation surface in the UI. This is the patch.
2. **Eliminate the unsafe primitive**: don't expose an aggregate-across-investigations function at all. Visualize per-step Cpks as distributions. Comparison is visual; aggregation math doesn't happen.

Path 2 is methodologically pure (Watson's locality preserved at every level by design absence), reuses 70% of existing primitives (Performance mode chart slots, boxplot, Pareto, capability I-Chart), and naturally extends to the Layered Process View Operations band V2 deliverable. This spec captures Path 2.

## Data model

The design extends three existing primitives (ProcessMap node, Tributary, Investigation) and adds one engine API. No new entities.

### ProcessMap node — capability scope

```typescript
interface ProcessMapNode {
  id: string;
  label: string;
  // ...existing fields (type, position, tributaries, etc.)

  // NEW
  capabilityScope?: {
    measurementColumn: string; // column in this investigation's data carrying the measurement
    specRules: Array<SpecRule>; // sparse rules; most-specific match wins
  };
}

interface SpecRule {
  when?: Record<string, string | null>; // contextColumn → contextValue; null = any/default; absent key = any
  specs: Specs; // USL, LSL, target, targetCpk, characteristicType
}
```

### ProcessHub — canonical map + context dimensions

```typescript
interface ProcessHub {
  // ...existing fields
  canonicalProcessMap?: ProcessMap; // hub-level master, versioned
  canonicalMapVersion?: string; // e.g., "2026-04-28T10:30:00Z" or semver
  contextColumns?: string[]; // hub-level context dimensions, e.g., ['product', 'shift']
}
```

### Tributary — input-attached context dimensions

```typescript
interface Tributary {
  // ...existing FRAME tributary fields (label, position, factor metadata)
  contextColumns?: string[]; // input-attached dimensions, e.g., supplier on Steel tributary
}
```

The engine treats hub-level and tributary-attached `contextColumns` uniformly at lookup time. The distinction is UX metadata: hub-level chips group at the top of filter strips; tributary-attached chips group under their input in FRAME and as a sub-section in the dashboard.

### Investigation — node mappings

```typescript
interface Investigation {
  // ...existing fields
  hubId?: string; // belongs to which hub
  canonicalMapVersion?: string; // pinned version of the hub's canonical map
  nodeMappings?: Array<{
    nodeId: string;
    measurementColumn: string; // column in THIS investigation's data
    specsOverride?: Specs; // optional; flagged local fork
  }>;
  // legacy specs field stays for un-mapped investigations (B0 fallback)
}
```

The cardinality of `nodeMappings` is the unification of B1 and B2:

- **B0** (legacy): `nodeMappings` is empty/absent. Investigation uses its global investigation-level specs. No per-node capability available; investigation does not appear in production-line-glance dashboards.
- **B1**: `nodeMappings.length > 1`. One investigation covers multiple steps via column mappings.
- **B2**: `nodeMappings.length === 1`. One investigation IS one step's deep-dive.
- **Mixed**: any combination supported with no special casing.

### Engine API — single canonical entry point

```typescript
function calculateNodeCapability(
  nodeId: string,
  source:
    | { kind: 'column'; investigation: Investigation; processMap: ProcessMap; data: DataRow[] }
    | { kind: 'children'; hub: ProcessHub; members: Investigation[] }
): NodeCapabilityResult;

interface NodeCapabilityResult {
  nodeId: string;
  cpk?: number;
  cp?: number;
  n: number;
  sampleConfidence: 'trust' | 'review' | 'insufficient';
  source: 'column' | 'children' | 'mixed';
  contributingInvestigations?: string[]; // for hub-children case
  perContextResults?: Array<{
    contextTuple: Record<string, string | null>;
    cpk?: number;
    cp?: number;
    n: number;
    sampleConfidence: 'trust' | 'review' | 'insufficient';
  }>;
}
```

This is the **only** capability function exposed at the canonical-node level. There is **no** function aggregating Cp/Cpk across investigations or hubs. Cross-hub comparison is performed by the dashboard reading multiple `NodeCapabilityResult` arrays and rendering them side-by-side — never by collapsing them to a number.

## Drill semantics

The dashboard supports three architecturally distinct drill operations, plus an organizational hierarchy. Each has its own aggregation rule and UX shape.

### Drill A — Hub → Step (the production-line-glance dashboard)

The primary deliverable. Click a step node in the canonical map → see that step's capability detail panel + the line-level dashboard updates context. **Aggregation rule**: per (canonical-node × context-tuple) Cpk computed locally; visualized as a distribution.

### Drill B — Step → Channels (existing Performance mode, unchanged)

A step with replicated equipment (4 presses in a multi-press station) is already handled by Performance mode (`packages/charts/src/PerformanceIChart.tsx`). Each press is a channel; comparison is "which press is weakest?". **Aggregation rule**: same physics, same measurement column — comparison across channels is methodologically valid. No change to Performance mode in this spec.

### Drill C — Step → Sub-flow (recursive ProcessMap)

A node CAN reference a sub-ProcessMap (the step is itself a complex sub-process: pre-inspect → press → post-inspect). **V1 supports max 1 level of recursion.** Beyond that, the model degrades gracefully — users don't drill further. **Aggregation rule**: same as Drill A applied at the sub-flow scope.

### Org Hub-of-Hubs (organizational hierarchy)

Plant > Line > Station as **nested hubs**, not nested process maps. Plant hub renders line-hub cards side-by-side. **Aggregation rule**: visual side-by-side only, never arithmetic. Any cross-hub view is a distribution over per-hub valid-local-Cpks. This is also where the Cross-Hub Context-Filtered View (below) lives.

## Governance — versioned canonical map

The canonical ProcessMap evolves over time as the line is redesigned, specs change, or measurement columns are re-mapped. Governance follows a Git-like model.

| Actor                            | Edits                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Hub owner (global process owner) | Canonical map structure (nodes, flow, top-level specs, contextColumns)                                        |
| Local step owners                | Per-node `capabilityScope` (specs, measurement column hints) — V2+ delegation; V1 owns this in hub-owner role |
| Analysts / GBs / BBs             | Inherit canonical at investigation-creation time; can fork locally with `specsOverride` (flagged)             |

**Propagation**: investigations pin a `canonicalMapVersion` at creation. Hub owner edits create a new version. In-flight investigations continue against their pinned version. They can `pull-latest` explicitly when ready (analogous to Git fetch + checkout). Forks (`specsOverride` set) are flagged in the UI so the analyst sees they have diverged from canonical.

**Migration of legacy investigations**: when an existing (B0) investigation is added to a hub with a canonical map, the analyst is prompted to map columns to nodes. Decline → investigation keeps legacy global specs; doesn't appear in production-line-glance views. Accept → analyst fills `nodeMappings`; investigation joins.

## Specs and context dimensions

### Why specs are per (node × context)

Real factories have specs that vary by product, supplier, paint class, etc. Hard-coding specs as a singleton per investigation breaks the moment a line runs more than one product. Specs must be a **lookup** indexed by context.

### Spec rule semantics

```yaml
# Example: Bottling line node "Fill", contextColumns: ['product']
specRules:
  - when: { product: 'Coke 12oz' }
    specs: { LSL: 349, USL: 359, target: 354, targetCpk: 1.33 }
  - when: { product: 'Coke 16oz' }
    specs: { LSL: 468, USL: 478, target: 473, targetCpk: 1.33 }
  - when: { product: 'Sprite 12oz' }
    specs: { LSL: 349, USL: 359, target: 354, targetCpk: 1.33 }
```

```yaml
# Example: Aluminum mill node "Cast", contextColumns: ['supplier'] on Steel tributary
specRules:
  - when: { supplier: null } # default rule
    specs: { LSL: 6.0, USL: 6.5 }
  - when: { supplier: 'TightCorp' }
    specs: { LSL: 6.1, USL: 6.4 } # tighter
  - when: { supplier: 'WideCorp' }
    specs: { LSL: 5.9, USL: 6.6 } # looser, certified
```

```yaml
# Combined: contextColumns: ['product', 'supplier']
specRules:
  - when: { product: 'Coke 12oz' } # most rules use product
    specs: { LSL: 349, USL: 359 }
  - when: { product: 'Coke 16oz' }
    specs: { LSL: 468, USL: 478 }
  - when: { product: 'Coke 12oz', supplier: 'TightCorp' } # one exception
    specs: { LSL: 351, USL: 357 }
```

**Lookup**: most-specific-match across all declared dimensions. A row tagged `{ product: 'Coke 12oz', supplier: 'TightCorp' }` picks the third rule. A row tagged `{ product: 'Coke 12oz', supplier: 'WideCorp' }` picks the first (matches product; supplier unspecified means any).

**Sparse encouraged**: only specify exceptions; defaults handle the common case. UI shows specified rules + a "default" affordance.

### Bounded scope of context

- **Typically 0–3 dimensions**. More than 3 is a sign the model is being abused (the analyst should split into multiple hubs).
- **No new entity**: contextColumns are existing categorical columns in the data. VariScout already understands those (filters, factors, subgroup configs).
- **Hub-level vs tributary-attached**: declaration is UX organization; engine treats both uniformly. Per-node distinct context dimensions (each node having its own dimension set) is deferred to V2 — handle 95% case (`null` rule = "this dimension doesn't apply here") in V1.

### Backward compatibility

Hub with `contextColumns: []` (or absent) → spec rules with `when: { ... }` empty/absent → behavior identical to today's per-investigation specs singleton. Migration of existing investigations is non-breaking.

## Single-hub production-line-glance dashboard

The dashboard is the user-visible surface of the per-step capability primitive. It composes four chart slots in a 2×2 layout:

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ TEMPORAL — line trending?       │ TEMPORAL — centering moving?    │
│ Cpk vs target i-chart           │ Δ(Cp-Cpk) trend i-chart         │
│ [reuse PerformanceIChart]       │ [W3 NEW — Δ as own series]      │
├─────────────────────────────────┼─────────────────────────────────┤
│ SPATIAL — which step?           │ SPATIAL — which failure mode?   │
│ Per-step Cpk boxplot            │ Per-step error Pareto           │
│ + target lines, n<30 badges     │ ranked, optional top-N          │
│ [W1' NEW]                       │ [W1' NEW — extend defect Pareto]│
└─────────────────────────────────┴─────────────────────────────────┘
```

### Top-left: Cpk vs target i-chart (reuse)

Reuses `packages/charts/src/PerformanceIChart.tsx:189-302` capability variant. Cpk per subgroup/snapshot vs target line. No change.

### Top-right: Δ(Cp-Cpk) trend i-chart (W3)

New variant of the capability I-Chart that plots the Δ(Cp-Cpk) gap as its own time series — answering "is centering loss getting worse over snapshots?". Reuses I-Chart base; adds a `mode: 'gap-as-series'` option. Existing static dual-series Cp+Cpk on one chart already exists (`docs/03-features/workflows/analysis-flow.md:84`); this is the gap-over-time complement, not a replacement.

### Bottom-left: Per-step Cpk boxplot (W1')

New chart. For each canonical-node with `capabilityScope.measurementColumn`, compute `calculateNodeCapability()` and plot the resulting per-context-tuple Cpks as a box (or dot plot if N is small per `editing-charts` skill). Per-node target line drawn from `specRules` (using the dominant or filtered context's target Cpk). n<30 sample-size badges decorate boxes/dots per W2.

If a context filter is active (e.g., `product = 'Coke 12oz'`), each box reflects only that product's data computed against that product's specs.

### Bottom-right: Per-step error Pareto (W1')

New chart. Reuses `packages/charts/src/PerformancePareto.tsx:55-59` defect Pareto, scoped per process-step. Each step contributes its own ranked error categories. Supports Top-N + Others (ADR-051) for high-cardinality cases.

### Filter strip

A horizontal strip at the top of the dashboard. Hub-level context dimensions render as primary chips; tributary-attached context dimensions render below grouped under their tributary label. Selecting a filter value re-computes per-step Cpks against the matching specs and re-renders all four charts.

### "Production line health at a glance"

The 2×2 layout answers four orthogonal questions simultaneously:

- TOP-LEFT: Are we meeting target over time?
- TOP-RIGHT: Is centering loss trending?
- BOTTOM-LEFT: Where in the line is capability concentrated/spread?
- BOTTOM-RIGHT: When something fails, what failure mode?

Together they give a process owner an at-a-glance read on their line. This is the H2 line 2 capability-state cards deliverable, the Layered Process View Operations band V2 implementation, and the closure of W1 — in one design.

## Cross-hub context-filtered view

At the Org Hub-of-Hubs surface (Plant > Line view), a context filter chip strip applies across child hubs. The same per-step boxplot dashboard is rendered for each child hub, all filtered to the chosen context value.

```
Plant 1 hub (org level)
├─ Filter: steel_supplier = "TightCorp"
│
├─ Line A (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line A specs
├─ Line B (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line B specs
├─ Line C (child hub)  →  per-step boxplot dashboard, TightCorp data only, Line C specs
└─ Line D (child hub)  →  no steel_supplier column; excluded with note "context dimension absent"
```

Each child computes locally against its own specs — no cross-hub arithmetic, no aggregate Cpk number. The methodology answer ("is TightCorp a problem across our lines?") emerges from visual pattern across N independent valid local computations. If TightCorp's box shifts left consistently across Lines A/B/C, that's the signal.

This view supports any context dimension declared on any hub:

- Multi-product analysis ("is paint class 'premium' underperforming everywhere?")
- Multi-supplier analysis ("is TightCorp's steel a problem?")
- Multi-shift analysis ("does shift B systematically run worse?")
- Multi-batch analysis ("does this lot batch cause issues wherever it appears?")

The view is **read-only / analytical** — it doesn't create a sustained investigation. Quick-action / focused-investigation paths can spawn from a finding spotted in this view, but they land in their respective hubs as normal investigations.

## UI surfaces

The per-step capability primitive is implemented once in `@variscout/charts` + `@variscout/ui` and surfaced in three places.

### Primary: LayeredProcessView Operations band

The architectural home, per `docs/superpowers/specs/2026-04-27-layered-process-view-design.md:83-102`. The relationship is precise: the **Operations band is exactly the bottom row of the 2×2 dashboard** (per-step Cpk boxplot + per-step error Pareto). When the LayeredProcessView is rendered with all three bands (Outcome / Process Flow / Operations), the Operations band shows the dashboard's spatial row inline. The full 2×2 dashboard view adds the temporal row (Cpk vs target i-chart, Δ(Cp-Cpk) trend) above the Operations band when the user expands to a line-level view.

This makes the per-step Cpk boxplot a **shared primitive** — one component definition in `@variscout/charts`, surfaced both as the Operations band content within LayeredProcessView and as one quadrant of the production-line-glance dashboard.

### Secondary: Process Hub view

The Hub view is where process owners land for cadence reviews. The 2×2 dashboard renders as a panel within the Hub view, scoped to the hub's data and canonical map. Existing `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx:123-138` renders per-state-item; the dashboard sits adjacent or as a tab.

### Tertiary: FRAME workspace

When an analyst is shaping a new investigation in FRAME, the dashboard surfaces as a live-preview pane showing what the per-step capability looks like as columns/specs are mapped to nodes. This gives feedback during canonical map authoring.

### Performance mode unchanged

Performance mode (`packages/core/src/analysisStrategy.ts:81`) keeps its scope: within-step channels (cavity, head, press number). The per-step dashboard is a **different axis** (across-step capability). They are complementary; users use both for different questions.

## Migration path

### Existing investigations

Existing investigations have a global investigation-level specs singleton (USL/LSL/target). They become **B0 fallback** — `nodeMappings` is absent, the legacy specs apply, the investigation does not appear in any production-line-glance view.

When the user adds a B0 investigation to a hub with a canonical map, a one-time prompt: _"Map your measurement column(s) to a node in this hub's canonical map?"_ Accept → analyst fills `nodeMappings` (one or many). Decline → investigation stays B0; no per-node capability available; the analyst still has the existing capability mode toggle on the I-Chart for their global Y.

### Existing hubs without canonical maps

Existing hubs have no `canonicalProcessMap`. The first investigation added to such a hub can promote its local ProcessMap as the hub's canonical (with explicit user action). Subsequent investigations inherit. No automatic promotion — explicit decision.

### Existing context columns

Hubs without `contextColumns` declared continue with single-spec-per-step (the `null` default rule). Context dimensions are added explicitly when the analyst recognizes the line runs multiple products/suppliers/etc.

## Verification

- **Per-(node × context-tuple) Cpk computation** correct against NIST-validated reference cases. Deterministic-PRNG tests in `packages/core/src/stats/__tests__/`.
- **Engine has NO aggregation function across investigations**: verified by `rg -n "meanCapability|aggregateCpk|sumCpk|portfolioCpk" packages/core/` returning zero hits.
- **Single-hub dashboard** renders all four charts in Operations band, Hub view, FRAME workspace surfaces. Chrome walk validates each surface end-to-end.
- **Cross-hub context filter** at Org Hub-of-Hubs view shows per-line per-step boxplots filtered to one context value, with at-least-one excluded child hub showing the "context dimension absent" treatment.
- **Migration**: existing investigations without `nodeMappings` continue to work with global investigation-level specs as fallback. No regression in capability mode toggle on the I-Chart.
- **Spec rule lookup**: most-specific-match correctness with sparse rules. Tests cover (a) default-only, (b) single-dimension exceptions, (c) multi-dimension specific overrides, (d) tributary-attached dimensions matched alongside hub-level dimensions.
- **Sample-size confidence** badges (W2): boxplot/dot plot decorations correct at thresholds (n<10 insufficient, 10≤n<30 review, n≥30 trust). UI smoke test.
- **Δ(Cp-Cpk) trend chart** (W3): renders independently of dual-series chart; centering-loss trend visually distinct.

## Out of scope (named, deferred)

- **Portfolio Investigation as first-class entity** — H3+. The data shape supports it; the workflow surface (sustained cross-hub investigation with own questions/findings/actions/sustainment) is a separate feature.
- **Per-node distinct context dimensions** (a single hub having different context dimensions per node, not just per tributary). Edge case; deferred to V2.
- **Investigation-level context overrides** (`nodeMappings[i].contextOverride`) for retrospective analysis. Useful but not V1.
- **Drill C beyond 1 level of recursion**. ProcessMap nesting bounded for V1.
- **Per-step delegation of canonical-map editing** to local step owners. V1 = hub owner does it all; V2+ = role-based delegation.
- **Sustained Portfolio Investigation lifecycle** (questions, findings, actions, sustainment, owners, CoScout coaching at portfolio level). Real but bigger; H3+.
- **Real-time collaborative editing** of canonical map. Versioned-pull model is sufficient for V1.
- **Mobile responsive specifics** — handled in Layered Process View V2 implementation plan.

## Sequencing (engine plan: [`docs/superpowers/plans/2026-04-28-production-line-glance-engine.md`](../plans/2026-04-28-production-line-glance-engine.md), charts plan: [`docs/superpowers/plans/2026-04-28-production-line-glance-charts.md`](../plans/2026-04-28-production-line-glance-charts.md), surface-wiring spec: [`docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`](./2026-04-28-production-line-glance-surface-wiring-design.md))

1. **W4 first**: resolve `mode` vs "instrument set" terminology drift. **DONE** — Option A (strike "instrument set" from copy) landed 2026-04-28 across operating-model, methodology, USER-JOURNEYS, llms.txt, and 4 related specs.
2. **W1' core engine**: extend `ProcessMap`, `Investigation`, `ProcessHub` types; implement `calculateNodeCapability()` with deterministic-PRNG tests; verify NIST reference cases.
3. **W2 native integration**: extend capability stat returns with `sampleConfidence`; wire into `calculateNodeCapability()` results.
4. **W3 native integration**: implement Δ(Cp-Cpk)-as-time-series chart variant.
5. **W1' UI primitive**: build the 2×2 dashboard component in `@variscout/charts` + `@variscout/ui`.
6. **W1' surfaces**: wire dashboard into LayeredProcessView Operations band, Process Hub view, FRAME workspace.
7. **Cross-hub context-filtered view**: extend Org Hub-of-Hubs view with context filter strip + multi-child rendering.
8. **W5/W6/W7** in parallel: governance docs update, ADR amendments, observed-vs-expected methodology unity paragraph + CoScout prompt reference.

Each step lands as its own PR per `feedback_no_backcompat_clean_architecture.md`. Subagent code review per PR.

## References

- Devil's-advocate critique: `~/.claude/plans/i-would-need-to-drifting-hummingbird.md` (objections A2, A3, A4 — the three Watson methodology gains addressed by W1' + W2 + W3)
- Operating model: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` (lines 274–276, 282–289, 291–293, 456 for locality + ownership + aggregation framing)
- Layered Process View: `docs/superpowers/specs/2026-04-27-layered-process-view-design.md` (lines 83–102 — Operations band V2 spec)
- Product-Method Roadmap: `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md` (H2 line 2 capability-state cards)
- Existing capability infrastructure: `docs/03-features/workflows/analysis-flow.md` (two-thread analysis flow, capability mode toggle, dual-series Cp+Cpk)
- ADR-069 three-boundary numeric safety (referenced by W2 sample-confidence integration)
- ADR-070 FRAME workspace (referenced by canonical-map structure; will need amendment to note "FRAME as one flow lens" per critique C2)
