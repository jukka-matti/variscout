<!-- TOC: ChannelResult[] · Multi-channel drill-down · Chart slots · operatorColors · CoScout coaching -->

# Performance Mode Reference

- [What Performance Mode Is](#what-performance-mode-is)
- [ChannelResult Type](#channelresult-type)
- [No Mode Transform](#no-mode-transform)
- [Chart Slot Mapping](#chart-slot-mapping)
- [Multi-Channel Drill-Down](#multi-channel-drill-down)
- [operatorColors Palette](#operatorcolors-palette)
- [CoScout Coaching Language](#coscout-coaching-language)
- [Key Files](#key-files)

## What Performance Mode Is

Performance mode analyzes multiple measurement channels simultaneously — fill heads, injection cavities, nozzles, or any parallel process channels that produce the same measurable output. The analyst's question is: "Which channel performs worst, and by how much?"

Auto-detected when multiple numeric columns share a common prefix (e.g., `Head1`, `Head2`, `Head3` or `Cavity_A`, `Cavity_B`). The user can also override mode manually.

**`AnalysisMode` value:** `'performance'`
**`ResolvedMode` value:** `'performance'`

## ChannelResult Type

The stats engine (`calculatePerformanceStats()` or equivalent channel aggregation) produces `ChannelResult[]` — one entry per detected channel. All four performance chart components accept `channels: ChannelResult[]` as their primary data prop.

Key fields on `ChannelResult`:
- `channelName: string` — display label (e.g., "Head 1", "Cavity A")
- `cpk: number | undefined` — channel Cpk (undefined if no specs)
- `mean: number`
- `sigma: number`
- `n: number`
- `data: number[]` — raw measurements for this channel (used in histogram Slot 4)

## No Mode Transform

Performance mode does **not** use a pre-analysis mode transform. The multi-channel structure is handled entirely in the chart layer via `ChannelResult[]`. Raw parsed data flows directly to the stats engine, which extracts per-channel arrays from the wide-form column structure.

This is unlike yamazumi (`computeYamazumiData()`) and defect (`computeDefectRates()`) which aggregate raw rows before analysis.

## Chart Slot Mapping

| Slot | `ChartSlotType` | Component | Purpose |
|------|-----------------|-----------|---------|
| 1 | `'cpk-scatter'` | `PerformanceIChart` / `PerformanceIChartBase` | Cpk scatter plot — all channels side by side |
| 2 | `'distribution-boxplot'` | `PerformanceBoxplot` / `PerformanceBoxplotBase` | Distribution comparison (up to 5 channels) |
| 3 | `'cpk-pareto'` | `PerformancePareto` / `PerformanceParetoBase` | Cpk ranking, worst-first (up to 20 channels) |
| 4 | `'histogram'` | `PerformanceCapability` / `PerformanceCapabilityBase` | Single-channel histogram for selected channel |

**Slot 1 (Cpk scatter):** Each point is one channel's Cpk. Horizontal spec limit line if `cpkTarget` set. Channels below spec highlighted red.

**Slot 2 (Distribution boxplot):** Shows up to 5 channels to prevent over-crowding. When more channels exist, selection prioritizes worst Cpk (same logic as `selectBoxplotCategories()` with `smaller-is-better` spec direction). Violin mode available via `showViolin` prop.

**Slot 3 (Cpk Pareto):** All channels ranked worst-first (lowest Cpk first). Up to 20 channels shown. Evidence label = `'Channel Cpk'` (not R²adj).

**Slot 4 (Histogram):** Renders for the `selectedMeasure` channel. When no channel is selected, defaults to the worst Cpk channel. Uses capability histogram component — shows distribution + spec limits if available.

## Multi-Channel Drill-Down

**`selectedMeasure` prop** drives drill-down across all four charts. Setting it focuses Slot 4 on a specific channel and highlights that channel across Slots 1–3.

Interaction pattern:
- Click a channel in Slot 1 (scatter) or Slot 3 (pareto) → sets `selectedMeasure`
- Slot 4 updates to show that channel's histogram
- Slot 1/3 highlights the selected channel
- `onChannelClick` callback on all three chart components

**State location:** `selectedMeasure` lives in the app's display options / UI state, not in `@variscout/stores`. Both PWA and Azure apps manage this locally.

## operatorColors Palette

Multi-channel charts use the `operatorColors` array from `packages/charts/src/colors.ts` to assign distinct colors to channels. 8-color array, cycles if more than 8 channels.

```typescript
import { operatorColors } from '@variscout/charts/colors';

// channels[i] gets color operatorColors[i % operatorColors.length]
```

Do not hardcode hex values for channels. Do not use `chartColors.pass/fail/mean` for channels — those are reserved for spec compliance semantics.

## CoScout Coaching Language

`aiToolSet: 'performance'` routes to multi-channel methodology coaching.

**Use:** channel performance, Cpk comparison, worst performer, fill head, cavity, nozzle, channel variation, multi-channel analysis, channel-specific investigation.

**Question focus:** `'Which channel performs worst?'` — evidence metric is `channelCpk`, evidence label is `'Channel Cpk'`.

**Do not use:** yamazumi terminology (cycle time, takt), defect terminology (failure mode, defect rate).

**Phase framing:**
- FRAME: "Which channels are out of spec? What is the spread across channels?"
- SCOUT: "Rank channels by Cpk. Identify the worst performer."
- INVESTIGATE: "What factor (shift, operator, batch) explains the worst channel's variation?"
- IMPROVE: "If Channel 3 improves to target Cpk, what is the fleet-wide impact?"

`questionStrategy.generator = 'channelRanking'` — questions are driven by `channelCpk` rather than `rSquaredAdj`.

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/performance.ts` | Multi-measure performance analysis, `ChannelResult` type |
| `packages/charts/src/` | `PerformanceIChart`, `PerformanceBoxplot`, `PerformancePareto`, `PerformanceCapability` (+ `Base` variants) |
| `packages/charts/src/colors.ts` | `operatorColors` array |
| `packages/core/src/analysisStrategy.ts` | `performance` strategy object (cpk-scatter / distribution-boxplot / cpk-pareto / histogram) |
| `docs/07-decisions/adr-038-subgroup-capability.md` | Subgroup capability (relates to capability histogram in Slot 4) |
| `.claude/rules/charts.md` | Performance Charts section — max 5 boxplot, max 20 pareto, props pattern |
