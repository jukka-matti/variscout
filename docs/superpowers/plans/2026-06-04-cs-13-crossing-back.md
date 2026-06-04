---
tier: ephemeral
purpose: build
title: 'PR-CS-13 — The crossing-back: Analyze → scoped Explore'
status: active
date: 2026-06-04
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-13 — The crossing-back: Analyze → scoped Explore

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From a hypothesis card or a focused factor glyph on the Analyze Wall, one click lands the analyst in the Explore tab with the charts pre-scoped to that entity's local y=f(x) — turning the Frame→Explore→Analyze pipeline into a true loop (spec §4.0a).

**Architecture:** Almost entirely wiring on proven primitives. `navigateToExploreForChip` (the shipped scope-writer, 2 production callers in both apps' `FrameView.handleChipExploreJump`) gains one optional field — `outcomeColumn` on the `factor` variant — so a Wall crossing can set **both** Y and the boxplot factor (the Wall knows its outcome; the Process-tab chips don't). `WallCanvas` gains one optional callback prop `onExploreFactor(factorColumn)`, threaded to two new → affordances: a `foreignObject`+HTML-button on the `HypothesisCard` header (the `OneStepAwayBadge` idiom) and one revealed on the focused `FactorGlyph`. Both are **data-presence-gated** (owner-locked): no → when the factor is absent from `activeColumns` — the CS-11 `MeasurementPlanChip` owns the awaiting-collection case ("explore what exists; plan what doesn't"). Apps wire the callback exactly like the existing chip path (`navigateToExploreForChip` + `showExplore()`), and Azure's existing **unscoped** Evidence-Map drill (`handleMapDrillDown`: `setHighlightedFactor` + bare `showExplore()`) is retrofitted through the same scoped path (owner-locked) so the two Analyze→Explore gestures can't diverge.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand (`analysisScopeStore`, `panelsStore`); Vitest + happy-dom + React Testing Library; `@variscout/{core,stores,ui}` + `apps/{azure,pwa}`.

---

## Grounded constraints (verified 2026-06-04, 6-reader fan-out + adversarial verify + controller spot-checks)

