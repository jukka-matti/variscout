---
title: 'wedge-v1'
description: 'Wedge pivot 2026-05-16 — VariScout splits into V1 single-product specialist tool + future VariScout Process; canonical sources, anatomy, status pointer'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 22e9f4ed-cade-4c58-8dc1-da82ee14aa2e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_wedge_v1.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

VariScout split into **two products on a roadmap** via the 2026-05-16 wedge pivot (8-round strategic brainstorm). V1 is a single-product project tool for improvement specialists; VariScout Process is the future enterprise product for Hub portfolios + 4-persona + auto pipelines.

**Canonical sources** (read in this order):
- Spec: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`
- ADR: `docs/07-decisions/adr-082-wedge-architecture.md`
- Master plan: `docs/superpowers/plans/2026-05-16-wedge-implementation.md`
- PR-WV1-1 bite-sized sub-plan: `docs/superpowers/plans/2026-05-16-pr-wv1-1-project-membership.md`

**V1 anatomy locks:** _(amended 2026-05-16 — see "Amendment 2026-05-16" below)_
- 7-tab nav in workflow order: `Home · Project · Process · Analyze · Investigation · Improve · Report` (singular "Project")
- Improve is a **top-level verb tab** (active-IP-scoped, mirrors Analyze/Investigation cascade pattern); IP detail has 3 stages = Charter → Approach → Sustainment (Handoff folded into Sustainment closure)
- Two analyst modes — both first-class: **quick analysis** (no project; free PWA + paid) + **project-anchored** (Charter ceremony + lifecycle)
- Hub stays **internal-only** data container; not a user-visible noun. Tenant-wide access. Promotion path "+ Promote to Project" inherits Hub state
- Project membership: **Lead / Member / Sponsor** roles (Sponsor = Report-only at V1; signoff out-of-band). Cross-Azure-AD-tenant invites explicitly out of V1 (deliberate privacy boundary)
- Pricing: **€99/month single Azure SKU**, tenant-wide (supersedes €79 Standard + €199 Team; honors ADR-033 H6 per-deployment hypothesis)
- Canvas response paths reduced from 5 to 3: Investigate / Quick Action / Charter (Sustainment auto-fires per ADR-080; Handoff deleted)
- Single persona collapse — Specialist; 4-persona Coherence Session A retires for V1 (migrates to VariScout Process)
- **Measurement Plans** integrated into Investigation Wall as sub-entity per Hypothesis (no separate Measure stage). Supports hypothesis-first investigation: plan → collect → finding → confirm/refute

**Supersession matrix** (per spec §9):
- ADR-007 (Azure Marketplace distribution) — partial supersession on pricing
- ADR-033 (Pricing tiers) — partial supersession on SKU structure
- 2026-05-14 Coherence audit — partial supersession (Session A retires; Sessions B+C amend) → [[coherence-audit-2026-05-14]]
- 2026-05-14 Projects-tab design — amended (stage rename, membership model, persona-routing removed) → [[projects-tab-design]]

**Three preconditions cleared** before engineering committed: migration math, Azure AD constraint accepted, customer validation conversation.

**Status:** See `gh pr list --state all --search "wedge"` for current delivery state. Engineering sequence is PR-WV1-1 → ... → PR-WV1-6; sub-plans live under `docs/superpowers/plans/2026-05-*-pr-wv1-*.md`. Master sequencer is `docs/superpowers/plans/2026-05-16-wedge-implementation.md` (amended — see top-of-file notice).

**VariScout Process** is named-future; not announced in V1 marketing. Carries: Hub-as-user-visible primary container, 4-persona model, automated data pipelines, multi-Hub portfolio, Process Owner cadence dashboard, Knowledge Catalyst at Hub scale, in-app Sponsor signoff workflow, formal Gage R&R / MSA, sample-size calculator, cross-tenant invitations.

**Related feedback** that shaped this pivot: [[step-back-for-system-design]], [[honor-vision-commitments]], [[journey-first-then-ui]], [[check-shipped-patterns-first]], [[type-separation-vs-component-separation]].

---

**Amendment 2026-05-16 — Improve as top-level verb tab + Project singular.** Mid-execution of PR-WV1-2 (Improve workspace migration), the user surfaced the asymmetry: wedge §3.1 kept Analyze + Investigation as top-level verbs but removed Improve. That collapsed the pre-wedge verb/noun split too aggressively. The amendment **restores Improve as a top-level verb tab** (active-IP-scoped via the existing `useActiveIPContext(sessionHub)` cascade from PR-PT-7), **renames Projects → Project (singular)** to match the active-IP-centric pattern of every cascading verb tab, **trims IP detail from 4 stages to 3** (`Charter / Approach / Sustainment` — the `'improve'` stage retires; Sustainment still absorbs Handoff close-logic per Task 5), and **reuses the production `<ImprovementWorkspaceBase>`** as the Advanced toggle target inside `<ImproveStage>` (retiring the PR-WV1-2 Task 3 `<ImproveStageAdvanced>` skeleton — production primitives over parallel-build). Improve tab empty state when no active IP: `<NoActiveProjectGuidance>` with "Go to Home" button — mirrors how PR-WV1-1's `NoAccessRedirect` handles the ACL empty state. Preserves wedge §(3) "idea board / action conversion retire" (Improve tab is single-IP-scoped, not free-roaming). Canonical artifact: `docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md`. Amendment plan: `docs/superpowers/plans/2026-05-16-pr-wv1-2-amendment-improve-tab-restore.md`. Use these as anchors for PR-WV1-3/4/5/6 design — every verb tab should follow the cascade + empty-state pattern.

**PR-WV1-3 design + 3a delivery 2026-05-16.** PR-WV1-3 design spec at `docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md` covers (1) MeasurementPlan sub-entity per Hypothesis on the Investigation Wall (the master-plan PR-WV1-3 scope), (2) Invitation lifecycle action kinds (PR-WV1-1 deferred (a)), (3) ActionItem CRUD action kinds (PR-WV1-2 Task 2 deferred). Split into two PRs off one branch: PR-WV1-3a (cleanup, ships first) + PR-WV1-3b (MeasurementPlan + Wall, ships second). **PR-WV1-3a SHIPPED (PR #186).** Closed PR-WV1-1 (a) + PR-WV1-2 Task 2 deferred. Added `INVITATION_ACCEPT` composite (synthesizes ProjectMember via `reduceProjectMembers`) + `INVITATION_REVOKE` + `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` + `reduceActionItems`. New `<PendingInvitesBanner>` mounted 3-way (PWA HomeScreen empty state + PWA App.tsx Home view + Azure Editor chrome). `ImprovementProjectMetadata.actions?: ActionItem[]` field added; both apps' persistence `applyAction.ts` exhaustive switches extended. V1 limitation logged: invitations remain transient (store + localStorage) — cross-device durable persistence deferred to PR-WV1-5 per `docs/investigations.md`. PR-WV1-3b (MeasurementPlan + Wall — ~9 tasks) is the next slice off the same branch.

**Key design pattern from PR-WV1-3a:** composite store actions (acceptInvite reads invite, applies `reduceProjectMembers(currentMembers, INVITATION_ACCEPT)`, dispatches `useImprovementProjectStore.upsertProject(...)` with new members, AND filters from pendingInvites — all atomic in one `set`). Cross-store imperative access via `getState()` is the canonical pattern per `packages/stores/CLAUDE.md`. No central reducer/dispatch loop exists in this codebase — Zustand direct methods are the path.

**PR-WV1-3b delivery 2026-05-16 (merged in PR #186 alongside 3a).** `MeasurementPlan` sub-entity per Hypothesis with own Dexie table (Azure v12 / PWA v5). New `@variscout/core/measurementPlan` sub-path; 4-kind `MeasurementPlanAction` union + `reduceMeasurementPlans`; `Hypothesis.measurementPlanIds?: string[]` (uses `string[]` not `MeasurementPlan['id'][]` to avoid circular import — equivalent because `MeasurementPlan['id']` resolves to `string` via EntityBase). UI: `<MeasurementPlanChip>` / `<AddPlanForm>` / `<LinkFindingPicker>` mount inline inside `<HypothesisCard>` via `foreignObject` (NO separate panel/sidebar/modal — design spec §3 + investigations.md 2026-05-16 Wall-surface decision). **Strategy B wrapper** chosen — `<HypothesisCardWithPlans>` wraps `<HypothesisCard>` rather than extending its props (HypothesisCard already at 13 props; adding 7 more was unwieldy). `WallCanvas` gained optional `planningProps: WallCanvasPlanningProps` bag. Dispatch path: `MeasurementPlanAction` uses `HubRepository.dispatch()` because it has its own Dexie table — distinct from `ActionItemAction` which uses `useImprovementProjectStore.upsertProject()` because actions are stored as `ImprovementProjectMetadata.actions[]`. **Rule pinned in `docs/investigations.md` 2026-05-16:** "Hub-domain sub-entities with own Dexie table dispatch via HubAction; Project-metadata bag fields use upsertProject." 7 Important code-review followups bundled pre-merge per `feedback_bundle_followups_pre_merge` (wallActiveIPMembers useMemo, AddPlanForm soft-delete filter, chip role="button", onLinkFinding dedup, useEffect string-key, dispatch rollback, PendingInvitesBanner project name resolver).
