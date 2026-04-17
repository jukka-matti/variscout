---
name: editing-analysis-modes
description: Use when editing mode resolution, strategy pattern, or mode-specific features across yamazumi, performance, defect, process-flow, or capability modes. resolveMode() + getStrategy() in @variscout/core/strategy, chart slot mapping per mode, CoScout methodology coaching per mode, mode transforms (computeYamazumiData, computeDefectRates), adding a new analysis mode end-to-end. Mode-specific details in YAMAZUMI.md, PERFORMANCE.md, DEFECT.md, PROCESS-FLOW.md reference files.
---

# Editing Analysis Modes

## When this skill applies

Use this skill whenever you are:

- Editing `resolveMode()` or `getStrategy()` in `packages/core/src/analysisStrategy.ts`
- Adding, changing, or debugging mode-specific chart slot assignments
- Wiring a mode transform (aggregation step that runs before the stats engine)
- Editing CoScout methodology coaching per mode
- Adding a new analysis mode end-to-end
- Working on yamazumi, performance, defect, or capability mode features
- Touching process-flow design (design-only — no runtime code yet)

## Strategy Pattern (ADR-047)

The strategy pattern eliminates scattered mode ternaries. Instead of repeating `if (mode === 'yamazumi') ...` across 10+ files, callers do a single lookup.

**Key files:**

- `packages/core/src/analysisStrategy.ts` — `resolveMode()`, `getStrategy()`, strategy registry, `AnalysisModeStrategy` interface
- Exported via `@variscout/core/strategy`

**Two-step lookup:**

```typescript
import { resolveMode, getStrategy } from '@variscout/core/strategy';

// 1. Resolve: AnalysisMode (persisted) → ResolvedMode (rendering)
const resolved = resolveMode(analysisMode, { standardIChartMetric });

// 2. Look up the strategy object
const strategy = getStrategy(resolved);

// 3. Use strategy fields — no mode branching
return <strategy.chartSlots.slot1 />;
```

**`AnalysisMode` (persisted domain type, in `types.ts`):**
`'standard' | 'performance' | 'yamazumi' | 'defect'`

This type is saved to IndexedDB, referenced in AI context strings, and drives auto-detection. Do not rename it.

**`ResolvedMode` (rendering type, in `analysisStrategy.ts`):**
`'standard' | 'capability' | 'performance' | 'yamazumi' | 'defect'`

`capability` is not an `AnalysisMode` — it is produced by `resolveMode()` when `standardIChartMetric === 'capability'`. Process-flow will add a sixth resolved mode when implemented.

**`AnalysisModeStrategy` interface fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `chartSlots` | `{ slot1..slot4: ChartSlotType }` | Four chart slot identifiers |
| `kpiComponent` | `ResolvedMode` | Which KPI summary to render |
| `reportTitle` | `string` | Report page heading |
| `reportSections` | `string[]` | Which report sections appear |
| `metricLabel` | `(hasSpecs: boolean) => string` | Primary KPI label |
| `formatMetricValue` | `(v: number) => string` (optional) | KPI value formatting |
| `aiChartInsightKeys` | `string[]` | Which charts CoScout narrates |
| `aiToolSet` | `'standard' \| 'performance' \| 'yamazumi'` | CoScout tool routing |
| `questionStrategy` | `QuestionStrategy` | Evidence metric + question focus |

## The 6 Modes

| Mode | `AnalysisMode` value | `ResolvedMode` value | Status |
|------|---------------------|---------------------|--------|
| Standard | `'standard'` | `'standard'` | Production |
| Capability | (none — sub-state of standard) | `'capability'` | Production |
| Performance | `'performance'` | `'performance'` | Production |
| Yamazumi | `'yamazumi'` | `'yamazumi'` | Production |
| Defect | `'defect'` | `'defect'` | Production |
| Process Flow | (planned: `'process-flow'`) | (planned: `'process-flow'`) | DESIGN-ONLY — no code yet |

