# AI Architecture Readiness Review

Strategic review of VariScout's architecture fitness for AI integration, conducted before implementation begins.

**Date:** 2026-03-14

**Related:** [ADR-019](../../07-decisions/adr-019-ai-integration.md), [AI Architecture](ai-architecture.md), [AI-Assisted Analysis](../../03-features/workflows/ai-assisted-analysis.md)

---

## Architecture Fitness Assessment

### What's Already Excellent

The existing architecture is fundamentally sound for AI integration. No major restructuring is needed.

**1. Rich computed data structures** — `StatsResult`, `AnovaResult` (with η², insight text), `DrillVariationResult` (cumulative scope, impact levels), `ChannelResult` (health classification). These are ideal AI context payloads — structured, typed, stats-only.

**2. Deterministic intelligence layer** — `getNextDrillFactor()`, `shouldHighlightDrill()`, `findOptimalFactors()` in `packages/core/src/variation/suggestions.ts` already rank factors by contribution. AI explains these conclusions rather than generating competing ones. This is architecturally correct and aligned with ISO/IEC 42001 human oversight requirements.

**3. FindingContext captures investigation snapshots** — Each Finding stores activeFilters, cumulativeScope, and stats at the moment of capture. No other SPC tool captures this contextual breadcrumb trail. This is a strategic asset for AI.

**4. Glossary system** — 25 terms in `packages/core/src/glossary/terms.ts` with definitions, descriptions, relatedTerms. Directly usable for domain glossary injection (validated as the top hallucination-reduction strategy by epistemic stability research).

### Four Targeted Gaps

| Gap                                        | Impact on AI                                       | Effort | Current State                                                        |
| ------------------------------------------ | -------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| **1. No structured process metadata**      | AI is generic narrator vs. domain-aware assistant  | Medium | Only free-text `processDescription` planned                          |
| **2. No closed-loop investigation data**   | AI can't recommend actions or verify effectiveness | Large  | `suspectedCause`, `actions[]`, `outcome` planned in ADR-015 revision |
| **3. Glossary too small for AI grounding** | Higher hallucination risk in SPC domain            | Small  | 25 terms, needs ~40-50                                               |
| **4. No `buildAIContext()` function**      | No structured bridge between data layer and AI     | Medium | All data exists, no serialization function                           |

The `@variscout/core` → `@variscout/hooks` → `@variscout/ui` → `apps/azure` layering is correct. AI fits naturally. The gaps are additive (new types, new functions), not structural.

---

## Context Enrichment Strategy

The difference between generic and excellent AI is process context. This requires no AI — it's pure UX/data model work.

### ProcessContext Type

```typescript
interface ProcessContext {
  // Free text (always available)
  description?: string;

  // Process identity (Phase 2 — optional wizard)
  processType?: 'manufacturing' | 'service' | 'laboratory' | 'logistics' | 'other';
  industry?: string; // "food & beverage", "automotive", "pharma"

  // Measurement context (auto-inferred from column names)
  measurementUnit?: string; // "grams", "mm", "°C"

  // Factor role mapping (auto-inferred, user can correct)
  equipmentFactor?: string; // Which factor = machines/equipment?
  temporalFactor?: string; // Which factor = time periods/shifts?
  operatorFactor?: string; // Which factor = people?
  materialFactor?: string; // Which factor = materials/lots?

  // Process structure (Phase 2 — optional)
  processSteps?: string[]; // ["mixing", "filling", "sealing", "packaging"]
}
```

**Design rationale:**

- All fields optional — backward compatible with existing .vrs files
- No `defectTypes[]` — defect types emerge from the data (Pareto factor categories)
- No `factorStepMapping` — too complex; let findings accumulate this knowledge organically
- No spec violation labels on SpecLimits — Finding comments + suspected cause already capture condition vocabulary with richer, investigation-specific context

### Factor Role Auto-Inference

`packages/core/src/parser/keywords.ts` already has `FACTOR_KEYWORDS` and `METADATA_PATTERNS`. Extending for factor role classification is straightforward:

