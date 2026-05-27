---
tier: ephemeral
purpose: build
title: PR-CCJ-D2 — Calculated column workflow + ratio engine (single PR, 3 phases)
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-D2 — Calculated column workflow + ratio engine (single PR, 3 phases)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `🧪 Calculate from this column…` workflow — per-chip kebab + system-hint banner entry points → modal with 5 template families → derived chip in palette under `DERIVED FROM FORMULA`.

**Architecture:** Single PR with three internal phases. Phase 1 builds the pure engine in `@variscout/core/derived/formula/` (`FormulaBinding` types, evaluator, template registry, batch detection). Phase 2 builds `<CalculatedColumnModal>` under `Canvas/EditMode/Workflows/` (Templates tab + Custom tab with click-to-add slots + live preview + parse-success counts). Phase 3 wires per-chip kebab dispatch + `<SystemHintBanner>` + CanvasWorkspace formula derivation (mirroring D1's `derivedTimingsProfiles` pattern).

**Tech Stack:** TypeScript, React, Tailwind, Vitest, `focus-trap-react` (reused from D1).

---

## Context

Phase D1 shipped on main at `a93a2dad` (PR #225, 14 commits) on 2026-05-27. The canvas Edit mode now has step timings → Lead_time / Total_work_time / Wait_time derivation. **D1 left D2 fully scaffolded** via shared derived-chip infrastructure:

- `ColumnParsingProfile.derivationSource` union already includes `'formula'` (`packages/core/src/parser/types.ts:149-152`)
- `labelForDerivedGroup()` already uppercases dynamically — `DERIVED FROM FORMULA` works for free (`packages/ui/src/components/Canvas/EditMode/Palette/index.tsx:33-37`)
- `<ColumnChip>` `derived` prop is source-agnostic — no chip changes needed
- `<ColumnChipContextMenu>` already exists with `'calculate-from'` item placeholder (`packages/ui/src/components/Canvas/EditMode/Palette/columnChipMenuItems.ts:14`) — D2 just needs the dispatch handler
- `<CanvasWorkspace>` synthesis pattern (`derivedTimingsProfiles` + `numericValuesByColumn` merge at lines 544-587) is copy-paste-ready for `derivedFormulaProfiles`
- D1's `TODO(PR-CCJ-E1)` marker shows where to add the persistence breadcrumb

**D2's user-visible value:** A `🧪 Calculate from this column…` item on any numeric chip's `⋮` menu (and a `💡 Batch data detected. Calculate yield ratios?` system-hint banner at top of palette when mass-balance columns are detected) opens a **Calculated column modal**. The modal shows template families (Batch ratios, DPMO, Throughput, Differences, Custom) — each opens a chip-slot formula composer with live preview and parse-success counts. Saving produces a new derived chip in the palette under `DERIVED FROM FORMULA` (green tint + ✨ marker), draggable as a column from outcome/factor zones like any other numeric column.

**Spec sections consumed:** §3.1.2 (per-chip context menu — "🧪 Calculate from this column…" item on numeric columns), §3.4 (derived chips — Calculated columns under DERIVED FROM FORMULA, `Yield_pct = (GradeA_kg + GradeB_kg) / Input_kg × 100` example), §4.1 (system hint "💡 Batch data detected. Input/output mass columns found — calculate yield ratios?"), §4.3.2 (Calculated column workflow — templates, formula builder, live preview, parse-success counts, name field).

**Master plan parent:** `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` — Phase D §"PR-CCJ-D2 · Calculated column workflow + ratio engine" (5-6 days, flagged for splitting). **User direction (2026-05-27):** ship as a single PR with 3 internal phases (carve clause below) rather than master-of-master.

**Existing primitives ready to reuse (no rework needed):**

- `<ColumnChipContextMenu>` (`packages/ui/src/components/Canvas/EditMode/Palette/ColumnChipContextMenu.tsx`) + `getMenuItemsForKind` (`columnChipMenuItems.ts`) — kebab menu wired, `'calculate-from'` item exists as placeholder
- `<Palette>` `GROUP_ORDER` derived slot + `labelForDerivedGroup` dynamic header — supports FORMULA generically
- `<ColumnChip>` `derived?: boolean` + `✨` + `bg-emerald-50` — no changes
- `ColumnParsingProfile` shape with `derived?` + `derivationSource?: 'timings' | 'formula' | 'time-decomposition'`
- FocusTrap modal pattern from `<StepTimingsModal>` (`packages/ui/src/components/Canvas/EditMode/Workflows/StepTimingsModal.tsx`) — `aria-labelledby`, header `id`, tab buttons with `aria-labelledby`/`id`, save-footer disabled state, empty-state copy
- `<CanvasWorkspace>` derived synthesis pattern (`derivedTimingsProfiles` useMemo at line 544; `numericValuesByColumn` merge at line 570)
- `parseTimeValue()` + NaN-propagation pattern from `packages/core/src/derived/leadTime.ts:34-58` (mirror for formula evaluator's row-level NaN handling)
- `safeDivide` exists in `packages/core/src/stats/safeMath.ts` — reuse for division operations
- `numericValuesFor()` row-iteration pattern in CanvasWorkspace — mirror for formula evaluation

**What MUST be built (no equivalent exists):**

- `packages/core/src/derived/formula/types.ts` — `FormulaBinding` shape: `{ id, name, numerator: FormulaTerm[], denominator: FormulaTerm[], multiplier: number, templateId?: string, family?: ... }` where `FormulaTerm = { kind: 'column'; column: string; sign: '+' | '-' } | { kind: 'constant'; value: number }`
- `packages/core/src/derived/formula/evaluate.ts` — `evaluateFormulaRow(row, binding, augmentedColumns, rowIndex) => number` + `computeFormulaColumn(rows, binding, augmentedColumns) => number[] | null` (NaN-propagating, division-by-zero → NaN)
- `packages/core/src/derived/formula/templates.ts` — `FORMULA_TEMPLATES` registry of `{ id, family, label, defaultName, isAvailable, fillFromContext }`. 8 templates across 5 families.
- `packages/core/src/derived/formula/detectBatchData.ts` — heuristic on `ColumnParsingProfile[]`: scan `_kg`/`_g`/`_lb`/`_units` suffixes + `input`/`output`/`grade`/`scrap` keyword patterns → `BatchDataResult | null`
- `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx` — FocusTrap shell (mirror StepTimingsModal), Templates tab (default) + Custom tab.
- `packages/ui/src/components/Canvas/EditMode/Palette/SystemHintBanner.tsx` — reusable variant; `ParsingBanner` continues to live alongside it.
- `packages/ui/src/test-utils/formulaBinding.ts` — `createTestFormulaBinding()` factory.
- `packages/ui/src/components/Canvas/EditMode/formatFormulaPreview.ts` — `(binding, sampleRow, rowIndex) => string` returning `"(85 + 10) / 100 × 100 = 95.0"`.
- Wire `'calculate-from'` kebab dispatch in EditModeShell / CanvasWorkspace.

**No persistence in D2.** `formulaBindings: FormulaBinding[]` lives as local state in `<CanvasWorkspace>` next to `stepTimings`, mirroring D1's pattern. E1 (Charter modal) folds both into the IP blob.

---

## Approach

Single PR with **three internal phases** (mirroring D1's collapsed model):

```
Phase 1: Engine in @variscout/core/derived/formula/                     (tasks 1–4)
Phase 2: CalculatedColumnModal under Canvas/EditMode/Workflows/         (tasks 5–8)
Phase 3: Kebab handler + SystemHintBanner + CanvasWorkspace integration (tasks 9–11)
```

Subagent-driven: Sonnet implementer + Sonnet 2-stage review per task. **Opus implementer** for Tasks 6 (modal composer state) and 11 (CanvasWorkspace integration). **Opus final branch reviewer** over all 11 commits.

**Why single PR over master-of-master:** User direction (2026-05-27). D1 set the single-PR precedent; D2's engine + integration are structurally similar to D1's pattern (template-following work), with Phase 2 modal being the only genuinely new surface. Task count (~11) sits at the same upper edge as D1 (10). **Mid-execution carve clause:** if review depth slips during Phase 2 (modal complexity), the natural split is Phase 1 → Phase 2 boundary — engine PR lands first, modal+integration follows as D2.2. Orchestrator can split without redrafting.

---

## Interaction Decisions (resolved 2026-05-27 before planning)

1. **Slot UX = click-to-add with CSS fly-in animation.** No drag-and-drop in D2. Rationale: modern data tools (Sigma, Airtable, Notion, Hex, Mode) have moved to click + autocomplete; click-to-add is 1 gesture vs drag's 3, keyboard-accessible by default, avoids iOS Safari HTML5 DnD quirks. Spec's "drag chips into slots" wording is satisfied by the slot LAYOUT + chip-fly-in animation. HTML5-native drag is a reversible bolt-on for H1 if needed.
2. **Template families for V1 = 5: Batch ratios (4 sub-templates), DPMO, Throughput, Differences, Custom.** "Conditional logic for binary outcomes" (§4.3.2) is loosely-specified — deferred to V2.
3. **DPMO ships in V1** despite slightly different shape (needs `opportunities_per_unit` constant input). It's the canonical Six Sigma Measure-phase metric.
4. **`detectBatchData` heuristic** scans `_kg`/`_g`/`_lb`/`_units` suffixes + `input`/`output`/`grade`/`scrap` keyword patterns (case-insensitive). Returns `null` if no input/output pair detected.
5. **Formula evaluator returns NaN for partial rows** (mirroring D1's `computeLeadTimeColumn` pattern). Division-by-zero → NaN.
6. **Throughput template depends on D1's Lead_time** — only enabled if `numericValuesByColumn['Lead_time']` exists. Card disabled with tooltip "Capture step timings first" per `feedback_hidden_vs_disabled_cta`.
7. **SystemHintBanner is a new primitive, not an extension of ParsingBanner.** Both live in `Palette/`.
8. **Click-to-add chip selection:** A right-side mini-palette inside the modal lists available numeric columns. Clicking a chip with a slot focused adds the chip to that slot with a CSS `transform` fly-in animation (200ms ease-out).

---

## TDD task list (11 tasks total)

### Phase 1 — Engine: types + evaluator + templates + batch detection in `@variscout/core/derived/formula/`

#### Task 1 — Worktree + `FormulaBinding` types + `evaluateFormulaRow` (Sonnet implementer)

**Files:**

- Create: `packages/core/src/derived/formula/types.ts`
- Create: `packages/core/src/derived/formula/evaluate.ts`
- Create: `packages/core/src/derived/formula/index.ts`
- Create: `packages/core/src/derived/formula/__tests__/evaluate.test.ts`
- Modify: `packages/core/src/derived/index.ts` — re-export `./formula`
- Modify: `packages/core/src/index.ts` — re-export new symbols

- [ ] **Step 1: Worktree**

```bash
git fetch origin
git worktree add .worktrees/feat/wedge-v1-ccj-d-2-calc-workflow -b feat/wedge-v1-ccj-d-2-calc-workflow origin/main
```

- [ ] **Step 2: Write `types.ts`**

```typescript
export type FormulaTerm =
  | { kind: 'column'; column: string; sign: '+' | '-' }
  | { kind: 'constant'; value: number };

export type FormulaFamily = 'batchRatio' | 'dpmo' | 'throughput' | 'difference' | 'custom';

export interface FormulaBinding {
  id: string;
  name: string;
  numerator: FormulaTerm[];
  denominator: FormulaTerm[];
  multiplier: number;
  templateId?: string;
  family?: FormulaFamily;
}
```

- [ ] **Step 3: Write failing tests for `evaluateFormulaRow`**

Test cases (8 minimum):

1. Numerator-only: `binding={numerator:[{kind:'column',column:'A',sign:'+'}], denominator:[], multiplier:100}`, row `{A:5}` → `500`
2. Ratio: numerator `[A:+, B:+]`, denominator `[C:+]`, multiplier 100, row `{A:85, B:10, C:100}` → `95`
3. Division by zero → `NaN`
4. Missing cell → `NaN`
5. String cell (uncoercible) → `NaN`
6. Augmented column ref via `augmentedColumns['Lead_time'][rowIndex]` resolution
7. Constant term in denominator
8. Signed numerator (A:+ B:-) for difference shape

- [ ] **Step 4: Implement `evaluateFormulaRow`**

NaN-propagation pattern mirrors `packages/core/src/derived/leadTime.ts:34-58`. Resolve column refs from `row` first, fall back to `augmentedColumns[name][rowIndex]`. Signed sum for numerator/denominator. Division-by-zero → NaN. Empty denominator → numeratorSum × multiplier.

- [ ] **Step 5: Wire barrels + re-exports**

```typescript
// packages/core/src/derived/formula/index.ts
export * from './types';
export * from './evaluate';
```

Plus update `packages/core/src/derived/index.ts` + `packages/core/src/index.ts`.

- [ ] **Step 6: Run tests + commit**

```bash
pnpm --filter @variscout/core test -- evaluate
git add packages/core/src/derived/formula packages/core/src/derived/index.ts packages/core/src/index.ts
git commit -m "feat(wedge-v1): D2 task 1 — FormulaBinding types + evaluateFormulaRow"
```

---

#### Task 2 — `computeFormulaColumn` + augmented-column resolver (Sonnet implementer)

**Files:**

- Modify: `packages/core/src/derived/formula/evaluate.ts` — add `computeFormulaColumn`
- Create: `packages/core/src/derived/formula/__tests__/computeFormulaColumn.test.ts`

- [ ] **Step 1: Write failing tests**

1. Empty rows → `[]`
2. 3 rows, no NaN paths → 3-element number array
3. 3 rows, row 1 missing cell → `[ok, NaN, ok]`
4. `null` return when binding has empty numerator
5. Augmented column ref: rows `[{Count:10},{Count:20}]`, `augmentedColumns={Lead_time:[3600000,7200000]}`, binding `Lead_time/Count` → `[360000, 360000]`

- [ ] **Step 2: Implement**

```typescript
export function computeFormulaColumn(
  rows: ReadonlyArray<Record<string, unknown>>,
  binding: FormulaBinding,
  augmentedColumns: Record<string, number[]>
): number[] | null {
  if (binding.numerator.length === 0) return null;
  return rows.map((row, i) => evaluateFormulaRow(row, binding, augmentedColumns, i));
}
```

- [ ] **Step 3: Run tests + commit**

```bash
pnpm --filter @variscout/core test -- computeFormulaColumn
git commit -m "feat(wedge-v1): D2 task 2 — computeFormulaColumn column-level wrapper"
```

---

#### Task 3 — `detectBatchData` heuristic + template registry shell (Sonnet implementer)

**Files:**

- Create: `packages/core/src/derived/formula/detectBatchData.ts`
- Create: `packages/core/src/derived/formula/templates.ts`
- Create: `packages/core/src/derived/formula/__tests__/detectBatchData.test.ts`
- Create: `packages/core/src/derived/formula/__tests__/templates.test.ts`
- Modify: `packages/core/src/derived/formula/index.ts` + parent barrels

- [ ] **Step 1: Failing tests for `detectBatchData`**

6 cases: empty profiles, no suffix matches, full batch shape (`Input_kg`, `GradeA_kg`, `GradeB_kg`, `Scrap_kg`), case-insensitive matching, non-numeric `_kg` excluded, single-column-no-pair → null.

- [ ] **Step 2: Implement `detectBatchData(profiles): BatchDataResult | null`**

```typescript
export interface BatchDataResult {
  inputColumns: string[];
  outputColumns: string[];
  scrapColumns: string[];
  isLikelyBatch: boolean;
}
```

Suffix regex: `_(kg|g|lb|units|tonnes?)\b` (case-insensitive). Keyword scan: `input` → inputColumns; `output|grade` → outputColumns; `scrap|waste|loss` → scrapColumns. Returns `null` if `inputColumns.length === 0 || outputColumns.length === 0`.

- [ ] **Step 3: Failing tests for `FORMULA_TEMPLATES` registry**

```typescript
export interface TemplateContext {
  batchData: BatchDataResult | null;
  hasLeadTime: boolean;
  numericColumns: string[];
}

export interface FormulaTemplate {
  id: string;
  family: FormulaFamily;
  label: string;
  description: string;
  defaultName: string;
  isAvailable: (ctx: TemplateContext) => boolean;
  fillFromContext: (ctx: TemplateContext, sourceColumn?: string) => FormulaBinding;
}

export const FORMULA_TEMPLATES: FormulaTemplate[];
```

8 template entries: `batchRatio.totalYield`, `batchRatio.gradeA`, `batchRatio.scrap`, `batchRatio.loss`, `dpmo`, `throughput`, `difference`, `custom`. Test `totalYield.fillFromContext` with batchData → binding with correct numerator/denominator/multiplier. Test `throughput.isAvailable({hasLeadTime:false})` → false.

- [ ] **Step 4: Implement + wire barrels + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 3 — detectBatchData heuristic + FORMULA_TEMPLATES registry"
```

---

#### Task 4 — DPMO + Throughput + Differences template specifics + round-trip (Sonnet implementer)

**Files:**

- Modify: `packages/core/src/derived/formula/templates.ts` — flesh out DPMO/Throughput/Difference `fillFromContext` + edge cases
- Modify: `packages/core/src/derived/formula/__tests__/templates.test.ts`

- [ ] **Step 1: Failing tests**

1. DPMO `opportunitiesPerUnit=5` override → constant term `value: 5`; row `{Defects:3, Samples:100}` → `6000`
2. Throughput when Lead_time exists → binding numerator `[{Count,+}]`, denominator `[{Lead_time,+}]`, multiplier `3_600_000` (units/hour)
3. Difference template → numerator `[A:+, B:-]`, denominator empty, multiplier 1; row `{A:10, B:7}` → 3
4. Round-trip: open template binding → templateId + family preserved + all terms preserved
5. `fillFromContext` edge case: no matching columns → template defaults to first numeric column

- [ ] **Step 2: Implement + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 4 — DPMO + Throughput + Difference template specifics"
```

---

### Phase 2 — `CalculatedColumnModal` under `Canvas/EditMode/Workflows/`

#### Task 5 — Modal skeleton + Templates tab card grid (Sonnet implementer)

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/Workflows/__tests__/CalculatedColumnModal.test.tsx`
- Create: `packages/ui/src/test-utils/formulaBinding.ts`

- [ ] **Step 1: Factory + failing tests**

```typescript
// packages/ui/src/test-utils/formulaBinding.ts
let counter = 0;
export function createTestFormulaBinding(overrides: Partial<FormulaBinding> = {}): FormulaBinding {
  counter += 1;
  return {
    id: `formula-test-${counter}`,
    name: `Formula_${counter}`,
    numerator: [{ kind: 'column', column: 'A', sign: '+' }],
    denominator: [],
    multiplier: 1,
    family: 'custom',
    ...overrides,
  };
}
```

Test cases:

- Renders inside `FocusTrap`, `role="dialog"`, `aria-labelledby="calc-column-modal-title"`
- Header copy: "Calculate a new column"
- Escape + backdrop click both call `onClose`
- **Templates** tab `aria-selected="true"` by default; **Custom formula** tab present
- Templates tab: card grid showing all `isAvailable(ctx)` templates
- Each card: family label, description, `Use template →` button
- Throughput card disabled with `title="Capture step timings first"` when `hasLeadTime:false`
- Batch ratio cards highlighted (`bg-emerald-50`) when `batchData != null`

- [ ] **Step 2: Implement modal shell + Templates tab**

Modal props:

```typescript
export interface CalculatedColumnModalProps {
  sourceColumn?: string;
  rawProfiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  rows: ReadonlyArray<Record<string, unknown>>;
  hasLeadTime: boolean;
  existingDerivedNames: string[];
  onSave: (binding: FormulaBinding) => void;
  onClose: () => void;
}
```

Mirror StepTimingsModal's FocusTrap shell, tab `aria-labelledby`/`id`, max-width sizing.

- [ ] **Step 3: Tests green + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 5 — CalculatedColumnModal skeleton + Templates tab card grid"
```

---

#### Task 6 — Custom formula tab: slots + click-to-add + multiplier + name field (Opus implementer)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx` — Custom tab
- Modify: tests

- [ ] **Step 1: Failing tests**

- Custom tab: numerator slot (empty copy `Click a column to add to numerator`), denominator slot, multiplier input (default 1), name input
- Side palette: list of numeric columns as buttons (raw + augmented like Lead_time)
- Click chip with numerator slot focused → chip added to numerator (sign `+`); same for denominator
- Slotted chip shows `×` close; click removes
- Slot focus toggle: clicking slot sets focus (2px outline); chip clicks add to focused slot
- Sign toggle per slotted chip (click `+`/`-` to flip)
- Constant-term inline input on denominator slot (for DPMO-shaped templates)
- Save disabled when name empty OR numerator empty
- Save calls `onSave(binding)` with `family: 'custom'`, `templateId: undefined`

- [ ] **Step 2: Implement state + slot UX**

State: `{ name, numerator: FormulaTerm[], denominator: FormulaTerm[], multiplier, focusedSlot, opportunitiesPerUnit? }`.

CSS fly-in animation: render added chip with initial `transform: translate(dx, dy)` set to delta from palette to slot, then `requestAnimationFrame(() => element.style.transform = 'translate(0,0)')`. CSS transition `transform 200ms ease-out`. Skip animation in jsdom (no `transform` support).

- [ ] **Step 3: Tests green + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 6 — Custom formula tab + click-to-add slots + fly-in animation"
```

---

#### Task 7 — Template pre-fill + live preview + parse-success counts (Sonnet implementer)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/formatFormulaPreview.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/__tests__/formatFormulaPreview.test.ts`

- [ ] **Step 1: Failing tests for `formatFormulaPreview`**

`formatFormulaPreview(binding, row, rowIndex, augmentedColumns) => string`:

- Yield-shape: row `{A:85, B:10, C:100}`, binding `(A+B)/C × 100` → `"(85 + 10) / 100 × 100 = 95.0"`
- NaN result → `"... = —"`
- Numerator-only: row `{A:5}`, binding `A × 100` → `"5 × 100 = 500.0"`
- Constant term: `(Defects)/(Samples×5) × 1000000` row `{Defects:3,Samples:100}` → `"3 / (100 × 5) × 1,000,000 = 6,000.0"`

- [ ] **Step 2: Failing tests for modal integration**

- Click `Use template →` on Total yield % card → pre-fills Custom tab AND switches to Custom
- DPMO card → pre-fills + shows `opportunities_per_unit` constant input near denominator slot
- Live preview section: shows up to 3 sample rows with computed text+result
- Parse-success counts: `"432 / 432 rows compute"` + (when applicable) `"K rows with division by zero"` + (when applicable) `"M rows with missing cells"`

- [ ] **Step 3: Implement + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 7 — template pre-fill + live preview + parse-success counts"
```

---

#### Task 8 — Save footer + name validation + empty state (Sonnet implementer)

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/Workflows/CalculatedColumnModal.tsx`

- [ ] **Step 1: Failing tests**

- Save footer: `Save · "<Name>" →` when valid; disabled when name empty OR numerator empty
- Name auto-fills from template's `defaultName` on template pick; user override preserved (auto-fill does NOT overwrite user value)
- Duplicate name guard: matches existing raw OR derived column → save disabled + inline copy `"Name already used"`
- Cancel button → `onClose` (no `onSave`)
- Empty state in Templates tab when `numericColumns.length === 0`: copy `"No numeric columns yet. Paste data with numbers to use calculated columns."`

- [ ] **Step 2: Implement + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 8 — save footer + name validation + empty state"
```

---

### Phase 3 — Per-chip menu handler + SystemHintBanner + CanvasWorkspace integration

#### Task 9 — `<SystemHintBanner>` primitive + Palette integration (Sonnet implementer)

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/Palette/SystemHintBanner.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/Palette/__tests__/SystemHintBanner.test.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx` — render hints above chip groups

- [ ] **Step 1: Failing tests for SystemHintBanner**

- `role="region"` + `aria-label="System hint"`
- Props: `{ kind: 'batch' | 'time' | 'parsing'; message: string; ctaLabel?: string; onCta?: () => void; onDismiss?: () => void }`
- Distinct backgrounds per `kind`: batch → `bg-emerald-50`, time → `bg-cyan-50`, parsing → `bg-amber-50` (paired text colors per `feedback_green_400_light_contrast`)
- 💡 icon prefix for batch/time; ⚠ for parsing
- `ctaLabel` button calls `onCta` on click
- `onDismiss` renders `×` button that calls handler

- [ ] **Step 2: Failing tests for Palette integration**

- Palette accepts `systemHints: Array<{id, kind, message, ctaLabel?, onCta?}>` (default `[]`)
- Renders each hint as `<SystemHintBanner>` above chip groups
- Empty array → no banners rendered (no wrapper)

- [ ] **Step 3: Implement + commit**

```bash
git commit -m "feat(wedge-v1): D2 task 9 — SystemHintBanner primitive + Palette integration"
```

---

#### Task 10 — Per-chip kebab `calculate-from` dispatch + modal wiring (Sonnet implementer)

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — thread `onChipContextMenuSelect` prop
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx`
- Modify: `packages/ui/src/components/Canvas/EditMode/Palette/ColumnChip.tsx` (if needed for menu dispatch wiring)

- [ ] **Step 1: Failing tests**

- Clicking ⋮ on a numeric chip → menu opens with `calculate-from` enabled
- Clicking `calculate-from` → CalculatedColumnModal opens with `sourceColumn=` set
- Modal `onSave` adds `FormulaBinding` to local `formulaBindings` state
- Modal `onClose` clears state
- Escape closes modal

- [ ] **Step 2: Implement**

CanvasWorkspace additions:

```typescript
const [formulaBindings, setFormulaBindings] = React.useState<FormulaBinding[]>([]);
const [calcModalOpen, setCalcModalOpen] = React.useState<{ sourceColumn?: string } | null>(null);
const onChipContextMenuSelect = React.useCallback((columnName: string, itemId: string) => {
  if (itemId === 'calculate-from') setCalcModalOpen({ sourceColumn: columnName });
}, []);
// TODO(PR-CCJ-E1): persist formulaBindings to ImprovementProject via Charter modal commit.
```

Thread `onChipContextMenuSelect` through EditModeShell → Palette → ColumnChipContextMenu's `onItemSelect`. Render `<CalculatedColumnModal>` conditionally.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(wedge-v1): D2 task 10 — kebab calculate-from dispatch + modal wiring"
```

---

#### Task 11 — CanvasWorkspace formula derivation + batch-hint banner + e2e (Opus implementer)

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — derivation + system hints
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [ ] **Step 1: Failing e2e tests**

- With batch data (`Input_kg`, `GradeA_kg`, `GradeB_kg`): banner appears, "💡 Batch data detected..."
- Click banner CTA → modal opens with Total yield % card highlighted (`data-prefilled-template="batchRatio.totalYield"` or similar)
- Click `Use template →` → Custom tab pre-fills → Save → modal closes → palette shows `Yield_pct` chip under `DERIVED FROM FORMULA` (green tint + ✨)
- Drag `Yield_pct` chip to outcome zone → behaves like numeric column
- Without batch data: no banner; kebab path reaches modal; same save outcome
- Throughput formula: derived column uses raw counts + D1's Lead_time augmentation

- [ ] **Step 2: Implement**

```typescript
// In CanvasWorkspace
const batchDataResult = React.useMemo(() => detectBatchData(rawProfiles), [rawProfiles]);

const systemHints = React.useMemo(() => {
  const hints: SystemHint[] = [];
  if (batchDataResult) {
    hints.push({
      id: 'batch-detected',
      kind: 'batch',
      message: '💡 Batch data detected. Input/output mass columns found — calculate yield ratios?',
      ctaLabel: 'Calculate yield ratios →',
      onCta: () => setCalcModalOpen({ prefilledTemplateId: 'batchRatio.totalYield' }),
    });
  }
  return hints;
}, [batchDataResult]);

const augmentedColumnsForFormulas = React.useMemo<Record<string, number[]>>(() => {
  const out: Record<string, number[]> = {};
  if (leadTimeColumn !== null) out['Lead_time'] = leadTimeColumn;
  if (totalWorkTimeColumn !== null) out['Total_work_time'] = totalWorkTimeColumn;
  if (waitTimeColumn !== null) out['Wait_time'] = waitTimeColumn;
  return out;
}, [leadTimeColumn, totalWorkTimeColumn, waitTimeColumn]);

const formulaDerivedColumns = React.useMemo<Record<string, number[]>>(() => {
  const out: Record<string, number[]> = {};
  for (const binding of formulaBindings) {
    const col = computeFormulaColumn(rawData, binding, augmentedColumnsForFormulas);
    if (col !== null) out[binding.name] = col;
  }
  return out;
}, [formulaBindings, rawData, augmentedColumnsForFormulas]);

const derivedFormulaProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
  return formulaBindings
    .filter(b => formulaDerivedColumns[b.name] != null)
    .map(b => ({
      columnName: b.name,
      status: 'ok' as const,
      confidence: 100,
      primary: { kind: 'numeric' as const, label: 'numeric · derived', detail: {} },
      alternatives: [],
      transformedSamples: [],
      derived: true,
      derivationSource: 'formula' as const,
    }));
}, [formulaBindings, formulaDerivedColumns]);
```

Merge `derivedFormulaProfiles` into `editModeProfiles`. Extend `numericValuesByColumn` to include NaN-filtered `formulaDerivedColumns`. Wire `systemHints` prop down through EditModeShell → Palette.

- [ ] **Step 3: Run full verification + commit**

```bash
pnpm --filter @variscout/core test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
git commit -m "feat(wedge-v1): D2 task 11 — CanvasWorkspace formula derivation + batch-hint banner + e2e"
```

---

## Verification (after all 11 tasks)

1. `pnpm --filter @variscout/core test` — new `formula/evaluate`, `formula/detectBatchData`, `formula/templates` suites green
2. `pnpm --filter @variscout/ui test` — new `CalculatedColumnModal`, `SystemHintBanner`, extended `CanvasWorkspace` e2e tests green; no D1 regressions
3. `pnpm --filter @variscout/ui build` — clean (catches type drift per `feedback_ui_build_before_merge`)
4. `pnpm test` (turbo) — global suites green
5. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
6. **Spec self-check** (browser walks skipped per `feedback_wedge_v1_no_migration_no_backcompat`):
   - With batch data: banner appears, CTA opens modal at Total yield %, save creates `Yield_pct` chip
   - Without batch data: kebab "Calculate from this column…" opens modal at Templates tab
   - DPMO flow: DPMO card → Custom tab + `opportunities_per_unit` constant → save creates derived chip
   - Throughput card disabled until D1 step timings set; tooltip explains
   - Live preview updates as user adds/removes terms
   - Parse-success counts show correctly for NaN/div-by-zero rows
   - Drag derived `Yield_pct` to outcome zone → behaves like numeric column
7. **Final branch review by Opus** (must STEP 0 `git checkout` per `feedback_code_review_subagent_must_checkout_pr_branch`) over all 11 commits

## Out of scope (D2 as a whole)

Deferred to **D3 (time-as-factors):** `DERIVED FROM TIME` palette group (auto-supported by labelForDerivedGroup; D3 adds the engine).

Deferred to **E1 (Charter modal):** Persistence of `formulaBindings` (and D1's `stepTimings`) to the IP blob. Edit/recompute UX for already-saved formulas.

Deferred to **G1 (Probability plot inflection binning):** Binning as a derived chip (different workflow, lives in Explore).

Deferred to **H1 (polish):** HTML5-native drag enhancement on slots (if user feedback demands). SystemHintBanner for time-decomposition detection (D3 surface).

Deferred to **V2:** Conditional logic for binary outcomes template family (needs separate brainstorm). Drag-and-drop into slots. Cross-row aggregation formulas.

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-d-2-calc-workflow/` — main session stays at repo root
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer, with model overrides:
  - **Task 6 (Custom formula tab + click-to-add + fly-in animation):** Opus implementer (multi-control state coordination, animation precision)
  - **Task 11 (CanvasWorkspace integration + e2e):** Opus implementer (multi-file integration, augmented column resolution, derived-column merging, system-hint banner wiring)
  - Tasks 1, 2, 3, 4, 5, 7, 8, 9, 10: Sonnet implementer
- **Reviewers:** Sonnet spec + Sonnet code-quality per task; Opus reserved for final branch pass
- **Final branch review:** Opus on full diff (all 11 commits); must STEP 0 `git checkout` PR branch
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`; per `feedback_preserve_commit_history`)
- **Subagent constraints forwarded:** NEVER `--no-verify`; NEVER add migration helpers / back-compat shims; operate ONLY in assigned worktree; skip browser walks for wedge V1; do NOT rename preserved identifiers from CLAUDE.md
- **After merge:** update `[[canvas-connection-journey]]` memory; mark task #31 completed

## Decisions (documented, not punted)

1. **Single PR over master-of-master** — user direction 2026-05-27. D1 set precedent. Carve clause at Phase 1 → Phase 2 boundary if review depth slips.
2. **Click-to-add slot UX over drag-and-drop** — modern formula builders (Sigma, Airtable, Notion, Hex, Mode) use click + autocomplete; spec's "drag chips into slots" satisfied by slot LAYOUT + CSS fly-in. HTML5-native drag is a reversible bolt-on for H1.
3. **`FormulaBinding` is constrained-shape, not arbitrary AST** — `{ numerator, denominator, multiplier }` covers all 5 V1 template families. Per YAGNI + spec's concrete examples.
4. **`FormulaTerm` is a discriminated union** — matches D1's `StepTimingBinding` pattern.
5. **NaN-propagation through evaluator** — mirrors D1's `computeLeadTimeColumn`.
6. **DPMO multiplier 1_000_000; opportunities_per_unit default 1** — user-editable inline constant.
7. **Throughput depends on D1's Lead_time** — `isAvailable(ctx)` returns false if `!ctx.hasLeadTime`. Card disabled with concrete actionable copy.
8. **`SystemHintBanner` is a new primitive, not an extension of `ParsingBanner`** — cleaner API surface.
9. **`detectBatchData` heuristic is greedy** — false positives acceptable (banner dismissible, templates editable); false negatives are bigger pedagogy loss.
10. **No persistence in D2** — `formulaBindings` is local React state. E1 folds into IP blob.
11. **Conditional logic deferred to V2** — spec §4.3.2 loose; needs own brainstorm.

## Related

- Canvas Connection Journey spec — `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` (§3.1.2, §3.4, §4.1, §4.3.2)
- Canvas Connection Journey master plan — `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` (Phase D)
- D1 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-1-step-timings.md`
- Memory: `[[canvas-connection-journey]]`, `[[wedge-v1]]`, `[[feedback_subagent_driven_default]]`, `[[feedback_slice_size_cap]]`, `[[feedback_atomic_sweep_one_dispatch]]`, `[[feedback_one_worktree_per_agent]]`, `[[feedback_preserve_commit_history]]`, `[[feedback_ui_build_before_merge]]`, `[[feedback_wedge_v1_no_migration_no_backcompat]]`, `[[feedback_subagent_no_verify]]`, `[[feedback_code_review_subagent_must_checkout_pr_branch]]`, `[[feedback_hidden_vs_disabled_cta]]`, `[[feedback_green_400_light_contrast]]`, `[[feedback_strict_assert_over_silent_migration]]`
