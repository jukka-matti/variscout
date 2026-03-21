---
title: Analysis Flow Documentation + Capability Mode Features
---

# Analysis Flow Documentation + Capability Mode Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document the complete two-thread analysis flow (variation + capability), add a CapabilitySuggestionModal, extend TimeExtractionPanel with minute intervals, and simplify SubgroupConfig by removing the time-interval method.

**Architecture:** Five phases. Task 0 moves `formatTimeBucket` from `subgroupCapability.ts` to `time.ts` (resolves circular import for later tasks). Tasks 1-3 handle SubgroupConfig simplification (remove time-interval from core types, tests, and hooks). Tasks 4-5 extend TimeExtractionPanel with minute-interval extraction. Task 6 creates the CapabilitySuggestionModal. Task 7 wires the modal into apps. Tasks 8-9 write documentation.

**Tech Stack:** TypeScript, React, Vitest, Mermaid diagrams, `@variscout/core` (time.ts, subgroupCapability.ts), `@variscout/ui` (TimeExtractionPanel, SubgroupConfig, new CapabilitySuggestionModal), `@variscout/hooks` (useCapabilityIChartData)

**Spec:** `docs/superpowers/specs/2026-03-21-analysis-flow-design.md`

---

### Task 0: Move `formatTimeBucket` from `subgroupCapability.ts` to `time.ts`

**Files:**

- Modify: `packages/core/src/stats/subgroupCapability.ts` (move function + `TimeGranularity` type out)
- Modify: `packages/core/src/time.ts` (receive function + type)
- Modify: `packages/core/src/index.ts` (update export source)

**Why:** `formatTimeBucket` is needed by `time.ts` for minute-interval extraction (Task 4). Moving it now prevents a circular import (`time.ts` → `subgroupCapability.ts` → `time.ts`). The `TimeGranularity` type moves with it since it's the function's parameter type.

- [ ] **Step 1: Copy `TimeGranularity` type and `formatTimeBucket` function to `time.ts`**

Add to `packages/core/src/time.ts` (before `augmentWithTimeColumns`):

```typescript
/** Time interval granularity for time-based formatting */
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week';

const MONTH_ABBR_FMT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format a date into a bucket label for the given granularity.
 */
export function formatTimeBucket(
  date: Date,
  granularity: TimeGranularity,
  minuteInterval: number = 15
): string {
  // ... (copy full implementation from subgroupCapability.ts lines 232-263)
}
```

- [ ] **Step 2: In `subgroupCapability.ts`, replace the local definitions with an import**

```typescript
import { parseTimeValue, formatTimeBucket, type TimeGranularity } from '../time';
```

Remove the local `TimeGranularity` type, `MONTH_ABBR` constant, and `formatTimeBucket` function from `subgroupCapability.ts`.

- [ ] **Step 3: Update `packages/core/src/index.ts` exports**

Change the `formatTimeBucket` and `TimeGranularity` exports to come from `time.ts` instead of `subgroupCapability.ts`.

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: All PASS (no behavior change, just moving code).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/time.ts packages/core/src/stats/subgroupCapability.ts packages/core/src/index.ts
git commit -m "refactor: move formatTimeBucket from subgroupCapability to time.ts

Prevents circular import when time.ts needs formatTimeBucket for
minute-interval extraction. No behavior change.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 1: Remove `time-interval` from SubgroupConfig types

**Files:**

- Modify: `packages/core/src/stats/subgroupCapability.ts:19-38` (types), `:100-118` (dispatcher), `:176-207` (groupByTimeInterval)
- Modify: `packages/core/src/index.ts:89-105` (exports)

- [ ] **Step 1: Remove `time-interval` from `SubgroupMethod` union**

In `packages/core/src/stats/subgroupCapability.ts`, line 19:

```typescript
// Before:
export type SubgroupMethod = 'column' | 'fixed-size' | 'time-interval';

// After:
export type SubgroupMethod = 'column' | 'fixed-size';
```

