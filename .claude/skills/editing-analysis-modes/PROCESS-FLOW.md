<!-- TOC: Status · Intended scope · Relationship to Yamazumi · Planned chart slots · CoScout intent · Design reference -->

# Process Flow Mode Reference

> **DESIGN-ONLY. No runtime code exists for this mode as of April 2026.**
> `resolveMode()` does not handle `'process-flow'`. The strategy registry has no `processFlow` entry.
> Do not write code that imports or calls process-flow infrastructure — it does not exist yet.

- [Status](#status)
- [Intended Scope](#intended-scope)
- [Relationship to Yamazumi Mode](#relationship-to-yamazumi-mode)
- [Planned Chart Slots](#planned-chart-slots)
- [Planned Mode Transform](#planned-mode-transform)
- [CoScout Intent](#coscout-intent)
- [Design Reference](#design-reference)

## Status

- **Spec status:** `draft` (dated 2026-04-07)
- **Code status:** None. `AnalysisMode` does not yet include `'process-flow'`. No parser detection, no mode transform, no strategy object.
- **Planned as:** Fifth analysis mode (after standard, performance, yamazumi, defect)
- **Source:** MBB expert discussion 2026-03-29 — "you need to see output rate at individual process stations"

## Intended Scope

Process Flow mode investigates how **output rate, cycle time, and lead time vary across a sequential production line**. The analyst's question: "Which station or which wait between stations causes variation in overall line performance?"

**Input data shape (planned):** One row per product. Wide-form with paired timestamp columns per station (`St1_Start` / `St1_End`, `St2_Start` / `St2_End`, etc.) plus optional categorical factors (operator, shift) and continuous test results (weight, dimension).

**Planned derived columns:** Station cycle times, wait times between stations, lead time, output rate per station and for the line. These derived columns feed the existing analysis pipeline unchanged.

**What it is NOT:** Not process mapping, not simulation, not scheduling. Variation analysis applied to sequential process flow data.

## Relationship to Yamazumi Mode

Process Flow and Yamazumi address adjacent lean questions at different levels of granularity:

| Dimension | Process Flow | Yamazumi |
|-----------|-------------|----------|
| Level | Line / station | Activity / step |
| Input | Paired timestamps per station | Activity type + cycle time per activity |
| Y | Output rate or lead time | Cycle time per activity type |
| Question | "Which station is the bottleneck?" | "What's inside the bottleneck station?" |
| Relationship | Planned: click bottleneck station → Yamazumi drill-down (Phase 2) | Already implemented |

The intended Phase 2 connection: when a station in Process Flow has Yamazumi activity data, clicking it opens the Yamazumi view for that station's activity breakdown.

## Planned Chart Slots

Per the design spec, the strategy pattern entry would be:

| Slot | `ChartSlotType` (planned) | Chart (planned) | Purpose |
|------|--------------------------|-----------------|---------|
| 1 | `'lineOutputIChart'` | I-Chart with derived output rate Y | Line output rate or lead time over time |
| 2 | `'flowBoxplot'` | Flow Boxplot (new component) | Station CTs and wait times interleaved in sequence order |
| 3 | `'stationPareto'` | Pareto (reused) | Stations ranked by R²adj contribution to Y variation |
| 4 | `'flowSummary'` | Flow Summary panel | Lead time stats, flow efficiency, bottleneck identification |

**Flow Boxplot** is the key new chart — it shows station cycle times and wait times in process sequence order (never re-sorted), with bottleneck highlighted red and high-variation waits highlighted amber.

## Planned Mode Transform

Similar to yamazumi and defect, process flow would require a pre-analysis transform:

- **Input:** Wide-form timestamp pairs
- **Transform:** `computeFlowData()` (not yet coded) — derives cycle times, wait times, lead time, output rate
- **Output:** Working dataset with derived numeric columns, consumed by all four charts and the stats engine

Detection would use `detectFlowFormat()` (not yet coded) — recognizes paired datetime columns with matching prefixes.

## CoScout Intent

Mode-specific coaching would use Theory of Constraints and flow thinking:

- ToC language: bottleneck, constraint, throughput, drum-buffer-rope
- Flow language: lead time, flow efficiency, WIP accumulation (conceptual)
- Sequential reasoning: "upstream variation propagates downstream"
- Lean connections: links to Yamazumi when activity data available for a station

`questionStrategy.generator` would be `'flowAnalysis'` (not yet in the union).

## Design Reference

Full specification: `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`

The spec covers: data model, parser detection heuristic, `FlowConfig` type, `FlowStation` type, column mapping UX, dashboard layout, Flow Boxplot visual rules, parallel station drill-down, question strategy examples, CoScout integration, investigation journey, and three-phase delivery plan.

When implementing this mode, start from that spec. Follow the same pattern used for defect mode delivery: detection → modal confirmation → column mapping → mode transform → strategy registration → CoScout coaching → tests.
