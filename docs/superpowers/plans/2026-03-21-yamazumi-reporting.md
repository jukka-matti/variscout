# Yamazumi-Aware Reporting View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the reporting view mode-aware so yamazumi analyses tell a lean time-study story instead of an SPC story, and make Step 2 finding-driven across all modes.

**Architecture:** Pass `analysisMode` into `useReportSections` to return mode-specific section titles. Create `ReportYamazumiKPIGrid` and `ReportActivityBreakdown` as new shared components. Generalize `ReportCpkLearningLoop` props to support VA Ratio. Wire mode-aware rendering in the Azure app's `ReportView.tsx`.

**Tech Stack:** React, TypeScript, Vitest, Tailwind CSS, @variscout/core yamazumi types

**Spec:** `docs/superpowers/specs/2026-03-21-yamazumi-reporting-design.md`

---

## File Structure

| Action | File                                                                               | Responsibility                                     |
| ------ | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Modify | `packages/hooks/src/useReportSections.ts`                                          | Accept `analysisMode`, return mode-specific titles |
| Modify | `packages/ui/src/components/ReportView/ReportCpkLearningLoop.tsx`                  | Generalize props for any metric                    |
| Create | `packages/ui/src/components/ReportView/ReportYamazumiKPIGrid.tsx`                  | Yamazumi KPI display (VA Ratio, Takt, Over Takt)   |
| Create | `packages/ui/src/components/ReportView/ReportActivityBreakdown.tsx`                | Activity table with lean tooltips                  |
| Modify | `packages/ui/src/components/ReportView/index.ts`                                   | Export new components                              |
| Modify | `packages/ui/src/index.ts`                                                         | Re-export new components                           |
| Modify | `apps/azure/src/components/views/ReportView.tsx`                                   | Mode-aware renderSection + finding-driven Step 2   |
| Create | `packages/hooks/src/__tests__/useReportSections.yamazumi.test.ts`                  | Tests for mode-specific sections                   |
| Create | `packages/ui/src/components/ReportView/__tests__/ReportYamazumiKPIGrid.test.tsx`   | KPI grid tests                                     |
| Create | `packages/ui/src/components/ReportView/__tests__/ReportActivityBreakdown.test.tsx` | Activity breakdown tests                           |
| Modify | `docs/03-features/analysis/yamazumi.md`                                            | Document lean improvement principle                |

---

### Task 1: Generalize ReportCpkLearningLoop Props

**Files:**

- Modify: `packages/ui/src/components/ReportView/ReportCpkLearningLoop.tsx:23-38`
- Modify: `packages/ui/src/components/ReportView/index.ts` (type exports)
- Modify: `apps/azure/src/components/views/ReportView.tsx` (update call site)

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ReportView/__tests__/ReportCpkLearningLoop.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCpkLearningLoop } from '../ReportCpkLearningLoop';

