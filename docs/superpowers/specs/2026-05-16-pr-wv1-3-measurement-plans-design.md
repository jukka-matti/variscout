---
title: 'PR-WV1-3 — MeasurementPlan + Invitation lifecycle + ActionItem CRUD design'
status: draft
last-reviewed: 2026-05-16
category: design-spec
audience: [designer, engineer, analyst]
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md
  - docs/superpowers/specs/2026-04-19-investigation-wall-design.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-3a-membership-cleanup.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-3b-measurement-plans-wall.md
  - docs/07-decisions/adr-082-wedge-architecture.md
---

# PR-WV1-3 — MeasurementPlan + Invitation lifecycle + ActionItem CRUD design

## Context

PR-WV1-3 of the wedge V1 implementation delivers three concerns that compose cleanly into one branch + two sequenced PRs:

1. **MeasurementPlan sub-entity per Hypothesis on the Investigation Wall** (wedge spec §3.6 — the load-bearing V1 commitment). Enables hypothesis-first deductive investigation: analyst creates a Hypothesis with no Findings yet, lists what evidence is needed via Measurement Plans, coordinates collection out-of-product, then links pasted-in Findings back to the Plans.
2. **Invitation lifecycle action kinds** (inherited from PR-WV1-1 decision-log item (a)) — closes the gap where `useProjectMembershipStore.acceptInvite()` just filters from `pendingInvites[]` without transitioning `Invitation.status` or creating a `ProjectMember`.
3. **ActionItem CRUD action kinds** (inherited from PR-WV1-2 Task 2 deferred) — closes the gap where the Improve tab's edit affordances dispatch `console.warn` stubs instead of real actions.

The MeasurementPlan work is the meaty design; the other two are cleanup with their own lightweight UX surfaces. Per `feedback_slice_size_cap`, the combined scope exceeds 6-8 tasks, so the spec lands as a single design with **two sequenced PRs off one branch**: PR-WV1-3a (cleanup, ships first) + PR-WV1-3b (Wall meat, ships second).

## Decision summary

1. **MeasurementPlan is a real sub-entity** per wedge spec §3.6.3, not a flat field on Hypothesis. Hypothesis-first investigation is the canonical Six Sigma journey and needs a structured planning surface; Plans aren't decoration.
2. **Two-PR split** off one branch: PR-WV1-3a (membership + action CRUD cleanup) ships first; PR-WV1-3b (MeasurementPlan + Wall) ships second once the cleanup foundation is in place.
3. **Inline rendering on the Hypothesis card** — Plans render as compact rows in the second half of the existing `<HypothesisCard>` (mirroring the wedge spec §3.6.2 diagram). No separate modal, sidebar, or panel. Visual continuation of the existing `<FindingChip>` metaphor: `<MeasurementPlanChip>` with amber ⏳ for open + green ✓ for complete.
4. **Auto-suggest, analyst-confirmed status transitions** — when a Finding links to a Plan, banner suggests "Mark complete?" but doesn't auto-transition. When the first Plan completes on a Hypothesis, banner suggests "Mark evidenced?". Preserves Six Sigma's explicit phase-gate semantics while giving the magic nudge.
5. **Plan-side linking UX** — Plans have "Link Finding…" pickers; Findings don't get a corresponding "Link to Plan…" affordance for V1 (symmetric UI is V2 polish). Mental model: hypothesis-first analyst thinks "I designed this Plan, now I'm filling it in."
6. **Pending invitations surface on Home** above the active-IP launchpad. No new Inbox tab in V1 — Home is where users arrive; invitations are first-class entry points alongside projects.
7. **Permissions reuse `'edit-approach'`** — MeasurementPlans live in the Approach stage's Wall surface; canAccess gates reuse the existing ProjectAction enum value. No new `'edit-measurement-plan'` action kind for V1.

## What this supersedes / amends