- **Scope-consumption reality:** Azure Explore (`apps/azure/src/components/Dashboard.tsx:465-478`) reverse-mirrors **only** `yColumn` + `boxplotFactor` from `useAnalysisScopeStore` into chart state. `stepId` is inert (`TODO(lv1-e-step-mirror)` at `Dashboard.tsx:480-482`); `categoricalFilters` render in the scope chip only — **no chart reads them**. So the crossing carries y+x and nothing else (owner-locked). Do NOT write `categoricalFilters` — the chip would claim a scope the charts don't honor.
- **PWA Explore does not read the scope store at all** — PWA `Dashboard.tsx` chart state comes from `requestedFactor` (active-IP context) and local state; the store feeds only `PersistentScopeChip` in `apps/pwa/src/components/layout/AppHeader.tsx:177`. This is the pre-existing deferred state (`DEFERRED(lv1-pwa-mount)` at PWA `Dashboard.tsx:676`). PWA CS-13 wiring is byte-identical to the existing PWA chip path and inherits the same chip-only limitation. **Do not attempt to fix the PWA mirror in this PR.**
- **Hypothesis → factor mapping:** `deriveHypothesisFactors(hub, findings)` (`packages/core/src/findings/hypothesisTestPlan.ts:100`, exported from `@variscout/core/findings`) returns the hub's condition columns, falling back to linked findings' `activeFilters` columns. The card crossing uses element `[0]` (primary factor). `WallCanvas` already imports it (line 42).
- **Glyph namespace trap:** `FactorGlyph`'s DOI node id is `factor:${factorKey}` (namespaced). The explore callback must carry the **raw** `factorKey` — designed away by having the glyph call back with its own `factorKey` prop, never `nodeId`. A negative-control test enforces this.
- **Nesting idiom:** card root and glyph root are SVG `<g role="button">`. The in-card interactive idiom is `OneStepAwayBadge` (`packages/ui/src/components/AnalyzeWall/OneStepAwayBadge.tsx:49-69`): `<foreignObject>` + real HTML `<button>` + `stopPropagation`. Both new affordances follow it. (The HTML button-in-button rule isn't violated — the outer is an SVG `g`, and the precedent ships.)
- **`columnSet`** (`WallCanvas.tsx:417-420`): `Set<string> | undefined` from `activeColumns` — the existing missing-column gate. The explore gate reuses it: when `undefined` (legacy callers), be permissive; both app mounts always pass `activeColumns`.
- **Seam-test reality:** only the `evaluate.seam`/`disconfirmFusion.seam` suites render the REAL `WallCanvas`; `emptyLineage`/`scopePerIP`/`mapwall` stub it. The load-bearing render-through test is a NEW seam file per app modeled on `AnalyzeWorkspace.evaluate.seam.test.tsx` (harness component + real WallCanvas + real stores). The mapdrill retrofit is asserted in `AnalyzeWorkspace.mapwall.test.tsx`, which captures `AnalyzeMapView` props (`capturedMapViewProps`, line 121-126) and does NOT mock `@variscout/stores` — the real `useAnalysisScopeStore` is assertable there.
- **i18n:** one new key `wall.exploreJump.aria` in the CLOSED `MessageCatalog` interface (`packages/core/src/i18n/types.ts`) + `en.ts` + 31 English-placeholder catalogs (generic completeness test enforces) + the hand-maintained `wallKeys` array (`packages/core/src/i18n/__tests__/index.test.ts:159-210`) to be load-bearing.
- **Mobile:** `WallCanvas` self-gates below 768px to `MobileCardList` — the SVG affordances are desktop-only automatically. No `MobileCardList` action in V1 (owner-locked).
- **No persistence:** scope is session-only (CS-0b deferred). Do not persist the crossed-back scope.

## Owner-locked design (2026-06-04)

1. **Affordance:** → on the focused `FactorGlyph` + → on the `HypothesisCard` header (top-right). Not on stat-triad rows.
2. **Hypothesis scope rule:** carry y+x only (`setY(outcome)` + `setBoxplotFactor(primaryFactor)`); data-presence-gated; WHERE-carry (condition→categoricalFilters + chart mirror) logged as a follow-up, not built.
3. **Evidence-Map drill:** retrofit `handleMapDrillDown` through the scoped path (keep the `highlightedFactor` PI hint).
4. **Parity:** PWA desktop Wall wired identically; skip mobile; PWA chart-mirror stays the logged lv1-pwa-mount deferral.

## File structure

| File                                                                                             | Change                                                                                           |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `packages/core/src/i18n/types.ts`                                                                | +1 key `'wall.exploreJump.aria'`                                                                 |
| `packages/core/src/i18n/messages/*.ts` (32 files)                                                | +1 line each                                                                                     |
| `packages/core/src/i18n/__tests__/index.test.ts`                                                 | +1 wallKeys entry, +1 en-value assertion                                                         |
| `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`                | optional `outcomeColumn` on the `factor` variant                                                 |
| `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts` | +2 tests                                                                                         |
| `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx`                                         | optional `onExplore` + `exploreAriaLabel`; → button when focused                                 |
| `packages/ui/src/components/AnalyzeWall/HypothesisCard.tsx`                                      | optional `onExplore` + `exploreAriaLabel`; header → button                                       |
| `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`                                          | new `onExploreFactor?` prop; `primaryFactorByHub` memo; threading + gating                       |
| `packages/ui/src/components/AnalyzeWall/__tests__/`                                              | glyph/card/gating tests                                                                          |
| `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`                                          | `handleExploreFactor` + prop + `handleMapDrillDown` retrofit                                     |
| `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx`          | NEW — real-WallCanvas render-through seam                                                        |
| `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`                   | +1 retrofit test                                                                                 |
| `apps/pwa/src/components/views/AnalyzeView.tsx`                                                  | `handleExploreFactor` + prop                                                                     |
| `apps/pwa/src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx`                  | NEW — PWA seam                                                                                   |
| `docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md`                      | sub-plan link + grounding record (pre-committed to main with this plan; DELIVERED line at merge) |
| `docs/investigations.md`                                                                         | WHERE-carry follow-up entry                                                                      |

**Branch:** `feat/cs-13-crossing-back` in its own worktree `.worktrees/feat-cs-13-crossing-back` (one worktree per agent).

---

### Task 1: i18n key `wall.exploreJump.aria` (mechanical — Haiku/Sonnet)

**Files:**

- Modify: `packages/core/src/i18n/types.ts` (near `'wall.factorGlyph.aria'`, line ~965)
- Modify: `packages/core/src/i18n/messages/en.ts` (near `'wall.factorGlyph.aria'`, line ~886) + the 31 other catalogs (`ar bg cs da de el es …`) at the matching position
- Modify: `packages/core/src/i18n/__tests__/index.test.ts` (wallKeys array ends ~line 210; en-value block ~line 212)

- [ ] **Step 1: Write the failing test additions**

In `packages/core/src/i18n/__tests__/index.test.ts`, append to the `wallKeys` array (after `'wall.evidence.contributingFactors',`):

```ts
    // CS-13 crossing-back
    'wall.exploreJump.aria',
```

And in the `it('has English values for all wall keys')` block, add:

```ts
expect(getMessage('en', 'wall.exploreJump.aria')).toBe('Open {factor} in Explore');
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @variscout/core test -- i18n`
Expected: FAIL — `wall.exploreJump.aria` missing from catalogs / en value undefined.

- [ ] **Step 3: Add the key**

`packages/core/src/i18n/types.ts`, after `'wall.factorGlyph.aria': string;`:

```ts
  /** CS-13 crossing-back — aria label for the Wall → Explore jump buttons. */
  'wall.exploreJump.aria': string;
```

`packages/core/src/i18n/messages/en.ts`, after `'wall.factorGlyph.aria': …`:

```ts
  'wall.exploreJump.aria': 'Open {factor} in Explore',
```

Then the same line in ALL 31 other catalog files (English placeholder — the shipped convention, cf. `fi.ts:872` carrying English for `wall.factorGlyph.aria`). Insert adjacent to each catalog's `'wall.factorGlyph.aria'` line.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @variscout/core test -- i18n`
Expected: PASS (the generic completeness test confirms all 32 catalogs).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/i18n
git commit -m "feat(i18n): add wall.exploreJump.aria for the CS-13 crossing-back affordances"
```

---

### Task 2: `navigateToExploreForChip` — optional `outcomeColumn` on the factor variant

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`
- Test: `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`

- [ ] **Step 1: Write the failing tests** (append to the existing describe; the suite's pattern is `useAnalysisScopeStore.setState(getAnalysisScopeInitialState())` in `beforeEach` + `vi.fn()` callbacks):

```ts
it('factor target with outcomeColumn sets BOTH yColumn and boxplotFactor (CS-13 crossing-back)', () => {
  const onNavigate = vi.fn();
  navigateToExploreForChip(
    { kind: 'factor', columnName: 'Vessel', outcomeColumn: 'Diameter' },
    onNavigate
  );
  expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
  expect(useAnalysisScopeStore.getState().yColumn).toBe('Diameter');
  expect(onNavigate).toHaveBeenCalledTimes(1);
});

it('factor target without outcomeColumn leaves an existing yColumn untouched (chip-path regression guard)', () => {
  useAnalysisScopeStore.setState({ yColumn: 'Existing' });
  const onNavigate = vi.fn();
  navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);
  expect(useAnalysisScopeStore.getState().yColumn).toBe('Existing');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- navigateToExploreForChip`
Expected: FAIL — tsc/type error on `outcomeColumn` (unknown property) or yColumn undefined.

- [ ] **Step 3: Implement**

```ts
export type ChipNavigationTarget =
  | { kind: 'outcome'; columnName: string; stepId?: string }
  | {
      kind: 'factor';
      columnName: string;
      stepId?: string;
      /**
       * CS-13 crossing-back — when the firing surface knows the investigation
       * outcome (the Analyze Wall does; the Process-tab chips don't), carry it
       * so Explore lands on the full local y=f(x), not factor-vs-whatever-Y-
       * Explore-last-had. Optional: omitting preserves chip-path behavior.
       */
      outcomeColumn?: string;
    }
  | { kind: 'step'; stepId: string };
```

and in the `case 'factor':` branch, before `setBoxplotFactor`:

```ts
    case 'factor':
      if (target.outcomeColumn) scope.setY(target.outcomeColumn);
      scope.setBoxplotFactor(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
```

- [ ] **Step 4: Run to verify all pass (including the 6 existing tests — the regression guard)**

Run: `pnpm --filter @variscout/ui test -- navigateToExploreForChip`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/handlers
git commit -m "feat(ui): navigateToExploreForChip factor target carries optional outcomeColumn (CS-13)"
```

---

### Task 3: the two → affordances (`FactorGlyph` + `HypothesisCard`)

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCard.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/FactorGlyph.test.tsx` (extend existing; create if absent)
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCard.test.tsx` (extend existing; create if absent)

Both affordances follow the `OneStepAwayBadge` idiom (`OneStepAwayBadge.tsx:49-69`): `<foreignObject>` + HTML `<button>` + `stopPropagation` — the shipped pattern for interactive elements inside the Wall's SVG `role="button"` groups.

- [ ] **Step 1: Write the failing glyph tests**

```tsx
describe('CS-13 explore affordance', () => {
  it('renders the → button only when focused AND onExplore is provided', () => {
    const { rerender } = render(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused
          onExplore={vi.fn()}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    expect(screen.getByTestId('factor-glyph-explore-Vessel')).toBeInTheDocument();
    rerender(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused={false}
          onExplore={vi.fn()}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    expect(screen.queryByTestId('factor-glyph-explore-Vessel')).toBeNull();
  });

  it('fires onExplore with the RAW factorKey — not the factor:-namespaced node id — and does NOT fire onFocus', () => {
    const onExplore = vi.fn();
    const onFocus = vi.fn();
    render(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused
          onFocus={onFocus}
          onExplore={onExplore}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    fireEvent.click(screen.getByTestId('factor-glyph-explore-Vessel'));
    expect(onExplore).toHaveBeenCalledWith('Vessel'); // negative control:
    expect(onExplore).not.toHaveBeenCalledWith('factor:Vessel'); // the namespace trap
    expect(onFocus).not.toHaveBeenCalled(); // stopPropagation holds
  });

  it('renders no → button when onExplore is omitted (legacy callers unchanged)', () => {
    render(
      <svg>
        <FactorGlyph {...baseProps} focused />
      </svg>
    );
    expect(screen.queryByTestId('factor-glyph-explore-Vessel')).toBeNull();
  });
});
```

with `baseProps` (align names with the existing suite's fixture if one exists):

```tsx
const baseProps = {
  factorKey: 'Vessel',
  x: 100,
  y: 50,
  opacity: 1,
  doi: 1,
  focused: false,
  ariaLabel: 'Focus factor Vessel',
  onFocus: vi.fn(),
};
```

- [ ] **Step 2: Write the failing card tests**

```tsx
describe('CS-13 explore affordance', () => {
  it('renders the header → button when onExplore is provided; click fires onExplore, NOT onSelect', () => {
    const onExplore = vi.fn();
    const onSelect = vi.fn();
    render(
      <svg>
        <HypothesisCard
          {...baseCardProps}
          onSelect={onSelect}
          onExplore={onExplore}
          exploreAriaLabel="Open SHIFT in Explore"
        />
      </svg>
    );
    const btn = screen.getByTestId('hub-explore-jump');
    fireEvent.click(btn);
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled(); // stopPropagation negative control
  });

  it('renders no → button when onExplore is omitted', () => {
    render(
      <svg>
        <HypothesisCard {...baseCardProps} />
      </svg>
    );
    expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
  });
});
```

`baseCardProps` must include a `hub` built with `createHypothesis('Shift drives it', '')` from `@variscout/core/findings` — the factory is POSITIONAL (`name, synthesis, findingIds?, investigationId?`); spread overrides for `id`/`condition` (factory + spread, never a bare literal — ui/CLAUDE.md test-fixture rule) — plus `displayStatus: 'proposed'`, `x: 140`, `y: 0`.

- [ ] **Step 3: Run to verify both fail**

Run: `pnpm --filter @variscout/ui test -- AnalyzeWall`
Expected: FAIL — unknown props / missing testids.

- [ ] **Step 4: Implement the glyph affordance**

In `FactorGlyphProps`, after `onFocus`:

```ts
  /**
   * CS-13 crossing-back — when provided AND the glyph is focused, renders a →
   * jump button beside the glyph. Fired with the RAW factorKey (never the
   * `factor:`-namespaced DOI node id). Parent gates on data presence.
   */
  onExplore?: (factorKey: string) => void;
  /** Pre-formatted aria label for the → button (`wall.exploreJump.aria`). */
  exploreAriaLabel?: string;
```

Inside the root `<g>`, after the contribution-bar block (glyph-local coords are 0..150 × 0..44):

```tsx
{
  focused && onExplore && (
    <foreignObject x={GLYPH_W + 4} y={(GLYPH_H - 24) / 2} width={26} height={24} data-no-wall-pan>
      <button
        type="button"
        data-testid={`factor-glyph-explore-${factorKey}`}
        aria-label={exploreAriaLabel}
        className="flex h-full w-full items-center justify-center rounded border border-edge bg-surface-secondary text-xs text-content-muted hover:bg-surface-primary hover:text-content"
        onClick={e => {
          e.stopPropagation();
          onExplore(factorKey);
        }}
      >
        →
      </button>
    </foreignObject>
  );
}
```

Destructure `onExplore` and `exploreAriaLabel` in the component signature.

- [ ] **Step 5: Implement the card affordance**

In `HypothesisCardProps`, after `onOneStepAwayAction`:

```ts
  /**
   * CS-13 crossing-back — when provided, renders a → jump button in the card
   * header (top-right). The PARENT resolves the hub's primary factor and gates
   * on data presence (no button when the factor awaits collection — the
   * measurement-plan chip owns that case). Fired with no args.
   */
  onExplore?: () => void;
  /** Pre-formatted aria label for the → button (`wall.exploreJump.aria`). */
  exploreAriaLabel?: string;
```

In the non-glyph render (the `<g data-wall-lod={lod}>` return), after the `<text x={16} y={48}>` name line — card-local coords, CARD_W = 280:

```tsx
{
  onExplore && (
    <foreignObject x={CARD_W - 34} y={8} width={26} height={24} data-no-wall-pan>
      <button
        type="button"
        data-testid="hub-explore-jump"
        aria-label={exploreAriaLabel}
        className="flex h-full w-full items-center justify-center rounded border border-edge bg-surface text-xs text-content-muted hover:bg-surface-primary hover:text-content"
        onClick={e => {
          e.stopPropagation();
          onExplore();
        }}
      >
        →
      </button>
    </foreignObject>
  );
}
```

(Renders at `full` AND `medium` LOD — both have the header; the `glyph` LOD return is untouched.) Destructure the two new props.

- [ ] **Step 6: Run to verify all pass**

Run: `pnpm --filter @variscout/ui test -- AnalyzeWall`
Expected: PASS (new tests + zero regressions in the existing glyph/card suites).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall
git commit -m "feat(wall): → explore-jump affordances on focused FactorGlyph + HypothesisCard header (CS-13)"
```

---

### Task 4: `WallCanvas` threading + data-presence gating

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.exploreJump.test.tsx` (NEW)

- [ ] **Step 1: Write the failing gating test** (model the harness on the existing WallCanvas test suites in the same `__tests__/` dir — real component, seeded hubs via `createHypothesis()`):

```tsx
/**
 * CS-13 — WallCanvas explore-jump threading + the data-presence gate.
 * The owner-locked rule: "explore what exists; plan what doesn't" — a hub whose
 * factor is absent from activeColumns renders NO → (the measurement-plan chip
 * owns that case). The same test seeds a present-factor hub that DOES render
 * the →, so the absence assertion is load-bearing (feedback_load_bearing_tests).
 */
// createHypothesis is POSITIONAL (name, synthesis, findingIds?, investigationId?)
// and carries no condition/id — factory + spread for overrides (ui/CLAUDE.md:
// factories, never bare literals; tsc on `pnpm --filter @variscout/ui build`
// catches drift).
const makeHub = (id: string, name: string, column: string, value: string): Hypothesis => ({
  ...createHypothesis(name, '', [], 'inv-test'),
  id,
  condition: { kind: 'leaf', column, op: 'eq', value },
});

it('gates the card → on data presence: present-factor hub renders it, absent-factor hub does not', () => {
  const present = makeHub('h-present', 'Shift drives it', 'SHIFT', 'Night');
  const absent = makeHub('h-absent', 'Humidity drives it', 'HUMIDITY', 'High');
  render(
    <WallCanvas
      hubs={[present, absent]}
      findings={[]}
      problemCpk={1}
      eventsPerWeek={0}
      activeColumns={['SHIFT', 'Y']}
      outcomeColumn="Y"
      onExploreFactor={vi.fn()}
    />
  );
  const buttons = screen.getAllByTestId('hub-explore-jump');
  expect(buttons).toHaveLength(1); // ONLY the present-factor hub
});

it('clicking the card → fires onExploreFactor with the hub primary factor', () => {
  const onExploreFactor = vi.fn();
  const hub = makeHub('h1', 'Shift drives it', 'SHIFT', 'Night');
  render(
    <WallCanvas
      hubs={[hub]}
      findings={[]}
      problemCpk={1}
      eventsPerWeek={0}
      activeColumns={['SHIFT', 'Y']}
      outcomeColumn="Y"
      onExploreFactor={onExploreFactor}
    />
  );
  fireEvent.click(screen.getByTestId('hub-explore-jump'));
  expect(onExploreFactor).toHaveBeenCalledWith('SHIFT');
});

it('renders no → anywhere when onExploreFactor is omitted (legacy mounts unchanged)', () => {
  const hub = makeHub('h1', 'Shift drives it', 'SHIFT', 'Night');
  render(
    <WallCanvas
      hubs={[hub]}
      findings={[]}
      problemCpk={1}
      eventsPerWeek={0}
      activeColumns={['SHIFT', 'Y']}
      outcomeColumn="Y"
    />
  );
  expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
});
```

If `createHypothesis()`'s signature differs (check `packages/core/src/findings/` factories), adapt the fixture calls — factories, never literals. Match required `WallCanvasProps` against the interface (`hubId` optional; `problemCpk`/`eventsPerWeek` required). Copy `beforeEach` store resets (`useCanvasViewportStore`, `useViewStore`) from a neighboring WallCanvas suite.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- WallCanvas.exploreJump`
Expected: FAIL — unknown `onExploreFactor` prop.

- [ ] **Step 3: Implement**

(a) New prop on `WallCanvasProps` (after `onProposeHypothesis`, ~line 260):

```ts
  /**
   * CS-13 — the crossing-back (spec §4.0a). When provided, the focused factor
   * glyph and each hypothesis card header render a → jump button. Fired with
   * the RAW factor column name (glyph: its factorKey; card: the hub's primary
   * `deriveHypothesisFactors` column). DATA-PRESENCE-GATED: no affordance when
   * the factor is absent from `activeColumns` — the measurement-plan chip owns
   * the awaiting-collection case. Apps wire this through
   * `navigateToExploreForChip({kind:'factor', columnName, outcomeColumn})` +
   * `showExplore()` — the same primitive as the Process-tab chips.
   */
  onExploreFactor?: (factorColumn: string) => void;
```

(b) Destructure it; add a primary-factor memo near `columnSet` (~line 420):

```ts
// CS-13 — each hub's primary factor for the card → jump (condition columns,
// falling back to linked findings' filter columns; undefined when none).
const primaryFactorByHub = useMemo(
  () =>
    new Map<string, string | undefined>(
      filteredHubs.map(h => [h.id, deriveHypothesisFactors(h, findings)[0]])
    ),
  [filteredHubs, findings]
);
```

(c) In the `factorGlyphLayer` memo (~line 757), thread to each glyph (raw `key`, gate on `columnSet`):

```tsx
              <FactorGlyph
                …existing props…
                onExplore={
                  onExploreFactor && (!columnSet || columnSet.has(key)) ? onExploreFactor : undefined
                }
                exploreAriaLabel={formatMessage(locale, 'wall.exploreJump.aria', { factor: key })}
              />
```

Add `onExploreFactor` + `columnSet` to the memo's dependency array.

(d) In `renderHubAt` (~line 1072), extend `hubProps`:

```ts
// CS-13 — card → jump: resolved primary factor, data-presence-gated.
const primaryFactor = primaryFactorByHub.get(hub.id);
const exploreEnabled =
  onExploreFactor && primaryFactor && (!columnSet || columnSet.has(primaryFactor));
```

and inside the `hubProps` object:

```ts
      onExplore: exploreEnabled ? () => onExploreFactor(primaryFactor) : undefined,
      exploreAriaLabel: exploreEnabled
        ? formatMessage(locale, 'wall.exploreJump.aria', { factor: primaryFactor })
        : undefined,
```

- [ ] **Step 4: Run the package suite + build**

Run: `pnpm --filter @variscout/ui test -- AnalyzeWall && pnpm --filter @variscout/ui build`
Expected: PASS + clean tsc (the build catches fixture-literal drift vitest misses).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall
git commit -m "feat(wall): thread onExploreFactor through WallCanvas with the data-presence gate (CS-13)"
```

---

### Task 5: Azure wiring — `AnalyzeWorkspace` + Evidence-Map drill retrofit + seam tests

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` (imports ~line 12-area; `handleMapDrillDown` at 1057-1060; WallCanvas mount at 1302-1323)
- Create: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`

- [ ] **Step 1: Write the failing render-through seam test** — NEW file, modeled line-for-line on `AnalyzeWorkspace.evaluate.seam.test.tsx` (real `WallCanvas` from `@variscout/ui`, real stores, harness component). The harness wires `onExploreFactor` EXACTLY as AnalyzeWorkspace will:

```tsx
/**
 * Azure CS-13 crossing-back SEAM test (spec §4.0a).
 *
 * Renders the REAL WallCanvas with onExploreFactor wired exactly as
 * AnalyzeWorkspace.handleExploreFactor: navigateToExploreForChip
 * ({kind:'factor', columnName, outcomeColumn}) + the REAL panelsStore
 * showExplore(). Clicking the card → must land the analyst on the Explore
 * tab with BOTH yColumn and boxplotFactor written — a dead wire fails
 * (render-through, not a spy).
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, navigateToExploreForChip } from '@variscout/ui';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core';
import { usePanelsStore } from '../../../features/panels/panelsStore';

beforeEach(() => {
  useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
  usePanelsStore.setState({ activeView: 'analyze' });
});

// createHypothesis is positional (name, synthesis, findingIds?, investigationId?);
// id + condition land via spread (the evaluate.seam suite's typed-fixture precedent).
const hub: Hypothesis = {
  ...createHypothesis('Night shift runs hot', '', [], 'inv-test'),
  id: 'h1',
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
};

function Harness({ wired = true }: { wired?: boolean }) {
  const handleExploreFactor = React.useCallback((factor: string) => {
    navigateToExploreForChip({ kind: 'factor', columnName: factor, outcomeColumn: 'Y' }, () =>
      usePanelsStore.getState().showExplore()
    );
  }, []);
  return (
    <WallCanvas
      hubs={[hub]}
      findings={[]}
      problemCpk={1}
      eventsPerWeek={0}
      activeColumns={['SHIFT', 'Y']}
      outcomeColumn="Y"
      onExploreFactor={wired ? handleExploreFactor : undefined}
    />
  );
}

describe('CS-13 crossing-back (Azure seam)', () => {
  it('card → lands on Explore with the local y=f(x) in the scope store', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('hub-explore-jump'));
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Y');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('SHIFT');
    expect(usePanelsStore.getState().activeView).toBe('explore');
  });

  it('unwired Wall renders no → and writes nothing (negative control)', () => {
    render(<Harness wired={false} />);
    expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
    expect(usePanelsStore.getState().activeView).toBe('analyze');
  });
});
```

Adapt the `createHypothesis` import path/signature and the `usePanelsStore.setState` reset to what the codebase actually exports (cf. the evaluate.seam suite's imports). If azure's `usePanelsStore` lacks a direct `setState` reset convention, use the store's own actions (`showAnalyze()`) in `beforeEach`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/azure-app test -- exploreJump`
Expected: FAIL — no `hub-explore-jump` (prop exists but the harness wiring proves nothing until Task 4 is merged in this branch — if Tasks 1-4 are committed, this fails only if the seam itself is mis-wired; a green here is the render-through proof).

- [ ] **Step 3: Wire AnalyzeWorkspace**

(a) Import (extend the existing `@variscout/ui` import): `navigateToExploreForChip`.

(b) New handler next to `handleMapDrillDown` (~line 1057) — `outcome` is in scope (line 207, `string | null`):

```ts
// CS-13 — the crossing-back (spec §4.0a): from a Wall hypothesis/factor,
// land in Explore scoped to its local y=f(x). Same primitive as the
// Process-tab chips (FrameView.handleChipExploreJump).
const handleExploreFactor = useCallback(
  (factor: string) => {
    navigateToExploreForChip(
      { kind: 'factor', columnName: factor, outcomeColumn: outcome ?? undefined },
      () => usePanelsStore.getState().showExplore()
    );
  },
  [outcome]
);
```

(c) Retrofit `handleMapDrillDown` (owner-locked — keep the PI hint, add the scope carry):

```ts
const handleMapDrillDown = useCallback(
  (factor: string) => {
    usePanelsStore.getState().setHighlightedFactor(factor);
    // CS-13 — route the Evidence-Map drill through the scoped path so the
    // two Analyze→Explore gestures can't diverge (the drill previously
    // switched tabs WITHOUT writing the scope the Explore charts read).
    navigateToExploreForChip(
      { kind: 'factor', columnName: factor, outcomeColumn: outcome ?? undefined },
      () => usePanelsStore.getState().showExplore()
    );
  },
  [outcome]
);
```

(d) WallCanvas mount (~line 1322): add `onExploreFactor={handleExploreFactor}`.

- [ ] **Step 4: Add the retrofit test to `AnalyzeWorkspace.mapwall.test.tsx`** — the suite captures `AnalyzeMapView` props (`capturedMapViewProps`) and does NOT mock `@variscout/stores`, so the REAL `useAnalysisScopeStore` is assertable. Add (importing `useAnalysisScopeStore, getAnalysisScopeInitialState` from `@variscout/stores`, resetting in the suite's `beforeEach`):

```tsx
it('map drill-down writes the analysis scope before switching to Explore (CS-13 retrofit)', () => {
  renderWorkspace(); // the suite's existing render helper
  const onDrillDown = capturedMapViewProps.current?.onDrillDown as (f: string) => void;
  expect(onDrillDown).toBeDefined();
  act(() => onDrillDown('SHIFT'));
  expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('SHIFT');
});
```

Align the helper name + `act` import with the suite's existing conventions. (The mocked panelsStore's `showExplore` is a throwaway `vi.fn()` per `getState()` call — assert the REAL store write, which is the part the retrofit adds; the tab switch is covered by the seam test.) If the suite seeds a project outcome, also assert `yColumn`.

- [ ] **Step 5: Run the seam + mapwall + neighboring Analyze suites**

Run: `pnpm --filter @variscout/azure-app test -- AnalyzeWorkspace`
Expected: ALL PASS (exploreJump seam green; mapwall +1; evaluate/disconfirmFusion/scopePerIP/emptyLineage zero regressions).

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/editor
git commit -m "feat(azure): wire the CS-13 crossing-back — Wall onExploreFactor + scoped Evidence-Map drill"
```

---

### Task 6: PWA wiring — `AnalyzeView` + seam test

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx` (imports ~line 15-29; WallCanvas mount ~line 732)
- Create: `apps/pwa/src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx`

- [ ] **Step 1: Write the failing PWA seam test** — same shape as Task 5's, with PWA-local imports (`usePanelsStore` from `../../../features/panels/panelsStore`; the PWA `showExplore()` takes no args — the harness wiring is byte-identical because the chip path never passes an intent). Header comment must note the known limitation honestly:

```tsx
/**
 * PWA CS-13 crossing-back SEAM test (spec §4.0a).
 *
 * NOTE the PWA-scope truth (grounded 2026-06-04): the PWA Explore charts do
 * NOT yet read useAnalysisScopeStore (DEFERRED lv1-pwa-mount — Dashboard.tsx:676);
 * the crossed-back scope lands in the store + the AppHeader PersistentScopeChip,
 * matching the existing PWA chip path exactly. This seam asserts the store
 * write + tab switch — the wiring contract — not chart scoping.
 */
```

Body identical to Task 5's seam (Harness + 2 tests), with the PWA `beforeEach` reset using the PWA panelsStore.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/pwa test -- exploreJump`
Expected: FAIL until Step 3 (or green immediately if only harness-level — verify it fails by temporarily passing `wired={false}`; the negative control must fail when wired).

- [ ] **Step 3: Wire AnalyzeView**

(a) Add `navigateToExploreForChip` to the `@variscout/ui` import block (~line 15-29).

(b) Handler near the other Wall callbacks (`outcome` is in scope at line 149; `usePanelsStore` imported at line 72):

```ts
// CS-13 — the crossing-back (spec §4.0a). PWA parity note: the scope lands in
// analysisScopeStore + the chrome chip; the PWA Explore chart mirror is the
// deferred lv1-pwa-mount follow-up (matches the existing chip path).
const handleExploreFactor = useCallback(
  (factor: string) => {
    navigateToExploreForChip(
      { kind: 'factor', columnName: factor, outcomeColumn: outcome ?? undefined },
      () => usePanelsStore.getState().showExplore()
    );
  },
  [outcome]
);
```

(c) WallCanvas mount (~line 752): add `onExploreFactor={handleExploreFactor}`.

- [ ] **Step 4: Run the PWA Analyze suites**

Run: `pnpm --filter @variscout/pwa test -- AnalyzeView`
Expected: ALL PASS (new seam green; evaluate/disconfirmation/disconfirmFusion/captureModel/emptyLineage/mapwall zero regressions).

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views
git commit -m "feat(pwa): wire the CS-13 crossing-back on the PWA Wall (chip-parity; chart mirror stays lv1-pwa-mount)"
```

---

### Task 7: follow-up logging

**Files:**

- Modify: `docs/investigations.md`

> The master-plan sub-plan link + grounding record were committed to main with this sub-plan (doc workflow: docs to main before branching). The "DELIVERED via PR #N" build-record sentence is appended by the controller at merge, incorporating any build-record corrections discovered during implementation.

- [ ] **Step 1: investigations.md entry** — append under the current section, following the file's entry format:

```markdown
### CS-13 follow-up: carry the WHERE across the crossing-back (condition → categoricalFilters + an Explore chart mirror)

**Logged:** 2026-06-04 (CS-13 build). The crossing-back carries y+x only (owner-locked). Two missing pieces before a hypothesis's full territory (its WHERE — e.g. "Line 2, night shift") can cross: (1) no inverse `ConditionLeaf[] → categoricalFilters` converter exists anywhere (every shipped converter goes the other way); (2) no Explore chart reads `analysisScopeStore.categoricalFilters` (the scope chip displays them; `Dashboard.tsx` mirrors only `yColumn`/`boxplotFactor`). Writing the WHERE today would make the chip claim a scope the charts don't honor. Intersects CS-3b (highlight-coordination) — when the dim layer lands, the WHERE-carry likely rides it. Also adjacent: the inert `stepId` mirror (`TODO(lv1-e-step-mirror)`) and the PWA chart mirror (`DEFERRED(lv1-pwa-mount)`).
```

- [ ] **Step 2: Commit**

```bash
git add docs/investigations.md
git commit -m "docs(cs-13): log the WHERE-carry crossing-back follow-up in investigations.md"
```

---

## Acceptance (from the master plan, sharpened by grounding)

- From a hypothesis card or focused factor glyph, → lands in Explore with `yColumn` + `boxplotFactor` set and the charts scoped (Azure; render-through seam-proven). PWA: store + chrome chip carry (chip-parity, documented).
- No → when the factor is absent from the data (gate seam-proven with a present-factor sibling in the same test).
- The Evidence-Map drill now writes scope before switching (retrofit-tested).
- Zero regressions: existing chip path (6 handler tests), all Wall suites, both apps' Analyze suites.

## Controller-level gate (NOT in implementer prompts — feedback_implementer_long_bash_pitfall)

- `bash scripts/pr-ready-check.sh` green before PR.
- Validator runs the **app test suites** (azure-app + pwa + ui + core), not just builds (CS-12 lesson).
- Final adversarial Opus review on the branch (reviewer prompt STEP 0: checkout the PR branch).
- `--chrome` visual verify: focused-glyph → and card → render and land scoped on the populated Wall (the PR #295/#296 dataset path); confirm the → isn't clipped by the cropped cold-start viewBox (PR #296).
- Merge: `gh pr merge --merge --delete-branch`.