describe('ReportCpkLearningLoop', () => {
  it('renders with default Cpk label', () => {
    render(<ReportCpkLearningLoop valueBefore={1.0} valueAfter={1.5} />);
    expect(screen.getByText('Cpk')).toBeInTheDocument();
    expect(screen.getByText('1.00')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('renders with custom metric label', () => {
    render(
      <ReportCpkLearningLoop
        valueBefore={0.45}
        valueAfter={0.68}
        metricLabel="VA Ratio"
        formatValue={v => `${Math.round(v * 100)}%`}
      />
    );
    expect(screen.getByText('VA Ratio')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('uses default 2-decimal format when no formatValue provided', () => {
    render(<ReportCpkLearningLoop valueBefore={1.333} valueAfter={1.667} />);
    expect(screen.getByText('1.33')).toBeInTheDocument();
    expect(screen.getByText('1.67')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run ReportCpkLearningLoop`
Expected: FAIL — props `valueBefore`/`valueAfter`/`metricLabel`/`formatValue` don't exist yet

- [ ] **Step 3: Update props interface and implementation**

In `ReportCpkLearningLoop.tsx`:

- Rename props: `cpkBefore` → `valueBefore`, `projectedCpk` → `projectedValue`, `cpkAfter` → `valueAfter`
- Add `metricLabel?: string` (default `'Cpk'`)
- Add `formatValue?: (v: number) => string` (default: 2-decimal format)
- Replace `formatCpk()` calls with `formatValue()` calls
- Add `metricLabel` display where "Cpk" was hardcoded

- [ ] **Step 4: Update call site in Azure ReportView**

In `apps/azure/src/components/views/ReportView.tsx`, update the `<ReportCpkLearningLoop>` usage to use new prop names:

- `cpkBefore={...}` → `valueBefore={...}`
- `projectedCpk={...}` → `projectedValue={...}`
- `cpkAfter={...}` → `valueAfter={...}`

- [ ] **Step 5: Run tests to verify**

Run: `pnpm --filter @variscout/ui test -- --run ReportCpkLearningLoop`
Expected: PASS

Run: `pnpm test` to verify no regressions
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportCpkLearningLoop.tsx \
       packages/ui/src/components/ReportView/__tests__/ReportCpkLearningLoop.test.tsx \
       apps/azure/src/components/views/ReportView.tsx
git commit -m "refactor: generalize ReportCpkLearningLoop props for multi-metric support"
```

---

### Task 2: Add analysisMode to useReportSections

**Files:**

- Modify: `packages/hooks/src/useReportSections.ts:43-58,140-163`
- Create: `packages/hooks/src/__tests__/useReportSections.yamazumi.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/hooks/src/__tests__/useReportSections.yamazumi.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportSections } from '../useReportSections';

describe('useReportSections with yamazumi mode', () => {
  const baseOptions = {
    findings: [],
    hypotheses: [],
    stagedComparison: false,
    aiEnabled: false,
  };

  it('returns standard titles when analysisMode is undefined', () => {
    const { result } = renderHook(() => useReportSections(baseOptions));
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    expect(step1?.title).toContain('condition');
  });

  it('returns yamazumi titles when analysisMode is yamazumi', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, analysisMode: 'yamazumi' })
    );
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    const step2 = result.current.sections.find(s => s.id === 'drivers');
    expect(step1?.title).toMatch(/time composition/i);
    expect(step2?.title).toMatch(/activity composition/i);
  });

  it('returns standard titles when analysisMode is standard', () => {
    const { result } = renderHook(() =>
      useReportSections({ ...baseOptions, analysisMode: 'standard' })
    );
    const step1 = result.current.sections.find(s => s.id === 'current-condition');
    expect(step1?.title).not.toMatch(/time composition/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test -- --run useReportSections.yamazumi`
Expected: FAIL — `analysisMode` not accepted by options

- [ ] **Step 3: Add analysisMode to hook**

In `useReportSections.ts`:

- Add `analysisMode?: AnalysisMode` to `UseReportSectionsOptions` interface (line ~48)
- Import `AnalysisMode` from `@variscout/core`
- In section title assignment (lines ~140-163), check `analysisMode === 'yamazumi'`:
  - `current-condition` title: `'Time Composition'` (yamazumi) vs current logic
  - `drivers` title: `'Activity Composition'` (yamazumi) vs current logic

- [ ] **Step 4: Run tests to verify**

Run: `pnpm --filter @variscout/hooks test -- --run useReportSections`
Expected: PASS (both new yamazumi tests and existing tests)

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useReportSections.ts \
       packages/hooks/src/__tests__/useReportSections.yamazumi.test.ts
git commit -m "feat: add analysisMode to useReportSections for mode-specific titles"
```

---

### Task 3: Create ReportYamazumiKPIGrid

**Files:**

- Create: `packages/ui/src/components/ReportView/ReportYamazumiKPIGrid.tsx`
- Create: `packages/ui/src/components/ReportView/__tests__/ReportYamazumiKPIGrid.test.tsx`
- Modify: `packages/ui/src/components/ReportView/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ReportView/__tests__/ReportYamazumiKPIGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportYamazumiKPIGrid } from '../ReportYamazumiKPIGrid';
import type { YamazumiSummary } from '@variscout/core';

const mockSummary: YamazumiSummary = {
  totalLeadTime: 480,
  vaTime: 216,
  nvaTime: 96,
  wasteTime: 120,
  waitTime: 48,
  vaRatio: 0.45,
  processEfficiency: 0.692,
  taktTime: 60,
  stepsOverTakt: ['Pick', 'Wave Solder', 'Test'],
};

describe('ReportYamazumiKPIGrid', () => {
  it('renders VA Ratio as percentage', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders takt time', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('renders steps over takt count and names', () => {
    render(<ReportYamazumiKPIGrid summary={mockSummary} />);
    expect(screen.getByText('3 steps')).toBeInTheDocument();
    expect(screen.getByText(/Pick/)).toBeInTheDocument();
  });

  it('truncates step names when more than 3', () => {
    const summary = { ...mockSummary, stepsOverTakt: ['A', 'B', 'C', 'D', 'E'] };
    render(<ReportYamazumiKPIGrid summary={summary} />);
    expect(screen.getByText('5 steps')).toBeInTheDocument();
    expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
  });

  it('shows green when no steps over takt', () => {
    const summary = { ...mockSummary, stepsOverTakt: [], taktTime: 100 };
    render(<ReportYamazumiKPIGrid summary={summary} />);
    expect(screen.getByText('0 steps')).toBeInTheDocument();
  });

  it('shows dash when takt time not set', () => {
    const summary = { ...mockSummary, taktTime: undefined, stepsOverTakt: [] };
    render(<ReportYamazumiKPIGrid summary={summary} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run ReportYamazumiKPIGrid`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ReportYamazumiKPIGrid**

Create `packages/ui/src/components/ReportView/ReportYamazumiKPIGrid.tsx`. Accepts `YamazumiSummary`, renders 3-column grid: VA Ratio (color-coded), Takt Time, Steps Over Takt (with truncated names). Follow `ReportKPIGrid` patterns for styling (same border/bg classes, same card structure).

- [ ] **Step 4: Add exports**

In `packages/ui/src/components/ReportView/index.ts`:

```ts
export { ReportYamazumiKPIGrid, type ReportYamazumiKPIGridProps } from './ReportYamazumiKPIGrid';
```

In `packages/ui/src/index.ts` (ReportView export block ~line 299):

```ts
ReportYamazumiKPIGrid,
type ReportYamazumiKPIGridProps,
```

- [ ] **Step 5: Run tests to verify**

Run: `pnpm --filter @variscout/ui test -- --run ReportYamazumiKPIGrid`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportYamazumiKPIGrid.tsx \
       packages/ui/src/components/ReportView/__tests__/ReportYamazumiKPIGrid.test.tsx \
       packages/ui/src/components/ReportView/index.ts \
       packages/ui/src/index.ts
git commit -m "feat: add ReportYamazumiKPIGrid for yamazumi report Step 1"
```

---

### Task 4: Create ReportActivityBreakdown

**Files:**

- Create: `packages/ui/src/components/ReportView/ReportActivityBreakdown.tsx`
- Create: `packages/ui/src/components/ReportView/__tests__/ReportActivityBreakdown.test.tsx`
- Modify: `packages/ui/src/components/ReportView/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ReportView/__tests__/ReportActivityBreakdown.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportActivityBreakdown } from '../ReportActivityBreakdown';
import type { YamazumiBarData } from '@variscout/core';

const mockBarData: YamazumiBarData = {
  key: 'Wave Solder',
  totalTime: 60,
  segments: [
    { activityType: 'va', totalTime: 28, percentage: 0.467, count: 10 },
    { activityType: 'nva-required', totalTime: 10, percentage: 0.167, count: 5 },
    { activityType: 'waste', totalTime: 18, percentage: 0.3, count: 8 },
    { activityType: 'wait', totalTime: 4, percentage: 0.067, count: 3 },
  ],
};

describe('ReportActivityBreakdown', () => {
  it('renders step name as heading', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText(/Wave Solder/)).toBeInTheDocument();
  });

  it('renders all activity types with times', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText('28s')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
    expect(screen.getByText('18s')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument();
  });

  it('renders activity type labels', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    expect(screen.getByText('Value-Adding')).toBeInTheDocument();
    expect(screen.getByText('NVA Required')).toBeInTheDocument();
    expect(screen.getByText('Waste')).toBeInTheDocument();
    expect(screen.getByText('Wait')).toBeInTheDocument();
  });

  it('shows lean tooltips on activity type labels', () => {
    render(<ReportActivityBreakdown stepName="Wave Solder" barData={mockBarData} />);
    const wasteLabel = screen.getByText('Waste');
    expect(wasteLabel).toHaveAttribute('title', expect.stringContaining('Eliminate'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run ReportActivityBreakdown`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ReportActivityBreakdown**

Create `packages/ui/src/components/ReportView/ReportActivityBreakdown.tsx`. Uses `ACTIVITY_TYPE_COLORS`, `ACTIVITY_TYPE_LABELS`, `ACTIVITY_TYPE_ORDER` from `@variscout/core`. Renders sorted segments with color dots, labels with `title` tooltips (lean guidance), and formatted times. Follow existing ReportView component patterns.

- [ ] **Step 4: Add exports**

In `packages/ui/src/components/ReportView/index.ts`:

```ts
export {
  ReportActivityBreakdown,
  type ReportActivityBreakdownProps,
} from './ReportActivityBreakdown';
```

In `packages/ui/src/index.ts`:

```ts
ReportActivityBreakdown,
type ReportActivityBreakdownProps,
```

- [ ] **Step 5: Run tests to verify**

Run: `pnpm --filter @variscout/ui test -- --run ReportActivityBreakdown`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportActivityBreakdown.tsx \
       packages/ui/src/components/ReportView/__tests__/ReportActivityBreakdown.test.tsx \
       packages/ui/src/components/ReportView/index.ts \
       packages/ui/src/index.ts
git commit -m "feat: add ReportActivityBreakdown with lean tooltips for yamazumi findings"
```

---

### Task 5: Wire Yamazumi Mode in Azure ReportView

This is the main integration task. Makes Step 1 and Step 6 mode-aware, and Step 2 finding-driven across all modes.

**Files:**

- Modify: `apps/azure/src/components/views/ReportView.tsx`

**Read first:**

- `apps/azure/src/context/DataContext.tsx` — access `analysisMode`, `yamazumiMapping`, `filteredData`
- `packages/hooks/src/useYamazumiChartData.ts` — hook signature
- `packages/core/src/yamazumi/aggregation.ts` — `computeYamazumiSummary(bars, taktTime)`

- [ ] **Step 1: Pass analysisMode to useReportSections**

Update the `useReportSections` call to pass `analysisMode` from DataContext:

```tsx
analysisMode: analysisMode ?? 'standard',
```

- [ ] **Step 2: Add yamazumi data computation**

Import and compute yamazumi data when in yamazumi mode:

```tsx
const isYamazumi = analysisMode === 'yamazumi';
const yamazumiBarData = useYamazumiChartData({
  filteredData: isYamazumi ? filteredData : [],
  mapping: yamazumiMapping ?? null,
});
const yamazumiSummary = useMemo(
  () =>
    isYamazumi && yamazumiBarData.length > 0
      ? computeYamazumiSummary(yamazumiBarData, yamazumiMapping?.taktTime)
      : null,
  [isYamazumi, yamazumiBarData, yamazumiMapping?.taktTime]
);
```

- [ ] **Step 3: Update Step 1 (current-condition) for yamazumi**

In `renderSection`, wrap the `current-condition` case with mode check:

- Yamazumi: `<ReportYamazumiKPIGrid>` + `<YamazumiChartBase>` snapshot (technical only)
- Standard: existing `<ReportKPIGrid>` + I-Chart (unchanged)

- [ ] **Step 4: Update Step 2 (drivers) to be finding-driven**

Replace hardcoded boxplot+pareto with finding-driven content for ALL modes:

- When findings exist: render each finding's text + status dot + chart context
  - Yamazumi findings with `source.chart === 'yamazumi'`: show `<ReportActivityBreakdown>`
  - SPC findings: show chart snapshot from source metadata
- When no findings: mode-appropriate fallback
  - Yamazumi: Reasons Pareto (if `yamazumiMapping.reasonColumn`) → Waste-by-Step Pareto
  - Standard: existing boxplot + pareto (unchanged)

- [ ] **Step 5: Update Step 6 (verification) for yamazumi**

Pass yamazumi-specific props to `<ReportCpkLearningLoop>`:

```tsx
metricLabel={isYamazumi ? 'VA Ratio' : 'Cpk'}
formatValue={isYamazumi ? (v: number) => `${Math.round(v * 100)}%` : undefined}
```

- [ ] **Step 6: Run build and tests**

Run: `pnpm build` — clean build
Run: `pnpm test` — all tests pass

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/components/views/ReportView.tsx
git commit -m "feat: wire yamazumi mode in report view with finding-driven Step 2"
```

---

### Task 6: Update Documentation

**Files:**

- Modify: `docs/03-features/analysis/yamazumi.md`

- [ ] **Step 1: Read current yamazumi docs**

Read `docs/03-features/analysis/yamazumi.md` to understand current structure.

- [ ] **Step 2: Add lean improvement principle section**

Add section documenting the lean improvement framework (Eliminate waste, Reduce NVA, Optimize VA) with table.

- [ ] **Step 3: Add reporting section**

Document how yamazumi reports differ from standard SPC reports (mode-specific titles, KPI grid, activity breakdown, learning loop metric).

- [ ] **Step 4: Commit**

```bash
git add docs/03-features/analysis/yamazumi.md
git commit -m "docs: add lean improvement principle and reporting section to yamazumi docs"
```

---

## Verification

After all tasks are complete:

1. **Unit tests:** `pnpm test` — all tests pass including new yamazumi report tests
2. **Build:** `pnpm build` — clean build with no type errors
3. **Manual verification (Azure dev server):**
   - Load assembly-line sample data (yamazumi auto-detected)
   - Navigate to Report view → Step 1 shows "Time Composition" + yamazumi KPIs + chart
   - Step 2 shows "Activity Composition"
   - Pin a finding on yamazumi step → appears in Step 2 with activity breakdown + lean tooltips
   - Toggle Summary → charts hidden, KPIs remain
   - Load SPC data → titles revert, Step 2 shows standard charts
   - Pin SPC finding → finding-driven Step 2 works in standard mode
4. **Audit:** `pnpm audit --audit-level=high` — 0 vulnerabilities
