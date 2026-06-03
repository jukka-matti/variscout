---
tier: ephemeral
purpose: build
title: 'PR-CS-11 — Re-ingest de-automation: analyst-confirm prompt + cluster grouping without ranking'
status: draft
date: 2026-06-03
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-11 — Re-ingest de-automation: analyst-confirm prompt + cluster grouping

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-ingest keeps the mechanical column→plan matching but **writes nothing without an analyst click**; the cluster detector offers a grouping ("these findings share factor X") without an R²-ranking implying a best cause; plans get an analyst-owned status control.

**Architecture:** The pure engine stops emitting writes and instead returns **pending-match descriptors**; the hook surfaces them via an `onPendingMatches` callback (no store writes); the **Wall `MeasurementPlanChip` is the single apply surface** ("hints navigate, chips apply") with a navigate-only breadcrumb composed into the existing Inbox digest at the app layer. The plan-status auto-bump is replaced by a **full analyst-owned 4-state control** (the CS-10 pattern re-applied) plus the prompt's one-click _mark in-progress_ shortcut. The cluster grouping/ranking split is a tight core+UI edit.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand; Vitest + happy-dom; `@variscout/{core,hooks,ui,stores}` + `apps/{azure,pwa}`.

**Spec ref:** §4.5 (re-ingest de-automation), §4.0 (boundary).

---

## Owner-locked design decisions (2026-06-03)

