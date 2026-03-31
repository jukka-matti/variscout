---
title: 'Capability Mode Coherence Implementation Plan'
---

# Capability Mode Coherence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard coherent when capability mode is toggled — boxplot labels/guards, ProcessHealthBar stats, I-Chart series colors, and universal dot plot fallback for small categories.

**Architecture:** Four independent changes that can be implemented in any order. The dot plot fallback is a general improvement to `BoxplotBase` and `PerformanceBoxplotBase`. The other three changes are capability-mode-specific, modifying `IChartBase`/`DataPoints`, `ProcessHealthBar`, and `BoxplotWrapperBase`.

**Tech Stack:** React, Visx, TypeScript, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-29-capability-mode-coherence-design.md`

---

### Task 1: Universal Dot Plot Fallback for Standard Boxplot

When a category has fewer than 7 data points, render jittered dots instead of a box-and-whisker.

**Files:**

- Modify: `packages/charts/src/Boxplot.tsx`
- Create: `packages/charts/src/__tests__/Boxplot.test.tsx`

- [ ] **Step 1: Write failing test for dot fallback rendering**

```typescript
// packages/charts/src/__tests__/Boxplot.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BoxplotBase } from '../Boxplot';
import type { BoxplotGroupData } from '../types';

const MIN_BOXPLOT_VALUES = 7;

const makeGroup = (key: string, values: number[]): BoxplotGroupData => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return {
    key,
    values: sorted,
    min: sorted[0],
    q1: sorted[Math.floor(n * 0.25)] ?? sorted[0],
    median: sorted[Math.floor(n * 0.5)] ?? sorted[0],
    q3: sorted[Math.floor(n * 0.75)] ?? sorted[0],
    max: sorted[n - 1],
    mean: values.reduce((a, b) => a + b, 0) / n,
    outliers: [],
  };
};

