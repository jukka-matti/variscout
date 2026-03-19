---
title: AI Architecture
audience: [developer]
category: architecture
status: stable
scope: System architecture, packages, auth, ARM, data flow, hook composition, cost controls, testing
related: [ai-journey-integration, ai-context-engineering, aix-design-system, knowledge-model]
---

# AI Architecture

> **Scope:** System architecture — packages, auth, ARM, data flow, hook composition, cost controls, and testing. For the journey-organized AI overview, see [AI Journey Integration](ai-journey-integration.md). For governance and interaction patterns, see [AIX Design System](aix-design-system.md).

Technical architecture for optional AI integration in the Azure App.

> **See also:** [AIX Design System](aix-design-system.md) — governance, tone, trust calibration, and interaction patterns for all AI behavior.

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
│  (GPT-4o / Claude / etc)   (knowledge orchestration)  │
│                                                      │
│  SharePoint                OneDrive                   │
│  (published reports,       (.vrs projects)            │
│   SOPs, fault trees)                                 │
│                                                      │
│  Azure Function            ARM Template               │
│  (OBO token exchange)      (deploys conditionally)    │
└─────────────────────────────────────────────────────┘
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
| `CoScoutPanel`            | `@variscout/ui`           | Slide-out conversational panel. Explicitly references investigation phase in responses (phase coaching, not just silent adaptation).                                                                                                         |
| `CoScoutInline`           | `@variscout/ui`           | Compact collapsible CoScout conversation embedded in FindingsPanel.                                                                                                                                                                          |
| `CoScoutMessages`         | `@variscout/ui`           | Shared message rendering (user/assistant bubbles, loading dots).                                                                                                                                                                             |
| `InvestigationPhaseBadge` | `@variscout/ui`           | Colored pill badge showing investigation phase (initial/diverging/validating/converging/improving).                                                                                                                                          |

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

### Layer 4 -- Team Documents (SharePoint, ADR-026)

Published scouting reports, fault trees, process maps, SOPs, and control plans from the team's SharePoint folder. Accessed on demand via Azure AI Search **Remote SharePoint** knowledge sources with per-user permissions (user token passthrough).

**On-demand, not auto-fire:** Knowledge search is triggered when the user clicks the "Search Knowledge Base?" button in CoScout, not automatically on every message. This reduces latency and cost.

**Report publishing:** Scouting reports are published as Markdown files to the same SharePoint folder as `.vrs` files, making them searchable by future investigations.

See [ADR-026](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md) for the architecture decision.

---

## AI Service

### Dual-Model Routing

```typescript
type AITier = 'fast' | 'reasoning';

// fast → cheap model (narrative bar, chart chips)
// reasoning → capable model (CoScout conversation, reports)
```

The service accepts a `tier` parameter and routes to the appropriate model deployment. Model names are configured in the ARM template (customer chooses during deployment).

### Single-Path API (ADR-028)

As of ADR-028, only Azure OpenAI is supported. The AI service routes all requests through `responsesApi.ts` (Azure AI Foundry Responses API). The Chat Completions API path and Anthropic provider have been removed.

- **`sendResponsesTurn()`** — Single-turn request via the Responses API. Returns structured output (guaranteed JSON schema for narration and chart insights).
- **`streamResponsesWithToolLoop()`** — Streaming request with tool loop for CoScout. Handles the `suggest_knowledge_search` function call tool for intent-driven Knowledge Base access.
- **`getAIProviderLabel()`** — Always returns `"Azure OpenAI"`. Provider detection (`detectProvider`, `ModelProvider`), dual-format request building (`formatRequest`), and provider-specific response parsing (`parseResponseText`, `parseStreamDelta`) have been removed from `aiService.ts`.

`VITE_USE_RESPONSES_API` feature flag has been removed — the Responses API is always on.

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

## Runtime Configuration

For Azure Marketplace Managed Application deployments, the AI endpoint and feature flags are loaded at runtime from a `/config` endpoint served by the static server (`apps/azure/server.js`). This avoids baking customer-specific values into the build artifact.

```typescript
// apps/azure/src/lib/runtimeConfig.ts
interface RuntimeConfig {
  aiEndpoint?: string;
  searchEndpoint?: string;
  enableKnowledgeBase?: boolean;
}
```

The config is fetched once on app startup and merged with environment variables. Falls back gracefully when `/config` returns 404 (local development).

---

## Knowledge Layer: Azure AI Search + Remote SharePoint

> **Status:** Implemented (March 2026). See [ADR-026](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md).

Azure AI Search is a managed service -- not a custom RAG pipeline. **Remote SharePoint** knowledge sources access documents on demand with user credentials, requiring no indexer, no crawl schedule, and no additional storage costs.

