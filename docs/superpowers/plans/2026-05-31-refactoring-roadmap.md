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

### R5 — Thin App-Feature Factories

**Status:** R5a thin app-feature factories shipped in PR #270. R5b data-ingestion action-bag extraction shipped in PR #272. R5c action-item builder normalization shipped in PR #271. R5d ControlPanel lifecycle hook extraction shipped in PR #273. R5e Improvement Project panel lifecycle hook extraction shipped in PR #274.

**Goal:** Remove low-risk PWA/Azure duplication without forcing a shell rewrite.

**Candidate changes:**

- Extract byte-identical Analyze and Findings feature-store construction into shared factory helpers while keeping app-owned singleton wrappers under `apps/*/src/features/`. **Done in R5a.**
- Expose those helpers through a narrow subpath such as `@variscout/stores/feature-factories`; do not export app-feature factories from the root `@variscout/stores` barrel. **Done in R5a.**
- Share data-ingestion action-bag construction in a follow-up slice, with app-specific limits and persistence adapters still app-owned. **Done in R5b.**
- Normalize Improve-tab action-item creation/default stamping in a separate follow-up slice while keeping app dispatch/persistence wrappers app-owned. **Done in R5c.**
- Extract duplicated ControlPanel lifecycle state behind repository adapters while keeping PWA/Azure repositories and panel wrappers app-owned. **Done in R5d.**
- Extract duplicated Improvement Project panel lifecycle state behind repository adapters while keeping PWA/Azure repositories and panel rendering app-owned. **Done in R5e.**
- Recalibrate after R5e before opening higher-risk store or snapshot work. **Done: next slice is R6a.**

**R5 recalibration (2026-05-31):** Current `origin/main` shows the PWA/Azure Analyze and Findings store files are byte-identical, but the surrounding orchestration is meaningfully app-specific. Azure has share/popout/navigation/AI and inline What-If behavior; PWA keeps simpler local wiring. Treat the purposeful delta as adapters/capability policy, and the accidental delta as duplicated small store factories and repeated action wiring.

**Explicit non-goals:**

- Do not add new global singleton stores to `@variscout/stores`; preserve the 10-store invariant.
- Do not move app-local UI state out of `apps/*/src/features/`.
- Do not unify Analyze/Findings orchestration hooks in the first R5 PR.
- Do not merge ReportView surfaces, rewrite app shells, or redesign persistence/export snapshots in R5.

**Effort:** M. **Risk:** medium. **Timing:** after R4.

### R6 — Document Persistence Boundary

**Status:** R6a hub-scoped Document Snapshot runtime boundary shipped in PR #275. R6b additive `.vrs` wiring shipped in PR #276. R6c snapshot-only, access-aware document persistence shipped in PR #277. R6d Save Semantics shipped in PR #279 and settled the product contract plus active-doc stale-reference audit. R6e is the current Azure access-enforcement slice; R6f remains a later docs/examples/fixtures audit.

**Goal:** Make every portable save/export/import path speak one hub-scoped `DocumentSnapshot` model before deeper store, app-shell, or platform hardening work.

**Candidate changes:**

