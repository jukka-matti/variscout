---
tier: living
purpose: design
title: 'Investigation Wall — unified canvas (IM-4): drill→Finding→scope→hypotheses, grounded'
audience: human
status: draft
date: 2026-05-30
last-reviewed: 2026-05-30
layer: spec
topic: [investigation, canvas, wall, findings, hypotheses, collaboration, wedge-v1]
related:
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-04-19-investigation-wall-design.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
  - docs/07-decisions/adr-088-level-native-contribution.md
implements:
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/03-features/workflows/analyze-wall.md
---

# Investigation Wall — unified canvas (IM-4)

> **Draft · 2026-05-30.** Graduates §4 of the [2026-05-29 investigation-surface spec](2026-05-29-investigation-surface-design.md) + [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md) into a buildable, **Wall-centric** design, **grounded against the shipped code** (two grounding fan-outs, 2026-05-30). It refines the spec's abstract "bipartite canvas" into the **Investigation Wall** (the "river") and the **drill→Finding→compound-scope→hypotheses** spine, and states honestly what is **already built** vs **net-new**. Delivery splits into **IM-4a** (make the spine flow) and **IM-4b** (unify + multiplicity + collaborate).

## §1 · Mental model — a tree you focus _through_

```
Outcome Y  (e.g. lead_time — the river's main flow)
  ├─ Scope A: "Machine B ∩ Product X ∩ Supplier Z"   ← a compound WHERE (one drilldown)
  │     ├─ Hypothesis: worn spindle    (cause, nested IN this scope)
  │     │     ├─ comments / @mentions  · assigned tasks (ActionItem)
  │     │     └─ Measurement Plan (data we still need; owner = collector)
  │     ├─ Hypothesis: coolant temp
  │     └─ evidence: findings + contributing factors (Supports / Counts against)
  └─ Scope B: "Line A" …
```

- **Scope = a compound WHERE** — `ProblemStatementScope.predicates: ConditionLeaf[]` is a flat AND, so "Machine B ∩ Product X ∩ Supplier Z" is **one** scope (the accumulated drill chips). EDA progressive sharpening adds constraints; the scope captures the whole compound condition.
- **The Wall focuses ONE scope at a time** — a per-scope local `y = f(x)` (outcome | condition). Causes nest within their WHERE; mixing scopes' hypotheses on one wall would break WHERE≠WHY and create a hairball.
- **The Evidence Map is the cross-scope overview** (the _muuttuja kartta_ / "map of WHEREs"); a **scope rail / breadcrumb** moves between WHEREs; the **drill is the bridge** (the active chips _are_ the active scope).
- **Multiple hypotheses** = the cause cards within the active scope. **Multiple drilldowns** = multiple (flat) scopes. The **Focus lens** keeps a busy scope legible (dim by contribution × distance from the focal cause).

## §2 · The spine is built as _entities_, broken in the _middle_

Grounding verdict: the spine's **entities exist and are unit-tested**; its **wiring** is missing, with a clean break.

- **Live:** the drill (`analysisScopeStore.categoricalFilters`, populated by Boxplot/Pareto, rendered as removable chips) · capture-as-Finding · brush-to-Finding on the mini-chart · Finding→Hypothesis promotion (`connectFindingToHub`) · the whole Measurement-Plan/DCP layer · the Wall itself (mounted both apps behind a Map/Wall toggle).
- **Built but UNWIRED (zero live callers):** `ProblemStatementScope` + `createProblemStatementScope` + `analyzeStore.addScope` + the chip→condition bridge (`buildConditionFromCategoricalFilters`) — the drill **never becomes a scope**, and capture-as-Finding snapshots a _different legacy filter map_ (`projectStore.filters`) · `deriveHypothesisStatus` (the ≥2-evidence-AND-survived-disconfirmation gate) + `runAndCheck` (HOLDS N/M) — the Wall uses a naive local status that just echoes `hub.status` · `GateBadge` renders only in tests · IM-5's condition-scoped math (`computeScopeWhatIfProjection`, `computeConditionCoverage`) is inert (zero UI callers) · ready-but-unmounted primitives (`GateBadge`, `FindingChip`, `OneStepAwayBadge`) · the 3 detached IM-1 flows.

