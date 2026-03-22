---
title: "ADR-023: Verification Experience — Data Lifecycle, Staged Comparison, and the 'Did It Work?' Interaction"
audience: [analyst, engineer]
category: architecture
status: Accepted
date: 2026-03-16
related: [staged-analysis, findings, investigation-workflow, ai-context]
---

# ADR-023: Verification Experience — Data Lifecycle, Staged Comparison, and the "Did It Work?" Interaction

**Status**: Accepted

**Date**: 2026-03-16

## Context

When an analyst completes an improvement action and returns with new data, the question is: **"Did it work?"** This is one of VariScout's most important interactions — it's the payoff of the entire investigation workflow. And right now, the product only partially supports it.

Three layers of gaps surfaced during analysis:

**Layer 1 — Data lifecycle**: Azure has append/merge (`useDataMerge`) but it's undocumented. Time extraction doesn't re-run on append. Investigation state is lost on new project.

**Layer 2 — Staged analysis is visual-only**: The I-Chart shows staged control limits, but there's no quantified comparison (mean shift, Cpk delta, variation ratio) anywhere in the UI. Stats panel shows only overall stats.

**Layer 3 — The verification experience is fragmented**: The analyst must manually drill, flip filters, do mental math, and manually record outcomes. No chart, panel, or AI component is specifically designed for the verification moment. There's no verification checklist, no auto-filled outcomes, no "improvement confirmed" narrative.

---

## Current State: Verification Touchpoint Audit

### What works today

| Touchpoint               | Verification Capability                                          | Status                              |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------- |
| **I-Chart**              | Stage dividers, per-stage control limits, per-stage Nelson rules | Ready                               |
| **Boxplot**              | Can drill by Stage factor, shows distribution per category       | Partial — no dual-stage view        |
| **Capability**           | Shows histogram + Cpk for filtered data                          | Partial — no before/after overlay   |
| **Pareto**               | Ranked by contribution                                           | Partial — no ranking change view    |
| **Stats Panel**          | Shows overall stats                                              | Missing — no per-stage breakdown    |
| **NarrativeBar**         | Summarizes current state                                         | Not stage-aware                     |
| **ChartInsightChip**     | Deterministic insights per chart                                 | Not stage-aware                     |
| **CoScout**              | Can answer questions about stats                                 | Generic — no verification prompts   |
| **InvestigationSidebar** | Phase-aware questions (Improving phase)                          | Generic — no verification checklist |
| **FindingsPanel**        | Outcome recording (cpkAfter, effectiveness)                      | No cpkBefore, no auto-fill          |

### What the analyst actually does (today)

1. Combine before+after data with Stage column → upload
2. I-Chart shows staged view → **visually** spot mean shift and limit changes
3. Manually drill into Stage "After" → Boxplot by problem factor → **eyeball** distribution change
4. Remove Stage filter, add Stage "Before" → **eyeball** same Boxplot → **mentally compare**
5. Check Stats panel → see **overall** stats (not per-stage) → **no Cpk delta visible**
6. Open Finding → manually enter cpkAfter → guess at cpkBefore from memory
7. Mark Resolved

**This is 7 steps with 3 manual filter swaps and mental arithmetic.** The product computes per-stage stats internally but doesn't surface the comparison anywhere.

---

## Decision

### 1. Data Lifecycle Architecture

#### All data entry paths

| Path                  | Type    | App   | Stats recalc | ANOVA recalc | Variation % | Finding snapshots | Time re-extract |
| --------------------- | ------- | ----- | ------------ | ------------ | ----------- | ----------------- | --------------- |
| File upload (replace) | Replace | Both  | Yes          | Yes          | Yes         | Preserved (audit) | Yes             |
| Paste (replace)       | Replace | Both  | Yes          | Yes          | Yes         | Preserved (audit) | Yes             |
| Sample load           | Replace | Both  | Yes          | Yes          | Yes         | Preserved (audit) | Yes             |
| Manual entry (new)    | Replace | Both  | Yes          | Yes          | Yes         | Preserved (audit) | Yes             |
| File upload (append)  | Append  | Azure | Yes          | Yes          | Yes         | Preserved (audit) | **Gap: No**     |
| Paste (append)        | Append  | Azure | Yes          | Yes          | Yes         | Preserved (audit) | **Gap: No**     |
| Manual entry (append) | Append  | Azure | Yes          | Yes          | Yes         | Preserved (audit) | **Gap: No**     |
| Load project          | Restore | Azure | No (cached)  | No (cached)  | No (cached) | Restored          | No              |
| New project           | Wipe    | Both  | N/A          | N/A          | N/A         | **Lost**          | N/A             |

