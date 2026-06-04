---
tier: ephemeral
purpose: build
title: 'PR-CS-12 — The reasoning canvas: factor↔hypothesis Finding-links + domain-weighted Focus + retire the glue'
status: delivered
date: 2026-06-03
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-12 — The reasoning canvas (Model B centerpiece)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the bipartite reasoning canvas on the Analyze Wall — render per-factor glyphs at the shipped `factorPositions` band with **Finding-mediated, signed factor↔hypothesis edges** (derived, never stored); upgrade the Focus lens to **domain-weighted DOI** (`contribution × graph-distance`); **retire the glue** (`CanvasWallOverlay` deleted; `LocalMechanismView` trimmed to its step-local content); amend ADR-086 to the delivered state.

**Architecture:** All slice-A work is contained in `packages/ui/AnalyzeWall/` — no app-level prop threading (the derivation uses `findings` + `modelBuilderProps` WallCanvas already receives; real ΔR² flows up from `ModelBuilderBand` via a new stats callback). The glue retirement is a tsc-guided deletion cascade through `Canvas/` + both apps (ONE dispatch per `feedback_atomic_sweep_one_dispatch`). Factor edges join `wallLayout.edges`, so the BFS DOI graph + Minimap inherit them for free.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand; Vitest + happy-dom; `@variscout/{core,hooks,ui,stores}` + `apps/{azure,pwa}`.

**Spec ref:** §3 (Model B), §4.3 (Finding-mediated edges), §4.4 (Focus/zoom), §7.1 (glue retirement), §12 Q3 (resolved: not-now).

---

## Owner-locked design decisions (2026-06-03)

- **Factor glyphs + edges, on the Analyze tab.** Lightweight per-factor SVG glyphs (label + association-strength bar) render at the shipped `factorPositions` row (`FACTOR_Y=1300`); signed Finding-mediated edges rise to hypothesis cards. The Wall (= Model B) stays confined to the Analyze tab (spec §3.1); the Process tab connects via the CS-5 spine, never by embedding.
- **Edges are DERIVED, never stored** (ADR-086 Amendment §1): factor F ↔ hub H iff a finding linked to H (support or counter) was captured under a condition mentioning F (`Finding.context.activeFilters` keys ∩ the candidate-factor band). Sign rides the finding's side. **No `Hypothesis.factorIds`, no new persisted edge type, no new `FindingSource` variant.**
- **CausalLink Wall overlay: NOT-NOW** (spec §12 Q3 resolved). The Wall stays 100% evidence-derived; analyst-asserted mechanism arrows keep their Evidence Map + Report homes. Revive trigger = real user demand for mechanism arrows on the Wall. Logged in decision-log. The deeper question this surfaced — **does the Evidence Map survive post-Model-B as a separate surface?** — is logged in `investigations.md` for evaluation once CS-12 ships (both surfaces side-by-side); the arrows' long-term home falls out of that answer.
- **Glue depth: trim, don't delete LMV.** `CanvasWallOverlay` (the Wall painted over the L2 grid) is deleted entirely, with its whole support chain (`'wall'` overlay id, picker branch, `useSharedWallProps`, `useHasAnalyzeContent`, 2 i18n keys). `LocalMechanismView` keeps its **step-local** content (column mini-charts + η² rankings — the §4.4 L3 "local mechanism" altitude role) and loses the **glued stack**: the embedded `WallCanvas` section, the compact `EvidenceMapBase` section, and the leftover response-path CTAs CS-2 deliberately kept (`data-testid="response-path-ctas"`).
- **DOI formula (van Ham & Perer: DOI = API − distance):** `domainWeightedOpacity(doi, contribution01) = lerp(focusOpacity(doi), focusOpacity(max(0, doi−1)), contribution01)` — a factor's normalized association strength lifts it at most one opacity tier toward vivid. Hubs/findings have `contribution01 = 0` → behavior identical to today (backward-compatible by construction). Focus still **never moves the model metrics** (ADR-086 Amendment §4) — weighting reads contributions, never recomputes them.
- **Contribution source = the band's live model** (single source of truth): `ModelBuilderBand` already computes `kept` + `perFactorDeltaR2`; a new `onModelStatsChange` callback reports them up. No duplicate `computeBestSubsets` run in WallCanvas. Analyst toggles a factor in the band → glyph bars + DOI weights follow.
- **Factor node ids are namespaced `factor:${key}`** in `edges` + focus state, so column names can never collide with entity ids in the DOI graph. `factorPositions` keys stay RAW (the existing band-anchor contract is untouched).
- **Glyph positions stay input-ordered** (the `-i` placeholder sort in `layoutFactors` is untouched) — band order stays stable while the analyst toggles; only the contribution **data** is live.
- **Mobile exempt:** `MobileCardList` never renders the SVG body — glyphs/edges/minimap are desktop-only by construction (ADR-086 mobile = focus-only). No mobile work.
- **i18n: 1 key added** (`wall.factorGlyph.aria`), **8 keys removed** (2 × `canvas.wall.overlay*` + 6 × orphaned `canvas.localMechanism.*`) — each an all-or-nothing `MessageCatalog` + 32-catalog sweep (English placeholders per convention).

## Grounding corrections (8-agent fan-out + direct verification, 2026-06-03) — recorded so the build doesn't re-discover them