**IM-4's core value is to wire the spine that already exists and unify the two surfaces — not to build green-field.**

## §3 · The Wall surface (Wall-centric, per-scope)

A vertical "river" for the **active scope**:

- **Problem-condition card (the scope anchor)** — the compound WHERE, live **Cpk + events/wk**, and the **HOLDS gate** (`GateBadge`/`runAndCheck`), plus the scope's **What-If projection + coverage %** (IM-5 math, wired in). This _is_ the local `y = f(x)`'s head.
- **Hypothesis cards (the causes)** — name, **status from evidence** (`deriveHypothesisStatus`: proposed/evidenced/confirmed/refuted/needs-disconfirmation), a live mini-chart (I-Chart/Boxplot), and **Supports / Counts against** evidence chips (counts-against styled **loud**). Each card carries its collaboration affordances (§5) + its Measurement Plan zone (already live).
- **Contributing factors (tributaries)** — the ranked x's feeding the scope (greyed if low / unexamined; a distinct **ruledOut** state — analyst-decided, <5%, vs the statistical low-contribution tier).
- **Missing-evidence** — the Measurement Plans (the data we still need) + un-examined factors.
- **Focus lens** — click a cause → it + its factors + edges stay vivid, siblings dim (degree-of-interest). The anti-hairball mechanism; _not_ a clustering/LOD engine (deferred).

## §4 · Multi-scope (flat) + navigation

