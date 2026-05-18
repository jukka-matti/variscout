---
title: 'Access Control'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Access Control

## Problem

Within a single Azure AD tenant, an improvement project has heterogeneous stakeholders: the lead drives charter/approach/improve/sustainment edits, members contribute to those edits, and a sponsor reviews outcomes without editing — and the per-project ACL must enforce this without falling back to tenant-wide admin gates or accidentally letting non-members see private projects in their list.

## Capability claim

Per ADR-082 wedge V1, project access is governed by 3 roles — `lead | member | sponsor` — defined in `packages/core/src/projectMembership/types.ts` and enforced by the pure-TS `canAccess(userId, members, action)` function in `packages/core/src/projectMembership/canAccess.ts`. The `ProjectAction` union (`edit-charter | edit-approach | edit-improve | edit-sustainment | manage-membership | view-report`) plus a `ROLE_PERMISSIONS` table give a single source of truth: lead has all 6 actions, member has 5 (no `manage-membership`), sponsor has only `view-report`. Gating is **inside** each surface (Charter / Approach / Improve / Sustainment / Report writes) — sponsor sees Report-only, member + lead get edit, non-members never see the project. Invitation flow (`useProjectMembershipStore` + `reduceProjectMembers` + `MembershipAction.kind`) handles pending → accepted → revoked transitions; no cross-AD-tenant invites are possible.

## Intent diagram

No user-facing surface — infrastructure layer. See `docs/07-decisions/adr-082-wedge-architecture.md` for the role/permission matrix and PR-WV1-1 for the inside-the-surface gating pattern.

## Acceptance signals

TBD — see related tests at `packages/core/src/projectMembership/canAccess.test.ts`, `packages/core/src/projectMembership/types.test.ts`, `packages/core/src/projectMembership/actions.test.ts`, and `packages/stores/src/__tests__/useProjectMembershipStore.test.ts` for current verification.

## Out of scope / non-goals

TBD. Cross-AD-tenant invitations are explicitly out of scope for V1; tenant-wide admin roles (`VariScout.Admin` claim from EasyAuth) are separate from per-project ACLs.

## Links

- **Code**: `packages/core/src/projectMembership/canAccess.ts`, `packages/core/src/projectMembership/types.ts`, `packages/core/src/projectMembership/actions.ts`, `packages/stores/src/useProjectMembershipStore.ts`, `apps/azure/src/auth/easyAuth.ts`
- **Tests**: `packages/core/src/projectMembership/canAccess.test.ts`, `packages/core/src/projectMembership/actions.test.ts`, `packages/stores/src/__tests__/useProjectMembershipStore.test.ts`
- **Related**: `docs/07-decisions/adr-082-wedge-architecture.md`, `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`, `apps/azure/CLAUDE.md`