### Architecture (ADR-026)

```
Publish Report --> reportExport.ts --> reportUpload.ts --> SharePoint folder
                                                            |
CoScout question --> User clicks "Search KB?" --> searchDocuments()
                                                            |
                                                  Azure AI Search (Foundry IQ)
                                                  --> Remote SharePoint knowledge source
                                                  --> User token passthrough (OBO)
                                                            |
                                                  formatKnowledgeContext() --> CoScout prompt
```

### Key Design Decisions

1. **Remote SharePoint (not indexed)**: No indexer, no crawl schedule, no storage duplication. Documents accessed on demand with user credentials. Requires at least 1 M365 Copilot license in tenant.

2. **On-demand search (not auto-fire)**: Knowledge search is triggered by user click, not on every CoScout message. Reduces latency, cost, and noise.

3. **Per-user permissions**: User's delegated token is passed via `x-ms-query-source-authorization` header. Users can only find documents they have access to in SharePoint.

4. **Report publishing**: Scouting reports are published as Markdown to the team's SharePoint folder (same location as `.vrs` files), making them searchable by future investigations.

5. **Folder-scoped search**: KQL filter limits search to the team's SharePoint folder path, avoiding cross-team results.

6. **ExtractedData output mode**: Foundry IQ returns raw chunks rather than synthesized answers. CoScout reasons over the raw context.

### Searchable Content

| Source                     | How It Gets There                      | What's Searchable                           |
| -------------------------- | -------------------------------------- | ------------------------------------------- |
| Published scouting reports | "Publish to SharePoint" in Report view | Markdown: KPIs, findings, actions, outcomes |
| SOPs, procedures           | Already in SharePoint folder           | Any document format SharePoint supports     |
| Fault trees, 8D reports    | Already in SharePoint folder           | Document content with citations             |
| Past investigation reports | Published by other team members        | Cross-investigation knowledge               |

### Findings as Knowledge Base

When findings are published as scouting reports to SharePoint, they become searchable by future investigations. The 8-step investigation workflow maps directly to where AI adds value:

- **Step 5 (investigate):** CoScout searches team documents for related causes and procedures
- **Step 7 (derive action):** CoScout references SOPs and past corrective actions

After 50+ published reports, the AI has genuine organizational knowledge -- measurement-backed, closed-loop, and continuously evolving.

---

## ARM Template Resources

All AI resources are conditional on `parameters('enableAI')`:

| Resource                   | Type                                                           | Purpose                                               |
| -------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| AI Services account        | `Microsoft.CognitiveServices/accounts` (kind: OpenAI, SKU: S0) | Azure AI Foundry host                                 |
| Fast model deployment      | `Microsoft.CognitiveServices/accounts/deployments`             | Cheap model (e.g., GPT-4o-mini) for narration + chips |
| Reasoning model deployment | `Microsoft.CognitiveServices/accounts/deployments`             | Capable model (e.g., GPT-4o) for CoScout + reports    |
| AI Search service          | `Microsoft.Search/searchServices` (2025-05-01 API)             | Knowledge base orchestration (Foundry IQ)             |
| Azure Function             | `Microsoft.Web/sites`                                          | OBO token exchange (SharePoint access)                |

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

## AI Collaborator Capabilities (ADR-027)

