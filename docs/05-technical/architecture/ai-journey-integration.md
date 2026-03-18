---
title: AI Journey Integration
scope: Entry point — AI × Phase × Mode overview, collaborator capabilities, user-facing behavior
audience: [analyst, engineer]
category: architecture
status: stable
related: [ai-architecture, ai-context-engineering, aix-design-system, journey]
points_to:
  - ai-architecture.md (system architecture, packages, auth, data flow, cost controls)
  - ai-context-engineering.md (prompt tiers, context layers, token budgets, caching)
  - aix-design-system.md (governance, tone, confidence calibration, interaction patterns)
---

# AI Journey Integration

How AI augments each phase of the VariScout journey. This is the entry point for understanding AI in VariScout — start here, then follow links to technical details.

---

## Three AI Modes

The journey behaves differently depending on which AI mode is active. Modes are orthogonal to phases — any mode works at any phase.

| Mode                    | Available On                                               | What Changes                                                                                                                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **No AI**               | PWA (always), Azure without AI Foundry, or user toggle OFF | Dashboard shows deterministic insights only. All AI UI hidden with zero layout disruption.                                                  |
| **AI Enabled**          | Azure Standard/Team/Team AI with AI Foundry deployed       | NarrativeBar + ChartInsightChips + CoScout active from SCOUT onward. Phase-aware prompts. Actionable suggestions with analyst confirmation. |
| **AI + Knowledge Base** | Azure Team AI (€279/month) only                            | Adds organizational document search (Foundry IQ) in CoScout from SCOUT onward (on-demand). Cross-project knowledge queries.                 |

**Mode ≠ Tier:** AI is a horizontal capability, not tier-gated. A Standard customer who deploys AI Foundry gets Mode 2. Only the Knowledge Base (Mode 3) is Team AI exclusive.

**Availability:** Azure App only (Standard, Team, and Team AI plans). Requires AI endpoint configured in ARM deployment AND user Settings toggle "Show AI assistance" set to ON. PWA never has AI.

---

## Four Context Layers

| Layer   | What                | Source                                                | When                            |
| ------- | ------------------- | ----------------------------------------------------- | ------------------------------- |
| Layer 1 | Analysis state      | `buildAIContext()` from DataContext                   | Always (Mode 2+)                |
| Layer 2 | Process context     | User-entered description + auto-inferred factor roles | Optional (Mode 2+)              |
| Layer 3 | Knowledge grounding | ~47 glossary terms + 11 methodology concepts          | Always (Mode 2+)                |
| Layer 4 | Team documents      | Remote SharePoint via Foundry IQ                      | On-demand, SCOUT+ (Mode 3 only) |

Layers 1-3 are always in the prompt. Layer 4 is injected only when the user clicks "Search Knowledge Base?" in CoScout. See [AI Context Engineering](ai-context-engineering.md) for token budgets and prompt tier structure.

---

## AI per Journey Phase

### FRAME — Setup (No AI Active)

AI is not active during FRAME — there is no analysed data yet. However, FRAME seeds the AI context used in later phases:

- **Process description** — Free text field in Settings (persisted in `AnalysisState.processContext`)
- **Factor roles** — Auto-inferred from column names during `detectColumns()` (equipment, temporal, operator, material, location)
- **Analysis brief** — Azure users can capture an upfront hypothesis, which seeds the investigation tree root in INVESTIGATE

The Methodology Coach provides a setup checklist during FRAME.

### SCOUT — Discovery (AI Active)

Watson's EDA chart sequence: I-Chart → Boxplot → Pareto → Capability. AI explains what you see and suggests what to do.

