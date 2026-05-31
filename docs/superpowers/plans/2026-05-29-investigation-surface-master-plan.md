---
tier: ephemeral
purpose: build
title: 'Investigation Surface — Master Plan (PR sequencer)'
status: draft
date: 2026-05-29
layer: spec
---

# Investigation Surface — Master Plan (PR sequencer)

> **For agentic workers:** This is a **master sequencer** at PR granularity, not a task-level plan. Per `feedback_master_plan_for_multi_subsystem_specs`, each PR (IM-0a…IM-7) gets its own bite-sized sub-plan authored via `superpowers:writing-plans` **at execution time** (one worktree per PR), then executed via `superpowers:subagent-driven-development`. Do not expand this into 5000 lines of 2–5-min steps up front — plan-as-you-execute.

**Goal:** Deliver the unified investigation surface — scope-vs-cause entity model, one bipartite canvas, level-native contribution, Measurement-Plan-as-DCP, and the Project=collaboration closure model — graduated from the 2026-05-29 design.

**Spec:** [`2026-05-29-investigation-surface-design.md`](../specs/2026-05-29-investigation-surface-design.md) · **ADRs:** [085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md)–[089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md).

**Architecture:** ~70% of the substrate is built; the work is reconciliation + re-projection + a handful of net-new engines (auto-link, What-If drill-binding, bipartite canvas, invite marker). Three foundational PRs run first — **IM-0a** (Project↔Hub 1:1 collapse) → **IM-0b** (step-model reconciliation), sequential, ∥ **IM-1** (entity model, a different subsystem); the rest layer on top.

**Tech Stack:** TypeScript monorepo (pnpm + turbo), `@variscout/{core,stores,hooks,charts,ui}` + `apps/{azure,pwa}`, Zustand, Dexie/IDB, Vitest.

---

## §0 · How to read this plan

Each PR below states: **Goal · ADR · Depends on · Key files (grounded) · Cascade size · Suggested model · Worktree · Apply-phase docs (§13) · Acceptance · Sub-plan note.** At execution time, for each PR:

1. `superpowers:using-git-worktrees` → fresh `.worktrees/<branch>` (every parallel writer owns its own checkout — `feedback_one_worktree_per_agent`).
2. `superpowers:writing-plans` → the PR's bite-sized sub-plan (TDD steps).
3. `superpowers:subagent-driven-development` → fresh implementer per task + per-task spec+quality reviewer + final Opus branch review.
4. The PR's **Apply-phase doc amendments** (from spec §13) land **in the same PR** as the code they describe.
5. `bash scripts/pr-ready-check.sh` green → `gh pr merge --merge --delete-branch` (per-commit history — `feedback_preserve_commit_history`).

**Invariants every PR is bound by** (spec §1): WHERE≠WHY · contribution-not-causation (no "root cause") · distribution-not-aggregation (ADR-073) · Cp/Cpk only (ADR-084) · no Lean/SS labels · prefer-pragmatic. ESLint enforces the contribution + interaction-language rules; the architecture tripwire (`architecture.noCrossInvestigationAggregation.test.ts`) + `scripts/check-level-boundaries.sh` enforce aggregation/level boundaries.

---

## §1 · Dependency graph

**Prereq IM-0a** — Project↔Hub 1:1 collapse (retire `improvementProjects[]` / `projectsByHub`, re-key by `ProjectId`; decision-log 2026-05-18) — runs first, then the two foundations below (IM-0b step-model ∥ IM-1 entity-model).

```
        ┌──────────────────────────────┐        ┌──────────────────────────────┐
        │ IM-0b step-model reconcile    │        │ IM-1  drop-Question +         │
        │       (prereq, ADR-087)       │        │       ProblemStatementScope   │
        │                               │        │       (atomic, ADR-085)       │
        └───────────────┬───────────────┘        └───────┬───────────────┬───────┘
                        │                                 │               │
                        │            ┌────────────────────┘               │
                        ▼            ▼                                     ▼
                ┌───────────────────────────┐                  ┌──────────────────────────┐
                │ IM-2  Measurement-Plan=DCP │                  │ IM-4  unified canvas +     │
                │       (ADR-085/087)        │                  │       disconfirmation UX   │
                └─────────────┬──────────────┘                  │       (ADR-086)            │
                              ▼                                  └──────────────────────────┘
                ┌───────────────────────────┐
                │ IM-3  auto-link + re-load  │
                │       cascade              │
                └───────────────────────────┘

        ┌──────────────────────────────┐        ┌──────────────────────────────┐
        │ IM-5  level-native contrib +  │  ───▶  │ IM-6  retire mode/lens axis + │
        │       per-chart binding       │        │       Values⇄Capability       │
        │       (ADR-088; needs IM-0+1) │        │       (ADR-089)               │
        └──────────────────────────────┘        └──────────────────────────────┘

        ┌──────────────────────────────┐
        │ IM-7  Cluster A: invite       │   (orthogonal — no hard deps)
        │       predicate + closure     │
        └──────────────────────────────┘
```

