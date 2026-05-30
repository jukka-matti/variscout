# IM-4c — Unified Wall layout + Focus lens + propose-hypothesis-from-finding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: this is integration-heavy visual work — execute as a SINGLE Opus implementer (per the IM-4b TDD-pipeline trial verdict: leaf-scoped test-author→implementer pipelines ship green-but-dead UI). Wire features through the production seam and run the FULL `pnpm build` + both-app `tsc`, not targeted tsc. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Realize the last unbuilt half of the IM-4 spec §8.6 — unify the Wall's contributing-factors band + hypothesis river into ONE coordinate space owned by a single position authority (killing the 3× duplicated layout math), add the Focus lens (degree-of-interest dimming), give orphan findings a home on the Wall, and wire the descoped `createHubFromFinding` ("propose hypothesis from finding") CTA. After this, only IM-6 remains.

**Architecture:** A new pure layout authority `computeWallLayout(...)` (+ a thin `useWallLayout` hook) returns `{ hubPositions, findingPositions, factorPositions, edges }` in the existing fixed 2000×1400 Wall user-space. `WallCanvas` renders from it; `Minimap` and both apps' pan-to-node consume the SAME exposed positions instead of recomputing. The Focus lens pins a single `focusedWallEntityId` to `viewStore` (ADR-086 line 77: do not let each renderer hold its own focus state) and a pure `wallDegreeOfInterest(...)` maps contribution × graph-distance → an opacity tier applied in the Wall renderers + Minimap. Orphan findings (linked to no hypothesis) get a holding lane on the Wall with a "Propose hypothesis" affordance that calls `createHubFromFinding` through the app's Wall-hubs source-of-truth (NOT a bare store call — see Task 4 trap).

**Tech Stack:** React + SVG (visx-style), Zustand (`viewStore`, `analyzeStore`), Vitest + Testing Library. Spec: `docs/superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md` §3/§8.6/§9/§10/§11. ADR: `docs/07-decisions/adr-086-unified-investigation-canvas.md` (refined by the spec — Wall is canonical; Evidence Map stays the SEPARATE cross-scope overview, NOT ported here).

---

## Scope boundaries (do NOT build — spec §9)

Child-scope recursion / `parentScopeId` / scope-tree · live presence (cursors/typing) · the §7.2 replace-re-evaluate cascade (IM-3 is plans-only) · factor-family LOD clustering + edge bundling + semantic-zoom coarsening (Focus lens is dimming ONLY, must NOT ride `CanvasLevel`) · the ACH matrix (dropped) · porting `EvidenceMapBase`'s radial layout into the Wall (the Evidence Map remains a separate cross-scope overview component). Keep `CrossTypeEvidenceMap` (spec §10 #2 — retain as the defect-frame view).

## Anti-"green-but-dead" discipline (IM-4b lesson — MANDATORY)

The IM-4b first pass shipped 5/6 features green-but-dead: leaf components were unit-tested with injected props but never wired into the production `WallCanvas → card → app` seam. For EVERY feature in this plan:

1. Wire it through the production path (WallCanvas position authority → renderer → app callback), not just the leaf.
2. Add/extend a **seam test** that renders the REAL `WallCanvas` (and, where the app owns the wiring, the real `AnalyzeWorkspace`) and asserts the behavior renders + dispatches through the production callback — a dead feature must FAIL it. Precedent: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.collab.seam.test.tsx`.
3. Assert on REAL rendered output (`opacity`, `data-*`, tether endpoints, rendered labels) — not prop spies that pass when the feature is unrendered.
4. Run the FULL `pnpm build` (both app vite builds) + both-app `tsc --noEmit` before declaring done.

---

## File Structure

- **Create** `packages/ui/src/components/AnalyzeWall/wallLayout.ts` — pure `computeWallLayout(args): WallLayout` (hub/finding/factor positions + edges) + the `WallLayout` type. Pure, deterministic, unit-testable. No React.
- **Create** `packages/ui/src/components/AnalyzeWall/useWallLayout.ts` — thin hook memoizing `computeWallLayout` over the WallCanvas inputs. (Or co-locate as a `useMemo` in WallCanvas if the hook adds no value — implementer's call; the PURE fn is the must.)
- **Create** `packages/ui/src/components/AnalyzeWall/wallFocus.ts` — pure `wallDegreeOfInterest(focusedId, entityId, edges): number` (0=focused, 1=adjacent, 2+=distant) → opacity tier helper `focusOpacity(doi)`.
- **Modify** `packages/stores/src/viewStore.ts:13-26` — add `focusedWallEntityId: string | null` + `setFocusedWallEntity(id|null)` (mirror the existing `highlighted*` pattern). Reset in the store's initial-state object.
- **Modify** `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` — render hubs/findings/factors/tethers from `computeWallLayout`; apply Focus-lens opacity; add the orphan-finding lane + `onProposeHypothesis` threading; click-to-focus / click-empty-to-clear.
- **Modify** `packages/ui/src/components/AnalyzeWall/Minimap.tsx:52-61` — consume exposed positions; apply focus dimming to dots.
- **Modify** `packages/ui/src/components/AnalyzeWall/FindingChip.tsx:19-21,38` — add optional `onProposeHypothesis?: (findingId: string) => void` + the affordance; delete the IM-4c-deferral comment.
- **Modify** `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` — wire `onProposeHypothesis`, consume exposed positions in `handleWallPanToNode` (:513-528), feed `focusedWallEntityId`.
- **Modify** `apps/pwa/src/components/views/AnalyzeView.tsx` — same wiring (`handlePanToNode` :160-176).
- **Modify** test: `packages/ui/src/components/AnalyzeWall/__tests__/HypothesisCardWithPlans.ideasSection.test.tsx:333-362` — FLIP the descope guard (FindingChip now renders Propose-hypothesis when wired; still absent when not).
- **Create** seam tests: `WallCanvas.layout.test.tsx`, `WallCanvas.focus.seam.test.tsx`, `WallCanvas.proposeHypothesis.seam.test.tsx` (+ extend `AnalyzeWorkspace.mapwall.test.tsx` for the app-owned propose wiring).
- **Modify** `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:560` (comment) + remove the `setHubStatus` orphan (spec §10 #1) wherever it lives (grep first; verified zero prod callers).

---

## Task 1: Pure Wall layout authority (`computeWallLayout`)

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/wallLayout.ts`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts`

Extract the position math currently inline in `WallCanvas.tsx` (hub placement `CANVAS_W/(n+1)*(i+1)` at `hubY=400` :448-449/:686; tributary-grouped bands :643-685; evidence-chip columns in `renderHubEvidence` :457-540 at `x±130`; ProblemConditionCard at `(CANVAS_W/2,40)` :621-632; factors band / TributaryFooter at `y≈1300`) into a single pure function.

- [ ] **Step 1: Define the types + write failing tests.**

```ts
// wallLayout.ts
export interface WallNodePos {
  x: number;
  y: number;
}
export interface WallEdge {
  fromId: string;
  toId: string;
  kind: 'support' | 'refute' | 'factor';
}
export interface WallLayout {
  hubPositions: Map<string, WallNodePos>; // hypothesisId -> pos
  findingPositions: Map<string, WallNodePos>; // findingId -> pos (incl. orphans, see Task 4)
  factorPositions: Map<string, WallNodePos>; // factor key -> pos (contributing-factors band)
  scopeAnchor: WallNodePos; // Problem-condition card head
  edges: WallEdge[]; // tethers: finding/factor -> hub
}
export interface WallLayoutArgs {
  hubs: { id: string; findingIds: string[] /* …grouping inputs */ }[];
  findings: { id: string }[];
  factors: { key: string; contribution: number }[];
  grouping: 'linear' | 'tributary';
  canvasW: number;
  canvasH: number;
}
export function computeWallLayout(args: WallLayoutArgs): WallLayout {
  /* … */
}
```

Tests (deterministic — fixed inputs, `toBeCloseTo` for floats, NO `Date.now`/`Math.random`):

- N hubs → N hubPositions at the expected `canvasW/(N+1)*(i+1)`, all at `hubY`.
- supporting vs counter findings land on opposite sides of their hub anchor (x − vs x +); `edges` contains one `support`/`refute` edge per linked finding.
- an orphan finding (in `findings` but in no `hub.findingIds`) gets a position in the orphan lane (Task 4 reserves the lane; here assert it is positioned, distinct from any hub column).
- factors land in the contributing-factors band (shared `factorY`), ordered by contribution.
- tributary grouping partitions hubs into vertical bands (mirror current :643-685 behavior).

- [ ] **Step 2: Run tests — verify they fail.** `pnpm --filter @variscout/ui test -- --run wallLayout` → FAIL (no module).
- [ ] **Step 3: Implement `computeWallLayout`** by lifting the exact current formulas (preserve pixel behavior for the linear + tributary cases; reserve the orphan lane — e.g. a left gutter column at a fixed x, stacked).
- [ ] **Step 4: Run tests — PASS.**
- [ ] **Step 5: Commit** `feat(wall): pure computeWallLayout position authority`.

## Task 2: WallCanvas renders from the layout authority

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.layout.test.tsx` (create) + existing `WallCanvas.test.tsx`/`WallCanvas.miniChart.test.tsx` stay green.

