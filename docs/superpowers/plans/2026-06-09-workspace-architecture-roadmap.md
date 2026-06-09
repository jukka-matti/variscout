---
tier: ephemeral
purpose: build
title: 'Workspace Architecture Roadmap'
status: active
date: 2026-06-09
layer: spec
related:
  - 2026-06-09-workspace-architecture-and-project-formalization-design
  - 2026-06-09-holistic-architecture-evaluation
  - 2026-06-01-post-phase-6-refactoring-evaluation
  - adr-082-wedge-architecture
---

# Workspace Architecture Roadmap

> **For agentic workers:** This is a roadmap, not a product-code implementation plan. Promote one slice at a time into its own plan and worktree before changing code.

## Summary

This roadmap sequences the move to the [Workspace architecture spec](../specs/2026-06-09-workspace-architecture-and-project-formalization-design.md):

```text
Workspace -> soft-formalized Project -> current Analysis Scope
```

The accepted model is always backed by one active Project; "optional Project" language in earlier drafts is superseded by the soft-formalization rule. The roadmap is docs-first because the high-value simplification is conceptual before it is mechanical. The target is not a broad file split. The target is a cleaner product model that lets later refactors remove Active IP, simplify shells, and make CoScout operate over stable context.

## Slice Sequence

| Slice | Goal                          | Outputs                                                                                                                                                                       | Verification                                                                                                                     |
| ----: | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
|     1 | Product Model Lock            | Update canonical product docs so Workspace, soft-formalized Project, Analysis Scope, and internal `ProcessHub` are unambiguous.                                               | `pnpm docs:check:frontmatter`, `pnpm docs:check`, `git diff --check`.                                                            |
|     2 | User-Facing Vocabulary Pass   | Replace visible Hub/IP/Active IP language with Workspace/Project/Analysis Scope language in docs and UI copy, without persistence renames.                                    | Docs checks, i18n checks, targeted UI copy tests where present.                                                                  |
|     3 | Behavior Simplification       | Remove Exit IP, active-IP scoped/free-roaming modes, auto-activation, and per-user active project selection. Project surfaces read the Workspace's attached Project directly. | `useActiveIPContext` tests, `activeIPStore` tests, shell tests, CanvasWorkspace tests, Report tests, membership ACL tests.       |
|     4 | Workspace View Model Boundary | Introduce a shared Workspace view model over current `ProcessHub` plus its attached `ImprovementProject`. App shells consume Workspace concepts.                              | Focused view-model unit tests, Azure `Editor.test.tsx`, PWA `App.test.tsx`, panel routing tests.                                 |
|     5 | Analysis Scope Strengthening  | Clarify and harden `useAnalysisScopeStore` as outcome + factor + step + filters. Ensure Explore, Process, Analyze, Report, and CoScout consume it consistently.               | `analysisScopeStore` tests, ScopeChrome tests, Canvas chip navigation tests, Explore scope tests, Process/Analyze handoff tests. |
|     6 | Shell Refactor                | Extract shared route/view-model logic from Azure `Editor.tsx` and PWA `App.tsx` around Workspace, Project presence, Analysis Scope, and app-owned capability adapters.        | Azure/PWA shell tests, mobile routing tests, panel store tests, app capability adapter tests.                                    |
|     7 | Dead Residue Cleanup          | Delete Active IP store/hooks/UI and compatibility branches only after all live reads are migrated.                                                                            | Static zero-consumer proof plus owning tests.                                                                                    |
|     8 | Optional Internal Rename      | Consider renaming `ProcessHub` internals only after public vocabulary and behavior are stable.                                                                                | Separate high-blast-radius plan, migration tests, persistence/snapshot/export/import tests.                                      |
|     9 | CoScout Autonomy Design       | Redesign CoScout context around Workspace, Project role/ACL/formalization, and current Analysis Scope.                                                                        | Responses API tests, tool registry tests, action proposal tests, prompt/eval fixtures, role/ACL tests.                           |

## Slice Details

### 1. Product Model Lock

Decision: Workspace is the V1 product object; every Workspace is backed by one active Project; Project chrome is soft-formalized by deliberate action; Analysis Scope is the only active analytical lens; `ProcessHub` is internal storage vocabulary.

Do:

- Update product docs and journey docs to match the model.
- Cross-link ADR-082, the Workspace spec, and this roadmap.
- Mark multi-project Hub portfolios as VariScout Process named-future, not V1.

Do not:

- Rename product code.
- Change storage keys.
- Delete Active IP behavior.

### 2. User-Facing Vocabulary Pass

Goal: users should see Workspace, Project, and Analysis Scope. They should not need to understand Hub, IP, Active IP, or Project Focus.

Scope:

- Docs and UI copy first.
- i18n keys and visible labels only where behavior stays unchanged.
- Keep type names and persistence keys untouched.

Exit criteria:

- No user-facing V1 doc presents Hub/IP as the product model.
- Remaining Hub/IP terms are internal architecture references or historical ADR context.

### 3. Behavior Simplification

