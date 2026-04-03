---
title: Standard ANOVA Metrics & Category Total SS Removal
status: draft
date: 2026-04-03
related-adr: ADR-062
related: [anova, eta-squared, variation-decomposition, factor-intelligence, question-driven-eda]
---

# Standard ANOVA Metrics & Category Total SS Removal

## Problem

VariScout introduced a custom metric — **Category Total SS %** — that combines between-group and within-group sum of squares per category (summing to 100%) to guide drill-down decisions. This was useful before Factor Intelligence existed, but the paradigm has shifted:

1. **R²adj Best Subsets** (ADR-052) now handles factor ranking — it evaluates factor _combinations_ and penalizes complexity. This is a better answer to "which factors matter?" than any single-factor metric.
2. **Question-Driven EDA** (ADR-053) structures the investigation flow — questions carry evidence, not drill-down percentages.
3. The custom metric creates confusion: two "contribution" concepts (η² vs Total SS %), a non-standard number that can't be cross-checked against Minitab/JMP, and information the boxplot visual + StdDev column already communicate.

The ANOVA panel was doing double duty: navigation driver AND statistical reference. With Factor Intelligence owning navigation, ANOVA should become a **clean statistical reference** — recognizable to any Six Sigma trained analyst.

## Decision

### Remove Category Total SS % entirely

Delete the custom metric — calculation, types, UI display, and scope tracking. No internal use, no demoted display. The metric is gone.

### Standardize ANOVA presentation

Replace the narrative AnovaResults card with a compact, standard ANOVA table (Source | DF | SS | F | P) plus η² labeled correctly.

### Clean metric roles

| Metric                      | Role                                                  | Where shown                          |
| --------------------------- | ----------------------------------------------------- | ------------------------------------ |
| **R²adj** (Best Subsets)    | Factor ranking — which factors matter                 | Factor Intelligence panel (PI panel) |
| **η²** (standard)           | Effect size reference — how much this factor explains | ANOVA table (focused boxplot footer) |
| **Boxplot visual + StdDev** | Category comparison — which categories differ         | Boxplot chart + group stats table    |

### Filter chips show sample count, not percentages

`Step = Step 2 (n=30)` instead of `Step = Step 2 (38.3%)`.

### Remove VariationBar

The cumulative scope indicator served the custom metric. Without it, there is no scope to track.

### Rename "Contribution %" to "η²" everywhere

All UI labels, AI prompts, glossary terms, and documentation.

## Metric Roles After This Change

```
SCOUT PHASE
├─ Factor Intelligence (PI panel)
│   ├─ Layer 1: Best Subsets R²adj ranking → "which factor combinations matter?"
│   ├─ Layer 2: Main effects with η² per factor → "how does each factor affect outcome?"
│   └─ Layer 3: Interactions ΔR² → "do factors interact?"
│
├─ Boxplot (chart)
│   ├─ Visual comparison of category distributions
│   ├─ Click category → filter drill-down
│   └─ StdDev visible in stats table → spread is obvious
│
├─ ANOVA table (focused boxplot footer)
│   ├─ Source | DF | SS | F | P → standard reference
│   └─ η² = effect size → credibility for Minitab-trained analyst
│
└─ Filter chips (breadcrumb)
    └─ Factor = Value (n=X) → where you are + how much data
```

## ANOVA Table Design

### Focused boxplot footer layout

Two distinct sections below the chart:

**Section 1: Group Statistics** (existing BoxplotStatsTable — no changes)

```
Step          n    Mean    Median    SD
─────────────────────────────────────────
Step 1       30    32.5     32.1    2.0
Step 2       30    39.4     38.8    8.9  ★
Step 3       30    45.1     45.3    1.5
Step 4       30    33.7     33.5    1.9
Step 5       30    30.4     30.2    1.6
```

**Section 2: One-Way ANOVA** (new compact table replacing AnovaResults card)

```
ONE-WAY ANOVA
Source        DF       SS        F        P
─────────────────────────────────────────────
Factor         4    4,278     11.6   <0.001
Error        145    2,761
Total        149    7,039

η² = 0.61  (61% of variation explained)
```

Design decisions:

- No MS column (MS = SS/DF — saves horizontal space, analyst can compute mentally)
- η² shown below the table as the key takeaway
- No narrative insight text — numbers speak for themselves as a reference panel
- Help tooltip on η² links to glossary definition
- Group means NOT repeated (already in stats table above)
- `generateAnovaInsightLine()` remains available for CoScout conversation use, not shown in panel