- **Finding→hub signed tethers ALREADY render** (`WallCanvas.tsx:884-911` — dashed lines, counter LOUD warning per §7; edges emitted at `wallLayout.ts:219/224`). The master-plan bullet "draw Finding-mediated links (condition→hypothesis, signed)" is **shipped**; CS-12's link work is the **factor↔hypothesis** layer only.
- **Spec §7.1's premise is FALSE on both counts:** `wallLayout.factorPositions` is **populated and consumed in production** (anchors `ModelBuilderBand`; both apps pass `modelBuilderProps` — Azure `AnalyzeWorkspace.tsx:1301`, PWA `AnalyzeView.tsx:726`; shipped FE-1 PRs #260-263), and the dead `kind:'factor'` edge was **already deleted by CS-1** (commit `ded680d8`, which narrowed `WallEdge.kind` to `'support'|'refute'`). Task 6 adds the grounding-correction note to the spec.
- **Focus lens + Minimap SHIPPED in IM-4c** (PR #258): `wallFocus.ts` (`wallDegreeOfInterest` undirected BFS + 3-tier `focusOpacity`), `Minimap.tsx` wired in both apps, `focusedWallEntityId` in `useViewStore` (single source, `WallCanvas.tsx:599`). The CS-12 delta is the **`× contribution` weighting only** — `wallFocus.ts` has no contribution term anywhere.
- **The layout receives FAKE contributions:** `WallCanvas.tsx:569-576` maps `candidateFactors` with `contribution: -i` (order-preserving placeholder); the REAL per-factor semipartial ΔR² (CS-8) is computed **inside** `ModelBuilderBand` (`deltaR2` memo at `ModelBuilderBand.tsx:191-194`, over the analyst's live `kept` set at `:162-166`). Hence the stats callback (Task 3).
- **Glue mounts verified live:** `CanvasWallOverlay` at `Canvas/index.tsx:662` (import `:66`; gated by `activeOverlays.includes('wall') && !isMobile && hasContent`); `LocalMechanismView` at `CanvasLevelRouter.tsx:173` (import `:21`; the L3 b0 read view). `LocalMechanismView` embeds **both** `WallCanvas` (`:425-439`) and compact `EvidenceMapBase` (`:406-418`) — the literal "vertical stack" ADR-086 §Context describes.
- **`useSharedWallProps` has exactly ONE consumer** (`CanvasWallOverlay.tsx:45`) → dies with it. **`useHasAnalyzeContent` has exactly TWO** (`CanvasWallOverlay.tsx:44` + `Canvas/index.tsx:326`, the latter only gating `'wall'` into `availableOverlays` at `:329-336`) → both usages die; delete the hook.
- **`Canvas.test.tsx` is QUARANTINED** (`describe.skip`, vitest `vi.mock`+`await import()` hang — investigations.md) and **mocks `LocalMechanismView`**. Update the mock surface to match the trimmed props but **keep it skipped** — do NOT attempt to unquarantine in this PR.
- **The LMV response-path CTAs deliberately survived CS-2** (PR #284 commit message: "keep capture-as-Finding + LocalMechanismView coverage"). CS-12's trim closes them per the §7.3 decision (canvas's affirmative actions = Click-to-Explore + capture-as-Finding).
- **ADR-086 has a markdown bug** on line 86 (mismatched `**` from the CS-1 retraction edit) — fix in the Task 6 amendment.
- **ADR-086 ↔ spec §4.3 contradiction to resolve in the amendment:** the 2026-05-31 Amendment §2 says "the typed factor↔hypothesis edge is DEFERRED / CausalLink stays factor→factor / both glue components remain live in V1"; spec §4.3 (newer, authoritative) makes Finding-mediated the canonical edge and orders the glue retired. The Task 6 amendment supersedes Amendment §2's deferral **for the derived Finding-mediated edges** (which is exactly what Amendment §1 prescribes — derived, never stored) while keeping its "no stored factor edge" core intact.
- **CausalLink renders only in Evidence Map (Azure Layer 2) + Report** — never on the Wall; the create gesture is buried. Cutting the Wall overlay loses no capability.
- **`Minimap.tsx:87` consumes `layout.edges` for DOI** — factor edges change BFS distances there too (intended; covered by a regression assertion in Task 4).
- **Both glue components embed `WallCanvas`** — retiring them removes 2 of its 3 mount sites; the Analyze-tab mount (Azure `AnalyzeWorkspace.tsx:1284`, PWA via `AnalyzeView`) becomes the single home. CS-9/10/11 planning props all thread through that surviving mount — untouched.
- **Standing items honored:** ΔR²→`Finding.modelContext` capture-time wiring (investigations.md nominates CS-12) stays **deferred** — owner did not opt in. Factor-family LOD + edge bundling stay deferred (§4.4). §12 Q5 cascade untouched. `CrossTypeEvidenceMap` is a DIFFERENT component (radial defect map) — **do not touch**.

## File structure

- **Task 1 (layout):** `packages/ui/src/components/AnalyzeWall/wallLayout.ts` — `'factor-support'|'factor-refute'` edge kinds + emission; `+ wallLayout.test.ts`.
- **Task 2 (focus):** `packages/ui/src/components/AnalyzeWall/wallFocus.ts` — `domainWeightedOpacity`; `+ wallFocus.test.ts`.
- **Task 3 (band callback):** `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx` — `onModelStatsChange`; `+ ModelBuilderBand.test.tsx`.
- **Task 4 (integration):** NEW `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx`; `WallCanvas.tsx` (glyph layer + edge layer + weighted `focusFor` + stats state); i18n key add (33 files); NEW `WallCanvas.factorEdges.seam.test.tsx`.
- **Task 5 (glue cascade):** DELETE `Canvas/internal/CanvasWallOverlay.tsx` (+test), `packages/hooks/src/useSharedWallProps.ts` (+test), `packages/hooks/src/useHasAnalyzeContent.ts` (+test); EDIT `Canvas/index.tsx`, `useCanvasAnalyzeOverlays.ts`, `CanvasOverlayPicker.tsx` (+test), `LocalMechanismView.tsx` (trim), `CanvasLevelRouter.tsx`, `CanvasWorkspace.tsx`, both apps' canvas wiring, `packages/hooks/src/index.ts`; i18n key removals (33 files each); test updates incl. the quarantined `Canvas.test.tsx` mock.
- **Task 6 (docs):** ADR-086 amendment; `decision-log.md`; `docs/ephemeral/investigations.md`; spec §7.1/§12 notes; `packages/ui/CLAUDE.md`; master-plan delivery record (post-merge).

## Task sequencing

Tasks 1 → 2 → 3 are independent pure-TDD units (any order; 1 first is natural). Task 4 depends on 1+2+3. Task 5 is file-disjoint from 1-4 except that it deletes two `WallCanvas` mount sites — run it **after** Task 4 so the unified canvas exists before the glue dies (12a → 12b per the master plan). Task 6 docs last. Final gate (Task 7) on the whole branch.

**Model sizing:** Task 1, 2, 3 — Sonnet (well-specified TDD, 1-2 files each). Task 4 — Opus (multi-layer integration + seam tests). Task 5 — Opus, ONE dispatch (atomic deletion cascade with internal Architect→Migration→Validator phases + per-category commits, per `feedback_atomic_sweep_one_dispatch`). Task 6 — Sonnet. Final review — Opus.

---

### Task 1: Factor↔hypothesis edge emission in `wallLayout`

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/wallLayout.ts`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts` (extend the existing file)

- [ ] **Step 1: Write the failing tests**

Add to the existing `wallLayout.test.ts` (follow its existing fixture style):

```ts
describe('factor↔hypothesis edges (PR-CS-12, spec §4.3)', () => {
  const args = (over: Partial<WallLayoutArgs> = {}): WallLayoutArgs => ({
    hubs: [
      { id: 'hub-1', findingIds: ['f-support'], counterFindingIds: ['f-counter'] },
      { id: 'hub-2', findingIds: [], counterFindingIds: [] },
    ],
    findings: [
      { id: 'f-support', conditionColumns: ['Line', 'Shift'] },
      { id: 'f-counter', conditionColumns: ['Temp'] },
      { id: 'f-orphan', conditionColumns: ['Line'] },
    ],
    factors: [
      { key: 'Line', contribution: 0 },
      { key: 'Temp', contribution: -1 },
      { key: 'Noise', contribution: -2 }, // distractor: no finding mentions it
    ],
    grouping: 'linear',
    canvasW: 2000,
    canvasH: 1400,
    ...over,
  });

  it('emits a factor-support edge for each candidate factor a supporting finding condition mentions', () => {
    const layout = computeWallLayout(args());
    expect(layout.edges).toContainEqual({
      fromId: 'factor:Line',
      toId: 'hub-1',
      kind: 'factor-support',
    });
  });

  it('emits a factor-refute edge when the linking finding is a counter-finding', () => {
    const layout = computeWallLayout(args());
    expect(layout.edges).toContainEqual({
      fromId: 'factor:Temp',
      toId: 'hub-1',
      kind: 'factor-refute',
    });
  });

  it('LOAD-BEARING NEGATIVE CONTROL: a candidate factor no finding mentions gets NO edge', () => {
    const layout = computeWallLayout(args());
    expect(layout.edges.filter(e => e.fromId === 'factor:Noise')).toHaveLength(0);
  });

  it('a condition column NOT in the candidate-factor band gets NO edge (Shift is not a factor)', () => {
    const layout = computeWallLayout(args());
    expect(layout.edges.filter(e => e.fromId === 'factor:Shift')).toHaveLength(0);
  });

  it('orphan findings (linked to no hub) produce no factor edges', () => {
    const layout = computeWallLayout(args());
    // f-orphan mentions Line, but only hub-linked findings mediate edges:
    // the only factor:Line edge is the one via f-support → hub-1.
    expect(layout.edges.filter(e => e.fromId === 'factor:Line')).toHaveLength(1);
  });

  it('dedupes: two supporting findings mentioning the same factor → one edge', () => {
    const layout = computeWallLayout(
      args({
        hubs: [{ id: 'hub-1', findingIds: ['f-a', 'f-b'], counterFindingIds: [] }],
        findings: [
          { id: 'f-a', conditionColumns: ['Line'] },
          { id: 'f-b', conditionColumns: ['Line'] },
        ],
      })
    );
    expect(
      layout.edges.filter(e => e.fromId === 'factor:Line' && e.kind === 'factor-support')
    ).toHaveLength(1);
  });

  it('finding→hub tethers are unchanged (regression)', () => {
    const layout = computeWallLayout(args());
    expect(layout.edges).toContainEqual({ fromId: 'f-support', toId: 'hub-1', kind: 'support' });
    expect(layout.edges).toContainEqual({ fromId: 'f-counter', toId: 'hub-1', kind: 'refute' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- wallLayout`
Expected: FAIL — `conditionColumns` not in type; no `factor-*` edges emitted.

- [ ] **Step 3: Implement**

In `wallLayout.ts`:

(a) Widen the edge kind (line 31-35):

```ts
export interface WallEdge {
  fromId: string;
  toId: string;
  /**
   * `support`/`refute` = finding→hub tethers (IM-4c).
   * `factor-support`/`factor-refute` = the PR-CS-12 Finding-MEDIATED
   * factor↔hypothesis edges (spec §4.3): derived, never stored
   * (ADR-086 Amendment §1); `fromId` is namespaced `factor:${key}` so column
   * names can never collide with entity ids in the DOI graph.
   */
  kind: 'support' | 'refute' | 'factor-support' | 'factor-refute';
}
```

(b) Extend the findings input (both `WallLayoutArgs.findings` at line 67 and `BuildWallLayoutArgsInput.findings` at line 93, and the pass-through in `buildWallLayoutArgs` line 150):

```ts
// WallLayoutArgs:
findings: { id: string; conditionColumns?: readonly string[] }[];
// BuildWallLayoutArgsInput:
findings?: readonly { id: string; conditionColumns?: readonly string[] }[];
// buildWallLayoutArgs pass-through:
findings: findings.map(f => ({ id: f.id, conditionColumns: f.conditionColumns })),
```

(c) Emit the edges in `computeWallLayout`, after the factor-band block (after line 245), before the return:

```ts
// ── Factor↔hypothesis edges (PR-CS-12, spec §4.3) ────────────────────────
// Finding-MEDIATED + DERIVED: factor F connects to hub H iff a finding
// linked to H (support or counter) was captured under a condition mentioning
// F (`conditionColumns` ∩ the candidate-factor band). Sign rides the
// finding's side. Never stored (ADR-086 Amendment §1). Edges join `edges`
// so the Focus-lens BFS + Minimap DOI inherit them.
const factorKeys = new Set(factors.map(f => f.key));
const conditionsByFinding = new Map(findings.map(f => [f.id, f.conditionColumns ?? []]));
const seenFactorEdges = new Set<string>();
for (const hub of hubs) {
  if (!hubPositions.has(hub.id)) continue;
  const counterIds = new Set(hub.counterFindingIds ?? []);
  const linked: { id: string; kind: 'factor-support' | 'factor-refute' }[] = [
    ...hub.findingIds
      .filter(id => !counterIds.has(id))
      .map(id => ({ id, kind: 'factor-support' as const })),
    ...[...counterIds].map(id => ({ id, kind: 'factor-refute' as const })),
  ];
  for (const { id, kind } of linked) {
    for (const column of conditionsByFinding.get(id) ?? []) {
      if (!factorKeys.has(column)) continue;
      const dedupeKey = `${column}|${hub.id}|${kind}`;
      if (seenFactorEdges.has(dedupeKey)) continue;
      seenFactorEdges.add(dedupeKey);
      edges.push({ fromId: `factor:${column}`, toId: hub.id, kind });
    }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/ui test -- wallLayout`
Expected: PASS (all new + all pre-existing cases).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/wallLayout.ts packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts
git commit -m "feat(wall): emit Finding-mediated factor↔hypothesis edges in wallLayout (CS-12, spec §4.3)"
```

---

### Task 2: Domain-weighted DOI in `wallFocus`

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/wallFocus.ts`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/wallFocus.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

```ts
describe('domainWeightedOpacity (PR-CS-12, spec §3.3 rule 8)', () => {
  it('contribution 0 → identical to focusOpacity (backward compatible)', () => {
    for (const doi of [0, 1, 2, 3]) {
      expect(domainWeightedOpacity(doi, 0)).toBe(focusOpacity(doi));
    }
  });

  it('contribution 1 lifts exactly one tier: dim→mid, mid→vivid', () => {
    expect(domainWeightedOpacity(2, 1)).toBe(focusOpacity(1)); // dim → mid
    expect(domainWeightedOpacity(1, 1)).toBe(focusOpacity(0)); // mid → vivid
  });

  it('focused entity stays vivid regardless of contribution', () => {
    expect(domainWeightedOpacity(0, 0)).toBe(1);
    expect(domainWeightedOpacity(0, 1)).toBe(1);
  });

  it('partial contribution interpolates between tiers (monotonic)', () => {
    const at0 = domainWeightedOpacity(2, 0);
    const at05 = domainWeightedOpacity(2, 0.5);
    const at1 = domainWeightedOpacity(2, 1);
    expect(at05).toBeGreaterThan(at0);
    expect(at05).toBeLessThan(at1);
  });

  it('clamps out-of-range contribution', () => {
    expect(domainWeightedOpacity(2, -1)).toBe(focusOpacity(2));
    expect(domainWeightedOpacity(2, 5)).toBe(focusOpacity(1));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- wallFocus`
Expected: FAIL — `domainWeightedOpacity` not exported.

- [ ] **Step 3: Implement** — append to `wallFocus.ts`:

```ts
/**
 * Domain-weighted opacity (PR-CS-12, spec §3.3 rule 8; van Ham & Perer
 * DOI = a-priori-interest − distance): an entity's normalized contribution
 * (association strength, 0..1) lifts it AT MOST ONE opacity tier toward
 * vivid. `contribution01 = 0` reproduces `focusOpacity` exactly, so
 * hubs/findings (which carry no contribution) are untouched. Weighting reads
 * contributions; it never recomputes model metrics (ADR-086 Amendment §4).
 */
export function domainWeightedOpacity(doi: number, contribution01: number): number {
  const c = Math.min(1, Math.max(0, contribution01));
  const base = focusOpacity(doi);
  if (c === 0) return base;
  const lifted = focusOpacity(Math.max(0, doi - 1));
  return base + (lifted - base) * c;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/ui test -- wallFocus`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/wallFocus.ts packages/ui/src/components/AnalyzeWall/__tests__/wallFocus.test.ts
git commit -m "feat(wall): domain-weighted DOI — contribution lifts focus opacity one tier (CS-12)"
```

---

### Task 3: `onModelStatsChange` callback on `ModelBuilderBand`

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx` (extend the existing file, follow its render harness)

- [ ] **Step 1: Write the failing test**

```tsx
describe('onModelStatsChange (PR-CS-12)', () => {
  it('reports kept factors + ΔR² map once the engine computes, and again on analyst toggle', async () => {
    const onModelStatsChange = vi.fn();
    renderBand({ onModelStatsChange }); // reuse the existing test harness/fixtures
    await waitFor(() => expect(onModelStatsChange).toHaveBeenCalled());
    const stats = onModelStatsChange.mock.calls.at(-1)![0];
    expect(stats).not.toBeNull();
    expect(Array.isArray(stats.kept)).toBe(true);
    expect(stats.kept.length).toBeGreaterThan(0);
    expect(stats.deltaR2.get(stats.kept[0])).toBeGreaterThanOrEqual(0);

    // analyst toggles a kept factor off → a NEW report with the smaller set
    const before = onModelStatsChange.mock.calls.length;
    await userEvent.click(screen.getByTestId(`model-factor-toggle-${stats.kept[0]}`)); // use the band's real toggle testid from the existing tests
    await waitFor(() => expect(onModelStatsChange.mock.calls.length).toBeGreaterThan(before));
    const after = onModelStatsChange.mock.calls.at(-1)![0];
    expect(after.kept).not.toContain(stats.kept[0]);
  });
});
```

(Adapt selector names to the band's existing test file — it already exercises the toggle; reuse its queries.)

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- ModelBuilderBand`
Expected: FAIL — prop does not exist.

- [ ] **Step 3: Implement**

(a) Add to `ModelBuilderBandProps`:

```ts
/**
 * PR-CS-12: report the CURRENT model's kept set + per-factor association
 * strength (semipartial ΔR²) up to the Wall, for factor glyphs +
 * domain-weighted DOI. Fires whenever the analyst's kept set or its ΔR² map
 * changes; `null` when the engine can't produce a model. Single source of
 * truth — the Wall must NOT recompute best-subsets.
 */
onModelStatsChange?: (
  stats: { kept: string[]; deltaR2: ReadonlyMap<string, number> } | null
) => void;
```

(b) Destructure `onModelStatsChange` in the component and add after the `deltaR2` memo (line ~194):

```ts
// PR-CS-12: lift the live model stats to the Wall (glyph bars + DOI weights).
useEffect(() => {
  if (!onModelStatsChange) return;
  onModelStatsChange(engine ? { kept, deltaR2 } : null);
}, [onModelStatsChange, engine, kept, deltaR2]);
```

(`useEffect` joins the existing react import.)

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @variscout/ui test -- ModelBuilderBand`
Expected: PASS (new + existing).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx
git commit -m "feat(wall): ModelBuilderBand reports live kept+ΔR² via onModelStatsChange (CS-12)"
```

---

### Task 4: WallCanvas integration — FactorGlyph + edge layer + weighted focus

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Modify (i18n, 33 files): `packages/core/src/i18n/types.ts` + `packages/core/src/i18n/messages/*.ts` — add `'wall.factorGlyph.aria'` (en: `'Focus factor {factor}'`; English placeholder in the 31 non-en catalogs per convention)
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.factorEdges.seam.test.tsx` (NEW — copy the render harness from `WallCanvas.focus.seam.test.tsx`)

- [ ] **Step 1: Write the failing seam tests**

Harness: reuse `WallCanvas.focus.seam.test.tsx`'s setup (store reset in `beforeEach`, `createFinding`/`createHypothesis` factories per ui/CLAUDE.md, `modelBuilderProps` with `candidateFactors`). Fixtures: hub `hub-1` with one supporting finding whose `context.activeFilters = { Line: ['B'] }`, one counter finding with `{ Temp: ['high'] }`; `candidateFactors: ['Line', 'Temp', 'Noise']` (Noise = distractor).

```tsx
describe('WallCanvas factor glyphs + Finding-mediated edges (PR-CS-12)', () => {
  it('renders a glyph per candidate factor', () => {
    renderWall();
    expect(screen.getByTestId('factor-glyph-Line')).toBeInTheDocument();
    expect(screen.getByTestId('factor-glyph-Temp')).toBeInTheDocument();
    expect(screen.getByTestId('factor-glyph-Noise')).toBeInTheDocument();
  });

  it('draws a signed edge from an evidence-mentioned factor to its hypothesis', () => {
    const { container } = renderWall();
    const support = container.querySelector(
      '[data-factor-edge="factor:Line→hub-1"][data-factor-edge-kind="factor-support"]'
    );
    const refute = container.querySelector(
      '[data-factor-edge="factor:Temp→hub-1"][data-factor-edge-kind="factor-refute"]'
    );
    expect(support).not.toBeNull();
    expect(refute).not.toBeNull();
  });

  it('LOAD-BEARING NEGATIVE CONTROL: the distractor factor (no finding mentions it) has NO edge', () => {
    const { container } = renderWall();
    expect(container.querySelector('[data-factor-edge^="factor:Noise"]')).toBeNull();
  });

  it('clicking a glyph focuses it (focusedWallEntityId = factor:key) and dims non-adjacent nodes', async () => {
    renderWall();
    await userEvent.click(screen.getByTestId('factor-glyph-Line'));
    expect(useViewStore.getState().focusedWallEntityId).toBe('factor:Line');
    // hub-1 is adjacent (distance 1) → mid; the unrelated Noise glyph dims.
    const noise = screen.getByTestId('factor-glyph-Noise');
    expect(Number(noise.getAttribute('opacity'))).toBeLessThan(0.3); // DIM tier
  });

  it('MUTATION GUARD: high-contribution factor lifts one tier under focus (domain weighting is wired)', async () => {
    // Drive stats via the band callback path: renderWall wires modelBuilderProps,
    // and the test injects stats by firing the band's onModelStatsChange — assert
    // through the public surface: with deltaR2 {Line: 0.4 (max), Noise: 0.4},
    // focusing hub-1 leaves Noise at MID (lifted from DIM), not DIM.
    renderWallWithStats({
      kept: ['Line'],
      deltaR2: new Map([
        ['Line', 0.4],
        ['Noise', 0.4],
      ]),
    });
    await userEvent.click(screen.getByTestId(/* hub card region */ 'hub-card-hub-1'));
    const noise = screen.getByTestId('factor-glyph-Noise');
    expect(Number(noise.getAttribute('opacity'))).toBeCloseTo(0.55, 2); // MID, not 0.25 DIM
  });
});
```

(`renderWallWithStats` — simplest honest seam: render with a `modelBuilderProps` whose rows/factors yield a real engine run, OR export the glyph layer's contribution mapping for a direct unit assertion; pick whichever the harness supports without mocking internals. The MUTATION criterion: reverting `focusFor` to unweighted `focusOpacity` must fail this test.)

Also extend `__tests__/Minimap.test.tsx` with one regression line: a layout containing `factor-*` edges still renders hub dots (DOI distances may change; no crash, hubs present).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/ui test -- WallCanvas.factorEdges`
Expected: FAIL — no glyph testids, no edge attributes.

