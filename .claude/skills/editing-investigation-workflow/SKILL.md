---
name: editing-investigation-workflow
description: Use when editing findings, SuspectedCause hubs, causal links, questions, or investigation spine. SuspectedCause hub model (ADR-064), CausalLink entity in investigationStore, three investigation threads (regression, hub UX, EDA heartbeat), FindingSource discriminated union narrowing (boxplot/pareto/ichart/yamazumi/coscout variants), question-linked findings pattern.
---

# Editing Investigation Workflow

## When this skill applies

Use this skill when editing findings, SuspectedCause hubs, causal links, questions, or
any component that is part of the investigation spine — the path from issue statement to
confirmed improvement. It applies equally to the Investigation workspace layout, the
FindingSource discriminated union, question linking, and hub-driven improvement flow.

---

## Core patterns

### SuspectedCause hub model (ADR-064)

A `SuspectedCause` is a first-class entity in `investigationStore`, not a tag on a question.
It names a mechanism, accumulates evidence from multiple questions and findings, computes
R²adj contribution, and drives exactly one HMW brainstorm session in the Improvement workspace.

```typescript
interface SuspectedCause {
  id: string;
  name: string;           // analyst names the mechanism ("nozzle wear on night shift")
  synthesis: string;      // max 500 chars explanation
  status: 'suspected' | 'confirmed' | 'not-confirmed';
  questionIds: string[];
  findingIds: string[];
  selectedForImprovement: boolean;
  evidence?: SuspectedCauseEvidence;  // R²adj contribution
  createdAt: number;
}
```

Multiple hubs coexist — one per independent variation mechanism. Each hub with
`selectedForImprovement: true` triggers one HMW brainstorm when the analyst moves to
the Improvement workspace. The old `causeRole: 'primary' | 'contributing'` tags on
questions are deprecated; do not add new code that writes them.

Hub projections are computed via `computeHubProjection()` from `@variscout/core/findings`:
- Standard mode: mean shift from level effects → projected Cpk
- Capability mode: Cpk impact per factor
- Yamazumi mode: waste elimination (seconds saved)
- Performance mode: channel Cpk improvement

The projection chain: Best Subsets → equation → level effects → hub R²adj contribution
→ What-If preset → projected outcome.

### CausalLink entity (ADR-065)

`CausalLink` lives in `investigationStore` — a directed edge in the factor DAG:

```typescript
interface CausalLink {
  id: string;
  fromFactor: string;
  toFactor: string;
  direction: 'drives' | 'modulates' | 'confounds';
  evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  whyStatement: string;
  questionIds: string[];
  findingIds: string[];
  hubId?: string;
}
```

Cycle prevention is mandatory before creating any new edge. Call `wouldCreateCycle()`
from `@variscout/core/stats` (`packages/core/src/stats/causalGraph.ts`) — do NOT inline
a custom check. The store's `addCausalLink` action calls it internally, but validate
early in any UI flow that constructs link proposals.

### Three investigation threads (ADR-066)

All three threads render in parallel in the Investigation workspace — they are not
sequential steps:

| Thread | Question | Engine |
|---|---|---|
| **Narrative** | What's the mechanism? | Analyst naming + CoScout |
| **Evidence** | How do we know? | Best Subsets R²adj + gemba + expert |
| **Projection** | What improves if we fix it? | Regression equation + What-If |

The Evidence Map (default center view, `investigationViewMode: 'map'`) is the
investigation board — a layered SVG showing all three threads spatially. Findings
list is the secondary view (`investigationViewMode: 'findings'`). Both views are
always available; the toggle is in `panelsStore.investigationViewMode`.

The PI Panel ↔ Evidence Map link is bidirectional:
- Map node click → sets `panelsStore.highlightedFactor` → PI Panel switches to Questions
  tab and scrolls to related questions.
- Answering a question → updates `exploredFactors` in `useEvidenceMapData` → unexplored
  factors render grey on the map.

The five-status finding lifecycle (observed → investigating → analyzed → improving →
resolved) maps to the PDCA cycle. PWA exposes only the first three statuses.

---

## FindingSource discriminated union

`FindingSource` is a discriminated union in `packages/core/src/findings/types.ts`.
The discriminant property is `chart`. Never access `category`, `anchorX`, `anchorY`,
`activityType`, or `messageId` without narrowing first.

```typescript
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number }
  | { chart: 'probability'; anchorX: number; anchorY: number; seriesKey?: string }
  | { chart: 'yamazumi'; category: string; activityType?: string }
  | { chart: 'coscout'; messageId: string };
```

Always narrow before accessing variant-specific fields:

```typescript
// Correct — use 'category' in src to distinguish category-bearing variants
if ('category' in src) {
  // src.chart is 'boxplot' | 'pareto' | 'yamazumi'
  console.log(src.category);
  if (src.chart === 'yamazumi' && src.activityType) {
    console.log(src.activityType);
  }
}

// Correct exhaustive switch
switch (src.chart) {
  case 'boxplot':
  case 'pareto':
    return renderCategorySource(src.category);
  case 'ichart':
    return renderPositionSource(src.anchorX, src.anchorY);
  case 'probability':
    return renderPositionSource(src.anchorX, src.anchorY, src.seriesKey);
  case 'yamazumi':
    return renderYamazumiSource(src.category, src.activityType);
  case 'coscout':
    return renderCoScoutSource(src.messageId);
  default: {
    const _never: never = src;
    throw new Error(`Unknown FindingSource chart: ${(_never as FindingSource).chart}`);
  }
}
```

