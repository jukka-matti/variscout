---
tier: ephemeral
purpose: build
title: 'Wedge V1 Implementation Plan — Master Sequencer'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/superpowers/specs/2026-05-14-projects-tab-design.md
---

# Wedge V1 Implementation Plan — Master Sequencer

> **For agentic workers:** REQUIRED SUB-SKILL — Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan. Each PR below should be expanded into its own **bite-sized sub-plan** via a follow-up `superpowers:writing-plans` invocation before execution begins.

> ⚠️ **AMENDED 2026-05-16** — see [`docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`](../specs/2026-05-16-improve-tab-amendment-design.md). The nav is **7 tabs** (`Home · Project · Process · Analyze · Investigation · Improve · Report`), not 6. **Improve stays as a top-level verb tab**, NOT a stage. **Projects → Project** (singular). Project detail has **3 stages** (`Charter · Approach · Sustainment`), not 4. Every reference below to "6-tab nav", "Improve as a stage", or "Projects (plural)" is superseded by the amendment.

**Goal:** Migrate the VariScout codebase from the current Hub-centric, 4-persona, 2-tier architecture to the V1 wedge anatomy: **7-tab workflow nav (per amendment)**, Improve as a **top-level verb tab (per amendment)**, project-membership ACLs (Lead / Member / Sponsor), MeasurementPlan entity on the Investigation Wall, persona-routing deletion, canvas response paths reduced to 3, tier-gating retirement, single €99 SKU.

**Architecture:** Six engineering PRs in sequence with light parallelism. Foundation PR (data model + membership) lands first so downstream PRs can depend on it. Improve workspace migration is the largest single PR. Tier-gating retirement is a wide sweep best done as its own focused PR.

**Tech Stack:** TypeScript + Vite + React 18 + Zustand + Dexie (IndexedDB) + Vitest + Playwright + Azure Blob Storage. Architecture rules per ADR-073 (no statistical roll-up across heterogeneous units), ADR-074 (SCOUT level-spanning boundary), ADR-078 (PWA/Azure architecture alignment), ADR-081 (canvas viewport).

**Canonical spec:** [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../../07-decisions/adr-082-wedge-architecture.md).

---

## Scope check — this is a master sequencer, not a bite-sized plan

The wedge spec covers **multiple independent subsystems** (project membership, Improve workspace migration, Measurement Plans, response-path reduction, persona deletion, tier-gating sweep, Marketplace SKU). Trying to write all of them as bite-sized 2-5-minute steps in one document would produce a 5000+ line plan nobody can navigate.

So this plan operates at **PR-level granularity**. Each of the 6 PRs below has:

- A scope summary
- A file structure list (created + modified)
- A task list at task-level granularity (each task is roughly half a day of work)
- Dependencies on prior PRs
- Verification approach
- A "next step" pointer: dispatch `superpowers:writing-plans` again on that PR's scope to produce its bite-sized sub-plan.

**When you're ready to execute a specific PR:** invoke `superpowers:writing-plans` again with that PR's scope as input. The resulting sub-plan will have the 2-5-minute step granularity required for `subagent-driven-development`.

---

## Preconditions (cleared before this plan executes)

Per wedge spec §8 — these are all confirmed cleared (user confirmation 2026-05-16):

1. **Migration math** — financial sensitivity on €79→€99 + €199→€99 modeled, grandfathering window chosen.
2. **Azure AD invitation constraint** — accepted as feature; cross-org collaboration out of V1 ICP.
3. **Customer validation conversation** — wedge pitched to a real specialist; confirmed direction.

---

## PR sequence + dependency graph

```
PR-WV1-1 ─── Project membership foundation
    │
    ├─ PR-WV1-2 ─── Improve workspace migration (stage rename + Handoff fold-in)
    │       │
    │       └─ PR-WV1-5 ─── Tier-gating retirement + nav reorder
    │
    ├─ PR-WV1-3 ─── Investigation Wall + Measurement Plans
    │
    └─ PR-WV1-4 ─── Canvas response paths (5→3) + persona-routing deletion

PR-WV1-6 ─── Azure Marketplace SKU + customer migration  (downstream of PR-WV1-5)
```