- [ ] **Step 2: Remove time-interval fields from `SubgroupConfig`**

In `packages/core/src/stats/subgroupCapability.ts`, lines 25-38. Remove `timeColumn`, `granularity`, `minuteInterval` fields:

```typescript
export interface SubgroupConfig {
  /** Grouping method */
  method: SubgroupMethod;
  /** Column name when method = 'column' */
  column?: string;
  /** Subgroup size when method = 'fixed-size' (default 5, min 2) */
  size?: number;
}
```

- [ ] **Step 3: Verify `TimeGranularity` type was already moved**

In Task 0, `TimeGranularity` was moved to `time.ts`. Verify that the import in `subgroupCapability.ts` still works for `groupByTimeInterval` (which will be removed in Step 4). No action needed if Task 0 was completed correctly.

- [ ] **Step 4: Remove `groupByTimeInterval` function**

Delete the entire `groupByTimeInterval` function (lines 176-207).

- [ ] **Step 5: Simplify `groupDataIntoSubgroups` dispatcher**

Remove the time-interval branch (lines 108-115):

```typescript
export function groupDataIntoSubgroups(
  rows: DataRow[],
  outcome: string,
  config: SubgroupConfig
): SubgroupData[] {
  if (config.method === 'column' && config.column) {
    return groupByColumn(rows, outcome, config.column);
  }
  return groupByFixedSize(rows, outcome, config.size ?? 5);
}
```

- [ ] **Step 6: Remove `parseTimeValue` import if no longer used**

Check if `parseTimeValue` import (line 12) is still used after removing `groupByTimeInterval`. If not, remove it.

- [ ] **Step 7: Update core exports**

In `packages/core/src/index.ts`, verify `TimeGranularity` and `formatTimeBucket` are exported from `time.ts` (handled in Task 0). No additional changes needed here.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/stats/subgroupCapability.ts packages/core/src/index.ts
git commit -m "refactor: remove time-interval subgroup method from SubgroupConfig

Simplify SubgroupConfig to only 'column' and 'fixed-size' methods.
Time-based subgrouping now handled via TimeExtractionPanel column
extraction during FRAME phase.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 2: Update SubgroupConfig tests

**Files:**

- Modify: `packages/core/src/stats/__tests__/subgroupCapability.test.ts`

- [ ] **Step 1: Remove time-interval test cases**

Remove `describe` blocks and `it` tests that use `method: 'time-interval'` or reference `groupByTimeInterval`. **Keep the `formatTimeBucket` describe block** (tests around lines 467-488) — this function still exists (moved to `time.ts`). Update the import to come from `@variscout/core` (or `../time` if testing internally).

- [ ] **Step 2: Verify remaining tests still reference correct types**

Remove any `TimeGranularity` type imports from this test file (the `formatTimeBucket` tests use string literals like `'minute'`, `'hour'` which still match the type). Update any `SubgroupConfig` usage that includes `timeColumn` or `granularity` fields.

- [ ] **Step 3: Run tests to verify**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: All remaining subgroupCapability tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/stats/__tests__/subgroupCapability.test.ts
git commit -m "test: remove time-interval subgroup tests

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 3: Simplify SubgroupConfigPopover and useCapabilityIChartData

**Files:**

- Modify: `packages/ui/src/components/SubgroupConfig/index.tsx`
- Modify: `packages/hooks/src/useCapabilityIChartData.ts`

- [ ] **Step 1: Remove time-interval radio from SubgroupConfigPopover**

In `packages/ui/src/components/SubgroupConfig/index.tsx`:

- Remove `GRANULARITY_OPTIONS` constant (lines 19-26)
- Remove the "By time interval" radio option and its conditional UI (granularity dropdown, minute interval input)
- Remove `timeColumn` and `hasTimeOfDay` from props interface
- Keep only "Fixed size" and "By column" radios

- [ ] **Step 2: Update SubgroupConfigProps interface**