**Standard** is the default when no special data format is detected. **Capability** is activated within standard mode by toggling the capability I-Chart metric — it is NOT a separate `AnalysisMode` value.

## Chart Slot Mapping (Summary Table)

Each strategy always defines exactly 4 slots. See per-mode reference files for full detail.

| Slot | Standard | Capability | Performance | Yamazumi | Defect |
|------|----------|-----------|-------------|----------|--------|
| 1 | `ichart` | `capability-ichart` | `cpk-scatter` | `yamazumi-chart` | `ichart` |
| 2 | `boxplot` | `boxplot` | `distribution-boxplot` | `yamazumi-ichart` | `boxplot` |
| 3 | `pareto` | `pareto` | `cpk-pareto` | `yamazumi-pareto` | `pareto` |
| 4 | `stats` | `stats` | `histogram` | `yamazumi-summary` | `defect-summary` |

**Rule: always 4 slots, never more.** If a new mode needs more views, introduce a switcher within a slot (e.g., yamazumi Pareto's 5-mode switcher, defect Pareto's factor selector), not a fifth slot.

`ChartSlotType` union lives in `analysisStrategy.ts`. Add new values to the union when adding chart slots — this gives compile-time safety if a strategy object is incomplete.

## Mode Transforms

Some modes require a data aggregation step **before** the stats engine runs. The transform converts raw parsed data into a working dataset that all four chart slots and ANOVA consume.

```
Raw data → [Mode Transform] → Working dataset → Stats engine → All 4 charts
                ↑
          Filters trigger re-transform
```

**Transform-required modes:**

| Mode | Transform function | Location | Trigger |
|------|--------------------|----------|---------|
| Yamazumi | `computeYamazumiData()` | `packages/core/src/yamazumi/aggregation.ts` | Detected by `detectYamazumiFormat()` at import |
| Defect | `computeDefectRates()` | `packages/core/src/defect/transform.ts` | Triggered by `detectDefectFormat()` → user confirms `DefectDetectedModal` |
| Process Flow (planned) | `computeFlowData()` (not yet coded) | TBD | Planned: timestamp pair detection |

**No transform:** Standard, capability, and performance modes pass the raw parsed data directly to the stats engine. Performance mode's multi-channel structure is handled in the chart layer via `ChannelResult[]`, not a pre-transform.

**React hook:** `useDefectTransform` in `@variscout/hooks` wraps `computeDefectRates()` with reactive re-aggregation — it re-runs the transform when filters change, because drilling down to a specific defect type requires filtering the raw events first, then re-aggregating.

## CoScout Coaching Per Mode

Each strategy's `aiToolSet` field routes the mode to mode-specific methodology coaching in the CoScout prompt system (`packages/core/src/ai/prompts/coScout/modes/`).

| Mode | `aiToolSet` | Coaching language |
|------|------------|------------------|
| Standard | `'standard'` | SPC language: variation, control limits, ANOVA, R²adj |
| Capability | `'standard'` | Adds Cpk, spec limits, process capability interpretation |
| Performance | `'performance'` | Multi-channel: "which channel performs worst?", Cpk comparison across fill heads/nozzles |
| Yamazumi | `'yamazumi'` | Lean: value-add ratio, waste elimination, takt compliance, cycle time vs takt |
| Defect | `'standard'` | Defect language: failure modes, defect rate, Pareto 80/20, COPQ — never uses Cpk or spec limits |

CoScout receives `strategy.aiToolSet` via `buildAIContext()` → `assembleCoScoutPrompt()`. The prompt system dispatches to the matching mode coaching file based on this value. See `.claude/skills/editing-coscout-prompts/SKILL.md` for the prompt architecture.

## Adding a New Mode

Follow this checklist when implementing a new analysis mode:

