---
title: Question-Driven EDA 2.0 — Current Understanding, Mechanism Branches, and Signal Cards
audience: [analyst, engineer, product]
category: design-spec
status: draft
related:
  [
    eda-mental-model,
    question-driven-investigation,
    investigation-wall,
    frame-process-map,
    process-flow,
    yamazumi,
    capability,
    rational-subgroups,
    measurement-trust,
    coscout,
  ]
date: 2026-04-25
---

# Question-Driven EDA 2.0

## Summary

VariScout should evolve from "charts plus investigation notes" into a system for building
process understanding.

The current methodology already has the foundation:

- Turtiainen's EDA loop: analysis planning -> data organizing -> exploratory analysis -> evaluation.
- Watson's issue-to-problem-statement sharpening.
- Factor Intelligence questions from data.
- Findings as chart snapshots.
- SuspectedCause hubs as named mechanisms.
- Investigation Wall as a visual workspace.
- FRAME Process Map as the process structure.

This spec integrates the newer Claude Design ideas into that methodology:

- `SURVEY` is not just an import step. It is a horizontal evaluator that runs whenever the analyst asks whether current data, signals, and evidence are enough.
- The user-facing investigation unit is a **Mechanism Branch**: a branch of understanding that connects a problem condition to clues, checks, suspected mechanisms, and next moves.
- The live issue-to-problem-statement artifact becomes **Current Understanding**. The Problem Statement is the approved summary of what the branches have taught, not a form completed upfront.
- Analysis modes become **instrument sets** selected by data shape and question, not primary mental models.
- Measurement trust becomes **Signal Cards** attached to important signals, clues, and branches.
- Capability stays simple: show Cp and Cpk across meaningful process moments, not a statistical-theory cockpit.

The core product promise becomes:

> VariScout helps teams move from a vague issue to actionable process understanding by cycling from Y to X to deeper x, while showing what to check next and whether the evidence is trustworthy enough to act.

## Why This Change

The existing product has multiple strong parts, but users can still experience them as separate surfaces:

- Four Lenses and drill-down in SCOUT.
- Factor Intelligence rankings.
- Findings and question tree.
- Evidence Map and Investigation Wall.
- Yamazumi, Performance, Defect, and Capability modes.
- FRAME Process Map.

The missing layer is the coherent working loop:

```text
issue -> current understanding -> problem condition -> mechanism branches -> next move
```

The thesis model already defines the EDA loop. The product should make it visible without exposing the internal data model.

## Relationship To Process Flow + Yamazumi

This spec depends on the companion design
[Process Flow + Yamazumi Integration](2026-04-25-process-flow-yamazumi-integration-design.md).

That spec defines the lean-flow level-of-detail workflow:

```text
Process Flow locates the constraint -> Yamazumi explains waste inside the selected step
```

QDE 2.0 defines how that workflow becomes part of the investigation loop:

1. Process Flow can create a clue that identifies the station, wait, or lead-time pattern worth investigating.
2. The branch next move can ask for scoped-step Yamazumi data instead of requiring full-line coverage.
3. Yamazumi can create clues about work, wait, waste, VA ratio, takt gap, and improvement opportunity.
4. The Mechanism Branch carries both levels together as one process-understanding thread.

In other words: the Process Flow + Yamazumi spec defines the instrument behavior; this spec defines how those instruments feed Current Understanding, branches, and next moves.

## Methodology Update

### Existing Thesis Loop

The thesis describes EDA as:

```text
Analysis Planning -> Data Organizing -> Exploratory Analysis -> Evaluation
```

The product version should be:

```text
Ask or select a check
-> open the right instrument set
-> brush, click, drill, or run Factor Intelligence
-> pin a clue
-> evaluate the branch
-> choose the next move
```

Each rotation either:

1. Advances the Current Understanding.
2. Rotates at the same level with another check.
3. Drills deeper from `Y` to `X` to local `x`.
4. Asks for deeper data, gemba, expert input, or measurement validation.
5. Moves a branch toward improvement.

### Y -> X -> x Progression

The investigation should visibly move through three levels:

| Level | Question                          | Typical instrument set                        | Output                          |
| ----- | --------------------------------- | --------------------------------------------- | ------------------------------- |
| Y     | What problem condition exists?    | I-Chart, Histogram, Probability, Capability   | Problem condition               |
| X     | Where does it concentrate?        | Boxplot, Pareto, Best Subsets, Process Flow   | Scoped pattern                  |
| x     | What local mechanism explains it? | Yamazumi, gemba, expert, Signal Card, details | Suspected mechanism + next move |

