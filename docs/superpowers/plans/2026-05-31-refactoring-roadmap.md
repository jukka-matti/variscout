---
tier: ephemeral
purpose: build
title: 'Refactoring Roadmap — Ranked Opportunity Sequencer'
status: active
date: 2026-05-31
layer: spec
---

# Refactoring Roadmap — Ranked Opportunity Sequencer

> **For agentic workers:** This is a master sequencer, not a task-level implementation plan. For each slice, re-check `main`, use `superpowers:brainstorming` when a decision is still open, then write a dedicated `docs/superpowers/plans/YYYY-MM-DD-<slice>.md` via `superpowers:writing-plans`. Execute code slices in a dedicated worktree via `superpowers:subagent-driven-development`.

**Goal:** Reduce product-code and tooling risk through small, evidence-backed refactoring slices.

**Architecture:** Treat the refactor stream as ordered PR slices. Enforcement and boundary hygiene landed first; deterministic sample data followed as R2a/R2b, then shared workflow/state abstractions. High-risk store/persistence reshaping stays deferred until the relevant decisions are explicit.

**Tech Stack:** TypeScript monorepo, pnpm, Turbo, ESLint flat config, Vitest, Vite, Zustand, Dexie/IDB, `@variscout/{core,data,stores,hooks,charts,ui}`, `apps/{pwa,azure}`.

---

## Scope

This roadmap comes from the 2026-05-31 read-only refactoring evaluation using four explorer subagents:

- Core/data/stats boundaries
- Stores/hooks architecture
- UI/app workflow surfaces
- Tooling/package health

The roadmap is intentionally limited to product code and engineering tooling. Website copy, broad docs cleanup, and cosmetic component reshaping are out of scope unless they directly support a slice below.

## Execution Rules

- Re-check `origin/main` before each slice.
- Product-code changes use a dedicated worktree under `.worktrees/<branch>/`.
- Docs/tooling-only changes may go direct to `main` if they stay within repo workflow rules.
- Each slice gets its own detailed implementation plan at execution time.
- Use brainstorming before code when a slice has an unresolved architecture choice.
- Prefer subagent-driven development for implementation: one implementer per task, then spec and quality review.
- Keep PRs small; if a slice grows beyond roughly 6-8 tasks, split it.

## Ordered Slices

### R0 — Triage and Decision Lock

**Status:** Shipped with R1 in PR #264.

**Goal:** Decide the two architecture questions that affect later slices.

**Questions:**

- What is the actual package dependency graph now that `@variscout/stores`, `@variscout/data`, and `@variscout/charts` are real layers?
- Is `useAnalysisScopeStore` ratified as the 10th store / View x2, or should it be folded into `useViewStore`?

**Output:** Short decision note or ADR amendment before implementation if either choice changes an invariant.

**Effort:** S. **Risk:** low. **Timing:** now.

### R1 — Tooling and Boundary Hygiene

**Status:** Shipped in PR #264.

**Goal:** Make routine checks match repo reality before deeper refactors.

**Candidate changes:**

- Add `@variscout/stores` to ESLint boundary elements and encode the decided package graph.
- Add lint/typecheck/build coverage for source packages that currently have no package-level task.
- Expand Turbo inputs/global dependencies so root config, Vite/Vitest config, shared test setup, and app shell files invalidate cached results.
- Remove the tracked Vite timestamp artifact and add a hygiene check for tracked ignored generated files.
- Align PR-ready and release check profiles after build coverage is meaningful.

**Evidence anchors:** `AGENTS.md`, `eslint.config.js`, `turbo.json`, root/package `package.json` files, `scripts/pr-ready-check.sh`.

**Effort:** M. **Risk:** low-medium. **Timing:** now.

### R2 — Deterministic Sample Data

**Status:** R2a shipped via PR #266. R2b shipped via PR #267 using the [static computed fixture slice](2026-05-31-r2b-static-computed-fixtures.md).

**Goal:** Restore `@variscout/data` to a deterministic data-only package.

**Candidate changes:**

- Replace runtime `Math.random()` / `Date.now()` sample generation with static fixtures or seeded generation. **Done in R2a.**
- Move reusable runtime computation out of `@variscout/data` and into build-time static fixture generation. **Done in R2b.**
- Reuse core/chart types where sample DTOs currently duplicate domain types.

**Evidence anchors:** `packages/data/CLAUDE.md`, `packages/data/src/computed/index.ts`, `packages/data/src/types.ts`, sample files under `packages/data/src/samples/`.

**Effort:** M. **Risk:** medium. **Timing:** now.

### R3 — Store Invariants and Boundary Tests