**Suggested order:** `IM-0a → IM-0b` (data-model prereqs, sequential) ∥ `IM-1` (entity model) → review gate on the reconciled foundation → `IM-2 → IM-3`, `IM-4`, `IM-5 → IM-6`, `IM-7` (IM-4/IM-5/IM-7 parallelizable once the prereqs + IM-1 land). **Cap each PR at ~6–8 tasks** (`feedback_slice_size_cap`); the atomic IM-1 is the explicit carve-out (one bigger Opus dispatch, not split).

---

## IM-0a · Project ↔ Hub 1:1 collapse (PREREQ)

**Sub-plan:** [`2026-05-29-im-0a-project-hub-1to1.md`](2026-05-29-im-0a-project-hub-1to1.md)

- **Goal:** Enforce the decided **one Project = one Hub (1:1)** model; retire the legacy 1:many machinery; re-key project-scoped state by `ProjectId`. Keep Hub + IP as two entities at a clean 1:1 (SRP — spec §1).
- **Decision source:** decision-log 2026-05-18 (already committed; this PR executes it).
- **Depends on:** none. **Gates:** clarifies ownership for IM-0b; backs the §1 terminology.
- **Key files (grounded):** `packages/core/src/processHub.ts:154` (`improvementProjects: ImprovementProject[]` — retire), `packages/stores/src/improvementProjectStore.ts:8` (`projectsByHub: Record<hubId, ImprovementProject[]>` — re-key by `ProjectId`), `packages/core/src/improvementProject/types.ts:124` (`hubId` back-ref — keep, now 1:1), `apps/{azure,pwa}/src/db/schema.ts` (IDB version bump, no `migrateX`).
- **Cascade:** bounded — `improvementProjects[]` + `projectsByHub` consumers + the store re-key + IDB bump. No data migration (wedge: no users). Do **not** merge Hub into IP (future domain-consolidation, not V1 — spec §1).
- **Suggested model:** **Sonnet** (well-bounded cardinality cleanup) + Opus review.
- **Worktree:** `.worktrees/im-0a-project-hub-1to1`.
- **Apply-phase docs:** confirm `packages/stores/CLAUDE.md` describes the re-keyed (`ProjectId`) state; spec §1 + decision-log already state the 1:1 model.
- **Acceptance:** one Hub holds exactly one IP (type + runtime); project-scoped state keyed by `ProjectId`; no `improvementProjects[]` / `projectsByHub` survives; `pnpm build` + vitest green.
- **Sub-plan note:** migrate every `projectsByHub` reader to the `ProjectId` key; check `.vrs` export/import + report aggregation (`ipReport.ts`) which iterate `hub.improvementProjects`.

## IM-0b · Process-step model reconciliation (PREREQ)

**Sub-plan:** [`2026-05-30-im-0b-step-model.md`](2026-05-30-im-0b-step-model.md)

