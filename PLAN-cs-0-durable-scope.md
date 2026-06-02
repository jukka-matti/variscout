# PR-CS-0 sub-plan — Make scope durable + IP-keyed

> Execution artifact (worktree-local, not committed). Implements master-plan PR-CS-0. **Grounded 2026-06-02** — the drill→scope bridge is ALREADY WIRED (extend, never recreate). Each task is TDD: write failing test → run (red) → minimal impl → run (green) → commit.

## Architecture decisions (locked, from grounding)

- **Keep `ProblemStatementScope` in `useAnalyzeStore` (Document layer)** — no new store, no ADR-078 amendment (stays at the current store count). The entity already lives there; `createProblemStatementScope` keys it by `investigationId`.
- **The drill→scope bridge EXISTS** — `analyzeStore.syncScopeFromDrill` (`packages/stores/src/analyzeStore.ts:698-721`) → `buildConditionFromCategoricalFilters` → `predicateSetKey` idempotency → `addScope` → `createProblemStatementScope`. ONE live caller: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:253-258` (useEffect on `[categoricalFilters, outcome]`). **STEP 0 of every task: grep `syncScopeFromDrill` + read it — extend, do not recreate.**
- **IP-key = (A) stamp `activeIP.id` as the scope's `investigationId`** (replace the `'general-unassigned'` sentinel at `AnalyzeWorkspace.tsx:252`; fall back to sentinel only when no active IP) **+ (B) clear the transient `analysisScopeStore` (View) on IP switch.**
- **Durability (blob round-trip) is OUT of CS-0 → PR-CS-0b** (`analyzeStore` has no persist middleware; `serializeInvestigationState`/`deserializeInvestigationState` have zero live callers; PWA is session-only by design). CS-0 delivers **IP-correct + session-safe + seeded/linked**; CS-0b wires the serializer. Do NOT silently claim "durable across reload."
- Cross-store imperative `getState()` calls in effects are allowed; reactive store subscriptions in `packages/hooks` are forbidden (per package CLAUDE.md). The clear-on-switch logic lives at the app shell, extracted into a tiny `packages/hooks` hook that takes `activeIPId` + an imperative `clearFn`.

## Tasks

### Task 1 — Lock per-IP scope idempotency (analyzeStore unit)

- **Files:** test `packages/stores/src/__tests__/analyzeStore.scope.test.ts` (extend if exists); read `analyzeStore.ts:698-721`, `factories.ts:324-341`.
- **Test:** `syncScopeFromDrill('ip-A', outcome, filters)` and `syncScopeFromDrill('ip-B', outcome, filters)` with identical predicates → TWO distinct scopes (different `investigationId`); re-firing within one IP → idempotent (same scope, predicateSetKey). Empty predicates → returns undefined (no scope).
- **Impl:** likely no production change if behavior holds — this red/green pins the contract Task 2 relies on. If it fails, fix the keying in `syncScopeFromDrill`.
- **Acceptance:** test green; idempotency is per-`investigationId`.

### Task 2 — IP-key the materialization (AnalyzeWorkspace, Azure)

- **Files:** `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:250-270`; test alongside.
- **Test:** with an active IP set, a drill materializes a scope whose `investigationId === activeIP.id`; with no active IP, falls back to `'general-unassigned'`. The scope rail shows only the active IP's scopes.
- **Impl:** replace the `'general-unassigned'` sentinel (line 252) with `useActiveIPContext(sessionHub).activeIP?.id ?? 'general-unassigned'`; thread it into `syncScopeFromDrill` (255-257) and the `activeScope` memo (259-270); filter the rail by the active IP id.
- **Acceptance:** scopes don't co-mingle across IPs; rail is IP-filtered; gate green.

### Task 3 — Clear-on-IP-switch hook + Azure wiring

- **Files:** create `packages/hooks/src/useClearScopeOnIPSwitch.ts` (+ test + barrel export + tsconfig path if needed); wire at the Azure shell that consumes `useActiveIPContext`.
- **Test:** switching IP A→B invokes `clearFn`; first-render / auto-activation (single-IP hub) does NOT (track previous id in a ref; only fire on genuine non-null A→B, A!==B — mirror `autoActivatedScopeRef`, `useActiveIPContext.ts:63`).
- **Impl:** the hook takes `(activeIPId, clearFn)`; the shell passes `useAnalysisScopeStore.getState().clearScope`.
- **Acceptance:** A→B clears `categoricalFilters`; first render does not; gate green.

### Task 4 — PWA mirror of clear-on-switch

- **Files:** wire `useClearScopeOnIPSwitch` at the PWA shell; test mirrors Task 3.
- **Acceptance:** PWA matches Azure behavior; both builds aligned.

### Task 5 — "See the data" seeds Y (Azure)

- **Files:** `apps/azure/src/components/editor/FrameView.tsx:224-226`; test.
- **Test:** after `handleSeeData`, `useAnalysisScopeStore.getState().yColumn === projectStore.outcome` and `categoricalFilters` is empty (no scope created — empty predicates).
- **Impl:** before `showExplore()`, `useAnalysisScopeStore.getState().setY(useProjectStore.getState().outcome)` when outcome is set. Leave the chip-click path (`navigateToExploreForChip`) untouched.
- **Acceptance:** bare "See the data" lands on the seeded outcome.

### Task 6 — "See the data" seeds Y (PWA)

- **Files:** `apps/pwa/src/components/views/FrameView.tsx:212-214`; test mirrors Task 5.
- **Acceptance:** PWA bare path seeds Y.

### Task 7 — capture-as-Finding links the scope (Azure)

**DESIGN RESOLVED (2026-06-02, user sign-off): add an OPTIONAL `scopeId` FK on the `Finding` ENTITY (not on `FindingContext`).** Grounding confirmed `FindingContext` has NO scope-ref field — `cumulativeScope` (`number | null`) and `Finding.scoped` (`boolean`) are FALSE FRIENDS, neither holds a scope id. This is a small ADDITIVE typed field, not a field-reuse. Serialization is structural (no zod schema / no field allow-list — Findings spread whole-object through `documentSnapshot.ts` + both apps' serializers), so **NO IDB migration and NO serializer edit** are needed. Keep the field OPTIONAL so the other 4 `createFinding` callers + all test fixtures are untouched (making it required = a wide cascade — do NOT).

- **Files:**
  - `packages/core/src/findings/types.ts` — add `scopeId?: ProblemStatementScope['id'];` to the `Finding` interface, next to `investigationId` (~L497). (Entity FKs live on `Finding`, not `FindingContext` — `investigationId` sets that precedent.)
  - `packages/stores/src/analyzeStore.ts` — `addFinding` (~L374-386) is the single authoritative construction path; thread an optional scope id through to the constructed Finding (widen the action and/or `createFinding`). It currently hard-codes `investigationId='general-unassigned'`.
  - `packages/core/src/findings/factories.ts` — `createFinding` (~L36-67) builds the Finding; add the optional field assignment (only if you construct it here rather than spread-assign).
  - `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` — the capture sites already hold `activeScope?.id` in lexical scope (the `activeScope` memo, L259-270 — Task 2 keeps it IP-keyed): `handleCaptureModel` (L282-316), `handleEvaluateFactor` (L376-379), `handleMapCreateFinding` (~L962), the respawn-carried finding (~L512). Pass `activeScope?.id` into `addFinding` at these sites.
- **Test:** capturing with a non-empty drill → the captured Finding's `scopeId` equals the id of the scope `syncScopeFromDrill` materialized (same `predicateSetKey`), and that scope's `investigationId === activeIP.id` (Task 2 contract). Capturing with an empty drill (no scope) → `scopeId` is `undefined`. Optional-ness: a Finding built without a scope still validates.
- **Impl note:** there is NO `selectedScopeId` in `analyzeStore` — the "active scope at capture time" source of truth is the component's `activeScope` memo, so the FK MUST be threaded from the component (pass `activeScope?.id` into `addFinding`), NOT read from store state. Keep `context.activeFilters` as-is (display/back-compat); `scopeId` is the new durable FK.
- **Acceptance:** Finding durably links its scope via `Finding.scopeId`; field optional; no migration; existing Finding fixtures/tests untouched; spine is now bidirectional (scope ⟷ finding).
- **PR + decision-log:** record this data-model decision (new finding→scope edge; deliberately additive to the existing top-down scope→hypothesis→finding linkage) in the PR body and `docs/decision-log.md`.

### Task 8 — capture-as-Finding links the scope (PWA)

- **Files:** `apps/pwa/src/pages/AnalyzeView.tsx:~421` (onCaptureModel); test mirrors Task 7.
- **Acceptance:** PWA links scope.

### Task 9 (final) — gate + verify + review

- Run full `pnpm test` (turbo); `bash scripts/pr-ready-check.sh`; `--chrome` visual check (switching IP clears Explore chips; "See the data" lands on the seeded outcome).
- Dispatch the adversarial code-reviewer (STEP 0 = `git fetch && git checkout feat/cs-0-durable-scope`).
- Open the PR; document the **reload-durability gap → PR-CS-0b** in the PR body + `decision-log.md` (don't claim "durable across reload").

## Risks (carry into each task)

- Spec said "zero callers"; code has one — **extend, don't recreate** (duplicate scope path risk).
- Don't fire clear-on-switch on first render / auto-activation (would wipe a freshly-seeded scope).
- `useActiveIPContext` (hooks) can't subscribe to stores reactively — wire at the app shell, imperative `getState()` in effects.
- capture-as-Finding type change (if no scope-ref field) widens blast radius — read `FindingContext` first.
- Do NOT scope-creep into the dual-store seam (§5.4) or the two-factor-selection terminology (separate PRs).

---

## Progress (resume breadcrumb)

- **Worktree:** `.worktrees/cs-0-durable-scope` · **branch:** `feat/cs-0-durable-scope` (off `main` @ `b44e497e`). Deps installed.
- **Protocol:** subagent-driven-development — per task: implementer (TDD) → spec reviewer → code-quality reviewer → next. Continuous (don't pause between tasks). After all 8: final whole-branch review → PR (document the reload-durability gap → PR-CS-0b; do NOT claim "durable across reload").
- **Task 1 — DONE** (`e65541a3`): `packages/stores/src/__tests__/analyzeStore.scope.test.ts`, 5 passing, **zero production change** (existing `syncScopeFromDrill` already satisfies the per-IP idempotency contract). Test-only contract pin → its review folds into the FINAL whole-branch review (no separate 2-stage review for a zero-prod-change test).
- **Task 2 — DONE** (`09ca5071` impl+seam test, `909365d0` rerender guards A/B, `f5ba057c` Test C): `scopeInvestigationId` threaded as optional prop (default sentinel) from `Editor.tsx:1971` into `AnalyzeWorkspace.tsx`; added to all 3 deps arrays (L269 effect, L281 activeScope memo, L436 railScopes memo). Spec ✅ + quality ✅ (controller-verified each deps array is load-bearing via negative control). 9 seam tests; 37 existing tests unmodified+green.
- **Task 3 — DONE** (`67ab118f`): `packages/hooks/src/useClearScopeOnIPSwitch.ts(activeIPId, clearFn)` — ref-guard, fires only on non-null A→B; store-agnostic (caller supplies clearFn). 6 TDD cases (incl. first-render + both null-transitions suppressed). Barrel-exported. Wired in `Editor.tsx:632-633` via `useAnalysisScopeStore(s=>s.clearScope)` selector. Controller-verified (read hook+test+wiring directly); tsc clean.
- **Task 4 — DONE** (`ed643f12`): PWA mirror of clear-on-switch wired in `apps/pwa/src/App.tsx` `AppMain` (exact Azure mirror; tsc clean). Controller-verified hunk.
- **Tasks 5+6 — DONE** (`b9233797`): bare `handleSeeData` seeds Explore Y from `useProjectStore.getState().outcome` (imperative, guarded) in BOTH FrameViews; Azure chip path untouched. Azure 25/25, PWA 24/24.
- **Task 7 — DONE** (`6a2f7eea`): durable `Finding.scopeId` entity FK. types.ts (field on Finding, optional) + analyzeStore.addFinding (4th optional param, post-createFinding spread, factory untouched) + useFindings.addFinding (forward) + AnalyzeWorkspace 3-of-4 capture sites pass `activeScope?.id` (`:302`/`:387`/`:973`; `:523` respawn-carried left unlinked — it clones the prior refuting finding's filters, not the current drill — sound). Structural persistence (no migration). 2 store tests + 2 seam tests; tsc core 0 / azure 0 new. **UNDER ADVERSARIAL REVIEW.**
- **Task 8 — DEFERRED (user sign-off 2026-06-02): PWA scope → follow-up.** Grounding found PWA NEVER materializes scopes (`syncScopeFromDrill` 0 PWA callers; capture handler `apps/pwa/src/components/views/AnalyzeView.tsx:368` writes empty-scope context + string label only). Building PWA drill→scope is net-new capability, not a wiring mirror → its own PWA-parity task in a later connective PR. `Finding.scopeId` stays optional/undefined in PWA (valid). NO PWA code in PR-CS-0. Document in PR body + decision-log (with reload-durability→CS-0b).
- **NEXT = Task 9 (final gate)**: after Task 7 review passes → full `pnpm test` (turbo) + `bash scripts/pr-ready-check.sh` + `--chrome` visual (IP switch clears Explore chips; "See the data" lands on seeded outcome) → adversarial whole-branch code-review → PR (document BOTH deferrals: reload-durability→CS-0b, PWA-scope→follow-up; do NOT claim "durable across reload").
- Confirmed: `syncScopeFromDrill(investigationId, outcome, filters)` signature matches the plan. Grounding corrected MEMORY: `ProblemStatementScope` is fully wired+persisted (NOT zero-caller); `FindingContext` has NO scope-ref field (`cumulativeScope`/`scoped` are false friends) → Task 7 adds optional `Finding.scopeId`.