- [ ] **Step 1: Write the seam test (failing first where it asserts new structure).** Render the REAL `WallCanvas` with 2 hubs + linked + orphan findings; assert hub `<g>`/card anchors sit at the `computeWallLayout` positions (read `transform`/`x`/`y` or a `data-wall-node-id` + `data-x`/`data-y` you add), tethers (`data-evidence-tether`) connect finding positions to hub anchors, and the counts-against chip keeps its LOUD styling (`chartColors.warning`/bold — current :489-496). This pins seam risks #5 + #6.
- [ ] **Step 2: Refactor WallCanvas** to call `computeWallLayout` (via `useMemo`/`useWallLayout`) and position hubs/findings/factors/tethers from the returned maps. Add `data-wall-node-id` + position data-attrs to each node `<g>` so Minimap/pan-to-node/tests can read positions. Keep the single viewport `<g>` (do NOT fork the pan/zoom layer).
- [ ] **Step 3: Run the full AnalyzeWall suite** `pnpm --filter @variscout/ui test -- --run AnalyzeWall` → all green (existing + new).
- [ ] **Step 4: Commit** `refactor(wall): render WallCanvas from computeWallLayout (single position authority)`.

## Task 3: Expose positions to Minimap + both apps' pan-to-node (kill the 3× duplicated math)

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` (expose positions — via an `onLayout?(layout)` callback OR an exported `computeWallLayout` both consumers call with the same inputs), `Minimap.tsx:52-61`, `apps/azure/.../AnalyzeWorkspace.tsx:513-528`, `apps/pwa/.../AnalyzeView.tsx:160-176`.
- Test: extend `WallCanvas.layout.test.tsx` + `Minimap.test.tsx`.

- [ ] **Step 1: Decide the exposure mechanism.** Prefer: both Minimap and pan-to-node import `computeWallLayout` and call it with the SAME inputs WallCanvas uses (single source of truth, no prop drilling of a Map). Document the shared-input contract.
- [ ] **Step 2: Write the failing assertion** — with tributary grouping, Minimap dot positions === `computeWallLayout` hub positions (not the old `HUD_Y=400` linear duplicate). pan-to-node target === the same hub position.
- [ ] **Step 3: Replace** `Minimap.tsx:55-61` + both apps' recomputation with `computeWallLayout` calls.
- [ ] **Step 4: Run** Minimap + both-app relevant tests → green; both-app `tsc`.
- [ ] **Step 5: Commit** `refactor(wall): Minimap + pan-to-node consume computeWallLayout`.

## Task 4: Orphan-finding home + `createHubFromFinding` CTA

**Files:**

- Modify: `FindingChip.tsx:19-21,38` (add `onProposeHypothesis`, affordance, delete deferral comment), `WallCanvas.tsx` (render orphan lane from `findingPositions`; thread `onProposeHypothesis` via the WallCanvas/planning props — mirror the IM-4b callback threading at `WallCanvas.tsx:105-151`), both apps (wire the callback).
- Test: FLIP `HypothesisCardWithPlans.ideasSection.test.tsx:333-362`; create `WallCanvas.proposeHypothesis.seam.test.tsx`; extend `AnalyzeWorkspace.mapwall.test.tsx`.

> **TRAP (seam risk #4 — verify before wiring):** `analyzeStore.createHubFromFinding` (`packages/stores/src/analyzeStore.ts:773-781`) appends to `useAnalyzeStore.hypotheses`, but the Wall renders the app's `hypothesesState.hubs` (Azure `AnalyzeWorkspace.tsx`). A bare `useAnalyzeStore.getState().createHubFromFinding(id)` may NOT re-render the Wall. Wire through whatever path actually updates the rendered hubs collection (the same path `connectFindingToHub`/hub creation already uses), or add the sync follow-through. The seam test MUST render through the app wiring (or assert the rendered hub appears), not just spy the store call.

- [ ] **Step 1: Write failing seam test** — render WallCanvas with an orphan finding → its chip renders in the orphan lane + a "Propose hypothesis" affordance; firing it calls `onProposeHypothesis(findingId)`. App-level: firing it makes a new hypothesis card appear on the Wall (render-through, not spy).
- [ ] **Step 2: Add** `onProposeHypothesis` to `FindingChip` (decide gesture: a visible button on orphan chips, or a context-menu item alongside the existing right-click `onDetach` :38) + thread through WallCanvas planning props.
- [ ] **Step 3: Wire both apps** through the rendered-hubs path (per the trap).
- [ ] **Step 4: FLIP the descope guard test** (`ideasSection.test.tsx:341-349`) to the positive assertion (renders when wired; absent when not).
- [ ] **Step 5: Run** AnalyzeWall + both-app tests + `tsc` → green.
- [ ] **Step 6: Commit** `feat(wall): orphan-finding lane + propose-hypothesis-from-finding (createHubFromFinding) wiring`.

## Task 5: Focus lens (degree-of-interest dimming)

**Files:**

- Modify: `packages/stores/src/viewStore.ts:13-26` (+ initial state), create `wallFocus.ts` + `__tests__/wallFocus.test.ts`, modify `WallCanvas.tsx` (apply opacity + click-to-focus/clear), `Minimap.tsx` (dim dots in sync).
- Test: create `WallCanvas.focus.seam.test.tsx`.

- [ ] **Step 1: Add `focusedWallEntityId` to viewStore** (`string | null`, default `null`) + `setFocusedWallEntity`. Mirror `highlighted*`. Reset in initial-state.
- [ ] **Step 2: Write failing `wallFocus` unit tests** — `wallDegreeOfInterest(focusedId, entityId, edges)`: focused→0, an entity sharing an edge with the focused hub→1, an unrelated sibling→≥2; `focusOpacity(doi)` returns vivid(1)/mid/dim tiers. Pure, deterministic.
- [ ] **Step 3: Implement `wallFocus.ts`** (BFS graph-distance over `WallLayout.edges`, clamped; opacity tiers). Focus lens is dimming ONLY — must NOT touch `CanvasLevel`/LOD (spec §9).
- [ ] **Step 4: Write failing focus SEAM test** — set `viewStore.focusedWallEntityId = 'h1'`, render REAL WallCanvas; assert h1's card + its linked findings/factors/tethers render at vivid opacity and an unrelated sibling card renders dimmed (read real `opacity`/`data-doi`). Assert clicking a card sets focus (store updated) and clicking empty canvas clears it.
- [ ] **Step 5: Implement** — apply `focusOpacity(wallDegreeOfInterest(...))` to each node `<g>`/tether in WallCanvas; wire click-to-focus + background-click-to-clear via `setFocusedWallEntity`; dim Minimap dots from the same store field (seam risk #3 — single source).
- [ ] **Step 6: Run** AnalyzeWall + stores tests → green.
- [ ] **Step 7: Commit** `feat(wall): Focus lens — degree-of-interest dimming pinned to viewStore`.

## Task 6: Delete the `setHubStatus` orphan (spec §10 #1) + cleanup

**Files:** grep `setHubStatus` across `packages/` + `apps/` first; remove the orphan + the stale `AnalyzeWorkspace.tsx:560` comment. Status is derived (`deriveHypothesisStatus`) + the disconfirmation gesture; a manual override contradicts the model.

- [ ] **Step 1: `grep -rn "setHubStatus"`** — confirm zero production callers (only comment/dead refs).
- [ ] **Step 2: Remove** the action + interface member + any dead branch + the comment.
- [ ] **Step 3: Run** stores + ui + both-app `tsc` → green.
- [ ] **Step 4: Commit** `refactor(wall): delete orphan setHubStatus (status is derived)`.

## Task 7: Full gate + i18n + docs

- [ ] **Step 1:** any new user-facing copy (orphan-lane label, "Propose hypothesis", focus affordance tooltips) → add the 32-locale `wall.*` i18n keys + `types.ts`.
- [ ] **Step 2:** `pnpm docs:gen-arch` if a new sub-path export was added (wallLayout/wallFocus) — regenerate `architecture-generated.md` (the pre-push hook checks it).
- [ ] **Step 3:** FULL gate — `bash scripts/pr-ready-check.sh` (all packages build + both app vite builds + dist integrity + all tests). Fix anything red.
- [ ] **Step 4:** both-app `tsc --noEmit` (includes test files).
- [ ] **Step 5: Commit** any i18n/docs deltas.

## Acceptance (spec §8.6 / §8.101)

Factors + hypotheses + findings co-render in ONE coordinate space owned by `computeWallLayout`; Minimap + pan-to-node consume the same positions (no duplicated math). Counts-against stays loud through the re-layout; tethers connect to the new positions. The Focus lens dims by contribution × distance from the focal cause, pinned to a single `viewStore` field (Minimap dims in sync). An orphan finding has a home on the Wall + a Propose-hypothesis affordance that spawns a hypothesis card on the Wall (render-through verified). The IM-4b collaboration affordances (comment thread, tasks, ideas) still render on the re-laid-out cards (regression-guarded by the existing collab seam test). `setHubStatus` is gone. vitest + both-app gate green; adversarial 4-dimension review run before merge.

## Self-review (against the spec)

- §3 surfaces: Problem card / hypothesis cards / contributing factors / missing-evidence / Focus lens — Tasks 1-2-5 cover layout + Focus; missing-evidence + Problem card already shipped in IM-4a (regression-guard only).
- §8.6 enumerated: ONE coordinate space (T1-2) ✓ · one viewport authority (reuse, don't fork) ✓ · expose node positions / kill duplicated math (T3) ✓ · Focus lens (T5) ✓.
- §11 net-new "bipartite re-layout + exposed positions + Focus lens" ✓; "3 detached-flow re-mounts" shipped in #257; createHubFromFinding (T4) was the descoped remainder ✓.
- Deferred boundaries (§9) respected — no LOD/bundling/recursion/presence/ACH; Evidence Map NOT ported into the Wall.
