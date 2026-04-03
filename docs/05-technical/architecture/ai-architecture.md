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
│  Azure AI Foundry          Foundry IQ                 │
│  (gpt-5.4-nano / mini)    (unified knowledge index — │
│                            Blob Storage + agentic     │
│                            retrieval)                 │
│                                                      │
│  Blob Storage              OneDrive                   │
│  (documents, investigation (.vrs projects)            │
│   artifacts)                                         │
│                                                      │
│  ARM Template                                         │
│  (deploys conditionally)                              │
└─────────────────────────────────────────────────────┘
```

---

## Package Responsibilities

| Component                       | Package                     | Description                                                                                                                                                                                                                                    |
| ------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildAIContext()`              | `@variscout/core`           | Pure function. Collects computed stats, filters, findings, violations into a structured payload. No React dependency.                                                                                                                          |
| Prompt templates                | `@variscout/core`           | String templates for narration, suggestion, CoScout, and report tasks. Grounded in VariScout glossary terms.                                                                                                                                   |
| `aiService.ts`                  | `apps/azure/src/services`   | localStorage response caching. Auth via `getAuthHeaders()` (EasyAuth). Retry + exponential backoff. All service functions (`fetchNarration`, `fetchChartInsight`, `fetchFindingsReport`) wrapped with `traceAICall()` for token observability. |
| `useAIContext` hook             | `@variscout/hooks`          | React hook wrapping `buildAIContext()`. Recomputes on DataContext changes.                                                                                                                                                                     |
| `useAICoScout` hook             | `@variscout/hooks`          | Chat state management, conversation history, streaming response handling. The inline CoScout (in FindingsPanel) and standalone CoScout panel share the same `useAICoScout` hook instance — conversation state persists across both surfaces.   |
| `useNarration` hook             | `@variscout/hooks`          | React hook for narrative bar state (loading, cached, error). Wraps `fetchNarration`.                                                                                                                                                           |
| `useChartInsights` hook         | `@variscout/hooks`          | Per-chart deterministic + AI-enhanced insight orchestration. Debounced AI with fallback.                                                                                                                                                       |
| `NarrativeBar`                  | `@variscout/ui`             | Single-line summary bar component.                                                                                                                                                                                                             |
| `ChartInsightChip`              | `@variscout/ui`             | Per-chart suggestion badge.                                                                                                                                                                                                                    |
| `CoScoutPanel`                  | `@variscout/ui`             | Slide-out conversational panel. Explicitly references investigation phase in responses (phase coaching, not just silent adaptation).                                                                                                           |
| `CoScoutInline`                 | `@variscout/ui`             | Compact collapsible CoScout conversation embedded in FindingsPanel.                                                                                                                                                                            |
| `CoScoutMessages`               | `@variscout/ui`             | Shared message rendering (user/assistant bubbles, loading dots).                                                                                                                                                                               |
| `InvestigationPhaseBadge`       | `@variscout/ui`             | Colored pill badge showing investigation phase (initial/diverging/validating/converging/improving).                                                                                                                                            |
| `searchProjectArtifacts()`      | `@variscout/core`           | Pure function. Case-insensitive text search across findings, hypotheses, ideas, and actions. Used by the `search_project` CoScout tool.                                                                                                        |
| `buildDashboardSummaryPrompt()` | `@variscout/core`           | Prompt builder for the Project Dashboard AI summary card. Fast tier (gpt-5.4-nano, reasoning: none). State-aware cache key.                                                                                                                    |
| `ProjectDashboard`              | `apps/azure/src/components` | Full project overview view (Azure-only). Peer view to the Editor, toggled via `panelsStore.activeView`.                                                                                                                                        |

---

## Context Collection

AI never receives raw measurement data. Context is assembled in four layers:

### Layer 1 — Analysis State (automatic)

Everything already in DataContext, extracted by `buildAIContext()`:

