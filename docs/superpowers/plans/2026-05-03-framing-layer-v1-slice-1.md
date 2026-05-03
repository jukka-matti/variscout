---
title: Framing Layer V1 Slice 1 — Foundation (Mode B + Mode A.1 + PWA opt-in persistence)
audience: [engineer]
category: implementation
status: draft
date: 2026-05-03
related:
  - docs/superpowers/specs/2026-05-03-framing-layer-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/decision-log.md
---

# Framing Layer V1 Slice 1 — Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the smallest meaningful end-to-end framing-layer experience: a user (Mode B) can paste a CSV → state a process goal → confirm outcome(s) + (optional) specs + primary scope dimensions → land on the canvas with a goal banner + outcome pin; can opt in to "Save to this browser" for IndexedDB persistence; can export/import `.vrs` files; on PWA reopen with persistence opted in OR on Azure reopen always (Mode A.1), the canvas restores to the saved state.

**Architecture:** Hub-level primitives (process goal narrative, outcome list with specs, primary scope dimensions) extend the existing `ProcessHub` type. Stage 1 (goal narrative form with scaffold chips) and Stage 3 (outcome confirmation with inline specs per candidate + scope dimensions sub-step + graceful degradation banner) are new UI components added to the entry-to-canvas pathway. Goal context biases the existing `detectColumns()` ranking via a new optional parameter. PWA gains a Dexie schema with a single Hub table (loaded only after explicit user opt-in via "Save to this browser"); `.vrs` export/import is a serializer to/from a JSON file format. The canvas first paint shows a `GoalBanner` above and an `OutcomePin` at the right edge with specs / fallback chip. Trainers can use `.vrs` export to package datasets + Hub state for students.

**Tech Stack:** TypeScript + React + Vite + Vitest + Testing Library + Playwright (E2E) · Zustand (Azure stores) + React Context (PWA) · Dexie 4.x (existing in Azure, new in PWA) · pnpm + turbo monorepo · existing primitives (`detectColumns`, `inferMode`, `validateData`, `SpecEditor`, `InlineSpecEditor`, `ProcessMapBase`, `ProcessHealthBar`).

---

## Slice Scope

### In scope (V1 slice 1)

- Mode B Stages 1–3 + canvas first paint (PWA + Azure)
- Mode A.1 reopen (Azure always; PWA only if user opted in to persistence)
- PWA opt-in IndexedDB persistence (single Hub-of-one) — Q8-revised Option 4
- PWA `.vrs` file export/import (manual save/load + trainer scenario sharing)
- Azure ProcessHub schema extension to hold framing-layer fields
- `ProcessHub.processGoal`, `ProcessHub.outcomes[]`, `ProcessHub.primaryScopeDimensions[]` schema
- Goal-context biased outcome detection (extend `detectColumns()`)
- Multi-outcome validation (`validateData()` refactor)
- Inline per-candidate spec editor at Stage 3 (no σ-based suggestions)
- Characteristic-type-aware spec defaults
- Primary scope dimensions auto-suggest + multi-select
- Graceful degradation banner (no goal-keyword match)

### Out of scope (later slices)

- **Slice 2:** Stage 5 investigation entry modal (full implementation) + Mode A.2-paste (match-summary card with two-axis classifier) + Mode A.2-evidence-source background ingestion (Azure)
- **Slice 3:** Multi-source via shared keys (join detection + per-source provenance)
- **Slice 4:** Defect anchoring + Pareto on canvas (per-step mini + system) + two pickers + canvas-wide scope filter
- **Spec 2 (separate plan):** Manual canvas authoring (drag-to-connect, sub-step grouping, branch/join)
- **Spec 5 (separate plan):** Full IndexedDB schema for snapshots / investigations / findings (this slice only persists Hub-level state)

---

## Branching + Workflow

- **Branch:** `framing-layer-v1-slice-1`
- **Each task is one or more commits** on the branch (small, reviewable, TDD).
- **Pre-merge:** `bash scripts/pr-ready-check.sh` green (tests + lint + docs:check + dist-integrity).
- **Code review:** subagent-driven per-task review + final reviewer pass at the end (per `feedback_subagent_driven_default`).
- **Merge:** squash-merge to `main` after final reviewer approves.
- **Sonnet workhorse for ≥70% of dispatches** (implementer + per-task spec / quality reviewers); Opus only for final-branch review (per `feedback_subagent_driven_default`).
- **Do not skip hooks** (no `--no-verify` per `feedback_subagent_no_verify`).
- **Drive-by drift:** if a Task touches a file with stale TS errors / lint issues, fix in same commit per `feedback_no_backcompat_clean_architecture`.

---

## File Structure