- Introduce a canonical `buildDocumentSnapshot()` / `hydrateDocumentSnapshot()` path. **Done in R6a.**
- Replace the stale flat type-only `DocumentSnapshot` with a namespaced runtime envelope covering Project config/data, Analyze state, Canvas document state, and zero-or-one `ImprovementProject` for the active hub. **Done in R6a.**
- Treat snapshots as hub-scoped: quick-analysis hubs may have no Project; formalized hubs have one Project; snapshots carry at most that hub's live Project and never serialize the multi-hub `projectsById` mirror. **Done in R6a.**
- Wire PWA/Azure `.vrs` export/import through the settled snapshot boundary. **Done in R6b.**
- Add round-trip tests for `.vrs` export/import once the snapshot boundary is settled. **Done in R6b.**
- Cut over `.vrs` and Azure local/cloud project persistence to snapshot-only documents, with no old hub/rawData or loose analysis payload import branches. **Done in R6c.**
- Make Azure saved documents access-aware: formal Projects are visible/loadable only to their Lead/Member/Sponsor roster, while quick analyses without a Project are private to the creator. **Done in R6c.**
- Use blob ETags/`If-Match` for Azure document writes and save a conflict copy or surface the existing conflict path when the cloud document changed. **Done in R6c.**
- Define product save semantics across PWA and Azure: Save, Save As, Export `.vrs`, imported-document identity, dirty state, and conflict UX. **Done in R6d.**
- Harden Azure access enforcement at the same-origin server API / storage boundary so R6c's access metadata is enforced before any Azure Blob list/read/write operation. Replace broad browser container SAS guidance with server-enforced APIs backed by managed identity. **Current R6e slice.**
- Audit persistence docs, examples, and fixtures for stale `AnalysisState`, Hub-of-one, old `.vrs`, and last-write-wins assumptions. **R6f candidate.**

**R6a decision note (2026-05-31):** `ImprovementProject.status` is persisted domain state (`draft | active | closed`), not a derived label. The uncertainty is stage vocabulary/granularity, not whether Project lifecycle state belongs in a portable document. `useImprovementProjectStore.projectsById` is Document-layer state but is a multi-hub in-memory mirror; the portable snapshot boundary is one hub document with zero-or-one live Project.

**R6b decision note (2026-06-01, superseded by R6c):** R6b shipped additive `.vrs` snapshot support while preserving legacy `hub`/`rawData` and Azure `AnalysisState` paths. R6c intentionally removes those compatibility paths before launch, so this note is historical context rather than current guidance.

**R6c decision note (2026-06-01):** Because the app has not launched, snapshot persistence made a clean break. `.vrs` is now a snapshot-only document envelope (`kind: "variscout.document"`, `version: 1`, `documentSnapshot`), and Azure local/cloud project records store snapshot payloads. The access model follows the latest V1 ownership decision: quick-analysis documents are private to the creator/current user; formal Projects derive access from `improvementProject.metadata.members` and only owner/member/sponsor roster users should see/load them.

**R6d decision note (2026-06-01):** Save identity is product-specific. PWA is export-only: it has no browser Save/Save-to-Browser document identity, no local saved-document list, and no reload-from-browser promise. Export `.vrs` is backup/share only. Importing a `.vrs` file starts a new unsaved in-memory session from the snapshot; the file path/name is not retained as an active save target. Azure owns durable document identity: Save updates the active Azure document, Save As forks to a new document identity, and importing `.vrs` starts an unsaved/forkable document that only becomes durable after Save As or first Azure Save. Dirty state is based on a canonical `DocumentSnapshot` fingerprint compared with the active saved baseline, not ad hoc UI flags. Azure cloud conflicts never silently overwrite: if ETag/`If-Match` detects a newer cloud document, the user keeps their local work as a conflict copy or is routed through the existing conflict path before choosing what to keep.

**R6e decision note (2026-06-01):** The storage boundary hardening target is server-enforced access for the already-modeled R6c document access set, not a new collaboration model. Active docs should describe same-origin server APIs backed by App Service managed identity. Broad browser container SAS is not the V1 production guidance. After R6e, production storage accounts should disable Shared Key access where supported, or at minimum enforce an Azure Policy / audit path toward disabling it; storage account connection strings remain local-dev/test-only.

**R6f decision gate:** Broaden the audit to examples, fixtures, archived plans, generated aggregate docs, and code comments after R6e settles enough terminology to avoid churn. R6d only corrected active guidance in the owned docs surface.

**Effort:** L. **Risk:** high. **Timing:** after R3.

### R7 — Store and Domain Model Cleanup (Decision-Gated Horizon)

**Goal:** Clean up domain vocabulary and store shapes only after the persistence boundary and save semantics are stable.

**Horizon candidates:**

