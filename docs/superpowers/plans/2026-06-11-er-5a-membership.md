---
tier: ephemeral
purpose: build
title: 'ER-5a — Membership analysis + composition view + binning reframe'
audience: agent
status: active
date: 2026-06-11
layer: L4
kind: plan
serves:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
related:
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
---

# ER-5a — Membership analysis + composition view + binning reframe (sub-plan, grounded 2026-06-11)

> **For agentic workers:** executed via the lean subagent loop (one implementer per task, inline fix rounds, ONE adversarial branch review at the end). Spec authority: explore-redesign spec §7.3 / §10 / §16, D7 / D11 / D12. Master plan §ER-5a. Grounded against main at `9fb0abe9e` (ER-4 merged).

**Goal:** when a condition is applied (ER-4's loop), the factor strip answers a different question — "what distinguishes the rows in this condition?" — via a membership-separation ranking; the freed Pareto slot becomes the composition view (share-in vs share-out paired bars + lift + ⊕ compound-condition minting + count ⇄ lift toggle); inflection-binning segments can commit as conditions with `derivedFrom` provenance.

## Settled dispositions (do not re-litigate)

1. **The §16 statistic (settled at build, as the spec required): bias-corrected Cramér's V** on the factor-levels × {in, out} contingency table (Bergsma 2013): φ² = χ²/n; φ̃² = max(0, φ² − (k−1)(r−1)/(n−1)); k̃ = k − (k−1)²/(n−1), r̃ = r − (r−1)²/(n−1); Ṽ = √(φ̃²/min(k̃−1, r̃−1)), floored at 0. Rationale: bounded [0,1], cardinality-penalized in exactly the spirit of ER-2's ω²-adjusted η² (small-sample/many-level inflation cut), reduces cleanly for the binary membership column (r=2). Continuous factors quartile-pre-bin first — reuse `quartileBin` exactly as `computeMainEffects` does (`packages/core/src/stats/factorEffects.ts:161-174`), and mark `binnedForRanking`.
2. **Membership is computed over the FULL lensed population** (in-condition vs out-of-condition labels on every row) — NEVER within-subset η² (D7). The membership variant REPLACES the magnitude strip when `hasCondition`; the legacy `isScoped` retitle path ("…within this condition?") retires for the condition case.
3. **Per-chip over-represented level**: for each factor, `topLevel` = argmax lift among levels with `nIn ≥ 3`; render `Factor — Level ×2.8`. If no level qualifies, `topLevel = null` (chip shows the statistic only). `lift = shareIn/shareOut`; when `nOut === 0 && nIn > 0`, `lift = Infinity` → render the i18n "only in condition" label, never the bare `∞` glyph alone.
4. **Composition data per level**: `{ level, nIn, nOut, shareIn = nIn/NIn, shareOut = nOut/NOut, lift }`. Degenerate guards: `NIn === 0 || NOut === 0` → the engine returns `null` (no membership ranking; strip falls back to the magnitude variant with its normal title; composition view hidden).
5. **The ⊕ mints compound conditions through the EXISTING API**: `applyCondition([...appliedLeaves, buildGroupLeaf(column, level)])` — `analysisScopeStore.conditionLeaves` is already a flat AND-of-leaves; no new store surface, no new leaf grammar (grounding Q5).
6. **Count ⇄ lift toggle is condition-scoped** (D12's condition half): it lives in the composition view occupying the freed Pareto slot, NOT in `ParetoChartWrapperBase`'s `yMetric` dropdown and NOT as any global mode/aggregation switch. No mode switcher appears anywhere (D12).
7. **`derivedFrom` provenance**: add `derivedFrom?: string` to `BinnedFactorBinding` (`packages/core/src/binning/types.ts:18`) and wire `excludeYDerivedFactors` to honor it (the deferred note at `factorEffects.ts:329` resolves here). Existing bindings without the field keep working (optional; the `sourceColumn` convention remains the fallback).
8. **Segment-commits-as-condition** (§10): the inflection-binning surface gains a per-segment "view as condition →" that builds a `between`/`gte` leaf on the SOURCE column from the segment's cut edges (reuse `buildBandLeaf`) and calls `applyCondition`. The "what distinguishes these calls?" follow-up needs NO bespoke UX: once the condition applies, the membership strip variant IS the follow-up.
9. **ER-5b boundary absolute**: no edits to `packages/core/src/analysisStrategy.ts` / `resolveMode()` / `AnalysisMode` persistence. Defect-mode behavior untouched (ER-4 review logged defect-mode condition partiality as accepted — do not "fix" it here).
10. **i18n**: every new user-facing string lands in ALL 32 `MessageCatalog` catalogs (closed interface — tsc enforces). P5 language throughout: "distinguishes" / "over-represented" / "share", never "drives"/"causes"/"root cause".

## Tasks

### Task 1 — Core: membership-separation engine (Sonnet, TDD)

**Files:** create `packages/core/src/stats/membershipSeparation.ts` + `__tests__/membershipSeparation.test.ts`; export from `packages/core/src/index.ts` (or the stats barrel — match `factorEffects` export style).

`computeMembershipSeparation(rows: DataRow[], leaves: ReadonlyArray<ConditionLeaf>, factors: string[]): MembershipSeparationResult | null`

- Membership labels via `rowMatchesConditionLeaves(row, leaves)` (`packages/core/src/findings/hypothesisCondition.ts`, ER-4).
- Per factor: contingency build (quartile-pre-bin continuous via `quartileBin`; skip rows with null/empty factor values, consistent with `computeMainEffects`), χ², bias-corrected Cramér's V per disposition 1, p-value (ground how `factorEffects` computes its F p-value and use the analogous χ² path; if no χ² CDF exists in core, implement the standard Wilson–Hilferty/regularized-gamma approximation with a hand-verified fixture), composition rows per disposition 4, `topLevel` per disposition 3, `binnedForRanking`.
- Result: `{ factors: MembershipFactorSeparation[] (sorted Ṽ desc), nIn, nOut, n }`; degenerate → `null`.
- Respect `excludeYDerivedFactors` at the CALLER level (don't bake it in — mirror `computeMainEffects`' division of labor).
- Tests: hand-verified fixture (small contingency where χ²/V are computed by hand in comments), bias-correction floor (independent factor → Ṽ = 0), cardinality penalty (many-level random factor ranks below a true 2-level separator), lift/Infinity/`nIn ≥ 3` floor cases, degenerate guards, continuous pre-binning. Unconditional assertions — no soft-skip `if` around expectations (ER-3 lesson).

### Task 2 — Core: `derivedFrom` provenance + segment→condition builder (Sonnet, TDD)

**Files:** `packages/core/src/binning/types.ts` (+`derivedFrom?: string`), `packages/core/src/stats/factorEffects.ts` (`excludeYDerivedFactors` honors `derivedFrom`), new helper `buildSegmentLeaf(binding: BinnedFactorBinding, segmentIndex: number): ConditionLeaf` in `packages/core/src/binning/` (cut edges → `between` leaf on `binding.sourceColumn`; first/last segments → `lt`/`gte` open-ended), tests.

### Task 3 — Hooks: membership strip + composition models (Sonnet, TDD)

**Files:** create `packages/hooks/src/useMembershipModel.ts` + tests; thread from `useConditionLoop` consumers.

- `useMembershipModel({ lensedRows, leaves, allFactors, outcome, bindings })` → `{ chips: MembershipChip[], nIn, nOut } | null` calling Task 1's engine with `excludeYDerivedFactors` applied; memoized like `useFactorStripModel`.
- Composition selector: `useCompositionModel({ lensedRows, leaves, factor })` → per-level composition rows + counts for the count⇄lift toggle (counts = nIn per level, the "condition Pareto" reading).
- Do NOT mutate `useFactorStripModel` — the magnitude path stays byte-identical when no condition is applied.

### Task 4 — UI: membership strip variant + CompositionView (Sonnet, TDD)

**Files:** `packages/ui/src/components/FactorStrip/FactorStripBase.tsx` (+`variant?: 'magnitude' | 'membership'` + membership chip rendering `Factor — Level ×N.N` + the membership title), create `packages/ui/src/components/Explore/CompositionView/CompositionViewBase.tsx` (+tests, +index, +Explore barrel): paired bars per level (share-in vs share-out), lift annotation, per-level ⊕ button (`onAddToCondition(column, level)`), count ⇄ lift toggle (local UI state, default lift), empty/degenerate states. All strings via `useTranslation`; add keys to ALL 32 catalogs; Tailwind tokens verified against `theme.css` (silent-skip failure mode); no hardcoded hex; props-based (`*Base` convention, no store access).

### Task 5 — Apps integration (Opus)

**Files:** both `apps/*/src/components/Dashboard.tsx` (+ tests per app).

- When `hasCondition`: the strip renders the membership variant fed by `useMembershipModel` over the FULL lensed rows (disposition 2); when not, the magnitude strip exactly as today.
- The freed Pareto/comparison slot under a condition hosts `CompositionView` for the strip-selected factor (4-slot contract: content change within the slot, never a 5th slot).
- ⊕ → `applyCondition([...appliedLeaves, buildGroupLeaf(column, level)])`; the scope bar label/counts update (already reactive via the store).
- Inflection-binning surface: per-segment "view as condition →" via `buildSegmentLeaf` → `applyCondition` (ground where the binning UI lives — G1's binding editor — and add the CTA there; if the surface is Azure-only, PWA parity per shared component, else log the asymmetry in investigations).
- Tests: variant switch on condition apply/clear; composition slot swap; ⊕ produces the compound leaf set; D7 negative test (membership chips do NOT change when the condition subset's internal variance changes but membership stays fixed — i.e., assert the engine was called with full rows + leaves, not conditionRows).

### Task 6 — ER-DOC (inline or Haiku)

`docs/03-features/workflows/drill-down-workflow.md` (membership/composition section under the ER-4 condition-loop section) + `docs/03-features/workflows/findings-hypotheses.md` (membership note in the Condition section); investigations.md: mark the §7.3 owner-methodology note (brush→membership→hypothesis chain) as delivered-by-ER-5a; `packages/core/CLAUDE.md` factorEffects/membership line if the stats section exists (per ER-DOC table).

## Final gate (constraints)

- Master-plan inbound link (add a `**Sub-plan:**` line under §ER-5a) · `bash scripts/pr-ready-check.sh` green · both app suites.
- `claude --chrome` walk: apply a y-band condition → the strip flips to "What distinguishes…" with ×lift chips → select a factor → the composition view renders paired bars + lift → ⊕ a level → the scope bar shows the compound condition and all tiers re-apply → count⇄lift toggle changes the bars → clear → magnitude strip returns.
- ONE adversarial Opus branch review (focus: D7 never-within-subset honesty; the statistic's hand-verified math; ⊕ compound coherence; ER-5b boundary untouched; i18n completeness).
- PR → `gh pr merge --merge --delete-branch`.
