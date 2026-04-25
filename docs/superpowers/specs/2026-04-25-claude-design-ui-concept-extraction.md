---
title: Claude Design UI Concept Extraction
audience: [designer, engineer, product]
category: design-spec
status: draft
related:
  [
    design-system,
    question-driven-eda-2,
    investigation-wall,
    rational-subgroups,
    measurement-trust,
    signal-cards,
    process-flow,
    yamazumi,
    coscout,
    accessibility,
  ]
date: 2026-04-25
---

# Claude Design UI Concept Extraction

## Summary

The Claude Design standalone HTML decks are valuable source material, but they
are not product specifications. VariScout should extract the strongest
interaction models from those decks and translate them into the current
methodology, design system, accessibility rules, and AI principles.

This spec is the bridge.

Use the decks as concept evidence. Use VariScout's docs, ADRs, stores, and
design system as the implementation authority.

## Extraction Rule

Only promote a deck idea when it satisfies all five conditions:

1. It advances the QDE 2.0 loop from issue to Current Understanding to
   Mechanism Branches.
2. It works without CoScout or any AI endpoint.
3. It can be rendered as an accessible structured view, not only as a canvas.
4. It preserves deterministic statistics as the source of truth.
5. It fits the existing package/store architecture without creating a new
   parallel workspace model.

## Source Decks Reviewed

The source files currently live under `docs/06-design-system/claude desing/`.
They are treated as raw design inputs until intentionally committed or
summarized elsewhere.

| Deck                   | Best source for                                            | Extraction stance                                 |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Rational Subgroups     | Subgroup Builder, process moments, running Cp/Cpk strip    | Promote to near-term QDE 2.0 implementation input |
| Measurement Trust      | Signal Cards, Survey notebook, trust/power chips           | Promote as design-system/component input          |
| Investigation on River | Investigation Wall, roots view, evidence status, mobile UX | Promote with simplified QDE 2.0 vocabulary        |
| Finlandia              | Discovery Canvas, Process Canvas, Tracer, agent tool layer | Keep as medium-term architecture/design reference |
| VariScout Concepts     | Subgroup Studio, Evidence Map home, Constructal Flow view  | Extract selectively; avoid deck-driven scope      |

## Concepts To Keep

### Subgroup Builder / Studio

Keep:

- Factor chips that compose process moments.
- Mode tabs: Factors, Events, Manual, Rolling or equivalent.
- Operational event timeline where lot, shift, tool revision, maintenance,
  recipe, and process events form boundaries.
- Resulting subgroup table with window, `n`, and drivers.
- Rationale panel explaining why the grouping is process-rational.
- Fixed-n fallback clearly labeled as a fallback, not the preferred method.
- Live recompute of Cp/Cpk as boundaries change.
- "One event, three views": the same operational event appears in the Process
  Map, Subgroup Builder timeline, and Cp/Cpk strip.

Change for repo context:

- Use "process moment" as the user-facing concept, not "subgroup" everywhere.
- Show Cp and Cpk only for this workflow unless a later spec reintroduces Ppk.
- Bind process moments to existing process-map events and investigation
  findings instead of introducing a separate deck-specific event model.

Implementation landing:

- QDE 2.0 Phase 5: Cp/Cpk process moments in Subgroup Builder / capability
  view.
- Design system: process-moment strip and event timeline accessibility.

### Measurement Trust

Keep:

- Survey notebook with Possibility, Power, and Trust as related tabs.
- Signal Card as the single object users can inspect when a number appears.
- Trust chip shown on charts, factor tiles, branch cards, and report rows.
- Retrospective power language: "what this dataset could have caught."
- Prospective power language: "how much more, of what, to catch the effect."
- Measurement archetypes: classical, attribute, timestamp, derived.
- Physical-question study planner: reusable item, destructive/time-locked
  measurement, blocking factor, measurer role.
- Study authoring before study reading.

Change for repo context:

- Trust and power are deterministic assessment surfaces first. CoScout can
  explain or suggest, but cannot be required to use them.
- The first implementation should not resurrect Gage R&R as a top-level mode.
  Start with Signal Cards and chips, then add study planning when the
  deterministic statistics are ready.
- Use a letter/label plus card details, not color-only scoring.

Implementation landing:

- QDE 2.0 Phase 4: Signal Cards foundation.
- Design system: Signal Card, Trust Chip, Power Chip, AI-independent proposal
  pattern.

### Investigation Wall / Roots View

Keep:

- Problem condition at the top.
- Mechanism branches below, converging toward the problem condition.
- Clues attached to branches.
- Support and counter-evidence visible in the same workspace.
- AND/OR/NOT gates as explicit mechanism conditions.
- Missing-evidence prompts, especially missing disconfirmation.
- Team comments, gemba notes, photos, and expert input as first-class clues.
- CoScout suggestions as proposals, not direct mutations.
- Mobile fallback as a card/list rendering of the same graph.

