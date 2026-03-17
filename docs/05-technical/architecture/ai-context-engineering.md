# AI Context Engineering

How VariScout constructs AI prompts to ground CoScout in the VariScout methodology and current analysis state.

---

## Three-Tier Prompt Architecture

VariScout structures AI prompts in three tiers, ordered from most static to most dynamic. This aligns with Azure AI Foundry's automatic prompt caching (≥1,024 tokens of static prefix are cached server-side).

### Tier 1 — Static: Role + Methodology + Glossary

Placed first in the system prompt for maximum cache hit rate.

| Content                        | Source                                         | Tokens (~) |
| ------------------------------ | ---------------------------------------------- | ---------- |
| CoScout role definition        | `buildCoScoutSystemPrompt()`                   | ~150       |
| Tools + questions + principles | Hardcoded in prompt template                   | ~200       |
| Glossary terms                 | `buildGlossaryPrompt(categories, maxTerms)`    | ~400       |
| Methodology concepts           | `buildGlossaryPrompt({includeConcepts: true})` | ~200       |
| **Total static prefix**        |                                                | **~950**   |

The static prefix exceeds 1,024 tokens when glossary + concepts are both included, enabling Azure AI Foundry prompt caching.

### Tier 2 — Semi-Static: Investigation State + Ideas

Changes when the investigation progresses (new hypotheses, status changes, ideas added).

| Content                     | Source                                          | Tokens (~) |
| --------------------------- | ----------------------------------------------- | ---------- |
| Problem statement           | `ProcessContext.problemStatement`               | ~20        |
| Hypothesis tree             | `AIContext.investigation.hypothesisTree`        | ~50-200    |
| Improvement ideas           | `AIContext.investigation.allHypotheses[].ideas` | ~30-100    |
| Phase-specific instructions | Phase detection in prompt template              | ~50        |
| Investigation categories    | `AIContext.investigation.categories`            | ~30        |

### Tier 3 — Dynamic: Stats + Filters

Changes on every filter drill or data update. Placed in a separate system message.

| Content             | Source                       | Tokens (~) |
| ------------------- | ---------------------------- | ---------- |
| Current statistics  | `AIContext.stats`            | ~30        |
| Active filters      | `AIContext.filters`          | ~20-50     |
| Violations          | `AIContext.violations`       | ~20        |
| Findings summary    | `AIContext.findings`         | ~30        |
| Process description | `ProcessContext.description` | ~20        |

---

## Phase-Aware Context Filtering

The CoScout system prompt includes phase-specific instructions based on deterministic phase detection (`detectInvestigationPhase()`):

| Phase      | Instruction Focus                                                            |
| ---------- | ---------------------------------------------------------------------------- |
| Initial    | Help identify which chart to examine first and what patterns to look for     |
| Diverging  | Encourage exploring hypotheses across different factor categories            |
| Validating | Help interpret η² — contribution, not causation                              |
| Converging | Brainstorm improvements. Compare effort vs impact. Reference existing ideas. |
| Acting     | Check the Capability chart — is Cpk improving?                               |

When converging with supported hypotheses that have improvement ideas, the prompt includes the existing ideas and instructs CoScout to build on them or suggest alternatives.

---

## Token Budget Management

| Consumer             | Max Context | Model Tier |
| -------------------- | ----------- | ---------- |
| NarrativeBar         | ~2K tokens  | fast       |
| ChartInsightChip     | ~1K tokens  | fast       |
| CoScout conversation | ~8K tokens  | reasoning  |

Budget is managed by:

- `maxGlossaryTerms` parameter (default 40) limits glossary size
- History truncation (last 10 messages for CoScout)
- Category-based glossary filtering (only include relevant categories)

---

## Prompt Caching Alignment

Azure AI Foundry caches the longest matching prefix of the system prompt. VariScout maximizes cache hits by:

1. Placing static content (role + methodology + glossary) first in the system message
2. Placing variable content (stats, filters) in a separate system message
3. Keeping the static prefix stable across requests (>1,024 tokens)