```typescript
const EQUIPMENT_KEYWORDS = [
  'machine',
  'line',
  'cell',
  'station',
  'tool',
  'head',
  'nozzle',
  'equipment',
];
const TEMPORAL_KEYWORDS = ['shift', 'day', 'week', 'hour', 'period', 'time'];
const OPERATOR_KEYWORDS = ['operator', 'technician', 'inspector', 'worker', 'person'];
const MATERIAL_KEYWORDS = ['batch', 'lot', 'supplier', 'vendor', 'material', 'raw'];
```

This makes auto-inference nearly free to implement — extending an existing pattern, not building new infrastructure.

### Progressive Phases

**Phase 1 (zero friction — implement before AI):**

- Auto-infer factor roles from column names during `detectColumns()` — extend existing keyword infrastructure
- Auto-infer `measurementUnit` from outcome column name suffix ("Weight_g" → grams)
- Store inferences in `ProcessContext` on `AnalysisState`
- Show inferred roles as dismissable confirmation chips in ColumnMapping
- Add `processDescription` text field to Settings panel
- **Value without AI:** Better factor labeling in charts, more meaningful drill suggestions

**Phase 2 (minimal friction — with first AI features):**

- Optional "About your process" prompt after first analysis (3-5 fields, dismissable, once per project)
- Confirm/correct auto-inferred factor roles
- **Value:** AI narration transforms from generic to domain-aware

**Phase 3 (cross-project knowledge — Team plan):**

- Azure AI Search indexes accumulated findings across projects
- Optional: SharePoint document upload for supplementary context (SOPs, process maps, control plans)
- **Value:** AI references past investigations across projects

### Context Impact — Concrete Progression

| Level                  | AI Output                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No context             | "Category 'B' in factor 'Machine' accounts for 47% of variation."                                                                                                                      |
| Auto-inferred roles    | "Machine B accounts for 47% of variation. Investigate this equipment."                                                                                                                 |
| + Process description  | "Fill Head B accounts for 47% of weight variation. You mentioned nozzle clogging as a concern — check the nozzle on Head B."                                                           |
| + Process steps        | "Fill Head B (filling step) accounts for 47% of weight variation. This is downstream of mixing — if the issue were upstream, all fill heads would be affected."                        |
| + Accumulated findings | "Fill Head B — you've seen this pattern 3 times in 6 months. Nozzle wear was the cause 2 times (67%). Average resolution: 5 days. Nozzle replacement improved Cpk by 0.47 on average." |

---

## Knowledge Strategy

### Findings ARE the Knowledge Base

VariScout's Finding system is a data-driven, measurement-backed alternative to traditional FMEA. It uses real measurements, not subjective RPN scores.

| Traditional FMEA (subjective)                        | VariScout Finding (measured)                                  |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| **Severity** (1-10 guess)                            | **Cpk** + pass rate (actual capability)                       |
| **Occurrence** (1-10 guess)                          | **η² contribution %** (actual variation share)                |
| **Detection** (1-10 guess)                           | VariScout detected it (Nelson rules, control limits)          |
| **RPN = S×O×D** (meaningless ordinal multiplication) | Cpk impact + variation % (statistically meaningful)           |
| Failure mode (written once, goes stale)              | Finding text + suspected cause (evolves with investigation)   |
| Recommended action (generic, rarely verified)        | Corrective action with tracked Cpk before/after (closed-loop) |

The findings-based knowledge base is a measurement-evidence layer that **complements** traditional FMEA — not replaces it. FMEA's preventive value (catching problems during design phase) is irreplaceable. But FMEA has limitations: RPN scores are subjective, documents go stale, and recommended actions are rarely verified. VariScout's findings fill this gap with measured, verified, evolving knowledge.

Note: the AIAG-VDA joint FMEA handbook (2019) already eliminated RPN in favor of Action Priority — the industry is moving toward data-driven risk assessment.

### Investigation Workflow — Where Knowledge Sources Help

| Workflow Step            | What Happens                                               | Knowledge Source                                             |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| **1. Detect**            | Load data → I-Chart shows problem (red dots, Nelson rules) | VariScout IS the detection                                   |
| **2. Locate**            | Drill-down → identify WHERE + WHEN + DIRECTION             | VariScout's ANOVA + η² + drill suggestion logic              |
| **3. Problem statement** | "Machine A morning shift drifting up since Week 3"         | Auto-generated from Finding context                          |
| **4. Assign**            | Pin finding → assign to person for investigation           | Finding system (existing)                                    |
| **5. Investigate**       | Person checks shop floor, logs, equipment                  | **AI suggests what to check** from past findings + team docs |
| **6. Suspected cause**   | Person reports: "Nozzle worn beyond tolerance"             | Human input in Finding                                       |
| **7. Derive action**     | Define corrective action based on understanding            | **AI suggests actions** from past outcomes + SOPs            |
| **8. Verify**            | Load new data → Cpk improved? → resolve                    | VariScout comparison (before/after)                          |

