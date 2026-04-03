---
title: 'Investigation Workspace Reframing — Problem Statement, Suspected Causes, and the EDA Spine'
audience: [analyst, engineer]
category: architecture
status: draft
related:
  [
    investigation,
    eda-mental-model,
    question-driven,
    suspected-cause,
    problem-statement,
    improvement,
  ]
---

# Investigation Workspace Reframing

Three foundational insights that reshape how the Investigation workspace should work — grounded in Turtiainen (2019), validated against the current implementation, and designed to close the gap between evidence collection and synthesis.

---

## Context

The Investigation workspace currently handles evidence collection well — questions, findings, status tracking, and cause role marking all function. But a systematic evaluation revealed three structural misalignments between the EDA mental model's design intent and the current UX:

1. The Problem Statement forms too late (waits for suspected causes, when it should form at SCOUT Loop 1)
2. The investigation diamond is framed as "forming the Problem Statement" when it should be "discovering the WHY"
3. Suspected causes are flat tags on individual questions when they should be connected hubs expressing a mechanism

These aren't implementation bugs — they're conceptual reframings that change how the workspace guides the analyst's thinking.

---

## Insight 1: Problem Statement Forms Early

### Watson's 3 Questions

The Problem Statement answers three questions (Watson 2015, Turtiainen 2019 §2.1):

| Question           | What It Asks       | When Answerable                                    |
| ------------------ | ------------------ | -------------------------------------------------- |
| Q1: What measure?  | The Y column       | **FRAME** — analyst selects the measure column     |
| Q2: How to change? | Direction + target | **FRAME** — deterministic from characteristic type |
| Q3: Where?         | Scope / location   | **SCOUT Loop 1** — first significant factor        |

### Q2 Is Deterministic

The direction of change maps directly from the characteristic type, which is already inferred from specification limits:

| Characteristic Type | Inferred From          | Direction                           | Example                 |
| ------------------- | ---------------------- | ----------------------------------- | ----------------------- |
| `nominal`           | Both USL + LSL defined | Reduce variation (center on target) | Fill weight             |
| `smaller`           | Only USL defined       | Decrease                            | Defect rate, cycle time |
| `larger`            | Only LSL defined       | Increase                            | Yield, strength         |

`inferCharacteristicType(specs)` already exists in `@variscout/core/types`. The target value comes from specs (Cpk target) or the analyst's improvement target entered during FRAME.

**Two of Watson's three questions are answerable before any analysis begins.**

### Q3: First Significant Factor = Draft Scope

When Factor Intelligence runs at SCOUT entry and identifies the first significant factor (e.g., "Machine C explains 47% of variation"), Q3 is answered. The Problem Statement is now formable:

> _"Reduce fill weight variation for Machine C (Cpk 0.62 → target 1.33)"_

This is actionable. Not final — investigation will sharpen it — but sufficient to anchor all subsequent work.

### Current Gap

`useProblemStatement` requires `suspectedCauses.length > 0` and hardcodes `targetDirection: 'reduce-variation'`. The Problem Statement cannot form until the analyst has marked at least one question as a suspected cause — which typically happens late in investigation.

### Design Change

The Problem Statement should be a **live, progressively forming view** — always visible, showing its current completeness:

| State                      | Display                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| FRAME (Q1+Q2 only)         | "Reduce variation in **fill weight** _(scope: to be determined)_"                                             |
| SCOUT Loop 1 (Q3 draft)    | "Reduce variation in fill weight **for Machine C** (Cpk 0.62 → 1.33)"                                         |
| INVESTIGATE (causes found) | "Reduce variation in fill weight for Machine C — **suspected: nozzle wear on night shift** (Cpk 0.62 → 1.33)" |

No "Generate" button. The Problem Statement fills in as evidence accumulates. The analyst can always edit it manually.

---

## Insight 2: Investigation Diamond = Finding the WHY

### Reframed Purpose

