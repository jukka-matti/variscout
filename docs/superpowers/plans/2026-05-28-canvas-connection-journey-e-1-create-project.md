---
tier: ephemeral
purpose: build
title: PR-CCJ-E1 — Lightweight Create Project flow + IP-blob persistence for Canvas state (single PR, 3 phases)
status: active
date: 2026-05-28
layer: spec
---

# PR-CCJ-E1 — Lightweight Create Project flow + IP-blob persistence for Canvas state (single PR, 3 phases)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Ship the IP-blob persistence story for the D-series Canvas state (processSteps + stepTimings + formulaBindings + timeDecompositionBindings) by collapsing the original 5-entry-point Charter ceremony into a single lightweight Create Project flow at Home (Title required + Issue Statement optional one-liner) and refactoring CanvasWorkspace to live entirely off the active `ImprovementProject` instead of local React `useState`.

**Architecture:** Single PR with three internal phases. Phase 1 extends `ImprovementProject` with 5 flat root fields (`issueStatement` + 4 Canvas arrays) and bumps IDB schema v13→v14 / v6→v7 with no migration per wedge V1 invariant. Phase 2 builds `<CreateProjectModal>` under `packages/ui/src/components/Home/` (mirror D3 `TimeAsFactorsModal` shell — FocusTrap + role="dialog" + Cancel/Create footer) plus the Home CTA wiring + IP factory + navigation. Phase 3 refactors `<CanvasWorkspace>` so the 4 `useState` arrays become `activeIP`-backed reads with `upsertProject` writes, adds a `<NoActiveProjectGuidance>` empty state for the Process tab, and lands the e2e Home→Create→Process→edit→persist test.

**Tech Stack:** TypeScript, React, Tailwind, Vitest, `focus-trap-react` (reused from D1+D2+D3 modal pattern), Dexie (IDB), Zustand (store layer). No new external dependencies. No back-compat shims, no migration helpers per `feedback_wedge_v1_no_migration_no_backcompat`.

**Spec amendment in flight:** This plan amends spec §4.4 (Promote to Project / Charter ceremony) and §4.4.1 (5 entry points + inherited-context block) per `feedback_honor_vision_commitments` option 3 (status-quo + amend spec). The amendment is captured in `docs/decision-log.md` as part of Task 1. The deferred half of §4.4.1 — "how do we consistently present IP-scoped entities across verb tabs given they auto-scope" — graduates to Task #44 design session.

---

## Context

