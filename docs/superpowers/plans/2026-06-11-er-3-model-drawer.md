---
tier: living
purpose: build
title: 'ER-3 model drawer sub-plan'
audience: agent
status: active
date: 2026-06-11
layer: spec
topic: [explore, analyze, model-drawer, glm, anova, best-subsets, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
  - docs/07-decisions/adr-067-unified-glm-regression.md
implements:
  - docs/03-features/workflows/analysis-flow.md
---

# ER-3 — The Model Drawer ("The model behind the ranking")

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Execute from `.worktrees/feat/er-3-model-drawer` on branch `feat/er-3-model-drawer`. One implementer per task, sequential; spec + quality reviewer pair per task; commit per task.

**Goal:** One shared, transient right drawer rendering the live engine's model (summary · reference-coded equation · full coefficient table · ANOVA table · best-subsets ladder · predict widget), opened from the Explore strip's ANOVA link AND from the Analyze tab's Model toggle — owning the A2 toggle-no-op geometry bug outright (spec §6/D5; walkthrough A2).

**Architecture (grounded 2026-06-11 on the post-ER-2 tree):** The spec's "one real core addition" (coefficient SE) is **already built**: `solveOLS` (`packages/core/src/stats/olsRegression.ts:101`, Householder QR) computes per-coefficient SE/t/p, NIST-StRD-certified to 9 significant digits (incl. certified SE assertions on Norris/Pontius/Longley), flowing through `BestSubsetResult.predictors` (`PredictorInfo{coefficient,standardError,tStatistic,pValue,isSignificant}`) and across the worker boundary. **The real core gaps:** (1) the ALL-CATEGORICAL dispatch path (`computeBestSubsetsANOVA`, `bestSubsets.ts:547-610` — the common demo shape) returns NO predictors/intercept/rmse/typeIIIResults; (2) the intercept row's SE/t/p are computed then dropped (`extractPredictors` skips column 0); (3) `BestSubsetResult` has no `sse`. Reference coding exists (`buildDesignMatrix`: reference = most-frequent level, ties alphabetical). Per-term ANOVA SS = **Type III** (`computeTypeIIISS`, winner-only) — the wireframe's "Sequential SS" caption is WRONG for our engine; the drawer states "Type III (model-comparison) SS". Predict primitives exist (`predictFromUnifiedModel`, `cellMeans` keyed `levels.join('\x00')`, `rmse` = S).

**A2 mechanism (re-verified current):** `WallCanvas` mounts `ModelBuilderBand` as an SVG `<foreignObject>` at y=960 inside the viewport group while the populated viewBox (`computeReadableWallContentBBox`) crops to y≤768 — the toggle changes zero pixels (cold-start branch works; the seam test has geometry assertions ONLY for cold-start, which is why A2 shipped green). Hidden coupling: the band's `onModelStatsChange` feeds `modelStats → factorContribution01 → glyph contribution bars + domain-weighted DOI` — must be re-plumbed or the PR-CS-12 glyph weighting silently dies (the factorEdges mutation-guard test enforces it).

**Settled dispositions (do not re-open):**
- **One Model surface:** the drawer replaces the band EVERYWHERE incl. the Wall's cold-start branch (the cold-start wrapper + viewBox keep framing the factor-glyph row; only the band leaves).
- **v1 drawer is read-only** (the wireframe's ladder is a static table with "✓ shown"): the band's interactive kept/candidate toggling, redundancy/VIF hint, and snap-back are CUT — logged in investigations, candidate ER-6 revival. **Capture model → Finding carries over** (drawer footer button on the Analyze surface; both apps' `handleCaptureModel` signatures preserved).
- **DOI feed:** the drawer's engine run hands `{kept, deltaR2}` back via a new `WallCanvas` prop (replacing `onModelStatsChange`); the factorEdges mutation guard re-targets the prop.
- **Azure right-slot collision:** mutual exclusion — opening the model drawer closes the CoScout drawer and vice versa (the EvidenceMap mutual-exclusion convention).
- **Overlay style:** right-anchored transient aside, `w-[min(560px,calc(100%-1.5rem))]` (wireframe), screen-space HTML never viewBox-cropped, Escape + × close (Escape is NET-NEW vs the AW drawers — add it; don't backport to them here).
- **SS caption:** "Type III (model-comparison) SS" — engine truth over wireframe text.
- **Categorical-path completion mechanism:** re-fit the SHOWN subset on demand via `buildDesignMatrix` + `solveOLS` (both public) in a small exported core helper `fitSubsetGLM(data, outcome, subset)` returning `{predictors(+intercept row), intercept, rmse, sse, typeIIIResults?}` — no rewrite of the ANOVA enumeration path; the drawer (and only the drawer) pays the one extra fit.
- **Intercept row:** exposed via the same helper (index 0 of OLSSolution arrays) — labeled with the reference-level caption, not a "factor".
- **Covariance matrix: YAGNI** (spec §6 needs fitted ± S only). Not built; noted in the ADR amendment.
- **Engine source:** the drawer runs `computeBestSubsets` itself (memoized on rows/outcome/factors — the band's pattern); Dashboards pass `rows=effectiveData, outcome=effectiveOutcome, candidateFactors=allFactors`; Analyze passes today's `modelBuilderProps` bag (scoped filteredData/factors/scopeLabel/constantFactors/onCaptureModel).
- **i18n:** all drawer copy via MessageCatalog keys ×32 (`modelDrawer.*`); the strip's stub key stays as the no-handler fallback.

---

### Task 1 — Core: `fitSubsetGLM` + intercept exposure (+ sse)

**Files:** `packages/core/src/stats/bestSubsets.ts` (or a sibling `fitSubsetGLM.ts` — implementer's call, barrel-exported); extend `packages/core/src/stats/__tests__/` (NIST files UNTOUCHED — never weaken; new tests separate).

- [ ] `fitSubsetGLM(data, outcome, factors, opts?)`: builds the design matrix for exactly those factors (reuse `FactorSpec` typing/classification as `computeBestSubsetsOLS` does), runs `solveOLS`, returns `{predictors: PredictorInfo[] /* INCLUDING the intercept row, term '(Intercept)' */, intercept, rmse, sse, rSquared, rSquaredAdj, n, referenceLevels, typeIII: Map<...>}` (typeIII via `computeTypeIIISS` for the same factors). Null on degenerate (rank-deficient → include `warnings` per house pattern).
- [ ] Tests: an all-categorical fixture (two factors, known cell means) → predictors present with finite SE/t/p; intercept row equals the reference-cell fitted mean; rmse² ≈ SSE/dfRes hand-check; agreement check — for a dataset that goes down the OLS path, `fitSubsetGLM` of the winner reproduces `BestSubsetResult.predictors` (same numbers, precision 6). Run the FULL core suite (NIST 9-digit assertions stay green).
- [ ] Commit `feat(core): fitSubsetGLM — coefficient table for any shown subset (intercept row + sse exposed)`.

### Task 2 — UI: `ModelDrawerBase` (the six sections)

**Files:** NEW `packages/ui/src/components/ModelDrawer/ModelDrawerBase.tsx` (+ index + barrel + tests); i18n `modelDrawer.*` keys (types.ts + 32 catalogs).

Props: `{ open, onClose, rows, outcome, outcomeLabel, candidateFactors, scopeLabel, constantFactors?, onCaptureModel?, onModelStats? }`. Internals: memoized `computeBestSubsets` + `fitSubsetGLM` of the shown subset (the `selectVitalFew`/winner — match the band's selection logic); fires `onModelStats({kept, deltaR2})` after the run (the DOI feed). Sections per the wireframe (#modelDrawer :330-337/:803-899 — copy verbatim except the SS caption):
1. Header: "The model behind the ranking" + sub `<outcome> ~ <terms> · fitted on <scopeLabel>` + ×.
2. Model summary table: S (residual σ) / R² / R²adj / n + the S↔residual-chip caption.
3. "Equation (largest terms)": reference-coded, largest |coef| first, + the guardrail caption ("group contrasts vs reference — how much this condition adds, not causes"; reference levels named).
4. Coefficients table: Term/Coef/SE/t/p incl. the intercept row; significant rows bold (use `isSignificant`, not a hardcoded |t|>2).
5. ANOVA table: per-term SS/df/F/p (typeIII) + Error/Total rows + caption "Type III (model-comparison) SS. η² on the strip = adjusted share per factor — see the strip subtitle."
6. Best-subsets ladder: every candidate (already sorted by R²adj desc), columns Model/terms/R²/R²adj, the SHOWN row highlighted "✓ shown", + the hierarchical-screening note (wireframe text, genericized from the demo dataset's nouns).
7. Predict widget: per-factor level `<select>`s (NEVER pre-selected to a "best" — default to the reference levels; no auto-select invariant) → `fitted <x> ± S · observed x̄ <y> (n=<z>)` via `predictFromUnifiedModel` + `cellMeans`; the honesty caption.
Footer (Analyze surface only, when `onCaptureModel` present): the Capture-model button producing the same `CapturedModelSnapshot` shape as the band did.
- [ ] Behavior: Escape + × + backdrop-click close; focus moves into the drawer on open (a11y); `formatStat` everywhere; tokens @theme-only.
- [ ] Tests: section rendering from a deterministic fixture; intercept row present; SS caption text; ladder ✓-shown row; predict widget computes fitted vs observed for a chosen combination; Escape closes; onModelStats fired with the run's kept/deltaR2; no-capture-prop → no footer.
- [ ] `pnpm --filter @variscout/core test && pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build`; commit `feat(ui): ModelDrawerBase — the model behind the ranking, six sections`.

### Task 3 — Explore door (both apps)

**Files:** `apps/pwa/src/components/Dashboard.tsx` (~:850-871 strip block) + `apps/azure/src/components/Dashboard.tsx` (~:942-962): pass `onAnovaLinkClick` (opens the drawer), mount `ModelDrawerBase` in the Dashboard's relative root with `rows=effectiveData, outcome=effectiveOutcome, candidateFactors=allFactors (D11-excluded — reuse the strip's exclusion), scopeLabel = 'All data' | the drill label (isDrilling)`, no `onCaptureModel` (Explore capture deferred — the strip stub copy retires only when a handler exists, which is now).

- [ ] Tests per app: link click opens the drawer (testid); drawer receives the same rows/outcome as the strip; close restores.
- [ ] Both app suites + tsc; commit `feat(apps): the strip's ANOVA link opens the model drawer`.

### Task 4 — Analyze door + A2 ownership (ui + both apps)

**Files:** `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx` (DELETE the in-SVG band mounts :1527-1528 populated + :1103 cold-start, the band memo :730-765, `modelBuilderOpen` :694; both toggle buttons :1366-1376/:1084-1092 → fire a new `onOpenModelDrawer` callback prop; NEW `modelStats` prop replacing the band's `onModelStatsChange` feed so `factorContribution01`/glyph bars/DOI (:697-716,:830) survive; rework `wall-cold-start-with-band` + `coldStartViewBox` (:774-795) to keep framing the glyph row); DELETE `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx` (+ index re-exports re-pointed; `CapturedModelSnapshot` type moves to the ModelDrawer module); app mounts: Azure `AnalyzeWorkspace.tsx` (drawer as a sibling in the wall shell ~:1206/:1354, fed by today's modelBuilderProps bag :325-340 + `handleCaptureModel` :288-324 preserved; mutual exclusion with the CoScout right drawer), PWA `AnalyzeView.tsx` (same: props :571-602, capture :536-569, container :618/:651).

**Tests (the A2 list):**
- [ ] `WallCanvas.modelBuilder.seam.test.tsx` REWRITTEN for the drawer + the missing populated-branch GEOMETRY assertion: (1) the Model surface element is NOT a descendant of the populated `<svg>` (screen-space — `svg.querySelector('[data-testid="model-drawer"]')` null while `screen.getByTestId` finds it); (2) the regression guard — no foreignObject inside `<g data-wall-viewport>` whose y-extent falls outside the parsed `data-wall-content-bbox` (would have caught A2: 960 > 768).
- [ ] Port the engine-behavior assertions (vital-few preselect, R²adj header, capture snapshot, constant-factor chip) onto the drawer.
- [ ] `WallCanvas.factorEdges.seam.test.tsx` mutation guard re-targets the new `modelStats` prop. `WallCanvas.test.tsx:742-764` band test replaced. Azure `AnalyzeWorkspace.mapwall.test.tsx:1070-1123` + PWA `AnalyzeView.captureModel.seam.test.tsx` re-pointed at the drawer (capture write-path stays green — Finding + `projection.modelContext`).
- [ ] Cold-start: toggle opens the drawer; the glyph row stays framed (viewBox assertions retargeted ~y1236-1404).
- [ ] All: ui suite + build + both app suites + tsc; commit `feat(analyze): the model drawer replaces the in-SVG band — A2 owned (toggle now changes pixels)`.

### Task 5 — ER-DOC

**Files:** `docs/07-decisions/adr-067-unified-glm-regression.md` (amendment: SE/t/p were already exposed + NIST-certified; ER-3 added fitSubsetGLM for the categorical path + intercept row; covariance deliberately not exposed — YAGNI note), the AW workflow doc's Model-toggle paragraph (grep `docs/03-features/workflows/` for the Model toggle / analyze wall doc), `docs/ephemeral/investigations.md` (A2 → `[RESOLVED 2026-06-11 via ER-3]`; sweep item 8 → fully RESOLVED (the drawer is the full-depth surface); NEW entry: band interactivity (kept-toggling, VIF hint, snap-back) cut in the v1 read-only drawer — ER-6 revival candidate), `packages/ui/CLAUDE.md` only if the AnalyzeWall invariants block mentions ModelBuilderBand (check; one-line correction).

- [ ] Commit `docs(er-3): ADR-067 amendment + Model-toggle docs + investigations markers`.

### Final gate (constraints)

- [ ] Master-plan inbound link for this sub-plan; `bash scripts/pr-ready-check.sh` green.
- [ ] `claude --chrome` walk: Explore — strip link opens the drawer (all six sections populated on the Syringe categorical data — the fitSubsetGLM path); predict widget agrees with an observed cell mean; Esc closes. Analyze — the Model toggle NOW CHANGES PIXELS on a populated wall (the A2 acceptance); glyph contribution bars still weighted (DOI feed alive); capture-model still writes a Finding. Verify against the wireframe drawer section.
- [ ] Adversarial final review (Opus): statistical honesty of every table (SE/t/p against a hand-checkable fixture; the SS-type caption truthfulness; the equation's reference-level claims); the A2 geometry guard actually guards.
- [ ] PR → `gh pr merge --merge --delete-branch`.