Three parallel branches off PR-WV1-1 (membership foundation): PR-WV1-2 (Improve), PR-WV1-3 (Wall), PR-WV1-4 (Canvas + persona). They converge before PR-WV1-5 (sweep) and PR-WV1-6 (Marketplace).

Estimated total: **3–4 weeks** with subagent-driven execution (Sonnet workhorses, Opus for final-branch review only).

---

## PR-WV1-1 — Project Membership Foundation

**Scope:** New `ProjectMember` + `Invitation` data model with role enum (Lead / Member / Sponsor); ACL data layer; Invite modal in Charter stage; project membership store; auth checks at every project-scoped read. Sponsor role limited to Report-only access.

### File structure

**Create:**

- `packages/core/src/projectMembership/types.ts` — `ProjectMember`, `Invitation`, `ProjectRole` types
- `packages/core/src/projectMembership/actions.ts` — `PROJECT_MEMBER_*` and `INVITATION_*` HubAction kinds (ADD / UPDATE / REMOVE / ACCEPT / REVOKE)
- `packages/core/src/projectMembership/canAccess.ts` — pure ACL check function `canAccess(userId, project, action)` returning `'lead' | 'member' | 'sponsor' | null`
- `packages/stores/src/useProjectMembershipStore.ts` — Annotation-layer Zustand store (per-Hub-per-user; reads from `ProcessHub.improvementProjects[].members[]`)
- `packages/ui/src/components/projects/InviteModal.tsx` — invite UI (email/directory pick + role picker)
- `packages/ui/src/components/projects/MemberList.tsx` — member list with role badges + remove
- `apps/azure/src/features/projectMembership/useInvitationSync.ts` — handles invitation Azure AD lookup
- Tests: `packages/core/src/projectMembership/**/*.test.ts` + `packages/ui/src/components/projects/InviteModal.test.tsx` + `packages/stores/src/useProjectMembershipStore.test.ts`

**Modify:**

- `packages/core/src/improvementProject.ts` — add `members: ProjectMember[]` field to `ImprovementProject` (sibling of `signoff`, `reflection`)
- `packages/core/src/improvementProject.test.ts` — round-trip test for new field
- `packages/data/src/db/schema.ts` — schema migration for `members` field in IndexedDB; bump Dexie version
- `apps/pwa/src/db/migrations.ts` + `apps/azure/src/db/migrations.ts` — write the migration
- `apps/pwa/src/.vrs/parse.ts` + `apps/azure/src/.vrs/parse.ts` — `.vrs` round-trip handles `members`

### Tasks (task-level — expand to bite-sized in sub-plan)

1. **TDD: ProjectMember + Invitation + ProjectRole types** — write types, write tests asserting shape + role enum exhaustiveness, commit.
2. **TDD: HubAction kinds for membership** — `PROJECT_MEMBER_ADD`, `PROJECT_MEMBER_UPDATE`, `PROJECT_MEMBER_REMOVE`, `INVITATION_ACCEPT`, `INVITATION_REVOKE`. Round-trip + reducer tests. Commit.
3. **TDD: `canAccess(user, project, action)`** — pure function. Test: Lead can edit anything; Member can edit working surfaces; Sponsor can read Report only; non-member returns null.
4. **Add `members[]` field to `ImprovementProject`** + Dexie migration + `.vrs` round-trip. Test with `tests/fixtures/projects/empty-members.vrs` and `populated-members.vrs`. Commit.
5. **`useProjectMembershipStore`** Annotation-layer store — selectors `useProjectMembers(projectId)`, `useUserRole(projectId, userId)`. Test store hydration + selectors. Commit.
6. **`InviteModal` component** — form with email/directory picker + role select + submit dispatching `PROJECT_MEMBER_ADD`. RTL test renders, dispatches expected action. Commit.
7. **`MemberList` component** — render list + role badges + remove button (Lead only). RTL test for role visibility + remove gating. Commit.
8. **Wire Invite modal into Charter stage** — Charter UI gets "Invite team" button → modal. Existing Charter Sections unchanged. RTL test. Commit.
9. **Azure AD invitation lookup (`useInvitationSync`)** — Azure app only. Stub Graph API call (real wiring is a later Azure-only task). Tests with mock. Commit.
10. **Add ACL checks at project-scoped reads** — `IPDetailPage` route guard: redirect non-members to Projects list with "no access" toast. Test: non-member user navigation. Commit.

