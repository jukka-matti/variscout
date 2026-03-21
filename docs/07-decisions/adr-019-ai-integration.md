---
title: 'ADR-019: AI Integration (Azure App)'
---

# ADR-019: AI Integration (Azure App)

**Status:** Accepted. **Pricing revised by [ADR-033](adr-033-pricing-simplification.md)** — Team AI tier removed; AI included in all plans, Knowledge Base moved to Team.

**Date:** 2026-03-14

**Related:** ADR-015 (investigation board — closed-loop prerequisite), ADR-016 (Teams integration)

---

## Context

Industry trends show consensus around hybrid SPC + AI (SPC for reliability, AI for foresight). 53% of manufacturers prefer an AI assistant model over full automation. Competitors (Minitab, SPC AI assistants in manufacturing) are adding AI features.

VariScout's deliberate "no AI, no API keys" positioning protects the PWA as a training tool. However, Azure App customers working on improvement projects would benefit from AI-enhanced analysis — natural language stat explanations, investigation suggestions, and document-grounded CoScout conversation.

**Key lesson:** EDAScout rolled back its AI chatbot (v6→v7) due to user friction. VariScout avoids this pattern by making AI always optional, dismissable, and augmentation-only.

## Decision

Add optional AI integration to the Azure App via Azure AI Foundry (model-agnostic). AI features are customer-deployed, tenant-isolated, and controlled by a user-visible Settings toggle.

### Driving Principles

1. **AI augments, never replaces** — Analyst drives investigation. AI explains, suggests, converses. All AI output is dismissable.
2. **Graceful degradation** — No AI endpoint? UI works perfectly. Offline? Cached responses. AI is invisible when unavailable.
3. **Stats-only payloads** — Never send raw measurement data to AI. Only computed stats (mean, Cpk, η², violations). Minimizes data exposure and token cost.
4. **Customer-owned infrastructure** — AI resources deploy in the customer's Azure tenant. No VariScout backend. GDPR by design.
5. **PWA stays AI-free** — The free PWA is a learning tool where "the struggle is the point."

### Product Positioning

| Product                 | AI                                               | Distribution      |
| ----------------------- | ------------------------------------------------ | ----------------- |
| PWA (Free)              | No AI. Never. Training tool.                     | Public URL        |
| Azure Standard (€79/mo) | AI optional — customer deploys Azure AI Foundry  | Azure Marketplace |
| Azure Team (€199/mo)    | AI optional + Knowledge Base via Azure AI Search | Azure Marketplace |

### User Control

AI features are user-controllable via a "Show AI assistance" toggle in Settings:

| State                            | Behavior                                              |
| -------------------------------- | ----------------------------------------------------- |
| No AI endpoint configured        | AI UI never shown                                     |
| Endpoint configured + toggle ON  | NarrativeBar, ChartInsightChips, CoScoutPanel visible |
| Endpoint configured + toggle OFF | All AI UI hidden by user choice                       |

The toggle persists per-user in AnalysisState/localStorage. Default: ON when endpoint available.

### Three Progressive Layers

1. **Narrative Summary Bar** — Single-line plain-language summary at dashboard bottom. Updates on filter/data changes. Examples: "Machine A explains 47% of variation. Morning shift shows Nelson Rule 2 violation."

2. **Chart Insight Chips** — Small badges below chart cards. Per-chart contextual suggestions (e.g., "→ Drill Machine A (47%)"). Builds on existing deterministic suggestions (`getNextDrillFactor()`, `shouldHighlightDrill()`).

3. **CoScout Panel** — Resizable slide-out panel (same pattern as FindingsPanel). Context-aware conversation. Azure AI Search document retrieval (Phase 3). Report generation.

### AI vs. Deterministic Suggestions

Deterministic suggestions remain the primary UI. AI adds natural language explanation rather than competing suggestions. If deterministic and AI disagree, the deterministic answer wins.

### Methodology Grounding (added 2026-03-15)

CoScout prompts are grounded in VariScout's own methodology (Four Lenses, Two Voices, Progressive Stratification) rather than generic SPC terminology. The knowledge model (`@variscout/core/glossary`) provides both vocabulary terms and methodology concepts to the AI system prompt, ensuring consistent use of VariScout's analytical framework. See [Knowledge Model Architecture](../05-technical/architecture/knowledge-model.md) and [AI Context Engineering](../05-technical/architecture/ai-context-engineering.md).

### Model-Agnostic via Azure AI Foundry

Azure AI Foundry hosts both OpenAI and Anthropic models with a unified API. Customer chooses model during ARM deployment.

**Dual-model routing (implemented March 2026):**

- `tier: 'fast'` → cheap model (narrative bar, chart chips) — gpt-5.4-nano (`reasoning: { effort: 'none' }`)
- `tier: 'reasoning'` → capable model (CoScout, reports) — gpt-5.4-mini (`reasoning: { effort: 'low' }`)

### Authentication

AI API keys are never exposed in client-side JavaScript. Authentication uses Azure AD (Entra ID) tokens via EasyAuth with a Cognitive Services scope (`https://cognitiveservices.azure.com/.default`). Same auth pattern as Graph API calls.