The `probability` variant exists in production code but is not listed in the
ADR-015 original FindingSource table — it was added after. Any code that handles
finding sources must include it or TypeScript will emit an exhaustiveness error.

Breadcrumb-pinned findings (filter-state captures) have no `source` field. Chart
observations always have a `source`. Check `finding.source` before accessing it.

---

## Question linking

Observation-triggered question linking implements amended P5 (constitution principle 5,
"Questions drive investigation"). Three entry points:

1. **FRAME** — upfront hypotheses (now rendered as questions)
2. **SCOUT / INVESTIGATE** — Factor Intelligence evidence-ranked questions (deterministic,
   all tiers)
3. **INVESTIGATE** — observation-triggered via `QuestionLinkPrompt` (Apr 2026 delivery)

`QuestionLinkPrompt` in `packages/ui/src/components/FindingsLog/QuestionLinkPrompt.tsx`
appears after a finding is created without a linked question. It offers the analyst a
single-step nudge: "Which question does this answer?" Selecting a question calls
`investigationStore.getState().linkFindingToQuestion(findingId, questionId)`.

The `skipQuestionLinkPrompt` flag in `sessionStore` suppresses the prompt for the
remainder of the session when the analyst dismisses it. Do not call it a "nag" in
comments or UI strings — it is a "linking nudge."

Auto-link mechanism: when a finding is created while `investigationStore.focusedQuestionId`
is set, the finding is automatically linked to that question. No explicit "answer" button.
The question model is infrastructure, not a user-facing action per-se.

---

## Persistence

`suspectedCauses` and `causalLinks` persist via the document-level persist in
`useProjectActions` — fixed April 2026 after an audit found them missing from the
serialization path. Both are serialized in `.vrs` project files as top-level arrays
alongside `findings` and `questions`.

Do not add new investigation entities without updating the serialization path in:
- `apps/azure/src/hooks/useEditorDataFlow.ts` — data flow wiring
- The `.vrs` schema (IndexedDB `projects` table) in `apps/azure/src/db/schema.ts`

`sessionStore` auto-persists its own slice (including `skipQuestionLinkPrompt`) via
its own middleware. Do not manually persist session-scope flags.

---

## Gotchas

**1. Treating FindingSource as a single shape.**
`FindingSource` is a discriminated union with 5 variants. Accessing `.category` on
an unchecked `FindingSource` will fail at runtime for `ichart`, `probability`, and
`coscout` variants. Always narrow with `'category' in src` or an exhaustive switch.
Do not cast to `any` to avoid narrowing.

**2. Editing CausalLink in improvementStore.**
`CausalLink` belongs to `investigationStore`, not `improvementStore`. The improvement
domain store handles ideas, action items, and HMW sessions — not causal graph edges.
Importing or writing CausalLink actions against `improvementStore` will compile
(no type guard prevents it) but causes store inconsistency and persistence failures.

**3. Putting wouldCreateCycle in findings.**
`wouldCreateCycle` is in `@variscout/core/stats` (`packages/core/src/stats/causalGraph.ts`),
not in `@variscout/core/findings`. It is a graph utility, not a domain operation.
Import: `import { wouldCreateCycle } from '@variscout/core/stats'`.

**4. Using "root cause" in user-facing strings.**
Constitution principle P5 (amended Apr 16, 2026) prohibits "root cause" in any
user-facing label, tooltip, status, or CoScout message. VariScout quantifies
*contribution* (η²/R²adj), not causation. Use "suspected cause", "contribution",
or "mechanism" instead. "Root cause" may only appear in methodology references
that cite the pre-amendment MBB context.

**5. Creating hub-scoped improvement ideas on the question entity.**
`ImprovementIdea[]` was historically on `Hypothesis.ideas`. Post-reframing (ADR-064),
improvement ideas belong to `SuspectedCauseHub` entities, not to individual questions.
Writing `question.ideas` or `hypothesis.ideas` in new code creates orphaned data that
won't appear in the HMW brainstorm and won't survive hub deletion.

---

## Reference

| Source | Path |
|---|---|
| ADR-015: Investigation Board | `docs/07-decisions/adr-015-investigation-board.md` |
| ADR-020: Investigation Workflow | `docs/07-decisions/adr-020-investigation-workflow.md` |
| ADR-053: Question-Driven Investigation | `docs/07-decisions/adr-053-question-driven-investigation.md` |
| ADR-064: SuspectedCause Hub Model | `docs/07-decisions/adr-064-suspected-cause-hub-model.md` |
| ADR-065: Evidence Map & Causal Graph | `docs/07-decisions/adr-065-evidence-map-causal-graph.md` |
| ADR-066: Evidence Map as Investigation Center | `docs/07-decisions/adr-066-evidence-map-investigation-center.md` |
| Investigation Spine design spec | `docs/superpowers/specs/2026-04-04-investigation-spine-design.md` |
| Investigation Workspace Reframing | `docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md` |
| FindingSource union (live) | `packages/core/src/findings/types.ts` |
| investigationStore | `packages/stores/src/investigationStore.ts` |
| wouldCreateCycle | `packages/core/src/stats/causalGraph.ts` |
| QuestionLinkPrompt | `packages/ui/src/components/FindingsLog/QuestionLinkPrompt.tsx` |
