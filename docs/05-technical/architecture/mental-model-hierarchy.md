---
title: Mental Model Hierarchy
audience: [developer, analyst]
category: architecture
status: stable
related: [methodology, journey, investigation, ai, report]
---

# Mental Model Hierarchy

VariScout uses multiple conceptual frameworks to describe how the software works. This document maps every mental model, shows how they relate, identifies what exists in code vs docs only, and serves as the single source of truth for how models nest together.

---

## The Hierarchy

```
L0: 4-Phase Analysis Journey (M1)
├── FRAME (Blue) ───── No AI active. Seeds AI context for later phases.
│                      Parser + data validation, column type detection
│                      Factor role inference, investigation category grouping
│                      Spec limits + characteristic types
│                      Process context + analysis brief (Azure)
│
├── SCOUT (Green) ──── M2: Watson's EDA (the analytical method)
│                      M3: Four Lenses (teaching labels for M2)
│                      M11: Two Speeds (Quick Check / Deep Dive)
│                      M12: Two Entry Paths (Discovery / Hypothesis-Driven)
│                      M14: Contributions 1+2 (Parallel Views, Progressive Stratification)
│
├── INVESTIGATE (Amber) ── M4: Investigation Diamond — 4 phases (structured learning, phase-aware AI)
│                          M5: Finding Status [observed→analyzed] (user progress)
│                          M13: Hypothesis Lifecycle (validation state)
│                          M14: Contribution 3 (Hypothesis Investigation)
│                          M15: Knowledge Layer (org knowledge retrieval, Team AI only)
│
└── IMPROVE (Purple) ───── M5: Finding Status [improving→resolved] (user progress)
                           PDCA: Plan (ideate+select) → Do → Check (staged analysis) → Act (standardize)
                           What-If Simulator, Staged Analysis, Outcome Recording

Orthogonal (apply across phases):
├── M6: AI Layers (how much AI assistance)
├── M7: Value Levers (business capabilities)
├── M9: Two Voices (control vs spec limits)
├── M10: Experience Spectrum (product tiers)
└── M8: Report Steps (retelling of journey as story)
```

---

## Full Inventory

### M1: 4-Phase Analysis Journey

**FRAME → SCOUT → INVESTIGATE → IMPROVE**

| Phase       | Color            | Purpose                                                                                                                                      |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FRAME       | Blue `#3b82f6`   | Define the problem space — parse data, map columns, set specs, capture process context. No AI active, but seeds AI context for later phases. |
| SCOUT       | Green `#22c55e`  | Discover variation patterns (EDA drill-down)                                                                                                 |
| INVESTIGATE | Amber `#f59e0b`  | Understand why — structured learning through the investigation diamond (diverge, validate, converge)                                         |
| IMPROVE     | Purple `#8b5cf6` | Fix the process — PDCA cycle: Plan (ideate, select), Do, Check (staged analysis), Act (standardize or loop)                                  |

- **Source:** `docs/03-features/workflows/analysis-journey-map.md`
- **In code?** YES — `JourneyPhase` type in `@variscout/core`, `useJourneyPhase` hook in `@variscout/hooks`, `MethodologyCoachBase` component in `@variscout/ui`
- **Scope:** The complete user journey through the software
- **Note:** Journey phases are now visible in the UI via the Methodology Coach panel, which provides phase-aware coaching across all 4 phases.

**FRAME in detail:** While no AI is active during FRAME, the phase contains significant deterministic engines: data parsing and validation, column type detection, factor role keyword inference (equipment/temporal/operator/material/location), investigation category auto-grouping, and characteristic type selection. Critically, FRAME captures process context (free text + structured metadata) and analysis brief (Azure only: problem statement, upfront hypotheses, improvement target) that become the AI's grounding context in subsequent phases. See [Analysis Journey Map § Phase 1: FRAME](../../03-features/workflows/analysis-journey-map.md#phase-1-frame) for full detail.

### M2: Watson's EDA Foundation

**I-Chart → Boxplot → Pareto → Capability**

- **Source:** `docs/01-vision/methodology.md` (lines 30–49)
- **In code?** YES — chart components, data transforms, stats engine
- **Relationship to M1:** Watson's EDA = the SCOUT phase methodology