- Reconcile Project/IP naming in code and docs now that each hub carries zero-or-one formal `ImprovementProject`.
- Revisit `useImprovementProjectStore.projectsById`: it remains a multi-hub in-memory mirror, but the public shape may deserve a clearer hub-keyed API.
- Separate remaining store side effects from document mutations where persistence or service work still leaks into store actions.
- Re-check Annotation/View boundaries after R6; do not add Annotation/View state to portable `.vrs` by default.

**Decision gate:** Needs brainstorming and a dedicated design/spec before code. Do not treat this as a direct continuation of R6.

**Effort:** L. **Risk:** high. **Timing:** later.

### R8 — App Shell and Surface Convergence (Decision-Gated Horizon)

**Goal:** Reduce remaining PWA/Azure wrapper duplication only where the R5 thin-adapter work proves the app-specific delta is accidental rather than capability policy.

**Horizon candidates:**

- Re-evaluate app shell seams after Save/Load and access semantics settle.
- Revisit ReportView convergence with current PWA/Azure orchestration evidence.
- Consider shared wrapper bases only for surfaces with stable repository/capability boundaries; avoid forcing a shared shell around intentional Azure-only behavior.

**Decision gate:** Use the post-Phase-6 evaluation below as the starting evidence, then run slice-specific brainstorming before touching app-shell code. Report and shell convergence should not start from memory.

**Effort:** L. **Risk:** high. **Timing:** later.

### R9 — Launch and Platform Hardening (Decision-Gated Horizon)

**Goal:** Turn the stabilized architecture into launch-ready operational, security, compliance, and deployment guidance.

**Horizon candidates:**

- Azure operational/security guidance: storage-account soft delete/versioning, scoped SAS, RBAC assumptions, ETag/concurrency expectations, and incident recovery.
- Compliance and customer-owned-data documentation aligned with ADR-059 and the single-SKU Azure tenant model.
- Broader persistence/access assurance: cross-device tests, conflict tests, access-denial tests, backup/export tests, and launch runbooks.

**Decision gate:** Start only after R6d/R6e settle the save/access contract; otherwise platform docs risk encoding interim behavior.

**Effort:** L. **Risk:** medium-high. **Timing:** pre-launch hardening.

## Post-Phase-6 Evaluation — 2026-06-01

The standalone evaluation plan lives at [2026-06-01-post-phase-6-refactoring-evaluation.md](2026-06-01-post-phase-6-refactoring-evaluation.md). It separates current Phase 6 closeout from future refactoring work:

- **R6e/R6f** remain the active Phase 6 closeout candidates.
- **Eval-A through Eval-E** are neutral post-Phase-6 evaluation labels, not approved implementation slices.
- **R7/R8/R9** remain later decision-gated horizons unless the evaluation promotes a specific part into immediate work.

Use that plan to run read-only explorer lanes and produce a ranked recommendation table before writing any new implementation plan.

## Do Not Refactor Yet

- Do not big-bang split `apps/pwa/src/App.tsx` or `apps/azure/src/pages/Editor.tsx`; first design document/capability boundary hooks with explicit Save/Export workflow tests.
- Do not unify full ReportView surfaces now; PWA and Azure report views have different orchestration shapes.
- Do not delete the `@variscout/core` root barrel. Migrate consumers to subpath imports opportunistically.
- Do not force the repo back into the simple `core -> hooks -> ui -> apps` chain without first deciding where `stores`, `data`, and `charts` belong.
- Do not rewrite the local ESLint plugin just because it is local; coverage and boundary modeling are the first fixes.
- Do not treat stale website pricing/copy as part of this refactor stream.

## Next Recommended Execution

Close Phase 6 with R6e/R6f decisions first: either harden Azure access beyond client filters or explicitly record the remaining launch blocker, then sweep stale persistence docs/comments/fixtures. After that, run the standalone post-Phase-6 evaluation plan. If Eval-A is verified as safe cleanup, write a dedicated implementation plan before changing code; use brainstorming before any Eval-B/Eval-C/Eval-D work because those contain product or architecture choices. Keep R7/R8/R9 as later decision-gated horizons unless the evaluation promotes a specific part of those horizons into immediate work.