- [ ] **Step 3: Implement `FactorGlyph.tsx`**

```tsx
import React from 'react';

export interface FactorGlyphProps {
  factorKey: string;
  x: number;
  y: number;
  /** Normalized association strength 0..1 (bar width); 0/undefined → no bar. */
  contribution01?: number;
  opacity: number;
  doi: number;
  focused: boolean;
  ariaLabel: string;
  onFocus: (nodeId: string) => void;
}

const GLYPH_W = 150;
const GLYPH_H = 44;
const BAR_W = GLYPH_W - 24;

/**
 * PR-CS-12 (spec §4.3): a lightweight per-factor node on the Wall's factor
 * band. Label + association-strength bar. The node id in the DOI graph is
 * `factor:${factorKey}` (namespaced — never the raw column name).
 * Color discipline per ui/CLAUDE.md: 50-300 fills, 400-700 strokes/text.
 */
export function FactorGlyph({
  factorKey,
  x,
  y,
  contribution01 = 0,
  opacity,
  doi,
  focused,
  ariaLabel,
  onFocus,
}: FactorGlyphProps) {
  const nodeId = `factor:${factorKey}`;
  return (
    <g
      data-testid={`factor-glyph-${factorKey}`}
      data-wall-node-id={nodeId}
      data-doi={doi}
      opacity={opacity}
      transform={`translate(${x - GLYPH_W / 2}, ${y - GLYPH_H / 2})`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className="cursor-pointer"
      onClick={() => onFocus(nodeId)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onFocus(nodeId);
      }}
    >
      <rect
        width={GLYPH_W}
        height={GLYPH_H}
        rx={8}
        className={focused ? 'fill-blue-100 stroke-blue-500' : 'fill-surface-primary stroke-edge'}
        strokeWidth={focused ? 2 : 1}
      />
      <text x={12} y={18} className="fill-content text-[12px] font-medium">
        {factorKey.length > 18 ? `${factorKey.slice(0, 17)}…` : factorKey}
      </text>
      {contribution01 > 0 && (
        <>
          <rect x={12} y={28} width={BAR_W} height={6} rx={3} className="fill-surface-secondary" />
          <rect
            x={12}
            y={28}
            width={Math.max(4, BAR_W * Math.min(1, contribution01))}
            height={6}
            rx={3}
            className="fill-blue-400"
            data-testid={`factor-glyph-bar-${factorKey}`}
          />
        </>
      )}
    </g>
  );
}
```

