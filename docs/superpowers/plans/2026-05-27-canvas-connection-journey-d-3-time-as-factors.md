---
tier: ephemeral
purpose: build
title: PR-CCJ-D3 — Time-as-factors workflow + time decomposition engine (single PR, 3 phases)
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-D3 — Time-as-factors workflow + time decomposition engine (single PR, 3 phases)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Ship the `⏰ Use as time factors…` workflow — per-date-chip kebab + system-hint banner entry points → two-step modal (pick column + pick dimensions) → categorical derived chips in palette under `DERIVED FROM TIME-DECOMPOSITION`.

**Architecture:** Single PR with three internal phases. Phase 1 extends `@variscout/core/time.ts` with Quarter extraction + adds `packages/core/src/derived/timeDecomposition.ts` (computeTimeDecompositionColumns) + `detectTimeColumns.ts` heuristic. Phase 2 builds `<TimeAsFactorsModal>` under `Canvas/EditMode/Workflows/` (two-step: column radio → dimension checkboxes + Hour granularity sub-picker + live preview, with pre-fill on re-open). Phase 3 wires per-chip kebab dispatch + CanvasWorkspace time-decomposition derivation (mirroring D1+D2 `derived*Profiles` pattern) + new `categoricalValuesByColumn` channel.

**Tech Stack:** TypeScript, React, Tailwind, Vitest, `focus-trap-react` (reused from D1+D2). No external date library — `packages/core/src/time.ts` already has every primitive (parseTimeValue, extractTimeComponents, getISOWeekNumber, formatTimeBucket).

---

## Context