The user should not have to know these labels. The UI can show them as "Where are we in the learning loop?"

## Issue -> Current Understanding -> Problem Statement

Keep the issue-to-problem-statement distinction, but change how it appears.

### Issue / Concern

The issue is the seed. It can be vague:

> "Fill weight seems unstable."

This belongs in FRAME and remains editable.

### Current Understanding

Current Understanding is the live summary that changes as the investigation learns. It should be visible across SCOUT and INVESTIGATE.

Example progression:

1. "Fill weight seems unstable."
2. "Fill weight variation is concentrated on Night shift."
3. "The issue is strongest on Night shift, Heads 5-8."
4. "The branch currently points to nozzle wear plus temperature drift during Night shift."

Current Understanding is not the final problem statement. It is the team's best current read.

### Problem Condition

The problem condition is the measurable state the team is trying to explain:

- `Cpk < target`
- `Cp/Cpk window drops after a process moment`
- `Lead time > target`
- `Wait 2->3 dominates lead-time variation`
- `Station cycle time > takt`
- `Defect rate spikes`
- `Worst channel Cpk is below target`

The condition sits at the top of the Investigation Wall / roots view.

### Problem Statement

The Problem Statement is the approved outcome of the learning loop. It should form late enough to be meaningful but early enough to guide improvement.

Format:

```text
Change <measure> from <baseline> to <target> in <scope>,
because the current best mechanism branches point to <mechanism(s)>.
```

Example:

```text
Reduce fill weight variation on Line 3, Night shift, Heads 5-8,
from Cpk 0.62 to >= 1.33 by investigating nozzle wear and
temperature-control drift.
```

The system may draft this from Current Understanding and branches. The analyst approves or edits it.

## User-Facing Model

Avoid exposing the internal object list as the primary UX. Users should not have to manage findings, questions, hypotheses, evidence nodes, gates, trust, power, and comments as peer concepts.

User-facing model:

```text
Problem condition -> Clues -> Suspected mechanisms -> Next move
```

### Clue

A clue is any meaningful observation:

- A brushed I-Chart region.
- A high-variation boxplot category.
- A Pareto bar.
- A probability-plot kink.
- A Cp/Cpk process-moment drop.
- A gemba note.
- An expert comment.
- A Best Subsets suggestion.
- A Yamazumi waste segment.

Internally, most clues are `Finding` records. The user-facing label should be simpler.

### Check

A check is what to inspect next:

- "Does Shift explain variation?"
- "Which level of Shift is worst?"
- "Do Shift and Head interact?"
- "Does Station 3 cycle time drive lead time?"
- "Is waste in Station 3 real work or waiting?"
- "Can the same part be measured across devices?"

Internally, this maps to questions and question-tree nodes.

### Suspected Mechanism

A suspected mechanism is the team's explanation:

> "Night shift thermal drift increases nozzle temperature, making Heads 5-8 overfill."

Internally, this maps to a SuspectedCause hub.

### Mechanism Branch

A Mechanism Branch is the working unit in INVESTIGATE. It collects:

- The suspected mechanism.
- Supporting clues.
- Contradicting or weakening clues.
- Open checks.
- Signal Cards for relevant measurements.
- Team comments.
- Next move.
- Readiness to act.

The branch should read like:

```text
We think this mechanism may explain the problem.
Here is why.
Here is what would weaken it.
Here is what to check next.
Here is whether we know enough to act.
```

## Investigation Wall Reframing

The Investigation Wall should render branches of understanding, not raw object types.

### Desktop

Desktop can use the full Wall / roots view:

- Problem condition at the top.
- Mechanism branches below.
- Clues attached to branches.
- Natural-language condition logic between branches.
- Tributary/process-map binding in the footer or side rail.

### Tablet

Tablet keeps the graph but uses larger branch cards and touch-safe interactions:

- Tap clue -> open chart snapshot.
- Long press -> attach clue / start branch.
- Drag branch into "combine with..." only when the gesture is clear.

### Mobile

Mobile should not attempt a tiny detective wall. It should render the same graph as a card list:

- Problem condition card.
- Branch cards.
- Each branch has collapsible sections: "Why we think so", "What could weaken it", "Next move".
- Connections appear as "connects to ->" rows.

The graph is the model. The view adapts.

## Next Move

The most important UX output of a branch is the next move. This is where the EDA loop stays alive.

Next move types:

| Next move           | Meaning                         | Example                                                          |
| ------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Drill deeper        | Stay in SCOUT, narrow the data  | "Filter Night shift and inspect Heads 5-8."                      |
| Switch instrument   | Use a different instrument set  | "Open Yamazumi for Station 3."                                   |
| Collect deeper data | Add a missing data layer        | "Collect activity-level time study for Station 3 only."          |
| Gemba check         | Go inspect the physical process | "Inspect nozzle wear on Head 5-8 during Night shift."            |
| Expert check        | Ask domain knowledge            | "Ask maintenance about temperature-controller history."          |
| Measurement check   | Validate the signal             | "Run a crossed device x reference-part check, blocked by shift." |
| Disconfirm          | Try to weaken the branch        | "Compare Day shift with the same tool revision."                 |
| Improve             | Act on the branch               | "Create HMW for nozzle replacement frequency."                   |
| Verify              | Load post-action data           | "Compare Cp/Cpk process moments before and after the change."    |

CoScout can suggest next moves, but deterministic logic should produce the baseline suggestions.

## SURVEY As Horizontal Evaluator

Do not make Survey only an import-time screen. Survey is a reusable evaluator across phases.

| Phase       | Survey asks                                                          |
| ----------- | -------------------------------------------------------------------- |
| FRAME       | What does this data afford? What is missing?                         |
| SCOUT       | Which instrument sets and checks are available?                      |
| INVESTIGATE | Is this branch evidenced, trusted, powered, and disconfirmed enough? |
| IMPROVE     | What data verifies whether the action worked?                        |
| REPORT      | Which claims are backed by which signals, checks, and branches?      |

Survey has three notebooks:

1. **Possibility** — what analyses, branches, and next moves current data can support.
2. **Trust** — whether the signals are defined and credible enough.
3. **Power** — whether the data can detect the effect size the team cares about.

## Signal Cards

A Signal Card describes whether a measurement or factor can be trusted as a clue.

### Purpose

Signal Cards prevent the Wall from treating every clue as equally strong. A branch that relies on a weak or poorly defined signal should show that weakness directly.

### Content

```typescript
interface SignalCard {
  signalId: string;
  column?: string;
  label: string;
  operationalDefinition?: string;
  sourceArchetype:
    | 'handheld'
    | 'inline-sensor'
    | 'lab-drift'
    | 'destructive'
    | 'procedural'
    | 'unknown';
  trustGrade?: 'A' | 'B' | 'C' | 'D';
  powerStatus?: 'strong' | 'borderline' | 'weak' | 'unknown';
  minimumDetectableEffect?: number;
  studyStatus?: 'not-needed' | 'recommended' | 'planned' | 'complete';
  nextMeasurementMove?: string;
}
```

Final TypeScript names can change. The responsibility should not.

### Measurement Study Planner

If a signal needs validation, ask about physical reality, not statistical machinery:

1. Can the same part/sample be measured again?
2. Is the part consumed, changed, drifted, or time-locked?
3. Is there a blocking condition like shift, session, day, fixture, or device instance?
4. Is the measurer a human, device, session, or procedure?

The system can infer:

- Crossed design when the same item can be measured by every measurer/device/session.
- Nested design when items are consumed, changed, or time-locked.
- Blocking layered on top of either design.

Do not expose "Expanded" as a primary user choice. Treat blocking as a separate add-on.

### Guardrail

Do not resurrect Gage R&R as a standalone mode in this methodology. ADR-010's credibility concern still applies.

The first product step is Signal Cards and branch-level trust/power surfacing. A full measurement study planner can follow only when the statistical surface is production-grade.

## Instrument Sets, Not User Mental Models

The existing analysis modes remain useful in code. They should become instrument sets selected by the current question and data shape.

| Instrument set | Primary question                                               | Evidence language                               |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Standard       | Which factors explain variation in Y?                          | R²adj, eta-squared, chart separation            |
| Capability     | Does the process meet specs, and where does Cp/Cpk break down? | Cp, Cpk, process-moment windows                 |
| Performance    | Which channel/head/cavity is weak or drifting?                 | channel Cpk, channel distribution               |
| Defect         | Which defect or failure mode dominates, and what drives it?    | defect rate, Pareto, cross-type factor patterns |
| Yamazumi       | Where is work, wait, or waste inside the step/line?            | VA ratio, waste %, takt gap                     |
| Process Flow   | Where does lead-time, wait-time, or bottleneck loss occur?     | cycle time, wait time, lead time, output rate   |

Users should feel they are following a learning loop, not switching apps.

Example:

1. Process Flow locates Station 3 as the lead-time bottleneck.
2. Yamazumi explains Station 3's wait and waste composition.
3. Capability checks whether the same branch affects quality Y.
4. The Investigation Wall ties all of it into one Mechanism Branch.

## Cp/Cpk By Process Moment

Keep the capability idea simple.

Do not foreground Ppk, long-term capability theory, or within-sigma debates. Show Cp and Cpk for meaningful process moments.

### Process Moment

A process moment is a window where the process condition is meaningfully stable:

- lot
- shift
- tool revision
- maintenance event
- recipe/parameter state
- supplier batch
- station state
- before/after improvement stage
- bottleneck state
- user-authored event boundary

The Subgroup Builder's job becomes:

> Author process moments that turn raw measurements into process-aware Cp/Cpk evidence.

### Computation

For each process moment:

- compute Cp
- compute Cpk
- keep n visible
- mark moments with insufficient data
- group moments into stages when relevant
- compute average Cp and average Cpk across comparable moments

### Visual

A simple I-chart style display:

- Cp lane on one side.
- Cpk lane on the other.
- stage bands in the background.
- average Cp and average Cpk as reference lines.
- event boundaries as vertical markers.
- red/amber/green status from Cpk target thresholds.

Interpretation:

| Pattern          | Meaning                                | Next move                    |
| ---------------- | -------------------------------------- | ---------------------------- |
| Cp high, Cpk low | spread is acceptable, centering is off | Check centering mechanism    |
| Cp and Cpk low   | spread problem                         | Check variation mechanism    |
| one moment drops | event/state-specific issue             | Pin clue to branch           |
| stage improves   | action likely helped                   | Verify with post-action data |

This becomes a clue source for the Investigation Wall.

## Data Model Direction

This spec does not require final names, but the model should separate user-facing concepts from existing persistence objects.

### CurrentUnderstanding

```typescript
interface CurrentUnderstanding {
  issueStatement: string;
  problemCondition?: ProblemCondition;
  scopedPattern?: string;
  activeBranchIds: string[];
  draftProblemStatement?: string;
  approvedProblemStatement?: string;
  updatedAt: string;
}
```

### ProblemCondition

```typescript
interface ProblemCondition {
  metric: string;
  comparator: 'lt' | 'lte' | 'gt' | 'gte' | 'outside' | 'inside';
  target?: number | string;
  actual?: number | string;
  unit?: string;
  source: 'capability' | 'process-flow' | 'yamazumi' | 'performance' | 'defect' | 'standard';
}
```

### MechanismBranch

This can be implemented as an extension/projection of `SuspectedCause`, not necessarily a new top-level domain entity.

```typescript
interface MechanismBranch {
  id: string;
  title: string;
  mechanismDraft: string;
  problemConditionId?: string;
  clueIds: string[];
  checkIds: string[];
  signalCardIds: string[];
  conditionLogic?: BranchConditionLogic;
  nextMove?: NextMove;
  readiness: 'forming' | 'promising' | 'needs-check' | 'ready-to-act' | 'parked';
}
```

### BranchConditionLogic

Internally this can still use AND/OR/NOT. The UI should render it as natural language first.

```typescript
type BranchConditionLogic =
  | { kind: 'condition'; column: string; op: string; value: string | number }
  | { kind: 'all' | 'any' | 'not'; children: BranchConditionLogic[] };
```

### NextMove

```typescript
interface NextMove {
  kind:
    | 'drill-deeper'
    | 'switch-instrument'
    | 'collect-data'
    | 'gemba-check'
    | 'expert-check'
    | 'measurement-check'
    | 'disconfirm'
    | 'improve'
    | 'verify';
  label: string;
  rationale: string;
  suggestedInstrumentSet?: string;
  targetStepId?: string;
  targetSignalId?: string;
}
```

## CoScout Role

CoScout should support the branch loop, not replace it.

Allowed behavior:

- Suggest checks.
- Suggest next moves.
- Draft Current Understanding.
- Draft Problem Statement wording.
- Suggest branches from converging clues.
- Suggest disconfirmation moves.
- Explain trust/power warnings.

Required guardrails:

- Never claim a mechanism is confirmed before outcome verification.
- Never hide low-trust or weak-power signals.
- Quote deterministic statistics and Signal Cards rather than inventing evidence.
- Use "suspected mechanism" / "branch" / "contribution" language, not causal certainty.

## Phasing

Session continuation note: [Question-Driven EDA 2.0 — Session Handoff](../plans/2026-04-25-question-driven-eda-2-handoff.md).