This means the first ~950 tokens of every CoScout request are served from cache after the first call, reducing latency and cost.

---

## Extended Dynamic Context Fields

Fields planned for Tier 3 (Dynamic) and investigation-aware context enrichment.

### `activeChart` (Tier 3 — Dynamic)

- **Type:** `'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats' | undefined`
- **Source:** Carousel view state (mobile) or focused chart (desktop)
- **Purpose:** CoScout knows which chart the user is currently viewing/asking about
- **Placement:** Tier 3 dynamic system message

### `variationContributions` (Tier 3 — Dynamic)

- **Type:** `Array<{ factor: string; etaSquared: number; category?: string }>`
- **Source:** `useVariationTracking` output (η² per factor); `category` auto-derived from `InvestigationCategory[]` via `getCategoryForFactor()` in `@variscout/core/ai`
- **Purpose:** CoScout can answer "Which factor matters most?" with data-backed responses, and understands whether each factor is a machine, material, method, etc.
- **Placement:** Tier 3 dynamic system message

### `factorRoles` (Tier 3 — Dynamic)

- **Type:** `Array<{ factor: string; role: string }>` (derived, not persisted)
- **Source:** Built at context-build time by `buildAIContext()` — maps each variation contribution's `category` to a human-readable role label (e.g., "Machine", "Material")
- **Purpose:** Gives CoScout domain awareness of what each factor represents in the process, enabling more specific questions and hypotheses
- **Consumer:** `buildSummaryPrompt()` emits a "Factor roles:" line in the context summary; flows to CoScout via the system message
- **Placement:** Tier 3 dynamic system message (alongside `variationContributions`)

### `drillPath` (Tier 3 — Dynamic)

- **Type:** `string[]` — ordered factor names from filterStack
- **Source:** `filterStack.map(f => f.factor)` from AnalysisState
- **Purpose:** CoScout understands the analyst's reasoning trajectory through the data
- **Placement:** Tier 3 dynamic system message

### `focusContext` (Between Tier 2 and Tier 3)

Populated by "Ask CoScout about this" actions in MobileCategorySheet, FindingCard, and HypothesisNode. Injected as an additional system message to preserve Tier 1 prompt caching.

```typescript
focusContext?: {
  chartType?: 'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats';
  category?: { name: string; mean?: number; contributionPct?: number };
  finding?: { text: string; status: string; hypothesis?: string };
}
```

### `selectedFinding` (Tier 2 — Investigation)

- Already typed in `AIContext.investigation` (types.ts lines 70-75)
- **Status:** Wiring complete — populated from FindingsPanel active selection
- **Consumer:** `buildSuggestedQuestions()` uses this field; also rendered in `buildCoScoutSystemPrompt()` to ground conversation in the currently focused finding

### `teamContributors` (Teams Context)

- **Type:** `{ count: number; hypothesisAreas: string[] }`
- **Source:** Distinct `finding.assignee` display names + `comment.author` values, combined with hypothesis factor names
- **Purpose:** CoScout coordinates multi-investigator Teams scenarios (e.g., "Alex already tested Machine A — consider checking Machine B instead")
- **Note:** Only populated in Azure Team plan when findings have author metadata

---

## Locale-Aware Prompting

VariScout prompts are always written in English, but the response language switches based on the user's locale setting. See [ADR-025](../../07-decisions/adr-025-internationalization.md).

### `buildLocaleHint()`

Prepends a `LANGUAGE: Respond in [locale]...` directive to system prompts. This hint is injected at the very start of the CoScout system message, before the role definition, so the model sees the language instruction first.

- When locale is `en`, no hint is emitted (default behavior)
- For other locales (e.g., `de`, `fi`, `ja`, `zh`), produces a one-line directive: `LANGUAGE: Respond in German. Use professional quality terminology.`
- Token impact: ~15 tokens per non-English locale; zero tokens for English