### M3: Four Lenses

**CHANGE → FLOW → FAILURE → VALUE**

| Lens    | Tool                 | Core Question                     |
| ------- | -------------------- | --------------------------------- |
| CHANGE  | I-Chart              | "What's shifting over time?"      |
| FLOW    | Boxplot              | "Where does variation come from?" |
| FAILURE | Pareto               | "Where do problems cluster?"      |
| VALUE   | Capability Histogram | "Does it meet customer specs?"    |

- **Source:** `docs/01-vision/methodology.md` (lines 120–131)
- **In code?** NO — CoScout uses tool names, not lens names
- **Relationship to M1:** Four Lenses = SCOUT phase, pedagogical labels
- **Note:** methodology.md explicitly says "The lens metaphor is useful for marketing and teaching, but the methodology works with standard tool names."

### M4: Investigation Diamond

**Initial → Diverging → Validating → Converging**

| Phase      | Purpose                                       | Analyst Activity                                                                                 |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Initial    | Variation found, driver identified            | Pin finding; upfront hypothesis (from FRAME) or new observation becomes tree root                |
| Diverging  | Generate possible causes                      | Add sub-hypotheses — the tree grows, break broad cause into testable theories                    |
| Validating | Gather evidence                               | Test each leaf — Data (ANOVA auto-validate), Gemba (go inspect), Expert input                    |
| Converging | Build understanding, identify suspected cause | Prune contradicted branches; mark causeRole (primary/contributing); promote suspected root cause |

The diamond is a **structured learning** process — a disciplined way to build understanding through multiple evidence types. It closes at Converging. Acting/Resolved are now part of IMPROVE (PDCA: Do and Act respectively).

- **Source:** `docs/01-vision/methodology.md`, `packages/core/src/ai/types.ts`
- **In code?** YES — `InvestigationPhase` type (4 diamond phases + `'improving'` for IMPROVE), `InvestigationPhaseBadge` component, CoScout phase-aware prompts.
- **Relationship to M1:** The diamond = the INVESTIGATE phase methodology. IMPROVE follows with PDCA.

### M5: Finding Status

**observed → investigating → analyzed → improving → resolved**

- **Source:** `packages/core/src/findings.ts`
- **In code?** YES — core type, UI board columns, tier gating (PWA: first 3 only)
- **Relationship to M1:** Spans INVESTIGATE (observed→analyzed) + IMPROVE (improving→resolved)
- **Relationship to M4:** Parallel track — investigation diamond phases drive AI behavior, Finding Status tracks user progress

### M6: AI Layers

**Layer 1: NarrativeBar → Layer 2: ChartInsightChips → Layer 3: CoScout**

- **Source:** `docs/03-features/workflows/ai-experience-narrative.md`
- **In code?** YES — three independent component systems
- **Relationship to M1:** Orthogonal — layers describe HOW MUCH AI, not WHEN in the journey

### M7: Value Levers

**L1: Core Analysis → L2: Investigation → L3: AI → L4: Team → L5: Org Learning**

- **Source:** `docs/01-vision/business-bible.md` (lines 203–246)
- **In code?** Indirectly via tier gating
- **Relationship to M1:** Orthogonal — levers describe WHAT capabilities exist, journey describes WHEN they're used

### M8: Report Steps

**Current Condition → Drivers → Hypotheses → Actions → Verification**

- **Source:** `docs/superpowers/specs/2026-03-16-scouting-report-design.md` (lines 88–127)
- **In code?** YES — `useReportSections` hook, `ReportStepMarker` component
- **Relationship to M1:** A retelling of the journey as a story, using question-form labels. See cross-reference table below.

### M9: Two Voices

**Voice of Process (control limits) ↔ Voice of Customer (spec limits)**

- **Source:** `docs/01-vision/methodology.md` (lines 106–117)
- **In code?** YES — control limits (calculated) vs spec limits (user-entered)
- **Relationship to M1:** Foundational, applies across all phases

### M10: Experience Spectrum

**PWA → Azure Standard/Team → Azure Team AI**

