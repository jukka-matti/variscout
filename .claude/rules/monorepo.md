# Monorepo Rules

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic, glossary (no React)
├── charts/    # @variscout/charts - React + Visx (standard + Performance charts), useChartTheme
├── data/      # @variscout/data - Sample datasets with pre-computed chart data
├── hooks/     # @variscout/hooks - Shared React hooks:
│              #   useChartScale - Y-axis scale calculation
│              #   useDrillDown - Drill-down navigation with breadcrumbs
│              #   useVariationTracking - Cumulative η² tracking
│              #   useDataState - Shared DataContext state management
│              #   useKeyboardNavigation - Arrow key focus management
│              #   useResponsiveChartMargins - Dynamic chart margins
└── ui/        # @variscout/ui - HelpTooltip, useGlossary, colors, hooks

apps/
├── pwa/          # @variscout/pwa - PWA website
├── azure/        # @variscout/azure-app - Azure Team App
├── website/      # @variscout/website - Marketing website (Astro + React Islands)
└── excel-addin/  # @variscout/excel-addin - Excel Add-in
```

## Import Rules

- Apps import from packages: `import { calculateStats } from '@variscout/core'`
- Packages never import from apps
- `@variscout/core` has no React dependencies (exports stats, parser, glossary)
- `@variscout/charts` depends on `@variscout/core`
- `@variscout/hooks` depends on `@variscout/core` (for types and utilities)
- `@variscout/ui` exports `HelpTooltip`, `useGlossary`, `useIsMobile`, `gradeColors`, `errorService`

## Build Commands

```bash
pnpm build              # Build all
pnpm --filter @variscout/pwa build    # Build specific package
pnpm -r build           # Build recursively
```

## Adding Dependencies

- Root devDependencies: Shared tooling (TypeScript, ESLint)
- Package dependencies: Package-specific needs
- Use `workspace:*` for internal package references
