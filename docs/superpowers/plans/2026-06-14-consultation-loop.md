---
tier: ephemeral
purpose: build
title: 'Consultation loop — implementation plan'
status: active
date: 2026-06-14
layer: spec
implements:
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
---

# Consultation Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build V1's collaboration model — a closed Ask→Share→Respond→Distill→Accept loop where the analyst exports a question-carrying Consultation Pack, the expert answers via a script-free file, and proposed insights land in an analyst-controlled review queue with provenance.

**Architecture:** Four net-new nested entities (`Consultation` owns `ConsultationQuestion[]`/`ConsultationResponse[]`/`ProposedInsight[]`) in `packages/core/src/consultations/`, persisted via one `consultations[]` collection on `useAnalyzeStore` and the `.vrs` `DocumentSnapshot.analyze` facet. A reusable, framework-agnostic pack-renderer spine (`packages/core/src/packs/`) produces a single self-contained **script-free** HTML string (visx charts → inline SVG, print CSS, redaction levels) plus an editable Markdown response template. A deterministic, edit-tolerant importer maps the returned template/JSON to `ProposedInsight`s; accepting one creates an `evidenceType: 'expert'` Finding carrying consultation provenance. Transcript distillation reuses the CoScout structured-output path, sequenced last and provider-gated.

**Tech Stack:** TypeScript (pure `@variscout/core`), Zustand (`@variscout/stores`), React + visx + `react-dom/server` `renderToStaticMarkup` (pack render lives in `@variscout/ui`/app since it touches React), Vitest, Dexie (PWA persistence), build-time `@pwa-artifacts` alias gate.

---

## Slice overview (multi-PR off one branch; deterministic path first)

| Slice | PR                                               | Owner-model | Scope                                                                                                            | Detail level here  |
| ----- | ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| CL-1  | Domain + store + serialization                   | core/stores | Entities, factories, `Finding.provenance`, store collection + actions, `.vrs` round trip, PWA persistence wiring | **Full TDD steps** |
| CL-2  | Pack-renderer spine                              | ui/core     | `renderPackHtml` static no-JS render, inline SVG, redaction, print CSS                                           | Task outline       |
| CL-3  | Consultation variant + MD template + export gate | ui/pwa      | `PackModel` from `Consultation`, question cards, embedded + companion `.md` template, `@pwa-artifacts` gating    | Task outline       |
| CL-4  | Deterministic import + review queue              | core/ui     | Edit-tolerant parser, review-queue panel in Analyze, accept→expert Finding                                       | Task outline       |
| CL-5  | Ask entry + consultation builder                 | ui/pwa      | Contextual "Ask an expert" anchored action, builder panel, lifecycle wiring, chrome verify                       | Task outline       |
| CL-6  | Transcript distillation (AI-gated)               | core/hooks  | One-shot CoScout structured-output distill, no-op when provider `none`, mock-provider tests                      | Task outline       |

CL-2…CL-6 each get a full per-PR sub-plan (grounding → bite-sized steps) authored at execution time, once CL-1's exact types are merged. The outlines below fix their file maps, interfaces, and test intent so nothing is built that blocks a later slice.

---

## File structure (locked)

**New (CL-1):**

- `packages/core/src/consultations/types.ts` — `Consultation`, `ConsultationQuestion`, `ConsultationResponse`, `ProposedInsight`, `ConsultationProvenance`, status unions.
- `packages/core/src/consultations/factories.ts` — `createConsultation`, `createConsultationQuestion`, `createConsultationResponse`, `createProposedInsight`.
- `packages/core/src/consultations/index.ts` — barrel for the sub-path export.
- `packages/core/src/consultations/__tests__/factories.test.ts`
- `packages/stores/src/__tests__/consultationStore.test.ts`
- `packages/stores/src/__tests__/consultationSnapshot.test.ts`

**Modified (CL-1):**

- `packages/core/src/findings/types.ts` — add optional `provenance?: FindingProvenance` to `Finding` + the `FindingProvenance` type (NOT a `FindingSource` variant — see spec grounding note).
- `packages/core/package.json` (`exports`) + `packages/core/tsconfig.json` (`paths`) — add `./consultations` sub-path.
- `packages/stores/src/analyzeStore.ts` — `consultations: Consultation[]` on `AnalyzeState` + initial state + actions.
- `packages/stores/src/documentSnapshot.ts` — add `consultations` to `AnalyzeDocumentSnapshot`, `buildAnalyzeSnapshot()`, and `hydrateDocumentSnapshot()`.
- `apps/pwa/src/db/schema.ts` + `apps/pwa/src/hooks/usePasteImportFlow.ts` — persistence wiring for the new collection (per `packages/stores/CLAUDE.md` "new analyze entities" rule).

