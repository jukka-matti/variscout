---
title: 'AI-Assisted Analysis (Archived)'
---

> **ARCHIVED** — User-facing AI content absorbed into [AI Journey Integration](../05-technical/architecture/ai-journey-integration.md). Technical details (caching, error states) moved to [AI Architecture](../05-technical/architecture/ai-architecture.md).

# AI-Assisted Analysis

Optional AI enhancement for the Azure App investigation workflow.

---

## Overview

AI-assisted analysis adds three progressive layers to the Azure App dashboard. Each layer builds on the previous, but all are optional — the app works perfectly without AI configured.

| Layer | Component        | Purpose                           | Phase   |
| ----- | ---------------- | --------------------------------- | ------- |
| 1     | NarrativeBar     | Plain-language analysis summary   | Phase 1 |
| 2     | ChartInsightChip | Per-chart contextual suggestions  | Phase 2 |
| 3     | CoScoutPanel     | Conversational analysis assistant | Phase 3 |

**Availability:** Azure App only (Standard and Team plans). Requires AI endpoint configured in ARM deployment AND user Settings toggle "Show AI assistance" set to ON. PWA never has AI.

---

## User Control

AI visibility is controlled by a per-user toggle in Settings:

| Setting                                   | Behavior                              |
| ----------------------------------------- | ------------------------------------- |
| No AI endpoint configured                 | AI UI never shown, toggle not visible |
| Endpoint configured + toggle ON (default) | All AI layers visible                 |
| Endpoint configured + toggle OFF          | All AI layers hidden                  |

Some analysts prefer unassisted analysis. The toggle respects this preference and persists in AnalysisState/localStorage.

---

## Layer 1: Narrative Summary Bar

A single-line bar at the bottom of the Azure Dashboard. Summarizes the current analysis state in plain language.

### Examples

- "Machine A explains 47% of variation. Morning shift shows Nelson Rule 2 violation. Cpk 0.85 below target 1.33."
- "3 findings pinned. Key driver: Fill Head 3 (47% contribution). Suggestion: investigate Operator next (23% remaining)."
- "Process stable — no control violations. Cpk 1.52 above target. 99.2% yield."

### When It Updates

- Analysis data loaded or changed
- Filter applied or removed (debounced — max 1 request per 5 seconds)
- Specifications set or modified
- Finding pinned or status changed

### States

| State              | Display                                |
| ------------------ | -------------------------------------- |
| Loading            | Subtle shimmer animation               |
| Response received  | Summary text                           |
| Cached response    | Summary text + subtle "(cached)" label |
| Offline (no cache) | Bar hidden                             |
| Error              | Bar hidden (errors are always quiet)   |

The "Ask →" button at the bar's right edge opens the CoScout Panel (Layer 3).

---

## Layer 2: Chart Insight Chips

Small chips displayed below chart cards. Each chip provides a contextual suggestion specific to the chart it accompanies.

### Per-Chart Examples

| Chart   | Chip Example                                     | Trigger                 |
| ------- | ------------------------------------------------ | ----------------------- |
| I-Chart | "Process shift detected at point 34"             | Nelson Rule 2 violation |
| I-Chart | "Increasing trend — 7 consecutive rising points" | Run pattern detected    |
| Boxplot | "→ Drill Machine A (47%)"                        | Highest η² category     |
| Boxplot | "Machine C spread 3× wider than others"          | Outlier distribution    |
| Pareto  | "Top 2 categories explain 73% of variation"      | Concentration pattern   |
| Stats   | "Cpk 0.85 — below 1.33 target"                   | Below target threshold  |

### Relationship to Deterministic Suggestions

VariScout already has deterministic suggestion functions (`getNextDrillFactor()`, `shouldHighlightDrill()`) that provide instant, offline, statistically grounded guidance. These remain the primary UI — the yellow glow on high-η² categories, the suggested next drill factor.

AI chips add natural language explanation to the same recommendation:

- **Without AI:** Yellow glow on Machine A category
- **With AI:** Same glow + chip: "Machine A recommended — 47% of remaining variation. Your process description mentions nozzle clogging as a key concern."

AI never overrides deterministic suggestions. If they disagree, the deterministic answer wins.

### Behavior

- Chips are dismissable (X button)
- Hidden entirely on any error (never show error states on charts)
- One chip per chart maximum

---

## Layer 3: CoScout Panel

A resizable slide-out panel (same pattern as FindingsPanel) for conversational analysis assistance.

### Activation

- "Ask →" button in Narrative Summary Bar
- Dedicated CoScout button in toolbar

### Capabilities

- **Context-aware conversation** — Knows current filters, charts, findings, violations, process description
- **Document retrieval** (Team plan) — Queries Azure AI Search for relevant team documents (fault trees, SOPs, process maps from SharePoint)
- **Investigation guidance** — Suggests next steps based on current findings and accumulated knowledge
- **Report generation** — Converts findings into stakeholder-ready narrative

### Example Interactions

**Analyst:** "Why is Fill Head 3 drifting?"
**CoScout:** "Based on your findings, Fill Head 3 accounts for 47% of variation with a downward drift starting at point 34. Your team's FMEA lists nozzle wear (RPN 180) as the top failure mode for fill head drift. Past investigations (3 resolved findings) show nozzle replacement resolved similar drift 90% of the time."

**Analyst:** "Generate a summary for the improvement project review"
**CoScout:** Produces structured report from findings data — key drivers, actions taken, Cpk improvements, outstanding items.

### Knowledge Layer: Azure AI Search

