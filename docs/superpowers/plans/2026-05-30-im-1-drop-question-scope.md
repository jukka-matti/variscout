---
tier: ephemeral
purpose: build
title: 'IM-1 — Drop Question + ProblemStatementScope first-class (sub-plan)'
status: draft
date: 2026-05-30
layer: spec
---

# IM-1 — Drop `Question` + `ProblemStatementScope` first-class

> **For agentic workers:** Sub-plan for IM-1 of the [investigation-surface master plan](2026-05-29-investigation-surface-master-plan.md). Execute as **ONE atomic Opus dispatch** (Architect → Migration → Validator, per-category commits) — a tsc-wide breaking cascade (dropping the **required** `Hypothesis.questionIds`). Do NOT split (`feedback_atomic_sweep_one_dispatch`); **expect 2–3 cleanup loops** (`feedback_atomic_sweep_cleanup_loops`). Branch `im-1-entity-model` (off origin/main with IM-0a+IM-0b). Canonical: [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md), spec §3.

**Goal:** Retire `Question` as a tracked entity; make `ProblemStatementScope` first-class (the WHERE); retire `causeRole`. Re-home Question's three jobs. **`Question` has zero Dexie footprint** (session state + `.vrs`/blob JSON only) — `ProblemStatementScope` _replaces_ the `questions` slot in the serialized shape.

## Resolved design calls (from review 2026-05-30)

- **F2 — `ImprovementIdea` re-homes to `Hypothesis`** (ideas address the suspected cause). Re-key `addIdea`/`updateIdea`/`selectIdea`/`updateIdeaProjection` by `hypothesisId`; `Hypothesis` gains `ideas?: ImprovementIdea[]`; `Question.ideas` is dropped.
- **F3 — Question-generation becomes purely transient ranked nodes** (nothing persists). The `useQuestionGeneration` / `GeneratedQuestion` / `ai/suggestedQuestions` / `defect/questions` / `stats/channelQuestions` chain becomes view-derivation feeding ranked factor-node metadata; **no persisted generative artifact.**
- **F1 (my call) — hub factor identity** derives from `hub.condition` columns (`collectReferencedColumns`), falling back to linked findings' `context.activeFilters` keys when `condition` is absent.
- **F5 (my call) — `AnalysisBrief.questions` dropped** (Stage-5 modal no longer seeds Question entities).

---

## `ProblemStatementScope` construction

```ts
interface ProblemStatementScope extends EntityBase {
  investigationId: ProcessHubAnalyze['id'];
  outcome: string; // the Y this scope sharpens
  predicates: ConditionLeaf[]; // the {factor=level} WHERE (flat AND of drill-chip leaves)
  hypothesisIds: Hypothesis['id'][]; // the MANY causes nested per-scope
  gateNode?: GateNode; // per-scope contribution tree (re-homed from analyzeStore.problemContributionTree)
  whatIfProjection?: number; // optional 'if-fixed' overall impact (field only; computed in IM-5)
}
```

- **Persistence (matches the existing investigation-entity pattern):** add `scopes: ProblemStatementScope[]` to `analyzeStore` (+ `addScope`/`updateScope`/`removeScope`/`addHypothesisToScope`, in `loadAnalyzeState`/`resetAll`); add `SCOPE_ADD`/`SCOPE_UPDATE`/`SCOPE_ARCHIVE` HubAction kinds with **no-op Dexie cases** in both apps (mirror FINDING*\*/HYPOTHESIS*\*); serialize `scopes` into `SerializedInvestigationState` (both apps) **in the slot `questions` vacates**. No new Dexie table, no `migrateX`.
- **Net-new bridges** in `findings/hypothesisCondition.ts`: `buildConditionFromCategoricalFilters(filters): ConditionLeaf[]` (chips → leaves; `eq` single / `in` multi) + an `activeFilters: Record → ConditionLeaf[]` converter (range support not required here — equality membership only; the leaf shape covers it). Keep `Finding.context.activeFilters` as-is (snapshot); convert only at scope-capture.
- **Per-scope GateNode:** `gateNode` moves onto each scope; `composeGate` operates on `scope.gateNode` (path includes scopeId); `gateNodeOps.ts` unchanged.
- **Naming:** `ProblemCondition` (ai/types.ts — HOW-MUCH gap) + `ScopeFilter` (processHub.ts:204 — single-factor) stay DISTINCT; do NOT widen `ScopeFilter` (its full retirement is IM-4) — document the supersession only. Do NOT create a `SuspectedCause` type.

---

## Per-category commits (one dispatch)

### Architect (TDD-first, net-new — no breakage yet)

- `feat(core): ProblemStatementScope + buildConditionFromCategoricalFilters (IM-1)` — type + `createProblemStatementScope` factory + the two condition bridges + tests; `Hypothesis.ideas?` field added.
- `feat(stores): analyzeStore scopes slice + SCOPE_* actions (IM-1)` — slice + actions + store test.

### Migration (per-category, dependency-first)

