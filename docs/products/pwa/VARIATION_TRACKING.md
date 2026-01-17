# Cumulative Variation Tracking

**Status:** Specification  
**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

Cumulative Variation Tracking transforms the breadcrumb navigation from simple filter history into an actionable insight tool. Each drill-down level shows what percentage of variation is explained, and the cumulative total tells users exactly how much of their problem they've isolated.

**Key Insight:** The breadcrumb trail isn't just navigation — it's cumulative math that tells you exactly how much of your total problem you've isolated.

---

## The Methodology

### Eta-Squared (η²) at Each Level

At each drill level, we calculate **eta-squared** — the proportion of variance in the outcome explained by the grouping factor:

```
η² = SS_between / SS_total
```

Where:

- SS_between = Sum of squares between groups
- SS_total = Total sum of squares

### Cumulative Calculation

Each drilldown level **multiplies** to show cumulative impact:

| Level | Factor      | Local η² | Cumulative Calculation | Total Impact     |
| ----- | ----------- | -------- | ---------------------- | ---------------- |
| 0     | All Data    | 100%     | 100%                   | 100% (baseline)  |
| 1     | Shift       | 67%      | 100% × 67%             | = 67% of total   |
| 2     | Night Shift | 89%      | 100% × 67% × 89%       | = 59.6% of total |
| 3     | Machine C   | 78%      | 100% × 67% × 89% × 78% | = 46.5% of total |

**The insight:** By drilling three levels deep, you've isolated 46.5% of ALL your variation into ONE specific condition: Machine C on Night Shift.

---

## Decision Thresholds

### Local Variation (η²) — What to drill into

| Variation % | Action                                     | Rationale                   |
| ----------- | ------------------------------------------ | --------------------------- |
| > 50%       | **Recommended drill** — highlight visually | Primary driver of variation |
| > 80%       | **Strong focus**                           | Highly concentrated issue   |
| 30-50%      | Investigate                                | Worth exploring             |
| < 30%       | Multiple factors                           | Check for interactions      |

### Cumulative Variation — What you've isolated

| Cumulative % | Color | Interpretation                        |
| ------------ | ----- | ------------------------------------- |
| > 50%        | Red   | "More than half your problem is HERE" |
| 30-50%       | Amber | "Significant chunk isolated"          |
| < 30%        | Gray  | "One of several contributors"         |

---

## UI Design

### Compact Breadcrumb (Default View)

```
🏠 All Data → Shift (67%) → Night (89%) → Machine C (78%)  [46%]  [×]
```

Components:

- **Home icon** — Root/All Data link
- **Factor labels** — With local variation % in parentheses
- **Cumulative badge** — Color-coded total (green/amber/gray)
- **Clear button** — Reset all filters

### Tooltip on Cumulative Badge

On hover over the cumulative badge `[46%]`:

```
┌─────────────────────────────────────────────────┐
│ 📊 46.5% of total variation isolated            │
│                                                 │
│ Fix this combination to address nearly half    │
│ your quality problems.                          │
│                                                 │
│ 🔴 High impact — strong case for action         │
└─────────────────────────────────────────────────┘
```

### Visual Drill Suggestions (Boxplot)

When a boxplot category explains > 50% of variation:

- Subtle glow or highlight on that bar
- Small indicator icon (↓ or similar)
- NOT auto-drilling — just a visual cue

---

## Visual Variation Display

### Stacked Variation Bar

The breadcrumb now includes a visual progress bar below the navigation trail that provides immediate visual feedback about how much variation has been isolated.

```
🏠 All Data → Shift (67%) → Machine C (89%)
[██████████░░░░░░░░░░] 60% isolated | 40% unexplained
```

**Design:**

- Two-segment horizontal bar (8px height)
- Left segment (colored): isolated variation percentage
- Right segment (gray): remaining unexplained variation
- Labels below bar show percentages
- Tooltip on hover with insight text

**Color Coding:**

| Isolated % | Color | Meaning                               |
| ---------- | ----- | ------------------------------------- |
| ≥ 50%      | Green | High impact — more than half isolated |
| 30-50%     | Amber | Moderate impact — significant chunk   |
| < 30%      | Blue  | Low impact — one of several factors   |

**Responsive Behavior:**

- Desktop: Full bar with labels below
- Mobile: Bar only (set `showLabels={false}`)