**Finding snapshot semantics**: Findings are audit records by design. When data changes (replace or append), finding snapshots retain their original statistics — they record what was true at the time of observation, not what's true now. This is correct behavior for investigation audit trails.

#### Append architecture (Azure only)

Append entry points live in `apps/azure/src/features/data-flow/`. Auto-detection (`detectMergeStrategy()`) determines whether new data should be appended as rows or merged as columns based on column overlap.

**Time extraction gap**: `augmentWithTimeColumns()` in `packages/core/src/time.ts` runs on initial data load but does not re-run on append. Derived time columns (Hour, Day of Week, etc.) don't extend to appended rows. Fix is ~5 lines in the append handler — call `augmentWithTimeColumns()` on the combined dataset after merge.

#### Daily monitoring scaling

Current architecture supports daily monitoring through append:

- **Row ceiling**: 250K rows (Azure), enforced in `useDataIngestion`
- **Persistence**: Full-JSON serialization to OneDrive (Team plan) — no archival or compression
- **Practical limit**: ~6 months of daily batches at typical manufacturing volumes before hitting row ceiling or OneDrive sync latency

### 2. Staged Verification — Current Capabilities

`calculateStatsByStage()` in `packages/core/src/stats/staged.ts` computes per-stage statistics:

```typescript
interface StagedStatsResult {
  stages: Map<string, StatsResult>; // Per-stage: mean, σ, Cpk, Nelson, pass rate
  stageOrder: string[]; // Ordered stage names
  overallStats: StatsResult; // Combined stats for reference
}
```

The I-Chart renders staged data correctly:

