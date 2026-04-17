# @variscout/charts

React + visx chart components. Standard (I-Chart, Boxplot, Pareto), Performance (multi-channel), Yamazumi, Evidence Map.

## Hard rules

- Never hardcode hex colors. Use `chartColors`, `chromeColors`, `operatorColors` from `packages/charts/src/colors.ts`.
- Never add manual `React.memo()` to new chart components. React Compiler (babel-plugin-react-compiler) handles memoization.
- All charts must export both the responsive wrapper (e.g., `IChart`) and the base component (e.g., `IChartBase`). Consumers pick.
- Props interfaces named `{ComponentName}Props`. Never pass data via React context — props-based only.

## Invariants

- Theme via `useChartTheme()` hook. Returns `{ isDark, chrome, colors, fontScale }`. Never read `data-theme` directly.
- Responsive utilities: `getResponsiveMargins(width, chartType)`, `getResponsiveFonts(width)`, `getResponsiveTickCount(size, axis)` from `@variscout/core/responsive`.
- Boxplot auto-switches to jittered dots when a category has < `MIN_BOXPLOT_VALUES` (7) points. Per-category, not per-chart.
- Adaptive category limits: Boxplot uses `MIN_BOX_STEP=50px`; Pareto uses `PARETO_MAX_CATEGORIES=20` with "Others" aggregation.
- I-Chart control-limit violations are force-included in LTTB decimation (never hidden). `lttb()` lives in `@variscout/core/stats`.
- Export dimensions are fixed (see EXPORTS.md in editing-charts skill).

## Test command

```bash
pnpm --filter @variscout/charts test
```

## Skills to consult

- `editing-charts` — primary reference for all chart work
- `editing-evidence-map` — when touching EvidenceMap/
- `editing-analysis-modes` — when touching PerformanceIChart, YamazumiChart, or mode-specific charts

## Related

- ADR-002 Visx charts
- ADR-005 Props-based charts
- ADR-051 Chart many categories
- docs/06-design-system/charts/chart-sizing-guide.md
