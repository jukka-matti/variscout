---
tier: ephemeral
purpose: build
title: 'IM-1 Resume State — layer-pipeline checkpoint'
status: draft
date: 2026-05-30
layer: spec
---

# IM-1 RESUME STATE (2026-05-30) — read this first on resume

> Inbound link: referenced from [the IM-1 sub-plan](2026-05-30-im-1-drop-question-scope.md) + [the master plan](2026-05-29-investigation-surface-master-plan.md). Ephemeral execution checkpoint; delete when IM-1 merges.

## Where we are

- **Worktree:** `/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.claude/worktrees/im-0a-project-hub-1to1`
- **Branch:** `im-1-entity-model` · **HEAD:** `099fd7f6` · clean tree
- ✅ core (`29f801e7`) + stores (`099fd7f6`) are both src-tsc-clean. (An earlier note here claimed 2 stores tsc errors — that was a mis-read during an I/O glitch; the only 2 errors are the PRE-EXISTING `import.meta.env.VITE_OPENAI_PROXY_URL` artifacts in `core/src/ai/prompts/{narration,legacy}.ts`, present on origin/main, tolerated by the turbo `pnpm build`. NOT IM-1-introduced; do not chase them.)
- **Also exists:** read-only planning worktree at `.claude/worktrees/planning` (detached @ origin/main) — safe to remove later.

## Merged to origin/main already

- Design phase (spec + ADRs 085–089 + master plan + decision-log)
- **IM-0a** Project↔Hub 1:1 — PR #243
- **IM-0b** step-model reconciliation — PR #244

## IM-1 progress (atomic cascade, drop Question + ProblemStatementScope) — IN PROGRESS on branch

Done + committed (both src tsc-CLEAN; test files NOT yet updated):

- `29f801e7` **core** layer — Question entity + 6 FK fields dropped; ProblemStatementScope + scopeActions(SCOPE_ADD/UPDATE/ARCHIVE) + buildConditionFromCategoricalFilters + activeFiltersToCondition; hub-factor re-derivation (F1, `deriveHubFactors`); Hypothesis.ideas (F2).
- `099fd7f6` **stores** layer — analyzeStore questions slice dropped; scopes slice added; problemContributionTree → per-scope gateNode; ideas re-keyed by hypothesisId. src tsc-clean.

## IM-1 REMAINING LAYERS (do these, layer-by-layer, COMMIT each — never run >~20min uncommitted)

Drive each as a focused Sonnet dispatch (or inline). After each: `pnpm --filter @variscout/<pkg> exec tsc --noEmit 2>&1 | grep 'error TS' | grep -vE '__tests__|\.test\.'` must be 0, then commit. Sub-plan = `docs/superpowers/plans/2026-05-30-im-1-drop-question-scope.md`.