AI evolved from narrator to collaborator — it suggests concrete actions that the analyst confirms. See [ADR-027](../../07-decisions/adr-027-ai-collaborator-evolution.md) for the decision and [AIX Design System § 2.8](aix-design-system.md#28-actionable-suggestion-pattern-adr-027) for governance.

### CoScout Action Callbacks

CoScout responses can contain action markers that render as interactive elements:

- **`[Pin as Finding]`** — Renders as a button card. Clicking creates a finding with AI-generated text (analyst can edit before confirming).
- **Drill suggestion** — CoScout can reference a specific category: "Machine A accounts for 47% — try filtering to it." The category name renders as a clickable link.

Action callbacks flow through `CoScoutPanelBase` props (`onPinFinding`, `onDrillSuggestion`) to the app's action handlers.

### Upfront Hypothesis Seeding

When the analyst captures an upfront hypothesis in the analysis brief (FRAME), `buildAIContext()` includes it in the context. During SCOUT:

1. CoScout system prompt references the hypothesis: "The analyst suspects [hypothesis text]"
2. ChartInsightChips can highlight relevant categories that match the hypothesis
3. When INVESTIGATE begins, the hypothesis auto-seeds the tree root (analyst confirms)

This closes the gap between FRAME and INVESTIGATE — hypotheses flow through as a continuous thread.

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

| Field                              | Type       | Source                                                              | Purpose                                    |
| ---------------------------------- | ---------- | ------------------------------------------------------------------- | ------------------------------------------ |
| `teamContributors.count`           | `number`   | Distinct `finding.assignee` display names + `comment.author` values | Know how many people are investigating     |
| `teamContributors.hypothesisAreas` | `string[]` | Hypothesis factor names by author                                   | Know which factors each person has covered |

**Behavior:**

- CoScout can suggest: "Alex already tested Machine A — consider checking Machine B instead"
- Contributor metadata is derived from `Finding.assignee` and `FindingComment.author` fields (captured via EasyAuth `getEasyAuthUser()`)
- `teamContributors` is rendered in both `buildSummaryPrompt()` and `buildCoScoutSystemPrompt()` so both the NarrativeBar and CoScout conversation are team-aware
- No raw channel history is accessed — only structured finding/hypothesis metadata
- Field is only populated when `isTeamPlan()` returns true and findings have contributor data

---

---

## AI Component Locale Behavior

How each AI component receives and uses the user's locale for multilingual responses. See [ADR-025](../../07-decisions/adr-025-internationalization.md) for the internationalization architecture and [AIX Design System](aix-design-system.md) for the full component AIX cards.

- **NarrativeBar:** Locale flows via `AIContext.locale`. The `buildSummaryPrompt()` template receives the locale and includes a language instruction. When locale is `undefined` or `'en'`, no extra instruction is injected.
- **ChartInsightChip:** Locale passed as explicit parameter on `fetchChartInsight()`. Deterministic insight builders are locale-unaware (static English strings); only the AI enhancement layer respects locale.
- **CoScout:** Locale flows through `buildCoScoutMessages()`. The system prompt includes a language instruction ensuring the full conversation is in the user's language. Streaming responses respect the language instruction.

---

---

## Data Flow & Hook Composition

_Merged from ai-data-flow.md._

### Information Flow

```mermaid
flowchart LR
    subgraph State["Analysis State"]
        DC[DataContext]
        F[Findings]
        H[Hypotheses]
        PC[ProcessContext]
    end

    subgraph Orchestration["useEditorAI"]
        AC[useAIContext]
        NR[useNarration]
        CI[useChartInsights]
        CS[useAICoScout]
        KS[useKnowledgeSearch]
    end

    subgraph Core["@variscout/core"]
        BAC[buildAIContext]
        PT[\"prompts/* modules\"]
        SQ[buildSuggestedQuestions]
    end

    subgraph Service["AI Service Layer"]
        FN[fetchNarration]
        FCI[fetchChartInsight]
        FCR[fetchCoScoutResponse]
        SD[searchDocuments]
    end

    subgraph UI["UI Components"]
        NB[NarrativeBar]
        CIC[ChartInsightChip]
        CSP[CoScoutPanel]
        ISB[InvestigationSidebar]
    end

    DC --> AC
    F --> AC
    H --> AC
    PC --> AC
    AC --> BAC
    BAC --> PT
    BAC --> SQ

    AC --> NR
    AC --> CI
    AC --> CS
    AC --> KS

    NR --> FN --> NB
    CI --> FCI --> CIC
    CS --> FCR --> CSP
    KS --> SD --> CSP

    SQ --> ISB
```

**Data flow summary:**

1. `useEditorAI` composes all AI hooks and provides a single return object to the Editor
2. `useAIContext` calls `buildAIContext()` to assemble the structured `AIContext` from analysis state
3. Each hook consumes the context and calls the appropriate AI service function
4. Service responses flow into UI components via hook return values

**Additional service flows:**

- **Streaming:** `fetchCoScoutStreamingResponse()` delivers tokens incrementally via a chunk callback. `useAICoScout` manages abort control and progressive message assembly.
- **AI Report:** `fetchFindingsReport()` + `buildReportPrompt()` — a distinct flow for generating a structured findings export.

### AI Hook Composition

| Hook                 | Consumes                                                                                 | Produces                                              | UI Consumer                     |
| -------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| `useAIContext`       | stats, filters, findings, hypotheses, processContext, violations, variationContributions | `AIContext` object                                    | All other AI hooks              |
| `useNarration`       | `AIContext`, `fetchNarration` service fn                                                 | `narrative`, `isLoading`, `error`, `refresh()`        | `NarrativeBar`                  |
| `useChartInsights`   | `AIContext`, `fetchChartInsight` service fn, chart-specific data                         | `insight`, `isAIEnhanced`, `isLoading`                | `ChartInsightChip`              |
| `useAICoScout`       | `AIContext`, `fetchCoScoutResponse`                                                      | `messages[]`, `send()`, `isStreaming`, `abort()`      | `CoScoutPanel`, `CoScoutInline` |
| `useKnowledgeSearch` | `searchDocumentsFn`, `enabled` flag                                                      | `results[]`, `documents[]`, `search()`, `isAvailable` | On-demand via CoScout UI button |

> **Deterministic-first pipeline:** `useChartInsights` always runs a deterministic insight first — `buildIChartInsight()`, `buildBoxplotInsight()`, `buildParetoInsight()`, or `buildCapabilityInsight()` from `packages/core/src/ai/chartInsights.ts`. If AI is available, the hook fires a debounced `fetchChartInsight()` to enhance the text. The deterministic insight displays immediately; AI enhancement replaces it when ready.

### Context Data Shape

`buildAIContext()` produces an `AIContext` object:

```
AIContext
├── process              # User-provided process description, problem statement, factor roles
├── stats                # mean, stdDev, samples, cpk, cp, passRate
├── filters[]            # Active drill-down filters with category names
├── violations           # Out-of-control, above USL, below LSL, Nelson rule counts
├── variationContributions[]  # Per-factor η² values with category names
├── drillPath[]          # Ordered factor names from filter stack
├── findings             # { total, byStatus, keyDrivers[] }
├── investigation
│   ├── problemStatement
│   ├── targetMetric, targetValue, currentValue, progressPercent
│   ├── selectedFinding  # Text, hypothesis, projection, actions
│   ├── allHypotheses[]  # Text, status, contribution, ideas
│   ├── hypothesisTree[] # Root hypotheses with children
│   ├── phase            # initial | diverging | validating | converging | improving
│   └── categories[]     # Investigation categories for completeness prompting
├── activeChart          # Currently focused chart type
├── stagedComparison     # Before/After verification metrics
├── focusContext         # From "Ask CoScout about this"
├── teamContributors     # Teams plan: count + hypothesis areas
├── glossaryFragment     # Methodology terms + concepts for grounding
├── knowledgeDocuments[] # SharePoint documents (populated on-demand)
└── locale               # Active locale for AI response language
```

---

## Mode Transitions

| Event                    | What Happens                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **AI toggle on**         | NarrativeBar fades in, chips start enhancing, CoScout becomes available                      |
| **AI toggle off**        | NarrativeBar hidden, chips revert to deterministic, CoScout hidden                           |
| **Endpoint removed**     | `isAIAvailable()` → false, same as toggle off; no error states                               |
| **Offline**              | AI service calls fail gracefully → error classification → retry for transient errors         |
| **KB toggle**            | `isKnowledgeBaseAvailable()` changes, "Search Knowledge Base?" button shows/hides in CoScout |
| **Per-component toggle** | Individual `AIPreferences` flags control narration/insights/coscout independently            |
| **Rate limited**         | CoScout shows retryable error badge; narration falls back to cached value                    |

---

## Investigation Workflow × AI Touch Points

How AI context changes across investigation phases:

| Phase          | AI Context Injected                         | Suggested Questions                        | CoScout Instructions                               |
| -------------- | ------------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| **Initial**    | Problem statement, basic stats              | "What patterns do you see?"                | Help identify which chart to examine first         |
| **Diverging**  | Hypothesis tree, categories                 | "Have you explored [uncovered category]?"  | Encourage exploring across factor categories       |
| **Validating** | η² contributions, validation status         | "What does this η² mean for [factor]?"     | Help interpret contribution %, prioritize untested |
| **Converging** | Supported hypotheses with improvement ideas | "What improvement ideas for [hypothesis]?" | Help evaluate suspected cause, brainstorm ideas    |

> **IMPROVE phase:** CoScout shifts to action planning and Cpk monitoring. Action items, projections, and outcomes are injected as context. See [AIX Design System § Verification Sub-pattern](aix-design-system.md).

> **`buildSuggestedQuestions()`** is a pure function — no AI call. It selects phase-appropriate questions from the `AIContext` state. These appear in the Investigation Sidebar and work in all modes.

## See Also

- [AI Journey Integration](ai-journey-integration.md) — entry point for AI × journey overview
- [Knowledge Model Architecture](knowledge-model.md)
- [AI Context Engineering & Pipeline](ai-context-engineering.md)
- [AIX Design System](aix-design-system.md)
- [VariScout Methodology](../../01-vision/methodology.md)
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md)
- [ADR-026: SharePoint-First Knowledge Base](../../07-decisions/adr-026-knowledge-base-sharepoint-first.md)
- [ADR-027: AI Collaborator Evolution](../../07-decisions/adr-027-ai-collaborator-evolution.md)
- [AI Components](../../06-design-system/components/ai-components.md)
- [Component Patterns](component-patterns.md)
- [Data Flow](data-flow.md)
