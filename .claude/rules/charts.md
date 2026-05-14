---
paths:
  - "packages/charts/**"
  - "apps/*/src/**/charts/**"
  - "apps/*/src/**/*Chart*.{ts,tsx}"
---

# Chart code — non-negotiables

- **Colors only via `chartColors` / `chromeColors`** from `@variscout/charts/colors`. No hex literals. ESLint `no-hardcoded-chart-colors` enforces.
- **Theme via `useChartTheme()`**; never read `data-theme` directly.
- **Pair `text-{color}-400` with `text-{color}-700`** for label contrast (red/amber/green-400 fail light-mode contrast alone).
- **No manual `React.memo()`** on new chart components — React Compiler handles memoization.
- **LTTB must force-include UCL/LCL violations** — silent dropping is a correctness bug.

Detailed patterns: `packages/charts/CLAUDE.md`.