- [ ] **Step 4: Wire WallCanvas**

All edits in `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`:

(a) Imports: `domainWeightedOpacity` from `./wallFocus`; `FactorGlyph` from `./FactorGlyph`.

(b) Thread `conditionColumns` into the layout — edit the `wallLayout` memo's `buildWallLayoutArgs` call (line ~580): pass

```ts
findings: findings.map(f => ({
  id: f.id,
  conditionColumns: Object.keys(f.context.activeFilters),
})),
```

(Check the memo currently passes `findings` directly — replace with the mapped shape; keep dep array correct.)

(c) Band stats state + handler (near the `focusedWallEntityId` block, line ~599):

```ts
// PR-CS-12: the band reports its live kept+ΔR² (single source of truth — the
// Wall never recomputes best-subsets). Drives glyph bars + DOI weighting.
const [modelStats, setModelStats] = useState<{
  kept: string[];
  deltaR2: ReadonlyMap<string, number>;
} | null>(null);
const factorContribution01 = useMemo(() => {
  const map = new Map<string, number>();
  if (!modelStats) return map;
  let max = 0;
  for (const v of modelStats.deltaR2.values()) max = Math.max(max, v);
  if (max <= 0) return map;
  for (const [k, v] of modelStats.deltaR2) {
    map.set(`factor:${k}`, Math.max(0, v) / max);
  }
  return map;
}, [modelStats]);
```