---

## CL-1 — Domain model + store + serialization

**Branch:** `feat/consultation-loop` (the shared arc branch; CL-1 is its first PR).

### Task 1: Consultation entity types

**Files:**

- Create: `packages/core/src/consultations/types.ts`
- Test: (types are exercised by Task 2's factory tests — no standalone test)

- [ ] **Step 1: Write the types**

```ts
import type { EntityBase } from '../identity';

export type ConsultationStatus = 'draft' | 'sent' | 'responses-imported' | 'closed';

export type ConsultationQuestionStatus = 'open' | 'answered';

export type ProposedInsightKind =
  | 'answer'
  | 'context'
  | 'new-hypothesis-proposal'
  | 'contradiction';

export type ProposedInsightStatus = 'pending' | 'accepted' | 'rejected';

export type ConsultationResponseSource = 'typed' | 'transcript';

/** What the recipient sees in the pack — a reference to an existing view. */
export interface ConsultationViewRef {
  kind: 'condition' | 'chart';
  /** Scope/condition id, or a chart slot key — resolved by the pack builder. */
  ref: string;
  label?: string;
}

/** Optional anchor tying a question to an existing investigation entity. */
export interface ConsultationAnchor {
  kind: 'finding' | 'hypothesis' | 'scope';
  id: string;
}

export interface ConsultationQuestion extends EntityBase {
  text: string;
  anchor?: ConsultationAnchor;
  status: ConsultationQuestionStatus;
}

export interface ConsultationResponse extends EntityBase {
  source: ConsultationResponseSource;
  /** Free text — NO identity management in V1. */
  respondentLabel: string;
  importedAt: number;
  /** Filename or hash of the imported artifact, for provenance. */
  rawArtifactRef?: string;
}

export interface ProposedInsight extends EntityBase {
  responseId: ConsultationResponse['id'];
  /** Maps to a question, or undefined when the insight arrived unanchored. */
  questionId?: ConsultationQuestion['id'];
  text: string;
  kind: ProposedInsightKind;
  status: ProposedInsightStatus;
  /** Set when accepted: the entity the analyst promoted this insight into. */
  acceptedAs?: { kind: 'finding' | 'hypothesis'; id: string };
}

export interface Consultation extends EntityBase {
  title: string;
  status: ConsultationStatus;
  updatedAt: number;
  viewSelection: ConsultationViewRef[];
  questions: ConsultationQuestion[];
  responses: ConsultationResponse[];
  proposedInsights: ProposedInsight[];
}
```

- [ ] **Step 2: Add the `FindingProvenance` type + `Finding.provenance` field**

In `packages/core/src/findings/types.ts`, add near `FindingEvidenceType` (line ~461):

```ts
/**
 * Origin provenance for a Finding created outside chart observation — e.g.
 * accepted from a consultation insight. Distinct from `FindingSource`, which
 * is documented chart-observation-only (do not extend it for this).
 */
export interface FindingProvenance {
  kind: 'consultation';
  consultationId: string;
  responseId: string;
  questionId?: string;
  respondentLabel: string;
  importedAt: number;
}
```

Add to the `Finding` interface (after `source?: FindingSource;` ~line 515):

```ts
  /** Provenance for findings promoted from external evidence (e.g. a
   *  consultation insight). Absent for chart-captured findings. */
  provenance?: FindingProvenance;
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/consultations/types.ts packages/core/src/findings/types.ts
git commit -m "feat(consultations): add Consultation entity types + Finding.provenance"
```

### Task 2: Factories

**Files:**

- Create: `packages/core/src/consultations/factories.ts`
- Create: `packages/core/src/consultations/index.ts`
- Test: `packages/core/src/consultations/__tests__/factories.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  createConsultation,
  createConsultationQuestion,
  createConsultationResponse,
  createProposedInsight,
} from '../factories';

describe('consultation factories', () => {
  it('creates a draft consultation with stable id + empty collections', () => {
    const c = createConsultation('Why does Line 3 drift on Mondays?');
    expect(c.id).toMatch(/[0-9a-f-]{36}/);
    expect(c.status).toBe('draft');
    expect(c.questions).toEqual([]);
    expect(c.responses).toEqual([]);
    expect(c.proposedInsights).toEqual([]);
    expect(c.deletedAt).toBeNull();
  });

  it('creates an open question carrying its anchor', () => {
    const q = createConsultationQuestion('Does Monday startup differ?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    expect(q.status).toBe('open');
    expect(q.anchor).toEqual({ kind: 'hypothesis', id: 'hyp-1' });
  });

  it('creates a typed response with importedAt set', () => {
    const r = createConsultationResponse('typed', 'J. Operator', 'resp.md');
    expect(r.source).toBe('typed');
    expect(r.respondentLabel).toBe('J. Operator');
    expect(r.rawArtifactRef).toBe('resp.md');
    expect(typeof r.importedAt).toBe('number');
  });

  it('creates a pending insight mapped to a question + response', () => {
    const i = createProposedInsight('resp-1', 'Cold oven on Mondays.', 'answer', 'q-1');
    expect(i.status).toBe('pending');
    expect(i.responseId).toBe('resp-1');
    expect(i.questionId).toBe('q-1');
    expect(i.kind).toBe('answer');
    expect(i.acceptedAs).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- consultations/__tests__/factories.test.ts`
Expected: FAIL — cannot resolve `../factories`.

- [ ] **Step 3: Write the factories**

```ts
import { generateDeterministicId, type EntityBase } from '../identity';
import type {
  Consultation,
  ConsultationAnchor,
  ConsultationQuestion,
  ConsultationResponse,
  ConsultationResponseSource,
  ProposedInsight,
  ProposedInsightKind,
} from './types';

function base(): EntityBase {
  return { id: generateDeterministicId(), createdAt: Date.now(), deletedAt: null };
}

export function createConsultation(title: string): Consultation {
  const now = Date.now();
  return {
    ...base(),
    title,
    status: 'draft',
    updatedAt: now,
    viewSelection: [],
    questions: [],
    responses: [],
    proposedInsights: [],
  };
}

export function createConsultationQuestion(
  text: string,
  anchor?: ConsultationAnchor
): ConsultationQuestion {
  return { ...base(), text, status: 'open', ...(anchor ? { anchor } : {}) };
}

export function createConsultationResponse(
  source: ConsultationResponseSource,
  respondentLabel: string,
  rawArtifactRef?: string
): ConsultationResponse {
  return {
    ...base(),
    source,
    respondentLabel,
    importedAt: Date.now(),
    ...(rawArtifactRef ? { rawArtifactRef } : {}),
  };
}

export function createProposedInsight(
  responseId: string,
  text: string,
  kind: ProposedInsightKind,
  questionId?: string
): ProposedInsight {
  return {
    ...base(),
    responseId,
    text,
    kind,
    status: 'pending',
    ...(questionId ? { questionId } : {}),
  };
}
```

Note: `Date.now()` is allowed here (not `Math.random`); `generateDeterministicId()` is the authoritative id generator (`packages/core/src/identity.ts`).

- [ ] **Step 4: Write the barrel**

```ts
// packages/core/src/consultations/index.ts
export * from './types';
export * from './factories';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- consultations/__tests__/factories.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/consultations/
git commit -m "feat(consultations): factories + barrel"
```

### Task 3: Export the `./consultations` sub-path

**Files:**

- Modify: `packages/core/package.json` (`exports`)
- Modify: `packages/core/tsconfig.json` (`paths`)

- [ ] **Step 1: Add the export** — mirror an existing entry (e.g. `./findings`) in both files. In `package.json#exports`:

```json
    "./consultations": {
      "types": "./src/consultations/index.ts",
      "import": "./src/consultations/index.ts"
    },
```

(Match the exact shape of the adjacent `./findings` entry — copy its `types`/`import`/`default` keys verbatim, only swapping the path.)

In `tsconfig.json#compilerOptions.paths`:

```json
      "@variscout/core/consultations": ["./src/consultations/index.ts"],
```

- [ ] **Step 2: Verify resolution**

Run: `pnpm --filter @variscout/core build`
Expected: PASS — no `TS2307` for `@variscout/core/consultations`.

- [ ] **Step 3: Commit**

```bash
git add packages/core/package.json packages/core/tsconfig.json
git commit -m "feat(consultations): export ./consultations sub-path"
```

### Task 4: Store collection + actions

**Files:**

- Modify: `packages/stores/src/analyzeStore.ts`
- Test: `packages/stores/src/__tests__/consultationStore.test.ts`

- [ ] **Step 1: Write the failing test** (Zustand pattern: reset to initial state in `beforeEach`, per `packages/stores/CLAUDE.md` testing section)

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';

describe('analyzeStore — consultations', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
  });

  it('creates a draft consultation', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);
    expect(c.status).toBe('draft');
  });

  it('adds a question to a consultation', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().addConsultationQuestion(c.id, 'Why Mondays?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    const updated = useAnalyzeStore.getState().consultations[0];
    expect(updated.questions).toHaveLength(1);
    expect(updated.questions[0].anchor).toEqual({ kind: 'hypothesis', id: 'hyp-1' });
  });

  it('importResponse attaches a response + pending insights without mutating findings', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Cold oven Mondays.', kind: 'answer' }],
    });
    const updated = useAnalyzeStore.getState().consultations[0];
    expect(updated.status).toBe('responses-imported');
    expect(updated.responses).toHaveLength(1);
    expect(updated.proposedInsights).toHaveLength(1);
    expect(updated.proposedInsights[0].status).toBe('pending');
    // No canonical mutation:
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });

  it('acceptInsight creates an expert Finding with consultation provenance', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Cold oven Mondays.', kind: 'answer' }],
    });
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    const finding = useAnalyzeStore.getState().acceptInsight(c.id, insight.id);
    expect(finding.evidenceType).toBe('expert');
    expect(finding.provenance).toMatchObject({
      kind: 'consultation',
      consultationId: c.id,
      respondentLabel: 'J. Operator',
    });
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
    const updatedInsight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    expect(updatedInsight.status).toBe('accepted');
    expect(updatedInsight.acceptedAs).toEqual({ kind: 'finding', id: finding.id });
  });

  it('rejectInsight marks rejected and creates no Finding', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Noise.', kind: 'context' }],
    });
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    useAnalyzeStore.getState().rejectInsight(c.id, insight.id);
    expect(useAnalyzeStore.getState().consultations[0].proposedInsights[0].status).toBe('rejected');
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/stores test -- consultationStore.test.ts`
Expected: FAIL — `createConsultation is not a function`.

- [ ] **Step 3: Add state + actions to `analyzeStore.ts`**

Imports (extend the existing `@variscout/core/...` imports):

```ts
import {
  createConsultation,
  createConsultationQuestion,
  createConsultationResponse,
  createProposedInsight,
  type Consultation,
  type ConsultationAnchor,
  type ProposedInsightKind,
} from '@variscout/core/consultations';
import { createFinding } from '@variscout/core/findings';
```

Add to `AnalyzeState` (near `findings`/`hypotheses`, ~line 82):

```ts
  consultations: Consultation[];