```typescript
export interface SubgroupConfigProps {
  config: SubgroupConfig;
  onConfigChange: (config: SubgroupConfig) => void;
  availableColumns: string[];
  columnAliases?: Record<string, string>;
}
```

- [ ] **Step 3: Update useCapabilityIChartData**

In `packages/hooks/src/useCapabilityIChartData.ts`, verify no time-interval-specific handling exists. The hook calls `groupDataIntoSubgroups` which now only handles column and fixed-size — no changes should be needed if it just passes the config through.

- [ ] **Step 4: Update any app-level code passing timeColumn/hasTimeOfDay to SubgroupConfig**

Search for `SubgroupConfig` usage in `apps/azure/` and `apps/pwa/` and remove `timeColumn` and `hasTimeOfDay` props.

- [ ] **Step 5: Run tests**

Run: `pnpm test -- --run`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/SubgroupConfig/ packages/hooks/src/useCapabilityIChartData.ts
git add apps/azure/ apps/pwa/
git commit -m "refactor: simplify SubgroupConfig to column + fixed-size only

Remove time-interval radio from SubgroupConfigPopover.
Remove timeColumn/hasTimeOfDay props.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 4: Extend TimeExtractionConfig with minute intervals

**Files:**

- Modify: `packages/core/src/time.ts:27-33` (TimeExtractionConfig), `:233-272` (augmentWithTimeColumns)
- Test: `packages/core/src/__tests__/time.test.ts`

- [ ] **Step 1: Write failing test for minute-interval extraction**

In `packages/core/src/__tests__/time.test.ts`, add:

```typescript
describe('augmentWithTimeColumns - minute intervals', () => {
  it('should extract 15-minute interval columns', () => {
    const data = [
      { timestamp: '2025-03-19T14:03:00' },
      { timestamp: '2025-03-19T14:18:00' },
      { timestamp: '2025-03-19T14:32:00' },
    ];
    const config: TimeExtractionConfig = {
      extractYear: false,
      extractMonth: false,
      extractWeek: false,
      extractDayOfWeek: false,
      extractHour: false,
      extractMinuteInterval: 15,
    };
    const result = augmentWithTimeColumns(data, 'timestamp', config);
    expect(result.newColumns).toContain('timestamp_15min');
    expect(data[0]['timestamp_15min']).toBe('Mar 19 14:00');
    expect(data[1]['timestamp_15min']).toBe('Mar 19 14:15');
    expect(data[2]['timestamp_15min']).toBe('Mar 19 14:30');
  });

  it('should extract 5-minute interval columns', () => {
    const data = [{ timestamp: '2025-03-19T14:03:00' }, { timestamp: '2025-03-19T14:07:00' }];
    const config: TimeExtractionConfig = {
      extractYear: false,
      extractMonth: false,
      extractWeek: false,
      extractDayOfWeek: false,
      extractHour: false,
      extractMinuteInterval: 5,
    };
    const result = augmentWithTimeColumns(data, 'timestamp', config);
    expect(result.newColumns).toContain('timestamp_5min');
    expect(data[0]['timestamp_5min']).toBe('Mar 19 14:00');
    expect(data[1]['timestamp_5min']).toBe('Mar 19 14:05');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run -t "minute intervals"`
Expected: FAIL — `extractMinuteInterval` not recognized.

- [ ] **Step 3: Add `extractMinuteInterval` to `TimeExtractionConfig`**

In `packages/core/src/time.ts`, line 33:

```typescript
export interface TimeExtractionConfig {
  extractYear: boolean;
  extractMonth: boolean;
  extractWeek: boolean;
  extractDayOfWeek: boolean;
  extractHour: boolean;
  /** Minute-interval extraction: 1, 5, 15, or 30. Creates column like '_15min'. */
  extractMinuteInterval?: number;
}
```

- [ ] **Step 4: Implement minute-interval extraction in `augmentWithTimeColumns`**