(d) Weight `focusFor` (line ~631) — replace `focusOpacity(doi)`:

```ts
const focusFor = useCallback(
  (nodeId: string) => {
    const doi = wallDegreeOfInterest(focusedWallEntityId, nodeId, wallLayout.edges);
    return {
      opacity: domainWeightedOpacity(doi, factorContribution01.get(nodeId) ?? 0),
      doi,
    };
  },
  [focusedWallEntityId, wallLayout.edges, factorContribution01]
);
```

(`focusOpacity` import can drop if now unused.)

(e) Pass the callback to the band — in the `modelBuilderBand` memo (line ~669), add `onModelStatsChange={setModelStats}` to `<ModelBuilderBand … />` (and `setModelStats` is a stable setState — no dep change needed).

(f) Build the glyph + edge layers (new memos after `modelBuilderBand`):

```tsx
// PR-CS-12 factor glyphs: one node per candidate factor at the layout's
// factor-band positions (positions keyed RAW; DOI node ids namespaced).
const factorGlyphLayer = useMemo(() => {
  if (wallLayout.factorPositions.size === 0) return null;
  return (
    <g data-wall-factor-glyphs>
      {[...wallLayout.factorPositions.entries()].map(([key, pos]) => {
        const nodeId = `factor:${key}`;
        const { opacity, doi } = focusFor(nodeId);
        return (
          <FactorGlyph
            key={key}
            factorKey={key}
            x={pos.x}
            y={pos.y}
            contribution01={factorContribution01.get(nodeId) ?? 0}
            opacity={opacity}
            doi={doi}
            focused={focusedWallEntityId === nodeId}
            ariaLabel={formatMessage(locale, 'wall.factorGlyph.aria', { factor: key })}
            onFocus={handleFocusNode}
          />
        );
      })}
    </g>
  );
}, [
  wallLayout.factorPositions,
  focusFor,
  factorContribution01,
  focusedWallEntityId,
  locale,
  handleFocusNode,
]);

// PR-CS-12 factor↔hypothesis edges: solid (vs the dashed finding tethers),
// refute LOUD per §7. Edge opacity = the dimmer endpoint, so the Focus lens
// fades whole irrelevant connections together.
const factorEdgeLayer = useMemo(() => {
  const factorEdges = wallLayout.edges.filter(e => e.kind.startsWith('factor-'));
  if (factorEdges.length === 0) return null;
  return (
    <g data-wall-factor-edges>
      {factorEdges.map(edge => {
        const fromPos = wallLayout.factorPositions.get(edge.fromId.slice('factor:'.length));
        const toPos = wallLayout.hubPositions.get(edge.toId);
        if (!fromPos || !toPos) return null;
        const opacity = Math.min(focusFor(edge.fromId).opacity, focusFor(edge.toId).opacity);
        const isRefute = edge.kind === 'factor-refute';
        return (
          <line
            key={`${edge.fromId}→${edge.toId}|${edge.kind}`}
            data-factor-edge={`${edge.fromId}→${edge.toId}`}
            data-factor-edge-kind={edge.kind}
            x1={fromPos.x}
            y1={fromPos.y - 24}
            x2={toPos.x}
            y2={toPos.y + 30}
            strokeWidth={1.5}
            opacity={opacity * 0.6}
            stroke={isRefute ? chartColors.warning : undefined}
            className={isRefute ? undefined : 'stroke-edge'}
          />
        );
      })}
    </g>
  );
}, [wallLayout.edges, wallLayout.factorPositions, wallLayout.hubPositions, focusFor]);
```

