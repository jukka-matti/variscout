---
tier: living
purpose: build
title: 'ER-4 condition loop sub-plan'
audience: agent
status: active
date: 2026-06-11
layer: spec
topic: [explore, conditions, scope, brush, highlight, pss, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
implements:
  - docs/03-features/workflows/drill-down-workflow.md
  - docs/03-features/workflows/findings-hypotheses.md
---

# ER-4 — The Condition Loop (brush pill · scope bar · per-chart tiers · PSS wiring)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Execute from `.worktrees/feat/er-4-condition-loop` on branch `feat/er-4-condition-loop`. One implementer per task, sequential; spec + quality reviewer pair per task; commit per task.

**Goal:** A condition (categorical ∧ range) can be MINTED from any chart gesture via one pill pattern, APPLIED as the visible scope (the conditional scope-bar row; I-Chart highlights, comparisons filter, probability re-checks the regime), LINKED (Explore-side ProblemStatementScope creation + `Finding.scopeId` writers), and CARRIED to Analyze — closing the named range-predicate design crack (spec §7.1–7.2, D6).

**Architecture (grounded 2026-06-11 on post-ER-3 main):** Ranges already exist at the grammar/PSS level (`ConditionLeaf` eq/in/gt/gte/lt/lte/between; `predicateSetKey` + `formatConditionLeaves` handle them; `createProblemStatementScope` accepts them; `deriveConditionFromFindingSource` mints gte/between). The crack is: `analysisScopeStore` has no range slot; `projectStore.filters`/`useFilteredData` evaluate equality membership only; the four chip⇄leaf bridges drop ranges; `syncScopeFromDrill` is categorical-only (and live on Analyze — the spec's "zero live callers" is stale; **Explore-side creation** is what's missing, per ER-2's "ER-4 owns creation" deferral). The I-Chart brush EXISTS (`useMultiSelection` → `viewStore.selectedPoints`; the PWA even drafts a CaptureCard) — what's missing is the on-chart pill, range minting, and the highlight tier. `Finding.scopeId` is fully plumbed with a live READER (`wallSelectors.selectFindingsForScope`) — only the Explore writers are missing.

**Settled dispositions (do not re-open):**

- **One pill pattern:** the brush pill AND the group-click pill are the SAME component: `<gesture summary> · n=<in> · x̄ <in> vs <out> · [✚ Capture finding] [view as condition →]`. The spec's ⊕-on-pill wins over the mockup pill (which omits capture — spec §7.1 explicitly grants it).
- **Click semantics (D6/Principle 6):** clicking a boxplot/Pareto group no longer commits a drill. It sets a TRANSIENT highlight (tier 2: cross-chart, Esc-clearable, no state) + shows the pill. Commit happens ONLY via the pill's actions. The legacy click→drill path retires; the drill machinery (`projectStore.filters` + breadcrumbs) remains as the FILTER mechanism driven by an applied condition's categorical part.
- **Condition home:** `analysisScopeStore` gains `conditionLeaves: ConditionLeaf[]` — the single source of the APPLIED condition. Applying a condition writes: leaves → scope store; its categorical part ALSO → `projectStore.filters` (so every existing filter-tier consumer works unchanged); its range part is evaluated at the Dashboard seam (a `rowMatchesConditionLeaves` core evaluator) — `useFilteredData` stays untouched.
- **I-Chart = highlight tier (D6):** when ANY condition is applied (categorical or range), the I-Chart renders the FULL lensed series with a membership mask — members lit (≈.85), non-members dim (≈.14, wireframe), connecting line suppressed, limits computed over the full series. This deliberately CHANGES today's filtered-I-Chart behavior under categorical drills ("a filtered control chart of a y-band is statistical nonsense" generalizes). Violation color/shape channels stay orthogonal; dimmed violations keep a floor opacity (.3) so signals never vanish; members force-included through LTTB like violations.
- **Scope bar:** net-new conditional row directly under the context line (both apps' sticky chrome block): `⌖ Viewing condition: <formatConditionLeaves> · <n> of <N> rows · × back to all data · Take it to Analyze →`. It ABSORBS the capture-afterglow toast (which retires) and the Azure-only `ScopeChrome` chip row mount (deleted — overlap; `PersistentScopeChip` in the header stays).
- **× back to all data = the coherent clear:** one handler clearing `projectStore.filters` + `filterStack` (via `filterNav.clearFilters`) + `analysisScopeStore.clearScope()` (incl. the new leaves). Also fix the pre-existing one-sided clears (`PersistentScopeChip` clear, the context-line clear-all) to use it.
- **Take it to Analyze →:** mint/refresh the PSS FIRST via a new range-capable `syncScopeFromCondition(projectId, outcome, leaves)` (same predicateSetKey idempotency as `syncScopeFromDrill`), then the existing `onOpenWall` navigation. (Analyze's categorical re-derive can't reconstruct ranges — the mint-before-navigate is what makes ranges carry.)
- **Capture under a condition:** both Explore capture handlers pass the active scope's id into `addFinding` (the ER-0 condition-stats work already computes the rows; only the link is missing). Drive-by: the Azure carried-from-refutation finding also gets `scopeId`.
- **Pre-existing eq-only re-anchor loops** (`handleScopeSelect` in both Analyze surfaces skip even `in` leaves): extended to in + ranges (range leaves re-anchor via the scope store's new leaves — they cannot become `projectStore.filters`).
- **PWA chart scope-store TODO stubs** (`onScopeAccumulate`) — RESOLVED BY DELETION: under the new click semantics no chart click accumulates scope directly; the stubs and their Azure counterparts go (the pill is the only writer).
- **Tier-2 transient highlight home:** `viewStore.transientHighlight: { column: string; value: string | number } | null` (group-keyed — each chart derives row membership itself; View layer = no persist; cleared by `clearTransientSelections` + Esc). NEVER reuse `selectedPoints` (it triggers the brush CaptureCard effect).
- **Esc cascade order:** transient highlight → brush selection → (drawers handle their own).
- **Probability plot:** the regime check works mechanically once ranges filter (it recomputes within scope); no new math. Participation in tier-2 dimming: YES via its existing unwired `selectedPoints` channel, translated at the Dashboard boundary (`series.originalIndices`) — best-effort, drop if the translation fights back (report, don't force).
- **Mobile:** no pill/scope-bar/tier changes on phone branches (they bypass the desktop Dashboard).

---

### Task 1 — Core: the leaf evaluator + range-aware scope bridges + gesture→leaf builders

**Files:** `packages/core/src/findings/hypothesisCondition.ts` (+ barrel) + tests.

- [ ] `rowMatchesConditionLeaves(row: DataRow, leaves: ConditionLeaf[]): boolean` — full op support (eq/neq/in/gt/gte/lt/lte/between; numeric coercion consistent with the existing evaluator — CHECK: an evaluator likely exists for hypothesis testing (grep evaluate/matches in findings/) — REUSE it if so, export it, don't duplicate; report which).
- [ ] Range-aware sibling bridges (the existing pair stays untouched for its callers): `conditionLeavesToScopeState(leaves) → { categoricalFilters, rangeLeaves }` and `buildConditionLeavesFromScopeState(categoricalFilters, rangeLeaves)` — lossless round-trip; `predicateSetKey` consistent.
- [ ] Gesture builders: `buildBandLeaf(outcome, lo, hi?) → between/gte leaf`; `buildGroupLeaf(column, level) → eq leaf` (trivial but named — the pill mints through them).
- [ ] Tests: evaluator matrix per op incl. between boundaries + non-numeric rows; round-trip; deterministic literals. Full core suite green.
- [ ] Commit `feat(core): condition-leaf row evaluator + range-aware scope bridges`.

### Task 2 — Stores: the condition slot + Explore-side PSS producer

**Files:** `packages/stores/src/analysisScopeStore.ts`, `packages/stores/src/analyzeStore.ts`, `packages/hooks/src/matchActiveScope.ts` + tests.

- [ ] `analysisScopeStore`: add `conditionLeaves: ConditionLeaf[]` + `setConditionLeaves` + include in `clearScope()` and the initial state. View layer stays persist-free (layerBoundary test covers).
- [ ] `analyzeStore.syncScopeFromCondition(projectId, outcome, leaves)`: range-capable Explore-side PSS mint — same predicateSetKey idempotency as `syncScopeFromDrill` (:747-768 is the template); empty leaves → undefined; returns the scope id. `syncScopeFromDrill` untouched (Analyze keeps it).
- [ ] `matchActiveScopeId` generalized to take leaves (or a sibling) so range scopes match — the ER-2 what-if write-through keeps working under range conditions.
- [ ] Tests: slot + clear; mint idempotency w/ range leaves; match w/ ranges. Stores + hooks suites green.
- [ ] Commit `feat(stores): conditionLeaves scope slot + range-capable Explore-side PSS producer`.

### Task 3 — UI: the ConditionPill + the ScopeBar (+ i18n)

**Files:** NEW `packages/ui/src/components/Explore/ConditionPill/` + NEW `packages/ui/src/components/Explore/ScopeBar/` (+ barrels, i18n `conditionPill.*`/`scopeBar.*` ×32, tests).

- [ ] `ConditionPillBase` (props-based): `{ summary: string; nIn: number; meanIn?: number; meanOut?: number; onCapture(): void; onViewAsCondition(): void; onDismiss(): void; anchor?: {x,y} (absolute within the chart container) }` — copy `brushed: <summary> · n=<nIn> · x̄ <in> vs <out>` + the two action buttons; Esc/outside-click dismisses; formatStat for numbers; tokens @theme-only.
- [ ] `ScopeBarBase`: `{ conditionLabel: string; nIn: number; nTotal: number; onClear(): void; onTakeToAnalyze(): void }` → `⌖ Viewing condition: <label> · <nIn> of <nTotal> rows · [× back to all data] · [Take it to Analyze →]` (~32px row, wireframe :234-240; testids `scope-bar`, `scope-bar-clear`, `scope-bar-analyze`).
- [ ] Tests: render/action/dismiss matrices. ui suite + build green.
- [ ] Commit `feat(ui): ConditionPill + ScopeBar — one pattern for minting and showing conditions`.

### Task 4 — Charts: the I-Chart highlight tier

**Files:** `packages/hooks/src/useIChartData.ts`, `packages/charts/src/ichart/DataPoints.tsx`, `packages/charts/src/IChart.tsx`, `packages/ui/src/components/IChartWrapper/index.tsx` + tests.

- [ ] Membership channel: `conditionMemberIndices?: Set<number>` (display-index space) threaded wrapper→base→DataPoints; `useIChartData` carries a per-point `isMember` flag and force-includes members through the LTTB branch exactly like violations (the dead-LTTB caveat: the branch is inert today — flag-carry must still be correct for ER-10).
- [ ] Render rule (wireframe :413-465): membership active → members keep full violation color/shape at opacity ≈.85 r 2.3-equivalent; non-members gray ≈.14 r-small; **dimmed violations floor at .3** (signals never vanish); the connecting LinePath suppressed while membership is active; limits/run-rules computed over the full plotted series (verify the limits path — they already compute from the chart's input data, which is now the FULL series).
- [ ] Tests: membership render (member lit + violation-shape preserved; non-member dim; line absent); useMultiSelection contract untouched (1.0/0.3 pinned test stays). Charts + ui suites green.
- [ ] Commit `feat(charts): I-Chart membership highlight tier — full series in context, members lit`.

### Task 5 — Apps: the loop wired end-to-end (both apps)

**Files:** both `apps/*/src/components/Dashboard.tsx` (+ chart wrappers), `packages/ui/src/components/BoxplotWrapper/index.tsx` (+ Pareto equivalent), `packages/stores/src/viewStore.ts` (transientHighlight), `apps/azure/src/features/findings/useFindingsOrchestration.ts` + `apps/pwa/src/App.tsx` (scopeId writers), `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` + `apps/pwa/src/components/views/AnalyzeView.tsx` (re-anchor loops + the Azure carried-finding drive-by), Azure `Dashboard.tsx:1184-1206` (ScopeChrome mount deletion), the afterglow-toast retirements.

- [ ] `viewStore.transientHighlight` + actions + Esc cascade (transient → brush; PWA `useKeyboardNavigation` :428-432 + Azure raw keydown :729-738 extended).
- [ ] Boxplot/Pareto click → `setTransientHighlight({column, value})` + the group pill (n/x̄ in-vs-out computed over lensed rows); the legacy `onDrillDown`-on-click + `onScopeAccumulate` paths retire (delete the TODO stubs + Azure writers; BoxplotWrapper tests updated — a deliberate behavior change, called out in the PR).
- [ ] Transient highlight renders cross-chart: boxplot dims non-highlighted categories (existing highlight plumbing); I-Chart uses the SAME membership channel transiently (derive a member set from the highlighted group); probability best-effort via originalIndices translation.
- [ ] Brush mouse-up → the brush pill (y-band summary via `buildBandLeaf` on the outcome; nIn/x̄ in-vs-out from the selection); `✚ Capture` reuses the existing brush-capture draft flow (now WITH scopeId once a condition is applied); `view as condition →` mints leaves → `setConditionLeaves` + categorical-part→filters → the scope bar appears → I-Chart flips to highlight tier.
- [ ] The ScopeBar mounted under the context line in both sticky blocks; afterglow toast retired; Azure ScopeChrome mount deleted; `×` = the coherent clear (+ fix PersistentScopeChip/context-line one-sided clears); `Take it to Analyze →` = `syncScopeFromCondition(...)` then `onOpenWall` (both apps' existing handlers).
- [ ] Capture writers: both chart-observation handlers + pins pass the active scope id (mint-or-match via `matchActiveScopeId`/`syncScopeFromCondition` — capture INSIDE a condition links, capture without one stays undefined); Azure carried-finding drive-by; re-anchor loops extended (in + ranges).
- [ ] Tests: the full loop per app (brush→pill→view-as-condition→scope bar + I-Chart highlight + comparison filtered; group click→transient+pill→Esc clears; capture→scopeId set; take-to-Analyze mints the PSS and navigates; × clears everything incl. both stores). Both app suites + tsc green.
- [ ] Commit `feat(apps): the condition loop — pill-minted conditions, scope bar, highlight tier, PSS + scopeId wiring`.

### Task 6 — ER-DOC

**Files:** `docs/03-features/workflows/drill-down-workflow.md` + `findings-hypotheses.md` (the condition loop sections), `docs/decision-log.md` (CS-3b disposition: D6 per-chart tiers resolve it for Explore — check the existing CS-3b entry and close it with a pointer), ADR-066 supersession check (grep — the AW spec §7.8 carry-over note from the master plan ER-DOC table), `docs/ephemeral/investigations.md` (sweep item 7 (brush no-affordance) → RESOLVED — note the grounding correction that the PWA had a CaptureCard path and Azure had none, both now superseded by the pill; the range-crack closure; the click-semantics change logged as the D6 commit-is-explicit reading; ScopeChrome deletion note).

- [ ] Commit `docs(er-4): condition-loop docs + CS-3b disposition + investigations markers`.

### Final gate (constraints)

- [ ] Master-plan inbound link; `bash scripts/pr-ready-check.sh` green.
- [ ] `claude --chrome` walk vs the wireframe: brush a y-band on the I-Chart → the pill appears with honest n/x̄; `view as condition` → the scope bar row appears with `⌖ Viewing condition … n of N`; the I-Chart shows the FULL series with members lit + line suppressed; the boxplot comparison filters to the condition; the probability plot recomputes (regime check); `✚ Capture` → the finding carries the condition AND `scopeId`; group click → transient highlight cross-chart + pill, Esc clears; `Take it to Analyze →` lands on the Wall with the scope active (the range carries); `×` restores all-data everywhere (both stores).
- [ ] Adversarial final review (Opus): the statistical honesty of limits-over-full-series; the click-semantics change completeness (no orphaned drill affordance, no silent commit path left); clear-coherence; the range carry end-to-end.
- [ ] PR → `gh pr merge --merge --delete-branch`.
