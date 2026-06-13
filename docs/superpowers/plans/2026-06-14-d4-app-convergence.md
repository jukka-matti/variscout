---
tier: ephemeral
purpose: build
title: 'D4 app convergence — delete dead Azure client + Cpk-no-specs honesty fix'
audience: agent
status: active
date: 2026-06-14
layer: spec
topic: [d4, app-convergence, azure, workspace-app, deletion-sweep, cpk, local-first, adr-093]
related:
  - docs/superpowers/specs/2026-06-14-d4-app-convergence-design.md
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# D4 App Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete D4 source-level convergence by deleting the dead `apps/azure/src` legacy client and fixing the Wall problem-condition card's "Cpk 0.00 with no specs" honesty bug, leaving one client codebase (`@variscout/workspace-app`) and `apps/azure` as a server-only deployment host.

**Architecture:** Build-level convergence already shipped (#388/#389): the company deployment builds `@variscout/workspace-app` at `VITE_VARISCOUT_CHANNEL=company`, so `apps/azure/src` ships in no deployment and is a dead leaf (nothing imports from it). PR-1 deletes it (contained atomic sweep, leads with a grounding gate). PR-2 fixes the Cpk honesty bug once in the surviving canonical `AnalyzeView` + the shared `ProblemConditionCard`. A live chrome walk verifies the converged build.

**Tech Stack:** pnpm workspaces + turbo, Vite (channel builds), React + TypeScript, Zustand stores, Vitest + React Testing Library, Playwright (e2e), `@variscout/core` i18n catalog.

**Spec:** `docs/superpowers/specs/2026-06-14-d4-app-convergence-design.md`

**Orchestration:** Lean loop. PR-1 = one Opus implementer (atomic-sweep carve-out — do NOT split). PR-2 = Sonnet implementer + one Opus adversarial review. Each PR in its own `.worktrees/<branch>/`; main session stays at repo root. Merge `gh pr merge --merge --delete-branch`.

---

## PR-1 — Deletion sweep (`feat/d4-delete-azure-client`)

> One Opus implementer, own worktree. The deletion is contained (leaf) but spans config files, so a single dispatch with an internal grounding → delete → validate flow, not artificial sub-splits.

### Task 1: Worktree + grounding gate (NO deletion yet)

**Files:** read-only this task.

- [ ] **Step 1: Create the worktree**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite worktree add .worktrees/d4-delete-azure-client -b feat/d4-delete-azure-client origin/main
```

- [ ] **Step 2: Confirm `apps/azure/src` is a true leaf**

Run (from the worktree root):

```bash
grep -rn "apps/azure/src\|@variscout/azure-app" packages apps/pwa apps/website apps/docs --include="*.ts" --include="*.tsx" --include="*.json" | grep -v node_modules
```

Expected: NO hits importing `apps/azure/src` from `packages/**` or `apps/pwa/**`. (A `package.json` devDependency `"@variscout/workspace-app"` inside `apps/azure` is fine — that's the build direction.) If any package or another app imports `apps/azure/src`, STOP and report — the leaf assumption is wrong.

- [ ] **Step 3: Resolve the Playwright e2e disposition (the one real unknown)**

```bash
ls apps/azure/*.config.* apps/azure/playwright.config.* apps/azure/e2e apps/azure/tests 2>/dev/null
grep -rln "apps/azure/src\|from '\.\./src\|import.*src/" apps/azure --include="*.spec.ts" --include="*.e2e.ts" 2>/dev/null | grep -v node_modules
# Does the e2e drive a served build (baseURL/webServer) or import src?
grep -rn "webServer\|baseURL\|build:legacy-client\|server.js\|dist" apps/azure/playwright.config.* 2>/dev/null
```

Decide and record in the PR description:

- If the e2e drives the **served workspace-app `dist`** (webServer points at `server.js` / `preview`, no `src` imports) → **keep** the e2e; it still validates the company deployment.
- If the e2e **imports `apps/azure/src`** (tests the dead client) → **delete** it with the client.

- [ ] **Step 4: Inventory `src`-only config references**

```bash
sed -n '1,60p' apps/azure/vite.config.ts 2>/dev/null
sed -n '1,40p' apps/azure/tsconfig.json 2>/dev/null
grep -n "azure" eslint.config.js
grep -rn "apps/azure/src" turbo.json vitest.* apps/azure/.gitignore 2>/dev/null
```

Record which lines reference `src` (to remove) vs. the build script / server / `dist` (to keep). No edits this task.

- [ ] **Step 5: Commit the grounding notes into the PR body draft (no code commit)**

Write the findings (leaf confirmed; e2e disposition; config-line inventory) to the PR description draft. Proceed to Task 2.

### Task 2: Delete the dead client tree

**Files:**

- Delete: `apps/azure/src/` (entire directory incl. `__tests__`)
- Modify: `apps/azure/package.json` (remove `build:legacy-client`)
- Modify (conditional on Task 1): `apps/azure/vite.config.ts`, `apps/azure/tsconfig.json`

- [ ] **Step 1: Remove the legacy client**

```bash
git rm -r apps/azure/src
```

- [ ] **Step 2: Delete the dead `build:legacy-client` script**

In `apps/azure/package.json`, remove the line:

```json
"build:legacy-client": "tsc && vite build",
```

(Confirmed dead in Task 1 / spec grounding — referenced by nothing.)

- [ ] **Step 3: Remove `src`-only Vite/tsc config**

Per Task 1 Step 4 inventory: delete `apps/azure/vite.config.ts` if it ONLY served `src` (the company bundle is built by `scripts/build-company-workspace.mjs` via the workspace-app filter, not this config). Trim `apps/azure/tsconfig.json` to what the server / build script / e2e (if kept) need; if nothing remains, delete it. Keep `apps/azure/dist` in `.gitignore`.

- [ ] **Step 4: Verify the company build still works without `src`**

```bash
pnpm --filter @variscout/azure-app build
```

Expected: PASS — produces `apps/azure/dist/` (the workspace-app company bundle). This is the proof the deletion didn't touch the live build path.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(d4): delete dead apps/azure/src legacy client

Ships in no deployment — the company channel builds @variscout/workspace-app
(#388). apps/azure/src was a leaf (nothing imports from it). CoScout engine
preserved in packages/{core,hooks,ui}; only the dead Azure orchestration glue
(apps/azure/src/features/ai/*) is removed. This commit is the reference point
for the deleted glue when CoScout is re-wired into workspace-app.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: Reconcile e2e + eslint boundary + turbo

**Files:**

- Modify: `eslint.config.js` (the `type: 'azure'` boundary)
- Modify (conditional): `apps/azure` Playwright config / e2e per Task 1 Step 3
- Modify (if referenced): `turbo.json`, root `vitest` config

- [ ] **Step 1: Resolve the eslint boundary**

In `eslint.config.js`, the `type: 'azure'` boundary (pattern `apps/azure/src/**`) now matches nothing. Remove that boundary entry (and its `pwa`-vs-`azure` distinction if it only existed to separate two client trees). Keep the `workspace-app`/`apps/pwa/src` boundary intact.

- [ ] **Step 2: Apply the e2e decision from Task 1**

If "delete": `git rm` the e2e specs + Playwright config that tested the dead client. If "keep": leave them; confirm `webServer` targets `node server.js` serving `dist`.

- [ ] **Step 3: Clean any remaining `apps/azure/src` references**

```bash
grep -rn "apps/azure/src" . --include="*.json" --include="*.js" --include="*.ts" --include="*.mjs" | grep -v node_modules | grep -v "\.worktrees"
```

Expected after cleanup: no hits (or only historical doc references, which are fine).

- [ ] **Step 4: Lint passes**

```bash
pnpm --filter @variscout/azure-app lint 2>/dev/null || pnpm lint
```

Expected: PASS (no orphaned boundary, no dangling references).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(d4): drop azure eslint boundary + reconcile e2e after src deletion

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: Tighten `apps/azure/CLAUDE.md`

**Files:**

- Modify: `apps/azure/CLAUDE.md`

- [ ] **Step 1: Reframe the package as a server/host**

Edit the header/summary to state: "**Server / deployment host package — not a client app.** Serves the `@variscout/workspace-app` company-channel bundle (`scripts/build-company-workspace.mjs` → `dist/`) via `server.js` (CSP, `/health`, `/config`, EasyAuth client-principal parse, ephemeral SSE relays). No client source lives here; the client is `@variscout/workspace-app` at `apps/pwa/`." Remove any guidance referencing the deleted `src/` client surfaces.

- [ ] **Step 2: Commit**

```bash
git add apps/azure/CLAUDE.md
git commit -m "docs(d4): apps/azure is the server/host package, not a client app

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: Full green bar + PR

- [ ] **Step 1: All channels build**

```bash
pnpm build:workspace:free && pnpm build:workspace:individual && pnpm build:workspace:company && pnpm --filter @variscout/azure-app build
```

Expected: all PASS.

- [ ] **Step 2: Tests + guardrails + pr-ready-check**

```bash
pnpm test
pnpm check:adr-093-guardrails
bash scripts/pr-ready-check.sh
```

Expected: all PASS. (The azure `vitest` suite shrinks to server-level tests only; if `apps/azure` had only client tests and the e2e was deleted, confirm the `test` script still exits 0 or update it to reflect server-only scope.)

- [ ] **Step 3: Open the PR**

```bash
git push -u origin feat/d4-delete-azure-client
gh pr create --title "feat(d4): delete dead apps/azure/src legacy client" --body "<grounding notes from Task 1 + the CoScout-engine-preserved note + green-bar evidence>"
```

- [ ] **Step 4: Adversarial review (Opus) → address → merge**

After review passes: `gh pr merge --merge --delete-branch`. Then `git -C <repo-root> worktree remove .worktrees/d4-delete-azure-client`.

---

## PR-2 — Cpk-no-specs honesty fix (`fix/d4-cpk-no-specs`)

> Sonnet implementer + one Opus adversarial review. TDD. Own worktree. Branch from main AFTER PR-1 merges (PR-2 touches `AnalyzeView`, untouched by PR-1, so order is for cleanliness not correctness).

The prop chain is: `AnalyzeView` (`problemCpk={0}`) → `WallCanvas` (`problemCpk: number`) → `ProblemConditionCard` (`cpk: number` → renders `Cpk {formatStatistic(cpk)}` = "Cpk 0.00"). The fix makes `cpk` optional end-to-end and computes the real scoped value at the `AnalyzeView` caller.

### Task 6: Worktree + new i18n key

**Files:**

- Modify: `packages/core/src/i18n/types.ts`
- Modify: `packages/core/src/i18n/messages/en.ts` (+ all other `messages/*.ts` locales)

- [ ] **Step 1: Create the worktree**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite worktree add .worktrees/d4-cpk-no-specs -b fix/d4-cpk-no-specs origin/main
```

- [ ] **Step 2: Add the type key**

In `packages/core/src/i18n/types.ts`, next to `'wall.problem.eventsPerWeek': string;` (~line 968), add:

```ts
  'wall.problem.noSpecs': string;
```

- [ ] **Step 3: Add the English message**

In `packages/core/src/i18n/messages/en.ts`, next to `'wall.problem.eventsPerWeek'` (~line 886), add:

```ts
  'wall.problem.noSpecs': 'no specs set',
```

- [ ] **Step 4: Add the key to every other locale (English fallback, translate later)**

For each `packages/core/src/i18n/messages/{da,ar,nb,ro,de,es,zhHans,uk,it,...}.ts`, add `'wall.problem.noSpecs': 'no specs set',` adjacent to the existing `wall.problem.*` keys. (Adding to `types.ts` makes the key required in all locales — tsc fails otherwise.)

- [ ] **Step 5: Verify i18n typechecks**

```bash
pnpm --filter @variscout/core build
```

Expected: PASS (no missing-key tsc errors across locales).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/i18n
git commit -m "feat(i18n): add wall.problem.noSpecs key for the Cpk-no-specs card state

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 7: `ProblemConditionCard` — optional cpk + honest render (TDD)

**Files:**

- Test: `packages/ui/src/components/AnalyzeWall/__tests__/ProblemConditionCard.test.tsx` (create if absent)
- Modify: `packages/ui/src/components/AnalyzeWall/ProblemConditionCard.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react';
import { ProblemConditionCard } from '../ProblemConditionCard';

// Renders inside an <svg> because the component is a <g> subtree.
const renderInSvg = (ui: React.ReactElement) => render(<svg>{ui}</svg>);

describe('ProblemConditionCard cpk honesty', () => {
  it('renders "no specs set" when cpk is undefined', () => {
    const { container } = renderInSvg(
      <ProblemConditionCard ctsColumn="Diameter" cpk={undefined} eventsPerWeek={0} x={100} y={0} />
    );
    expect(container.textContent).toContain('no specs set');
    expect(container.textContent).not.toContain('Cpk 0.00');
  });

  it('renders the Cpk value when cpk is a number', () => {
    const { container } = renderInSvg(
      <ProblemConditionCard ctsColumn="Diameter" cpk={1.33} eventsPerWeek={5} x={100} y={0} />
    );
    expect(container.textContent).toContain('Cpk 1.33');
    expect(container.textContent).not.toContain('no specs set');
  });
});
```

- [ ] **Step 2: Run it — verify it fails**

```bash
pnpm --filter @variscout/ui test ProblemConditionCard
```

Expected: FAIL — `cpk={undefined}` is a type error (prop is `cpk: number`) and the "no specs set" branch doesn't exist.

- [ ] **Step 3: Make `cpk` optional in the props**

In `ProblemConditionCard.tsx`, change line 24:

```ts
cpk: number | undefined;
```

- [ ] **Step 4: Render honestly when cpk is undefined**

In the component body, replace the `cpkFormatted` derivation (line 66) and the line-50 `<text>` (lines 131–133) so the label branches:

```ts
const cpkText =
  cpk === undefined
    ? getMessage(locale, 'wall.problem.noSpecs')
    : `Cpk ${formatStatistic(cpk, locale, 2)}`;
```

```tsx
<text x={CARD_W / 2} y={50} textAnchor="middle" className="fill-content-muted text-xs">
  {ctsColumn} · {cpkText}
</text>
```

Also guard the aria-label (line 67–71): pass `cpk: cpk === undefined ? getMessage(locale, 'wall.problem.noSpecs') : formatStatistic(cpk, locale, 2)` so the screen-reader label is honest too.

- [ ] **Step 5: Run the test — verify it passes**

```bash
pnpm --filter @variscout/ui test ProblemConditionCard
```

Expected: PASS.

- [ ] **Step 6: Build (tsc catches drift vitest misses)**

```bash
pnpm --filter @variscout/ui build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/ProblemConditionCard.tsx packages/ui/src/components/AnalyzeWall/__tests__/ProblemConditionCard.test.tsx
git commit -m "fix(ui): ProblemConditionCard renders 'no specs set' instead of Cpk 0.00

cpk prop is now number|undefined; undefined renders the no-specs state.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 8: `WallCanvas` — pass `problemCpk` through as optional

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`

- [ ] **Step 1: Widen the prop type**

Line 253:

```ts
problemCpk: number | undefined;
```

(Line 1338 already forwards `cpk={problemCpk}` to `ProblemConditionCard` — now type-compatible.)

- [ ] **Step 2: Build**

```bash
pnpm --filter @variscout/ui build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/WallCanvas.tsx
git commit -m "fix(ui): WallCanvas threads problemCpk as number|undefined

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 9: `AnalyzeView` — compute the real scoped Cpk + out-of-spec count

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`

> **Grounding decision for the implementer (resolve before coding, ~5 min):** the Wall card describes the **scoped subset**. `AnalyzeView` already holds the drilled subset as the `filteredData` prop (line 108) and `wallScopeSpecs` (line 143). The deleted Azure mirror used `useAnalysisStats()` (store-derived: reads `useFilteredData()` + `measureSpecs[outcome] ?? specs` from the project store — see `packages/hooks/src/useAnalysisStats.ts`). Verify whether the store's `useFilteredData()` returns the SAME subset as `AnalyzeView`'s `filteredData` prop in the Wall context:
>
> - **If yes (same subset):** call `useAnalysisStats()` and read `stats?.cpk` + `stats?.outOfSpecPercentage` — least code, inherits the per-measure-spec fix.
> - **If no (prop is a narrower drill):** compute Cpk over the `filteredData` prop + `wallScopeSpecs` using the core stats util `useAnalysisStats` wraps (`useAsyncStats`/the worker stats fn), so the card matches the rest of `AnalyzeView`.
>   Pick one, note it in the PR. Steps below show the `useAnalysisStats` path; adapt if grounding says otherwise.

- [ ] **Step 1: Derive real values (replace the hardcoded zeros)**

Near the other derived memos (after `wallScopeSpecs`, ~line 147), add:

```ts
const { stats } = useAnalysisStats();
const problemCpk = stats?.cpk; // number | undefined — undefined when no usl/lsl
const problemEvents = useMemo(() => {
  if (stats?.outOfSpecPercentage == null || filteredData.length === 0) return 0;
  return Math.round((stats.outOfSpecPercentage / 100) * filteredData.length);
}, [stats, filteredData]);
```

Add the import: `import { useAnalysisStats } from '@variscout/hooks';` (confirm the export path).

- [ ] **Step 2: Pass them to `WallCanvas`**

Replace lines 875–876:

```tsx
problemCpk = { problemCpk };
eventsPerWeek = { problemEvents };
```

- [ ] **Step 3: Build the app (tsc covers test files here too)**

```bash
pnpm --filter @variscout/workspace-app build
```

Expected: PASS (`problemCpk: number | undefined` now matches the widened `WallCanvas` prop).

- [ ] **Step 4: Run the app's tests**

```bash
pnpm --filter @variscout/workspace-app test
```

Expected: PASS. If a snapshot/RTL test asserted "Cpk 0.00" on the Wall, update it to the honest expectation ("no specs set" with no specs; a real value with specs).

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx
git commit -m "fix(workspace-app): compute real scoped Cpk + out-of-spec count for the Wall

Stop hardcoding problemCpk={0}/eventsPerWeek={0}; undefined Cpk when scope has
no spec limits renders 'no specs set'. Ports the logic the deleted Azure
AnalyzeWorkspace had.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 10: Green bar + PR

- [ ] **Step 1: Full green bar**

```bash
pnpm build
pnpm test
bash scripts/pr-ready-check.sh
```

Expected: all PASS.

- [ ] **Step 2: Open the PR + adversarial review (Opus) → merge**

```bash
git push -u origin fix/d4-cpk-no-specs
gh pr create --title "fix(d4): Wall problem-condition card honest about missing specs" --body "<the grounding decision from Task 9 + before/after + green-bar evidence>"
```

After review passes: `gh pr merge --merge --delete-branch`; then `git -C <repo-root> worktree remove .worktrees/d4-cpk-no-specs`.

---

## Verification walk (after both PRs merge — no PR unless defects)

Live `claude --chrome` on the converged build (the single app all deployments ship). Run on a **fresh session**; clear stale `.vite` caches first; brush gestures need full JS `MouseEvent` dispatch on the I-Chart SVG (CDP drags don't reach the React handlers).

- [ ] Load a dataset, drill to a scope, open the Analyze tab Wall.
- [ ] **Cpk fix:** with NO spec limits set, the problem-condition card shows "no specs set" (NOT "Cpk 0.00"). Set spec limits → it shows a real Cpk value + a real out-of-spec event count.
- [ ] **ER surfaces** (deferred from the Explore mission, now verified once on the converged app):
  - `DefectDispatchBanner` — count-Y auto-dispatch banner appears + is correctable.
  - defect-rate `FactorStrip` variant renders.
  - ΔR² upgrade in the strip ("in the model" caption + residual).
  - ⚡ interaction chip applies the focal-level comparison highlight on click.
- [ ] Any defect → a `docs/investigations.md` entry, NOT scope-creep into the PRs above.

---

## Self-review notes (coverage vs. spec)

- Spec "delete apps/azure/src + config cleanup" → PR-1 Tasks 2–4. ✓
- Spec "Playwright e2e is the one real unknown → grounding gate before deletion" → PR-1 Task 1 Step 3. ✓
- Spec "leaf-safety grep" → PR-1 Task 1 Step 2. ✓
- Spec "CoScout engine preserved; record in PR description" → PR-1 Task 2 Step 5 commit message. ✓
- Spec "Cpk: card prop → number|undefined; 'no specs set'; compute real scoped Cpk+events, undefined when no usl/lsl" → PR-2 Tasks 7–9. ✓
- Spec "keep apps/azure, no rename" → no rename task exists. ✓
- Spec "verification walk on converged build (ER surfaces + Cpk)" → Verification walk section. ✓
- Non-goal "no company-channel licensing/CoScout wiring" → no such task exists. ✓
