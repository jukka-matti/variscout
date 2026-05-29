---
tier: ephemeral
purpose: build
title: 'IM-0a — Project ↔ Hub 1:1 collapse (sub-plan)'
status: draft
date: 2026-05-29
layer: spec
---

# IM-0a — Project ↔ Hub 1:1 collapse

> **For agentic workers:** Sub-plan for IM-0a of the [investigation-surface master plan](2026-05-29-investigation-surface-master-plan.md). Execute as **ONE atomic implementer dispatch** with internal **Architect → Migration → Validator** phases (`feedback_atomic_sweep_one_dispatch`) — this is a tsc-driven type cascade, not a splittable feature. Branch `worktree-im-0a-project-hub-1to1`.

**Goal:** Enforce the decided **one Project = one Hub (1:1)** model (decision-log 2026-05-18); retire the legacy 1:many machinery; re-key the project store by `ProjectId`. Keep `ProcessHub` and `ImprovementProject` as two entities at a clean 1:1 (SRP — spec §1).

**Wedge stance:** no users → no data migration. IDB version bump only, no `migrateX()`.

---

## The 1:1 model (the design call this PR locks)

1. **`ProcessHub.improvementProjects?: ImprovementProject[]` → `improvementProject?: ImprovementProject`** (singular) — `packages/core/src/processHub.ts:154`. A Hub has at most one IP.
2. **Store re-key by `ProjectId`** — `packages/stores/src/improvementProjectStore.ts`: `projectsByHub: Record<ProcessHub['id'], ImprovementProject[]>` → `projectsById: Record<ImprovementProject['id'], ImprovementProject>`. Each IP already carries `hubId` (`improvementProject/types.ts:124`), so the hub→project lookup is derived:
   - `getProjectForHub(hubId)` → `Object.values(projectsById).find(p => p.hubId === hubId && p.deletedAt === null)` (≤1 by the 1:1 invariant)
   - `setProjectForHub(hubId, project)` → upsert the single project by `project.id`
   - `upsertProject(project)` (by `id`), `removeProject(projectId)` (by `id`)
   - existing `getProjectsForHub`/`setProjectsForHub` array helpers are removed; consumers move to the singular helpers.
3. **Dexie `improvementProjects` table stays** (storage keyed by IP `id`, `hubId` index) — the 1:1 is a _logical_ invariant, not a schema change. Hydration `.where('hubId').equals(hub.id)` returns ≤1 → set `hub.improvementProject = liveIps[0] ?? undefined` (was `improvementProjects: liveIps`). **Bump both apps' IDB version (no `migrateX`).**
4. **`survey` context** (`survey/control.ts:49`, `survey/types.ts:194`) — `improvementProjects?: ImprovementProject[]` → `improvementProject?: ImprovementProject` on the survey ctx; the `?? []` iteration becomes a null-check.

---

## Phases (one dispatch)

### Architect

- Read root `CLAUDE.md`, `packages/stores/CLAUDE.md`, `packages/core/CLAUDE.md`, spec §1/§8, this sub-plan.
- Confirm the model above against current code; write `improvementProject` singular type + the re-keyed store first (TDD: store test in `packages/stores/src/__tests__/improvementProjectStore.test.ts` asserting `getProjectForHub` returns the single live project + `upsertProject`/`removeProject` by id).

### Migration (per-category commits)

- **core**: `processHub.ts` field → singular; `report/ipReport.ts:336` (`liveProjects(hub.improvementProjects)` → singular-aware: `hub.improvementProject && hub.improvementProject.deletedAt === null ? [hub.improvementProject] : []`); `survey/control.ts:49` + `survey/types.ts:194`. Commit `refactor(core): ProcessHub.improvementProject 1:1 (IM-0a)`.
- **stores**: re-key `improvementProjectStore` + `useProjectMembershipStore.ts:124` (`Object.values(projectsByHub).flat()` → `Object.values(projectsById)`). Commit `refactor(stores): re-key improvementProjectStore by ProjectId (IM-0a)`.
- **azure app**: `persistence/AzureHubRepository.ts` (decompose: `improvementProjects` → singular on hydrate at :369, write path :61-69 still writes the one IP to the table), `persistence/applyAction.ts` (IP table writes — unchanged logic, the table stays), `db/schema.ts` (IDB **version bump**), then UI consumers: `ProjectsTabView.tsx`, `charter/ImprovementProjectPanel.tsx`, `control/ControlPanel.tsx`, `ProcessHubReviewPanel.tsx`, `editor/FrameView.tsx`, `pages/Editor.tsx:1824,1878`, `hooks/useActiveIPContext.ts:16`. Commit `refactor(azure): consume 1:1 improvementProject (IM-0a)`.
- **pwa app**: `App.tsx:1246,1256,1260`, `components/ControlPanel.tsx:29`, PWA persistence + `db/schema.ts` (IDB **version bump**). Commit `refactor(pwa): consume 1:1 improvementProject (IM-0a)`.

### Validator

- `pnpm --filter @variscout/core --filter @variscout/stores build` (tsc clean) + targeted vitest for the touched packages (scope each run < 90 s — `feedback_implementer_long_bash_pitfall`).
- Do NOT run the full turbo sweep or `pr-ready-check` (controller does that). Do NOT use `--no-verify`.
- Report: per-category commit SHAs + `git show --stat` summary + any consumer that needed judgment.

---

## Acceptance

- `ProcessHub.improvementProject?` is singular; no `improvementProjects[]` array field survives.
- `improvementProjectStore` keyed by `ProjectId`; no `projectsByHub` / `getProjectsForHub` / `setProjectsForHub` array API survives.
- Both apps' IDB version bumped (no `migrateX`).
- `pnpm build` (core + stores at minimum) tsc-clean; touched-package vitest green.
- Per-step capability + ADR-073 untouched (this PR is pure cardinality plumbing — no stats).

## Out of scope (later PRs)

- The rich `ProcessMap` reconciliation (IM-0b). Step-id scheme. `processLocation`. (IM-0a only collapses Hub↔IP cardinality.)
- Any `Question` / canvas / contribution work.
