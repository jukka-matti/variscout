# @variscout/charts

React + visx chart components. Standard (I-Chart, Boxplot, Pareto), Performance (multi-channel), Evidence Map.

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
- I-Chart control-limit violations are force-included in LTTB decimation (never hidden — naive dropping is a signal-hiding correctness bug). `lttb()` lives in `@variscout/core/stats`.
- Export dimensions are fixed via `EXPORT_SIZES` keys in `useChartCopy.ts` (`scatter` 1200×800, `slide` 1920×1080, etc). Charts re-render at fixed dimensions via ResizeObserver — output is identical across view contexts. Don't inline new sizes.

## Evidence Map

- 3-layer composited SVG in `EvidenceMapBase`: **Layer 1 Statistical** (factor nodes by R²adj, edge types) renders in BOTH PWA and Azure, gated on `bestSubsets.subsets[0].rSquaredAdj > 0.05`. **Layer 2 Investigation** (CausalLink edges + evidence badges) and **Layer 3 Synthesis** (SuspectedCause hub convergence zones) are **Azure-only** — PWA hosts pass empty `causalEdges` / `convergencePoints` and the layers don't render.
- **`EvidenceMapBase` is props-only** — no store access, no React context. Pattern matches `IChartBase` / `BoxplotBase`. Use `useEvidenceMapData` (in `@variscout/hooks`) in the host component, never inside `EvidenceMapBase` or its sub-layers.
- **Click vs right-click contracts must not be swapped**: `onEdgeClick` → `EdgeDetailCard` (anchored, with mini-chart); `onEdgeContextMenu` → `EdgeContextMenu` (cursor-positioned action list). Causal edges (Layer 2) use separate state (`selectedEdgeId`) — don't reuse `selectedRelEdge`.
- Promote-to-causal: edge detail "Promote" sets `causalLinkDraft` to pre-fill `CausalLinkCreator` modal with source/target + `evidenceType: 'data'`. No new modal needed.
- Mobile (`enableZoom={true}` + `compact={true}`) is read-only: no causal-link editing, no pop-out, no chart-panel slide-in. Touch targets 44px, labels hidden until zoom > 1.5x for 8+ factors.
- The 5 engine relationship types (Independent / Overlapping / Synergistic / Interactive / Redundant) are mapped to 3 user-facing labels (Independent / Overlap / Interact) via `mapRelationshipType()`. Don't expose engine types in UI strings.

## Test command

```bash
pnpm --filter @variscout/charts test
```

## Related

- ADR-002 Visx charts
- ADR-005 Props-based charts
- ADR-051 Chart many categories
- docs/06-design-system/charts/chart-sizing-guide.md