- **Goal:** Make the rich `ProcessMap` the single canonical step structure; `IP.processSteps` becomes a derived read-only projection; one step-id scheme (retarget the column-drop gesture onto the rich map); wire `onFactorControlAdd`; establish the canonical node-id for the IM-2 `processLocation` join. **Authoring-relocation (ctq / tributaries / capabilityScope off the deprecated `ProcessMapBase`) split to IM-0b-2** — it gates nothing downstream (grounding 2026-05-30).
- **ADR:** [087](../../07-decisions/adr-087-process-step-model-reconciliation.md).
- **Depends on:** IM-0a (runs after the 1:1 collapse — ownership is then unambiguous). **Gates:** IM-2, IM-5 (and the `processLocation` join everywhere).
- **Key files (grounded):** `packages/core/src/frame/types.ts` (ProcessMap :109 / ProcessMapNode :29), `packages/core/src/ai/types.ts:142` (ProcessContext.processMap), `packages/core/src/improvementProject/types.ts:25,:52,:161,:166` (ProcessStepEntry + flat list + contradictory comments), `packages/stores/src/canvasStore.ts:13,:146` (canonicalMap + id minting), `packages/ui/.../ProcessZone/extractStepsFromCategoricalColumn.ts:23` (rival id scheme), `packages/core/src/frame/stepColumns.ts:40` + `findings/hypothesisCondition.ts:160` (read-only join — leave unchanged), `apps/{azure,pwa}/src/db/schema.ts` (IDB bump).
- **Cascade:** ~9 flat-model files + ~6 `ProcessStepEntry` consumers + tests; rich-map (~53 files) stays canonical, untouched. IDB **schema-version bump, no `migrateX()`** (wedge stance) — pre-launch orphaning of old flat `stepId`s is acceptable and stated.
- **Suggested model:** **Opus** (multi-file integration, ID-scheme + IDB judgment, prereq).
- **Worktree:** `.worktrees/im-0-step-model`.
- **Apply-phase docs:** resolve the `improvementProject/types.ts:52` vs `:166` comment contradiction → "stepId references a canonical `ProcessMap` node id."
- **Acceptance:** flat `processSteps` reads resolve through the projection; one id scheme (rival `step-${columnName}-${idx}` retired; column-drop retargeted onto the rich map); `onFactorControlAdd` wired (the `MeasurementPlan.processLocation` field itself ships in IM-2); `getStepColumnAssignments` unchanged + green; per-step `capabilityScope` intact (no cross-step roll-up — ADR-073 tripwire green); `pnpm build` + per-package vitest green.
- **Sub-plan note:** verify no reader depends on the column-name embedded in the old `step-${columnName}-${idx}` id (the join derives column overlap, not from the id — adr-087 tension).

## IM-1 · Drop `Question` + `ProblemStatementScope` first-class (ATOMIC)

**Sub-plan:** [`2026-05-30-im-1-drop-question-scope.md`](2026-05-30-im-1-drop-question-scope.md) · resolved forks: ideas→Hypothesis, generation→transient.

- **Goal:** Delete `Question` as a tracked entity; introduce `ProblemStatementScope` (the WHERE = `ConditionLeaf[]`); retire `causeRole`; re-home Question's three jobs.
- **ADR:** [085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md).
- **Depends on:** none. **Gates:** IM-2, IM-4, IM-5.
- **Key files (grounded):** `packages/core/src/findings/types.ts` (Question :342, causeRole :380, Hypothesis.questionIds :740 **required**, checkQuestionIds :764, Finding.questionId :578, CausalLink.questionIds :798, AnalysisBrief.questions :861, FindingContext.activeFilters :514), `hypothesisCondition.ts:14-41,:60` (leaf shape + capture bridge), `processHub.ts:203` (ScopeFilter — widen or supersede), `ai/types.ts:31` (ProblemCondition — keep distinct), `problemStatement.ts:66`, `analysisScopeStore.ts:14` (chips → net-new `buildConditionFromCategoricalFilters`). Non-code: `packages/data` fixtures, i18n keys, `.vrs` serialization, CoScout tool registry.
- **Cascade:** ~550 non-test `Question` occurrences / ~153 files (740/211 incl tests) — **tsc-wide breaking change** (questionIds is required on the central Hypothesis type). causeRole ~92 / 34 files.
- **Suggested model:** **Opus, ONE atomic dispatch** with internal **Architect → Migration → Validator** phases + per-category commits (`feedback_atomic_sweep_one_dispatch`). Do NOT split into 6–8 sub-tasks. Expect 2–3 cleanup-dispatch loops (`feedback_atomic_sweep_cleanup_loops`).
- **Worktree:** `.worktrees/im-1-entity-model`.
- **Apply-phase docs (§13):** `methodology.md:340` (3→2 projections, drop SuspectedCause/Question), `eda-mental-model.md` (supersession banner + re-home map), `analyze-wall.md:19,:70`, `mental-model-hierarchy.md:84,:176`, `packages/stores/CLAUDE.md` (delete the stale "SuspectedCause is first-class" line), `methodology.md:34` ("apply Lean" → "apply further investigation").
- **Acceptance:** `Question` type gone; `ProblemStatementScope` persisted with `ConditionLeaf[]` predicates + `hypothesisIds[]`; `buildConditionFromCategoricalFilters` covers ranges; causeRole→status/GateNode; `pnpm build` + all package vitest green; no `Question`/`SuspectedCause` symbol survives outside the explicit preservation set.
- **Sub-plan note:** the scope model is **per-scope** (decided) — each `ProblemStatementScope` owns its `hypothesisIds[]` + `GateNode`; the global `problemContributionTree` is re-homed as per-scope trees. Coordinate the `WallCanvas.questions` prop redefinition jointly with IM-4 (do not leave a dangling required prop).

