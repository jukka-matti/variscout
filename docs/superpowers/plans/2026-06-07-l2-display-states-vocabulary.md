---
tier: ephemeral
purpose: build
title: 'L-2 — Display states and vocabulary'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/superpowers/plans/2026-06-07-demo-readiness-master-plan.md
  - docs/superpowers/plans/2026-06-07-l1-evidence-angle-picker.md
---

# L-2: Display States and Vocabulary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the Analyze Wall read as "suspected cause" plus the 3 displayed states Suspected / Verified / Ruled out, while preserving the stored 5-value `HypothesisStatus` model and retiring the unexplained Analyze phase chrome chip.

**Architecture:** This is a presentation-layer change. Stored statuses, Azure serialization, `deriveHypothesisStatus`, and Report grouping stay on the existing 5-value enum. A single shared display helper maps the stored enum to the 3 displayed states; UI surfaces import that helper instead of copying six local maps. Vocabulary edits update existing i18n keys across the closed 32-catalog `MessageCatalog`; no key renames.

**Tech Stack:** TypeScript, React, `@variscout/core` i18n/findings, `@variscout/ui`, PWA + Azure app parity, Vitest + RTL.

**Worktree/branch:** `feat/l2-display-states-vocabulary`. Task 0 authored this contract only; implementation waits for owner review. See §Self-merge gates for the later implementation PR.

---

## Constraints

- Do NOT change `HypothesisStatus` in `packages/core/src/findings/types.ts`.
- Do NOT change `apps/azure/src/services/analyzeSerializer.ts`, `deriveHypothesisStatus`, `groupHypothesesByStatus`, Report cause/open-question grouping, or `packages/core/src/findings/mechanismBranch.ts` identifiers.
- Do NOT change `packages/charts/src/EvidenceMap/SynthesisLayer.tsx` `getStatusColor`; it is a stored-enum color map. Only adjacent text labels may change if grep shows user-facing old labels remain there.
- Catalog work is value-only. Keep keys such as `wall.status.confirmed`; its value changes from "Supported" / "Confirmed" placeholders to "Verified".
- All 32 catalogs in `packages/core/src/i18n/messages/` must receive the same English placeholder values for the L-2 keys. `MessageCatalog` is closed; partial locale edits are a build break.
- The status `<select>` in `HypothesisCardWithPlans` keeps all five stored option values. Multiple values may display as "Suspected"; the option `value` attributes remain the authoritative stored enum values.
- D7 removes visible `AnalyzePhaseBadge` chrome only. `AnalyzePhase`, `detectInvestigationPhase`, CoScout phase props/prompts, and `docs/03-features/workflows/analyze-lifecycle-map.md` stay untouched.
- `findings/mechanismBranch.ts` code identifiers stay. Test assertions matching `/mechanism branch/i` must be updated by grep, not by trusting a count.

## Scope Fence

IN: one shared 3-state display helper, Analyze Wall card/list/status-control display labels, Report/Conclusion/HubCard status labels, §8 vocabulary values across all catalogs, PWA/Azure hub minters, `WallArrival` CTA, and D7 badge unmount/export retirement.

OUT: enum rename, persistence migration, Azure serializer normalization, Report section regrouping, status automation, evidence-angle capture, activity layer, fit-to-content, causes matrix, lifecycle docs, and locale translation beyond English placeholders.

---

### Task 1: Shared 3-state display helper

**Files:**

- Create: `packages/core/src/findings/hypothesisStatusDisplay.ts`
- Modify: `packages/core/src/findings/index.ts`
- Modify: `packages/core/src/index.ts` only if root imports are needed by touched UI files
- Test: `packages/core/src/findings/__tests__/hypothesisStatusDisplay.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { displayHypothesisStatus, getHypothesisDisplayStatus } from '../hypothesisStatusDisplay';

describe('hypothesis display status', () => {
  it('maps the stored 5-value status model to the 3 displayed states', () => {
    expect(displayHypothesisStatus('proposed').label).toBe('Suspected');
    expect(displayHypothesisStatus('evidenced').label).toBe('Suspected');
    expect(displayHypothesisStatus('needs-disconfirmation').label).toBe('Suspected');
    expect(displayHypothesisStatus('evidence-survived-test').label).toBe('Verified');
    expect(displayHypothesisStatus('refuted').label).toBe('Ruled out');

    expect(getHypothesisDisplayStatus('proposed')).toBe('suspected');
    expect(getHypothesisDisplayStatus('evidence-survived-test')).toBe('verified');
    expect(getHypothesisDisplayStatus('refuted')).toBe('ruled-out');
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm --filter @variscout/core test -- hypothesisStatusDisplay`

