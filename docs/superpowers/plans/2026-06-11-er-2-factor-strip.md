---
tier: living
purpose: build
title: 'ER-2 factor strip v1 sub-plan'
audience: agent
status: active
date: 2026-06-11
layer: spec
topic: [explore, factor-strip, eta-squared, omega-squared, seeding, whatif, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
implements:
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/drill-down-workflow.md
---

# ER-2 — Factor Strip v1 ("What explains the variation?")

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Execute from `.worktrees/feat/er-2-factor-strip` on branch `feat/er-2-factor-strip`. One implementer per task, sequential; spec + quality reviewer pair per task; commit per task.

**Goal:** The headline guidance surface under the I-Chart hero — every candidate factor ranked by cardinality-penalized share of variation, honesty copy verbatim, what-if hover, examined-state — plus the Seed-3 handlers fixed to use the same ranking (spec §5 v1, D2/D3/D11, §13.1; walkthrough A3).

**Architecture (grounded 2026-06-11 on the post-ER-1 tree):** `computeMainEffects` (`packages/core/src/stats/factorEffects.ts:121`) already computes every SS quantity the ω² formula needs inside its per-factor loop but drops df/F and has NO direct unit tests. Continuous X's currently stringify into ~N singleton groups (η²→1, N−k→0) — **pre-binning is a correctness requirement of the ranking, not display polish**. The strip mounts as a new optional band in `DashboardGrid` between the I-Chart div and the boxplot div (flex-none chrome — never a `ChartSlotType`/`DashboardChartCard`; the 4-slot contract is core typing, untouched). The Variation Sources card's `Factor:` dropdown (built at `DashboardLayoutBase.tsx:360-373`, injected at :515) is absorbed: strip chip click calls the SAME `setBoxplotFactor` prop — both apps' mirrors (PWA → analysisScopeStore write-mirror; Azure → viewState + reverse-mirror) then work with zero new wiring.

**Grounding corrections adopted:**
- **What-if hover math:** the spec's pointer to `computeCumulativeProjection` computes complement-fixing — NOT the copy's "if all groups matched the best" quantity. A NEW core helper computes the matched-best projection (every group mean-shifted to the best group's mean, within-group spread preserved, direction-aware). The PSS write-through is satisfied by wiring the existing zero-caller `recomputeScopeWhatIf` (the scope's own number) — per-chip hover numbers stay ephemeral UI. Log the spec drift in investigations (Task 6).
- `FactorMainEffect.bestLevel` is direction-BLIND (always highest mean) — the hover's "best" derives from spec via `inferCharacteristicType`, never `bestLevel` as-is.
- No unit metadata exists — hover copy uses the outcome alias, no invented units ("average <outcome>: 519 → 497").
- The "also screened (+N)" collapse is in the spec but NOT the wireframe — designed here (Task 3): a muted disclosure row after the ranked chips; expanding reveals the non-framing-selected candidates as normal (usually weak/gray) chips.
- D11 v1 exclusion keys off `BinnedFactorBinding.sourceColumn === outcome` (+ the `${outcome}_bin` name convention); the generic `derivedFrom` field is ER-5a's.
- Plan line refs: PWA seed handler `AnalyzeView.tsx:370-375`, Azure `AnalyzeWorkspace.tsx:945-949`.

**Settled dispositions:**
- **Geometry:** strip is flex-none (~110px). With the strip mounted, the I-Chart wrapper's deduction grows: `h-[calc(100dvh_-_356px)] min-h-[440px]` (240 + ~116); without it, unchanged. Acceptance at the browser gate: hero band STILL ≥3× the old 121px baseline AND the strip fully visible without scrolling at 1440×900-class viewports.
- **Copy:** verbatim from the wireframe (`explore-redesign-mockup-2026-06-10.html` :257-271, :635-671): title "What explains the variation?" / scoped "…within this condition?"; subtitle "how much of the call-to-call differences each factor accounts for (η²) — shares overlap, won't sum to 100%" — replace "call-to-call" with the generic "row-to-row"; link "How these % are computed (model & ANOVA) →" (stub until ER-3 — clicking shows a small "coming with the model drawer" tooltip, never a dead control); ★ rank-0 only, label "largest share"; residual chip "everyday variation · ~N% — not tied to these factors" with the full hover title from the mockup (:648). All strings via MessageCatalog i18n keys (closed interface — all 32 catalogs, English values everywhere, ER-1 healthBar.rows precedent).
- **Examined-state:** transient Set in `packages/stores/src/viewStore.ts` (View layer — no new store; ADR-078 count unchanged), keyed `${outcome}::${factor}`, cleared on load/new project. No per-user persistence in v1.
- **Mobile + focus mode:** no strip on phones (both apps' phone branches bypass DashboardLayoutBase); strip absent in focused-chart view (DashboardLayoutBase:461 swap) — both declared behaviors.
- **Seed CTA relabel:** "Seed 3 from Factor Intelligence" → "Seed 3 strongest factors" (`wall.empty.seedFromFactorIntel`, value-only edits in 32 catalogs; FactorIntelligencePanel is retiring in ER-7).
- **Significance honesty:** ★ and ordering ties gate on `isSignificant`; weak (<1% share or non-significant) chips stay visible gray; p/df/n on chip hover; never "strongest", never "root cause" (P5; ESLint enforces).

---

### Task 1 — Core engine: ω² adjustment, ANOVA fields, continuous pre-binning, D11 exclusion, matched-best projection

**Files:** `packages/core/src/stats/factorEffects.ts` (+ its barrel rows `stats/index.ts:150-158`, `core/src/index.ts:133`); a small exported quantile-cut helper (new `packages/core/src/binning/quantileCuts.ts` or beside `applyCuts.ts:16` — recompose from d3.quantile per the private precedent at `interactionScreening.ts:262-285`); `packages/core/src/stats/__tests__/factorEffects.test.ts` (first real-data coverage — only generateFollowUpQuestions literals exist today, helpers at :9-57 updated for new required fields).

- [ ] `FactorMainEffect` gains REQUIRED `adjustedEtaSquared`, `dfBetween`, `dfWithin`, `fStatistic` (all already computed in the loop, lines ~150-189 — exposed, not recomputed). Formula: `adjusted = (ssBetween − (k−1)·msWithin) / (ssTotal + msWithin)`, `msWithin = (ssTotal − ssBetween)/(n−k)`, floored at 0; `Number.isFinite` guards on every degenerate (n−k=0, ssTotal=0); never NaN/Infinity (house safeMath rule). Sort switches to `adjustedEtaSquared` desc, significance breaking ties.
- [ ] Continuous-X pre-binning INSIDE computeMainEffects (before grouping): `classifyAllFactors` (`factorTypeDetection.ts:98`) decides; continuous factors quartile-bin (Q1–Q4) via the new exported helper; binned factors marked in the result (`binnedForRanking: true`) so the UI can annotate.
- [ ] D11 exclusion: new exported `excludeYDerivedFactors(factors, outcome, bindings?)` — drops factors whose `BinnedFactorBinding.sourceColumn === outcome` or name === `` `${outcome}_bin` ``.
- [ ] NEW `computeMatchedBestProjection(data, outcome, factor, specs?)` (home: factorEffects.ts or `variation/projection.ts`): direction from `inferCharacteristicType(specs)` (no direction → return undefined — never recommend without one, the ER-0 bestSubgroup precedent); shifts every group's rows by (bestMean − groupMean); returns `{bestLevel, currentMean, projectedMean, currentCpk?, projectedCpk?, k, n}`; undefined on degenerates.
- [ ] Fixture matrix (literal arrays, toBeCloseTo precision 4, anova.test.ts:105-152 ports): two-group → adjusted 50/74≈0.67568 (raw 0.77143 — the penalty shown); three-group → 52/61≈0.85246; equal-means → floored exactly 0; high-cardinality vs 2-level equal-raw-η² → adjusted ranking FLIPS (the headline cardinality-honesty assertion); continuous column → k≤4, finite; dfB=1/dfW=4/F=13.5 reference checks; matched-best: smaller-is-better picks the MIN-mean level, no-spec → undefined.
- [ ] `pnpm --filter @variscout/core test` green; commit `feat(core): ω²-adjusted factor ranking + matched-best projection (additive factorEffects extension)`.

### Task 2 — Hooks: strip model + allFactors export

**Files:** `packages/hooks/src/useDashboardChartsBase.ts` (:112-115 computes `allFactors = buildFactorList(factors, categoricalValuesByColumn)` but never returns it — export it); NEW `packages/hooks/src/useFactorStripModel.ts` (+ barrel + test).

- [ ] `useFactorStripModel({ rows, outcome, allFactors, selectedFactors, specs, bindings })` returns `{ chips, residualPct, n }` where chips = ranked entries `{factor, adjustedPct, rawPct, pValue, dfBetween, dfWithin, n, isSignificant, isWeak, isSelected (framing prominence), binnedForRanking, whatIf?}` — D11-excluded, ranked by the Task-1 engine; what-if computed eagerly per chip via `computeMatchedBestProjection` (cheap at these sizes, memoized on inputs). **Residual (settled):** summing per-factor shares is an invalid decomposition (D3) and the real joint-model residual (`1 − R²adj`) only exists once best subsets runs (ER-6). v1 therefore shows `~(100 − largest share)%` with the MANDATORY `~` prefix, copy "everyday variation — not tied to these factors", and a hover noting it is an approximation until the model runs; ER-6 upgrades it to the in-model residual.
- [ ] Memoization keyed on (rows, outcome, allFactors, specs); deterministic test with a literal dataset asserting ranking order, exclusion, weak flags, what-if numbers.
- [ ] `pnpm --filter @variscout/hooks test` green; commit `feat(hooks): useFactorStripModel + allFactors export`.

### Task 3 — UI: FactorStrip component + the DashboardGrid band + dropdown absorption

**Files:** NEW `packages/ui/src/components/FactorStrip/` (props-based `FactorStripBase` per ui naming; + barrel); `packages/ui/src/components/DashboardBase/DashboardGrid.tsx` (optional `factorStrip?: ReactNode` band between :48 and :51 + the geometry disposition); `DashboardLayoutBase.tsx` (props seam; retire the Factor dropdown :360-377 + title-row injection :515 + `boxplotFactorWrapper` prop :175; boxplot card title becomes "<Y alias> by <Factor>" with hint "click a factor above to compare its groups here"); `DashboardLayoutBase.test.tsx` (:304-311 boxplot card assertions) + i18n catalogs (strip keys, 32 files).

- [ ] Strip anatomy per the wireframe: label row (title/scoped-retitle + subtitle + ANOVA-link stub w/ tooltip) · chip row (common-scale bars normalized to the largest share `width = max(4, pct/max*72)px` equivalent; ★ rank-0-and-significant; weak gray <1%/non-significant; examined-✓; `binnedForRanking` annotation "(binned)"; p/df/n in the chip `title` hover) · residual chip (~ prefix) · "also screened (+N)" disclosure (settled: rank order is GLOBAL; the top-3 by rank always render expanded regardless of framing selection — guidance honesty beats prominence; remaining unselected candidates collapse under a muted "+N also screened" row, expanding to normal chips) · what-if hover card (copy per the wireframe incl. the bridge line "the gap is bigger per group — this is the overall average across k groups" and "(reference <cpkTarget>)" via the resolveCpkTarget cascade).
- [ ] Chip click: `onFactorSelect(factor)` (the apps pass setBoxplotFactor) + `onExamined(factor)`; selected chip visually active (it drives the comparison panel).
- [ ] Tokens: only `@theme`-declared (the token-guard test gates); formatStatistic for all numbers (no toFixed).
- [ ] DashboardGrid: strip band flex-none; I-Chart wrapper height per the geometry disposition (`100dvh − 356px` when strip present; comment updated honestly).
- [ ] Tests: FactorStripBase RTL (ranking render order, star gating, weak gray, examined toggle, disclosure expand, hover card content incl. no-direction → no what-if block, link stub tooltip); DashboardGrid band presence; DashboardLayoutBase dropdown GONE + title/hint.
- [ ] `pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build` green; commit `feat(ui): the factor strip — ranked shares under the hero; Variation Sources dropdown absorbed`.

### Task 4 — Apps: wire the strip, examined-state, scope what-if write-through

**Files:** both `apps/*/src/components/Dashboard.tsx` (feed `useFactorStripModel` from in-scope data — PWA rows :181/specs :206-213, Azure :236-263; pass the strip node into DashboardLayoutBase; chip select → existing `setBoxplotFactor` prop); `packages/stores/src/viewStore.ts` (examined Set + actions, cleared on load/new — check the store's existing reset wiring); the scope write-through: when a chip is examined AND a live categorical drill matches an existing scope by predicate-set (the `AnalyzeView.tsx:167-178` lookup pattern), call `useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id)` (`analyzeStore.ts:808-829` — its zero-caller state ends here); NEVER create scopes from Explore (ER-4 owns creation). Strip retitles "…within this condition?" when drilled (`isDrilling` already in scope).

- [ ] Tests: per-app Dashboard test — strip receives the model + chip click rebinds the comparison factor (assert via the captured DashboardLayoutBase/strip props + boxplotFactor state); examined persists across a re-render, clears on newProject; recomputeScopeWhatIf called when a matching scope exists, NOT called (and no scope created) otherwise.
- [ ] Both app suites + tsc green; commit `feat(apps): factor strip wired — chips drive the comparison; scope what-if refresh`.

### Task 5 — Seed-3 honesty fix (both apps)

**Files:** `apps/pwa/src/components/views/AnalyzeView.tsx:370-375`, `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:945-949`; i18n `wall.empty.seedFromFactorIntel` (32 catalogs, value-only) → "Seed 3 strongest factors".

- [ ] Replace `factors.slice(0,3)` with top-3 by `adjustedEtaSquared` from the Task-1 engine over (filteredData, outcome, factors) — all in scope at both sites; engine-null (n<3, all-factors-single-level) → fall back to current order (never block the CTA); D11 exclusion applies.
- [ ] Seam tests per app: deterministic fixture where insertion order ≠ effect order → hubs created in adjusted-rank order; fallback case.
- [ ] Both app suites green; commit `fix(analyze): Seed 3 seeds the strongest factors, not the first three columns`.

### Task 6 — ER-DOC

**Files:** `docs/03-features/workflows/analysis-flow.md` + `drill-down-workflow.md` (strip sections), `packages/core/CLAUDE.md` (factorEffects addition), PI-panel docs supersession note (find the factor-intelligence references — `docs/` grep), `packages/core/src/findings/types.ts:837-841` (stale "lands in IM-5" comment — IM-5 shipped), `docs/ephemeral/investigations.md`.

- [ ] investigations: mark A3 (Seed-3) `[RESOLVED 2026-06-11 via ER-2]`; mark sweep item 8 (buried analytical depth) resolved-in-part (the strip IS the re-homing; full depth = ER-3's drawer); NEW entry: "spec §5's what-if mechanism pointer corrected — computeCumulativeProjection computes complement-fixing; the hover's matched-best quantity is the new computeMatchedBestProjection; spec amended at next touch".
- [ ] analysis-flow.md: the strip section (replaces the old "η² buried in the boxplot carousel" reality); drill-down-workflow.md: chip→comparison rebind flow.
- [ ] Commit `docs(er-2): strip sections + factorEffects notes + investigations markers`.

### Final gate (constraints)

- [ ] Link this sub-plan from the master plan (doc-gate inbound link).
- [ ] `bash scripts/pr-ready-check.sh` green · all suites already per task.
- [ ] `claude --chrome` walk vs the wireframe: strip renders under the hero with ranked bars + ★ + residual; hero band still ≥3× the 121px baseline AND strip visible without scroll; chip click rebinds the Variation Sources comparison + chip goes examined-✓; what-if hover shows the matched-best numbers w/ bridge line (spec set) and NO what-if without a spec; "also screened" expands; Seed-3 on a populated Analyze wall creates the top-ranked hubs; dropdown gone from the boxplot card.
- [ ] Adversarial final review (Opus) — special attention: statistical honesty of every rendered number (the ω² formula against the fixtures; the residual ~approximation framing; no stacked/pie anywhere — D3).
- [ ] PR → `gh pr merge --merge --delete-branch`.
