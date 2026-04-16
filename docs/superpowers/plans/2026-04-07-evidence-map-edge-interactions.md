---
title: Evidence Map Edge Interactions Implementation Plan
---

# Evidence Map Edge Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make statistical relationship edges on the Evidence Map interactive — click for detail card with mini chart, right-click for context menu, promote to causal link, ask CoScout, ask investigation question.

**Architecture:** Add 3 new components (EdgeDetailCard, EdgeContextMenu, EdgeMiniChart) + 1 pure function (mapRelationshipType) following existing node interaction patterns. Wire through EvidenceMapBase → StatisticalLayer → RelationshipEdge callback chain. Local state for transient UI in InvestigationMapView. No store changes needed.

**Tech Stack:** TypeScript, React, Visx (scatter), Tailwind, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md`

---

### Task 1: Add `mapRelationshipType` — 5-type → 3-type UI mapping

**Files:**

- Create: `packages/core/src/stats/relationshipTypeMapping.ts`
- Create: `packages/core/src/stats/__tests__/relationshipTypeMapping.test.ts`

The stats engine computes 5 relationship types (`RelationshipType` in `packages/core/src/stats/causalGraph.ts:18-23`). The UI shows 3. This pure function maps them.

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/stats/__tests__/relationshipTypeMapping.test.ts
import { describe, it, expect } from 'vitest';
import { mapRelationshipType, type UIRelationshipType } from '../relationshipTypeMapping';

describe('mapRelationshipType', () => {
  it('maps interactive to interact', () => {
    expect(mapRelationshipType('interactive')).toBe('interact');
  });

  it('maps synergistic to interact', () => {
    expect(mapRelationshipType('synergistic')).toBe('interact');
  });

  it('maps overlapping to overlap', () => {
    expect(mapRelationshipType('overlapping')).toBe('overlap');
  });

  it('maps independent to independent', () => {
    expect(mapRelationshipType('independent')).toBe('independent');
  });

  it('maps redundant to independent', () => {
    expect(mapRelationshipType('redundant')).toBe('independent');
  });

  it('returns guidance for each type', () => {
    expect(mapRelationshipType('interactive', true)).toEqual({
      label: 'Interact',
      guidance: 'Optimize together',
    });
    expect(mapRelationshipType('overlapping', true)).toEqual({
      label: 'Overlap',
      guidance: 'Shared variation — investigate what connects them',
    });
    expect(mapRelationshipType('independent', true)).toEqual({
      label: 'Independent',
      guidance: 'Optimize separately',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run -t "mapRelationshipType"`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/core/src/stats/relationshipTypeMapping.ts
import type { RelationshipType } from './causalGraph';

/** 3 user-facing relationship types mapped from the 5 engine types. */
export type UIRelationshipType = 'interact' | 'overlap' | 'independent';

export interface UIRelationshipInfo {
  label: string;
  guidance: string;
}

const mapping: Record<RelationshipType, UIRelationshipType> = {
  interactive: 'interact',
  synergistic: 'interact',
  overlapping: 'overlap',
  independent: 'independent',
  redundant: 'independent',
};

const info: Record<UIRelationshipType, UIRelationshipInfo> = {
  interact: { label: 'Interact', guidance: 'Optimize together' },
  overlap: { label: 'Overlap', guidance: 'Shared variation — investigate what connects them' },
  independent: { label: 'Independent', guidance: 'Optimize separately' },
};