In `packages/core/src/time.ts`, inside `augmentWithTimeColumns` (around line 260, before the return), add:

```typescript
// Minute-interval extraction
if (config.extractMinuteInterval && config.extractMinuteInterval > 0) {
  const interval = config.extractMinuteInterval;
  const colName = `${timeColumn}_${interval}min`;
  newColumns.push(colName);
  for (const row of data) {
    const date = parseTimeValue(row[timeColumn]);
    if (date) {
      row[colName] = formatTimeBucket(date, 'minute', interval);
    } else {
      row[colName] = '';
    }
  }
}
```

Note: `formatTimeBucket` was moved to `time.ts` in Task 0, so it's already available locally — no import needed.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run -t "minute intervals"`
Expected: PASS.

- [ ] **Step 6: Run all core tests**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/time.ts packages/core/src/__tests__/time.test.ts
git commit -m "feat: add minute-interval extraction to TimeExtractionConfig

Support 1/5/15/30 minute interval columns via extractMinuteInterval.
Uses formatTimeBucket for consistent labeling (e.g., 'Mar 19 14:15').

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 5: Update TimeExtractionPanel UI

**Files:**

- Modify: `packages/ui/src/components/ColumnMapping/TimeExtractionPanel.tsx`

- [ ] **Step 1: Add minute-interval dropdown to UI**

In `TimeExtractionPanel.tsx`, add state for minute interval:

```typescript
const [minuteInterval, setMinuteInterval] = useState<number | undefined>(undefined);
```

After the Hour checkbox (only shown when `hasTimeComponent`), add a minute-interval selector:

```typescript
{hasTimeComponent && config.extractHour && (
  <div className="mt-2 ml-8">
    <label className="text-xs text-content-muted">
      Interval
    </label>
    <select
      className="ml-2 text-xs bg-surface-secondary border border-edge rounded px-2 py-1"
      value={minuteInterval ?? ''}
      onChange={(e) => {
        const val = e.target.value ? Number(e.target.value) : undefined;
        setMinuteInterval(val);
        const newConfig = { ...config, extractMinuteInterval: val };
        setConfig(newConfig);
        onTimeExtractionChange?.(newConfig);
      }}
    >
      <option value="">Hour only</option>
      <option value="30">Every 30 min</option>
      <option value="15">Every 15 min</option>
      <option value="5">Every 5 min</option>
      <option value="1">Every 1 min</option>
    </select>
  </div>
)}
```

- [ ] **Step 2: Update config state to include extractMinuteInterval**

Update the `useState` default and the `handleChange` callback to propagate `extractMinuteInterval`.

- [ ] **Step 3: Verify in Storybook or dev server**

Run: `pnpm storybook` or `pnpm dev`
Manual check: ColumnMapping with a timestamp column shows the minute-interval dropdown when Hour is checked.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ColumnMapping/TimeExtractionPanel.tsx
git commit -m "feat: add minute-interval options to TimeExtractionPanel

Show 30/15/5/1 min interval dropdown when Hour extraction is enabled.
Only visible when data has time-of-day component.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 6: Create CapabilitySuggestionModal component

**Files:**

