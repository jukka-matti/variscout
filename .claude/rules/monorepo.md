# Monorepo Rules

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic (no React)
└── charts/    # @variscout/charts - React + Visx components

apps/
├── pwa/          # @variscout/pwa - PWA website
└── excel-addin/  # @variscout/excel-addin - Excel Add-in
```

## Import Rules

- Apps import from packages: `import { calculateStats } from '@variscout/core'`
- Packages never import from apps
- `@variscout/core` has no React dependencies
- `@variscout/charts` depends on `@variscout/core`

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
