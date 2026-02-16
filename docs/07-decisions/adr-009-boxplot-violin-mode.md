# ADR-009: Boxplot Violin Mode

**Status:** Accepted
**Date:** 2026-02-16
**Deciders:** Product team

## Context

Boxplots are the primary chart in the FLOW lens for factor comparison. They show quartiles, median, whiskers, and outliers but completely hide the distribution shape. Bimodal data, skewness, and clustering are invisible in standard box elements.

Quality professionals need to see distribution shape to identify mixed populations (e.g., two operators with different settings creating bimodal output) before drilling down.

## Decision

Add a violin plot toggle to boxplot charts that overlays KDE-based density curves behind the box elements.

### Key choices:

1. **Toggle over separate chart** -- Distribution shape is context for boxplot comparison, not a separate analysis step. Adding it as a toggle keeps the workflow linear.

2. **Gaussian kernel with Silverman's rule-of-thumb bandwidth** -- Industry standard, well-understood, no tuning parameters. Formula: `h = 0.9 * min(stdDev, IQR/1.34) * n^(-1/5)`.

3. **`@visx/stats` ViolinPlot component** -- Already installed (`^3.12.0`), renders mirrored SVG path from `{ value, count }[]` data. No new dependencies.

4. **Controlled via `displayOptions.showViolin`** -- Follows the established pattern for user-togglable chart features (like `showContributionLabels`, `showControlLimits`).

5. **Platform parity: PWA + Azure, not Excel** -- Excel Add-in provides core SPC only per [ADR-007](adr-007-azure-marketplace-distribution.md).

## Implementation

- `calculateKDE()` added to `@variscout/core/stats.ts` (pure math, no React dependency)
  - Gaussian kernel with Silverman's rule-of-thumb bandwidth (matches R/ggplot2 and Plotly)
  - Evaluation range extends 3 bandwidths beyond data (matches R/ggplot2 `cut=3` default)
  - 100 evaluation points (smooth curves for bimodal distributions, negligible cost)
- `showViolin` prop added to `BoxplotProps` and `PerformanceBoxplotProps` in `@variscout/charts`
- **Violin-primary rendering** (industry standard, matching Seaborn/Plotly/ggplot2):
  - Density curve is the dominant shape (wide, 0.35 fill opacity, 0.7 stroke opacity)
  - Thin inner IQR box (20% of band width) shows Q1-Q3 range inside the violin
  - Median line spans thin box only
  - Mean diamond centered inside violin
  - Whiskers, whisker caps, and outlier circles are hidden (replaced by the density curve)
- Memoized KDE computation per group/channel
- Settings toggle: "Show distribution shape" in PWA Settings Panel

## Consequences

- Users can identify bimodal distributions and skewness before committing to a drill-down path
- No performance impact when disabled (KDE not computed)
- Violin-primary rendering matches industry tools (Seaborn, Plotly, ggplot2) — familiar to quality professionals
- Persists across drill-down navigation via `displayOptions` state

## See Also

- [Boxplot Feature](../03-features/analysis/boxplot.md)
- [Boxplot Design System](../06-design-system/charts/boxplot.md)
- [FLOW Lens](../01-vision/four-lenses/flow.md)