Expected: FAIL because `hypothesisStatusDisplay` does not exist.

- [ ] **Step 3: Implement the helper**

```ts
import type { HypothesisStatus } from './types';

export type HypothesisDisplayStatus = 'suspected' | 'verified' | 'ruled-out';

export interface HypothesisStatusDisplay {
  status: HypothesisDisplayStatus;
  label: 'Suspected' | 'Verified' | 'Ruled out';
}

const DISPLAY_STATUS_BY_STORED_STATUS: Record<HypothesisStatus, HypothesisStatusDisplay> = {
  proposed: { status: 'suspected', label: 'Suspected' },
  evidenced: { status: 'suspected', label: 'Suspected' },
  'needs-disconfirmation': { status: 'suspected', label: 'Suspected' },
  'evidence-survived-test': { status: 'verified', label: 'Verified' },
  refuted: { status: 'ruled-out', label: 'Ruled out' },
};

export function displayHypothesisStatus(status: HypothesisStatus): HypothesisStatusDisplay {
  return DISPLAY_STATUS_BY_STORED_STATUS[status];
}

export function getHypothesisDisplayStatus(status: HypothesisStatus): HypothesisDisplayStatus {
  return displayHypothesisStatus(status).status;
}
```

Export it from `packages/core/src/findings/index.ts`:

```ts
export {
  displayHypothesisStatus,
  getHypothesisDisplayStatus,
  type HypothesisDisplayStatus,
  type HypothesisStatusDisplay,
} from './hypothesisStatusDisplay';
```

- [ ] **Step 4: Run it — PASS**

Run: `pnpm --filter @variscout/core test -- hypothesisStatusDisplay`

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/hypothesisStatusDisplay.ts packages/core/src/findings/index.ts packages/core/src/findings/__tests__/hypothesisStatusDisplay.test.ts
git commit -m "feat(core): add hypothesis display status helper"
```

### Task 2: Use the helper on status display surfaces

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCard.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/MobileCardList.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/HypothesisCardWithPlans.tsx`
- Modify: `packages/ui/src/components/ReportView/ReportImprovementSummary.tsx`
- Modify: `packages/ui/src/components/ProcessIntelligencePanel/ConclusionCard.tsx`
- Modify: `packages/ui/src/components/AnalyzeConclusion/HubCard.tsx`
- Optional text-only modify: `packages/charts/src/EvidenceMap/SynthesisLayer.tsx` labels only; leave `getStatusColor` unchanged
- Test: existing component tests named by the files above

- [ ] **Step 1: Write failing display tests**

Update or add focused assertions:

```tsx
expect(screen.getByText(/Suspected cause/i)).toBeInTheDocument();
expect(screen.getByText('Suspected')).toBeInTheDocument();
expect(screen.queryByText('Proposed')).not.toBeInTheDocument();
expect(screen.queryByText('Evidenced')).not.toBeInTheDocument();
expect(screen.queryByText('Needs disconfirmation')).not.toBeInTheDocument();
```

For `ReportImprovementSummary`, render one question per stored status and assert visible badges:

```tsx
expect(screen.getAllByText('Suspected')).toHaveLength(3);
expect(screen.getByText('Verified')).toBeInTheDocument();
expect(screen.getByText('Ruled out')).toBeInTheDocument();
```

For `HypothesisCardWithPlans`, keep the stored option value assertion:

```tsx
const control = screen.getByTestId('analyst-set-status-control') as HTMLSelectElement;
expect(Array.from(control.options).map(option => option.value)).toEqual([
  'proposed',
  'evidenced',
  'needs-disconfirmation',
  'evidence-survived-test',
  'refuted',
]);
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter @variscout/ui test -- HypothesisCard MobileCardList HypothesisCardWithPlans ReportImprovementSummary ConclusionCard`

Expected: FAIL on old labels and old ladder copy.

- [ ] **Step 3: Replace local label maps**

Use the helper in all named UI components:

```ts
import { displayHypothesisStatus, getHypothesisDisplayStatus } from '@variscout/core/findings';
```

Replace local display labels with:

```ts
const statusLabel = displayHypothesisStatus(status).label;
```

Keep stored status attributes where they are used as persistence/debug seams:

```tsx
data-status={status}
```

For display-only color grouping in `ReportImprovementSummary`, `ConclusionCard`, and `HubCard`, group by `getHypothesisDisplayStatus(status)` so suspected statuses share one visual treatment:

```ts
const DISPLAY_STATUS_COLORS: Record<HypothesisDisplayStatus, string> = {
  suspected: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  'ruled-out': 'bg-slate-100 text-slate-700',
};
```

- [ ] **Step 4: Remove the 5-rung teaching ladder**

In `HypothesisCardWithPlans`, delete the `status-ladder` block that teaches `Proposed -> Evidenced -> Needs disconfirmation -> Supported / Refuted`. Replace it with compact plain-language copy:

```tsx
<div data-testid="status-summary" className="rounded border border-gray-200 p-2">
  <div className="text-[11px] font-semibold text-gray-700">Displayed state</div>
  <div className="mt-1 text-[11px] leading-tight text-gray-600">
    Suspected causes stay suspected until they survive a deliberate break attempt or are ruled out.
  </div>
</div>
```

Rewrite proposal-chip labels while keeping the stored target status:

```ts
label: `${refutingCount} refuting finding${refutingCount === 1 ? '' : 's'} - mark Ruled out?`,
status: 'refuted' as HypothesisStatus,
```

```ts
label: `${survivedAttemptCount} survived break attempt${survivedAttemptCount === 1 ? '' : 's'} - mark Verified?`,
status: 'evidence-survived-test' as HypothesisStatus,
```

```ts
label: 'Evidence logged - keep marked Suspected',
status: 'needs-disconfirmation' as HypothesisStatus,
```

```ts
label: `${supportCount} supporting finding${supportCount === 1 ? '' : 's'} - mark Suspected?`,
status: 'evidenced' as HypothesisStatus,
```

- [ ] **Step 5: Run tests — PASS**