/** Map engine RelationshipType to UI type. With `withInfo`, returns label + guidance. */
export function mapRelationshipType(type: RelationshipType): UIRelationshipType;
export function mapRelationshipType(type: RelationshipType, withInfo: true): UIRelationshipInfo;
export function mapRelationshipType(
  type: RelationshipType,
  withInfo?: boolean
): UIRelationshipType | UIRelationshipInfo {
  const uiType = mapping[type];
  if (withInfo) return info[uiType];
  return uiType;
}
```

- [ ] **Step 4: Export from stats barrel**

In `packages/core/src/stats/index.ts`, add at the end:

```typescript
export {
  mapRelationshipType,
  type UIRelationshipType,
  type UIRelationshipInfo,
} from './relationshipTypeMapping';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run -t "mapRelationshipType"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/relationshipTypeMapping.ts packages/core/src/stats/__tests__/relationshipTypeMapping.test.ts packages/core/src/stats/index.ts
git commit -m "feat(core): add mapRelationshipType — 5-type to 3-type UI mapping"
```

---

### Task 2: Add `onContextMenu` to RelationshipEdge + StatisticalLayer + EvidenceMapBase

**Files:**

- Modify: `packages/charts/src/EvidenceMap/RelationshipEdge.tsx:11-17,90-95`
- Modify: `packages/charts/src/EvidenceMap/StatisticalLayer.tsx:30,101-117`
- Modify: `packages/charts/src/EvidenceMap/EvidenceMapBase.tsx:23-46,109`

- [ ] **Step 1: Add onContextMenu prop to RelationshipEdge**

In `packages/charts/src/EvidenceMap/RelationshipEdge.tsx`, update the props interface (line 11-17):

```typescript
interface RelationshipEdgeProps {
  edge: RelationshipEdgeData;
  isHighlighted: boolean;
  isDark: boolean;
  hideLabels?: boolean;
  onClick?: (factorA: string, factorB: string) => void;
  onContextMenu?: (factorA: string, factorB: string, clientX: number, clientY: number) => void;
}
```

Destructure `onContextMenu` in the component function alongside `onClick`.

Update the `<g>` element (line 90-95) to add the context menu handler:

```typescript
    <g
      style={{ cursor: onClick || onContextMenu ? 'pointer' : 'default' }}
      onClick={() => onClick?.(edge.factorA, edge.factorB)}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        e.preventDefault();
        onContextMenu(edge.factorA, edge.factorB, e.clientX, e.clientY);
      }}
      role="img"
      aria-label={`${edge.factorA} and ${edge.factorB}: ${getTypeLabel(edge.type)}`}
    >
```

- [ ] **Step 2: Pass onEdgeContextMenu through StatisticalLayer**

In `packages/charts/src/EvidenceMap/StatisticalLayer.tsx`, add to the props interface (after line 30):

```typescript
  onEdgeContextMenu?: (factorA: string, factorB: string, clientX: number, clientY: number) => void;
```

Destructure it in the component. Then pass it to RelationshipEdge (after the existing `onClick` line ~114):

```typescript
          <RelationshipEdge
            key={edgeKey}
            edge={edge}
            isHighlighted={
              highlightedEdge === edgeKey ||
              highlightedFactor === edge.factorA ||
              highlightedFactor === edge.factorB
            }
            isDark={isDark}
            hideLabels={hideLabels}
            onClick={onEdgeTap ?? onEdgeClick}
            onContextMenu={onEdgeContextMenu}
          />
```

- [ ] **Step 3: Pass onEdgeContextMenu through EvidenceMapBase**

In `packages/charts/src/EvidenceMap/EvidenceMapBase.tsx`, add `onEdgeContextMenu` to the props destructuring (after `onEdgeClick` at ~line 35):

```typescript
  onEdgeContextMenu,
```

Pass it to StatisticalLayer (after `onEdgeClick` at ~line 109):

```typescript
onEdgeContextMenu = { onEdgeContextMenu };
```

- [ ] **Step 4: Build to verify types**

Run: `pnpm --filter @variscout/charts build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/EvidenceMap/RelationshipEdge.tsx packages/charts/src/EvidenceMap/StatisticalLayer.tsx packages/charts/src/EvidenceMap/EvidenceMapBase.tsx
git commit -m "feat(charts): add onEdgeContextMenu callback through Evidence Map layers"
```

---

### Task 3: Create EdgeContextMenu component

**Files:**

- Create: `packages/ui/src/components/EvidenceMapContextMenu/EdgeContextMenu.tsx`
- Create: `packages/ui/src/components/EvidenceMapContextMenu/__tests__/EdgeContextMenu.test.tsx`

Mirror the `NodeContextMenu` pattern from `packages/ui/src/components/EvidenceMapContextMenu/NodeContextMenu.tsx`.

- [ ] **Step 1: Write the test**

```typescript
// packages/ui/src/components/EvidenceMapContextMenu/__tests__/EdgeContextMenu.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeContextMenu } from '../EdgeContextMenu';