The Investigation Diamond (Initial → Diverging → Validating → Converging) is NOT about forming the Problem Statement. The Problem Statement already exists by the time investigation begins.

The diamond's purpose is: **discover suspected causes — the WHY behind the WHERE.**

| Phase      | Purpose                         | What Happens                                                            |
| ---------- | ------------------------------- | ----------------------------------------------------------------------- |
| Initial    | Problem Statement is the anchor | Questions generated from Factor Intelligence + analyst + CoScout        |
| Diverging  | Cast a wide net                 | Question tree grows — follow-up questions spawn from answered questions |
| Validating | Gather evidence                 | Answer questions with data (ANOVA), gemba (go-see), expert input        |
| Converging | Name the mechanisms             | Analyst creates suspected cause hubs connecting evidence threads        |

### The EDA Inner Loop Is the Heartbeat

The thesis describes an iterative loop: ask question → explore charts → pin finding → evaluate → ask next question. Each answer spawns new questions (L1 → L2 → L3). This loop IS the investigation.

Currently, the loop exists in the data model but is invisible in the UX:

- Follow-up questions (L2, L3) don't auto-generate when gating conditions are met
- There's no "new question arrived!" notification when answering spawns follow-ups
- The analyst doesn't feel the rhythm of iterative deepening

### Questions Come From Five Sources

All merge into one question tree:

1. **Factor Intelligence** (deterministic) — R²adj ranking, auto-ruled-out for <5%
2. **Analyst's own questions** — from experience, hunches, gemba walks. Added via "+" button
3. **Follow-ups from answered questions** — L2 ("which level?") and L3 ("do they interact?"). Should auto-generate when gating conditions met
4. **CoScout contextual** — NLP from issue statement, factor roles, process description
5. **From observations/comments** — finding comments that prompt new investigation threads

### Two Speeds — Two Surfaces

Investigation happens at two speeds, on two different surfaces:

| Speed                | Where                             | What the Analyst Does                                                                                     | Investigation Workspace?                                                           |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Quick check (~5 min) | **Analysis workspace + PI panel** | Pin findings from charts, see questions in PI panel Questions tab, mark key driver in conclusion card     | **Not needed** — PI panel provides lightweight investigation across all workspaces |
| Deep dive (~30 min)  | **Investigation workspace**       | Full question tree, findings board, gemba/expert evidence, CoScout synthesis, create suspected cause hubs | **Yes** — dedicated 3-column environment for structured investigation              |

The **PI panel Questions tab** (ADR-056) is the lightweight investigation surface — visible across Analysis, Investigation, Improvement, and Report workspaces. It shows questions, status badges, evidence percentages, and the conclusion card. For quick checks, the analyst never needs to leave Analysis.

The **Investigation workspace** is the deep-dive environment — question tree with sub-questions, findings board (list/board/tree views), CoScout coaching, and the full synthesis flow for creating suspected cause hubs. The analyst enters it when the investigation requires structured, multi-threaded evidence gathering.

**Suspected cause hub creation lives exclusively in the Investigation workspace.** The PI panel conclusion card shows existing hubs (read-only summary), but creating, naming, and connecting evidence to a hub requires the full Investigation workspace. This keeps the quick-check surface simple and reserves the synthesis act for the dedicated deep-dive environment.

---

## Insight 3: Suspected Cause = Hub, Not Tag

### The Core Reframing

A suspected cause is NOT a tag (`causeRole: 'suspected-cause'`) on an individual question. It is a **first-class entity** — a named mechanism that connects multiple evidence threads into one coherent story.

### Current Model (Flat Tags)

```
Question: "Does Shift matter?"     → causeRole: 'suspected-cause'
Question: "Are heads 5-8 worn?"    → causeRole: 'suspected-cause'
Question: "Shift × Head interact?" → causeRole: 'contributing'
```

Three separate tags. The analyst knows these are one mechanism, but the tool treats them as independent.

### Reframed Model (Connected Hubs)