### Dependencies

None. This is the foundation.

### Verification

- All shipped tests pass (`pnpm test`)
- New tests cover types, actions, store, ACL function, Invite modal, MemberList
- Browser walk via `claude --chrome`: create project → invite a teammate → teammate sees only project they're in → Sponsor user lands on Report tab only
- `bash scripts/pr-ready-check.sh` green
- ADR-074 architecture tests pass

### Next step

Invoke `superpowers:writing-plans` with this PR's scope → produce bite-sized sub-plan with 2-5-minute steps per task.

---

## PR-WV1-2 — Improve Workspace Migration

**Scope:** Delete the top-level Improve tab/route; relocate the legacy Improve workspace into Projects detail as a stage with action tracker (default) + PDCA workbench (Advanced toggle); rename Sustainment+Handoff stages to Improve+Sustainment; fold Handoff close-logic into Sustainment screen; preserve the shipped Sustainment auto-fire (ADR-080).

### File structure

**Create:**

- `packages/ui/src/components/projects/ImproveStage.tsx` — new Improve stage view (simple action list default)
- `packages/ui/src/components/projects/ImproveStageAdvanced.tsx` — PDCA workbench Advanced view (extracted from legacy Improve tab)
- `packages/ui/src/components/projects/SustainmentClosure.tsx` — refactored Sustainment screen with absorbed Handoff close-logic
- Tests for each

**Modify:**

- `apps/pwa/src/routes.tsx` + `apps/azure/src/routes.tsx` — delete `/improve` route; redirect to `/projects/[id]/improve` stage
- `packages/ui/src/components/AppHeader/Nav.tsx` — remove Improve tab; nav reorder happens in PR-WV1-5 (kept here as a stub: 7-tab → 6-tab without reorder)
- `packages/ui/src/components/projects/IPDetailPage.tsx` — stage list `Charter / Approach / Sustainment / Handoff` → `Charter / Approach / Improve / Sustainment`
- `packages/core/src/improvementProject.ts` — stage type rename
- `packages/core/src/improvementProject.test.ts` — `.vrs` round-trip test handles stage rename + handoff fold-in
- `packages/core/src/sustainmentClosure.ts` — absorb the Handoff close-project action (preserves auto-fire per ADR-080)

**Delete:**

- `apps/pwa/src/components/ImproveView.tsx` + `apps/azure/src/components/ImproveView.tsx` — top-level Improve workspace wrapper (logic re-mounts inside Projects detail)
- `packages/ui/src/components/projects/HandoffStage.tsx` — Handoff stage UI

### Tasks

1. **TDD: stage type rename** — `Sustainment + Handoff` → `Improve + Sustainment`. Migration script for stored `.vrs` files. Tests for round-trip + migration.
2. **Extract PDCA primitives** — keep `WhatIfExplorer`, `PrioritizationMatrix`, `BrainstormModal`, `IdeaCard`, `ContextPanel`. Wrap in `ImproveStageAdvanced`. Test renders.
3. **Build `ImproveStage` (simple action tracker)** — single list UI with action title + owner + due + status + linked suspected cause. Add / edit / complete actions. RTL tests.
4. **"Advanced" toggle** — `<ImproveStage>` renders simple by default; toggle reveals `<ImproveStageAdvanced>`. Test toggle behavior + state persistence per IP.
5. **Refactor `SustainmentClosure`** — absorb Handoff close-project action (`HANDOFF_CLOSE` HubAction folded into `SUSTAINMENT_CLOSE`). Test sustainment auto-fire still works.
6. **Delete top-level Improve route** — both PWA + Azure. Add redirect `/improve → /projects` with toast "Improve is now a stage in your projects". RTL test for redirect.
7. **Remove Improve tab from Nav** — 7 → 6 tabs (reorder deferred to PR-WV1-5). RTL test for nav structure.
8. **Browser walk** — verify Improve stage UX end-to-end; PDCA Advanced toggle visible; Sustainment closure absorbs Handoff signoff.

