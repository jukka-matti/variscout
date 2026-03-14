# VariScout AI Integration Strategy

**Date:** 2026-03-14
**Status:** Draft
**Scope:** Full AI strategy + architecture for Azure App

## Context

VariScout is a mature, offline-first variation analysis tool with a deliberate "No AI, no API keys" positioning. The product serves quality professionals through progressive stratification (Four Lenses methodology) with a free PWA for training and paid Azure App for professional use.

This design explores how AI can be integrated into the Azure App to enhance — not replace — the analyst's workflow. The goal is future-proofing: ensuring the architecture supports AI integration when the time comes, while mapping out the full strategy from UX to infrastructure.

### Driving Principles

1. **AI augments, never replaces** — Analyst drives investigation. AI explains, suggests, converses. All AI output is dismissable.
2. **Graceful degradation** — No AI key? UI works perfectly. Offline? Cached responses. AI is invisible when unavailable.
3. **Stats-only payloads** — Never send raw measurement data to AI. Only computed stats (mean, Cpk, η², violations). Minimizes data exposure and token cost.
4. **Customer-owned infrastructure** — AI resources deploy in the customer's Azure tenant. No VariScout backend. GDPR by design.
5. **PWA stays AI-free** — The free PWA is a learning tool where "the struggle is the point." AI is Azure-only.

### Industry Validation

- 2026 industry consensus: Hybrid SPC + AI (SPC for reliability, AI for foresight)
- 53% of manufacturers prefer AI assistant model over full automation
- Minitab adding AI assistant features; SPC AI assistants emerging in steel/manufacturing
- EDAScout rolled back AI chatbot (Gemini) v6→v7 due to friction; VariScout avoids this pattern
- Explainable AI is non-negotiable in quality/regulated contexts

## Product Positioning

| Product                 | AI                                               | Distribution      |
| ----------------------- | ------------------------------------------------ | ----------------- |
| PWA (Free)              | No AI. Never. Training tool.                     | Public URL        |
| Azure Standard (€99/mo) | AI optional — customer deploys Azure AI Foundry  | Azure Marketplace |
| Azure Team (€299/mo)    | AI optional + knowledge base via Azure AI Search | Azure Marketplace |

AI features are **optional** for both Azure plans. Customer opts in during ARM deployment with an "Enable AI-powered analysis" checkbox in createUiDefinition.json.

## Two Use Cases

### Use Case 1: Improvement Team Project

A quality improvement team creates a Teams channel for their project (e.g., "Fill Line Improvement"). They upload process maps, fault trees (FMEA), and SOPs to the channel's SharePoint folder. Team members analyze data in VariScout, pinning findings as they investigate. The AI CoScout references both the team's quality documents AND accumulated investigation findings to provide context-aware guidance.

**Flow:** Teams channel setup → upload docs → analyze in VariScout → AI references docs + findings → knowledge accumulates

### Use Case 2: Daily Process Owner

A process owner or team leader uses VariScout for daily monitoring. Their SharePoint contains standing documents: process maps, control plans, FMEA, equipment specs. When VariScout detects a Nelson Rule violation, the AI CoScout can reference the fault tree: "Your FMEA lists this failure mode as RPN 180. Control plan says: check nozzle alignment."

**Flow:** Standing docs in SharePoint → daily data load → AI references docs during analysis → findings grow knowledge base over time

## UX Design: Hybrid Approach

The UI follows a progressive disclosure pattern with three layers that map to the phased delivery:

### Narrative Summary Bar (Phase 1)

A single-line bar at the bottom of the Azure Dashboard. Summarizes current analysis state in plain language. Examples:

- "Machine A explains 47% of variation. Morning shift shows Nelson Rule 2 violation. Cpk 0.85 below target 1.33."
- "3 findings pinned. Key driver: Fill Head 3 (47% contribution). Suggestion: investigate Operator next (23% remaining)."

Always visible when AI is configured. Hidden when no AI endpoint is available.