```
Suspected Cause #1: "Nozzle wear on night shift"
  ├── Q: "Does Shift matter?" (η²=34%, answered)
  ├── Q: "Are heads 5-8 worn?" (gemba, answered)
  ├── Q: "Shift × Head interact?" (δR²=4%, confirmed)
  ├── Finding: "Temperature drifts after 4h on night runs"
  ├── Finding: "Nozzle worn 0.3mm beyond spec"
  └── → HMW: "How might we prevent nozzle wear from accumulating on night shift?"

Suspected Cause #2: "Incoming material moisture variation"
  ├── Q: "Does batch matter?" (η²=12%, answered)
  ├── Finding: "Batch C moisture spec differs"
  ├── Expert: "Supplier changed formulation in Q3"
  └── → HMW: "How might we control incoming material moisture?"
```

Two suspected causes. Each is a hub connecting multiple evidence threads. They're independent mechanisms — fixing one doesn't fix the other. But within each hub, the pieces form one story.

### Properties of a Suspected Cause Hub

1. **Named by the analyst** — "Nozzle wear on night shift", not auto-generated from factor names. The name IS the synthesis.
2. **Connects multiple evidence threads** — questions (answered), findings (observations), expert input. From any of the five question sources.
3. **Has a synthesis sentence** — the analyst's story of how the pieces connect. Not a template — their own understanding in their own words.
4. **Drives one improvement target** — one HMW question, one brainstorm session, one coherent improvement direction.
5. **Multiple can coexist** — independent mechanisms are separate hubs. Real processes often have multiple independent variation sources.
6. **Confirmed by outcome, not statistics** — becomes "confirmed" only when the process actually improves to target (outcome-based verification via staged analysis).

### What This Changes in the Investigation UX

The convergence phase of the diamond shifts from "tag individual questions with 🎯" to "create a suspected cause hub and connect evidence to it." The analyst names the mechanism, connects the threads, writes the synthesis — this is the moment of insight where scattered observations click into understanding.

The Improvement workspace then receives complete hubs, not individual tagged questions. Each hub drives one HMW brainstorm session with the full evidence context.

---

## The Complete E2E Flow (Reframed)

| Phase           | What Forms                                | How                                                                                                                      |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **FRAME**       | Q1 (measure) + Q2 (direction)             | Y column + `inferCharacteristicType(specs)` → deterministic                                                              |
| **SCOUT**       | Q3 draft (scope) + ranked questions       | First significant factor = draft scope. Problem Statement is actionable.                                                 |
| **INVESTIGATE** | **Suspected cause hubs** (primary output) | Questions from all 5 sources → answered → analyst creates hubs connecting evidence. Scope sharpens as causes accumulate. |
| **IMPROVE**     | Actions per hub → verified outcome        | Each suspected cause hub → HMW brainstorm → ideas → What-If → actions → staged analysis                                  |
| **RESOLVE**     | Suspected → **Confirmed**                 | Process improves to target → outcome-based confirmation. Not a statistical test — a measured result.                     |

### The Living Document

The Problem Statement and suspected causes are not two separate outputs. They form **one living document** that grows throughout the journey:

- **FRAME**: "Reduce variation in fill weight _(scope pending)_"
- **SCOUT Loop 1**: "Reduce variation in fill weight **for Machine C** (Cpk 0.62 → 1.33)"
- **INVESTIGATE**: "...suspected: **nozzle wear on night shift** (34% + gemba evidence), **material moisture** (12% + expert input)"
- **IMPROVE**: Each hub drives improvement actions
- **RESOLVE**: Confirmed when Cpk reaches target

---

## Relationship to Existing ADRs