1. **hooks** (~42 files) — `useEvidenceMapData` (explored re-derive from hubs/findings; drop questionCount); retire `useQuestions`/`useQuestionGeneration`/`useQuestionReactivity` persistence (F3: generation → transient ranked-node metadata, nothing persisted); ideas hooks re-key by hypothesisId. Commit `refactor(hooks): ... (IM-1)`.
2. **ui** (~91 files) — delete ~25 Question-tree components (QuestionTreeView/QuestionNode/QuestionPill/QuestionChecklist/QuestionsTabView/QuestionLinkPrompt/QuestionValidation/ReportQuestionSummary etc); WallCanvas DROP `questions` prop + QuestionPill row + onPromoteQuestion/onPromoteFromQuestion (render hubs+findings only, NO dangling required prop; bipartite layout is IM-4); IdeaGroupCard re-key by hypothesis; FindingsLog/ProcessIntelligencePanel question surfaces. Commit `refactor(ui): ... (IM-1)`.
3. **apps** azure(43)+pwa(12) — applyAction.ts: delete QUESTION*\* no-op cases + exhaustiveness test entry; ADD SCOPE*\* no-op cases; analyzeSerializer (azure) + PWA equiv: drop `questions`/serializeQuestions, drop questionIds from serializeHypotheses, drop questionId from serializeFindings, drop causeRole, **ADD `scopes`**; azure feature analyzeStore/improvementStore causeRole/Question display deleted; both apps evidenceMap.questionCount. Commit `refactor(apps): ... (IM-1)`.
4. **data** (4) — `SampleDataset.questions` + `buildQuestions()` removed. Commit `chore(data): ... (IM-1)`.
5. **i18n** (~33) — delete question-tree key block from en.ts + mirror 29 locales + i18n/types.ts. Commit `chore(i18n): ... (IM-1)`.
6. **TEST layer** — ~166 core test errors + downstream test files referencing old shapes. Update to new model (scopes, no questionIds, ideas on hypothesis). Commit `test(im-1): ... `.
7. **docs(im-1) apply-phase** — methodology.md (drop-Question + One-Graph 3→2 + drop "Lean" bridge at :34), eda-mental-model.md (supersession banner + remove Yamazumi-as-mode), analyze-wall.md:19,70, mental-model-hierarchy.md:84,176, **packages/stores/CLAUDE.md (delete stale "SuspectedCause is first-class (ADR-064)" + causeRole legacy lines)**. Commit `docs(im-1): ...`.
8. **KNOWN RESIDUAL** to clean somewhere in 1–3: `ai/investigationContext` + CoScout prompt copy (legacy.ts/registry/modes/phases/context) still say "Question"/questionIds/causeRole; `glossary/terms.ts` "Question" term; cosmetic name-only `questionId?` params in `variation/progress.ts:17`, `causeColors.ts:17`, `ai/knowledgeAdapter.ts:30` (compile fine — rename to hypothesisId for cleanliness; recolor causeColors by Hypothesis.status).

## IM-1 GATE (after all layers green)

- `pnpm --filter @variscout/core --filter @variscout/stores --filter @variscout/hooks --filter @variscout/ui build` + **app tsc BOTH apps** (`pnpm --filter @variscout/azure-app exec tsc --noEmit` + pwa — pr-ready-check MISSES app test-file tsc, the IM-0a/0b lesson) + `bash scripts/pr-ready-check.sh` green.
- Opus review (adversarial). Then push branch → `gh pr create` → `gh pr merge --merge --delete-branch`.

## AFTER IM-1 — wave schedule (from planning workflow wnihykui3; full output at /private/tmp/.../tasks/wnihykui3.output)

- **Wave 1 (parallel, separate worktrees):** IM-2 (measurementPlan core), IM-5 (Dashboard+charts contribution), IM-7 (IPDetail/ProjectsTabView — Cluster A, independent), IM-0b-2 (ProcessMapBase→canvasStore authoring relocation). Disjoint subtrees.
- **Wave 2:** IM-3 (auto-link; needs IM-2).
- **Wave 3 (SERIALIZE — both touch Canvas/index + canvasStore):** IM-4 (needs IM-3) then IM-6 (needs IM-5). NOT concurrent.
- Land IM-0b-2 early to clear canvasStore before IM-4/IM-6. IM-7 mergeable any time.
- Forks already resolved for IM-7 (invite=immediate-add + durable collaboratedAt; reconcile two signoff surfaces to one canonical) — see planning output im7 section. IM-0b-2 grounding in im0b2 section.

## METHOD UPGRADE (user asked 2026-05-30)

- Atomic cascades (IM-1 type) are correctly ONE concern but TOO BIG for one dispatch → drive as **layer pipeline, commit each layer**. NEVER let an agent run ~1hr uncommitted.
- Only ONE agent may write a given package at a time (had a stores race — fixed by TaskStop).
- Use Workflow for per-PR pipelines + conflict-free wave parallelism (Wave 1 above) + adversarial verify panels for high-stakes PRs.