describe('EdgeContextMenu', () => {
  const defaultProps = {
    factorA: 'Temperature',
    factorB: 'Pressure',
    x: 100,
    y: 200,
    onAskQuestion: vi.fn(),
    onAskCoScout: vi.fn(),
    onPromoteToCausal: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders 3 menu items', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
  });

  it('shows factor names in ask question label', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    expect(screen.getByText('Ask about Temperature × Pressure')).toBeTruthy();
  });

  it('calls onAskQuestion with both factors', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask about Temperature × Pressure'));
    expect(defaultProps.onAskQuestion).toHaveBeenCalledWith('Temperature', 'Pressure');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onAskCoScout with both factors', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask CoScout about this relationship'));
    expect(defaultProps.onAskCoScout).toHaveBeenCalledWith('Temperature', 'Pressure');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onPromoteToCausal with both factors', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Promote to causal link'));
    expect(defaultProps.onPromoteToCausal).toHaveBeenCalledWith('Temperature', 'Pressure');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    // Backdrop is the first fixed inset div
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeContextMenu"`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```typescript
// packages/ui/src/components/EvidenceMapContextMenu/EdgeContextMenu.tsx
import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { MessageCircleQuestion, Bot, Link } from 'lucide-react';

export interface EdgeContextMenuProps {
  factorA: string;
  factorB: string;
  x: number;
  y: number;
  onAskQuestion: (factorA: string, factorB: string) => void;
  onAskCoScout: (factorA: string, factorB: string) => void;
  onPromoteToCausal: (factorA: string, factorB: string) => void;
  onClose: () => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  factorA,
  factorB,
  x,
  y,
  onAskQuestion,
  onAskCoScout,
  onPromoteToCausal,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [clampedPos, setClampedPos] = useState({ left: x, top: y });

  const items = [
    {
      icon: MessageCircleQuestion,
      label: `Ask about ${factorA} \u00d7 ${factorB}`,
      action: () => onAskQuestion(factorA, factorB),
    },
    {
      icon: Bot,
      label: 'Ask CoScout about this relationship',
      action: () => onAskCoScout(factorA, factorB),
    },
    {
      icon: Link,
      label: 'Promote to causal link',
      action: () => onPromoteToCausal(factorA, factorB),
    },
  ];