### Dependencies

PR-WV1-1 (project membership) — Improve stage actions need member assignment.

### Verification

- All shipped tests pass + new tests for stage rename migration + Improve stage component + Advanced toggle + Sustainment absorbed Handoff
- Existing `.vrs` fixtures round-trip with stage rename (write migration tests)
- Browser walk: create project → walk through Charter → Approach → Improve (try both simple + Advanced) → Sustainment → close
- Sustainment auto-fire (ADR-080) still triggers correctly

### Next step

Invoke `superpowers:writing-plans` on this PR's scope.

---

## PR-WV1-3 — Investigation Wall + Measurement Plans

**Detailed design:** [`docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md`](../specs/2026-05-16-pr-wv1-3-measurement-plans-design.md) — also covers Invitation lifecycle + ActionItem CRUD as PR-WV1-3a (cleanup) sequenced before PR-WV1-3b (Wall meat) off one branch.

**Scope:** Extend the Investigation Wall with `MeasurementPlan` sub-entity per Hypothesis. Add a Plans panel to each Hypothesis card. Wire the Plan → Collection (out-of-product) → Finding → auto-suggest-link cycle. Excludes formal MSA / Gage R&R / sample-size calculator per wedge spec §3.6.5.

### File structure

**Create:**

- `packages/core/src/measurementPlan/types.ts` — `MeasurementPlan` type
- `packages/core/src/measurementPlan/actions.ts` — `MEASUREMENT_PLAN_*` HubAction kinds (ADD / UPDATE / COMPLETE / SKIP)
- `packages/core/src/measurementPlan/suggestLink.ts` — pure function: given a new Finding, suggest matching Plans by factor + window
- `packages/ui/src/components/InvestigationWall/MeasurementPlansPanel.tsx` — UI panel on Hypothesis card
- `packages/ui/src/components/InvestigationWall/MeasurementPlanForm.tsx` — add/edit Plan form
- Tests for each

**Modify:**

- `packages/core/src/findings/hypothesis.ts` — add `measurementPlanIds: string[]` to `Hypothesis`
- `packages/stores/src/useFindingsStore.ts` — wire `addFinding` to call `suggestLink` and surface suggestion UI
- `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx` — embed `<MeasurementPlansPanel>`
- `packages/data/src/db/schema.ts` — Dexie schema bump for MeasurementPlan

### Tasks

1. **TDD: `MeasurementPlan` type** — fields per wedge spec §3.6.3 (factor, method, sampleSize, owner, status, hypothesisId, linkedFindingIds, msaRequired). Tests.
2. **TDD: `MEASUREMENT_PLAN_*` HubAction kinds** — round-trip + reducer tests.
3. **Add `measurementPlanIds` to `Hypothesis`** — round-trip tests.
4. **TDD: `suggestLink(finding, plans)`** — pure function. Test: finding factor matches Plan factor → suggest; factor+window overlap → suggest; no match → no suggestion.
5. **`MeasurementPlanForm`** — add/edit form with factor + method + sampleSize + owner + status. RTL tests.
6. **`MeasurementPlansPanel`** — list view of Plans on a Hypothesis card. Add Plan button. Plan rows show status, owner. Click Plan → opens edit form. RTL tests.
7. **Embed `MeasurementPlansPanel` in `HypothesisCard`** — Wall view shows Evidence (Findings) + Measurement Plans sections per Hypothesis. RTL tests.
8. **Wire `addFinding` → `suggestLink`** — when a Finding is created, check for matching Plans, show suggestion toast: "Link to Plan X?". Test interaction.
9. **Browser walk** — hypothesis-first flow: create Hypothesis without Findings → add Plan → paste new data → create Finding → see auto-suggest → confirm link → Plan = Complete.

