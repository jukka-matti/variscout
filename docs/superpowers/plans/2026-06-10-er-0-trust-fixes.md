---
tier: living
purpose: build
title: 'ER-0 trust fixes sub-plan'
audience: agent
status: active
date: 2026-06-10
layer: spec
topic: [explore, findings, whatif, boxplot, violin, specs, cpk, tailwind, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
implements:
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/findings-hypotheses.md
---

# ER-0 — Numbers You Can Trust

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Execute from `.worktrees/feat/er-0-trust-fixes` on branch `feat/er-0-trust-fixes`. One implementer per task, sequential; spec + quality reviewer pair per task; commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship the six standalone correctness fixes from master plan ER-0 — finding-card condition-n, What-If bindings, natural category order, violin crash, histogram/Stats-panel spec visibility, Wall glyph color — so every number the demo surfaces can be trusted.

**Architecture:** All fixes were grounded against current main (post CC-1..CC-7) on 2026-06-10 by a 6-agent fan-out; every fix site below is verified-current. Three corrections to the master-plan text discovered at grounding and adopted here: (1) the violin crash is a Vite 8/Rolldown CJS-interop bug in `@visx/stats/lib/*` deep imports (2 files, both apps, prod + dev), not a BoxplotBase logic bug; (2) the histogram/Cpk gap is a per-measure-vs-global spec *resolution* split (rendering already exists and is tested) and Azure's I-Chart has the same bug; (3) stage order needs a day-part vocabulary — exporting DAY/MONTH tables alone cannot fix the observed Afternoon→Morning→Evening.

**Invariants in play:** stats return `number | undefined`, never fabricate (bestSubgroup guard); transform-before-stats untouched; no auto-select; P5 language in all copy; Tailwind v4 tokens must exist in `@theme`.

---

### Task 1 — Violin crash: `@visx/stats` deep-import interop (charts)

**Files:** Modify `packages/charts/src/Boxplot.tsx:7`, `packages/charts/src/PerformanceBoxplot.tsx:25`. Test: new `packages/charts/src/__tests__/architecture.noVisxDeepImports.test.ts`, extend `BoxplotRender.test.tsx` + `PerformanceBoxplot.test.tsx`.

Root cause (empirically reproduced at grounding): `import ViolinPlot from '@visx/stats/lib/ViolinPlot'` resolves to the package's CJS build; Vite 8/Rolldown default-import interop ignores `__esModule`, so `ViolinPlot` is `{ __esModule: true, default: ƒ }` at runtime → React "Element type is invalid … check the render method of `BoxplotBase`". Broken in dev AND prod since the Vite 8 upgrade (f3ec81bd8). vitest does NOT reproduce it (interopDefault honors `__esModule`), so the red-first test is an import-pattern guard, not a render test.

- [ ] Red: architecture test (read-once grep pattern per `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`) asserting no `from '@visx/<pkg>/lib/'` deep imports in `packages/charts/src` — fails on the two files today.
- [ ] Green: change both to `import { ViolinPlot } from '@visx/stats'` (named root import, pure-ESM path; usages at `Boxplot.tsx:333` / `PerformanceBoxplot.tsx:269` unchanged).
- [ ] Behavioral cover: BoxplotRender test rendering `showViolin` with a ≥7-value group (MIN_BOXPLOT_VALUES=7) asserting `path.visx-violin` renders; mirror one case in PerformanceBoxplot.test.tsx.
- [ ] `pnpm --filter @variscout/charts test` green; commit `fix(charts): violin crash — @visx/stats CJS deep-import interop under Vite 8`.

### Task 2 — Natural category order: weekdays, months, day-parts (core + hooks)

**Files:** Modify `packages/core/src/time.ts` (export `DAY_ABBR:63` / `MONTH_ABBR:45-58`; add full-name tables + day-part vocabulary + `naturalCategoryComparator`/detector), `packages/core/src/stats/boxplot.ts:105-107` (sortBoxplotData 'name' branch), `packages/core/src/stats/staged.ts:183-200` (determineStageOrder 'auto' branch), `packages/core/src/index.ts:452-460` (barrel), `packages/hooks/src/useStagedAnalysis.ts:38-41` (drive-by: pass mode-aware order into `calculateStatsByStage` — param exists at staged.ts:277). Tests: `packages/core/src/__tests__/sortBoxplotData.test.ts`, `packages/core/src/__tests__/stats.test.ts` (stage-order block :377-445), hooks test for useStagedAnalysis.

Decisions (settled here): **display order is Mon-first** (practitioner/ISO convention; `DAY_ABBR` stays Sun-first for extraction indexing — add a separate ordered display vocabulary). Day-part vocabulary = `Morning, Afternoon, Evening, Night`. Detection is **vocabulary-gated**: natural order applies only when EVERY unique key belongs to one vocabulary (case-insensitive; abbreviations + full names); subsets (e.g. Mon–Fri) sort by vocabulary index; any non-member key → existing behavior (localeCompare for boxplot; first-occurrence for stages).

- [ ] Red: boxplot tests — weekday abbr → Mon..Sun order; full names; Mon–Fri subset; months abbr+full → Jan..Dec; desc reverses; one non-member key falls back to localeCompare; composite `·` keys unaffected; mean/spread branches unaffected.
- [ ] Red: staged tests — auto + day-parts → Morning→Afternoon→Evening; auto + weekdays → natural; `data-order` mode bypasses; the existing Charlie/Alpha/Bravo first-occurrence guard (stats.test.ts:420-426) STAYS GREEN.
- [ ] Green: implement comparator in time.ts, hook into both branches; barrel exports.
- [ ] Drive-by: useStagedAnalysis passes the resolved order into calculateStatsByStage (honors 'As in data' + natural order consistently); hooks test.
- [ ] `pnpm --filter @variscout/core test && pnpm --filter @variscout/hooks test` green; commit `fix(core): natural weekday/month/day-part ordering for boxplot categories + stage auto-order`.

Out of scope, logged not built: optional adopters `factorChartData.ts:108`, `useMiniChartData.ts:50`, `EdgeMiniChart.tsx:180` (the last changes which groups survive MAX_GROUPS — needs its own look).

### Task 3 — Wall glyph black fill + theme alias + token guard (ui)

**Files:** Modify `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx:72` (`fill-surface-primary` → `fill-surface`, matching siblings FindingChip/TributaryFooter/HypothesisCard), `packages/ui/src/styles/theme.css:10` (add `--color-surface-primary: var(--surface-primary);` beside `--color-surface`). Tests: extend `packages/ui/src/components/AnalyzeWall/__tests__/FactorGlyph.test.tsx`; new `packages/ui/src/__tests__/architecture.tailwindTokens.test.ts`.

The alias repairs ~104 latent `bg-/hover:bg-/text-surface-primary` occurrences across ~45 files (grounded count; the investigations entry's "~20" is a 5× undercount — correct it in Task 7), including 2 genuinely-broken inverted-text pills (`CanvasLensPicker.tsx:65`, `MobileLevelPicker.tsx:91`). Alias value is unambiguous: every surveyed user expects the primary surface.

- [ ] Red: FactorGlyph test asserting the unfocused rect's class contains `fill-surface` and NOT `fill-surface-primary`.
- [ ] Red: architecture test — parse `theme.css` `@theme` `--color-*` names once; scan `packages/ui/src` className literals for `(bg|fill|stroke|text|border)-(surface|content|edge|status)[\w-]*` candidates (strip `/opacity` + `hover:` variants); fail on tokens with no matching `--color-*`. If this flags tokens BEYOND the surface-primary family, report DONE_WITH_CONCERNS with the list — do not mass-fix.
- [ ] Green: the two edits; both tests green.
- [ ] `pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build` green; commit `fix(ui): FactorGlyph fill token + --color-surface-primary alias + Tailwind token guard`.

### Task 4 — Per-measure spec resolution: histogram lines, Stats-panel Cpk, Azure I-Chart (hooks + ui + both apps)

**Files:** Modify `packages/hooks/src/useAnalysisStats.ts:23-24,47` (resolve `outcome ? (measureSpecs[outcome] ?? specs) : specs` before computing — the deepest fix; makes `stats.cpk` correct for all consumers), `packages/ui/src/components/ProcessIntelligencePanel/StatsTabContent.tsx:113,:247,:284` (hasSpecs gate reads per-measure-resolved specs; component already reads measureSpecs at :250), `apps/pwa/src/components/Dashboard.tsx` (derive one `effectiveSpecs` near :152; substitute at :655 tab label, :695 VerificationCard histogram, :1197 focused histogram), `apps/azure/src/components/Dashboard.tsx` (mirror: :236 → :665, :679, :1352-1356), `apps/azure/src/components/charts/IChart.tsx:48,:87` (port the PWA per-measure resolution — precedent + explanatory comment at `apps/pwa/src/components/charts/IChart.tsx:65-70`), `packages/charts/src/CapabilityHistogram.tsx:197-206` (Mean label collides with x-axis ticks — move below the tick row or anchor-shift). Adopt `useSpecsForMeasure` (`packages/hooks/src/useSpecsForMeasure.ts`, currently orphaned+tested) where a hook context allows; inline ternary otherwise.

- [ ] Red: hooks — new `useAnalysisStats` test: `measureSpecs[outcome]={usl}` + empty global specs → `stats.cpk` defined (sync fallback path, no worker).
- [ ] Red: ui — StatsTabContent test: measureSpecs-only specs → `stat-cpk` testid renders (Zustand setState-in-beforeEach pattern; vi.mock before imports; locale loaders registered).
- [ ] Red: apps — upgrade each Dashboard test's histogram mock to capture props; assert it receives the per-measure spec after `setMeasureSpec`. Azure: IChart wrapper test asserting IChartWrapperBase receives `measureSpecs[outcome]` when set; add the cheap PWA twin.
- [ ] Green: implement; do NOT touch the chart components' spec-line rendering (already correct + tested) other than the Mean-label nudge.
- [ ] `pnpm --filter @variscout/hooks test && pnpm --filter @variscout/ui test && pnpm --filter @variscout/pwa test && pnpm --filter @variscout/azure-app test` green; commit `fix(specs): resolve measureSpecs[outcome] ?? specs across stats, histogram, Stats panel, Azure I-Chart`.

Same-family items deliberately NOT here: Cpk-stability toggle gates (ER-10), What-If mount gates (Task 5).

### Task 5 — What-If bindings: factor, per-measure specs, degenerate "best" guard (core + ui + both apps)

**Files:** Modify `apps/pwa/src/components/WhatIfPage.tsx:35` (bind `useAnalysisScopeStore(s => s.boxplotFactor) ?? factors[0] ?? null`; specs via `useSpecsForMeasure`), `apps/pwa/src/hooks/useDashboardCharts.ts` (REQUIRED companion: wrap `base.setBoxplotFactor` to write-mirror into `useAnalysisScopeStore.setBoxplotFactor` — Azure's viewState pattern at `apps/azure/src/hooks/useDashboardCharts.ts:113-121`; without it the binding is stale for the picker path), `apps/azure/src/components/WhatIfPage.tsx:54` (per-measure specs — Azure is equally blind to measureSpecs), `packages/core/src/variation/bestSubgroup.ts:36-45` (guard: fallback-'nominal' + no target + not both-limits → return `undefined`; update JSDoc), `packages/core/src/variation/__tests__/bestSubgroup.test.ts:32-35` (REWRITE the test that locks the degenerate behavior), `packages/ui/src/components/WhatIfExplorer/computePresets.ts:59-66,163-213` (suppress the mean-anchored "Match X mean"/"Match X fully" presets when no direction is inferable; spread presets :182-194 stay — they are direction-independent and legitimate), PI-panel What-If mount gates `apps/pwa/src/components/ProcessIntelligencePanel.tsx:125` + `apps/azure/src/components/editor/PISection.tsx:139,236` (per-measure-resolved specs so the entry appears when a per-measure spec exists).

- [ ] Red: core — replace the locked test: nominal-fallback + no-target + no-both-limits → `undefined`; explicit `characteristicType` in specs still produces direction-correct results.
- [ ] Red: ui — NEW `computePresets.test.ts`: empty specs → no mean-anchored presets, spread preset survives; `characteristicType:'smaller'` → direction-correct presets.
- [ ] Red: apps — PWA WhatIfPage test: activeFactor from analysisScopeStore + measureSpecs-resolved specs (extend the existing mock to record props); PWA useDashboardCharts test: picker change updates `useAnalysisScopeStore.boxplotFactor`; Azure WhatIfPage test: measureSpecs resolution.
- [ ] Green; `pnpm --filter @variscout/core test && pnpm --filter @variscout/ui test && pnpm --filter @variscout/pwa test && pnpm --filter @variscout/azure-app test` green; commit `fix(whatif): bind analyzed factor + per-measure specs; no "best" without a direction`.

P5/honesty constraint: any user-facing caveat copy says what's missing ("set a spec or target to rank scenarios") — never recommends without a direction (spec §9/§11).

### Task 6 — Finding capture: condition-scoped stats (hooks + both apps)

**Files:** Modify `apps/pwa/src/App.tsx:680-686` (`handleAddChartObservation`) and `apps/azure/src/features/findings/useFindingsOrchestration.ts:208-214`. Reuse `applyFilters` (`packages/core/src/variation/drill.ts:15-26`, exported at core barrel :364). Tests: app-level handler tests (both apps).

Fix shape (handler-level, covers all five capture paths uniformly): when `captureOptions?.activeFilters` is present, compute `conditionRows = applyFilters(useProjectStore.getState().rawData, captureOptions.activeFilters)` and pass THOSE rows to `buildFindingContext` — never the unconditioned `filteredData`. **Must use `getState().rawData`, not render-scope closures**: brush/probability/engine-signal captures create a derived column via `setRawData` and capture in the SAME tick (pwa `Dashboard.tsx:465+474`, azure `Dashboard.tsx:722+730`), so closures are stale (zustand setState is synchronous; precedent comment at `apps/pwa/src/App.tsx:349-355`). Captures WITHOUT captureOptions (context-menu anchors) keep today's consistent behavior. Also resolve the specs argument per-measure (`measureSpecs[outcome] ?? specs`) in both handlers for a condition-correct Cpk. The stats field is `samples` (`core/findings/types.ts:448`), displayed at `FindingCard.tsx:314`.

- [ ] Red: PWA test — capture with `captureOptions.activeFilters={Queue:['Billing']}` over seeded rawData → persisted `context.stats.samples` equals the Billing row count (not the dashboard's), incl. a same-tick derived-column case (setRawData + capture in one act()).
- [ ] Red: Azure mirror test, same contract.
- [ ] Green; both app suites green: `pnpm --filter @variscout/pwa test && pnpm --filter @variscout/azure-app test`; commit `fix(findings): persisted finding stats computed over the captured condition's rows`.

Acceptance (chrome walk): brush n=404 in dialog → saved card shows n=404; mean/Cpk equally condition-scoped.

### Task 7 — ER-DOC: Apply-phase propagation

**Files:** Modify `docs/ephemeral/investigations.md`, `packages/ui/CLAUDE.md`.

- [ ] investigations.md: add `[RESOLVED 2026-06-10 via ER-0]` markers + one-line resolution notes (existing house pattern) to: the finding-card-n entry (~:1597), B1 What-If (~:1687), B2 boxplot ordering (~:1691), A1 glyphs (~:1675, also correct "~20" → "~104 across ~45 files"), and the Explore-sweep addendum items 1 (violin), 4 (stage order), 5 (histogram specs — note the Mean-label fix too), 6 (Stats-panel Cpk). Sweep item 2 (Cpk-stability toggle) is ER-10 — do NOT mark it.
- [ ] `packages/ui/CLAUDE.md`: short color-discipline note — Tailwind v4 generates utilities only for `@theme`-declared tokens and silently skips unknown candidates (SVG default-black / transparent-bg failure modes); the architecture token-guard test now enforces this; `--color-surface-primary` aliases `--color-surface`.
- [ ] Commit `docs(er-0): investigations [RESOLVED] markers + ui color-discipline note`.

### Final gate (constraints, not steps)

- [ ] `bash scripts/pr-ready-check.sh` green from the worktree.
- [ ] Both app test suites already run per task (deletion-cascade lesson: suites, not builds).
- [ ] `claude --chrome` walk: violin toggle renders a violin (dev server — the interop bug only reproduces in the real pipeline); weekday boxplot Mon-first; stage auto-order Morning→Afternoon→Evening; per-measure spec → histogram lines + Stats Cpk + (Azure) I-Chart lines; What-If shows analyzed factor + no degenerate "best"; brush-capture card n matches dialog; Wall glyphs slate-not-black. Verify against `docs/02-journeys/wireframes/assets/explore-redesign-mockup-2026-06-10.html` where the mockup shows the relevant number surfaces.
- [ ] Adversarial review (final code-reviewer subagent over the whole branch).
- [ ] PR → `gh pr merge --merge --delete-branch`.