  // Clamp position to viewport bounds after render
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const clampedLeft = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 8 : x;
    const clampedTop =
      y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 8 : y;
    setClampedPos({ left: clampedLeft, top: clampedTop });
  }, [x, y]);

  // Auto-focus first menu item on mount
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[200px]"
        style={{ left: `${clampedPos.left}px`, top: `${clampedPos.top}px` }}
        onKeyDown={handleKeyDown}
      >
        {items.map(item => (
          <button
            key={item.label}
            role="menuitem"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-content hover:bg-surface-secondary transition-colors text-left"
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <item.icon size={14} className="text-content-secondary" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
```

- [ ] **Step 4: Export from barrel**

In `packages/ui/src/components/EvidenceMapContextMenu/index.ts` (or the barrel file), add:

```typescript
export { EdgeContextMenu, type EdgeContextMenuProps } from './EdgeContextMenu';
```

Also export from `packages/ui/src/index.ts` if `NodeContextMenu` is exported from there.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeContextMenu"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/EvidenceMapContextMenu/EdgeContextMenu.tsx packages/ui/src/components/EvidenceMapContextMenu/__tests__/EdgeContextMenu.test.tsx packages/ui/src/components/EvidenceMapContextMenu/index.ts
git commit -m "feat(ui): add EdgeContextMenu — right-click menu for relationship edges"
```

---

### Task 4: Add action buttons to EvidenceMapEdgeSheet (mobile)

**Files:**

- Modify: `packages/ui/src/components/EvidenceMapSheet/EvidenceMapEdgeSheet.tsx:14-22,161-164`

- [ ] **Step 1: Add props to interface**

In `packages/ui/src/components/EvidenceMapSheet/EvidenceMapEdgeSheet.tsx`, update the props interface (line 14-22):

```typescript
export interface EvidenceMapEdgeSheetProps {
  onClose: () => void;
  factorA: string;
  factorB: string;
  relationshipType: string;
  strength: number;
  evidenceType?: 'data' | 'gemba' | 'expert' | 'unvalidated';
  whyStatement?: string;
  onPromoteToCausal?: (factorA: string, factorB: string) => void;
  onAskCoScout?: (factorA: string, factorB: string) => void;
}
```

Destructure `onPromoteToCausal` and `onAskCoScout` in the component function (line 47-55).

- [ ] **Step 2: Add action buttons before safe area**

Add the following between the why-statement block (line 161) and the safe-area div (line 163-164):

```typescript
          {/* Action buttons */}
          {(onPromoteToCausal || onAskCoScout) && (
            <>
              <div className="mx-4 border-t border-edge" />
              <div className="px-4 py-3 flex gap-2">
                {onPromoteToCausal && (
                  <button
                    onClick={() => {
                      onPromoteToCausal(factorA, factorB);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    style={{ minHeight: 48 }}
                    data-testid="edge-sheet-promote"
                  >
                    Promote to causal link
                  </button>
                )}
                {onAskCoScout && (
                  <button
                    onClick={() => {
                      onAskCoScout(factorA, factorB);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-secondary hover:bg-surface-elevated text-content font-medium rounded-xl transition-colors border border-edge"
                    style={{ minHeight: 48 }}
                    data-testid="edge-sheet-coscout"
                  >
                    Ask CoScout
                  </button>
                )}
              </div>
            </>
          )}
```

- [ ] **Step 3: Build to verify**

Run: `pnpm --filter @variscout/ui build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/EvidenceMapSheet/EvidenceMapEdgeSheet.tsx
git commit -m "feat(ui): add action buttons to EvidenceMapEdgeSheet — promote + CoScout"
```

---

### Task 5: Create EdgeDetailCard component

**Files:**

- Create: `packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx`
- Create: `packages/ui/src/components/EvidenceMap/__tests__/EdgeDetailCard.test.tsx`

This is the floating card that appears when clicking a statistical edge on desktop.

- [ ] **Step 1: Write the test**

```typescript
// packages/ui/src/components/EvidenceMap/__tests__/EdgeDetailCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeDetailCard } from '../EdgeDetailCard';

describe('EdgeDetailCard', () => {
  const defaultProps = {
    factorA: 'Supplier',
    factorB: 'Fill Head',
    relationshipType: 'interactive' as const,
    rSquaredAdj: 0.42,
    strength: 0.72,
    deltaRSquared: 0.04,
    x: 300,
    y: 200,
    onPromoteToCausal: vi.fn(),
    onAskCoScout: vi.fn(),
    onAskQuestion: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders factor names in header', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText(/Supplier/)).toBeTruthy();
    expect(screen.getByText(/Fill Head/)).toBeTruthy();
  });

  it('shows UI relationship type badge — Interact for interactive', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Interact')).toBeTruthy();
  });

  it('shows Overlap badge for overlapping type', () => {
    render(<EdgeDetailCard {...defaultProps} relationshipType="overlapping" />);
    expect(screen.getByText('Overlap')).toBeTruthy();
  });

  it('shows Independent badge for redundant type', () => {
    render(<EdgeDetailCard {...defaultProps} relationshipType="redundant" />);
    expect(screen.getByText('Independent')).toBeTruthy();
  });

  it('displays R²adj value', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText(/0\.42/)).toBeTruthy();
  });

  it('displays strength label', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Strong')).toBeTruthy();
  });

  it('shows Moderate for strength 0.5', () => {
    render(<EdgeDetailCard {...defaultProps} strength={0.5} />);
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows Weak for strength 0.15', () => {
    render(<EdgeDetailCard {...defaultProps} strength={0.15} />);
    expect(screen.getByText('Weak')).toBeTruthy();
  });

  it('renders 3 action buttons', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    expect(screen.getByText('Promote to causal link')).toBeTruthy();
    expect(screen.getByText('Ask CoScout')).toBeTruthy();
    expect(screen.getByText('Ask question')).toBeTruthy();
  });

  it('calls onPromoteToCausal with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Promote to causal link'));
    expect(defaultProps.onPromoteToCausal).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('calls onAskCoScout with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask CoScout'));
    expect(defaultProps.onAskCoScout).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('calls onAskQuestion with both factors', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Ask question'));
    expect(defaultProps.onAskQuestion).toHaveBeenCalledWith('Supplier', 'Fill Head');
  });

  it('closes on Escape key', () => {
    render(<EdgeDetailCard {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeDetailCard"`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```typescript
// packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx
import React, { useEffect, useRef } from 'react';
import { X, Link, Bot, MessageCircleQuestion } from 'lucide-react';
import type { RelationshipType } from '@variscout/core/evidenceMap';
import { mapRelationshipType } from '@variscout/core/stats';

export interface EdgeDetailCardProps {
  factorA: string;
  factorB: string;
  relationshipType: RelationshipType;
  rSquaredAdj: number;
  strength: number;
  deltaRSquared?: number;
  x: number;
  y: number;
  onPromoteToCausal: (factorA: string, factorB: string) => void;
  onAskCoScout: (factorA: string, factorB: string) => void;
  onAskQuestion: (factorA: string, factorB: string) => void;
  onClose: () => void;
  /** Optional mini chart slot — rendered between stats and actions */
  children?: React.ReactNode;
}

function strengthLabel(s: number): string {
  if (s >= 0.7) return 'Strong';
  if (s >= 0.3) return 'Moderate';
  return 'Weak';
}

const typeBadgeColors: Record<string, string> = {
  interact: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  overlap: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  independent: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export const EdgeDetailCard: React.FC<EdgeDetailCardProps> = ({
  factorA,
  factorB,
  relationshipType,
  rSquaredAdj,
  strength,
  deltaRSquared,
  x,
  y,
  onPromoteToCausal,
  onAskCoScout,
  onAskQuestion,
  onClose,
  children,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const uiType = mapRelationshipType(relationshipType);
  const uiInfo = mapRelationshipType(relationshipType, true);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Smart position: clamp to viewport
  const cardWidth = 300;
  const left = Math.min(x - cardWidth / 2, window.innerWidth - cardWidth - 16);
  const clampedLeft = Math.max(16, left);
  const top = y + 20; // Below the edge

  return (
    <div
      ref={cardRef}
      className="fixed z-50 bg-surface border border-edge rounded-xl shadow-xl"
      style={{ left: clampedLeft, top, width: cardWidth }}
      data-testid="edge-detail-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-content truncate">
            {factorA} {'\u2194'} {factorB}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border ${typeBadgeColors[uiType]}`}
          >
            {uiInfo.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-content-secondary hover:text-content rounded transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats row */}
      <div className="px-3 pb-2 flex items-center gap-3 text-xs text-content-secondary">
        <span>
          R²adj = <span className="font-medium text-content">{rSquaredAdj.toFixed(2)}</span>
        </span>
        {deltaRSquared !== undefined && deltaRSquared > 0 && (
          <span>
            ΔR² = <span className="font-medium text-content">{(deltaRSquared * 100).toFixed(0)}%</span>
          </span>
        )}
        <span className="font-medium text-content">{strengthLabel(strength)}</span>
      </div>

      {/* Mini chart slot */}
      {children && (
        <div className="px-3 pb-2">
          {children}
        </div>
      )}

      {/* Guidance */}
      <div className="px-3 pb-2">
        <p className="text-xs text-content-secondary italic">{uiInfo.guidance}</p>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-edge" />

      {/* Action buttons */}
      <div className="p-2 flex flex-col gap-1">
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onPromoteToCausal(factorA, factorB)}
          data-testid="edge-card-promote"
        >
          <Link size={14} className="text-content-secondary" />
          Promote to causal link
        </button>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onAskCoScout(factorA, factorB)}
          data-testid="edge-card-coscout"
        >
          <Bot size={14} className="text-content-secondary" />
          Ask CoScout
        </button>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-content hover:bg-surface-secondary rounded-lg transition-colors text-left"
          onClick={() => onAskQuestion(factorA, factorB)}
          data-testid="edge-card-question"
        >
          <MessageCircleQuestion size={14} className="text-content-secondary" />
          Ask question
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Export from barrel**

