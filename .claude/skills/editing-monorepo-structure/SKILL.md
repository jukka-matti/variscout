---
name: editing-monorepo-structure
description: Use when adding packages, changing package.json exports, adjusting sub-path exports, or restructuring the monorepo. pnpm workspaces, downward-only dependency flow (core→hooks→ui→apps), @variscout/core sub-path exports (stats, ai, parser, findings, variation, etc), Tailwind v4 @source directive requirement in each app's index.css, workspace:* for internal refs.
---

# Editing Monorepo Structure

## When this skill applies

Use this skill when adding packages, changing package.json exports, adjusting sub-path exports, or restructuring the monorepo layout.

## Architecture overview

DDD-lite with Feature-Sliced Design ([ADR-045](../../docs/07-decisions/adr-045-modular-architecture.md)):

- **Domain layer** (`@variscout/core`) — pure TypeScript, no React. Statistics, parser, glossary, tier system, i18n.
- **Orchestration layer** (`@variscout/hooks`) — React hooks, data pipeline. 78 shared hooks for filtering, analysis, AI, investigation, charts.
- **Presentation layer** (`@variscout/ui`, `@variscout/charts`) — props-based components. 80+ UI modules, 8 chart types, accessibility-first.
- **Apps layer** — Azure (Feature-Sliced + Zustand), PWA (Context, flat). App-specific wiring and persistence.

Dependencies flow strictly downward. Packages never import apps.

## Package structure

```
packages/
├── core/      # @variscout/core - Pure logic, no React. Sub-path exports: 21 granular modules.
├── charts/    # @variscout/charts - React + Visx charts. Depends on core.
├── data/      # @variscout/data - Sample datasets with pre-computed chart data.
├── stores/    # @variscout/stores - 4 Zustand domain stores (project, investigation, improvement, session).
├── hooks/     # @variscout/hooks - 78 React hooks. Depends on core.
└── ui/        # @variscout/ui - 80+ shared UI components. May depend on stores (PI Panel tabs).

apps/
├── pwa/       # @variscout/pwa - PWA website. Session-only, no persistence.
├── azure/     # @variscout/azure-app - Azure Team App. Feature-Sliced + Zustand feature stores.
├── website/   # @variscout/website - Marketing website. Astro + React Islands.
└── docs/      # @variscout/docs - Starlight documentation site.
```

## Sub-path exports (@variscout/core)

The core package supports 21 granular sub-path imports:

| Import Path | Module | Key Exports |
|-------------|--------|-------------|
| `@variscout/core` | Root barrel | Everything (backwards compatible) |
| `@variscout/core/stats` | stats/ | calculateStats, calculateAnova, calculateBoxplotStats, calculateKDE, lttb, predictFromModel, computeCoverage |
| `@variscout/core/ai` | ai/ | responsesApi, buildAIContext, actionTools, chartInsights |
| `@variscout/core/parser` | parser/ | parseText, detectColumns, validateData |
| `@variscout/core/findings` | findings/ | Finding types, factories, helpers, migration, computeHubProjection, detectEvidenceClusters |
| `@variscout/core/variation` | variation/ | Variation tracking, simulation, suggestions |
| `@variscout/core/yamazumi` | yamazumi/ | Yamazumi aggregation, classification, detection |
| `@variscout/core/export` | export.ts | CSV export, PDF metadata |
| `@variscout/core/tier` | tier.ts | configureTier, getTier, isPaidTier, feature gates |
| `@variscout/core/types` | types.ts | All TypeScript domain types |
| `@variscout/core/i18n` | i18n/ | registerLocaleLoaders, preloadLocale, getMessage, formatMessage |
| `@variscout/core/glossary` | glossary/ | Knowledge model, term definitions |
| `@variscout/core/navigation` | navigation.ts | Navigation utilities |
| `@variscout/core/responsive` | responsive.ts | getResponsiveMargins, getResponsiveFonts, getResponsiveTickCount |
| `@variscout/core/performance` | performance.ts | Multi-measure performance analysis |
| `@variscout/core/time` | time.ts | Time column detection and extraction |
| `@variscout/core/projectMetadata` | projectMetadata.ts | Project metadata computation (phase, findings summary, timestamps) |
| `@variscout/core/strategy` | analysisStrategy.ts | resolveMode, getStrategy, AnalysisModeStrategy (ADR-047) |
| `@variscout/core/ui-types` | ui-types/ | DisplayOptions, ScaleMode, HighlightColor, ViewState, ChartTitles, AxisSettings |
| `@variscout/core/evidenceMap` | evidenceMap/ | FactorNodeData, RelationshipEdgeData, OutcomeNodeData, EquationData, CausalEdgeData |
| `@variscout/core/defect` | defect/ | DefectMapping, DefectDetection, DefectDataShape, detectDefectFormat, computeDefectRates |