### Dependencies

PR-WV1-1 (membership) — Plan owner is a project Member.

### Verification

- All shipped Wall tests pass + new Plan tests
- Hypothesis-first browser walk end-to-end
- `.vrs` round-trip preserves Plans + linkedFindingIds

### Next step

Invoke `superpowers:writing-plans` on this PR's scope.

---

## PR-WV1-4 — Canvas Response Paths (5→3) + Persona Routing Deletion

**Scope:** Reduce canvas drill response-path menu from 5 to 3 (Investigate, Quick Action, Charter). Delete Handoff response-path code paths. Preserve Sustainment auto-fire (ADR-080). Delete `personaRole` routing logic from the codebase. Collapse persona-adaptive Home shell to single Specialist shape. Simplify Inbox to project-scoped notifications.

### File structure

**Modify:**

- `packages/ui/src/components/canvas/StepCardDrillMenu.tsx` — reduce menu from 5 to 3
- `packages/core/src/responsePath/types.ts` — remove `'handoff'` from `ResponsePath` enum
- `packages/core/src/responsePath/dispatch.ts` — delete handoff path dispatch
- `packages/stores/src/usePersonaStore.ts` — DELETE (or stub to always return 'specialist')
- `packages/ui/src/components/Home/HomeScreen.tsx` — collapse persona variants (Mira-only Home shape becomes the default)
- `packages/ui/src/components/Inbox/Inbox.tsx` — remove persona-based filtering; project-scoped only
- `apps/pwa/src/lib/personaRouter.ts` + `apps/azure/src/lib/personaRouter.ts` — DELETE
- Various test files that mock `personaRole` — update or delete

**Delete:**

- `packages/ui/src/components/Home/PatHomeShell.tsx`
- `packages/ui/src/components/Home/ChenHomeShell.tsx`
- `packages/ui/src/components/Home/FredHomeShell.tsx`
- Persona-variant test fixtures

### Tasks

1. **TDD: ResponsePath enum reduction** — remove `'handoff'`. Update reducer. Tests.
2. **Reduce StepCardDrillMenu** — 5 path buttons → 3 (Investigate / Quick Action / Charter). RTL test menu items.
3. **Delete handoff dispatch** — `responsePath/dispatch.ts` no longer routes handoff. Existing Sustainment auto-fire (ADR-080) still works. Tests.
4. **Delete `personaRole` from `teamMember`** type — type cleanup + migration for stored `.vrs` files (drop the field on read).
5. **Delete persona-specific Home shells** — keep only the Mira shape, rename to `SpecialistHome`. Test renders correctly without persona prop.
6. **Simplify Inbox** — remove persona-based filtering. RTL test inbox items are project-scoped.
7. **Delete `personaRouter.ts`** in both apps. Update import sites.
8. **Test cleanup** — remove or update tests that mock `personaRole`.
9. **Browser walk** — verify Home shows single Specialist shape; canvas drill shows 3 paths; Inbox shows project-scoped notifications.

### Dependencies

PR-WV1-1 (membership replaces persona routing as the access model).

### Verification

- All shipped tests pass; persona-mock test cleanup complete
- Browser walk: no persona switcher visible anywhere; canvas drill = 3 paths; no Handoff path; Sustainment auto-fires
- ADR-074 architecture tests pass

### Next step

Invoke `superpowers:writing-plans` on this PR's scope.

---

## PR-WV1-5 — Tier-Gating Retirement + Nav Reorder

> ⚠️ **AMENDED** — target nav is the 7-tab amendment (see top-of-file): `Home · Project · Process · Analyze · Investigation · Improve · Report`. NO Improve-tab deletion. Project (singular).

**Scope:** Sweep ~33 files using `isPaidTier()` / `hasTeamFeatures()` and retire tier-gating logic under single SKU. Where access-gating is still meaningful, replace with project-membership ACL check (per PR-WV1-1). Reorder + rename the 7-tab nav to workflow order: `Home · Project · Process · Analyze · Investigation · Improve · Report` (renames: Overview→Home, Frame→Process, Analysis→Analyze, Projects→Project).