Change for repo context:

- Do not expose raw object types as the main UX. Use:

```text
Problem condition -> Clues -> Suspected mechanisms -> Next move
```

- Keep `investigationStore` and existing investigation concepts as the source
  of truth. The Wall is a projection, not a new data model.
- Replace "confirmed" language with stricter readiness wording unless there is
  post-action verification. Mechanisms can be proposed, evidenced,
  challenged, or ready for action.

Implementation landing:

- QDE 2.0 Phase 2: Branch-based Investigation UI projection.
- Design system: Investigation Workspace pattern and alternate structured view
  accessibility.

### Discovery / Flow / Tracer Concepts

Keep:

- Discovery Canvas principle: data can propose process structure.
- Process Flow locates the constraint; Yamazumi explains waste inside the
  selected step.
- Tracer principle: click a problem window and walk upstream through process
  tributaries.
- CoScout next-move proposal with accept/edit/reject.

Change for repo context:

- Treat Discovery Canvas as a medium-term Process Flow enhancement, not a QDE
  2.0 blocking dependency.
- Avoid variance-flow diagrams unless the attribution model is deterministic,
  explainable, and validated. Constructal/river visuals are powerful but can
  mislead if the model is weak.

Implementation landing:

- Process Flow + Yamazumi integration spec.
- Future Process Flow discovery implementation.

## Concepts To Reject Or Defer

| Concept                                      | Decision | Reason                                                             |
| -------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Canvas-only Investigation Wall               | Reject   | Fails mobile, keyboard, and screen-reader requirements             |
| AI-authored branches or root causes          | Reject   | Violates deterministic authority and human confirmation principles |
| Standalone Gage R&R mode                     | Reject   | ADR-010 credibility concern remains valid                          |
| Full ontology engine as QDE 2.0 prerequisite | Defer    | Too large; use existing ProcessMap and stores first                |
| Constructal flow as causal proof             | Reject   | Useful metaphor, not proof without validated attribution           |
| Color-only trust/evidence states             | Reject   | Fails accessibility and auditability                               |

## Product Design Principles Extracted

### 1. Same Graph, Multiple Projections

The product should let the same underlying investigation/process structure
appear as different views:

- river/process map in FRAME
- event timeline in Subgroup Builder
- Cp/Cpk strip in Capability
- roots/branch view in INVESTIGATE
- report/audit table in REPORT

Editing the source object once should update every projection.

### 2. Every Visual Has A Structured Twin

Any graph, wall, river, root, or timeline must have a list/table/card rendering
that preserves meaning:

- nodes
- links
- support/refute semantics
- gates
- status
- next moves
- trust/power chips

The structured twin is not a degraded fallback. It is the accessibility,
mobile, audit, and report foundation.

### 3. AI Is A Layer, Not A Path

CoScout can:

- suggest a next check
- draft a branch summary
- explain why a signal is weak
- propose a missing disconfirmation
- search knowledge and cite sources

CoScout must not be required to:

- create the branch
- confirm a mechanism
- compute the statistic
- decide the process moment
- make the flow valid

The manual/deterministic path must be complete.

### 4. Cards Beat Settings Screens

The best deck ideas avoid abstract configuration. They make methodology visible
through cards and chips:

- Signal Card
- process moment chip
- trust/power chip
- branch card
- missing-evidence prompt
- next-move proposal

This should guide implementation. If a concept only exists as settings, it is
not productized yet.

## Design-System Work Required

This extraction creates three design-system requirements:

1. Add an Investigation Workspace pattern for canvas/list dual rendering.
2. Add Signal/Branch component guidance for chips, cards, gates, and proposals.
3. Extend accessibility rules from chart fallback tables to alternate
   structured views for graph-like workspaces.
4. Add QDE 2.0 UI view contracts that preserve concrete view anatomy from the
   decks while translating it into VariScout's design system.

Design-system outputs:

- [Investigation Workspace Pattern](../../06-design-system/patterns/investigation-workspaces.md)
- [Signal And Branch Components](../../06-design-system/components/signal-branch-components.md)
- [QDE 2.0 UI View Contracts](../../06-design-system/patterns/qde2-ui-view-contracts.md)

## Implementation Plan Inputs

The QDE 2.0 implementation plan should include a preliminary design-system
slice before product UI work:

1. Document the new workspace and component patterns.
2. Add component contracts for Signal Cards, branch cards, evidence chips, and
   process-moment strips.
3. Then implement the first product slice against those contracts.

This prevents the first QDE 2.0 PR from inventing one-off UI language.