- Wedge spec §3.6.3 (entity fields) — implemented verbatim with one V1 simplification: `method` becomes a discriminated union of 5 values (sensor / manual-count / gemba-walk / expert-assessment / other) rather than open string. Future methods plug in by extending the union.
- Wedge spec §3.6.4 (Plan → Collection → Finding cycle) — implemented as analyst-driven manual linking + auto-suggest-on-link nudge. Auto-match (factor + window heuristic) per spec §3.6.4 line 4 is **explicitly deferred to V2** — the spec hint about auto-suggestion remains aspirational; V1 ships manual.
- Wedge spec §3.6.5 (V1 deferrals) preserved verbatim: Gage R&R workflow, statistical sample-size calculator, auto-ingestion / sensor feeds, multi-source provenance gating all stay deferred.
- PR-WV1-1 decision-log amendment item (a) — Invitation lifecycle — **closed by PR-WV1-3a**.
- PR-WV1-2 Task 2 deferred ActionItem CRUD — **closed by PR-WV1-3a**.

---

## PR-WV1-3a — Membership cleanup + ActionItem CRUD

Ships first. ~6 tasks. Single branch base: `feat/wedge-pr-wv1-3-measurement-plans` stacked on PR-WV1-2's branch (or main if PR-WV1-1+2 have merged by then).

### Invitation lifecycle action kinds

In `packages/core/src/projectMembership/actions.ts`, extend the `MembershipAction` union:

```typescript
export type MembershipAction =
  | { kind: 'PROJECT_MEMBER_ADD'; projectId: ImprovementProject['id']; member: ProjectMember }
  | {
      kind: 'PROJECT_MEMBER_UPDATE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
      patch: ProjectMemberPatch;
    }
  | {
      kind: 'PROJECT_MEMBER_REMOVE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
    }
  | { kind: 'INVITATION_ACCEPT'; invitationId: Invitation['id']; acceptedAt: number }
  | { kind: 'INVITATION_REVOKE'; invitationId: Invitation['id']; revokedAt: number };
```

`reduceProjectMembers(state, action)` extends to handle both new kinds. `INVITATION_ACCEPT` is a **composite action**: it transitions the Invitation's status to `'accepted'` AND emits a corresponding `PROJECT_MEMBER_ADD` to add the user to the project's `members[]`. The composite is encapsulated inside the reducer so callers dispatch one action.

`INVITATION_REVOKE` transitions status to `'revoked'` + stamps `revokedAt`. Lead-initiated; surfaces in the CharterOverview Invite UI once Lead-side invite management lands (out of PR-WV1-3 scope).

### `useProjectMembershipStore.acceptInvite()` wiring

Currently the store action just filters from `pendingInvites[]`:

```typescript
acceptInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
```

After PR-WV1-3a, the store action dispatches `INVITATION_ACCEPT` through the project store (or whatever the canonical dispatch path is for `MembershipAction` — likely `useProjectStore.dispatch`) AND filters from the local `pendingInvites[]`. Both operations atomic.

The `revokeInvite(id)` store action mirrors the same pattern for `INVITATION_REVOKE`.

### `<PendingInvitesBanner>` on Home

New component at `packages/ui/src/components/Home/PendingInvitesBanner.tsx`:

```tsx
interface PendingInvitesBannerProps {
  invites: Invitation[];
  onAccept: (id: Invitation['id']) => void;
  onDecline: (id: Invitation['id']) => void;
}
```

Renders when `invites.length > 0`. Layout: collapsed banner with "You have N pending invitation(s)" + chevron to expand. Expanded view lists each invite as a row with project name, role being offered, inviter, Accept + Decline buttons.

Empty state: `invites.length === 0` → banner renders `null`. No stale "All caught up" state.

Wired into Home (`apps/pwa/src/components/HomeView.tsx` + Azure equivalent) above the active-IP launchpad. Reads `useProjectMembershipStore(s => s.pendingInvites)`.

### ActionItem CRUD action kinds

In `packages/core/src/actions/actionItemActions.ts`, extend the existing `ACTION_ITEM_ADD` with two siblings:

```typescript
export type ActionItemAction =
  | { kind: 'ACTION_ITEM_ADD'; actionItem: ActionItem }
  | { kind: 'ACTION_ITEM_UPDATE'; actionItemId: ActionItem['id']; patch: ActionItemPatch }
  | { kind: 'ACTION_ITEM_REMOVE'; actionItemId: ActionItem['id']; removedAt: number };

export type ActionItemPatch = Partial<
  Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt' | 'parentImprovementProjectId'>
>;
```

`patch` follows `feedback_action_patch_omit_lifecycle`: omits `id`, `createdAt`, `deletedAt`, and `parentImprovementProjectId` (FK shouldn't be patched via UPDATE).

`ACTION_ITEM_REMOVE` is a **soft-delete** — sets `deletedAt: removedAt`, doesn't physically remove. Consumers filter by `actionItems.filter(a => a.deletedAt === null)` (the existing PWA/Azure hydration pattern from PR-WV1-1's `migrateImprovementProjectMetadata`).

`reduceActionItems(state, action)` covers all three kinds.

### Wire dispatch in PWA + Azure

The `<ImprovementView>` body in both apps currently passes `console.warn` stubs to `<ImproveTabRoot>`'s `onActionUpdate` / `onActionRemove` callbacks. PR-WV1-3a replaces those with real dispatches:

```tsx
onActionUpdate={(id, patch) => dispatch({ kind: 'ACTION_ITEM_UPDATE', actionItemId: id, patch })}
onActionRemove={(id) => dispatch({ kind: 'ACTION_ITEM_REMOVE', actionItemId: id, removedAt: Date.now() })}
```

`dispatch` is whatever the canonical action-dispatch path is for the app's project store. Existing `ACTION_ITEM_ADD` wiring (from PR-WV1-2) shows the pattern; mirror it.

### PR-WV1-3a tasks (writing-plans output)

Approximately 6 tasks at task-level granularity:

1. TDD: `INVITATION_ACCEPT` + `INVITATION_REVOKE` action kinds in `MembershipAction` union + reducer.
2. TDD: `useProjectMembershipStore.acceptInvite/revokeInvite` wire to dispatch the new action kinds.
3. TDD: `<PendingInvitesBanner>` component (RTL: renders N invites; Accept calls onAccept with id; Decline calls onDecline with id; empty state renders null).
4. Wire `<PendingInvitesBanner>` into Home in both apps.
5. TDD: `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` action kinds + `reduceActionItems`.
6. Wire ActionItem dispatch in PWA + Azure `<ImprovementView>` (replace `console.warn` stubs).

---

## PR-WV1-3b — MeasurementPlan + Wall integration

Ships second. ~9-10 tasks. Builds on PR-WV1-3a's foundation (ProjectMember lookup for the owner picker).

### Entity model

New file: `packages/core/src/measurementPlan/types.ts` (new sub-path export — requires paired `package.json#exports` + `tsconfig.json#paths` update per root CLAUDE.md invariant).

```typescript
import type { EntityBase } from '../identity';
import type { Hypothesis } from '../findings/types';
import type { Finding } from '../findings/types';
import type { ProjectMember } from '../projectMembership/types';

export type MeasurementMethod =
  | 'sensor'
  | 'manual-count'
  | 'gemba-walk'
  | 'expert-assessment'
  | 'other';

export type MeasurementPlanStatus = 'planned' | 'in-progress' | 'complete' | 'skipped';

export interface MeasurementPlan extends EntityBase {
  hypothesisId: Hypothesis['id'];
  factor: string;
  method: MeasurementMethod;
  sampleSize: number;
  owner: ProjectMember['id'];
  status: MeasurementPlanStatus;
  linkedFindingIds?: Finding['id'][];
  msaRequired?: boolean;
}
```

### Hypothesis extension

In `packages/core/src/findings/types.ts`, extend `Hypothesis` with one new optional field:

```typescript
export interface Hypothesis extends EntityBase {
  // ... existing fields preserved
  /** IDs of MeasurementPlans designed to gather evidence for this hypothesis. Parallel to findingIds. */
  measurementPlanIds?: MeasurementPlan['id'][];
}
```