(g) Mount: in the MAIN svg body (root at line ~1066), render `{factorEdgeLayer}` immediately after the scope-anchor group (so edges paint UNDER hub cards/chips) and `{factorGlyphLayer}` after the hub groups (over the edges); in the cold-start svg (line ~805-812), render `{factorGlyphLayer}` next to `{modelBuilderBand}` (no edges — zero hubs). Verify the band panel (anchored ~`factorBandY − 340`) doesn't overlap the glyph row (`y = 1300`) — the panel sits above by construction.

(h) i18n: add `'wall.factorGlyph.aria': string;` to `MessageCatalog` (`packages/core/src/i18n/types.ts`, near the other `wall.*` keys ~line 937 area) + `'wall.factorGlyph.aria': 'Focus factor {factor}',` to `en.ts` (near `:853`) + the same English placeholder line to the **31 other catalogs** (all-or-nothing; the completeness test + tsc enforce).

- [ ] **Step 5: Run to verify pass**

Run: `pnpm --filter @variscout/ui test -- WallCanvas` then `pnpm --filter @variscout/ui test` and `pnpm --filter @variscout/core test -- i18n`
Expected: PASS (new seam + every pre-existing WallCanvas/Minimap/focus suite + i18n completeness).

- [ ] **Step 6: Build check (catches fixture drift per ui/CLAUDE.md)**

