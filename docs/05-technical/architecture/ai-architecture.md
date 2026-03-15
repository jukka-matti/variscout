# AI Architecture

Technical architecture for optional AI integration in the Azure App.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  BROWSER (offline-capable)                           │
│                                                      │
│  Dashboard + Charts ←→ Context Collector             │
│  (Hybrid UX)            (auto-gathers stats,         │
│                          filters, findings,           │
│                          violations, process desc)    │
│                                                      │
│  AI Service                Prompt Templates           │
│  (apps/azure/services)     (@variscout/core)          │
│  fetchNarration()          narration, suggestion,     │
│  fetchChartInsight()       coscout, report            │
│  fetchCoScoutResponse()                              │
│  fetchCoScoutStreamingResponse()                     │
│                                                      │
│  localStorage Cache                                  │
│  (cached AI responses + conversation history)         │
└──────────────────────┬──────────────────────────────┘
                       │ (when online)
┌──────────────────────▼──────────────────────────────┐
│  AZURE (customer's tenant — optional)                │
│                                                      │
│  Azure AI Foundry          Azure AI Search            │
│  (GPT-4o / Claude / etc)   (hybrid + semantic)        │
│                                                      │
│  SharePoint                OneDrive                   │
│  (fault trees, SOPs)       (.vrs projects)            │
│                                                      │
│  Azure Function            ARM Template               │
│  (findings indexer)        (deploys conditionally)     │
└──────────────────────────────────────────────────────┘
```

---

## Package Responsibilities

| Component                 | Package                   | Description                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildAIContext()`        | `@variscout/core`         | Pure function. Collects computed stats, filters, findings, violations into a structured payload. No React dependency.                                                                                                                        |
| Prompt templates          | `@variscout/core`         | String templates for narration, suggestion, CoScout, and report tasks. Grounded in VariScout glossary terms.                                                                                                                                 |
| `aiService.ts`            | `apps/azure/src/services` | localStorage response caching. Auth via `getAuthHeaders()` (EasyAuth). Retry + exponential backoff.                                                                                                                                          |
| `useAIContext` hook       | `@variscout/hooks`        | React hook wrapping `buildAIContext()`. Recomputes on DataContext changes.                                                                                                                                                                   |
| `useAICoScout` hook       | `@variscout/hooks`        | Chat state management, conversation history, streaming response handling. The inline CoScout (in FindingsPanel) and standalone CoScout panel share the same `useAICoScout` hook instance — conversation state persists across both surfaces. |
| `useNarration` hook       | `@variscout/hooks`        | React hook for narrative bar state (loading, cached, error). Wraps `fetchNarration`.                                                                                                                                                         |
| `useChartInsights` hook   | `@variscout/hooks`        | Per-chart deterministic + AI-enhanced insight orchestration. Debounced AI with fallback.                                                                                                                                                     |
| `NarrativeBar`            | `@variscout/ui`           | Single-line summary bar component.                                                                                                                                                                                                           |
| `ChartInsightChip`        | `@variscout/ui`           | Per-chart suggestion badge.                                                                                                                                                                                                                  |
| `CoScoutPanel`            | `@variscout/ui`           | Slide-out conversational panel.                                                                                                                                                                                                              |
| `CoScoutInline`           | `@variscout/ui`           | Compact collapsible CoScout conversation embedded in FindingsPanel.                                                                                                                                                                          |
| `CoScoutMessages`         | `@variscout/ui`           | Shared message rendering (user/assistant bubbles, loading dots).                                                                                                                                                                             |
| `InvestigationPhaseBadge` | `@variscout/ui`           | Colored pill badge showing investigation phase (initial/diverging/validating/converging/acting).                                                                                                                                             |

---

## Context Collection

AI never receives raw measurement data. Context is assembled in four layers:

### Layer 1 — Analysis State (automatic)

Everything already in DataContext, extracted by `buildAIContext()`:

- Computed statistics: mean, median, stdDev, Cp, Cpk, pass rate
- Variation metrics: η² per factor, cumulative scope, Total SS
- Violations: Nelson Rule 2 (shift) and Rule 3 (trend) sequence counts, control/spec limit breaches
- Findings: title, status, tag, factor, contribution %, suspected cause, actions, outcome
- Filter state: active drill path and breadcrumbs

Typical payload: <500 tokens.

### Layer 2 — Process Context (structured + free text)

Structured metadata and free text describing the analyst's process. Persisted in `AnalysisState.processContext`.

```typescript
interface ProcessContext {
  // Free text (always available)
  description?: string;

  // Process identity (Phase 2 — optional wizard)
  processType?: 'manufacturing' | 'service' | 'laboratory' | 'logistics' | 'other';
  industry?: string;

  // Measurement context (auto-inferred from column names)
  measurementUnit?: string;

  // Factor role mapping (auto-inferred from column names, user can correct)
  // Keyed by column name → role type. Multiple columns can share the same role.
  // See ai-components.md ProcessContext Entry for UX spec.
  factorRoles?: Record<string, 'equipment' | 'temporal' | 'operator' | 'material' | 'location'>;

  // Process structure (Phase 2 — optional)
  processSteps?: string[];
}
```

**Factor role auto-inference:** During `detectColumns()`, VariScout matches column names against keyword groups (equipment, temporal, operator, material, location) using the existing parser keyword infrastructure in `packages/core/src/parser/keywords.ts`. Inferred roles are stored in `ProcessContext.factorRoles` and shown as dismissable badge chips on column cards in ColumnMapping.

**Progressive disclosure:**

- Phase 1: Auto-inferred factor roles + `description` text field in Settings
- Phase 2: Optional "About your process" wizard (3-5 fields, dismissable, once per project)

### Layer 3 — Knowledge Grounding (Glossary + Methodology Concepts)

The knowledge model (`packages/core/src/glossary/`) provides both domain term definitions and methodology concepts injected into AI prompts via `buildGlossaryPrompt({ includeConcepts: true })`. This is the top validated strategy for reducing AI hallucination in specialized domains.

The system includes:

- **~47 vocabulary terms** across 6 categories (control-limits, capability, statistics, methodology, investigation, charts) — including standard tool terms (I-Chart, Boxplot, Pareto, Capability)
- **11 methodology concepts** across 3 categories (framework, phase, principle) — Parallel Views, Two Voices, Progressive Stratification, Iterative Exploration, investigation phases

CoScout prompts are grounded in VariScout's methodology rather than generic SPC terminology. See [Knowledge Model Architecture](knowledge-model.md) and [AI Context Engineering](ai-context-engineering.md) for details.

### Layer 4 — Team Documents (Azure AI Search, Phase 3)

Fault trees, process maps, SOPs, control plans from Teams channel SharePoint. Indexed by Azure AI Search (enhanced by Foundry IQ managed orchestration) and retrieved by the CoScout Panel during conversation.

**AI-extracted context from documents:** When team documents are uploaded to SharePoint, an Azure Function can extract structured ProcessContext suggestions (process steps, measurement units) and present them to the user for confirmation. AI suggests, user confirms — never auto-overwrite.

---

## AI Service

### Dual-Model Routing

```typescript
type AITier = 'fast' | 'reasoning';

// fast → cheap model (narrative bar, chart chips)
// reasoning → capable model (CoScout conversation, reports)
```

The service accepts a `tier` parameter and routes to the appropriate model deployment. Model names are configured in the ARM template (customer chooses during deployment).

### Response Caching

- **Cache key:** Hash of context payload (stats + filters + finding count + process description hash)
- **Storage:** localStorage
- **TTL:** 24 hours or until analysis data changes (whichever first)
- **Stale indicator:** "(cached)" label when showing cached response after data change

### Debouncing

AI requests throttled to max 1 per 5 seconds. Prevents rapid-fire on filter drilling.

---

## Authentication

AI API keys are never exposed in client-side JavaScript.

**Approach:** Azure AD (Entra ID) token authentication via EasyAuth.

1. ARM template adds Cognitive Services scope (`https://cognitiveservices.azure.com/.default`) to EasyAuth `authsettingsV2`
2. Browser obtains tokens via existing `getAccessToken()` in `apps/azure/src/auth/easyAuth.ts`
3. AI calls use bearer token (same pattern as Graph API calls)
4. RBAC controls access: user needs "Cognitive Services User" role on the AI resource

No `VITE_AI_KEY` environment variable. The AI endpoint URL (`VITE_AI_ENDPOINT`) is a build-time setting (not a secret).

---

## Knowledge Layer: Azure AI Search + Foundry IQ

> **Status:** Planned — not yet implemented. See Implementation Notes in [ADR-019](../../07-decisions/adr-019-ai-integration.md).

Azure AI Search is a managed service — not a custom RAG pipeline. No custom embeddings, no vector database, no dedicated infrastructure. **Azure AI Foundry IQ** (late 2025) adds a managed orchestration layer on top that simplifies and enhances the approach:

- **SharePoint Indexed Knowledge Source** — auto-generates data source, skillset (chunking + vectorization), index, indexer from SharePoint connection
- **Foundry IQ agentic reasoning** — managed query decomposition, parallel sub-queries, semantic reranking, built-in source attribution
- Use **extractive retrieval mode** (not answer synthesis) for most scenarios — cheaper, more transparent
- Set `retrieval_reasoning_effort` to "minimal" for Phase 1/2 to control costs

### Indexed Content

| Source                 | Index Method                                  | Content                                                                                                         |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| VariScout findings     | Azure Function (OneDrive webhook)             | Structured documents: project, title, factor, contribution %, Cpk, suspected cause, corrective actions, outcome |
| Team quality documents | SharePoint connector (Foundry IQ auto-config) | DOCX, XLSX, PPTX, PDF from Teams channel document libraries                                                     |
| Process descriptions   | Bundled with findings                         | Per-project context text                                                                                        |

### Findings Write Path

Azure Function triggered by OneDrive file changes (Graph webhook):

1. Receives notification of `.vrs` file change
2. Downloads and parses the file
3. Extracts findings as structured documents
4. Pushes to Azure AI Search index via Search SDK (upsert by finding ID)

The function runs in the customer's tenant with Managed Identity for auth. Browser stays free of Search SDK dependencies.

### Search Capabilities

- **Hybrid search:** Keyword + semantic ranking (built-in)
- **Agentic retrieval:** LLM-assisted query decomposition for complex questions (e.g., "Why is Fill Head 3 drifting?" → sub-queries for past findings, fault tree branches, recent corrective actions)

### SharePoint Connector

The SharePoint Online indexer is in public preview (March 2026). Foundry IQ's SharePoint Indexed Knowledge Source simplifies configuration by auto-generating the full indexing pipeline. Teams channel files are stored in SharePoint document libraries, so they are accessible. Have a Blob Storage fallback if the SharePoint connector has reliability issues.

**Data Zone Standard:** For EU customers, Azure now offers Data Zone Standard deployments with EU data residency and higher quota than regional. Recommended for GDPR compliance.

### Findings as Knowledge Base

Each resolved finding adds measured, verified, outcome-backed knowledge. The 8-step investigation workflow (detect → locate → problem statement → assign → investigate → suspected cause → derive action → verify) maps directly to where AI adds value:

- **Step 5 (investigate):** AI suggests what to check from past findings + team documents
- **Step 7 (derive action):** AI suggests actions from past outcomes + SOPs

After 50+ resolved findings, the AI has genuine organizational knowledge that no competitor can match — measurement-backed, closed-loop, and continuously evolving.

---

## ARM Template Resources

All AI resources are conditional on `parameters('enableAI')`:

| Resource                   | Type                                                               | Purpose                                               |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| AI Services account        | `Microsoft.CognitiveServices/accounts` (kind: AIServices, SKU: S0) | Azure AI Foundry host                                 |
| Fast model deployment      | `Microsoft.CognitiveServices/accounts/deployments`                 | Cheap model (e.g., GPT-4o-mini) for narration + chips |
| Reasoning model deployment | `Microsoft.CognitiveServices/accounts/deployments`                 | Capable model (e.g., GPT-4o) for CoScout + reports    |
| AI Search service          | `Microsoft.Search/searchServices` (Phase 3)                        | Knowledge index                                       |
| Azure Function             | `Microsoft.Web/sites` (Phase 3)                                    | Findings indexer                                      |

`createUiDefinition.json` additions:

- "Enable AI-powered analysis" checkbox → `enableAI` boolean parameter
- Model selection dropdown (GPT-4o-mini default, GPT-4o, Claude Sonnet)

EasyAuth `authsettingsV2` updated to include Cognitive Services scope.

---

## Cost Controls

| Control              | Mechanism                                                       |
| -------------------- | --------------------------------------------------------------- |
| Stats-only payloads  | Typically <500 tokens per request                               |
| Max context tokens   | 2K for narration (fast tier), 8K for CoScout (reasoning tier)   |
| Client-side throttle | Max 1 narration request per 5 seconds                           |
| Response caching     | Reduces repeat queries for same analysis state                  |
| Dual-model routing   | Cheap model for simple tasks, reasoning model only for CoScout  |
| Monthly budget       | Configurable via ARM template parameters (Azure spending limit) |

**API version:** Requests use the API version configured on the Azure AI Foundry endpoint. Client-side code does not pin an API version.

---

## Error Handling

| UI Layer         | Error State      | Behavior                                        |
| ---------------- | ---------------- | ----------------------------------------------- |
| NarrativeBar     | API error        | Show last cached response, or hide bar          |
| NarrativeBar     | Timeout (>10s)   | Cancel request, hide bar, log to `errorService` |
| ChartInsightChip | Any error        | Hide chip entirely                              |
| CoScoutPanel     | API error        | Inline error with retry button                  |
| CoScoutPanel     | Content filter   | "I can't answer that question. Try rephrasing." |
| CoScoutPanel     | Rate limit       | "Please wait a moment before asking again."     |
| All              | No AI configured | UI elements hidden entirely                     |

All errors logged to `errorService` (existing in `@variscout/ui`). No user-facing error modals.

---

## Testing Strategy

| Component            | Test Type                    | Approach                                                 |
| -------------------- | ---------------------------- | -------------------------------------------------------- |
| `buildAIContext()`   | Unit (`@variscout/core`)     | Deterministic pure function — standard Vitest assertions |
| Prompt templates     | Snapshot (`@variscout/core`) | Verify template output structure, not exact wording      |
| `aiService.ts`       | Unit (`apps/azure`)          | Mock `fetch()`, test routing, caching, error handling    |
| `useAIContext`       | Unit (`@variscout/hooks`)    | Mock DataContext, verify context shape                   |
| `useAICoScout`       | Unit (`@variscout/hooks`)    | Mock AI service, test chat state management              |
| `NarrativeBar`       | Component (`@variscout/ui`)  | Render with/without response, verify hide on no-config   |
| `ChartInsightChip`   | Component (`@variscout/ui`)  | Render with data, verify dismissal, verify hide on error |
| `CoScoutPanel`       | Component (`@variscout/ui`)  | Render chat, verify send/receive, error states           |
| Graceful degradation | E2E (`apps/azure`)           | Load app without AI endpoint — verify all features work  |
| AI integration       | Integration (`apps/azure`)   | Recorded response fixtures (replay, not live AI)         |

---

## Converging-Phase Ideation Coaching

When the investigation reaches a converging state — one or more hypotheses are supported — the CoScout system prompt is augmented with ideation-specific instructions. This encourages the analyst to move from root cause confirmation into improvement brainstorming.

**Trigger:** `getCoScoutPhase()` returns `'converging'` (at least one supported hypothesis exists on the active finding).

**Prompt changes:**

- System prompt adds coaching instructions: guide the analyst toward actionable improvement ideas, ask about constraints (budget, timeline, authority), suggest structured approaches (eliminate, reduce, control)
- Suggested questions include improvement-focused options (e.g., "What improvements could address this?", "How could we prevent this from recurring?")

**No new AI endpoints.** The converging-phase coaching reuses the existing `fetchCoScoutResponse()` / `fetchCoScoutStreamingResponse()` calls — only the system prompt content changes based on investigation phase.

---

### buildAIContext() Design

The `buildAIContext()` function in `@variscout/core` is the structured bridge between the data layer and AI. Design principles:

- **Token-budget aware:** Accepts a `maxTokens` parameter and truncates context layers in priority order (findings first, then process context, then violations)
- **Deterministic insights as input:** Includes computed suggestions from `getNextDrillFactor()` and `shouldHighlightDrill()` so AI explains rather than competes
- **Structured output:** Returns a typed `AIContext` object, not a string — prompt templates handle serialization
- **Pure function:** No React dependency, no side effects — lives in `@variscout/core`

---

## Team-Aware AI Context

When running in a Teams channel tab (Azure Team plan), the AI context includes team collaboration metadata.

| Field                              | Type       | Source                            | Purpose                                    |
| ---------------------------------- | ---------- | --------------------------------- | ------------------------------------------ |
| `teamContributors.count`           | `number`   | Distinct `finding.author` values  | Know how many people are investigating     |
| `teamContributors.hypothesisAreas` | `string[]` | Hypothesis factor names by author | Know which factors each person has covered |

**Behavior:**

- CoScout can suggest: "Alex already tested Machine A — consider checking Machine B instead"
- Author metadata flows from `Finding.author` (captured via EasyAuth `getEasyAuthUser()`)
- No raw channel history is accessed — only structured finding/hypothesis metadata
- Field is only populated when `isTeamPlan()` returns true and findings have author data

---

## See Also

- [Knowledge Model Architecture](knowledge-model.md) — Unified term + concept registry
- [AI Context Engineering](ai-context-engineering.md) — Three-tier prompt architecture
- [VariScout Methodology](../../01-vision/methodology.md) — Human-readable methodology reference
- [AI Readiness Review](ai-readiness-review.md) — Strategic architecture assessment
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [AI-Assisted Analysis Workflow](../../03-features/workflows/ai-assisted-analysis.md) — User-facing workflow
- [AI Components](../../06-design-system/components/ai-components.md) — Component UX specs
- [Component Patterns](component-patterns.md) — Hook integration, colorScheme, base patterns
- [Data Flow](data-flow.md) — Existing data pipeline