### What VariScout Captures vs. What Stays in Documents

| Information                      | Where It Lives                    | Why                                |
| -------------------------------- | --------------------------------- | ---------------------------------- |
| Known causes per defect type     | Control plan in SharePoint        | Domain knowledge — don't duplicate |
| Reaction plans / SOPs            | Control plan + SOPs in SharePoint | Maintained by quality team         |
| Measured investigation outcomes  | VariScout findings (accumulated)  | This IS VariScout's value          |
| Combined knowledge at query time | AI copilot (merges both)          | Best of both worlds                |

### Two Knowledge Tiers

| Tier                       | Knowledge Source                    | Available For | Cost                             | When                  |
| -------------------------- | ----------------------------------- | ------------- | -------------------------------- | --------------------- |
| **Same-project findings**  | Current project's findings[]        | Both plans    | **Free** — already loaded        | AI Phase 1            |
| **Cross-project findings** | Findings indexed in Azure AI Search | Team plan     | Free tier (50MB) or Basic €67/mo | AI Phase 3            |
| **Supplementary docs**     | Team docs in SharePoint             | Team plan     | Same AI Search cost              | AI Phase 3 (optional) |

### Findings as Exportable Knowledge

| Export                                | Content                                                    | Use Case                              |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| **Improvement report** (PDF/Markdown) | Key drivers, actions taken, Cpk improvements, timeline     | Management reviews, project close-out |
| **Structured export** (JSON/CSV)      | All findings with context, actions, outcomes, measurements | External quality systems, databases   |
| **AI-generated summary**              | Recurring causes, resolution patterns, total improvement   | Lessons learned, team training        |

This is what ISO 9001:2026 auditors want: documented investigation → action → verification with measured outcomes.

---

## Platform Enhancement: Foundry IQ on Azure AI Search

The existing Azure AI Search-based architecture in ADR-019 is correct. **Azure AI Foundry IQ** (late 2025) adds a managed orchestration layer on top that simplifies Phase 3:

| Aspect              | Current Azure AI Search Plan                   | + Foundry IQ Enhancement                                                                                 |
| ------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| SharePoint indexing | SharePoint connector (preview) — manual config | **SharePoint Indexed Knowledge Source** — auto-generates data source, skillset, index, indexer           |
| Query orchestration | Azure AI Search agentic retrieval              | **Foundry IQ agentic reasoning** — managed query decomposition, parallel sub-queries, semantic reranking |
| Source attribution  | Available via Search API                       | **Built-in source references** in agent responses                                                        |
| ACL sync            | Configurable                                   | **Auto-synced** from SharePoint                                                                          |

**Foundry IQ implementation notes:**

- Hidden system prompts consume tokens invisibly — budget for this in cost estimates
- Use **extractive retrieval mode** (not answer synthesis) for most scenarios — cheaper, more transparent
- Set `retrieval_reasoning_effort` to "minimal" for Phase 1/2 to control costs
- Have a **Blob Storage fallback** if SharePoint connector (still preview) has reliability issues
- Foundry IQ has a free tier — good for development and small teams

---

## AI-Assisted Context Extraction from Documents (Phase 3)

When team documents are uploaded to the Teams channel SharePoint:

**Level 1 (query-time reference — already planned):** AI copilot queries Azure AI Search during conversation and references document sections directly. No extraction.

**Level 2 (proactive extraction — new capability):** Azure Function triggers on document upload, sends to AI with structured extraction prompt, and **suggests** ProcessContext updates:

```
Document detected: "Production Control Plan v3.2"

Suggestions extracted:
- Process steps: mixing → filling → sealing → packaging (Section 2.1)
- Measurement unit: grams (Section 3.1)

[Apply suggestions] [Review individually] [Dismiss]
```

**Design principles:**

