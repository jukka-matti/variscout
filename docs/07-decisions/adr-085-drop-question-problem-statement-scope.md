---
title: 'ADR-085: Drop Question as a tracked entity; Problem-Statement scope first-class'
status: active
date: 2026-05-29
purpose: decide
tier: living
audience: both
topic: [investigation, findings, methodology, wedge-v1]
related:
  - adr-086-unified-investigation-canvas
  - adr-087-process-step-model-reconciliation
  - adr-088-level-native-contribution
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - 2026-05-29-investigation-surface-design
  - 2026-04-19-investigation-wall-design
layer: L5
last-verified: 2026-05-29
---

# ADR-085: Drop Question as a tracked entity; Problem-Statement scope first-class

**Status:** Accepted
**Date:** 2026-05-29

## Context

The Clusters A/B/C investigation-surface design (2026-05-29, [spec](../superpowers/specs/2026-05-29-investigation-surface-design.md)) settled the V1 investigation spine. Two of its decisions touch the core findings type system directly: the role of `Question`, and how the investigation's **WHERE** (the slice of the process under examination) is persisted.

Today `Question` is a first-class tracked entity (`packages/core/src/findings/types.ts:342`) carrying three overloaded jobs: it is **generative** (a prompt to go look at a factor), **completeness-tracking** (have we examined this factor yet?), and **interpretive** (what did we conclude?). It also carries a `causeRole?` field (`types.ts:380`, `'suspected-cause' | 'contributing' | 'ruled-out'`) that tries to encode a cause's standing on the question itself. `Question` is wired deep: `questionIds` is a **required** field on the central `Hypothesis` type (`types.ts:740`), plus `checkQuestionIds?` (`types.ts:764`), `AnalysisBrief.questions` (`types.ts:861`), `Finding.questionId` (`types.ts:578`), and `CausalLink.questionIds` (`types.ts:798`).

Separately, the investigation's **WHERE** has no persisted first-class home. It lives in two transient shapes:

- `FindingContext.activeFilters: Record<string, (string | number)[]>` (`types.ts:514`) — a single-value-set-per-column map that can only express equality membership.
- `analysisScopeStore.categoricalFilters` (`CategoricalFilter[]`, `packages/stores/src/analysisScopeStore.ts:14`) — the transient Process↔Explore bridge.

Neither expresses a compound predicate. The richer leaf+gate shape that _can_ — `hypothesisCondition` (`packages/core/src/findings/hypothesisCondition.ts:14-41`, supporting `eq/neq/lt/gt/between/in`) — exists today only as a cause's own claim, with an evaluator (`hypothesisConditionEvaluator.ts`) and a scope-capture bridge `deriveConditionFromFindingSource()` (`hypothesisCondition.ts:60`).

Two names are already taken and must not be silently overloaded:

- **`ProblemCondition`** (`packages/core/src/ai/types.ts:31`) is the metric/target **HOW-MUCH gap** (`currentValue` vs `targetValue`) — _not_ the WHERE.
- **`ScopeFilter`** (`packages/core/src/processHub.ts:203`) is **single-factor only** (`{ factor, values }`) — it cannot hold a compound condition.

There is also a stale claim in `packages/stores/CLAUDE.md` that "`SuspectedCause` is a first-class entity (ADR-064)." No such type exists; the first-class cause IS `Hypothesis`.

## Decision

**1. Drop `Question` as a tracked entity.** Its three jobs re-home: _generative_ → Factor Intelligence (ranked factor nodes); _completeness_ → un-examined-factor nodes on the Evidence Map; _interpretive_ → `Finding` / `Hypothesis`. The Investigation Wall (Findings + Hypotheses) is the centerpiece; questions were a layer of indirection the Wall already subsumes.

**2. Make the Problem-Statement scope first-class.** Introduce a new persisted type `ProblemStatementScope` = the **WHERE**: an outcome (Y) plus a set of `{factor=level}` predicates encoded as `ConditionLeaf[]`. **Reuse the existing `hypothesisCondition` leaf shape** — it expresses `eq/neq/lt/gt/between/in`, which the `Record<col, values[]>` `activeFilters` map cannot. A net-new builder `buildConditionFromCategoricalFilters()` (does not exist yet) converts the transient `CategoricalFilter[]` chips into a compound condition at scope-capture time.

