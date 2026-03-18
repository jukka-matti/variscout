---
title: Methodology Coach Design
audience: [analyst, engineer]
category: workflow
status: draft
related: [methodology-coach, journey-phase, investigation-diamond, pdca]
---

# Methodology Coach

**Date:** 2026-03-18
**Status:** Draft

## Problem Statement

VariScout's methodology (the investigation diamond and PDCA cycle) is invisible in the UI. Analysts experience phases implicitly through screen transitions but never see where they are in the journey. The mental-model-hierarchy doc identified 3 gaps:

1. No Journey Phase in code (M1) — the 4-phase macro journey (Frame → Scout → Investigate → Improve) had no code representation
2. AI Phase Awareness covers only INVESTIGATE — CoScout silently adapted but didn't coach across all phases
3. Investigation diamond phases were hidden behind the InvestigationPhaseBadge badge, with no coaching text

## Design Principles

1. **Plain language first** — "Exploring possible causes" not "Diverging Phase"
2. **Methodology discoverable** — formal terms as small badges/tooltips, not primary labels
3. **Non-intrusive** — collapsible, ignorable, no wizards or forced sequences
4. **Reuse existing** — InvestigationSidebar content migrates into the INVESTIGATE section

## Component Architecture

### JourneyPhase Type

`packages/core/src/ai/types.ts` — `'frame' | 'scout' | 'investigate' | 'improve'`

### useJourneyPhase Hook

`packages/hooks/src/useJourneyPhase.ts` — deterministic detection from hasData + findings state

### MethodologyCoachBase

`packages/ui/src/components/MethodologyCoach/MethodologyCoachBase.tsx`

Composed of:

- **JourneyPhaseIndicator** — 4-step horizontal indicator (always visible)
- **Phase-specific content** (switched on journeyPhase):
  - FRAME: Setup checklist (data loaded, outcome selected, factors mapped, specs set)
  - SCOUT: Key stats highlights + drill suggestion
  - INVESTIGATE: DiamondPhaseMap + uncovered factors + suggested questions
  - IMPROVE: PDCAProgress + verification checklist

### Sub-components

- **DiamondPhaseMap** — 4 investigation diamond phases with plain-language labels
- **PDCAProgress** — PDCA cycle steps with completion state derived from findings

## Phase Detection Logic

| State                      | Journey Phase |
| -------------------------- | ------------- |
| No data loaded             | FRAME         |
| Data loaded, no findings   | SCOUT         |
| Findings exist, no actions | INVESTIGATE   |
| Any finding has actions    | IMPROVE       |

## Plain Language Labels

| Investigation Phase | Plain Language              | Formal Term |
| ------------------- | --------------------------- | ----------- |
| initial             | First look                  | Initial     |
| diverging           | Exploring possible causes   | Diverging   |
| validating          | Gathering evidence          | Validating  |
| converging          | Identifying suspected cause | Converging  |

## PDCA Progress Visualization

| Step  | Check Condition          | Display                        |
| ----- | ------------------------ | ------------------------------ |
| Plan  | Finding has hypothesisId | ☑ Cause identified             |
| Do    | Finding has actions      | ◉ Actions in progress (n of m) |
| Check | All actions completed    | ☐ Collect After data           |
| Act   | Finding has outcome      | ☐ Record outcome               |

## InvestigationSidebar Relationship

The existing InvestigationSidebar content moves INTO the INVESTIGATE section of MethodologyCoachBase:

- Phase coaching text → stays
- Uncovered factors detection → stays
- Suggested questions with copy → stays
- Verification checklist → moves to IMPROVE section
- Toggle button → reused by MethodologyCoachBase

## PWA vs Azure Behavior

| Aspect        | PWA                      | Azure                         |
| ------------- | ------------------------ | ----------------------------- |
| Default state | Expanded (teaching mode) | Collapsed (professional mode) |
| Mobile        | Hidden                   | Hidden                        |
| Panel width   | 280px                    | 280px                         |

## CoScout Explicit Phase Coaching

CoScout now explicitly references the phase in responses (not just silently adapting):

- "You're in the first look phase — let's identify which chart to examine first"
- "You're exploring possible causes — let's cast a wide net"
- etc.

## Finding Status Descriptions (PDCA Context)

Each finding status now has a tooltip description linking it to the methodology:

- observed: "Pattern spotted — not yet investigated."
- investigating: "Actively drilling into data and testing hypotheses."
- analyzed: "Suspected cause identified — ready to plan improvements."
- improving: "Corrective actions in progress. Collect After data to verify."
- resolved: "Actions complete, outcome verified. Standardize or iterate."
