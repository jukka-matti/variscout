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
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
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

**Status:** principles **LOCKED**; the concept is **CHOSEN** (§7, resolved 2026-06-08 in an owner visual-companion convergence session — grounded against code + the founding "Investigation on the River" deck). A first prototype slice is **draft PR #336** (`codex/analyze-wall-scope-lineage`) — disposition in §8 (keep the header, reframe the rail, demote the lineage metadata).

## §1 Locked principles

1. **Methodology first.** The Wall makes the investigation model legible: **Issue → ProblemStatementScope (WHERE) → Hypotheses / suspected causes (WHY) → Findings / tests / Measurement Plans → Improve.** Not "Miro with cards" — a structured investigation canvas.
2. **No-CoScout first.** Every workflow completes manually without AI. CoScout is an optional overlay drawer that accelerates/drafts/explains but never owns the workflow or sets status (CS-10 fence).
3. **Dual entry.** Both paths are first-class: **finding-first** (Explore pattern → Finding → Scope → Hypothesis) and **hypothesis-first** (suspected mechanism → one of three next moves, §4).
4. **Object-based collaboration.** Team work happens _on_ scopes/findings/hypotheses/plans/comments/actions — not a separate chat layer. Roles `lead | member | sponsor` (existing model); no new in-product approval gates (Sponsor review stays read-mostly / out-of-band per V1).
5. **Flat scopes, not scope recursion** (§3) — the model decision holds. _(Amended §7.5: the broad→narrow lineage **display** is demoted to "current scope + switcher"; the flat-no-recursion model is unchanged.)_
6. **Canvas-first composition** (§6 → resolved in §7.2) — the canvas owns the screen; calmer chrome; readable default scale. _(Amended: "frames/presentation mode" is **cut** — Sponsor review is the Report tab's job, §7.8.)_

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

> **Amended by §7.5 (2026-06-08):** the flat-scopes / no-recursion model below **holds unchanged**. The lineage **trail display** is **demoted** — the chosen direction shows the _current scope + a switcher_ across flat siblings, not a broad→narrow trail. Read §3 for the model; read §7.5 for the UI.

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

> **Superseded by §7.2/§7.3/§7.5/§7.8 (2026-06-08).** This is the pre-convergence sketch. Net changes the chosen direction made: "Miro-like" was sharpened to **canvas-first real-estate** (§7.2, with the "% viewport = canvas" metric); the **Scope Lineage Rail → current scope + switcher** (§7.5); **frames/presentation mode cut** (Report owns it, §7.8); **gates made legible** added (§7.3). Kept: the **Overall Problem Header** (now the thin top bar) and stronger connectors + focus mode. Read §7 for the resolved composition.

Benchmark = **Miro for process evidence** (navigation primitives + frames, not a generic whiteboard; Model C whole-app canvas stays rejected per ADR-086/connective-surface). Targets from the benchmark read:

- **Readable default scale** (the #1 fix — cards legible on entry, less competing chrome). ⚠️ See §7: verify whether L-4 actually delivered this; Codex reported "Fit didn't materially improve default scale."
- **Overall Problem Header**: issue statement · outcome + target direction · live problem-statement draft · open scope branches + remaining gaps. (Built in the slice.)
- **Scope Lineage Rail**: broad→narrow trail + branch support; each scope card shows WHERE · n/coverage · Cpk · What-If · hypotheses · evidence gaps · owner/status.
- **Stronger connectors** (labels, curved), **focus mode** (click a hypothesis → dim the rest, enlarge its local evidence network, show next action), **frames/presentation mode** for Sponsor review.

## §7 Chosen direction — the converged Wall (resolved 2026-06-08)

**Decision: Concept A "one surface, three modes" as the destination, delivered via Concept B "Board-first" staging.** The **Wall is the single Analyze home**; Focus (drill into a scope/cause) and any future review mode are later modes of the _same_ surface, not separate concepts. **Concept 3 "Story Frames" is CUT** — Sponsor narrative/presentation is the **Report tab's** job (read-mostly, Summary mode, export — `report.md:25,56`); duplicating it on the Wall is redundant.

The canvas's role is the founding **"Investigation on the River"** wall (the process-detective board, `process_thinking.pptx`): **problem condition above · suspected causes converge upward from tributary-roots below · findings pinned · gates check the data (HOLDS N/M) · status graduates · the tool surfaces what's missing.** It is rendered with **Miro's _feel_** (the canvas owns the screen; calm; direct-manipulation) but is explicitly **not a Miro board** — nodes are typed, connections are semantic and checkable, CoScout suggests never authors. ("Feel like Miro" and the deck's "Not a Miro board" are the same target: Miro's _feel_, VariScout's _rigor_.)

### §7.0 The two states (wireframe)

Built/iterated in a visual-companion session (mockups in `.superpowers/brainstorm/`, ephemeral); the durable form follows.

**State A — CoScout closed · canvas-first (the canvas owns the screen):**

```
┌ thin bar: Issue: Fill weight · Line 2 · Cpk≥1.33 · Scope: Line 2 ▾     [Wall|Causes] ┐
│▎D                        ┌──────────────────┐                                    ▎ │
│▎E                        │ Problem condition │  ← above the waterline             ▎C│
│▎T                        └─────────┬────────┘                                     ▎O│
│▎A                          ◇ HOLDS 38/42 (H1∧H2)   ← legible gate                 ▎S│
│▎I  ┌ Nozzle hot ──┐  ┌ Supplier B ─┐  ┌ New operators ┐  ← causes converge UP    ▎ │
│▎L  │ Suspected    │  │ Suspected   │  │ ⚠ no evidence  │                          ▎(handle)
│ (handle) 📊2 👁1   │  │ 📊1 💬1     │  │ [Check it]     │                          ▎ │
│   📊┘ 👁┘ 2sup·1ctr   2sup                                                          │
│   [orphan: 📊 Machine C tightest → propose / drill]                    [⌖ fit] [mini] │
│   ●NOZZLE→H1  ●SHIFT→H1  ●LOT.VISC→H2  ●SUPPLIER→H2  ●OPERATOR→H3  ○TRAINING(unused) │
└──────────────── tributary-roots · live from Process Map ─────────────────────────────┘
   supports = left (green tethers) · counts-against = right (loud) · full pool in left drawer
```

**State B — a cause selected → left detail drawer + right CoScout open (canvas stays central):**

```
┌ DETAIL (left, no-AI) ─┐        canvas (narrowed)        ┌ CoScout (right, Azure) ─┐
│ Suspected cause:      │     ┌ Problem condition ┐       │ [Coach|Evidence|Actions]│
│ Nozzle runs hot       │      ◇ HOLDS 38/42      │       │ "1 step away — try a    │
│ [Evidence|Comments|   │   ┌ Nozzle hot ◀selected┐│      │  day-shift comparison"  │
│  Activity]            │   │ 📊2 👁1 · 2sup 1ctr ││      │  [REF → H1] ··········▶ │
│ 📊 spike (supports)   │   └─────────────────────┘│      │ suggests · you decide · │
│ 👁 dripping (supports)│  📊 spike      👁 jig fine(ctr)  │ never sets status (CS-10)│
│ 👁 jig fine (counter) │  ●SHIFT→H1   ●NOZZLE→H1          │ content = CS-14          │
│ ⚠ no expert · 0 breaks│                                 └─────────────────────────┘
│ Status ▾ Suspected    │   both drawers collapse to slim handles → canvas-first
└───────────────────────┘
```

### §7.1 The job-to-be-done

Top job: **turn suspected causes into disconfirmable claims, triangulate evidence for/against each, settle which are Supported, and hand a confirmed cause + its What-If gain to Improve.** The loop: Issue → **Explore** (diverge: scan/drill → capture a Finding) ⟷ **Analyze** (converge: scope → cause → test/triangulate/try-to-break → settle status) → **Improve**; with **crossing-back** (jump to Explore carrying the scope). The surface you're on _is_ the phase; no wizard.

### §7.2 Canvas-first composition ("Miro" = the canvas owns the screen)

The lead composition principle, owner-defined: **"Miro-like" means real-estate, not aesthetics.** Measured today: the Wall is ~**30–40%** effective (box ~60–68% of the window × content-fill ~55%); target **~85%+**. Chrome inventory (relocate, don't delete): left conclusions rail → **overlay/collapse** (absorbed by the left detail drawer, §7.7); top toolbar → **one thin bar** (the Overall Problem Header _is_ the bar); view toggle → **float compact**; CoScout → **slim handle → drawer**; best-subsets/model band → **on-demand overlay**; missing-evidence digest → **collapsible thin nudge**; minimap → **small corner**; Wall content scale → **fix L-4** (§7.6). Acceptance criterion: **track "% of viewport that is canvas."**

### §7.3 Vertical convergence + legible gates

The default composition is **vertical convergence** — problem condition on top, suspected causes converging **upward** from tributary-roots at the bottom (the founding spine; also what the live Wall already does). The **gate (AND/OR/NOT) is shipped** — `GateNode` tree, `runAndCheck` → **HOLDS N/M** over the data window (`WallCanvas.tsx:871-893`), drag-to-compose `onComposeGate` — but renders today as a cryptic tiny diamond. The redesign **makes it legible** (labeled, e.g. "HOLDS 38/42 · H1 ∧ H2"). This is a VariScout-native capability a Miro board cannot do; do not flatten it away.

### §7.4 The evidence layer — findings as the connective tissue

The **Finding is the connective tissue**: factor↔cause is **Finding-mediated** (canonical, `connective-surface-model-design.md:299`). **One scope holds N findings** (a _pool_, 1:N — same `scopeId`/`context.activeFilters`); **loose/unattached findings are first-class** (the orphan lane) with explicit **next-moves**: become a cause · support/counts-against a cause · seed a drill (new flat scope) · stay as context. On-canvas rendering (already exists in `wallLayout.ts`): **attached findings = tethered chips, supports left / counter right (counter rendered loud)**; **loose findings = a compact orphan lane**; the **full pool lives in the left detail drawer** (`FindingsLog`). LOD: low zoom → counts on cards; zoom in → chips appear. **Build gap to close: wire `Finding.scopeId` as a reader** (today write-only) so findings group/show per scope.

### §7.5 Current scope — not lineage

Show the **current scope** prominently (the problem-condition anchor) + a **scope switcher** across the few flat sibling scopes. **Drop the broad→narrow lineage _trail_** as a feature (an optional inferred breadcrumb at most). Flat scopes, **no recursion** (the §3 invariant holds — this refines §3 by demoting the lineage _display_, not the model). The "how we narrowed" narrative lives in the **Report tab**, not the Wall; the Wall stays operational ("what scope am I in, what's the evidence here").

### §7.6 L-4 readable scale (verified real gap, not perception)

In-browser confirmed (showcase sample): the populated Wall renders **~0.55×** on entry and **Fit is a no-op** — two decoupled scaling layers (an auto-fit SVG `viewBox` that owns the real scale + a separate `zoom/pan` that Fit resets to the identity it already sits at, `WallCanvas.tsx:1321-1329`), plus a content bbox that spans the full ~1452px canvas height on sparse Walls (always-present scope anchor + factor/footer band). **Fix = one scaling authority** (Fit recomputes/applies the `viewBox`, _or_ make `zoom/pan` the sole scale) **+ tighten the sparse-Wall bbox** (exclude always-present far anchors). L-4's machinery shipped (PR #330) but did not deliver "readable default scale" — this initiative owns it.

### §7.7 The two CoScout states — the two-drawer model

**Two drawers (the IDE / Codex-app pattern):** **left = object detail/context** (tabs Evidence / Comments / Activity — the **deterministic, no-AI home** for the selected object; absorbs the old "Investigation conclusions" rail) · canvas in the middle · **right = CoScout** (tabs Coach / Evidence / Actions — **optional, Azure only**). Both **collapse to slim handles** (canvas-first); the common state is one-at-a-time.

- **State — CoScout closed:** both drawers as slim right/left handles; the canvas owns the screen.
- **State — CoScout open:** select a Wall object → the **left detail drawer** opens (object-scoped: the 3 evidence angles, supporting/counter clues, the stalled/in-flight activity band, comments + @mention, the analyst status select) → the **right CoScout drawer** (Azure) coaches _that object_ with **`[REF]` visual-grounding** pointing at the node on the canvas; "CoScout suggests · you decide · never sets status" (CS-10 fence; `onRefActivate` exists).

CoScout _content_ is **CS-14** (designed/built last); this session **reserves the right-drawer slot + the `[REF]` capability** (incl. the cross-tab highlight idea). This **reconciles the river spec's "single evolving narrator pane"**: team presence → top-bar avatars + object comments in the left drawer; coaching/suggestions → the right CoScout drawer. The drawer never hides required manual controls.

### §7.8 Lenses: Wall + Causes; the Map is demoted

Analyze's primary lenses = **Wall (spatial) + Causes (tabular scan)**. **Demote the Evidence Map** out of the primary toggle and **repoint the default `viewMode 'map' → 'wall'`**. The Map's everyday value is already redundant with the Wall (best-subsets via `ModelBuilderBand` — _better_, re-ranked per drilled scope; factor glyphs; main-effects via the Factor-Intelligence panel). Its unique residue is an **advanced layer** (analyst-authored `CausalLink` DAG · cross-scope overview · R²-sized nodes) — exactly what canon already demoted (`CausalLink` = "optional richer layer, not the canonical edge"; the Wall overlay is "not-now"). **Do not delete `EvidenceMapBase`** — Report's read-only timeline + PWA mobile still use it. **`CausalLink` authoring → not-now/advanced** (renders read-only in Report). **Supersede ADR-066** (stale canon: "Evidence Map owns the center / is the default").

### §7.9 Status: keep the shipped 3-state display

Keep the shipped **Suspected / Supported / Ruled out** display (`hypothesisStatusDisplay.ts`, PR #333) over the stored 5-value enum; the founding deck's "node detail" evidence bars become the **typed-evidence facts** on the card. Compose the shipped legibility surface (suspected-cause card, status ladder, activity layer, Causes matrix) — **do not rebuild it.**

### §7.10 Cross-initiative coordination (CS-15, running in parallel)

CS-15 (Process-tab framing refactor) shares two contracts: (a) **`navigateToExploreForChip.ts` is a shared handler** (Wall chips + Process-Canvas chip gestures) — the Wall redesign must edit it **additively only** (optional `predicates?` per target kind, never changing existing fields) and **rebase onto CS-15 after it merges**; (b) the **ProcessMap→Wall focal-step/tributary contract** stays stable (CS-15 test #6 locks it). The **general numeric-range predicate→Explore-filter handoff** (`between`/`gt`/`lt`) requires a `projectStore.filters` model change beyond membership — **deferred / sequenced after CS-15**, not done in parallel; the **categorical** WHERE handoff (PR #336) is safe to extend now.

## §8 The prototype slice (committed, unpushed)

`codex/analyze-wall-scope-lineage` @ `19fa7397e` (pr-ready-check green; browser smoke-checked, no console errors). **In:** `ProblemStatementScope` lineage metadata (`parentScopeId` / `sourceFindingId` / `createdFrom: explore-drill | finding-refine | manual | coscout-proposal`) + inferred-from-containment lineage; `OverallProblemHeader` + upgraded `ScopeRail` trail; Azure Analyze→Explore carries categorical scope predicates; tests. **Not in (tracked follow-ups, not half-built):** collaboration view filters (Assigned to me / Open evidence / Waiting on team / Counts-against / By scope), Story Frames mode, the general (non-categorical) predicate→filter handoff + chart mirror. **Status:** pushed as **draft PR #336** (the gh-token blocker resolved). **Disposition (resolved 2026-06-08): partially adopt, reframe the rail, demote the metadata.** The chosen direction (§7) **keeps the `OverallProblemHeader`** (it becomes the thin top bar, §7.2) and **keeps the categorical Explore handoff** (extend additively per §7.10). It **reframes the "Scope Lineage Rail" → a "current scope + switcher"** (§7.5 dropped the lineage trail). The lineage _metadata_ (`parentScopeId`/`sourceFindingId`/`createdFrom`) is **demoted to optional** (only `explore-drill` has a live writer; not load-bearing) — keep it as a low-risk additive type, but it is not a build target. The plan rebuilds from `main` and cherry-picks the header + the categorical handoff rather than merging the draft wholesale; close PR #336 once those land.

## §9 Collaboration (object-based, no new schema this pass)

Reuse `ProjectMember`, `Invitation`, `canAccess`, `FindingComment`, `Finding.assignee`, `MeasurementPlan.owner/status/dueDate`, `Hypothesis.comments`, `Finding.evidenceType`. Show on cards: owner chip on plans/assigned work · evidence-type + contributor label on findings · comments/@mentions on objects · due/status chips. Filters land as view-state (no schema): Assigned to me / Needs review / Open evidence / Counts-against / By scope. **No formal approval gates** (Sponsor read-mostly). New persisted review state = out of scope for this pass.

## §10 Non-goals

Child-scope recursion (flat scopes stay, per canon); whole-app Miro canvas (Model C rejected); CoScout setting status / concluding (CS-10); new durable Question entity; new persisted collaboration/review schema this pass; the ACH matrix (dropped, not deferred — one rival at a time).

## §11 Open questions — RESOLVED 2026-06-08

- **Concept choice** (§7) → **RESOLVED:** Concept A (one surface, modes later) via Concept B (Board-first); Story Frames cut (Report owns Sponsor narrative). See §7.
- **L-4 reality** (§6) → **RESOLVED: real gap**, verified in-browser (~0.55× + Fit no-op). Fix in §7.6 (one scaling authority + tighten sparse bbox).
- The general **predicate→Explore-filter handoff** (§5) → **RESOLVED: categorical now (extend PR #336), numeric-range deferred** — it needs a `projectStore.filters` model change and is sequenced after CS-15 (§7.10).
- **CoScout drawer vs the river "single narrator pane"** → **RESOLVED: two-drawer model** (left detail / right CoScout), §7.7. Right drawer reserves the CoScout slot; content = CS-14. Team presence → top bar + left-drawer comments.
- **Story Frames vs the Causes matrix** → **RESOLVED: moot** — Story Frames cut; the Causes matrix is the tabular scan lens, the Report tab is the narrative. §7.8.

### §11.1 Carried into the build (decided, tracked in the plan)

- Wire `Finding.scopeId` as a reader (§7.4) · supersede ADR-066 (§7.8) · the CS-15 shared-handler coordination (§7.10) · the "% viewport = canvas" acceptance metric (§7.2).
