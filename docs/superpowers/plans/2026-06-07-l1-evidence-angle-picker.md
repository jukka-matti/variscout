---
tier: ephemeral
purpose: build
title: 'L-1 — Evidence-angle picker: revive the dead FindingEvidenceType breadth rule'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/superpowers/plans/2026-06-07-demo-readiness-master-plan.md
  - docs/02-journeys/wireframes/suspected-cause-card.md
---

# L-1: Evidence-Angle Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the three evidence angles (📊 data / 👁 gemba / 💬 expert) settable and visible. `Finding.evidenceType` exists and the Verified-suggestion breadth rule (`≥2 distinct types AND a survived break attempt`) already ships in `deriveHypothesisStatus` — but every finding is hard-defaulted `'data'`, so the rule is dead. After L-1: the capture card and the findings panel let the analyst set/correct the angle, hypothesis cards show which angles they have, and the breadth rule fires for real.

**Architecture:** Follow the established post-factory-spread convention in `analyzeStore.addFinding` (see the scopeId/originStepId comment at `packages/stores/src/analyzeStore.ts:399-404`) — `createFinding`'s positional signature stays untouched. UI: one new shared `EvidenceAnglePicker` primitive in `@variscout/ui`, mounted in `CaptureCard` + the findings-panel card. Spec ref: [Analyze/Wall legibility design §4](../specs/2026-06-07-analyze-wall-legibility-design.md).

**Tech Stack:** TypeScript, Zustand (`@variscout/stores`), React + Tailwind semantic classes (`@variscout/ui`), Vitest + RTL.

**Worktree/branch:** `feat/l1-evidence-angle-picker`. Stop-line: PR opened against main. Never merge.

---

## Constraints

- `packages/core` stays pure TS. Do NOT add a `FindingSource` variant — angle is orthogonal to chart origin (`FindingSource` is the 4-variant chart union, core/CLAUDE.md).
- Do NOT touch `CausalLink.evidenceType` (4-value, a different entity) or `MeasurementMethod` (the how-to-gather axis).
- `CaptureCard` currently uses hardcoded English (logged i18n-sweep deferral) — the picker labels follow suit (hardcoded EN, no catalog keys in this PR). The hypothesis-card angle FACTS row is L-2/L-3 territory — NOT this PR (see §Scope fence).
- ui test fixtures use factories, never literals (`createFinding()` from `@variscout/core`); `pnpm --filter @variscout/ui build` (tsc) must pass — it catches what vitest misses.
- Verification scope: targeted test files (<90s). NO `pr-ready-check.sh`, NO full turbo from the implementer loop.
- Both apps must compile; app-level wiring changes are expected to be zero (CaptureCard is consumed via shared flows) — verify with the app builds, don't assume.

## Scope fence

IN: store param + edit action, the picker primitive, CaptureCard integration, findings-panel angle display+edit, store tests, component tests.
OUT (later L-PRs): hypothesis-card facts rows, the Verified-chip copy change, matrix view, any i18n catalog work, manual qualitative-finding entry point on the Wall.

---

### Task 1: `addFinding` accepts an optional evidence angle

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts` (interface ~line 80-92; impl ~line 391-410)
- Test: `packages/stores/src/__tests__/analyzeStore.test.ts` (existing `addFinding` suite — 48 references)

- [ ] **Step 1: Write the failing test** (in the existing `addFinding` describe block)

```ts
it('stores the evidence angle when provided and defaults to data when omitted', () => {
  const store = useAnalyzeStore.getState();
  const gemba = store.addFinding(
    'Operator shows the jig sticking on changeover',
    { activeFilters: {}, cumulativeScope: null },
    undefined,
    undefined,
    undefined,
    'gemba'
  );
  expect(gemba.evidenceType).toBe('gemba');

  const plain = store.addFinding('Line B runs high', { activeFilters: {}, cumulativeScope: null });
  expect(plain.evidenceType).toBe('data');
});
```

- [ ] **Step 2: Run it — expect FAIL** (`addFinding` has no 6th param; `evidenceType` comes back `'data'` for both)

Run: `pnpm --filter @variscout/stores test -- analyzeStore.test.ts -t "evidence angle"`

- [ ] **Step 3: Implement** — extend the interface signature:

```ts
addFinding: (
  text: string,
  context: Finding['context'],
  source?: FindingSource,
  scopeId?: ProblemStatementScope['id'],
  originStepId?: string,
  evidenceType?: FindingEvidenceType
) => Finding;
```

and the impl (post-factory spread, mirroring the scopeId convention; import `FindingEvidenceType` type from `@variscout/core`):

```ts
addFinding: (text, context, source?, scopeId?, originStepId?, evidenceType?) => {
  const base = createFinding(/* unchanged positional args */);
  const finding = {
    ...base,
    ...(scopeId ? { scopeId } : {}),
    ...(originStepId ? { originStepId } : {}),
    ...(evidenceType ? { evidenceType } : {}),
  };
  set(state => ({ findings: [finding, ...state.findings] }));
  return finding;
},
```

- [ ] **Step 4: Run the test — PASS**; run the whole file: `pnpm --filter @variscout/stores test -- analyzeStore.test.ts`
- [ ] **Step 5: Commit** — `feat(stores): addFinding accepts an evidence angle (post-factory spread)`

### Task 2: `editFindingEvidenceType` action

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts` (next to `editFinding`, interface line ~88 + impl)
- Test: `packages/stores/src/__tests__/analyzeStore.test.ts`