Adding a new optional field to an existing entity. Existing serialization paths handle the optional field naturally; no `.vrs` round-trip migration needed beyond noting the new field can appear.

### Action kinds + reducer

New file: `packages/core/src/measurementPlan/actions.ts`.

```typescript
export type MeasurementPlanPatch = Partial<
  Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt' | 'hypothesisId'>
>;

export type MeasurementPlanAction =
  | { kind: 'MEASUREMENT_PLAN_ADD'; plan: MeasurementPlan }
  | { kind: 'MEASUREMENT_PLAN_UPDATE'; planId: MeasurementPlan['id']; patch: MeasurementPlanPatch }
  | { kind: 'MEASUREMENT_PLAN_REMOVE'; planId: MeasurementPlan['id']; removedAt: number }
  | {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING';
      planId: MeasurementPlan['id'];
      findingId: Finding['id'];
    };

export function reduceMeasurementPlans(
  state: MeasurementPlan[],
  action: MeasurementPlanAction
): MeasurementPlan[];
```

`patch` follows `feedback_action_patch_omit_lifecycle`. `REMOVE` is soft-delete (`deletedAt = removedAt`). `LINK_FINDING` appends to `linkedFindingIds` AND emits a side-effect for the auto-suggest banner UI (the side-effect is a UI concern — the reducer only mutates state).

### Component additions

**`<MeasurementPlanChip>`** — compact row UI for a single Plan.

```
[⏳] factor / method / size / owner / [Link Finding…] [Edit]
[✓] factor / method / size / owner / → Finding 1
```

Status indicator: ⏳ amber for `planned`/`in-progress`, ✓ green for `complete`, ✗ gray for `skipped`. Click on chip body opens inline edit form (factor / method / sampleSize / owner). Click "Link Finding…" opens picker.

Visual mirror of existing `<FindingChip>` from the InvestigationWall component family.

**`<AddPlanForm>`** — inline expansion when "+ Add Plan" clicked on a Hypothesis card.

Fields:

- Factor (text input, required)
- Method (select: 5 values)
- Sample size (number input, required, ≥1)
- Owner (picker: `members.filter(m => m.role !== 'sponsor')`)
- MSA required (checkbox, optional, default false)
- Cancel / Save buttons

Dispatches `MEASUREMENT_PLAN_ADD` on save.

**`<LinkFindingPicker>`** — modal-ish picker opened from a Plan's "Link Finding…" button.

Lists `findings.filter(f => f.hypothesisId === plan.hypothesisId && !plan.linkedFindingIds?.includes(f.id))`. Multi-select. Confirm dispatches one or more `MEASUREMENT_PLAN_LINK_FINDING` actions.

After confirmation, banner appears inside the Plan chip: "Mark complete? [Yes, mark complete]". Click dispatches `MEASUREMENT_PLAN_UPDATE` with `patch: { status: 'complete' }`.

**Hypothesis-level auto-suggest banner** — when a Plan transitions to `complete` and Hypothesis status is still `'proposed'`, banner appears at the Hypothesis card header: "Mark evidenced? [Yes, mark evidenced]". Click dispatches existing Hypothesis status update.

### `<HypothesisCard>` extension

Existing component at `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx`. The amendment adds a second half below the existing Findings section:

```
┌─ Hypothesis: "{name}" ─────────────────────────────────────┐
│  Status: {status}                                          │
│                                                            │
│  ─── EVIDENCE (collected) ───                              │
│  [existing FindingChip[] from findingIds]                  │
│                                                            │
│  ─── MEASUREMENT PLAN (what we still need) ───             │
│  [new MeasurementPlanChip[] from measurementPlanIds]       │
│                                                            │
│  [+ Add Plan]  [+ Add Finding]  [Confirm]  [Refute]        │
└────────────────────────────────────────────────────────────┘
```

If `measurementPlanIds` is empty/undefined: render `+ Add Plan` button only (no chip list, no section divider).

The visual divider for the second half uses the same styling as the existing Findings section divider — symmetric typography signals symmetric importance.

### Permissions