Add to `packages/ui/src/index.ts`:

```typescript
export { EdgeDetailCard, type EdgeDetailCardProps } from './components/EvidenceMap/EdgeDetailCard';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeDetailCard"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx packages/ui/src/components/EvidenceMap/__tests__/EdgeDetailCard.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add EdgeDetailCard — floating card for relationship edge click"
```

---

### Task 6: Create EdgeMiniChart component

**Files:**

- Create: `packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx`
- Create: `packages/ui/src/components/EvidenceMap/__tests__/EdgeMiniChart.test.tsx`

Adaptive 150px chart: boxplot for categorical factors, scatter for continuous. Uses existing chart primitives.

- [ ] **Step 1: Write the test**

```typescript
// packages/ui/src/components/EvidenceMap/__tests__/EdgeMiniChart.test.tsx
import { describe, it, expect } from 'vitest';
import { getChartType } from '../EdgeMiniChart';

describe('EdgeMiniChart', () => {
  describe('getChartType', () => {
    it('returns boxplot for categorical × categorical', () => {
      expect(getChartType('categorical', 'categorical')).toBe('boxplot');
    });

    it('returns scatter for continuous × continuous', () => {
      expect(getChartType('continuous', 'continuous')).toBe('scatter');
    });

    it('returns boxplot for categorical × continuous (mixed)', () => {
      expect(getChartType('categorical', 'continuous')).toBe('boxplot');
    });

    it('returns boxplot for continuous × categorical (mixed)', () => {
      expect(getChartType('continuous', 'categorical')).toBe('boxplot');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeMiniChart"`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```typescript
// packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx
import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scaleBand } from '@visx/scale';
import { LinePath, Circle } from '@visx/shape';
import { useChartTheme } from '@variscout/charts';

export interface EdgeMiniChartProps {
  factorA: string;
  factorB: string;
  factorAType: 'categorical' | 'continuous';
  factorBType: 'categorical' | 'continuous';
  data: Array<Record<string, unknown>>;
  outcomeColumn: string;
  width?: number;
  height?: number;
  isDark: boolean;
}

export function getChartType(
  aType: 'categorical' | 'continuous',
  bType: 'categorical' | 'continuous'
): 'boxplot' | 'scatter' {
  if (aType === 'continuous' && bType === 'continuous') return 'scatter';
  return 'boxplot';
}

/** Simplified mini scatter plot for continuous × continuous factor pairs. */
const MiniScatter: React.FC<{
  data: Array<{ x: number; y: number }>;
  width: number;
  height: number;
  isDark: boolean;
}> = ({ data, width, height, isDark }) => {
  const { chrome } = useChartTheme();
  const margin = { top: 8, right: 8, bottom: 8, left: 8 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...data.map(d => d.x)), Math.max(...data.map(d => d.x))],
        range: [0, innerW],
      }),
    [data, innerW]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [Math.min(...data.map(d => d.y)), Math.max(...data.map(d => d.y))],
        range: [innerH, 0],
      }),
    [data, innerH]
  );

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <Group left={margin.left} top={margin.top}>
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={2}
            fill={chrome.axisPrimary}
            opacity={0.5}
          />
        ))}
      </Group>
    </svg>
  );
};

/** Simplified mini grouped boxplot for categorical factor pairs. */
const MiniBoxplot: React.FC<{
  groups: Array<{ label: string; values: number[] }>;
  width: number;
  height: number;
  isDark: boolean;
}> = ({ groups, width, height, isDark }) => {
  const { chrome } = useChartTheme();
  const margin = { top: 8, right: 8, bottom: 16, left: 8 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allValues = groups.flatMap(g => g.values);
  if (allValues.length === 0) return null;

  const xScale = scaleBand({
    domain: groups.map(g => g.label),
    range: [0, innerW],
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [Math.min(...allValues), Math.max(...allValues)],
    range: [innerH, 0],
  });

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <Group left={margin.left} top={margin.top}>
        {groups.map(g => {
          const sorted = [...g.values].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0];
          const median = sorted[Math.floor(sorted.length * 0.5)] ?? sorted[0];
          const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? sorted[0];
          const bw = xScale.bandwidth();
          const cx = (xScale(g.label) ?? 0) + bw / 2;

          return (
            <g key={g.label}>
              {/* Box */}
              <rect
                x={cx - bw / 2}
                y={yScale(q3)}
                width={bw}
                height={Math.max(1, yScale(q1) - yScale(q3))}
                fill={chrome.axisPrimary}
                opacity={0.15}
                stroke={chrome.axisPrimary}
                strokeWidth={1}
                rx={2}
              />
              {/* Median line */}
              <line
                x1={cx - bw / 2}
                x2={cx + bw / 2}
                y1={yScale(median)}
                y2={yScale(median)}
                stroke={chrome.axisPrimary}
                strokeWidth={1.5}
              />
              {/* Label */}
              <text
                x={cx}
                y={innerH + 12}
                textAnchor="middle"
                fontSize={8}
                fill={chrome.labelSecondary}
              >
                {g.label.length > 8 ? g.label.slice(0, 7) + '…' : g.label}
              </text>
            </g>
          );
        })}
      </Group>
    </svg>
  );
};

export const EdgeMiniChart: React.FC<EdgeMiniChartProps> = ({
  factorA,
  factorB,
  factorAType,
  factorBType,
  data,
  outcomeColumn,
  width = 260,
  height = 150,
  isDark,
}) => {
  const chartType = getChartType(factorAType, factorBType);

  if (chartType === 'scatter') {
    // Continuous × continuous: scatter A vs B
    const points = data
      .map(row => ({
        x: Number(row[factorA]),
        y: Number(row[factorB]),
      }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (points.length < 2) return null;
    return <MiniScatter data={points} width={width} height={height} isDark={isDark} />;
  }

  // Boxplot: use the categorical factor as grouping, outcome as Y
  const groupingFactor = factorAType === 'categorical' ? factorA : factorB;
  const groupMap = new Map<string, number[]>();
  for (const row of data) {
    const group = String(row[groupingFactor] ?? '');
    const val = Number(row[outcomeColumn]);
    if (!group || !Number.isFinite(val)) continue;
    const arr = groupMap.get(group);
    if (arr) arr.push(val);
    else groupMap.set(group, [val]);
  }

  const groups = Array.from(groupMap.entries())
    .map(([label, values]) => ({ label, values }))
    .slice(0, 8); // Max 8 groups for mini chart

  if (groups.length === 0) return null;
  return <MiniBoxplot groups={groups} width={width} height={height} isDark={isDark} />;
};
```