- AI **suggests**, user **confirms** — never auto-overwrite user-entered data
- One AI call per document upload (~$0.01-0.05) — not per session
- Same Azure Function infrastructure as findings indexing
- Extraction prompt grounded in ProcessContext schema (structured output)
- If user has already set values, suggestions show as "Update X → Y?" not overwrite

---

## Competitive Positioning

### Industry Landscape

**Minitab AI** (April 2025): AI interprets existing stats, never calculates. "AI you can trust." Privacy-first. VariScout's spec aligns perfectly.

**AI Compliance landscape (2026):**

- **ISO 9001:2026** (DIS approved, final publication Sept 2026): Emphasizes digitalization and data-driven decisions
- **EU AI Act** (high-risk obligations August 2, 2026): Requires human oversight, transparency, risk management for AI in quality/safety-critical contexts
- **ISO/IEC 42001** (AI Management System): Requires human oversight, data governance, transparency
- **prEN 18286** (draft): Bridges ISO 9001 + ISO 42001 for EU AI Act compliance

VariScout's "deterministic-first, AI-explains" architecture aligns with all frameworks.

### VariScout's Unique AI Advantages

1. **Measurement-backed knowledge base** — Traditional FMEA uses subjective RPN scores. VariScout's accumulated findings carry actual Cpk values, measured η² contributions, and verified action outcomes.

2. **Context accumulation across investigations** — Minitab AI interprets one session. VariScout's Finding system with context snapshots means AI references prior investigations.

3. **Deterministic-first architecture** — AI explains computed suggestions, doesn't generate conclusions. Reproducible and auditable. For EU AI Act + ISO 42001: "The statistical engine identified Machine A (47%). AI provided the explanation. Both are auditable."

4. **The closed-loop advantage** — VariScout captures the full PDCA cycle with measured outcomes. After 50+ resolved findings, the AI has genuine organizational knowledge. **No competitor has this feedback loop.**

5. **Team knowledge integration** — Minitab is single-user desktop. VariScout's Team plan connects findings across the organization via Azure AI Search.

---

## Recommendations — What, Why, and When

| What                                                               | Why                                                                          | When                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------- |
| **Closed-loop investigations** (suspectedCause, actions, outcome)  | This IS the AI knowledge base. Prerequisite for all meaningful AI.           | **Before AI**             |
| **Factor role auto-inference** (extend parser keywords.ts)         | Transforms AI from generic to equipment-aware. Zero user effort.             | **Before AI**             |
| **ProcessContext type** on AnalysisState                           | Structured metadata for AI grounding. All fields optional.                   | **AI Phase 1**            |
| **processDescription** text field in Settings                      | Free-text process context for what auto-inference can't capture.             | **AI Phase 1**            |
| **Glossary expansion** (25 → ~40-50 terms) + buildGlossaryPrompt() | Top validated strategy for reducing AI hallucination.                        | **AI Phase 1**            |
| **buildAIContext()** function                                      | Structured bridge between data layer and AI. Token-budget aware.             | **AI Phase 1**            |
| **Optional process wizard** (3-5 fields)                           | Process type, industry, process steps. Enriches AI context.                  | **AI Phase 2**            |
| **Cross-project knowledge queries** (Azure AI Search)              | "Have we seen this before?" across all projects. Team plan.                  | **AI Phase 3**            |
| **Findings knowledge export** (report, CSV, AI summary)            | Exportable improvement reports for management reviews, ISO audits.           | **AI Phase 2-3**          |
| **Foundry IQ orchestration** on Azure AI Search                    | Managed agentic retrieval enhancement. Simplifies Phase 3.                   | **AI Phase 3**            |
| **SharePoint docs** (SOPs, control plans)                          | Supplementary context for Team plan. Not primary knowledge source.           | **AI Phase 3 (optional)** |
| **AI-extracted context from docs**                                 | Auto-populate ProcessContext from uploaded docs. AI suggests, user confirms. | **AI Phase 3**            |

---

## See Also

- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [AI Architecture](ai-architecture.md) — Technical implementation
- [AI-Assisted Analysis](../../03-features/workflows/ai-assisted-analysis.md) — User-facing workflow
- [AI Components](../../06-design-system/components/ai-components.md) — Component UX specs
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Findings workflow
- [Data Flow](data-flow.md) — Existing data pipeline