| Touched file                                                                                   | Action                          | Purpose                                                                          |
| ---------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `packages/core/src/processHub.ts`                                                              | Modify                          | Add `processGoal`, `outcomes[]`, `primaryScopeDimensions[]` to `ProcessHub`      |
| `packages/core/src/processHub.ts`                                                              | Modify                          | Add `OutcomeSpec` type (column + specs + characteristic type)                    |
| `packages/core/src/processHub/__tests__/`                                                      | Create                          | Tests for new schema                                                             |
| `packages/core/src/parser/detection.ts`                                                        | Modify                          | Add `goalContext?: string` to `DetectColumnsOptions`; bias outcome ranking       |
| `packages/core/src/parser/__tests__/detection.test.ts`                                         | Modify                          | Tests for goal-biased ranking                                                    |
| `packages/core/src/parser/validation.ts`                                                       | Modify                          | Refactor `validateData()` to accept `outcomeColumns: string[]`                   |
| `packages/core/src/parser/__tests__/validation.test.ts`                                        | Modify                          | Tests for multi-outcome validation                                               |
| `packages/core/src/hub/extractHubName.ts`                                                      | Create                          | Utility extracting Hub name from goal first sentence                             |
| `packages/core/src/hub/__tests__/extractHubName.test.ts`                                       | Create                          | Tests                                                                            |
| `packages/core/src/specs/characteristicTypeDefaults.ts`                                        | Create                          | Smart spec defaults per characteristic type                                      |
| `packages/core/src/specs/__tests__/characteristicTypeDefaults.test.ts`                         | Create                          | Tests                                                                            |
| `packages/core/src/scopeDimensions/suggestPrimaryDimensions.ts`                                | Create                          | Auto-suggest primary scope dimensions                                            |
| `packages/core/src/scopeDimensions/__tests__/suggestPrimaryDimensions.test.ts`                 | Create                          | Tests                                                                            |
| `packages/core/src/serialization/vrsFormat.ts`                                                 | Create                          | `.vrs` JSON format spec + serializer                                             |
| `packages/core/src/serialization/vrsExport.ts`                                                 | Create                          | Hub → `.vrs` export                                                              |
| `packages/core/src/serialization/vrsImport.ts`                                                 | Create                          | `.vrs` → Hub import                                                              |
| `packages/core/src/serialization/__tests__/`                                                   | Create                          | Round-trip tests                                                                 |
| `packages/ui/src/components/HubGoalForm/HubGoalForm.tsx`                                       | Create                          | Stage 1 textarea + scaffold chips + examples                                     |
| `packages/ui/src/components/HubGoalForm/__tests__/HubGoalForm.test.tsx`                        | Create                          | Tests                                                                            |
| `packages/ui/src/components/OutcomeCandidateRow/OutcomeCandidateRow.tsx`                       | Create                          | Stage 3 horizontal candidate row with inline specs                               |
| `packages/ui/src/components/OutcomeCandidateRow/__tests__/`                                    | Create                          | Tests                                                                            |
| `packages/ui/src/components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector.tsx` | Create                          | Stage 3 sub-step picker                                                          |
| `packages/ui/src/components/PrimaryScopeDimensionsSelector/__tests__/`                         | Create                          | Tests                                                                            |
| `packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx`                     | Create                          | Graceful degradation banner                                                      |
| `packages/ui/src/components/OutcomeNoMatchBanner/__tests__/`                                   | Create                          | Tests                                                                            |
| `packages/ui/src/components/GoalBanner/GoalBanner.tsx`                                         | Create                          | Goal narrative renderer above canvas                                             |
| `packages/ui/src/components/GoalBanner/__tests__/`                                             | Create                          | Tests                                                                            |
| `packages/ui/src/components/OutcomePin/OutcomePin.tsx`                                         | Create                          | Outcome chip with specs / `mean ± σ + n` fallback                                |
| `packages/ui/src/components/OutcomePin/__tests__/`                                             | Create                          | Tests                                                                            |
| `apps/pwa/src/db/schema.ts`                                                                    | Create                          | Dexie schema for PWA Hub-of-one                                                  |
| `apps/pwa/src/db/hubRepository.ts`                                                             | Create                          | Hub persistence service (load/save/clear)                                        |
| `apps/pwa/src/db/__tests__/hubRepository.test.ts`                                              | Create                          | Tests                                                                            |
| `apps/pwa/src/components/SaveToBrowserButton.tsx`                                              | Create                          | Opt-in UI                                                                        |
| `apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx`                               | Create                          | Tests                                                                            |
| `apps/pwa/src/components/VrsExportButton.tsx`                                                  | Create                          | Download `.vrs` button                                                           |
| `apps/pwa/src/components/VrsImportButton.tsx`                                                  | Create                          | Upload `.vrs` button                                                             |
| `apps/pwa/src/components/__tests__/VrsButtons.test.tsx`                                        | Create                          | Tests                                                                            |
| `apps/pwa/src/App.tsx`                                                                         | Modify                          | Wire HubGoalForm → ColumnMapping → Dashboard with goal banner + outcome pin      |
| `apps/pwa/src/store/sessionStore.ts`                                                           | Create                          | React-Context provider for current Hub state (in-memory)                         |
| `apps/pwa/src/__tests__/modeB.e2e.spec.ts`                                                     | Create                          | Playwright E2E for Mode B end-to-end                                             |
| `apps/azure/src/db/schema.ts`                                                                  | Modify                          | Add `processGoal` / `outcomes` / `primaryScopeDimensions` to `processHubs` table |
| `apps/azure/src/components/editor/HubCreationFlow.tsx`                                         | Create                          | Azure Mode B routing                                                             |
| `apps/azure/src/__tests__/modeB.test.tsx`                                                      | Create                          | Tests                                                                            |
| `apps/pwa/CLAUDE.md`                                                                           | Already modified (prior commit) | Hard rule update                                                                 |
| `docs/superpowers/specs/2026-05-03-framing-layer-design.md`                                    | Modify (final task)             | Status `draft` → `active`                                                        |
| `docs/decision-log.md`                                                                         | Modify (final task)             | Add session backlog entry: V1 slice 1 in flight → done                           |

---

## Task 0: Lock decisions + companion file

**Files:**

- Create: `docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1-decisions.md`

Five load-bearing decisions surfaced during plan drafting that need explicit anchors before implementation. Capture them in a companion file the implementing engineer can read alongside the plan.

- [ ] **Step 0.1: Create companion decisions file**