- Computed statistics: mean, median, stdDev, Cp, Cpk, pass rate
- Variation metrics: η² per factor, cumulative scope, Total SS
- Violations: Nelson Rule 2 (shift) and Rule 3 (trend) sequence counts, control/spec limit breaches
- Findings: title, status, tag, factor, η² (effect size), suspected cause, actions, outcome
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

### Multimodal Context (Images)

CoScout supports image input for visual evidence analysis:

- **Image paste** — Analyst pastes a screenshot or photo directly into the CoScout input. The image is sent as a base64 `input_image` content part in the Responses API message.
- **Finding attachment retrieval** — The `get_finding_attachment` tool retrieves photos attached to findings, enabling CoScout to analyze visual evidence captured during investigation.
- **`store: false`** — Messages containing images are sent with `store: false` to avoid persisting image data server-side (privacy + cost).

Images are budget-managed as part of the degradation priority pipeline (see [AI Context Engineering](ai-context-engineering.md)).

### Layer 4 -- Team Documents (Foundry IQ, ADR-060)

Uploaded SOPs, investigation artifacts (findings, questions, improvement ideas), and team-contributed answers stored in Blob Storage. Accessed on demand via **Foundry IQ** (unified knowledge index — three-layer hot/warm/cold architecture: hot = real-time investigation artifacts, warm = recent findings, cold = historical documents).

**On-demand, not auto-fire:** Knowledge search is triggered when the user clicks the "Search Knowledge Base?" button in CoScout, not automatically on every message. This reduces latency and cost.

**Investigation artifacts as knowledge:** Findings, questions, and improvement ideas are automatically indexed as investigation artifacts — no manual publishing step required. Documents (SOPs, procedures) are uploaded once and remain searchable.

**SuspectedCause hub serialization:** When hubs are created or updated in the Investigation workspace, they are serialized to the Blob Storage investigation artifacts (alongside findings and questions) as structured JSON. The hub record includes: `{ id, name, synthesis, evidenceMetric, evidenceValue, connectedQuestionIds, connectedFindingIds, status, createdAt, updatedAt }`. Foundry IQ indexes hub records so CoScout can retrieve full hub detail (including linked evidence) via `search_knowledge_base` when context requires more depth than the hot context carries.

See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md) for the architecture decision. (Supersedes ADR-026 SharePoint approach.)

---

## AI Service

### Dual-Model Routing

```typescript
type AITier = 'fast' | 'reasoning';

// fast → gpt-5.4-nano (narrative bar, chart chips) — reasoning: none
// reasoning → gpt-5.4-mini (CoScout conversation, reports) — reasoning: low
```

The service accepts a `tier` parameter and routes to the appropriate ARM deployment name. `getResponsesApiConfig(tier)` resolves the deployment name (stable: `'fast'` or `'reasoning'`). The underlying model auto-upgrades via `versionUpgradeOption: "OnceCurrentVersionExpired"` — zero customer intervention needed.

**New API parameters (GPT-5.4):**

| Parameter           | Purpose                                 | Usage                                                             |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `prompt_cache_key`  | Server-side system prompt caching       | All requests — narration, chips, CoScout, report                  |
| `reasoning.effort`  | Control hidden reasoning token overhead | `'none'` for fast tier; CoScout uses per-phase effort (see below) |
| `reasoning.summary` | Surface reasoning chain (future)        | Not yet used — planned for debug panel                            |
| `truncation`        | Long context truncation strategy        | Not yet used                                                      |

**Model lifecycle:**

| Model                     | Tier      | Retirement | Auto-upgrade                |
| ------------------------- | --------- | ---------- | --------------------------- |
| gpt-5.4-nano (2026-03-17) | fast      | 2027-09-17 | `OnceCurrentVersionExpired` |
| gpt-5.4-mini (2026-03-17) | reasoning | 2027-09-17 | `OnceCurrentVersionExpired` |

### Per-Phase Reasoning Effort (CoScout)

CoScout uses `getCoScoutReasoningEffort(phase)` from `@variscout/core` to set reasoning effort based on the current journey phase:

| Journey Phase | Reasoning Effort | Rationale                                       |
| ------------- | ---------------- | ----------------------------------------------- |
| FRAME         | `'none'`         | Quick orientation, no deep reasoning needed     |
| SCOUT         | `'low'`          | Pattern exploration, light reasoning            |
| INVESTIGATE   | `'medium'`       | Root cause analysis, needs structured reasoning |
| IMPROVE       | `'low'`          | Action validation, moderate reasoning           |

Narration and chart insights always use `reasoning: { effort: 'none' }` (fast tier). Reports always use `reasoning: { effort: 'low' }`.

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

## Knowledge Layer: Foundry IQ + Blob Storage

> **Status:** Beta (ADR-060, April 2026). See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md). Supersedes ADR-026 (SharePoint approach).

Foundry IQ is a unified knowledge index backed by Blob Storage — not a Remote SharePoint pipeline. Investigation artifacts (findings, questions, ideas) are indexed automatically; documents (SOPs, procedures) are uploaded once. No M365 Copilot license required.

### Architecture (ADR-060)

```
Investigation artifacts --> findings, questions, ideas --> Blob Storage (hot layer)
Document upload         --> SOPs, procedures           --> Blob Storage (cold layer)
                                                              |
CoScout question --> User clicks "Search KB?" --> searchDocuments()
                                                              |
                                                    server.js --> projectId filter
                                                              |
                                                    Foundry IQ (unified index)
                                                    --> Blob Storage agentic retrieval
                                                              |
                                                    top-5 results with source attribution
                                                              |
                                                    formatKnowledgeContext() --> CoScout prompt
```

### Three-Layer Index Architecture

| Layer | Content                                                                | Update Frequency       |
| ----- | ---------------------------------------------------------------------- | ---------------------- |
| Hot   | Real-time investigation artifacts (current findings, questions, ideas) | On change              |
| Warm  | Recent findings from completed investigations                          | On investigation close |
| Cold  | Historical documents (SOPs, fault trees, procedures)                   | On upload              |

### Key Design Decisions

1. **Blob Storage (not SharePoint)**: Documents and artifacts stored in customer's Blob Storage container (already provisioned for `.vrs` sync). No M365 Copilot license required.

2. **On-demand search (not auto-fire)**: Knowledge search is triggered by user click, not on every CoScout message. Reduces latency, cost, and noise.

3. **Project-scoped search**: `server.js` computes `projectId` filter before querying Foundry IQ, limiting results to the active project's artifact space.

4. **Investigation artifacts as knowledge**: Findings, questions, and improvement ideas are indexed automatically — no manual publishing step. The investigation process builds organizational memory as a side effect.

5. **Source attribution**: Results include source type (document / investigation artifact / answer) and metadata for `[Source: name]` citation badges in CoScout responses.

6. **ExtractedData output mode**: Foundry IQ returns raw chunks rather than synthesized answers. CoScout reasons over the raw context.

### Searchable Content

| Source                    | How It Gets There                         | What's Searchable                        |
| ------------------------- | ----------------------------------------- | ---------------------------------------- |
| Investigation artifacts   | Auto-indexed (findings, questions, ideas) | Titles, descriptions, statuses, comments |
| Uploaded SOPs, procedures | Admin uploads via Knowledge Base UI       | Full document text with citations        |
| Fault trees, 8D reports   | Admin uploads via Knowledge Base UI       | Document content with citations          |
| Team answers              | Team members contribute via CoScout       | Recorded answers with author attribution |

### Findings as Knowledge Base

Investigation artifacts (findings, questions, improvement ideas) are indexed automatically as the investigation progresses. The 8-step investigation workflow maps directly to where AI adds value:

- **Step 5 (investigate):** CoScout searches artifacts and documents for related causes and procedures
- **Step 7 (derive action):** CoScout references SOPs and past corrective actions from the knowledge index

After 50+ investigations, the AI has genuine organizational knowledge — measurement-backed, closed-loop, and continuously evolving.