describe('Boxplot dot fallback', () => {
  const defaultProps = {
    parentWidth: 600,
    parentHeight: 400,
    specs: {},
  };

  it('renders dots instead of box when category has < 7 values', () => {
    const data = [makeGroup('Small', [1, 2, 3, 4, 5])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // Should have jittered dot circles (data-testid="dot-fallback-Small")
    const dots = container.querySelectorAll('[data-testid^="dot-fallback-"]');
    expect(dots.length).toBe(5);

    // Should NOT have a box rect for this category
    const boxes = container.querySelectorAll('[data-testid="boxplot-box-Small"]');
    expect(boxes.length).toBe(0);
  });

  it('renders standard box when category has >= 7 values', () => {
    const data = [makeGroup('Large', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    const boxes = container.querySelectorAll('[data-testid="boxplot-box-Large"]');
    expect(boxes.length).toBe(1);

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-"]');
    expect(dots.length).toBe(0);
  });

  it('renders mixed: dots for small categories, boxes for large', () => {
    const data = [
      makeGroup('Small', [1, 2, 3]),
      makeGroup('Large', [1, 2, 3, 4, 5, 6, 7, 8]),
    ];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Small"]');
    expect(dots.length).toBe(3);

    const boxes = container.querySelectorAll('[data-testid="boxplot-box-Large"]');
    expect(boxes.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/charts test -- --run --reporter=verbose Boxplot.test`
Expected: FAIL — no `data-testid` attributes exist yet.

- [ ] **Step 3: Add MIN_BOXPLOT_VALUES constant and dot fallback rendering**

In `packages/charts/src/Boxplot.tsx`:

Add the constant at the top (after line 18):

```typescript
/** Minimum values per category before switching from box to dot plot */
export const MIN_BOXPLOT_VALUES = 7;
```

Inside the `data.map((d, i) => { ... })` loop (around line 203), add a branch before the existing `showViolin` check. The structure becomes:

```typescript
{data.map((d, i) => {
  const x = xScale(d.key) || 0;
  const barWidth = xScale.bandwidth();
  const usesDotFallback = d.values.length < MIN_BOXPLOT_VALUES;

  return (
    <Group
      key={i}
      onClick={() => onBoxClick?.(d.key)}
      onContextMenu={/* ... existing ... */}
      onMouseOver={() => showTooltipAtCoords(x + barWidth, yScale(d.median), d)}
      onMouseLeave={hideTooltip}
      className={onBoxClick || onBoxContextMenu ? interactionStyles.clickable : ''}
      opacity={getOpacity(d.key)}
      {...getBoxplotA11yProps(d.key, d.median, d.values.length, onBoxClick ? () => onBoxClick(d.key) : undefined)}
    >
      {/* Transparent capture rect for better clickability */}
      <rect x={x - 5} y={0} width={barWidth + 10} height={height} fill="transparent" />

      {usesDotFallback ? (
        <>
          {/* Dot fallback for small categories */}
          {d.values.map((v, j) => {
            // Deterministic jitter based on value and index
            const jitter = ((j * 7 + Math.round(v * 13)) % 11 - 5) / 5;
            const jitterX = x + barWidth / 2 + jitter * barWidth * 0.2;
            const dotFill = highlightedCategories?.[d.key]
              ? highlightFillColors[highlightedCategories[d.key]]
              : fillOverrides?.[d.key]
                ? fillOverrides[d.key]
                : isSelected(d.key)
                  ? colors.selected
                  : chrome.labelSecondary;
            return (
              <circle
                key={`dot-${j}`}
                data-testid={`dot-fallback-${d.key}-${j}`}
                cx={jitterX}
                cy={yScale(v)}
                r={4}
                fill={dotFill}
                opacity={0.8}
              />
            );
          })}
          {/* Mean marker (diamond) — still shown for dot categories */}
          <polygon
            points={`
              ${x + barWidth / 2},${yScale(d.mean) - 4}
              ${x + barWidth / 2 + 4},${yScale(d.mean)}
              ${x + barWidth / 2},${yScale(d.mean) + 4}
              ${x + barWidth / 2 - 4},${yScale(d.mean)}
            `}
            fill={chrome.labelPrimary}
          />
        </>
      ) : showViolin && violinData.has(d.key) ? (
        <>
          {/* ... existing violin code unchanged ... */}
        </>
      ) : (
        <>
          {/* ... existing standard boxplot code ... */}
          {/* Add data-testid="boxplot-box-{key}" to the box <rect> element */}
        </>
      )}
    </Group>
  );
})}
```

Add `data-testid={`boxplot-box-${d.key}`}` to the existing box `<rect>` element (around line 318).

- [ ] **Step 4: Export the constant from charts package**

In `packages/charts/src/index.ts`, add to exports:

```typescript
export { MIN_BOXPLOT_VALUES } from './Boxplot';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/charts test -- --run --reporter=verbose Boxplot.test`
Expected: PASS — all 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add packages/charts/src/Boxplot.tsx packages/charts/src/__tests__/Boxplot.test.tsx packages/charts/src/index.ts
git commit -m "feat: dot plot fallback for boxplot categories with < 7 values"
```

---

### Task 2: Universal Dot Plot Fallback for Performance Boxplot

Same fallback for the performance (multi-channel) boxplot.

**Files:**

- Modify: `packages/charts/src/PerformanceBoxplot.tsx`
- Create: `packages/charts/src/__tests__/PerformanceBoxplot.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// packages/charts/src/__tests__/PerformanceBoxplot.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceBoxplotBase } from '../PerformanceBoxplot';
import type { ChannelResult } from '@variscout/core';

const makeChannel = (id: string, values: number[]): ChannelResult => ({
  id,
  label: id,
  n: values.length,
  values,
  mean: values.reduce((a, b) => a + b, 0) / values.length,
  stdDev: 1,
  cpk: 1.2,
  cp: 1.4,
});

describe('PerformanceBoxplot dot fallback', () => {
  const defaultProps = {
    parentWidth: 600,
    parentHeight: 400,
    channels: [] as ChannelResult[],
    specs: {},
  };

  it('renders dots instead of box when channel has < 7 values', () => {
    const channels = [makeChannel('V1', [1, 2, 3, 4, 5])];
    const { container } = render(
      <PerformanceBoxplotBase {...defaultProps} channels={channels} />
    );

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-"]');
    expect(dots.length).toBe(5);
  });

  it('renders standard box when channel has >= 7 values', () => {
    const channels = [makeChannel('V1', [1, 2, 3, 4, 5, 6, 7, 8])];
    const { container } = render(
      <PerformanceBoxplotBase {...defaultProps} channels={channels} />
    );

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-"]');
    expect(dots.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/charts test -- --run --reporter=verbose PerformanceBoxplot.test`
Expected: FAIL

- [ ] **Step 3: Add dot fallback to PerformanceBoxplot**

In `packages/charts/src/PerformanceBoxplot.tsx`, import the constant:

```typescript
import { MIN_BOXPLOT_VALUES } from './Boxplot';
```

Inside the `boxplotData.map(({ channel, stats }) => { ... })` loop (around line 209), add a `usesDotFallback` check:

```typescript
const usesDotFallback = channel.values.length < MIN_BOXPLOT_VALUES;
```

Then wrap the existing rendering in a conditional, same pattern as Task 1:

- If `usesDotFallback`: render jittered `<circle>` elements for each value + mean diamond
- If `showViolin`: existing violin code
- Else: existing standard box code

The dot rendering for PerformanceBoxplot:

```typescript
{usesDotFallback ? (
  <>
    {channel.values.map((v, j) => {
      const jitter = ((j * 7 + Math.round(v * 13)) % 11 - 5) / 5;
      const jitterX = x + barWidth / 2 + jitter * barWidth * 0.2;
      return (
        <circle
          key={`dot-${j}`}
          data-testid={`dot-fallback-${channel.id}-${j}`}
          cx={jitterX}
          cy={yScale(v)}
          r={4}
          fill={isSelected ? chartColors.selected : chrome.labelSecondary}
          opacity={0.8}
        />
      );
    })}
    <polygon
      points={`
        ${x + barWidth / 2},${yScale(stats.mean) - 4}
        ${x + barWidth / 2 + 4},${yScale(stats.mean)}
        ${x + barWidth / 2},${yScale(stats.mean) + 4}
        ${x + barWidth / 2 - 4},${yScale(stats.mean)}
      `}
      fill={chrome.labelPrimary}
    />
  </>
) : showViolin ? (
  /* ... existing violin code ... */
) : (
  /* ... existing standard box code ... */
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/charts test -- --run --reporter=verbose PerformanceBoxplot.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/PerformanceBoxplot.tsx packages/charts/src/__tests__/PerformanceBoxplot.test.tsx
git commit -m "feat: dot plot fallback for performance boxplot with < 7 values"
```

---

### Task 3: Capability I-Chart Series Colors + Connecting Lines

Change Cp from green to purple, add grey connecting lines between Cpk-Cp pairs.

**Files:**

- Modify: `packages/charts/src/colors.ts`
- Modify: `packages/charts/src/ichart/DataPoints.tsx`
- Modify: `packages/charts/src/ichart/ControlLines.tsx`
- Modify: `packages/charts/src/__tests__/colors.test.ts`

- [ ] **Step 1: Add cpPotential color constant**

In `packages/charts/src/colors.ts`, add to `chartColors` object (after `meanAlt` line):

```typescript
cpPotential: '#8b5cf6',    // violet-500 — Cp (potential capability) series
```

- [ ] **Step 2: Update colors test**

In `packages/charts/src/__tests__/colors.test.ts`, add to the existing chartColors test:

```typescript
it('exports cpPotential color for Cp series', () => {
  expect(chartColors.cpPotential).toBe('#8b5cf6');
});
```

- [ ] **Step 3: Run colors test to verify it passes**

Run: `pnpm --filter @variscout/charts test -- --run --reporter=verbose colors.test`
Expected: PASS

- [ ] **Step 4: Update DataPoints.tsx — secondary series color + connecting lines**

In `packages/charts/src/ichart/DataPoints.tsx`:

Replace `operatorColors[1]` with `chartColors.cpPotential` for the secondary series. Change the secondary series rendering (around lines 198-231):

```typescript
{/* Secondary series data line + dots */}
{hasSecondary && (
  <>
    {/* Connecting lines between primary and secondary (centering gap) */}
    {data.map((primary, i) => {
      const secondary = secondaryData![i];
      if (!secondary) return null;
      return (
        <line
          key={`gap-${i}`}
          x1={xScale(primary.x)}
          y1={yScale(primary.y)}
          x2={xScale(secondary.x)}
          y2={yScale(secondary.y)}
          stroke={chrome.labelSecondary}
          strokeWidth={1.5}
          opacity={0.5}
        />
      );
    })}

    {/* Secondary series line path */}
    <LinePath
      data={secondaryData!}
      x={d => xScale(d.x)}
      y={d => yScale(d.y)}
      stroke={chartColors.cpPotential}
      strokeWidth={1}
      strokeOpacity={0.4}
    />

    {/* Secondary series dots */}
    {secondaryData!.map((d, i) => (
      <Circle
        key={`sec-${i}`}
        cx={xScale(d.x)}
        cy={yScale(d.y)}
        r={4}
        fill={chartColors.cpPotential}
        stroke={chrome.pointStroke}
        strokeWidth={0.5}
        opacity={0.7}
        onMouseOver={() =>
          showTooltipAtCoords(xScale(d.x), yScale(d.y), {
            x: d.x,
            y: d.y,
            index: i,
            stage: d.stage,
          })
        }
        onMouseLeave={hideTooltip}
      />
    ))}
  </>
)}
```

Note: secondary dot radius changed from 3 to 4 (was too small to see clearly).

- [ ] **Step 5: Update ControlLines.tsx — secondary control line color**

In `packages/charts/src/ichart/ControlLines.tsx`, replace all `operatorColors[1]` references (around lines 400-420) with `chartColors.cpPotential`:

```typescript
// UCL for secondary
stroke={chartColors.cpPotential}
// Mean for secondary
stroke={chartColors.cpPotential}
// LCL for secondary
stroke={chartColors.cpPotential}
```

Import `chartColors` if not already imported, and remove `operatorColors` import if no longer needed in this file.

- [ ] **Step 6: Update the legend in IChart.tsx**

In `packages/charts/src/IChart.tsx` (around lines 345-356), update the legend rendering:

```typescript
{hasSecondary && primaryLabel && secondaryLabel && (
  <g transform={`translate(${width - margin.right - 200}, -12)`}>
    <Circle cx={0} cy={0} r={4} fill={chartColors.mean} />
    <text x={8} y={4} fill={chrome.labelSecondary} fontSize={fonts.tick}>
      {primaryLabel}
    </text>
    <Circle cx={80} cy={0} r={4} fill={chartColors.cpPotential} opacity={0.7} />
    <text x={88} y={4} fill={chrome.labelSecondary} fontSize={fonts.tick}>
      {secondaryLabel}
    </text>
    <line x1={160} y1={-4} x2={160} y2={4} stroke={chrome.labelSecondary} strokeWidth={1.5} opacity={0.5} />
    <text x={168} y={4} fill={chrome.labelMuted} fontSize={fonts.tick}>
      Gap
    </text>
  </g>
)}
```

- [ ] **Step 7: Run all charts tests**

Run: `pnpm --filter @variscout/charts test -- --run`
Expected: All PASS — no regressions.

- [ ] **Step 8: Commit**

```bash
git add packages/charts/src/colors.ts packages/charts/src/ichart/DataPoints.tsx packages/charts/src/ichart/ControlLines.tsx packages/charts/src/IChart.tsx packages/charts/src/__tests__/colors.test.ts
git commit -m "feat: capability I-Chart — purple Cp series with centering gap lines"
```

---

### Task 4: ProcessHealthBar Capability Mode Stats

Show overall Cpk + % subgroups meeting target when capability mode is active.

**Files:**

- Modify: `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`
- Modify: `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx`

- [ ] **Step 1: Write failing test for capability mode stats**

Add to the existing test file `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx`:

```typescript
describe('capability mode', () => {
  const capabilityProps = {
    ...defaultProps, // reuse existing default props from the test file
    stats: { mean: 10.5, stdDev: 0.8, cpk: 1.35, outOfSpecPercentage: 2 },
    specs: { usl: 12, lsl: 9 },
    cpkTarget: 1.33,
    isCapabilityMode: true,
    capabilityStats: { subgroupsMeetingTarget: 17, totalSubgroups: 20 },
  };

  it('shows % subgroups meeting target instead of pass rate', () => {
    const { getByText } = render(<ProcessHealthBar {...capabilityProps} />);
    expect(getByText(/85%/)).toBeInTheDocument();
    expect(getByText(/≥ 1.33/)).toBeInTheDocument();
  });

  it('shows subgroup count instead of sample count', () => {
    const { getByText } = render(<ProcessHealthBar {...capabilityProps} />);
    expect(getByText('20')).toBeInTheDocument(); // n = totalSubgroups
  });

  it('still shows Cpk as primary KPI', () => {
    const { getByText } = render(<ProcessHealthBar {...capabilityProps} />);
    expect(getByText('1.35')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run --reporter=verbose ProcessHealthBar.test`
Expected: FAIL — `isCapabilityMode` prop doesn't exist yet.

- [ ] **Step 3: Add capability mode props and conditional rendering**

In `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`:

Add new props to the interface (around line 44):

```typescript
/** Whether capability mode (Cpk I-Chart) is active */
isCapabilityMode?: boolean;
/** Capability mode stats — subgroup target metrics */
capabilityStats?: {
  subgroupsMeetingTarget: number;
  totalSubgroups: number;
};
```

Add to the destructured props:

```typescript
isCapabilityMode = false,
capabilityStats,
```

Replace the pass rate rendering (around line 189-193) with a conditional:

```typescript
{/* Secondary KPI: Pass Rate or Capability Target % */}
{isCapabilityMode && capabilityStats ? (
  <div className="flex items-center gap-1 text-xs">
    <span className="text-content-secondary">Subgroups</span>
    <span className="font-mono text-content font-medium">
      {Math.round((capabilityStats.subgroupsMeetingTarget / capabilityStats.totalSubgroups) * 100)}%
    </span>
    <span className="text-content-secondary">≥ {cpkTarget}</span>
  </div>
) : hasSpecs ? (
  /* ... existing pass rate rendering ... */
) : null}
```

Replace the sample count display (around line 274) with a conditional:

```typescript
<span className="font-mono text-content">{isCapabilityMode && capabilityStats ? capabilityStats.totalSubgroups : sampleCount}</span>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run --reporter=verbose ProcessHealthBar.test`
Expected: PASS

- [ ] **Step 5: Run all UI tests for regression check**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx
git commit -m "feat: ProcessHealthBar shows subgroup target % in capability mode"
```

---

### Task 5: Capability Boxplot — Y-axis Label + Target Line

Fix boxplot Y-axis label and add Cpk target reference line in capability mode.

**Files:**

- Modify: `packages/charts/src/Boxplot.tsx` (add `targetLine` prop)
- Modify: `packages/charts/src/types.ts` (add `targetLine` to BoxplotProps)
- Modify: `packages/ui/src/components/BoxplotWrapper/index.tsx` (pass capability props)

- [ ] **Step 1: Add targetLine to BoxplotProps type**

In `packages/charts/src/types.ts`, add to `BoxplotProps` interface (after `fillOverrides`):

```typescript
/** Optional horizontal reference line (e.g., Cpk target in capability mode) */
targetLine?: {
  value: number;
  color: string;
  label?: string;
};
```

- [ ] **Step 2: Render target line in Boxplot.tsx**

In `packages/charts/src/Boxplot.tsx`, destructure the new prop:

```typescript
const { /* ...existing props... */ targetLine } = props;
```

Add the target line rendering just before the existing spec lines (around line 185, before the `{specs.usl !== undefined && (` block):

```typescript
{/* Target reference line (e.g., Cpk target) */}
{targetLine && yScale(targetLine.value) >= 0 && yScale(targetLine.value) <= height && (
  <>
    <line
      x1={0}
      x2={width}
      y1={yScale(targetLine.value)}
      y2={yScale(targetLine.value)}
      stroke={targetLine.color}
      strokeWidth={1}
      strokeDasharray="6,3"
      opacity={0.6}
    />
    {targetLine.label && (
      <text
        x={width + 4}
        y={yScale(targetLine.value) + 4}
        fill={targetLine.color}
        fontSize={fonts.tick}
        opacity={0.7}
      >
        {targetLine.label}
      </text>
    )}
  </>
)}
```

- [ ] **Step 3: Wire capability props in BoxplotWrapperBase**

In `packages/ui/src/components/BoxplotWrapper/index.tsx`:

The wrapper already switches data via `capabilityData`. Add `isCapabilityMode` prop:

```typescript
// Add to props interface
isCapabilityMode?: boolean;
cpkTarget?: number;
```

Add to destructured props:

```typescript
isCapabilityMode = false,
cpkTarget,
```

Update the Boxplot rendering to pass Y-axis label and target line:

```typescript
<BoxplotBase
  /* ...existing props... */
  yAxisLabel={isCapabilityMode ? 'Cpk' : (columnAliases[outcome] || outcome)}
  targetLine={isCapabilityMode && cpkTarget !== undefined ? {
    value: cpkTarget,
    color: chartColors.target,
    label: `Target ${cpkTarget}`,
  } : undefined}
/>
```

Import `chartColors` from `@variscout/charts` if not already imported.

- [ ] **Step 4: Run charts and UI tests**

Run: `pnpm --filter @variscout/charts test -- --run && pnpm --filter @variscout/ui test -- --run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/charts/src/Boxplot.tsx packages/charts/src/types.ts packages/ui/src/components/BoxplotWrapper/index.tsx
git commit -m "feat: capability boxplot — Cpk Y-axis label and target reference line"
```

---

### Task 6: Wire Capability Props in App Dashboards

Connect the new capability-mode props from Tasks 4-5 to the PWA and Azure app dashboards.

**Files:**

- Modify: `apps/pwa/src/components/Boxplot.tsx` (or equivalent app boxplot wrapper)
- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/azure/src/components/Boxplot.tsx` (or equivalent)
- Modify: `apps/azure/src/components/Dashboard.tsx`

- [ ] **Step 1: Wire PWA boxplot wrapper**

Find the PWA boxplot component that wraps `BoxplotWrapperBase`. Pass `isCapabilityMode` and `cpkTarget`:

```typescript
<BoxplotWrapperBase
  /* ...existing props... */
  isCapabilityMode={displayOptions.standardIChartMetric === 'capability'}
  cpkTarget={cpkTarget}
/>
```

- [ ] **Step 2: Wire PWA ProcessHealthBar**

In the PWA dashboard, pass capability stats to ProcessHealthBar:

```typescript
const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';

// capabilityIChartData is already computed from useCapabilityIChartData hook
const capabilityStats = isCapabilityMode && capabilityIChartData ? {
  subgroupsMeetingTarget: capabilityIChartData.subgroupsMeetingTarget,
  totalSubgroups: capabilityIChartData.subgroupResults.length,
} : undefined;

<ProcessHealthBar
  /* ...existing props... */
  isCapabilityMode={isCapabilityMode}
  capabilityStats={capabilityStats}
/>
```

- [ ] **Step 3: Wire Azure boxplot wrapper**

Same pattern as PWA — pass `isCapabilityMode` and `cpkTarget` to `BoxplotWrapperBase`.

- [ ] **Step 4: Wire Azure ProcessHealthBar**

Same pattern as PWA — pass `isCapabilityMode` and `capabilityStats`.

- [ ] **Step 5: Build check**

Run: `pnpm build`
Expected: Clean build with no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/ apps/azure/src/
git commit -m "feat: wire capability mode props to PWA and Azure dashboards"
```

---

### Task 7: Update Documentation

Update relevant documentation to reflect the new capability mode behavior.

**Files:**

- Modify: `docs/03-features/analysis/subgroup-capability.md`
- Modify: `docs/06-design-system/charts/capability.md`
- Modify: `docs/03-features/analysis/capability.md`
- Modify: `.claude/rules/charts.md`

- [ ] **Step 1: Update subgroup-capability.md**

Add a section after "Dual Cp/Cpk Series" in `docs/03-features/analysis/subgroup-capability.md`:

```markdown
## Visual Design

### Series Colors

- **Cpk** (primary): Blue solid dots (`#3b82f6`) — actual capability accounting for centering
- **Cp** (secondary): Purple solid dots (`#8b5cf6`, slightly smaller, opacity 0.7) — potential capability
- **Centering gap**: Grey connecting line between each Cpk-Cp pair — length visualizes centering loss

The gap between Cp and Cpk is rendered as a vertical grey line connecting each paired data point. Longer lines indicate greater centering loss — the process has potential capability (Cp) but is off-center, reducing actual capability (Cpk).

### Small Dataset Handling

When a boxplot category has fewer than 7 data points, individual dots are shown instead of a box-and-whisker plot. This applies to all boxplots across all analysis modes, but is especially relevant in capability mode where subgroup counts per factor level are often small.
```

- [ ] **Step 2: Update capability.md**

In `docs/03-features/analysis/capability.md`, add a note in the "Key Metrics" section:

```markdown
### Dashboard Behavior in Capability Mode

When the analyst toggles to Capability mode:

- **I-Chart**: Dual Cpk/Cp series with connecting lines showing centering gap
- **Boxplot**: Shows Cpk distribution per factor with Cpk target reference line. Y-axis labeled "Cpk"
- **Pareto**: Unchanged — shows variation contribution (complements capability boxplot)
- **Process Health Bar**: Shows overall Cpk and % subgroups meeting Cpk target
- **Histogram/Probability Plot**: Unchanged — shows raw measurement distribution as reality check
```

- [ ] **Step 3: Update charts.md rules**

In `.claude/rules/charts.md`, add to the "Color Constants" section:

```markdown
chartColors.cpPotential; // #8b5cf6 - Cp (potential capability) series in capability I-Chart
```

Add a new section after "Violin Mode":

```markdown
## Dot Plot Fallback

All boxplots (`BoxplotBase`, `PerformanceBoxplotBase`) automatically switch from box-and-whisker to jittered dots when a category has fewer than 7 data points (`MIN_BOXPLOT_VALUES`). This is a per-category decision — a single chart can show boxes for some categories and dots for others. The threshold is exported from `@variscout/charts`.
```

Add to the Boxplot table in "Chart Annotations":

```markdown
## Target Reference Line

`BoxplotBase` accepts an optional `targetLine` prop for rendering a horizontal dashed reference line (e.g., Cpk target in capability mode):

| Prop         | Type                                               | Purpose                                   |
| ------------ | -------------------------------------------------- | ----------------------------------------- |
| `targetLine` | `{ value: number; color: string; label?: string }` | Horizontal dashed line at the given value |
```

- [ ] **Step 4: Commit documentation**

```bash
git add docs/03-features/analysis/subgroup-capability.md docs/03-features/analysis/capability.md docs/06-design-system/charts/capability.md .claude/rules/charts.md
git commit -m "docs: update capability mode and boxplot dot fallback documentation"
```

---

### Task 8: Visual Verification

Verify all changes work correctly in the browser.

**Files:** None (read-only verification)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify dot plot fallback**

Open PWA at localhost:5173. Load sample data (coffee or sachets). Drill by a factor that creates categories with few values. Verify:

- Categories with < 7 values show jittered dots
- Categories with ≥ 7 values show standard box-and-whisker
- Dot colors respect highlight/selection

- [ ] **Step 3: Verify capability I-Chart**

Set specification limits (USL + LSL). Toggle to Capability view. Verify:

- Cpk dots are blue, Cp dots are purple
- Grey connecting lines between each pair
- Violations still render red
- Legend shows "Cpk (actual)", "Cp (potential)", "Gap"
- One-sided specs: only Cpk series, no connecting lines

- [ ] **Step 4: Verify ProcessHealthBar**

In capability mode, verify toolbar shows:

- Overall Cpk (same as standard mode)
- "X% ≥ Y" subgroup target metric
- n = subgroup count (not measurement count)

Toggle back to standard mode — verify pass rate and measurement count return.

- [ ] **Step 5: Verify capability boxplot**

In capability mode, verify:

- Y-axis says "Cpk"
- Green dashed target line at Cpk target value
- No spec lines
- Dot fallback for small categories
- No contribution bars

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: All tests pass across all packages.

- [ ] **Step 7: Final commit (if any test fixes needed)**

```bash
git add -A
git commit -m "fix: test adjustments from visual verification"
```
