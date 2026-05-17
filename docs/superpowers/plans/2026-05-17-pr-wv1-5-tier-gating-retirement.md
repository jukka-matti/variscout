---
title: 'PR-WV1-5 — Tier-Gating Retirement + Nav Reorder'
status: draft
last-reviewed: 2026-05-17
parent: docs/superpowers/plans/2026-05-16-wedge-implementation.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-4-canvas-paths-persona-deletion.md
---

# PR-WV1-5 — Tier-Gating Retirement + Nav Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Sonnet for implementer + reviewers; Opus for the final-branch code review only. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire `isPaidTier()` / `hasTeamFeatures()` and the related tier/plan gating across the codebase (~33 source files post-WV1-4) under the wedge V1 single €99 SKU. Keep channel-limit constants but drop the tier dimension. Reorder the 7-tab nav to the 6-tab workflow order — `Home · Projects · Process · Analyze · Investigation · Report` — with renames (Overview→Home, Frame→Process, Analysis→Analyze) and the Improve tab deletion.

**Architecture:** Wedge V1 sells one SKU at €99/mo. All previously-tier-gated features become always-on for every customer. Where the gating was a stand-in for role-based access (e.g., signoff, audit, RACI), it switches to `canAccess(userId, members, action)` from PR-WV1-1. Where it gated genuine team-licensing features (cloud sync, knowledge base, AI multi-author), the gating just deletes — those features become baseline. The nav reorder lands Projects in slot 2 reflecting the project-centric V1 workflow.

**Tech Stack:** TypeScript + Vite + React 18 + Vitest + `@testing-library/react`. Architecture invariants per ADR-082 (wedge V1) + ADR-073/074 unchanged.

**Dependencies:** PR-WV1-1 merged (`canAccess` available), PR-WV1-2 merged (Improve stage now inside Projects), PR-WV1-4 merged (handoff retired; `HandoffForm.tsx` and `HandoffPanel.tsx` files already deleted — DO NOT touch them in this PR).

---

## Scope check — single PR, atomic surface change

This PR makes a wide but shallow sweep: ~33 files, mostly 1–3 line conditional deletions. The atomicity comes from the public-API change to `@variscout/core` (deleting `isPaidTier` + `hasTeamFeatures` exports) — once the barrel drops them, every consumer must update in the same PR or `tsc` fails.

**Slice-size note:** 7 implementation tasks + 1 controller task = 8 (at slice-size cap per `feedback_slice_size_cap`). The Apps Sweep (Task 3) is a wide-but-shallow sub-batch of ~25 files; the implementer dispatch must accept this as "single conceptual unit" rather than split.

---

## File structure

**Modify (high-touch):**

- `packages/core/src/tier.ts` — keep `validateChannelCount` + the limit constants only; delete `isPaidTier`, `hasTeamFeatures`, `shouldShowBranding`, `getBrandingText`, `getSignatureText`, `hasKnowledgeBase`, `isTeamPlan`, `getTierDescription`, `getTier`, `configureTier`, `configurePlan`, `getPlan`, `getMaxChannels`, `getTierLimits`, `isChannelLimitExceeded`, `shouldShowChannelWarning`, `getUpgradeUrl`, `isUpgradeUrlPlaceholder`, `LicenseTier`, `MarketplacePlan` types. The file shrinks from 293 lines → ~30 lines.
- `packages/core/src/__tests__/tier.test.ts` — drop tests for deleted exports; keep `validateChannelCount` tests.
- `packages/core/src/index.ts:183,200` — drop the tier function re-exports from barrel; keep `validateChannelCount` if exported.
- `apps/azure/src/lib/tierConfig.ts` — delete the `isPaidTier` + `hasTeamFeatures` re-export wrappers (lines 203, 209); consumers will import directly from `@variscout/core` for what survives (just `validateChannelCount`).

**Modify (sweep — apps + ui):**