Run: `pnpm --filter @variscout/ui test -- HypothesisCard MobileCardList HypothesisCardWithPlans ReportImprovementSummary ConclusionCard`

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall packages/ui/src/components/ReportView packages/ui/src/components/ProcessIntelligencePanel packages/ui/src/components/AnalyzeConclusion packages/charts/src/EvidenceMap/SynthesisLayer.tsx
git commit -m "feat(ui): display hypothesis statuses as three states"
```

### Task 3: Catalog value sweep across all 32 locales

**Files:**

- Modify: `packages/core/src/i18n/messages/*.ts`
- Modify: `packages/core/src/i18n/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing i18n guard**

Add this test under `describe('Investigation Wall keys', ...)`:

```ts
const L2_WALL_VALUES = {
  'wall.status.proposed': 'Suspected',
  'wall.status.evidenced': 'Suspected',
  'wall.status.confirmed': 'Verified',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Verified?',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.empty.ariaLabel': 'Suspected cause empty state',
  'wall.empty.title': 'Start a suspected cause',
  'wall.empty.writeHypothesis': 'Add a suspected cause',
  'wall.canvas.ariaLabel': 'Suspected cause workspace',
  'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
} as const;

it('uses L-2 English placeholder values for the display-state vocabulary in every locale', () => {
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(L2_WALL_VALUES)) {
      expect(getMessage(locale, key as keyof MessageCatalog)).toBe(value);
    }
  }
});
```

Update the existing English assertions:

```ts
expect(getMessage('en', 'wall.status.proposed')).toBe('Suspected');
expect(getMessage('en', 'wall.empty.title')).toBe('Start a suspected cause');
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm --filter @variscout/core test -- i18n`

Expected: FAIL because catalogs still contain old values.

- [ ] **Step 3: Update all catalogs**

For every file in `packages/core/src/i18n/messages/`, set these exact values:

```ts
'wall.status.proposed': 'Suspected',
'wall.status.evidenced': 'Suspected',
'wall.status.confirmed': 'Verified',
'wall.status.refuted': 'Ruled out',
'wall.status.needsDisconfirmation': 'Suspected',
'wall.status.suggestSupported': '2 evidence types + a survived test — mark Verified?',
'wall.card.hypothesisLabel': 'Suspected cause',
'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
'wall.empty.ariaLabel': 'Suspected cause empty state',
'wall.empty.title': 'Start a suspected cause',
'wall.empty.writeHypothesis': 'Add a suspected cause',
'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
'wall.canvas.ariaLabel': 'Suspected cause workspace',
```

Also update nearby English comments in `en.ts` so they no longer say "Supported" is the target word.

- [ ] **Step 4: Run tests — PASS**

Run: `pnpm --filter @variscout/core test -- i18n`

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/i18n
git commit -m "feat(i18n): update wall vocabulary for suspected causes"
```

### Task 4: Hub minters and Wall arrival CTA

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/WallArrival.tsx`
- Modify: `packages/stores/src/analyzeStore.ts` only if grep shows the store auto-minter is user-facing in the current flow
- Tests: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`
- Tests: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`
- Tests: `packages/stores/src/__tests__/analyzeStore.test.ts` if the store minter changes

- [ ] **Step 1: Write/update failing tests**

PWA expectations:

```ts
expect(screen.getByRole('button', { name: /Add a suspected cause/i })).toBeInTheDocument();
expect(hubs[0].name).toBe('New suspected cause');
```

Azure expectations:

```ts
expect((createHub.mock.calls[0] as unknown[])[0]).toBe('New suspected cause');
expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected cause: Shift');
expect((createHub.mock.calls[1] as unknown[])[0]).toBe('Suspected cause: Machine');
```

Store test, only if the store minter remains a reachable user-facing path:

```ts
expect(useAnalyzeStore.getState().hypotheses[0].name).toBe('New suspected cause');
expect(persisted.name.startsWith('Suspected cause:')).toBe(true);
```

- [ ] **Step 2: Run tests — expect FAIL**

Run:

```bash
pnpm --filter @variscout/pwa test -- AnalyzeView.mapwall
pnpm --filter @variscout/azure-app test -- AnalyzeWorkspace.mapwall
pnpm --filter @variscout/stores test -- analyzeStore.test.ts
```

- [ ] **Step 3: Implement minter and CTA copy**

PWA:

```ts
useAnalyzeStore.getState().createHub('New suspected cause', '');
store.createHub(`Suspected cause: ${factor}`, '');
```

Azure:

```ts
hypothesesState.createHub('New suspected cause', '');
hypothesesState.createHub(`Suspected cause: ${factor}`, '');
```

Wall arrival:

```tsx
Add a suspected cause
```

Store minter, if changed:

```ts
const name = excerpt.length > 0 ? `Suspected cause: ${excerpt}` : 'New suspected cause';
```

- [ ] **Step 4: Run tests — PASS**

Run the three commands from Step 2.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx apps/azure/src/components/editor/AnalyzeWorkspace.tsx apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx packages/ui/src/components/AnalyzeWall/WallArrival.tsx packages/stores/src/analyzeStore.ts packages/stores/src/__tests__/analyzeStore.test.ts
git commit -m "feat(wall): mint suspected cause names"
```

### Task 5: Retire AnalyzePhaseBadge chrome

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `packages/ui/src/components/FindingsWindow/AnalyzeSidebar.tsx`
- Modify: `packages/ui/src/components/FindingsWindow/FindingsWindow.tsx`
- Modify: `packages/ui/src/components/CoScoutInline/CoScoutInline.tsx`
- Modify: `packages/ui/src/index.ts`
- Delete if no production imports remain: `packages/ui/src/components/AnalyzePhaseBadge/AnalyzePhaseBadge.tsx`
- Delete if no production imports remain: `packages/ui/src/components/AnalyzePhaseBadge/index.ts`
- Delete: `packages/ui/src/components/AnalyzePhaseBadge/__tests__/AnalyzePhaseBadge.test.tsx`
- Modify test mocks that still stub `AnalyzePhaseBadge` after imports disappear

- [ ] **Step 1: Write/update failing tests**

In `CoScoutInline.test.tsx`, replace the old Diverging assertion:

```tsx
render(<CoScoutInline {...defaultProps} phase="diverging" />);
expect(screen.queryByText('Diverging')).not.toBeInTheDocument();
```

In `FindingsWindow` or sidebar tests where present:

```tsx
expect(screen.queryByText('Diverging')).not.toBeInTheDocument();
```

PWA/Azure map-wall tests should not mock `AnalyzePhaseBadge` once the app import is removed.

- [ ] **Step 2: Run tests — expect FAIL**

Run:

```bash
pnpm --filter @variscout/ui test -- CoScoutInline FindingsWindow AnalyzeSidebar
pnpm --filter @variscout/pwa test -- AnalyzeView.mapwall
pnpm --filter @variscout/azure-app test -- AnalyzeWorkspace.mapwall
```

- [ ] **Step 3: Remove production mounts**

Remove JSX and unused imports from the five production sites:

```tsx
<AnalyzePhaseBadge phase={analyzePhase} />
```

In `AnalyzeSidebar`, keep `phaseDescriptionKeys` and the phase description paragraph if they still provide useful non-chip content; only remove the badge import/render.

In `FindingsWindow`, keep passing `phase={analyzePhase}` to `AnalyzeSidebar` if the sidebar still uses it for description/checklist behavior.

In `CoScoutInline`, keep the `phase?: AnalyzePhase` prop for behavioral compatibility unless TypeScript proves it is unused everywhere; remove only the visible badge.

- [ ] **Step 4: Retire the component export/test**

After production imports are gone:

```bash
rg -n "AnalyzePhaseBadge" packages apps
```

Expected remaining hits before deletion: component files, test file, export, README, and stale mocks. Delete the component/test/export and remove stale mocks. Leave lifecycle docs and `detectInvestigationPhase` tests untouched.

- [ ] **Step 5: Run tests — PASS**

Run the commands from Step 2, then:

```bash
pnpm --filter @variscout/ui build
```

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx apps/azure/src/components/editor/AnalyzeWorkspace.tsx packages/ui/src/components/FindingsWindow packages/ui/src/components/CoScoutInline packages/ui/src/components/AnalyzePhaseBadge packages/ui/src/index.ts packages/ui/README.md
git commit -m "feat(analyze): retire phase badge chrome"
```

### Task 6: Grep cleanup and implementation gates

**Files:**

- Modify only files surfaced by grep that are user-facing and in L-2 scope.
- Do not modify archived docs, lifecycle docs, `findings/mechanismBranch.ts`, or unrelated supported-account/browser text.

- [ ] **Step 1: Run vocabulary grep**

```bash
rg -n "Mechanism Branch|mechanism branch|Write a suspected mechanism|New mechanism branch|Suspected mechanism|Proposed|Evidenced|Needs disconfirmation|Supported|Diverging" packages apps
```

- [ ] **Step 2: Classify every hit**

Allowed hits:

- Code identifiers in `findings/mechanismBranch.ts` and tests that assert code-level projection behavior.
- Non-user-facing comments only if changing them risks scope churn; prefer updating comments in files already touched.
- Unrelated "Supported account types", browser/API support, attachment support, and similar non-status vocabulary.
- Lifecycle/CoScout phase model strings that are not visible chrome.

Disallowed hits:

- Wall card/list/status-control visible text.
- `WallArrival`, empty state, missing-evidence panel, or ARIA labels.
- PWA/Azure hub minters that reach Report.
- `AnalyzePhaseBadge` visible `Diverging` chrome.

- [ ] **Step 3: Run targeted tests**

```bash
pnpm --filter @variscout/core test -- i18n
pnpm --filter @variscout/core test -- hypothesis
pnpm --filter @variscout/ui test -- HypothesisCard MobileCardList HypothesisCardWithPlans ReportImprovementSummary ConclusionCard
pnpm --filter @variscout/pwa test -- AnalyzeView.mapwall
pnpm --filter @variscout/azure-app test -- AnalyzeWorkspace.mapwall
```

- [ ] **Step 4: Commit any grep/test cleanup**

```bash
git add <only the cleanup files>
git commit -m "test(wall): align L-2 vocabulary assertions"
```

## Self-Merge Gates

Run only after owner plan approval and after Tasks 1-6 are complete:

1. `bash scripts/pr-ready-check.sh` must be green.
2. Browser verification must load a sample dataset, create a suspected cause on the Wall, and screenshot-verify:
   - card kicker says "Suspected cause";
   - card state says "Suspected";
   - no "Mechanism Branch", "Proposed", or "Evidenced" appears user-facing;
   - missing-evidence band says "Evidence you haven't checked yet ({count})";
   - no "Diverging" chip appears in Analyze chrome;
   - save -> reload round-trips with the stored status unchanged.
3. PR body must include the targeted test output, `pr-ready-check` result, screenshots, and the save/reload stored-status evidence.
4. Merge with `gh pr merge --merge --delete-branch`. Never use `--squash`.
