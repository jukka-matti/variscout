---
title: 'ADR-064: SuspectedCause Hub Model & Investigation Reframing'
---

# ADR-064: SuspectedCause Hub Model & Investigation Reframing

## Status

Accepted — 2026-04-03

## Context

The investigation workflow used flat `causeRole` tags on questions (`'suspected-cause' | 'contributing' | 'ruled-out'`) to track cause identification. This had three problems:

1. **No mechanism naming.** An analyst could mark a question as "suspected cause" but couldn't name the mechanism ("nozzle wear on night shift"). The moment of understanding — articulating _why_ something causes variation — had no place in the data model.

2. **One cause per question.** Real processes have multiple independent variation sources. Fill weight might be affected by nozzle wear AND material moisture AND ambient temperature — three separate mechanisms that each need their own countermeasure. The flat tag model forced a single-cause mental model.

3. **Problem Statement was static.** Watson's 3 questions (Q1: what measure, Q2: what direction, Q3: what scope) were a text field filled during Define — before seeing data. But a good problem statement should _emerge_ from investigation, sharpening as evidence accumulates.

MBB validation (Mar 29 2026 testing session) confirmed: "The 'one root cause' idea is a simplification that causes problems. In my 40+ projects, I can count on one hand the cases where there was truly a single root cause."

## Decision

### 1. SuspectedCause Hub Entity

Introduce `SuspectedCause` as a first-class entity in the investigation store, replacing flat `causeRole` tags:

```typescript
interface SuspectedCause {
  id: string;
  name: string; // Analyst names the mechanism
  synthesis: string; // Max 500 chars explanation
  status: 'suspected' | 'confirmed' | 'not-confirmed';
  questionIds: string[]; // Connected evidence threads
  findingIds: string[];
  selectedForImprovement: boolean;
  evidence?: SuspectedCauseEvidence; // R²adj contribution
  createdAt: number;
}
```

Multiple hubs can coexist. Each hub aggregates evidence from questions and findings, computes its R²adj contribution from best subsets, and drives one HMW brainstorm in the Improvement workspace.

### 2. Problem Statement Early Emergence

Problem Statement forms progressively from Watson's 3 questions:

- **Q1 (measure):** Deterministic from outcome column name — available at FRAME
- **Q2 (direction):** Deterministic from characteristic type (both spec limits → nominal, one limit → directional) — available at FRAME
- **Q3 (scope):** Fills in at SCOUT when first significant factor identified (auto-suggested, analyst-editable)

The Problem Statement is always visible, always editable, and sharpens as the investigation progresses. `useProblemStatement` hook manages lifecycle: `hasScope`, `canGenerateDraft`, `liveStatement`.

### 3. Unified Hub Projections

Each hub computes projected improvement via `computeHubProjection`:

- Standard mode: mean shift from level effects → projected Cpk
- Capability mode: Cpk impact per factor
- Yamazumi mode: waste elimination (seconds saved)
- Performance mode: channel Cpk improvement

The projection chain: Best Subsets → equation → level effects → hub R²adj contribution → What-If preset → projected outcome. MBB validation called this "the killer feature."

### 4. Hub-Driven Improvement Flow

Each SuspectedCause hub with `selectedForImprovement: true` drives one HMW brainstorm (ADR-061). The improvement workspace receives cause-scoped context: which factors, what evidence, what projected improvement. This replaces the previous model where improvement ideas were free-floating.

## Consequences

**Positive:**

- Analyst articulates understanding by naming mechanisms — forces comprehension
- Multiple independent causes tracked and addressed separately
- Problem Statement emerges from data, not guesswork
- Projection chain automates the manual spreadsheet exercise (Best Subsets → equation → What-If)
- Hub entity is the bridge between Investigation and Improvement phases

**Negative:**

- More complex state model (hubs + connections + projections)
- Migration needed from flat `causeRole` to hub model (backward-compatible: old data still works)
- Hub creation UX needs to be discoverable without being intrusive

## Implementation

- `packages/core/src/findings/` — SuspectedCause types, factory, helpers, migration, `computeHubProjection`, `detectEvidenceClusters`
- `packages/core/src/variation/` — `computeHubEvidence`, `projectWasteElimination`, `projectVAImprovement`
- `packages/stores/src/investigationStore.ts` — SuspectedCause CRUD actions
- `packages/hooks/src/useProblemStatement.ts` — Watson Q1-Q3 lifecycle
- `packages/ui/src/components/` — HubComposer, HubCard, SynthesisPrompt, EquationDisplay
- Design spec: `docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md`

## Amendment — 2026-04-28: Current Process State as a parallel central object

The 2026-04-27 operating-model spec
(`docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`)
introduces **Current Process State** (`packages/core/src/processState.ts`)
as a parallel central object alongside SuspectedCause hubs. Both remain
canonical:

- **SuspectedCause hubs** stay the canonical investigation-level object —
  they aggregate finding-level evidence, drive HMW brainstorming, and
  carry the synthesis prompt + equation display.
- **Current Process State** is the canonical Process-Hub-level object —
  it surfaces measure families (outcome / capability / flow / known-x /
  trust), drives response-path routing, and carries the cadence-review
  surface. Phase 2 V2 closure (PR #96/#97/#98/#99) shipped the panel; PR
  #100 added team notes; PR #102 added the GENERIC_TABULAR_PROFILE
  evidence wiring.

The two objects are complementary, not competing: SuspectedCause is "why
did this happen?" inside one investigation; Current Process State is
"what's the line doing right now?" across investigations. Both flow into
the response paths (quick action / focused investigation / chartered
project / sustainment review / control handoff) but at different scopes.

The 2026-04-28 production-line-glance spec
(`docs/superpowers/specs/2026-04-28-production-line-glance-design.md`)
adds the `processNodeId` tag on investigations (B2 shape — investigation
IS one step's deep-dive) and the `nodeMappings` table (B1 shape —
investigation covers multiple steps). Neither replaces SuspectedCause;
they augment the per-step capability surface that feeds Current Process
State and the production-line-glance dashboard.
