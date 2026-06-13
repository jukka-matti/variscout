---
tier: ephemeral
purpose: build
title: 'ER-6 — Factor strip v2: in-model ΔR² upgrade + interaction chip (sub-plan)'
audience: agent
status: active
date: 2026-06-13
layer: spec
topic: [explore, factor-strip, interaction, best-subsets, model-drawer, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
implements:
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/drill-down-workflow.md
---

# ER-6 — Factor strip v2: in-model ΔR² upgrade + interaction chip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`). One worktree (`.worktrees/er-6-strip-v2`), TDD, per-category commits. **Right-size:** judgment-heavy (the model-stats seam + strip v2 state) — Sonnet implementer against the named files; design decisions live in this plan.

**Goal:** Upgrade the factor strip from marginal adjusted-η² (v1) to **in-model ΔR²** when two-pass best subsets completes (chips visibly change, caption flips to "in the model", residual → 1 − R²adj), and surface the **⚡ interaction chip** (set apart, dashed, conclusion on its face) whose click renders the paired `A × {focal level, rest}` comparison.

**Architecture:** ER-3's model drawer already runs `computeBestSubsets` always-live and fires `onModelStats({ kept, deltaR2 })` even when closed — but **on the Explore tab that callback is deliberately unwired** (`Dashboard.tsx:1781` "No onModelStats (DOI feed is Analyze-only)"). ER-6: (1) **extend `ModelDrawerStats`** to also carry `rSquaredAdj` and the single winning `interaction` (factorA/B, semipartial ΔR², `pattern` from `classifyInteractionPattern()`, focal level = largest-|coef| level in the winning term), computed from the drawer's existing `shown.interactionScreenResults` + coefficient table; (2) **wire `onModelStats` on Explore** in both Dashboards into a `useState` channel the strip reads; (3) **strip v2:** when `modelStats` is present, chips render ΔR² + "in the model" caption, residual = 1 − R²adj, and the ⚡ interaction chip appears; clicking it sets a transient comparison binding (reuse the existing chip-click → comparison-panel rebind). The v1 marginal path stays exactly as-is until stats arrive (progressive enhancement). **No new best-subsets run** — consume the drawer's existing engine output; never enumerate all factor pairs (hierarchical screening per ADR-067).

**Tech Stack:** TypeScript (pure-core stats already shipped), React hooks/state, Vitest + RTL, i18n (32-catalog), Tailwind v4.

## Hard constraints (gates, not steps)

- **Interaction vocabulary is geometric ONLY:** `classifyInteractionPattern()` returns `'ordinal' | 'disordinal'`. Never "moderator"/"primary" anywhere (code, copy, tests, comments) — ESLint `no-interaction-moderator` enforces in `packages/core/src/stats/**` + `**/interaction*`. Pattern label NEVER hardcoded — always read from `classifyInteractionPattern()` / `InteractionScreenResult.pattern`.
- **One brain, two doors:** the strip's ΔR²/interaction data comes from the SAME `ModelDrawerStats` the Analyze Wall consumes — do NOT spin up a second best-subsets computation in the strip/hook. Extend the existing `onModelStats` payload.
- **Hierarchical screening preserved:** two-pass best subsets only screens interactions among Pass-1 winners (ADR-067) — touch only the _exposure_ of existing results, never the screening enumeration. Do not weaken NIST thresholds.
- **Honesty (P5 / ADR-069):** ΔR² is semipartial in-model contribution; the residual is `1 − R²adj`; parallel bars only (never stacked/pie); ★ = "largest share" never "strongest"; weak/ruled-out chips stay visible (grayed). The interaction conclusion on the chip face states the geometric relationship, not causation.
- **Progressive, non-regressive:** before `modelStats` arrives (or when there is no interaction / best-subsets returns nothing), the strip renders EXACTLY the v1 marginal output (snapshot guard). The membership + defect-rate variants (ER-5a/ER-5b) are untouched.
- **i18n all-or-nothing:** new keys in `i18n/types.ts` `MessageCatalog` + ALL 32 catalogs (English placeholder) or `tsc` breaks.
- **Both apps:** shared `@variscout/ui`/`@variscout/core` edited once; PWA + Azure `Dashboard.tsx` wired per-app.
- **Verification baseline:** `bash scripts/pr-ready-check.sh` green · app suites RUN · ESLint clean (the vocab rule) · `claude --chrome` walk of the strip upgrading after best-subsets + the ⚡ chip + its comparison.

---

## Grounded file map (verified against main @ ff67a9891, 2026-06-13)

| Concern                          | File:anchor                                                                                                                                                                                                                | Current state                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| Model-stats seam (extend)        | `packages/ui/src/components/ModelDrawer/ModelDrawerBase.tsx:69-74` (`ModelDrawerStats{kept,deltaR2}`), `:204-213` (`deltaR2` memo + `onModelStats` effect), `:463` (focal-level pattern: `[...shown].sort by deltaR2)[0]`) | Fires always-live; carries `kept`+`deltaR2` only.                         |
| Best-subsets interaction output  | `packages/core/src/stats/bestSubsets.ts:84-87` (`interactionScreenResults?`, `hasInteractionTerms?`), `:785-824` (Pass-2 screen)                                                                                           | `InteractionScreenResult[]` with `pattern`+significance already computed. |
| Pattern classifier               | `packages/core/src/stats/interactionScreening.ts:231` (`classifyInteractionPattern(data,outcome,factorA,factorB): 'ordinal'                                                                                                | 'disordinal'`)                                                            | Shipped, exported. |
| Strip chip type                  | `packages/hooks/src/useFactorStripModel.ts:45-95` (`FactorStripChip`), `:130-149` (`UseFactorStripModelResult.residualPct` — JSDoc already says "ER-6 will upgrade to 1 − R²adj")                                          | v1 marginal `adjustedPct`; no ΔR² field.                                  |
| Strip component                  | `packages/ui/src/components/FactorStrip/FactorStripBase.tsx` (`variant`, chip render, `onFactorSelect`, `onAnovaLinkClick`)                                                                                                | v1 + membership + defect-rate variants.                                   |
| Strip mount + drawer (both apps) | `apps/pwa/src/components/Dashboard.tsx:~1781` (unwired `onModelStats` comment) + Azure `:1957`                                                                                                                             | Explore model drawer's `onModelStats` NOT wired.                          |
| ESLint vocab rule                | `eslint.config.js` (`no-interaction-moderator`)                                                                                                                                                                            | Active.                                                                   |

---

## Task 1 (ui/core seam) — extend `ModelDrawerStats` with `rSquaredAdj` + winning `interaction`

**Files:** Modify `packages/ui/src/components/ModelDrawer/ModelDrawerBase.tsx` (extend the `ModelDrawerStats` interface + the memo/effect that builds it); Test `packages/ui/src/components/ModelDrawer/__tests__/ModelDrawerBase.test.tsx` (extend the existing `onModelStats` test).

**Outcome:** `ModelDrawerStats` gains `rSquaredAdj: number | null` and `interaction: ModelInteraction | null` where `ModelInteraction = { factorA, factorB, deltaR2, pattern: 'ordinal' | 'disordinal', focalLevel: string }`. Derive `interaction` from `shown.interactionScreenResults`: pick the most significant (largest ΔR²) interaction term; `pattern` from the result (already `classifyInteractionPattern`-derived) or call the classifier on the scope rows; `focalLevel` = the level of the winning term with the largest |coefficient| in the drawer's coefficient table. `null` when `!hasInteractionTerms` / no significant interaction. R²adj from the model summary the drawer already computes. **Do not run a new best-subsets fit.**

- [ ] Failing test: with an interaction fixture, `onModelStats` payload carries `interaction.pattern ∈ {ordinal,disordinal}` + a `focalLevel` + `rSquaredAdj`; with a no-interaction fixture, `interaction === null`. Run → fail → implement → pass. Commit `feat(ui): expose winning interaction + R²adj in ModelDrawerStats`.

## Task 2 (ui) — strip v2: ΔR² chips + "in the model" caption + 1−R²adj residual

**Files:** Modify `packages/ui/src/components/FactorStrip/FactorStripBase.tsx` (accept a `modelStats?: { deltaR2: Map<string,number>; rSquaredAdj: number | null } | null` prop; when present, chips render ΔR² (`deltaR2.get(factor)*100`) and the strip caption flips to the "in the model" copy + residual uses `1 − rSquaredAdj`); add i18n keys (caption "in the model" vs the v1 "share of variation", ΔR² chip label); Test `packages/ui/src/components/FactorStrip/__tests__/FactorStripBase.v2.test.tsx`.

**Outcome:** No `modelStats` → byte-identical v1 marginal render (snapshot guard). With `modelStats` → chips show in-model ΔR², caption reads "in the model", residual = `1 − R²adj`. Honesty preserved (parallel bars, ★ "largest share", grayed weak chips). Membership/defect-rate variants unaffected.

- [ ] Failing test: v2 prop flips chip values to ΔR² + caption; absent prop = v1 snapshot. Run → fail → implement → pass. Commit `feat(ui): strip v2 in-model ΔR² upgrade`.

## Task 3 (ui) — the ⚡ interaction chip (conclusion on face) + click → comparison

**Files:** Modify `FactorStripBase.tsx` (render a distinct dashed ⚡ chip after the factor chips when `modelStats.interaction` is present; conclusion text on the face; an `onInteractionSelect?(interaction)` prop fired on click); add i18n keys; Test `FactorStripBase.v2.test.tsx` (interaction-chip cases).

**Outcome:** When `modelStats.interaction` exists, an offset dashed chip renders `⚡ {factorA} × {factorB} {+ΔR²}% — {factorA} differences depend on {factorB}` (the conclusion templated from the pattern; pattern label via the geometric term ONLY). Clicking fires `onInteractionSelect(interaction)`. Absent interaction → no chip. **No "moderator"/"primary" anywhere** (ESLint will fail the build otherwise).

- [ ] Failing test: chip renders conclusion + fires `onInteractionSelect`; ESLint vocab rule passes (grep the diff for forbidden terms). Run → fail → implement → pass. Commit `feat(ui): interaction chip with on-face conclusion`.

## Task 4 (apps) — wire `onModelStats` on Explore + feed the strip + interaction comparison

**Files:** Modify `apps/pwa/src/components/Dashboard.tsx` (replace the "No onModelStats" stub: pass `onModelStats={setExploreModelStats}` to the Explore model drawer; feed `modelStats` + `onInteractionSelect` to the strip; on interaction-select set a transient comparison binding that renders the `A × {focalLevel, rest}` paired comparison in the existing comparison/boxplot slot — reuse the current chip-click rebind path); mirror in `apps/azure/src/components/Dashboard.tsx`. Update the Dashboard tests/mocks.

**Outcome:** On Explore, once best subsets completes the strip upgrades to ΔR² and the ⚡ chip appears; clicking it shows the paired comparison. Analyze-tab DOI behaviour unchanged. App suites green (run them).

- [ ] Update Dashboard tests + run both app suites. Commit `feat(pwa,azure): wire Explore model-stats → strip v2 + interaction comparison`.

## Task 5 (ER-DOC) — doc propagation (REQUIRED, reviewed with the slice)

**Files:** `docs/03-features/workflows/analysis-flow.md` + `drill-down-workflow.md` strip v2/interaction sections; `packages/core/CLAUDE.md` / `packages/ui` note if the seam doc needs it; supersession note on the PI-panel docs if relevant; `docs/ephemeral/investigations.md` `[RESOLVED]` markers for any 2026-06-10 strip-v2/interaction entries this closes.

- [ ] Apply doc edits. Commit `docs(er-6): strip v2 + interaction chip propagation`.

---

## Self-review checklist (run before requesting review)

- Spec §5 v2 + D2/D4 coverage: ΔR² upgrade ✓ (T2), caption flip ✓ (T2), 1−R²adj residual ✓ (T1/T2), ⚡ chip with on-face conclusion ✓ (T3), pattern via `classifyInteractionPattern` only ✓ (T1/T3), focal-level comparison ✓ (T3/T4).
- One-brain: strip consumes the drawer's existing stats, no second fit ✓ (T1).
- Vocab: ordinal/disordinal only; grep the diff for "moderator"/"primary" → none.
- Progressive: no-stats render = v1 snapshot ✓; membership/defect-rate variants untouched.
- i18n all-32 for every new key.