- **Source:** `docs/03-features/workflows/ai-experience-narrative.md` (lines 146–157)
- **In code?** YES — tier system (`core/tier.ts`)
- **Relationship to M1:** Orthogonal — describes product tiers, not journey phases

### M11: Two Speeds

**Quick Check (~5 min) → Deep Dive (~30 min)**

- **Source:** `docs/03-features/workflows/analysis-journey-map.md` (lines 131–138)
- **In code?** Report auto-detection uses these as report types
- **Relationship to M1:** Sub-variants of SCOUT phase

### M12: Two Entry Paths (now Three)

**Problem to Solve / Hypothesis to Check / Routine Check**

- **Source:** `docs/03-features/workflows/analysis-journey-map.md` (lines 309–337)
- **In code?** YES — `EntryScenario` type in `@variscout/core/ai/types.ts`, detection via `detectEntryScenario()` in `@variscout/hooks`
- **Relationship to M1:** Entry variants that affect coaching content across all phases. See [journey-phase-screen-mapping.md](./journey-phase-screen-mapping.md) for per-phase impact.

### M13: Hypothesis Lifecycle

**untested → supported / partial / contradicted**

- **Source:** `packages/core/src/findings.ts`
- **In code?** YES — `ValidationStatus` type
- **Relationship to M4:** Lives inside the diamond's Diverging→Validating→Converging phases

### M14: Three Contributions

**Parallel Views, Progressive Stratification, Hypothesis Investigation**

- **Source:** `docs/01-vision/methodology.md` (lines 54–103)
- **In code?** YES — linked filtering, filter chips with η², hypothesis tree
- **Relationship to M1:** Contributions 1+2 = SCOUT innovations, Contribution 3 = INVESTIGATE innovation

### M15: Knowledge Layer (Foundry IQ)

**SharePoint document search → CoScout context enrichment**