### Knowledge Layer (Azure AI Search + Remote SharePoint)

Azure AI Search serves as the managed knowledge service -- not a custom RAG pipeline. **Remote SharePoint** knowledge sources access documents on demand with user credentials (ADR-026).

**What's searchable:**

- Published scouting reports -- published as Markdown to the team's SharePoint folder via Report view
- Team quality documents -- SOPs, fault trees, control plans already in the SharePoint folder

**Capabilities:** Built-in hybrid search (keyword + semantic ranking), Foundry IQ agentic retrieval for query decomposition. All Azure-native, ARM-deployable, same-tenant data sovereignty. Per-user permissions via user token passthrough.

See [ADR-026](adr-026-knowledge-base-sharepoint-first.md) for the full architecture decision.

### ARM Template Changes

Conditional AI resources in `infra/mainTemplate.json`:

- `Microsoft.CognitiveServices/accounts` (AI Services, S0 SKU) — conditional on `enableAI` parameter
- Model deployments as child resources (fast + reasoning models)
- `createUiDefinition.json`: "Enable AI-powered analysis" checkbox + model selection dropdown
- EasyAuth `authsettingsV2` updated to include Cognitive Services scope

### Package Architecture

| Component           | Package                   | Rationale                                                                                                  |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `buildAIContext()`  | `@variscout/core`         | Pure function, no React                                                                                    |
| Prompt templates    | `@variscout/core`         | String templates, no React                                                                                 |
| `aiService.ts`      | `apps/azure/src/services` | Network calls + localStorage caching. Auth via `getAuthHeaders()` (EasyAuth). Retry + exponential backoff. |
| `useAIContext` hook | `@variscout/hooks`        | React hook wrapping buildAIContext                                                                         |
| `useAICoScout` hook | `@variscout/hooks`        | Chat state, history, streaming                                                                             |
| `NarrativeBar`      | `@variscout/ui`           | Shared UI component                                                                                        |
| `ChartInsightChip`  | `@variscout/ui`           | Inline chart badge                                                                                         |
| `CoScoutPanel`      | `@variscout/ui`           | Slide-out chat panel                                                                                       |

### Context Enrichment

AI quality depends on process context. A `ProcessContext` type on `AnalysisState` provides structured metadata:

- **Factor role inference:** At import time, column names are matched against keyword groups (equipment, temporal, operator, material) using existing parser infrastructure. Inferred roles transform AI output from "Category B in factor Machine" to "Fill Head B (equipment) accounts for 47%."
- **Measurement unit inference:** Outcome column name suffixes ("Weight_g" → grams) auto-populate unit metadata.
- **processDescription:** Free-text field in Settings for context auto-inference can't capture.
- **All fields optional** — backward compatible with existing .vrs files.

See [AI Readiness Review](../archive/ai-readiness-review.md) for the full ProcessContext type definition and progressive disclosure strategy.

### Phased Delivery

- **Phase 1:** AI service layer + NarrativeBar + process description field + factor role inference + ARM template
- **Phase 2:** ChartInsightChip + AI-enhanced Nelson Rule explanations + drill suggestions + optional process wizard
- **Phase 3:** CoScoutPanel + Azure AI Search (with Foundry IQ orchestration) + Remote SharePoint knowledge + report generation + report publishing

### Cost Controls

- Stats-only payloads: typically <500 tokens of context
- Client-side throttle: max 1 narration request per 5 seconds
- Response caching in localStorage (24h TTL or until data changes)
- Dual-model routing minimizes reasoning-tier spend
- Configurable monthly budget via ARM template parameters

## Consequences

### Easier

- Natural language stat explanations for non-statisticians
- Context-aware investigation guidance grounded in team documents
- Cross-project knowledge queries ("Have we seen this pattern before?")
- Structured improvement reports from findings data
- Customer-owned data sovereignty (all AI resources in their tenant)

### Competitive Positioning

- **Closed-loop advantage:** VariScout captures the full PDCA cycle with measured outcomes. After 50+ resolved findings, the AI has genuine organizational knowledge backed by Cpk measurements. No competitor has this feedback loop.
- **ISO 9001:2026 + EU AI Act alignment:** Deterministic-first architecture means "the statistical engine identified Machine A (47%). AI provided the explanation. Both are auditable." Aligns with ISO/IEC 42001 human oversight requirements and EU AI Act transparency obligations (high-risk obligations effective August 2, 2026).
- **Measurement-backed vs. subjective:** Traditional FMEA uses subjective RPN scores. VariScout's findings carry actual Cpk values and verified action outcomes. Marketing opportunity: "AI you can audit."

### Harder

- ARM template complexity increases (conditional AI resources)
- Cost management becomes a customer concern (Azure AI consumption-based pricing)
- Testing requires recorded response fixtures (no live AI in CI)
- AI quality depends on prompt engineering and context quality

### Key Risks