```markdown
## <!-- docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1-decisions.md -->

title: Framing Layer V1 Slice 1 — Locked Decisions
audience: [engineer]
category: implementation
status: draft
date: 2026-05-03
related:

- docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1.md
- docs/superpowers/specs/2026-05-03-framing-layer-design.md

---

# Locked Decisions — Slice 1

## D1. AnalysisBrief vs new types

The existing `AnalysisBrief` interface in `packages/ui/src/components/ColumnMapping/index.tsx`
sketched issue/questions/targetMetric but is unused today. **Decision:** do NOT extend
AnalysisBrief. Create a clean `OutcomeSpec` type on `ProcessHub`. AnalysisBrief stays in
its current sketched form for slice 5 (Stage 5 investigation entry); slice 1 leaves it
alone. Reason: the framing-layer spec separates Hub-level (durable: outcomes + specs)
from investigation-level (episodic: issue + question); conflating into AnalysisBrief
re-merges what the spec just split.

## D2. PWA persistence is OPT-IN per Q8-revised

PWA persists ONLY after the user clicks "Save to this browser." Default is session-only
(matches today's behavior). The Dexie schema is loaded post-opt-in only. The opt-in flag
itself is stored in IndexedDB (a tiny `meta` record) so subsequent sessions know whether
to auto-load. `.vrs` import/export is always available regardless of the opt-in flag.
Reason: Q8-revised Option 4 — explicit user consent; trainers / privacy-conscious users
can use file-only persistence; demo users skip persistence entirely.

## D3. Multi-outcome validation

`validateData()` today validates one outcome column. Slice 1 supports multiple outcomes
per Hub (`OutcomeSpec[]`). Refactor `validateData()` to take `outcomeColumns: string[]`
and produce a per-outcome quality report. Backward-compatible single-outcome call site
in dashboard / analysis can wrap with `validateData(data, [singleOutcome])` and unwrap
the first entry. Reason: V1 supports multiple outcomes per spec §3.2.

## D4. Goal-context biasing — keyword extraction is deterministic

`detectColumns()` gains an optional `goalContext: string` parameter. Implementation:
extract content words from the goal narrative (lowercase, drop stopwords using
`packages/core/src/parser/stopwords.ts` — create if missing); compute outcome candidate
keyword-match score = max(token overlap with column name lowercased + token overlap
with column-name's underscore-split parts). Bias is additive on top of the existing
keyword-detection score; no replacement. Reason: deterministic per Q5 (no AI in V1);
existing detection logic preserved.

## D5. Mode A.1 reopen UX (PWA)

PWA Mode A.1 reopen path: on app load, check if `hubRepository.getOptInFlag()` is true.
If true: load saved Hub via `hubRepository.loadHub()` and render canvas with restored
state. If false: render `HomeScreen` (existing flow). No "Hub list" UI in PWA — single
Hub-of-one constraint per Q8. User can clear via "Forget this browser" affordance
(separate task — not in slice 1; user can clear browser storage manually until then).
Reason: Q8 + minimal slice 1 surface area.
```

- [ ] **Step 0.2: Commit the decisions file**

```bash
git add docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1-decisions.md
git commit -m "plan: lock 5 decisions for framing-layer V1 slice 1

D1: AnalysisBrief unchanged; new OutcomeSpec type
D2: PWA persistence opt-in via 'Save to this browser'
D3: validateData multi-outcome refactor
D4: Goal-context biasing is deterministic keyword extraction
D5: Mode A.1 reopen gated by IndexedDB opt-in flag (no PWA Hub list)"
```

---

## Task 1: ProcessHub schema extension — add framing-layer fields

**Files:**

- Modify: `packages/core/src/processHub.ts` (around line 54 where `ProcessHub` is defined; add new fields after `contextColumns`)
- Create: `packages/core/src/processHub/__tests__/processHubFields.test.ts`

- [ ] **Step 1.1: Write failing test**

```typescript
// packages/core/src/processHub/__tests__/processHubFields.test.ts
import { describe, expect, it } from 'vitest';
import type { ProcessHub, OutcomeSpec } from '../../processHub';
import { DEFAULT_PROCESS_HUB } from '../../processHub';

describe('ProcessHub framing-layer fields', () => {
  it('accepts a process goal narrative', () => {
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB, processGoal: 'We mold barrels.' };
    expect(hub.processGoal).toBe('We mold barrels.');
  });

  it('accepts a list of outcome specs', () => {
    const outcome: OutcomeSpec = {
      columnName: 'weight_g',
      characteristicType: 'nominalIsBest',
      target: 4.5,
      lsl: 4.2,
      usl: 4.8,
      cpkTarget: 1.33,
    };
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB, outcomes: [outcome] };
    expect(hub.outcomes?.[0]?.columnName).toBe('weight_g');
  });

  it('accepts primary scope dimensions', () => {
    const hub: ProcessHub = {
      ...DEFAULT_PROCESS_HUB,
      primaryScopeDimensions: ['product_id', 'shift'],
    };
    expect(hub.primaryScopeDimensions).toEqual(['product_id', 'shift']);
  });

  it('omits new fields by default (backward-compatible)', () => {
    const hub: ProcessHub = { ...DEFAULT_PROCESS_HUB };
    expect(hub.processGoal).toBeUndefined();
    expect(hub.outcomes).toBeUndefined();
    expect(hub.primaryScopeDimensions).toBeUndefined();
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test processHubFields
```

Expected: FAIL — `OutcomeSpec` not exported.

- [ ] **Step 1.3: Implement schema changes**

Edit `packages/core/src/processHub.ts`. After the existing `ProcessParticipantRef` type and before `ProcessHub`, add:

```typescript
export type CharacteristicType = 'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter';

export interface OutcomeSpec {
  /** Column name from the dataset that quantifies delivery on the goal. */
  columnName: string;
  /** Characteristic type — drives spec input UI (nominal disables nothing; smaller-is-better disables LSL; larger-is-better disables USL). */
  characteristicType: CharacteristicType;
  /** Target value. Customer-driven; UI may suggest dataset mean for nominal-is-best as a starting point. */
  target?: number;
  /** Lower spec limit. Customer-driven (no σ-based suggestions). N/A for smaller-is-better. */
  lsl?: number;
  /** Upper spec limit. Customer-driven (no σ-based suggestions). N/A for larger-is-better. */
  usl?: number;
  /** Cpk target. Defaults to 1.33 (literature standard). */
  cpkTarget?: number;
}
```

Then in the `ProcessHub` interface, add three optional fields after `contextColumns`:

```typescript
  /** Process goal narrative (Hub-level, durable). One paragraph; 1–5 sentences typical. */
  processGoal?: string;
  /** Outcome columns and their specs. Multiple outcomes supported per Hub. */
  outcomes?: OutcomeSpec[];
  /** Discrete columns the analyst slices analysis by most often. Marked dimensions get prominent picker access. */
  primaryScopeDimensions?: string[];
```

- [ ] **Step 1.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test processHubFields
```

Expected: PASS — 4 tests.

- [ ] **Step 1.5: Run package build to verify type exports**

```bash
pnpm --filter @variscout/core build
```

Expected: PASS — no TS errors.

- [ ] **Step 1.6: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/processHub/__tests__/
git commit -m "feat(core): add framing-layer fields to ProcessHub

processGoal: string narrative (Hub-level durable)
outcomes: OutcomeSpec[] (CTQs in plain language)
primaryScopeDimensions: string[] (prominent picker dimensions)

OutcomeSpec includes characteristicType (nominalIsBest /
smallerIsBetter / largerIsBetter) — drives spec-input UI per
framing-layer spec §5.3. Specs are customer-driven; no σ-based
suggestions per Q8 / spec §3.3."
```