- [ ] **Step 4: Export from barrel**

Add to `packages/ui/src/index.ts`:

```typescript
export {
  EdgeMiniChart,
  type EdgeMiniChartProps,
  getChartType,
} from './components/EvidenceMap/EdgeMiniChart';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run -t "EdgeMiniChart"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/EvidenceMap/EdgeMiniChart.tsx packages/ui/src/components/EvidenceMap/__tests__/EdgeMiniChart.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add EdgeMiniChart — adaptive boxplot/scatter for edge detail card"
```

---

### Task 7: Wire edge interactions into InvestigationMapView

**Files:**

- Modify: `apps/azure/src/components/editor/InvestigationMapView.tsx:53-84,101-149,172-186,240-320`

This is the main wiring task — connecting all the new components into the existing Investigation workspace.

- [ ] **Step 1: Add imports**

At the top of `apps/azure/src/components/editor/InvestigationMapView.tsx`, add:

```typescript
import { EdgeDetailCard } from '@variscout/ui';
import { EdgeContextMenu } from '@variscout/ui';
import { EdgeMiniChart } from '@variscout/ui';
```

- [ ] **Step 2: Add state declarations**

After the existing `selectedEdgeId` / `editingEdge` state declarations (~line 83-84), add:

```typescript
const [selectedRelEdge, setSelectedRelEdge] = useState<{
  factorA: string;
  factorB: string;
  x: number;
  y: number;
} | null>(null);
const [edgeContextMenu, setEdgeContextMenu] = useState<{
  factorA: string;
  factorB: string;
  x: number;
  y: number;
} | null>(null);
```