- [ ] **Step 1: Failing test**

```ts
it('editFindingEvidenceType reclassifies an existing finding', () => {
  const store = useAnalyzeStore.getState();
  const f = store.addFinding('Buyer note on batch 7', { activeFilters: {}, cumulativeScope: null });
  useAnalyzeStore.getState().editFindingEvidenceType(f.id, 'expert');
  expect(useAnalyzeStore.getState().findings.find(x => x.id === f.id)?.evidenceType).toBe('expert');
});
```

- [ ] **Step 2: Run — FAIL** (action does not exist)
- [ ] **Step 3: Implement** — interface: `editFindingEvidenceType: (id: string, evidenceType: FindingEvidenceType) => void;` impl mirrors `editFinding`'s map-by-id pattern (read `editFinding` at the same file first and copy its shape exactly, including any `updatedAt`/persist behavior it has).
- [ ] **Step 4: Run — PASS** (full file)
- [ ] **Step 5: Commit** — `feat(stores): editFindingEvidenceType action`

### Task 3: `EvidenceAnglePicker` primitive

**Files:**

- Create: `packages/ui/src/components/EvidenceAnglePicker/EvidenceAnglePicker.tsx`
- Create: `packages/ui/src/components/EvidenceAnglePicker/index.ts` (`export { EvidenceAnglePicker } from './EvidenceAnglePicker'; export type { EvidenceAnglePickerProps } from './EvidenceAnglePicker';`)
- Modify: `packages/ui/src/index.ts` (add the barrel line next to the other component exports)
- Test: `packages/ui/src/components/EvidenceAnglePicker/__tests__/EvidenceAnglePicker.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceAnglePicker } from '../EvidenceAnglePicker';

it('renders three angles, marks the current one, and emits on change', () => {
  const onChange = vi.fn();
  render(<EvidenceAnglePicker value="data" onChange={onChange} />);
  const gemba = screen.getByRole('radio', { name: /gemba/i });
  expect(screen.getByRole('radio', { name: /data/i })).toBeChecked();
  fireEvent.click(gemba);
  expect(onChange).toHaveBeenCalledWith('gemba');
});
```

- [ ] **Step 2: Run — FAIL** · `pnpm --filter @variscout/ui test -- EvidenceAnglePicker`
- [ ] **Step 3: Implement** — a radiogroup of three pill buttons (semantic Tailwind classes per ui/CLAUDE.md; 50-300 surfaces, 400-700 text):