- Create: `packages/ui/src/components/CapabilitySuggestionModal/index.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the component file**

Create `packages/ui/src/components/CapabilitySuggestionModal/index.tsx` following the `PerformanceDetectedModal` pattern (native `<dialog>`, `useTranslation`, green primary button):

```typescript
import React, { useRef, useEffect } from 'react';
import { BarChart3, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

export interface CapabilitySuggestionModalProps {
  onStartCapability: (subgroupConfig: {
    method: 'column' | 'fixed-size';
    column?: string;
    size?: number;
  }) => void;
  onStartStandard: () => void;
  hasFactors: boolean;
  factorColumns: string[];
}

export const CapabilitySuggestionModal: React.FC<CapabilitySuggestionModalProps> = ({
  onStartCapability,
  onStartStandard,
  hasFactors,
  factorColumns,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleStartCapability = () => {
    // Auto-select: prefer time-extracted column (contains _Hour, _15min, etc.), else first factor, else fixed n=5
    const timeExtracted = factorColumns.find((c) => /_(?:Hour|Year|Month|Week|DayOfWeek|\d+min)$/.test(c));
    if (timeExtracted) {
      onStartCapability({ method: 'column', column: timeExtracted });
    } else if (factorColumns.length > 0) {
      onStartCapability({ method: 'column', column: factorColumns[0] });
    } else {
      onStartCapability({ method: 'fixed-size', size: 5 });
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="bg-surface-primary border border-edge rounded-xl shadow-xl p-0 w-full max-w-md backdrop:bg-black/50"
      onClose={onStartStandard}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600/20">
              <BarChart3 size={20} className="text-green-400" />
            </div>
            <h2 className="text-base font-semibold text-content">
              {t('capability.suggestion.title', 'Specification limits set')}
            </h2>
          </div>
          <button
            onClick={onStartStandard}
            className="text-content-muted hover:text-content p-1"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-content-muted mb-4">
          {t(
            'capability.suggestion.description',
            'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?'
          )}
        </p>

        <div className="bg-surface-secondary rounded-lg p-3 mb-4 text-xs text-content-muted space-y-1">
          <div className="font-medium text-content text-xs mb-1">
            {t('capability.suggestion.whatYouSee', "What you'll see:")}
          </div>
          <div>
            {t('capability.suggestion.bullet1', '• I-Chart plotting Cp and Cpk per subgroup')}
          </div>
          <div>
            {t(
              'capability.suggestion.bullet2',
              '• Whether subgroups consistently meet your target'
            )}
          </div>
          <div>
            {t(
              'capability.suggestion.bullet3',
              '• Centering loss (gap between Cp and Cpk)'
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStartCapability}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('capability.suggestion.startCapability', 'Start with Capability View')}
          </button>
          <button
            onClick={onStartStandard}
            className="flex-1 px-4 py-2 bg-surface-secondary hover:bg-surface-tertiary text-content border border-edge rounded-lg text-sm font-medium transition-colors"
          >
            {t('capability.suggestion.standardView', 'Standard View')}
          </button>
        </div>

        <p className="text-[10px] text-content-muted text-center mt-3">
          {t(
            'capability.suggestion.footer',
            'You can switch anytime using the toggle in the I-Chart header.'
          )}
        </p>
      </div>
    </dialog>
  );
};
```

- [ ] **Step 2: Export from `@variscout/ui`**

In `packages/ui/src/index.ts`, add near the other modal exports:

```typescript
export {
  CapabilitySuggestionModal,
  type CapabilitySuggestionModalProps,
} from './components/CapabilitySuggestionModal';
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @variscout/ui build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/CapabilitySuggestionModal/ packages/ui/src/index.ts
git commit -m "feat: add CapabilitySuggestionModal component

Contextual modal suggesting capability view when spec limits are set.
Follows PerformanceDetectedModal pattern. Auto-selects best subgroup
method (time-extracted column > first factor > fixed n=5).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 7: Wire CapabilitySuggestionModal into apps

**Files:**

- Modify: `apps/pwa/src/App.tsx` (near YamazumiDetectedModal usage, ~line 638)
- Modify: `apps/azure/src/pages/Editor.tsx` (near YamazumiDetectedModal usage, ~line 1646)

- [ ] **Step 1: Add state and trigger logic to PWA App.tsx**

In `apps/pwa/src/App.tsx`, add state:

```typescript
const [showCapabilitySuggestion, setShowCapabilitySuggestion] = useState(false);
const [capabilitySuggestionDismissed, setCapabilitySuggestionDismissed] = useState(false);
```

Add effect to trigger on FRAME → SCOUT transition (when data is loaded and specs exist). Guard against showing when another detection modal is active:

```typescript
useEffect(() => {
  if (
    hasData &&
    (specs?.usl !== undefined || specs?.lsl !== undefined) &&
    !capabilitySuggestionDismissed &&
    !showCapabilitySuggestion &&
    !importFlow.yamazumiDetection && // Don't stack modals
    !importFlow.performanceDetection // Don't stack modals
  ) {
    setShowCapabilitySuggestion(true);
  }
}, [
  hasData,
  specs,
  capabilitySuggestionDismissed,
  showCapabilitySuggestion,
  importFlow.yamazumiDetection,
  importFlow.performanceDetection,
]);
```

Note: Check exact property names on `importFlow` — these may differ between PWA and Azure. The key is: don't show CapabilitySuggestionModal when another detection modal is visible.

- [ ] **Step 2: Render CapabilitySuggestionModal in PWA**

Near the YamazumiDetectedModal render (around line 638), add:

```typescript
{showCapabilitySuggestion && (
  <CapabilitySuggestionModal
    onStartCapability={(subgroupConfig) => {
      setDisplayOptions((prev) => ({
        ...prev,
        standardIChartMetric: 'capability',
      }));
      setSubgroupConfig(subgroupConfig);
      setShowCapabilitySuggestion(false);
      setCapabilitySuggestionDismissed(true);
    }}
    onStartStandard={() => {
      setShowCapabilitySuggestion(false);
      setCapabilitySuggestionDismissed(true);
    }}
    hasFactors={factorColumns.length > 0}
    factorColumns={factorColumns}
  />
)}
```

- [ ] **Step 3: Wire into Azure Editor.tsx**

Same pattern in `apps/azure/src/pages/Editor.tsx`. Add state, effect trigger, and render near the YamazumiDetectedModal.

- [ ] **Step 4: Verify manually**

Run: `pnpm dev`
Test: Load data → set specs in ColumnMapping → start analysis → modal appears → "Start with Capability View" switches I-Chart to capability mode.

- [ ] **Step 5: Run all tests**

Run: `pnpm test -- --run`
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/App.tsx apps/azure/src/pages/Editor.tsx
git commit -m "feat: wire CapabilitySuggestionModal into PWA and Azure apps

Show modal at FRAME→SCOUT transition when specs are set.
Auto-selects subgroup method on 'Start with Capability View'.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 8: Write analysis-flow.md documentation

**Files:**

- Create: `docs/03-features/workflows/analysis-flow.md`

- [ ] **Step 1: Create the document**

Write `docs/03-features/workflows/analysis-flow.md` following the spec's 10-section structure. Include:

- YAML frontmatter (title, audience, category, status, related)
- Mermaid flowchart for journey overview with both threads
- Mermaid diagram for thread switching in SCOUT
- Three Entry Paths × Two Threads table
- SCOUT decision points table (EDA-first framing)
- Thread switching moments with examples
- Brush → Create Factor flow description
- INVESTIGATE and IMPROVE sections showing thread convergence
- Cpk touchpoint matrix (10 touchpoints)
- Three use case examples (supplier PPAP, customer complaint, batch consistency)
- Code traceability table (phase × thread → hooks + components)
- Related documentation links

Reference the spec document (`docs/superpowers/specs/2026-03-21-analysis-flow-design.md`) sections 1-10 for all content.

- [ ] **Step 2: Verify docs build**

Run: `pnpm docs:build`
Expected: Build succeeds, new page appears in workflows section.

- [ ] **Step 3: Commit**

```bash
git add docs/03-features/workflows/analysis-flow.md
git commit -m "docs: add comprehensive analysis flow document

Two-thread model (variation + capability) through FRAME→SCOUT→
INVESTIGATE→IMPROVE. EDA-first decision framing, thread switching
moments, Cpk touchpoint matrix, use case examples, code traceability.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 9: Update existing documentation

**Files:**

- Modify: `docs/03-features/workflows/analysis-journey-map.md` (~line 129)
- Modify: `docs/01-vision/methodology.md` (~line 143)
- Modify: `docs/03-features/analysis/subgroup-capability.md`
- Modify: `docs/05-technical/architecture/mental-model-hierarchy.md`

- [ ] **Step 1: Update analysis-journey-map.md**

After SCOUT step 4 ("Check Cpk"), add:

```markdown
5. **Toggle Capability Mode** -- The I-Chart supports a "Values | Capability" toggle switching between raw measurements and per-subgroup Cp/Cpk. This checks whether subgroups consistently meet the Cpk target. See [Analysis Flow](analysis-flow.md) for the complete two-thread analysis journey.
```

- [ ] **Step 2: Update methodology.md**

In the Analysis Modes section (around line 143), replace or extend the Capability Mode bullet with:

```markdown
- **Capability Mode** — Per-subgroup Cp/Cpk stability analysis on the I-Chart, answering "Are we meeting our Cpk target?" Analysts switch freely between standard and capability views at any drill level. Time-based subgrouping uses extracted time columns from FRAME. See [Analysis Flow](../03-features/workflows/analysis-flow.md) for how these modes interleave through the full journey.
```

- [ ] **Step 3: Update subgroup-capability.md**

Add a "Journey Context" section near the top:

```markdown
## Journey Context

Capability mode is a view toggle within the SCOUT phase of the analysis journey. The analyst switches between Values (variation analysis) and Capability (target compliance) at any point during analysis. Both views work on the same filtered data — drill-down, findings, and investigation are identical in both modes.

Time-based subgrouping uses extracted time columns from FRAME (TimeExtractionPanel with minute-interval support), ensuring subgroups appear as Boxplot-filterable categories and work seamlessly with findings. For fixed-size subgroups where a specific subgroup fails, the analyst can use the Brush → Create Factor flow to isolate problematic data points for deeper investigation.

See [Analysis Flow](../workflows/analysis-flow.md) for the complete two-thread analysis journey.
```

- [ ] **Step 4: Update mental-model-hierarchy.md**

Add capability mode to the framework nesting. Find the section describing SCOUT-phase tools and add:

```markdown
#### Analysis Modes (SCOUT)

The standard Four Lenses dashboard can be augmented with alternative analysis modes:

- **Performance Mode** — Multi-channel Cpk comparison (wide-format data)
- **Yamazumi Mode** — Lean time study (stacked activity bars)
- **Capability Mode** — I-Chart view toggle showing per-subgroup Cp/Cpk ("Are we meeting our Cpk target?")

Each mode is a view configuration, not a separate workflow. The analyst switches freely and all modes share the same findings, drill-down, and investigation infrastructure.
```

- [ ] **Step 5: Commit**

```bash
git add docs/03-features/workflows/analysis-journey-map.md docs/01-vision/methodology.md
git add docs/03-features/analysis/subgroup-capability.md docs/05-technical/architecture/mental-model-hierarchy.md
git commit -m "docs: update existing docs with capability mode journey context

Add cross-references to analysis-flow.md from journey map, methodology,
subgroup capability, and mental model hierarchy docs.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test -- --run`
Expected: All tests PASS.

- [ ] **Step 2: Build all packages**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Build documentation site**

Run: `pnpm docs:build`
Expected: Build succeeds, analysis-flow.md renders correctly.

- [ ] **Step 4: Manual verification checklist**

Run: `pnpm dev`

- [ ] TimeExtractionPanel shows minute-interval dropdown when Hour is checked (with time-of-day data)
- [ ] SubgroupConfig shows only Column + Fixed Size options (no time-interval)
- [ ] Load data with specs → CapabilitySuggestionModal appears
- [ ] "Start with Capability View" → I-Chart shows Cp/Cpk per subgroup
- [ ] "Standard View" → normal dashboard, toggle available in I-Chart header
- [ ] Dismiss modal → doesn't reappear in same session
- [ ] Cross-reference links in updated docs resolve correctly
