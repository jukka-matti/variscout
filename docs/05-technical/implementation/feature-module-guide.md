---
title: Feature Module Guide
audience: [developer]
category: implementation
status: stable
related: [zustand, feature-sliced-design, adr-041, adr-045]
---

# Feature Module Guide

How to create and maintain feature modules in the Azure app's Feature-Sliced Design architecture.

## Existing Feature Modules

```
apps/azure/src/features/
├── panels/          — Panel visibility & layout (panelsStore)
├── findings/        — Findings wiring + findingsStore
├── investigation/   — Hypotheses + investigationStore
├── improvement/     — Improvement workspace + improvementStore
├── ai/              — CoScout, narration, tools + aiStore
└── data-flow/       — Data pipeline orchestration (useReducer, not Zustand)
```

## Standard File Structure

Use `features/panels/` as the canonical example:

```
features/{name}/
├── {name}Store.ts           — Zustand store (state + actions)
├── use{Name}Orchestration.ts — Orchestration hook (composes shared hooks + store sync)
├── index.ts                  — Barrel export
└── __tests__/
    └── {name}Store.test.ts   — Store unit tests
```

Optional additional files:

- `use{Name}Persistence.ts` — Bridge hook for Zustand↔Context persistence
- `use{Name}DerivedState.ts` — Derived state computations
- `listeners.ts` — (Deprecated, see ADR-046)

## Creating a New Feature Module

### Step 1: Create the Store

```typescript
// features/myFeature/myFeatureStore.ts
import { create } from 'zustand';

interface MyFeatureState {
  items: Item[];
  selectedId: string | null;
}

interface MyFeatureActions {
  setItems: (items: Item[]) => void;
  selectItem: (id: string | null) => void;
  syncItems: (items: Item[]) => void; // for orchestration hook sync
}

export type MyFeatureStore = MyFeatureState & MyFeatureActions;

export const useMyFeatureStore = create<MyFeatureStore>()(set => ({
  items: [],
  selectedId: null,
  setItems: items => set({ items }),
  selectItem: id => set({ selectedId: id }),
  syncItems: items => set({ items }),
}));
```

### Step 2: Create the Orchestration Hook

Orchestration hooks are the coordination layer. They:

- Own the shared hook from `@variscout/hooks` (CRUD engine)
- Sync state to the Zustand store for selector-based reads
- Handle cross-store side effects via direct `getState()` calls

```typescript
// features/myFeature/useMyFeatureOrchestration.ts
import { useEffect, useCallback } from 'react';
import { useMyItems } from '@variscout/hooks'; // shared CRUD hook
import { useMyFeatureStore } from './myFeatureStore';
import { usePanelsStore } from '../panels/panelsStore'; // cross-store access

export function useMyFeatureOrchestration(options) {
  const itemsState = useMyItems(options); // shared hook

  // Sync to Zustand store for selector reads
  const syncItems = useMyFeatureStore.getState().syncItems;
  useEffect(() => {
    syncItems(itemsState.items);
  }, [itemsState.items, syncItems]);

  // Cross-store side effect: open panel when item created
  const handleCreateItem = useCallback(
    (text: string) => {
      const item = itemsState.addItem(text);
      usePanelsStore.getState().setMyFeatureOpen(true); // direct getState()
      return item;
    },
    [itemsState]
  );

  return { itemsState, handleCreateItem };
}
```

### Step 3: Create the Barrel Export

```typescript
// features/myFeature/index.ts
export { useMyFeatureStore } from './myFeatureStore';
export { useMyFeatureOrchestration } from './useMyFeatureOrchestration';
```

### Step 4: Add Store Tests

```typescript
// features/myFeature/__tests__/myFeatureStore.test.ts
import { useMyFeatureStore } from '../myFeatureStore';

beforeEach(() => {
  useMyFeatureStore.setState(useMyFeatureStore.getInitialState());
});

it('should select an item', () => {
  useMyFeatureStore.getState().selectItem('item-1');
  expect(useMyFeatureStore.getState().selectedId).toBe('item-1');
});
```

### Step 5: Wire into Editor.tsx

Import the orchestration hook in `Editor.tsx` and pass results to child components.

## Rules

1. **Stores hold read-side UI state** — Components use selectors: `const items = useMyFeatureStore(s => s.items)`
2. **Shared hooks from @variscout/hooks remain CRUD engines** — Domain logic lives in the shared package, not in stores
3. **Cross-store writes go through orchestration hooks** — Never call `otherStore.getState().action()` from a component or store action
4. **Bridge hooks for persistence** — Use `usePanelsPersistence` pattern when Zustand state needs to sync to React Context (DataContext)
5. **No event buses** — Direct `getState()` calls are the Zustand-recommended pattern (ADR-046 superseded)

## Related

- [ADR-041: Zustand Feature Stores](../../07-decisions/adr-041-zustand-feature-stores.md)
- [ADR-045: Modular Architecture](../../07-decisions/adr-045-modular-architecture.md)
- [Store Interactions](../architecture/store-interactions.md)