**Implementation:**

- Component: `apps/pwa/src/components/VariationBar.tsx`
- Integrated into: `DrillBreadcrumb.tsx`
- Uses: `getVariationImpactLevel()`, `getVariationInsight()` from `@variscout/core`

---

## Variation Funnel Panel

A slide-in analysis tool that helps identify the optimal 1-3 factor combinations that explain ~70% of variation.

### Access

- **Toolbar button:** Filter icon in header toolbar
- **Popout:** Opens in new window for dual-screen setups
- **URL parameter:** `?view=funnel` for direct access to standalone view

### Features

1. **Ranked factors** — Sorted by η² (highest first)
2. **Checkboxes** — Select/deselect factors to include in analysis
3. **Visual bars** — Show each factor's individual contribution
4. **Best value indicator** — Shows which category has highest impact
5. **Cumulative tracker** — Combined % updates as factors are selected
6. **70% target line** — Visual goal indicator (configurable)
7. **Apply button** — Sets selected filters in main view

### Funnel Visualization

```
┌─────────────────────────────────────────────────────────┐
│  VARIATION FUNNEL                              [↗] [×]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Total Variation (100%)                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  ☑ Shift                                       67%      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                      │
│    Highest impact: Night                    [Drill →]   │
│                                                         │
│  ☑ Machine                                     47%      │
│  ━━━━━━━━━━━━━━━━━━━━━                                  │
│    Highest impact: C                        [Drill →]   │
│                                                         │
│  ☐ Operator                                    35%      │
│  ━━━━━━━━━━━━━                                          │
│    Highest impact: Bob                      [Drill →]   │
│                                                         │
│  ─ ─ ─ ─ ─ ─ ─ ⎯ 70% Target ⎯ ─ ─ ─ ─ ─ ─ ─           │
│                                                         │
│  Combined Explained                             82%     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━| ← target         │
│  These 2 factors explain 82% of your variation          │
│                                                         │
│  [ 🔍 Apply 2 Filters ]                                 │
│  Filters to highest-impact values for selected factors  │
└─────────────────────────────────────────────────────────┘
```

### Algorithm: Greedy Factor Selection

The `findOptimalFactors()` function uses a greedy algorithm to select factors:

```typescript
// packages/core/src/variation.ts
export function findOptimalFactors(
  data: any[],
  factors: string[],
  outcome: string,
  targetPct: number = 70,
  maxFactors: number = 3
): OptimalFactorResult[];
```

1. Calculate η² for each factor
2. Sort factors by η² descending
3. Greedily select factors until:
   - Target % reached (default: 70%), OR
   - Max factors selected (default: 3)
4. Calculate cumulative % as product of remaining variation

**Example:**

| Factor                   | η²  | Remaining After | Cumulative Isolated |
| ------------------------ | --- | --------------- | ------------------- |
| Shift                    | 67% | 33%             | 67%                 |
| Machine                  | 45% | 33% × 55% = 18% | 82%                 |
| ← Stop: 82% > 70% target |

### Popout Window Mode

Open via external link icon or URL parameter `?view=funnel`:

- Standalone funnel view in separate window
- Syncs with main window via localStorage events
- Useful for dual-screen analysis workflows

**Sync Mechanism:**

```typescript
// Main window writes state to localStorage
localStorage.setItem('variscout-sync', JSON.stringify(state));

// Popout listens for storage events
window.addEventListener('storage', e => {
  if (e.key === 'variscout-sync') {
    // Update funnel with new data
  }
});
```

### Implementation Files

| File                                          | Purpose                          |
| --------------------------------------------- | -------------------------------- |
| `apps/pwa/src/components/VariationFunnel.tsx` | Core funnel component            |
| `apps/pwa/src/components/FunnelPanel.tsx`     | Slide-in panel wrapper           |
| `apps/pwa/src/components/FunnelWindow.tsx`    | Standalone popout view           |
| `packages/core/src/variation.ts`              | `findOptimalFactors()` algorithm |
| `apps/pwa/src/App.tsx`                        | `?view=funnel` route detection   |
| `apps/pwa/src/components/AppHeader.tsx`       | Funnel toolbar button            |

---

## Data Flow