## Filter Chip Design

### Breadcrumb chips

```
Before: [Step = Step 2 ▼ 38.3%] [Operator = Night ▼ 32%]
After:  [Step = Step 2 (n=30) ▼] [Operator = Night (n=12) ▼]
```

### FilterChipDropdown

- Available values listed with sample count, no contribution bars
- Sort order: alphabetical or by boxplot sort preference
- No colored percentage bars

### MobileCategorySheet

- Shows group stats (n, Mean, SD) for the tapped category
- Removes "Contribution: X%" display
- Drill-down and pin-as-finding actions unchanged

## η² Labeling Changes

| Component                   | Current                       | New                             |
| --------------------------- | ----------------------------- | ------------------------------- |
| AnovaResults (focused view) | "Contribution 61%"            | ANOVA table + "η² = 0.61 (61%)" |
| QuestionValidation badges   | "Contribution: 61%"           | "η² = 61%"                      |
| MainEffectsPlot             | "η²=0.61"                     | No change                       |
| IdeaGroupCard               | "η² 61%"                      | No change                       |
| BrainstormModal             | "η² 61%"                      | No change                       |
| ReportInvestigationSummary  | formatPercentage(etaSquared)  | "η² = 61%" with label           |
| ActionProposalCard          | "(Contribution 61%)"          | "(η² = 61%)"                    |
| CoScoutPanelBase            | "Interpret... Contribution %" | "Interpret... η² (effect size)" |

### AI prompt changes

- `shared.ts`: flip from "Say 'Contribution %'" → "Say 'η² (effect size)' — the standard ANOVA metric"
- `coScout.ts`: replace all 7 "Contribution %" references with "η²" — same thresholds
- `narration.ts`: update variation contributions summary format

### Question auto-validation (unchanged thresholds)

- ≥15% η² = answered (strong signal)
- <5% η² = ruled-out (negligible)
- 5-15% η² = investigating (inconclusive)

The math was always standard η². Only the label changes.

### Glossary changes

- `etaSquared` term: remove "VariScout displays this as Contribution %"
- Delete `totalSSContribution` term entirely
- Update concept "Contribution, Not Causation" → "Evidence, Not Causation"

## Implementation Phases

### Phase 1: Core metric removal + ANOVA table (code)

**Delete/refactor in `packages/core/`:**

- `variation/contributions.ts` — delete `calculateCategoryTotalSS()`, `getCategoryStats()`
- `variation/drill.ts` — delete `calculateDrillVariation()`
- `variation/suggestions.ts` — delete `calculateFactorVariations()`, `getMaxCategoryContribution()`
- `variation/types.ts` — remove `CategoryTotalSSResult`, `CategoryStats`, scope fraction fields from `DrillLevelVariation`, `DrillVariationResult`
- `variation/index.ts` — update exports
- `navigation.ts` — remove `VARIATION_THRESHOLDS`, `getVariationImpactLevel()`, `getVariationInsight()`
- `index.ts` — update root exports

**Refactor in `packages/hooks/`:**

- `useVariationTracking.ts` — delete the hook entirely. Filter chip data (factor=value, n) can be derived from the existing `useFilterNavigation` hook + raw data count. No dedicated variation tracking hook needed.

**Replace in `packages/ui/`:**

- `AnovaResults/AnovaResults.tsx` — replace narrative card with compact ANOVA table component
- Update `FocusedChartViewBase.tsx` — pass SS data to new ANOVA table

**Update `packages/charts/`:**

- `BoxplotStatsTable.tsx` — no changes needed (already correct)

**Delete tests:**

- `packages/core/src/__tests__/variation.test.ts` — remove Total SS tests
- `packages/core/src/__tests__/categoryStats.test.ts` — delete
- Update `goldenData.test.ts`, `stress.test.ts` — remove scope fraction assertions
- `packages/hooks/src/__tests__/useVariationTracking.test.ts` — rewrite or delete

**Add tests:**

- New ANOVA table component tests (renders Source/DF/SS/F/P correctly)

### Phase 2: UI label cleanup + filter chips (presentation)

**Delete:**

- `VariationBar/` component and all imports

**Update UI components (label changes):**