## IM-2 · Measurement-Plan-as-DCP fields

- **Goal:** Extend `MeasurementPlan` to the DCP shape: `outcome`, `primaryFactor` (renamed from `factor`), `neededFactors[]`, `scope` (`ConditionLeaf[]`), `processLocation`, `opDef?`, `msaNote?`; drop `msaRequired`.
- **ADR:** 085 (scope) + 087 (processLocation).
- **Depends on:** IM-0 (`processLocation` resolves) + IM-1 (`ConditionLeaf` scope encoding).
- **Key files (grounded):** `packages/core/src/measurementPlan/{types.ts:15,actions.ts}`, `packages/ui/.../AnalyzeWall/{AddPlanForm.tsx:34,124-134,HypothesisCardWithPlans.tsx,WallCanvas.tsx:53-78}`, `apps/{azure,pwa}/src/persistence/applyAction.ts` + `db/schema.ts` (IDB bump, no migration).
- **Cascade:** small/additive + form changes; PWA stores `MeasurementPlanRow` (row-mapping check) — Azure stores the type directly.
- **Suggested model:** **Sonnet** (well-specified field additions to a fully-wired primitive) + Opus review.
- **Apply-phase docs:** new L3 `measurement-plan-dcp.md` (full field list; `neededFactors[]` plural; `processLocation` join; op-def/MSA optional notes, not gates).
- **Acceptance:** new fields persist round-trip in both apps; `msaRequired` checkbox removed; no randomized-order field; `factor`→`primaryFactor` migration; vitest green.

## IM-3 · Auto-link engine + re-load cascade

- **Goal:** Re-ingest → detect new column → generate Finding → match by factor (column overlap) → link to Plan → progress status; define append (preserve + rematch) vs replace (re-evaluate) cascade.
- **ADR:** spec §7 (no dedicated ADR; engine work).
- **Depends on:** IM-2 (`processLocation` + Plan fields).
- **Key files (grounded):** `apps/azure/.../useEditorDataFlow.ts:785,794` + `apps/pwa/.../usePasteImportFlow.ts` (`mergeRows`/`mergeColumns`), `findings/hypothesisCondition.ts:160` + `frame/stepColumns.ts:40` (column-overlap match), `measurementPlan/actions.ts` (LINK_FINDING + status progression), HubRepository dispatch.
- **Cascade:** net-new engine; mutation cascade in both apps' data-flow hooks.
- **Suggested model:** **Opus** (cascade semantics, judgment-heavy, two-app symmetry).
- **Acceptance:** re-ingesting a dataset with a new stratifier column auto-creates+links a Finding to the matching Plan and progresses its status; append rematches; replace re-evaluates (no silent orphan); vitest green.

## IM-4 · Unified bipartite canvas + disconfirmation-recording UX

> **Detailed design (grounded, 2026-05-30):** [Investigation Wall — unified canvas](../specs/2026-05-30-investigation-wall-unified-canvas-design.md) reframes this as the **Investigation Wall** (drill→Finding→compound-scope→hypotheses), splits delivery into **IM-4a** (wire the spine) + **IM-4b** (unify + multiplicity + collaborate), drops the ACH matrix, keeps scopes flat for V1, and adds hypothesis collaboration (comments + assignable tasks). It supersedes the raw bullet below where they differ.
>
> **Delivery (actual):** **IM-4a** (spine wiring) shipped PR #256; **IM-4b** (collaboration + multi-scope rail + re-mounted detached flows) shipped PR #257 — it sub-sliced per §8.102, deferring the layout/Focus half. The remainder is **IM-4c** — [unified Wall layout + Focus lens + propose-hypothesis-from-finding plan](2026-05-31-im-4c-unified-wall-layout-focus-lens.md) (single Opus implementer per the IM-4b TDD-pipeline trial verdict). Note: the spec §8.6 "unified bipartite layout" = contributing-factors band + hypothesis river in ONE Wall coordinate space (the Evidence Map stays the SEPARATE cross-scope overview); §121 confirms the spec refines ADR-086 here.

