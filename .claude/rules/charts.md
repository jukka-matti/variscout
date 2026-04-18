---
paths:
  - "packages/charts/**"
  - "apps/*/src/**/charts/**"
  - "apps/*/src/**/*Chart*.{ts,tsx}"
---

# Chart code — editing invariants

- **Colors only via `chartColors` / `chromeColors`** from `@variscout/charts/colors`. No hex literals. ESLint rule `no-hardcoded-chart-colors` is enforced and errors.
- **Theme-aware colors via `useChartTheme()`**; do not read CSS vars directly in chart components.
- **Pattern**: Base (Visx / SVG primitives) + responsive wrapper. Don't ship a raw Base without the wrapper.
- **Export dimensions**: use `EXPORT_SIZES` keys from `useChartCopy.ts` (including `scatter` 1200×800 and `slide` 1920×1080). Don't inline new sizes.
- **Large N**: LTTB decimation before plotting continuous series; fallback to dot plot when N < threshold (see editing-charts skill).
- **Pareto / Boxplot overflow**: handled by the Base; don't re-implement inside apps.

Reference: `.claude/skills/editing-charts/SKILL.md`, `COLORS.md`, `EXPORTS.md`.
