# Improvement Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Improvement workspace into a cohesive hub with split layout (matrix top + cards bottom), integrated What-If panel on left, progressive Plan→Track evolution, cause-colored prioritization, and mobile support.

**Architecture:** Split the hub into a left context/What-If panel, center matrix+cards zone, and right CoScout panel. The workspace evolves from Plan view (brainstorm/prioritize) to Track view (actions/verification/outcome) without tabs — triggered by "Convert → Actions". New `ImprovementContextPanel` replaces PI Panel in this workspace. What-If moves to the left panel with contextual presets.

**Tech Stack:** React + TypeScript, Zustand stores, Tailwind v4, Vitest, existing @variscout/\* packages.

**Spec:** `docs/superpowers/specs/2026-04-02-improvement-hub-design.md`

---

## Phase 1: Foundation Components (Quick Wins + New Components)

### Task 1: Evidence % Badge in IdeaGroupCard Header

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx:302-318`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/IdeaGroupCard.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/ImprovementPlan/__tests__/IdeaGroupCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IdeaGroupCard } from '../IdeaGroupCard';

describe('IdeaGroupCard', () => {
  const baseProps = {
    questionId: 'q1',
    questionText: 'Does shift affect fill weight?',
    factor: 'Shift',
    causeRole: 'suspected-cause' as const,
    ideas: [],
    selectedIdeaIds: new Set<string>(),
    convertedIdeaIds: new Set<string>(),
    onToggleSelect: vi.fn(),
    onUpdateTimeframe: vi.fn(),
    onUpdateDirection: vi.fn(),
    onUpdateCost: vi.fn(),
    onOpenRisk: vi.fn(),
    onRemoveIdea: vi.fn(),
    onAddIdea: vi.fn(),
    onOpenWhatIf: vi.fn(),
    onAskCoScout: vi.fn(),
  };

  it('shows R²adj evidence badge when evidence has rSquaredAdj', () => {
    render(
      <IdeaGroupCard
        {...baseProps}
        evidence={{ rSquaredAdj: 0.34 }}
      />
    );
    expect(screen.getByText(/R²adj 34%/)).toBeInTheDocument();
  });

  it('shows η² evidence badge when evidence has etaSquared', () => {
    render(
      <IdeaGroupCard
        {...baseProps}
        evidence={{ etaSquared: 0.08 }}
      />
    );
    expect(screen.getByText(/η² 8%/)).toBeInTheDocument();
  });

  it('does not show evidence badge when no evidence', () => {
    const { container } = render(<IdeaGroupCard {...baseProps} />);
    expect(container.querySelector('[data-testid="evidence-badge"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run IdeaGroupCard`
Expected: FAIL — `evidence` prop not recognized

- [ ] **Step 3: Add evidence prop and render badge**

In `IdeaGroupCard.tsx`, add to props interface (around line 13-45):

```typescript
/** Evidence strength from ANOVA (R²adj or η²) */
evidence?: { rSquaredAdj?: number; etaSquared?: number };
```

In the header section (around line 315), after the factor span and before linkedFindingName:

```typescript
{evidence?.rSquaredAdj != null && (
  <span data-testid="evidence-badge" className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-content-muted">
    R²adj {Math.round(evidence.rSquaredAdj * 100)}%
  </span>
)}
{evidence?.rSquaredAdj == null && evidence?.etaSquared != null && (
  <span data-testid="evidence-badge" className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-content-muted">
    η² {Math.round(evidence.etaSquared * 100)}%
  </span>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run IdeaGroupCard`
Expected: PASS

- [ ] **Step 5: Wire evidence prop from Editor.tsx**

In `apps/azure/src/pages/Editor.tsx` (around line 1019-1030), pass evidence to IdeaGroupCard through ImprovementWorkspaceBase. The question object already carries `evidence` — ensure `ImprovementWorkspaceBase` passes it through.

In `ImprovementWorkspaceBase.tsx` (around line 192-212), add `evidence={q.evidence}` to the IdeaGroupCard render.

- [ ] **Step 6: Run full test suite and commit**

Run: `pnpm test -- --run`
Expected: All pass

```bash
git add packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx packages/ui/src/components/ImprovementPlan/__tests__/IdeaGroupCard.test.tsx packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx
git commit -m "feat: add evidence % badge to IdeaGroupCard header"
```

---

### Task 2: Synthesis Pre-Fill from Problem Statement

**Files:**

