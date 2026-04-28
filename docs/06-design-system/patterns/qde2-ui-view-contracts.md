---
title: QDE 2.0 UI View Contracts
audience: [designer, developer, product]
category: reference
status: draft
related:
  [
    question-driven-eda-2,
    investigation-workspace,
    signal-cards,
    rational-subgroups,
    process-moment,
    measurement-trust,
    coscout,
    accessibility,
  ]
---

# QDE 2.0 UI View Contracts

Concrete view contracts extracted from the Claude Design HTML decks and
translated into VariScout's design system.

This document is not a visual style guide. It defines what each QDE 2.0 view
must contain, how it behaves, how it works without AI, and what structured
accessible view must exist beside the visual surface.

## Contract Standard

Every QDE 2.0 view must define:

- **Job**: the user decision the view supports.
- **Regions**: stable layout areas that implementation can build against.
- **Primary interactions**: the few actions the view is responsible for.
- **Deterministic baseline**: what works without CoScout.
- **CoScout layer**: what AI may suggest or explain when available.
- **Structured twin**: the list/table/card rendering required for mobile,
  keyboard, screen readers, reporting, and audit.
- **Do not ship**: deck ideas or shortcuts that would weaken the product.

Evidence warnings are advisory across all views. Use `Worth checking`,
`Use caution`, `Not enough to conclude`, `Statistically notable`, and
`Ready for next move`. Do not use p-values, missing disconfirmation, weak
power, or weak trust as hard blockers unless the user is in a regulated
workflow that explicitly requires that rule.

## Priority Order

| Priority | View contract                      | Why first                                                              |
| -------- | ---------------------------------- | ---------------------------------------------------------------------- |
| P0       | Survey Notebook Foundation         | Current phase: deterministic possibility, power, and trust evaluator   |
| P1       | Signal Card and Trust Chip         | Next phase: replaces Survey trust/power placeholders with signal facts |
| P0       | Process Moment Builder             | Turns subgrouping into process-understanding infrastructure            |
| P0       | Running Cp/Cpk Process Moment View | Makes the capability idea visible and pin-able                         |
| P1       | Investigation Wall / Roots View    | Main QDE 2.0 synthesis surface                                         |
| P2       | Measurement Study Planner          | Requires stable deterministic measurement-study calculations           |
| P2       | Discovery Canvas                   | Valuable, but depends on Process Flow maturity                         |
| P2       | Variation Tracer / Flow View       | Powerful, but requires validated attribution                           |

## 1. Survey Notebook

Current phase note (2026-04-26): Survey Foundation ships as a deterministic
core evaluator plus shared notebook UI. Signal Cards are not persisted in this
phase; Trust and Power rows remain advisory until the Signal Card phase lands.

### Job

Answer the analyst's silent question:

```text
What can I do with this data, what would I miss, and can I trust the signals?
```

### Regions

```text
Header: dataset scope, time span, row count, active process map
Tabs: Possibility | Power | Trust
Main panel: tab-specific evaluator
Right rail: unlocks, warnings, recommended next data
Footer: exportable Survey briefing
```

### Possibility Tab

Shows what the current dataset affords:

- available charts and analysis modes
- reachable factors and process nodes
- missing columns that would unlock stronger analysis
- mode suggestions such as Standard, Capability, Process Flow, Yamazumi, or
  Defect

Required language:

```text
Can do now
Can do with caution
Cannot do yet
Ask for next
```

### Power Tab

Shows what the current data could have detected:

- retrospective minimum detectable effect
- blind spots
- subgroup/window counts
- trust-adjusted warnings where measurement noise limits detection

The view must distinguish:

```text
We did not see it.
We could not have detected it.
```

Power warnings should guide practical next moves. They should not prevent the
team from taking containment or improvement action when engineering judgement
supports acting.

### Trust Tab

Shows signal-level trust:

- Signal Cards
- trust chips
- measurement archetypes
- operational definition gaps
- resolution claims