### File structure

**Modify (~28 files identified by audit; representative examples):**

- `packages/ui/src/components/HandoffForm.tsx`, `packages/ui/src/components/FindingsPanel.tsx` — drop `isPaidTier` checks
- `packages/ui/src/components/AdminHub.tsx` — drop tier-gating
- `packages/ui/src/components/InvestigationWorkspace.tsx` — drop `hasTeamFeatures`
- `apps/pwa/src/App.tsx` + `apps/azure/src/App.tsx` — drop tier-gated deep-link validation
- `packages/ui/src/components/AdminKnowledgeSetup.tsx` — drop `hasTeamFeatures`
- `packages/hooks/src/useAIOrchestration.ts` + `teamToolHandlers.ts` — drop tier-tool gating
- `packages/charts/src/Yamazumi/YamazumiDashboard.tsx` + `YamazumiWrapper.tsx` — drop tier-gated multi-channel feature
- `packages/ui/src/components/ReportView.tsx` — drop tier-gated layout
- `packages/hooks/src/usePhotoComments.ts` — drop tier-gating
- `packages/core/src/limits.ts` — `validateChannelCount` — keep platform limit but drop tier dimension
- `apps/azure/src/components/AppHeader.tsx` + `apps/pwa/src/components/layout/AppHeader.tsx` — reorder + rename tabs to `Home · Project · Process · Analyze · Investigation · Improve · Report` (7 tabs per amendment)

### Tasks

1. **Inventory:** run a fresh `grep -rn "isPaidTier\|hasTeamFeatures" packages/ apps/` and produce the canonical file list (~28).
2. **For each file (subagent-parallelizable):** delete the tier check; if access-gating was meaningful, replace with `canAccess(user, project, action)` from PR-WV1-1; else delete branch.
3. **Update consumer tests** for each retired file.
4. **Channel-limit refactor** — keep platform limit (1500 in Azure, 5 in PWA) but drop tier as a dimension.
5. **Nav reorder + renames (per amendment)** — current `[Overview] [Frame] [Analysis] [Investigation] [Improve] [Projects] [Report]` (Azure) / `[Home] [Frame] [Analysis] [Investigation] [Improve] [Projects] [Report]` (PWA) → target `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]` (7 tabs workflow order; Improve stays). Renames: Overview→Home, Frame→Process, Analysis→Analyze, Projects→Project (singular). RTL tests update accordingly.
6. **Browser walk** — every formerly-tier-gated surface works correctly; nav order matches workflow.

### Dependencies

PR-WV1-1 (`canAccess`), PR-WV1-2 (Improve already removed from nav), PR-WV1-4 (persona deletion).

### Verification

- All shipped tests pass; tier-gating-related tests retired or updated
- Browser walk on every formerly-gated surface
- Per-tier feature parity inventory cleared (feature-parity.md will be updated as a doc-only PR)

### Next step

Invoke `superpowers:writing-plans` on this PR's scope.

---

## PR-WV1-6 — Azure Marketplace SKU + Customer Migration

**Scope:** Azure Marketplace manifest change from €79 Standard + €199 Team → single €99 SKU. Migration UI for existing customers (grandfathering window per §8.1 precondition). Decision-log entry for the migration plan.

### File structure

**Modify:**

- `azure/marketplace/manifest.json` — single SKU at €99/mo
- `azure/marketplace/billing-config.json` — single plan
- `docs/08-products/azure/pricing.md` — single-tier description
- `apps/azure/src/features/subscription/MigrationPrompt.tsx` (NEW) — UI for existing customers with grandfather countdown
- `apps/azure/src/features/subscription/useSubscriptionStatus.ts` — detect legacy tier + surface migration prompt

### Tasks