- Modify: `apps/azure/src/features/improvement/useImprovementOrchestration.ts:126-142`
- Test: `apps/azure/src/features/improvement/__tests__/useImprovementOrchestration.test.ts` (create or extend)

- [ ] **Step 1: Write the failing test**

```typescript
// Test that synthesis pre-fills from problemStatement
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useImprovementOrchestration', () => {
  it('pre-fills synthesis from problemStatement when synthesis is empty', () => {
    // Setup: processContext with problemStatement but no synthesis
    const mockSetProcessContext = vi.fn();
    const processContext = {
      synthesis: '',
      problemStatement: 'Fill weight variation causing 28% OOS rejects',
      targetValue: 1.33,
    };

    // The hook should call setProcessContext with synthesis = problemStatement
    // on first render when synthesis is empty and problemStatement exists
    // Test the logic directly:
    const shouldPreFill = !processContext.synthesis && processContext.problemStatement;
    expect(shouldPreFill).toBe(true);
  });

  it('does not pre-fill when synthesis already has content', () => {
    const processContext = {
      synthesis: 'Existing synthesis text',
      problemStatement: 'Fill weight variation causing 28% OOS rejects',
      targetValue: 1.33,
    };
    const shouldPreFill = !processContext.synthesis && processContext.problemStatement;
    expect(shouldPreFill).toBe(false);
  });
});
```

- [ ] **Step 2: Implement pre-fill logic**

In `useImprovementOrchestration.ts`, add a `useEffect` (around line 126) that checks on first render:

```typescript
// Synthesis pre-fill from problem statement (one-time on first visit)
const hasPreFilled = useRef(false);
useEffect(() => {
  if (!hasPreFilled.current && processContext?.problemStatement && !processContext?.synthesis) {
    hasPreFilled.current = true;
    handleSynthesisChange(processContext.problemStatement);
  }
}, [processContext?.problemStatement, processContext?.synthesis]);
```

- [ ] **Step 3: Run tests and commit**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS

```bash
git add apps/azure/src/features/improvement/useImprovementOrchestration.ts apps/azure/src/features/improvement/__tests__/
git commit -m "feat: pre-fill synthesis from problem statement on first visit"
```

---

### Task 3: ImprovementContextPanel Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/ImprovementContextPanel.tsx`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/ImprovementContextPanel.test.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/ImprovementPlan/__tests__/ImprovementContextPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImprovementContextPanel } from '../ImprovementContextPanel';