Run: `pnpm --filter @variscout/ui build && pnpm --filter @variscout/core build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/ packages/core/src/i18n/
git commit -m "feat(wall): factor glyphs + Finding-mediated signed edges + domain-weighted focus (CS-12 slice A)"
```

---

### Task 5: Retire the glue — ONE atomic deletion-cascade dispatch (Opus)

> Per `feedback_atomic_sweep_one_dispatch`: one implementer with internal **Architect → Migration → Validator** phases + per-category commits. tsc is the guide: delete, build, fix every error the deletion surfaces, repeat.

**Category A — delete `CanvasWallOverlay` + its support chain:**

- Delete `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx` + `internal/__tests__/CanvasWallOverlay.test.tsx`.
- `packages/ui/src/components/Canvas/index.tsx`: remove the mount (`:662`), the import (`:66`), the `'wall'` availableOverlays gating (`:326-336` — `hasInvestigationContent`, `useHasAnalyzeContent` import, the `'wall'` append, the `pickerAvailableOverlays` mobile filter if now an identity), and the `wallFindings` memo (`:325`) **iff** grep shows the overlay was its only consumer.
- `packages/hooks/src/useCanvasAnalyzeOverlays.ts`: remove `'wall'` from `CanvasOverlayId` (`:11`) + its registry entry (`:46`).
- `packages/ui/src/components/Canvas/internal/CanvasOverlayPicker.tsx`: remove both `overlay.id === 'wall'` branches (`:29,:31`) + the two mocked keys in its test (`:13-14`).
- Delete `packages/hooks/src/useSharedWallProps.ts` + test; delete `packages/hooks/src/useHasAnalyzeContent.ts` + test (grep first — verified single/dual consumers above; abort + flag if a new consumer appeared).
- `packages/hooks/src/index.ts`: drop the 3 export blocks (`:87-90`, `:429-430`).
- i18n removal sweep #1: `'canvas.wall.overlayLabel'` + `'canvas.wall.overlayDescription'` from `types.ts` (`:937-938`) + all 32 catalogs.
- Commit: `refactor(canvas): delete CanvasWallOverlay + the 'wall' overlay chain (CS-12 §7.1)`

**Category B — trim `LocalMechanismView` to step-local content:**

- Remove: the embedded `WallCanvas` section (`:421-440`) + import (`:17`); the compact `EvidenceMapBase` section (`:398-419`) + imports (`EvidenceMapBase`, `useEvidenceMapData`) + the `evidenceMapData`/`bestSubsets`/`mainEffects`/`causalLinks` plumbing that only fed it (keep `computeBestSubsets` import ONLY if still used — tsc decides); `handleSelectWallHub` + `handleEvidenceFactorClick`; the response-path CTA block in `ColumnMiniChart` (`:215-240`, `data-testid="response-path-ctas"`) + its `onFocusedInvestigation`/`onCharter` plumbing.
- Keep: column mini-charts grid, η² `contributionRankings` section, `LogActionModal` quick-action flow, `conditionMentionsStep`/`collectConditionColumns`/`hasInvestigationContext` (still feed `showRankings`).
- Props that lose all consumers (`onOpenWall`, `onSelectWallHub`, `onOpenInvestigationFocus`, `onFocusedInvestigation`, `onCharter`) cascade out of `LocalMechanismViewProps` → `CanvasLevelRouter` (`:68-74,:112-118,:173+`) → `CanvasWorkspace` → `Canvas/index.tsx` → both apps' canvas wiring — **tsc-guided; remove a prop ONLY when every consumer died** (e.g. `onOpenInvestigationFocus` may have other Canvas consumers — verify before touching each).
- i18n removal sweep #2: grep `canvas.localMechanism.*` usages post-trim; remove orphaned keys (`evidenceMap`, `analyzeWall`, `focusedAnalyze`, `focusedAnalyzeAria`, `charter`, `charterAria` — verify each is truly orphaned) from `types.ts` + all 32 catalogs.
- Commit: `refactor(canvas): trim LocalMechanismView to step-local content — glued stack retired (CS-12 §7.1)`

**Category C — tests:**