---

## ARM Template Resources

All AI resources are conditional on `parameters('enableAI')`:

| Resource                   | Type                                                           | Purpose                                              |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| AI Services account        | `Microsoft.CognitiveServices/accounts` (kind: OpenAI, SKU: S0) | Azure AI Foundry host                                |
| Fast model deployment      | `Microsoft.CognitiveServices/accounts/deployments`             | gpt-5.4-nano for narration + chips (reasoning: none) |
| Reasoning model deployment | `Microsoft.CognitiveServices/accounts/deployments`             | gpt-5.4-mini for CoScout + reports (reasoning: low)  |
| AI Search service          | `Microsoft.Search/searchServices` (2025-05-01 API)             | Foundry IQ unified knowledge index (Team plan only)  |

`createUiDefinition.json` additions:

- "Enable AI-powered analysis" checkbox → `enableAI` boolean parameter
- Model selection dropdown (gpt-5.4-nano default fast, gpt-5.4-mini default reasoning)

EasyAuth `authsettingsV2` updated to include Cognitive Services scope.

---

## Cost Controls

| Control              | Mechanism                                                       |
| -------------------- | --------------------------------------------------------------- |
| Stats-only payloads  | Typically <500 tokens per request                               |
| Max context tokens   | 2K for narration (fast tier), 12K for CoScout (reasoning tier)  |
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

- System prompt adds coaching instructions: guide the analyst toward actionable improvement ideas, ask about constraints (budget, timeline, authority), suggest structured approaches using the Four Ideation Directions (prevent, detect, simplify, eliminate)
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

### 15 + 2 Planned CoScout Tools (ADR-029 + ADR-042 + ADR-049)

CoScout has 15 tools today, phase-gated by journey phase. ADR-049 adds 2 more (`suggest_save_finding`, `get_finding_attachment`) for the Knowledge Catalyst feature. The two tools added in ADR-042:

| Tool             | Type        | Execution                                            | Phase Gate | Purpose                                                          |
| ---------------- | ----------- | ---------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `search_project` | Read tool   | Auto-execute                                         | SCOUT+     | Search findings, hypotheses, ideas, and actions by text + filter |
| `navigate_to`    | Hybrid tool | Auto (no filters) / Proposal (restore_filters: true) | SCOUT+     | Navigate to views, panels, or filter contexts                    |

`search_project` uses the pure `searchProjectArtifacts()` function in `@variscout/core/ai/searchProject.ts`. Max 5 results, case-insensitive substring matching, sorted by relevance then recency.

`navigate_to` targets: `finding`, `hypothesis`, `chart`, `improvement_workspace`, `report`, `dashboard`. Auto-executes for panel navigation (no state mutation). Shows a proposal card when `restore_filters: true` (mutates filter pipeline state). Filter restoration uses `filterStackToFilters()` from `@variscout/core/navigation.ts`.

### Upfront Hypothesis Seeding

When the analyst captures an upfront hypothesis in the analysis brief (FRAME), `buildAIContext()` includes it in the context. During SCOUT:

1. CoScout system prompt references the hypothesis: "The analyst suspects [hypothesis text]"
2. ChartInsightChips can highlight relevant categories that match the hypothesis
3. When INVESTIGATE begins, the hypothesis auto-seeds the tree root (analyst confirms)

This closes the gap between FRAME and INVESTIGATE — hypotheses flow through as a continuous thread.

---

### buildAIContext() Design

The `buildAIContext()` function in `@variscout/core` is the structured bridge between the data layer and AI. Design principles:

- **Token-budget aware:** Accepts a `maxTokens` parameter and delegates to `budgetContext()` which trims context in an 8-level degradation pipeline (see [AI Context Engineering](ai-context-engineering.md) for priority order)
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

    subgraph Orchestration["useAIOrchestration (features/ai/)"]
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

