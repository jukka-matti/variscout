---
tier: living
purpose: design
title: 'Analyze Wall redesign — methodology-first, scope-lineage, Miro-class composition'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, scope-lineage, coscout, collaboration, miro, problem-statement, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
implements:
  - docs/03-features/workflows/analyze-wall.md
  - docs/03-features/workflows/investigation-surface.md
---

# Analyze Wall Redesign — Design

**Origin:** an owner↔Codex design conversation (2026-06-08) benchmarking the Wall's look-and-feel against Miro/FigJam, plus the FSJ-10 walk's "make Analyze feel like Miro" instinct. This is the **visual-composition + methodology-legibility layer** on top of the just-shipped [Analyze/Wall legibility L-series](2026-06-07-analyze-wall-legibility-design.md). The legibility work fixed _what's on a card_ (vocabulary, the 3 states, evidence-as-facts, the matrix); this fixes _how the surface is composed, what story it tells, and how a team works on it_.

**Status:** principles **LOCKED**; the three concepts are **OPEN** (owner convergence pending — visual-companion session); a first prototype slice is **draft PR #336** (`codex/analyze-wall-scope-lineage` — keep draft, do NOT merge until the concept choice lands; see §8).

## §1 Locked principles

1. **Methodology first.** The Wall makes the investigation model legible: **Issue → ProblemStatementScope (WHERE) → Hypotheses / suspected causes (WHY) → Findings / tests / Measurement Plans → Improve.** Not "Miro with cards" — a structured investigation canvas.
2. **No-CoScout first.** Every workflow completes manually without AI. CoScout is an optional overlay drawer that accelerates/drafts/explains but never owns the workflow or sets status (CS-10 fence).
3. **Dual entry.** Both paths are first-class: **finding-first** (Explore pattern → Finding → Scope → Hypothesis) and **hypothesis-first** (suspected mechanism → one of three next moves, §4).
4. **Object-based collaboration.** Team work happens _on_ scopes/findings/hypotheses/plans/comments/actions — not a separate chat layer. Roles `lead | member | sponsor` (existing model); no new in-product approval gates (Sponsor review stays read-mostly / out-of-band per V1).
5. **Scope lineage, not scope recursion** (§3) — the model decision.
6. **Miro-class composition** (§6) — bigger cards, calmer chrome, readable default scale, frames/presentation mode.

## §2 Entity model (grounded against canon)

| Artifact                  | Role                                                                                | Code anchor                                              |
| ------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Issue statement**       | the vague input ("line 3 seems too variable")                                       | `AnalysisBrief.issueStatement` (`findings/types.ts:862`) |
| **Problem statement**     | the progressively _sharpened output_ (outcome + target + the few meaningful scopes) | `buildProblemStatement` (`findings/problemStatement.ts`) |
| **ProblemStatementScope** | the durable **WHERE** — a flat `ConditionLeaf[]` AND of `{factor=level}`            | `findings/types.ts` (ADR-085)                            |
| **Hypothesis**            | the **WHY** — suspected mechanism nested in a scope; may have zero findings         | `findings/types.ts`                                      |
| **Finding**               | a persisted observation (data / gemba / expert), with source + validation           | `findings/types.ts`                                      |
| **Measurement Plan**      | the durable "question" when evidence is missing (DCP)                               | `measurementPlan/types.ts`                               |

**Question stays retired** (ADR-085): questions are scaffolding (CoScout / analyst thinking), durable only when converted to a Finding, Hypothesis, or Measurement Plan. **Many scopes per outcome/issue** is canon — they together address the overall problem.

## §3 Scope lineage (the model decision)

**Challenge the "unrelated flat siblings" reading; keep flat scopes operationally; add lineage as display.**

- Each scope is **complete on its own** — a flat `ConditionLeaf[]` AND. `Machine=A`, `Machine=A ∩ Shift=Night`, `Machine=A ∩ Shift=Night ∩ Product=X` are three self-describing scopes.
- The UI shows them as a **lineage trail** (broad → narrow) because that's the analyst's mental model of _how they narrowed the problem_.
- **NOT child-scope recursion** — which both `analyze-wall.md:123` and `investigation-surface.md:102` list as an explicit V1 **non-goal**. No scope inherits parent predicates; nothing recursively resolves a tree. (Recursion would make `Shift=Night` ambiguous — only Night, or Machine=A ∩ Night? — and force every Cpk/What-If/evidence-count/Explore-jump/report-section to walk the tree.)
- **Multiple lineage branches** can address one overall problem (Machine=A and Machine=B both open under the same issue).
- Lineage is carried by **optional metadata** (`parentScopeId`, `sourceFindingId`, `createdFrom`) AND **inferable from predicate containment** when metadata is absent.
- **Never aggregate** Cpk or contribution across heterogeneous scopes (ADR-073).

## §4 Dual entry — hypothesis-first is three-way

A suspected cause with no findings yet offers three next moves (never force the Measurement-Plan path):