- [ ] **Step 3: Add handler functions**

After the existing handler functions (~line 149), add:

```typescript
// Edge click → detail card
const handleEdgeClick = useCallback(
  (factorA: string, factorB: string) => {
    // Find edge midpoint for card positioning
    const edge = mapData.relationshipEdges?.find(
      e =>
        (e.factorA === factorA && e.factorB === factorB) ||
        (e.factorA === factorB && e.factorB === factorA)
    );
    const midX = edge ? (edge.ax + edge.bx) / 2 : 300;
    const midY = edge ? (edge.ay + edge.by) / 2 : 200;
    setSelectedRelEdge({ factorA, factorB, x: midX, y: midY });
    setSelectedEdgeId(null);
    setContextMenu(null);
    setEdgeContextMenu(null);
  },
  [mapData.relationshipEdges]
);

// Edge right-click → context menu
const handleEdgeContextMenu = useCallback(
  (factorA: string, factorB: string, x: number, y: number) => {
    setEdgeContextMenu({ factorA, factorB, x, y });
    setSelectedRelEdge(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  },
  []
);

// Promote edge to causal link
const handlePromoteToCausal = useCallback((factorA: string, factorB: string) => {
  setCausalLinkDraft({ from: factorA, to: factorB });
  setSelectedRelEdge(null);
  setEdgeContextMenu(null);
}, []);

// Ask question about edge
const handleEdgeAskQuestion = useCallback(
  (factorA: string, factorB: string) => {
    onAskQuestion?.(factorA);
    setSelectedRelEdge(null);
    setEdgeContextMenu(null);
  },
  [onAskQuestion]
);

// Ask CoScout about edge
const handleEdgeAskCoScout = useCallback(
  (factorA: string, factorB: string) => {
    onAskCoScout?.(factorA);
    setSelectedRelEdge(null);
    setEdgeContextMenu(null);
  },
  [onAskCoScout]
);
```