```
┌─────────────────┐
│   Raw Data      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Level 1: getEtaSquared(rawData, "Shift", outcome)      │
│  Result: 67% — Shift explains 67% of total variation    │
└────────┬────────────────────────────────────────────────┘
         │ Filter: Shift = "Night"
         ▼
┌─────────────────────────────────────────────────────────┐
│  Level 2: getEtaSquared(filtered1, "Machine", outcome)  │
│  Result: 89% — Within Night Shift, Machine explains 89% │
│  Cumulative: 67% × 89% = 59.6%                          │
└────────┬────────────────────────────────────────────────┘
         │ Filter: Machine = "C"
         ▼
┌─────────────────────────────────────────────────────────┐
│  Level 3: getEtaSquared(filtered2, "Operator", outcome) │
│  Result: 78% — Within Machine C, Operator explains 78%  │
│  Cumulative: 67% × 89% × 78% = 46.5%                    │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation

### Shared Architecture

Variation tracking is implemented as shared functionality in `@variscout/core`, enabling use across all VariScout platforms:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          @variscout/core                                     │
│  ├─ variation.ts      → Pure calculation functions                          │
│  └─ navigation.ts     → Types, thresholds, insight helpers                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
     PWA                      Excel Add-in                Azure (future)
  (full breadcrumb)     (boxplot % indicator)         (full breadcrumb)
```

### Core Functions (packages/core/src/variation.ts)

```typescript
// Calculate cumulative variation through a drill path
export function calculateDrillVariation(
  rawData: any[],
  filters: Record<string, (string | number)[]>,
  outcome: string
): DrillVariationResult | null;

// Calculate η² for each factor (for drill suggestions)
export function calculateFactorVariations(
  data: any[],
  factors: string[],
  outcome: string,
  excludeFactors?: string[]
): Map<string, number>;

// Check if factor should be highlighted (≥50% threshold)
export function shouldHighlightDrill(variationPct: number): boolean;
```

### Types (packages/core/src/navigation.ts)

```typescript
export interface BreadcrumbItem {
  id: string;
  label: string;
  isActive: boolean;
  source: DrillSource;
  // Variation tracking
  localVariationPct?: number; // η² at this level (e.g., 67)
  cumulativeVariationPct?: number; // Product of all η² (e.g., 46.5)
}

export const VARIATION_THRESHOLDS = {
  HIGH_IMPACT: 50, // Red, strong recommendation
  MODERATE_IMPACT: 30, // Amber, worth investigating
} as const;
```

### PWA Hook (apps/pwa/src/hooks/useVariationTracking.ts)

A thin React wrapper around the shared calculation functions:

```typescript
export function useVariationTracking(
  rawData: any[],
  drillStack: DrillAction[],
  outcome: string | null,
  factors: string[]
): VariationTrackingResult {
  // Uses calculateDrillVariation and calculateFactorVariations from @variscout/core
  // Returns enhanced breadcrumb items with variation data
}
```

### Boxplot Integration (packages/charts/src/Boxplot.tsx)

The shared `BoxplotBase` component accepts optional variation props:

```typescript
interface BoxplotProps {
  // ... existing props ...
  variationPct?: number; // Display % on axis label
  variationThreshold?: number; // Default: 50 for "drill here" indicator
}
```

When `variationPct` is provided:

- X-axis label shows `Factor (X%)`
- If ≥ threshold: red color + "↓ drill here" indicator

### Auto-Switch on Drill (packages/core/src/variation.ts)

When drilling down, charts automatically switch to show the factor with highest remaining variation:

```typescript
// Get the next recommended factor after drilling
export function getNextDrillFactor(
  factorVariations: Map<string, number>,
  currentFactor: string,
  minThreshold: number = 5 // Minimum 5% variation to recommend
): string | null;
```

**How it works:**

1. User clicks "Machine A" in Boxplot
2. Data filters to Machine A (existing behavior)
3. System calculates η² for remaining factors in filtered data
4. Boxplot and Pareto automatically switch to factor with highest η²

**Example flow:**

```
Step 1: Viewing by Machine → Click "Machine A"
        → Data filters to Machine A
        → Highest η² in filtered data: Shift (67%)
        → Both charts switch to show Shift distribution

Step 2: Now viewing by Shift → Click "Night"
        → Data filters to Machine A + Night Shift
        → Highest η² in filtered data: Operator (45%)
        → Both charts switch to show Operator distribution
```

