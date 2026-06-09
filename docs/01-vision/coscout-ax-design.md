---
title: 'CoScout AX Design (canonical)'
purpose: design
tier: living
audience: [human, agent]
topic: [ax, coscout, design]
status: active
related: [adr-060, adr-068, adr-069, coscout-prompts-invariant]
last-verified: 2026-06-09
layer: L1
---

# CoScout AX Design (canonical)

## Purpose

Single canonical AX-design surface for CoScout — gathers persona, voice, tier-gated behaviors, knowledge architecture, safety boundaries, prompt engineering rules, and eval discipline that were previously scattered across ADRs 060/068/069 and invariant rules. Future CoScout design changes amend this doc; constituent ADRs and the prompt invariant remain the decision provenance and engineering detail.

---

## Persona + Voice

CoScout has two distinct persona layers — its OWN narrator voice (project-wide constant) and ROLE-AWARE adjustments tuned to the active user's project-membership role. Both layers compose; neither modifies analysis content.

### CoScout's narrator voice (constant)

CoScout is an **investigator, not an analyst**. Voice principles:

- **Calm, structured, hypothesis-driven.** Treats every question as an investigation step; never speculates beyond grounded context.
- **Minimal nudges over proactive interruptions** (per `feedback_ai_proactivity`). CoScout speaks when it has grounded, useful context — not because it can.
- **Plain English over jargon.** Methodology lineage stays internal per `feedback_drop_methodology_bridges`.
- **First-person plural ("we") when narrating shared analyses with the active project's team**, first-person singular when CoScout suggests something speculative.

### Role-aware tone (per active user's project-membership role)

V1 has 3 project-membership roles (Lead / Member / Sponsor — per `2026-05-16-wedge-architecture-design`). CoScout adapts the framing (not the analysis) per role:

| Active role | Tone adjustment                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lead**    | Methodology-coaching tone: surfaces next-step suggestions framed as questions ("Have we checked stability before capability?"); references the three-level methodology model when context allows. |
| **Member**  | Task-completion tone: surfaces actionable next steps in second person ("Pick the Y you care about; I'll wait."); collapses methodology framing into one-line context.                             |
| **Sponsor** | Outcome-framed summaries: leads with "Here's where the project stands" + improvement-magnitude framing; suppresses tool-action prompts (Sponsor is read-only by ACL).                             |

Role-detection is via active `ProjectMember.role` (per ADR-082's ACL model). Default to Member tone if role is ambiguous (e.g., user is viewing a project they don't belong to, read-only paths).

**What stays constant across roles:** the underlying analysis (stats, charts, suspected-cause language), the methodology lineage, the safety boundaries, the response paths. Role only affects WORDING + suggestion priority.

**Voice principle (across all roles):** Minimal nudges over proactive interruptions (per `feedback_ai_proactivity`). CoScout speaks when it has grounded, useful context — not because it can.

**Language invariant:** Never "root cause" — use "contribution," "suspected cause," or "mechanism" (P5 amended; ESLint enforced per `.claude/INVARIANTS.md`).

---

## Availability

CoScout is **Azure-only** in V1. The PWA has no CoScout mount and no AI tier gate. Azure owns the embedded panel, voice input, Responses API tool loop, Foundry/AI Search retrieval, and proposal-gated actions.

| Behavior                           | PWA | Azure                                   |
| ---------------------------------- | --- | --------------------------------------- |
| CoScout panel visible              | No  | Yes                                     |
| AI tool calls                      | No  | Yes (surface-gated executable registry) |
| Voice input                        | No  | Yes (transcription-first, ADR-071)      |
| Investigation retrieval (Pillar 2) | No  | Yes (JSONL → Foundry IQ)                |
| External KB (Pillar 3)             | No  | Yes (SOPs, FMEAs, specs)                |
| Hub connection proposals           | No  | Yes (Analyze Wall, proposal-gated)      |
| Prompt caching                     | N/A | Yes (tier 1 invariant)                  |