- `refactor(core): drop Question entity + FKs; rehome hub-factor derivation (IM-1)` — delete `Question`/`QuestionStatus`/etc + the 6 FK fields (`Hypothesis.questionIds`/`checkQuestionIds`, `Finding.questionId`+`validationStatus`, `CausalLink.questionIds`, `AnalysisBrief.questions`); `factories.ts` (`createQuestion`/`createFactorFinding`→drop `question`; `createHypothesis` drops `questionIds`; `createCausalLink` drops `questionIds`); **`helpers.ts` `computeHubEvidence`/`computeHubProjection` factor re-derivation from `hub.condition` (F1) — judgment-heavy**; `evidenceMap/index.ts` drop `CausalEdgeData.questionCount`; `questionActions.ts` + `HubAction.ts` Question kinds deleted; `causeColors.ts`/`mechanismBranch.ts` recolor by `Hypothesis.status`; CoScout registry + prompts (`create_hypothesis`/`link_to_hypothesis` drop `questionIds`).
- `refactor(stores): drop questions slice + causeRole; per-scope GateNode (IM-1)` — `analyzeStore` Question/causal-question actions deleted; `problemContributionTree` → per-scope `gateNode`; `linkFindingToQuestion` etc removed.
- `refactor(hooks): generation→transient nodes; derive explored from hubs/findings (IM-1)` — `useEvidenceMapData` `explored` re-derivation (judgment) + `questionCount` drop; retire `useQuestions`/`useQuestionGeneration` persistence (F3 — output becomes ranked-node metadata, nothing persisted); ideas hooks re-keyed by `hypothesisId` (F2).
- `refactor(ui): remove Question-tree surfaces + Wall questions prop (IM-1)` — delete ~25 Question UI components (`FindingsLog` question bits, `QuestionTreeView`/`QuestionNode`/`QuestionPill`/`QuestionChecklist`/`QuestionsTabView`/`QuestionLinkPrompt`/`QuestionValidation`/`ReportQuestionSummary` etc); `WallCanvas` drop the `questions` prop + `QuestionPill` row + `onPromoteQuestion`/`onPromoteFromQuestion` (render hubs+findings only — NO dangling required prop; bipartite re-layout is IM-4); `IdeaGroupCard` re-key by hypothesis.
- `refactor(apps): drop QUESTION_* + questions serialization; add scopes (IM-1)` — both apps' `applyAction.ts` (delete QUESTION*\* no-op cases + exhaustiveness test entry; add SCOPE*\* no-op cases); `analyzeSerializer.ts` (azure) + PWA equiv (drop `questions`/`serializeQuestions`, drop `questionIds` from `serializeHypotheses`, drop `questionId` from `serializeFindings`, drop `causeRole`; **add `scopes`**); azure feature `analyzeStore`/`improvementStore` causeRole/Question display deleted.
- `chore(data): remove Question fixtures (IM-1)` + `chore(i18n): drop question-tree keys ×30 locales (IM-1)` — `SampleDataset.questions?` + `buildQuestions()` removed; delete the question-tree key block from `en.ts` + mirror across the 29 locales.
- `docs(im-1): apply-phase doc amendments` — `methodology.md` (drop-Question + "One Graph" 3→2 projections + drop the "Lean" bridge at :34), `eda-mental-model.md` (supersession banner + re-home map; remove Yamazumi-as-mode), `analyze-wall.md:19,70`, `mental-model-hierarchy.md:84,176`, **`packages/stores/CLAUDE.md`** (delete the stale "SuspectedCause is first-class (ADR-064)" + the `causeRole` legacy line).

### Validator

- `pnpm --filter @variscout/core --filter @variscout/stores --filter @variscout/hooks --filter @variscout/ui build` (tsc) + **app tsc BOTH apps** (`exec tsc --noEmit` — pr-ready-check misses app test-file tsc) + targeted vitest per touched package (<90 s each). No `--no-verify`. No full sweep.
- Grep-confirm: no `Question` type / `questionId(s)` FK / `causeRole` / `SuspectedCause` survives outside the explicit preservation set; `ProblemStatementScope` persisted round-trips in the blob.

---

## Acceptance

- `Question` entity + the 6 FK fields gone; `ProblemStatementScope` first-class (`predicates: ConditionLeaf[]` + per-scope `hypothesisIds`/`gateNode`), persisted via `analyzeStore` + `SCOPE_*` + blob serialization (replacing `questions`).
- `buildConditionFromCategoricalFilters` covers single + multi (`eq`/`in`); `causeRole` retired → `Hypothesis.status`/GateNode; `ImprovementIdea` on `Hypothesis`; generation transient (nothing persisted).
- Hub-factor derivation from `hub.condition` (F1); Wall renders hubs+findings with no `questions` prop (no dangling).
- `pnpm build` + app tsc (both) clean; touched-package vitest green; no `SuspectedCause`/`Question`/`causeRole` survivors.

## Out of scope (later PRs)

- **IM-4:** unified bipartite canvas + Focus lens + LOD + ACH toggle + disconfirmation-recording write-path (`HYPOTHESIS_RECORD_DISCONFIRMATION`); `ScopeFilter` full retirement.
- **IM-3:** auto-link engine. **IM-5:** the `whatIfProjection` computation (field only here).