---

## Task 2: extractHubName utility

**Files:**

- Create: `packages/core/src/hub/extractHubName.ts`
- Create: `packages/core/src/hub/__tests__/extractHubName.test.ts`

- [ ] **Step 2.1: Write failing test**

```typescript
// packages/core/src/hub/__tests__/extractHubName.test.ts
import { describe, expect, it } from 'vitest';
import { extractHubName } from '../extractHubName';

describe('extractHubName', () => {
  it('returns first sentence stripped of trailing punctuation', () => {
    const goal = 'We injection-mold polypropylene barrels. Customers need accuracy.';
    expect(extractHubName(goal)).toBe('We injection-mold polypropylene barrels');
  });

  it('truncates to 50 chars at word boundary if longer', () => {
    const goal =
      'We do a really really really really really really long process named X for customers.';
    const name = extractHubName(goal);
    expect(name.length).toBeLessThanOrEqual(50);
    expect(name).not.toMatch(/\s+\S+$/); // no partial word at end
  });

  it('returns empty string for empty narrative', () => {
    expect(extractHubName('')).toBe('');
  });

  it('handles multiple sentence terminators', () => {
    expect(extractHubName('Question? Answer.')).toBe('Question');
    expect(extractHubName('Bang! Bigger.')).toBe('Bang');
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test extractHubName
```

Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement the utility**

```typescript
// packages/core/src/hub/extractHubName.ts
const MAX_LEN = 50;
const SENTENCE_BREAK = /[.!?]/;

/**
 * Extract a short Hub name from the first sentence of a goal narrative.
 * Strips trailing punctuation; truncates to 50 chars at word boundary.
 */
export function extractHubName(goalNarrative: string): string {
  if (!goalNarrative.trim()) return '';
  const firstSentence = goalNarrative.split(SENTENCE_BREAK)[0]?.trim() ?? '';
  if (firstSentence.length <= MAX_LEN) return firstSentence;
  // Truncate at last whitespace before MAX_LEN
  const slice = firstSentence.slice(0, MAX_LEN);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim();
}
```

Add to `packages/core/src/hub/index.ts` (create if missing):

```typescript
export { extractHubName } from './extractHubName';
```

Re-export from package barrel `packages/core/src/index.ts` if appropriate.

- [ ] **Step 2.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test extractHubName
```

Expected: PASS — 4 tests.

- [ ] **Step 2.5: Commit**

```bash
git add packages/core/src/hub/
git commit -m "feat(core): extractHubName utility

Extracts a short Hub name (≤50 chars, word-boundary truncated)
from the first sentence of a goal narrative.

