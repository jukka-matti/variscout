# Code Style Rules

## TypeScript

- Strict mode enabled in all packages
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes

## Numeric Safety

- Never use `.toFixed()` on statistical values in UI or AI prompt code — use `formatStatistic()` from `@variscout/core/i18n`, or guard with `Number.isFinite()` first
- For internal computation strings (e.g., equation builder), `Number.isFinite()` guard + `.toFixed()` is acceptable
- Stats functions must return `number | undefined`, never NaN or Infinity (see ADR-069)
- Use `safeDivide()` from `@variscout/core/stats` for any division where the denominator could be zero or near-zero

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Props interfaces named `ComponentNameProps`

## Naming

- Components: `PascalCase.tsx` (e.g., `StatsPanel.tsx`)
- Hooks: `use` prefix (e.g., `useDataIngestion.ts`)
- Utilities: `camelCase.ts` (e.g., `persistence.ts`)
- Types: `PascalCase` (e.g., `StatsResult`)

## Accessibility

- Never nest `<button>` inside `<button>` or `<a>` inside `<a>` — violates HTML spec
- For clickable cards with secondary actions: use Fluent UI focusMode pattern (non-interactive container, primary button with `::after` overlay, secondary buttons with `z-index`)
- See `docs/06-design-system/patterns/interactions.md` for the full pattern

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