This creates a "variation funnel" that guides users through the analysis.

### Pareto Comparison View (Ghost Bars)

When filters are active, Pareto can show how the filtered distribution compares to the full population:

```
PARETO: Shift (filtered to Machine A)
┌──────────────────────────────────────┐
│  ░░░░    Night causes 60% of         │
│  ████    Machine A problems          │
│  ████                                │
│  ████    But only 30% overall        │
│  ████    (ghost bar shows 30%)       │
│  ████    → Specific to Machine A!    │
│  ░░░░ ████                           │
│  ░░░░ ████ ░░░░ ████                 │
└──────────────────────────────────────┘
  ████ = Filtered %    ░░░░ = Overall %
```

**Toggle UI:**

- Eye icon button appears in Pareto header when filters are active
- Click to toggle ghost bars on/off
- Default: OFF (hidden)

**Tooltip comparison:**

When ghost bars are enabled, hovering shows:

```
Category: Night
Count: 45
Cumulative: 60.0%
─────────────────
Filtered: 60.0%
Overall: 30.0%
↑ 30.0% vs overall  (red = over-represented)
```

This reveals whether a problem is specific to the filtered context or a general pattern.

---

## User Flow Example

### Starting Point

User loads data showing high variation in product weight.

**I-Chart:** Shows instability pattern  
**Boxplot:** Comparing by Shift  
**Breadcrumb:** `🏠 All Data`

### Drill 1: Into Shift

User sees Shift explains 67% of variation. Clicks "Night Shift" bar.

**Breadcrumb:** `🏠 All Data → Shift (67%)`  
**Badge:** `[67%]` (green)

### Drill 2: Into Machine

Within Night Shift, Machine explains 89%. Clicks "Machine C".

**Breadcrumb:** `🏠 All Data → Shift (67%) → Machine C (89%)`  
**Badge:** `[60%]` (green)

### Drill 3: Root Cause

Within Machine C on Night Shift, Operator explains 78%.

**Breadcrumb:** `🏠 All Data → Shift (67%) → Machine C (89%) → New Ops (78%)`  
**Badge:** `[46%]` (green)

**Tooltip:** "Fix this combination to address nearly half your quality problems."

### Actionable Outcome

User now knows: **New operators on Machine C during Night Shift** account for 46% of all weight variation. This is a specific, actionable finding for targeted training.

---

## Why This Changes Everything

| Traditional Approach                | VaRiScout Breadcrumb                              |
| ----------------------------------- | ------------------------------------------------- |
| "Our Cp is 0.4, process is chaotic" | "46% of variation = Machine C on Nights"          |
| "We need to improve quality"        | "Fix this ONE combination = half the problem"     |
| Scatter resources across everything | Laser focus on highest-impact target              |
| Months of unfocused effort          | Days to targeted solution                         |
| "Quality is everyone's job"         | "Machine C Night Shift team: here's your mission" |

---

## Platform Support

| Platform  | Feature                           | Implementation                                  |
| --------- | --------------------------------- | ----------------------------------------------- |
| **PWA**   | Full breadcrumb with cumulative % | `useVariationTracking` hook → `DrillBreadcrumb` |
| **PWA**   | Stacked variation bar             | `VariationBar.tsx` below breadcrumb             |
| **PWA**   | Variation funnel panel            | `VariationFunnel.tsx` in slide-in panel         |
| **PWA**   | Popout funnel window              | `FunnelWindow.tsx` + `?view=funnel` route       |
| **PWA**   | Drill suggestions on boxplot      | `factorVariations` → boxplot with highlight     |
| **Excel** | Variation % on boxplot axis label | `calculateFactorVariations` → `BoxplotBase`     |
| **Azure** | Full breadcrumb + variation bar   | Same as PWA                                     |
| **Azure** | Variation funnel panel            | Same as PWA                                     |

---

## Related Documentation

- [Architecture Overview](../../../ARCHITECTURE.md) — Shared architecture diagram
- [Statistics Reference](../../STATISTICS_REFERENCE.md) — Eta-squared calculation details
- [Navigation Architecture](../../design-system/NAVIGATION_ARCHITECTURE.md) — Drill-down patterns
- [Monorepo Architecture](../../MONOREPO_ARCHITECTURE.md) — Package structure
- [Product Specification](./VaRiScout-Product-Specification.md) — Full feature spec
