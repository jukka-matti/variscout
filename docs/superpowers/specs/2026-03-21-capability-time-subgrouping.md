---
title: 'Capability Mode: Time-Based Subgrouping + Journey Integration'
status: draft
---

# Capability Mode: Time-Based Subgrouping + Journey Integration

**Date:** 2026-03-21
**Status:** Planned
**ADR:** ADR-038 (extension)

## Context

Capability mode (ADR-038) is functionally complete for I-Chart analysis with two subgrouping methods: by column and fixed-size. But when data has timestamps (which VariScout already detects and parses), there's no way to subgroup by time intervals — the analyst can't ask "show me Cpk stability per hour/day/week."

This plan adds:

1. **Time-based subgrouping** — a third method alongside column/fixed-size, using detected timestamp columns
2. **Batch Consistency use case update** — mention capability mode
3. **A new use case** specifically for capability mode with subgrouping workflow

### What exists for reuse

- **Time column detection**: `detectColumns()` in `packages/core/src/parser/detection.ts` auto-detects time columns
- **Time parsing**: `parseTimeValue()` in `packages/core/src/time.ts` handles ISO, Excel serial, Unix timestamps
- **Time extraction**: `augmentWithTimeColumns()` creates Year/Month/Week/DayOfWeek/Hour columns
- **Time component detection**: `hasTimeComponent()` distinguishes datetime vs date-only columns
- **Subgroup infrastructure**: `SubgroupConfig`, `groupDataIntoSubgroups()`, `calculateSubgroupCapability()` in `packages/core/src/stats/subgroupCapability.ts`
- **UI pattern**: `SubgroupConfigPopover` in `packages/ui/src/components/SubgroupConfig/index.tsx` — radio + conditional inputs
- **State persistence**: `AnalysisState.subgroupConfig` already persisted; `timeColumn` stored in DataContext

---

## Step 1: Extend SubgroupConfig Type

**File:** `packages/core/src/stats/subgroupCapability.ts`

```typescript
export type SubgroupMethod = 'column' | 'fixed-size' | 'time-interval';

/** Time interval granularity for time-based subgrouping */
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week';

export interface SubgroupConfig {
  method: SubgroupMethod;
  column?: string; // method = 'column'
  size?: number; // method = 'fixed-size'
  timeColumn?: string; // method = 'time-interval'
  granularity?: TimeGranularity; // method = 'time-interval'
  minuteInterval?: number; // method = 'time-interval', granularity = 'minute' (e.g., 5, 10, 15, 30)
}
```

**Design choices:**

- `'minute'` with `minuteInterval` (default 15) — "every 5 min", "every 15 min", "every 30 min"
- `'hour'` — calendar hours
- `'day'` — calendar days
- `'week'` — ISO weeks
- No `'month'` — too coarse for typical process data (subgroups would be huge)
- No `'second'` — too fine for capability analysis (subgroups would be too small)

---

## Step 2: Implement Time-Based Grouping

**File:** `packages/core/src/stats/subgroupCapability.ts`

Add `groupByTimeInterval()` alongside existing `groupByColumn()` and `groupByFixedSize()`:

```typescript
import { parseTimeValue } from '../time';

function groupByTimeInterval(
  rows: DataRow[],
  outcome: string,
  timeColumn: string,
  granularity: TimeGranularity,
  minuteInterval: number = 15
): SubgroupData[] {
  const groups = new Map<string, { values: number[]; rows: DataRow[] }>();

  for (const row of rows) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const date = parseTimeValue(row[timeColumn]);
    if (!date) continue;

    const key = formatTimeBucket(date, granularity, minuteInterval);
    let group = groups.get(key);
    if (!group) {
      group = { values: [], rows: [] };
      groups.set(key, group);
    }
    group.values.push(val);
    group.rows.push(row);
  }

  const result: SubgroupData[] = [];
  for (const [label, group] of groups) {
    result.push({ values: group.values, label, rows: group.rows });
  }
  return result;
}
```

