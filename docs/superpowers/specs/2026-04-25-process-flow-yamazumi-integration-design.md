---
title: Process Flow + Yamazumi Integration
audience: [analyst, engineer]
category: design-spec
status: draft
related:
  [
    process-flow,
    yamazumi,
    frame-process-map,
    lean,
    takt,
    bottleneck,
    waste,
    investigation,
    improvement,
  ]
date: 2026-04-25
---

# Process Flow + Yamazumi Integration

## Summary

Process Flow and Yamazumi should form one level-of-detail workflow, not two unrelated analysis modes.

**Process Flow is the locator.** It uses timestamped line data to find where flow variation, cycle time, wait time, lead time, or output-rate loss lives.

**Yamazumi is the microscope.** It uses activity-level time study data to explain what inside a selected process step creates waste, wait, or takt overrun.

Capability analysis is optional in this workflow. It enters only when the user's outcome is a spec-bound quality characteristic. For lean flow improvement, the primary improvement evidence is takt compliance, VA ratio, waste reduction, cycle time, wait time, lead time, and output rate.

## Context

The existing Process Flow design already defines a three-level drill-down:

1. Line level: output rate or lead time over time.
2. Station level: station cycle times and inter-station waits.
3. Activity level: Yamazumi breakdown inside the bottleneck station.

The existing Yamazumi methodology already defines the lean investigation question:

> Which stations exceed takt time, and is that because of real work or waste?

This spec makes the connection explicit and grounds the Finlandia "discovered process flow" idea in the current VariScout architecture:

- FRAME owns the process structure through `ProcessMap`.
- Process Flow derives station/wait/lead-time metrics from timestamped data.
- Yamazumi explains activity composition inside all steps or a selected step.
- INVESTIGATE converts flow and waste evidence into questions, findings, and SuspectedCause hubs.
- IMPROVE runs kaizen/PDCA and verifies with lean metrics.

## Design Principle

VariScout should not require perfect full-process data upfront.

The product should support a common kaizen pattern:

1. Use coarse flow data to find the constraint.
2. Collect deeper gemba time-study data only where it matters.
3. Use Yamazumi to decompose that selected step.
4. Improve and verify the bottleneck.

This preserves the core methodology: structured investigation starts broad, then narrows to the highest-value learning target.

## Relationship To Existing Modes

| Mode          | Role in this workflow    | Primary question                                   | Primary evidence                                |
| ------------- | ------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| FRAME         | Shared process structure | What process are we investigating?                 | Process map, CTS/CTQ, tributaries, gaps         |
| Process Flow  | Locator                  | Where does flow variation or bottleneck loss live? | Cycle time, wait time, lead time, output rate   |
| Yamazumi      | Microscope               | What work content inside the step creates waste?   | VA/NVA/Wait composition, takt gap, VA ratio     |
| Investigation | Learning system          | Which mechanism is plausible enough to act on?     | Questions, findings, gemba/expert/data evidence |
| Improvement   | PDCA execution           | Did the kaizen remove waste and improve flow?      | Before/after lean metrics                       |
| Capability    | Optional quality lens    | Did quality/spec performance improve too?          | Cp/Cpk, yield, spec compliance                  |

Process Flow and Yamazumi should connect, not collapse into a single mode. They answer different questions at different levels of detail.

## Valid Yamazumi Coverage Modes

Yamazumi must support both complete and partial coverage.

### Full-Line Yamazumi

Use when the user has activity-level time study data for all process steps.

Behavior:

- Show all stations/steps in one Yamazumi chart.
- Compare each station against takt.
- Rank waste by station and by activity type.
- Support full-line kaizen planning.

Example:

> "Line 4 has activity-level data for Pick, Assemble, Inspect, and Pack. Yamazumi shows Inspect and Pack above takt. Waste by type shows waiting dominates Pack."

### Scoped-Step Yamazumi