- **Check it** — when current data can test the factor/outcome (run-now check on existing data; the suspected-cause-card wireframe's "Run-now checks").
- **Link finding** — when evidence already exists.
- **Plan evidence** — a Measurement Plan, only when the needed data/gemba/expert input is missing.

## §5 Explore ↔ Analyze as one loop (the crack to close)

The intended loop is bidirectional, but the **Analyze→Explore jump currently carries only Y (+factor), not the full WHERE** (`navigateToExploreForChip.ts:31` sets Y from `outcomeColumn`; predicates are dropped). The redesign closes it:

- **Analyze → Explore** carries the full `ConditionLeaf[]` predicates + outcome + selected factor + optional finding/hypothesis origin.
- **Explore applies the predicates to the charts** — not just a visual scope chip.
- **Explore → Analyze** captures findings with the active scope, and can mint a **refined related scope** (lineage edge back).
- (The prototype slice §8 already does this for **categorical** predicates on Azure — the general predicate-to-filter handoff + chart mirror is the remaining design crack.)

## §6 Composition + the Overall Problem Header

Benchmark = **Miro for process evidence** (navigation primitives + frames, not a generic whiteboard; Model C whole-app canvas stays rejected per ADR-086/connective-surface). Targets from the benchmark read:

- **Readable default scale** (the #1 fix — cards legible on entry, less competing chrome). ⚠️ See §7: verify whether L-4 actually delivered this; Codex reported "Fit didn't materially improve default scale."
- **Overall Problem Header**: issue statement · outcome + target direction · live problem-statement draft · open scope branches + remaining gaps. (Built in the slice.)
- **Scope Lineage Rail**: broad→narrow trail + branch support; each scope card shows WHERE · n/coverage · Cpk · What-If · hypotheses · evidence gaps · owner/status.
- **Stronger connectors** (labels, curved), **focus mode** (click a hypothesis → dim the rest, enlarge its local evidence network, show next action), **frames/presentation mode** for Sponsor review.

## §7 Three concepts (OPEN — owner convergence pending)

To be compared side-by-side in a visual-companion session; the prototype slice is "Concept 0":

| #   | Concept                                            | Essence                                                                                                                                                   |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Built prototype** (the slice)                    | Overall Problem Header + Scope Lineage Rail + categorical Explore handoff — a running first cut of the Problem-Board direction                            |
| 1   | **Problem Board / Scope Lineage** (likely default) | Overall problem + live problem statement on top; lineage rail of the few scope branches that together address it                                          |
| 2   | **Active Scope Workbench**                         | One active scope; deep work — hypotheses, current-data checks, findings, counts-against, measurement plans, owners, Improve handoff — for that scope only |
| 3   | **Story Frames**                                   | Miro-frames review mode: Issue → Problem-statement draft → scope lineage → evidence → suspected mechanisms → actions; Sponsor walkthrough + Report prep   |

Each concept must show **two states: CoScout closed (slim right-edge handle) and CoScout drawer open** (context-scoped to the selected Wall object — header like "Suspected cause: staffing gap"; tabs Coach / Evidence / Actions; artifacts not just messages; every suggestion carries a visual-grounding [REF]). CoScout drawer never hides required manual controls.

## §8 The prototype slice (committed, unpushed)

`codex/analyze-wall-scope-lineage` @ `19fa7397e` (pr-ready-check green; browser smoke-checked, no console errors). **In:** `ProblemStatementScope` lineage metadata (`parentScopeId` / `sourceFindingId` / `createdFrom: explore-drill | finding-refine | manual | coscout-proposal`) + inferred-from-containment lineage; `OverallProblemHeader` + upgraded `ScopeRail` trail; Azure Analyze→Explore carries categorical scope predicates; tests. **Not in (tracked follow-ups, not half-built):** collaboration view filters (Assigned to me / Open evidence / Waiting on team / Counts-against / By scope), Story Frames mode, the general (non-categorical) predicate→filter handoff + chart mirror. **Status:** pushed as **draft PR #336** (the gh-token blocker resolved). **Disposition: keep it DRAFT — do NOT merge until the §7 concept choice is made.** It ran ahead of this spec, so the chosen concept validates/reframes it first; the lineage _metadata_ (additive, ADR-085-consistent) is low-risk to keep, but the header/rail _composition_ is exactly what the concept session decides.

## §9 Collaboration (object-based, no new schema this pass)

Reuse `ProjectMember`, `Invitation`, `canAccess`, `FindingComment`, `Finding.assignee`, `MeasurementPlan.owner/status/dueDate`, `Hypothesis.comments`, `Finding.evidenceType`. Show on cards: owner chip on plans/assigned work · evidence-type + contributor label on findings · comments/@mentions on objects · due/status chips. Filters land as view-state (no schema): Assigned to me / Needs review / Open evidence / Counts-against / By scope. **No formal approval gates** (Sponsor read-mostly). New persisted review state = out of scope for this pass.

## §10 Non-goals

Child-scope recursion (flat scopes stay, per canon); whole-app Miro canvas (Model C rejected); CoScout setting status / concluding (CS-10); new durable Question entity; new persisted collaboration/review schema this pass; the ACH matrix (dropped, not deferred — one rival at a time).

## §11 Open questions

- **Concept choice** (§7) — the convergence decision.
- **L-4 reality** (§6) — is the default scale actually fixed, or is "Fit didn't help" a real L-4 gap? Verify before composition work assumes it.
- The general **predicate→Explore-filter handoff + chart mirror** (§5) — the remaining technical crack beyond the slice's categorical case.
- Where exactly CoScout's drawer sits vs the river spec's "single evolving narrator pane" — reconcile, then CS-14 fills it (CoScout content designed/built last).
- Relationship to L-5's Causes matrix: the matrix is a lens; do Story Frames subsume or complement it?
