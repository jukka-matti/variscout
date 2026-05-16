---
title: 'CoScout AX Design (canonical)'
purpose: design
tier: living
audience: [human, agent]
topic: [ax, coscout, design]
status: active
related: [adr-060, adr-068, adr-069, coscout-prompts-invariant]
last-verified: 2026-05-16
---

# CoScout AX Design (canonical)

## Purpose

Single canonical AX-design surface for CoScout — gathers persona, voice, tier-gated behaviors, knowledge architecture, safety boundaries, prompt engineering rules, and eval discipline that were previously scattered across ADRs 060/068/069 and invariant rules. Future CoScout design changes amend this doc; constituent ADRs and the prompt invariant remain the decision provenance and engineering detail.

---

## Persona + Voice

**What CoScout IS:**

- An investigation partner with process-improvement domain expertise
- A coach that asks targeted questions and proposes actions grounded in visible data
- A context carrier: surfaces relevant knowledge (investigation artifacts, external docs) when it is likely to unblock the analyst
- A methodology ally: aware of the three-level model (System / Process Flow / Local Mechanism), the 5 analytical modes, and the 3 canvas response paths

**What CoScout IS NOT:**

- An oracle: it does not invent conclusions; the deterministic stats engine is the source of truth for numbers
- A gatekeeper: it provides guidance, not checkpoints; analysts proceed at their own judgment
- A verbose summarizer: responses are concise, grounded in context, actionable
- A generic chatbot: every response is tied to the investigation state, the active chart, or the current question

**Voice principle:** Minimal nudges over proactive interruptions (per `feedback_ai_proactivity`). CoScout speaks when it has grounded, useful context — not because it can.

**Language invariant:** Never "root cause" — use "contribution," "suspected cause," or "mechanism" (P5 amended; ESLint enforced per `.claude/INVARIANTS.md`).

---

## Tier-Gated Behaviors

CoScout behaviors differ between the PWA (free tier) and Azure (paid tier). The gate is `isPaidTier()` from `@variscout/core/tier`.

| Behavior                           | PWA (free)               | Azure (paid)                              |
| ---------------------------------- | ------------------------ | ----------------------------------------- |
| CoScout panel visible              | Yes (read-only coaching) | Yes (full interaction)                    |
| AI tool calls                      | No                       | Yes (27-tool registry, phase-gated)       |
| Voice input                        | No                       | Yes (transcription-first, ADR-071)        |
| Investigation retrieval (Pillar 2) | No                       | Yes (JSONL → Foundry IQ)                  |
| External KB (Pillar 3)             | No                       | Yes (SOPs, FMEAs, specs)                  |
| `answer_question` action tool      | No                       | Yes (INVESTIGATE+ phase)                  |
| Hub connection proposals           | No                       | Yes (Converging phase only)               |
| Prompt caching                     | N/A                      | Yes (10x token savings, tier 1 invariant) |

The tier gate is **inside each surface** (signoff, audit, alerts, action proposals) — not at surface-entry CTAs. Document authoring and structured workflow surfaces serve free-tier pedagogy; `.vrs` export is always available (per `feedback_tier_gate_inside_surface`).

**Implementation reference:** `packages/core/src/tier/` + `apps/azure/CLAUDE.md`.

---

## Knowledge Architecture

Five pillars per [ADR-060](../07-decisions/adr-060-coscout-intelligence-architecture.md). Compact summary below; engineering detail in ADR-060.

| Pillar                                 | What                                                                                                                                                    | Status                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **1 — Hot Context Quality**            | `buildAIContext()` enriched with problem statement, top-5 findings with outcomes, overdue actions, focused question context, question answer visibility | Delivered (Phases 1–2)          |
| **2 — Investigation Retrieval**        | Investigation artifacts serialized to Blob Storage as JSONL; Foundry IQ auto-indexes for on-demand retrieval via `search_knowledge_base` tool           | Pending (Azure infra Phase 3–5) |
| **3 — External Document KB**           | SOPs, specs, FMEAs uploaded to Blob Storage; hybrid BM25 + vector + RRF search with semantic reranking; project-level security filtering                | Pending (Azure infra Phase 3–5) |
| **4 — Question ↔ CoScout Interaction** | `answer_question` action tool (phase-gated INVESTIGATE+); question answer documents in knowledge index; hub-aware proposal cards                        | Delivered                       |
| **5 — Mode-Aware Question Completion** | Yamazumi + performance question generators wired; mode-aware evidence sorting; `evidenceLabel`/`validationMethod`/`questionFocus` per mode              | Delivered                       |

**Search backend:** Azure AI Search + Foundry IQ agentic retrieval. `KnowledgeAdapter` interface abstracts backend with fallback chain: `FoundryIQKnowledgeAdapter` → `AISearchKnowledgeAdapter` → `BlobKnowledgeAdapter`.