- `FilterBreadcrumb.tsx` — chips show "Factor = Value (n=X)"
- `FilterChipDropdown.tsx` — remove contribution bars and percentages
- `MobileCategorySheet.tsx` — show group stats instead of contribution %
- `QuestionValidation.tsx` — "η² = X%" label
- `ActionProposalCard.tsx` — "(η² = X%)"
- `CoScoutPanelBase.tsx` — help text update
- `ReportInvestigationSummary.tsx` — add η² label
- `ProcessHealthBar.tsx` — remove variation data dependency if present

**Update AI prompts:**

- `packages/core/src/ai/prompts/shared.ts` — flip Contribution % → η²
- `packages/core/src/ai/prompts/coScout.ts` — 7+ reference updates
- `packages/core/src/ai/prompts/narration.ts` — update format

**Update i18n:**

- Remove/update `display.contribution` and `display.contributionDesc` across 30+ locale files

**Update glossary:**

- `packages/core/src/glossary/terms.ts` — update etaSquared, remove totalSSContribution
- `packages/core/src/glossary/concepts.ts` — update "Contribution, Not Causation"

### Phase 3: Documentation rewrite (narrative)

**Write:**

- `docs/07-decisions/adr-062-standard-anova-metrics.md`

**Critical rewrites:**

- `docs/03-features/analysis/variation-decomposition.md` — remove custom metric, keep ANOVA identity + η²
- `docs/01-vision/progressive-stratification.md` — reframe from scope containment to evidence-based prioritization
- `docs/01-vision/constitution.md` — update principle #6
- `docs/03-features/workflows/drill-down-workflow.md` — rewrite filter chip section
- `docs/03-features/navigation/progressive-filtering.md` — remove contribution % explanation

**High-impact updates:**

- `docs/05-technical/statistics-reference.md` — rewrite Parts 10-11
- `docs/04-cases/bottleneck/index.md` — reframe case study narrative
- `docs/03-features/analysis/boxplot.md` — update category display docs
- `docs/03-features/analysis/stats-panel.md` — update metrics table

**Medium-impact updates:**

- `docs/03-features/workflows/investigation-to-action.md`
- `docs/03-features/learning/glossary.md`
- `docs/05-technical/architecture/mental-model-hierarchy.md`
- `docs/05-technical/architecture/ai-journey-integration.md`
- ADRs: add historical notes to adr-015, adr-020, adr-023, adr-052, adr-053, adr-054

**Low-impact updates:**

- `.claude/rules/monorepo.md` — update useVariationTracking description
- `CLAUDE.md` — update if needed
- Design specs in `docs/superpowers/specs/` — add notes where referenced

## What Doesn't Change

- Factor Intelligence (Best Subsets R²adj, Main Effects, Interactions) — untouched
- Question-driven EDA and auto-validation thresholds (still uses η²) — thresholds unchanged
- Drill-down interaction (click category → filter) — stays, just without custom % annotations
- BoxplotStatsTable — stays as-is
- All chart components (IChart, Boxplot, Pareto, Yamazumi) — untouched
- `computeHubEvidence` — uses R²adj for standard mode, waste% for yamazumi — unchanged
- `findBestSubgroup` — unchanged
- SuspectedCause hub model — unchanged

## Verification

### Phase 1 verification

```bash
pnpm test                          # All tests pass
pnpm build                         # All packages build
pnpm --filter @variscout/core test # Core tests pass (variation tests updated/removed)
```

- Focused boxplot view shows compact ANOVA table with Source/DF/SS/F/P + η²
- BoxplotStatsTable unchanged above ANOVA table
- No TypeScript errors from removed types

### Phase 2 verification

```bash
pnpm test                          # All tests pass
pnpm build                         # All packages build
```

- Filter chips show "Factor = Value (n=X)" without percentages
- VariationBar gone from all views
- All "Contribution %" labels replaced with "η²"
- CoScout conversation uses "η²" not "Contribution %"
- Mobile category sheet shows group stats
- Glossary updated

### Phase 3 verification

```bash
pnpm docs:check                    # Doc health check passes
```

- variation-decomposition.md reflects standard metrics only
- Bottleneck case study reframed with evidence-based narrative
- ADR-062 exists and is indexed
- No broken doc cross-references

## Risk Assessment

- **Low risk**: Custom metric removal is a subtraction — no behavioral change to core analysis
- **Medium risk**: Filter chips losing percentages may initially confuse users who relied on them — but n=X is more universally useful
- **Medium risk**: Documentation volume (29 files) — phased approach mitigates
- **Low risk**: AI prompt changes — same thresholds, just different labels
- **No risk**: η² calculation is unchanged — it was always standard SS_Between/SS_Total
