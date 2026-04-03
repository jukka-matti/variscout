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
| **AI Enabled**          | Azure Standard/Team with AI Foundry deployed               | NarrativeBar + ChartInsightChips + CoScout active from SCOUT onward. Phase-aware prompts. Actionable suggestions with analyst confirmation. |
| **AI + Knowledge Base** | Azure Team (€199/month) only                               | Adds organizational document search (Foundry IQ) in CoScout from SCOUT onward (on-demand). Cross-project knowledge queries.                 |

**Mode ≠ Tier:** AI is a horizontal capability, not tier-gated. A Standard customer who deploys AI Foundry gets Mode 2. Only the Knowledge Base (Mode 3) is Team exclusive.

**Availability:** Azure App only (Standard and Team plans). Requires AI endpoint configured in ARM deployment AND user Settings toggle "Show AI assistance" set to ON. PWA never has AI.

---

## Four Context Layers

| Layer   | What                | Source                                                                                  | When                            |
| ------- | ------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| Layer 1 | Analysis state      | `buildAIContext()` from DataContext                                                     | Always (Mode 2+)                |
| Layer 2 | Process context     | User-entered description + auto-inferred factor roles                                   | Optional (Mode 2+)              |
| Layer 3 | Knowledge grounding | ~47 glossary terms + 11 methodology concepts                                            | Always (Mode 2+)                |
| Layer 4 | Team documents      | Foundry IQ unified knowledge index (Blob Storage — documents + investigation artifacts) | On-demand, SCOUT+ (Mode 3 only) |

Layers 1-3 are always in the prompt. Layer 4 is injected only when the user clicks "Search Knowledge Base?" in CoScout. See [AI Context Engineering](ai-context-engineering.md) for token budgets and prompt tier structure.

---

## AI per Journey Phase

### FRAME — Setup (No AI Active)

AI is not active during FRAME — there is no analysed data yet. However, FRAME seeds the AI context used in later phases:

- **Process description** — Free text field in Settings (persisted in `AnalysisState.processContext`)
- **Factor roles** — Auto-inferred from column names during `detectColumns()` (equipment, temporal, operator, material, location)
- **Analysis brief** — Azure users can capture an upfront hypothesis, which seeds the investigation tree root in INVESTIGATE

FRAME seeds the `ProcessContext` used by AI in later phases.

### SCOUT — Discovery (AI Active)

Watson's EDA chart sequence: I-Chart → Boxplot → Pareto → Capability. AI explains what you see and suggests what to do. CoScout generates additional questions from context that Factor Intelligence cannot derive — from the issue statement text, upfront hypotheses, factor roles, spec limits, and data patterns. These complement the deterministic Factor Intelligence questions (R²adj ranking) to form a merged question checklist.

| Component            | No AI                      | AI Enabled                                                                      | AI + Knowledge Base                                        | Reasoning Effort |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| **NarrativeBar**     | Hidden                     | Summary bar: "Machine A explains 47% of variation. Cpk 0.85 below target 1.33." | Same (KB doesn't affect narration)                         | `'none'`         |
| **ChartInsightChip** | Deterministic insight only | AI-enhanced: "→ Drill Machine A (47%) — your process mentions nozzle clogging"  | Same                                                       | `'none'`         |
| **CoScout**          | Hidden                     | Available: "Why is this chart showing a shift?"                                 | + On-demand KB search: "Have we seen this pattern before?" | `'low'`          |

**Deterministic-first pipeline:** ChartInsightChips always render a deterministic insight first (from `buildIChartInsight()`, `buildBoxplotInsight()`, etc.). AI enhancement replaces it when ready. Insights work in all modes, including PWA.

**Actionable suggestions:** ChartInsightChips with drill suggestions show an arrow icon and are clickable — clicking applies the filter with analyst confirmation. AI never auto-acts.

### INVESTIGATE — Structured Learning (Phase-Aware AI)

The Investigation Diamond (Initial → Diverging → Validating → Converging) with phase-specific AI coaching:

| Diamond Phase | AI Role        | CoScout Behavior                                                                                                                                                                                                            | Reasoning Effort |
| ------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Initial       | Orientation    | Help identify which questions to check first (Factor Intelligence ranking)                                                                                                                                                  | `'none'`         |
| Diverging     | Exploration    | Encourage exploring open questions, suggest follow-ups                                                                                                                                                                      | `'low'`          |
| Validating    | Interpretation | Help interpret evidence for/against (eta-squared, R²adj — contribution, not causation)                                                                                                                                      | `'medium'`       |
| Converging    | Synthesis      | Help synthesize evidence into **SuspectedCause hubs**: propose hub connections, suggest hub names, draft synthesis text, flag cross-hub overlap. Assist with problem statement refinement. Brainstorm improvements per hub. | `'medium'`       |

> **Hub creation is Investigation workspace only.** The Converging phase's synthesis work — creating named hubs, connecting questions, writing synthesis narratives — happens in the Investigation workspace layout where CoScout has sufficient space to assist. The PI panel (Analysis workspace) shows hubs read-only. This separation keeps the analysis exploration context clean while giving structured hub creation the full-width workspace it needs.

> **Note on reasoning effort:** Investigation Diamond phases map to journey phases for reasoning effort: Initial/Diverging → SCOUT (`'low'`), Validating/Converging → INVESTIGATE (`'medium'`). The effort level is set by `getCoScoutReasoningEffort(journeyPhase)` from `@variscout/core`.

**Knowledge Base (Mode 3):** "Search Knowledge Base?" button in CoScout triggers Foundry IQ (unified knowledge index — Blob Storage documents + investigation artifacts, per ADR-060). Returns project-scoped results with source attribution. See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md) for knowledge features (beta).

