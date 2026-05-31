---
tier: living
purpose: design
title: 'Factors & Evaluation — the model-builder, the hypothesis test-plan, and the What-If handoff'
audience: human
status: draft
date: 2026-05-31
last-reviewed: 2026-05-31
layer: spec
topic: [investigation, factors, best-subset, hypotheses, evaluation, improve, wedge-v1]
related:
  - docs/superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/07-decisions/adr-088-level-native-contribution.md
  - docs/decision-log.md
implements:
  - docs/superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md
---

# Factors & Evaluation — the model-builder, the hypothesis test-plan, and the What-If handoff

> **Draft · 2026-05-31.** The V-next initiative on top of the merged Investigation Wall (IM-4a/b/c). It turns the Wall from a _manual evidence-curation_ surface into one where **VariScout hands you the right tool, you tap to run, and the result auto-files as support-or-counter** — built on a parsimony engine that **already exists** (`computeBestSubsets`). Grounded against shipped code via four prior fan-out explorations (factor↔cause model · model-simplification UX · hypothesis-stage walkthrough); design forks settled with the product owner (a Six Sigma MBB). Canonical "why" lives in [ADR-086 Amendment 2026-05-31](../../07-decisions/adr-086-unified-investigation-canvas.md) + the [2026-05-31 decision-log entry](../../decision-log.md); the hypothesis-card triad is sketched in [the 2026-05-30 Wall spec §6.1](2026-05-30-investigation-wall-unified-canvas-design.md).

## §1 · The gap this closes

The Wall ships with a live-derived status, comments, ActionItem tasks, the Measurement-Plan zone, the disconfirmation gesture, and the Focus lens. What it does **not** have is the screen that makes factor work effortless:

- **Factors are computed and discarded.** `computeBestSubsets` enumerates every 2^k−1 subset sorted by adjusted R² (`packages/core/src/stats/bestSubsets.ts`); `deriveBranchColumns(hub, findings)` already computes a cause's relevant factors (`packages/core/src/findings/mechanismBranch.ts:93`). Both run today; **neither renders on the Wall.** The factor "band" is still the non-stats `TributaryFooter`.
- **The "test" is descriptive, not inferential.** The only card→finding path (`BrushToFindingFlow`) pins a statistic-free text finding — no p-value, no 2-sample, no sign — so it inflates support without testing.
- **The "so what" is invisible.** `computeScopeWhatIfProjection` + `computeConditionCoverage` (`packages/core/src/variation/scopeContribution.ts`, non-additive by enforced design) are correct but never surfaced; confounds are adjudicated by clue-counts.

**This initiative is ~90% UI over an existing engine** — exposing comparisons + projections the deterministic engine already makes — plus one cheap engine add (Mallows Cp, internal only) and one deferred net-new primitive (selection-stability bootstrap).

## §2 · The settled model (binding — do not re-litigate)

- A **FACTOR** is a measured column ranked by best-subset/contribution — **scope-level, transient, re-ranked on every drill** (`useScopedModels.filteredScope` drops the drilled-constant factor). A **HYPOTHESIS** is a human mechanism claim (the cause). A **FINDING** is a persisted observation that bridges them.
- **A cause's factors are a DERIVED projection** (`deriveBranchColumns` ∪ the cause's findings' columns ∪ any `CausalLink` naming it) — **never a stored `Hypothesis` field.**
- **Contribution, not causation; distribution, not aggregation; no invalid variance decomposition** (the "so what" is the What-If Cpk, never a summed contribution stack); **Cp/Cpk only.** Copy uses factor-side verbs ("accounts for the spread in this data"), never "drivers/root."

### Locked design calls (product owner, 2026-05-31)