Phase D2 shipped on main at `ed9aa671` (PR #226, 14 commits) on 2026-05-27. The canvas Edit mode now has step timings (D1) → Lead_time/Total_work_time/Wait_time and calculated columns (D2) → Yield_pct/DPMO/Throughput/Difference. D2 deliberately left the **`derived-time-decomposition` palette bucket** scaffolded for D3 to fill in.

**D1 + D2 ALREADY built every piece of D3's plumbing — D3 is the lightest of the D-series:**

- `ColumnParsingProfile.derivationSource` union already includes `'time-decomposition'` (`packages/core/src/parser/types.ts:152`) — no schema change
- `Palette` `GroupKey` already has `'derived-time-decomposition'` + `GROUP_ORDER` entry with label `DERIVED FROM TIME-DECOMPOSITION` (`packages/ui/src/components/Canvas/EditMode/Palette/index.tsx:41-59`) — no palette change
- `bucketFor()` already dispatches `derivationSource === 'time-decomposition'` → the right bucket
- `SystemHintBanner` already supports `kind: 'time'` with cyan-50 palette + 💡 icon (`packages/ui/src/components/Canvas/EditMode/Palette/SystemHintBanner.tsx`) — no banner change
- `columnChipMenuItems.ts` already defines the menu item ID **`'use-as-time-factors'`** on DATE columns — D3 just needs the dispatch handler
- `<CanvasWorkspace>` synthesis pattern (`derivedTimingsProfiles` + `derivedFormulaProfiles` + `numericValuesByColumn` merge at lines 564-666) is copy-paste-ready for `derivedTimeDecompositionProfiles`

**D3 introduces ONE genuinely new architectural concept**: derived **categorical** columns (string values like "Mon", "W03", "Q1") versus D1+D2's numeric derivations. This requires a parallel `categoricalValuesByColumn: Record<string, (string | null)[]>` channel alongside the existing `numericValuesByColumn`. For V1, this channel is metadata-only — downstream Analyze/Explore integration wires up incrementally in F1/H1.

**D3's user-visible value:** A `⏰ Use as time factors…` item on any **date** chip's `⋮` menu (and a `💡 N time columns detected. Use time as factors →` system-hint banner at top of palette when ≥1 date column detected) opens a **TimeAsFactors modal**. Step 1 = pick a date column (radio across detected). Step 2 = pick dimensions (6 checkboxes: Year · Quarter · Month · Week · Day-of-week · Hour, with Hour having an inline granularity sub-picker: 60min/30min/15min/5min). Saving produces N new derived chips under `DERIVED FROM TIME-DECOMPOSITION` (green tint + ✨), each independently draggable as a categorical factor.

**Spec sections consumed:**

- §3.1.2 (per-chip context menu — `📅 Use as timestamp / ⏰ Use as time factors / 🔍 View distribution in Explore →` for date columns)
- §3.4 (derived chips — `DERIVED FROM ...` section convention; example chips `Date.week`, `Date.day-of-week`, `Date.hour`)
- §4.1 (system hint `💡 6 time columns detected. Use time as factors →`)
- §4.3.3 (Time-as-factors workflow — two-step modal: pick column + pick dimensions {Week · Day of week · Hour · Month · Year · Quarter})

**Master plan parent:** `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` — Phase D §"PR-CCJ-D3 · Time-as-factors workflow + time decomposition engine" (3-4 days, "Sub-plan needed: YES"). Master plan files spec:

- Create `packages/ui/src/components/Canvas/EditMode/Workflows/TimeAsFactorsModal.tsx`
- Create `packages/core/src/derived/timeDecomposition.ts`
- Tests

**Existing primitives ready to reuse (no rework needed):**

- `packages/core/src/time.ts` — **already has every date-math primitive D3 needs:**
  - `parseTimeValue(value): Date | null` — handles ISO strings, Excel serial dates (1-100000), Unix seconds, Unix ms (lines 75-115)
  - `extractTimeComponents(date, config): TimeComponents` — returns formatted strings (`"2025"`, `"Jan"`, `"W03"`, `"Mon"`, `"14:00"`) for {year, month, week, dayOfWeek, hour} per config flags (lines 161-192)
  - `getISOWeekNumber(date): number` — ISO 8601 week number
  - `formatTimeBucket(date, granularity, minuteInterval): string` — minute-level bucketing
  - **No external date library** (no `date-fns` / `dayjs` / `luxon` in `packages/core/package.json` deps)
  - **Missing only Quarter** — 3-line addition to extract from month
- `<ColumnChipContextMenu>` + `getMenuItemsForKind` — kebab menu wired, `'use-as-time-factors'` item exists; D3 just wires the dispatch
- `<Palette>` `GROUP_ORDER` derived slot + `bucketFor` dispatch — supports `time-decomposition` generically
- `<ColumnChip>` `derived?: boolean` + `✨` + `bg-emerald-50` — kind-agnostic; renders categorical-derived chips correctly via existing categorical render path
- FocusTrap modal pattern from `<CalculatedColumnModal>` (D2) and `<StepTimingsModal>` (D1) — mirror tab/step layout
- `<CanvasWorkspace>` derived synthesis pattern (derivedTimingsProfiles useMemo + derivedFormulaProfiles useMemo + merge into editModeProfiles)
- `<SystemHintBanner>` `kind: 'time'` cyan variant
- `ParsingInterpretation.kind === 'date'` — existing parser kind already marks date columns

**What MUST be built (no equivalent exists):**

- `packages/core/src/derived/types.ts` — extend with `TimeDimension` + `TimeDecompositionBinding` (alongside existing `StepTimingBinding`)
- `packages/core/src/derived/timeDecomposition.ts` — `computeTimeDecompositionColumns(rows, binding) => Record<string, (string | null)[]>` (one entry per selected dimension, keyed by derived column name; null for unparseable values)
- `packages/core/src/derived/detectTimeColumns.ts` — heuristic on `ColumnParsingProfile[]`: filter to `primary.kind === 'date'`; return `{ count: number; columns: string[] } | null` (null when count=0)
- `packages/core/src/time.ts` — add `extractQuarter(date): string` returning `"Q1"|"Q2"|"Q3"|"Q4"`; extend `TimeComponents` type + `extractTimeComponents` config to support it
- `packages/ui/src/components/Canvas/EditMode/Workflows/TimeAsFactorsModal.tsx` — FocusTrap shell, two-step modal (Step 1 column radio, Step 2 dimensions checkboxes + Hour granularity sub-picker), live preview, step navigation, empty state
- `packages/ui/src/test-utils/timeDecompositionBinding.ts` — `createTestTimeDecompositionBinding()` factory (mirror `createTestFormulaBinding`)
- Wire `'use-as-time-factors'` dispatch in CanvasWorkspace (mirror D2's `'calculate-from'`)
- Wire `categoricalValuesByColumn` parallel channel in CanvasWorkspace (new contract)
- Wire detectTimeColumns hint banner into systemHints array

**No persistence in D3.** `timeDecompositionBindings: TimeDecompositionBinding[]` lives as local state in `<CanvasWorkspace>` next to `stepTimings` (D1) and `formulaBindings` (D2), all behind the same `TODO(PR-CCJ-E1)` marker — E1 (Charter modal) folds the three lists into the IP blob in one move.

---

## Approach

Single PR with **three internal phases** (mirroring D1's and D2's collapsed model):

```
Phase 1: Engine in @variscout/core (types + Quarter + computeTimeDecompositionColumns + detectTimeColumns)  (tasks 1–3)
Phase 2: TimeAsFactorsModal under Canvas/EditMode/Workflows/                                                  (tasks 4–5)
Phase 3: SystemHintBanner wiring + kebab dispatch + CanvasWorkspace integration + e2e                          (tasks 6–8)
```

Subagent-driven. Sonnet implementer + Sonnet 2-stage review per task. **Opus implementer** for Task 8 only (CanvasWorkspace integration introduces the new `categoricalValuesByColumn` channel contract and multi-file integration with round-trip pre-fill UX). **Opus final branch reviewer** over all 8 commits.

**Why single PR over master-of-master:** Engine + integration phases are structurally similar to D1 (PR #225, 14 commits) and D2 (PR #226, 14 commits); both shipped as single-PR with internal phases successfully. D3's scope is genuinely smaller (no template registry, no slot UX, no fly-in animation) so 8 tasks vs D2's 11 is the natural compression. **Mid-execution carve clause:** if T8's categorical-channel design surfaces unexpected downstream coupling, the natural split is Phase 2 → Phase 3 boundary — modal+engine PR lands first, channel-wiring follows as D3.2. Orchestrator can split without redrafting.

This plan produces **one plan-doc artifact** at `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-3-time-as-factors.md`. The parent master plan gets a one-line amendment under Phase D's D3 entry.

---

## Interaction Decisions (resolved 2026-05-27 before planning)

1. **Derived column naming = dot+kebab per spec.** `${sourceColumn}.year`, `${sourceColumn}.quarter`, `${sourceColumn}.month`, `${sourceColumn}.week`, `${sourceColumn}.day-of-week`, `${sourceColumn}.hour`. When hour granularity ≠ 60 min: `${sourceColumn}.hour-${minutes}min` (e.g., `Order_Date.hour-15min`). Spec §3.4 + §4.3.3 example wording is verbatim `Date.week`, `Date.day-of-week`. **T8 audits** consumers that might split column names on `.` (TooltipUtilizer, drag-DTO encoder, query builders).

2. **Six dimensions in V1 + Hour granularity sub-picker.** Year, Quarter, Month, Week, Day-of-week, Hour. Hour has an inline granularity dropdown (60/30/15/5 min, default 60) — selecting any granularity ≠ 60 changes the derived column name suffix (see #1 above). No separate "Hour-bucket" dimension; the granularity IS the bucket size.

3. **Re-open UX = pre-fill** (Notion / Figma / Linear standard). When user opens the modal for a date column that already has a `TimeDecompositionBinding`, Step 1 is skipped (column implied) and Step 2 opens with previously-saved dimensions pre-checked + previous granularity restored. Saving REPLACES the existing binding for that sourceColumn (dedupe by `binding.sourceColumn`). This is a small UX upgrade over D2's create-only modal and matches the user's "best practice from UX pov" answer.

4. **Output values = categorical strings, not numbers.** "Mon" / "W03" / "Jan" / "Q1" / "14:00" / "2025". Reasons:
   - Spec language ("factors") implies grouping variable
   - VariScout's downstream Pareto/boxplot/categorical analysis handles strings natively
   - Avoids ambiguity (is Hour=14 a number or a label? as a label it's unambiguous)
   - Year is technically integer-coercible but ship as string for consistency
   - Ordinal preservation (Mon<Tue<Wed) is a V2 concern; ordinal-categorical chip kind doesn't exist yet

5. **Categorical values channel is NEW.** `categoricalValuesByColumn: Record<string, (string | null)[]>` exposed from CanvasWorkspace alongside `numericValuesByColumn`. For D3 V1, this is metadata-only — the channel exists, downstream Analyze/Explore consumers wire up incrementally. The chip RENDERS via `editModeProfiles` (which D3 populates) and is DRAGGABLE via the existing chip drag system. Downstream value-resolution at drop targets is deferred.

6. **Quarter computation = `Math.floor(month / 3) + 1`** (where month is 0-indexed JS Date.getMonth()), returning `"Q1"|"Q2"|"Q3"|"Q4"`. Added to `extractTimeComponents` as `extractQuarter: boolean` config flag returning `quarter?: string`.

7. **`detectTimeColumns` heuristic = count `primary.kind === 'date'` profiles.** Returns `{ count, columns: string[] } | null` (null when count=0). Banner text uses actual count: `"💡 1 time column detected"` / `"💡 6 time columns detected"`. Singular/plural handled.

8. **Banner CTA opens modal at Step 1** (column radio shown, even if only 1 column). Kebab item `⏰ Use as time factors` opens modal at Step 2 (sourceColumn pre-set from chip). If kebab is used on a column that already has a binding, Step 2 pre-fills with that binding.

9. **Empty state in Step 1 (no date columns detected):** "No time columns detected. Open a column's `⚙ Parsing & format` menu to mark a column as a date." (Mirrors D2's "no numeric columns" copy.)

10. **Save validation:** Save disabled if (a) no source column picked (Step 1 incomplete) OR (b) no dimensions checked (Step 2 incomplete). Empty binding can't be saved.

11. **NaN/null propagation:** rows with unparseable dates yield `null` (not `NaN`) per categorical convention. `parseTimeValue() → null` propagates to all dimension outputs for that row.

---

## TDD task list (8 tasks total)

### Phase 1 — Engine: types + Quarter + computeTimeDecompositionColumns + detectTimeColumns

#### Task 1 — Worktree + Quarter extraction + `TimeDecompositionBinding` types (Sonnet implementer)

- Branch `feat/wedge-v1-ccj-d-3-time-as-factors` off `main` in `.worktrees/feat/wedge-v1-ccj-d-3-time-as-factors/`
- Extend `packages/core/src/time.ts`:
  - Add type extension: `interface TimeComponents { ...existing; quarter?: string; }`
  - Add config flag: `interface TimeComponentsConfig { ...existing; extractQuarter?: boolean; }`
  - Inside `extractTimeComponents()`: when `config.extractQuarter` true, compute `const q = Math.floor(date.getMonth() / 3) + 1; result.quarter = \`Q${q}\`;`
- Extend `packages/core/src/derived/types.ts`:

  ```typescript
  export type TimeDimension = 'year' | 'quarter' | 'month' | 'week' | 'dayOfWeek' | 'hour';
  export type HourGranularityMinutes = 60 | 30 | 15 | 5;

  export interface TimeDecompositionBinding {
    id: string;
    sourceColumn: string;
    dimensions: TimeDimension[];
    hourGranularityMinutes?: HourGranularityMinutes; // meaningful only when 'hour' in dimensions; default 60
  }
  ```

- Failing tests in `packages/core/src/__tests__/time.test.ts` (extend existing file):
  - `extractTimeComponents(new Date('2025-01-15'), { extractQuarter: true }).quarter === 'Q1'`
  - `extractTimeComponents(new Date('2025-04-15'), { extractQuarter: true }).quarter === 'Q2'`
  - `extractTimeComponents(new Date('2025-07-15'), { extractQuarter: true }).quarter === 'Q3'`
  - `extractTimeComponents(new Date('2025-10-15'), { extractQuarter: true }).quarter === 'Q4'`
  - `extractTimeComponents(new Date('2025-12-31'), { extractQuarter: true }).quarter === 'Q4'`
  - Boundary: `new Date('2025-03-31')` → Q1; `new Date('2025-04-01')` → Q2
  - `quarter` absent when `extractQuarter: false` or undefined
- Wire types into `packages/core/src/derived/index.ts` barrel + `packages/core/src/index.ts`
- Commit: `feat(wedge-v1): D3 task 1 — Quarter extraction + TimeDecompositionBinding types`

#### Task 2 — `computeTimeDecompositionColumns` engine (Sonnet implementer)

- Create `packages/core/src/derived/timeDecomposition.ts`:

  ```typescript
  import { parseTimeValue, extractTimeComponents, formatTimeBucket } from '../time';
  import type { TimeDecompositionBinding, TimeDimension, HourGranularityMinutes } from './types';

  function derivedColumnName(
    source: string,
    dim: TimeDimension,
    granularity?: HourGranularityMinutes
  ): string {
    switch (dim) {
      case 'year':
        return `${source}.year`;
      case 'quarter':
        return `${source}.quarter`;
      case 'month':
        return `${source}.month`;
      case 'week':
        return `${source}.week`;
      case 'dayOfWeek':
        return `${source}.day-of-week`;
      case 'hour':
        return granularity && granularity !== 60
          ? `${source}.hour-${granularity}min`
          : `${source}.hour`;
    }
  }

  export function computeTimeDecompositionColumns(
    rows: Record<string, unknown>[],
    binding: TimeDecompositionBinding
  ): Record<string, (string | null)[]> {
    const out: Record<string, (string | null)[]> = {};
    const granularity = binding.hourGranularityMinutes ?? 60;
    for (const dim of binding.dimensions) {
      out[derivedColumnName(binding.sourceColumn, dim, granularity)] = [];
    }
    for (const row of rows) {
      const raw = row[binding.sourceColumn];
      const date = parseTimeValue(raw);
      if (!date) {
        for (const dim of binding.dimensions) {
          out[derivedColumnName(binding.sourceColumn, dim, granularity)].push(null);
        }
        continue;
      }
      const components = extractTimeComponents(date, {
        extractYear: binding.dimensions.includes('year'),
        extractQuarter: binding.dimensions.includes('quarter'),
        extractMonth: binding.dimensions.includes('month'),
        extractWeek: binding.dimensions.includes('week'),
        extractDayOfWeek: binding.dimensions.includes('dayOfWeek'),
        extractHour: binding.dimensions.includes('hour') && granularity === 60,
      });
      for (const dim of binding.dimensions) {
        const key = derivedColumnName(binding.sourceColumn, dim, granularity);
        if (dim === 'year') out[key].push(components.year ?? null);
        else if (dim === 'quarter') out[key].push(components.quarter ?? null);
        else if (dim === 'month') out[key].push(components.month ?? null);
        else if (dim === 'week') out[key].push(components.week ?? null);
        else if (dim === 'dayOfWeek') out[key].push(components.dayOfWeek ?? null);
        else if (dim === 'hour') {
          if (granularity === 60) out[key].push(components.hour ?? null);
          else out[key].push(formatTimeBucket(date, 'minute', granularity));
        }
      }
    }
    return out;
  }

  export { derivedColumnName as derivedTimeColumnName };
  ```

- Failing tests in `packages/core/src/derived/__tests__/timeDecomposition.test.ts`:
  - Empty rows → empty object per key, but keys still present per binding.dimensions
  - 3 rows of ISO dates `['2025-01-15', '2025-04-20', '2025-12-31']`, binding `{ sourceColumn: 'Date', dimensions: ['year', 'quarter', 'dayOfWeek'] }` → keys `Date.year`, `Date.quarter`, `Date.day-of-week` each with 3 strings
  - Unparseable date `'banana'` → all dimension outputs `null` for that row
  - Mixed: row 0 ISO, row 1 unparseable, row 2 ISO → `[ok, null, ok]` per column
  - Hour granularity = 60 → column name `Date.hour`, value `"14:00"` for `'2025-01-15T14:30:00'`
  - Hour granularity = 15 → column name `Date.hour-15min`, value `"14:30"` (15-min bucket)
  - Hour granularity = 5 → column name `Date.hour-5min`, value `"14:30"` (5-min bucket)
  - Missing source column entirely (row has no `Date` key) → null for all dimensions
  - Excel serial date as number → parses correctly via parseTimeValue
  - Unix epoch ms as number → parses correctly
  - Returned object has exactly N keys where N = binding.dimensions.length
- Wire into barrel `packages/core/src/derived/index.ts`
- Commit: `feat(wedge-v1): D3 task 2 — computeTimeDecompositionColumns engine`

#### Task 3 — `detectTimeColumns` heuristic (Sonnet implementer)

- Create `packages/core/src/derived/detectTimeColumns.ts`:

  ```typescript
  import type { ColumnParsingProfile } from '../parser/types';

  export interface DetectTimeColumnsResult {
    count: number;
    columns: string[];
  }

  export function detectTimeColumns(
    profiles: ColumnParsingProfile[]
  ): DetectTimeColumnsResult | null {
    const dateCols = profiles
      .filter(p => p.primary?.kind === 'date' && p.status === 'ok')
      .map(p => p.columnName);
    if (dateCols.length === 0) return null;
    return { count: dateCols.length, columns: dateCols };
  }
  ```

- Failing tests in `packages/core/src/derived/__tests__/detectTimeColumns.test.ts`:
  - Empty profiles array → `null`
  - Only numeric profiles → `null`
  - Single date profile → `{ count: 1, columns: ['Date'] }`
  - Three date profiles + two numeric → `{ count: 3, columns: [...] }` (date-only)
  - Profile with `primary.kind === 'date'` but `status !== 'ok'` → excluded
  - Profile with `primary` undefined → excluded
  - Preserves column order from input array
- Wire into barrel; commit: `feat(wedge-v1): D3 task 3 — detectTimeColumns heuristic`

### Phase 2 — `TimeAsFactorsModal` under `Canvas/EditMode/Workflows/`

#### Task 4 — Modal skeleton + Step 1 column radio + empty state (Sonnet implementer)

- Failing tests in `packages/ui/src/components/Canvas/EditMode/Workflows/__tests__/TimeAsFactorsModal.test.tsx`:
  - Renders inside `FocusTrap`, `role="dialog"`, `aria-labelledby="time-factors-modal-title"`
  - Header copy: "Use time as factors"
  - Escape + backdrop click both call `onClose`
  - Step indicator: "Step 1 of 2" / "Step 2 of 2"
  - **Step 1 default** when modal opened without `sourceColumn` prop or with `sourceColumn` not in time columns
  - Step 1: subheader "Pick a time column"; radio group across detected time columns; "Next →" button (disabled until a column is picked)
  - Click "Next →" → advances to Step 2 (subheader changes, `aria-current` updates)
  - **Empty state** when `timeColumns.length === 0`: copy "No time columns detected. Open a column's `⚙ Parsing & format` menu to mark a column as a date." + close button only (no Next)
  - Modal accepts props: `{ sourceColumn?: string; timeColumns: string[]; existingBinding?: TimeDecompositionBinding; rows: Record<string, unknown>[]; onSave: (binding: TimeDecompositionBinding) => void; onClose: () => void }`
  - When `sourceColumn` prop provided AND in `timeColumns` AND `existingBinding == null` → Step 1 SKIPPED, modal opens at Step 2 with source pre-set
  - When `existingBinding` provided → opens at Step 2 with sourceColumn locked + dimensions pre-checked (covered in T5 details; here we test the start-at-Step-2 behavior)
- Mirror CalculatedColumnModal's FocusTrap shell + tab pattern; reuse styling tokens
- Create `packages/ui/src/test-utils/timeDecompositionBinding.ts` factory:
  ```typescript
  export function createTestTimeDecompositionBinding(
    overrides: Partial<TimeDecompositionBinding> = {}
  ): TimeDecompositionBinding {
    return {
      id: overrides.id ?? 'test-tdb-1',
      sourceColumn: overrides.sourceColumn ?? 'Date',
      dimensions: overrides.dimensions ?? ['year', 'month'],
      hourGranularityMinutes: overrides.hourGranularityMinutes,
    };
  }
  ```
- Commit: `feat(wedge-v1): D3 task 4 — TimeAsFactorsModal skeleton + Step 1 column radio + empty state`

#### Task 5 — Step 2 dimensions checkboxes + Hour granularity sub-picker + save footer + live preview (Sonnet implementer)

- Failing tests:
  - **Step 2** renders 6 checkboxes in this order: Year, Quarter, Month, Week, Day of week, Hour
  - Each checkbox has `aria-label` matching the dimension name + a one-line description (e.g., Year: "Calendar year — 2025")
  - **Hour granularity sub-picker** renders inline next to Hour checkbox: dropdown with options "60 min (hourly)", "30 min", "15 min", "5 min"; default "60 min"
  - Sub-picker only enabled when Hour checkbox is checked (disabled with `aria-disabled` + tooltip "Check Hour to enable granularity")
  - Save button disabled when NO dimensions checked
  - Save button label: `Save · "${name}" →` where name = `"${sourceColumn} factors (${dimensionCount})"` (e.g., `Save · "Date factors (3)" →`)
  - **"← Back" button** in Step 2 returns to Step 1 (only shown if user did not open via sourceColumn prop or existingBinding)
  - **Pre-fill from existingBinding**: when modal opened with `existingBinding != null`, sourceColumn from existingBinding is locked + all dimensions in `existingBinding.dimensions` pre-checked + `hourGranularityMinutes` restored to sub-picker
  - **Live preview** (visible when ≥1 dimension checked):
    - Header: "Sample (first row):"
    - For first row of `rows` with parseable source value: render each picked dimension's output, e.g., `Year: 2025 · Quarter: Q1 · Month: Jan · Day of week: Wed · Hour: 14:00`
    - For unparseable first row: "Sample row's date couldn't be parsed."
    - For 0 rows: hide preview entirely
  - Save calls `onSave` with `TimeDecompositionBinding` matching state; includes `hourGranularityMinutes` only when Hour is in dimensions
  - Cancel button calls `onClose` (no onSave)
- Implementation note: state shape `{ pickedSource: string | null; dimensions: Set<TimeDimension>; hourGranularityMinutes: HourGranularityMinutes; }` — Set for O(1) toggle
- Live preview calls `computeTimeDecompositionColumns([rows[0]], currentBinding)` and renders the first-row values inline
- Commit: `feat(wedge-v1): D3 task 5 — Step 2 dimensions + Hour granularity + save footer + live preview`

### Phase 3 — SystemHintBanner + kebab dispatch + CanvasWorkspace integration

#### Task 6 — Time-columns SystemHintBanner wiring (Sonnet implementer)

- Failing tests for Palette integration in `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/Palette.test.tsx`:
  - When `systemHints` prop includes `{ id: 'time-detected', kind: 'time', message: '6 time columns detected. Use time as factors →', ctaLabel: 'Use time as factors', onCta }` → banner renders with cyan-50 background + 💡 icon (existing primitive; this just verifies wire-through)
  - Banner CTA button calls `onCta`
  - Banner shows before chip groups
- No new component code — `SystemHintBanner` already supports `kind: 'time'` (D2 left it in place). T6 is purely the integration test + ensuring CanvasWorkspace's hint-array synthesis (T8) lights up correctly.
- This task may be MERGED into T8 if implementer flags it as too thin. Plan retains T6 as a checkpoint for the Sonnet implementer to verify banner wiring before T8's larger integration.
- Commit: `feat(wedge-v1): D3 task 6 — verify SystemHintBanner time-kind wiring + Palette pass-through`

#### Task 7 — Per-chip kebab `use-as-time-factors` dispatch + CanvasWorkspace modal state (Sonnet implementer)

- Failing tests in CanvasWorkspace test suite:
  - Clicking ⋮ on a **date** chip → menu opens with `use-as-time-factors` item enabled
  - Clicking `use-as-time-factors` item → TimeAsFactorsModal opens with `sourceColumn` set to the chip's column name
  - When the chip's column already has a `TimeDecompositionBinding` → modal opens at Step 2 with `existingBinding` pre-filled
  - Modal `onSave` REPLACES any existing binding with the same `sourceColumn` and appends new bindings otherwise — verify state correctness via DOM after save (new derived chips appear in palette under DERIVED FROM TIME-DECOMPOSITION)
  - Modal `onClose` clears the open state
  - Closing modal via Escape also clears state
- Implementation in CanvasWorkspace:
  - Add `[timeDecompositionBindings, setTimeDecompositionBindings] = useState<TimeDecompositionBinding[]>([])` and `[timeFactorsModalOpen, setTimeFactorsModalOpen] = useState<{ sourceColumn?: string } | null>(null)`
  - Extend the existing `onChipContextMenuSelect: (columnName, itemId) => void` dispatch with case `itemId === 'use-as-time-factors'`: set `setTimeFactorsModalOpen({ sourceColumn: columnName })`
  - Render `<TimeAsFactorsModal>` conditionally; resolve `existingBinding` by finding `timeDecompositionBindings.find(b => b.sourceColumn === modalState.sourceColumn) ?? undefined`
  - Save handler: `setTimeDecompositionBindings(prev => [...prev.filter(b => b.sourceColumn !== binding.sourceColumn), binding])`
  - `// TODO(PR-CCJ-E1): persist timeDecompositionBindings to ImprovementProject via Charter modal commit.`
- Commit: `feat(wedge-v1): D3 task 7 — kebab use-as-time-factors dispatch + modal state wiring`

#### Task 8 — CanvasWorkspace derivation synthesis + `categoricalValuesByColumn` channel + end-to-end test (Opus implementer)

- **First**, audit consumers of derived column names for `.`-splitting: grep for `\.split\(['"]\.['"]\)` against column-name strings in `packages/ui/src/`, `packages/hooks/src/`, `packages/core/src/`. Document findings in commit message. If any are found, prefer ASCII-safe encoding at the consumer rather than changing the spec naming.
- Failing tests in `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` (new section):
  - **End-to-end happy path:**
    1. Render CanvasWorkspace with sample data including `Order_Date` column (ISO dates `2025-01-15`, `2025-04-20`, `2025-12-31`) + at least one numeric column
    2. SystemHintBanner appears at top of palette: `💡 1 time column detected. Use time as factors →`
    3. Click `Use time as factors →` on the banner → modal opens at Step 1
    4. Pick `Order_Date` radio → Next → Step 2 opens
    5. Check Year + Day of week + Hour → Save
    6. Modal closes; palette shows 3 new chips under `DERIVED FROM TIME-DECOMPOSITION`: `Order_Date.year`, `Order_Date.day-of-week`, `Order_Date.hour` (each green tint + ✨ marker)
  - **Round-trip (pre-fill on re-open):** 7. Click ⋮ on `Order_Date` chip → click `⏰ Use as time factors` 8. Modal opens at Step 2 with sourceColumn locked + Year/Day-of-week/Hour pre-checked 9. Uncheck Day of week + check Quarter + change Hour granularity to 15min → Save 10. Palette now has `Order_Date.year`, `Order_Date.quarter`, `Order_Date.hour-15min` (day-of-week chip removed)
  - **No date columns case:** render CanvasWorkspace without any date columns → SystemHintBanner does NOT include the time hint; kebab on numeric/categorical/id chips does not show `use-as-time-factors`
  - **Categorical values channel:** verify `categoricalValuesByColumn['Order_Date.year']` contains `['2025', '2025', '2025']` after save (test imports the CanvasWorkspace's exported prop or uses a spy on a downstream consumer)
  - **Drag affordance:** derived time-decomposition chips have `draggable="true"` and produce a valid drag payload (existing chip drag system handles this; test verifies the chip's drag attributes)
- Implementation in CanvasWorkspace:
  - useMemo computes `timeColumnsDetection = detectTimeColumns(rawProfiles)` (from raw, not augmented profiles — only raw columns can be "date" kind in V1)
  - useMemo computes `timeDecompositionDerivedColumns: Record<string, (string|null)[]>` by reducing `timeDecompositionBindings` through `computeTimeDecompositionColumns(rows, binding)` and merging the results
  - Synthesize `derivedTimeDecompositionProfiles: ColumnParsingProfile[]` (mirror `derivedTimingsProfiles` / `derivedFormulaProfiles` exactly — `derived: true`, `derivationSource: 'time-decomposition'`, primary `{ kind: 'categorical', label: 'categorical · derived' }`)
  - Merge into `editModeProfiles`: `[...rawProfiles, ...derivedTimingsProfiles, ...derivedFormulaProfiles, ...derivedTimeDecompositionProfiles]`
  - Expose `categoricalValuesByColumn: Record<string, (string|null)[]>` parallel to `numericValuesByColumn` — for V1, contains only the time-decomposition derived columns (raw categorical values are still resolved via `rows`)
  - Extend `systemHints` useMemo to push `{ id: 'time-detected', kind: 'time', message: \`💡 ${timeColumnsDetection.count} time column${count === 1 ? '' : 's'} detected. Use time as factors →\`, ctaLabel: 'Use time as factors', onCta: () => setTimeFactorsModalOpen({}) }`when`timeColumnsDetection != null` and at least one date column lacks a binding yet (hide hint once user has decomposed every detected date column — UX micro-polish; see Decision #7 amendment)
  - Wire `categoricalValuesByColumn` prop down through EditModeShell → Palette (for chip-render path that may need ordinal preservation later; V1: pass-through only)
- **Run before commit:** `pnpm --filter @variscout/core test` + `pnpm --filter @variscout/ui test` + `pnpm --filter @variscout/ui build` + `pnpm --filter @variscout/core build`
- Commit: `feat(wedge-v1): D3 task 8 — CanvasWorkspace time-decomposition synthesis + categorical-values channel + e2e`

---

## Verification (after all 8 tasks)

1. `pnpm --filter @variscout/core test` — new `timeDecomposition`, `detectTimeColumns`, extended `time.ts` Quarter suites green
2. `pnpm --filter @variscout/ui test` — new `TimeAsFactorsModal`, extended `Palette` SystemHintBanner + `CanvasWorkspace` e2e tests green; no regressions on D1/D2 surfaces
3. `pnpm --filter @variscout/ui build` — clean (catches type drift per `feedback_ui_build_before_merge`)
4. `pnpm test` (turbo) — global suites green
5. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
6. **Spec self-check** (browser walks skipped per `feedback_wedge_v1_no_migration_no_backcompat`):
   - With date columns: banner appears with correct count, banner CTA opens modal at Step 1
   - Without date columns: no banner; kebab on date chips not present (no date chips exist)
   - Kebab on date chip: `⏰ Use as time factors` opens modal at Step 2 with sourceColumn locked
   - Re-open on already-decomposed column: dimensions pre-checked + granularity restored
   - Hour granularity 60 min → column name `Date.hour`, value `"14:00"`
   - Hour granularity 15 min → column name `Date.hour-15min`, value `"14:30"` (15-min bucket)
   - All 6 dimensions can be picked simultaneously; modal generates 6 derived chips
   - Live preview updates as user toggles dimensions
   - Unparseable date rows show `null` in derived columns (drag-and-drop still works; downstream handles null)
   - Derived chips appear under `DERIVED FROM TIME-DECOMPOSITION` header with green tint + ✨
   - Derived chips are draggable to factor zones (drag affordance correct; drop-target value resolution deferred)
7. **Final branch review by Opus** (must STEP 0 `git checkout` per `feedback_code_review_subagent_must_checkout_pr_branch`) covering all 8 commits

## Out of scope (D3 as a whole)

Deferred to **E1 (Charter modal):**

- Persistence of `timeDecompositionBindings` (and D1's `stepTimings`, D2's `formulaBindings`) to the IP blob
- Edit/recompute UX for already-saved bindings beyond the modal pre-fill (e.g., "Edit decomposition" as its own affordance outside the kebab)

Deferred to **F1 (→ Explore exit):**

- Downstream wiring of `categoricalValuesByColumn` into Explore's group-by mechanisms
- Y-axis routing when user drags a derived time-decomposition chip to outcome zone (categorical Y is rare; UX needs design pass)

Deferred to **G1 (Probability plot inflection binning):**

- Binning as a derived chip (different workflow, lives in Explore)

Deferred to **H1 (polish):**

- Ordinal-categorical chip kind (so Hour=14 sorts after Hour=13, Day-of-week Mon<Tue<Wed…)
- "Edit decomposition" affordance shown when chip already has a binding (V1: same kebab item works for both create + edit via pre-fill)
- Auto-hide time-decomposition hint banner once user has decomposed all detected date columns (mentioned in T8 implementation; verify it lands)
- Multi-source time decomposition in one modal session (V1: one source per save)

Deferred to **V2:**

- Cross-row time-since-prev-row dimension (requires row ordering semantics — out of scope without a `Time of event` global anchor)
- Custom-period dimensions (fortnight, fiscal year, custom 4-4-5 calendar)
- Timezone selector (V1 uses local TZ via JS Date; raw value's TZ if encoded)
- Locale-specific month/day names (V1 hardcodes English short names per existing `extractTimeComponents`)

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-d-3-time-as-factors/` — main session stays at repo root
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer, with model overrides:
  - **Task 8 (CanvasWorkspace integration + categorical channel + e2e):** Opus implementer (multi-file integration; new contract `categoricalValuesByColumn`; consumer audit for `.`-splitting; round-trip pre-fill e2e)
  - Tasks 1, 2, 3, 4, 5, 6, 7: Sonnet implementer
- **Reviewers:** Sonnet spec + Sonnet code-quality per task (no per-task Opus reviewer; Opus reserved for final branch pass)
- **Final branch review:** Opus on full diff (all 8 commits) before merge — must STEP 0 `git checkout` PR branch
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`; preserves per-commit history per `feedback_preserve_commit_history`)
- **Subagent constraints forwarded to every dispatch:** NEVER `--no-verify`; NEVER add migration helpers / back-compat shims (`feedback_wedge_v1_no_migration_no_backcompat`); operate ONLY in assigned worktree, never cd to main repo (`feedback_subagent_worktree_discipline`); skip browser walks for wedge V1; do NOT rename preserved identifiers from CLAUDE.md (AnalysisMode, AnalysisBrief, AnalysisStats, AnalysisModeStrategy, AnalysisLensTab, DashboardTab union, ADR-074 timing concepts, ProcessStateLens, AIContext.investigation, Investigation Wall, investigation-report, docs/03-features/analysis/, Dashboard.tsx, ProjectMetadata.sustainment, panelsStore 'sustainment' key, CoScout AI prompts, investigationId FK fields)
- **After merge:** update `[[canvas-connection-journey]]` memory with D3 shipped outcomes; mark D3 task completed; E1 (Charter modal) is the natural next critical-path item (folds C3 + D1 + D2 + D3 persistence into the IP blob)

## Decisions (documented, not punted)

1. **Single PR over master-of-master** — D1 (PR #225) and D2 (PR #226) precedents both shipped successfully as single PRs. D3 is genuinely smaller (8 tasks vs 11), no template registry, no slot UX. Carve clause at Phase 2 → Phase 3 boundary if T8's categorical-channel design surfaces unexpected coupling.
2. **Dot+kebab derived column naming** per spec verbatim. `Order_Date.day-of-week` etc. T8 audits for `.`-splitting consumers.
3. **Six dimensions + Hour granularity sub-picker.** Year, Quarter, Month, Week, Day-of-week, Hour. Hour has inline granularity dropdown (60/30/15/5 min, default 60).
4. **Re-open UX = pre-fill** (Notion/Figma/Linear standard). Saving replaces binding by sourceColumn.
5. **Output values = categorical strings.** "Mon" / "W03" / "Q1" / "2025" / "14:00". Ordinal preservation deferred to H1.
6. **NaN/null propagation:** unparseable dates yield `null` (not NaN; categorical convention) per row per dimension.
7. **`categoricalValuesByColumn` channel is metadata-only in V1.** Channel exists, downstream consumers wire incrementally in F1/H1.
8. **Banner hides after all detected date columns are decomposed** (T8 micro-polish; not a hard requirement — verify before merge).
9. **Quarter = `Math.floor(month/3) + 1`** (`Q1|Q2|Q3|Q4`).
10. **No persistence in D3** — `timeDecompositionBindings` lives as local React state. E1 folds all three D-series binding arrays into the IP blob.
11. **`detectTimeColumns` returns null for empty result** (mirrors `detectBatchData` D2 precedent) — consumer checks for null before pushing hint.

## Related

- Canvas Connection Journey spec — `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` (§3.1.2, §3.4, §4.1, §4.3.3)
- Canvas Connection Journey master plan — `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` (Phase D · D3)
- D1 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-1-step-timings.md`
- D2 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-2-calc-workflow.md`
- Memory: [[canvas-connection-journey]], [[wedge-v1]], [[feedback_subagent_driven_default]], [[feedback_slice_size_cap]], [[feedback_atomic_sweep_one_dispatch]], [[feedback_one_worktree_per_agent]], [[feedback_preserve_commit_history]], [[feedback_ui_build_before_merge]], [[feedback_wedge_v1_no_migration_no_backcompat]], [[feedback_subagent_no_verify]], [[feedback_code_review_subagent_must_checkout_pr_branch]], [[feedback_hidden_vs_disabled_cta]], [[feedback_green_400_light_contrast]], [[feedback_strict_assert_over_silent_migration]]
