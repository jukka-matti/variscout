---
tier: stable
purpose: remember
title: Response Path System V1 — Implementation Plan
audience: human
category: implementation
status: archived
last-reviewed: 2026-05-13
related:
  - docs/archive/specs/2026-05-09-response-path-system-v1-design.md
  - docs/archive/specs/2026-05-03-variscout-vision-design.md
  - docs/archive/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md
layer: spec
---

> **Status:** ARCHIVED 2026-05-17 — superseded by [wedge architecture spec](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../../07-decisions/adr-082-wedge-architecture.md). The 10-PR RPS V1 implementation plan delivered all 5 response paths; the wedge then reduced V1 canvas-drill to 3 paths (Investigate, Quick Action, Charter). The 54-task plan is preserved here as institutional knowledge for the implementation patterns; delivered PRs #144/#147–#155.
>
> **Preserved here** for institutional knowledge — the implementation sequencing patterns inform future VariScout Process scope (see [docs/01-vision/variscout-process/](../../01-vision/variscout-process/index.md)).

# Response Path System V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **⚠️ Amended 2026-05-16** by [ADR-082](../../07-decisions/adr-082-wedge-architecture.md). RPS V1 shipped 5 response paths off a Process Hub. Under the wedge, **3 paths** surface at V1 from canvas drill (Investigate, Quick Action, Charter); Sustainment auto-fires per ADR-080 (no canvas-launch); **Handoff path is deleted everywhere** and its close-project logic folds into the Sustainment stage closure (per wedge spec §3.2 + §3.3.4). All shipped code stays — the wedge gates the canvas drill-down menu to 3 paths rather than deleting RPS V1 infrastructure.

**Goal:** Implement RPS V1 — naming reconciliation + Wall re-home + Wall Detective-pack + Improvement Project + Quick Action + Sustainment + Handoff — as 10 sequenced PRs off branch `response-path-system-v1`, per `docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md`.

**Architecture:** Five-entity canonical investigation graph (Question / Hypothesis / GateNode / Finding / CausalLink) with two status enums. Five response paths (Quick Action / Focused Investigation / Improvement Project / Sustainment / Handoff) sharing Survey-driven cross-surface UX patterns. Three-altitude framing: macro Hub cadence loop, Survey cross-phase layer, per-response micro lifecycles. No backward compatibility — clean breaks per design phase.

**Tech Stack:** TypeScript 6, React 18, Vitest, React Testing Library, Tailwind v4, Dexie, Zustand 4, `@variscout/core/i18n`, `@variscout/hooks` `useTier`, Playwright E2E.

**Branch:** `response-path-system-v1`. Each PR squash-merges to main; subsequent PRs rebase on main.

---

## Slice plan — 10 PRs

| PR        | Slice                                                              | Tasks | Depends on | Estimated effort |
| --------- | ------------------------------------------------------------------ | ----- | ---------- | ---------------- |
| PR-RPS-1  | Naming + Wall re-home                                              | 6     | None       | M (~3-4 days)    |
| PR-RPS-2  | Wall Detective-pack: 5th status + confirm-gate rule                | 3     | PR-RPS-1   | S (~2 days)      |
| PR-RPS-3  | Wall Detective-pack: mini-charts inside HypothesisCard             | 6     | PR-RPS-2   | M (~4-6 days)    |
| PR-RPS-4  | Wall Detective-pack: brush-to-pin gesture + missing-evidence panel | 5     | PR-RPS-3   | M (~3-5 days)    |
| PR-RPS-5  | IP V1: types, persistence, store, .vrs                             | 7     | PR-RPS-1   | M (~4-5 days)    |
| PR-RPS-6  | IP V1: 6-section UI + multi-level Goal + CollapsibleSection        | 7     | PR-RPS-5   | M (~4-6 days)    |
| PR-RPS-7  | IP V1: per-app shells + canvas-card pickers + cross-surface badges | 5     | PR-RPS-6   | M (~3-4 days)    |
| PR-RPS-8  | Quick Action surface + Recent activity panel                       | 4     | PR-RPS-1   | S (~2-3 days)    |
| PR-RPS-9  | Sustainment V1 + Inbox prompts + signal computation                | 6     | PR-RPS-7   | M (~4-5 days)    |
| PR-RPS-10 | Handoff V1 + Inbox prompts + sponsor signoff (paid)                | 5     | PR-RPS-9   | M (~3-4 days)    |

Total: 54 tasks, ~6-8 weeks at typical implementer pace. Each PR uses `superpowers:subagent-driven-development` with Sonnet for implementer + spec/quality reviewers; Opus for final-PR code-reviewer.

**Partial-integration policy** (per `feedback_partial_integration_policy`):

- PR-RPS-1 stands alone — pure refactor, mergeable independently
- PR-RPS-2/3/4 can ship incrementally; each closes one Wall vision gap
- PR-RPS-5 stands alone (engine layer for IP)
- PR-RPS-6 mounts on dev pages without app integration
- PR-RPS-7 integrates IP into apps (user-visible)
- PR-RPS-8 parallel to IP work; can merge anytime after PR-RPS-1
- PR-RPS-9/10 sequential after IP integration

---

## Shared patterns — read once, apply everywhere

### TDD task structure

Every task uses 5 steps:

1. **Write failing test(s)** — full test code in the step
2. **Run to verify failure** — exact pnpm command + expected error
3. **Implement** — full code (component/type/handler) in the step
4. **Run to verify pass** — exact pnpm command + expected pass
5. **Commit** — `git add` + commit message

### Existing patterns to follow

- **HubAction handler shape:** see `apps/pwa/src/persistence/applyAction.ts` (PWA F3 normalized) and `apps/azure/src/persistence/applyAction.ts` (Azure mixed). Add new cases to the existing switch; rely on `assertNever()` exhaustiveness.
- **HubAction kinds:** see `packages/core/src/actions/HubAction.ts` (discriminated union). Add new domain action files under `packages/core/src/actions/`.
- **Sub-path exports:** add to `packages/core/package.json` `exports` field.
- **Component tests:** Vitest + RTL, `vi.mock()` BEFORE imports per `feedback_vi_mock_hoist_closure`.
- **i18n catalogs:** `packages/core/src/i18n/messages/{lang}.ts`, typed catalog. New keys MUST land in `en.ts` first; other locales fallback to English until translated.
- **Stats safety:** never return `NaN`; use `safeMath.ts` primitives. ESLint rule `no-tofixed-on-stats` enforced.

### `pnpm` filter targets

- `pnpm --filter @variscout/core test` — core package tests
- `pnpm --filter @variscout/charts test` — charts package tests
- `pnpm --filter @variscout/ui test` — UI package tests
- `pnpm --filter @variscout/stores test` — Zustand stores tests
- `pnpm --filter @variscout/pwa test` — PWA app tests (Vitest)
- `pnpm --filter @variscout/azure-app test` — Azure app tests (Vitest)
- `pnpm --filter @variscout/pwa test:e2e` — PWA E2E (Playwright)
- `pnpm --filter @variscout/azure-app test:e2e` — Azure E2E (Playwright)
- `bash scripts/pr-ready-check.sh` — full pre-merge gate (tests + lint + docs:check)

### Verification before each PR merge

- `bash scripts/pr-ready-check.sh` green
- `pnpm --filter @variscout/ui build` green (catches cross-package type-export gaps per `feedback_ui_build_before_merge`)
- `--chrome` walkthrough (per `feedback_verify_before_push`) for any user-visible PR
- Per-PR Opus code-reviewer pass (per `feedback_subagent_driven_default`)

---

## PR-RPS-1: Naming reconciliation + Wall package re-home

> **Goal:** Rename `SuspectedCause` → `Hypothesis`, retire `MechanismBranchStatus` + `WallStatus` (collapse into `HypothesisStatus` 5 states), add `Hypothesis.themeTags?: string[]`, move `InvestigationWall` from `packages/charts` → `packages/ui`. Pure refactor; no functional changes. Per spec §8 + §9 + D15 + D17. **No backward compatibility** — direct refactor.

### Task 1: Rename `SuspectedCause` type → `Hypothesis` in core

**Files:**

- Modify: `packages/core/src/findings/types.ts` (rename interface, retain field shape)
- Modify: `packages/core/src/findings/index.ts` (update barrel export)
- Modify: `packages/core/src/findings/__tests__/types.test.ts` (rename test cases)

- [ ] **Step 1: Write failing test**

Add to `packages/core/src/findings/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Hypothesis, HypothesisStatus } from '../types';

describe('Hypothesis (renamed from SuspectedCause)', () => {
  it('has 5-state HypothesisStatus', () => {
    const states: HypothesisStatus[] = [
      'proposed',
      'evidenced',
      'confirmed',
      'refuted',
      'needs-disconfirmation',
    ];
    expect(states).toHaveLength(5);
  });

  it('compiles with the renamed shape', () => {
    const h: Hypothesis = {
      id: 'h-1',
      hubId: 'hub-1',
      investigationId: 'inv-1',
      name: 'Nozzle runs hot on night shift',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'proposed',
      themeTags: ['nozzle', 'thermal'],
      createdAt: 0,
      deletedAt: null,
      updatedAt: 0,
    };
    expect(h.name).toContain('Nozzle');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
pnpm --filter @variscout/core test types
```

Expected: FAIL — `Hypothesis` type not found; `HypothesisStatus` not exported; `themeTags` field unknown.

- [ ] **Step 3: Implement rename**

In `packages/core/src/findings/types.ts`:

```ts
// Replace existing MechanismBranchStatus enum with 5-state HypothesisStatus
export type HypothesisStatus =
  | 'proposed'
  | 'evidenced'
  | 'confirmed'
  | 'refuted'
  | 'needs-disconfirmation';

// Rename SuspectedCause interface → Hypothesis. Add themeTags. Replace
// branchStatus field type with HypothesisStatus. Remove branchReadiness +
// status (3-state) — collapsed into single 5-state HypothesisStatus.
export interface Hypothesis extends EntityBase {
  hubId: ProcessHub['id'];
  investigationId: ProcessHubInvestigation['id'];
  name: string;
  synthesis: string;
  questionIds: Question['id'][];
  findingIds: Finding['id'][];
  status: HypothesisStatus; // 5 states; replaces old `status` + `branchStatus`
  evidence?: SuspectedCauseEvidence; // type also renamed below
  selectedForImprovement?: boolean;
  nextMove?: string;
  counterFindingIds?: Finding['id'][];
  checkQuestionIds?: Question['id'][];
  condition?: HypothesisCondition;
  tributaryIds?: ProcessMapTributary['id'][];
  signalCardIds?: string[];
  comments?: FindingComment[];
  /** V1 lightweight grouping per RPS V1 D16. V2 promotes to first-class HypothesisGroup entity. */
  themeTags?: string[];
  updatedAt: number;
}

// Rename SuspectedCauseEvidence → HypothesisEvidence
export interface HypothesisEvidence {
  mode: 'standard' | 'capability' | 'performance' | 'yamazumi';
  contribution: { value: number; label: string; description: string };
}

// Remove: MechanismBranchStatus, MechanismBranchReadiness — replaced by HypothesisStatus
// Remove: legacy `Hypothesis` deprecated stub (per ADR-053)
```

Update `packages/core/src/findings/index.ts` barrel to export `Hypothesis`, `HypothesisStatus`, `HypothesisEvidence`.

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm --filter @variscout/core test types
```

Expected: PASS. Note: many other test files will now fail (consumers of `SuspectedCause`); those are fixed in subsequent tasks.

- [ ] **Step 5: Commit (do not push yet — many cascading fixes follow)**

```bash
git checkout -b response-path-system-v1
git add packages/core/src/findings/types.ts packages/core/src/findings/index.ts packages/core/src/findings/__tests__/types.test.ts
git commit -m "refactor(core): rename SuspectedCause → Hypothesis + 5-state HypothesisStatus"
```

---

### Task 2: Update field rename `suspectedCauseId` → `hypothesisId` on `CausalLink` + `FindingComment`

**Files:**

- Modify: `packages/core/src/findings/types.ts` (CausalLink + FindingComment field rename)
- Modify: `packages/core/src/findings/__tests__/causalLink.test.ts` (test field name)

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import type { CausalLink, FindingComment } from '../types';

describe('CausalLink + FindingComment field rename', () => {
  it('CausalLink references hypothesisId not suspectedCauseId', () => {
    const link: CausalLink = {
      id: 'cl-1',
      fromFactor: 'shift',
      toFactor: 'thickness',
      whyStatement: 'Night shift correlates',
      direction: 'drives',
      evidenceType: 'data',
      questionIds: [],
      findingIds: [],
      hypothesisId: 'h-1', // renamed from suspectedCauseId
      source: 'analyst',
      createdAt: 0,
      deletedAt: null,
      updatedAt: 0,
    };
    expect(link.hypothesisId).toBe('h-1');
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/core test causalLink
```

Expected: FAIL — `hypothesisId` not found.

- [ ] **Step 3: Rename fields**

In `packages/core/src/findings/types.ts`:

```ts
// CausalLink — rename suspectedCauseId → hypothesisId
export interface CausalLink extends EntityBase {
  // ... unchanged fields ...
  hypothesisId?: Hypothesis['id']; // RENAMED from suspectedCauseId
  // ... unchanged fields ...
}

// FindingComment — update polymorphic union
export interface FindingComment {
  id: string;
  parentId: Finding['id'] | Hypothesis['id']; // Hypothesis replaces SuspectedCause
  // ... unchanged ...
}
```

- [ ] **Step 4: Run passing test**

```bash
pnpm --filter @variscout/core test causalLink
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/types.ts packages/core/src/findings/__tests__/causalLink.test.ts
git commit -m "refactor(core): rename suspectedCauseId → hypothesisId on CausalLink + FindingComment"
```

---

### Task 3: Rename HubAction kinds `SUSPECTED_CAUSE_*` → `HYPOTHESIS_*`

**Files:**

- Rename: `packages/core/src/actions/suspectedCauseActions.ts` → `hypothesisActions.ts`
- Modify: `packages/core/src/actions/HubAction.ts` (import rename)
- Modify: `packages/core/src/actions/__tests__/exhaustiveness.test.ts` (case branch renames)
- Modify: `packages/core/src/actions/index.ts` (barrel)

- [ ] **Step 1: Write failing test**

Update exhaustiveness test cases:

```ts
// Replace these branches in _exhaustive switch:
case 'SUSPECTED_CAUSE_ADD':       // → HYPOTHESIS_ADD
case 'SUSPECTED_CAUSE_UPDATE':    // → HYPOTHESIS_UPDATE
case 'SUSPECTED_CAUSE_ARCHIVE':   // → HYPOTHESIS_ARCHIVE
```

To:

```ts
case 'HYPOTHESIS_ADD':
  return;
case 'HYPOTHESIS_UPDATE':
  return;
case 'HYPOTHESIS_ARCHIVE':
  return;
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/core test exhaustiveness
```

Expected: FAIL — TS errors on missing kind names.

- [ ] **Step 3: Rename action file + types**

`mv packages/core/src/actions/suspectedCauseActions.ts packages/core/src/actions/hypothesisActions.ts`

Update file content:

```ts
// packages/core/src/actions/hypothesisActions.ts
import type { ProcessHub } from '../processHub';
import type { Hypothesis } from '../findings/types';

export type HypothesisAction =
  | {
      kind: 'HYPOTHESIS_ADD';
      hubId: ProcessHub['id'];
      hypothesis: Hypothesis;
    }
  | {
      kind: 'HYPOTHESIS_UPDATE';
      hypothesisId: Hypothesis['id'];
      patch: Partial<Omit<Hypothesis, 'id' | 'createdAt' | 'hubId'>>;
    }
  | { kind: 'HYPOTHESIS_ARCHIVE'; hypothesisId: Hypothesis['id'] };
```

Update `packages/core/src/actions/HubAction.ts`:

```ts
import type { HypothesisAction } from './hypothesisActions'; // RENAMED

export type HubAction =
  | OutcomeAction
  | EvidenceAction
  | EvidenceSourceAction
  | InvestigationAction
  | FindingAction
  | QuestionAction
  | CausalLinkAction
  | HypothesisAction // RENAMED from SuspectedCauseAction
  | HubMetaAction
  | CanvasAction;
```

Update `packages/core/src/actions/index.ts` barrel.

- [ ] **Step 4: Run passing test**

```bash
pnpm --filter @variscout/core test exhaustiveness
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/actions/
git commit -m "refactor(core): rename SUSPECTED_CAUSE_* HubAction kinds → HYPOTHESIS_*"
```

---

### Task 4: Move `InvestigationWall` from `packages/charts` → `packages/ui`

**Files:**

- Move: `packages/charts/src/InvestigationWall/` → `packages/ui/src/components/InvestigationWall/` (15 files)
- Modify: `packages/charts/src/index.ts` (remove InvestigationWall exports)
- Modify: `packages/ui/src/index.ts` (add InvestigationWall exports)
- Modify: All consumer imports in `apps/pwa/src/` + `apps/azure/src/` (grep)

- [ ] **Step 1: Write failing test**

```bash
pnpm --filter @variscout/ui test
```

Will fail because tests for moved files don't exist in @variscout/ui yet. After move + import update, tests pass in new location.

- [ ] **Step 2: Identify consumer imports**

```bash
grep -rn "from '@variscout/charts/InvestigationWall\|from '@variscout/charts/.*InvestigationWall\|InvestigationWall'" apps/ packages/ 2>/dev/null
```

Capture all import sites; they need updating to `@variscout/ui` after move.

- [ ] **Step 3: Move files + update imports**

```bash
git mv packages/charts/src/InvestigationWall packages/ui/src/components/InvestigationWall
```

Update internal imports in moved files: `import ... from '../colors'` → `import ... from '@variscout/charts'` (since charts module now exports the colors). Update all consumer imports per the grep output to `'@variscout/ui'`.

Update `packages/charts/src/index.ts` — remove `InvestigationWall/*` re-exports.

Update `packages/ui/src/index.ts` — add `export * from './components/InvestigationWall'` (or selective re-exports as needed).

Inside HypothesisCard.tsx (moved): the chart-slot reservation at line 170 stays (will be populated in PR-RPS-3).

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @variscout/charts test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

Expected: PASS — moved tests now run under @variscout/ui; no cross-package import breakage.

- [ ] **Step 5: Commit**

```bash
git add packages/charts packages/ui apps
git commit -m "refactor: move InvestigationWall packages/charts → packages/ui (per RPS V1 D17)"
```

---

### Task 5: Rename `WallStatus` consumers → `HypothesisStatus`

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/types.ts` (remove `WallStatus` enum)
- Modify: All Wall component imports of `WallStatus` (grep within `packages/ui/src/components/InvestigationWall/`)

- [ ] **Step 1: Write failing test**

```ts
// packages/ui/src/components/InvestigationWall/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { HypothesisStatus } from '@variscout/core/findings';