- `apps/azure/src/App.tsx` — drop `isPaidTier()` deep-link validation; trust all link surfaces.
- `apps/azure/src/components/AppHeader.tsx` — drop sync-icon `hasTeamFeatures()` guards (lines 238, 379); nav reorder happens in Task 6.
- `apps/azure/src/components/FindingsPanel.tsx:95` — drop tier conditional.
- `apps/azure/src/components/YamazumiDashboard.tsx:43` — drop branding `isPaidTier()` (hardcode `showBranding=false`).
- `apps/azure/src/components/YamazumiWrapper.tsx:41` — same.
- `apps/azure/src/components/EditorEmptyState.tsx:59` — drop tier conditional.
- `apps/azure/src/components/editor/InvestigationWorkspace.tsx:973,980` — replace `hasTeamFeatures()` photo-handler gating with `canAccess(userId, members, 'edit-improve')` (B: tier-as-proxy-for-team → ACL).
- `apps/azure/src/components/settings/SettingsPanel.tsx:228` — drop tier conditional.
- `apps/azure/src/components/views/ReportView.tsx:683,684` — `canPublish = hasTeamFeatures()` → `canAccess(userId, members, 'view-report')` for publish UI (Sponsor can view; Lead can publish). `canShareLink = isPaidTier()` → delete (always-share now).
- `apps/azure/src/components/admin/AdminHub.tsx:37,58` — drop `hasTeamFeatures()` gating; Knowledge tab always visible.
- `apps/azure/src/components/admin/AdminKnowledgeSetup.tsx:57` — drop tier-conditional logic; KB setup always available.
- `apps/azure/src/features/ai/useAIDerivedState.ts:127` — drop `hasTeamFeatures()` guard; AI context always computes.
- `apps/azure/src/hooks/useAdminHealthChecks.ts:54` — drop tier conditional.
- `apps/azure/src/hooks/usePhotoComments.ts:41` — drop tier conditional.
- `apps/azure/src/pages/Dashboard.tsx:736,763` — drop tier conditionals.
- `apps/azure/src/pages/Editor.tsx:1906,1908` — drop tier conditionals.
- `apps/azure/src/services/storage.ts` — drop the 11 `hasTeamFeatures()` cloud-sync guards across lines 306, 438, 508, 552, 580, 600, 626, 647, 690, 713, 740, 766, 791, 813. Cloud sync becomes always-on.
- `packages/ui/src/components/IPDetail/IPDetailTeamRail.tsx:114` — drop `isPaidTier()` branding call.
- `packages/ui/src/components/IPDetail/__tests__/IPDetailTeamRail.test.tsx:3` — drop the `@variscout/core/tier` import + `configureTier` setup; test should no longer depend on tier configuration.
- `apps/azure/src/components/__tests__/ProjectsTabView.test.tsx:4` — same: drop `@variscout/core/tier` import.
- `packages/hooks/src/useTier.ts` — delete entirely; consumers either inline whatever they need or use `useUserRole` + `canAccess`. Find consumers via `grep -rn "useTier" packages/ apps/` first.
- Test files (8 total) — drop `vi.mock` overrides for the deleted functions.

**Nav reorder (Task 6):**

- `apps/azure/src/components/AppHeader.tsx` (lines ~412–462 + after) — tab list reorder + 4 renames + Improve deletion.
- `apps/pwa/src/components/layout/AppHeader.tsx` (lines 96–104) — `PHASE_TABS` array reorder + label changes. Uses i18n keys, so `workspace.*` keys may need updates in `packages/core/src/i18n/locales/*.ts`.

**ESLint enforcement (Task 7):**

- `eslint.config.js` (or equivalent at repo root) — add `no-restricted-imports` rule blocking re-introduction of `isPaidTier` / `hasTeamFeatures` from `@variscout/core`.

**No new files. No deletions of source files** except `packages/hooks/src/useTier.ts` (if confirmed unreferenced) and `apps/azure/src/lib/tierConfig.ts` (or trimmed to empty).

---

## Plan-time guardrails (from MEMORY.md)

- **`feedback_no_backcompat_clean_architecture`** — Required props by default. Don't leave `isPaidTier()` stubbed to return `true`. Delete the function and refactor all consumers in this PR.
- **`feedback_plan_call_site_reachability`** — Task 3 sub-batch (B-class call sites that need `canAccess`) MUST verify each call site has `userId` + `members` in scope before locking the replacement. Spec-Reviewer dispatch validates this per task.
- **`feedback_check_registry_placeholders_first`** — Before deleting any branch, `git log --follow` to confirm the gated feature isn't V2-deferred (would be re-added). For wedge V1, ALL tier gating retires; the spec is unambiguous.
- **`feedback_subagent_no_verify`** — Forbid `--no-verify` in implementer prompts.
- **`feedback_partial_integration_policy`** — Task 4 (channel-limit refactor) policy: PWA + Azure both consume `validateChannelCount`; the simplification drops the `tier` parameter. If existing tests pin `tier: 'free'` for the 5-channel limit assertion, they get updated in the same task (no deferral).
- **`feedback_no_gates_language`** — When sanitizing UI copy that referenced tier-gating, prefer "scaffolding / guidance / checkpoint" over "gate". This applies to any `"Upgrade to Team"` / `"Pro feature"` copy left behind.
- **`feedback_one_worktree_per_agent`** — Execution worktree: `.worktrees/feat/wedge-pr-wv1-5-tier-gating`. Main session stays at repo root.
- **`feedback_vi_mock_import_original`** — Existing tier tests already use `importActual` partial pattern (per Explore inventory); keep that pattern for any test updates.

---

## Task 1: Drop tier-function exports from `packages/core/src/tier.ts` + barrel + tests

**Files:**

- Modify: `packages/core/src/tier.ts` (full rewrite, 293 → ~35 lines)
- Modify: `packages/core/src/__tests__/tier.test.ts` (drop tests for deleted exports)
- Modify: `packages/core/src/index.ts:183,200` (drop tier re-exports)

- [ ] **Step 1: Rewrite `packages/core/src/__tests__/tier.test.ts` for the surviving surface**