**3. Many Suspected Causes nest WITHIN one scope (the WHY).** A `ProblemStatementScope` references its causes via `hypothesisIds[]`. `Hypothesis.condition` is **retained** only as the cause's own disconfirmable HOLDS-claim — the mechanism's testable assertion — **never** to re-assert the scope's WHERE. WHERE (scope) and WHY (causes nested within it) stay strictly separate.

**4. Retire the `causeRole` taxonomy.** `'suspected-cause' | 'contributing' | 'ruled-out'` collapses onto `Hypothesis.status` (`proposed | evidenced | confirmed | refuted | needs-disconfirmation`) plus `GateNode` membership in the contribution tree. A cause's standing is its status, not a label on a question.

**5. Do not create a `SuspectedCause` type.** It never existed. The first-class cause is `Hypothesis`. Correct the stale `packages/stores/CLAUDE.md` claim.

## Rationale

- **Questions were an indirection the Wall already does better.** The Wall surfaces Findings (what we saw) and Hypotheses (what we suspect and are testing). A separate `Question` entity duplicated the "what to look at" job that ranked factor nodes do generatively, and the "what's left" job that un-examined-factor nodes do for completeness. Three jobs split across the right three homes beats one entity wearing three hats.
- **The scope deserves a type because the product reasons about it.** Drill-to-specific-condition is the V1 spine: the user narrows to a `{factor=level}` slice and _everything_ (charts, contribution, Wall) re-projects onto it. A `Record<col, values[]>` map cannot say "yield < 0.92 AND line ∈ {A, C}"; the `hypothesisCondition` leaf shape can. Reusing it avoids inventing a second predicate language.
- **WHERE ≠ WHY is an invariant, and the type system should reflect it.** Folding the scope's predicate into `Hypothesis.condition` would let a cause silently re-assert the slice it lives in, collapsing two distinct concepts. Keeping the scope's `ConditionLeaf[]` on `ProblemStatementScope` and the cause's claim on `Hypothesis.condition` keeps the boundary load-bearing in code, not just in prose.
- **`status` + gate membership already carries everything `causeRole` tried to.** A refuted cause is `status: refuted`; a contributing cause is one inside the contribution `GateNode` tree. `causeRole` was a parallel, weaker encoding that drifted from the real workflow state.

## Consequences

### Code-level

- **`Question` removal is a tsc-wide breaking change.** `questionIds` is **required** on `Hypothesis` (`types.ts:740`), so deleting `Question` breaks the central type and cascades. Load-bearing surfaces to retire or rewire: `Hypothesis.questionIds` / `checkQuestionIds` (`types.ts:740`, `:764`), `AnalysisBrief.questions` (`types.ts:861`), `Finding.questionId` (`types.ts:578`), `CausalLink.questionIds` (`types.ts:798`), the `WallCanvas` `questions` prop, and the CoScout tool-registry `questionIds` plumbing.
- **`ProblemStatementScope` is net-new** (`outcome` + `condition: ConditionLeaf[]` + `hypothesisIds[]`). Add `buildConditionFromCategoricalFilters()` to bridge `analysisScopeStore.categoricalFilters` → compound condition. `deriveConditionFromFindingSource()` (`hypothesisCondition.ts:60`) is the existing chart→condition analogue to follow.
- **`causeRole` retirement** is ~92 occurrences across 34 files. Each `causeRole` read maps to `Hypothesis.status` or a `GateNode`-membership check.
- **Correct `packages/stores/CLAUDE.md`** — delete the "`SuspectedCause` is a first-class entity (ADR-064)" line; the cause type is `Hypothesis`.

### Methodological

- **Trust stays a soft caveat, not a gate.** Scope capture imposes no validation gate; op-def / MSA notes remain optional caveats per the spec's pragmatic posture.
- **Contribution stays level-native** (see [ADR-088](adr-088-level-native-contribution.md)) and respects [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md): a scope's `ConditionLeaf[]` defines a slice; causes inside it are _suspected contributions_ / _mechanisms_ nested within that WHERE — never rolled up across heterogeneous slices, and never described as a "root cause."
- **`ScopeFilter` (`processHub.ts:203`) must be reconciled.** It is single-factor only and cannot hold a compound scope. Either widen it to a `ConditionLeaf[]` carrier or supersede it with `ProblemStatementScope`. **`ProblemCondition` (`ai/types.ts:31`) stays distinct** — it is the HOW-MUCH gap, not the WHERE.