- **Source:** ADR-022 (original design), ADR-026 (current: Remote SharePoint with Foundry IQ)
- **In code?** YES — `searchService.ts` (Foundry IQ client), `useKnowledgeSearch` hook, `AdminKnowledgeSetup` component
- **Relationship to M1:** Active during INVESTIGATE+ (intent-detected, user-confirmed). Not during FRAME or early SCOUT.
- **Relationship to M6:** Distinct from the 3 AI layers. M6 = interactive AI assistance (NarrativeBar, ChartInsightChips, CoScout). M15 = organizational knowledge retrieval that enriches CoScout context.
- **Scope:** Folder-scoped SharePoint search (channel's folder), per-user permissions, intent-based trigger ("Search Knowledge Base?" suggestion in CoScout)
- **Tier:** Team AI only (€279/month). Preview-gated via `AdminKnowledgeSetup`.

---

## Cross-Reference: Report Steps ↔ Journey Phases

The report uses **question-form labels** (story retelling) while the journey uses **verb-form labels** (user activity). FRAME is absent from the report because it's setup, not story.

| Report Step | Label                                                  | Journey Phase            | Journey Activity                          |
| ----------- | ------------------------------------------------------ | ------------------------ | ----------------------------------------- |
| Step 1      | Current Condition — "What does the process look like?" | SCOUT (initial overview) | Dashboard first look, key metrics         |
| Step 2      | Where Does Variation Come From?                        | SCOUT (drill-down)       | Progressive stratification, pin findings  |
| Step 3      | Why Is This Happening?                                 | INVESTIGATE              | Hypothesis tree, validation, convergence  |
| Step 4      | What Did We Do About It?                               | IMPROVE (actions)        | Action items, What-If projections         |
| Step 5      | Did It Work?                                           | IMPROVE (verification)   | Staged comparison, outcome recording      |
| —           | _(not in report)_                                      | FRAME                    | Data loading, column mapping, spec limits |

**Note:** When `useReportSections` was built, it couldn't reference journey phases because they don't exist in code. The report invented its own structure independently. The two naming systems serve different purposes (storytelling vs activity framing) and both are valid.

---

## Cross-Reference: Investigation Diamond ↔ Finding Status

Both track investigation progress but from different angles: the diamond drives AI prompt selection, Finding Status tracks user-visible progress.

| Diamond Phase | Finding Status | Who Uses It         | Trigger                                      |
| ------------- | -------------- | ------------------- | -------------------------------------------- |
| Initial       | observed       | AI prompt selection | Finding pinned from chart/filter             |
| Diverging     | investigating  | AI prompt selection | First hypothesis added                       |
| Validating    | investigating  | AI prompt selection | Validation evidence being gathered           |
| Converging    | analyzed       | AI prompt selection | Hypotheses resolved (supported/contradicted) |
| _(IMPROVE)_   | improving      | AI prompt selection | Actions assigned (PDCA: Do)                  |
| _(IMPROVE)_   | resolved       | AI prompt selection | Outcome recorded (PDCA: Act)                 |

**Note:** The `improving` and `resolved` statuses map to IMPROVE's PDCA cycle, not the investigation diamond. The diamond closes at Converging (`analyzed`). The mapping exists implicitly in `useAIContext.ts` (phase detection from hypothesis tree state). The `InvestigationPhase` type uses `'improving'` for the IMPROVE phase — consistent with the `FindingStatus` value.

---

## What's In Code vs Docs Only

| Model                     | In Code? | Code Location                                                                                                                                    | Implication                                                     |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| M1: Journey Phases        | YES      | `JourneyPhase` type, `useJourneyPhase`, `JourneyPhaseStrip` in header, [screen mapping](./journey-phase-screen-mapping.md)                       | Journey phases visible in header via compact strip + popover    |
| M2: Watson's EDA          | YES      | Chart components, stats engine                                                                                                                   | Foundation of the product                                       |
| M3: Four Lenses           | NO       | —                                                                                                                                                | Teaching/marketing only (intentional)                           |
| M4: Investigation Diamond | YES      | `InvestigationPhase` type (4 diamond phases + `'improving'` for IMPROVE), `InvestigationPhaseBadge`, CoScout prompts, `DiamondPhaseMap` in Coach | AI adapts during INVESTIGATE; Coach houses the diamond phase UI |
| M5: Finding Status        | YES      | `FindingStatus` type, board columns, tier gating                                                                                                 | Full lifecycle tracking                                         |
| M6: AI Layers             | YES      | NarrativeBar, ChartInsightChip, CoScoutPanel                                                                                                     | Three independent systems                                       |
| M7: Value Levers          | Indirect | Tier gating                                                                                                                                      | Business model only                                             |
| M8: Report Steps          | YES      | `useReportSections`, `ReportStepMarker`                                                                                                          | Independent of journey phases                                   |
| M9: Two Voices            | YES      | Control limits (calculated) vs spec limits (user-entered)                                                                                        | Core data model                                                 |
| M10: Experience Spectrum  | YES      | `core/tier.ts`                                                                                                                                   | Product gating                                                  |
| M11: Two Speeds           | Partial  | Report auto-detection                                                                                                                            | Not typed                                                       |
| M12: Three Entry Paths    | YES      | `EntryScenario` type, `detectEntryScenario()`, `getCoachingText()`                                                                               | Phase-aware coaching text                                       |
| M13: Hypothesis Lifecycle | YES      | `ValidationStatus` type                                                                                                                          | Inside investigation diamond                                    |
| M14: Three Contributions  | YES      | Linked filtering, filter chips, hypothesis tree                                                                                                  | Core UX patterns                                                |
| M15: Knowledge Layer      | YES      | `searchService.ts`, `useKnowledgeSearch`, `AdminKnowledgeSetup`                                                                                  | Team AI tier only, preview-gated                                |

---

## Known Gaps & Drift

### 1. ~~No Journey Phase In Code~~ (Resolved)

**Resolved:** `JourneyPhase` type added to `@variscout/core`, `useJourneyPhase` hook detects phase from analysis state. `MethodologyCoachBase` component renders phase-aware coaching across all 4 phases (FRAME setup checklist, SCOUT pattern hints, INVESTIGATE diamond phases, IMPROVE PDCA progress). See [Methodology Coach Design Spec](../../superpowers/specs/2026-03-18-methodology-coach-design.md).

### 2. Report Steps ≠ Journey Phases (Genuine Drift)

Report Steps were designed independently from the journey map and use question-form labels. Both are valid for their purpose, but they were never cross-referenced until this document. See the mapping table above.

### 3. ~~AI Phase Awareness Covers Only INVESTIGATE~~ (Resolved)

**Resolved:** Methodology Coach provides coaching across all 4 journey phases (FRAME setup checklist, SCOUT pattern hints, INVESTIGATE diamond phases, IMPROVE PDCA progress). CoScout now explicitly references the phase in responses (not just silently adapting). See [Methodology Coach Design Spec](../../superpowers/specs/2026-03-18-methodology-coach-design.md).

**Note:** FRAME having no AI is still intentional and correct — there is no analysed data to reason about yet. The Coach provides a setup checklist during FRAME instead. FRAME remains a future AI opportunity for column mapping assistance and process context enrichment.

### 4. Diamond ↔ Finding Status Not Documented

Both systems track investigation progress from different angles. The implicit mapping in `useAIContext.ts` was never documented. Developers modifying one system might not realize it affects the other. See the mapping table above.

### 5. Four Lenses Not In Code (Intentional)

The teaching shorthand (CHANGE/FLOW/FAILURE/VALUE) appears in docs and marketing but never in code. This is intentional and documented in methodology.md. If journey-aware UI is ever built, lens labels would be the SCOUT phase's user-facing vocabulary.

### 6. Process Context Limited to Free Text (Conceptual Opportunity)

FRAME captures process context via a 500-character text field (`ProcessDescriptionField`). There is no way to upload or reference structured process documents (SOPs, control plans, FMEA, equipment specs) during setup. The Knowledge Layer (M15) can search SharePoint docs during INVESTIGATE, but only after analysis has begun — the AI cannot reference process documents during SCOUT when initial pattern interpretation would benefit most.

A world-class AIX would allow process knowledge to be available from the moment data is loaded — either by linking to existing SharePoint documents during FRAME, or by providing a document upload/reference mechanism that enriches the AI context from the start.

### 7. Upfront Hypothesis Not Connected to Tree

The analysis brief captures upfront hypotheses as free text during FRAME, but the hypothesis tree in INVESTIGATE starts fresh. The analyst must manually re-enter their upfront hypothesis as the tree root. Connecting them programmatically would create a continuous thread from FRAME through INVESTIGATE — the upfront hypothesis would automatically seed the tree root, preserving context and reducing manual re-entry.

---

## Entry-Path-Dependent Phase Goals

How the analyst entered the journey shapes what each phase needs to accomplish:

| Entry Scenario          | FRAME                     | SCOUT                    | INVESTIGATE                                             | IMPROVE                         |
| ----------------------- | ------------------------- | ------------------------ | ------------------------------------------------------- | ------------------------------- |
| **Problem to Solve**    | Define problem space      | Find variation drivers   | Understand why — build evidence for suspected cause     | Fix the process — Cpk to target |
| **Hypothesis to Check** | Record upfront hypothesis | Confirm/refute with data | If confirmed, understand mechanism; if refuted, diverge | Fix the confirmed cause         |
| **Routine Check**       | Load latest data          | Scan for new signals     | Only if a signal is found                               | Only if a cause is identified   |

This table is mirrored in [Analysis Journey Map § Entry-Path-Dependent Phase Goals](../../03-features/workflows/analysis-journey-map.md#entry-path-dependent-phase-goals).

---

## See Also

- [Analysis Journey Map](../../03-features/workflows/analysis-journey-map.md) — canonical journey definition (M1)
- [Methodology](../../01-vision/methodology.md) — Watson's EDA (M2), Four Lenses (M3), Investigation Diamond (M4), Two Voices (M9), Three Contributions (M14)
- [AI Experience Narrative](../../03-features/workflows/ai-experience-narrative.md) — AI Layers (M6), Experience Spectrum (M10)
- [Business Bible](../../01-vision/business-bible.md) — Value Levers (M7)
- [Scouting Report Design](../../superpowers/specs/2026-03-16-scouting-report-design.md) — Report Steps (M8)
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Finding Status (M5), Hypothesis Lifecycle (M13)
- [ADR-026: Knowledge Base Strategy](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md) — Knowledge Layer (M15) architecture