| ADR                                     | Relationship                                                               |
| --------------------------------------- | -------------------------------------------------------------------------- |
| ADR-053 (Question-Driven Investigation) | Extended — suspected causes become hubs, not tagged questions              |
| ADR-054 (Mode-Aware Questions)          | Unchanged — mode-specific questions feed into the same hub model           |
| ADR-055 (Workspace Navigation)          | Unchanged — Investigation workspace layout may evolve but navigation stays |
| ADR-056 (PI Panel Redesign)             | Compatible — Questions tab shows questions; Conclusion card shows hubs     |
| ADR-060 (CoScout Intelligence)          | Compatible — CoScout can suggest hub connections and synthesis             |
| ADR-061 (HMW Brainstorm)                | Enhanced — HMW brainstorm per hub instead of per individual question       |

---

## Progressive Stratification Tensions Addressed

The progressive stratification document (docs/01-vision/progressive-stratification.md §Part 2) identifies six tensions. This reframing addresses several:

| Tension                   | How Addressed                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path dependency**       | Suspected cause hubs capture the mechanism, not the drill path. Different paths can converge on the same hub.                                      |
| **Interaction blindness** | Hubs naturally group interacting factors. L3 interaction questions feed into the same hub as L1/L2 questions.                                      |
| **When to stop**          | The Problem Statement's progressive formation provides a natural "are you done?" signal. Cumulative contribution from hub evidence shows coverage. |
| **Controllability**       | The analyst's synthesis sentence in each hub naturally addresses actionability — "we can fix this because..."                                      |
| **Factor ordering**       | Irrelevant at the hub level — the hub captures the mechanism regardless of which factor was investigated first.                                    |

---

## Implementation Considerations

### New Entity: SuspectedCause

```typescript
interface SuspectedCause {
  id: string;
  /** Analyst-chosen name: "Nozzle wear on night shift" */
  name: string;
  /** Analyst's synthesis: how the evidence connects */
  synthesis: string;
  /** Connected question IDs */
  questionIds: string[];
  /** Connected finding IDs */
  findingIds: string[];
  /** Mode-aware evidence from connected questions (see Suspected Cause Evidence Model spec) */
  evidence?: SuspectedCauseEvidence;
  /** Analyst marks this cause as selected for the IMPROVE phase */
  selectedForImprovement?: boolean;
  /** Status: suspected → confirmed (outcome-based) */
  status: 'suspected' | 'confirmed' | 'not-confirmed';
  /** Created timestamp */
  createdAt: string;
}
```

`SuspectedCauseEvidence` is defined in the [Suspected Cause Evidence Model spec](2026-04-03-suspected-cause-evidence-model-design.md). It carries mode-aware contribution (R²adj for standard/capability, waste % for yamazumi, channel Cpk for performance) and is stored — not recomputed on every render. The `selectedForImprovement` flag marks which causes the analyst has chosen to act on; unselected causes are "parked."

### Problem Statement Changes

- `useProblemStatement` should derive `targetDirection` from `inferCharacteristicType(specs)` instead of hardcoding `'reduce-variation'`
- `isReady` should check for Q1+Q2+Q3 (measure + direction + first significant factor), not for suspected causes
- The Problem Statement should render as a live, always-visible view that progressively fills in

### Question Model Changes

- Deprecate `causeRole` on individual questions — retain in the type for backward compatibility and migration, but new UX uses hub membership instead
- Keep question status unchanged (open → investigating → answered / ruled-out)
- Questions can belong to zero or one suspected cause hub
- Migration: existing `causeRole: 'suspected-cause'` questions without a hub become individual hubs (one question per hub) to preserve existing investigations

### Improvement Integration

- HMW brainstorm modal receives a SuspectedCause hub (with full evidence context) instead of individual questions
- Each hub drives one brainstorm session
- Ideas created within a hub carry the hub's context into What-If projection

---

## Verification

- Problem Statement auto-forms when Y column + specs + first significant factor are present
- Suspected cause hubs can be created, named, and have evidence connected
- HMW brainstorm receives hub context
- Existing question/finding workflows continue to work (questions are evidence threads, not causes)
- Report workspace shows the living document: Problem Statement + suspected cause hubs + ruled-out learnings