- Stage dividers with labels
- Independent control limits per stage (UCL/LCL drawn per-stage)
- Nelson rules computed per-stage (violations don't span boundaries)

**What the Stats panel does NOT display**: No per-stage breakdown, no deltas, no comparison. It shows only `overallStats` — the combined statistics across all stages.

### 3. Verification Experience Vision

The analyst's real questions during verification, and how each should be answered:

| Question                                   | Answering Component                    | Available Today?                   |
| ------------------------------------------ | -------------------------------------- | ---------------------------------- |
| "Did the mean shift toward target?"        | Staged Comparison Card                 | **Yes** (StagedComparisonCard)     |
| "Did variation reduce?"                    | Staged Comparison Card / Boxplot       | **Yes** (quantified deltas)        |
| "Did Cpk cross the target?"                | Staged Comparison Card                 | **Yes** (Cpk comparison)           |
| "Are there fewer violations?"              | I-Chart violation summary              | No (count not surfaced)            |
| "Did the specific factor improve?"         | Boxplot dual-stage or ChartInsightChip | **ChartInsightChip: Yes** (Tier 3) |
| "Did anything else get worse?"             | Pareto ranking change / I-Chart        | Manual only                        |
| "Is the change statistically significant?" | Not available                          | No                                 |
| "Summary: did it work?"                    | NarrativeBar / CoScout                 | **Yes** (stage-aware, Tier 3)      |

#### Target state — the analyst's verification journey:

**Step 1 — Upload combined data with Stage column**
Same as today. Stage auto-detected, staged I-Chart renders.

**Step 2 — I-Chart: "Is the process more stable?"**

- Today: visual comparison of control limits. Nelson violations per-stage.
- Enhancement: **Violation summary** below I-Chart — "Before: 8 violations / After: 0"
- Enhancement: **ChartInsightChip** detects staged data → "Improvement: 8 violations eliminated, mean shifted -2.1 units"

**Step 3 — Stats: "By how much did it improve?"** ✅ Delivered

- **StagedComparisonCard** replaces Stats panel in staged mode, showing per-stage mean, σ, Cpk, pass %, and deltas with trend arrows

The code already supports **N stages** (`StagedStatsResult.stages` is a `Map<string, StatsResult>`, `stageOrder` is an ordered array) — the I-Chart renders any number of stages correctly.

**2 stages (Before/After)**: Simple side-by-side with delta column.

**3+ stages (PDCA cycles, phased rollout, seasonal)**:

| Stage              | n   | Mean     | σ        | Cpk       | Pass %   | Violations |
| ------------------ | --- | -------- | -------- | --------- | -------- | ---------- |
| Before             | 50  | 502.3    | 2.8      | 0.89      | 94%      | 8          |
| Pilot 1            | 30  | 500.8    | 2.1      | 1.15 ↑    | 97% ↑    | 2 ↓        |
| Pilot 2            | 30  | 500.2    | 1.9      | 1.32 ↑    | 98% ↑    | 0 ↓        |
| **Δ (first→last)** |     | **-2.1** | **-32%** | **+0.43** | **+4pp** | **-8**     |

Color-coded: green = improved, red = degraded, amber = marginal change. For 2 stages, the table collapses to a compact Before/After card.

**Step 4 — Boxplot: "Did the specific factor improve?"**

- Today: must manually flip Stage filters to compare
- Enhancement: When Stage column active and a factor is selected, **Boxplot shows Before/After grouping** per category (e.g., "Station 2 Before | Station 2 After")
- Simpler alternative: ChartInsightChip shows "Station 2 contribution dropped from 35% to 12%"

**Step 5 — Capability: "Are we within spec now?"**

- Today: single histogram for current filter
- Enhancement: When in staged mode, show **Before Cpk vs After Cpk** as header text above histogram. A small comparison badge is simpler than a histogram overlay.

**Step 6 — NarrativeBar: "Summary — did it work?"** ✅ Delivered (Tier 3)

- NarrativeBar is stage-aware: when staged data is detected, `buildSummaryPrompt()` instructs the model to summarize improvement quantitatively (mean shift, Cpk delta, variation change)

**Step 7 — Record outcome** ✅ Delivered

- `cpkBefore` field added to `FindingOutcome` — auto-filled from first stage in ReportView
- `cpkAfter` auto-filled from last stage. Delta shown to analyst for effectiveness confirmation.
- With 3+ stages: auto-fill from first and last stage, show full progression in outcome summary.

**Step 8 — CoScout: "What should I check?"** ✅ Delivered (Tier 3)

- When in staged verification mode, CoScout system prompt injects staged comparison metrics and verification coaching
- `buildSuggestedQuestions()` generates verification-specific prompts ("Did the targeted factor improve?", "Are there new violations?", "Is Cpk above target?") when staged comparison data exists

**Step 9 — InvestigationSidebar: Verification checklist**

- Today: generic phase guidance
- Enhancement: When in improving phase with staged data, show a **checklist**:
  - ☐ I-Chart: violations reduced?
  - ☐ Boxplot: problem factor improved?
  - ☐ Capability: Cpk above target?
  - ☐ Side effects: nothing new degraded?
  - ☐ Outcome recorded

### 4. Multi-Stage Verification (3+ Stages)

The architecture already supports N stages — `calculateStatsByStage()` returns a `Map<string, StatsResult>` with any number of entries. The I-Chart renders separate control limits for each.

**Real use cases for 3+ stages:**

- **PDCA iteration cycles**: Before → Fix 1 → Fix 2 → Final — progressive improvement tracking
- **Phased rollout**: Pilot Line 1 → Expand Line 2 → Full rollout
- **Seasonal / periodic comparison**: Q1 / Q2 / Q3 / Q4
- **Material / supplier batches**: Lot A / Lot B / Lot C — which batch is best?
- **Multi-intervention**: Root cause had 3 contributing factors fixed sequentially

**How the analyst uses it:**

1. Combines all data periods into one dataset with a Stage column (e.g., "Week 1", "Week 2", "Week 3", "Week 4")
2. Or uses `stageOrderMode: 'data-order'` to preserve chronological sequence
3. I-Chart shows all stages with independent limits — visual progression
4. Staged Comparison Card shows the full table with trend arrows
5. Delta row compares first stage (baseline) to last stage (current)
6. Analyst can drill into any specific stage via the Stage factor in Boxplot

**Append + Stage**: The analyst can also **append** new data as it comes in, adding a Stage value to each new batch. This combines daily monitoring with staged comparison — the dataset grows, stages accumulate, and the comparison card shows the full progression.

### 5. Improvement Designs (Prioritized)

**Tier 1 — Documentation and small fixes (this ADR):**

- Document append architecture, finding snapshot semantics, verification decision guide
- Design auto time re-extraction on append (~5 lines)
- Document the verification workflow honestly (what's visual-only today)

**Tier 2 — Staged Comparison Metrics (core enhancement):** ✅ Implemented (Mar 2026)

- ✅ `calculateStagedComparison()` in `@variscout/core/stats/staged.ts` — computes deltas, trend indicators, color coding
- ✅ `StagedComparisonCard` in `@variscout/ui` — replaces Stats panel when staged data is active
- ✅ `cpkBefore` field in `FindingOutcome` + auto-fill from staged data
- ✅ `buildStagedComparisonInsight()` for ChartInsightChip — stage-aware deterministic insights
- Verification checklist in InvestigationSidebar — not yet implemented (generic phase guidance only)

**Tier 3 — AI-enhanced verification (requires AI context changes):** ✅ Implemented (Mar 2026)

Delivered:

- Stage-aware NarrativeBar prompt — `buildSummaryPrompt()` detects staged comparison data and instructs the model to summarize improvement quantitatively (mean shift, Cpk delta, variation change)
- Verification-aware CoScout system prompt — `buildCoScoutSystemPrompt()` injects staged comparison metrics and verification coaching when staged data is present
- Metric-grounded suggested questions — `buildSuggestedQuestions()` generates verification-specific prompts ("Did the targeted factor improve?", "Are there new violations?", "Is Cpk above target?") when staged comparison data exists
- `stagedComparison` field in `AIContext` — `buildAIContext()` now includes staged comparison summary (per-stage stats, deltas, trend indicators) so all AI components can reason about verification state

**Tier 4 — Advanced visualization (higher effort):**

- Dual-stage Boxplot — Before/After grouping per category within a single chart
- Capability histogram overlay or comparison badge — Before Cpk vs After Cpk header
- Pareto ranking change view — show rank changes between stages

**Not in scope (documented as future):**

- Continue Investigation workflow (row limit / schema change scenarios)
- Statistical significance test (t-test for mean shift, Levene's for variance)
- Archival for long-running projects beyond 250K row ceiling

### 6. Verification Decision Guide

| User Intent                   | Approach                                                     | What They'll See                                                |
| ----------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Prove improvement worked      | **Staged Analysis** — combine before+after with Stage column | I-Chart stages + (future) comparison card + auto-filled outcome |
| More observations, same setup | **Append rows** (Azure) — paste or upload additional data    | Extended dataset, stats recalculate, findings preserved         |
| Process redesign (new schema) | **New project** — save current, start fresh                  | Fresh data (investigation state lost — future: carry forward)   |
| Daily monitoring              | **Append** + periodic save                                   | Running dataset grows, OneDrive syncs (Team plan)               |

## Consequences

### Positive

- Verification is recognized as a core product interaction, not just a data operation
- Staged analysis becomes a quantified verification tool, not just a visual comparison
- Finding snapshots remain point-in-time (correct model) — staged comparison provides the before/after
- Auto-filled outcomes reduce manual error and improve audit trail quality
- AI components become verification-aware, closing the loop between investigation and resolution
- Clear prioritization allows incremental delivery without blocking the core workflow

### Negative

- Stats panel needs a staged mode variant — additional UI complexity
- `FindingOutcome` type change (`cpkBefore` field) requires migration for existing findings
- AI context assembly needs staged data — increases prompt token budget
- Dual-stage Boxplot is a significant chart modification (Tier 4)

### Neutral

- Append architecture is already functional; this ADR documents rather than creates it
- Time extraction gap is a known ~5-line fix; documenting it here creates accountability
- N-stage support is already in core; UI needs to expose it

---

## Code References

| Reference                   | File                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `calculateStatsByStage()`   | `packages/core/src/stats/staged.ts`                                  |
| I-Chart staged rendering    | `packages/charts/src/IChart.tsx`                                     |
| Stats panel (overall only)  | `packages/ui/src/components/StatsPanel/StatsPanelBase.tsx`           |
| `buildIChartInsight()`      | `packages/core/src/ai/chartInsights.ts`                              |
| `buildSuggestedQuestions()` | `packages/core/src/ai/suggestedQuestions.ts`                         |
| `buildAIContext()`          | `packages/core/src/ai/buildAIContext.ts`                             |
| `FindingOutcome`            | `packages/core/src/findings.ts`                                      |
| InvestigationSidebar        | `packages/ui/src/components/FindingsWindow/InvestigationSidebar.tsx` |
| Merge logic                 | `apps/azure/src/hooks/useDataMerge.ts`                               |
| Append entry points         | `apps/azure/src/features/data-flow/`                                 |
| Time extraction             | `packages/core/src/time.ts`                                          |
| Row limits                  | `packages/hooks/src/useDataIngestion.ts`                             |

## See Also

- [Staged Analysis](../03-features/analysis/staged-analysis.md) — feature documentation
- [Investigation to Action](../03-features/workflows/investigation-to-action.md) — full investigation workflow
- [Data Flow Architecture](../05-technical/architecture/data-flow.md) — data pipeline overview
- [ADR-020: Investigation Workflow](adr-020-investigation-workflow.md) — hypothesis model
- [ADR-019: AI Integration](adr-019-ai-integration.md) — AI architecture