### Phase 1 — Vocabulary and Current Understanding

- Rename user-facing "Problem Statement" entry to Issue / Concern where applicable.
- Add Current Understanding as the live summary across SCOUT and INVESTIGATE.
- Keep existing data model as much as possible.
- Make Problem Statement an approved output, not an upfront required form.

### Phase 2 — Branch-Based Investigation UI

- Reframe Investigation Wall around Mechanism Branch cards.
- Hide raw object-type vocabulary behind branch sections.
- Support desktop graph, tablet touch graph, and mobile branch list.
- Preserve Evidence Map as factor-centric projection.

### Phase 3 — Survey Evaluator

- Build deterministic `surveyDataAffordances()` style logic.
- Return possibility, trust, power, and next-move recommendations.
- Integrate with FRAME, SCOUT, INVESTIGATE, and IMPROVE.

### Phase 4 — Signal Cards

- Add Signal Card model and UI chip.
- Attach to key Y, X, CTQ, sensor, and process-flow signals.
- Surface trust/power on clues and branches.
- Add measurement-check next moves.

### Phase 5 — Cp/Cpk Process Moments

- Implement process-moment authoring in the Subgroup Builder.
- Compute Cp and Cpk per moment.
- Show average Cp/Cpk by stage.
- Allow a moment drop to become a clue in a Mechanism Branch.

## Non-Goals

- No standalone Gage R&R mode in this spec.
- No forced top-level `SURVEY` workspace decision yet.
- No requirement that every user build a visual wall.
- No attempt to collapse all instrument sets into one chart.
- No automatic "confirmed" mechanism without post-action verification.
- No formal causal proof language.

## Design Principles

1. **Show reasoning, not machinery.** Users work with branches of understanding; the system manages object types underneath.
2. **The chart is still the primary artifact.** Branches are useful only because they replay and organize chart/gemba/expert evidence.
3. **Every branch has a next move.** If the product cannot suggest the next move, the EDA loop has stalled.
4. **Survey travels horizontally.** Possibility, trust, and power apply before, during, and after investigation.
5. **Modes are instruments.** The analyst follows the process question, not a mode taxonomy.
6. **Cp/Cpk stays readable.** Show Cp and Cpk across process moments; avoid theory-first capability UI.
7. **Physical reality chooses the method.** Whether a measurement is crossed, nested, or blocked comes from how the process can actually be observed.
8. **Understanding can ask for new data.** Investigation is allowed to surface missing data and send the team back to collect deeper Y, X, or x data.

## Verification Strategy

### Methodology Review

Review against:

- Turtiainen (2019) EDA loop and Y -> X -> x progression.
- Watson issue/problem-statement distinction.
- VariScout Constitution principles: questions drive investigation, deterministic first, three evidence types.
- ADR-070 FRAME Process Map.
- ADR-066 Evidence Map.
- ADR-053 Question-Driven Investigation.
- ADR-010 Gage R&R guardrail.

### Product Walkthrough Tests

1. Standard/capability case:
   - Start from "Fill weight unstable."
   - Use Factor Intelligence and chart brushing.
   - Pin a Cp/Cpk process-moment drop.
   - Create a branch with next move "inspect nozzle wear."
   - Current Understanding sharpens into a Problem Statement.

2. Process Flow + Yamazumi case:
   - Process Flow finds Station 3 bottleneck.
   - Branch next move asks for scoped-step Yamazumi.
   - Yamazumi clue explains wait/waste.
   - Problem Statement uses flow metric, not capability.

3. Measurement trust case:
   - Branch relies on inline sensor.
   - Signal Card is weak or unknown.
   - Next move suggests measurement check based on physical questions.
   - Branch is not blocked, but marked "needs check."

4. Mobile case:
   - Same branch graph renders as cards.
   - User can read Current Understanding, branch why/what-next, and clue list without graph interactions.

## Open Questions

1. Should `SURVEY` remain a horizontal evaluator only, or graduate to a visible workspace after the branch model proves itself?
2. Should Current Understanding live in `ProcessContext`, `investigationStore`, or a derived selector over both?
3. Should Mechanism Branch be a new entity, or a user-facing projection of existing SuspectedCause hubs?
4. How much of Signal Card trust/power should ship before any formal measurement-study planner?
5. What minimum n should a process moment require before Cp/Cpk is shown rather than marked insufficient?
6. How should ProcessMap CTQ specs be modeled when Cp/Cpk is needed per step, not only for the overall Y?