| Risk                                            | Mitigation                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Remote SharePoint requires M365 Copilot license | Minimum 1 license per tenant. Documented as prerequisite in admin setup.                   |
| AI costs concern customers                      | Default to cheapest model (gpt-5.4-nano). Dual-model routing. Response caching.            |
| EDAScout-style chatbot backlash                 | AI never auto-acts. Always dismissable. Shows stats source alongside explanation.          |
| Model quality for SPC domain                    | Prompt templates grounded in VariScout glossary. Stats-only context reduces hallucination. |
| Privacy / data sovereignty                      | All AI resources in customer tenant. Stats-only payloads. Same EasyAuth + RBAC.            |

---

## Implementation Notes

Phase 1-3 client-side AI delivered across 5 commits (86f3ccb → 4e5382c, March 2026):

- **Phase 1:** AI service layer (`aiService.ts`), `NarrativeBar`, process description field, factor role inference (`inferFactorRoles`), glossary expansion (25→28 terms), `buildAIContext()`
- **Phase 2:** `ChartInsightChip` with 4 deterministic insight builders + optional AI enhancement, per-chart chips in PWA (deterministic only) + Azure (AI-enhanced)
- **Phase 2.5:** Factor role auto-inference from column names, `ProcessContext` persistence
- **Phase 3:** `CoScoutPanelBase` with streaming, suggested questions, conversation history, overflow menu

### Phase 3: Knowledge Layer (March 2026)

Delivered: Azure AI Search for knowledge base orchestration, Remote SharePoint knowledge source, runtime config endpoint for Marketplace deployments, model-agnostic AI service (OpenAI + Claude), findings export (CSV/JSON/AI report), FindingsExportMenu component, report publishing to SharePoint.

Key design decisions:

- Remote SharePoint over indexed -- no indexer, no crawl schedule, per-user permissions (ADR-026)
- On-demand knowledge search -- user clicks button, not auto-fire on every message
- Report publishing as Markdown -- scouting reports become searchable knowledge
- Auto-detect model provider from endpoint URL -- no user configuration needed
- Preview-gated knowledge features -- customers opt in via Settings

**Teams AI SDK not applicable:** `@microsoft/teams-ai` is for bot-based apps. VariScout's tab app pattern uses direct Azure AI Foundry calls via EasyAuth, which is the correct architecture for embedded tab applications.

---

## See Also

- [ADR-015: Investigation Board](adr-015-investigation-board.md)
- [ADR-026: SharePoint-First Knowledge Base](adr-026-knowledge-base-sharepoint-first.md)
- [AI Readiness Review](../archive/ai-readiness-review.md) (archived)
- [AI Journey Integration](../05-technical/architecture/ai-journey-integration.md)
- [AI Architecture](../05-technical/architecture/ai-architecture.md)
- [AI Components](../06-design-system/components/ai-components.md)

## Implementation Update (ADR-028, 2026-03-19)

The AI integration has been simplified per ADR-028:

- **Anthropic provider removed** — only Azure OpenAI is supported
- **Chat Completions API removed** — Responses API is the single API path
- **Structured outputs** added for narration and chart insights (guaranteed JSON schemas)
- **Function calling** added for Knowledge Base intent detection (`suggest_knowledge_search`)
- Provider detection (`detectProvider`, `ModelProvider`) and dual-format parsing removed from `aiService.ts`
- `VITE_USE_RESPONSES_API` feature flag removed — always on

## Implementation Update (Model Upgrade, 2026-03-19)

- **Dual-model routing implemented** — `getResponsesApiConfig(tier)` accepts `'fast'` or `'reasoning'` tier; deployment names are stable ARM references
- **Models updated to GPT-5.4 generation** — gpt-5.4-nano (fast tier, `reasoning: { effort: 'none' }`), gpt-5.4-mini (reasoning tier, `reasoning: { effort: 'low' }`)
- **Prompt caching** — `prompt_cache_key` added to all Responses API requests for server-side system prompt caching
- **Token observability** — `TokenUsage` extended with `cachedTokens` and `reasoningTokens`; telemetry tracks both
- **Model lifecycle** — ARM template uses `versionUpgradeOption: "OnceCurrentVersionExpired"` for zero-touch customer upgrades; deployment names (`fast`, `reasoning`) are stable while underlying models auto-upgrade
- **GPT-4o retirement** — gpt-4o (2024-08-06) and gpt-4o-mini (2024-07-18) retire 2026-03-31; existing deployments auto-upgrade via Azure; new deployments use GPT-5.4 (18-month runway to 2027-09-17)

## Implementation Update (Observability + Phase Reasoning, 2026-03-19)

- **`traceAICall()` wired into all service functions** — `fetchNarration`, `fetchChartInsight`, and `fetchFindingsReport` in `aiService.ts` now wrap their API calls with `traceAICall()`, capturing token usage (input, output, cached, reasoning tokens) for all AI features. Previously only CoScout traced fully.
- **Per-journey-phase reasoning effort** — CoScout uses `getCoScoutReasoningEffort(phase)` from `@variscout/core` instead of hardcoded `'low'`. FRAME→none, SCOUT→low, INVESTIGATE→medium, IMPROVE→low. Narration/chips stay at `'none'`, reports stay at `'low'`.
- **Redundant hook-level tracing removed** — `useNarration` no longer wraps calls with `traceAICall()` since tracing is now in the service layer.