**Implementation reference:** `apps/azure/src/features/ai/` + `packages/core/src/ai/prompts/coScout/`.

---

## Knowledge Architecture

Five pillars per [ADR-060](../07-decisions/adr-060-coscout-intelligence-architecture.md). Compact summary below; engineering detail in ADR-060.

| Pillar                                 | What                                                                                                                                                      | Status                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **1 — Hot Context Quality**            | `buildAIContext()` enriched with problem statement, Analysis Scope, project role, top findings with outcomes, overdue actions, hypotheses, and Wall state | Delivered                       |
| **2 — Investigation Retrieval**        | Investigation artifacts serialized to Blob Storage as JSONL; Foundry IQ auto-indexes for on-demand retrieval via `search_knowledge_base` tool             | Pending (Azure infra Phase 3–5) |
| **3 — External Document KB**           | SOPs, specs, FMEAs uploaded to Blob Storage; hybrid BM25 + vector + RRF search with semantic reranking; project-level security filtering                  | Pending (Azure infra Phase 3–5) |
| **4 — Finding ↔ CoScout Interaction**  | Finding-as-unit and hypothesis-aware proposal cards on the Analyze Wall; `answer_question` is retired                                                     | Delivered                       |
| **5 — Mode-Aware Evidence Completion** | Mode-aware evidence sorting via strategy context; mode is a property of Analyze scope, not a CoScout axis                                                 | Delivered                       |

**Search backend:** Azure AI Search + Foundry IQ agentic retrieval. `KnowledgeAdapter` interface abstracts backend with fallback chain: `FoundryIQKnowledgeAdapter` → `AISearchKnowledgeAdapter` → `BlobKnowledgeAdapter`.

**Surface + loop-intent model (2026-06-09):** CoScout behavior is framed by deterministic surface (Process / Explore / Analyze Wall / Report) and soft inferred loop-intent (diverging / converging / deciding). Intent never gates tools; it only changes emphasis.

---

## Safety Boundaries

Three boundaries per [ADR-069](../07-decisions/adr-069-three-boundary-numeric-safety.md). Compact summary below; engineering detail in ADR-069.

```
Raw Data → [B1: Input] → Clean Data → [Stats Engine] → [B2: Output] → Safe Results → [B3: Display] → User
```

| Boundary                     | What                                                                        | Mechanism                                                         |
| ---------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **B1 — Input Sanitization**  | `toNumericValue()` rejects NaN/Infinity at parse time                       | `isFinite() && !isNaN()` in `types.ts`                            |
| **B2 — Stats Engine Output** | Stats functions return `number                                              | undefined`, never NaN or Infinity                                 | `safeMath.ts`: `finiteOrUndefined()`, `safeDivide()`, `computeOptimum()` |
| **B3 — Display Formatting**  | `formatStatistic()` returns "—" for non-finite values; `.toFixed()` guarded | ESLint `no-restricted-syntax` warns on `.toFixed()` in UI/AI code |

**Exception:** `andersonDarlingTest()` intentionally returns `{ statistic: Infinity, pValue: 0 }` for degenerate data (all values identical). Consumers must handle this.

**CoScout-specific output safety:** REF markers in AI responses reference chart elements, never raw data values (ADR-057, customer-owned data invariant). The AI prompt never receives row-level customer data — only positional chart references.

---

## Prompt Engineering

Canonical prompt engineering rules live in `.claude/invariants/coscout-prompts.md`. Do not restate rules here; link instead.

**Key constraints (brief summary):**

- Entry point is `assembleCoScoutPrompt({ surface, scope, context })` — the sole prompt-assembly entry point (`legacy.ts` / `buildCoScoutSystemPrompt()` deleted 2026-05-30, ADR-068 complete)
- Every tool in `tools/registry.ts` declares deterministic `surfaces`; ungated tools leak across product surfaces
- Tier 1 is session-invariant — content that moves between tier 1 and tier 3 breaks prompt-cache hit rate (10x token cost)
- Never "root cause" language (ESLint-enforced across prompts and CoScout code)

