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

### Task 6: OutcomeCandidateRow with inline specs (Stage 3)

**Files:**

- Create: `packages/ui/src/components/OutcomeCandidateRow/OutcomeCandidateRow.tsx`
- Create: `packages/ui/src/components/OutcomeCandidateRow/__tests__/OutcomeCandidateRow.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 6.1: Write failing test**

```typescript
// packages/ui/src/components/OutcomeCandidateRow/__tests__/OutcomeCandidateRow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeCandidateRow } from '../OutcomeCandidateRow';

const baseCandidate = {
  columnName: 'weight_g',
  type: 'continuous' as const,
  characteristicType: 'nominalIsBest' as const,
  values: [4.5, 4.4, 4.6, 4.5, 4.4],
  matchScore: 0.92,
  goalKeywordMatch: 'weight',
  qualityReport: { validCount: 5, invalidCount: 0, missingCount: 0 },
};

describe('OutcomeCandidateRow', () => {
  it('unselected: renders radio + name + sparkline + quality + match — no spec inputs', () => {
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected={false}
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    expect(screen.getByText('weight_g')).toBeInTheDocument();
    expect(screen.queryByLabelText(/target/i)).not.toBeInTheDocument();
  });

  it('selected: shows inline spec inputs with empty LSL/USL placeholders', () => {
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    const lsl = screen.getByLabelText(/lsl/i) as HTMLInputElement;
    const usl = screen.getByLabelText(/usl/i) as HTMLInputElement;
    expect(lsl.placeholder).toMatch(/from customer spec/i);
    expect(usl.placeholder).toMatch(/from customer spec/i);
  });

  it('disables LSL when characteristicType is smallerIsBetter', () => {
    const c = { ...baseCandidate, characteristicType: 'smallerIsBetter' as const };
    render(<OutcomeCandidateRow candidate={c} isSelected onToggleSelect={vi.fn()} specs={{}} onSpecsChange={vi.fn()} />);
    expect(screen.getByLabelText(/lsl/i)).toBeDisabled();
  });

  it('disables USL when characteristicType is largerIsBetter', () => {
    const c = { ...baseCandidate, characteristicType: 'largerIsBetter' as const };
    render(<OutcomeCandidateRow candidate={c} isSelected onToggleSelect={vi.fn()} specs={{}} onSpecsChange={vi.fn()} />);
    expect(screen.getByLabelText(/usl/i)).toBeDisabled();
  });

  it('emits onSpecsChange when target changes', () => {
    const onSpecsChange = vi.fn();
    render(<OutcomeCandidateRow candidate={baseCandidate} isSelected onToggleSelect={vi.fn()} specs={{}} onSpecsChange={onSpecsChange} />);
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: '4.50' } });
    expect(onSpecsChange).toHaveBeenCalledWith(expect.objectContaining({ target: 4.5 }));
  });

  it('clicking radio emits onToggleSelect', () => {
    const onToggleSelect = vi.fn();
    render(<OutcomeCandidateRow candidate={baseCandidate} isSelected={false} onToggleSelect={onToggleSelect} specs={{}} onSpecsChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /weight_g/i }));
    expect(onToggleSelect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test OutcomeCandidateRow
```

Expected: FAIL — module not found.

- [ ] **Step 6.3: Implement OutcomeCandidateRow**

```typescript
// packages/ui/src/components/OutcomeCandidateRow/OutcomeCandidateRow.tsx
import type { CharacteristicType, OutcomeSpec } from '@variscout/core/processHub';

export interface OutcomeCandidate {
  columnName: string;
  type: 'continuous' | 'discrete';
  characteristicType: CharacteristicType;
  values: number[];
  matchScore: number;
  goalKeywordMatch?: string;
  qualityReport: { validCount: number; invalidCount: number; missingCount: number };
}

export interface OutcomeCandidateRowProps {
  candidate: OutcomeCandidate;
  isSelected: boolean;
  onToggleSelect: () => void;
  specs: Partial<OutcomeSpec>;
  onSpecsChange: (next: Partial<OutcomeSpec>) => void;
}

export function OutcomeCandidateRow(props: OutcomeCandidateRowProps) {
  const { candidate, isSelected, onToggleSelect, specs, onSpecsChange } = props;
  const lslDisabled = candidate.characteristicType === 'smallerIsBetter';
  const uslDisabled = candidate.characteristicType === 'largerIsBetter';

  const updateSpec = (key: keyof OutcomeSpec, raw: string) => {
    const trimmed = raw.trim();
    const numeric = trimmed === '' ? undefined : Number.parseFloat(trimmed);
    onSpecsChange({ ...specs, [key]: Number.isFinite(numeric) ? numeric : undefined });
  };

  return (
    <div className={`outcome-candidate-row ${isSelected ? 'selected' : ''}`}>
      <input
        type="radio"
        checked={isSelected}
        onChange={onToggleSelect}
        aria-label={candidate.columnName}
      />
      <div className="col-info">
        <div className="col-name">{candidate.columnName}</div>
        <div className="col-type">
          {candidate.type} · n={candidate.qualityReport.validCount}
        </div>
      </div>
      <Sparkline values={candidate.values} />
      {isSelected && (
        <div className="specs-inline" onClick={(e) => e.stopPropagation()}>
          <label>
            Target
            <input
              value={specs.target ?? ''}
              onChange={(e) => updateSpec('target', e.target.value)}
            />
          </label>
          <label>
            LSL
            <input
              value={specs.lsl ?? ''}
              disabled={lslDisabled}
              placeholder={lslDisabled ? '—' : 'from customer spec'}
              onChange={(e) => updateSpec('lsl', e.target.value)}
            />
          </label>
          <label>
            USL
            <input
              value={specs.usl ?? ''}
              disabled={uslDisabled}
              placeholder={uslDisabled ? '—' : 'from customer spec'}
              onChange={(e) => updateSpec('usl', e.target.value)}
            />
          </label>
          <label>
            Cpk ≥
            <input
              value={specs.cpkTarget ?? '1.33'}
              onChange={(e) => updateSpec('cpkTarget', e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="quality-stack">
        {candidate.qualityReport.missingCount === 0
          ? '✓ no missing'
          : `⚠ ${candidate.qualityReport.missingCount} missing`}
      </div>
      <div className="match-confidence">
        {Math.round(candidate.matchScore * 100)}%
        {candidate.goalKeywordMatch && <div className="kw">"{candidate.goalKeywordMatch}"</div>}
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const buckets = new Array(8).fill(0);
  values.forEach((v) => {
    const idx = Math.min(7, Math.floor(((v - min) / range) * 8));
    buckets[idx]++;
  });
  const peak = Math.max(...buckets) || 1;
  return (
    <svg className="sparkline" viewBox="0 0 80 22" preserveAspectRatio="none">
      {buckets.map((count, i) => (
        <rect
          key={i}
          x={2 + i * 9}
          y={22 - (count / peak) * 22}
          width={6}
          height={(count / peak) * 22}
        />
      ))}
    </svg>
  );
}
```

Add re-export in `packages/ui/src/index.ts`:

```typescript
export { OutcomeCandidateRow } from './components/OutcomeCandidateRow/OutcomeCandidateRow';
export type {
  OutcomeCandidate,
  OutcomeCandidateRowProps,
} from './components/OutcomeCandidateRow/OutcomeCandidateRow';
```

- [ ] **Step 6.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test OutcomeCandidateRow
```

Expected: PASS — 6 tests.

- [ ] **Step 6.5: Commit**

```bash
git add packages/ui/src/components/OutcomeCandidateRow/ packages/ui/src/index.ts
git commit -m "feat(ui): OutcomeCandidateRow with inline per-candidate specs

Stage 3 horizontal candidate row layout: radio + name +
sparkline + (when selected) inline spec inputs + quality stack
+ match confidence. LSL/USL placeholders say 'from customer
spec' (no σ-based suggestions per Q8/Q2). LSL disabled for
smallerIsBetter; USL disabled for largerIsBetter.

Implements framing-layer spec §5.3.1."
```

### Task 7: characteristic-type-aware spec defaults

**Files:**

- Create: `packages/core/src/specs/characteristicTypeDefaults.ts`
- Create: `packages/core/src/specs/__tests__/characteristicTypeDefaults.test.ts`

- [ ] **Step 7.1: Write failing test**

```typescript
// packages/core/src/specs/__tests__/characteristicTypeDefaults.test.ts
import { describe, expect, it } from 'vitest';
import { defaultSpecsFor, inferCharacteristicType } from '../characteristicTypeDefaults';

describe('defaultSpecsFor', () => {
  it('nominalIsBest: target = dataset mean; cpkTarget 1.33; no LSL/USL', () => {
    const result = defaultSpecsFor('nominalIsBest', { mean: 4.5, sigma: 0.1 });
    expect(result.target).toBe(4.5);
    expect(result.cpkTarget).toBe(1.33);
    expect(result.lsl).toBeUndefined();
    expect(result.usl).toBeUndefined();
  });

  it('smallerIsBetter: target = 0; cpkTarget 1.33; no LSL', () => {
    const result = defaultSpecsFor('smallerIsBetter', { mean: 1.2, sigma: 0.5 });
    expect(result.target).toBe(0);
    expect(result.lsl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });

  it('largerIsBetter: no target; no USL; cpkTarget 1.33', () => {
    const result = defaultSpecsFor('largerIsBetter', { mean: 95, sigma: 5 });
    expect(result.target).toBeUndefined();
    expect(result.usl).toBeUndefined();
    expect(result.cpkTarget).toBe(1.33);
  });
});

describe('inferCharacteristicType', () => {
  it('detects smallerIsBetter from defect/reject/scrap/fail keywords', () => {
    expect(inferCharacteristicType('defect_count')).toBe('smallerIsBetter');
    expect(inferCharacteristicType('reject_rate')).toBe('smallerIsBetter');
    expect(inferCharacteristicType('scrap_kg')).toBe('smallerIsBetter');
    expect(inferCharacteristicType('fail_count')).toBe('smallerIsBetter');
  });

  it('detects largerIsBetter from yield/uptime/throughput keywords', () => {
    expect(inferCharacteristicType('yield_pct')).toBe('largerIsBetter');
    expect(inferCharacteristicType('uptime_h')).toBe('largerIsBetter');
    expect(inferCharacteristicType('throughput_units_per_hour')).toBe('largerIsBetter');
  });

  it('falls back to nominalIsBest when no keyword matches', () => {
    expect(inferCharacteristicType('weight_g')).toBe('nominalIsBest');
    expect(inferCharacteristicType('Var1')).toBe('nominalIsBest');
  });

  it('is case-insensitive', () => {
    expect(inferCharacteristicType('Defect_Count')).toBe('smallerIsBetter');
    expect(inferCharacteristicType('YIELD_PCT')).toBe('largerIsBetter');
  });
});
```

- [ ] **Step 7.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test characteristicTypeDefaults
```

Expected: FAIL — module not found.

- [ ] **Step 7.3: Implement**

```typescript
// packages/core/src/specs/characteristicTypeDefaults.ts
import type { CharacteristicType, OutcomeSpec } from '../processHub';

const SMALLER_KEYWORDS = ['defect', 'reject', 'scrap', 'fail', 'error', 'fault'];
const LARGER_KEYWORDS = ['yield', 'uptime', 'throughput', 'recovery', 'efficiency'];

const CPK_TARGET_DEFAULT = 1.33;

export function inferCharacteristicType(
  columnName: string,
  _values?: number[]
): CharacteristicType {
  const lower = columnName.toLowerCase();
  if (SMALLER_KEYWORDS.some(k => lower.includes(k))) return 'smallerIsBetter';
  if (LARGER_KEYWORDS.some(k => lower.includes(k))) return 'largerIsBetter';
  return 'nominalIsBest';
}

export interface DataStats {
  mean: number;
  sigma: number;
}

export function defaultSpecsFor(type: CharacteristicType, stats: DataStats): Partial<OutcomeSpec> {
  switch (type) {
    case 'nominalIsBest':
      return { target: stats.mean, cpkTarget: CPK_TARGET_DEFAULT };
    case 'smallerIsBetter':
      return { target: 0, cpkTarget: CPK_TARGET_DEFAULT };
    case 'largerIsBetter':
      return { cpkTarget: CPK_TARGET_DEFAULT };
  }
}
```

Re-export in `packages/core/src/index.ts`:

```typescript
export { defaultSpecsFor, inferCharacteristicType } from './specs/characteristicTypeDefaults';
export type { DataStats } from './specs/characteristicTypeDefaults';
```

- [ ] **Step 7.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test characteristicTypeDefaults
```

Expected: PASS — 7 tests.

- [ ] **Step 7.5: Commit**

```bash
git add packages/core/src/specs/ packages/core/src/index.ts
git commit -m "feat(core): characteristic-type-aware spec defaults

inferCharacteristicType: case-insensitive name-keyword detection
(defect/reject/scrap/fail/error/fault → smallerIsBetter;
yield/uptime/throughput/recovery/efficiency → largerIsBetter;
default nominalIsBest).

defaultSpecsFor: returns target=mean for nominalIsBest;
target=0 for smallerIsBetter; no target for largerIsBetter.
cpkTarget=1.33 (literature default) across the board. No
LSL/USL suggestions — those are customer-driven (per Q8/Q2)."
```

### Task 8: PrimaryScopeDimensionsSelector (Stage 3 sub-step)

**Files:**

- Create: `packages/core/src/scopeDimensions/suggestPrimaryDimensions.ts`
- Create: `packages/core/src/scopeDimensions/__tests__/suggestPrimaryDimensions.test.ts`
- Create: `packages/ui/src/components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector.tsx`
- Create: `packages/ui/src/components/PrimaryScopeDimensionsSelector/__tests__/PrimaryScopeDimensionsSelector.test.tsx`
- Modify: `packages/core/src/index.ts`, `packages/ui/src/index.ts` (re-exports)

- [ ] **Step 8.1: Write failing test for suggestPrimaryDimensions**

```typescript
// packages/core/src/scopeDimensions/__tests__/suggestPrimaryDimensions.test.ts
import { describe, expect, it } from 'vitest';
import { suggestPrimaryDimensions } from '../suggestPrimaryDimensions';

describe('suggestPrimaryDimensions', () => {
  const cols = [
    { name: 'product_id', uniqueCount: 9 },
    { name: 'lot_id', uniqueCount: 87 },
    { name: 'shift', uniqueCount: 3 },
    { name: 'batch_id', uniqueCount: 412 },
    { name: 'operator_id', uniqueCount: 12 },
    { name: 'random_col', uniqueCount: 5 },
    { name: 'tiny_col', uniqueCount: 2 },
  ];

  it('suggests columns with cardinality 3-50 + name keyword match', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).toContain('product_id');
    expect(result).toContain('shift');
    expect(result).toContain('operator_id');
  });

  it('excludes high-cardinality columns (>50 levels)', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('lot_id');
    expect(result).not.toContain('batch_id');
  });

  it('excludes very low cardinality columns (<3 levels)', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('tiny_col');
  });

  it('excludes columns without name keyword match', () => {
    const result = suggestPrimaryDimensions(cols);
    expect(result).not.toContain('random_col');
  });

  it('returns empty array when no columns match', () => {
    expect(suggestPrimaryDimensions([{ name: 'foo', uniqueCount: 5 }])).toEqual([]);
  });
});
```

- [ ] **Step 8.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test suggestPrimaryDimensions
```

Expected: FAIL — module not found.

- [ ] **Step 8.3: Implement core helper**

```typescript
// packages/core/src/scopeDimensions/suggestPrimaryDimensions.ts
const NAME_KEYWORDS = [
  'id',
  'lot',
  'batch',
  'product',
  'customer',
  'shift',
  'operator',
  'machine',
  'supplier',
  'sku',
  'plant',
  'line',
  'station',
];
const MIN_CARD = 3;
const MAX_CARD = 50;

export interface DimensionCandidate {
  name: string;
  uniqueCount: number;
}

export function suggestPrimaryDimensions(columns: DimensionCandidate[]): string[] {
  return columns
    .filter(c => c.uniqueCount >= MIN_CARD && c.uniqueCount <= MAX_CARD)
    .filter(c => {
      const lower = c.name.toLowerCase();
      return NAME_KEYWORDS.some(
        k =>
          lower === k || lower.endsWith(`_${k}`) || lower.startsWith(`${k}_`) || lower.endsWith(k)
      );
    })
    .map(c => c.name);
}
```

Re-export in `packages/core/src/index.ts`:

```typescript
export { suggestPrimaryDimensions } from './scopeDimensions/suggestPrimaryDimensions';
export type { DimensionCandidate } from './scopeDimensions/suggestPrimaryDimensions';
```

- [ ] **Step 8.4: Run core test to verify it passes**

```bash
pnpm --filter @variscout/core test suggestPrimaryDimensions
```

Expected: PASS — 5 tests.

- [ ] **Step 8.5: Write failing test for the selector component**

```typescript
// packages/ui/src/components/PrimaryScopeDimensionsSelector/__tests__/PrimaryScopeDimensionsSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrimaryScopeDimensionsSelector } from '../PrimaryScopeDimensionsSelector';

describe('PrimaryScopeDimensionsSelector', () => {
  const cols = [
    { name: 'product_id', uniqueCount: 9 },
    { name: 'shift', uniqueCount: 3 },
    { name: 'random_col', uniqueCount: 5 },
    { name: 'lot_id', uniqueCount: 87 }, // high-cardinality flagged
  ];

  it('pre-checks suggested dimensions', () => {
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={['product_id', 'shift']}
        value={['product_id', 'shift']}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/product_id/)).toBeChecked();
    expect(screen.getByLabelText(/shift/)).toBeChecked();
    expect(screen.getByLabelText(/random_col/)).not.toBeChecked();
  });

  it('toggling adds/removes the column from value via onChange', () => {
    const onChange = vi.fn();
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={['product_id']}
        value={['product_id']}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText(/random_col/));
    expect(onChange).toHaveBeenCalledWith(['product_id', 'random_col']);
  });

  it('flags high-cardinality columns as join keys, not Pareto candidates', () => {
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={[]}
        value={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/join key, not pareto candidate/i)).toBeInTheDocument();
  });

  it('skip emits onSkip', () => {
    const onSkip = vi.fn();
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={[]}
        value={[]}
        onChange={vi.fn()}
        onSkip={onSkip}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
```

- [ ] **Step 8.6: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test PrimaryScopeDimensionsSelector
```

Expected: FAIL — module not found.

- [ ] **Step 8.7: Implement the selector component**

```typescript
// packages/ui/src/components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector.tsx
export interface DimensionRow {
  name: string;
  uniqueCount: number;
}

export interface PrimaryScopeDimensionsSelectorProps {
  columns: DimensionRow[];
  suggested: string[];
  value: string[];
  onChange: (next: string[]) => void;
  onSkip?: () => void;
}

const HIGH_CARD_THRESHOLD = 50;

export function PrimaryScopeDimensionsSelector({
  columns,
  suggested,
  value,
  onChange,
  onSkip,
}: PrimaryScopeDimensionsSelectorProps) {
  const toggle = (name: string) => {
    const next = value.includes(name) ? value.filter((n) => n !== name) : [...value, name];
    onChange(next);
  };

  return (
    <div className="primary-scope-dimensions-selector">
      <h3>Primary scope dimensions</h3>
      <p className="hint">Which columns will you slice analysis by most often?</p>
      <ul>
        {columns.map((c) => {
          const isSuggested = suggested.includes(c.name);
          const flagged = c.uniqueCount > HIGH_CARD_THRESHOLD;
          return (
            <li key={c.name}>
              <label>
                <input
                  type="checkbox"
                  checked={value.includes(c.name)}
                  onChange={() => toggle(c.name)}
                />
                <code>{c.name}</code> · {c.uniqueCount} levels
                {isSuggested && <span className="suggested-tag">suggested</span>}
                {flagged && <span className="flag">join key, not Pareto candidate</span>}
              </label>
            </li>
          );
        })}
      </ul>
      {onSkip && (
        <button type="button" onClick={onSkip}>
          Skip — set later
        </button>
      )}
    </div>
  );
}
```

Re-export in `packages/ui/src/index.ts`:

```typescript
export { PrimaryScopeDimensionsSelector } from './components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector';
export type {
  DimensionRow,
  PrimaryScopeDimensionsSelectorProps,
} from './components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector';
```

- [ ] **Step 8.8: Run all related tests to verify they pass**

```bash
pnpm --filter @variscout/core test suggestPrimaryDimensions
pnpm --filter @variscout/ui test PrimaryScopeDimensionsSelector
```

Expected: PASS — 9 tests total.

- [ ] **Step 8.9: Commit**

```bash
git add packages/core/src/scopeDimensions/ packages/core/src/index.ts \
        packages/ui/src/components/PrimaryScopeDimensionsSelector/ packages/ui/src/index.ts
git commit -m "feat: PrimaryScopeDimensions auto-suggest + selector UI

suggestPrimaryDimensions filters columns by cardinality (3-50)
+ name keyword (id/lot/batch/product/customer/shift/operator/
machine/supplier/sku/plant/line/station). High-cardinality
columns (>50 levels) flagged as 'join key, not Pareto
candidate'.

PrimaryScopeDimensionsSelector pre-checks suggested columns;
user confirms or overrides; skippable. Implements framing-
layer spec §3.4 and §5.3.2."
```

### Task 9: OutcomeNoMatchBanner (graceful degradation)

**Files:**

- Create: `packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx`
- Create: `packages/ui/src/components/OutcomeNoMatchBanner/__tests__/OutcomeNoMatchBanner.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 9.1: Write failing test**

```typescript
// packages/ui/src/components/OutcomeNoMatchBanner/__tests__/OutcomeNoMatchBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeNoMatchBanner } from '../OutcomeNoMatchBanner';

describe('OutcomeNoMatchBanner', () => {
  it('renders the no-match warning copy', () => {
    render(
      <OutcomeNoMatchBanner
        onRename={vi.fn()}
        onExpectedChange={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.getByText(/no clear outcome match/i)).toBeInTheDocument();
  });

  it('emits expected outcome via onExpectedChange', () => {
    const onExpectedChange = vi.fn();
    render(
      <OutcomeNoMatchBanner
        onRename={vi.fn()}
        onExpectedChange={onExpectedChange}
        onSkip={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/i expected the outcome to be/i), {
      target: { value: 'reject_rate' },
    });
    expect(onExpectedChange).toHaveBeenCalledWith('reject_rate');
  });

  it('emits skip on click', () => {
    const onSkip = vi.fn();
    render(
      <OutcomeNoMatchBanner
        onRename={vi.fn()}
        onExpectedChange={vi.fn()}
        onSkip={onSkip}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /skip outcome/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
```

- [ ] **Step 9.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test OutcomeNoMatchBanner
```

Expected: FAIL — module not found.

- [ ] **Step 9.3: Implement**

```typescript
// packages/ui/src/components/OutcomeNoMatchBanner/OutcomeNoMatchBanner.tsx
import { useState } from 'react';

export interface OutcomeNoMatchBannerProps {
  onRename: (oldName: string, newName: string) => void;
  onExpectedChange: (expected: string) => void;
  onSkip: () => void;
}

export function OutcomeNoMatchBanner({
  onExpectedChange,
  onSkip,
}: OutcomeNoMatchBannerProps) {
  const [expected, setExpected] = useState('');
  return (
    <div className="outcome-no-match-banner" role="alert">
      <strong>⚠ No clear outcome match.</strong>
      <p>
        Either rename a column to match your outcome (best for the long term)
        or pick manually below. VariScout learns from your pick — future paste
        of a column with this name will rank higher next time.
      </p>
      <label>
        I expected the outcome to be:
        <input
          type="text"
          value={expected}
          onChange={(e) => {
            setExpected(e.target.value);
            onExpectedChange(e.target.value);
          }}
          placeholder="e.g. reject_rate"
        />
      </label>
      <button type="button" onClick={onSkip}>
        Skip outcome — paint canvas with all columns unclassified
      </button>
    </div>
  );
}
```

Re-export in `packages/ui/src/index.ts`:

```typescript
export { OutcomeNoMatchBanner } from './components/OutcomeNoMatchBanner/OutcomeNoMatchBanner';
export type { OutcomeNoMatchBannerProps } from './components/OutcomeNoMatchBanner/OutcomeNoMatchBanner';
```

- [ ] **Step 9.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test OutcomeNoMatchBanner
```

Expected: PASS — 3 tests.

- [ ] **Step 9.5: Commit**

```bash
git add packages/ui/src/components/OutcomeNoMatchBanner/ packages/ui/src/index.ts
git commit -m "feat(ui): OutcomeNoMatchBanner graceful degradation

Renders when max(candidate.matchScore) < 0.30 (cryptic columns
or vague goal). Surfaces rename affordance, free-text 'I
expected the outcome to be' note, and skip-outcome path. Hub
records the user's pick for future detection (slice 1 stub;
full learning loop in Spec 5).

Implements framing-layer spec §5.3.3."
```

### Task 10: GoalBanner + OutcomePin (canvas first paint)

**Files:**

- Create: `packages/ui/src/components/GoalBanner/GoalBanner.tsx`
- Create: `packages/ui/src/components/GoalBanner/__tests__/GoalBanner.test.tsx`
- Create: `packages/ui/src/components/OutcomePin/OutcomePin.tsx`
- Create: `packages/ui/src/components/OutcomePin/__tests__/OutcomePin.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 10.1: Write failing test for GoalBanner**

```typescript
// packages/ui/src/components/GoalBanner/__tests__/GoalBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GoalBanner } from '../GoalBanner';

describe('GoalBanner', () => {
  it('renders the process goal narrative', () => {
    render(<GoalBanner goal="We mold barrels for medical customers." />);
    expect(screen.getByTestId('goal-banner')).toHaveTextContent('We mold barrels');
  });

  it('does not render when goal is empty AND not editable', () => {
    const { container } = render(<GoalBanner goal="" />);
    expect(container.firstChild).toBeNull();
  });

  it('click-to-edit opens textarea; Save fires onChange with new value', () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="Old text" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-banner'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });
    fireEvent.click(screen.getByText(/save/i));
    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('Cancel reverts to original text', () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="Old text" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-banner'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Discarded' } });
    fireEvent.click(screen.getByText(/cancel/i));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 10.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test GoalBanner
```

Expected: FAIL — module not found.

- [ ] **Step 10.3: Implement GoalBanner**

```typescript
// packages/ui/src/components/GoalBanner/GoalBanner.tsx
import { useState } from 'react';

export interface GoalBannerProps {
  goal?: string;
  onChange?: (next: string) => void;
}

export function GoalBanner({ goal = '', onChange }: GoalBannerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);

  if (!goal && !editing) return null;

  const enterEdit = () => {
    if (!onChange) return;
    setDraft(goal);
    setEditing(true);
  };

  const save = () => {
    onChange?.(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(goal);
    setEditing(false);
  };

  return (
    <div className="goal-banner" data-testid="goal-banner" onClick={!editing ? enterEdit : undefined}>
      {editing ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
          <button type="button" onClick={save}>Save</button>
          <button type="button" onClick={cancel}>Cancel</button>
        </>
      ) : (
        <>
          <strong>Goal:</strong> {goal}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 10.4: Write failing test for OutcomePin**

```typescript
// packages/ui/src/components/OutcomePin/__tests__/OutcomePin.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomePin } from '../OutcomePin';

const baseOutcome = {
  columnName: 'weight_g',
  characteristicType: 'nominalIsBest' as const,
};
const stats = { mean: 4.5, sigma: 0.1, n: 1842 };

describe('OutcomePin', () => {
  it('with full specs: renders Cpk badge', () => {
    render(
      <OutcomePin
        outcome={{ ...baseOutcome, target: 4.5, lsl: 4.2, usl: 4.8, cpkTarget: 1.33 }}
        stats={stats}
        onAddSpecs={vi.fn()}
      />
    );
    expect(screen.getByText(/cpk/i)).toBeInTheDocument();
  });

  it('without specs: renders mean ± σ + n + Add specs chip', () => {
    render(<OutcomePin outcome={baseOutcome} stats={stats} onAddSpecs={vi.fn()} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/n=1842/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add specs/i })).toBeInTheDocument();
  });

  it('clicking Add specs fires onAddSpecs with column name', () => {
    const onAddSpecs = vi.fn();
    render(<OutcomePin outcome={baseOutcome} stats={stats} onAddSpecs={onAddSpecs} />);
    fireEvent.click(screen.getByRole('button', { name: /add specs/i }));
    expect(onAddSpecs).toHaveBeenCalledWith('weight_g');
  });

  it('with n<10: shows trust pending instead of Cpk', () => {
    render(
      <OutcomePin
        outcome={{ ...baseOutcome, target: 4.5, lsl: 4.2, usl: 4.8 }}
        stats={{ mean: 4.5, sigma: 0.1, n: 5 }}
        onAddSpecs={vi.fn()}
      />
    );
    expect(screen.getByText(/trust pending|n<10/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10.5: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test OutcomePin
```

Expected: FAIL — module not found.

- [ ] **Step 10.6: Implement OutcomePin**

```typescript
// packages/ui/src/components/OutcomePin/OutcomePin.tsx
import type { OutcomeSpec } from '@variscout/core/processHub';

export interface OutcomePinProps {
  outcome: OutcomeSpec;
  stats: { mean: number; sigma: number; n: number };
  onAddSpecs: (columnName: string) => void;
}

const TRUST_PENDING_N = 10;

export function OutcomePin({ outcome, stats, onAddSpecs }: OutcomePinProps) {
  const hasSpecs = outcome.target !== undefined && (outcome.usl !== undefined || outcome.lsl !== undefined);

  if (hasSpecs && stats.n < TRUST_PENDING_N) {
    return (
      <div className="outcome-pin trust-pending" data-testid="outcome-pin">
        <div className="outcome-name">{outcome.columnName}</div>
        <div className="badge">Trust pending — n&lt;{TRUST_PENDING_N}</div>
      </div>
    );
  }

  if (hasSpecs) {
    // Compute Cpk via existing helper / inline simple form (full computation in core).
    return (
      <div className="outcome-pin with-specs" data-testid="outcome-pin">
        <div className="outcome-name">{outcome.columnName}</div>
        <div className="cpk-badge">
          Cpk · target {outcome.target} · ≥ {outcome.cpkTarget ?? 1.33}
        </div>
        <div className="trust">n={stats.n}</div>
      </div>
    );
  }

  return (
    <div className="outcome-pin fallback" data-testid="outcome-pin">
      <div className="outcome-name">{outcome.columnName}</div>
      <div className="fallback-stats">
        {stats.mean.toFixed(2)} ± {stats.sigma.toFixed(2)} · n={stats.n}
      </div>
      <button type="button" onClick={() => onAddSpecs(outcome.columnName)}>
        + Add specs
      </button>
    </div>
  );
}
```

Re-export both in `packages/ui/src/index.ts`:

```typescript
export { GoalBanner } from './components/GoalBanner/GoalBanner';
export type { GoalBannerProps } from './components/GoalBanner/GoalBanner';
export { OutcomePin } from './components/OutcomePin/OutcomePin';
export type { OutcomePinProps } from './components/OutcomePin/OutcomePin';
```

- [ ] **Step 10.7: Run all tests to verify**

```bash
pnpm --filter @variscout/ui test "GoalBanner|OutcomePin"
```

Expected: PASS — 8 tests total.

- [ ] **Step 10.8: Commit**

```bash
git add packages/ui/src/components/GoalBanner/ packages/ui/src/components/OutcomePin/ packages/ui/src/index.ts
git commit -m "feat(ui): GoalBanner + OutcomePin canvas first-paint components

GoalBanner renders Hub.processGoal at top of canvas;
click-to-edit opens textarea with Save / Cancel; onChange
callback to parent. Hides itself when goal is empty.

OutcomePin shows Cpk badge when specs are set + n>=10; falls
back to 'mean ± σ + n' + '+ Add specs' chip when specs absent;
shows 'Trust pending' when specs set but n<10. Per Q2 fallback
rule (framing-layer spec §5.2) and sample-size honesty
(vision §2.3)."
```

### Task 11: `.vrs` file format + export/import

**Files:**

- Create: `packages/core/src/serialization/vrsFormat.ts` (TypeScript types + version constant)
- Create: `packages/core/src/serialization/vrsExport.ts`
- Create: `packages/core/src/serialization/vrsImport.ts`
- Create: `packages/core/src/serialization/__tests__/roundtrip.test.ts`

- [ ] **Step 11.1: Write failing roundtrip test**

```typescript
// packages/core/src/serialization/__tests__/roundtrip.test.ts
import { describe, expect, it } from 'vitest';
import { vrsExport } from '../vrsExport';
import { vrsImport } from '../vrsImport';
import { VRS_VERSION } from '../vrsFormat';
import { DEFAULT_PROCESS_HUB } from '../../processHub';

describe('vrs roundtrip', () => {
  const hub = {
    ...DEFAULT_PROCESS_HUB,
    processGoal: 'We mold barrels.',
    outcomes: [
      {
        columnName: 'weight_g',
        characteristicType: 'nominalIsBest' as const,
        target: 4.5,
        cpkTarget: 1.33,
      },
    ],
    primaryScopeDimensions: ['product_id', 'shift'],
  };
  const rawData = [{ weight_g: 4.5 }, { weight_g: 4.4 }];

  it('exports a valid VrsFile JSON string', () => {
    const json = vrsExport(hub, rawData, { exportSource: 'pwa', appVersion: 'test' });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(VRS_VERSION);
    expect(parsed.hub.processGoal).toBe('We mold barrels.');
  });

  it('round-trips hub + rawData with deep equality', () => {
    const exported = vrsExport(hub, rawData);
    const imported = vrsImport(exported);
    expect(imported.hub).toEqual(hub);
    expect(imported.rawData).toEqual(rawData);
  });

  it('rejects unsupported version with a clear error', () => {
    const bad = JSON.stringify({ version: '0.9', exportedAt: new Date().toISOString(), hub });
    expect(() => vrsImport(bad)).toThrow(/unsupported.*version/i);
  });

  it('rejects missing hub field', () => {
    const bad = JSON.stringify({ version: VRS_VERSION, exportedAt: new Date().toISOString() });
    expect(() => vrsImport(bad)).toThrow(/missing.*hub/i);
  });

  it('handles export without rawData (Hub-only scenarios)', () => {
    const json = vrsExport(hub);
    const imported = vrsImport(json);
    expect(imported.hub).toEqual(hub);
    expect(imported.rawData).toBeUndefined();
  });
});
```

- [ ] **Step 11.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test roundtrip
```

Expected: FAIL — modules not found.

- [ ] **Step 11.3: Implement vrsFormat + export + import**

```typescript
// packages/core/src/serialization/vrsFormat.ts
import type { ProcessHub } from '../processHub';

export const VRS_VERSION = '1.0' as const;

export interface VrsFile {
  version: typeof VRS_VERSION;
  exportedAt: string; // ISO timestamp
  hub: ProcessHub;
  rawData?: Array<Record<string, unknown>>;
  metadata?: { exportSource: 'pwa' | 'azure'; appVersion: string };
}
```

```typescript
// packages/core/src/serialization/vrsExport.ts
import type { ProcessHub } from '../processHub';
import { VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsExport(
  hub: ProcessHub,
  rawData?: Array<Record<string, unknown>>,
  metadata?: VrsFile['metadata']
): string {
  const file: VrsFile = {
    version: VRS_VERSION,
    exportedAt: new Date().toISOString(),
    hub,
    rawData,
    metadata,
  };
  return JSON.stringify(file, null, 2);
}
```

```typescript
// packages/core/src/serialization/vrsImport.ts
import { VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsImport(json: string): VrsFile {
  let parsed: Partial<VrsFile>;
  try {
    parsed = JSON.parse(json) as Partial<VrsFile>;
  } catch (e) {
    throw new Error(`Invalid .vrs: not valid JSON (${(e as Error).message})`);
  }

  if (parsed.version !== VRS_VERSION) {
    throw new Error(
      `Unsupported .vrs version: ${parsed.version}. This build supports ${VRS_VERSION}.`
    );
  }
  if (!parsed.hub) {
    throw new Error('Invalid .vrs: missing hub field.');
  }
  return parsed as VrsFile;
}
```

Re-export in `packages/core/src/index.ts`:

```typescript
export { vrsExport } from './serialization/vrsExport';
export { vrsImport } from './serialization/vrsImport';
export { VRS_VERSION } from './serialization/vrsFormat';
export type { VrsFile } from './serialization/vrsFormat';
```

- [ ] **Step 11.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test roundtrip
```

Expected: PASS — 5 tests.

- [ ] **Step 11.5: Commit**

```bash
git add packages/core/src/serialization/ packages/core/src/index.ts
git commit -m "feat(core): .vrs file format + export/import (round-trip tested)

VRS_VERSION='1.0'. VrsFile shape: version, exportedAt, hub,
optional rawData, optional metadata (exportSource pwa|azure +
appVersion).

vrsExport(hub, rawData?, metadata?) → JSON string (pretty,
indent 2).
vrsImport(json) → VrsFile with version validation + clear
error messages on mismatch. Hub-only export supported (rawData
optional, useful for canvas-without-data sharing).

Round-trip preserves Hub + rawData via JSON serialization.
.vrs files double as shareable training scenarios per
Q8-revised."
```

### Task 12: PWA Dexie schema + hubRepository (opt-in persistence)

**Files:**

- Create: `apps/pwa/src/db/schema.ts` (Dexie schema with tables: `hubs`, `meta`)
- Create: `apps/pwa/src/db/hubRepository.ts`
- Create: `apps/pwa/src/db/__tests__/hubRepository.test.ts`
- Modify: `apps/pwa/package.json` (add `dexie` dependency if not present; ensure `fake-indexeddb` in devDependencies)

- [ ] **Step 12.1: Add dependencies**

```bash
pnpm --filter @variscout/pwa add dexie
pnpm --filter @variscout/pwa add -D fake-indexeddb
```

Verify `apps/pwa/package.json` lists both. Commit lockfile changes after Step 12.5.

- [ ] **Step 12.2: Write failing test**

```typescript
// apps/pwa/src/db/__tests__/hubRepository.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { hubRepository } from '../hubRepository';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

describe('hubRepository', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('getOptInFlag defaults to false on a fresh database', async () => {
    expect(await hubRepository.getOptInFlag()).toBe(false);
  });

  it('setOptInFlag(true) persists the flag', async () => {
    await hubRepository.setOptInFlag(true);
    expect(await hubRepository.getOptInFlag()).toBe(true);
  });

  it('saveHub + loadHub round-trip a Hub', async () => {
    const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'We mold barrels.' };
    await hubRepository.saveHub(hub);
    const loaded = await hubRepository.loadHub();
    expect(loaded?.processGoal).toBe('We mold barrels.');
  });

  it('saveHub overwrites the single row (Hub-of-one constraint)', async () => {
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'First' });
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'Second' });
    const loaded = await hubRepository.loadHub();
    expect(loaded?.processGoal).toBe('Second');
  });

  it('loadHub returns null when no Hub saved', async () => {
    expect(await hubRepository.loadHub()).toBeNull();
  });

  it('setOptInFlag(false) automatically clears the Hub', async () => {
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'X' });
    await hubRepository.setOptInFlag(true);
    await hubRepository.setOptInFlag(false);
    expect(await hubRepository.loadHub()).toBeNull();
  });

  it('clearHub removes the saved Hub but leaves opt-in flag', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'X' });
    await hubRepository.clearHub();
    expect(await hubRepository.loadHub()).toBeNull();
    expect(await hubRepository.getOptInFlag()).toBe(true);
  });
});
```

- [ ] **Step 12.3: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test hubRepository
```

Expected: FAIL — modules not found.

- [ ] **Step 12.4: Implement schema + repository**

```typescript
// apps/pwa/src/db/schema.ts
import Dexie, { type Table } from 'dexie';
import type { ProcessHub } from '@variscout/core/processHub';

export interface MetaRow {
  key: string;
  value: unknown;
}

export interface HubRow {
  id: string; // always 'hub-of-one' (single-row constraint)
  hub: ProcessHub;
  savedAt: string;
}

export class PwaDatabase extends Dexie {
  hubs!: Table<HubRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('variscout-pwa');
    this.version(1).stores({
      hubs: '&id',
      meta: '&key',
    });
  }
}

export const db = new PwaDatabase();
```

```typescript
// apps/pwa/src/db/hubRepository.ts
import type { ProcessHub } from '@variscout/core/processHub';
import { db } from './schema';

const HUB_ID = 'hub-of-one';
const OPT_IN_KEY = 'persistence.optIn';

export const hubRepository = {
  async getOptInFlag(): Promise<boolean> {
    const row = await db.meta.get(OPT_IN_KEY);
    return Boolean(row?.value);
  },

  async setOptInFlag(value: boolean): Promise<void> {
    await db.meta.put({ key: OPT_IN_KEY, value });
    if (!value) {
      await this.clearHub();
    }
  },

  async saveHub(hub: ProcessHub): Promise<void> {
    await db.hubs.put({ id: HUB_ID, hub, savedAt: new Date().toISOString() });
  },

  async loadHub(): Promise<ProcessHub | null> {
    const row = await db.hubs.get(HUB_ID);
    return row?.hub ?? null;
  },

  async clearHub(): Promise<void> {
    await db.hubs.delete(HUB_ID);
  },

  async clearAll(): Promise<void> {
    await db.hubs.clear();
    await db.meta.clear();
  },
};
```

- [ ] **Step 12.5: Run test to verify it passes**

```bash
pnpm --filter @variscout/pwa test hubRepository
```

Expected: PASS — 7 tests.

- [ ] **Step 12.6: Commit**

```bash
git add apps/pwa/src/db/ apps/pwa/package.json pnpm-lock.yaml
git commit -m "feat(pwa): Dexie hubRepository for opt-in Hub-of-one persistence

New PwaDatabase (Dexie v1) with two tables: hubs (single-row
Hub-of-one constraint) + meta (opt-in flag).

hubRepository API: getOptInFlag / setOptInFlag (auto-clears
Hub on false) / saveHub (overwrites single row) / loadHub
(returns null if absent) / clearHub.

Per Q8-revised: Dexie loaded only after explicit opt-in via
'Save to this browser' affordance (Task 13). Default behavior
unchanged from today (session-only). dexie + fake-indexeddb
added as dependencies."
```

### Task 13: PWA SaveToBrowserButton + VrsExportButton + VrsImportButton

**Files:**

- Create: `apps/pwa/src/components/SaveToBrowserButton.tsx`
- Create: `apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx`
- Create: `apps/pwa/src/components/VrsExportButton.tsx`
- Create: `apps/pwa/src/components/VrsImportButton.tsx`
- Create: `apps/pwa/src/components/__tests__/VrsButtons.test.tsx`

- [ ] **Step 13.1: Write failing test for SaveToBrowserButton**

```typescript
// apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveToBrowserButton } from '../SaveToBrowserButton';
import { hubRepository } from '../../db/hubRepository';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('SaveToBrowserButton', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('shows "Save to this browser" when not opted in', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /save to this browser/i })).toBeInTheDocument());
  });

  it('clicking save opts in + persists Hub', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));
    await waitFor(async () => expect(await hubRepository.getOptInFlag()).toBe(true));
    expect(await hubRepository.loadHub()).toMatchObject({ processGoal: 'Test goal.' });
  });

  it('after opt-in, button shows "Saved · Forget"', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub(hub);
    render(<SaveToBrowserButton currentHub={hub} />);
    expect(await screen.findByRole('button', { name: /saved.*forget/i })).toBeInTheDocument();
  });

  it('clicking Forget after confirm clears persistence', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub(hub);
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /saved.*forget/i }));
    await waitFor(async () => expect(await hubRepository.getOptInFlag()).toBe(false));
    expect(await hubRepository.loadHub()).toBeNull();
  });
});
```

- [ ] **Step 13.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test SaveToBrowserButton
```

Expected: FAIL — module not found.

- [ ] **Step 13.3: Implement SaveToBrowserButton**

```typescript
// apps/pwa/src/components/SaveToBrowserButton.tsx
import { useEffect, useState } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';
import { hubRepository } from '../db/hubRepository';

export interface SaveToBrowserButtonProps {
  currentHub: ProcessHub;
}

export function SaveToBrowserButton({ currentHub }: SaveToBrowserButtonProps) {
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hubRepository.getOptInFlag().then(setOptedIn);
  }, []);

  // Auto-save on Hub change once opted in
  useEffect(() => {
    if (optedIn) {
      void hubRepository.saveHub(currentHub);
    }
  }, [optedIn, currentHub]);

  if (optedIn === null) return null; // initial load

  if (!optedIn) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await hubRepository.setOptInFlag(true);
          await hubRepository.saveHub(currentHub);
          setOptedIn(true);
          setBusy(false);
        }}
      >
        Save to this browser
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm('Forget this saved Hub from this browser? This cannot be undone.')) return;
        setBusy(true);
        await hubRepository.setOptInFlag(false);
        setOptedIn(false);
        setBusy(false);
      }}
    >
      Saved · Forget
    </button>
  );
}
```

- [ ] **Step 13.4: Run test to verify it passes**

```bash
pnpm --filter @variscout/pwa test SaveToBrowserButton
```

Expected: PASS — 4 tests.

- [ ] **Step 13.5: Write failing test for VrsExport/Import buttons**

```typescript
// apps/pwa/src/components/__tests__/VrsButtons.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VrsExportButton } from '../VrsExportButton';
import { VrsImportButton } from '../VrsImportButton';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('VrsExportButton', () => {
  it('triggers a download when clicked', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    render(<VrsExportButton currentHub={hub} currentData={[{ x: 1 }]} />);
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;

    fireEvent.click(screen.getByRole('button', { name: /export.*\.vrs/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('VrsImportButton', () => {
  it('parses an uploaded .vrs and emits onImport', async () => {
    const onImport = vi.fn();
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      hub,
      rawData: [{ x: 1 }],
    });
    const file = new File([json], 'scenario.vrs', { type: 'application/json' });

    render(<VrsImportButton onImport={onImport} />);
    const input = screen.getByLabelText(/import.*\.vrs/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    const arg = onImport.mock.calls[0][0];
    expect(arg.hub.processGoal).toBe('Test goal.');
    expect(arg.rawData).toEqual([{ x: 1 }]);
  });
});
```

- [ ] **Step 13.6: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test VrsButtons
```

Expected: FAIL — modules not found.

- [ ] **Step 13.7: Implement VrsExportButton + VrsImportButton**

```typescript
// apps/pwa/src/components/VrsExportButton.tsx
import type { ProcessHub } from '@variscout/core/processHub';
import { vrsExport } from '@variscout/core';

export interface VrsExportButtonProps {
  currentHub: ProcessHub;
  currentData?: Array<Record<string, unknown>>;
}

export function VrsExportButton({ currentHub, currentData }: VrsExportButtonProps) {
  const onClick = () => {
    const json = vrsExport(currentHub, currentData, {
      exportSource: 'pwa',
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (currentHub.processGoal ?? 'hub').slice(0, 32).replace(/[^a-z0-9-]+/gi, '-');
    a.download = `${safeName}.vrs`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={onClick}>
      Export .vrs
    </button>
  );
}
```

```typescript
// apps/pwa/src/components/VrsImportButton.tsx
import { useRef } from 'react';
import { vrsImport, type VrsFile } from '@variscout/core';

export interface VrsImportButtonProps {
  onImport: (imported: VrsFile) => void;
}

export function VrsImportButton({ onImport }: VrsImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = vrsImport(text);
      onImport(imported);
    } catch (err) {
      window.alert(`Could not import .vrs: ${(err as Error).message}`);
    } finally {
      e.target.value = ''; // reset so re-uploading the same file fires onChange
    }
  };

  return (
    <label>
      Import .vrs
      <input
        ref={inputRef}
        type="file"
        accept=".vrs,application/json"
        onChange={onChange}
        style={{ display: 'none' }}
        aria-label="import .vrs file"
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        Choose .vrs file
      </button>
    </label>
  );
}
```

- [ ] **Step 13.8: Run all related tests**

```bash
pnpm --filter @variscout/pwa test "SaveToBrowserButton|VrsButtons"
```

Expected: PASS — 6 tests total.

- [ ] **Step 13.9: Commit**

```bash
git add apps/pwa/src/components/SaveToBrowserButton.tsx \
        apps/pwa/src/components/VrsExportButton.tsx \
        apps/pwa/src/components/VrsImportButton.tsx \
        apps/pwa/src/components/__tests__/
git commit -m "feat(pwa): Save-to-browser opt-in + .vrs export/import buttons

SaveToBrowserButton: shows 'Save to this browser' when not
opted in; clicking opts in + persists Hub. Once opted in,
auto-saves on Hub change. Button switches to 'Saved · Forget'
— click + confirm clears persistence (calls setOptInFlag(false)
which auto-clears Hub).

VrsExportButton: serializes current Hub + data via vrsExport,
downloads as <hub-name>.vrs (sanitized).

VrsImportButton: file picker; reads file → vrsImport →
emits onImport({ hub, rawData }) for parent to consume.
Per Q8-revised hybrid persistence (Option 4)."
```

### Task 14: PWA Mode B + Mode A.1 wiring

**Files:**

- Modify: `apps/pwa/src/App.tsx` (route logic)
- Create: `apps/pwa/src/store/sessionStore.tsx` (React Context provider for current Hub state)
- Create: `apps/pwa/src/__tests__/modeB.e2e.spec.ts` (Playwright E2E)
- Create: `apps/pwa/src/__tests__/modeA1.test.tsx` (RTL — reopen restores from IndexedDB)

- [ ] **Step 14.1: Write failing E2E test**

```typescript
// apps/pwa/src/__tests__/modeB.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Framing layer Mode B (PWA)', () => {
  test('paste → goal narrative → outcome confirm → canvas first paint', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Paste from Excel');
    await page
      .getByRole('textbox', { name: /paste data/i })
      .fill('weight_g,oven_temp\n4.5,178\n4.4,180\n4.6,180\n4.5,179\n4.4,178');
    await page.click('text=Parse');

    // Stage 1: goal narrative
    await page
      .getByRole('textbox', { name: /process goal/i })
      .fill('We mold barrels for medical customers.');
    await page.click('text=Continue');

    // Stage 3: outcome auto-selected via goal context
    await expect(page.getByRole('radio', { name: /weight_g/i })).toBeChecked();
    await page.click('text=Confirm');

    // Stage 4: canvas first paint
    await expect(page.getByTestId('goal-banner')).toContainText('We mold barrels');
    await expect(page.getByTestId('outcome-pin')).toContainText('weight_g');
  });
});
```

- [ ] **Step 14.2: Write failing RTL test for Mode A.1 reopen**

```typescript
// apps/pwa/src/__tests__/modeA1.test.tsx
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { hubRepository } from '../db/hubRepository';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

describe('Mode A.1 — PWA reopen with persistence', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('with opt-in flag false: lands on HomeScreen', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/paste from excel/i)).toBeInTheDocument());
  });

  it('with opt-in flag true and Hub saved: restores canvas with goal banner', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'Restored goal.' });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('goal-banner')).toHaveTextContent('Restored goal'));
  });
});
```

- [ ] **Step 14.3: Run tests to verify they fail**

```bash
pnpm --filter @variscout/pwa test modeA1
pnpm --filter @variscout/pwa test:e2e modeB
```

Expected: FAIL — components/wiring not in place yet.

- [ ] **Step 14.4: Implement sessionStore (React Context)**

```typescript
// apps/pwa/src/store/sessionStore.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';

interface SessionState {
  hub: ProcessHub | null;
  rawData: Array<Record<string, unknown>> | null;
}

interface SessionStore extends SessionState {
  setHub: (hub: ProcessHub | null) => void;
  setRawData: (data: Array<Record<string, unknown>> | null) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [hub, setHub] = useState<ProcessHub | null>(null);
  const [rawData, setRawData] = useState<Array<Record<string, unknown>> | null>(null);
  return (
    <SessionContext.Provider value={{ hub, rawData, setHub, setRawData }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
```

- [ ] **Step 14.5: Wire App.tsx routing**

In `apps/pwa/src/App.tsx`:

1. Wrap the app tree in `<SessionProvider>`.
2. On app load (`useEffect`), call `hubRepository.getOptInFlag()`. If true, `hubRepository.loadHub()` → `setHub(loaded)`.
3. Route logic:
   - If `hub === null && rawData === null` → `<HomeScreen />`
   - After paste → render `<HubGoalForm onConfirm={(narrative) => navigateTo('column-mapping', narrative)} />`
   - After goal → render `<ColumnMapping {...} />` refactored to use `OutcomeCandidateRow`, `PrimaryScopeDimensionsSelector`, `OutcomeNoMatchBanner`.
   - After confirm → build Hub, call `setHub(builtHub)`, route to `<Dashboard />` with `<GoalBanner goal={hub.processGoal} />` and `<OutcomePin />` for each outcome.

Pseudocode (skeleton — full integration with existing PWA flow):

```typescript
// apps/pwa/src/App.tsx (relevant additions)
import { useEffect, useState } from 'react';
import { SessionProvider, useSession } from './store/sessionStore';
import { hubRepository } from './db/hubRepository';
import { HubGoalForm, GoalBanner, OutcomePin } from '@variscout/ui';
import { extractHubName } from '@variscout/core';

function AppRoutes() {
  const { hub, setHub, rawData, setRawData } = useSession();
  const [stage, setStage] = useState<'home' | 'paste' | 'goal' | 'mapping' | 'canvas'>('home');

  useEffect(() => {
    void hubRepository.getOptInFlag().then(async (opted) => {
      if (opted) {
        const loaded = await hubRepository.loadHub();
        if (loaded) {
          setHub(loaded);
          setStage('canvas');
        }
      }
    });
  }, [setHub]);

  if (stage === 'home') return <HomeScreen onPaste={() => setStage('paste')} />;
  if (stage === 'paste') return <PasteScreen onParsed={(data) => { setRawData(data); setStage('goal'); }} />;
  if (stage === 'goal') {
    return (
      <HubGoalForm
        onConfirm={(narrative) => {
          const partialHub = { ...DEFAULT_PROCESS_HUB, processGoal: narrative, name: extractHubName(narrative) };
          setHub(partialHub);
          setStage('mapping');
        }}
        onSkip={() => setStage('mapping')}
      />
    );
  }
  if (stage === 'mapping') return <ColumnMappingFlow onConfirm={(outcomes, dims) => { setHub({ ...hub!, outcomes, primaryScopeDimensions: dims }); setStage('canvas'); }} />;
  return <CanvasView hub={hub!} rawData={rawData!} />;
}

function CanvasView({ hub, rawData }: { hub: ProcessHub; rawData: Array<Record<string, unknown>> }) {
  // Compute stats per outcome
  return (
    <div>
      <GoalBanner goal={hub.processGoal} />
      {hub.outcomes?.map((o) => (
        <OutcomePin
          key={o.columnName}
          outcome={o}
          stats={computeStats(rawData, o.columnName)}
          onAddSpecs={(col) => {/* open SpecEditor */}}
        />
      ))}
      <Dashboard /* existing */ />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}
```

(Full integration must reconcile with existing `App.tsx` routes, `lazyWithRetry` boundaries, etc.; the engineer adapts the snippet to the existing structure.)

- [ ] **Step 14.6: Run RTL test to verify it passes**

```bash
pnpm --filter @variscout/pwa test modeA1
```

Expected: PASS — 2 tests.

- [ ] **Step 14.7: Run E2E test to verify it passes**

```bash
pnpm --filter @variscout/pwa test:e2e modeB
```

Expected: PASS — 1 test.

- [ ] **Step 14.8: Commit**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/store/ apps/pwa/src/__tests__/
git commit -m "feat(pwa): Mode B end-to-end wiring + Mode A.1 reopen

SessionProvider holds current Hub + rawData in React Context
(in-memory; persistence via opt-in hubRepository).

App.tsx routing on load: getOptInFlag → if true, loadHub() and
route directly to canvas (Mode A.1). Otherwise HomeScreen
flow → PasteScreen → HubGoalForm → ColumnMapping (refactored
with OutcomeCandidateRow + PrimaryScopeDimensionsSelector +
OutcomeNoMatchBanner) → Canvas with GoalBanner + OutcomePin.

E2E test (Playwright) verifies Mode B paste → goal narrative
→ outcome confirm → canvas first paint with goal banner +
outcome pin. RTL test verifies Mode A.1 reopen restores
canvas state from IndexedDB when opt-in flag is true."
```

### Task 15: Azure Mode B + Mode A.1 wiring

**Files:**

- Modify: `apps/azure/src/db/schema.ts` (bump Dexie version 4→5; existing rows already accept the new optional fields since they're added to ProcessHub type — Dexie doesn't enforce types)
- Create: `apps/azure/src/components/editor/HubCreationFlow.tsx`
- Create: `apps/azure/src/components/editor/__tests__/HubCreationFlow.test.tsx`
- Modify: `apps/azure/src/pages/Dashboard.tsx` (add "+ New Hub" button + route to HubCreationFlow)
- Modify: `apps/azure/src/components/ProcessHubView.tsx` (mount GoalBanner above existing tabs)

- [ ] **Step 15.1: Write failing test for HubCreationFlow**

```typescript
// apps/azure/src/components/editor/__tests__/HubCreationFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HubCreationFlow } from '../HubCreationFlow';

describe('HubCreationFlow', () => {
  it('Stage 1 → Stage 2 → Stage 3 → confirm builds a ProcessHub and emits onCreated', async () => {
    const onCreated = vi.fn();
    render(<HubCreationFlow onCreated={onCreated} onCancel={vi.fn()} />);

    // Stage 1
    fireEvent.change(screen.getByRole('textbox', { name: /process goal/i }), {
      target: { value: 'We mold barrels for medical customers.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Stage 2 (paste)
    fireEvent.change(screen.getByLabelText(/paste data/i), {
      target: { value: 'weight_g\n4.5\n4.4\n4.6\n4.5\n4.4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /parse/i }));

    // Stage 3
    await waitFor(() => expect(screen.getByRole('radio', { name: /weight_g/i })).toBeChecked());
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const hub = onCreated.mock.calls[0][0];
    expect(hub.processGoal).toContain('We mold barrels');
    expect(hub.outcomes).toHaveLength(1);
    expect(hub.outcomes[0].columnName).toBe('weight_g');
  });

  it('Skip path on Stage 1 still routes through Stage 2 + Stage 3', async () => {
    const onCreated = vi.fn();
    render(<HubCreationFlow onCreated={onCreated} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /skip framing/i }));
    expect(screen.getByLabelText(/paste data/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 15.2: Run test to verify it fails**

```bash
pnpm --filter @variscout/azure-app test HubCreationFlow
```

Expected: FAIL — module not found.

- [ ] **Step 15.3: Implement HubCreationFlow**

```typescript
// apps/azure/src/components/editor/HubCreationFlow.tsx
import { useState } from 'react';
import {
  HubGoalForm,
  ColumnMapping,
  OutcomeCandidateRow,
  PrimaryScopeDimensionsSelector,
  OutcomeNoMatchBanner,
} from '@variscout/ui';
import {
  detectColumns,
  validateData,
  inferCharacteristicType,
  defaultSpecsFor,
  suggestPrimaryDimensions,
  extractHubName,
  type ProcessHub,
  type OutcomeSpec,
} from '@variscout/core';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

export interface HubCreationFlowProps {
  onCreated: (hub: ProcessHub, rawData: Array<Record<string, unknown>>) => void;
  onCancel: () => void;
}

type Stage = 'goal' | 'paste' | 'mapping';

export function HubCreationFlow({ onCreated, onCancel }: HubCreationFlowProps) {
  const [stage, setStage] = useState<Stage>('goal');
  const [goal, setGoal] = useState('');
  const [rawData, setRawData] = useState<Array<Record<string, unknown>> | null>(null);

  if (stage === 'goal') {
    return (
      <HubGoalForm
        onConfirm={(narrative) => {
          setGoal(narrative);
          setStage('paste');
        }}
        onSkip={() => setStage('paste')}
      />
    );
  }

  if (stage === 'paste') {
    return (
      <PasteSection
        onParsed={(data) => {
          setRawData(data);
          setStage('mapping');
        }}
        onCancel={onCancel}
      />
    );
  }

  if (stage === 'mapping' && rawData) {
    return (
      <Stage3Mapping
        rawData={rawData}
        goal={goal}
        onConfirm={(outcomes, primaryScopeDimensions) => {
          const hub: ProcessHub = {
            ...DEFAULT_PROCESS_HUB,
            id: crypto.randomUUID(),
            name: extractHubName(goal) || 'Untitled Hub',
            processGoal: goal,
            outcomes,
            primaryScopeDimensions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onCreated(hub, rawData);
        }}
      />
    );
  }

  return null;
}

// Inline Stage3Mapping: reuses ColumnMapping primitives with goal-context detection.
// (engineer may extract to a separate file as it grows)
function Stage3Mapping({ rawData, goal, onConfirm }: {
  rawData: Array<Record<string, unknown>>;
  goal: string;
  onConfirm: (outcomes: OutcomeSpec[], primaryScopeDimensions: string[]) => void;
}) {
  const detected = detectColumns(rawData, { goalContext: goal });
  // ... build candidate rows, manage selection state, handle graceful degradation,
  // suggest scope dimensions, emit onConfirm with built outcomes ...
  // (Full implementation follows the patterns from Tasks 6, 8, 9.)
}

function PasteSection({ onParsed, onCancel }: { onParsed: (data: Array<Record<string, unknown>>) => void; onCancel: () => void }) {
  // Reuses existing Azure paste UX or wraps ColumnMapping's data preview;
  // emits onParsed(rows) once user confirms parse.
}
```

- [ ] **Step 15.4: Wire Dashboard "+ New Hub" button**

In `apps/azure/src/pages/Dashboard.tsx`:

```typescript
import { HubCreationFlow } from '../components/editor/HubCreationFlow';
import { saveProcessHub } from '../services/processHubService'; // existing

// In the Dashboard component:
const [creating, setCreating] = useState(false);

return (
  <>
    {/* existing Hub list UI */}
    <button onClick={() => setCreating(true)}>+ New Hub</button>
    {creating && (
      <HubCreationFlow
        onCreated={async (hub, rawData) => {
          await saveProcessHub(hub);
          // Optionally: persist initial rawData as the first snapshot here (slice 2 expansion)
          setCreating(false);
          setSelectedHubId(hub.id);
        }}
        onCancel={() => setCreating(false)}
      />
    )}
  </>
);
```

- [ ] **Step 15.5: Mount GoalBanner above ProcessHubView tabs**

In `apps/azure/src/components/ProcessHubView.tsx`, wrap the existing tab container in a `<GoalBanner goal={hub.processGoal} onChange={(next) => updateHub({ ...hub, processGoal: next })} />` block at the top.

- [ ] **Step 15.6: Bump Dexie schema version 4 → 5 (no-op migration)**

In `apps/azure/src/db/schema.ts`, after the existing `this.version(4).stores({...})` chain, add:

```typescript
this.version(5).stores({
  // No schema changes — new fields (processGoal, outcomes, primaryScopeDimensions)
  // are TypeScript-only on ProcessHub; Dexie stores objects without enforcing
  // structure. Bumping the version flushes any cached schema and is harmless
  // for existing rows (their JSON simply lacks the new fields, which read as
  // undefined per the optional types).
});
```

- [ ] **Step 15.7: Run all related tests**

```bash
pnpm --filter @variscout/azure-app test HubCreationFlow
pnpm --filter @variscout/azure-app test ProcessHubView
```

Expected: PASS — new tests pass; existing ProcessHubView tests still pass (the GoalBanner is purely additive).

- [ ] **Step 15.8: Commit**

```bash
git add apps/azure/src/components/editor/HubCreationFlow.tsx \
        apps/azure/src/components/editor/__tests__/ \
        apps/azure/src/pages/Dashboard.tsx \
        apps/azure/src/components/ProcessHubView.tsx \
        apps/azure/src/db/schema.ts
git commit -m "feat(azure): Mode B end-to-end wiring + ProcessHub schema migration v5

HubCreationFlow component (Stage 1 → Stage 2 → Stage 3 → built
Hub) reuses framing-layer primitives from @variscout/ui +
@variscout/core (HubGoalForm, OutcomeCandidateRow,
PrimaryScopeDimensionsSelector, OutcomeNoMatchBanner,
detectColumns with goalContext, validateData multi-outcome,
suggestPrimaryDimensions, extractHubName).

Dashboard '+ New Hub' button routes through HubCreationFlow
and persists via saveProcessHub. ProcessHubView mounts
GoalBanner above the existing Status/Capability tabs (Mode A.1
reopen — Hub state restored from Dexie always; Azure tier has
no opt-in flag).

Dexie schema v5 is a no-op version bump; the new ProcessHub
fields are optional TypeScript additions that Dexie stores
without schema migration."
```

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
