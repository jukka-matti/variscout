---
tier: ephemeral
purpose: build
title: PR-CCJ-D1 — Step timings workflow + Lead_time derivation (single PR, 3 phases)
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-D1 — Step timings workflow + Lead_time derivation (single PR, 3 phases)

## Context

Phase C of the Canvas Connection Journey shipped on main at `33cd0c28` (PR #224, 11 commits). The canvas Edit mode is now a fully drop-aware authoring surface: outcomes, factors, and emergent step boxes (from categorical drops) are all wired. **C3 reserved two slots on `<StepBox>` for D1 to fill**: `timingBadge?: ReactNode` (right edge of header) and `resourceIndicator?: ReactNode` (after timing). Neither is rendered today — `<ProcessStructureZone>` passes nothing through.

**D1's user-visible value:** A `+ Capture step timings` button in the canvas toolbar opens a modal. The user binds each emergent step to a paired start/end column pair (or a single duration column). Pre-fill matches columns by name (`Prep_start` + `Prep_end` → Prep step). Once ≥ 1 step is timed, three derived chips materialize in the palette under a **DERIVED FROM TIMINGS** section: `Lead_time`, `Total_work_time`, `Wait_time`. Each step's `timingBadge` slot lights up with an estimated duration (e.g. `⏱ ~ 42 min`). The derived chips are draggable to outcome/factor zones like raw columns — they're column-shaped from the chip system's perspective.

**Spec sections consumed:** §3.4 (derived chips: Lead_time / Total_work_time / Wait_time auto-derivation when ≥ 1 step has paired start+end), §4.3 (canvas toolbar), §4.3.1 (`+ Capture step timings` modal — by-step default tab, by-column alternative tab, paired-name pre-fill with cyan-dot indicators, duration-column alternative mutually-exclusive with paired start/end, footer `Save · N steps timed →`). Spec §4.1 establishes the toolbar conceptually (4 buttons listed); D1 ships only the `+ Capture step timings` button per `feedback_hidden_vs_disabled_cta` — other toolbar buttons land in E1/F1/H1.

**Master plan parent:** `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` — Phase D §"PR-CCJ-D1 · Step timings workflow + derived flow metrics" (4–5 days, sub-plan flagged YES).

**Existing primitives ready to reuse (no rework needed):**

- `<StepBox>` slot reservations — `timingBadge?: ReactNode` + `resourceIndicator?: ReactNode` already on the props interface (`packages/ui/src/components/Canvas/EditMode/ProcessZone/StepBox.tsx:14-17`). C3 wired them in the render path; D1 only needs to forward data through.
- `<ProcessStructureZone>` container — props interface `{ steps: StepBoxStep[] }` (`packages/ui/src/components/Canvas/EditMode/ProcessZone/index.tsx:6-8`); D1 extends to accept `timingByStepId?: Record<string, ReactNode>` and forwards to each `<StepBox>`.
- `<EditModeShell>` — already owns its own `DndContext` + grid layout (`packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx:13-74`); D1 adds a toolbar slot under the header (between the title-row and the 3-column grid).
- `<Palette>` — `GROUP_ORDER` extension model: `'numeric' | 'categorical' | 'time-id' | 'other'` (`packages/ui/src/components/Canvas/EditMode/Palette/index.tsx:23-28`). Adding `'derived'` slots in cleanly.
- `<ColumnChip>` — props interface accepts `dropped?` + `ghostSuggested?`; structurally extensible to add `derived?: boolean` for green tint + `✨` marker.
- `encodeColumnDragId` codec (`column:<name>`) — reused as-is for derived chips (Decision 2 below).
- `ColumnParsingProfile` shape (`packages/core/src/parser/types.ts:135-146`) — derived columns surface as profiles with a `derived: true` flag (Decision 3 below).
- `parseTimeValue()` (`packages/core/src/time.ts:75-100`) — already converts date values to numeric epoch ms via `.getTime()`. D1 reuses for arithmetic.
- FocusTrap modal pattern (e.g. `packages/ui/src/components/ImprovementPlan/AddActionDialog.tsx`) — fixed backdrop + Escape/click close + auto-focus first input. Mirror, don't abstract.

**What MUST be built (no equivalent exists):**

- `packages/core/src/derived/types.ts` — `StepTimingBinding` discriminated union (`'paired' | 'duration'`) + `StepTimingsByStepId` keyed record type.
- `packages/core/src/derived/detectPairedTimingColumns.ts` — pure helper matching `<prefix>_start` + `<prefix>_end` date-kind columns and mapping to steps by lowercase-name match.
- `packages/core/src/derived/leadTime.ts` — pure helpers `computeLeadTimeColumn(rows, stepTimings)`, `computeTotalWorkTimeColumn(...)`, `computeWaitTimeColumn(...)`, each returning `number[]` (per-row, nullable rows return `NaN` which gets filtered by consumers like all numeric columns).
- `packages/ui/src/components/Canvas/EditMode/Workflows/` directory + `StepTimingsModal.tsx` — by-step (default) + by-column tabs, pre-fill indicators, duration alternative.
- `packages/ui/src/components/Canvas/EditMode/EditModeToolbar.tsx` — toolbar slot below the header. D1 ships ONE button (`+ Capture step timings`); other 3 buttons from spec §4.1 are added in E1/F1/H1 per `feedback_hidden_vs_disabled_cta`.
- `packages/ui/src/test-utils/stepTiming.ts` — `createTestStepTiming({ kind: 'paired' | 'duration', ...overrides })` factory.
- Palette extension: `'derived'` group + `DERIVED FROM TIMINGS` header rendering.
- `<ColumnChip>` `derived?: boolean` prop + green tint + `✨` marker.
- `<ProcessStructureZone>` `timingByStepId?: Record<string, ReactNode>` forward prop.

**No persistence in D1.** State remains prop-driven in `<CanvasWorkspace>` via local `useState`, mirroring the C3 `processSteps` pattern (`CanvasWorkspace.tsx:474-485`). E1 (Charter modal) folds step timings into the IP blob.

---

## Approach

Single PR with **three internal phases** (mirroring C3's collapsed model — engine in `core/derived/` then modal under `Canvas/EditMode/Workflows/` then UI integration across palette + toolbar + step-box wiring). Subagent-driven: Sonnet implementer + Sonnet 2-stage review per task; Opus implementer for Tasks 3 + 10 (modal table judgment + multi-file integration); Opus final branch reviewer over all 10 commits.

```
Phase 1: Engine in @variscout/core (pure helpers + types)         (tasks 1–2)
Phase 2: StepTimingsModal under Canvas/EditMode/Workflows/        (tasks 3–6)
Phase 3: Toolbar + derived chips + step-box wiring + CW wiring    (tasks 7–10)
```

**Why single PR over a 2-PR engine→UI split:** D1's value is end-to-end — the user can't _see_ `Lead_time` until palette renders derived chips. Splitting at the engine/UI boundary lands an inert engine on main and a hard-to-review UI PR that can't be exercised. C3 set the precedent (`feedback_atomic_sweep_one_dispatch` + sibling reasoning); per-task two-stage review keeps quality at the same depth. Final Opus reviewer reads 10 commits one-pass.

**Task count 10 sits at the upper edge of `feedback_slice_size_cap` (~6–8 tasks/PR).** D1's three phases live in different code surfaces (core engine vs UI modal vs palette+toolbar+step wiring) — looser internal coupling than C3's (which all touched `ProcessZone/`). The justification is end-to-end user value coherence, not coupling. If review depth slips during execution, the natural carve point is Phase 1 → Phase 2 boundary (engine PR + UI PR). Plan documents this carve-out under Decisions §1 so the orchestrator can split mid-execution without redrafting.

This plan produces **one plan-doc artifact** at `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-1-step-timings.md`. The parent master plan (`2026-05-26-canvas-connection-journey-master-plan.md`) gets a brief amendment note in Phase D's PR-CCJ-D1 entry: "Sub-plan lives at the d-1 path; structured as single-PR with 3 internal phases per D1 plan §Approach."

---

## TDD task list (10 tasks total)

### Phase 1 — Engine: pure helpers + types in `@variscout/core/derived/`

#### Task 1 — Worktree + `detectPairedTimingColumns` pure helper

- Branch `feat/wedge-v1-ccj-d-1-step-timings` off `main` in `.worktrees/feat/wedge-v1-ccj-d-1-step-timings/`
- Create `packages/core/src/derived/detectPairedTimingColumns.ts`:

  ```typescript
  export interface PairedTimingColumns {
    prefix: string; // e.g. 'Prep' from 'Prep_start' / 'Prep_end'
    startColumn: string;
    endColumn: string;
    matchedStepId: string | null; // null if no step name matches prefix (case-insensitive)
  }

  export function detectPairedTimingColumns(
    profiles: ColumnParsingProfile[],
    steps: { id: string; name: string }[]
  ): PairedTimingColumns[] {
    // 1. Filter profiles to date-kind only (profile.primary?.kind === 'date')
    // 2. Group by base name: strip case-insensitive '_start' / '_end' suffix
    // 3. For each base name, pair if both _start and _end found
    // 4. Match prefix to step by lowercase exact-equality on step.name
    // 5. Return deterministic order (sorted by prefix)
  }
  ```

- Failing tests in `packages/core/src/derived/__tests__/detectPairedTimingColumns.test.ts`:
  - Empty profiles + empty steps → `[]`
  - Numeric column ending in `_start` → ignored (date-kind filter)
  - `Prep_start` (date) + `Prep_end` (date) + step `{ name: 'Prep' }` → 1 pair, `matchedStepId` set
  - `Prep_start` + `Prep_end` + no matching step → 1 pair, `matchedStepId: null`
  - `Prep_start` without `Prep_end` → `[]` (unpaired ignored)
  - Case-insensitive: `PREP_START` + `prep_end` + step `Prep` → matched
  - Two prefixes (`Mix_start`/`Mix_end`, `Fill_start`/`Fill_end`) + steps → 2 pairs, alphabetical order
  - `_start` and `_end` only (no prefix) → `[]`
- Commit: `feat(wedge-v1): D1 task 1 — detectPairedTimingColumns helper`

#### Task 2 — `StepTimingBinding` types + Lead_time / Total_work_time / Wait_time pure helpers

- Failing tests in `packages/core/src/derived/__tests__/leadTime.test.ts`:
  - **Type discriminants:** `StepTimingBinding = { kind: 'paired'; stepId: string; startColumn: string; endColumn: string } | { kind: 'duration'; stepId: string; durationColumn: string }`
  - `computeLeadTimeColumn(rows, [])` (no timings) → `null` (signal: no derivation needed)
  - `computeLeadTimeColumn(rows, [pairedTiming])` per row: `max(end value across paired steps) - min(start value across paired steps)` in **milliseconds** (consistent unit; consumers can format)
  - Row with one paired step's start/end missing → row value `NaN`
  - Row with all paired steps valid → numeric ms diff
  - Duration-binding steps contribute to `Total_work_time` (sum of duration column values) but NOT to `Lead_time` (only paired contribute since duration has no start/end timestamps)
  - `Total_work_time = sum(end − start) across paired steps + sum(durationColumn values) across duration-bound steps`
  - `Wait_time = Lead_time − Total_work_time` (per row, NaN-propagating)
  - Mixed paired + duration bindings on different steps → all three derivations compute correctly
  - Helper returns `null` if `stepTimings.length === 0` (signals consumer: skip palette derivation entirely)
- Create `packages/core/src/derived/types.ts` (exports `StepTimingBinding` + alias `StepTimingsByStepId = Record<string, StepTimingBinding>`)
- Create `packages/core/src/derived/leadTime.ts` exporting `computeLeadTimeColumn`, `computeTotalWorkTimeColumn`, `computeWaitTimeColumn` — each takes `(rows: Record<string, unknown>[], timings: StepTimingBinding[])` and returns `number[] | null` (null = no derivation; consumer omits the chip)
- Use `parseTimeValue()` from `packages/core/src/time.ts` for date→ms conversion
- Add barrel re-export at `packages/core/src/derived/index.ts`
- Wire into `packages/core/src/index.ts` (package public surface)
- Commit: `feat(wedge-v1): D1 task 2 — StepTimingBinding types + Lead_time / Total / Wait derivation`

### Phase 2 — StepTimingsModal under `Canvas/EditMode/Workflows/`

#### Task 3 — Modal skeleton + by-step (default) layout — **Opus implementer** for table judgment

- Failing tests in `packages/ui/src/components/Canvas/EditMode/Workflows/__tests__/StepTimingsModal.test.tsx`:
  - Renders inside `FocusTrap` with backdrop (`role="dialog"`, `aria-label="Capture step timings"`)
  - Escape key + backdrop click both call `onClose`
  - Header copy: "Capture step timings"
  - **By step** tab active by default (`aria-selected="true"`); **By column** tab also present
  - With `steps = [createTestStep({ id: 'mix' }), createTestStep({ id: 'fill' })]` + `dateColumns = ['Mix_start', 'Mix_end', 'Fill_start']`:
    - Renders one row per step (2 rows)
    - Each row has step name + Start ▾ picker (`<select>`) + End ▾ picker + Duration preview cell
    - Pickers list only date-kind column names + an empty `--` option
    - Empty rows OK (no warnings)
  - Save button calls `onSave(bindings: StepTimingBinding[])` with only fully-bound (start+end set) rows; bindings carry `kind: 'paired'`
  - Footer copy reflects timed step count: `Save · 0 steps timed →` / `Save · 1 step timed →` / `Save · 2 steps timed →`
- Create `packages/ui/src/components/Canvas/EditMode/Workflows/StepTimingsModal.tsx`:
  ```typescript
  export interface StepTimingsModalProps {
    steps: { id: string; name: string; order: number }[];
    dateColumns: string[]; // names of date-kind columns from profiles
    initialBindings?: StepTimingBinding[]; // for reopening; default []
    onSave: (bindings: StepTimingBinding[]) => void;
    onClose: () => void;
  }
  ```
- Create `packages/ui/src/test-utils/stepTiming.ts` factory:
  ```typescript
  let counter = 0;
  export function createTestStepTiming(
    overrides: Partial<StepTimingBinding> & { kind?: 'paired' | 'duration' } = {}
  ): StepTimingBinding {
    counter += 1;
    const kind = overrides.kind ?? 'paired';
    if (kind === 'paired') {
      return {
        kind: 'paired',
        stepId: `step-test-${counter}`,
        startColumn: 'Start',
        endColumn: 'End',
        ...overrides,
      };
    }
    return {
      kind: 'duration',
      stepId: `step-test-${counter}`,
      durationColumn: 'Duration',
      ...overrides,
    };
  }
  ```
- Mirror `AddActionDialog.tsx` FocusTrap shell — do NOT create a new modal abstraction.
- Commit: `feat(wedge-v1): D1 task 3 — StepTimingsModal skeleton + by-step layout`

#### Task 4 — Pre-fill from `detectPairedTimingColumns` + cyan-dot auto-detected indicators

- Failing tests:
  - `StepTimingsModal` accepts `dateProfiles: ColumnParsingProfile[]` prop (replace/augment `dateColumns` from Task 3, threading the full profile shape through so detection can run)
  - On open with steps `Prep` + `Pack` and date profiles `Prep_start`, `Prep_end`, `Pack_start`, `Pack_end`:
    - Prep row's Start picker has `Prep_start` pre-selected
    - Prep row's End picker has `Prep_end` pre-selected
    - Both pickers render a small cyan dot indicator with `aria-label="Auto-detected"` next to the value
    - Same for Pack row
  - User can override the pre-filled value → cyan dot disappears for that picker (track `wasAutoDetected: Record<string, { start?: boolean; end?: boolean }>` keyed by stepId; clear on manual change)
  - Save returns bindings with the (possibly user-overridden) values, NOT the originally-detected pair
  - Detection runs once on open (or on `dateProfiles`/`steps` change); not every render
- Wire `detectPairedTimingColumns(dateProfiles, steps)` from Phase 1 inside the modal's `useMemo`
- Commit: `feat(wedge-v1): D1 task 4 — modal pre-fill + cyan-dot auto-detect indicators`

#### Task 5 — By-column tab + duration column alternative section + mutual exclusion

- Failing tests:
  - Clicking **By column** tab swaps the table layout:
    - One row per date-kind column
    - Each row: column name + Step picker + Role picker (Start / End / Duration)
    - Re-derives bindings from this view on Save (same `StepTimingBinding[]` output shape; matched into paired or duration based on role assignments)
  - **Duration alternative section** below the per-step table (always visible in by-step view):
    - Header "Or use a single duration column"
    - Per-step row: step name + Duration column picker (numeric columns only; date columns excluded — duration columns are typically numeric like `Cycle_time_min`)
    - When user picks a duration column for a step: clear that step's Start/End (mutual exclusion); show a small inline hint "Using duration only"
    - When user picks Start or End for a step that has a duration: clear the duration (other direction of mutual exclusion); show "Using start/end pair"
    - Save returns `{ kind: 'duration', stepId, durationColumn }` for duration-bound steps and `{ kind: 'paired', ... }` for paired steps
  - Mutual-exclusion state managed in modal local state; not persisted until Save
- Add `numericColumns: string[]` prop to modal (for duration picker options)
- Commit: `feat(wedge-v1): D1 task 5 — by-column tab + duration alternative + mutual exclusion`

#### Task 6 — Save footer reflects actual timed step count + edge-case polish

- Failing tests:
  - 0 steps timed → footer disabled or shows `Save · 0 steps timed →` (per spec §4.3.1 "reflects what's actually configured, not 'all 5 are required'")
  - 1 step timed (start+end pair) → `Save · 1 step timed →`
  - 2 paired + 1 duration timed → `Save · 3 steps timed →`
  - Partial step (only Start set, no End) → does NOT count as timed; Save excludes it from `bindings`
  - Cancel button next to Save → calls `onClose` without `onSave`
  - Empty state when `steps.length === 0`: hint copy "Drop a categorical column into the process zone first to define steps." + Save disabled
- Polish copy per spec §4.3.1
- Commit: `feat(wedge-v1): D1 task 6 — modal save footer + edge-case polish`

### Phase 3 — Toolbar + derived chips + step-box wiring + CanvasWorkspace integration

#### Task 7 — `<EditModeToolbar>` component + `+ Capture step timings` button slot

- Failing tests for `packages/ui/src/components/Canvas/EditMode/EditModeToolbar.tsx`:
  - Renders an `aria-label="Edit mode toolbar"` container
  - One button visible: `+ Capture step timings` (`role="button"`, click handler)
  - Button disabled when `steps.length === 0` with tooltip / inline hint "Add steps first"
  - Button enabled when `steps.length >= 1` — calls `onCaptureStepTimings` on click
  - Other toolbar buttons from spec §4.1 (`+ Goal narrative`, `+ Issue / question`, `→ Explore`) are NOT rendered in D1 (per `feedback_hidden_vs_disabled_cta`)
- Failing tests for `EditModeShell`:
  - Renders `<EditModeToolbar>` between header and 3-column grid
  - Forwards new props `onCaptureStepTimings?: () => void` + `steps` (already passed)
  - Layout: toolbar row spans full width, sits above the grid
- Modify `EditModeShell.tsx` to add `<EditModeToolbar steps={steps ?? []} onCaptureStepTimings={onCaptureStepTimings} />` between `<header>` and the grid `<div>`
- Add `onCaptureStepTimings?: () => void` to `EditModeShellProps`
- Commit: `feat(wedge-v1): D1 task 7 — EditModeToolbar + Capture step timings slot`

#### Task 8 — `<ColumnChip>` `derived` prop + `<Palette>` DERIVED FROM TIMINGS group

- Failing tests for `ColumnChip`:
  - `derived?: boolean` prop added; default false
  - When `derived={true}`: green tint background (use existing token, e.g., `bg-emerald-50` / `dark:bg-emerald-950` — pair light/dark per `feedback_green_400_light_contrast`) + leading `✨` marker on the chip label
  - Test: `getByText('✨')` present only when `derived`; absent otherwise
  - `dropped` + `derived` both true: chip still shows green tint underneath the faded `dropped` overlay
- Failing tests for `Palette`:
  - `GROUP_ORDER` extended with `{ key: 'derived', label: 'DERIVED FROM TIMINGS' }` (per spec §3.4 wording — generic "DERIVED FROM ..." with timings as the first concrete variant). Group label is dynamic per source type (D2 will add "DERIVED FROM FORMULA"; D3 will add "DERIVED FROM TIME"). For D1, only "DERIVED FROM TIMINGS" is needed; pass label via profile metadata.
  - Profile with `derived: true` + `derivationSource: 'timings'` → bucketed into derived group, renders under header `DERIVED FROM TIMINGS`
  - All `<ColumnChip>`s in derived group rendered with `derived={true}`
  - Empty derived group does NOT render a header (clean palette when no timings are configured)
- Extend `ColumnParsingProfile`-shaped data through palette: derived columns can either (a) reuse `ColumnParsingProfile` with `derived: true` + `derivationSource: 'timings'` added as optional fields, or (b) flow as a parallel `derivedProfiles: DerivedColumnProfile[]` prop. **Choice: (a)** — keeps palette grouping logic unified and avoids an isDerived discriminator at render time. Modify `ColumnParsingProfile` type in `packages/core/src/parser/types.ts` to add optional `derived?: boolean` + `derivationSource?: 'timings' | 'formula' | 'time-decomposition'`.
- Commit: `feat(wedge-v1): D1 task 8 — ColumnChip derived variant + Palette DERIVED FROM TIMINGS group`

#### Task 9 — `<ProcessStructureZone>` `timingByStepId` forward + `<StepBox>` `timingBadge` wiring

- Failing tests for `ProcessStructureZone`:
  - Props extended with `timingByStepId?: Record<string, ReactNode>` (default `{}`)
  - With `steps = [createTestStep({ id: 'mix' }), createTestStep({ id: 'fill' })]` and `timingByStepId = { mix: <span data-testid="badge">⏱ ~42 min</span> }`:
    - StepBox for `mix` receives `timingBadge` prop wired to the provided node → `getByTestId('badge')` present in the mix step's render
    - StepBox for `fill` receives no `timingBadge` → no badge rendered in fill
  - Empty `timingByStepId` → no badges rendered anywhere (unchanged from current behavior)
- Modify `ProcessStructureZone/index.tsx`: pass `timingBadge={timingByStepId?.[step.id]}` to each `<StepBox>`
- Modify `EditModeShellProps` to thread `timingByStepId?: Record<string, ReactNode>` down to `<ProcessStructureZone>`
- Commit: `feat(wedge-v1): D1 task 9 — timing-badge forward prop wiring`

#### Task 10 — `<CanvasWorkspace>` integration: state + derivation + modal + toolbar wire — **Opus implementer** for multi-file judgment

- Failing tests in `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` (new section):
  - End-to-end: render CanvasWorkspace with sample data → drop a categorical column to materialize steps → click `+ Capture step timings` → modal opens → bind step's start + end columns → save → modal closes → derived chips `Lead_time`, `Total_work_time`, `Wait_time` appear in palette under DERIVED FROM TIMINGS → step's `timingBadge` shows an estimated duration string
  - With ALL steps in `'duration'` bindings (no paired): `Lead_time` chip does NOT appear (only paired-step bindings produce Lead_time per spec §3.4); `Total_work_time` still appears.
- Modify `CanvasWorkspace.tsx`:
  - Add `const [stepTimings, setStepTimings] = useState<StepTimingBinding[]>([])`
  - Add `const [stepTimingsModalOpen, setStepTimingsModalOpen] = useState(false)`
  - Compute derived columns via `useMemo`: call `computeLeadTimeColumn(rows, stepTimings)` + the other two; build derived `ColumnParsingProfile`s (synthesize `name`, `derived: true`, `derivationSource: 'timings'`, `primary.kind: 'numeric'`) and merge into the existing `profiles` array passed to `EditModeShell`
  - Compute `timingByStepId: Record<string, ReactNode>` by mapping each timed step to a `<span>{`⏱ ~ ${formatDuration(avgDuration)}`}</span>` (use a small helper `packages/ui/src/components/Canvas/EditMode/formatDuration.ts` — `(ms: number) => string` returning `42 min` / `1.2 h` / `38 s`; pure helper with its own unit tests in this same task)
  - Wire `onCaptureStepTimings` → `setStepTimingsModalOpen(true)`
  - Render `<StepTimingsModal>` conditionally when `stepTimingsModalOpen` with `onSave={(bindings) => { setStepTimings(bindings); setStepTimingsModalOpen(false); }}` + `onClose={() => setStepTimingsModalOpen(false)}`
  - Update derived numericValues map so dropped derived chips have values available to `onOutcomeSpecAdd` / `onFactorControlAdd`
  - Comment marker: `// TODO(PR-CCJ-E1): persist stepTimings to ImprovementProject via Charter modal commit`
- Run `pnpm --filter @variscout/ui test` + `pnpm --filter @variscout/ui build` + `pnpm --filter @variscout/core test`
- Commit: `feat(wedge-v1): D1 task 10 — CanvasWorkspace integration + formatDuration + end-to-end test`

---

## Verification (after all 10 tasks)

1. `pnpm --filter @variscout/core test` — new `detectPairedTimingColumns` + `leadTime` test suites green
2. `pnpm --filter @variscout/ui test` — new `StepTimingsModal` + `EditModeToolbar` + extended `ColumnChip` + extended `Palette` + extended `ProcessStructureZone` + `CanvasWorkspace` end-to-end tests green; no regressions on prior ui suite (~2316 tests post-C3)
3. `pnpm --filter @variscout/ui build` — clean (catches type drift per `feedback_ui_build_before_merge`)
4. `pnpm test` (turbo) — global suites green
5. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
6. **Spec self-check** (per `feedback_wedge_v1_no_migration_no_backcompat` browser walks are skipped; manual `--chrome` only if a visual test asserts something the headless suite cannot):
   - Empty state: process tab Edit mode shows toolbar with `+ Capture step timings` disabled when no steps
   - After dropping a categorical with values `[Prep, Mix, Fill]`: steps materialize, toolbar button enables
   - Click `+ Capture step timings` → modal opens with By-step tab active
   - Date columns `Prep_start`, `Prep_end` pre-fill the Prep row with cyan-dot indicators
   - User overrides Mix's End picker → cyan dot disappears for that picker
   - Switch to By-column tab → table swaps to column-row view
   - Save with 2 paired bindings → modal closes; palette gains DERIVED FROM TIMINGS group with `Lead_time` / `Total_work_time` / `Wait_time` chips (green tint + `✨`)
   - Step boxes show `⏱ ~ N min` badges in the header right edge
   - Drag `Lead_time` chip to outcome zone → behaves like a numeric column (no derived-specific drop blocker)
7. **Final branch review by Opus** (must STEP 0 `git checkout` per `feedback_code_review_subagent_must_checkout_pr_branch`) covering all 10 commits

## Out of scope (D1 as a whole)

Deferred to **D2 (calc workflow):**

- `DERIVED FROM FORMULA` palette group (D1 only adds `DERIVED FROM TIMINGS`; the discriminator infrastructure is in place)
- Manual calc / ratio engine

Deferred to **D3 (time-as-factors):**

- `DERIVED FROM TIME` palette group
- Date decomposition engine

Deferred to **E1 (Charter modal):**

- Persistence of `stepTimings` to the IP blob
- Mapping `StepTimingBinding[]` → `ImprovementProject` field shape if a stable shape is required

Deferred to **H1 (polish):**

- Resource-indicator population for `<StepBox>` (low-cardinality categorical detection per §3.3) — slot already exists from C3
- Toolbar buttons `+ Goal narrative`, `+ Issue / question`, `→ Explore` (other 3 of the 4 per spec §4.1)

Deferred / **never** in D1:

- Sub-step decomposition (V2 per spec §1)
- Per-resource timing (separate start/end columns per parallel machine — V2 per spec §1)

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-d-1-step-timings/` — main session stays at repo root
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer (each task well-specified TDD against 1–3 files), with model overrides:
  - **Task 3 (modal + table judgment):** Opus implementer (multi-control state coordination, FocusTrap mirror without abstraction temptation)
  - **Task 10 (CanvasWorkspace integration):** Opus implementer (multi-file integration, derived-column merging, end-to-end test threading)
  - Tasks 1, 2, 4, 5, 6, 7, 8, 9: Sonnet implementer
- **Reviewers:** Sonnet spec + Sonnet code-quality per task (no per-task Opus reviewer; Opus is reserved for the final branch pass)
- **Final branch review:** Opus on full diff (all 10 commits) before merge — must STEP 0 `git checkout` the PR branch (`feedback_code_review_subagent_must_checkout_pr_branch`)
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`; preserves per-commit history per `feedback_preserve_commit_history`)
- **Subagent constraints forwarded to every dispatch:** NEVER `--no-verify`; NEVER add migration helpers / back-compat shims (`feedback_wedge_v1_no_migration_no_backcompat`); operate ONLY in assigned worktree, never cd to main repo (`feedback_subagent_worktree_discipline`); skip browser walks for wedge V1; do NOT rename preserved identifiers from CLAUDE.md (`AnalysisMode`, `AnalysisBrief`, `AnalysisStats`, `AnalysisModeStrategy`, `AnalysisLensTab`, `DashboardTab` union, ADR-074 timing concepts, `ProcessStateLens`, `AIContext.investigation`, `Investigation Wall`, `investigation-report`, `docs/03-features/analysis/`, `Dashboard.tsx`, `ProjectMetadata.sustainment`, panelsStore `'sustainment'` key, CoScout AI prompts, `investigationId` FK fields)
- **After merge:** update `[[canvas-connection-journey]]` memory with D1 shipped outcomes; mark task #30 completed; flag PR-CCJ-D2 (calc workflow) as next critical-path item (or PR-CCJ-E1 if user chooses to land Charter persistence before more derivation engines)

## Decisions made (documented, not punted)

1. **Single PR (not 2-PR engine→UI split)** — D1's value is end-to-end; an engine-only PR lands inert code that can't be exercised. Per-task two-stage review keeps quality at the same depth. Task count (10) sits at the upper edge of `feedback_slice_size_cap` (~6–8); justified by end-to-end coherence. **Mid-execution carve-out:** if the modal phase (Tasks 3–6) gets stuck, the natural split is Phase 1 → Phase 2 boundary (engine PR first, then UI PR). The orchestrator can split without redrafting; both PRs would still merge before D2 begins.
2. **Drag-id codec reuse (`column:<derived_name>`, NOT new `derived:<name>` prefix)** — derived chips behave like raw columns from the drop-handler perspective. Visual marker (`✨` + green tint) is a chip-side concern. Codec churn avoided; downstream consumers (`onOutcomeSpecAdd`, `onFactorControlAdd`) don't care whether a column is derived. Per Explore agent's recommendation; mirrors how `numericValuesByColumn` already abstracts source.
3. **`ColumnParsingProfile` carries `derived?` + `derivationSource?` optional flags (NOT separate `DerivedColumnProfile` type)** — keeps palette grouping logic unified, avoids `isDerived` discriminators at render time, and reuses every chip rendering path. Optional fields; raw columns never set them. Per `feedback_wedge_v1_no_migration_no_backcompat` — direct add to the type.
4. **`StepTimingBinding` is a discriminated union (`{ kind: 'paired' | 'duration' }`)** — mutual exclusion between paired-start-end and duration-column bindings is type-level, not runtime validation. Aligns with `feedback_strict_assert_over_silent_migration` and matches the C2 factor codec union pattern.
5. **Pre-fill detection regex is simple `<prefix>_start` / `<prefix>_end` only** — no `_begin/_finish`, no `From/To`, no time-pattern heuristics. V1 ships with paired-suffix naming convention; if users complain, add aliases. Per YAGNI + spec §4.3.1's example (`Prep_start` + `Prep_end`).
6. **Step-to-prefix matching is lowercase exact-equality** — `step.name.toLowerCase() === prefix.toLowerCase()`. No fuzzy matching, no substring. Predictable; users always understand why pre-fill did or didn't happen. Future polish (H1) can add fuzzy matching if surveys show friction.
7. **Toolbar location: dedicated row between EditModeShell header and 3-column grid (NOT in the header next to Done)** — per spec §4.1, the toolbar is its own conceptual zone with 4 buttons. D1 ships row + 1 button (`+ Capture step timings`). E1/F1/H1 add the remaining 3 buttons in their respective scopes. Hidden, not disabled, for unwired buttons per `feedback_hidden_vs_disabled_cta`.
8. **No persistence; `stepTimings` lives in `<CanvasWorkspace>` local React state** — mirrors C3's `processSteps` pattern. E1 (Charter modal) folds both into the IP blob. Per `feedback_wedge_v1_no_migration_no_backcompat`.
9. **`StepTimingBinding` types live in `packages/core/src/derived/types.ts` (NOT `improvementProject/types.ts`)** — derived-data concept, not IP shape. E1 may add an IP field that _references_ `StepTimingBinding`, but the union itself is a derivation-engine concept.
10. **`Lead_time` unit is milliseconds in the engine; formatted at the UI seam (`formatDuration.ts`)** — engine stays unit-agnostic; UI picks human-readable formatting (`42 min` / `1.2 h` / `38 s`). Test the engine in raw ms; test the formatter independently.

## Related

- Canvas Connection Journey spec: docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md §3.4, §4.1, §4.3, §4.3.1
- Canvas Connection Journey master plan: docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md Phase D
- C3 sub-plan (precedent for single-PR-with-internal-phases pattern): docs/superpowers/plans/2026-05-27-canvas-connection-journey-c-3-process-structure-zone.md
- Memory: `[[canvas-connection-journey]]`, `[[wedge-v1]]`, `[[feedback_subagent_driven_default]]`, `[[feedback_slice_size_cap]]`, `[[feedback_atomic_sweep_one_dispatch]]`, `[[feedback_one_worktree_per_agent]]`, `[[feedback_preserve_commit_history]]`, `[[feedback_ui_build_before_merge]]`, `[[feedback_wedge_v1_no_migration_no_backcompat]]`, `[[feedback_subagent_no_verify]]`, `[[feedback_code_review_subagent_must_checkout_pr_branch]]`, `[[feedback_no_backcompat_clean_architecture]]`, `[[feedback_hidden_vs_disabled_cta]]`, `[[feedback_green_400_light_contrast]]`, `[[feedback_strict_assert_over_silent_migration]]`