- **Prompt host = "hints navigate, chips apply."** Context analysis: the match fires at _import time_ (analyst on the ingestion surface), but the work (link → CS-9 triad test → CS-10 status call) happens _on the Wall_. So: the **single apply surface** is a pending-match state on the Wall `MeasurementPlanChip` (two distinct clicks — _Link finding_ via the existing `LinkFindingPicker` + _Mark in-progress_ — matching spec §4.5's two-question phrasing); plus a **navigate-only breadcrumb** entry composed into the existing Process-tab `InboxDigest` at the app layer (routes to Analyze with the hypothesis focused; carries NO apply callback). The ingest match-summary line ("N plans are waiting for this data") is **optional polish — logged as a follow-up, not built here**.
- **Full analyst-owned plan status** (not minimal). A canEdit-gated 4-state select (`planned | in-progress | complete | skipped`) on the plan chip — the CS-10 hypothesis-status pattern re-applied: free choice, no validation, no auto-anything. Closes the latent "plans can never reach complete/skipped" dead-end (the auto-bump was the ONLY producer of `in-progress`; `complete`/`skipped` have NO producer today) before customer demos. The prompt's _Mark in-progress_ is a one-click shortcut to the same dispatch.
- **Cluster de-rank is Azure-only, leave + log parity** (CS-10 precedent): only Azure computes `evidenceClusters` (`AnalyzeWorkspace.tsx:820-825`); PWA's `AnalyzeConclusion` never receives them. Do NOT add the cluster prompt to PWA; log the parity gap.
- **Engine shape: pure pending-match descriptor.** The engine returns data (what matched), never action payloads; the host assembles the writes on confirm. Keeps core pure.
- **Dismiss is session-only.** Dismissed pending matches live in app state (re-appear after reload). No persistence.
- **§12 Q5 stays deferred.** The broader replace-re-evaluate cascade across all scopes/conditions is a named follow-up. The hook's REPLACE branch (`useReingestAutoLink.ts:181-205`) is already telemetry-only — leave it untouched.

## Grounding corrections (7-agent fan-out, 2026-06-03) — recorded so the build doesn't re-discover them

- **THREE silent writes, not two** (spec §4.5 under-counts): (a) the source-less auto-Finding injected **directly via `useAnalyzeStore.setState`** (NOT a HubAction — Azure `applyAction` treats `FINDING_*` as a no-op per ADR-085) at `useReingestAutoLink.ts:234-239`; (b) the `MEASUREMENT_PLAN_LINK_FINDING` dispatch; (c) the `MEASUREMENT_PLAN_UPDATE {status:'in-progress'}` bump (guarded `plan.status==='planned'`, `engine.ts:177-184`) — both dispatched at `useReingestAutoLink.ts:244-247`. All three become analyst-confirmed.
- **The auto-Finding stamp is `validationStatus:'inconclusive'`** (`engine.ts:82`), NOT `status:'inconclusive'` — `inconclusive` is not a `FindingStatus` value. The spec conflates two fields. The Finding's `status` is `'observed'`; the honesty-guard exists so `projectMechanismBranch` routes it to "not-tested" instead of crediting the hypothesis. Under CS-11 the whole `buildAutoFinding` mechanism (+ `AUTO_FINDING_*` constants + the guard) becomes dead — delete it with the silent-write path.
- **The manual plan-status setter MUST be built (net-new):** `onEditPlan` is a deferred-to-V2 `console.warn` stub in BOTH apps (`Editor.tsx:739-741`, `App.tsx:927-929`); `AddPlanForm` only emits `'planned'`; the auto-bump is the SOLE producer of `'in-progress'` and `complete`/`skipped` have no producer at all. The `MEASUREMENT_PLAN_UPDATE` action + reducer + both apps' `applyAction` persistence already exist — only the UI affordance + dispatch are missing.
- **Re-ingest is LOCAL** (fires on any `useProjectStore.rawData` change — paste-import/setRawData), not an Azure-blob-only feature. `useReingestAutoLink` is wired in BOTH apps (`Editor.tsx:403-405`, `App.tsx:241-243`) with identical options. CS-11's prompt therefore lands in both apps.
- **The de-rank has TWO removal sites:** the `clusters.sort((a,b)=>b.rSquaredAdj-a.rSquaredAdj)` (`packages/core/src/findings/helpers.ts:569`) AND the rendered `(combined R²adj {pct}%)` string (`SynthesisPrompt.tsx:24`). Removing only the sort leaves the percent implying a ranking. Do NOT touch `modelBuilder.ts` / `ModelBuilderBand` — the CS-8 per-scope ΔR² attention-guide is a different, legitimate surface.
- **The `onPlansChanged` nonce is load-bearing and MOVES:** today it fires after the cascade's writes (`useReingestAutoLink.ts:254-256`); both apps wire it to `setPlanLoadNonce(n=>n+1)` and the Wall's plan-load effect is keyed on it (`Editor.tsx:382-394`). After CS-11 the cascade writes nothing — the nonce must fire **from the manual confirm path** (the chip's dispatches) or the Wall shows stale plan status.
- **Hypothesis status is untouched** — grep-verified: nothing in `autoLink/` or the hook references `HYPOTHESIS_*`/`setHubStatus`/`deriveHypothesisStatus`. CS-10's boundary holds; CS-11 only touches Finding-creation (removed) + plan status.
- **Reusable primitives confirmed:** `MeasurementPlanChip` already renders plan status + an analyst-clicked `[Link Finding…]` gated on `status ∈ {planned,in-progress}` (`MeasurementPlanChip.tsx:33,63-74`) opening `LinkFindingPicker` (an inline, NON-blocking dialog). `InboxDigest` (`packages/ui/src/components/Inbox/InboxDigest.tsx:50-56`) renders prompts with an action button → `onNavigate(prompt)` routed via `opensSurface`/`opensId` — route-only, perfect for the breadcrumb. No new component family needed; no JS `confirm()` anywhere.
- **Idempotency/dedup to preserve:** the hook seeds `priorColumns` at subscribe time (`:160`) so only genuine deltas fire; the auto-Finding dedup gate (`:231-232`) goes away with the auto-Finding, but pending matches need their own dedup (same plan+column not re-prompted while pending/dismissed in-session, and not prompted at all if that column is already linked to the plan via an existing finding).
- **Stale-doc fixes to fold in (Task 7):** `reEvaluate.ts:19` cites a nonexistent "IM-3" decision-log entry; `packages/stores/CLAUDE.md:36` says `FindingSource` has "6 variants" (it's 4 structural / 5 chart-discriminant — core/CLAUDE.md already corrected in CS-9).

---

## File structure

- **Engine (Task 1):** `packages/core/src/autoLink/engine.ts` — strip writes, return descriptors. `matcher.ts` untouched.
- **Hook (Task 2):** `packages/hooks/src/useReingestAutoLink.ts` — remove the 3 writes, add `onPendingMatches`.
- **Cluster (Tasks 3+4):** `packages/core/src/findings/helpers.ts` de-rank + `SynthesisPrompt.tsx` de-percent.
- **Chip + control (Task 5):** `MeasurementPlanChip` pending-match state + the 4-state analyst-owned select (shared UI → both apps).
- **App wiring (Task 6):** both apps hold `pendingMatches` state; pass to Wall planning props; compose the Inbox breadcrumb; fire `onPlansChanged` from the manual path; drop the `bestSubsets` arg at `AnalyzeWorkspace.tsx:822`.
- **Docs (Task 7):** spec §4.5 delivered-note, decision-log, investigations (follow-ups + the closed plan-lifecycle gap), the two stale-doc fixes.

## Task sequencing

Task 1 (engine) → Task 2 (hook) → Task 5 (chip UI) → Task 6 (app wiring) are a dependency chain. Tasks 3+4 (cluster) are independent — run between or alongside. Task 7 docs last. Final adversarial review on the whole branch.

---

## Task 1: Engine — strip the writes, return pending-match descriptors (TDD)

**Model:** Sonnet. **Files:** `packages/core/src/autoLink/engine.ts`, `packages/core/src/autoLink/__tests__/engine.test.ts`. Do NOT touch `matcher.ts`.

- [ ] **Step 1: failing tests.** Rewrite the engine tests to the new contract:

```ts
it('returns a pending-match descriptor per matched plan+column, with no finding and no actions', () => {
  const result = computeReingestAutoLink(newColumns, plans, hypotheses);
  expect(result.pendingMatches).toEqual([
    expect.objectContaining({
      planId: 'plan-1',
      column: 'nozzle-temp',
      hypothesisId: 'h-1',
      planStatus: 'planned', // so the host knows whether 'mark in-progress' applies
    }),
  ]);
  // The de-automation negative controls — the old write surfaces are GONE:
  expect((result as Record<string, unknown>).findingsToAdd).toBeUndefined();
  expect((result as Record<string, unknown>).linkActions).toBeUndefined();
  expect((result as Record<string, unknown>).statusActions).toBeUndefined();
});

it('still matches via the mechanical matcher (kept) — soft-deleted plans skipped', () => {
  // unchanged matcher behavior: a deleted plan with a matching neededFactor yields NO pending match
});
```

- [ ] **Step 2: run red** — `pnpm --filter @variscout/core test -t autoLink` / the engine suite.
- [ ] **Step 3: implement.** Delete `buildAutoFinding`, the `AUTO_FINDING_*` constants, the `validationStatus` honesty-guard block (`engine.ts:76-125`), and the `findingsToAdd`/`linkActions`/`statusActions` emission (`:134-188`). `computeReingestAutoLink` now maps `matchColumnsToPlans(...)` output to `ReingestPendingMatch[]`:

```ts
export interface ReingestPendingMatch {
  /** Deterministic id so hosts can dedup/dismiss: `${planId}:${column}` */
  id: string;
  planId: string;
  /** The hypothesis the plan belongs to (for focus-on-arrival + the breadcrumb label). */
  hypothesisId: string;
  column: string;
  planStatus: MeasurementPlanStatus;
  /** Human label context: the plan's primaryFactor or outcome. */
  planLabel: string;
}
```

Pure data — no actions, no Finding. Keep the matcher call + the soft-delete skip exactly as-is.

- [ ] **Step 4: run green; commit** `feat(core): re-ingest engine emits pending-match descriptors, no silent writes`.

## Task 2: Hook — surface pending matches, write nothing (TDD)

**Model:** Opus (the seam: subscription/debounce/dedup semantics). **Files:** `packages/hooks/src/useReingestAutoLink.ts`, `packages/hooks/src/__tests__/useReingestAutoLink.test.ts`.

- [ ] **Step 1: failing tests.**

```ts
it('surfaces pending matches via onPendingMatches and performs ZERO writes', async () => {
  // append a column matching a plan's neededFactors → advance debounce
  expect(onPendingMatches).toHaveBeenCalledWith([
    expect.objectContaining({ planId: 'plan-1', column: 'nozzle-temp' }),
  ]);
  // Negative controls (the de-automation): nothing was written anywhere
  expect(useAnalyzeStore.getState().findings).toHaveLength(0); // no auto-Finding
  expect(repository.dispatch).not.toHaveBeenCalled(); // no link, no status bump
  expect(onPlansChanged).not.toHaveBeenCalled(); // nonce no longer fires from the cascade
});

it('does not re-surface a match already linked to the plan', () => {
  // plan already has a finding covering that column → no pending match emitted
});

it('same-delta re-fire does not duplicate pending matches', () => {
  // second rawData change with no NEW columns → onPendingMatches not called again
});
```

- [ ] **Step 2: run red.**
- [ ] **Step 3: implement.** Remove the `setState` injection (`:234-239`) and the dispatch loop (`:244-247`); remove the now-unfired `onPlansChanged` call at `:254-256` from the cascade (the option STAYS in the hook's options type — Task 6 re-wires it to the manual path; document this in the option's JSDoc). Add `onPendingMatches?: (matches: ReingestPendingMatch[]) => void` to the options; call it with the engine result when non-empty. Keep: the `rawData` subscription (`:266-268`), the 2000ms debounce, the `priorColumns` delta seeding (`:160`), and the telemetry-only REPLACE branch (`:181-205`) untouched.
- [ ] **Step 4: run green; commit** `feat(hooks): useReingestAutoLink surfaces pending matches; silent writes removed`.

## Task 3: Cluster detector — grouping without ranking (TDD)

**Model:** Sonnet. **Files:** `packages/core/src/findings/helpers.ts:496-572`, `packages/core/src/findings/__tests__/helpers.test.ts`, barrel if the signature changes.

- [ ] **Step 1: failing test with a load-bearing negative control.**

```ts
it('groups findings by shared factor WITHOUT ranking by R² (high-R² cluster is NOT promoted to first)', () => {
  // Two clusters; the one with the higher per-factor R²adj would have sorted FIRST under
  // the old impl. Assert order follows the grouping-stable order (e.g. first-seen factor),
  // NOT the R² order — the old impl FAILS this.
  expect(clusters.map(c => c.factor)).toEqual(['shift', 'machine']); // first-seen, not R²-desc
  expect(clusters[0]).not.toHaveProperty('rSquaredAdj');
});
```

- [ ] **Step 2: run red.**
- [ ] **Step 3: implement.** Drop `EvidenceCluster.rSquaredAdj` (`:503`), the per-factor R² lookup (`:533-540`), the `bestSubsetsResult` parameter (`:519-523`), and the sort (`:569`). Keep the grouping (analyzed/investigating findings grouped by `activeFilters` column) with deterministic first-seen order. Rewrite the existing ranking assertions (`helpers.test.ts:462-494`). Do NOT touch `modelBuilder.ts` or `ModelBuilderBand` (CS-8's legitimate ΔR² surface).
- [ ] **Step 4: run green; commit** `feat(core): cluster detector groups by shared factor without R² ranking`.

## Task 4: Cluster card — drop the R² percentage (mechanical)

**Model:** Haiku. **Files:** `packages/ui/src/components/AnalyzeConclusion/SynthesisPrompt.tsx`, its test.

- [ ] Remove the `pct` computation (`:12`) and the `(combined R²adj {pct}%)` string (`:24`); keep "Related evidence detected — N findings relate to <factor>" + the `[Name this cause →]`/`[Not yet]` CTAs. Test: positive (grouping copy renders) + negative (`expect(screen.queryByText(/R²|combined|%/)).toBeNull()`). Run `pnpm --filter @variscout/ui test SynthesisPrompt`. Commit `feat(ui): cluster card shows the grouping, not an R² ranking`.

## Task 5: The chip — pending-match prompt + analyst-owned plan status (TDD)

**Model:** Opus (the apply surface; UX judgment). **Files:** `packages/ui/src/components/AnalyzeWall/MeasurementPlanChip.tsx` (+ its render host in `HypothesisCardWithPlans`/WallCanvas planning props), tests, i18n keys.

**Contract:** the chip is the SINGLE apply surface. New optional props: `pendingMatch?: { column: string } | null`, `onLinkFinding` (exists), `onSetPlanStatus?: (planId: string, status: MeasurementPlanStatus) => void`, `onDismissPendingMatch?: (id: string) => void`, `canEdit`-equivalent gating consistent with the card's existing gate.

- [ ] **Step 1: failing tests.**

```ts
it('renders the pending-match prompt when a needed factor arrived', () => {
  // pendingMatch={column:'nozzle-temp'} → "Factor “nozzle-temp” arrived" + [Link finding…] + [Mark in-progress] + dismiss
});
it('Mark in-progress calls onSetPlanStatus(planId, "in-progress") — one click, no auto-fire on render', () => {
  // NEGATIVE CONTROL: merely rendering the pending match calls onSetPlanStatus ZERO times.
});
it('the analyst-owned status select offers all 4 states and dispatches the free choice', () => {
  // pick 'complete' on a planned plan → onSetPlanStatus(planId, 'complete') — no gate, no validation
});
it('no prompt and no select without edit rights', () => {
  /* gate mirrors the card's canEdit */
});
it('no prompt when there is no pending match (the quiet default)', () => {
  /* chip renders as today */
});
```

- [ ] **Step 2: run red.**
- [ ] **Step 3: implement.** Pending-match prompt block on the chip (semantic Tailwind, mirrors the existing chip styling; `data-testid="pending-match-prompt"`): copy `Factor “{column}” arrived — needed by this plan`, actions **Link finding…** (opens the existing `LinkFindingPicker` flow), **Mark in-progress** (one-click `onSetPlanStatus(planId,'in-progress')`, shown only when `planStatus==='planned'`), and a dismiss (✕ → `onDismissPendingMatch`). Beside it (always, not only when pending): the **4-state select** (`data-testid="plan-status-select"`, CS-10's hypothesis-select pattern; labels via new i18n keys). i18n: add the new `MessageCatalog` keys (interface + en.ts + 31 English placeholders — **the 33-file change; budget it**, per the CS-8 lesson).
- [ ] **Step 4: run green** (`pnpm --filter @variscout/ui test MeasurementPlanChip && pnpm --filter @variscout/ui build` + `pnpm --filter @variscout/core test -t i18n`). Commit `feat(ui): pending-match prompt + analyst-owned plan-status select on the plan chip`.

## Task 6: App wiring — both apps + the Inbox breadcrumb + the nonce (TDD where seams allow)

**Model:** Opus. **Files:** `apps/azure/src/pages/Editor.tsx`, `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`, `apps/pwa/src/App.tsx`, `apps/pwa/src/components/views/AnalyzeView.tsx`, the Inbox composition site (where `InboxDigest` gets its prompts on the Process tab — both apps if mounted in both; ground at build time).

- [ ] **Step 1: pending-match state.** In each app, hold `pendingMatches: ReingestPendingMatch[]` + a session-only `dismissedIds: Set<string>` in component state beside the existing `useReingestAutoLink` call; wire `onPendingMatches` (merge by `id`, drop dismissed). Pass per-plan pending matches through the Wall planning props to the chip (mirror how `onRecordDisconfirmation`/`onSetStatus` flow).
- [ ] **Step 2: the manual write path + the nonce.** `onSetPlanStatus` dispatches `MEASUREMENT_PLAN_UPDATE {planId, patch:{status}}` via the app's repository and then **fires the plan-load nonce** (`setPlanLoadNonce(n=>n+1)`) — the §9 guardrail relocated to the manual path. Linking via `LinkFindingPicker` keeps its existing dispatch (verify it also bumps the nonce; add if missing). Clear the plan's pending match on either action.
- [ ] **Step 3: the Inbox breadcrumb (navigate-only).** Compose one digest entry per pending match into the existing `InboxDigest` prompt list at the app layer (shape-compatible with `SurveyInboxPrompt`): message `Needed factor “{column}” arrived for “{planLabel}”`, action label `Review on the Wall`, route = open Analyze + focus the hypothesis (the CS-5 focus-on-arrival path). NO apply callback. If the Inbox is mounted in only one app, wire that app and log the gap (don't build a new Inbox).
- [ ] **Step 4: drop the cluster's bestSubsets arg** at `AnalyzeWorkspace.tsx:820-825` (the Task-3 signature change; tsc will flag).
- [ ] **Step 5: bounded verification.** `pnpm --filter @variscout/hooks test && pnpm --filter @variscout/ui build`, both apps `tsc --noEmit`. Targeted app tests where they exist. Commit `feat(apps): wire the re-ingest confirm prompt, Inbox breadcrumb, and manual plan-status path`.

## Task 7: In-PR docs + stale-doc fixes

**Model:** Sonnet. **Files:** spec §4.5, `docs/decision-log.md`, `docs/ephemeral/investigations.md`, `packages/core/src/findings/reEvaluate.ts:19`, `packages/stores/CLAUDE.md:36`.

- [ ] Spec §4.5 delivered-note (three silent writes removed → chip-apply + Inbox-navigate; full analyst-owned plan status; cluster grouping de-ranked; `validationStatus` correction; §12 Q5 still deferred).
- [ ] decision-log entry (host = "hints navigate, chips apply"; full plan-status control rationale; cluster de-rank Azure-only leave+log).
- [ ] investigations.md: log **ingest match-summary line** as optional polish; log **PWA cluster-prompt parity** gap; note the **plan-lifecycle dead-end CLOSED** by the full control.
- [ ] Fix `reEvaluate.ts:19` (nonexistent IM-3 decision-log citation) + `packages/stores/CLAUDE.md` "6 variants" → "4 variants (5 chart discriminant values)".
- [ ] Commit `docs(cs-11): spec note + decision-log + follow-ups + stale-doc fixes`.

## Final: whole-branch adversarial review

Opus, STEP 0 checkout the branch. Risk axes: **(1) Zero-silent-write** — grep the cascade end-to-end; prove nothing writes without an analyst click (no setState injection, no dispatch from the hook; the negative controls actually fail when reverted). **(2) The nonce relocation** — `onPlansChanged`/plan-load-nonce fires from BOTH apps' manual paths (status set + link); the Wall doesn't go stale. **(3) Plan-status freedom + no hypothesis-status touch** — the 4-state select is free-choice; grep confirms nothing in this PR writes `Hypothesis.status`. **(4) De-rank completeness without over-reach** — sort + percent both gone; `modelBuilder`/`ModelBuilderBand` (CS-8) untouched; the cluster negative control (high-R² not promoted) fails under revert. **(5) Boundary** — REPLACE branch still telemetry-only (§12 Q5 not bled in); PWA cluster gap logged not closed. `pr-ready-check` green is the gate.

## Self-review checklist (run before dispatching Task 1)

- [ ] Spec coverage: §4.5 silent-write removal (T1+T2+T5+T6), cluster grouping (T3+T4), boundary (locked decisions). ✓
- [ ] Type consistency: `ReingestPendingMatch` shape identical across engine → hook → chip props → app state; `onSetPlanStatus(planId, status: MeasurementPlanStatus)` one signature everywhere. ✓
- [ ] No placeholders: every code step shows code or names the exact shipped pattern to mirror (`LinkFindingPicker`, the CS-10 select, the `onRecordDisconfirmation` planning-props flow, `InboxDigest` prompts). ✓