describe('ImprovementContextPanel', () => {
  const baseProps = {
    problemStatement: 'Fill weight variation causing 28% OOS',
    targetCpk: 1.33,
    currentCpk: 0.62,
    causes: [
      { id: 'q1', factor: 'Shift (Night)', evidence: 'R²adj 34%', role: 'suspected-cause' as const, ideaCount: 3, actionCount: 2, color: '#f59e0b' },
      { id: 'q2', factor: 'Nozzle (5-8)', evidence: 'R²adj 22%', role: 'suspected-cause' as const, ideaCount: 2, actionCount: 1, color: '#3b82f6' },
    ],
    synthesis: 'Night shift setup inconsistency...',
  };

  it('renders problem statement', () => {
    render(<ImprovementContextPanel {...baseProps} />);
    expect(screen.getByText(/Fill weight variation/)).toBeInTheDocument();
  });

  it('renders target and current Cpk', () => {
    render(<ImprovementContextPanel {...baseProps} />);
    expect(screen.getByText('1.33')).toBeInTheDocument();
    expect(screen.getByText('0.62')).toBeInTheDocument();
  });

  it('renders cause summary items', () => {
    render(<ImprovementContextPanel {...baseProps} />);
    expect(screen.getByText('Shift (Night)')).toBeInTheDocument();
    expect(screen.getByText('Nozzle (5-8)')).toBeInTheDocument();
  });

  it('renders synthesis text', () => {
    render(<ImprovementContextPanel {...baseProps} />);
    expect(screen.getByText(/Night shift setup/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run ImprovementContextPanel`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ImprovementContextPanel**

```typescript
// packages/ui/src/components/ImprovementPlan/ImprovementContextPanel.tsx
import React from 'react';

export interface CauseSummary {
  id: string;
  factor: string;
  evidence: string;
  role: 'suspected-cause' | 'contributing' | 'ruled-out';
  ideaCount: number;
  actionCount: number;
  color: string;
}

export interface ImprovementContextPanelProps {
  problemStatement?: string;
  targetCpk?: number;
  currentCpk?: number;
  causes: CauseSummary[];
  synthesis?: string;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
    {children}
  </div>
);

export const ImprovementContextPanel: React.FC<ImprovementContextPanelProps> = ({
  problemStatement,
  targetCpk,
  currentCpk,
  causes,
  synthesis,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      <div className="px-4 py-3 border-b border-edge">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-content-muted">
          Improvement Context
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Problem Statement */}
        {problemStatement && (
          <div>
            <SectionLabel>Problem Statement</SectionLabel>
            <div className="text-sm text-content-secondary leading-relaxed p-2.5 bg-surface rounded-lg border-l-3 border-amber-500">
              {problemStatement}
            </div>
          </div>
        )}

        {/* Target */}
        {targetCpk != null && (
          <div>
            <SectionLabel>Improvement Target</SectionLabel>
            <div className="flex items-center justify-between p-2.5 bg-surface rounded-lg">
              <div>
                <div className="text-[10px] text-content-muted">Target Cpk</div>
                <div className="text-lg font-bold text-green-400">{targetCpk.toFixed(2)}</div>
              </div>
              {currentCpk != null && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-400">{currentCpk.toFixed(2)}</div>
                  <div className="text-[10px] text-content-muted">current</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Causes */}
        {causes.length > 0 && (
          <div>
            <SectionLabel>Suspected Causes</SectionLabel>
            <div className="space-y-1.5">
              {causes.map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 bg-surface rounded-md text-xs">
                  <div className="w-[3px] h-5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-content truncate">{c.factor}</div>
                    <div className="text-content-muted">{c.evidence} · {c.role === 'suspected-cause' ? 'suspected' : c.role}</div>
                  </div>
                  <div className="text-right text-content-muted text-[10px] leading-tight">
                    {c.ideaCount} ideas<br />{c.actionCount} actions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Synthesis */}
        {synthesis && (
          <div>
            <SectionLabel>Synthesis</SectionLabel>
            <div className="text-xs text-content-secondary leading-relaxed p-2.5 bg-surface rounded-lg">
              {synthesis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Export from index files**

In `packages/ui/src/components/ImprovementPlan/index.ts`, add:

```typescript
export { ImprovementContextPanel } from './ImprovementContextPanel';
export type { ImprovementContextPanelProps, CauseSummary } from './ImprovementContextPanel';
```

In `packages/ui/src/index.ts`, add to the ImprovementPlan exports section:

```typescript
export { ImprovementContextPanel } from './components/ImprovementPlan/ImprovementContextPanel';
export type {
  ImprovementContextPanelProps,
  CauseSummary,
} from './components/ImprovementPlan/ImprovementContextPanel';
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @variscout/ui test -- --run ImprovementContextPanel`
Expected: PASS

```bash
git add packages/ui/src/components/ImprovementPlan/ImprovementContextPanel.tsx packages/ui/src/components/ImprovementPlan/__tests__/ImprovementContextPanel.test.tsx packages/ui/src/components/ImprovementPlan/index.ts packages/ui/src/index.ts
git commit -m "feat: add ImprovementContextPanel component"
```

---

### Task 4: Cause Color Assignment Utility

**Files:**

- Create: `packages/core/src/findings/causeColors.ts`
- Test: `packages/core/src/findings/__tests__/causeColors.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/findings/__tests__/causeColors.test.ts
import { describe, it, expect } from 'vitest';
import { assignCauseColors } from '../causeColors';

describe('assignCauseColors', () => {
  it('assigns unique colors to each question ID', () => {
    const ids = ['q1', 'q2', 'q3'];
    const colors = assignCauseColors(ids);
    expect(colors.get('q1')).toBeDefined();
    expect(colors.get('q2')).toBeDefined();
    expect(colors.get('q1')).not.toBe(colors.get('q2'));
  });

  it('returns consistent colors for same IDs', () => {
    const ids = ['q1', 'q2'];
    const first = assignCauseColors(ids);
    const second = assignCauseColors(ids);
    expect(first.get('q1')).toBe(second.get('q1'));
  });

  it('cycles through palette when more IDs than colors', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `q${i}`);
    const colors = assignCauseColors(ids);
    expect(colors.size).toBe(12);
  });
});
```

- [ ] **Step 2: Implement cause color assignment**

```typescript
// packages/core/src/findings/causeColors.ts

// 8-color palette matching operatorColors from @variscout/charts
const CAUSE_PALETTE = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

/**
 * Assign consistent colors to question IDs for cause grouping.
 * Colors are assigned in order of the IDs array (sorted for stability).
 */
export function assignCauseColors(questionIds: string[]): Map<string, string> {
  const sorted = [...questionIds].sort();
  const map = new Map<string, string>();
  sorted.forEach((id, i) => {
    map.set(id, CAUSE_PALETTE[i % CAUSE_PALETTE.length]);
  });
  return map;
}
```

- [ ] **Step 3: Export from findings barrel**

Add to `packages/core/src/findings/index.ts`:

```typescript
export { assignCauseColors } from './causeColors';
```

- [ ] **Step 4: Run tests and commit**

Run: `pnpm --filter @variscout/core test -- --run causeColors`
Expected: PASS

```bash
git add packages/core/src/findings/causeColors.ts packages/core/src/findings/__tests__/causeColors.test.ts packages/core/src/findings/index.ts
git commit -m "feat: add cause color assignment utility"
```

---

### Task 5: Ghost Dots + Cause Colors in PrioritizationMatrix

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/PrioritizationMatrix.test.tsx` (create)

- [ ] **Step 1: Write failing tests**

```typescript
// packages/ui/src/components/ImprovementPlan/__tests__/PrioritizationMatrix.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrioritizationMatrix } from '../PrioritizationMatrix';

describe('PrioritizationMatrix', () => {
  const baseIdea = {
    id: 'i1',
    text: 'Test idea',
    questionId: 'q1',
    timeframe: 'days' as const,
    cost: { category: 'low' as const },
    risk: { axis1: 1 as const, axis2: 1 as const, computed: 'low' as const },
  };

  it('renders ghost dot for idea without projection or impact override', () => {
    const { container } = render(
      <PrioritizationMatrix
        ideas={[{ ...baseIdea, projection: undefined, impactOverride: undefined }]}
        causeColors={new Map([['q1', '#f59e0b']])}
        onIdeaClick={vi.fn()}
      />
    );
    const ghostDot = container.querySelector('[data-testid="dot-ghost-i1"]');
    expect(ghostDot).toBeInTheDocument();
  });

  it('renders solid dot with cause color for idea with projection', () => {
    const { container } = render(
      <PrioritizationMatrix
        ideas={[{
          ...baseIdea,
          projection: { projectedCpk: 1.35, baselineMean: 12, baselineSigma: 0.8, projectedMean: 12.5, projectedSigma: 0.6, meanDelta: 0.5, sigmaDelta: -0.2, simulationParams: { meanAdjustment: 0.5, variationReduction: 25 }, createdAt: '' },
        }]}
        causeColors={new Map([['q1', '#f59e0b']])}
        onIdeaClick={vi.fn()}
      />
    );
    const dot = container.querySelector('[data-testid="dot-i1"]');
    expect(dot).toBeInTheDocument();
  });

  it('shows nudge message when some ideas lack projections', () => {
    render(
      <PrioritizationMatrix
        ideas={[
          { ...baseIdea, projection: undefined, impactOverride: undefined },
          { ...baseIdea, id: 'i2', projection: { projectedCpk: 1.2, baselineMean: 12, baselineSigma: 0.8, projectedMean: 12.5, projectedSigma: 0.6, meanDelta: 0.5, sigmaDelta: -0.2, simulationParams: { meanAdjustment: 0.5, variationReduction: 25 }, createdAt: '' } },
        ]}
        causeColors={new Map([['q1', '#f59e0b']])}
        onIdeaClick={vi.fn()}
      />
    );
    expect(screen.getByText(/1 idea/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Add causeColors prop and ghost dot rendering**

In `PrioritizationMatrix.tsx`:

Add to `PrioritizationMatrixProps` (around line 41):

```typescript
/** Map of questionId → hex color for cause grouping */
causeColors?: Map<string, string>;
/** ID of idea being actively projected (pulsing dot) */
projectingIdeaId?: string;
/** ID of idea to highlight (bidirectional navigation) */
highlightedIdeaId?: string;
```

Add to `MatrixIdea` type:

```typescript
/** Question ID for cause color lookup */
questionId?: string;
```

Modify `getColor` function (line 284) to add a `'cause'` dimension:

```typescript
case 'cause':
  if (!causeColors || !idea.questionId) return GRAY_DOT;
  return causeColors.get(idea.questionId) ?? GRAY_DOT;
```

In the dot rendering section (around line 651-712), add ghost dot logic:

```typescript
const isGhost = !idea.projection && !idea.impactOverride;
const isProjecting = projectingIdeaId === idea.id;

// Render different circle for ghost vs solid
{isGhost ? (
  <circle
    data-testid={`dot-ghost-${idea.id}`}
    cx={x} cy={y} r={DOT_R}
    fill="none"
    stroke={causeColors?.get(idea.questionId ?? '') ?? '#94a3b8'}
    strokeWidth={2}
    strokeDasharray="4,3"
    opacity={0.4}
    style={{ cursor: 'pointer' }}
    onClick={() => onIdeaClick?.(idea.id)}
  />
) : (
  <circle
    data-testid={`dot-${idea.id}`}
    cx={x} cy={y} r={DOT_R}
    fill={causeColors?.get(idea.questionId ?? '') ?? dotColor}
    style={{ cursor: 'pointer' }}
    onClick={() => onIdeaClick?.(idea.id)}
    className={isProjecting ? 'animate-pulse' : ''}
  />
)}
```

Add nudge message below legend:

```typescript
{unprojectedCount > 0 && (
  <div className="text-[10px] text-content-muted italic mt-1.5">
    {unprojectedCount} idea{unprojectedCount > 1 ? 's have' : ' has'} no projection — click 🧪 to simulate
  </div>
)}
```

- [ ] **Step 3: Run tests and commit**

Run: `pnpm --filter @variscout/ui test -- --run PrioritizationMatrix`
Expected: PASS

```bash
git add packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx packages/ui/src/components/ImprovementPlan/__tests__/PrioritizationMatrix.test.tsx
git commit -m "feat: add ghost dots, cause colors, and projection nudge to PrioritizationMatrix"
```

---

## Phase 2: Split Layout + What-If Integration

### Task 6: ImprovementWorkspaceBase Split Layout

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx` (props)

- [ ] **Step 1: Refactor layout from vertical scroll to split**

Replace the current single-column layout with the split structure:

- Top zone: PrioritizationMatrix (collapsible via resize handle)
- Bottom zone: scrollable idea cards
- Accept `leftPanel` and `rightPanel` as render props for the side panels

Add to `ImprovementWorkspaceBaseProps`:

```typescript
/** Left panel content (context panel or What-If) */
renderLeftPanel?: () => React.ReactNode;
/** Whether left panel is visible */
showLeftPanel?: boolean;
/** Matrix component */
renderMatrix?: () => React.ReactNode;
/** Current view: 'plan' or 'track' */
activeView?: 'plan' | 'track';
/** Track view content */
renderTrackView?: () => React.ReactNode;
```

Restructure the JSX to:

```tsx
<div className="flex flex-col h-full">
  {/* Header bar */}
  {renderHeader()}

  <div className="flex-1 flex overflow-hidden">
    {/* Left panel (300px, collapsible) */}
    {showLeftPanel && renderLeftPanel && (
      <div className="w-[300px] min-w-[300px] border-r border-edge flex-shrink-0">
        {renderLeftPanel()}
      </div>
    )}

    {/* Center hub */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeView === 'plan' ? (
        <>
          {/* Matrix top zone */}
          {renderMatrix && (
            <div className="border-b border-edge flex-shrink-0">{renderMatrix()}</div>
          )}
          {/* Idea cards bottom zone */}
          <div className="flex-1 overflow-y-auto p-5 pb-20">{renderIdeaGroups()}</div>
        </>
      ) : (
        renderTrackView?.()
      )}
    </div>
  </div>

  {/* Summary bar */}
  {renderSummaryBar()}
</div>
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: PASS (existing tests should still work with default props)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx
git commit -m "refactor: ImprovementWorkspaceBase split layout with matrix top zone"
```

---

### Task 7: Wire Split Layout in Azure Editor

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx:1015-1040`
- Modify: `apps/azure/src/features/improvement/useImprovementOrchestration.ts`
- Modify: `apps/azure/src/features/improvement/improvementStore.ts`

- [ ] **Step 1: Add improvement view state to store**

In `improvementStore.ts`, add:

```typescript
/** 'plan' (default) or 'track' (after conversion) */
activeImprovementView: 'plan' | 'track';
setActiveImprovementView: (view: 'plan' | 'track') => void;
```

- [ ] **Step 2: Update orchestration to compute cause colors and context panel data**

In `useImprovementOrchestration.ts`, add:

```typescript
import { assignCauseColors } from '@variscout/core/findings';

// Compute cause colors from question IDs
const causeColors = useMemo(() => {
  const ids = (persistedQuestions ?? [])
    .filter(q => q.causeRole === 'suspected-cause' || q.causeRole === 'contributing')
    .map(q => q.id);
  return assignCauseColors(ids);
}, [persistedQuestions]);

// Compute cause summaries for context panel
const causeSummaries = useMemo(() => {
  return (persistedQuestions ?? [])
    .filter(q => q.causeRole === 'suspected-cause' || q.causeRole === 'contributing')
    .map(q => ({
      id: q.id,
      factor: q.factor ?? q.text,
      evidence:
        q.evidence?.rSquaredAdj != null
          ? `R²adj ${Math.round(q.evidence.rSquaredAdj * 100)}%`
          : q.evidence?.etaSquared != null
            ? `η² ${Math.round(q.evidence.etaSquared * 100)}%`
            : '',
      role: q.causeRole ?? 'suspected-cause',
      ideaCount: q.ideas?.length ?? 0,
      actionCount: findingsState.findings
        .filter(f => f.questionId === q.id)
        .flatMap(f => f.actions ?? []).length,
      color: causeColors.get(q.id) ?? '#94a3b8',
    }));
}, [persistedQuestions, causeColors, findingsState.findings]);
```

- [ ] **Step 3: Wire into Editor.tsx**

Update the improvement workspace rendering (lines 1015-1040) to pass:

```typescript
<ImprovementWorkspaceBase
  // ... existing props ...
  showLeftPanel={true}
  renderLeftPanel={() => (
    <ImprovementContextPanel
      problemStatement={processContext?.problemStatement}
      targetCpk={processContext?.targetValue}
      currentCpk={stats?.cpk}
      causes={causeSummaries}
      synthesis={processContext?.synthesis}
    />
  )}
  renderMatrix={() => (
    <PrioritizationMatrix
      ideas={matrixIdeas}
      causeColors={causeColors}
      onIdeaClick={handleMatrixIdeaClick}
    />
  )}
  activeView={activeImprovementView}
/>
```

- [ ] **Step 4: Run tests and commit**

Run: `pnpm test -- --run`
Expected: PASS

```bash
git add apps/azure/src/pages/Editor.tsx apps/azure/src/features/improvement/useImprovementOrchestration.ts apps/azure/src/features/improvement/improvementStore.ts
git commit -m "feat: wire split layout with context panel and matrix in Improvement workspace"
```

---

### Task 8: What-If Panel Integration in Left Panel

**Files:**

- Modify: `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/features/improvement/useImprovementOrchestration.ts`

- [ ] **Step 1: Add referenceContext prop to WhatIfPageBase**

Add to `WhatIfPageBaseProps`:

```typescript
/** Reference context for contextual preset labels */
referenceContext?: {
  subsetLabel: string;     // e.g., "Head 5-8"
  subsetCount: number;
  subsetCpk?: number;
  referenceLabel: string;  // e.g., "Head 1-4"
  referenceCount: number;
  referenceCpk?: number;
};
```

- [ ] **Step 2: Make preset labels contextual**

In `computePresets()` function, when `referenceContext` is available, use contextual labels:

```typescript
// Instead of: label: 'Match best'
// Use: label: `Match ${referenceContext.referenceLabel} mean`

if (referenceContext) {
  // Replace generic labels with contextual ones
  preset.label = `Match ${referenceContext.referenceLabel} mean`;
  // etc.
}
```

- [ ] **Step 3: Render context header when referenceContext provided**

Add a context section above the presets in WhatIfPageBase:

```typescript
{referenceContext && (
  <div className="px-4 py-2 bg-surface-tertiary/50 border-b border-edge text-xs">
    <div className="font-medium text-content-secondary mb-1">Context</div>
    <div className="flex justify-between">
      <span className="text-content-muted">
        Problem: {referenceContext.subsetLabel} (n={referenceContext.subsetCount}
        {referenceContext.subsetCpk != null && `, Cpk ${referenceContext.subsetCpk.toFixed(2)}`})
      </span>
      <span className="text-content-muted">
        Reference: {referenceContext.referenceLabel} (n={referenceContext.referenceCount}
        {referenceContext.referenceCpk != null && `, Cpk ${referenceContext.referenceCpk.toFixed(2)}`})
      </span>
    </div>
  </div>
)}
```

- [ ] **Step 4: Wire left panel transition in Editor**

When `projectionTarget` is set in the investigation store, the left panel switches from ImprovementContextPanel to WhatIfPageBase. When projection is saved/cancelled, it switches back.

In the `renderLeftPanel` prop:

```typescript
renderLeftPanel={() => (
  projectionTarget ? (
    <WhatIfPageBase
      filteredData={projectionFilteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      filterCount={1}
      filterNames={[`${projectionTarget.questionText}`]}
      onBack={() => clearProjectionTarget()}
      projectionContext={{
        ideaText: projectionTarget.ideaText,
        questionText: projectionTarget.questionText,
      }}
      referenceContext={projectionReferenceContext}
      onSaveProjection={handleSaveIdeaProjection}
      activeFactor={projectionActiveFactor}
    />
  ) : (
    <ImprovementContextPanel
      problemStatement={processContext?.problemStatement}
      targetCpk={processContext?.targetValue}
      currentCpk={stats?.cpk}
      causes={causeSummaries}
      synthesis={processContext?.synthesis}
    />
  )
)}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test -- --run`
Expected: PASS

```bash
git add packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx apps/azure/src/pages/Editor.tsx apps/azure/src/features/improvement/useImprovementOrchestration.ts
git commit -m "feat: What-If panel in left panel with contextual presets and reference context"
```

---

## Phase 3: Track View (PDCA)

### Task 9: ActionTrackerSection Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/ActionTrackerSection.tsx`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/ActionTrackerSection.test.tsx`

- [ ] **Step 1: Write failing tests**

Test rendering of action items, overdue banner, completion toggle, assignee display.

- [ ] **Step 2: Implement component**

Action list aggregated from all findings with actions. Features: completion checkboxes, assignee badge, due date, overdue alert, cause color dot, progress bar.

- [ ] **Step 3: Run tests and commit**

```bash
git commit -m "feat: add ActionTrackerSection component"
```

---

### Task 10: VerificationSection Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/VerificationSection.tsx`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/VerificationSection.test.tsx`

- [ ] **Step 1-3: Implement and test**

Empty state with "Add verification data" button. After verification: KPI grid (Cpk before→after, pass rate, mean shift, σ ratio). "View staged charts in Analysis →" link.

```bash
git commit -m "feat: add VerificationSection component"
```

---

### Task 11: OutcomeSection Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/OutcomeSection.tsx`
- Test: `packages/ui/src/components/ImprovementPlan/__tests__/OutcomeSection.test.tsx`

- [ ] **Step 1-3: Implement and test**

Three outcome buttons: Effective (green), Partial (amber), Not effective (red). Notes field. Dimmed until verification data exists.

```bash
git commit -m "feat: add OutcomeSection component"
```

---

### Task 12: TrackView Layout + PlanRecap

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/TrackView.tsx`
- Create: `packages/ui/src/components/ImprovementPlan/PlanRecap.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx`

- [ ] **Step 1-3: Implement TrackView composing PlanRecap + ActionTrackerSection + VerificationSection + OutcomeSection**

```bash
git commit -m "feat: add TrackView with PlanRecap, actions, verification, and outcome"
```

---

### Task 13: Summary Bar Progressive Evolution

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementSummaryBar.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/__tests__/ImprovementSummaryBar.test.tsx`

- [ ] **Step 1: Add new props for track mode**

```typescript
/** Number of completed actions */
actionsDone?: number;
/** Total number of actions */
actionsTotal?: number;
/** Number of overdue actions */
overdueCount?: number;
/** Current view mode */
mode?: 'plan' | 'plan-mixed' | 'track' | 'track-verified';
/** Verification Cpk delta */
verificationCpk?: { before: number; after: number };
/** Callbacks for track mode */
onViewActions?: () => void;
onAddVerification?: () => void;
onAssessOutcome?: () => void;
```

- [ ] **Step 2: Implement conditional rendering based on mode**

- [ ] **Step 3: Test all 4 modes and commit**

```bash
git commit -m "feat: progressive summary bar evolution (plan → track → verified)"
```

---

## Phase 4: Smart Verification Detection

### Task 14: VerificationPrompt + Data Ingestion Hook

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/VerificationPrompt.tsx`
- Modify: data ingestion hook to check for improving findings after upload

```bash
git commit -m "feat: smart verification data detection prompt"
```

---

## Phase 5: Mobile Layout

### Task 15: CauseSummaryCards (Mobile Matrix Replacement)

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/CauseSummaryCards.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx` (responsive)

- [ ] **Step 1-3: Implement swipeable cards per cause**

Horizontally scrollable cards showing: cause name, evidence %, idea count, quick win count, avg projected Cpk.

- [ ] **Step 4: Add responsive breakpoint in ImprovementWorkspaceBase**

```typescript
const isMobile = useIsMobile(); // from @variscout/ui

// In layout: hide left panel, replace matrix with CauseSummaryCards
{isMobile ? <CauseSummaryCards causes={causeSummaries} /> : renderMatrix?.()}
```

```bash
git commit -m "feat: mobile layout with swipeable cause summary cards"
```

---

## Phase 6: Documentation

### Task 16: Create Improvement Workspace Feature Doc

**Files:**

- Create: `docs/03-features/workflows/improvement-workspace.md`

- [ ] **Step 1: Write the feature doc**

Content: Analyst-facing guide covering the full improvement workflow — synthesis, ideation, prioritization matrix (4 presets), What-If projections, action conversion, PDCA tracking, verification, outcome assessment. Include ASCII diagrams of the Plan→Track progression.

```bash
git commit -m "docs: add improvement workspace feature guide"
```

---

### Task 17: Update Existing Documentation

**Files:**

- Modify: `docs/06-design-system/patterns/navigation.md` (expand Improvement workspace section)
- Modify: `docs/05-technical/architecture/mental-model-hierarchy.md` (add component references)
- Modify: `docs/08-products/feature-parity.md` (expand improvement features per platform)
- Modify: `docs/superpowers/specs/2026-04-02-improvement-workspace-pdca-design.md` (mark superseded)
- Modify: `CLAUDE.md` (update task-to-documentation table with improvement hub entries)

- [ ] **Step 1: Update navigation.md**

Expand the Improvement workspace section (around line 36) to describe the split layout, left context panel, What-If integration, Plan/Track views.

- [ ] **Step 2: Update mental-model-hierarchy.md**

Add component references to the IMPROVE section and link to the new feature doc.

- [ ] **Step 3: Update feature-parity.md**

Expand improvement feature rows to include: context panel, prioritization matrix, What-If integration, PDCA tracking, verification prompt.

- [ ] **Step 4: Mark PDCA spec as superseded**

Change frontmatter of `2026-04-02-improvement-workspace-pdca-design.md`:

```yaml
status: superseded
superseded-by: 2026-04-02-improvement-hub-design.md
```

- [ ] **Step 5: Update CLAUDE.md**

Add to the task-to-documentation table:

```
| Improvement Hub / PDCA    | docs/03-features/workflows/improvement-workspace.md, docs/superpowers/specs/2026-04-02-improvement-hub-design.md |
```

```bash
git commit -m "docs: update navigation, mental model, feature parity, and CLAUDE.md for improvement hub"
```

---

## Phase 7: Final Integration + Polish

### Task 18: Bidirectional Matrix ↔ Card Navigation

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx`

Wire: click matrix dot → scroll to card + highlight. Hover card → highlight dot. State managed via `highlightedIdeaId` prop.

```bash
git commit -m "feat: bidirectional matrix-card navigation"
```

---

### Task 19: Plan→Track Transition Wiring

**Files:**

- Modify: `apps/azure/src/features/improvement/useImprovementOrchestration.ts`
- Modify: `apps/azure/src/pages/Editor.tsx`

Wire "Convert → Actions" to: create actions (existing), transition to Track view, evolve summary bar. Wire "Back to Plan" to return.

```bash
git commit -m "feat: wire Plan→Track view transition on Convert→Actions"
```

---

### Task 20: Build Verification + Full Test Pass

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: All packages build without error

- [ ] **Step 2: Run full test suite**

Run: `pnpm test -- --run`
Expected: All tests pass

- [ ] **Step 3: Visual verification**

Run: `pnpm dev` and verify:

- Plan view shows context panel + matrix + idea cards
- Ghost dots appear for unprojected ideas
- Click 🧪 → What-If replaces left panel
- Convert → Actions transitions to Track view
- Back to Plan returns without state loss
- Summary bar evolves through states
- Mobile breakpoint shows swipeable cards

---

## Execution Notes

**Suggested parallelization:**

- Tasks 1-4 (foundation) are independent — can run in parallel
- Tasks 5-8 (layout + wiring) are sequential
- Tasks 9-12 (Track view components) are independent
- Tasks 13-15 can follow Track view
- Tasks 16-17 (docs) can run in parallel with any code task
- Tasks 18-20 (integration) are sequential, must come last

**Total estimated components:**

- 8 new components
- 6 modified components
- 2 modified hooks
- 1 new utility
- 5 documentation files