**Bucket formatting** (`formatTimeBucket`):

| Granularity   | Example Label    | Bucket Logic                                               |
| ------------- | ---------------- | ---------------------------------------------------------- |
| `minute` (15) | `"Jan 15 14:15"` | Floor to interval: `Math.floor(min / interval) * interval` |
| `hour`        | `"Jan 15 14:00"` | Truncate to hour                                           |
| `day`         | `"Jan 15"`       | Truncate to date                                           |
| `week`        | `"W03 2025"`     | ISO week number                                            |

Update `groupDataIntoSubgroups()`:

```typescript
if (config.method === 'time-interval' && config.timeColumn && config.granularity) {
  return groupByTimeInterval(
    rows,
    outcome,
    config.timeColumn,
    config.granularity,
    config.minuteInterval
  );
}
```

---

## Step 3: Update SubgroupConfigPopover UI

**File:** `packages/ui/src/components/SubgroupConfig/index.tsx`

Add new props:

```typescript
/** Time column name (enables time-based option when truthy) */
timeColumn?: string | null;
/** Whether the time column has time-of-day component (enables minute/hour options) */
hasTimeOfDay?: boolean;
```

Add third radio option (only shown when `timeColumn` is truthy):

```
○ Fixed size        [n = 5]
○ By column         [dropdown]
○ By time interval  [Hourly ▼]    ← NEW (only shown when timeColumn detected)
```

When "By time interval" is selected, show a dropdown with preset options.

**Smart option filtering using `hasTimeComponent()`** (already exists in `@variscout/core`):

- If `hasTimeOfDay` is **true** (timestamps have hours/minutes): show all 6 options
- If **false** (date-only data): show only Daily and Weekly (minute/hour make no sense)

| Label        | granularity | minuteInterval | Requires time component |
| ------------ | ----------- | -------------- | ----------------------- |
| Every 5 min  | `'minute'`  | 5              | Yes                     |
| Every 15 min | `'minute'`  | 15             | Yes                     |
| Every 30 min | `'minute'`  | 30             | Yes                     |
| Hourly       | `'hour'`    | —              | Yes                     |
| Daily        | `'day'`     | —              | No                      |
| Weekly       | `'week'`    | —              | No                      |

---

## Step 4: Wire timeColumn Through to SubgroupConfigPopover

**Files:** App Dashboard components where `SubgroupConfigPopover` is rendered.

Both apps already have `timeColumn` in DataContext. Pass it to the popover:

```typescript
<SubgroupConfigPopover
  config={subgroupConfig}
  onConfigChange={setSubgroupConfig}
  availableColumns={factors}
  columnAliases={columnAliases}
  timeColumn={timeColumn}      // ← NEW
  hasTimeOfDay={hasTimeComponent(filteredData, timeColumn)}  // ← NEW
/>
```

When `timeColumn` is null/undefined, the time-interval radio is hidden — same behavior as "By column" when no columns available.

---

## Step 5: Update useCapabilityIChartData Hook

**File:** `packages/hooks/src/useCapabilityIChartData.ts`

No changes needed — the hook already calls `groupDataIntoSubgroups(filteredData, outcome, subgroupConfig)`. The new method just produces different `SubgroupData[]` from the same interface.

The memoization deps already include `subgroupConfig`, so config changes trigger recomputation.

---

## Step 6: Unit Tests

**File:** `packages/core/src/stats/__tests__/subgroupCapability.test.ts`

Add test suite for time-based grouping:

- Groups by hour buckets correctly
- Groups by day buckets correctly
- Groups by week buckets correctly
- Groups by minute intervals (5, 15, 30)
- Skips rows with missing/null time values
- Skips rows with unparseable time strings
- Preserves chronological order of buckets
- Handles single-row subgroups (capability = undefined)
- Handles mixed timezones gracefully (uses local time)

---

## Step 7: Update Batch Consistency Use Case

**File:** `docs/02-journeys/use-cases/batch-consistency.md`

Add a brief mention after step 7 (Capability):