**Mode/level orthogonality (ADR-068 amendment 2026-05-03):** Modes answer "which analytical lens?" (capability / yamazumi / defect / performance / process-flow). Levels answer "which slice of the process?" (System / Process Flow / Local Mechanism) — inferred from Canvas zoom state, not a separate picker. The two are orthogonal: any mode at any level. Level-aware overlays read Canvas zoom via `coScout/context/` pipeline; no new user gesture required.

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

- Entry point is `assembleCoScoutPrompt()` — `buildCoScoutSystemPrompt()` in `legacy.ts` is deprecated (test backward-compat only)
- Every tool in `tools/registry.ts` declares `phases` + optional `tier: 'team'`; ungated tools leak across phases/tiers
- Tier 1 is session-invariant — content that moves between tier 1 and tier 3 breaks prompt-cache hit rate (10x token cost)
- Never "root cause" language (ESLint-enforced across prompts and CoScout code)

Full rules: [`.claude/invariants/coscout-prompts.md`](../../.claude/invariants/coscout-prompts.md)

---

## Tool-Calling

**Registry:** `packages/core/src/ai/tools/registry.ts` — 27 tools (V1 target), each gated by `phases: PhaseEnum[]` + optional `tier: 'team'`.

**Phase gates:** Tools declare which investigation phases they're available in (FRAME, SCOUT, INVESTIGATE, Converging, etc.). Ungated tools appear in all phases — a correctness and UX concern, not just a permission issue.

**Tier gate:** Tools marked `tier: 'team'` are stripped from prompts by `assembleCoScoutPrompt()` when `isPaidTier()` is false.

**Implementation detail:** `packages/core/src/ai/tools/` — see `packages/core/CLAUDE.md` for specifics.

---

## Voice Input

Azure-only, transcription-first (ADR-071). CoScout receives a text transcript of the analyst's voice input; it does not receive audio. Voice scope: CoScout draft input, finding editor, finding comments. Voice does not bypass investigation structure — all outputs route through the same investigation model as keyboard input.

---

## Eval Discipline

**Current state:** No automated CoScout eval suite exists at the time of writing (2026-05-16). The promptTierSafety regression test (`packages/core/src/ai/__tests__/promptTierSafety.test.ts`) is the only mechanized quality gate.

**Follow-up:** A `run-coscout-eval` skill is planned (Play 3 skills inventory). Until shipped, CoScout quality is assessed manually via representative investigation walkthroughs with a Six Sigma practitioner (Watson testing sessions — see `docs/agent-context/onboarding-quick-start.md`).

**Open gap:** Log in `docs/investigations.md` — "CoScout eval suite: design and schedule automated regression tests for prompt quality, tier enforcement, phase gating, REF marker correctness."

---

## Mode-Aware Methodology Coaching

CoScout adapts its coaching per analytical mode. Each mode has a dedicated prompt module in `packages/core/src/ai/prompts/coScout/`. Reference documents for mode-specific journeys:

| Mode                          | Journey doc                          |
| ----------------------------- | ------------------------------------ |
| Continuous measurement (base) | `docs/USER-JOURNEYS.md`              |
| Capability (Cp/Cpk)           | `docs/USER-JOURNEYS-CAPABILITY.md`   |
| Yamazumi (Lean cycle-time)    | `docs/USER-JOURNEYS-YAMAZUMI.md`     |
| Performance (multi-channel)   | `docs/USER-JOURNEYS-PERFORMANCE.md`  |
| Defect (events-to-rates)      | `docs/USER-JOURNEYS-DEFECT.md`       |
| Process-flow / bottleneck     | `docs/USER-JOURNEYS-PROCESS-FLOW.md` |

All six journeys were updated for the wedge pivot (2026-05-16). Each inherits from the base `USER-JOURNEYS.md` and extends with mode-specific chart suite, CoScout coaching, and Specialist workflow.

---

## Related Artifacts

- [ADR-060: CoScout Intelligence Architecture](../07-decisions/adr-060-coscout-intelligence-architecture.md) — five-pillar knowledge architecture, detail
- [ADR-068: CoScout Cognitive Redesign](../07-decisions/adr-068-coscout-cognitive-redesign.md) — modular prompts, tier model, phase-adaptive assembly, mode/level orthogonality
- [ADR-069: Three-Boundary Numeric Safety](../07-decisions/adr-069-three-boundary-numeric-safety.md) — B1/B2/B3 safety architecture, safeMath.ts
- [ADR-071: CoScout Voice Input](../07-decisions/adr-071-coscout-voice-input.md) — transcription-first, Azure-only, scope
- [ADR-057: CoScout Visual Grounding](../07-decisions/adr-057-coscout-visual-grounding.md) — REF markers, customer data boundary
- `.claude/invariants/coscout-prompts.md` — prompt engineering non-negotiables (canonical; link from here, don't restate)
- `packages/core/CLAUDE.md` — implementation detail: tier model, mode coaching modules, context builder

---

## Amendments

_(Empty at V1 — 2026-05-16. Future amendments append here with date + source.)_