1. `useAIOrchestration` (in `features/ai/`) composes all AI hooks and provides a single return object to the Editor (see ADR-041 for the Zustand feature stores migration)
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
| **Validating** | η² contributions, validation status         | "What does this η² mean for [factor]?"     | Help interpret η² effect size, prioritize untested |
| **Converging** | Supported hypotheses with improvement ideas | "What improvement ideas for [hypothesis]?" | Help evaluate suspected cause, brainstorm ideas    |

> **IMPROVE phase:** CoScout shifts to action planning and Cpk monitoring. Action items, projections, and outcomes are injected as context. See [AIX Design System § Verification Sub-pattern](aix-design-system.md).

> **`buildSuggestedQuestions()`** is a pure function — no AI call. It selects phase-appropriate questions from the `AIContext` state. These appear in the Investigation Sidebar and work in all modes. `formatForMobile()` (same file) truncates chip display text at word boundaries on mobile screens (< 640px). The full question text is always sent to CoScout.

## Analysis Mode Awareness

> **Status (Mar 2026):** Fully implemented. `analysisMode` flows from Editor.tsx through the full AI pipeline. `isPerformanceMode` has been completely removed.

### Architecture

`analysisMode` is threaded through the full AI pipeline:

```
Editor.tsx (analysisMode from DataContext)
  → useAIOrchestration({ ..., analysisMode })
    → useAIContext({ ..., analysisMode })
      → buildAIContext({ ..., analysisMode })    → AIContext.analysisMode
        → buildCoScoutSystemPrompt()             → strategy.aiToolSet routes coaching
```

The strategy pattern ([ADR-047](../../07-decisions/adr-047-analysis-mode-strategy.md)) defines per-mode AI configuration:

| Resolved Mode | `aiToolSet`     | Coaching Focus                                             |
| ------------- | --------------- | ---------------------------------------------------------- |
| standard      | `'standard'`    | SPC terminology (Cpk, control limits, variation)           |
| capability    | `'standard'`    | SPC terminology (same as standard)                         |
| performance   | `'performance'` | Multi-channel (channels, worst-channel Cpk, health grades) |
| yamazumi      | `'yamazumi'`    | Lean (cycle time, VA ratio, takt time, waste categories)   |

Each mode prompt includes terminology mapping, chart interpretation guide, and numbered coaching workflow. See [AI Context Engineering §2b](ai-context-engineering.md) for the three-tier architecture.

---

## Investigation Model as Memory

VariScout takes a deliberate architectural position: **CoScout conversations are ephemeral; the investigation model is the durable memory.**

Every CoScout session receives the full investigation context via the `buildAIContext()` → `buildCoScoutInput()` pipeline:

- `ProcessContext` (problem statement, synthesis, target metrics)
- Findings with status, hypotheses, actions, outcomes
- Hypothesis tree with validation and ideas
- Statistics, filters, drill path, violations
- Knowledge Base results (Team plan)

When an analyst creates findings, hypotheses, and actions during a CoScout conversation, that knowledge is captured in the investigation model — which persists in `AnalysisState` (IndexedDB, optionally OneDrive sync). The conversation itself is disposable because its substance is already captured in structured form.

This approach was validated by industry research (ADR-049):

- Every major AI product except Figma Make stores conversations separately from project data
- GitHub Copilot deliberately does not persist conversations
- Figma Make (the only product embedding conversations in project files) sees performance degradation and privacy concerns from users

CoScout enhances knowledge capture with:

- **Save insight as finding** — bookmark any message to create a Finding
- **Auto-suggested insights** — `suggest_save_finding` tool proposes saving findings proactively
- **Session-close save prompt** — advisory modal prevents accidental insight loss
- **Image paste + save to finding** — visual evidence captured in the investigation model

The existing Project Dashboard (WhatsNewSection, DashboardSummaryCard, ProjectStatusCard) handles the "welcome back" experience on project reopen.

---

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
- [ADR-049: CoScout Knowledge Catalyst](../../07-decisions/adr-049-coscout-context-and-memory.md)
- [Component Patterns](component-patterns.md)
- [Data Flow](data-flow.md)