### Primary Interactions

- Open a Signal Card.
- Add or edit an operational definition.
- Mark a signal as usable/not usable for a scope.
- Accept a deterministic next-data recommendation.
- Send a Survey briefing into the Investigation Wall as context.

### Deterministic Baseline

Survey runs without AI using:

- column detection
- deterministic chart/instrument availability rules
- deterministic Signal Card fields
- power calculations when available
- missing-data rules

### CoScout Layer

CoScout may:

- explain why a chart is available or blocked
- draft a plain-language Survey briefing
- suggest the next column or gemba observation to collect

CoScout must not:

- override Signal Card state
- mark a signal trustworthy
- hide deterministic warnings

### Structured Twin

Survey must provide a table/list view:

| Section     | Required columns                                   |
| ----------- | -------------------------------------------------- |
| Possibility | instrument, status, required columns, next unlock  |
| Power       | check, current power state, blind spot, next lever |
| Trust       | signal, archetype, trust label, weak link, op-def  |

## 2. Process Moment Builder

### Job

Let the analyst author process-rational windows for Cp/Cpk and investigation
instead of relying on fixed sample sizes.

### Regions

```text
Header: selected Y, specs, data scope, trust chips
Mode tabs: Factors | Events | Manual | Rolling | Fixed-n fallback
Factor/event chip row
Event timeline lanes
Resulting process moments table
Rationale panel
Preview panel
```

### Timeline Lanes

The timeline may show:

- lot
- shift
- tool revision
- maintenance
- recipe or parameter state
- supplier batch
- process node
- user-authored event boundary

Each boundary must have a cause.

### Resulting Moment Table

Required columns:

- moment ID
- window label
- start/end
- boundary cause
- `n`
- drivers
- trust/power warnings
- Cp
- Cpk

### Primary Interactions

- Select factor/event chips to compose boundaries.
- Add manual boundary.
- Switch to rolling or fixed-n fallback.
- Open why-this-grouping rationale.
- Open preview chart.
- Pin a weak process moment as a clue.

### Deterministic Baseline

The builder must deterministically:

- compute moments from selected boundaries
- show when moments are too small
- compute Cp/Cpk only when specs and sample size permit
- preserve event IDs used by the moment

### CoScout Layer

CoScout may:

- explain the rationale
- suggest a missing event boundary
- propose a safer fallback when data is sparse

CoScout must not silently choose the grouping.

### Structured Twin

The process-moment table is the structured twin. It must support all actions
available from the timeline.

## 3. Running Cp/Cpk Process Moment View

### Job

Show how Cp and Cpk change across authored process moments and make weak
windows easy to investigate.

### Regions

```text
Top strip: Y, specs, n, active process-moment plan, trust chip
Individuals trace: raw data over sequence/time
Cp lane: one segment per process moment
Cpk lane: one segment per process moment
Stage average rail: average Cp and average Cpk when comparable
Event marker rail: boundaries and causes
Detail drawer: selected moment, stats, clues, source rows
```

### Required Behaviors

- Preserve the raw individuals trace.
- Show Cp and Cpk separately.
- Mark insufficient-data moments explicitly.
- Show average Cp/Cpk by stage only when stages are comparable.
- Clicking/focusing a segment opens the moment detail.
- Brushing a segment can create a clue for the Investigation Wall.

### Deterministic Baseline

The chart computes from deterministic stats and the authored process-moment
plan. It must not depend on CoScout.

### CoScout Layer

CoScout may:

- explain why a moment is weak
- suggest which factor to inspect next
- draft a clue from a selected segment

CoScout proposals require accept/edit/reject.

### Structured Twin

Required table:

| Moment | Stage | Boundary cause | n   | Cp  | Cpk | Trust | Power | Action |
| ------ | ----- | -------------- | --- | --- | --- | ----- | ----- | ------ |

## 4. Signal Card

### Job