- `LocalMechanismView.test.tsx`: drop glued-stack cases; ADD negative controls — `wall-canvas`/`evidence-map-base`/`response-path-ctas` testids ABSENT; keep mini-chart + rankings coverage green.
- `CanvasLevelRouter.test.tsx` + `CanvasWorkspace.test.tsx`: prop-shape updates.
- **Quarantined `Canvas.test.tsx`** (`describe.skip`, investigations.md): update its `LocalMechanismView` mock surface to the trimmed props so it stays compile-clean, but **leave it skipped** — do NOT unquarantine.
- Grep-proof (Validator phase): `grep -rn "CanvasWallOverlay\|useSharedWallProps\|useHasAnalyzeContent" packages/ apps/` → zero hits outside git history; `grep -rn "'wall'" packages/hooks/src/useCanvasAnalyzeOverlays.ts` → gone.
- Run: `pnpm --filter @variscout/ui test && pnpm --filter @variscout/hooks test && pnpm --filter @variscout/ui build && pnpm --filter @variscout/hooks build`, then targeted app builds.
- Commit: `test(canvas): glue-retirement coverage — negative controls + trimmed prop seams (CS-12)`

---

### Task 6: Docs propagation (apply-phase §10 items, in-PR)

**Files:** `docs/07-decisions/adr-086-unified-investigation-canvas.md` · `docs/decision-log.md` · `docs/ephemeral/investigations.md` · `docs/superpowers/specs/2026-06-02-connective-surface-model-design.md` · `packages/ui/CLAUDE.md`

- [ ] **ADR-086 — new "Amendment (2026-06-03) — delivered state (PR-CS-12)"** after the 2026-05-31 amendment:
  1. The **derived, Finding-mediated factor↔hypothesis edges are DELIVERED** on the Wall (glyphs at the layout factor band + signed edges; `factor:`-namespaced DOI nodes). This **supersedes Amendment §2's "typed edge is DEFERRED"** for the derived form — which is exactly what Amendment §1 prescribed (derived projection, never stored; still NO `Hypothesis.factorIds`, no persisted factor→cause edge).
  2. **CausalLink Wall overlay: not-now** (spec §12 Q3 resolved) — `CausalLink` stays a factor→factor DAG edge rendered in Evidence Map + Report only; revive trigger = user demand.
  3. **The glue is retired:** `CanvasWallOverlay` deleted; `LocalMechanismView` trimmed to step-local mini-charts + rankings; the Analyze-tab Wall is the single `WallCanvas` home. Update §Consequences line 86 ("will be superseded … not yet") to the delivered phrasing **and fix its mismatched `**` markdown\*\* from the CS-1 retraction edit.
  4. **Focus lens is domain-weighted** (`contribution × graph-distance` via `domainWeightedOpacity`); still never moves model metrics (Amendment §4 holds).
- [ ] **decision-log.md** — entries: (a) §12 Q3 CausalLink-overlay → **not-now**, revive trigger named; (b) factor-edge design locked (derived Finding-mediated, `factor:` namespacing, band-callback contribution source); (c) LMV trim depth (step-local survives; glued stack + leftover response-path CTAs retired).
- [ ] **investigations.md** — ADD: "**Evidence Map post-Model-B fate** [LOGGED 2026-06-03] — with the Wall now rendering factors + factor↔hypothesis edges (CS-12), the Evidence Map's unique residue = cross-scope view + factor→factor CausalLink arrows + R²-sized network look. Evaluate keep-separate vs absorb vs retire with both surfaces live; touches ADR-074/086, CS-7 parity, Report, and where CausalLinks render." ALSO note on the existing ΔR²→`Finding.modelContext` entry: CS-12 nomination not taken; stays deferred.
- [ ] **Spec 2026-06-02** — §7.1 grounding-correction note (mirror the §2A CS-P1 pattern): `factorPositions` was live in production (FE-1) and `kind:'factor'` was deleted by CS-1 — CS-12's real delta was glyphs + factor edges + DOI weighting + the retirement. §12 Q3: mark **RESOLVED 2026-06-03 (not-now)**. §4.3/§4.4: one-line delivered-state notes.
- [ ] **packages/ui/CLAUDE.md** — update the Canvas invariants bullet: the Wall's single home is the Analyze tab (`CanvasWallOverlay` retired CS-12); `LocalMechanismView` is step-local-only (no embedded Wall/EvidenceMap).
- [ ] Run `bash scripts/docs-validate.sh` (or the doc-validation hook's command) — clean.
- [ ] Commit: `docs(cs-12): ADR-086 delivered-state amendment + decision-log + Evidence-Map-fate question + spec corrections`

_(Master-plan delivery record + sub-plan `status: delivered` flip happen post-merge on main, per CS-8…CS-11 convention.)_

---

### Task 7: Final gate (controller-level — NOT inside implementer prompts)

- [ ] `bash scripts/pr-ready-check.sh` green (controller runs it — `feedback_implementer_long_bash_pitfall`).
- [ ] Final adversarial Opus code review on the whole branch — STEP 0 checkout (`feedback_code_review_subagent_must_checkout_pr_branch`); verify the negative controls actually fail under revert (`feedback_load_bearing_tests`): (a) revert the wallLayout factor-edge block → Task 1+4 edge tests fail; (b) revert `focusFor` weighting → the mutation-guard test fails.
- [ ] **`--chrome` 13-15″ viewport verify** (laptop rule 12): factor band + glyphs legible; edges don't hairball with ~6 factors × 3 hubs; band panel doesn't overlap the glyph row; focus dims correctly; Minimap consistent; no scrunch/scrollbars.
- [ ] `gh pr merge --merge --delete-branch` (never `--squash`).

## Non-goals (explicit)

- No `CausalLink` rendering on the Wall (not-now, §12 Q3). No factor-family LOD / edge bundling (§4.4 deferred). No ACH matrix. No mobile work. No Evidence Map changes (`EvidenceMapBase` keeps its standalone surface; `CrossTypeEvidenceMap` untouched). No `Hypothesis.factorIds` or any stored factor edge. No ΔR²→`Finding.modelContext` capture wiring (stays deferred). No re-ingest / §12 Q5 work. No unquarantining `Canvas.test.tsx`.