```tsx
import React from 'react';
import type { FindingEvidenceType } from '@variscout/core';

export interface EvidenceAnglePickerProps {
  value: FindingEvidenceType;
  onChange: (next: FindingEvidenceType) => void;
}

const ANGLES: Array<{ key: FindingEvidenceType; label: string; glyph: string }> = [
  { key: 'data', label: 'Data', glyph: '📊' },
  { key: 'gemba', label: 'Gemba', glyph: '👁' },
  { key: 'expert', label: 'Expert', glyph: '💬' },
];

export function EvidenceAnglePicker({
  value,
  onChange,
}: EvidenceAnglePickerProps): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label="Evidence angle" className="flex gap-1">
      {ANGLES.map(a => (
        <button
          key={a.key}
          type="button"
          role="radio"
          aria-checked={value === a.key}
          onClick={() => onChange(a.key)}
          className={
            value === a.key
              ? 'rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'
              : 'rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500'
          }
        >
          {a.glyph} {a.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run — PASS**; then `pnpm --filter @variscout/ui build` (tsc gate)
- [ ] **Step 5: Commit** — `feat(ui): EvidenceAnglePicker primitive`

### Task 4: CaptureCard integration

**Files:**

- Modify: `packages/hooks/src/captureDraft.ts` (`CaptureDraft` interface, line ~12: add `evidenceType: FindingEvidenceType;` — import the type from `@variscout/core`; set `'data'` in every draft constructor in this file — grep `entryKind:` to find them all)
- Modify: `packages/ui/src/components/CaptureCard/CaptureCard.tsx` (add the picker between the Note field and the buttons; extend `EditableDraftFields` to include `evidenceType`)
- Modify: the capture-flow call sites that turn a draft into `addFinding(...)` — grep `addFinding(` across `packages/hooks` + `apps/pwa/src` + `apps/azure/src`; thread `draft.evidenceType` as the new 6th arg. **List every site touched in the PR description.**
- Test: `packages/ui/src/components/CaptureCard/__tests__/CaptureCard.test.tsx`

- [ ] **Step 1: Failing test** — render `CaptureCard` with a draft (`evidenceType: 'data'`), assert the radiogroup renders and clicking Gemba calls `onDraftChange({ evidenceType: 'gemba' })`.
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement** — in `CaptureCard.tsx` after the Note label block:

```tsx
<div className="mt-4">
  <span className="block text-sm font-medium text-slate-700">Evidence angle</span>
  <div className="mt-1">
    <EvidenceAnglePicker
      value={draft.evidenceType}
      onChange={evidenceType => onDraftChange({ evidenceType })}
    />
  </div>
</div>
```

(`EditableDraftFields` becomes `Pick<CaptureDraft, 'note' | 'proposedFactorName' | 'evidenceType'>`.)

- [ ] **Step 4: Run CaptureCard tests + `pnpm --filter @variscout/hooks test` + both app builds** (`pnpm --filter @variscout/pwa build`, `pnpm --filter @variscout/azure-app build`) — the tsc pass across consumers IS the call-site completeness check.
- [ ] **Step 5: Commit** — `feat(capture): evidence-angle picker on the capture card, threaded to addFinding`

### Task 5: Findings-panel display + edit

**Files:**

- Modify: the findings-panel card component — locate via `grep -rn "FindingsPanelBase\|FindingCard" packages/ui/src/components/FindingsPanel* --include="*.tsx" | grep -v test` and read it first; add (a) a small angle glyph (📊/👁/💬) next to the source chip, (b) the `EvidenceAnglePicker` in the card's edit/expanded mode wired to `editFindingEvidenceType`.
- Test: the panel's existing test file (same directory `__tests__/`).

- [ ] **Step 1: Failing test** — a finding created with `evidenceType: 'gemba'` (via the `createFinding` factory + object spread, NOT a literal) renders the 👁 glyph; switching the picker in edit mode calls the store action (mock per the existing test file's store-mocking pattern — read it first and follow it exactly).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement** (follow the component's existing chip/label idioms)
- [ ] **Step 4: Run — PASS** + `pnpm --filter @variscout/ui build`
- [ ] **Step 5: Commit** — `feat(findings): evidence-angle glyph + reclassify on the findings panel`

### Task 6: The breadth rule fires — integration pin

**Files:**

- Test: `packages/core/src/survey/__tests__/wall.test.ts` (existing suite for `deriveHypothesisStatus`)

- [ ] **Step 1: Write the test that proves L-1's point** (this may already half-exist — extend, don't duplicate):

```ts
it('two angles + a survived attempt → evidence-survived-test; one angle only → evidenced', () => {
  const dataFinding = { ...createFinding('high on B', {}, null), evidenceType: 'data' as const };
  const gembaFinding = { ...createFinding('jig sticks', {}, null), evidenceType: 'gemba' as const };
  const h = {
    ...createHypothesis('Line B equipment difference'),
    findingIds: [dataFinding.id, gembaFinding.id],
    disconfirmationAttempts: [
      { id: 'a1', description: 'swap jig', verdict: 'survived', createdAt: 1 },
    ],
  };
  expect(deriveHypothesisStatus(h, [dataFinding, gembaFinding])).toBe('evidence-survived-test');

  const narrow = { ...h, findingIds: [dataFinding.id] };
  expect(deriveHypothesisStatus(narrow, [dataFinding])).toBe('needs-disconfirmation');
});
```

(Adapt factory names/shapes to the real ones in the existing test file — read it first; the assertion targets are the contract. **Negative control required**: the one-angle case must NOT reach `evidence-survived-test`.)

- [ ] **Step 2: Run — likely PASS already** (the rule pre-exists). If it passes untouched, keep it as the pinning test and note "pin, not change" in the commit message.
- [ ] **Step 3: Commit** — `test(core): pin the evidence-breadth rule L-1 makes reachable`

### Task 7: Open the PR

- [ ] `git push -u origin feat/l1-evidence-angle-picker`
- [ ] `gh pr create --title "feat(l1): evidence-angle picker — revive the FindingEvidenceType breadth rule" --body "<summary + the call-site list from Task 4 + 'Part of the demo-readiness master plan, L-1'>"`
- [ ] **STOP.** Do not merge. Reviewer (Claude) takes it from here.

## Controller verification (Claude, after PR opens)

- `bash scripts/pr-ready-check.sh` green.
- Chrome walk: brush-capture a finding → switch its angle to gemba on the capture card → capture a second data finding → link both to one suspected cause → record a survived break attempt → **the Verified suggestion chip appears** (the dead rule, alive). Then reclassify an angle on the findings panel and watch the chip retract.

## §Codex-prompt

The canonical first prompt for the Codex app is maintained in the master plan dispatch protocol; the live copy for L-1 is delivered in-session by the orchestrator.