| Component            | No AI                      | AI Enabled                                                                      | AI + Knowledge Base                                        |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **NarrativeBar**     | Hidden                     | Summary bar: "Machine A explains 47% of variation. Cpk 0.85 below target 1.33." | Same (KB doesn't affect narration)                         |
| **ChartInsightChip** | Deterministic insight only | AI-enhanced: "→ Drill Machine A (47%) — your process mentions nozzle clogging"  | Same                                                       |
| **CoScout**          | Hidden                     | Available: "Why is this chart showing a shift?"                                 | + On-demand KB search: "Have we seen this pattern before?" |

**Deterministic-first pipeline:** ChartInsightChips always render a deterministic insight first (from `buildIChartInsight()`, `buildBoxplotInsight()`, etc.). AI enhancement replaces it when ready. Insights work in all modes, including PWA.

**Actionable suggestions:** ChartInsightChips with drill suggestions show an arrow icon and are clickable — clicking applies the filter with analyst confirmation. AI never auto-acts.

### INVESTIGATE — Structured Learning (Phase-Aware AI)

The Investigation Diamond (Initial → Diverging → Validating → Converging) with phase-specific AI coaching:

| Diamond Phase | AI Role        | CoScout Behavior                                             |
| ------------- | -------------- | ------------------------------------------------------------ |
| Initial       | Orientation    | Help identify which chart to examine first                   |
| Diverging     | Exploration    | Encourage testing hypotheses across factor categories        |
| Validating    | Interpretation | Help interpret η² (contribution, not causation)              |
| Converging    | Synthesis      | Help evaluate suspected causes, brainstorm improvement ideas |

**Knowledge Base (Mode 3):** "Search Knowledge Base?" button in CoScout triggers Foundry IQ (Remote SharePoint via Azure AI Search). Returns folder-scoped documents using the user's own token (per-user security).

**Investigation Sidebar:** Shows deterministic suggested questions from `buildSuggestedQuestions()` (works in all modes). With AI, adds AI-generated follow-up questions.

### IMPROVE — PDCA Cycle (Verification AI)

Plan → Do → Check → Act. AI shifts to action planning and outcome verification.

| PDCA Step | AI Assistance                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Plan**  | CoScout helps brainstorm improvements, compare effort vs impact. Improvement ideas on findings get What-If projections.           |
| **Do**    | Corrective actions tracked. Teams auto-posting on analyzed + resolved findings (Team plan).                                       |
| **Check** | NarrativeBar summarizes staged comparison: mean shift, Cpk delta, violation reduction. CoScout grounded in before/after evidence. |
| **Act**   | Outcome assessment. "Effective" / "Not effective" / "Partial" with Cpk before/after auto-filled from staged data.                 |

**Staged verification:** When staged comparison data is present, all AI components switch to verification-specific behavior. See [AIX Design System § Verification Sub-pattern](aix-design-system.md#verification-sub-pattern-improve-phase-with-staged-data).

---

## AI Collaborator Capabilities

AI in VariScout is a **collaborator**: it explains deterministic conclusions AND suggests concrete next actions. The analyst always confirms before any action executes. See [ADR-027](../../07-decisions/adr-027-ai-collaborator-evolution.md).

### Actionable Drill Suggestions

ChartInsightChips on Boxplot and Pareto can suggest drill-down actions:

- **Without AI:** Yellow glow on Machine A category (deterministic highlight)
- **With AI:** Same glow + chip: "→ Drill Machine A (47%)" with clickable arrow icon
- **Action:** Click → filter applied (same as clicking the category directly)

Deterministic suggestions remain the primary UI. AI adds natural language explanation to the same recommendation. If they disagree, the deterministic answer wins.

### AI-Suggested Findings

CoScout can propose "[Pin as Finding]" with auto-generated text based on the current analysis state. The analyst reviews and confirms before the finding is created.

### Upfront Hypothesis → Data Check

When an analyst enters a hypothesis during FRAME (analysis brief), AI can reference it during SCOUT: "Your hypothesis about Machine A is supported — it accounts for 47% of variation." The hypothesis seeds the investigation tree root automatically.

---

## Entry Path Variations

How AI adapts its coaching per entry scenario:

| Entry Scenario          | AI Adaptation                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **Problem to Solve**    | NarrativeBar leads with the problem metrics. CoScout helps identify which factors to investigate first. |
| **Hypothesis to Check** | AI references the upfront hypothesis during SCOUT. Confirms or challenges with data.                    |
| **Routine Check**       | NarrativeBar highlights new signals vs. stable state. CoScout suggests comparing to previous analyses.  |

---

## User Control

AI visibility is controlled by a per-user toggle in Settings:

| Setting                                   | Behavior                              |
| ----------------------------------------- | ------------------------------------- |
| No AI endpoint configured                 | AI UI never shown, toggle not visible |
| Endpoint configured + toggle ON (default) | All AI layers visible                 |
| Endpoint configured + toggle OFF          | All AI layers hidden                  |

Per-component toggles allow independently enabling/disabling NarrativeBar, ChartInsightChips, and CoScout.

### Offline Behavior

| Layer            | Online            | Offline (cached)                       | Offline (no cache)                     |
| ---------------- | ----------------- | -------------------------------------- | -------------------------------------- |
| NarrativeBar     | Live response     | Cached summary shown                   | Hidden                                 |
| ChartInsightChip | Live response     | Cached chips shown                     | Hidden                                 |
| CoScoutPanel     | Live conversation | History visible, new messages disabled | History visible, new messages disabled |

All cached responses have a 24-hour TTL or expire when analysis data changes.

---

## The Experience Spectrum

```
PWA (Free)              Azure Standard/Team              Azure Team AI
─────────────────────   ──────────────────────────────   ─────────────────────────
Charts + numbers        + NarrativeBar                   + Knowledge Base
Deterministic hints     + ChartInsightChips              + Cross-project queries
Glossary tooltips       + CoScout conversation           + Document retrieval
Manual investigation    + Actionable drill suggestions   + AI-generated reports
                        + AI-aware investigation         + Organizational memory

"Read the charts        "AI explains what you see        "AI remembers what
 yourself"               and suggests what to do"         your team learned"
```

At every point on this spectrum, the statistical engine is the authority. AI adds language, context, memory, and actionable suggestions — never competing statistics.

---

## Graceful Degradation

AI is designed to be invisible when unavailable. The app never breaks, never shows error modals, and never changes layout when AI is absent.

| Scenario                           | Behavior                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| No AI endpoint configured          | AI UI elements never render. Dashboard looks exactly like the PWA.                                |
| AI endpoint configured, toggle OFF | Same as above.                                                                                    |
| AI endpoint configured, API error  | NarrativeBar shows cached or hides. Chips fall back to deterministic. CoScout shows inline error. |
| AI endpoint configured, offline    | NarrativeBar shows cached or hides. CoScout shows history but disables new messages.              |

---

## Process Context

AI quality depends on structured process metadata. Context is collected progressively:

### Auto-Inferred (zero friction)

At import time, column names are matched against keyword groups to infer factor roles:

| Column Name Contains        | Inferred Role | AI Impact                                 |
| --------------------------- | ------------- | ----------------------------------------- |
| machine, line, head, nozzle | Equipment     | "Machine B (equipment) accounts for 47%"  |
| shift, day, week, hour      | Temporal      | "Morning shift shows consistent drift"    |
| operator, technician        | Operator      | "Operator 3 has wider spread than others" |
| batch, lot, supplier        | Material      | "Lot 2024-03 correlates with the shift"   |

### User-Provided

- **processDescription** — Free text field in Settings
- **Optional process wizard** (Phase 2) — Process type, industry, process steps

---

## Knowledge Accumulation

VariScout's Finding system builds a measurement-backed knowledge base from normal usage:

| Traditional FMEA                     | VariScout Finding                       |
| ------------------------------------ | --------------------------------------- |
| Severity (1-10 guess)                | Cpk + pass rate (actual)                |
| Occurrence (1-10 guess)              | η² contribution % (actual)              |
| Recommended action (rarely verified) | Corrective action with Cpk before/after |

After 50+ resolved findings published as scouting reports, the AI has genuine organizational knowledge. Published reports are searchable via Remote SharePoint knowledge sources — no dedicated index needed.

---

## What AI Does NOT Do

- Replace or override statistical calculations
- Access raw measurement data (stats-only payloads)
- Auto-act without confirmation (AI suggests actions; analyst approves before execution)
- Appear in the PWA (ever)
- Require configuration to use VariScout (graceful degradation)

---

## Implementation Details

| Topic                                                                           | Document                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System architecture, packages, auth, data flow, hook composition, cost controls | [AI Architecture](ai-architecture.md)                                                                                                                                                                 |
| Prompt tiers, context layers, token budgets, phase-aware filtering, caching     | [AI Context Engineering](ai-context-engineering.md)                                                                                                                                                   |
| Governance, tone, confidence calibration, interaction patterns                  | [AIX Design System](aix-design-system.md)                                                                                                                                                             |
| Knowledge model, glossary, methodology concepts                                 | [Knowledge Model](knowledge-model.md)                                                                                                                                                                 |
| Architecture decisions                                                          | [ADR-019](../../07-decisions/adr-019-ai-integration.md), [ADR-026](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md), [ADR-027](../../07-decisions/adr-027-ai-collaborator-evolution.md) |
| Investigation workflow                                                          | [Investigation to Action](../../03-features/workflows/investigation-to-action.md)                                                                                                                     |
| AI component UX specs                                                           | [AI Components](../../06-design-system/components/ai-components.md)                                                                                                                                   |