Phase D3 shipped on main at `1d0563a1` (PR #227, 9 commits) on 2026-05-27. The canvas Edit mode now has the full D-series workflow stack — step timings (D1), calculated columns (D2), time-as-factors (D3) — but all four resulting state arrays live as local React `useState` in `CanvasWorkspace.tsx` with `TODO(PR-CCJ-E1)` markers (lines 498, 505, 513, 544). They persist to nothing, evaporate on remount, and were always understood as "Charter-modal-commit territory."

E1's original mandate (per master plan + memory): fold those four arrays into the `ImprovementProject` blob via Charter ceremony with 5 entry points + inherited-context block.

**Two design discoveries during brainstorming materially simplified E1:**

1. **"The IP IS the project"** — wedge V1 is a one-IP-at-a-time tool. There's no continuous-process-evaluation model layered on top; per-project Lead/Member/Sponsor ACL means a project's state IS its Canvas working state. So the 4 arrays don't belong nested inside a `canvasState` sub-blob — they're just **fields on `ImprovementProject`**, no different from `goal` or `metadata`.

2. **"Findings/Hypotheses auto-scope to the active IP, they aren't inherited at Charter time"** — Findings + Hypotheses are richly built out (see [[findings-hypotheses-implementation-reality]]): full type system in `packages/core/src/findings/`, `Finding` / `Hypothesis` types, status workflows, UI surfaces `FindingsPanel` / `FindingsWindow` / `FindingsLog`, IP type already has `sections.investigationLineage.{findingIds, hypothesisIds}`, Hub has top-level `findings` collection. But the user's mental model — clearer than the spec's — is that these entities live in the active IP automatically by virtue of being created while inside it. There's nothing to "inherit" at Charter time because the scoping is already implicit. **The whole "5 entry points with dynamic inherited-context block" ceremony evaporates** — its design question changes from "how do we bundle context at promotion time" to "how do we consistently present what's already there across verb tabs," which is a different design and is deferred to follow-up Task #44.

**E1 collapses to its minimal core:** one entry point (Home → "New project"), one mini-modal (Title required + Issue Statement optional one-liner), IP type extension for the 4 Canvas arrays + `issueStatement`, and CanvasWorkspace hydration/sync so Canvas state lives in the active IP via the store.

**Spec sections addressed (amended):**

- §4.4 (Promote to Project / Charter ceremony) — amended to single-entry lightweight create
- §4.4.1 (5 entry points + inherited-context block) — deferred to Task #44 design session
- §3.6 (Issue Statement vs Problem Statement) — preserved verbatim: Issue Statement is the captured field; Problem Statement is auto-synthesized downstream
- IP-blob shape for the 4 Canvas arrays — newly defined here, flat fields on `ImprovementProject`

**Master plan parent:** `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` — Phase E §"PR-CCJ-E1." Master plan files specced `CharterModal.tsx` + `InheritedContextBlock.tsx` + `entryPointAdapters.ts` — E1 amends to ship only the first (renamed `CreateProjectModal.tsx`) and drops the other two as deferred-with-Task-#44.

**Existing primitives ready to reuse (no rework needed):**

- `packages/core/src/improvementProject/types.ts` — `ImprovementProject extends EntityBase` already has `hubId`, `status`, `metadata`, `goal`, `sections.{background,investigationLineage,approach,outcomeReference}`. E1 adds 5 fields (`issueStatement` + 4 Canvas arrays) directly at root.
- `packages/stores/src/improvementProjectStore.ts` — `useImprovementProjectStore` with `setProjectsForHub` / `upsertProject` / `removeProject`. E1 uses existing `upsertProject` for both create + canvas-state patches (no new action needed).
- `apps/azure/src/hooks/useActiveIPContext.ts` — returns `{ scope, activeState, activeIP, isIPScoped, setActiveIP, clearActiveIP }`. Persists active IP id to localStorage. E1 wires CanvasWorkspace to consume this.
- `packages/ui/src/components/IPDetail/stages/CharterSections.tsx` — existing Charter form surface for inline editing post-create. Out-of-scope for E1 changes but available for future tab-level Charter detail UX.
- `packages/ui/src/components/Canvas/EditMode/Workflows/{CalculatedColumnModal,StepTimingsModal,TimeAsFactorsModal}.tsx` — D1/D2/D3 modal pattern (FocusTrap + role="dialog" + aria-labelledby + Cancel/Save footer) ready to mirror for `CreateProjectModal`.
- Type imports already in place: `StepTimingBinding`, `FormulaBinding`, `TimeDecompositionBinding`, `ExtractedStep` (the four Canvas state element types) all live in `@variscout/core` and are already imported by `CanvasWorkspace.tsx`.
- IDB schema bump pattern (per wedge V1 no-back-compat per [[feedback_wedge_v1_no_migration_no_backcompat]]): version up + empty `.stores({})` + accept data loss. v13 (Azure) → v14, v6 (PWA) → v7.

**What MUST be built (no equivalent exists):**

- `ImprovementProject` type extension — add 5 fields directly at root (`issueStatement`, `processSteps`, `stepTimings`, `formulaBindings`, `timeDecompositionBindings`).
- `packages/ui/src/components/Home/CreateProjectModal.tsx` — lightweight FocusTrap modal: Title (required, ≤80 chars) + Issue Statement (optional, ≤500 chars).
- `apps/azure/src/components/home/HomeView.tsx` (and PWA equivalent) — wire "New project" CTA.
- `CanvasWorkspace.tsx` refactor — replace the 4 `useState` arrays with `activeIP`-backed reads + `upsertProject` writes.
- `NoActiveProjectGuidance` empty state for Process tab.
- IDB schema bump (Azure v13→v14, PWA v6→v7) — no upgrade callback per wedge V1 invariant.

---

## Approach

Single PR with **three internal phases:**

```
Phase 1: IP type extension + IDB schema bump + store action sanity            (tasks 1–2)
Phase 2: CreateProjectModal + Home CTA wiring                                  (tasks 3–4)
Phase 3: CanvasWorkspace activeIP-backed refactor + Process-tab empty state +
         e2e + final hygiene                                                   (tasks 5–8)
```

Subagent-driven. Sonnet implementer + Sonnet 2-stage review per task. **Opus implementer** for Task 5 (CanvasWorkspace refactor — touches the core state plumbing, multi-file integration, 4-array replace-with-store-reads is judgment-heavy). **Opus final branch reviewer** over all 8 commits.

**Carve clause:** if Task 5 surfaces unexpected coupling (e.g., test fixtures across `packages/ui/src/components/Canvas/__tests__/` need wide rewrites because they previously assumed local useState), the natural split is Phase 2 → Phase 3 boundary — modal + Home wiring ships as E1.1, CanvasWorkspace refactor as E1.2. Orchestrator can split without redrafting Phase 1/2.

---

## Decisions (resolved during planning)

1. **PR scope = single PR with ~8 tasks, 3 internal phases.** D3 precedent at 8 tasks shipped cleanly via `--merge --delete-branch`.
2. **IP field layout = flat fields on `ImprovementProject` root.** No `canvasState` wrapper. Per user's "the IP IS the project" framing.
3. **Title required, Issue Statement optional.** Minimum friction at create-time; richer Charter fields edited inline later.
4. **5-entry-point ceremony amended to single Home entry.** Per "context auto-scopes to active IP" mental model. Deferred half logged as Task #44.
5. **Findings/Hypotheses inheritance not implemented in E1.** They exist robustly in code ([[findings-hypotheses-implementation-reality]]); inheritance happens later by surfaces that create them while in the active IP.
6. **CanvasWorkspace becomes activeIP-backed.** The 4 `useState` arrays are replaced with store-backed reads + writes. Task 5 is Opus-implemented due to refactor risk.
7. **No active project guard on Process tab.** Empty state component routes user to Home.
8. **IDB schema bump no-migration.** Azure v13→v14, PWA v6→v7, empty `.stores({})`, accept data loss per wedge V1 invariant.
9. **`status: 'active'` from create-time.** No draft→active gating in V1.
10. **Plain text Issue Statement.** Smart-suggest from Findings/Hypotheses deferred even though those types exist; CoScout-style auto-fill is a V2 concern.

---

## TDD task list (8 tasks total)

### Phase 1 — IP type extension + IDB schema bump

#### Task 1 — Add 5 fields to `ImprovementProject` + decision log entry

- Branch `feat/wedge-v1-ccj-e-1-create-project` off `main` in `.worktrees/feat/wedge-v1-ccj-e-1-create-project/`
- Extend `packages/core/src/improvementProject/types.ts`:
  ```typescript
  export interface ImprovementProject extends EntityBase {
    hubId: string;
    status: 'draft' | 'active' | 'closed';
    issueStatement?: string;
    processSteps?: ExtractedStep[];
    stepTimings?: StepTimingBinding[];
    formulaBindings?: FormulaBinding[];
    timeDecompositionBindings?: TimeDecompositionBinding[];
    // ...existing fields preserved verbatim (metadata, goal, sections, updatedAt, signoff, reflection)
  }
  ```
- Add type imports at top of file (verify exact paths at impl time):
  ```typescript
  import type { ExtractedStep } from '../canvas/extractedStep';
  import type {
    StepTimingBinding,
    FormulaBinding,
    TimeDecompositionBinding,
  } from '../derived/types';
  ```
- Verify root barrel `packages/core/src/index.ts` re-exports unaffected (these field types are already exported per D-series shipped work)
- Add amendment entry to `docs/decision-log.md` (state: `amended`): "Spec §4.4 5-entry-point Charter ceremony deferred to Task #44 design session. E1 ships lightweight Create Project at Home only; 4 Canvas arrays + issueStatement become flat fields on ImprovementProject."
- Failing tests in `packages/core/src/improvementProject/__tests__/types.test.ts` (create file if absent):
  - Type-level test (using `expectTypeOf`): IP accepts the 5 new optional fields with correct shape
  - Type-level test: IP without the 5 fields still type-checks
  - Type-level test: `processSteps?: ExtractedStep[]` not `ExtractedStep` (array assertion)
- Commit: `feat(wedge-v1): E1 task 1 — extend ImprovementProject with issueStatement + 4 Canvas-state fields`

#### Task 2 — IDB schema bump + store action sanity

- Bump `apps/azure/src/db/schema.ts` from v13 to v14:
  ```typescript
  this.version(14).stores({});
  ```
  No upgrade callback. Comment: `// v14 (PR-CCJ-E1): ImprovementProject extended with issueStatement + 4 Canvas-state fields. Per wedge V1 no-back-compat invariant: schema bump with no migration; v13 stores re-initialize on first open.`
- Bump `apps/pwa/src/db/schema.ts` from v6 to v7 with same pattern + similar comment.
- Verify `packages/stores/src/improvementProjectStore.ts` `upsertProject(project)` action signature accepts the extended type (TypeScript compile check); add no logic.
- Failing tests:
  - `apps/azure/src/db/__tests__/schema.test.ts` — schema version is 14, no upgrade callback
  - `packages/stores/src/__tests__/improvementProjectStore.test.ts` — `upsertProject` accepts + round-trips extended IP shape
- Commit: `feat(wedge-v1): E1 task 2 — IDB v14/v7 schema bump (no migration) + store accepts extended IP type`

### Phase 2 — CreateProjectModal + Home CTA wiring

#### Task 3 — `CreateProjectModal.tsx` skeleton + Title field + validation + save handler

- Create `packages/ui/src/components/Home/CreateProjectModal.tsx`:
  ```typescript
  export interface CreateProjectModalProps {
    onSave: (project: { title: string; issueStatement?: string }) => void;
    onClose: () => void;
  }
  ```
- Mirror D3 `TimeAsFactorsModal` shell: backdrop + FocusTrap + role="dialog" + aria-labelledby="create-project-modal-title" + Escape + backdrop click → onClose
- Header: "New project"
- Body: Title input (required, ≤80 chars, `aria-required="true"`); inline char counter `{n}/80`; trim-leading-trailing on Save
- Footer: Cancel (calls onClose) + "Create →" (primary, disabled when Title empty after trim)
- Save handler: emit `{ title: trimmed }` (Issue Statement field comes in Task 4)
- Failing tests in `packages/ui/src/components/Home/__tests__/CreateProjectModal.test.tsx`:
  - Renders inside FocusTrap, role="dialog", aria-labelledby
  - Header copy: "New project"
  - Escape + backdrop click both call `onClose`
  - Title input with `aria-required="true"` + char counter
  - Empty Title → Create button disabled
  - Whitespace-only Title → Create button disabled (trim check)
  - Title `"My project"` → Create enabled
  - 81-char title → input clamped to 80 via maxLength
  - Click Create → `onSave({ title: "My project" })` exactly once
  - Click Cancel → `onClose` called, `onSave` NOT called
- Commit: `feat(wedge-v1): E1 task 3 — CreateProjectModal skeleton + Title field + validation`

#### Task 4 — Issue Statement field + Home CTA wiring + navigation

- Extend `CreateProjectModal.tsx`:
  - Add Issue Statement textarea (optional, ≤500 chars, helper copy: "What's happening? Brief description of the situation you're investigating.")
  - Char counter `{n}/500`
  - On Save: emit `{ title, issueStatement?: string | undefined }` (omit when empty after trim)
- Failing tests extended in `CreateProjectModal.test.tsx`:
  - Renders Issue Statement textarea with helper copy + 500 char counter
  - Issue Statement is optional (Create remains enabled when Title is set + Issue Statement empty)
  - Issue Statement empty/whitespace → `onSave` payload does not include `issueStatement` key
  - Issue Statement `"yields are dropping"` → `onSave` receives `issueStatement: "yields are dropping"`
  - 501-char Issue Statement → input clamped to 500
- Wire Home CTA — locate `apps/azure/src/components/home/HomeView.tsx` (or whichever component renders Home for Azure) and add a "New project" button. Wire it to:
  ```typescript
  const handleCreate = ({ title, issueStatement }: { title: string; issueStatement?: string }) => {
    const newIP = createNewIP({ hubId, title, issueStatement, currentUserId });
    upsertProject(newIP);
    setActiveIP(newIP.id);
    navigate('/process');
  };
  ```
  Where `createNewIP` is a thin factory in `packages/core/src/improvementProject/factories.ts` (create if absent, mirror existing factory patterns) returning a default-shaped IP with `status: 'active'`, `members: [{ userId: currentUserId, role: 'Lead' }]`, empty Canvas arrays, `updatedAt: Date.now()`, `metadata.title`, etc.
- Add equivalent CTA + handler to PWA Home view if structure mirrors (defer if PWA's Home structure differs — Task 8 e2e Azure-only is acceptable; explicit defer note in commit)
- Failing tests:
  - `apps/azure/src/components/home/__tests__/HomeView.test.tsx` — "New project" button visible; click opens modal; Save invokes `upsertProject` + `setActiveIP` + navigation
- Commit: `feat(wedge-v1): E1 task 4 — Issue Statement field + Home "New project" CTA + IP create + navigation`

### Phase 3 — CanvasWorkspace activeIP-backed refactor + empty state + e2e

#### Task 5 — CanvasWorkspace refactor: replace 4 useState with activeIP-backed reads + store writes (**Opus implementer**)

**Why Opus:** This is the judgment-heavy multi-file refactor. The 4 `useState` arrays are deeply integrated with handlers (onChipContextMenuSelect, handleStepsReplace, handleTimeFactorsSave, StepTimingsModal/CalculatedColumnModal save callbacks), and test fixtures across `packages/ui/src/components/Canvas/__tests__/` previously assumed local state. Risk of subtle prop-drilling bugs is high.

- **First**, audit consumer reach: read `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` lines 483-666 (useState declarations + useMemo derivations + handler bodies) and produce an inventory:
  - 4 useState calls + setters (line refs)
  - All handlers that mutate any of the 4 arrays
  - All child components that receive any of the 4 arrays as props or are wired to setters
  - All test files that construct CanvasWorkspace with any of those 4 arrays pre-populated
- Refactor:

  ```typescript
  // BEFORE:
  const [stepTimings, setStepTimings] = React.useState<StepTimingBinding[]>([]);

  // AFTER:
  const activeIP = useActiveIPContext(sessionHub).activeIP;
  const stepTimings = activeIP?.stepTimings ?? [];
  const setStepTimings = (next: StepTimingBinding[]) => {
    if (!activeIP) return; // guarded; should be unreachable per empty-state route
    upsertProject({ ...activeIP, stepTimings: next, updatedAt: Date.now() });
  };
  ```

  Same pattern for `formulaBindings`, `timeDecompositionBindings`, `processSteps`.

- Remove the 4 `TODO(PR-CCJ-E1)` comments now that they're addressed.
- Update test fixtures in affected `__tests__/` files: replace pre-populated local-state setup with `activeIP` fixture construction via factory `createTestIP({ stepTimings: [...], ... })` (create factory at `packages/ui/src/test-utils/improvementProject.ts` if absent, mirror existing test-util factories like `createTestFormulaBinding`).
- Failing tests in new `CanvasWorkspace.test.tsx` section "ImprovementProject-backed Canvas state":
  - When `activeIP == null`: stepTimings/formulaBindings/etc. all read as `[]`; setters are no-ops
  - When `activeIP` has `stepTimings: [b1, b2]`: CanvasWorkspace renders 2 step-timing-derived chips
  - StepTimingsModal Save → `upsertProject` invoked with `{ ...activeIP, stepTimings: <new bindings>, updatedAt: <fresh> }`
  - Same assertion for CalculatedColumnModal (formulaBindings) and TimeAsFactorsModal (timeDecompositionBindings)
  - Process zone drag-replace → `upsertProject` invoked with `{ ...activeIP, processSteps: <next>, updatedAt: <fresh> }`
  - Multiple sequential edits compose correctly
- **Run before commit:** `pnpm --filter @variscout/core test` + `pnpm --filter @variscout/ui test` + `pnpm --filter @variscout/stores test` + `pnpm --filter @variscout/ui build`
- Commit: `feat(wedge-v1): E1 task 5 — CanvasWorkspace activeIP-backed state (drop 4 useState, sync via store)`

#### Task 6 — "No active project" empty state on Process tab + Canvas guard

- Add `packages/ui/src/components/Canvas/NoActiveProjectGuidance.tsx` (verify whether existing component referenced by `feedback_active_ip_cascade_pattern` already lives at this path):
  - Copy: "No active project. Open a project from Home or create a new one to start editing the Canvas."
  - CTA button: "Go to Home →"
- Update `CanvasWorkspace.tsx` (or its parent in Process tab) to render `NoActiveProjectGuidance` when `activeIP == null`. Canvas chrome (palette, zones, edit-mode shell) is NOT rendered in this state.
- Verify same guard already exists in Explore/Analyze/Improve verb tabs (per `feedback_active_ip_cascade_pattern`); if not, out-of-scope for E1.
- Failing tests:
  - Render Process tab with `activeIP == null` → `NoActiveProjectGuidance` visible, Canvas chrome absent
  - Render Process tab with `activeIP != null` → Canvas chrome visible, guidance absent
  - Click "Go to Home →" → navigation invoked
- Commit: `feat(wedge-v1): E1 task 6 — Process tab "No active project" empty state + Canvas guard`

#### Task 7 — End-to-end test: Home create → Process edit → fields persist

- Failing e2e test in `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` (new "E1 e2e" section) or `apps/azure/src/__tests__/e1-create-project-flow.test.tsx`:
  1. Render Home view; no active IP
  2. Click "New project" → modal opens
  3. Type Title `"Yield investigation"` + Issue Statement `"Reactor B yields 3% lower than Reactor A"` → Create
  4. Modal closes; new IP exists in store; `activeIP` resolves to new IP; navigated to Process tab
  5. Process tab renders CanvasWorkspace; palette + zones visible (no guidance state)
  6. Drag-and-drop process steps onto Process zone (mock the drop) → `activeIP.processSteps` populated
  7. Open StepTimingsModal, configure a paired-timing binding → Save → `activeIP.stepTimings` populated
  8. Re-render (simulate page reload via store re-hydration in test) → all canvas state present
  9. Verify final `activeIP` shape includes `title`, `issueStatement`, `processSteps`, `stepTimings`
- Commit: `feat(wedge-v1): E1 task 7 — e2e Home→Create→Process→edit→persist flow`

#### Task 8 — Final hygiene + master plan amendment + memory update

- Update `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` Phase E §E1 entry — replace original 5-7-day Charter modal scope with the amendment note pointing to this sub-plan (if not already landed pre-flight).
- Update `docs/decision-log.md` with the amendment entry from Task 1 if not already landed
- `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
- Commit: `chore(wedge-v1): E1 task 8 — master plan amendment + decision log + pre-merge hygiene`

---

## Verification (after all 8 tasks)

1. `pnpm --filter @variscout/core test` — extended IP type tests green; existing IP suite unchanged
2. `pnpm --filter @variscout/ui test` — CreateProjectModal + CanvasWorkspace + NoActiveProjectGuidance + e2e all green; no regressions on D1/D2/D3 surfaces
3. `pnpm --filter @variscout/stores test` — `upsertProject` accepts extended IP shape
4. `pnpm --filter @variscout/ui build` — clean (catches type drift per `feedback_ui_build_before_merge`)
5. `pnpm test` (turbo) — global suites green
6. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
7. **Spec self-check** (browser walks skipped per `feedback_wedge_v1_no_migration_no_backcompat`):
   - Home: "New project" button visible
   - Click button → modal opens with Title + Issue Statement fields
   - Title empty → Create disabled
   - Title filled → Create enabled; Save creates IP, sets active, navigates to Process tab
   - Process tab with active IP: Canvas renders normally
   - Process tab with no active IP: "No active project" guidance with "Go to Home →" CTA
   - Editing Canvas state (steps, timings, formulas, time-decomp) writes through to IP store
   - Reload page (simulated via store rehydration) → canvas state still present on the active IP
8. **Final branch review by Opus** (must STEP 0 `git checkout` per `feedback_code_review_subagent_must_checkout_pr_branch`) covering all 8 commits

## Out of scope (E1 as a whole)

Deferred to **Task #44 (Cross-tab IP-scoped entity presentation design session):**

- The original 5-entry-point Charter ceremony with InheritedContextBlock + entryPointAdapters
- Design question: "how should Findings, Hypotheses, and related entities be consistently surfaced across verb tabs when they auto-scope to the active IP"
- Whether `investigationLineage.{findingIds,hypothesisIds}` arrays remain meaningful given the auto-scoping model

Deferred to **F1 (→ Explore exit with Y soft-gate + smart routing):**

- Downstream wiring of `categoricalValuesByColumn` channel from D3
- Cross-tab routing when user transitions Process→Explore with active IP scoping

Deferred to **G1 (Probability plot inflection binning):**

- Binning workflow as another binding type on IP (if needed)

Deferred to **H1 (Empty states + system hints + polish):**

- Polish on `NoActiveProjectGuidance` copy + visual
- Empty states on other verb tabs not covered by E1
- Inline editing of `issueStatement` on the Project tab via the existing `CharterSections` component (if Project tab inline-edit isn't already wired)

Deferred to **Task #12 (ControlHandoff design session):**

- IP `status: 'closed'` transition semantics + closure ceremony

Deferred to **V2:**

- Members invite flow (Azure tenant-wide multi-user collaboration)
- Refined goal editor with structured outcome targets
- Multiple IPs per Hub UX (Project list view; today's experience is one-active-IP-at-a-time)
- Smart auto-suggest of Issue Statement from Findings/Hypotheses (CoScout-driven)

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-e-1-create-project/` — main session stays at repo root
- **Per task:** Sonnet implementer + Sonnet spec reviewer + Sonnet code-quality reviewer, with model overrides:
  - **Task 5 (CanvasWorkspace refactor):** Opus implementer (multi-file refactor; new store-backed contract replaces 4 useState; test-fixture cascade; multi-handler integration)
  - Tasks 1, 2, 3, 4, 6, 7, 8: Sonnet implementer
- **Reviewers:** Sonnet spec + Sonnet code-quality per task (no per-task Opus reviewer; Opus reserved for final branch pass)
- **Final branch review:** Opus on full diff (all 8 commits) before merge — must STEP 0 `git checkout` PR branch
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash`; preserves per-commit history per `feedback_preserve_commit_history`)
- **Subagent constraints forwarded to every dispatch:** NEVER `--no-verify`; NEVER add migration helpers / back-compat shims (`feedback_wedge_v1_no_migration_no_backcompat`); operate ONLY in assigned worktree, never cd to main repo (`feedback_subagent_worktree_discipline`); skip browser walks for wedge V1; do NOT rename preserved identifiers from CLAUDE.md (AnalysisMode, AnalysisBrief, AnalysisStats, AnalysisModeStrategy, AnalysisLensTab, DashboardTab union, ADR-074 timing concepts, ProcessStateLens, AIContext.investigation, Investigation Wall, investigation-report, docs/03-features/analysis/, Dashboard.tsx, ProjectMetadata.sustainment, panelsStore 'sustainment' key, CoScout AI prompts, investigationId FK fields)
- **After merge:** update `[[canvas-connection-journey]]` memory with E1 shipped outcomes; mark E1 task #33 completed; F1 (→ Explore exit) becomes the natural next critical-path item.

## Related

- Canvas Connection Journey spec — `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` (§4.4, §4.4.1, §3.6) — §4.4/§4.4.1 amended via this plan
- Canvas Connection Journey master plan — `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` (Phase E · E1)
- D1 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-1-step-timings.md`
- D2 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-2-calc-workflow.md`
- D3 sub-plan (precedent) — `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-3-time-as-factors.md`
- Memory: [[canvas-connection-journey]], [[wedge-v1]], [[active-ip-cascade-pattern]], [[findings-hypotheses-implementation-reality]], [[feedback_subagent_driven_default]], [[feedback_one_worktree_per_agent]], [[feedback_preserve_commit_history]], [[feedback_ui_build_before_merge]], [[feedback_wedge_v1_no_migration_no_backcompat]], [[feedback_subagent_no_verify]], [[feedback_code_review_subagent_must_checkout_pr_branch]], [[feedback_honor_vision_commitments]], [[feedback_active_ip_cascade_pattern]]
- Follow-up task #44 — Design session: cross-tab presentation of IP-scoped entities (the deferred half of spec §4.4.1)