```

Add to `initialState`: `consultations: [],`.

Add to the actions interface + implementation:

```ts
// --- interface (AnalyzeActions) ---
  createConsultation: (title: string) => Consultation;
  addConsultationQuestion: (
    consultationId: string,
    text: string,
    anchor?: ConsultationAnchor
  ) => void;
  importResponse: (
    consultationId: string,
    input: {
      source: 'typed' | 'transcript';
      respondentLabel: string;
      rawArtifactRef?: string;
      insights: Array<{ text: string; kind: ProposedInsightKind; questionId?: string }>;
    }
  ) => void;
  acceptInsight: (consultationId: string, insightId: string) => Finding;
  rejectInsight: (consultationId: string, insightId: string) => void;

// --- implementation (in the create<>() body) ---
  createConsultation: title => {
    const consultation = createConsultation(title);
    set(state => ({ consultations: [consultation, ...state.consultations] }));
    return consultation;
  },

  addConsultationQuestion: (consultationId, text, anchor) => {
    const question = createConsultationQuestion(text, anchor);
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? { ...c, questions: [...c.questions, question], updatedAt: Date.now() }
          : c
      ),
    }));
  },

  importResponse: (consultationId, input) => {
    const response = createConsultationResponse(
      input.source,
      input.respondentLabel,
      input.rawArtifactRef
    );
    const insights = input.insights.map(i =>
      createProposedInsight(response.id, i.text, i.kind, i.questionId)
    );
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              status: 'responses-imported',
              responses: [...c.responses, response],
              proposedInsights: [...c.proposedInsights, ...insights],
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },

  acceptInsight: (consultationId, insightId) => {
    const consultation = get().consultations.find(c => c.id === consultationId);
    const insight = consultation?.proposedInsights.find(i => i.id === insightId);
    if (!consultation || !insight) {
      throw new Error(`acceptInsight: insight ${insightId} not found`);
    }
    const response = consultation.responses.find(r => r.id === insight.responseId);
    const base = createFinding(insight.text, {}, null);
    const finding: Finding = {
      ...base,
      evidenceType: 'expert',
      provenance: {
        kind: 'consultation',
        consultationId,
        responseId: insight.responseId,
        ...(insight.questionId ? { questionId: insight.questionId } : {}),
        respondentLabel: response?.respondentLabel ?? '',
        importedAt: response?.importedAt ?? Date.now(),
      },
    };
    set(state => ({
      findings: [finding, ...state.findings],
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              proposedInsights: c.proposedInsights.map(i =>
                i.id === insightId
                  ? { ...i, status: 'accepted', acceptedAs: { kind: 'finding', id: finding.id } }
                  : i
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
    return finding;
  },

  rejectInsight: (consultationId, insightId) => {
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === consultationId
          ? {
              ...c,
              proposedInsights: c.proposedInsights.map(i =>
                i.id === insightId ? { ...i, status: 'rejected' } : i
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },
```

(`createFinding`'s positional signature is `(text, activeFilters, cumulativeScope, stats?, status?, source?)` — `packages/core/src/findings/factories.ts:32`. We pass `({}, null)` for filters/scope since this finding is consultation-sourced, not chart-captured, then override `evidenceType` + `provenance` post-factory, exactly as `addFinding` overrides post-factory at `analyzeStore.ts:439`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/stores test -- consultationStore.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/analyzeStore.ts packages/stores/src/__tests__/consultationStore.test.ts
git commit -m "feat(consultations): analyzeStore collection + accept/reject actions"
```

### Task 5: `.vrs` serialization round trip

**Files:**

- Modify: `packages/stores/src/documentSnapshot.ts`
- Test: `packages/stores/src/__tests__/consultationSnapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';
import { buildDocumentSnapshot, hydrateDocumentSnapshot } from '../documentSnapshot';

describe('documentSnapshot — consultations round trip', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
  });

  it('serializes + rehydrates consultations through the analyze facet', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().addConsultationQuestion(c.id, 'Why Mondays?');
    const snapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    expect(snapshot.analyze.consultations).toHaveLength(1);
    expect(snapshot.analyze.consultations[0].questions).toHaveLength(1);

    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
    expect(useAnalyzeStore.getState().consultations).toHaveLength(0);

    hydrateDocumentSnapshot(snapshot);
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);
    expect(useAnalyzeStore.getState().consultations[0].title).toBe('Line 3 drift');
  });

  it('hydrates legacy snapshots without a consultations field (back-compat)', () => {
    const snapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    // Simulate a pre-CL-1 snapshot:
    delete (snapshot.analyze as { consultations?: unknown }).consultations;
    expect(() => hydrateDocumentSnapshot(snapshot)).not.toThrow();
    expect(useAnalyzeStore.getState().consultations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/stores test -- consultationSnapshot.test.ts`
Expected: FAIL — `snapshot.analyze.consultations` is `undefined`.

- [ ] **Step 3: Wire the facet**

In `packages/stores/src/documentSnapshot.ts`:

1. Add to `AnalyzeDocumentSnapshot` (line ~20) and import `Consultation`:

```ts
import type {} from /* …existing… */ '@variscout/core';
import type { Consultation } from '@variscout/core/consultations';

export interface AnalyzeDocumentSnapshot {
  findings: Finding[];
  categories: AnalyzeCategory[];
  hypotheses: Hypothesis[];
  causalLinks: CausalLink[];
  scopes: ProblemStatementScope[];
  consultations: Consultation[];
}
```

2. Add to `buildAnalyzeSnapshot()` (line ~100):

```ts
    scopes: state.scopes,
    consultations: state.consultations,
```

3. Add to `hydrateDocumentSnapshot()` (the `useAnalyzeStore.setState({...})` near line ~249) — **back-compat default** so legacy `.vrs` files without the field still load (validation is deliberately shallow per ADR-091, so guard here):

```ts
    causalLinks: cloneJson(snapshot.analyze.causalLinks),
    scopes: cloneJson(snapshot.analyze.scopes),
    consultations: cloneJson(snapshot.analyze.consultations ?? []),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/stores test -- consultationSnapshot.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/documentSnapshot.ts packages/stores/src/__tests__/consultationSnapshot.test.ts
git commit -m "feat(consultations): serialize consultations in the .vrs analyze facet"
```

### Task 6: PWA persistence wiring

**Files:**

- Modify: `apps/pwa/src/db/schema.ts`
- Modify: `apps/pwa/src/hooks/usePasteImportFlow.ts`

- [ ] **Step 1: Ground the existing pattern**

Read how `findings`/`hypotheses` flow through `apps/pwa/src/db/schema.ts` and `usePasteImportFlow.ts` (the `packages/stores/CLAUDE.md` "new analyze entities also need" rule). Mirror exactly for `consultations`: if the analyze collections are persisted as one snapshot blob, no schema change beyond confirming the snapshot carries the field (Task 5 already does); if collections are stored per-table, add a `consultations` table/load/save symmetric to `findings`.

- [ ] **Step 2: Apply the mirrored wiring** (exact edits depend on Step 1's finding — the persisted shape is a single `DocumentSnapshot` blob vs. per-collection tables).

- [ ] **Step 3: Verify**

Run: `pnpm --filter @variscout/azure-app build` (apps' build tsconfig covers test files — per `project_d4_app_convergence` lesson) and `pnpm --filter @variscout/stores test`.
Expected: PASS / no tsc errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/db/schema.ts apps/pwa/src/hooks/usePasteImportFlow.ts
git commit -m "feat(consultations): persist consultations through PWA import/save flow"
```

### CL-1 done-criteria

- `pnpm --filter @variscout/core test` and `pnpm --filter @variscout/stores test` green.
- `bash scripts/pr-ready-check.sh` green.
- Round-trip test proves consultations survive `.vrs` save/load; back-compat test proves legacy snapshots load.
- A test proves `acceptInsight` is the ONLY path that creates a Finding (no canonical mutation on import) and that the Finding carries `evidenceType: 'expert'` + consultation provenance.

---

## CL-2 — Pack-renderer spine (task outline)

**Goal:** A pure render function producing a single self-contained, **script-free** HTML string.

**Files:** `packages/ui/src/packs/renderPackHtml.tsx` (+ chart→SVG helper), `packages/ui/src/packs/__tests__/renderPackHtml.test.tsx`. (Lives in `@variscout/ui`, not `core` — it touches React/visx; `core` must stay pure TS per `packages/core/CLAUDE.md`.)

**Interface:**

```ts
type RedactionLevel = 'no-raw-rows' | 'include-raw-rows';
interface PackModel {
  title: string;
  meta: { packId: string; consultationId?: string; from?: string };
  sections: PackSection[]; // condition cards, chart cards, question cards
  responseTemplateMarkdown?: string;
}
function renderPackHtml(model: PackModel, options: { redaction: RedactionLevel }): string;
```

**Approach:** `renderToStaticMarkup` over a pack React tree. visx charts render to inline SVG at explicit fixed width/height (bypassing `withResponsiveSize`/ResizeObserver). Inline `<style>` incl. print stylesheet. Embedded data goes in `<script type="application/json">` (inert data, not executable). NO `<script>` with JS.

**Tests (intent):** output contains no `<script>` tag with executable type; output contains no `http(s)://` URLs (no network); charts present as inline `<svg>`; `no-raw-rows` excludes raw row data; snapshot of a minimal pack for layout stability.

---

## CL-3 — Consultation variant + Markdown template + export gate (task outline)

**Goal:** Build a `PackModel` from a `Consultation` and wire the gated export.

**Files:** `packages/ui/src/packs/buildConsultationPack.ts` (+ test), `apps/pwa/src/artifacts/paidArtifacts.ts` (add `exportConsultationPack`), `apps/pwa/src/artifacts/freeArtifacts.ts` (throwing stub), `apps/pwa/src/types/artifacts.d.ts` (signature).

**Interface:**

```ts
function buildConsultationPack(input: {
  consultation: Consultation;
  views: ResolvedView[]; // resolved charts/conditions for viewSelection
  from?: string;
}): PackModel;
function buildResponseTemplateMarkdown(consultation: Consultation): string;
// paidArtifacts:
export function exportConsultationPack(opts: { consultation; views; appVersion }): void;
```

**Markdown template shape (stable anchors):**

```
## Consultation <packId> — responses
respondent: <your name>
### Q1 [id: <questionId>]
> (type your answer here)
```

**Tests (intent):** every question renders a card + a template section; template anchor ids === question ids (round-trip key); `exportConsultationPack` is reachable only behind `__WORKSPACE_ARTIFACTS__` (free stub throws); companion `.md` blob produced alongside HTML.

---

## CL-4 — Deterministic import + review queue (task outline)

**Goal:** Parse a returned filled template / `.json` into a `ConsultationResponse` + `ProposedInsight`s (edit-tolerant), and surface the analyst review queue.

**Files:** `packages/core/src/consultations/parseResponse.ts` (+ test — pure parser belongs in core), `packages/ui/src/consultations/ConsultationReviewPanel.tsx` (+ test), wired into the Analyze tab alongside `FindingsPanel`.

**Interface:**

```ts
interface ParsedResponse {
  respondentLabel: string;
  insights: Array<{ questionId?: string; text: string; kind: ProposedInsightKind }>;
}
function parseMarkdownResponse(raw: string, consultation: Consultation): ParsedResponse; // edit-tolerant
function parseJsonResponse(raw: string, consultation: Consultation): ParsedResponse; // schema-validated
```

**Tests (intent):** anchors map answers to the right `questionId` even with reordered/edited sections; missing/garbled template → readable thrown error (not silent); pasted-text tolerance (whitespace, stray prose); a test proves `parse*` produces only `pending` insights and never touches `findings`. Review-queue panel: per-insight accept/reject/edit, anchored entity label visible, accept calls `acceptInsight` → expert Finding.

---

## CL-5 — Ask entry + consultation builder (task outline)

**Goal:** Let the analyst start a consultation from context and assemble/export it.

**Files:** an "Ask an expert" action on Finding/Hypothesis/condition surfaces (anchor pre-filled), `apps/pwa/src/components/consultations/ConsultationBuilder.tsx` (+ test), lifecycle wiring (`markSent` on export — add the action in CL-1's store if cheap, else here).

**Tests (intent):** "Ask an expert" on a hypothesis seeds a question with that anchor; builder collects title + views + questions; exporting flips `draft → sent`; importing flips `sent → responses-imported`. **Chrome verify** the full round trip: export a pack, hand-fill the template, import it, accept an insight, confirm an `expert` Finding appears linked with provenance.

---

## CL-6 — Transcript distillation, AI-gated (task outline, sequenced LAST)

**Goal:** A one-shot CoScout structured-output call distilling a transcript into `ProposedInsight`s, dormant when no provider is configured.

**Files:** `packages/core/src/ai/distillation.ts` (+ schema in `packages/core/src/ai/schemas.ts`), wired into the import flow as the `transcript` source.

**Interface:**

```ts
interface DistillInput {
  config?: ResponsesApiConfig; // undefined ⇒ provider 'none' ⇒ no-op
  transcript: string;
  questions: Array<{ id: string; text: string }>;
}
async function distillTranscriptToInsights(
  input: DistillInput
): Promise<Array<{ questionId?: string; text: string; kind: ProposedInsightKind }>>;
```

**Approach:** reuse `assembleCoScoutPrompt()` tier-1 (glossary/role) for terminology, then `sendResponsesTurn` with `text.format` = a `proposedInsightSchema` (json_schema) — no tool loop. When `config` is undefined, return `[]` (no-op) so the deterministic path is unaffected.

**Tests (intent):** with a mock `ResponsesApiConfig`, a transcript yields insights mapped to question ids; with `config: undefined`, returns `[]` and makes no call; a test proves distillation output is `pending` proposals only (no canonical mutation). Note in code + PR: dormant until BYOK/tenant wiring (CoScout `ai: false` in every channel today).

---

## Cross-cutting verification (per slice)

- `bash scripts/pr-ready-check.sh` green before review.
- Adversarial subagent code review per slice (lean loop: one reviewer/slice). Watch specifically for: tests that pass against stub/over-mocked code (the recurring "green tests masked a real bug" pattern from ER/D4); any path that mutates canonical findings/hypotheses without an explicit accept; any `<script>` leaking into pack output.
- One worktree per PR (`.worktrees/<branch>/`); main session stays at repo root.
- `gh pr merge --merge --delete-branch` (preserve per-commit history).