The current test file (~19 uses of tier exports) covers all 13 tier functions. After this task, only `validateChannelCount` + the limit constants survive. Replace the file with:

```typescript
import { describe, it, expect } from 'vitest';
import { validateChannelCount, MAX_CHANNELS, CHANNEL_WARNING_THRESHOLD } from '../tier';

describe('validateChannelCount', () => {
  it('returns exceeded=false when count is under MAX_CHANNELS', () => {
    expect(validateChannelCount(500)).toEqual({
      exceeded: false,
      current: 500,
      max: MAX_CHANNELS,
      showWarning: false,
    });
  });

  it('returns exceeded=true when count exceeds MAX_CHANNELS', () => {
    expect(validateChannelCount(MAX_CHANNELS + 1)).toEqual({
      exceeded: true,
      current: MAX_CHANNELS + 1,
      max: MAX_CHANNELS,
      showWarning: false,
    });
  });

  it('returns showWarning=true when count is between warning threshold and max', () => {
    expect(validateChannelCount(CHANNEL_WARNING_THRESHOLD + 1)).toEqual({
      exceeded: false,
      current: CHANNEL_WARNING_THRESHOLD + 1,
      max: MAX_CHANNELS,
      showWarning: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/core test -- tier.test.ts
```

Expected: FAIL — `MAX_CHANNELS` not exported yet, old tier exports still exist.

- [ ] **Step 3: Rewrite `packages/core/src/tier.ts`**

Replace the entire file with:

```typescript
/**
 * Channel-limit helpers for the wedge V1 single SKU.
 *
 * Pre-wedge this module discriminated `free` vs `enterprise` tiers + a
 * `team` plan dimension. ADR-082 retires both: VariScout V1 is single-SKU
 * (€99/mo Azure tenant-wide). What survives is the platform channel limit.
 */

export const MAX_CHANNELS = 1500;
export const CHANNEL_WARNING_THRESHOLD = 700;

export interface ChannelLimitResult {
  exceeded: boolean;
  current: number;
  max: number;
  showWarning: boolean;
}

export function validateChannelCount(count: number): ChannelLimitResult {
  return {
    exceeded: count > MAX_CHANNELS,
    current: count,
    max: MAX_CHANNELS,
    showWarning: count > CHANNEL_WARNING_THRESHOLD && count <= MAX_CHANNELS,
  };
}
```

This drops: `LicenseTier`, `MarketplacePlan`, `TierLimits`, `configureTier`, `getTier`, `isPaidTier`, `getMaxChannels`, `getTierLimits`, `isChannelLimitExceeded`, `shouldShowChannelWarning`, `getTierDescription`, `shouldShowBranding`, `getBrandingText`, `getSignatureText`, `configurePlan`, `getPlan`, `hasTeamFeatures`, `hasKnowledgeBase`, `isTeamPlan`, `getUpgradeUrl`, `isUpgradeUrlPlaceholder`. Net delete: 21 exports.

- [ ] **Step 4: Update `packages/core/src/index.ts` barrel**

Find the tier re-export lines (around 183 + 200 per Explore inventory). Each currently re-exports a list including `isPaidTier`, `hasTeamFeatures`, etc. Update to only re-export the surviving exports:

```typescript
export {
  MAX_CHANNELS,
  CHANNEL_WARNING_THRESHOLD,
  validateChannelCount,
  type ChannelLimitResult,
} from './tier';
```

(Delete every other tier-related named export from the barrel.)

- [ ] **Step 5: Run tier tests**

```bash
pnpm --filter @variscout/core test -- tier.test.ts
```

Expected: 3/3 PASS.

Full core suite will fail because downstream consumers still import deleted exports; that's expected and Task 3 cleans them up. Do not fix downstream here.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/tier.ts packages/core/src/__tests__/tier.test.ts packages/core/src/index.ts
git commit -m "feat(wedge): collapse tier module to channel-limit helpers only"
```

---

## Task 2: Delete `apps/azure/src/lib/tierConfig.ts` re-export shim + `packages/hooks/src/useTier.ts`

**Files:**

- Delete: `apps/azure/src/lib/tierConfig.ts` (if it contains only re-exports of deleted tier functions) OR trim to empty + delete.
- Delete: `packages/hooks/src/useTier.ts` (verify zero consumers first via grep)
- Modify: `packages/hooks/src/index.ts` — drop `useTier` re-export

- [ ] **Step 1: Verify deletion-safety**

```bash
grep -rn "from.*tierConfig\b\|from.*lib/tierConfig\|useTier\b" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Get the full consumer list. Each consumer file will get edited in Task 3 (the sweep). If any consumer is in a file NOT listed in Task 3's modify set, STOP and report — Task 3's file set needs adjustment.

- [ ] **Step 2: Delete tierConfig.ts**

```bash
git rm apps/azure/src/lib/tierConfig.ts
```

- [ ] **Step 3: Delete useTier.ts + drop barrel export**

```bash
git rm packages/hooks/src/useTier.ts
```

