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
│  aiService.askAI()         narration, suggestion,     │
│                            copilot, report            │
│                                                      │
│  IndexedDB Cache                                     │
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

| Component           | Package                   | Description                                                                                                                      |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `buildAIContext()`  | `@variscout/core`         | Pure function. Collects computed stats, filters, findings, violations into a structured payload. No React dependency.            |
| Prompt templates    | `@variscout/core`         | String templates for narration, suggestion, copilot, and report tasks. Grounded in VariScout glossary terms.                     |
| `aiService.ts`      | `apps/azure/src/services` | Network calls to Azure AI Foundry. Dual-model routing. IndexedDB response caching. Error handling. Pattern mirrors `storage.ts`. |
| `useAIContext` hook | `@variscout/hooks`        | React hook wrapping `buildAIContext()`. Recomputes on DataContext changes.                                                       |
| `useAICopilot` hook | `@variscout/hooks`        | Chat state management, conversation history, streaming response handling.                                                        |
| `NarrativeBar`      | `@variscout/ui`           | Single-line summary bar component.                                                                                               |
| `ChartInsightChip`  | `@variscout/ui`           | Per-chart suggestion badge.                                                                                                      |
| `CopilotPanel`      | `@variscout/ui`           | Slide-out conversational panel.                                                                                                  |

---

## Context Collection

AI never receives raw measurement data. Context is assembled in four layers:

### Layer 1 — Analysis State (automatic)

Everything already in DataContext, extracted by `buildAIContext()`:

- Computed statistics: mean, median, stdDev, Cp, Cpk, pass rate
- Variation metrics: η² per factor, cumulative scope, Total SS
- Violations: Nelson Rule 2 points, control/spec limit breaches
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
  equipmentFactor?: string;
  temporalFactor?: string;
  operatorFactor?: string;
  materialFactor?: string;

  // Process structure (Phase 2 — optional)
  processSteps?: string[];
}
```

**Factor role auto-inference:** During `detectColumns()`, VariScout matches column names against keyword groups (equipment, temporal, operator, material) using the existing parser keyword infrastructure in `packages/core/src/parser/keywords.ts`. Inferred roles are stored in ProcessContext and shown as dismissable confirmation chips in ColumnMapping.

**Progressive disclosure:**

- Phase 1: Auto-inferred factor roles + `description` text field in Settings
- Phase 2: Optional "About your process" wizard (3-5 fields, dismissable, once per project)

### Layer 3 — Glossary Grounding

The glossary system (`packages/core/src/glossary/terms.ts`) provides domain term definitions injected into AI prompts via `buildGlossaryPrompt()`. This is the top validated strategy for reducing AI hallucination in specialized domains.

Current: 25 terms. Target: ~40-50 terms covering all SPC concepts referenced in AI output.

### Layer 4 — Team Documents (Azure AI Search, Phase 3)

Fault trees, process maps, SOPs, control plans from Teams channel SharePoint. Indexed by Azure AI Search (enhanced by Foundry IQ managed orchestration) and retrieved by the Copilot Panel during conversation.

**AI-extracted context from documents:** When team documents are uploaded to SharePoint, an Azure Function can extract structured ProcessContext suggestions (process steps, measurement units) and present them to the user for confirmation. AI suggests, user confirms — never auto-overwrite.

---

## AI Service

### Dual-Model Routing

```typescript
type AITier = 'fast' | 'reasoning';

// fast → cheap model (narrative bar, chart chips)
// reasoning → capable model (copilot conversation, reports)
```

The service accepts a `tier` parameter and routes to the appropriate model deployment. Model names are configured in the ARM template (customer chooses during deployment).

### Response Caching

- **Cache key:** Hash of context payload (stats + filters + finding count + process description hash)
- **Storage:** IndexedDB
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
| Reasoning model deployment | `Microsoft.CognitiveServices/accounts/deployments`                 | Capable model (e.g., GPT-4o) for copilot + reports    |
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
| Max context tokens   | 2K for narration (fast tier), 8K for copilot (reasoning tier)   |
| Client-side throttle | Max 1 narration request per 5 seconds                           |
| Response caching     | Reduces repeat queries for same analysis state                  |
| Dual-model routing   | Cheap model for simple tasks, reasoning model only for copilot  |
| Monthly budget       | Configurable via ARM template parameters (Azure spending limit) |

---

## Error Handling

| UI Layer         | Error State      | Behavior                                        |
| ---------------- | ---------------- | ----------------------------------------------- |
| NarrativeBar     | API error        | Show last cached response, or hide bar          |
| NarrativeBar     | Timeout (>10s)   | Cancel request, hide bar, log to `errorService` |
| ChartInsightChip | Any error        | Hide chip entirely                              |
| CopilotPanel     | API error        | Inline error with retry button                  |
| CopilotPanel     | Content filter   | "I can't answer that question. Try rephrasing." |
| CopilotPanel     | Rate limit       | "Please wait a moment before asking again."     |
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
| `useAICopilot`       | Unit (`@variscout/hooks`)    | Mock AI service, test chat state management              |
| `NarrativeBar`       | Component (`@variscout/ui`)  | Render with/without response, verify hide on no-config   |
| `ChartInsightChip`   | Component (`@variscout/ui`)  | Render with data, verify dismissal, verify hide on error |
| `CopilotPanel`       | Component (`@variscout/ui`)  | Render chat, verify send/receive, error states           |
| Graceful degradation | E2E (`apps/azure`)           | Load app without AI endpoint — verify all features work  |
| AI integration       | Integration (`apps/azure`)   | Recorded response fixtures (replay, not live AI)         |

---

### buildAIContext() Design

The `buildAIContext()` function in `@variscout/core` is the structured bridge between the data layer and AI. Design principles:

- **Token-budget aware:** Accepts a `maxTokens` parameter and truncates context layers in priority order (findings first, then process context, then violations)
- **Deterministic insights as input:** Includes computed suggestions from `getNextDrillFactor()` and `shouldHighlightDrill()` so AI explains rather than competes
- **Structured output:** Returns a typed `AIContext` object, not a string — prompt templates handle serialization
- **Pure function:** No React dependency, no side effects — lives in `@variscout/core`

---

## See Also

- [AI Readiness Review](ai-readiness-review.md) — Strategic architecture assessment
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [AI-Assisted Analysis Workflow](../../03-features/workflows/ai-assisted-analysis.md) — User-facing workflow
- [AI Components](../../06-design-system/components/ai-components.md) — Component UX specs
- [Component Patterns](component-patterns.md) — Hook integration, colorScheme, base patterns
- [Data Flow](data-flow.md) — Existing data pipeline