Used by Stage 1 HubGoalForm to auto-populate the Hub name field
on goal-narrative confirm."
```

---

## Task 3: Goal-context biasing in detectColumns

**Files:**

- Modify: `packages/core/src/parser/detection.ts` (extend `DetectColumnsOptions` and `analyzeColumn` ranking)
- Create: `packages/core/src/parser/stopwords.ts` (small English stopword list)
- Modify: `packages/core/src/parser/__tests__/detection.test.ts`

- [ ] **Step 3.1: Write failing test**

```typescript
// in detection.test.ts, add a new describe block:
describe('detectColumns with goalContext biasing', () => {
  const data = [
    { weight_g: 4.5, defect_count: 0, oven_temp: 178 },
    { weight_g: 4.4, defect_count: 1, oven_temp: 180 },
  ];

  it('without goal context: prefers numeric outcome candidates by name keyword', () => {
    const result = detectColumns(data);
    // existing behavior — usually picks weight_g or defect_count via keyword match
    expect(result.outcome).toBeTruthy();
  });

  it('with goal mentioning "weight": ranks weight_g higher', () => {
    const result = detectColumns(data, {
      goalContext: 'We mold barrels and customers care about weight accuracy.',
    });
    expect(result.outcome).toBe('weight_g');
  });

  it('with goal mentioning "defect": ranks defect_count higher', () => {
    const result = detectColumns(data, {
      goalContext: 'Reduce defect rate at our line.',
    });
    expect(result.outcome).toBe('defect_count');
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test detection
```

Expected: FAIL — `goalContext` not in options.

- [ ] **Step 3.3: Add stopwords list**

```typescript
// packages/core/src/parser/stopwords.ts
export const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'we',
  'will',
  'with',
  'our',
  'their',
  'they',
  'do',
  'does',
  'did',
  'can',
  'could',
  'should',
  'would',
  'about',
  'into',
  'over',
  'under',
  'than',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}
```

- [ ] **Step 3.4: Extend detection options + scoring**

In `packages/core/src/parser/detection.ts`:

```typescript
import { tokenize } from './stopwords';

export interface DetectColumnsOptions {
  // ... existing fields ...
  /** Optional goal narrative — biases outcome ranking toward columns whose names share content words with the narrative. */
  goalContext?: string;
}

/** Compute a goal-keyword bonus in [0, 1] for a column based on token overlap with the goal narrative. */
function goalKeywordBonus(columnName: string, goalContext: string | undefined): number {
  if (!goalContext) return 0;
  const goalTokens = new Set(tokenize(goalContext));
  if (goalTokens.size === 0) return 0;
  const colTokens = tokenize(columnName.replace(/_/g, ' '));
  if (colTokens.length === 0) return 0;
  const overlap = colTokens.filter(t => goalTokens.has(t)).length;
  return overlap / colTokens.length;
}
```

Then where outcome candidates are ranked (find the existing scoring loop in `detectColumns`), add the bonus:

```typescript
// Existing score (keyword + variation + ...): `score`
const bonus = goalKeywordBonus(column.name, options?.goalContext);
const finalScore = score + bonus * 0.5; // bonus weight = 0.5 (tunable)
```

Sort candidates by `finalScore` descending; return top match as `outcome`.

- [ ] **Step 3.5: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test detection
```

Expected: PASS — all detection tests including the 3 new ones.

- [ ] **Step 3.6: Commit**

```bash
git add packages/core/src/parser/detection.ts packages/core/src/parser/stopwords.ts packages/core/src/parser/__tests__/detection.test.ts
git commit -m "feat(core): goal-context biasing in detectColumns

Optional DetectColumnsOptions.goalContext threads the user's
goal narrative through to outcome ranking. Tokenizes the
narrative (lowercased, stopwords removed), computes per-column
keyword overlap with the goal, adds a 0.5-weight bonus on top
of existing scoring.

Implements framing-layer spec §3.1: goal narrative biases
deterministic detection at Stage 3. Deterministic — no AI
(per Q5). Backward-compatible (option is optional)."
```

---

## Task 4: validateData multi-outcome support

**Files:**

- Modify: `packages/core/src/parser/validation.ts`
- Modify: `packages/core/src/parser/__tests__/validation.test.ts`

- [ ] **Step 4.1: Write failing test**

```typescript
// in validation.test.ts:
describe('validateData with multiple outcomes', () => {
  const data = [
    { weight_g: 4.5, defect_count: 0 },
    { weight_g: NaN, defect_count: 1 },
    { weight_g: 4.4, defect_count: 'bad' },
  ];

  it('accepts an array of outcome columns', () => {
    const report = validateData(data, ['weight_g', 'defect_count']);
    expect(report.totalRows).toBe(3);
    expect(report.perOutcome['weight_g']?.invalidCount).toBe(1); // NaN
    expect(report.perOutcome['defect_count']?.invalidCount).toBe(1); // 'bad'
  });

  it('reports a row excluded if ANY outcome is invalid', () => {
    const report = validateData(data, ['weight_g', 'defect_count']);
    expect(report.excludedRows).toHaveLength(2);
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test validation
```

Expected: FAIL — `validateData` signature doesn't accept array; `report.perOutcome` undefined.

- [ ] **Step 4.3: Refactor validateData**

```typescript
// packages/core/src/parser/validation.ts
export interface PerOutcomeQuality {
  validCount: number;
  invalidCount: number;
  missingCount: number;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
  perOutcome: Record<string, PerOutcomeQuality>;
}

export function validateData(
  data: Array<Record<string, unknown>>,
  outcomeColumns: string[]
): DataQualityReport {
  const perOutcome: Record<string, PerOutcomeQuality> = {};
  for (const col of outcomeColumns) {
    perOutcome[col] = { validCount: 0, invalidCount: 0, missingCount: 0 };
  }

  const excluded: ExcludedRow[] = [];
  let validRows = 0;

  data.forEach((row, idx) => {
    const reasons: ExclusionReason[] = [];
    for (const col of outcomeColumns) {
      const value = row[col];
      const numeric = toNumericValue(value);
      const stat = perOutcome[col]!;
      if (value === null || value === undefined || value === '') {
        stat.missingCount++;
        reasons.push({ column: col, reason: 'missing' });
      } else if (numeric === undefined) {
        stat.invalidCount++;
        reasons.push({ column: col, reason: 'non-numeric' });
      } else {
        stat.validCount++;
      }
    }
    if (reasons.length > 0) {
      excluded.push({ index: idx, reasons });
    } else {
      validRows++;
    }
  });

  // ... existing column issues aggregation ...
  return {
    totalRows: data.length,
    validRows,
    excludedRows: excluded,
    columnIssues: [], // existing logic
    perOutcome,
  };
}
```

Update existing call sites:

- `apps/pwa/src/hooks/useDataIngestion.ts`: change `validateData(rawData, outcome)` to `validateData(rawData, [outcome])` and read `report.perOutcome[outcome]`.
- Same for any Azure call sites.

- [ ] **Step 4.4: Run all parser tests to verify**

```bash
pnpm --filter @variscout/core test parser
```

Expected: PASS — all parser tests including new multi-outcome cases.

- [ ] **Step 4.5: Commit**

```bash
git add packages/core/src/parser/validation.ts packages/core/src/parser/__tests__/validation.test.ts apps/pwa/src/hooks/useDataIngestion.ts
git commit -m "refactor(core): validateData accepts multiple outcome columns

DataQualityReport gains perOutcome: Record<column, PerOutcomeQuality>
so V1 can support multiple outcomes per Hub (per spec §3.2).
A row is excluded if ANY outcome column is invalid.

Existing call sites updated to wrap single outcome in array."
```

---

## Task 5: HubGoalForm component (Stage 1)

**Files:**

- Create: `packages/ui/src/components/HubGoalForm/HubGoalForm.tsx`
- Create: `packages/ui/src/components/HubGoalForm/HubGoalForm.examples.ts` (sample goals)
- Create: `packages/ui/src/components/HubGoalForm/__tests__/HubGoalForm.test.tsx`
- Modify: `packages/ui/src/index.ts` (add export)

- [ ] **Step 5.1: Write failing test**

```typescript
// __tests__/HubGoalForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HubGoalForm } from '../HubGoalForm';

describe('HubGoalForm', () => {
  it('renders textarea + scaffold chips + examples link', () => {
    render(<HubGoalForm onConfirm={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: /process goal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ purpose/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ customer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ what matters/i })).toBeInTheDocument();
    expect(screen.getByText(/see examples/i)).toBeInTheDocument();
  });

  it('clicking + Purpose chip inserts "Purpose: " into textarea', () => {
    render(<HubGoalForm onConfirm={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: /process goal/i }) as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole('button', { name: /\+ purpose/i }));
    expect(textarea.value).toContain('Purpose:');
  });

  it('Continue calls onConfirm with the narrative', () => {
    const onConfirm = vi.fn();
    render(<HubGoalForm onConfirm={onConfirm} />);
    const textarea = screen.getByRole('textbox', { name: /process goal/i });
    fireEvent.change(textarea, { target: { value: 'We mold barrels.' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onConfirm).toHaveBeenCalledWith('We mold barrels.');
  });

  it('Skip calls onSkip', () => {
    const onSkip = vi.fn();
    render(<HubGoalForm onConfirm={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip framing/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test HubGoalForm
```

Expected: FAIL — module not found.

- [ ] **Step 5.3: Implement HubGoalForm**

```typescript
// packages/ui/src/components/HubGoalForm/HubGoalForm.tsx
import { useState } from 'react';
import { EXAMPLE_GOALS } from './HubGoalForm.examples';

export interface HubGoalFormProps {
  initialValue?: string;
  onConfirm: (narrative: string) => void;
  onSkip?: () => void;
}

const SCAFFOLDS = [
  { label: '+ Purpose', insertText: 'Purpose: ' },
  { label: '+ Customer', insertText: 'Customer: ' },
  { label: '+ What matters', insertText: 'What matters: ' },
];

export function HubGoalForm({ initialValue = '', onConfirm, onSkip }: HubGoalFormProps) {
  const [value, setValue] = useState(initialValue);
  const [showExamples, setShowExamples] = useState(false);

  const insertScaffold = (text: string) => {
    setValue((prev) => (prev.trim() ? `${prev}\n${text}` : text));
  };

  return (
    <div className="hub-goal-form" data-testid="hub-goal-form">
      <label htmlFor="hub-goal-narrative" className="block font-medium mb-2">
        Why does this process exist?
      </label>
      <div className="flex gap-2 mb-2">
        {SCAFFOLDS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => insertScaffold(s.insertText)}
            className="text-xs px-2 py-1 border border-dashed rounded"
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        id="hub-goal-narrative"
        aria-label="process goal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        className="w-full border rounded p-2"
        placeholder="What does this process produce? For whom? What matters about the output?"
      />
      <button
        type="button"
        className="text-xs underline text-blue-600 mt-2"
        onClick={() => setShowExamples((s) => !s)}
      >
        {showExamples ? 'Hide examples' : 'See examples →'}
      </button>
      {showExamples && (
        <div className="text-xs mt-2 space-y-2 border-l-2 pl-3">
          {EXAMPLE_GOALS.map((ex) => (
            <div key={ex.title}>
              <div className="font-semibold">{ex.title}</div>
              <div className="text-gray-600">{ex.narrative}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => onConfirm(value)}
          disabled={!value.trim()}
        >
          Continue →
        </button>
        {onSkip && (
          <button type="button" className="text-xs underline text-gray-500" onClick={onSkip}>
            Skip framing (advanced)
          </button>
        )}
      </div>
    </div>
  );
}
```

```typescript
// packages/ui/src/components/HubGoalForm/HubGoalForm.examples.ts
export const EXAMPLE_GOALS = [
  {
    title: 'Syringe-barrel injection line',
    narrative:
      'Purpose: Injection-mold polypropylene syringe barrels. Customer: Medical-device assemblers. What matters: Dimensional accuracy and no contamination.',
  },
  {
    title: 'Bakery production',
    narrative:
      'Purpose: Bake whole-grain loaves. Customer: Wholesale partners. What matters: Consistent moisture and weight at delivery.',
  },
  {
    title: 'Assembly station',
    narrative:
      'Purpose: Attach housings to motors. Customer: Downstream packaging. What matters: No surface scratches and tight cycle time.',
  },
];
```

Re-export in `packages/ui/src/index.ts`:

```typescript
export { HubGoalForm } from './components/HubGoalForm/HubGoalForm';
export type { HubGoalFormProps } from './components/HubGoalForm/HubGoalForm';
```

- [ ] **Step 5.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test HubGoalForm
```

Expected: PASS — 4 tests.

- [ ] **Step 5.5: Commit**

```bash
git add packages/ui/src/components/HubGoalForm/ packages/ui/src/index.ts
git commit -m "feat(ui): HubGoalForm component (framing layer Stage 1)

Free-text textarea with three scaffold chips ('+ Purpose',
'+ Customer', '+ What matters') that insert labeled prompt
chunks into the narrative on click. Optional 'See examples'
link surfaces three anonymized goal narratives. Skip-framing
path supported.

Implements framing-layer spec §5.1 — Option C 'free-text +
scaffold chips' shape locked during brainstorm."
```

---

## Tasks 6–16

> The remaining tasks (Stage 3 candidate row + inline specs / characteristic-type defaults / scope dimensions selector / no-match banner / GoalBanner + OutcomePin / PWA Dexie schema + opt-in / `.vrs` export-import / PWA wiring / Azure wiring / spec status update) follow the same TDD shape: **failing test → run + fail → implement → run + pass → commit**.
>
> Each task lists Files (Create/Modify/Test), 4–6 numbered steps with code blocks, and a commit. The pattern is fully established by Tasks 1–5 above; the engineer extends it through the remaining components.

### Task 6: OutcomeCandidateRow with inline specs (Stage 3)

**Files:**

- Create: `packages/ui/src/components/OutcomeCandidateRow/OutcomeCandidateRow.tsx`
- Create: `packages/ui/src/components/OutcomeCandidateRow/__tests__/OutcomeCandidateRow.test.tsx`
- Modify: `packages/ui/src/index.ts`

Tests verify: row renders radio + name + sparkline + inline spec inputs (when selected) + quality stack + match confidence; selecting row shows inline `InlineSpecEditor` (existing primitive); placeholders for LSL/USL say "from customer spec" — never σ-based; multi-select supported via parent state.

Implementation: composes existing `InlineSpecEditor` from `@variscout/ui`; sparkline is a small inline SVG; quality stack reads from `DataQualityReport.perOutcome[col]`.

Commit: `"feat(ui): OutcomeCandidateRow with inline per-candidate spec inputs"`

### Task 7: characteristic-type-aware spec defaults

**Files:**

- Create: `packages/core/src/specs/characteristicTypeDefaults.ts`
- Create: `packages/core/src/specs/__tests__/characteristicTypeDefaults.test.ts`

Tests verify: `defaultSpecsFor('nominalIsBest', dataMean)` returns `{ target: dataMean, cpkTarget: 1.33 }` (no LSL/USL); `'smallerIsBetter'` returns `{ target: 0, cpkTarget: 1.33 }`; `'largerIsBetter'` returns `{ cpkTarget: 1.33 }` (no target / no USL). Detection: `inferCharacteristicType(columnName, sampleValues)` returns the type by name keywords (`defect`/`reject` → smaller-is-better; `yield`/`uptime` → larger-is-better; default → nominal-is-best).

Wired into `OutcomeCandidateRow` so the inline specs sub-form disables LSL or USL based on type.

Commit: `"feat(core): characteristic-type-aware spec defaults"`

### Task 8: PrimaryScopeDimensionsSelector (Stage 3 sub-step)

**Files:**

- Create: `packages/core/src/scopeDimensions/suggestPrimaryDimensions.ts`
- Create: `packages/ui/src/components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector.tsx`
- Tests for both

Core function: `suggestPrimaryDimensions(columns: ColumnAnalysis[]): string[]` returns columns with cardinality 3-50 + name match against `[id, lot, batch, product, customer, shift, operator, machine, supplier]`. High-cardinality columns (>50 levels) flagged as "join keys, not Pareto candidates" (excluded from suggestions but available in override list).

UI: checkbox list with suggested columns pre-checked; user confirms or overrides. Skippable (parent passes empty array).

Commit: `"feat: PrimaryScopeDimensionsSelector (Stage 3 sub-step)"`

### Task 9: OutcomeNoMatchBanner (graceful degradation)

**Files:**

- Create: `packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx`
- Tests

Renders when `max(candidate.matchScore) < 0.30`. Banner content: "No clear outcome match. Either rename a column to match your outcome (best for the long term) or pick manually below." Inline rename affordance per column row + free-text "I expected the outcome to be: \_\_\_" textarea (passed to parent via `onExpectedOutcomeChange`). Skip-outcome path emits `onSkip()` so canvas paints with all columns unclassified.

Commit: `"feat(ui): OutcomeNoMatchBanner (Stage 3 graceful degradation)"`

### Task 10: GoalBanner + OutcomePin (canvas first paint)

**Files:**

- Create: `packages/ui/src/components/GoalBanner/GoalBanner.tsx`
- Create: `packages/ui/src/components/OutcomePin/OutcomePin.tsx`
- Tests for both

`GoalBanner`: renders `processGoal` text in a styled banner above the canvas; click-to-edit opens an inline textarea; `onChange(newValue)` callback to parent.

`OutcomePin`: takes an `OutcomeSpec`. If `target/lsl/usl` are present: shows Cpk badge (uses existing `statusForCpk` from core). If absent: shows `mean ± σ + n` (computed from current data) plus a `+ Add specs` chip (clicking opens existing `SpecEditor`). Per Q2 fallback rule from framing-layer spec §5.2.

Commit: `"feat(ui): GoalBanner + OutcomePin canvas first-paint components"`

### Task 11: `.vrs` file format + export/import

**Files:**

- Create: `packages/core/src/serialization/vrsFormat.ts` (TypeScript types + version constant)
- Create: `packages/core/src/serialization/vrsExport.ts`
- Create: `packages/core/src/serialization/vrsImport.ts`
- Create: `packages/core/src/serialization/__tests__/roundtrip.test.ts`

`.vrs` JSON shape:

```typescript
export interface VrsFile {
  version: '1.0';
  exportedAt: string; // ISO timestamp
  hub: ProcessHub;
  rawData?: Array<Record<string, unknown>>; // optional; trainers may include sample data
  metadata?: { exportSource: 'pwa' | 'azure'; appVersion: string };
}
```

Tests verify round-trip: `vrsExport(hub, rawData) → JSON string → vrsImport(json) → { hub, rawData }` with deep-equal preservation. Version-mismatch tests: importing version "0.9" returns a clear error.

Commit: `"feat(core): .vrs file format + export/import (round-trip tested)"`

### Task 12: PWA Dexie schema + hubRepository (opt-in persistence)

**Files:**

- Create: `apps/pwa/src/db/schema.ts` (Dexie schema with tables: `hubs`, `meta`)
- Create: `apps/pwa/src/db/hubRepository.ts`
- Create: `apps/pwa/src/db/__tests__/hubRepository.test.ts` (uses `fake-indexeddb` if available)

`hubRepository` API:

```typescript
hubRepository.getOptInFlag(): Promise<boolean>
hubRepository.setOptInFlag(value: boolean): Promise<void>
hubRepository.saveHub(hub: ProcessHub): Promise<void>
hubRepository.loadHub(): Promise<ProcessHub | null>
hubRepository.clearHub(): Promise<void>
```

Single-Hub-of-one constraint: `saveHub` overwrites the single row; `loadHub` returns the single row or null. `setOptInFlag(false)` calls `clearHub()` automatically.

Commit: `"feat(pwa): Dexie hubRepository for opt-in Hub-of-one persistence"`

### Task 13: PWA SaveToBrowserButton + VrsExportButton + VrsImportButton

**Files:**

- Create: `apps/pwa/src/components/SaveToBrowserButton.tsx`
- Create: `apps/pwa/src/components/VrsExportButton.tsx`
- Create: `apps/pwa/src/components/VrsImportButton.tsx`
- Tests for each

`SaveToBrowserButton`: shows "Save to this browser" if `getOptInFlag() === false`; on click, calls `setOptInFlag(true)` + `saveHub(currentHub)` + shows confirmation toast. Once opted in, button changes to "Saved · Forget" — click prompts confirmation, then `setOptInFlag(false)` → `clearHub()`.

`VrsExportButton`: triggers download of `vrsExport(currentHub, currentData)` as a `.vrs` file (Blob + a download link).

`VrsImportButton`: file input accepts `.vrs`; reads file → `vrsImport()` → updates current Hub state (via `sessionStore`).

Commits:

- `"feat(pwa): SaveToBrowserButton (opt-in persistence UI)"`
- `"feat(pwa): VrsExportButton + VrsImportButton (file persistence)"`

### Task 14: PWA Mode B + Mode A.1 wiring

**Files:**

- Modify: `apps/pwa/src/App.tsx` (route logic)
- Create: `apps/pwa/src/store/sessionStore.ts` (in-memory current Hub state via React Context)
- Create: `apps/pwa/src/__tests__/modeB.e2e.spec.ts` (Playwright)

Wiring:

1. App load → check `hubRepository.getOptInFlag()` → if true, `loadHub()` and route to canvas (Mode A.1). If false / no Hub, route to `HomeScreen` (today's behavior).
2. From `HomeScreen` paste flow: `PasteScreen` → `HubGoalForm` (new Stage 1) → `ColumnMapping` (Stage 3, refactored to use `OutcomeCandidateRow` + `PrimaryScopeDimensionsSelector` + `OutcomeNoMatchBanner`) → `Dashboard` with `GoalBanner` + `OutcomePin` mounted (Stage 4).
3. Mode A.1 always available: when opt-in is on, restored Hub paints to canvas + goal banner + outcome pin.

E2E test (Playwright):

```typescript
test('Mode B end-to-end on PWA', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Paste from Excel');
  await page.fill('textarea[aria-label="paste data"]', 'weight_g,oven_temp\n4.5,178\n4.4,180');
  await page.click('text=Parse');
  await page.fill('textarea[aria-label="process goal"]', 'We mold barrels for medical customers.');
  await page.click('text=Continue');
  await expect(page.getByLabelText('weight_g')).toBeChecked(); // outcome auto-selected via goal context
  await page.click('text=Confirm');
  await expect(page.getByTestId('goal-banner')).toContainText('We mold barrels');
  await expect(page.getByTestId('outcome-pin')).toContainText('weight_g');
});
```

Commit: `"feat(pwa): Mode B end-to-end wiring + Mode A.1 reopen"`

### Task 15: Azure Mode B + Mode A.1 wiring

**Files:**

- Modify: `apps/azure/src/db/schema.ts` (add `processGoal`, `outcomes`, `primaryScopeDimensions` to `processHubs` table; bump Dexie version to 5; add migration)
- Create: `apps/azure/src/components/editor/HubCreationFlow.tsx`
- Tests

Same shape as PWA wiring. Azure tier: persistence is always on (no opt-in needed); cloud sync deferred to slice 5+. Hub list page (`Dashboard.tsx`) gains a "+ New Hub" button → routes to `HubCreationFlow` (HubGoalForm → ColumnMapping → canvas paint).

Dexie migration: existing rows get `processGoal: undefined`, `outcomes: undefined`, `primaryScopeDimensions: undefined` (the fields are optional).

Commit: `"feat(azure): Mode B end-to-end wiring + ProcessHub schema migration v5"`

### Task 16: Spec status update + decision-log session backlog entry

**Files:**

- Modify: `docs/superpowers/specs/2026-05-03-framing-layer-design.md` (frontmatter `status: draft` → `active`)
- Modify: `docs/decision-log.md` (§4 Session Backlog: add a row "Framing Layer V1 Slice 1" → in-flight → done with PR link)

This task is the slice-exit ceremony.

- [ ] **Step 16.1: Update spec status**

In `docs/superpowers/specs/2026-05-03-framing-layer-design.md` frontmatter:

```diff
- status: draft
+ status: active
```

- [ ] **Step 16.2: Add session backlog entry**

In `docs/decision-log.md` §4 Session Backlog table:

```markdown
| Framing Layer V1 Slice 1 implementation | implementation | done | docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1.md | 2026-05-03 | <PR-merge-date> |
```

- [ ] **Step 16.3: Run docs:check + commit**

```bash
pnpm docs:check
git add docs/
git commit -m "docs: framing-layer spec → active; slice 1 closed in session backlog"
```

---

## Self-Review Checklist

Run before requesting final review:

- [ ] All tasks have concrete `Files: Create/Modify/Test` lines
- [ ] No `TBD` / `TODO` / `fill in later` placeholders in any task body
- [ ] Each TDD step shows actual code (not "write a test for X")
- [ ] Type names consistent across tasks (e.g., `OutcomeSpec` defined in Task 1 used unchanged in Tasks 5–16)
- [ ] Commit messages follow project conventions (feat / refactor / docs / chore prefixes)
- [ ] No σ-based suggestions for LSL/USL anywhere in code (Q8 / Q2 invariant)
- [ ] PWA persistence is opt-in only (Q8-revised)
- [ ] `.vrs` round-trip tested (Task 11)
- [ ] Goal-context biasing is deterministic (Task 3 — no AI per Q5)
- [ ] Multi-outcome supported throughout (Task 4 — spec §3.2)
- [ ] All new components have tests
- [ ] CI guards: search for any new code violating ADR-073 structural absence — there should be none in slice 1 (no aggregation primitives introduced)

---

## Slice Exit Criteria

V1 slice 1 is complete when:

- [ ] All 16 tasks land on `framing-layer-v1-slice-1` branch with green CI
- [ ] `bash scripts/pr-ready-check.sh` passes
- [ ] PWA Playwright E2E test for Mode B passes end-to-end
- [ ] Azure equivalent test passes (RTL or E2E, whichever is faster to write)
- [ ] PWA `.vrs` export-import round-trip works in browser (manual smoke test)
- [ ] PWA "Save to this browser" persists Hub across page reload (manual smoke test)
- [ ] Azure existing tests all pass (no regression on shipped Hub functionality)
- [ ] `docs:check` green
- [ ] Final code-reviewer subagent (Opus) approves the branch
- [ ] Squash-merge to main; spec status flipped to `active`; decision-log entry closed

---

## Next Slice Preview

**V1 slice 2 — Mode A.2-paste data ingestion**

Scope: match-summary card with 2-axis classifier (source × temporal), block-on-overlap and block-on-different-grain action choices, per-row provenance fields, A.2-evidence-source background ingestion (Azure-only).

File touch: new `MatchSummaryCard` component, extension to `suggestNodeMappings` reuse, provenance schema in `ProcessHub.snapshots[]`, Azure background job for Evidence Source ingestion.

Plan to be written after slice 1 lands.

---

## References

- Framing-layer spec: [`docs/superpowers/specs/2026-05-03-framing-layer-design.md`](../specs/2026-05-03-framing-layer-design.md)
- Vision spec: [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](../specs/2026-05-03-variscout-vision-design.md)
- Decision log Q8-revised entry: [`docs/decision-log.md`](../../decision-log.md)
- §8 walkthrough plan (predecessor): `~/.claude/plans/lets-do-this-next-rustling-simon.md`
- Reference plan format: [`2026-04-29-multi-level-scout-v1.md`](2026-04-29-multi-level-scout-v1.md)