> **7b. Capability Mode** — Switch I-Chart to "Capability" view. Group by Batch ID to see Cpk per batch on the I-Chart. Three batches are below Cpk 1.0 — all are Vessel 2 + Supplier B. The capability chart proves the problem isn't just variation but inconsistent capability batch-to-batch.

---

## Step 8: New Use Case — Capability Stability Over Time

**File:** `docs/02-journeys/use-cases/capability-stability.md` (NEW)

A new use case specifically about an analyst using capability mode with time-based subgrouping to verify whether process capability is stable across time intervals.

**Scenario:** A Quality Engineer monitors a CNC machining process. Overall Cpk is 1.45 — looks good. But customer complaints arrive sporadically. The engineer suspects capability shifts during the day (thermal drift, tool wear).

**Journey:**

1. Paste measurement data with timestamps
2. I-Chart shows stable values (all within control limits) — standard view hides the problem
3. Switch to **Capability Mode** → subgroup by **Hour** using timestamp
4. Cpk per hour shows: morning Cpk > 1.6, afternoon Cpk drops to 0.9
5. The gap between Cp and Cpk grows in afternoon → centering drifts, not spread
6. CoScout explains: "Capability is shifting — afternoon subgroups show centering loss"
7. Drill into worst-hour subgroup → Boxplot by Operator reveals thermal compensation skipped
8. Finding: "Afternoon shift skips thermal offset recalibration after lunch break"

**Aha moment:** "Cpk 1.45 overall hid that half our production runs at Cpk 0.9. The hourly capability chart caught it in seconds."

Add to `docs/02-journeys/use-cases/index.md` in the appropriate table.

---

## Files to Modify

| #                  | File                                                           | Change                                                                                                   |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Core (feature)** |                                                                |                                                                                                          |
| 1                  | `packages/core/src/stats/subgroupCapability.ts`                | Extend `SubgroupMethod`, add `TimeGranularity`, implement `groupByTimeInterval()` + `formatTimeBucket()` |
| 2                  | `packages/core/src/stats/__tests__/subgroupCapability.test.ts` | Add time-based grouping tests (~10 tests)                                                                |
| **UI**             |                                                                |                                                                                                          |
| 3                  | `packages/ui/src/components/SubgroupConfig/index.tsx`          | Add `timeColumn` + `hasTimeOfDay` props, third radio option with granularity dropdown                    |
| **App wiring**     |                                                                |                                                                                                          |
| 4                  | `apps/azure/src/components/Dashboard.tsx`                      | Pass `timeColumn` + `hasTimeOfDay` to `SubgroupConfigPopover`                                            |
| 5                  | `apps/pwa/src/components/Dashboard.tsx`                        | Pass `timeColumn` + `hasTimeOfDay` to `SubgroupConfigPopover`                                            |
| **Documentation**  |                                                                |                                                                                                          |
| 6                  | `docs/02-journeys/use-cases/batch-consistency.md`              | Add capability mode step (7b)                                                                            |
| 7                  | `docs/02-journeys/use-cases/capability-stability.md`           | **New**: time-based capability stability use case                                                        |
| 8                  | `docs/02-journeys/use-cases/index.md`                          | Add capability-stability entry                                                                           |
| 9                  | `docs/03-features/analysis/subgroup-capability.md`             | Add "By Time Interval" method to config section                                                          |
| 10                 | `docs/07-decisions/adr-038-subgroup-capability.md`             | Update with time-based method addition                                                                   |

---

## Verification

1. `pnpm --filter @variscout/core test` — all tests pass including new time-based grouping tests
2. `pnpm --filter @variscout/hooks test` — capability hook tests still pass
3. `pnpm build` — all packages build
4. Manual: load data with timestamps → toggle Capability → open subgroup config → select "By time interval" → verify hourly/daily/weekly grouping produces dual Cp/Cpk series on I-Chart
5. Manual: verify time-interval radio is hidden when data has no time column
6. Manual: verify minute/hour options hidden when data has date-only timestamps