### Inline Chart Insights (Phase 2)

Small chips/badges on chart cards. Examples:

- I-Chart: "Process shift detected at point 34" (below chart)
- Boxplot: "→ Drill Machine A (47%)" (below highest-η² category)
- Stats: "Cpk 0.85 — below 1.33 target" (with link to fault tree if available)

Builds on existing `getNextDrillFactor()` and `shouldHighlightDrill()` from `packages/core/src/variation/suggestions.ts`. AI adds natural language explanation layer.

### Slide-out CoScout Panel (Phase 3)

Resizable side panel (same pattern as FindingsPanel and DataPanel). Activated via "Ask →" button in narrative bar or dedicated ✦ CoScout tab.

- Context-aware: knows current filters, charts, findings, violations
- Can reference team documents via Azure AI Search
- Conversation history persisted in IndexedDB
- Report generation: findings → stakeholder narrative

## Architecture

### Browser-Side Components

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
│                            coscout, report            │
│                                                      │
│  IndexedDB Cache                                     │
│  (cached AI responses + conversation history)         │
└──────────────────────┬──────────────────────────────┘
                       │ (when online)
┌──────────────────────▼──────────────────────────────┐
│  AZURE (customer's tenant — optional)                │
│                                                      │
│  Azure AI Foundry          Azure AI Search            │
│  (GPT-4o / Claude / etc)   (hybrid + agentic)         │
│                                                      │
│  SharePoint                OneDrive                   │
│  (fault trees, SOPs)       (.vrs projects)            │
│                                                      │
│  ARM Template                                        │
│  (deploys all resources conditionally)                │
└──────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Model-agnostic via Azure AI Foundry.** Azure AI Foundry hosts both OpenAI (GPT-4o, GPT-4o-mini) and Anthropic Claude (Sonnet 4.6, Opus 4.6) models with a unified API. VariScout doesn't pick a model — the customer chooses during ARM deployment. Default recommendation:

| Task                  | Recommended Model                                    | Reason                       |
| --------------------- | ---------------------------------------------------- | ---------------------------- |
| Narration / summaries | GPT-4o-mini ($0.15/M input)                          | Cheapest, sufficient quality |
| Chart insight chips   | GPT-4o-mini                                          | Simple template completion   |
| CoScout chat          | GPT-4o ($2.50/M input) or Claude Sonnet ($3/M input) | Better reasoning             |

**Dual-model routing.** The AI service accepts a `tier` parameter that routes to cheap vs. smart models:

- `tier: 'fast'` → cheap model (narrative bar, chart chips, suggestions)
- `tier: 'reasoning'` → smart model (CoScout conversation, report generation)

**Stats-only context payloads.** AI never receives raw measurement data. Context includes:

- Computed statistics: mean, median, stdev, Cp, Cpk, pass rate
- Variation metrics: η² per factor, cumulative scope
- Violations: Nelson Rule 2 points, control/spec limit breaches
- Findings: title, status, tag, factor, contribution %, corrective action
- Process description: user-provided text about their process
- Filter state: active drill path and breadcrumbs

### Context Collection

**Layer 1 — Analysis State (automatic).** Everything already in DataContext: stats, filters, findings, violations, drill path. Collected by a `buildAIContext()` function in `@variscout/core`.

**Layer 2 — Process Context (user-provided).** A text field in project settings where the analyst describes their process. Examples: "Coffee sachet filling line. 4 fill heads, 3 shifts. Target weight 250g. Key concerns: nozzle clogging, hopper timing." Persisted in AnalysisState.

**Layer 3 — Team Documents (Azure AI Search, Phase 3).** Fault trees, process maps, SOPs, control plans uploaded to Teams channel SharePoint. Azure AI Search indexes them. CoScout retrieves relevant sections when answering questions.

### Azure AI Search Integration (Phase 3)

**Why Azure AI Search:** It's Microsoft's managed RAG solution. Fully Azure-native, ARM-deployable, same-tenant data sovereignty. Supports hybrid search (keyword + vector), semantic ranking, and agentic retrieval (LLM-assisted query decomposition).

**What gets indexed:**

1. **VariScout findings** — auto-indexed on save/sync. Structured documents with project, title, factor, contribution %, Cpk, corrective action, outcome, author.
2. **Team quality documents** — indexed via SharePoint connector. Fault trees (Word/PDF/Visio), process maps, SOPs, control plans.
3. **Process context** — per-project descriptions indexed alongside findings.

**SharePoint connector status:** The SharePoint Online indexer is in public preview (March 2026). It indexes document library files (DOCX, XLSX, PPTX, PDF). Teams channel files are stored in SharePoint document libraries, so they are accessible. No separate fallback needed — it works if it works.

**How agentic retrieval helps:** When an analyst asks "Why is Fill Head 3 drifting?", agentic retrieval can decompose into sub-queries: (1) past findings mentioning Fill Head 3, (2) fault tree branches for fill head issues, (3) recent corrective actions. Results merged and ranked semantically.

### Authentication for AI Calls

**Critical: AI API keys must never be exposed in client-side JavaScript.** VariScout uses Azure AD (Entra ID) token authentication via EasyAuth, not API keys.

**Approach:** Add the Cognitive Services scope (`https://cognitiveservices.azure.com/.default`) to the EasyAuth configuration in the ARM template. The browser obtains tokens via the existing `getAccessToken()` flow in `apps/azure/src/auth/easyAuth.ts`. AI calls use the same auth pattern as Graph API calls.

This means:

- No `VITE_AI_KEY` environment variable (no secrets in client bundle)
- AI calls authenticate with the user's Azure AD identity
- RBAC controls who can use AI features (Cognitive Services User role)
- Token refresh handled by existing EasyAuth infrastructure

The AI service endpoint URL (`VITE_AI_ENDPOINT`) is a build-time setting (not a secret — it's just a URL).

### ARM Template Changes

Conditional AI resources in `infra/mainTemplate.json`:

```json
{
  "condition": "[parameters('enableAI')]",
  "type": "Microsoft.CognitiveServices/accounts",
  "name": "[variables('aiAccountName')]",
  "kind": "AIServices",
  "sku": { "name": "S0" },
  "properties": {}
}
```

Model deployments as child resources (conditional on selected model):

```json
{
  "condition": "[parameters('enableAI')]",
  "type": "Microsoft.CognitiveServices/accounts/deployments",
  "name": "[concat(variables('aiAccountName'), '/fast-model')]",
  "properties": {
    "model": { "format": "OpenAI", "name": "gpt-4o-mini", "version": "2024-07-18" },
    "sku": { "name": "GlobalStandard", "capacity": 10 }
  }
}
```

`createUiDefinition.json` adds:

- "Enable AI-powered analysis" checkbox (boolean → `enableAI` parameter)
- Model selection dropdown (GPT-4o-mini default, GPT-4o, Claude Sonnet options)
- Each selection deploys appropriate model deployments (fast + reasoning)

EasyAuth `authsettingsV2` updated to include Cognitive Services scope for AI token acquisition.

### Package Architecture

Following existing monorepo conventions:

| Component                   | Package                   | Rationale                                             |
| --------------------------- | ------------------------- | ----------------------------------------------------- |
| `buildAIContext()`          | `@variscout/core`         | Pure function, no React                               |
| Prompt templates            | `@variscout/core`         | String templates, no React                            |
| AI service (`aiService.ts`) | `apps/azure/src/services` | Network calls + IndexedDB caching (like `storage.ts`) |
| `useAIContext` hook         | `@variscout/hooks`        | React hook wrapping buildAIContext                    |
| `useAICoScout` hook         | `@variscout/hooks`        | Chat state, history, streaming                        |
| `NarrativeBar`              | `@variscout/ui`           | Shared UI component                                   |
| `ChartInsightChip`          | `@variscout/ui`           | Inline chart badge                                    |
| `CoScoutPanel`              | `@variscout/ui`           | Slide-out chat panel                                  |
| AI config in DataContext    | `apps/azure`              | App-specific wiring                                   |

## Prerequisite: Investigation Workflow Enhancement

AI value depends on the data captured during investigations. The current Finding type captures observations and investigation progress but lacks structured fields for corrective actions and outcomes. Without these, AI can't recommend actions ("this worked last time") or verify effectiveness ("Cpk improved from A to B").

**See separate spec:** `docs/superpowers/specs/2026-03-14-investigation-workflow-enhancement-design.md`

Key extensions to the Finding type:

- `rootCause` — free text describing the identified root cause
- `actions[]` — list of corrective action items (text, assignee, due date, completion)
- `outcome` — effectiveness assessment (yes/no/partial, Cpk after, notes)

These extensions are valuable independently of AI (closed-loop investigations, team accountability, improvement reports) and serve as the data foundation that makes AI narration, suggestion, and CoScout features dramatically more useful.

The workflow enhancement should be implemented **before or in parallel with** Phase 1 AI work.

## Phased Delivery

### Phase 1: Foundation — AI Service Layer + Narrative Bar

**Deliverables:**

- `buildAIContext()` in `@variscout/core` — auto-collects stats, filters, findings, violations
- AI service in `apps/azure/src/services/aiService.ts` — network calls, dual-model routing, IndexedDB response caching (pattern mirrors `storage.ts`)
- Process description text field in Azure project settings (persisted in AnalysisState as `processDescription?: string`)
- Prompt templates for narration (stat explanation, finding summary, violation explanation)
- `NarrativeBar` component in `@variscout/ui` — single-line summary at dashboard bottom
- `useAIContext` hook in `@variscout/hooks`
- ARM template: optional Azure OpenAI resource with conditional deployment
- IndexedDB cache for AI responses
- Graceful degradation: narrative bar hidden when no AI endpoint configured

**Existing code to reuse:**

- `getNextDrillFactor()`, `shouldHighlightDrill()`, `findOptimalFactors()` from `packages/core/src/variation/suggestions.ts`
- `getNelsonRule2ViolationPoints()` from `packages/core/src/stats/nelson.ts`
- `getEtaSquared()`, `getCategoryStats()` from `packages/core/src/stats/anova.ts`
- AnalysisState persistence pattern from `apps/azure/src/services/storage.ts`
- Resizable panel pattern from `apps/azure/src/hooks/useEditorPanels.ts`

### Phase 2: Suggestions — Inline Chart Insights

**Deliverables:**

- `ChartInsightChip` component in `@variscout/ui`
- AI-enhanced Nelson Rule explanations ("Process shift at points 34-42 coincides with shift changeover")
- Drill suggestion chips on Boxplot/Pareto ("→ Machine A explains 47%")
- Investigation prompts on Findings panel ("Based on current findings, consider investigating...")
- What-If scenario narration ("Reducing variation 15% improves Cpk from 1.05 to 1.31")
- Prompt templates for suggestions + explanations

### Phase 3: CoScout — Chat + Azure AI Search

**Deliverables:**

- `CoScoutPanel` component in `@variscout/ui` (resizable slide-out, same pattern as FindingsPanel)
- "Ask →" button in narrative bar bridging to CoScout
- `useAICoScout` hook in `@variscout/hooks` (chat state, history, streaming responses)
- Azure AI Search integration (index findings on save/sync)
- SharePoint document indexing (fault trees, SOPs, process maps)
- Cross-project knowledge queries ("Have we seen this pattern before?")
- Conversation history persistence in IndexedDB
- Report generation (findings → stakeholder narrative)
- ARM template: optional Azure AI Search resource

## AI vs Deterministic Suggestions

VariScout already has deterministic suggestion functions (`getNextDrillFactor()`, `shouldHighlightDrill()`, `findOptimalFactors()`). These are instant, offline, and statistically explainable.

**Interaction model:** Deterministic suggestions remain the primary UI. AI adds natural language explanation to the same suggestion rather than generating competing suggestions. Example:

- **Without AI:** Boxplot bar highlighted (yellow glow) on Machine A
- **With AI:** Same highlight + chip: "Machine A is recommended because it explains 47% of remaining variation. Your process context mentions nozzle clogging as a key concern — Machine A has the most variation in nozzle-related measurements."

AI never overrides the statistical suggestion. If the deterministic algorithm says "drill Machine A" and the AI would suggest something different, the deterministic answer wins — AI explains why, or offers its alternative as a secondary note.

## Response Caching Strategy

Cache key: hash of context payload (stats + filters + finding count + process description hash). Cache stored in IndexedDB.

- **TTL:** 24 hours or until analysis data changes (whichever comes first)
- **Cache hit:** Show cached response immediately. No network call.
- **Cache miss + online:** Fetch from AI, cache response, display.
- **Cache miss + offline:** NarrativeBar shows nothing (hidden). ChartInsightChips hidden. CoScoutPanel shows "AI unavailable offline" with last conversation history still visible.
- **Stale indicator:** When showing cached response after data change, show subtle "(cached)" label.

Debounce: AI requests throttled to max 1 per 5 seconds (prevents rapid-fire on filter drilling).

## Cost Controls

- **Max context tokens:** 2K for narration (fast tier), 8K for CoScout chat (reasoning tier)
- **Client-side throttle:** Max 1 narration request per 5 seconds, debounced on filter changes
- **Monthly budget:** Configurable in ARM template parameters (Azure resource spending limit)
- **Response caching:** Reduces repeat queries for same analysis state
- **Stats-only payloads:** Typically <500 tokens of context (no raw data bloat)

## Findings Indexing Write Path (Phase 3)

VariScout findings are persisted in `.vrs` files on OneDrive (Team plan). To index them in Azure AI Search:

**Approach:** Azure Function triggered by OneDrive file changes (Graph webhook). The function:

1. Receives notification of `.vrs` file change
2. Downloads and parses the file
3. Extracts findings as structured documents
4. Pushes to Azure AI Search index via Search SDK

This keeps the browser free of Search SDK dependencies and uses the existing `infra/functions/` Azure Function infrastructure. The function runs in the customer's tenant with Managed Identity for auth.

**Sync behavior:** Findings are indexed on save (via OneDrive sync trigger). Deleted findings are removed from the index. Edited findings are updated in-place (upsert by finding ID).

## Error Handling

| UI Layer         | Error State       | Behavior                                           |
| ---------------- | ----------------- | -------------------------------------------------- |
| NarrativeBar     | AI endpoint error | Show last cached response, or hide bar quietly     |
| NarrativeBar     | Timeout (>10s)    | Cancel request, hide bar, log to `errorService`    |
| ChartInsightChip | Any error         | Hide chip entirely — never show error on charts    |
| CoScoutPanel     | API error         | Inline error message with retry button             |
| CoScoutPanel     | Content filter    | "I can't answer that question. Try rephrasing."    |
| CoScoutPanel     | Rate limit        | "Please wait a moment before asking again."        |
| All              | No AI configured  | UI elements hidden entirely (graceful degradation) |

All errors logged to `errorService` (existing in `@variscout/ui`). No user-facing error modals — AI errors are always quiet/inline.

## Testing Strategy

| Component                   | Test Type                    | Approach                                                  |
| --------------------------- | ---------------------------- | --------------------------------------------------------- |
| `buildAIContext()`          | Unit (`@variscout/core`)     | Deterministic pure function — standard Vitest assertions  |
| Prompt templates            | Snapshot (`@variscout/core`) | Verify template output structure, not exact wording       |
| AI service (`aiService.ts`) | Unit (`apps/azure`)          | Mock `fetch()`, test routing, caching, error handling     |
| `useAIContext` hook         | Unit (`@variscout/hooks`)    | Mock DataContext, verify context shape                    |
| `useAICoScout` hook         | Unit (`@variscout/hooks`)    | Mock AI service, test chat state management               |
| `NarrativeBar`              | Component (`@variscout/ui`)  | Render with/without AI response, verify hide on no-config |
| `ChartInsightChip`          | Component (`@variscout/ui`)  | Render with suggestion data, verify dismissal             |
| `CoScoutPanel`              | Component (`@variscout/ui`)  | Render chat, verify send/receive, error states            |
| Graceful degradation        | E2E (`apps/azure`)           | Load app without AI endpoint — verify all features work   |
| AI integration              | Integration (`apps/azure`)   | Recorded response fixtures (replay, not live AI)          |

## Accessibility

- `NarrativeBar`: ARIA live region (`aria-live="polite"`) — announces changes to screen readers
- `CoScoutPanel`: Keyboard focus management (same pattern as FindingsPanel) — Tab/Escape to open/close
- `ChartInsightChip`: Sufficient color contrast (meets WCAG AA), focusable with keyboard
- All AI-generated text: Selectable, copyable, readable by assistive technology

## Future Directions (Not In Scope)

- **GraphRAG** — Knowledge graph for relationship traversal across hundreds of investigations. Valuable when scale demands it, but Azure AI Search handles the use cases until then.
- **Open Knowledge Layer** — The Azure AI Search index could be consumed by other tools (Teams bots via Copilot Studio, Power Automate flows, Power BI dashboards). VariScout could document the index schema to enable this. Not a deliverable now.
- **In-browser AI** — Small ONNX/WebLLM models for fully offline narration. Exploratory.

## Key Risks

| Risk                                | Mitigation                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SharePoint indexer stays in preview | VariScout findings indexing works independently (Blob Storage indexer is GA). SharePoint docs are a Phase 3 enhancement.                           |
| AI costs concern customers          | Default to GPT-4o-mini (cheapest). Dual-model routing minimizes CoScout token spend. Response caching reduces repeat queries.                      |
| EDAScout-style chatbot backlash     | AI never auto-acts. Always dismissable. Shows stats source alongside explanation. Analyst drives, AI assists.                                      |
| Model quality for SPC domain        | Prompt templates grounded in VariScout's glossary terms. Stats-only context reduces hallucination surface. Semantic grounding via Azure AI Search. |
| Privacy / data sovereignty          | All AI resources in customer's Azure tenant. Stats-only payloads (no raw data). Same EasyAuth + RBAC.                                              |

## Validation Sources

- [Quality Trends 2026 — Hybrid SPC + AI](https://www.qualitymag.com/articles/99268-trends-and-predictions-in-quality-in-2026)
- [Claude Models in Azure AI Foundry](https://azure.microsoft.com/en-us/blog/introducing-anthropics-claude-models-in-microsoft-foundry-bringing-frontier-intelligence-to-azure/)
- [Claude Opus 4.6 in Foundry](https://azure.microsoft.com/en-us/blog/claude-opus-4-6-anthropics-powerful-model-for-coding-agents-and-enterprise-workflows-is-now-available-in-microsoft-foundry-on-azure/)
- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/azure-openai/)
- [Azure AI Search RAG Overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)
- [Azure AI Search Agentic Retrieval](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview)
- [SharePoint Online Indexer](https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online)
- [AI Copilot UX Best Practices](https://www.letsgroto.com/blog/mastering-ai-copilot-design)
- [Microsoft UX Guidance for Generative AI](https://learn.microsoft.com/en-us/microsoft-cloud/dev/copilot/isv/ux-guidance)
- [Manufacturers Prefer Copilots (53%)](https://www.iiot-world.com/artificial-intelligence-ml/artificial-intelligence/industrial-copilots-ai-manufacturing/)
- [AI Copilot for SPC Violations](https://www.oxmaint.com/blog/post/ai-copilot-spc-violations-finishing-line)
- [LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)