Use when the user only has activity-level data for one selected step, often the bottleneck found by Process Flow.

Behavior:

- Show the selected step as the scoped analysis object.
- Keep the parent line context visible: selected station, flow metric that made it important, and link back to Process Flow.
- Do not warn that other stations are missing. This is intentional gemba depth, not incomplete data.
- Report scope clearly: "Activity breakdown for Station 3 only."

Example:

> "Process Flow shows Station 3 cycle time explains the largest share of lead-time variation. The team collects Yamazumi data for Station 3 only. Yamazumi shows material wait is 41% of Station 3 time."

## Shared Structure: FRAME ProcessMap

`ProcessMap` is the shared semantic spine.

Process Flow should create or enrich Process Map nodes:

- Each detected station becomes a `ProcessMapNode`.
- Station cycle-time columns become CTQ candidates for the node.
- Wait columns become flow edges or edge-like derived variables.
- Per-station factor columns become tributaries on that node.
- The line-level output metric becomes the CTS candidate.

Yamazumi should bind activity data to the same process nodes:

- Full-line Yamazumi maps each station column value to a `ProcessMapNode`.
- Scoped-step Yamazumi maps all activity rows to one selected `ProcessMapNode`.
- Activity-type classifications remain Yamazumi-specific; they should not become generic tributary roles.

The user remains in control. Inferred matches are proposals that can be corrected.

## Data Model Direction

This spec does not require final TypeScript names, but implementation should keep these responsibilities separated.

### FlowConfig

Owns sequential timestamp-derived structure:

```typescript
interface FlowConfig {
  stations: FlowStation[];
  primaryY: 'outputRate' | 'leadTime' | string;
  rateUnit: 'minute' | 'hour' | 'day' | 'shift';
}

interface FlowStation {
  id: string;
  name: string;
  processMapNodeId?: string;
  startColumn: string;
  endColumn: string;
  order: number;
  factorColumns?: string[];
}
```

### YamazumiScope

Owns whether activity data covers the full line or a selected process step:

```typescript
type YamazumiScope =
  | {
      kind: 'full-line';
      stationColumn: string;
      processMapNodeMatches?: Record<string, string>;
    }
  | {
      kind: 'scoped-step';
      processMapNodeId: string;
      stationLabel?: string;
      parentFlowConfigId?: string;
    };
```

### Derived Columns

Process Flow may derive:

- `{Station}_CycleTime`
- `Wait_{A}_to_{B}`
- `LeadTime`
- `{Station}_OutputRate`
- `LineOutputRate`

Yamazumi may aggregate:

- total time per step
- VA time
- NVA time
- required NVA/SNVA time
- Wait time
- VA ratio
- takt gap
- waste reduction before/after

These derived and aggregated values must stay deterministic and auditable.

## User Flow A: Flow First, Then Bottleneck Yamazumi

1. User loads timestamped station data.
2. FRAME detects station sequence and proposes a Process Map.
3. User confirms station names and order.
4. Process Flow derives cycle/wait/lead-time/output-rate columns.
5. SCOUT identifies the bottleneck or top flow-variation contributor.
6. User selects "Collect/View activity breakdown for this step."
7. User uploads or pastes Yamazumi activity data for only that step.
8. Yamazumi opens in `scoped-step` mode.
9. INVESTIGATE generates waste-focused questions.
10. IMPROVE creates kaizen actions and verifies flow/waste metrics.

This is the primary design path.

## User Flow B: Full-Line Yamazumi Direct

1. User loads time study data with station, activity type, and duration.
2. Yamazumi detection runs as it does today.
3. FRAME can map station values to Process Map nodes when a map exists.
4. Yamazumi opens in `full-line` mode.
5. User identifies over-takt stations and waste-heavy activity types.
6. INVESTIGATE and IMPROVE proceed with lean-specific questions and metrics.

This path remains valid and should not require Process Flow data.

## User Flow C: Flow Plus Quality Outcome

