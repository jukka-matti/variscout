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

## Colors (PWA Tailwind)

- Green (`text-green-500`): Pass/in-spec values
- Red (`text-red-400`): Fail USL
- Amber (`text-amber-500`): Fail LSL
- Slate palette: UI chrome/backgrounds

## Imports

- Group: React → external libs → internal packages → relative imports
- Use `@variscout/core` and `@variscout/charts` package imports