Edit `packages/hooks/src/index.ts` — find the `export { useTier } from './useTier';` line (or similar) and delete it.

Also check `packages/hooks/src/__tests__/useTier.test.ts` — `git rm` it if it exists.

- [ ] **Step 4: Run targeted core tests**

```bash
pnpm --filter @variscout/hooks test
```

Expected: any test failure caused by the missing `useTier` export must point to a hook-test file that imports it. Those tests are dropped in this task; if a NON-test file imports `useTier`, that's a Task 3 consumer cleanup item — note in the report.

- [ ] **Step 5: Commit**

```bash
git add -A apps/azure/src/lib/tierConfig.ts packages/hooks/src/useTier.ts packages/hooks/src/index.ts
# + any deleted test file
git commit -m "feat(wedge): delete tierConfig.ts shim + useTier hook (wedge V1 single SKU)"
```

---

## Task 3: Apps + UI tier-conditional sweep (the wide-but-shallow batch)

**This is the largest single task — ~25 files, mostly 1–3 line conditional deletions. The implementer dispatch must accept this as one conceptual unit; do not split. Use `git grep` as the work-list driver.**

**Files (full list — locate each conditional by `grep -n`):**

- `apps/azure/src/App.tsx` (1 conditional)
- `apps/azure/src/components/AppHeader.tsx` (2 conditionals — sync icon at line ~238 + sync label at ~379; nav reorder happens in Task 6)
- `apps/azure/src/components/FindingsPanel.tsx` (line ~95)
- `apps/azure/src/components/YamazumiDashboard.tsx` (line 43 — drop `showBranding`)
- `apps/azure/src/components/YamazumiWrapper.tsx` (line 41 — same)
- `apps/azure/src/components/EditorEmptyState.tsx` (line 59)
- `apps/azure/src/components/settings/SettingsPanel.tsx` (line 228)
- `apps/azure/src/components/admin/AdminHub.tsx` (lines 37, 58 — drop Knowledge tab gating)
- `apps/azure/src/components/admin/AdminKnowledgeSetup.tsx` (line 57)
- `apps/azure/src/features/ai/useAIDerivedState.ts` (line 127)
- `apps/azure/src/hooks/useAdminHealthChecks.ts` (line 54)
- `apps/azure/src/hooks/usePhotoComments.ts` (line 41)
- `apps/azure/src/pages/Dashboard.tsx` (lines 736, 763)
- `apps/azure/src/pages/Editor.tsx` (lines 1906, 1908)
- `apps/azure/src/services/storage.ts` (the 11 `hasTeamFeatures()` guards — drop ALL; cloud sync always-on)
- `packages/ui/src/components/IPDetail/IPDetailTeamRail.tsx` (line 114)
- `apps/azure/src/components/__tests__/ProjectsTabView.test.tsx` (drop `@variscout/core/tier` import; remove `configureTier` setup; the test should pass without tier configuration since the function no longer exists)
- `packages/ui/src/components/IPDetail/__tests__/IPDetailTeamRail.test.tsx` (same)

**Special case — ACL replacement (B-class — `canAccess` rewiring):**

- `apps/azure/src/components/editor/InvestigationWorkspace.tsx:973,980` — currently `hasTeamFeatures() ? renderActionAssigneePicker : undefined`. Replace with:

  ```typescript
  const userRole = useUserRole(userId, projectId); // from @variscout/stores
  const canEdit = canAccess(userId, members, 'edit-improve');
  // ...
  handleAddPhoto={canEdit ? renderActionAssigneePicker : undefined}
  ```

  **Call-site reachability check**: confirm `userId`, `projectId`, and `members` are available at this call site. If not, STOP and report — the rewiring requires plumbing prop changes that exceed Task 3's scope.

- `apps/azure/src/components/views/ReportView.tsx:683,684`:
  - `const canPublish = hasTeamFeatures();` → `const canPublish = canAccess(userId, members, 'view-report');` (Sponsor can view; Lead publishes). Same reachability check.
  - `const canShareLink = isPaidTier();` → delete the binding + always-render the share link control.

- [ ] **Step 1: Audit reachability**

For each B-class call site (the two InvestigationWorkspace + ReportView entries), run:

```bash
grep -n "userId\|projectId\|members\b" apps/azure/src/components/editor/InvestigationWorkspace.tsx | head -10
grep -n "userId\|projectId\|members\b" apps/azure/src/components/views/ReportView.tsx | head -10
```

Confirm each variable is in scope at the gating line. If not, STOP and report `DONE_WITH_CONCERNS` — plumbing may need a prop addition.

- [ ] **Step 2: Pure-tier-check sweep (A-class)**

For each non-B-class file in the list above, `grep -n "isPaidTier\|hasTeamFeatures"` to locate the conditional, then delete the branch (keep the always-true / always-paid path). Examples:

Before:

```typescript
if (!hasTeamFeatures()) return;
doTheThing();
```

After:

```typescript
doTheThing();
```

Before:

```typescript
{isPaidTier() && <FeatureBadge />}
```

After:

```typescript
<FeatureBadge />
```