Apps must call `registerLocaleLoaders()` at startup to provide bundler-specific locale loading.

## Adding a new sub-path export

1. Create the module directory under `packages/core/src/` with an `index.ts` barrel export.
2. Update `packages/core/package.json` exports field:
   ```json
   "exports": {
     "./newModule": "./src/newModule/index.ts"
   }
   ```
3. Update `tsconfig.json` paths (root and `packages/core/tsconfig.json`):
   ```json
   "paths": {
     "@variscout/core/newModule": ["packages/core/src/newModule/index.ts"]
   }
   ```
4. Consumers import: `import { someFunc } from '@variscout/core/newModule'`

Both `package.json` exports and `tsconfig.json` paths must be synchronized, or type resolution breaks at build or editor time.

## Tailwind v4 @source directive (CRITICAL)

Tailwind v4 (`@tailwindcss/vite`) does not reliably auto-scan linked workspace packages in pnpm monorepos. Each app's CSS entry point **must** declare `@source` directives for shared packages, or responsive utility classes from those packages will be silently missing.

Required in each app's `src/index.css`:

```css
@import 'tailwindcss';

@source "../../../packages/ui/src/**/*.tsx";
@source "../../../packages/charts/src/**/*.tsx";
@source "../../../packages/hooks/src/**/*.ts";
```

When adding a new shared package that uses Tailwind classes, add a corresponding `@source` directive to `apps/pwa/src/index.css` and `apps/azure/src/index.css`.

## Import rules

- **Apps import from packages** — `import { calculateStats } from '@variscout/core'`
- **Packages never import apps** — enforced by eslint-plugin-boundaries (ADR-048)
- **@variscout/core** has no React dependencies (stats, parser, glossary, tier)
- **@variscout/charts** depends on @variscout/core
- **@variscout/hooks** depends on @variscout/core (types, utilities, tier)
- **@variscout/ui** depends on @variscout/stores (documented exception for store-aware PI Panel tabs per ADR-056). Props-based components remain preferred for purely presentational UI.

## Naming conventions

- **`*Base`** — Shared primitive component in @variscout/ui (e.g., `PIPanelBase`, `DashboardGrid`). Accepts data/callbacks via props, no app-specific logic.
- **`*WrapperBase`** — App-level chart wrapper in @variscout/ui (e.g., `IChartWrapperBase`, `BoxplotWrapperBase`). Composes shared hooks + Base chart + app UI (display toggles, context menu).
- **App wrappers** (in `apps/*/`) import `*WrapperBase` or `*Base` and add ~50 lines of app-specific context, persistence, and keyboard navigation.

## Adding dependencies

- Root `devDependencies`: shared tooling (TypeScript, ESLint, Vitest)
- Package `dependencies`: package-specific needs
- Use `workspace:*` for internal package references (not file paths)
- `@variscout/azure-app` depends on `zustand` (feature stores, per ADR-041)

## Gotchas

- **Tailwind v4 @source is required** — not optional. Missing it causes responsive utilities from shared packages to silently fail. Check each app's `src/index.css` has entries for every shared package with UI.
- **Sub-path exports need BOTH `package.json` exports AND `tsconfig.json` paths** — forgetting one breaks type resolution at build or editor time.
- **Packages must not import apps** — may be enforced by eslint-plugin-boundaries (ADR-048). Violating this breaks the downward-only dependency flow.
- **Use `workspace:*` for internal refs** — don't reference packages by relative file paths. pnpm workspace resolution handles it automatically.
- **Don't refactor layout casually** — ADR-045 (modular architecture) defines the current DDD-lite + FSD structure. Changes need an ADR update.

## Reference

- **ADR-045** — Modular architecture (DDD-lite + Feature-Sliced Design)
- **ADR-048** — ESLint boundaries (downward-only dependency flow)
- **ADR-056** — PI Panel redesign (store-aware tabs exception)
- **packages/core/package.json** — canonical sub-path exports list (21 modules)
- **Each app's src/index.css** — @source directives (pnpm monorepo requirement)
- **.claude/rules/monorepo.md** — full monorepo rule (live through Phase 2)
