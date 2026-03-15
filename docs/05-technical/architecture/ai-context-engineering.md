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

## References

- [Effective Context Engineering — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Azure AI Foundry Prompt Caching — Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching)
- [Knowledge Model Architecture](knowledge-model.md)
- [AI Architecture](ai-architecture.md)
- [Methodology Reference](../../01-vision/methodology.md)