For `YamazumiDashboard.tsx:43` + `YamazumiWrapper.tsx:41` (`showBranding = !isPaidTier()` → branding only for free tier): hardcode `showBranding = false` since all customers are now paid. If the variable is used elsewhere, keep the const declaration but with the literal `false`; if it's the only consumer, inline the `false`.

For `IPDetailTeamRail.tsx:114` (`const paid = isPaidTier(); ...{paid ? Logo : null}`): hardcode the paid-true branch.

- [ ] **Step 3: storage.ts cloud-sync simplification**

`apps/azure/src/services/storage.ts` has 11 `hasTeamFeatures()` guards (lines 306, 438, 508, 552, 580, 600, 626, 647, 690, 713, 740, 766, 791, 813). Each follows the pattern:

```typescript
if (!hasTeamFeatures()) {
  setSyncStatus({ state: 'free-tier' });
  return;
}
// ...sync logic...
```

Delete every early-return + the setSyncStatus call. Cloud sync becomes always-on. If `setSyncStatus({ state: 'free-tier' })` is the only producer of that state value, also remove the union variant from `SyncStatus['state']`.

- [ ] **Step 4: B-class ACL rewiring (if reachability check passed)**

Replace the two `InvestigationWorkspace.tsx` gates + the `canPublish` gate in `ReportView.tsx` with `canAccess(userId, members, 'edit-improve' | 'view-report')` calls.

If reachability requires adding props (e.g., `userId` not in scope), do that wiring in this PR — internal package APIs add required props as needed (per `feedback_no_backcompat_clean_architecture`).

- [ ] **Step 5: Drop test-file tier mocks (the 8 test files)**

Each test file in `apps/azure/src/components/__tests__/AdminKnowledgeSetup.test.tsx`, `apps/azure/src/components/editor/__tests__/InvestigationWorkspace.mapwall.test.tsx`, `apps/azure/src/hooks/__tests__/useAdminHealthChecks.test.ts`, `apps/azure/src/hooks/__tests__/usePhotoComments.test.ts`, `apps/azure/src/pages/__tests__/Editor.test.tsx`, `apps/azure/src/services/__tests__/storage.test.ts`:

Find the `vi.mock('@variscout/core', async () => { ...; hasTeamFeatures: vi.fn(); ... })` blocks. Drop the `hasTeamFeatures` / `isPaidTier` overrides. If a test's logic depends on the mock toggle (e.g., "renders X only when hasTeamFeatures is true"), the test either deletes (the toggle is gone) or re-purposes to verify the always-on behavior.

Keep the `importActual` partial pattern intact (per `.claude/rules/testing.md`).

- [ ] **Step 6: Verify zero remaining references**

```bash
grep -rn "isPaidTier\|hasTeamFeatures" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Expect zero hits except possibly:

- `packages/core/src/tier.ts` if any surviving doc-comment mentions retired surface (clean it up if so)
- Snapshot files (`.snap`) that may need regeneration

If hits remain, fix them. The next task adds an ESLint rule preventing reintroduction.

- [ ] **Step 7: Run targeted tests**

```bash
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test
```

All must PASS. Note any failure that isn't tied to this task's edits (pre-existing).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(wedge): retire isPaidTier + hasTeamFeatures call sites (apps + ui sweep)"
```

---

## Task 4: Channel-limit refactor finalization + downstream limit consumers

**Files:**

- Modify: any file consuming `validateChannelCount(count, tier)` with a 2-arg call signature — drop the `tier` arg.
- Modify: any test pinning a `tier: 'free'` expectation to a 5-channel limit assertion — update to the unified `MAX_CHANNELS = 1500` constant.

**Partial-integration policy (per the plan-time guardrail):** `MAX_CHANNELS` is now `1500` for all customers. Previously the PWA build assumed `5` for the free tier. If existing tests assert `max: 5`, update them to `max: 1500` in this task — no deferral.

