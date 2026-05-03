---
title: 'ADR-076: FRAME b0 lightweight render — investigator vs author archetypes'
audience: [product, designer, engineer, analyst]
category: architecture
status: accepted
date: 2026-05-02
related:
  - adr-070-frame-workspace
  - adr-074-scout-level-spanning-surface-boundary-policy
  - adr-053-question-driven-investigation
  - frame-process-map-design
  - investigation-scope-and-drill-semantics-design
---

# ADR-076: FRAME b0 lightweight render — investigator vs author archetypes

**Status**: Accepted

**Date**: 2026-05-02

**Supersedes**: None (refines ADR-070 for the b0 case)

**Related**:
[ADR-070](adr-070-frame-workspace.md) (FRAME workspace, river-styled SIPOC canvas — owner of the b1/b2 surface),
[ADR-074](adr-074-scout-level-spanning-surface-boundary-policy.md) (level-spanning boundary policy — FRAME owns L2 authoring at b1+; b0 is pre-authoring),
[ADR-053](adr-053-question-driven-investigation.md) (question-driven investigation — b0 is the answer to "I have a CSV and a question, no map yet"),
[FRAME Workspace & Process Map](../superpowers/specs/2026-04-18-frame-process-map-design.md) (the design ADR-070 enacts; b0 is the "data-less / pre-mapping" entry the spec acknowledges),
[Investigation Scope & Drill Semantics](../superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) (b0/b1/b2 scope taxonomy that this ADR's render strategy specializes on)

---

## Context

ADR-070 promoted FRAME to a first-class workspace tab and standardized its surface as a **river-styled SIPOC authoring canvas**. That canvas is the right primitive for an analyst who already has a process model — they place column chips on map nodes, name steps, sketch tributaries, set CTQ specs per step. The Investigation Scope & Drill Semantics design (2026-04-29) names this case **b1** (multi-step) or **b2** (single-step deep dive).

The canvas is the wrong primitive for the **b0** case — an investigator who has a CSV and a question, but no process model. They are not authoring a process map; they need to pick a Y to investigate and (optionally) some Xs that might be affecting it. Asking them to first sketch a SIPOC diagram before they can look at their data is friction the question doesn't justify.

Two prospect walks plus the FRAME b0 chrome reviews surfaced concrete failure modes when the river-styled canvas served the b0 case:

- The empty river ("no steps yet, drag a process step here") communicated that authoring is required before analysis is possible. Investigators with a one-shot dataset bounced.
- The `GapStrip` warning bar on the canvas listed methodology gaps (no CTQ on steps, no time axis, no spec limits) the user had no model to even attach those to. The warnings were technically correct and pragmatically wrong — they framed a not-yet-authored map as a broken map.
- MBB jargon (CTS, CTQ, tributary, Y, X) on the empty canvas read as ceremonial. There was no reading to anchor the terms to.
- Specs (USL/LSL/target/cpkTarget) were authored only via the per-step `SpecEditor` on a step card. With no steps, there was no surface to author a single global spec for the Y the user was about to investigate.

These are not bugs in the canvas — they are misuses of the canvas for a population it was not designed for. The two populations need two render strategies.

## Decision

**FRAME branches on scope.** `detectScopeFromMap(map)` returns `'b0'` when `map.nodes.length === 0`, `'b2'` when length is 1, and `'b1'` otherwise. The b0 case renders a **lightweight Y/X picker** via `<FrameViewB0 />`. The b1/b2 case renders the existing river-styled SIPOC canvas (ADR-070 unchanged). PWA + Azure FrameView dispatch on this scope.

### 1. Two archetypes, one workspace

- **Investigator (b0)** — has a CSV and a question; has not modeled the process. FRAME b0 surface is a Y picker, an X picker, an optional inline spec editor, and a "See the data →" CTA. Adding the first process step in the disclosure expander auto-promotes the user to b2 (then b1 once a second step is added); the canvas takes over from that point.
- **Author (b1/b2)** — has (or is building) a process model. FRAME continues to render the river-styled SIPOC canvas exactly as ADR-070 specifies, with all step cards, tributaries, CTS/CTQ specs, and the gap detector intact.

The two archetypes share the same workspace tab, the same Zustand stores, the same downstream Analysis tab, and the same investigation graph. Only the FRAME render strategy differs.

### 2. b0 surface = lightweight Y/X picker

The b0 composition (`packages/ui/src/components/FrameViewB0/`) stacks:

1. `<YPickerSection />` — column chips ranked by `rankYCandidates`. The user clicks a chip to select Y. A `+ add spec` affordance on the selected chip opens the inline spec editor.
2. `<InlineSpecEditor />` — a popover-style editor anchored under the Y row. Edits USL / LSL / target / cpkTarget for the selected Y. Suggestion seeded from `mean ± 3σ` of the column's data; user confirms or overrides.
3. `<XPickerSection />` — appears only after a Y is selected. Column chips for plausible Xs (excludes Y itself and the auto-detected run-order column). Multi-select.
4. `<ProcessStepsExpander />` — a disclosure that, when opened, embeds the existing `LayeredProcessViewWithCapability` canvas (with `showGaps={false}` — see §4). Adding the first step here flips the scope to b2 and the canvas takes over the surface on the next render.
5. `<SeeTheDataCta />` — primary CTA to advance to the Analysis tab. Disabled until a Y is picked; hint copy explains why.

Each chip primitive is `<ColumnCandidateChip />` — a single component for both Y and X surfaces; only the selected-state styling and the `onSelect` semantics differ.

### 3. No auto-pick, ever

`rankYCandidates` orders the chip set so the most likely Y lands first under the user's eye. It **never** auto-selects, never preassigns CTS, never pre-fills the spec editor with a "best guess." The heuristic exists so the user's first eye-fixation is informed, not so the system makes their methodology decision for them.

The ranker uses 16 case-insensitive name patterns (`%`, `pct`, `percent`, `rate`, `yield`, `defect`, `output`, `result`, `content`, `weight`, `length`, `width`, `thickness`, `diameter`, `quality`, `score`) plus a rich-variation bonus (≥30 distinct values) on top of a base score, capped so a column with one strong signal still outranks a column with many weak signals. Time-like and id-like name patterns are hard-excluded from the candidate set.

### 4. No upfront warnings — `showGaps={false}` in b0

`GapStrip` (ADR-070's gap detector) is suppressed in b0 by passing `showGaps={false}` through `LayeredProcessViewWithCapability`. The b0 user has not authored a map — they have nothing for the gap detector to validate against. Listing methodology gaps before there is methodology to gap against frames the surface as broken; the b0 user reads that as "this isn't for me."

Specs are handled differently. The b0 user authors a single spec for the Y they're investigating, via the `+ add spec` affordance on the Y chip, opening the inline editor. Per-step CTQ specs do not exist in b0 (there are no steps). The moment the user adds a process step in the expander, scope flips to b2 and the canvas + per-step `SpecEditor` + `GapStrip` all light up.

### 5. Plain language; MBB jargon as parenthetical hint chips only

b0 prompts are verb-first and jargon-free at the headline level:

- "What do you want to investigate?" (Y picker headline)
- "What might be affecting it?" (X picker headline, only after Y selected)
- "+ add spec" (affordance copy on the Y chip)
- "See the data →" (primary CTA)

MBB terms (CTS, CTQ, Y, X, tributary) appear only as small parenthetical hint chips next to the main copy, for users who already know the vocabulary. The methodology is not hidden — it's surfaced as a hint, not as a prerequisite.

This is consistent with the "no 'gates' language" decision in `docs/decision-log.md` Replayed Decisions: scaffolding, not ceremony.

### 6. `detectScopeFromMap(map)` is the dispatch point

`packages/core/src/scopeDetection.ts` exports `detectScopeFromMap`, mirroring the existing `detectScope(investigation)` helper. The map-based variant is what FrameView calls — at FRAME entry there's a `processMap` but no `nodeMappings` yet, so scope must be derived from the structural shape of the map (`nodes.length`).

The contract:

```ts
detectScopeFromMap({ nodes: [] })          // → 'b0'
detectScopeFromMap({ nodes: [oneStep] })   // → 'b2'
detectScopeFromMap({ nodes: [a, b, ...] }) // → 'b1'
detectScopeFromMap(undefined | null)        // → 'b0'  (no map yet = b0)
```

PWA `FrameView` and Azure `FrameView` both branch on this single helper. The investigator vs author dispatch is one structural call, not an app-level prop.

## Rationale

Three reasons this is right:

1. **Two populations, two surfaces.** The river-styled canvas is the right primitive for an analyst who has a process model and is encoding it. It is the wrong primitive for an investigator who has a CSV and a question. Forcing the second population through the first surface is what the prospect walks repeatedly surfaced as friction. ADR-070 didn't get this wrong — it owned the b1+ case, which is where the canvas excels. ADR-076 owns the b0 case, which is where a different shape is needed.

2. **Render strategy, not data-model fork.** The b0 user's data flows through the same parser, lands in the same `processMap` skeleton (just with `nodes: []`), and feeds the same downstream Analysis tab. Only the FRAME render branches. Adding the first step in the b0 expander is a smooth transition into b2 — no migration, no reload, the same map shape just gains a node and the canvas takes over the next render. This is consistent with ADR-074's lensing model: surfaces own their primary view, but they share a single underlying data model.

3. **Methodology surfaces appear when they have something to attach to.** The gap detector is right at b1+ (the user authored a map; gaps relative to that map are real). It is wrong at b0 (no map; no methodology to gap against). The CTQ-per-step editor is right at b1+ (steps exist; per-step quality requirements have a place to live). It is wrong at b0 (no steps). The inline single-spec editor is right at b0 (one Y, one optional spec for that Y). Each surface lights up when its precondition holds, instead of demanding the user satisfy the precondition first.

The ranking heuristic (`rankYCandidates`) deserves its own note: it is **ordering**, not **selection**. The Constitution's `Deterministic first, AI enhances` (P8) and the `model informs, analyst estimates` feedback rule both apply — the heuristic informs the user's first glance; the user makes the methodology call. Auto-selecting CTS or pre-filling the spec editor would be the system making methodology decisions on the user's behalf.

## Consequences

### Easier

- The b0 entry stops feeling like an authoring tool the user doesn't need. Investigators with a one-shot CSV reach the Analysis tab without sketching a process map first.
- The transition b0 → b2 → b1 is structural and seamless. Adding the first step in the expander auto-promotes scope; the canvas takes over the surface on the next render. No "leave b0 mode" toggle exists or is needed.
- Specs can be authored in b0 without per-step ceremony. The single global spec for the Y is editable inline; the value carries forward into b1+ as the CTS column's `measureSpecs` entry when the user adds steps.
- Plain-language headlines reduce the methodology-vocabulary onramp. MBB jargon stays available as hint chips for users who want it.
- `detectScopeFromMap` is a single dispatch point — adding a future render strategy (b3, hypothetical hub-of-hubs) extends the same switch.

### Harder

- FRAME now has two render strategies that must stay coherent. Component-level refactors (theming, accessibility, telemetry) need to land on both paths; the integration tests for FrameView must cover both branches.
- The `showGaps={false}` passthrough adds a prop to `ProcessMapBase` / `LayeredProcessViewWithCapability` that has exactly one current consumer (FrameViewB0). Future changes to the gap detector must remember the opt-out exists.
- The Y-ranking heuristic is name-pattern-driven. Customer terminology drift (multilingual columns, domain-specific abbreviations) will surface as misranks; the cap on the bonus prevents single-pattern monoculture but doesn't help if no patterns match. Telemetry on the user's actual selection vs the rank-1 candidate is a fast-follow.
- Two prospect populations means two narratives to keep aligned in user-facing docs (`docs/USER-JOURNEYS.md`, OVERVIEW). Drift between the b0 and b1+ stories will read as architectural confusion.

### Neutral

- ADR-070's authoring canvas is unchanged. The b1/b2 user lands on exactly the same surface as before.
- Downstream Analysis, Investigation, and Improvement workspaces are untouched — the investigation graph and stores are scope-agnostic at those layers.
- The `processMap` schema is unchanged. b0 just produces a map with `nodes: []`; b1+ produces the same shape with one or more nodes. No persistence migration.
- ADR-074's level-spanning boundary policy applies unchanged. FRAME b0 owns the lightweight investigator entry; FRAME b1/b2 owns L2 authoring; SCOUT owns L1 reading; etc.

## Alternatives considered

- **Render the canvas everywhere with a "skip authoring" CTA on top.** Rejected. The canvas frames itself as the surface — adding an escape hatch reads as "the right thing is to author; if you must, here's the back door." The b0 population is not a deviation, it's a peer.
- **Auto-pick the highest-ranked Y on entry and let the user override.** Rejected per the "no auto-pick" principle. Auto-selection of a methodology decision (which column is the outcome) is the system encoding a guess as a default; the user reads it as "the system told me this is Y" and the methodology decision becomes invisible. The Constitution's `model informs, analyst estimates` rule makes this an out-of-bounds default.
- **Suppress GapStrip globally instead of via prop.** Rejected. The gap detector is correct and useful at b1+. The fix is to have the surface decide whether to show it (b0 says no; b1+ says yes) rather than the detector self-disable based on map shape. Keeps ownership clean.
- **Replace the canvas with the lightweight picker entirely (deprecate ADR-070's surface).** Rejected. The canvas is the right primitive for the author archetype, who is a real and load-bearing user. The b0 picker is not "a better FRAME"; it's a different FRAME for a different population. Both stay.

## Implementation

Delivered across the `feature/full-vision-frame-b0` branch in 11 sub-tasks (W3-1..W3-9 + W3-8 wiring across PWA + Azure):

- **W3-1** — Plain-language i18n relabeling (verb-first headlines + parenthetical hint chips for MBB terms).
- **W3-2** — `<ColumnCandidateChip />` primitive at `packages/ui/src/components/ColumnCandidateChip/`.
- **W3-3** — `<YPickerSection />` + `rankYCandidates` heuristic at `packages/core/src/parser/yLikelihood.ts`.
- **W3-4** — `<XPickerSection />` (post-Y, multi-select, run-order column hidden).
- **W3-5** — `<InlineSpecEditor />` popover + `showGaps` opt-out wired through `ProcessMapBase`.
- **W3-6** — `<ProcessStepsExpander />` disclosure for the embedded canvas.
- **W3-7** — `<SeeTheDataCta />` primary CTA.
- **W3-8 prep** — `detectScopeFromMap` helper at `packages/core/src/scopeDetection.ts`; `showGaps` passthrough to `LayeredProcessView`; `frame.b0.seeData.pickYHint` i18n key.
- **W3-8** — `<FrameViewB0 />` composition + scope-branched FrameView dispatch in PWA (`apps/pwa/src/components/FrameView.tsx`) and Azure (`apps/azure/src/components/editor/FrameView.tsx`).
- **W3-9** — Happy-path PWA integration coverage and per-component RTL tests across all seven new components.

Commits on the branch (chronological): `3e2501c1`, `4b421a9e`, `8d75001f`, `7ef5f135`, `a64006b9`, `407459ec`, `622c73b0`, `48488ffe`, `8f0fb66d`, `cb97714a`, `8b780b7e`, `f9a64c53`, `7ba4848f`, `78e90406`, `430bea57`, `63946347`, `d058361d`, `753d90ac`, `0baa9c3f`, `f45ce46c`. Plan reference: `~/.claude/plans/what-is-the-new-squishy-aho.md` (Workstream 3).

## Verification

Structural and behavioral checks (mirroring ADR-074's verification pattern):

- `rg "auto.?select|preassign|autoFill" packages/ui/src/components/FrameViewB0/ packages/ui/src/components/YPickerSection/ packages/ui/src/components/XPickerSection/` returns zero hits — no auto-selection in any b0 component.
- `rg "GapStrip|showGaps={true}" packages/ui/src/components/FrameViewB0/` returns zero hits — `GapStrip` not embedded, and no place opts it back in. The `showGaps={false}` literal in `FrameViewB0.tsx` enforces the policy.
- `rg "detectScopeFromMap" apps/pwa/src/components/FrameView.tsx apps/azure/src/components/editor/FrameView.tsx` confirms both apps dispatch on the same helper.
- `pnpm --filter @variscout/core test src/parser/__tests__/yLikelihood` covers the ranker's plausibility filter, name-pattern bonus cap, variation bonus, and tie-breaking.
- `pnpm --filter @variscout/ui test src/components/{FrameViewB0,YPickerSection,XPickerSection,InlineSpecEditor,ProcessStepsExpander,SeeTheDataCta,ColumnCandidateChip}/__tests__` covers each composition unit.
- Happy-path integration tests in `apps/pwa/src/__tests__/` exercise the b0 → "See the data" flow end-to-end.

## Status

Accepted (2026-05-02). Companion to ADR-070 (which remains canonical for the b1/b2 authoring canvas). FRAME branches on scope at every entry; the two archetypes share one workspace, two render strategies.

## Supersedes / superseded by

- Supersedes: none (refines ADR-070 for the b0 case without overriding it).
- Superseded by: none (active).
- Related: ADR-070 (FRAME workspace + canvas — the b1/b2 owner), ADR-074 (level-spanning boundary policy — unchanged at FRAME-as-L2-authoring; b0 is pre-authoring), ADR-053 (question-driven investigation — b0 is the "I have a question and a CSV" entry shape).