- [ ] **Step 4: Update mutual exclusion in existing handlers**

In `handleFactorClick` (~line 101-114), add:

```typescript
setSelectedRelEdge(null);
setEdgeContextMenu(null);
```

In `handleContextMenu` (~line 116-119), add:

```typescript
setSelectedRelEdge(null);
setEdgeContextMenu(null);
```

- [ ] **Step 5: Wire callbacks to EvidenceMapBase**

In the `<EvidenceMapBase>` render (~line 172-186), add the new props:

```typescript
onEdgeClick = { handleEdgeClick };
onEdgeContextMenu = { handleEdgeContextMenu };
```

- [ ] **Step 6: Render EdgeDetailCard**

After the existing causal edge detail card block (~line 320), add:

```typescript
        {/* Relationship edge detail card */}
        {selectedRelEdge && (
          <EdgeDetailCard
            factorA={selectedRelEdge.factorA}
            factorB={selectedRelEdge.factorB}
            relationshipType={
              mapData.relationshipEdges?.find(
                e => (e.factorA === selectedRelEdge.factorA && e.factorB === selectedRelEdge.factorB) ||
                     (e.factorA === selectedRelEdge.factorB && e.factorB === selectedRelEdge.factorA)
              )?.type ?? 'independent'
            }
            rSquaredAdj={
              mapData.relationshipEdges?.find(
                e => (e.factorA === selectedRelEdge.factorA && e.factorB === selectedRelEdge.factorB) ||
                     (e.factorA === selectedRelEdge.factorB && e.factorB === selectedRelEdge.factorA)
              )?.strength ?? 0
            }
            strength={
              mapData.relationshipEdges?.find(
                e => (e.factorA === selectedRelEdge.factorA && e.factorB === selectedRelEdge.factorB) ||
                     (e.factorA === selectedRelEdge.factorB && e.factorB === selectedRelEdge.factorA)
              )?.strength ?? 0
            }
            x={selectedRelEdge.x}
            y={selectedRelEdge.y}
            onPromoteToCausal={handlePromoteToCausal}
            onAskCoScout={handleEdgeAskCoScout}
            onAskQuestion={handleEdgeAskQuestion}
            onClose={() => setSelectedRelEdge(null)}
          />
        )}
```

- [ ] **Step 7: Render EdgeContextMenu**

After the existing NodeContextMenu render, add:

```typescript
        {/* Edge context menu */}
        {edgeContextMenu && (
          <EdgeContextMenu
            factorA={edgeContextMenu.factorA}
            factorB={edgeContextMenu.factorB}
            x={edgeContextMenu.x}
            y={edgeContextMenu.y}
            onAskQuestion={handleEdgeAskQuestion}
            onAskCoScout={handleEdgeAskCoScout}
            onPromoteToCausal={handlePromoteToCausal}
            onClose={() => setEdgeContextMenu(null)}
          />
        )}
```

- [ ] **Step 8: Build to verify**

Run: `pnpm --filter @variscout/azure-app build`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/azure/src/components/editor/InvestigationMapView.tsx
git commit -m "feat(editor): wire edge detail card, context menu, and causal promotion"
```

---

### Task 8: Final verification

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: PASS — all packages and apps build

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: PASS — all existing tests + new tests pass

- [ ] **Step 3: Verify exports**

Run: `pnpm --filter @variscout/core build && pnpm --filter @variscout/charts build && pnpm --filter @variscout/ui build`
Expected: PASS — types propagate correctly

- [ ] **Step 4: Visual verification with --chrome**

Run: `claude --chrome`

1. Load Coffee Moisture sample data
2. Go to Investigation workspace → Map view
3. Right-click a statistical edge → verify EdgeContextMenu appears with 3 actions
4. Click a statistical edge → verify EdgeDetailCard appears with header, stats, guidance, 3 action buttons
5. Click "Promote to causal link" → verify CausalLinkCreator opens with pre-filled factors
6. Verify opening edge card closes any open node context menu (mutual exclusion)
7. Press Escape → verify card dismisses

- [ ] **Step 5: Commit any fixes from visual verification**