1. **Manifest change** — Azure Marketplace single SKU. Test in staging tenant before production rollout.
2. **Grandfathering policy** — per §8.1 decision; if grandfather window chosen, implement countdown UI in MigrationPrompt.
3. **MigrationPrompt UI** — appears for customers on legacy €79 / €199 tier. Renders: "Your plan is changing to €99 on [date]. Action needed: [details]." Dismissable; tracks acknowledgment.
4. **Communication artifacts** — email template + in-product banner copy + FAQ doc (under `docs/08-products/azure/`).
5. **Decision-log entry** — migration date, grandfathering policy, customer mix.
6. **Test plan** — run the migration on a test tenant before production.

### Dependencies

PR-WV1-5 (tier-gating retirement) — the product needs to handle single-SKU before the Marketplace cuts over.

### Verification

- Staging tenant migration completes cleanly
- MigrationPrompt UI appears for legacy-tier accounts only
- Decision-log entry captures the migration date + policy

### Next step

Invoke `superpowers:writing-plans` on this PR's scope.

---

## Documentation PR (independent — can land any time)

**Scope:** Remaining anchor doc content rewrites (mode-specific USER-JOURNEYS family, product-overview, market-analysis, feature-parity table collapse, 03-features/specifications per-feature audit). Already marker-tagged; full rewrites are editorial.

This is **not** in the engineering critical path — it can land any time. See `.superpowers/wedge-doc-triage.md` and the existing wedge-pivot PR #182 for status.

---

## What's untouched by this plan (the foundation holds)

Per wedge spec §6 — these stay as-is:

- Process tab + canvas + 8f viewport architecture (just re-keyed to `ProjectId` when project-scoped)
- Frame step in Process tab Edit mode
- Investigation Wall + Evidence Map core (Detective pack) — only adds MeasurementPlan panel
- Analyze tab + EDA + Factor Intelligence + Filter Chips
- Report (#181) — same component, single-tier render
- Storage architecture (PWA / Azure Managed App + Blob)
- Statistical engine (continuous regression, ANOVA, capability, NIST validation)
- i18n
- Multi-level SCOUT V1 (in flight; doesn't conflict)

---

## Self-review checklist (run before executing first PR)

- [ ] **Spec coverage**: every migration-impact row in wedge spec §6 is assigned to a PR. ✓
- [ ] **Out-of-V1 scope honored**: no PR touches MSA / Gage R&R / sample-size calculator / multi-source Slice 2/3 / cross-tenant invites (all deferred per wedge spec §10).
- [ ] **Dependencies sequenced**: PR-WV1-1 lands before all downstream PRs. PR-WV1-5 (sweep) lands after PR-WV1-2/3/4. PR-WV1-6 (Marketplace) lands after PR-WV1-5.
- [ ] **Type consistency**: `ProjectMember`, `Invitation`, `ProjectRole`, `MeasurementPlan`, `Hypothesis.measurementPlanIds` — same names across all PRs that reference them.
- [ ] **No placeholders in this master plan** beyond the explicit "expand to sub-plan" pointers. ✓

---

## Execution handoff

Plan complete and saved at `docs/superpowers/plans/2026-05-16-wedge-implementation.md`.

This is a **master sequencer**, not a bite-sized plan. Two execution options:

1. **Sub-plan first (recommended)** — invoke `superpowers:writing-plans` again on **PR-WV1-1's scope** to produce a bite-sized 2-5-minute-step sub-plan. Then execute it via `superpowers:subagent-driven-development`. Repeat for each subsequent PR as you reach it.

2. **Direct execution** — dispatch implementer subagent against this master plan; subagent expands each PR's task list into bite-sized steps on the fly. Faster wall-clock but less review-able; only do this if you trust the subagent's expansion.

**Recommended approach for the wedge:**

- Sub-plan PR-WV1-1 + execute.
- Sub-plan PR-WV1-2 + execute (parallel-track PR-WV1-3 + PR-WV1-4 if velocity is high).
- Converge on PR-WV1-5 (sweep) once 1-4 land.
- PR-WV1-6 (Marketplace) once the product is stable on single-SKU code.

Subagent-driven-development with **Sonnet workhorses** (≥70% of dispatches per CLAUDE.md memory) + **Opus for final-branch review only**. Per-task spec + quality reviewers, final code-reviewer at the end of each PR.