### Forward implication

- `buildProblemStatement()` (`packages/core/src/problemStatement.ts:66`) synthesizes a **string** today, and "with-causes" maturity is only a string-literal/comment (`ai/types.ts:394`), not a type. Once scope (WHERE) + nested causes (WHY) are first-class, "with-causes" becomes **derivable** from the model: a `ProblemStatementScope` with non-empty `hypothesisIds[]` is, by construction, a problem statement with causes.
- This ADR is paired with [ADR-086](adr-086-unified-investigation-canvas.md) (the Evidence Map + Wall as projections of one canvas), [ADR-087](adr-087-process-step-model-reconciliation.md) (the two step-model reconciliation that `ProblemStatementScope`'s `processLocation` join depends on), and [ADR-088](adr-088-level-native-contribution.md).

### Documentation

- Update `packages/stores/CLAUDE.md` to remove the `SuspectedCause` claim and `packages/core/CLAUDE.md` `findings/` notes if they reference `Question`.
- The decision-log entry graduates from CANDIDATE to this ADR; the spec at `docs/superpowers/specs/2026-05-29-investigation-surface-design.md` remains the design-level home.

## Alternatives considered

1. **Keep `Question` and just deprecate `causeRole`.** Rejected: the indirection cost stays. The Wall already carries all three of `Question`'s jobs better; keeping a half-used entity wired into the central `Hypothesis` type is ongoing surface tax for no workflow it uniquely serves.
2. **Encode the scope as `Hypothesis.condition` on a designated "scope" hypothesis.** Rejected: collapses WHERE into WHY and lets any cause re-assert its own slice. A scope is not a mechanism; it needs its own type.
3. **Widen `activeFilters` (`Record<col, values[]>`) to express compound predicates.** Rejected: would invent a second predicate language alongside the `hypothesisCondition` leaf+gate tree that already evaluates `eq/neq/lt/gt/between/in`. Reuse the one we have.
4. **Split the `Question` deletion into 6–8 per-consumer sub-tasks.** Rejected per the CLAUDE.md atomic-deletion-cascade carve-out. Because `questionIds` is required on a central type, the change is one tsc-wide breaking edit (~550 non-test occurrences across ~153 non-test files; 740/211 including tests). Dispatch ONE Opus implementer with Architect → Migration → Validator internal phases and per-category commits, including the non-code surfaces (`packages/data` fixtures, i18n keys, `.vrs` serialization). Splitting an atomic cascade multiplies orchestration cost without buying review depth.

---

## Amendment — 2026-06-05 — ScopeFilter-reconcile mandate: closed by the PO cascade

The Consequences § above recorded: **"`ScopeFilter` (`processHub.ts:203`) must be
reconciled."** It is single-factor only (`{ factor, values }`) and cannot hold a compound
scope. The mandate is **closed by deletion** — the PO extraction cascade resolved it:

- `metadata.scopeFilter` (the persisted `ScopeFilter` variant on
  `ProcessHubAnalyzeMetadata`) **deleted** (PO-1/PO-4 cascade). The field was dead
  at extraction time: zero live writers, display-only chip via the dead
  `useCanvasFilters` hook.
- **The durable WHERE is `ProblemStatementScope` alone.** No widening of `ScopeFilter`
  was needed because the persisted WHERE is now the fully-typed `ProblemStatementScope`
  (`ConditionLeaf[]`) introduced by IM-1 (PR #249). The `ScopeFilter` _type_ survives
  only as a session-scoped variant for Pareto highlight (no persistence, no compound
  scope required).

**PO-7 field rename note:** `ProblemStatementScope` fields that previously spelled
`investigationId` now use `projectId` (PO-7 honest-rename sweep). Any shape examples
in design docs that reference this field should read `projectId`. The join value is
always an `ImprovementProject['id']` — the rename was name-only (values unchanged).

**`ProblemCondition` (`ai/types.ts`) stays distinct** — it is the HOW-MUCH gap
(`currentValue` vs `targetValue`), not the WHERE predicate. That boundary is
unaffected by the PO cascade.
