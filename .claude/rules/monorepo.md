# Monorepo Rules

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic, glossary (no React)
├── charts/    # @variscout/charts - React + Visx components
├── data/      # @variscout/data - Sample datasets with pre-computed chart data
├── hooks/     # @variscout/hooks - Shared React hooks (drill-down, scale, tracking)
└── ui/        # @variscout/ui - HelpTooltip, useGlossary, colors, hooks

apps/
├── pwa/          # @variscout/pwa - PWA website
├── azure/        # @variscout/azure-app - Azure Team App
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