Use only when the user has a quality measurement or spec-bound output in addition to flow data.

1. Process Flow identifies a bottleneck or wait-time issue.
2. User switches the primary Y to a quality/test result or checks a quality outcome after the flow investigation.
3. Flow columns participate as factors in standard/capability analysis.
4. Capability becomes a secondary verification lens.

This path must not be the default lean-flow story. The default story is waste removal and flow improvement.

## Investigation Question Strategy

### Process Flow Questions

Process Flow generates line/station questions:

| Question type           | Example                                                  | Evidence                             |
| ----------------------- | -------------------------------------------------------- | ------------------------------------ |
| Bottleneck              | Which station constrains output?                         | Median/mean cycle time, output rate  |
| Wait source             | Which wait between stations is largest or most variable? | Wait-time distribution               |
| Variation contribution  | Which station CT explains lead-time variation?           | R2adj / eta-squared where applicable |
| Parallel station factor | Which machine/operator at this station changes CT?       | ANOVA or grouped comparison          |
| Propagation             | Does upstream delay increase downstream wait?            | Correlation/interaction screen       |

### Yamazumi Questions

Yamazumi generates activity/waste questions:

| Question type      | Example                               | Evidence             |
| ------------------ | ------------------------------------- | -------------------- |
| Takt compliance    | Does this step exceed takt?           | Time above takt      |
| Waste composition  | Is the bottleneck real work or waste? | VA/NVA/Wait split    |
| Waste driver       | Which waste type dominates?           | Waste contribution % |
| Temporal stability | Is waste increasing over time?        | NVA/Wait I-Chart     |
| Kaizen target      | Where should kaizen focus first?      | Waste x takt gap     |

### Handoff Rule

When a Process Flow question selects a station and Yamazumi data exists or is later added for that station, Yamazumi questions should inherit the parent station context.

Example:

> Parent question: "Why does Station 3 drive lead-time variation?"
>
> Child Yamazumi question: "Within Station 3, is the takt gap caused by VA work or material wait?"

## SuspectedCause Hubs

The hub should name the operational mechanism, not just the station.

Weak hub:

> Station 3 bottleneck

Better hubs:

- Material waiting before Station 3
- Excess walking during Station 3 setup
- Rework loop inside Station 3 inspection
- Parallel machine imbalance at Station 2

Process Flow provides the location. Yamazumi helps name the mechanism.

## Improvement And Verification

For this workflow, IMPROVE should prioritize lean metrics.

### Improvement Ideas

Suggested idea directions:

- Eliminate waste
- Reduce required NVA
- Reduce wait/queue time
- Rebalance work across stations
- Simplify motion or changeover
- Add visual control or material replenishment trigger
- Standardize best method

### Verification Metrics

Before/after verification should support:

- bottleneck station cycle time
- inter-station wait time
- lead time
- line output rate
- takt compliance %
- VA ratio
- total NVA + Wait
- waste reduction %

Cpk and yield may appear only when quality/spec data is present.

## UI Implications

### FRAME

- A detected flow sequence should propose Process Map nodes.
- The user corrects the map rather than drawing from scratch.
- Gap detection should recognize when activity-level Yamazumi data is missing for the bottleneck as a recommended next measurement, not a required error.

### Process Flow

- Highlight the selected station/wait that drives the current investigation.
- Offer "View activity breakdown" when Yamazumi data is linked.
- Offer "Collect activity breakdown" when Yamazumi data is absent.
- Preserve station order. Do not sort flow charts by mean if sorting destroys process sequence.

### Yamazumi

- Show a visible scope badge: `Full line` or `Selected step`.
- In selected-step scope, show parent flow context above the chart.
- Do not penalize missing stations in selected-step scope.
- Keep activity-type colors fixed and semantic.

### Investigation

- Group flow and Yamazumi questions under the same process node.
- Keep ruled-out questions visible as negative learning.
- Let Evidence Map and Investigation Wall show both line-level and activity-level evidence without duplicating concepts.