Full rules: [`.claude/invariants/coscout-prompts.md`](../../.claude/invariants/coscout-prompts.md)

---

## Tool-Calling

**Registry:** `packages/core/src/ai/prompts/coScout/tools/registry.ts` — executable tool registry gated by `surfaces: CoScoutSurface[]`.

**Surface gates:** Tools declare which product surfaces they're available on (Process, Explore, Analyze, Report). Soft loop-intent never gates tools.

**Agent API shape:** The embedded Azure panel is the first client of the transport-agnostic tool surface. A future in-tenant MCP server is named-future, not V1 scope.

**Implementation detail:** `packages/core/src/ai/tools/` — see `packages/core/CLAUDE.md` for specifics.

---

## Voice Input

Azure-only, transcription-first (ADR-071). CoScout receives a text transcript of the analyst's voice input; it does not receive audio. Voice scope: CoScout draft input, finding editor, finding comments. Voice does not bypass investigation structure — all outputs route through the same investigation model as keyboard input.

---

## Eval Discipline

**Current state:** A fixture-based behavioral eval harness exists at `packages/core/src/ai/__tests__/coScoutBehavioralEval.test.ts`.

It gates prompt changes for refusal-to-invent numbers, orient-before-coaching, tool choice/arguments, REF grounding, surface-appropriate behavior, and proposal safety.

---

## Mode-Aware Methodology Coaching

CoScout adapts its coaching per analytical mode. Each mode has a dedicated prompt module in `packages/core/src/ai/prompts/coScout/`. Reference documents for mode-specific journeys:

| Mode                          | Journey doc                          |
| ----------------------------- | ------------------------------------ |
| Continuous measurement (base) | `docs/USER-JOURNEYS.md`              |
| Capability (Cp/Cpk)           | `docs/USER-JOURNEYS-CAPABILITY.md`   |
| Performance (multi-channel)   | `docs/USER-JOURNEYS-PERFORMANCE.md`  |
| Defect (events-to-rates)      | `docs/USER-JOURNEYS-DEFECT.md`       |
| Process-flow / bottleneck     | `docs/USER-JOURNEYS-PROCESS-FLOW.md` |

The five mode-specific journeys were updated for the wedge pivot (2026-05-16). Each inherits from the base `USER-JOURNEYS.md` and extends with mode-specific chart suite, CoScout coaching, and Specialist workflow.

> Yamazumi mode was removed in wedge V1 via PR-LV1-0 (2026-05-28). The companion journey doc is archived at [`docs/archive/use-cases/2026-05-28-USER-JOURNEYS-YAMAZUMI.md`](../archive/use-cases/2026-05-28-USER-JOURNEYS-YAMAZUMI.md). See [ADR-034](../07-decisions/adr-034-yamazumi-analysis-mode.md) (superseded).

---

## Related Artifacts

- [ADR-060: CoScout Intelligence Architecture](../07-decisions/adr-060-coscout-intelligence-architecture.md) — five-pillar knowledge architecture, detail
- [ADR-068: CoScout Cognitive Redesign](../07-decisions/adr-068-coscout-cognitive-redesign.md) — modular prompts, superseded phase-adaptive assembly
- [ADR-069: Three-Boundary Numeric Safety](../07-decisions/adr-069-three-boundary-numeric-safety.md) — B1/B2/B3 safety architecture, safeMath.ts
- [ADR-071: CoScout Voice Input](../07-decisions/adr-071-coscout-voice-input.md) — transcription-first, Azure-only, scope
- [ADR-057: CoScout Visual Grounding](../07-decisions/adr-057-coscout-visual-grounding.md) — REF markers, customer data boundary
- `.claude/invariants/coscout-prompts.md` — prompt engineering non-negotiables (canonical; link from here, don't restate)
- `packages/core/CLAUDE.md` — implementation detail: tier model, mode coaching modules, context builder

---

## Amendments

_(Empty at V1 — 2026-05-16. Future amendments append here with date + source.)_