If platform separation is still meaningful (e.g., PWA's browser-only constraint genuinely caps at 5 for stability reasons), introduce a NEW constant `PWA_BROWSER_CHANNEL_LIMIT` driven by app-config, NOT by the tier dimension. **Decision check:** unless an active comment or ADR justifies the 5-channel PWA cap as a platform constraint (not a tier feature), keep the unified 1500 limit.

- [ ] **Step 1: Find all `validateChannelCount` call sites**

```bash
grep -rn "validateChannelCount" packages/ apps/ --include="*.ts" --include="*.tsx"
```

For each, drop the `tier` arg if present:

Before:

```typescript
validateChannelCount(count, 'enterprise');
validateChannelCount(count, tier);
```

After:

```typescript
validateChannelCount(count);
```

- [ ] **Step 2: Update channel-limit consumer tests**

`grep -rn "max: 5\|max: 1500\|maxChannels" packages/ apps/ --include="*.test.*"` — find tests pinning the old per-tier limits. Update to `max: MAX_CHANNELS` (1500).

If a test asserts the free-tier 5-channel limit, the wedge V1 invalidates that assertion. Update to the unified limit OR delete the test if it was specifically testing the tier discrimination.

- [ ] **Step 3: Run channel-limit tests**

```bash
pnpm --filter @variscout/core test -- tier.test.ts
pnpm --filter @variscout/ui test -- 'channel'
pnpm --filter @variscout/azure-app test -- 'channel'
```

All must PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(wedge): unify channel limit at MAX_CHANNELS (drop tier dimension)"
```

---

## Task 5: Sanitize UI copy for retired tier-gating language

**Files:**

- Modify: any file with surviving "Upgrade to Team" / "Pro feature" / "Free tier" copy (search `grep -rn "Upgrade to Team\|Pro feature\|Free tier\|Team tier\|paid tier" packages/ apps/`)
- Modify: i18n locales (`packages/core/src/i18n/locales/*.ts`) — drop keys referring to tier upgrades / paid features

Per `feedback_no_gates_language`: when removing UI copy that referenced tier gating, prefer "scaffolding / guidance / checkpoint" over "gate" where rephrasing is needed.

- [ ] **Step 1: Audit copy strings**

```bash
grep -rn "Upgrade to Team\|Pro feature\|Free tier\|Team tier\|paid tier\|Upgrade.*plan" packages/ apps/ --include="*.ts" --include="*.tsx" --include="*.json"
```

Categorize each hit:

- Copy in JSX (literal strings or `t('upgrade.cta')` calls) — delete the JSX block (the upgrade CTA is meaningless under single SKU).
- i18n keys (`packages/core/src/i18n/locales/en.ts` etc.) — delete unused keys.

- [ ] **Step 2: Drop the upgrade-CTA JSX and unused i18n keys**

For each hit, surgically remove the offending block. If a component existed solely to render the upgrade CTA (e.g., `UpgradePrompt.tsx`), delete it AND its barrel re-exports.

- [ ] **Step 3: Verify no broken translations**

```bash
pnpm docs:check
```

Must pass — frontmatter + cross-ref check.

Run i18n consistency check if present:

```bash
pnpm --filter @variscout/core test -- i18n
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(wedge): drop tier-upgrade UI copy + unused i18n keys"
```

---

## Task 6: Nav reorder + tab renames + Improve tab deletion

**Files:**

- Modify: `apps/azure/src/components/AppHeader.tsx` (tab list around lines 412–462+)
- Modify: `apps/pwa/src/components/layout/AppHeader.tsx` (`PHASE_TABS` lines 96–104)
- Modify: i18n locales (`packages/core/src/i18n/locales/*.ts`) — update `workspace.frame` → `workspace.process`, etc.
- Modify: any test asserting on tab labels or ordering (`grep -rln "view-toggle-overview\|view-toggle-frame\|view-toggle-analysis\|view-toggle-improvement"` packages/ apps/`)

**Target order:** `Home · Projects · Process · Analyze · Investigation · Report` (6 tabs)

**Mapping (per Explore inventory):**

| Current (Azure + PWA)         | New           | Action                                               |
| ----------------------------- | ------------- | ---------------------------------------------------- |
| Overview / home               | Home          | Rename Azure copy to "Home"; PWA already says "Home" |
| Frame / frame                 | Process       | Rename + move to slot 3                              |
| Analysis / analysis           | Analyze       | Rename + keep slot 4                                 |
| Investigation / investigation | Investigation | Keep slot 5                                          |
| Improve / improvement         | DELETE        | Deletion                                             |
| Projects / projects           | Projects      | Move to slot 2                                       |
| Report / report               | Report        | Keep last slot                                       |

- [ ] **Step 1: Update PWA `PHASE_TABS`**

Replace `packages/pwa/src/components/layout/AppHeader.tsx` lines 96–104 with the new 6-tab list in target order:

```typescript
const PHASE_TABS: { id: PhaseId; labelKey: keyof MessageCatalog }[] = [
  { id: 'home', labelKey: 'workspace.home' },
  { id: 'projects', labelKey: 'workspace.project' },
  { id: 'process', labelKey: 'workspace.process' },
  { id: 'analysis', labelKey: 'workspace.analyze' },
  { id: 'investigation', labelKey: 'workspace.investigation' },
  { id: 'report', labelKey: 'workspace.report' },
];
```

Note: `'frame'` becomes `'process'` and `'analysis'` stays as the PhaseId but the i18n label is `workspace.analyze`. Decide based on what the `PhaseId` union allows — if `'process'` is not a valid PhaseId yet, you must:

1. Add `'process'` to the `PhaseId` union type (find it in `packages/hooks/` or similar).
2. Update any router / route-config that switches on `'frame'` to `'process'`.

If touching the union cascades into 10+ files, you may keep `'frame'` as the internal PhaseId and only change the display label. Document the choice.

Drop the `'improvement'` entry entirely.

- [ ] **Step 2: Update Azure `AppHeader.tsx` tab list**

Find the tab JSX list around lines 412–462+. Replace with 6 tabs in target order. Update the `data-testid` values:

- `view-toggle-overview` → `view-toggle-home`
- `view-toggle-frame` → `view-toggle-process`
- `view-toggle-analysis` → `view-toggle-analyze`
- `view-toggle-investigation` (unchanged)
- `view-toggle-improvement` → DELETE
- `view-toggle-projects` (unchanged; move to slot 2)
- `view-toggle-report` (unchanged; move to slot 6)

Move the Projects tab JSX to slot 2 + drop the Improve tab JSX. Update any handler names (e.g., `showFrame()` → `showProcess()`) — find the handlers via `grep -n "showFrame\|showImprovement" apps/azure/src/`.

- [ ] **Step 3: Update i18n keys**

In `packages/core/src/i18n/locales/en.ts` (and any other locales):

- Rename `workspace.frame` → `workspace.process` (value: `'Process'`)
- Rename `workspace.analysis` → `workspace.analyze` (value: `'Analyze'`)
- Add `workspace.home` (value: `'Home'`) if not present
- Drop `workspace.improve` / `workspace.improvement` keys

Check each locale file (`en.ts`, `de.ts`, `es.ts`, `zhHans.ts`, etc.) — apply the same key changes.

- [ ] **Step 4: Update consumers + tests**

Grep for `data-testid="view-toggle-*"` callers:

```bash
grep -rn 'view-toggle-overview\|view-toggle-frame\|view-toggle-analysis\|view-toggle-improvement' packages/ apps/ --include="*.tsx" --include="*.ts"
```

Each test referencing the old testids gets updated. E2E tests in `apps/pwa/e2e/` may also need updates — search:

```bash
grep -rn "view-toggle-overview\|view-toggle-frame\|view-toggle-improvement" apps/pwa/e2e/ apps/azure/e2e/ 2>/dev/null
```

Update each occurrence.

- [ ] **Step 5: Run nav-related tests**

```bash
pnpm --filter @variscout/ui test
pnpm --filter @variscout/azure-app test -- AppHeader
pnpm --filter @variscout/pwa test -- AppHeader
```

All must PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(wedge): nav reorder + renames (6-tab workflow order)"
```

---

## Task 7: ESLint reintroduction guard + final reachability sweep

**Files:**

- Modify: `eslint.config.js` (or `.eslintrc.cjs` — confirm with `ls -la .eslintrc*` + `ls eslint.config*`)

**Add a `no-restricted-imports` rule blocking re-introduction of the retired tier functions:**

```javascript
{
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@variscout/core',
            importNames: [
              'isPaidTier',
              'hasTeamFeatures',
              'shouldShowBranding',
              'hasKnowledgeBase',
              'isTeamPlan',
              'configureTier',
              'configurePlan',
              'getTier',
              'getPlan',
            ],
            message: 'Tier gating retired in wedge V1 (ADR-082). Use canAccess(userId, members, action) from @variscout/core/projectMembership for role-based access; otherwise just delete the conditional.',
          },
        ],
      },
    ],
  },
}
```

If a flat-config `eslint.config.js`, place this inside the rule block of the base config. If `.eslintrc.cjs`, adapt to the legacy shape.

- [ ] **Step 1: Add the rule**

Edit the eslint config to add the `no-restricted-imports` rule above.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: clean. If any file still imports a retired name, that's a Task 3 miss — fix it now.

- [ ] **Step 3: Run zero-reference grep**

```bash
grep -rn "isPaidTier\|hasTeamFeatures\|shouldShowBranding\|hasKnowledgeBase\|isTeamPlan" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Expect zero hits except possibly in `packages/core/src/tier.ts` doc-comment context (acceptable). Anything else = fix.

- [ ] **Step 4: Architecture sanity check**

```bash
bash scripts/check-level-boundaries.sh
pnpm test
pnpm build
```

All must PASS.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js
git commit -m "feat(wedge): add ESLint guard preventing reintroduction of retired tier functions"
```

---

## Task 8: Browser walk + pr-ready-check + PR-open (controller-level)

- [ ] **Step 1: Full sweep**

```bash
bash scripts/pr-ready-check.sh
```

Expected: GREEN. Do NOT use `--no-verify` to skip hook failures.

- [ ] **Step 2: Browser walk via `claude --chrome`**

```bash
pnpm dev
```

In a separate Claude session with the official Chrome extension:

1. Open PWA at `http://localhost:5173`. **Assert**: nav shows 6 tabs in order `Home · Projects · Process · Analyze · Investigation · Report`. No "Improve" tab. No "Overview" / "Frame" / "Analysis" labels.
2. Click each tab — all routes resolve correctly.
3. Click into a project → Improve stage → photo handler available (no "team-tier" gate).
4. Open Report tab → publish + share controls always visible.
5. Open Admin → Knowledge Base setup always visible (no tier gate).
6. Open Settings → no upgrade-CTA banner.
7. Trigger a sustainment auto-fire (project → phase 'sustain') — still works per ADR-080.

Repeat for Azure app (`pnpm --filter @variscout/azure-app dev`).

If anything regresses, fix in-PR.

- [ ] **Step 3: Self-review diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
git diff main..HEAD | grep -iE "@ts-ignore|@ts-expect-error|Math\.random|--no-verify|// removed|// deprecated|isPaidTier\b|hasTeamFeatures\b" | head -20
```

Expect zero matches on the forbidden patterns. ~33 files changed, net ~-500 lines.

- [ ] **Step 4: PR-open**

```bash
git push origin feat/wedge-pr-wv1-5-tier-gating
gh pr create --title "feat(wedge): PR-WV1-5 — tier-gating retirement + nav reorder" --body "$(cat <<'EOF'
## Summary

Retire `isPaidTier()` / `hasTeamFeatures()` and the tier/plan gating across the codebase (33 files post-WV1-4) under the wedge V1 single €99 SKU. Reorder the 7-tab nav to the 6-tab workflow order Home · Projects · Process · Analyze · Investigation · Report.

## What changed

**Core:**
- `packages/core/src/tier.ts` — collapsed from 293 to ~35 lines; only `validateChannelCount` + limit constants survive. All 21 tier-discriminating exports retired.
- Barrel re-exports + `useTier` hook + `tierConfig.ts` shim all deleted.
- Channel limit unified at 1500 (was 5 for free, 1500 for enterprise).

**Apps + UI sweep (~25 files):**
- Every `if (!hasTeamFeatures())` / `if (isPaidTier())` conditional branch retired. Features become always-on.
- Cloud sync, Knowledge Base, AI multi-author, photo handlers, branding: all baseline.
- B-class role-based access (publish, edit-improve) replaced with `canAccess(userId, members, action)` from PR-WV1-1.

**Nav (Azure + PWA):**
- 7 → 6 tabs.
- Overview→Home, Frame→Process, Analysis→Analyze renames.
- Improve tab deleted (workflow lives inside Projects detail per PR-WV1-2).
- Projects moves to slot 2 (project-centric V1 workflow).

**ESLint guard:**
- `no-restricted-imports` rule blocks re-introduction of the retired tier functions.

## Plan

Sub-plan: `docs/superpowers/plans/2026-05-17-pr-wv1-5-tier-gating-retirement.md`
Master sequencer: `docs/superpowers/plans/2026-05-16-wedge-implementation.md`

## Test plan

- [x] `pnpm test` (turbo) green
- [x] `pnpm build` (turbo) green
- [x] `bash scripts/pr-ready-check.sh` green
- [x] ESLint guard prevents reintroduction
- [ ] Browser walk: 6 tabs in workflow order; all features always-on; no upgrade CTAs

## Wedge progress

- [x] PR-WV1-1 — project membership foundation (#183)
- [x] PR-WV1-2 — Improve workspace migration (#185)
- [x] PR-WV1-3 — Investigation Wall + Measurement Plans (#186)
- [x] PR-WV1-4 — Canvas paths 5→3 + handoff retirement (#187)
- [x] PR-WV1-5 — Tier-gating retirement + nav reorder (this PR)
- [ ] PR-WV1-6 — Azure Marketplace SKU + customer migration
EOF
)"
```

- [ ] **Step 5: Dispatch Opus final code review**

Per the wedge convention. Reviewer must check out the PR branch (per `feedback_code_review_subagent_must_checkout_pr_branch`).

- [ ] **Step 6: Hand back to user for squash-merge**

Do NOT auto-merge.

---

## Self-review checklist

- [x] **Spec coverage**: every file mentioned in master sequencer §"PR-WV1-5" is assigned to a task.
- [x] **No placeholders**: every step has concrete code/command; no "TBD" / "similar to Task N".
- [x] **Type consistency**: `MAX_CHANNELS = 1500`, `CHANNEL_WARNING_THRESHOLD = 700`, `ChannelLimitResult` (4 fields), `canAccess(userId, members, action)` — same shape across all tasks.
- [x] **Slice-size cap**: 8 tasks (at cap). Task 3 is wide but conceptually atomic (sweep); split is not warranted.
- [x] **Partial-integration policy**: declared upfront for Task 4 (channel limit) — update tests in same task.
- [x] **Guardrails applied**: call-site reachability gated for B-class rewires; slice cap honored; no `--no-verify`; ESLint guard added post-deletion to prevent reintroduction; one-worktree-per-agent in execution; no "gate" language in UI copy sanitization.
- [x] **Test fixture style**: existing tier tests already use `importActual` partial pattern — keep that pattern.
- [x] **ADR-080 preservation**: nav reorder doesn't touch sustainment auto-fire.

---

## Execution handoff

Plan complete. Recommended execution:

**Subagent-driven** — fresh Sonnet implementer per task; Sonnet spec + quality reviewer pair per task; Opus final code-reviewer at branch end. Skip `pr-ready-check.sh` in implementer prompts (controller runs full sweep before PR-open). Worktree: `.worktrees/feat/wedge-pr-wv1-5-tier-gating`. Branch from main (must be on or after PR-WV1-4's merge).