- **Scopes are FLAT in V1** — `ProblemStatementScope` has no `parentScopeId`; the code has no scope-tree. You can hold **multiple parallel compound scopes**; **child-scope recursion** (a hypothesis spawning a deeper sub-investigation) is **deferred** (the spec's "tree grows infinitely" is prose, not code).
- **Navigation:** the Wall focuses the active scope; a **scope rail / breadcrumb** lists saved scopes to switch between; the **Evidence Map** is the cross-scope overview. The drill produces/selects the active scope.

## §5 · Collaboration on hypotheses (mostly built — IM-4 adds the UI)

- **Comments** — `FindingComment` is already polymorphic (`parentKind: 'hypothesis'`); `Hypothesis.comments` + `addHubComment` + **live SSE sync** ship. Net-new: a **comment-thread widget on the hypothesis card** (lift/parameterize the existing `FindingComments`), `editHubComment`/`deleteHubComment` store actions, a **human composer** (today only CoScout writes), and **@mentions** (notify a member to come look). Fix the `AIContext.recentComments` gap (only `commentCount` exists today).
- **Assigned tasks (more than the Plan)** — **reuse the existing `ActionItem` model** (assignedTo / description / status / due / createdBy — today on Findings + Canvas steps) on **hypotheses**: a field + HubActions + card UI so an analyst/Lead can **tag a member and ask them to do/comment something** ("@Jane — validate against night-shift data"; open/done). This is distinct from, and complementary to, the Measurement Plan.
- **The Measurement Plan = the data-collection task** — `owner` = the collector; surface owner + status + due prominently on the card (the de-facto assignee — do **not** route data-collection through the general ActionItem).
- **Roles/ACL** — `canAccess(userId, members, 'edit-contributions')` gates comments + tasks + plans (all roles); hypothesis create/close stays `'edit'` (Lead-only). Reuse the verbatim Wall gate pattern (`HypothesisCardWithPlans`).
- **Presence** — static roster/RACI/activity-feed + the `collaboratedAt` marker only; **live cursors/typing deferred.**

## §6 · Local `y = f(x)` + the Measure⇄Analyze loop

- Today "local" = a ProcessMap focal **step** (`LocalMechanismView`), with the **global** outcome — _not_ a scope. IM-4 makes the Wall/Map render **per-scope** (`outcome | condition`) and wires the inert IM-5 condition-scoped math (`computeScopeWhatIfProjection` partitions `rawData` via `evaluateCondition` → `simulateOverallImpact`; `computeConditionCoverage`).
- **The loop:** hypothesis can't be answered → **Measurement Plan** → collect + re-ingest → **IM-3 auto-link** (merged) matches the new column to the plan + advances `planned→in-progress`. **Honest caveat:** IM-3 is **plans-only** — it does _not_ re-evaluate scopes/hypotheses/conditions or add x's to the local map; the §7.2 "append-preserve vs replace-re-evaluate" cascade + "L3 recursion comes for free" are **IM-4+ promises**, partly deferred (see §9).

## §6.1 · The hypothesis card as a test plan (target design — net-new, rides the V-next model-builder increment; added 2026-05-31)

Beyond comments + assignable tasks (§5), a hypothesis card's real value is the **"how do I test this, and can I?" triad** — a **derived read-model** over what is already stored, with **no new persisted field on `Hypothesis`**:

- **Claim** — the mechanism (the card's name / synthesis).
- **Relevant factors** — DERIVED (`deriveBranchColumns` ∪ the cause's findings' columns ∪ any `CausalLink` naming it), per §6.1's factor-cause model. e.g. `shift`, `coolant_temp`, plus a suspected-but-unmeasured `pump_duty`.
- **The analytical tool to evaluate it** — **auto-suggested from each relevant factor's DATA TYPE**: a categorical factor (e.g. `shift`) → **boxplot + 2-sample comparison**; a continuous one (e.g. `temperature`) → **scatter + regression**; a spread question → **capability (Cp/Cpk)**. The engine pre-picks the right tool; the analyst confirms ("VariScout hands you the right tool"). The suggestion is **computed, not stored**.
- **Data-readiness** — per relevant factor: have the data → run it, attach the result as a **supporting / counts-against Finding**; or a gap → **+ Measurement Plan** (the DCP loop, `neededFactors`).

**The test IS the disconfirmation surface.** "Which tool evaluates this hypothesis" and "how do I try to refute it" are the same gesture — the result lands as a support OR a counts-against finding (refute loud), feeding `deriveHypothesisStatus`. The card is an actionable test, not a confirmation-only sticky-note.

```
┌─ Hypothesis: "Spindle runs hot on night shift" ───────── needs-disconfirmation
│  Relevant factors:  shift ●   coolant_temp ●   pump_duty ⚠ no data
│  Test:  shift        → boxplot + 2-sample   ✓ have data  → [supports: p<.01, big gap]
│         coolant_temp → scatter + regression ✓ have data  → [supports: r≈.6]
│         pump_duty    → (needed)             ⚠ gap        → [+ Measurement Plan]
│  Findings: 2 support · 0 counts-against            [comments · @mention]
└──────────────────────────────────────────────────────────────────────────────
```

**Consistency (derive, don't store):** the analytical tool is suggested from (relevant factors × their data types × which columns exist); what persists is the **Finding** (the captured test result) and the **Measurement Plan** (the gap) — both already first-class. No new `Hypothesis` primitive — a smarter read-model over what already ships.

**Built vs net-new:** hypothesis cards + evidence chips + the Measurement-Plan zone + the disconfirmation gesture all SHIP (IM-4a/b). Net-new = the per-factor tool-suggestion + the data-readiness read-model + the run-and-attach-as-Finding wiring → rides the V-next model-builder increment (it shares the best-subset / data-type machinery; see [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md) Amendment 2026-05-31 + the 2026-05-31 decision-log entry). Charts stay scope-level (the data is the data); the card re-frames the relevant slice as evidence + adds the test + data-readiness layer.

## §7 · Terminology (user-facing labels; code identifiers preserved)

- **Supports / Counts against** (loud "counts against") — _not_ "refute" (jargon) nor "doesn't support" (which conflates _neutral_ with _counter-evidence_ and loses the disconfirmation signal). Code keeps `support`/`refute`/`CausalLink`.
- **Contributing factors** — _not_ "tributaries" (internal river-metaphor jargon). Code keeps `tributaries`.
- **Drop the ACH matrix toggle** — the Wall already embodies the disconfirmation posture (counts-against is loud); a separate evidence×hypotheses matrix is unneeded.

## §8 · Delivery split

**IM-4a — make the spine flow (per active scope):**

1. Drill→scope producer: compound `categoricalFilters` → `buildConditionFromCategoricalFilters` → `ProblemStatementScope` (`addScope`); fix capture-as-Finding to snapshot the drill condition (not the legacy `projectStore.filters`).
2. Scope-as-anchor: the Problem-condition card reads the live active scope (Cpk + HOLDS via `GateBadge`/`runAndCheck` + wire IM-5 What-If/coverage).
3. Status-from-evidence: replace the naive status with `deriveHypothesisStatus`.
4. Disconfirmation recording: the gesture + `HYPOTHESIS_RECORD_DISCONFIRMATION` (writes `disconfirmationAttempts[]`).
5. Mount `GateBadge` + `FindingChip` tethers.

- **Acceptance:** a single compound drilldown's investigation works end-to-end — drill produces a persisted scope; the Problem card shows its live Cpk + HOLDS + What-If; a card is "confirmed" only with ≥2 evidence types + a survived disconfirmation; recording a disconfirmation flips status per the gate; both-app gate green.

**IM-4b — unify + multiplicity + collaborate:** 6. Unified bipartite layout: Contributing-factors + hypothesis river in ONE coordinate space + one viewport authority + **expose node positions** (kill the duplicated layout math in Minimap/pan-to-node) + the Focus lens. 7. Multi-scope: saved flat scopes + scope rail + Evidence-Map-as-overview. 8. Collaboration: hypothesis comment threads (+ composer + @mentions) + assignable `ActionItem`s on hypotheses + the Plan-owner task surface — all ACL-gated. 9. Re-mount the 3 detached IM-1 flows; finish consuming the IM-5 wiring. 10. Terminology (§7).

- **Acceptance:** factors + hypotheses co-render in one coordinate space with Supports/Counts-against links (counts-against loud); Focus lens dims by contribution×distance; multiple scopes navigable via the rail + Map; a hypothesis is commentable + a member is assignable to a task on it; vitest + both-app gate green.
- _(If IM-4b exceeds ~8 tasks at plan time, sub-slice it — layout/Focus first, then collaboration + multi-scope.)_

## §9 · Deferred (honest boundaries)

Child-scope **recursion** / scope-tree (flat scopes only) · live **presence** (cursors/typing) · the full §7.2 **replace-re-evaluate cascade** + scope/hypothesis re-eval on re-ingest (IM-3 is plans-only) · factor-family **LOD clustering** + **edge bundling** · the **ACH matrix** (dropped, not deferred).

## §10 · §11 open-question resolutions (from the 2026-05-29 spec)

- **`setHubStatus` (§11 #4):** **delete** the orphan — status is derived (`deriveHypothesisStatus`) + the disconfirmation-recording gesture; a manual override contradicts the derived-status model.
- **`CrossTypeEvidenceMap` (§11 #5):** **retain** as the defect-frame view (mode dissolves into Frame per IM-6; the radial defect map survives as that frame's view).

## §11 · Built-vs-net-new substrate map (for the plans)

**Reuse (shipped):** WallCanvas + HypothesisCard(WithPlans) + the live Measurement-Plan zone · BrushToFindingFlow · the comment backend (polymorphic `FindingComment`, `addHubComment`, SSE sync) + `FindingComments` widget · the `ActionItem` model · `canAccess`/`ROLE_PERMISSIONS` + the Wall gate pattern · IM-5 scope math (`computeScopeWhatIfProjection`/`computeConditionCoverage`) · `ProblemStatementScope` model + SCOPE actions + analyzeStore scope ops · IM-3 auto-link · `projectMechanismBranch` (supporting/counter/notTested) · the drill scaffolding (`onOpenInvestigationFocus({kind:'suspected-cause'})`) · `EvidenceMapBase`/`FactorNode` · `GateBadge`/`FindingChip`/`OneStepAwayBadge` (unmounted) · the 32-locale `wall.*` i18n.

**Net-new:** the spine wiring (§8.1–8.4) · per-scope rendering of Wall/Map + the inert-math wiring · the bipartite re-layout + exposed positions + Focus lens · the hypothesis comment UI + `editHubComment`/`deleteHubComment` + composer + @mentions + `AIContext.recentComments` · `Hypothesis` ActionItems (field + actions + UI) · the scope rail · the 3 detached-flow re-mounts.

## §12 · Delivery

IM-4a → IM-4b (serial; IM-4a is the foundation). Then IM-6 (retire mode/lens picker). Per-PR: `superpowers:writing-plans` → subagent-driven-development → gate + 4-dimension adversarial review → merge. This design refines ADR-086 (drop ACH; flat scopes for V1; the Wall is the canonical presentation of the bipartite graph).