**Investigation Sidebar:** Shows deterministic suggested questions from `buildSuggestedQuestions()` (works in all modes). With AI, adds AI-generated follow-up questions.

**Question Generation Sources:** Questions come from three complementary sources:

1. **Factor Intelligence L1-3** (deterministic, always available) — R²adj ranking of factors and combinations. Auto-answers questions where R²adj < 5% as "ruled out". Generates Layer 2-3 follow-ups when earlier questions are answered.
2. **Heuristic** (deterministic, always available) — Stability questions (I-Chart), capability questions (when specs exist), temporal trend questions.
3. **CoScout** (AI layer, Azure with CoScout only) — Natural language questions from issue statement text, upfront hypotheses, factor role inference, and data pattern recognition.

### IMPROVE — PDCA Cycle (Verification AI)

Plan → Do → Check → Act. AI shifts to action planning and outcome verification.

| PDCA Step | AI Assistance                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Plan**  | CoScout helps brainstorm improvements, compare effort vs impact. Improvement ideas on findings get What-If projections.           |
| **Do**    | Corrective actions tracked. Teams auto-posting on analyzed + resolved findings (Team plan).                                       |
| **Check** | NarrativeBar summarizes staged comparison: mean shift, Cpk delta, violation reduction. CoScout grounded in before/after evidence. |
| **Act**   | Outcome assessment. "Effective" / "Not effective" / "Partial" with Cpk before/after auto-filled from staged data.                 |

**Reasoning effort:** `'low'` — IMPROVE actions are execution-focused, not analytically complex. The model validates outcomes and suggests actions rather than performing deep causal reasoning. This is a deliberate cost-control choice (see ADR-019).

**3-tier system prompt adaptation:** CoScout's IMPROVE instructions adapt based on available context:

1. **Basic** — Problem statement + findings + actions. CoScout coaches through PDCA steps.
2. **Suspected cause** — Adds primary/contributing cause context. CoScout references the confirmed root cause when suggesting actions and evaluating outcomes.
3. **Staged comparison** — Adds before/after deltas (mean shift, variation ratio, Cpk delta). CoScout switches to verification mode: "Is the improvement real and sustained? Are there new patterns? What sustaining controls are needed?"

**Tool availability in IMPROVE:**

| Tool                                                       | Availability        | Notes                                      |
| ---------------------------------------------------------- | ------------------- | ------------------------------------------ |
| Read tools (get_chart_data, get_statistical_summary, etc.) | Always              |                                            |
| SCOUT+ tools (apply_filter, create_finding, etc.)          | Available           | Filters useful for before/after comparison |
| create_hypothesis, suggest_action                          | Available           | Actions are the primary IMPROVE tool       |
| share_finding, publish_report                              | Team plan only      | Sharing at investigation milestones        |
| notify_action_owners                                       | IMPROVE + Team only | Notify assignees after actions finalized   |

**NarrativeBar in IMPROVE:** Verification behavior is context-driven (triggered by staged comparison data), not phase-driven. The NarrativeBar shows before/after comparison when `stagedComparison` is present in the AI context, regardless of which phase label is active.

**Knowledge Base in IMPROVE (Mode 3):** KB search shifts from diagnostic to prescriptive — finding similar past improvement patterns, sustaining control procedures (SOPs), and historical Cpk benchmarks to contextualize improvement magnitude.