### Report

- State whether Yamazumi evidence covered the full line or a selected step.
- Tell the story as location -> mechanism -> action -> verification.
- Use lean verification metrics by default.

## CoScout Behavior

CoScout should support the handoff but not own it.

In Process Flow:

- Use Theory of Constraints and flow language.
- Ask whether the top station/wait has activity-level evidence.
- Suggest collecting Yamazumi data only for the bottleneck when full-line data is not available.

In Yamazumi:

- Use lean language: takt, muda, wait, VA ratio, kaizen.
- Avoid Cpk-first framing unless quality specs are present.
- Help convert waste evidence into mechanism-named SuspectedCause hubs.

CoScout suggestions must remain proposals. Deterministic chart metrics and user-confirmed map links are authoritative.

## Architecture Boundaries

Implementation should preserve package boundaries:

- `@variscout/core`: detection, transforms, aggregation, question generators, projections.
- `@variscout/hooks`: data preparation and mode-specific hook composition.
- `@variscout/charts`: Flow Boxplot, Yamazumi chart, existing I-Chart/Pareto reuse.
- `@variscout/ui`: scoped/full-line badges, mapping panels, improvement components.
- Apps: store wiring, workspace navigation, persistence, Azure-only collaboration/CoScout surfaces.

No DataContext should be introduced. Domain Zustand stores remain source of truth.

## Phasing

### Phase 1: Documentation And Data Contracts

- Update Process Flow docs to describe the locator/microscope relationship.
- Add `YamazumiScope` design to Yamazumi docs.
- Decide how Process Flow stations bind to `ProcessMapNode`.

### Phase 2: Data-Seeded FRAME For Flow

- Detect timestamp station pairs.
- Propose Process Map nodes from station sequence.
- Add deterministic gap guidance for missing activity breakdown.
- Wire `inferMode()` so flow/process structure affects mode selection when Process Flow mode exists.

### Phase 3: Process Flow Foundation

- Implement FlowConfig.
- Implement flow transform.
- Implement Flow Boxplot and Flow Summary.
- Generate Process Flow questions.

### Phase 4: Yamazumi Scoped-Step Bridge

- Add `full-line` vs `scoped-step` Yamazumi scope.
- Link scoped Yamazumi rows to a Process Map node.
- Add "View/Collect activity breakdown" handoff from Process Flow.
- Ensure reports and findings preserve scope.

### Phase 5: Improvement Verification

- Add lean verification metrics to improvement outcomes where missing.
- Support before/after flow and Yamazumi verification.
- Keep Cpk optional unless quality/spec data exists.

## Not In Scope

- Full process mining with arbitrary event graphs.
- Fork/merge/rework process modeling.
- Simulation or scheduling optimization.
- Real-time MES streaming.
- Automatic root-cause claims.
- Full-line Yamazumi data requirement.
- Capability as a mandatory step in lean-flow investigations.

## Testing And Review

Required test coverage:

- timestamp-pair detection fixtures
- Process Map seeding from flow stations
- flow transform derived columns
- Yamazumi `full-line` scope
- Yamazumi `scoped-step` scope
- question generation handoff from Process Flow to Yamazumi
- report wording for partial Yamazumi coverage
- no Cpk-first copy in lean-only workflow

Required review:

- MBB/lean expert review of locator/microscope language.
- Sample walkthrough with bottleneck-only Yamazumi data.
- Sample walkthrough with full-line Yamazumi data.

## Open Decisions

1. Whether `YamazumiScope` belongs in core Yamazumi config or project-level process context.
2. Whether wait times should be represented as Process Map edge entities in V1 or as derived columns only.
3. Whether Process Flow should become a formal `AnalysisMode` in the same release as data-seeded FRAME or ship one release later.
4. Whether improvement projections for flow should be simple delta projections first or use the existing What-If model immediately.