describe('Wall consumers use HypothesisStatus', () => {
  it('5-state HypothesisStatus is the canonical type', () => {
    const allowed: HypothesisStatus[] = [
      'proposed',
      'evidenced',
      'confirmed',
      'refuted',
      'needs-disconfirmation',
    ];
    expect(allowed).toHaveLength(5);
  });

  it('WallStatus is no longer exported from Wall types', async () => {
    const types = await import('../types');
    expect((types as Record<string, unknown>).WallStatus).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/ui test types
```

Expected: FAIL — `WallStatus` still exists.

- [ ] **Step 3: Remove WallStatus + update consumers**

```bash
grep -rn "WallStatus" packages/ui/src/components/InvestigationWall/
```

For each file with `WallStatus`:

- Replace `import { WallStatus }` → `import { HypothesisStatus } from '@variscout/core/findings'`
- Replace `WallStatus` references → `HypothesisStatus`

Remove the enum definition from `packages/ui/src/components/InvestigationWall/types.ts`.

Update `STATUS_KEY` and `STATUS_STROKE` records in `HypothesisCard.tsx` to add the 5th state:

```ts
const STATUS_KEY: Record<HypothesisStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  confirmed: 'wall.status.confirmed',
  refuted: 'wall.status.refuted',
  'needs-disconfirmation': 'wall.status.needsDisconfirmation', // NEW
};

const STATUS_STROKE: Record<HypothesisStatus, string> = {
  proposed: chartColors.mean,
  evidenced: chartColors.control,
  confirmed: chartColors.pass,
  refuted: chartColors.fail,
  'needs-disconfirmation': chartColors.warning, // NEW; amber-tone
};
```

Add i18n key in `packages/core/src/i18n/messages/en.ts`:

```ts
'wall.status.needsDisconfirmation': 'Needs disconfirmation',
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/ui test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/InvestigationWall packages/core/src/i18n/messages/en.ts
git commit -m "refactor(ui): collapse WallStatus → HypothesisStatus 5-state (per RPS V1 D15)"
```

---

### Task 6: Add `Hypothesis.themeTags` field + tag chip UI on HypothesisCard

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx` (render tag chips)
- Create: `packages/ui/src/components/InvestigationWall/TagChip.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/TagChip.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// TagChip.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TagChip } from '../TagChip';

describe('TagChip', () => {
  it('renders the tag label with # prefix', () => {
    render(<TagChip tag="nozzle" />);
    expect(screen.getByText('#nozzle')).toBeInTheDocument();
  });

  it('uses theme-derived color from chartColors', () => {
    render(<TagChip tag="thermal" />);
    const chip = screen.getByTestId('tag-chip');
    expect(chip.style.borderColor).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/ui test TagChip
```

Expected: FAIL.

- [ ] **Step 3: Implement TagChip + integrate**

Create `packages/ui/src/components/InvestigationWall/TagChip.tsx`:

```tsx
import { chartColors } from '@variscout/charts';

interface TagChipProps {
  tag: string;
}

// Stable color per tag via simple hash → palette index
function colorForTag(tag: string): string {
  const palette = [chartColors.cat1, chartColors.cat2, chartColors.cat3, chartColors.cat4];
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

export function TagChip({ tag }: TagChipProps) {
  return (
    <span
      data-testid="tag-chip"
      style={{ borderColor: colorForTag(tag) }}
      className="text-xs px-1.5 py-0.5 rounded border bg-surface-secondary"
    >
      #{tag}
    </span>
  );
}
```

In `HypothesisCard.tsx`, render tag chips below the card body when `themeTags` present:

```tsx
{
  hub.themeTags && hub.themeTags.length > 0 && (
    <foreignObject x={16} y={CARD_H - 32} width={CARD_W - 32} height={24}>
      <div className="flex gap-1 flex-wrap">
        {hub.themeTags.map(t => (
          <TagChip key={t} tag={t} />
        ))}
      </div>
    </foreignObject>
  );
}
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test TagChip
```

Expected: PASS.

- [ ] **Step 5: Commit + push PR-RPS-1**

```bash
git add packages/ui/src/components/InvestigationWall/
git commit -m "feat(ui): TagChip component + Hypothesis.themeTags rendering on Wall"
git push -u origin response-path-system-v1
```

**Open PR-RPS-1.** Run `bash scripts/pr-ready-check.sh`. Subagent code-reviewer pass on Opus before squash-merge.

---

## PR-RPS-2: Wall Detective-pack — 5th status + confirm-gate rule

> **Goal:** Implement Survey rule that auto-derives `needs-disconfirmation` status when ≥2 evidence types exist but no falsification attempt is recorded; render the confirm-gate rule + "1 step away" badge on hypothesis cards. Per spec D12 + §5 categories 1+3.

### Task 7: Add `Hypothesis.disconfirmationAttempts[]` field + `evidenceTypes()` helper

**Files:**

- Modify: `packages/core/src/findings/types.ts` (add field)
- Create: `packages/core/src/findings/hypothesisEvidence.ts` (helpers)
- Create: `packages/core/src/findings/__tests__/hypothesisEvidence.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// hypothesisEvidence.test.ts
import { describe, it, expect } from 'vitest';
import { evidenceTypesForHypothesis, hasUnresolvedDisconfirmation } from '../hypothesisEvidence';
import type { Hypothesis, Finding } from '../types';

const FINDINGS: Finding[] = [
  { id: 'f-1', evidenceType: 'data' /* ...other fields */ } as Finding,
  { id: 'f-2', evidenceType: 'gemba' /* ... */ } as Finding,
];

describe('evidenceTypesForHypothesis', () => {
  it('returns distinct evidence types from linked findings', () => {
    const h = { findingIds: ['f-1', 'f-2'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types).toEqual(new Set(['data', 'gemba']));
  });
});

describe('hasUnresolvedDisconfirmation', () => {
  it('returns false when no disconfirmation attempts recorded', () => {
    const h = { disconfirmationAttempts: [] } as unknown as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(false);
  });

  it('returns true when an attempt exists with verdict pending', () => {
    const h = { disconfirmationAttempts: [{ verdict: 'pending' }] } as unknown as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(true);
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/core test hypothesisEvidence
```

Expected: FAIL — module not found, fields not on type.

- [ ] **Step 3: Implement field + helpers**

In `types.ts`:

```ts
export interface DisconfirmationAttempt {
  id: string;
  attemptedAt: string; // ISO 8601
  attemptedBy: ProcessParticipantRef;
  description: string; // what falsification test was run
  verdict: 'pending' | 'survived' | 'refuted';
  linkedFindingIds: Finding['id'][];
}

export interface Hypothesis extends EntityBase {
  // ... existing fields ...
  disconfirmationAttempts?: DisconfirmationAttempt[]; // NEW
}
```

Create `packages/core/src/findings/hypothesisEvidence.ts`:

```ts
import type { Hypothesis, Finding, DisconfirmationAttempt } from './types';

export function evidenceTypesForHypothesis(
  h: Hypothesis,
  findings: Finding[]
): Set<Finding['evidenceType']> {
  const linkedFindings = findings.filter(f => h.findingIds.includes(f.id));
  return new Set(linkedFindings.map(f => f.evidenceType));
}

export function hasUnresolvedDisconfirmation(h: Hypothesis): boolean {
  return (h.disconfirmationAttempts ?? []).some(a => a.verdict === 'pending');
}
```

- [ ] **Step 4: Run passing tests**

```bash
pnpm --filter @variscout/core test hypothesisEvidence
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/
git commit -m "feat(core): Hypothesis.disconfirmationAttempts + evidenceTypes/hasUnresolvedDisconfirmation helpers"
```

---

### Task 8: Implement Survey rule — `deriveHypothesisStatus()` (auto-derive `needs-disconfirmation`)

**Files:**

- Create: `packages/core/src/survey/wall.ts`
- Create: `packages/core/src/survey/types.ts`
- Create: `packages/core/src/survey/index.ts`
- Create: `packages/core/src/survey/__tests__/wall.test.ts`
- Modify: `packages/core/package.json` (add `./survey` sub-path export)

- [ ] **Step 1: Write failing tests**

```ts
// survey/__tests__/wall.test.ts
import { describe, it, expect } from 'vitest';
import { deriveHypothesisStatus, surveyWallRules } from '../wall';
import type { Hypothesis, Finding } from '../../findings/types';

describe('deriveHypothesisStatus', () => {
  const baseH = (overrides: Partial<Hypothesis>): Hypothesis =>
    ({
      id: 'h',
      hubId: 'hub',
      investigationId: 'inv',
      name: '',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'proposed',
      createdAt: 0,
      deletedAt: null,
      updatedAt: 0,
      ...overrides,
    }) as Hypothesis;

  it('proposed when no findings', () => {
    expect(deriveHypothesisStatus(baseH({ findingIds: [] }), [])).toBe('proposed');
  });

  it('refuted when refuting findings exist', () => {
    const findings = [{ id: 'f1', evidenceType: 'data', refutes: true } as unknown as Finding];
    expect(deriveHypothesisStatus(baseH({ findingIds: ['f1'] }), findings)).toBe('refuted');
  });

  it('evidenced with 1 evidence type', () => {
    const findings = [{ id: 'f1', evidenceType: 'data' } as Finding];
    expect(deriveHypothesisStatus(baseH({ findingIds: ['f1'] }), findings)).toBe('evidenced');
  });

  it('needs-disconfirmation with 2 types but no disconfirmation attempt', () => {
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    expect(
      deriveHypothesisStatus(
        baseH({ findingIds: ['f1', 'f2'], disconfirmationAttempts: [] }),
        findings
      )
    ).toBe('needs-disconfirmation');
  });

  it('confirmed with 2 types and resolved disconfirmation', () => {
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    const h = baseH({
      findingIds: ['f1', 'f2'],
      disconfirmationAttempts: [
        {
          id: 'd1',
          verdict: 'survived',
          attemptedAt: '',
          description: '',
          attemptedBy: { displayName: '' },
          linkedFindingIds: [],
        },
      ],
    });
    expect(deriveHypothesisStatus(h, findings)).toBe('confirmed');
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
pnpm --filter @variscout/core test survey
```

Expected: FAIL.

- [ ] **Step 3: Implement Survey rule + module structure**

Create `packages/core/src/survey/types.ts`:

```ts
export type SurveyHintKind =
  | 'status-derivation'
  | 'data-collection'
  | 'triangulation-readiness'
  | 'power-warning'
  | 'drift-detection'
  | 'lifecycle-gap';

export interface SurveyHint {
  kind: SurveyHintKind;
  surface: 'wall' | 'improvementProject' | 'sustainment' | 'handoff' | 'inbox';
  targetEntityId: string; // hypothesisId, ipId, etc.
  message: string;
  severity: 'info' | 'warning' | 'critical';
  /** Optional concrete action affordance */
  action?: { label: string; opensSurface?: string; opensId?: string };
}

export interface SurveyContext {
  hub: import('../processHub').ProcessHub;
  hypotheses?: import('../findings/types').Hypothesis[];
  findings?: import('../findings/types').Finding[];
  improvementProjects?: import('../improvementProject').ImprovementProject[];
  // additional context fields per domain rule
}

export type SurveyRule = (ctx: SurveyContext) => SurveyHint[];
```

Create `packages/core/src/survey/wall.ts`:

```ts
import type { Hypothesis, HypothesisStatus, Finding } from '../findings/types';
import {
  evidenceTypesForHypothesis,
  hasUnresolvedDisconfirmation,
} from '../findings/hypothesisEvidence';
import type { SurveyHint, SurveyRule } from './types';

/** Pure status-derivation per spec §5 rule category 1. */
export function deriveHypothesisStatus(h: Hypothesis, findings: Finding[]): HypothesisStatus {
  // Refuted: any refuting finding wins
  const linkedFindings = findings.filter(f => h.findingIds.includes(f.id));
  if (linkedFindings.some(f => (f as Finding & { refutes?: boolean }).refutes)) return 'refuted';

  if (h.findingIds.length === 0) return 'proposed';

  const types = evidenceTypesForHypothesis(h, findings);
  const distinctNonRefuting = new Set(
    [...types].filter(t => t === 'data' || t === 'gemba' || t === 'expert')
  );

  // Check disconfirmation status
  const hasResolvedDisconfirmation = (h.disconfirmationAttempts ?? []).some(
    a => a.verdict === 'survived'
  );

  if (distinctNonRefuting.size >= 2) {
    if (hasResolvedDisconfirmation) return 'confirmed';
    return 'needs-disconfirmation';
  }
  return 'evidenced';
}

/** Survey rule: derive auto-status for all hypotheses + emit "1 step away" hints. */
export const surveyWallRules: SurveyRule = ctx => {
  const hints: SurveyHint[] = [];
  const hypotheses = ctx.hypotheses ?? [];
  const findings = ctx.findings ?? [];

  for (const h of hypotheses) {
    const derivedStatus = deriveHypothesisStatus(h, findings);

    // Emit "needs disconfirmation" hint per spec §5 category 1+3
    if (derivedStatus === 'needs-disconfirmation') {
      hints.push({
        kind: 'triangulation-readiness',
        surface: 'wall',
        targetEntityId: h.id,
        message:
          '1 step away — running a disconfirmation test would promote this from evidenced to confirmed',
        severity: 'info',
        action: { label: 'Try disconfirmation' },
      });
    }
  }

  return hints;
};
```

Create `packages/core/src/survey/index.ts`:

```ts
export { surveyWallRules, deriveHypothesisStatus } from './wall';
export type { SurveyHint, SurveyRule, SurveyContext, SurveyHintKind } from './types';
```

Add `./survey` to `packages/core/package.json` exports field.

- [ ] **Step 4: Run passing tests**

```bash
pnpm --filter @variscout/core test survey
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/survey/ packages/core/package.json
git commit -m "feat(core): Survey wall rules — deriveHypothesisStatus 5-state + 1-step-away hints"
```

---

### Task 9: Render derived status + "1 step away" badge on `HypothesisCard`

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx`
- Create: `packages/ui/src/components/InvestigationWall/OneStepAwayBadge.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/HypothesisCard.statusDerivation.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HypothesisCard } from '../HypothesisCard';

describe('HypothesisCard renders derived status', () => {
  it('shows needs-disconfirmation border + 1-step-away badge', () => {
    const hub = {
      id: 'h-1',
      name: 'Test',
      findingIds: ['f1', 'f2'],
      disconfirmationAttempts: [],
      // ... minimal Hypothesis fields
    } as never;
    render(<HypothesisCard hub={hub} displayStatus="needs-disconfirmation" x={0} y={0} />);
    expect(screen.getByText(/1 step away/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/ui test HypothesisCard.statusDerivation
```

Expected: FAIL.

- [ ] **Step 3: Implement badge + integrate**

Create `OneStepAwayBadge.tsx`:

```tsx
interface OneStepAwayBadgeProps {
  message: string;
}

export function OneStepAwayBadge({ message }: OneStepAwayBadgeProps) {
  return (
    <foreignObject x={16} y={140} width={248} height={20}>
      <div className="text-[10px] px-1.5 py-0.5 rounded border border-amber-600 bg-amber-50 text-amber-900">
        ⚠ {message}
      </div>
    </foreignObject>
  );
}
```

In `HypothesisCard.tsx`, when `displayStatus === 'needs-disconfirmation'`, render the badge.

- [ ] **Step 4: Run passing test**

```bash
pnpm --filter @variscout/ui test HypothesisCard.statusDerivation
```

Expected: PASS.

- [ ] **Step 5: Commit + push PR-RPS-2**

```bash
git add packages/ui/src/components/InvestigationWall/
git commit -m "feat(ui): HypothesisCard renders needs-disconfirmation status + 1-step-away badge"
git push
```

**Open PR-RPS-2.** Same review pattern as PR-RPS-1.

---

## PR-RPS-3: Wall Detective-pack — mini-charts inside HypothesisCard

> **Goal:** Populate the chart slot at `HypothesisCard.tsx:170` (currently empty `<rect>`) with the appropriate chart type per hypothesis evidence — I-Chart for time-series factor, Boxplot for categorical, scatter for continuous-X. Per spec D12 + §15 OQ4 resolution.

### Task 10: `deriveMiniChartConfig()` — chart type selection from `Hypothesis.condition`

**Files:**

- Create: `packages/core/src/findings/miniChart.ts`
- Create: `packages/core/src/findings/__tests__/miniChart.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { deriveMiniChartConfig } from '../miniChart';
import type { Hypothesis } from '../types';

describe('deriveMiniChartConfig', () => {
  it('returns i-chart for numeric factor', () => {
    const h = {
      condition: { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 95 },
    } as Hypothesis;
    const cfg = deriveMiniChartConfig(
      h,
      { 'NOZZLE.TEMP': 'numeric', thickness: 'numeric' },
      'thickness'
    );
    expect(cfg.type).toBe('i-chart');
    expect(cfg.factor).toBe('NOZZLE.TEMP');
  });

  it('returns boxplot for categorical factor', () => {
    const h = {
      condition: { kind: 'leaf', column: 'SUPPLIER', op: 'eq', value: 'B' },
    } as Hypothesis;
    const cfg = deriveMiniChartConfig(
      h,
      { SUPPLIER: 'categorical', thickness: 'numeric' },
      'thickness'
    );
    expect(cfg.type).toBe('boxplot');
  });

  it('returns placeholder when no condition', () => {
    const h = {} as Hypothesis;
    const cfg = deriveMiniChartConfig(h, {}, 'thickness');
    expect(cfg.type).toBe('placeholder');
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/core test miniChart
```

Expected: FAIL.

- [ ] **Step 3: Implement helper**

```ts
// packages/core/src/findings/miniChart.ts
import type { Hypothesis } from './types';
import type { HypothesisCondition } from './hypothesisCondition';

export type MiniChartType = 'i-chart' | 'boxplot' | 'scatter' | 'placeholder';

export interface MiniChartConfig {
  type: MiniChartType;
  factor?: string;
  outcome?: string;
}

function firstLeafColumn(c: HypothesisCondition): string | undefined {
  if (c.kind === 'leaf') return c.column;
  if (c.kind === 'and' || c.kind === 'or') {
    for (const child of c.children) {
      const col = firstLeafColumn(child);
      if (col) return col;
    }
  }
  if (c.kind === 'not') return firstLeafColumn(c.child);
  return undefined;
}

export function deriveMiniChartConfig(
  h: Hypothesis,
  columnTypes: Record<string, 'numeric' | 'categorical' | 'continuous-x'>,
  outcome?: string
): MiniChartConfig {
  if (!h.condition) return { type: 'placeholder' };
  const factor = firstLeafColumn(h.condition);
  if (!factor) return { type: 'placeholder' };
  const type = columnTypes[factor];
  if (type === 'numeric') return { type: 'i-chart', factor, outcome };
  if (type === 'categorical') return { type: 'boxplot', factor, outcome };
  if (type === 'continuous-x') return { type: 'scatter', factor, outcome };
  return { type: 'placeholder', factor };
}
```

- [ ] **Step 4: Run passing test**

```bash
pnpm --filter @variscout/core test miniChart
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/findings/miniChart.ts packages/core/src/findings/__tests__/miniChart.test.ts
git commit -m "feat(core): deriveMiniChartConfig — chart type from Hypothesis.condition + column data type"
```

---

### Task 11: Create `MiniIChart` component for HypothesisCard slot

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/MiniIChart.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/MiniIChart.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MiniIChart } from '../MiniIChart';

describe('MiniIChart', () => {
  it('renders an SVG path for the time-series data', () => {
    render(
      <MiniIChart
        values={[1, 2, 3, 4, 5]}
        width={248}
        height={72}
        brushedRange={{ start: 1, end: 3 }}
      />
    );
    expect(screen.getByTestId('mini-i-chart-path')).toBeInTheDocument();
    expect(screen.getByTestId('mini-i-chart-brush')).toBeInTheDocument();
  });

  it('omits brush rect when no brushedRange', () => {
    render(<MiniIChart values={[1, 2, 3]} width={248} height={72} />);
    expect(screen.queryByTestId('mini-i-chart-brush')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @variscout/ui test MiniIChart
```

Expected: FAIL.

- [ ] **Step 3: Implement MiniIChart**

```tsx
// MiniIChart.tsx
import { useChartTheme } from '@variscout/charts';

interface MiniIChartProps {
  values: number[];
  width: number;
  height: number;
  brushedRange?: { start: number; end: number }; // index range
}

export function MiniIChart({ values, width, height, brushedRange }: MiniIChartProps) {
  const theme = useChartTheme();
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1 || 1);

  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      {brushedRange && (
        <rect
          data-testid="mini-i-chart-brush"
          x={brushedRange.start * stepX}
          y={0}
          width={(brushedRange.end - brushedRange.start) * stepX}
          height={height}
          fill={theme.colors.accent}
          fillOpacity={0.15}
          stroke={theme.colors.accent}
          strokeOpacity={0.5}
        />
      )}
      <path
        data-testid="mini-i-chart-path"
        d={path}
        fill="none"
        stroke={theme.colors.line}
        strokeWidth={1.5}
      />
    </svg>
  );
}
```

- [ ] **Step 4: Run passing test**

```bash
pnpm --filter @variscout/ui test MiniIChart
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/InvestigationWall/MiniIChart.tsx packages/ui/src/components/InvestigationWall/__tests__/MiniIChart.test.tsx
git commit -m "feat(ui): MiniIChart — inline I-Chart renderer for HypothesisCard slot"
```

---

### Task 12: Create `MiniBoxplot` component

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/MiniBoxplot.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/MiniBoxplot.test.tsx`

Follow the same TDD shape as Task 11. Component renders a simplified boxplot showing per-category distributions with the highlighted category emphasized.

- [ ] **Step 1: Failing test verifies category boxes render + highlight**
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Implement MiniBoxplot — receives `Array<{ category: string; values: number[]; highlighted?: boolean }>`; renders min/Q1/median/Q3/max boxes per category; highlighted category gets accent border**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(ui): MiniBoxplot — inline boxplot renderer for HypothesisCard slot`**

---

### Task 13: Create `MiniScatter` component (continuous-X factor)

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/MiniScatter.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/MiniScatter.test.tsx`

Same TDD pattern. Renders factor (X) vs outcome (Y) scatter. Highlighted points = brushed/pinned findings.

- [ ] **Step 1: Failing test**
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Implement (canvas with `<circle>` points; opacity 0.4 for default, 1.0 for highlighted)**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(ui): MiniScatter — inline scatter renderer for HypothesisCard slot`**

---

### Task 14: Wire mini-charts into `HypothesisCard` slot via `useMiniChartData()` hook

**Files:**

- Create: `packages/hooks/src/useMiniChartData.ts`
- Modify: `packages/ui/src/components/InvestigationWall/HypothesisCard.tsx`
- Create: `packages/ui/src/components/InvestigationWall/__tests__/HypothesisCard.miniChart.test.tsx`

- [ ] **Step 1: Failing test — HypothesisCard renders MiniIChart for numeric factor**

```tsx
it('renders MiniIChart inside the chart slot when factor is numeric', () => {
  const hub = {
    /* ... condition with numeric factor */
  } as never;
  render(<HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />);
  expect(screen.getByTestId('mini-i-chart-path')).toBeInTheDocument();
});
```

- [ ] **Step 2: pnpm test → fail**

- [ ] **Step 3: Implement hook + integrate**

```ts
// packages/hooks/src/useMiniChartData.ts
import { useMemo } from 'react';
import { deriveMiniChartConfig, type MiniChartConfig } from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core/findings';

export function useMiniChartData(
  hypothesis: Hypothesis,
  rows: Array<Record<string, unknown>>,
  columnTypes: Record<string, 'numeric' | 'categorical' | 'continuous-x'>,
  outcome?: string
): MiniChartConfig & {
  values?: number[];
  categories?: Array<{ category: string; values: number[]; highlighted?: boolean }>;
} {
  return useMemo(() => {
    const cfg = deriveMiniChartConfig(hypothesis, columnTypes, outcome);
    if (cfg.type === 'i-chart' && cfg.factor) {
      const values = rows.map(r => Number(r[cfg.factor!])).filter(v => Number.isFinite(v));
      return { ...cfg, values };
    }
    if (cfg.type === 'boxplot' && cfg.factor) {
      const groups = new Map<string, number[]>();
      for (const row of rows) {
        const cat = String(row[cfg.factor!]);
        const yVal = outcome ? Number(row[outcome]) : NaN;
        if (Number.isFinite(yVal)) {
          if (!groups.has(cat)) groups.set(cat, []);
          groups.get(cat)!.push(yVal);
        }
      }
      const categories = [...groups.entries()].map(([category, values]) => ({
        category,
        values,
        highlighted: false, // V1: no specific highlight; per-finding highlight comes in PR-RPS-4
      }));
      return { ...cfg, categories };
    }
    return cfg;
  }, [hypothesis, rows, columnTypes, outcome]);
}
```

In `HypothesisCard.tsx`, replace the empty chart-slot `<rect>` at line 170 with conditional mini-chart rendering:

```tsx
const chartConfig = useMiniChartData(hub, rows, columnTypes, outcome);
const slotX = 16, slotY = 64, slotW = CARD_W - 32, slotH = 72;

return (
  // ... existing card chrome ...
  <foreignObject x={slotX} y={slotY} width={slotW} height={slotH}>
    {chartConfig.type === 'i-chart' && chartConfig.values && (
      <MiniIChart values={chartConfig.values} width={slotW} height={slotH} />
    )}
    {chartConfig.type === 'boxplot' && chartConfig.categories && (
      <MiniBoxplot categories={chartConfig.categories} width={slotW} height={slotH} />
    )}
    {chartConfig.type === 'scatter' && /* MiniScatter wiring */}
    {chartConfig.type === 'placeholder' && (
      <div className="text-xs text-content-secondary italic p-2">
        + Brush {chartConfig.factor ?? 'a column'} ↓
      </div>
    )}
  </foreignObject>
);
```

`HypothesisCardProps` adds `rows` + `columnTypes` props (passed from `WallCanvas`).

- [ ] **Step 4: pnpm test → pass**

- [ ] **Step 5: Commit `feat(ui): wire mini-charts into HypothesisCard slot via useMiniChartData`**

---

### Task 15: Update `WallCanvas` to pass `rows` + `columnTypes` to all `HypothesisCard` instances

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/WallCanvas.tsx`

- [ ] **Step 1: Failing test** — WallCanvas renders mini-charts when rows passed
- [ ] **Step 2: pnpm test → fail (props missing)**
- [ ] **Step 3: Add `rows` + `columnTypes` to `WallCanvasProps`; pass through to each HypothesisCard. Apps (PWA + Azure InvestigationWorkspace) plumb rows from current EvidenceSnapshot.**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit + push PR-RPS-3 `feat(ui): WallCanvas passes rows + columnTypes to HypothesisCards (mini-chart wiring)`**

**Open PR-RPS-3.** Run `--chrome` walk per `feedback_verify_before_push` — this is user-visible (vision slide 2 H1 + H2 charts now render).

---

## PR-RPS-4: Wall Detective-pack — brush-to-pin gesture + missing-evidence panel

> **Goal:** Implement brush-to-pin-finding gesture on mini-charts (interactive lasso/brush that creates a Finding from the brushed region) + render the "MISSING EVIDENCE — THE DETECTIVE MOVE NOBODY SHIPS" panel. Per spec D12 gap #2 + §5 category 2.

### Task 16: Add brush gesture handler to `MiniIChart` + `MiniBoxplot`

**Files:**

- Modify: `MiniIChart.tsx` + `MiniBoxplot.tsx` (add onBrush prop)
- Create: `packages/hooks/src/useBrushGesture.ts`

- [ ] **Step 1: Failing test** — pointer-down + drag on chart fires onBrush with index range
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Implement `useBrushGesture()` hook (pointer-down → pointer-move → pointer-up tracking returning normalized index range); MiniIChart + MiniBoxplot consume it**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(ui): brush gesture handler on MiniIChart + MiniBoxplot`**

---

### Task 17: Wire brushed range → `addFinding` dispatch via `BrushToFindingFlow`

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/BrushToFindingFlow.tsx`
- Modify: `HypothesisCard.tsx` (consume the flow)

- [ ] **Step 1: Failing test** — completing a brush opens "Pin as finding?" confirmation; click → dispatches FINDING_ADD
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Implement flow component (manages brush state → confirmation popover → dispatch); HypothesisCard wraps mini-chart with this flow**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(ui): brush-to-pin-finding flow — dispatches FINDING_ADD with brushed region`**

---

### Task 18: Create Survey rule — data-collection prompts (category 2)

**Files:**

- Modify: `packages/core/src/survey/wall.ts` (add data-collection rule)
- Modify: `packages/core/src/survey/__tests__/wall.test.ts`

- [ ] **Step 1: Failing test** — hypothesis with only data evidence → emits "needs gemba" hint
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Add to `surveyWallRules`:**

```ts
// In surveyWallRules:
for (const h of hypotheses) {
  const types = evidenceTypesForHypothesis(h, findings);
  if (types.size === 1 && h.findingIds.length > 0) {
    const missingTypes = ['data', 'gemba', 'expert'].filter(t => !types.has(t as never));
    hints.push({
      kind: 'data-collection',
      surface: 'wall',
      targetEntityId: h.id,
      message: `${h.name} has ${[...types][0]} only — needs ${missingTypes.join(' or ')} to triangulate`,
      severity: 'info',
      action: { label: `Try ${missingTypes[0]} evidence` },
    });
  }
}
```

- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(core): Survey wall rule — data-collection prompts (category 2)`**

---

### Task 19: Render missing-evidence panel on `WallCanvas`

**Files:**

- Create: `packages/ui/src/components/InvestigationWall/MissingEvidencePanel.tsx` (the existing one is a stub; replace with rule-driven version)
- Modify: `WallCanvas.tsx`

- [ ] **Step 1: Failing test** — Wall renders a "MISSING EVIDENCE" panel when surveyWallRules emits data-collection hints
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Implement panel — accepts SurveyHint[] filtered to data-collection + triangulation-readiness; renders dashed-amber section per vision slide 3**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(ui): MissingEvidencePanel rendering data-collection + triangulation-readiness Survey hints`**

---

### Task 20: E2E walkthrough — brush a region, pin as finding, watch hypothesis status advance

**Files:**

- Create: `apps/azure/playwright/wall-brush-to-pin.spec.ts`

- [ ] **Step 1: E2E spec** — open Wall on a seeded Hub; brush an I-Chart region inside HypothesisCard; confirm "Pin as finding"; verify Finding count increments + hypothesis status changes
- [ ] **Step 2: `pnpm --filter @variscout/azure-app test:e2e wall-brush-to-pin` → fail (feature not yet seeded into demo data)**
- [ ] **Step 3: Update demo Hub seed to include hypotheses with empty mini-charts; run E2E green**
- [ ] **Step 4: pnpm test:e2e → pass**
- [ ] **Step 5: Commit + push PR-RPS-4 `test(azure-e2e): brush-to-pin-finding flow on Wall HypothesisCard`**

**Open PR-RPS-4.** `--chrome` walk; vision-faithful Detective UX is now live.

---

## PR-RPS-5: Improvement Project V1 — types, persistence, store, .vrs

> **Goal:** Engine layer for IP. Types + actions + PWA/Azure persistence handlers + Zustand store + .vrs round-trip. No UI yet (lands in PR-RPS-6). Per spec §3 + §4 + D8 + D9.

### Task 21: Create `ImprovementProject` type with multi-level Goal

**Files:**

- Create: `packages/core/src/improvementProject/types.ts`
- Create: `packages/core/src/improvementProject/index.ts`
- Modify: `packages/core/package.json` (add `./improvementProject` sub-path)
- Create: `packages/core/src/improvementProject/__tests__/types.test.ts`

- [ ] **Step 1: Failing test** — minimal IP compiles with multi-level Goal

```ts
import type { ImprovementProject, ImprovementProjectStatus } from '../types';

it('compiles with required title + multi-level Goal', () => {
  const ip: ImprovementProject = {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 0,
    deletedAt: null,
    status: 'draft',
    metadata: { title: 'Heads 5-8 lift' },
    goal: {
      outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 },
      factorControls: [
        { factor: 'NOZZLE.TEMP', targetCondition: 'in control 95±2°C', linkedHypothesisId: 'h-1' },
      ],
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    updatedAt: 0,
  };
  expect(ip.metadata.title).toBe('Heads 5-8 lift');
});
```

- [ ] **Step 2: pnpm test → fail**

- [ ] **Step 3: Implement type**

```ts
// packages/core/src/improvementProject/types.ts
import type { EntityBase } from '../identity';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessParticipantRef,
  ProcessHubInvestigation,
} from '../processHub';
import type { Hypothesis, Finding, ImprovementIdea, ActionItem } from '../findings/types';
import type { SustainmentRecord, ControlHandoff } from '../sustainment';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

export interface ImprovementProjectMetadata {
  title: string; // required
  businessCase?: string;
  financialImpact?: { amount?: number; currency: string };
  team?: Array<{
    role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
    person: ProcessParticipantRef;
  }>;
  investigationId?: ProcessHubInvestigation['id'];
}

export interface ImprovementProjectOutcomeGoal {
  outcomeSpecId: OutcomeSpec['id'];
  baseline?: number;
  target: number;
  deadline?: string;
}

export interface ImprovementProjectFactorControl {
  factor: string;
  targetCondition: string;
  linkedHypothesisId?: Hypothesis['id'];
}

export interface ImprovementProjectMechanismGoal {
  description: string;
  linkedFindingIds?: Finding['id'][];
}

export interface ImprovementProjectGoal {
  outcomeGoal: ImprovementProjectOutcomeGoal; // Y-level required
  factorControls?: ImprovementProjectFactorControl[]; // X-level
  mechanismGoals?: ImprovementProjectMechanismGoal[]; // x-level
  freeText?: string; // fallback when no OutcomeSpec available
}

export interface ImprovementProjectBackgroundSection {
  /** Snapshot copy of capability summary at IP open. Drift indicator triggers refresh. */
  snapshotText?: string;
  snapshottedAt?: string;
  manualNarrative?: string;
}

export interface ImprovementProjectInvestigationLineageSection {
  hypothesisIds?: Hypothesis['id'][];
  findingIds?: Finding['id'][];
}

export interface ImprovementProjectApproachSection {
  improvementIdeaIds?: ImprovementIdea['id'][];
  actionItemIds?: ActionItem['id'][];
  narrative?: string;
}

export interface ImprovementProjectOutcomeReferenceSection {
  sustainmentRecordId?: SustainmentRecord['id'];
  controlHandoffId?: ControlHandoff['id'];
}

export interface ImprovementProjectSignoff {
  requestedAt?: number;
  approvedAt?: number;
  approvedBy?: ProcessParticipantRef;
}

export interface ImprovementProject extends EntityBase {
  hubId: ProcessHub['id'];
  status: ImprovementProjectStatus;
  metadata: ImprovementProjectMetadata;
  goal: ImprovementProjectGoal;
  sections: {
    background: ImprovementProjectBackgroundSection;
    investigationLineage: ImprovementProjectInvestigationLineageSection;
    approach: ImprovementProjectApproachSection;
    outcomeReference: ImprovementProjectOutcomeReferenceSection;
  };
  updatedAt: number;
  signoff?: ImprovementProjectSignoff;
}
```

Add to `packages/core/package.json` exports: `"./improvementProject": "./src/improvementProject/index.ts"`. Barrel re-exports.

- [ ] **Step 4: pnpm test → pass**

- [ ] **Step 5: Commit `feat(core): ImprovementProject type with multi-level Y/X/x Goal`**

---

### Task 22: Add `ImprovementProjectAction` HubAction kind + extend `ProcessHub`

**Files:**

- Create: `packages/core/src/actions/improvementProjectActions.ts`
- Modify: `packages/core/src/actions/HubAction.ts` (extend union)
- Modify: `packages/core/src/actions/__tests__/exhaustiveness.test.ts`
- Modify: `packages/core/src/processHub.ts` (add `improvementProjects?` field)

- [ ] **Step 1: Failing test** — exhaustiveness for new kinds + ProcessHub field
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Same shape as the prior IP V1 plan Task 2-4 (3 kinds: CREATE / UPDATE / ARCHIVE; in-memory hydrated `improvementProjects?: ImprovementProject[]` on ProcessHub via inline import type)**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(core): IMPROVEMENT_PROJECT_* HubAction kinds + ProcessHub.improvementProjects?`**

---

### Task 23: PWA persistence — `improvementProjects` Dexie table + handlers

**Files:**

- Modify: `apps/pwa/src/db/schema.ts`
- Modify: `apps/pwa/src/persistence/applyAction.ts` (3 case branches)
- Modify: `apps/pwa/src/persistence/PwaHubRepository.ts` (hydrate on read)
- Create: `apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts`

- [ ] **Step 1: Failing test** — CREATE / UPDATE / ARCHIVE on PWA Dexie
- [ ] **Step 2: pnpm test → fail**
- [ ] **Step 3: Add table + handlers per the prior IP V1 plan Task 4 pattern (full code there). The patch handler must deep-merge `goal` AND `sections` (4 nested objects).**
- [ ] **Step 4: pnpm test → pass**
- [ ] **Step 5: Commit `feat(pwa): persistence handlers for IMPROVEMENT_PROJECT_* + Dexie improvementProjects table`**

---

### Task 24: Azure persistence — `improvementProjects` Dexie table + handlers

Same shape as Task 23 for Azure. Use `azureHubRepository` + Azure `db` import pattern. Same 5-step TDD.

- [ ] **Step 1-5:** mirror Task 23 with Azure imports.

---

### Task 25: `useImprovementProjectStore` Zustand store

**Files:**

- Create: `packages/stores/src/improvementProjectStore.ts`
- Create: `packages/stores/src/__tests__/improvementProjectStore.test.ts`
- Modify: `packages/stores/src/index.ts`

Same shape as the prior IP V1 plan Task 7 (in-memory hydrated projection by hubId; `setProjectsForHub` / `getProjectsForHub` / `upsertProject` / `removeProject`).

- [ ] **Step 1-5:** standard 5-step TDD.

---

### Task 26: `.vrs` round-trip integration test

Same shape as prior IP V1 plan Task 6. Verify `vrsExport` + `vrsImport` carry `improvementProjects` through ProcessHub serialization.

- [ ] **Step 1-5:** standard 5-step TDD.

---

### Task 27: Live-document state-machine helpers — `useLiveProjection` + `shouldShowDrift`

**Files:**

- Create: `packages/hooks/src/useLiveProjection.ts`
- Create: `packages/core/src/improvementProject/snapshot.ts`
- Create: tests

- [ ] **Step 1: Failing tests**

```ts
// snapshot.test.ts
import { shouldShowDrift, computeSourceHash } from '../snapshot';

it('returns true when source hash differs', () => {
  expect(shouldShowDrift({ value: 'a', sourceHash: 'h1' }, { value: 'a', hash: 'h2' })).toBe(true);
});

it('returns false when hashes match', () => {
  expect(shouldShowDrift({ value: 'a', sourceHash: 'h1' }, { value: 'a', hash: 'h1' })).toBe(false);
});
```

- [ ] **Step 2: pnpm test → fail**

- [ ] **Step 3: Implement primitives**

```ts
// packages/core/src/improvementProject/snapshot.ts
export function computeSourceHash(value: unknown): string {
  return (
    JSON.stringify(value).length.toString(36) +
    '-' +
    Math.abs(hashCode(JSON.stringify(value))).toString(36)
  );
}
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
export function shouldShowDrift<T>(
  snapshot: { value: T; sourceHash: string },
  current: { value: T; hash: string }
): boolean {
  return snapshot.sourceHash !== current.hash;
}
```

```ts
// packages/hooks/src/useLiveProjection.ts
import { useMemo } from 'react';

export function useLiveProjection<T>(
  fkList: string[],
  fetchBatch: (ids: string[]) => Map<string, T>
): T[] {
  return useMemo(() => {
    const batch = fetchBatch(fkList);
    return fkList.map(id => batch.get(id)).filter((v): v is T => v !== undefined);
  }, [fkList, fetchBatch]);
}
```

- [ ] **Step 4: pnpm test → pass**

- [ ] **Step 5: Commit + push PR-RPS-5 `feat: ImprovementProject engine — types + actions + persistence + store + .vrs + live-document primitives`**

**Open PR-RPS-5.** No user-visible changes; `pr-ready-check.sh` only.

---

## PR-RPS-6: IP V1 — 6-section UI + multi-level Goal + CollapsibleSection

> **Goal:** Build the `ImprovementProjectForm` shared component composition. 6 sections + CollapsibleSection wrapper + ProgressIndicator + HeaderMetadata + multi-level Goal section. Per spec §3 D8.

### Task 28: `ImprovementProjectForm` shell + ProgressIndicator + CollapsibleSection

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx`
- Create: `packages/ui/src/components/ImprovementProject/ProgressIndicator.tsx`
- Create: `packages/ui/src/components/ImprovementProject/CollapsibleSection.tsx`
- Create: tests

Same shape as the prior IP V1 plan Task 8. ProgressIndicator (8 segments → adapt to 6 sections), CollapsibleSection (default-open prop), Form shell (mounts everything).

Adapt to 6 sections: progress bar shows 6 segments; default-open: sections 1+2 (Metadata + Background); 3-6 collapsed.

- [ ] **Step 1-5:** standard 5-step TDD.
- [ ] **Step 5 commit:** `feat(ui): ImprovementProjectForm shell + ProgressIndicator (6 segments) + CollapsibleSection`

---

### Task 29: `HeaderMetadataSection` (Section 1) — title + team + business case

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/HeaderMetadataSection.tsx`
- Create: tests

Renders structured controls for title (required), team (role-typed array), business case (multi-line), financial impact (amount + currency), linked investigation FK picker.

- [ ] **Step 1-5:** TDD — title required validation; team add/remove rows; business case textarea; financial impact number input; investigation picker dropdown.

---

### Task 30: `BackgroundSection` (Section 2) — snapshot + drift indicator + narrative

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/BackgroundSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/BackgroundSnapshot.tsx`
- Create: tests

Auto-snapshot panel + manual narrative below + ↻ Refresh button when drift detected (per spec §11 + Task 27 primitives).

- [ ] **Step 1-5:** TDD — drift indicator visibility; refresh button click → updates snapshot; narrative textarea independent of snapshot.

---

### Task 31: `GoalSection` (Section 3) — multi-level Y/X/x Goal

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/GoalSection.tsx`
- Create: tests

Renders three sub-panels:

- Y-level: OutcomeSpec picker + baseline + target + deadline (free-text fallback for no-OutcomeSpec hubs)
- X-level: factor + condition + linkedHypothesisId picker; can add multiple rows; auto-suggests from confirmed Hypotheses (Survey rule)
- x-level: free-form description + linkedFindingIds picker

- [ ] **Step 1-5:** TDD — Y required; X auto-suggest from confirmed hypotheses; x optional.
- [ ] **Step 5 commit:** `feat(ui): GoalSection — multi-level Y/X/x with auto-suggested factor controls from confirmed Hypotheses`

---

### Task 32: `InvestigationLineageSection` (Section 4) — FK lists + click-through to Wall

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/InvestigationLineageSection.tsx`
- Create: tests

Renders linked Hypothesis chips + linked Finding chips. Each clickable → triggers cross-surface navigation (badges pattern per spec §7). NO manual narrative — work happens on Wall.

- [ ] **Step 1-5:** TDD — chips render with hypothesis/finding metadata; click fires onNavigate callback.

---

### Task 33: `ApproachSection` (Section 5) — ImprovementIdea + ActionItem FKs + narrative

Same FK-list pattern as Task 32, plus a narrative textarea for the "approach" prose.

- [ ] **Step 1-5:** standard.

---

### Task 34: `OutcomeReferenceSection` (Section 6) — read-only forward-references to Sustainment + Handoff

Renders: linked SustainmentRecord summary (status badge + title) + linked ControlHandoff summary. Read-only; click navigates to that artifact's form.

- [ ] **Step 1-5:** standard. Empty state: "Sustainment: not yet started — set up after Improvement closes."
- [ ] **Step 5 commit (and push PR-RPS-6):** `feat(ui): ImprovementProject 6-section form complete (Background / Goal / Lineage / Approach / OutcomeRef)`

**Open PR-RPS-6.** Component-level testing in `--chrome` (mount form on a dev page with seeded data).

---

## PR-RPS-7: IP V1 — per-app shells + canvas-card pickers + cross-surface badges

> **Goal:** Wire `ImprovementProjectForm` into PWA + Azure apps. Replace 8a stub destinations. Implement canvas-card picker for 2+ existing IPs. Build `ContextBadgesRow` per spec §7. Per spec §3 + §7 + D13 + D14.

### Task 35: PWA — replace `CharterPanel.tsx` with `ImprovementProjectPanel.tsx`

Same shape as prior IP V1 plan Task 15. The IP panel auto-creates draft if none exists; opens picker for 2+; opens existing for 1.

- [ ] **Step 1-5:** TDD per app-level integration. Use `pwaHubRepository.dispatch()`.

---

### Task 36: Azure — same as Task 35 but for Azure

- [ ] **Step 1-5:** mirror Task 35 with Azure imports.

---

### Task 37: `ContextBadgesRow` component — universal cross-surface link badge

**Files:**

- Create: `packages/ui/src/components/CrossSurface/ContextBadgesRow.tsx`
- Create: `packages/ui/src/components/CrossSurface/MultiLinkPicker.tsx`
- Create: tests

`ContextBadgesRow` renders icon + count badges for each surface type (IPs, Wall threads, Quick Actions, Sustainment, Handoff). Single-link → direct navigate; multi-link → opens MultiLinkPicker overlay.

- [ ] **Step 1-5:** TDD — N=1 click navigates; N>1 click opens picker; picker click navigates.

---

### Task 38: Mount `ContextBadgesRow` on canvas-card drill-down

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasStepOverlay.tsx`

- [ ] **Step 1-5:** TDD — overlay shows badges row above CTAs; counts match linked entities.

---

### Task 39: Single-level back navigation via session storage

**Files:**

- Create: `packages/hooks/src/useReturnNavigation.ts`
- Modify: ImprovementProjectForm + WallCanvas to use it

- [ ] **Step 1-5:** TDD — navigate-out captures state; "← Back to X" badge appears at destination; click restores scroll + expand state.
- [ ] **Step 5 commit + push PR-RPS-7:** `feat: cross-surface navigation — ContextBadgesRow + MultiLinkPicker + single-level back via session storage`

**Open PR-RPS-7.** Full `--chrome` walk: canvas card → drill-down → IP CTA → form → click linked Hypothesis → Wall → back.

---

## PR-RPS-8: Quick Action surface + Recent activity panel

> **Goal:** Wire path 1 of 5 — Quick Action via inline modal creating an orphan ActionItem. Plus "Recent activity" expandable section on canvas-card overlay. Per spec §10 + D14.

### Task 40: `LogActionModal` component — dual flavor "Done now" / "Assign to"

**Files:**

- Create: `packages/ui/src/components/QuickAction/LogActionModal.tsx`
- Create: tests

Modal with text input + radio selector (Done now / Assign to + owner picker + due date). Submits → fires `onLog({ text, status, assignedTo?, dueAt? })`.

- [ ] **Step 1-5:** TDD — both flavors emit correct shape.

---

### Task 41: Wire `LogActionModal` to canvas card "Quick Action" CTA → dispatch `ACTION_ITEM_ADD`

**Files:**

- Modify: `apps/pwa/src/components/Canvas/CanvasStepOverlay.tsx` (or wherever Quick Action CTA lives)
- Modify: same for Azure

- [ ] **Step 1-5:** TDD — Quick Action CTA opens modal; submit → dispatches ACTION_ITEM_ADD with `parentImprovementProjectId: null`, `parentImprovementIdeaId: null`, `stepId: <step>`.

---

### Task 42: `RecentActivityPanel` component — collapsed expandable list of orphan ActionItems

**Files:**

- Create: `packages/ui/src/components/QuickAction/RecentActivityPanel.tsx`
- Create: tests

Renders a list of orphan ActionItems for a step. Click a row → see details modal. Expand-collapse via `<details>` element.

- [ ] **Step 1-5:** TDD — rendering, expand/collapse, click row.

---

### Task 43: Mount `RecentActivityPanel` on canvas-card drill-down + E2E

**Files:**

- Modify: canvas-card overlay components in both apps
- Create: `apps/pwa/playwright/quick-action.spec.ts`

- [ ] **Step 1-5:** TDD + E2E. E2E: open card → Quick Action → fill form → submit → verify Recent activity shows it.
- [ ] **Step 5 commit + push PR-RPS-8:** `feat: Quick Action surface (LogActionModal + RecentActivityPanel) + canvas-card wiring`

**Open PR-RPS-8.** `--chrome` walk.

---

## PR-RPS-9: Sustainment V1 + Inbox prompts + signal computation

> **Goal:** Path 4 of 5 — Sustainment artifact with cadence-tick monitoring, drift detection, Inbox prompts. Per spec §4 + §5 + D10.

### Task 44: `SustainmentRecord` engine extension — `consecutiveOnTargetTicks` field + `SUSTAINMENT_TICK_EVALUATED` action

**Files:**

- Modify: `packages/core/src/sustainment/types.ts` (extend SustainmentRecord)
- Modify: `packages/core/src/actions/` — new sustainmentActions kinds
- Modify: PWA + Azure persistence handlers

Add `consecutiveOnTargetTicks: number` and `hasOverride: boolean` to SustainmentRecord. New HubAction kind `SUSTAINMENT_TICK_EVALUATED`. Auto-fired by `EVIDENCE_ADD_SNAPSHOT` handler when `EvidenceSnapshot` lands on a Hub with active SustainmentRecords.

- [ ] **Step 1-5:** TDD — counter increments on onTarget=true; auto-fires `SUSTAINMENT_CONFIRM` when N=4 (per OQ5 resolution).

---

### Task 45: Survey rule — drift detection + lifecycle gaps for Sustainment

**Files:**

- Create: `packages/core/src/survey/sustainment.ts`
- Modify: `packages/core/src/survey/index.ts`
- Tests

Categories 5 + 6 from spec §5: drift detection ("tick 3 of 4 below target"), lifecycle gaps ("IP closed 30 days, no Sustainment recorded").

- [ ] **Step 1-5:** TDD per rule.

---

### Task 46: `SustainmentForm` UI component (mirrors IP form structure)

**Files:**

- Create: `packages/ui/src/components/Sustainment/SustainmentForm.tsx`
- Sections: metadata (title, target, monitoring schedule); current status (auto-pulled); review history; multi-level Goal carry-forward from IP

- [ ] **Step 1-5:** TDD — form renders; review history shows tick verdicts.

---

### Task 47: Per-app Sustainment shells (PWA + Azure) + canvas-card CTA wiring

Mirror PR-RPS-7's pattern for Sustainment.

- [ ] **Step 1-5:** TDD + integration.

---

### Task 48: `InboxDigest` component — Hub-overview prompts aggregator

**Files:**

- Create: `packages/ui/src/components/Inbox/InboxDigest.tsx`
- Create: `packages/core/src/survey/inbox.ts` (aggregates per-domain rules into Inbox-suitable hints)

Renders the Inbox digest at Hub-overview top per D10.C. Each prompt has a CTA button that navigates to the relevant surface.

- [ ] **Step 1-5:** TDD — digest renders prompts; click CTA navigates.

---

### Task 49: Mount `InboxDigest` in both apps' Hub-overview

- [ ] **Step 1-5:** integration + E2E.
- [ ] **Step 5 commit + push PR-RPS-9:** `feat: Sustainment V1 + Inbox digest + drift detection + chain-prompt Survey rules`

**Open PR-RPS-9.** Full `--chrome` walk including: ingest new data → snapshot tick → Sustainment counter increments → after 4 ticks → auto-confirm; Inbox shows the prompt.

---

## PR-RPS-10: Handoff V1 + Inbox prompts + sponsor signoff (paid)

> **Goal:** Path 5 of 5 — Handoff artifact + sponsor signoff (paid-tier feature with visible-with-lock for free). Per spec §4 + D10.

### Task 50: `ControlHandoff` engine — state enum + signoff event

**Files:**

- Modify: `packages/core/src/sustainment/types.ts` (extend ControlHandoff with `acknowledgedAt`, `operationalAt`, signoff fields)
- New HubAction kinds: `CONTROL_HANDOFF_*`
- PWA + Azure persistence handlers

State enum: `pending → acknowledged → operational`. Sponsor signoff state stored on `signoff?: ImprovementProjectSignoff`-like field.

- [ ] **Step 1-5:** TDD — transitions; signoff fields.

---

### Task 51: `HandoffForm` UI component

**Files:**

- Create: `packages/ui/src/components/Handoff/HandoffForm.tsx`
- Sections: metadata (process owner, escalation path, reaction plan); linked Sustainment summary; signoff block (paid-tier visible / free-tier locked-with-upsell)

Same `TeamSignoffSection`-style affordance from prior IP V1 plan Task 14 — visible with lock icon for free; active button for paid.

- [ ] **Step 1-5:** TDD — paid-tier shows active button; free-tier shows locked icon + tooltip.

---

### Task 52: Survey rule — Handoff lifecycle gaps + owner-acknowledgment delay

**Files:**

- Create: `packages/core/src/survey/handoff.ts`
- Tests

Category 6: "Handoff pending owner acknowledgment 7+ days." Category 6: "Sustainment confirmed 6 weeks — record handoff?"

- [ ] **Step 1-5:** TDD per rule.

---

### Task 53: Per-app Handoff shells + canvas-card CTA wiring

Mirror PR-RPS-9 pattern.

- [ ] **Step 1-5:** TDD + integration.

---

### Task 54: Final E2E — full lifecycle test (cadence wake → drill → IP → improve → Sustainment → Handoff)

**Files:**

- Create: `apps/azure/playwright/full-lifecycle.spec.ts`

Single E2E spec walks the complete 8-station journey on a seeded mature Hub. Verifies:

- Cadence tick produces snapshot
- Survey badges appear on cards
- Drill-down → IP creation → Cause Analysis prefilled from Wall
- Improvement implemented → Effect Confirmation auto-pulls
- Sustainment scheduled → ticks count → auto-confirm
- Handoff opens → sponsor signoff → operational
- Canvas card shows ✓

This is the validation E2E proving the system composes end-to-end.

- [ ] **Step 1-5:** comprehensive E2E.
- [ ] **Step 5 commit + push PR-RPS-10:** `feat: Handoff V1 + sponsor signoff (paid) + full-lifecycle E2E validation`

**Open PR-RPS-10.** Full `--chrome` walk through the entire 8-station journey on the demo Hub. Final-PR Opus code-reviewer pass.

---

## Verification checklist (run before EACH PR merge)

- [ ] `bash scripts/pr-ready-check.sh` green (tests + lint + docs:check)
- [ ] `pnpm --filter @variscout/ui build` green (catches cross-package type-export gaps per `feedback_ui_build_before_merge`)
- [ ] PWA `--chrome` walkthrough on the affected slice (per `feedback_verify_before_push`):
  - PR-RPS-1: pure refactor — skip walkthrough; verify build
  - PR-RPS-2/3/4: Wall-visible — full walk-through of Wall surface
  - PR-RPS-5: not user-visible — skip walkthrough
  - PR-RPS-6: component-level testing on dev page
  - PR-RPS-7/8/9/10: full canvas-drill-down walkthroughs per slice
- [ ] No `Math.random()` in any new code (use deterministic PRNG per `editing-statistics`)
- [ ] No hex literals in chart code (use `chartColors` per `.claude/rules/charts.md`)
- [ ] All section labels in plain English (no QC Story / Toyota / DMAIC jargon in UI per spec D2)
- [ ] `metadata.title` is the only required field on IP save (per spec §3 D8)
- [ ] Free-tier signoff button shows lock icon + tooltip per visible-with-lock pattern (spec D9 + Task 51)
- [ ] V1 paid signoff is the only paid feature inside the IP form (audit trail / comments / RACI / notifications stay deferred)
- [ ] Per-PR Opus code-reviewer pass before squash-merge

---

## ADR amendments to land (one PR at a time, each PR's amendment in its own commit)

- **PR-RPS-1**: ADR-053 amendment block (Hypothesis-as-downstream role); ADR-064 amendment block (rename + "hub" descriptor clarification)
- **PR-RPS-3**: spec §6 Wall vision Detective-pack progress note; vision §3.4 reference if visible
- **PR-RPS-7**: vision §2.4 + §5.3 amendment carry-forward (Charter → Improvement Project; in-panel rendering V1)
- **PR-RPS-9**: ADR-080 (named-future) authored — first instance of Sustainment auto-fire pattern documented as pattern reference
- **PR-RPS-10**: decision-log entry "RPS V1 SHIPPED — full lifecycle live"

---

## Notes

- **Subagent-driven workflow:** dispatch a fresh implementer per task, spec + quality reviewer per task, final code-reviewer at end of each PR. Implementer + reviewers default to **Sonnet**; final per-PR code-reviewer is **Opus** per `feedback_subagent_driven_default`. ≥70% Sonnet expected per PR.
- **Required reading before starting any PR:** spec at `docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md` (especially §3 IP shape, §4 chain transitions, §5 Survey rule categories, §7 cross-surface navigation, §8 entity inventory).
- **i18n locale stubs:** each PR adds keys to `en.ts`; other locales fallback to English. A separate i18n translation pass is out of V1 scope.
- **Documentation site updates:** roll up post-RPS-V1; not per-PR.
- **No backward compatibility per spec D15:** clean breaks throughout. Dev-fixture data resets via `pnpm dev:reset` per OQ7 resolution.
- **Slice-cap rule:** each PR's task count was sized at 3-7 tasks per `feedback_slice_size_cap`. PR-RPS-5 + PR-RPS-6 are at the upper edge (7) but justified by tight cohesion within those PRs.