**Staged verification:** When staged comparison data is present, all AI components switch to verification-specific behavior. See [AIX Design System § Verification Sub-pattern](aix-design-system.md#verification-sub-pattern-improve-phase-with-staged-data).

### Project Dashboard — Cross-Phase AI Touch Point

The **Project Dashboard** (Azure-only) is a persistent overview view that sits outside the standard phase flow. It provides a cross-phase AI summary that works regardless of which journey phase the project is currently in.

| Aspect          | Detail                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **When active** | When user opens a saved project (`activeView: 'dashboard'` in `panelsStore`). Also accessible as "Overview" tab from within the Editor.       |
| **AI summary**  | 1-3 sentence contextual summary: current investigation status, overdue items, suggested next step. Fast tier (gpt-5.4-nano, reasoning: none). |
| **Cache key**   | `variscout-dashboard` — state-aware, invalidates when `findingCount`, `hypothesisStatusCounts`, or `actionCompletionCount` changes.           |
| **No-AI mode**  | Dashboard shows status counts and question tree without the AI summary card. Left column expands to full width.                               |
| **Refresh**     | Checks cache staleness when the user returns to the dashboard mid-session — not just on first project load.                                   |

The dashboard also exposes a **"Ask CoScout..." input** which stores the question in `aiStore.pendingDashboardQuestion`, switches to the Editor, and pre-loads the question into the CoScout panel. The CoScout panel auto-calls `search_project` to answer "have we checked X?" questions.

Two new CoScout tools support the dashboard (both available SCOUT+, phase-gated out of FRAME):

- **`search_project`** (Read, auto-execute): Search project artifacts by text + status filters
- **`navigate_to`** (Hybrid): Navigate to panels/views (auto) or restore filter context (proposal)

See [ADR-042](../../07-decisions/adr-042-project-dashboard.md) for the design decisions.

### Future: Phase-Conditioned Narration Tone

Currently NarrativeBar generates the same style of summary regardless of journey phase. A future enhancement would append a short phase-specific instruction (~20 tokens) to the narration prompt:

| Phase       | Tone Suffix                                                         |
| ----------- | ------------------------------------------------------------------- |
| frame       | _(none — no narration in FRAME)_                                    |
| scout       | "Suggest patterns to investigate. Mention drilling into factors."   |
| investigate | "Reference existing findings. Suggest the next validation step."    |
| improve     | "Summarize improvement progress. Suggest verification or a report." |

Special case: when in SCOUT with 2+ active filters but 0 findings pinned → "Suggest pinning a finding to track this pattern."

This would be implemented as a `getPhaseToneSuffix(phase, filterCount, findingsCount)` helper in `narration.ts`, wired into `buildSummaryPrompt()`. The tone shift is subtle — it doesn't change what the narration says, but nudges the LLM toward phase-appropriate suggestions.

See also: [Navigation Patterns § Phase-Aware UX](../../06-design-system/patterns/navigation.md#7-phase-aware-ux) for the broader phase emphasis model.

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
PWA (Free)              Azure Standard                   Azure Team
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

After 50+ investigations, the AI has genuine organizational knowledge. Investigation artifacts (findings, questions, ideas) are indexed automatically in Foundry IQ (Blob Storage) — no manual publishing step needed. See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md).

---

## CoScout Knowledge Catalyst Flows (ADR-049)

### Image Flow (Bidirectional)

- **Forward:** Paste image into CoScout → CoScout analyzes visual evidence → optionally save insight as finding
- **Reverse:** `get_finding_attachment` tool retrieves finding photos → CoScout analyzes previously captured evidence

### Insight Capture Flow

- **During conversation:** Bookmark any CoScout message → save as finding (or add as comment on existing finding)
- **Auto-suggest:** CoScout uses `suggest_save_finding` tool in INVESTIGATE/IMPROVE phases to proactively propose saving insights
- **Session close:** Advisory prompt lists unsaved insights → analyst selects which to save before closing the panel

### Expert Collaboration Flow (Team)

- Finding shared via deep link → recipient adds comment with file attachment
- CoScout can retrieve attachment metadata via `get_finding_attachment`

### Phase Gating

| Capability                | Availability                                             |
| ------------------------- | -------------------------------------------------------- |
| `suggest_save_finding`    | INVESTIGATE + IMPROVE only                               |
| `get_finding_attachment`  | Always available                                         |
| Image paste               | Always available                                         |
| Session-close save prompt | Triggers when CoScout panel closes with unsaved insights |

---

## What AI Does NOT Do

- Replace or override statistical calculations
- Access raw measurement data (stats-only payloads)
- Auto-act without confirmation (AI suggests actions; analyst approves before execution)
- Appear in the PWA (ever)
- Require configuration to use VariScout (graceful degradation)

---

## Implementation Details

| Topic                                                                           | Document                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System architecture, packages, auth, data flow, hook composition, cost controls | [AI Architecture](ai-architecture.md)                                                                                                                                                                                     |
| Prompt tiers, context layers, token budgets, phase-aware filtering, caching     | [AI Context Engineering](ai-context-engineering.md)                                                                                                                                                                       |
| Governance, tone, confidence calibration, interaction patterns                  | [AIX Design System](aix-design-system.md)                                                                                                                                                                                 |
| Knowledge model, glossary, methodology concepts                                 | [Knowledge Model](knowledge-model.md)                                                                                                                                                                                     |
| Architecture decisions                                                          | [ADR-019](../../07-decisions/adr-019-ai-integration.md), [ADR-027](../../07-decisions/adr-027-ai-collaborator-evolution.md), [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md) (knowledge layer) |
| Investigation workflow                                                          | [Investigation to Action](../../03-features/workflows/investigation-to-action.md)                                                                                                                                         |
| AI component UX specs                                                           | [AI Components](../../06-design-system/components/ai-components.md)                                                                                                                                                       |
| CoScout Knowledge Catalyst (image paste, insight capture, session nudge)        | [ADR-049](../../07-decisions/adr-049-coscout-context-and-memory.md), [Knowledge Catalyst Design Spec](../../superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md)                                            |
