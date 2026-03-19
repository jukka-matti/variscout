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

## ColorScheme Pattern

Shared UI components that need **app-differentiated styling** use the colorScheme pattern:

```typescript
// 1. Define the scheme interface
interface MyComponentColorScheme {
  container: string;
  headerBg: string;
  // ... semantic tokens
}

// 2. Export a defaultScheme
export const defaultScheme: MyComponentColorScheme = {
  container: 'bg-white dark:bg-slate-800',
  headerBg: 'bg-slate-50 dark:bg-slate-700',
};

// 3. Accept optional colorScheme prop (defaults to defaultScheme)
interface MyComponentProps {
  colorScheme?: Partial<MyComponentColorScheme>;
}
```

**When to use colorScheme:** Components shared between PWA and Azure that need different visual treatment per app (e.g., FindingsPanelBase, CoScoutPanelBase, StatsPanelBase).

**When to skip:** Components that only use `theme.css` semantic tokens (CSS custom properties) and don't need app-specific class overrides (e.g., DataTableBase, ManualEntryBase, SettingsPanelBase). These get theme support automatically via CSS variables.