1. **"Simplest adequate" default** = the fewest factors **within 1 point of the max adjusted R²** where each kept factor's **p < .15**; the analyst adjusts from there. (ADR-088 amendment + a tunable.)
2. **Surface metrics = adjusted R² + per-factor p ONLY.** No Mallows Cp / BIC on the surface (Cp may be an _internal_ picker metric only). Keep it simple and meaningful.
3. **Evaluate is one-tap, never auto-run** (avoids implying a post-selection p is a clean pre-planned test).
4. **A manual model override is VIEW-STATE while exploring; the _concluded_ model is saved via capture-as-Finding** (the Finding snapshots the factors — `FindingProjectionModelContext` already carries `rSquaredAdj`/`scopeLabel`/`linkedFactor`). No stored selection field; no Finding-per-toggle.
5. **Terminology:** top status label is **"Supported"** (shipped #259); "Counts against" stays loud.

## §3 · The scope-level model-builder (Increment 1)

The contributing-factors band becomes an interactive best-subset **model-builder**, positioned by the IM-4c `computeWallLayout` authority (factors band → fed `factors`; the V-next hook is already in place).

- **Pre-selected vital-few** (the §2.1 default) — do nothing and you get the engine's deterministic recommendation. Candidates sit dimmed below a "vital-few line."
- **Toggle a candidate across the line** → an **O(1) lookup** into the already-enumerated `subsets[]` (no recompute); the header's **adjusted R² + per-factor p** update live, and over-adding moves them _against_ you. A loud **"↩ Use suggested model"** snap-back is always one tap away (full analyst control, never silent — engine suggests, human owns the override visibly).
- **Ambient honesty guards (already computed, just surfaced — never nag):** the overfit gap + obs/predictor ratio → an amber "fit-only estimate" dot; **multicollinearity** → when toggling a high-VIF factor _out_ barely moves R²adj, a dismissible line ("removing X barely changed the model — it's correlated with Y, redundant not irrelevant"). VIF/Cp numbers on hover only.
- **Re-rank on drill** — narrowing the scope re-ranks the band on the subset (shown as a transition, with the drilled factor chipped "constant in scope"); below the min-n gate, show "too few rows to re-rank — showing parent scope," never a garbage model.
- **Conclude → capture-as-Finding** snapshots the model (factors + R²adj) into the Finding's `modelContext`.

## §4 · The hypothesis test-plan triad (Increment 2)

The hypothesis card grows the **"how do I test this, and can I?"** triad — a derived read-model, no new `Hypothesis` field:

- **Relevant factors** — `deriveBranchColumns`, rendered (today computed + discarded).
- **The analytical tool, auto-suggested from each factor's data type:** categorical → **boxplot + 2-sample**; continuous → **scatter + regression**; a spread question → **capability (Cp/Cpk)**. The engine pre-picks; the analyst confirms.
- **Data-readiness** per factor: have the data → **one-tap "evaluate"** → run the test → attach the result as a **typed Supports / Counts-against Finding** (a significant _adverse_ result auto-classifies **Counts-against**); gap → **"+ Measurement Plan."**
- **The test IS the disconfirmation surface** — same gesture confirms or refutes-loud, feeding `deriveHypothesisStatus`. An evaluation counts as one evidence _type_ (`data`) regardless of how many factors/tests (the confirm gate triangulates on data/gemba/expert, not test count).

Replaces `BrushToFindingFlow`'s statistic-free pin as the primary card→finding path (brush stays for descriptive capture). Pre-fills `AddPlanForm.primaryFactor` from the derived factors (kills the free-text drift).

### §4.1 · Disconfirmation as a hypothesis-refinement loop (not just a gate)

The "Supported" gate (`deriveHypothesisStatus`: ≥2 evidence types **+ a survived disconfirmation**) is not only a quality bar — it is the **generative engine that sharpens hypotheses**. Falsification logic (Popper): you never _prove_ a hypothesis, you fail to _refute_ it; one refutation kills it, a thousand confirmations don't prove it. So a cause that _survived a genuine attempt to break it_ is in a different class from one with only piled-on support — and the act of trying to break it makes the hypothesis better in four ways: (1) it forces **falsifiable specificity** (a vague hypothesis has no disconfirming test → you must commit to a mechanism with a checkable prediction); (2) a failed attempt usually **refines rather than kills** — it relocates the cause to a sharper one (the spindle example: disconfirming "it's the night shift" → "it's the spindle, regardless of shift"); (3) it **surfaces confounds** ("what would prove me wrong?" = "what's the rival explanation?"); (4) it **calibrates honest, scoped confidence** ("survived these three attempts, wobbled under this one"). Refuted hypotheses stay on the Wall as visible **red dead-ends** (anti-amnesia) so the team doesn't re-walk them and each cycle starts sharper.

**Design consequence:** the disconfirmation gesture is _"what's the test that would prove this wrong?"_ → run it via the same one-tap `evaluate` → if the result does **not** refute, that is the survived attempt, **with the test result attached** (`DisconfirmationAttempt.linkedFindingIds` — the field exists; today's write-path passes `[]`). This unifies disconfirmation with the test-plan triad ("the test IS the disconfirmation surface") and closes the bookkeeping gap.

**RESOLVED — evidence-backing is SOFT (product owner, 2026-05-31):** a `verdict: 'survived'` stays settable and the gate still promotes to **Supported**, BUT an _unbacked_ survived attempt (no `linkedFindingIds`) is **caveated ambiently** ("Supported — disconfirmation has no attached evidence"), not hard-blocked. Honors the house posture ("trust is a soft caveat, not a gate"); the value comes from analysts _choosing_ to run the falsifying test, which the UX makes cheap + the prompt-framing encourages — not from the tool forcing it. UX/CoScout support for the refinement loop is the open design surface (see §10).

### §4.2 · The disconfirmation gesture + CoScout support (Increment 2 UX + a CoScout-later increment)

**Keystone — "Try to break it" is a checkbox on the `evaluate`, not a second form.** Do not build a separate disconfirmation surface. The same one-tap `evaluate` (§4) that runs the 2-sample / regression / capability test and writes a typed Finding _also_ records the `DisconfirmationAttempt` — with the finding attached and the verdict **read off the engine, never self-graded**. Today's gesture (`HypothesisCardWithPlans.tsx:482`) is wrong three ways — a separate amber button, retrospective copy ("we tried to break this — did it hold?"), and an honor-system self-grade dropdown — which is exactly why `linkedFindingIds` is hardcoded `[]` (`Editor.tsx:713`, `App.tsx:905`). The fix flips all three:

| "Try to break it" checked? | Engine result                               | Finding                       | DisconfirmationAttempt                                                      |
| -------------------------- | ------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| ☑                          | NOT adverse (the wrongness-prediction held) | `refutes:true`                | `verdict:'refuted'`, `linkedFindingIds:[f]` → card **red**                  |
| ☑                          | adverse (wrongness-prediction failed)       | `validationStatus:'supports'` | `verdict:'survived'`, `linkedFindingIds:[f]` → **evidence-backed survived** |
| ☐                          | adverse                                     | `'supports'`                  | — (ordinary support)                                                        |
| ☐                          | NOT adverse                                 | `'contradicts'`               | — (counter-clue)                                                            |

This closes the `[]` gap **by construction**, kills the self-grade dropdown (engine is authority), reframes to a **prospective premortem** ("predict what would prove this WRONG"), and costs exactly one extra tap. The crucial inversion: with "break it" checked, a test that _fails to break the cause_ is the survived attempt. The legacy free-text form survives only as the **manual fallback for non-data disconfirmation** (gemba/expert) — its `survived` carries `linkedFindingIds:[]` and gets the §4.1 soft caveat.

- **Refute → respawn-sharper:** a refutation offers inline relocation — seed H2 from the refuted dimension, **carry the refuting finding forward as _supporting_ evidence for H2** (the finding that killed "it's the shift" is positive evidence for "it's not the shift" → H2 starts evidenced; `HYPOTHESIS_ADD` + re-link). H1 stays **red, never archived** + a "superseded by →" connector. Carry shown explicitly on the verdict screen, not silent.
- **Confound sign-prompt:** when the evaluate's factor is cited by a rival hypothesis, surface the rival + **prompt** the opposite sign (the data picks the side; the human confirms — per §10 #1) + **side-by-side per-hypothesis What-If, never summed** (two `computeScopeWhatIfProjection` calls + coverage %, explicit "not additive" — the visual enforcement of the no-cross-aggregation invariant).
- **Surface the disabled affordances:** activate the `MissingEvidencePanel` "Try disconfirmation" button + make `OneStepAwayBadge` clickable → both **open the triad pre-staged** (the existing Survey one-hint-per-hypothesis stays the only ambient nudge).

**De-biasing (evidence-backed; the binding constraints):** the gesture is a **premortem** ("assume it's wrong, what would you see?" — licenses dissent better than "did it hold?") and a **consider-an-alternative** prompt (an alternative works as well as the negation and doubles as the confound surface). **CoScout/the UI proposes exactly ONE rival / ONE falsifying test — NEVER a list:** Schwarz's ease-of-retrieval backfire means asking an analyst to brainstorm _many_ confounds makes them _more_ confident in the original (the struggle reads as "nothing there") — a "5 things you haven't considered" panel actively harms calibration. **ACH-as-grid is confirmed not to reduce bias** (Dhami et al.) — vindicates the dropped ACH matrix; keep the _diagnosticity_ discipline (a good falsifying test is severe), drop the grid. No second nudge channel (alert fatigue); never fire before the hypothesis has its 2 evidence types.

**CoScout — grounded reality + the honest seam.** CoScout is an LLM chat with a read/action tool registry that **never decides** (every mutation is a human-confirmed Apply card) — the right minimal-nudge spine. The disconfirmation _intent already ships as prompt coaching_ (`tier2/analyzeDiscipline.ts`: "prioritize disconfirmation… flag hypotheses with ≥3 supporters and no contradictor"). Pre-built but **dead/shell** scaffolding exists for exactly this: `critique_investigation_state` (registered tool, no handler), `proposeDisconfirmationMove` + `critiqueAnalyzeState` (barrel-only). But **CoScout cannot see the disconfirmation graph** — `AIContext` carries `status` (incl. `needs-disconfirmation`) but not `disconfirmationAttempts` / evidence-type breakdown. The **honest seam:** CoScout _names the rival + proposes the exact filter_; the **deterministic engine produces the number**; the **human renders the verdict** (taps Evaluate). CoScout never writes `verdict`/`status`, gets **no new proactive channel** (speaks only on-demand or when the analyst opens the triad).

**Staging:**

- **Increment-2-NOW (cheap UX on the triad; no engine/AI change):** reframe the gesture copy to the prospective premortem (+ a `predict` field); the fused "Try to break it" toggle (engine-verdict writes `verdict`+`linkedFindingIds` — depends on §4's evaluate→typed-finding path, itself Increment-2 net-new); the §4.1 **soft-caveat render** for an unbacked `survived` (+ a "back it with a test →" link); activate the disabled affordances; the relocation gesture + "superseded by →"; the confound sign-prompt + side-by-side What-If.
- **CoScout-LATER (wire the dead scaffolding + context; never decides):** project a `disconfirmation:{attemptCount,hasSurvived,evidenceTypesMissing[]}` summary into `AIContext`; implement the `critique_investigation_state` handler (deterministic confirmation-only list + confound detector, emit only the result); a `propose_disconfirmation_test` action tool (wire `proposeDisconfirmationMove`) → confirm-card staging the falsifying brush — fires only on-triad-open or on-demand.
- **DEFERRED:** the ACH grid; multi-rival brainstorming (actively harmful); any CoScout that writes verdict/status; auto-running evaluate; persisting `disconfirmationAttempts` beyond in-session.

## §5 · Surface the per-hypothesis What-If Cpk (Increment 2)

Render each hypothesis's **own** What-If ("if we control this cause → projected Cpk X") via `computeScopeWhatIfProjection` + coverage % — built, correct, currently invisible. **Never summed across hypotheses** (enforced by `architecture.noCrossInvestigationAggregation.test.ts`); the confound case (two causes citing the same factor at opposite signs) is adjudicated by data picking a side + side-by-side What-If, not by an additive stack. This is also the "expected gain" that carries to Improve.

## §6 · The Analyze→Improve handoff

"Suspected cause" is **a role + a selection, not a grouping entity** (there is no `SuspectedCause` type; `causeRole` is a presentational tag, not stored in core). The bridge is built: a committed cause becomes an `ImprovementProjectFactorControl` anchored to the hypothesis (`linkedHypothesisId`); Improve generates `ImprovementIdea`s + `ActionItem`s and projects the What-If. This initiative makes the handoff explicit: a **Supported** hypothesis → marked the cause you'll act on → carries its What-If gain into Improve. **Open call:** whether `causeRole` is a _selection on top of_ derived status (lean: yes — "this is strong" and "this is the one I'll fix" are different decisions) vs. mostly derivable from status. Cleanup: the pre-IM-1 `onSetCauseRole(questionId, …)` leftovers (`FindingsLog`/`QuestionTreeView`/`QuestionNode`) are stale (Question was dropped) — remove.

## §7 · Built vs net-new (engine reality — for the plans)

**Reuse (shipped):** `computeBestSubsets` (all subsets + R²adj/F/p; toggle = O(1) lookup, not recompute) · overfit-gap/obs-per-predictor/VIF/ordinal-disordinal (all computed, winner-only, UI never reads them) · `deriveBranchColumns`/`deriveHubFactors` · `useScopedModels.filteredScope` (scope re-rank) · `computeScopeWhatIfProjection`/`computeConditionCoverage` · `createFinding` + `FindingProjectionModelContext` (`rSquaredAdj`/`scopeLabel`/`linkedFactor`) · `MeasurementPlan`/DCP + IM-3 auto-link · the IM-4c `computeWallLayout` factor-band hook · `ImprovementProjectFactorControl` + the Improve projection.

**Net-new:** the model-builder band UI (pre-select + toggle + live header + snap-back + ambient cues) · **Mallows Cp** (~15-30 LOC in the enumeration loop, _internal picker metric only_) · the per-factor data-type→tool mapping + the one-tap evaluate→run→attach-typed-Finding wiring · rendering the per-hypothesis What-If on the card · `primaryFactor` pre-fill · the confound sign auto-prompt.

**Deferred one increment:** the **selection-stability bootstrap** ("in N% of resamples") — the one genuinely net-new statistical primitive; ship the band first.

## §8 · Deferred boundaries (do NOT build)

Selection-stability bootstrap (one increment out) · BIC + any surfaced Cp column (internal only) · drag-to-reorder (toggle, not drag) · persisting the _working_ selection as an entity (capture-as-Finding instead) · interaction-term toggling + formal selection-corrected inference · the `'confirmed'` → `'supported'` **code-identifier** rename (separate atomic sweep) · the 31-locale status-label retranslation (tracked) · child-scope recursion / a `SuspectedCause` grouping entity.

## §9 · Delivery (the master-plan slices)

- **Increment 1 — the model-builder band** (scope-level; §3). ~90% UI over the engine + internal Cp + the ambient guards. Single-implementer (integration-heavy UI).
- **Increment 2 — the hypothesis test-plan triad + the per-hypothesis What-If** (cause-level; §4–§5). Reuses Increment 1's tool-mapping + run-and-attach.
- **Increment 3 — selection-stability bootstrap** (the deferred primitive).
- **+ the Improve-handoff explicit step** (§6) folds into Increment 2 or its own slice.
- **IM-6** (mode/lens picker retirement) closes the prior investigation-surface initiative — independent, slot anytime.

Each increment: `superpowers:writing-plans` → single-implementer (per the IM-4b TDD-pipeline verdict — leaf-scoped test/impl splits ship green-but-dead UI) → full gate + seam tests + adversarial review → `gh pr merge --merge --delete-branch`.

## §10 · Open questions (resolved + remaining)

1. **Confound sign — RESOLVED (2026-05-31): PROMPT.** Capturing a shared test that supports H1 and counts-against H5 prompts the analyst to mark H5's opposite sign (the manual path silently leaves the loser "supporting").
2. **`evaluate` evidence-type — RESOLVED (2026-05-31): one `data` type per evaluation** regardless of how many factors/tests, so the Supported gate's triangulation (data + gemba/expert + survived disconfirmation) stays honest.
3. **Disconfirmation evidence-backing — RESOLVED (2026-05-31): SOFT** (see §4.1) — an unbacked `survived` is caveated, not blocked.
4. **`causeRole` vs derived status (§6) — DEFERRED to the Improve-handoff slice** — selection-on-top (lean) vs derivable; not needed for Increment 2's core.
5. **UX/CoScout support for the disconfirmation loop — DESIGNED (2026-05-31): see §4.2** (the "Try to break it" checkbox on the evaluate; engine-graded; CoScout proposes-one-rival; staged Increment-2 UX vs CoScout-later). Residual calls for the plans: (a) the falsifying-**prediction field** — optional-but-strongly-prompted (lean) vs required when "break it" is checked (wants a usability check with the MBB); (b) the fused toggle **depends on §4's evaluate→typed-finding path** (net-new) — so "fix the `[]` gap" can't precede the evaluate; sequence the evaluate + the disconfirmation fusion as one slice (or give the gap a manual-form interim); (c) relocation finding-carry — show the supporting-carry explicitly on the verdict screen (not a silent sign-flip); (d) CoScout confound detection — compute deterministically + emit only the result (cheaper + engine-authoritative) vs projecting per-hub sign into `AIContext` every turn.