- **Goal:** One bipartite factor↔hypothesis canvas (Focus lens + factor-family LOD + edge bundling + ACH toggle + `ruledOut` flag); build the disconfirmation-recording write-path.
- **ADR:** [086](../../07-decisions/adr-086-unified-investigation-canvas.md).
- **Depends on:** IM-1 (Finding+Hypothesis+CausalLink graph; coordinate the `WallCanvas.questions` prop redefinition).
- **Key files (grounded):** `packages/charts/src/EvidenceMap/{EvidenceMapBase.tsx:23,FactorNode.tsx,types.ts:31}`, `packages/ui/.../AnalyzeWall/WallCanvas.tsx:80`, `packages/ui/.../Canvas/internal/{LocalMechanismView.tsx,CanvasWallOverlay.tsx}`, `packages/hooks/.../useEvidenceMapData` (new bipartite x/y layout), `packages/core/src/findings/hypothesisEvidence.ts:14-30` + `survey/wall.ts:24` (disconfirmation derivation — wired), new `HYPOTHESIS_RECORD_DISCONFIRMATION` HubAction, `setHubStatus` (wire or delete — §11).
- **Cascade:** largest net-new UI build (bipartite re-layout + Focus-lens dimming + LOD coarsening + edge bundling + ACH toggle + disconfirmation write-path). `CrossTypeEvidenceMap` fate decided here (§11).
- **Suggested model:** **Opus** (multi-file UI integration, net-new layout/interaction). May split into 2 PRs (IM-4a canvas layout + lens; IM-4b disconfirmation UX) if >8 tasks.
- **Apply-phase docs:** new L3 `evidence-map.md` (muuttuja kartta; disambiguate the two Evidence Maps).
- **Acceptance:** factors-left ↔ hypotheses-right with typed support/refute links (refute loud); Focus lens dims by contribution×distance; zoom-out clusters factor families (hypotheses stay individual); `ruledOut` distinct from weak; recording a disconfirmation attempt writes `disconfirmationAttempts[]` and flips status per the gate; mobile focus-only; vitest green.

## IM-5 · Level-native contribution + per-chart measure binding

- **Goal:** `ProcessLevel` (Y/X/x) mapped onto `CanvasLevel`; the What-If-anchored cumulative-variation bar (reinterpreted §3.3 — no multiplied-η² chain) + optional coverage %; wire What-If (`computeCumulativeProjection`) to the live drill chip; per-chart measure binding for outcome+decomposition.
- **ADR:** [088](../../07-decisions/adr-088-level-native-contribution.md) + 089 (per-chart binding).
- **Depends on:** IM-0 (step-local level) + IM-1 (scope).
- **Key files (grounded):** `packages/core/src/canvas/viewport.ts:1` (CanvasLevel), `stats/{anova.ts:25,factorEffects.ts:121,bestSubsets.ts:497,subgroupCapability.ts}`, `variation/{projection.ts:110,simulation.ts:285}` (reuse — do not rebuild), `apps/azure/src/components/Dashboard.tsx:216,:465-478` (shared-Y → per-chart binding), `improvementProject/types.ts:45` (outcomeGoals[].stepId), `frame/types.ts` (ProcessMapNode.ctqColumn).
- **Cascade:** additive (no SS-share primitive to delete, no multiplied chain to build) + judgment-heavy Dashboard integration. **Nothing is multiplied across levels** — the cross-level anchor reuses the existing What-If projection + optional coverage %; native shares stay level-local (spec §5.3). Guarded by ADR-073 tripwire + `check-level-boundaries.sh`.
- **Suggested model:** **Opus** (stats correctness + Dashboard multi-file integration + aggregation-guard review).
- **Apply-phase docs:** `eda-mental-model.md §3.3` banding reference stays canonical.
- **Acceptance:** cumulative-variation bar (blue<30/amber/green>50) driven by the What-If projection / coverage %, within one homogeneous outcome, with **no multiplied-η² chain**; What-If bound to drill chip; I-Chart=outcome / Boxplot=per-step-measures renders (part-whole only — two unrelated Ys rejected); aggregation tripwire + level-boundary checks green; vitest green.

## IM-6 · Retire mode/lens user-axis + Values⇄Capability