Azure AI Search is a managed service (not a custom RAG pipeline) that indexes two document types:

1. **Published scouting reports** -- Published as Markdown to the team's SharePoint folder. Contains KPIs, findings, corrective actions, outcomes.
2. **Team quality documents** -- Accessed via Remote SharePoint knowledge source (ADR-026). Fault trees, SOPs, process maps, control plans from the team's SharePoint folder.

Azure AI Search provides built-in hybrid search (keyword + semantic ranking) and optional agentic retrieval for complex queries that need decomposition.

### Error States

| Error          | Display                                                         |
| -------------- | --------------------------------------------------------------- |
| API error      | Inline error message with retry button                          |
| Content filter | "I can't answer that question. Try rephrasing."                 |
| Rate limit     | "Please wait a moment before asking again."                     |
| Offline        | "AI unavailable offline" with last conversation history visible |

---

## Offline Behavior

| Layer            | Online            | Offline (cached)                                    | Offline (no cache)                                  |
| ---------------- | ----------------- | --------------------------------------------------- | --------------------------------------------------- |
| NarrativeBar     | Live response     | Cached summary shown                                | Hidden                                              |
| ChartInsightChip | Live response     | Cached chips shown                                  | Hidden                                              |
| CoScoutPanel     | Live conversation | Conversation history visible, new messages disabled | Conversation history visible, new messages disabled |

All cached responses have a 24-hour TTL or expire when analysis data changes.

---

## Process Context

AI quality depends on structured process metadata. VariScout enriches AI context progressively:

### Auto-Inferred Context (Phase 1 — zero friction)

At import time, VariScout matches column names against keyword groups to infer factor roles:

| Column Name Contains        | Inferred Role    | AI Impact                                 |
| --------------------------- | ---------------- | ----------------------------------------- |
| machine, line, head, nozzle | Equipment factor | "Machine B (equipment) accounts for 47%"  |
| shift, day, week, hour      | Temporal factor  | "Morning shift shows consistent drift"    |
| operator, technician        | Operator factor  | "Operator 3 has wider spread than others" |
| batch, lot, supplier        | Material factor  | "Lot 2024-03 correlates with the shift"   |

Measurement unit is inferred from outcome column name suffixes ("Weight_g" → grams).

### User-Provided Context

- **processDescription** — Free text field in Settings: "Coffee sachet filling line. 4 fill heads, 3 shifts."
- **Optional process wizard** (Phase 2) — Process type, industry, process steps after first analysis

### Context Impact — Before and After

| Without context                                                   | With context                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| "Category 'B' in factor 'Machine' accounts for 47% of variation." | "Fill Head B accounts for 47% of weight variation. You mentioned nozzle clogging as a concern — check the nozzle on Head B." |

## Knowledge Accumulation

VariScout's Finding system builds a measurement-backed knowledge base from normal usage:

| Traditional FMEA                     | VariScout Finding                       |
| ------------------------------------ | --------------------------------------- |
| Severity (1-10 guess)                | Cpk + pass rate (actual)                |
| Occurrence (1-10 guess)              | η² contribution % (actual)              |
| Recommended action (rarely verified) | Corrective action with Cpk before/after |

Each resolved finding adds real, measured, outcome-verified knowledge. After 50+ resolved findings, the AI has genuine organizational knowledge:

- "You've seen this pattern 3 times in 6 months. Nozzle wear was the cause 67% of the time."
- "Nozzle replacement improved Cpk by 0.47 on average. Average resolution: 5 days."

### Providing Process Context (Phase 3)

**From team documents:** When SOPs, control plans, or process maps are uploaded to the Teams channel SharePoint, VariScout can extract structured context suggestions and present them for confirmation.

**From accumulated findings:** Cross-project knowledge queries via Azure AI Search ("Have we seen this pattern before?") reference findings from all team projects.

## Investigation Workflow — Where AI Helps

| Step                 | Analyst Action           | AI Assistance                                                             |
| -------------------- | ------------------------ | ------------------------------------------------------------------------- |
| 1. Detect            | I-Chart shows red dots   | Narrative bar: "Process shift detected at point 34"                       |
| 2. Locate            | Drill-down by factors    | Chart chip: "→ Drill Machine A (47%)"                                     |
| 3. Problem statement | Pin finding              | Auto-generated from filters + stats                                       |
| 4. Assign            | Assign to investigator   | —                                                                         |
| 5. Investigate       | Check shop floor         | CoScout: "Last time Machine A drifted, it was nozzle wear (3 of 4 times)" |
| 6. Suspected cause   | Enter in finding         | —                                                                         |
| 7. Derive action     | Define corrective action | CoScout: "SOP says: replace nozzle tip, perform alignment procedure"      |
| 8. Verify            | Load new data, check Cpk | Narrative bar: "Cpk improved from 0.85 to 1.35 after corrective action"   |

## What AI Does NOT Do

- Replace or override statistical calculations
- Access raw measurement data (stats-only payloads)
- Auto-act on findings (no automatic status changes, no auto-drill)
- Appear in the PWA (ever)
- Require configuration to use VariScout (graceful degradation)

---

## Related Documentation

- [Investigation to Action](investigation-to-action.md) — Investigation workflow that AI enhances
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [AI Readiness Review](../../archive/ai-readiness-review.md) — Strategic architecture assessment (archived)
- [AI Architecture](../../05-technical/architecture/ai-architecture.md) — Technical implementation
- [AI Components](../../06-design-system/components/ai-components.md) — Component UX specs