Goal: remove the behavior that made Active IP feel necessary.

Target removals:

- Explicit Exit IP.
- One-IP auto-activation as a user-visible behavior.
- Active IP scoped/free-roaming modes.
- Per-user active project selection for a single Workspace.

Replacement behavior:

- A Workspace has one attached active Project from first data entry.
- Project tab, Improve, Report, and ACL checks read that attached Project directly.
- Analytical narrowing reads Analysis Scope.

Required proof:

- Membership ACL still protects Sponsor/Member/Lead behavior.
- Wall planning ownership still resolves.
- Analyze, Report, Control, and mobile navigation still work.
- Quick analysis without a Project still works.

### 4. Workspace View Model Boundary

Goal: isolate the current storage shape from the product shape.

Shape:

```ts
type WorkspaceViewModel = {
  workspaceId: string;
  title: string;
  project: ProjectSummary;
  hasFormalProject: boolean;
  analysisScope: AnalysisScopeSummary;
  capabilities: WorkspaceCapabilities;
};
```

This shape is illustrative, not pre-approved code. The implementation plan should derive the exact type from current consumers.

Boundary rules:

- The view model may read `ProcessHub` and `ImprovementProject`.
- It must not own Azure save semantics or PWA export semantics.
- It must not create a shared app mega-shell.

### 5. Analysis Scope Strengthening

Goal: Analysis Scope becomes the single place for "what are we looking at right now?"

Scope fields:

- Outcome or measure.
- Factor.
- Process step.
- Categorical filters.

Consumers:

- Explore charts and scope chrome.
- Process chip navigation and canvas highlights.
- Analyze Wall scope switching.
- Report narrative context.
- CoScout prompt/tool context.

Guardrail: Analysis Scope stays View-layer state. It should not become document identity, project membership, or ACL state.

### 6. Shell Refactor

Goal: split shell logic by stable boundaries after Product Model, behavior, and Analysis Scope are stable.

Shared candidates:

- Workspace route/view derivations.
- Project presence labels and empty states.
- Analysis Scope labels and chrome visibility.
- Wall-first mode and mobile tab state.

App-owned capabilities:

- Azure: EasyAuth, durable Save/Save As, ETag conflicts, cloud sync, Teams/share, AI/CoScout, server access checks.
- PWA: session-only default, `.vrs` export/import, embed mode, offline banner, local identity assumptions.

Guardrail: do not build a shared shell component that absorbs app capability policy.

### 7. Dead Residue Cleanup

Deletion candidates:

- `useActiveIPContext` and `useActiveIPStore` after all live consumers migrate.
- Exit IP branches and explicit clear state.
- Compatibility re-exports with zero consumers.
- Stale docs/comments that describe Hub/IP as current V1 product vocabulary.

Deletion rule:

- Static search must prove zero live consumers.
- Owning tests must pass.
- Test-only fixtures may remain if they document migrations or regression cases.

### 8. Optional Internal Rename

Renaming `ProcessHub` internals is optional and high blast radius. It touches persistence, snapshots, exports/imports, repository APIs, test fixtures, and docs. Do it only after public vocabulary and behavior are stable.

Possible outcomes:

- Leave `ProcessHub` internal forever.
- Rename only view-model/domain-facing surfaces.
- Full storage rename with migrations.

### 9. CoScout Autonomy Design

Goal: align CoScout with the new product model before increasing autonomy.

Inputs:

- Workspace context.
- Optional Project role/ACL context.
- Current Analysis Scope.
- Deterministic stats outputs.

Tool classes:

- Read tools.
- Proposal/action tools.
- Navigation tools.
- Team/collaboration tools.
- Retrieval tools.
- Future autonomous workflow tools.

Default runtime:

- Keep Responses API plus app-owned orchestration unless evals prove that tool execution, approvals, durable state, or autonomous workflow need an agent runtime boundary.

## Promotion Rules

Each slice promoted to code work needs its own implementation plan with:

- Exact files and tests.
- Migration and compatibility strategy.
- Browser or visual verification where UI changes are visible.
- Azure/PWA capability guardrails.
- Static proof before dead-code deletion.

Docs-only slices may land directly. Product-code slices should use a dedicated worktree and the repo PR workflow.

## Verification Baseline

- Product model docs: `pnpm docs:check:frontmatter`, `pnpm docs:check`, `git diff --check`.
- Active IP retirement: `useActiveIPContext`, `activeIPStore`, shell tests, CanvasWorkspace tests, Report tests, membership ACL tests.
- Analysis Scope: `analysisScopeStore`, ScopeChrome, Canvas chip navigation, Explore chart scope, Process/Analyze handoff tests.
- Workspace view model: focused unit tests for derivation from current `ProcessHub` plus optional `ImprovementProject`.
- Shell extraction: Azure `Editor.test.tsx`, PWA `App.test.tsx`, panel routing tests, mobile routing tests.
- CoScout: Responses API, tool registry, action proposal, prompt context, role/ACL, and eval fixture tests.
