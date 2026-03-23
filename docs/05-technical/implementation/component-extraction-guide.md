---
title: Component Extraction Guide
audience: [developer]
category: implementation
status: stable
related: [shared-packages, ui-package, colorScheme]
---

# Component Extraction Guide

How to extract components from apps to shared packages, based on the 12-phase extraction that removed ~4,500 lines of duplication.

## Decision Tree: Extract or Keep App-Level?

Extract to `@variscout/ui` when:

- Both PWA and Azure need the same component
- The component has no app-specific dependencies (no auth, no storage, no Zustand stores)
- Props can fully describe the component's behavior (no Context required)

Keep app-level when:

- Only one app uses the component
- The component depends on app-specific context (DataContext, StorageProvider)
- The component needs Zustand store selectors

## Naming Conventions

| Suffix         | Location        | Purpose                                               | Example                                   |
| -------------- | --------------- | ----------------------------------------------------- | ----------------------------------------- |
| `*Base`        | `@variscout/ui` | Shared primitive, accepts data via props              | `StatsPanelBase`, `DashboardGrid`         |
| `*WrapperBase` | `@variscout/ui` | Composes shared hooks + Base chart + app UI           | `IChartWrapperBase`, `BoxplotWrapperBase` |
| (no suffix)    | `apps/*/`       | App wrapper adding context, persistence, keyboard nav | `IChart.tsx` (Azure), `IChart.tsx` (PWA)  |

## The colorScheme Pattern

Shared components use a `colorScheme` interface with semantic tokens instead of hardcoded colors:

```typescript
// In @variscout/ui
export interface StatsPanelColorScheme {
  cardBg: string;
  labelText: string;
  valueText: string;
  borderColor: string;
}

export const defaultStatsPanelScheme: StatsPanelColorScheme = {
  cardBg: 'bg-surface-secondary',
  labelText: 'text-content-secondary',
  valueText: 'text-content',
  borderColor: 'border-edge',
};

interface StatsPanelBaseProps {
  colorScheme?: StatsPanelColorScheme;
  // ... other props
}

export function StatsPanelBase({
  colorScheme = defaultStatsPanelScheme,
  ...props
}: StatsPanelBaseProps) {
  // Use colorScheme.cardBg etc.
}
```

Apps use the default scheme. No app-specific color scheme overrides exist (the old `azureColorScheme` was fully removed).

## Extraction Steps

1. **Identify the component** -- Find identical or near-identical code in both apps
2. **Define the props interface** -- Replace all context/store dependencies with explicit props
3. **Create the Base component** in `packages/ui/src/components/{Name}/`
4. **Add colorScheme** if the component has visual styling (optional for logic-only components)
5. **Export from barrel** -- Add to `packages/ui/src/index.ts`
6. **Create app wrappers** (~30-50 LOC each) that import Base and wire context/stores
7. **Delete duplicated code** from apps
8. **Update tests** -- Test the Base component in `packages/ui`, test app wrappers in apps

## App Wrapper Pattern

App wrappers are thin (~30-50 LOC) and do three things:

1. Read from app-level context/stores
2. Pass data as props to the Base component
3. Add app-specific behavior (keyboard shortcuts, persistence)

```typescript
// apps/azure/src/components/StatsPanel.tsx (~35 LOC)
import { StatsPanelBase } from '@variscout/ui';
import { useData } from '../context/DataContext';

export function StatsPanel() {
  const { stats, specs, setSpecs } = useData();
  return (
    <StatsPanelBase
      stats={stats}
      specs={specs}
      onEditSpecs={setSpecs}
    />
  );
}
```

## What NOT to Extract

- **Context providers** -- Keep app-level (except ThemeContext which was unified to @variscout/ui)
- **Feature orchestration hooks** -- App-specific by design
- **Zustand stores** -- App-specific state
- **Service modules** -- App-specific infrastructure (auth, storage, telemetry)

## Related

- [Component Patterns](../architecture/component-patterns.md)
- [ADR-045: Modular Architecture](../../07-decisions/adr-045-modular-architecture.md)