`canAccess(currentUserId, members, 'edit-approach')` gates all Plan affordances (+ Add Plan, Edit, Link Finding, Mark complete). Per the wedge spec §4 truth table:

- Lead: can edit (all 4 actions affirmed)
- Member: can edit (edit-approach permitted)
- Sponsor: hidden (Sponsor placeholder still applies — Plans aren't visible to Sponsors via the Sponsor `<IPDetailPage>` placeholder route)
- Non-member: redirected via the existing `<NoAccessRedirect>`

Owner picker filters to `members.filter(m => m.role !== 'sponsor')` — Sponsors can't own Plans.

### Status transition mechanics

**Plan-level:**

- `planned` (default on creation)
- `in-progress` (analyst manually clicks status select on chip)
- `complete` (analyst confirms via the auto-suggest banner OR manually selects from chip status)
- `skipped` (analyst confirms via "Skip Plan" action on chip)

The auto-suggest banner appears AFTER `MEASUREMENT_PLAN_LINK_FINDING` adds the first linkedFindingId. The banner is a UI state, not a status; clicking confirm dispatches `MEASUREMENT_PLAN_UPDATE { status: 'complete' }`.

**Hypothesis-level:**

Existing transitions preserved (`proposed → evidenced → confirmed | refuted`). New auto-suggest banner at Hypothesis header when first Plan transitions to `complete` AND Hypothesis is still `proposed`:

> Plan completed. Mark hypothesis as evidenced? [Yes, mark evidenced] [Dismiss]

Click dispatches the existing Hypothesis status update. Dismiss persists in `useViewStore` (or similar transient store) so the banner doesn't reappear for the same Hypothesis until a new Plan completes.

### Persistence + dispatch

`MeasurementPlan[]` lives on `ProcessHubInvestigation` (parallel to `findings`, `hypotheses`). New Dexie table in both apps' schemas (`apps/azure/src/db/schema.ts` + PWA equivalent). Hydration via `azureHubRepository.measurementPlans.listByHypothesis(hypothesisId)` etc.

`MeasurementPlanAction` flows through the same project-store dispatch pattern as `MembershipAction` and `ActionItemAction`. Reducer in `@variscout/core/measurementPlan`; consumer dispatch in `@variscout/stores`.

### PR-WV1-3b tasks (writing-plans output)

Approximately 9 tasks at task-level granularity:

1. TDD: `MeasurementPlan` types + `MeasurementMethod` + `MeasurementPlanStatus` enums in `@variscout/core/measurementPlan`. Sub-path export pair (`package.json` + `tsconfig.json`).
2. TDD: `MeasurementPlanAction` union + `reduceMeasurementPlans` reducer. Patch type with `Omit` lifecycle exclusion.
3. TDD: `measurementPlanIds?: MeasurementPlan['id'][]` added to `Hypothesis`. Round-trip test for serialization.
4. Dexie schema additions + repository methods (`measurementPlans.listByHypothesis` etc.) in both apps.
5. TDD: `<MeasurementPlanChip>` component.
6. TDD: `<AddPlanForm>` component with owner picker.
7. TDD: `<LinkFindingPicker>` component + auto-suggest banner UX.
8. Extend `<HypothesisCard>` to render the second half (MeasurementPlan section) + integrate the 3 new components.
9. TDD: Hypothesis-level auto-suggest banner ("Mark evidenced?") + `useViewStore` dismissal state.

---

## Out of V1 scope (explicit deferrals)

Preserved verbatim from wedge spec §3.6.5:

- **Gage R&R / formal MSA workflow** — the `msaRequired?` field is informational only in V1. No MSA calculator, no measurement-system-assessment UI. Tracked for V2.
- **Statistical sample-size calculator** — sample size is manual entry only. No power-analysis helper. Tracked for V2.
- **Auto-ingestion / sensor feeds** — re-ingestion uses the existing PasteScreen flow. Sensor / SCADA / ERP feeds defer to VariScout Process.
- **Multi-source provenance gating** — the framing-layer Slice 2/3 work (MatchSummaryCard, EvidenceSourceSync, per-source provenance) stays in flight but is not a V1 blocker; basic re-paste suffices.

Added by this design (V1 simplifications):

- **Auto-match factor + window heuristic** (wedge spec §3.6.4 line 4) — V1 ships manual `<LinkFindingPicker>` only. Auto-suggest match is V2 polish on top.
- **Symmetric Finding-side picker** — V1 ships Plan-side picker only. "Link to Plan…" from a Finding chip is V2 if pattern usage justifies it.
- **In-app Sponsor signoff** for Plans — V1 reuses the wedge §4.1 out-of-band signoff pattern. Sponsors don't gate Plan transitions.

## Acceptance criteria

PR-WV1-3a lands when:

1. `INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds exist in `MembershipAction` and `reduceProjectMembers` covers them; `INVITATION_ACCEPT` synthesizes a `PROJECT_MEMBER_ADD`.
2. `useProjectMembershipStore.acceptInvite/revokeInvite` dispatch the new actions (no more `pendingInvites[]`-only filter).
3. `<PendingInvitesBanner>` renders on Home in both apps when `pendingInvites.length > 0`; collapses when zero.
4. `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` action kinds + `reduceActionItems` exist. Patch type uses `Omit<E, 'id'|'createdAt'|'deletedAt'|'parentImprovementProjectId'>`.
5. PWA + Azure `<ImprovementView>` dispatch real actions for update/remove (no more `console.warn` stubs).
6. Tests green across `@variscout/core`, `@variscout/stores`, `@variscout/ui` touched suites, both apps. `pnpm build` + `bash scripts/pr-ready-check.sh` green.

PR-WV1-3b lands when:

7. `MeasurementPlan` type + `MeasurementPlanAction` reducer ship in `@variscout/core/measurementPlan` (new sub-path with paired exports).
8. `Hypothesis.measurementPlanIds?` field added; existing serialization round-trips it.
9. Dexie schema bumps in both apps; `measurementPlans` table reads return `MeasurementPlan[]` filtered by hypothesisId.
10. `<HypothesisCard>` renders the two-half layout (EVIDENCE + MEASUREMENT PLAN); Plans render via `<MeasurementPlanChip>`.
11. "+ Add Plan" inline affordance opens `<AddPlanForm>`; saving dispatches `MEASUREMENT_PLAN_ADD`.
12. "Link Finding…" picker on a Plan dispatches `MEASUREMENT_PLAN_LINK_FINDING`; banner suggests "Mark complete?"; confirming dispatches `MEASUREMENT_PLAN_UPDATE { status: 'complete' }`.
13. Hypothesis-level banner suggests "Mark evidenced?" when first Plan transitions to `complete`; dismissible via `useViewStore`.
14. canAccess gating respected (Lead+Member edit; Sponsor sees nothing via existing `<IPDetailPage>` placeholder route).
15. Tests + build + pr-ready-check green.

## What this preserves

- Investigation Wall canonical UX (Problem condition + AND-gate + 3 hypothesis cards + tributaries band + missing-evidence panel from PR-RPS-4) — unchanged.
- Existing `<FindingChip>` rendering + brush-to-pin flow — unchanged.
- Hypothesis status transitions (`proposed → evidenced → confirmed | refuted`) — unchanged at the data model level; only the auto-suggest UI nudge is new.
- ProjectMember model + canAccess truth table from PR-WV1-1 — unchanged.
- Active-IP cascade pattern from PR-PT-7 — preserved; MeasurementPlans live within the active IP's Approach stage.

## Open questions for V2 (not blockers for this design)

1. **Plan templates** — if specialists repeatedly create similar Plans across projects ("Sample 30 widgets from each shift"), should there be a template / clone affordance? V2 if usage data justifies.
2. **Cross-project Plan portfolio** — Lead reviewing measurement work across multiple active projects. Not in scope for V1's single-IP-scoped surfaces.
3. **Inbox surface generalization** — if pending invites + Sustainment surveys + action-due reminders accumulate, a unified Inbox tab makes sense. V1's Home banner is a single-purpose surface; promotion path is documented in `docs/investigations.md` if usage warrants.