1. **Add to `AnalysisMode`** in `packages/core/src/types.ts` — this is the persisted domain type.
2. **Add to `ResolvedMode`** in `packages/core/src/analysisStrategy.ts` if the new mode needs its own resolved rendering.
3. **Update `resolveMode()`** — add the `if (mode === 'new-mode') return 'new-mode'` branch.
4. **Add `ChartSlotType` values** — add any new slot type strings to the `ChartSlotType` union.
5. **Add strategy object** — add one entry to the `strategies` registry with all 4 slots, KPI, metric labels, AI hints, question strategy.
6. **Add mode transform if needed** — if the mode requires aggregation, implement `compute*()` in `packages/core/src/[mode]/`, add detection, wire `DefectDetectedModal`-style confirmation UX.
7. **Update CoScout coaching** — add a mode file in `packages/core/src/ai/prompts/coScout/modes/`.
8. **Update exhaustive mode switches** — search for `Record<AnalysisMode, ...>` and `ALL_MODES` patterns; there are ~10-15 files that iterate modes.
9. **Add `USER-JOURNEYS-{MODE}.md`** Tier 2 doc alongside the other user journey mode docs.
10. **Add reference file** in `.claude/skills/editing-analysis-modes/` mirroring the pattern of `YAMAZUMI.md` etc.
11. **Update feature-parity matrix** in `docs/08-products/feature-parity.md`.

## Gotchas

- **Always 4 chart slots.** Do not introduce a 5th slot or change the slot count for any mode. If a mode needs alternate views, add a switcher within one slot (see yamazumi Pareto 5-mode or defect Pareto factor-selector for examples). Changing slot count breaks the dashboard layout contract.
- **Mode transform runs BEFORE stats, not after.** `computeYamazumiData()` and `computeDefectRates()` produce the working dataset that the stats engine (`calculateStats`, `calculateAnova`, `computeBestSubsets`) operates on. Never call the stats engine on raw event-log data in defect mode — the data shape will be wrong.
- **Process-flow has no runtime code yet.** The spec (`docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`) is detailed, but `resolveMode()` does not handle `'process-flow'` and there is no strategy entry for it. Do not write code that calls into non-existent process-flow infrastructure.
- **Yamazumi activity-type colors are fixed.** `ACTIVITY_TYPE_COLORS` in `packages/core/src/yamazumi/types.ts` must not be changed per drill level or per user preference. VA = `#22c55e`, NVA Required = `#f59e0b`, Waste = `#ef4444`, Wait = `#94a3b8`. These match lean convention globally.
- **`capability` is not in `AnalysisMode`.** Never add `'capability'` to the `AnalysisMode` union — it would break persistence, i18n keys, and AI context. Capability is produced by `resolveMode()` from `standardIChartMetric`, not a separate mode value.
- **`isPerformanceMode` is removed.** It was deleted across ~67 references. Never re-introduce it. `analysisMode === 'performance'` is the correct check if you need to branch (but prefer `getStrategy()` instead).
- **Defect mode CoScout never uses Cpk language.** The `defect` strategy uses `aiToolSet: 'standard'` but the CoScout phase prompts for defect mode explicitly exclude Cpk, Cp, and spec limit references. Do not mix defect coaching into capability mode or vice versa.

## Reference

Per-mode implementation detail:

- `YAMAZUMI.md` — `computeYamazumiData()`, activity types, takt time, chart slot detail
- `PERFORMANCE.md` — `ChannelResult[]`, multi-channel drill-down, chart slot detail
- `DEFECT.md` — `computeDefectRates()`, three data shapes, Evidence Map three-view model
- `PROCESS-FLOW.md` — Design intent only; no code exists yet

Architecture decisions:

- `docs/07-decisions/adr-047-analysis-mode-strategy.md` — Strategy pattern rationale and implementation status
- `docs/07-decisions/adr-034-yamazumi-analysis-mode.md` — Yamazumi mode design and chart slot decisions
- `docs/07-decisions/adr-038-subgroup-capability.md` — Subgroup capability (relates to capability mode)

Defect mode specs:

- `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`
- `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`

Process flow spec:

- `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`