### Bilingual Glossary

`buildGlossaryPrompt({ locale })` produces bilingual sub-lines when a non-English locale is active. Each glossary term includes the English definition followed by a localized line:

```
**UCL**: Upper Control Limit — 3σ above the process mean
  DE: **OKG**: Obere Kontrollgrenze — 3σ über dem Prozessmittelwert
```

- Localized terms are sourced from `@variscout/core/i18n` locale catalogs
- Token impact: ~30% increase in the glossary section when a non-English locale is active
- Only terms with available translations in the active locale produce bilingual lines; others remain English-only

### Design Principle

Prompts stay in English to preserve prompt caching (the English prompt prefix remains stable across locales). Only the response language switches. The locale hint is placed before the static prefix so it does not fragment the cacheable region — Azure AI Foundry caches from the first token, and the hint is short enough (~15 tokens) that the remaining static prefix still exceeds the 1,024-token caching threshold.

---

## Staged Comparison Context

When the analysis is in staged/verification mode (before vs. after comparison), additional context fields are injected to ground CoScout in the improvement evidence.

### `stagedComparison` Field (Tier 3 — Dynamic)

```typescript
stagedComparison?: {
  stageNames: [string, string];       // e.g., ["Before", "After"]
  deltas: {
    mean: number;                      // shift in process mean
    sigma: number;                     // shift in std deviation
    cpkBefore: number | null;
    cpkAfter: number | null;
    colorCoding: 'improved' | 'degraded' | 'unchanged';
  };
}
```

- **Source:** Computed from `StagedAnalysisResult` in `buildAIContext()` when `stageColumn` is set
- **Placement:** Tier 3 dynamic system message, alongside stats and filters

### Prompt Overrides

- **`buildSummaryPrompt()`** — When `stagedComparison` is present, the closing instruction switches from the standard "suggest next drill" to a verification-focused directive: summarize what improved, what degraded, and whether the Cpk target is met.
- **`buildCoScoutSystemPrompt()`** — The acting-phase instruction block is replaced with verification context that references the stage names, delta values, and color coding. CoScout is instructed to interpret the comparison evidence rather than suggest new experiments.

---

## Knowledge Documents Context

When the Knowledge Base is available (Azure Team AI plan), CoScout conversations are enriched with relevant organizational knowledge retrieved at query time.

### `knowledgeDocuments` Field (Tier 3 — Dynamic)

```typescript
knowledgeDocuments?: Array<{
  title: string;        // Document or section title
  snippet: string;      // Relevant excerpt, max 300 characters
  source: string;       // Origin identifier (e.g., "Quality Manual", "SOP-042")
  url?: string;         // Optional link to full document
}>;
```

### Population Flow

1. User sends a message in CoScout
2. `onBeforeSend` callback in `useAICoScout` triggers a knowledge search using the user's query
3. Top matching documents are attached to the `knowledgeDocuments` field before context assembly
4. The field is included in the Tier 3 dynamic system message

### `formatKnowledgeContext()`

Transforms `knowledgeDocuments` into prompt-ready text. Each entry is formatted as a `[From: <source>]` prefixed block:

```
ORGANIZATIONAL KNOWLEDGE:
[From: Quality Manual] Cpk target for filling lines is 1.67...
[From: SOP-042] When sigma exceeds 0.15ml, check nozzle calibration...
```

- Snippets are capped at 300 characters to control token usage
- Empty or undefined `knowledgeDocuments` produces no output (zero tokens)
- Typical token cost: ~50-150 tokens depending on number of matched documents

---

## References

- [Effective Context Engineering — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Azure AI Foundry Prompt Caching — Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching)
- [Knowledge Model Architecture](knowledge-model.md)
- [AI Architecture](ai-architecture.md)
- [Methodology Reference](../../01-vision/methodology.md)
- [AI Context Pipeline Reference](ai-context-reference.md) — Module map, function signatures, data flows