Make measurement trust visible wherever a number appears.

### Regions

```text
Header: signal name, trust label, archetype
Definition: operational definition and resolution claim
Weak link: main trust limitation
Evidence: calibration, study, source, parent signals
Scope: where this signal can and cannot be used
Audit: version/hash, last edited, owner
Actions: edit op-def, open study, mark scope, add note
```

### Archetypes

- Classical measurement
- Attribute judgment
- Timestamp/event record
- Derived signal
- Manual/gemba observation

### Deterministic Baseline

The Signal Card is manually editable and deterministically evaluated. It is not
an AI summary.

### CoScout Layer

CoScout may:

- explain weak links
- draft an operational definition for user approval
- suggest which measurement study fits the archetype

CoScout must not edit the Signal Card without user confirmation.

### Structured Twin

Signal Card list:

| Signal | Archetype | Trust | Resolution | Weak link | Scope | Action |
| ------ | --------- | ----- | ---------- | --------- | ----- | ------ |

## 5. Measurement Study Planner

### Job

Help the analyst author the right measurement study from physical reality,
without forcing them to choose statistical jargon first.

### Regions

```text
Archetype row
Physical questions
Inferred structure card
Blocking factor chips
Amounts grid
Live rollup
Cost/precision curve
Why-this-structure note
```

### Physical Questions

Ask:

- Can the same item be measured again?
- Is the item consumed, changed, drifted, or time-locked?
- Is there a blocking factor such as shift, day, fixture, session, or device?
- Is the measurer a human, device, session, or procedure?

Infer:

- crossed design when every measurer can see every item
- nested design when items are consumed, changed, or time-locked
- blocking layered on either design

Do not expose "Expanded" as a primary structure. It is a blocking factor layer.

### Deterministic Baseline

The planner must work as a manual study authoring UI before any AI explanation
or automation.

### CoScout Layer

CoScout may:

- explain the inferred structure
- point out a likely blocker
- draft a study plan for review

### Structured Twin

Study plan table:

| Factor | Count | Role | Blocking? | Run impact | Note |
| ------ | ----- | ---- | --------- | ---------- | ---- |

## 6. Investigation Wall / Roots View

### Job

Help the team build process understanding by connecting a problem condition to
clues, suspected mechanisms, missing checks, and next moves.

### Regions

```text
Header: Current Understanding, problem condition, scope
Workspace: visual roots/canvas, generic branch list, or process-map branch map
Branch cards: suspected mechanisms
Clue tray: pinned chart/gemba/expert/process clues
Gate layer: AND/OR/NOT mechanism conditions
Side rail: selected branch detail, comments, Signal Cards, next moves
Toolbar: add branch, add clue, run gate check, switch structured view
```

### Process-Map Context

The Branch UI must not require a process map. With only an issue, current
understanding, problem condition, and `SuspectedCause` hubs, the workspace
renders branch cards in a generic spatial/list layout. A process map adds
tributary grouping, scope chips, and process-node context when available.

### Primary Interactions

- Pin a chart selection as a clue.
- Attach a clue to a branch.
- Mark a clue as support or counter-evidence.
- Create a branch manually.
- Add a missing check.
- Run a deterministic gate check.
- Promote a next move to IMPROVE when ready.

### Deterministic Baseline

The Wall works without AI:

- branch cards are user-authored
- clues come from charts, gemba, expert input, and deterministic analyses
- missing checks can be rule-based
- gate checks are deterministic filters

### CoScout Layer

CoScout may:

- suggest a branch
- suggest where a clue belongs
- suggest disconfirmation
- draft branch summaries
- explain gate results

Every suggestion is a proposal card with accept/edit/reject/why controls.

### Advisory Evidence Behavior

The Wall should surface weak evidence as coaching:

- `Worth checking`: no gemba clue or counter-check yet.
- `Use caution`: weak signal trust, weak power, or small `n`.
- `Statistically notable`: p-value-driven pattern, still needs effect size and
  process context.