- **Goal:** Remove the mode/lens user pickers; keep `AnalysisMode` as a Frame-derived discriminant; present Values⇄Capability as the one specs-gated view.
- **ADR:** [089](../../07-decisions/adr-089-retire-mode-lens-user-axis.md).
- **Depends on:** IM-5 (per-chart binding overlap).
- **Key files (grounded):** `packages/core/src/types.ts:334` (AnalysisMode — RETAIN), `analysisStrategy.ts:6,:85` (ResolvedMode/resolveMode — keep), `stats/subgroupCapability.ts:73` (StandardIChartMetric), `ui-types/index.ts:80`, `CapabilityMetricToggle` (ADR-038). **Do not touch** `processState.ts:10` (ProcessStateLens) or TimeLens.
- **Cascade:** doc/UX reframe — **NOT a tsc-wide rename** (~45 files reference AnalysisMode; type retained). Only user-facing pickers removed.
- **Suggested model:** **Sonnet** (well-bounded reframe + view consolidation) + Opus review.
- **Apply-phase docs:** `mental-model-hierarchy.md:120-128` (highest-priority mode-reframe; remove Yamazumi-as-mode), `methodology.md:312-326`, **ADR-038 amendment** (capability is a view, Pp/Ppk gone), `analysis/subgroup-capability.md:22` (drop stray Pp/Ppk — drift-now, may land earlier).
- **Acceptance:** no mode/lens picker in the UI; `AnalysisMode` type + `resolveMode`/`getStrategy` intact; Values⇄Capability toggle works (Cp/Cpk only); `ProcessStateLens`/`TimeLens` untouched; vitest green.

## IM-7 · Cluster A — invite predicate + optional/non-blocking closure

- **Goal:** Introduce the durable `collaboratedAt` marker (invite = the trigger); make closure signoff optional, non-blocking, hidden-solo, Azure-only, decoupled from `processOwner`; reconcile the two signoff surfaces; author the #37 solo-investigation journey.
- **ADR:** spec §9 (no dedicated ADR; covered by the wedge ADR-082 lineage).
- **Depends on:** none (orthogonal).
- **Key files (grounded):** `packages/core/src/improvementProject/types.ts:15,:117-135` (status + signoff), `projectMembership/canAccess.ts:24-30` (ACL — keep member===sponsor), `packages/ui/.../IPDetail/{IPDetailTeamRail.tsx:118-120,IPDetailPage.tsx:127-145}`, `apps/{azure,pwa}/src/components/ProjectsTabView.tsx:155-176` (signoff wiring — PWA removal/gating), `control.ts` + `controlHandoffActions.ts:37` (reconcile the two signoff surfaces — §11), `tier.ts` (isPaidTier already deleted — build on the new predicate).
- **Cascade:** small (~6 signoff-prop surfaces + the marker); a durable `collaboratedAt` set on first invite (immediate-add membership) — **not** a derived `members.length>1` (which would flip back to solo if a member is removed).
- **Suggested model:** **Sonnet** (bounded) — escalate to Opus if the two-signoff reconciliation proves judgment-heavy.
- **Apply-phase docs:** `ia-nav-model.md:51-52,:81` (sign-off-gate → optional affordance; drop Charter-ceremony framing), `personas/sponsor.md:19,51,58` + `lead.md:55` (de-gatekeeper), `positioning.md` (Sustainment→Control laggard), `control.md` (retitle "Control Phase"), new L2 #37 solo-investigation journey.
- **Acceptance:** solo (un-shared) IPs never show signoff; collaborative (invited) Projects show optional non-blocking signoff decoupled from processOwner; `collaboratedAt` gates the Azure surfaces; one canonical signoff surface; Sponsor stays an identity label; vitest green.

---

## §2 · Self-review

**Spec coverage:** §2 spine → IM-1/IM-2; §3 entity model → IM-1; §4 canvas → IM-4; §5 contribution → IM-5; §6 surfaces → IM-6 (+IM-5 binding); §7 loop/DCP → IM-2/IM-3; §1 Project↔Hub 1:1 → IM-0a; §8 step-model → IM-0b; §9 Cluster A → IM-7; §10 trust → enforced across (soft caveats, no gate); §11 open questions → pinned in IM-1/IM-4/IM-7 sub-plans; §13 propagation → each PR's Apply-phase row. **No spec section is unmapped.**

**Placeholder scan:** none — every PR has grounded file refs + acceptance. Per-PR TDD steps are intentionally deferred to sub-plans (master-plan pattern), not placeholders.

**Type consistency:** `ProblemStatementScope` (IM-1) is consumed by IM-2 (`scope`) + IM-4 (graph) + IM-5; `processLocation` (IM-0) consumed by IM-2/IM-3; `ProcessLevel` (IM-5) consumed by IM-6. Names match across PRs.

---

## §3 · Plan-ready gate

Build **halts here** for the user's ADR review (per the agreed stopping point) before IM-0a/IM-0b/IM-1 are dispatched. On approval: create the prereq worktrees (IM-0a → IM-0b, ∥ IM-1), author their sub-plans, and execute subagent-driven.