**Status:** Mostly shipped through PR #264 and follow-up alignment on `main`: the 10-store / View x2 decision is reflected in `AGENTS.md`, ADR-078, `packages/stores/CLAUDE.md`, and dynamic store discovery. The remaining direct `setState` guard needs a sharper rule before enforcement.

**Goal:** Make store-layer truth explicit and mechanically guarded.

**Candidate changes:**

- Resolve the 9-store vs 10-store mismatch across `AGENTS.md`, ADR-078, store glossary, and `packages/stores/CLAUDE.md`.
- Convert `packages/stores/src/__tests__/layerBoundary.test.ts` from a hard-coded filename list to dynamic store-file discovery.
- Add focused guards for direct `setState` mutations where hooks should call named store actions.

**Decision gate:** R0 must decide whether `analysisScopeStore` remains separate.

**Effort:** S-M. **Risk:** low-medium. **Timing:** soon.

### R4 — Shared Workflow Navigation and Active-IP Derivation

**Status:** Shipped in PR #268, including canonical shared workflow-nav test IDs.

**Goal:** Reduce drift in the V1 7-tab workflow and Project-scoped active-IP cascade.

**Candidate changes:**

- Introduce shared `workflowTabs` configuration and a props-based `WorkflowNav` surface in `@variscout/ui`.
- Move duplicated `useActiveIPContext` logic into `@variscout/hooks` with `userId` as an option.
- Extract active-IP scope/presentation derivation shared by PWA and Azure shells.

**Evidence anchors:** `apps/pwa/src/components/layout/AppHeader.tsx`, `apps/azure/src/components/AppHeader.tsx`, `apps/*/src/hooks/useActiveIPContext.ts`, `apps/pwa/src/App.tsx`, `apps/azure/src/pages/Editor.tsx`.

**Effort:** M. **Risk:** medium. **Timing:** soon.

### R5 — App Duplication With Thin Adapters

**Goal:** Remove low-risk PWA/Azure duplication without forcing a shell rewrite.

**Candidate changes:**

- Extract identical app feature stores or store factories for analyze/findings.
- Share data-ingestion action-bag construction while keeping app-specific persistence adapters.
- Normalize Improve-tab action-item creation so PWA and Azure stamp the same required fields.
- Consider shared Project/Control lifecycle view-models behind repository adapters after smaller extractions land.

**Effort:** M. **Risk:** medium. **Timing:** after R4.

### R6 — Document Snapshot and Export Fidelity

**Goal:** Make export/import snapshots match the current Document-store model.

**Candidate changes:**

- Introduce a canonical `buildDocumentSnapshot()` / `hydrateDocumentSnapshot()` path.
- Include all current Document stores or explicitly rename the current export surface as a legacy analysis-state export.
- Add round-trip tests for `.vrs` export/import once the snapshot boundary is settled.

**Decision gate:** R3 should land first so the store model is not moving.

**Effort:** L. **Risk:** high. **Timing:** after R3.

### R7 — High-Risk Store and Transport Separation

**Goal:** Split mixed persistence/view/transport concerns only after the lower-risk slices reduce drift.

**Candidate changes:**

- Split `canvasViewportStore` persisted viewport state from transient selection/cluster/undo/offline-queue state.
- Move `analyzeStore` API and queue side effects into hooks or app services while keeping document-store mutations pure.
- Move remaining deterministic chart math into `@variscout/core/stats` where it is a reusable statistical transform.

**Decision gate:** Needs brainstorming and a dedicated design/spec before code.

**Effort:** L. **Risk:** high. **Timing:** later.

## Do Not Refactor Yet

- Do not big-bang split `apps/pwa/src/App.tsx` or `apps/azure/src/pages/Editor.tsx`; extract shared workflow and active-IP pieces first.
- Do not unify full ReportView surfaces now; PWA and Azure report views have different orchestration shapes.
- Do not delete the `@variscout/core` root barrel. Migrate consumers to subpath imports opportunistically.
- Do not force the repo back into the simple `core -> hooks -> ui -> apps` chain without first deciding where `stores`, `data`, and `charts` belong.
- Do not rewrite the local ESLint plugin just because it is local; coverage and boundary modeling are the first fixes.
- Do not treat stale website pricing/copy as part of this refactor stream.

## Next Recommended Execution

After R4, continue with a focused **R5 thin-adapter slice** rather than opening the higher-risk R6/R7 store and snapshot work:

1. Re-check PWA/Azure duplication around analyze/findings feature-store wiring and data-ingestion action-bag construction.
2. Pick one narrow seam with identical behavior in both apps; keep persistence adapters and app shells app-owned.
3. Write a dedicated R5 implementation plan before code, with explicit non-goals for full shell unification and ReportView merging.
4. Run targeted app tests plus `bash scripts/pr-ready-check.sh`.