- `Ready for next move`: enough practical confidence to act.

Do not block a branch only because one evidence type is missing.

### Structured Twin

Branch list:

```text
Problem condition
Branch
Supporting clues
Counter-clues
Gate logic
Signal warnings
Missing checks
Next move
Comments
```

This is the required phone, screen-reader, and report foundation.

## 7. Evidence Map Home

### Job

Show the investigation as the product artifact: what is known, what is weak,
what is missing, and where the team should work next.

### Regions

```text
Phase rail
Evidence density summary
Map/list/timeline tabs
Node workspace
Selected node detail
CoScout or deterministic next-action rail
```

### Keep

- evidence density visible at a glance
- mixed evidence types: data, gemba, expert
- triangulation status
- open question and next action visibility

### Change For QDE 2.0

Use QDE vocabulary:

- Clue instead of generic evidence node
- Mechanism Branch instead of claim/hypothesis as the main object
- Next move instead of AI task as the call to action

### Structured Twin

Evidence list grouped by branch and phase.

## 8. Discovery Canvas

### Job

Use loaded logs and timestamped data to propose process structure before the
user draws a map manually.

### Regions

```text
Data sources panel
Fingerprints: rows, time span, event types, detected columns
Inferred process graph
Heatmap overlay: frequency, dwell, flow metric, capability when relevant
Ontology/process-map proposal panel
Accept/modify/reject controls
```

### Implementation Stance

Discovery Canvas is not required for the first QDE 2.0 implementation. It
belongs with Process Flow maturity.

### Deterministic Baseline

Use deterministic detection and proposal confidence. CoScout can explain
proposals but cannot be the only inference path.

### Structured Twin

Tables:

- source fingerprints
- inferred activities/stations
- inferred edges/waits
- proposed process-map bindings

## 9. Variation Tracer / Flow View

### Job

Let the analyst click a weak window or spike and walk upstream through likely
process contributors.

### Regions

```text
Selected problem window
Process/river projection
Ranked tributary contributors
Linked source charts
Activity or process-node detail
Next-move proposal
Model confidence and limits
```

### Required Guardrail

This view must not imply causal proof from visual width. It can show ranked
contributors only when the attribution method is deterministic, explainable,
and labeled.

Required label:

```text
Contribution model: <method>. This ranks candidates; it does not confirm root cause.
```

### Structured Twin

Contributor table:

| Contributor | Process node | Metric | Method | Confidence/limits | Action |
| ----------- | ------------ | ------ | ------ | ----------------- | ------ |

## 10. CoScout Proposal Rail

### Job

Give CoScout a consistent place to suggest without taking control.

### Regions

```text
Proposal title
Proposed action
Evidence/context used
Affected object
Why this matters
Controls: Accept | Edit | Reject | Why?
```

### Rules

- Proposal cards are optional.
- The manual path must be visible without them.
- Accepted proposals write deterministic/user-confirmed state.
- Rejected proposals are logged only if product analytics/audit requires it.
- "Why?" must show cited chart/finding/signal/process context, not generic AI
  reasoning.

## Design Tokens And Styling

Use VariScout's design system:

- semantic surface/content/border classes
- existing chart colors for data status
- non-color labels for all states
- existing panel/drawer behavior
- existing focus-visible conventions

Do not import deck-specific styling wholesale:

- paper deck background
- detective-wall dark mood as default
- decorative river effects without semantic value
- color-only evidence state

## Implementation Checklist

Before implementing any QDE 2.0 view:

- [ ] Identify the view contract used.
- [ ] Build the deterministic/manual path first.
- [ ] Define the structured twin.
- [ ] Add keyboard/menu equivalents for drag or canvas actions.
- [ ] Add CoScout only as proposal/explanation.
- [ ] Include Signal Card/trust/power hooks where a signal is shown.
- [ ] Verify report/audit representation for any state the user can act on.
