# Code Style Rules

## TypeScript

- Strict mode enabled in all packages
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Props interfaces named `ComponentNameProps`

## Naming

- Components: `PascalCase.tsx` (e.g., `StatsPanel.tsx`)
- Hooks: `use` prefix (e.g., `useDataIngestion.ts`)
- Utilities: `camelCase.ts` (e.g., `persistence.ts`)
- Types: `PascalCase` (e.g., `StatsResult`)

## Colors (Tailwind)

- Green (`text-green-500`): Pass/in-spec values
- Red (`text-red-400`): Fail USL
- Amber (`text-amber-500`): Fail LSL
- Slate palette: UI chrome/backgrounds

## Imports

- Group: React → external libs → internal packages → relative imports
- Use `@variscout/core` and `@variscout/charts` package imports

## Component Theming

Components use semantic Tailwind classes (`bg-surface-secondary`, `text-content`, `border-edge`) that adapt to light/dark via `data-theme`. No per-component color scheme props needed.

For contextual variants, use a `variant` string prop (enum, not open-ended). For rare one-off overrides, use the standard `className` prop.
