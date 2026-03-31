---
title: 'VQI Re-Evaluation: Post-ADR-053 Scoring + Activation Improvements'
audience: [analyst, engineer]
category: reference
status: active
related: [evaluation, ai-experience, question-driven-eda, coscout, prompt-engineering]
---

# VQI Re-Evaluation: Post-ADR-053 Scoring + Activation Improvements

## Context

The original VQI evaluation (March 30) scored VariScout at **3.88/5.0 (77.6%, B+)**. However, ADR-053 (Question-Driven Investigation) landed the same day and wasn't fully accounted for in the scoring. The question-driven EDA model fundamentally changes the Anticipatory Intelligence dimension — Factor Intelligence generates proactive questions, auto-rules-out low-evidence factors, and the question checklist serves as an exploration coverage map.

This re-evaluation corrects the scores with accurate codebase evidence, identifies what genuinely remains as gaps, and proposes 6 improvements that activate existing capabilities without new infrastructure.

---

## Part 1: Revised Scores — All 16 Dimensions

### Tier A: Foundations (30% weight)

| Dim | Dimension                 | Original | Revised | Δ    | Evidence                                                                                                                                                                                                                                                                  |
| --- | ------------------------- | -------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Functional Completeness   | 4.5      | **4.5** | —    | Full Paste-to-Report journey in all 4 modes. No dead ends.                                                                                                                                                                                                                |
| A2  | Design System Consistency | 4.7      | **4.7** | —    | 95%+ semantic token coverage.                                                                                                                                                                                                                                             |
| A3  | Accessibility             | 3.5      | **4.0** | +0.5 | VQI missed: `accessibility.ts` has ARIA helpers for all chart types. `aria-live="polite"` on CoScout. **`prefers-reduced-motion` already exists** in `components.css:411-420` (global override covering animations, transitions, scroll). **Remaining:** skip links only. |
| A4  | Error Resilience          | 3.8      | **3.8** | —    | ErrorBoundary coverage good (6 chart components). **Still missing:** LSL>USL cross-field validation at entry.                                                                                                                                                             |
| A5  | Performance & Mobile      | 4.5      | **4.5** | —    | Web Worker stats, LTTB decimation, 640px breakpoint consistent. Bundle 254KB gz.                                                                                                                                                                                          |

### Tier B: Experience Differentiators (30% weight)

| Dim | Dimension                 | Original | Revised | Δ    | Evidence                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------- | -------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Progressive Disclosure    | 4.7      | **4.8** | +0.1 | Question checklist adds another progressive layer: auto-generated questions → manual exploration → findings as answers → problem statement as conclusion. The question lifecycle (open → answered → follow-up spawned) is itself progressive disclosure of investigation depth.                                                       |
| B2  | Cross-Feature Integration | 4.0      | **4.2** | +0.2 | `findingId` parameter in `suggest_action` tool (`coScout.ts:343`). Question→finding auto-link via `questionId` (ADR-053). Hypothesis→idea→action chain with bidirectional references. **Remaining gap:** No referential integrity validation across entity chain.                                                                     |
| B3  | State Architecture        | 4.5      | **4.5** | —    | Clean ownership: DataContext (pipeline) + 5 Zustand stores (feature domains).                                                                                                                                                                                                                                                         |
| B4  | Methodology Embodiment    | 4.0      | **4.3** | +0.3 | ADR-053 = Turtiainen's EDA mental model encoded in software. Entry scenario routing (problem/hypothesis/routine) with methodology-specific CoScout coaching. Phase-gated tool availability. Strategy pattern encodes mode-specific methodology. **Remaining gap:** No anti-pattern detection (skipping SCOUT, premature conclusions). |

### Tier C: AI-Era Breakthrough Dimensions (40% weight)

| Dim | Dimension                  | Original | Revised | Δ        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------- | -------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Deterministic-AI Boundary  | 4.5      | **4.5** | —        | Strongest dimension. All stats deterministic. AI proposes, analyst disposes.                                                                                                                                                                                                                                                                                                                                |
| C2  | Anticipatory Intelligence  | 3.0      | **4.0** | **+1.0** | See detailed analysis below.                                                                                                                                                                                                                                                                                                                                                                                |
| C3  | Collaborative Memory       | 2.5      | **2.8** | +0.3     | KB search wired (`useKnowledgeSearch` dual-path), `suggest_knowledge_search` tool in CoScout, finding metadata rich enough for pattern matching. **Major gaps remain** — see detailed analysis below.                                                                                                                                                                                                       |
| C4  | Autonomy Spectrum          | 4.0      | **4.0** | —        | 3-tier model solid. No per-tool customization (all-or-nothing phase gating).                                                                                                                                                                                                                                                                                                                                |
| C5  | Cognitive Load Calibration | 3.5      | **3.8** | +0.3     | VQI said "suggested questions not phase-adaptive" — **incorrect**. `suggestedQuestions.ts` has: phase-specific questions (5 phases), hypothesis-aware questions (supported → ideation, untested → validation), uncovered category detection ("Have you considered Equipment factors?"), verification-grounded questions (Cpk improved/regressed). **Remaining gap:** No methodology step-skipping warnings. |
| C6  | Integration Invisibility   | 4.0      | **4.0** | —        | Exemplary degradation. PWA fully offline. AI failure → deterministic mode.                                                                                                                                                                                                                                                                                                                                  |

---

## Part 2: C2 Detailed Analysis — Why +1.0

The original VQI critique: _"AI is reactive only. Doesn't track what analyst hasn't explored. No blind-spot detection."_

This was inaccurate. The question-driven EDA model (ADR-053) provides:

| Capability                                          | Anticipatory Quality                                     | How It Works                                                                         |
| --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Factor Intelligence auto-generates ranked questions | System anticipates what to explore before analyst asks   | `bestSubsets.ts` → `generateQuestionsFromRanking()` → questions ranked by R²adj      |
| Auto-ruled-out (R²adj < 5%)                         | Blind-spot elimination without analyst effort            | Factors automatically marked as "ruled out" — negative learnings captured            |
| Layer 2-3 iterative deepening                       | System anticipates next exploration step                 | Answered L1 questions spawn L2 main effects → L3 interactions                        |
| Question checklist = coverage map                   | Open/answered/ruled-out states show exploration coverage | Each question has a status — the checklist IS the coverage tracker                   |
| Uncovered category detection                        | "Have you considered Equipment factors?"                 | `suggestedQuestions.ts:199-212` — detects investigation categories without questions |
| Phase-adaptive coaching                             | Different guidance per investigation stage               | 5 phase states with specific CoScout instructions                                    |
| Entry scenario routing                              | Different AI posture per entry type                      | problem/hypothesis/routine with per-phase guidance                                   |
| CoScout receives full question tree                 | AI knows what's been checked and what hasn't             | `buildAIContext.ts:311` passes `allHypotheses` with statuses, causeRoles, sources    |

**Remaining C2 gaps (0.5 points to 4.5):**

1. **ADR-054 mode-awareness** — Only Standard mode questions work. Capability/Yamazumi/Performance questions designed but not implemented.
2. **No aggregate coverage metric** — Individual R²adj values exist per question, but no summary "X% of variation explained by answered questions."
3. **Suggested questions don't directly reference Factor Intelligence checklist** — Phase-aware and hypothesis-aware, but don't say "you have 3 open FI questions."

---

## Part 3: C3 Detailed Analysis — Why Only +0.3

The original critique: _"Foundations exist, activation needed."_ This is still largely accurate.

**What exists:**

- Per-project finding persistence (IndexedDB + OneDrive Team sync)
- `useKnowledgeSearch` hook with dual-path search (findings + documents via Foundry IQ)
- `suggest_knowledge_search` tool in CoScout — searches team KB on demand
- Rich finding metadata (factor, etaSquared, cpkBefore/After, suspectedCause, actions, outcomes)
- PDCA coaching already tells CoScout to search KB in IMPROVE/PLAN phase

**What's genuinely missing (1.7 points to 4.5):**

1. **No cross-project finding search (Standard tier)** — IndexedDB stores are per-project
2. **No proactive historical surfacing** — CoScout only searches KB when asked or in IMPROVE phase
3. **No pattern matching across findings** — can't find "similar" investigations by factor/Cpk/evidence
4. **Findings → Foundry IQ indexing pipeline** — unclear if findings are actually searchable via KB search

**Architectural constraint:** Cross-project memory requires infrastructure decisions (IndexedDB cross-store queries, Foundry IQ indexing). Deferred to avoid premature architectural complexity. The Microsoft-native storage path (OneDrive → SharePoint → Foundry IQ) is the right long-term approach, but needs design work.

---

## Part 4: CoScout System Prompt Audit

The CoScout system prompt is dynamically assembled from ~15 conditional sections. Estimated token range: **700-2,500 tokens** depending on state (investigation phase, analysis mode, team features). This is reasonable for a domain AI assistant.

### Redundancy Found

| #   | Issue                                   | Location                                                                                                                      | Impact                                                                                     |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **Phase guidance written twice**        | `phaseInstructions` (L732-755) + `buildEntryScenarioGuidance()` (L1298-1318)                                                  | Entry scenario repeats per-phase advice already in phase instructions. ~150 tokens wasted. |
| 2   | **PDCA coaching specified three times** | `phaseInstructions.improving` (L742-754) + detailed PDCA in tool routing (L1225-1291) + staged comparison override (L789-798) | Brief version and detailed version both in prompt simultaneously. ~100 tokens wasted.      |
| 3   | **Improvement ideas duplicated**        | PDCA PLAN section (L1231) + standalone "Improvement idea guidance" (L1257-1271)                                               | Two instruction sets for the same tool. ~80 tokens wasted.                                 |
| 4   | **Issue statement sharpening verbose**  | L1279-1283                                                                                                                    | 5 lines for a 2-line concept. ~30 tokens.                                                  |

### Potential Confusion

| #   | Issue                                                                                                               | Risk                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 5   | **"Proactively suggest create_finding" (L1211) vs "Do NOT proactively suggest findings" (L1314, routine scenario)** | Model sees both instructions. Not a true contradiction (different scenarios), but the routine override should be more prominent. |
| 6   | **Tool routing section is ~500 tokens** covering 10 topics                                                          | Cognitive load on the model — may lose track of lower-priority instructions.                                                     |

### Recommendation

Consolidate into single-authority sections: one PDCA coaching block, merge entry scenario into phase instructions, deduplicate improvement idea guidance. **Estimated savings: ~360 tokens (~15% of max prompt)**. More importantly: reduces instruction conflicts and improves prompt effectiveness.

---

## Part 5: Revised VQI Score

### Calculation

| Tier            | Weight | Dimensions | Original Avg | Revised Avg |
| --------------- | ------ | ---------- | ------------ | ----------- |
| A (Foundations) | 30%    | A1-A5      | 4.20         | 4.30        |
| B (Experience)  | 30%    | B1-B4      | 4.30         | 4.45        |
| C (AI-Era)      | 40%    | C1-C6      | 3.58         | 3.85        |

**Original weighted: 3.88/5.0 (77.6%)**
**Revised weighted: 4.17/5.0 (83.3%) — solid B+, approaching A-**

The primary driver is C2 (+1.0) from the question-driven EDA model, with smaller gains from corrected accessibility (A3), methodology embodiment (B4), and cognitive load calibration (C5) scores.

---

## Part 6: Actionable Improvements

Six improvements that activate existing capabilities without new infrastructure. Ordered by impact-to-effort ratio.

### 1. CoScout Prompt Consolidation (~1 day)

**What:** Merge duplicated prompt sections — single-authority PDCA coaching, deduplicate improvement idea guidance, merge entry scenario into phase instructions.

**Why:** ~360 token savings + elimination of potential instruction conflicts. Improves prompt effectiveness, not just size.

**Files:** `packages/core/src/ai/prompts/coScout.ts` — `buildToolRoutingInstructions()`, `buildEntryScenarioGuidance()`, `phaseInstructions` object.

**Approach:** Keep the detailed versions, remove the brief duplicates. Merge entry scenario per-phase advice into the existing `phaseInstructions` object using scenario as a modifier, not a parallel instruction set.

**Moves:** Prompt quality (enables better C2/C4/C5 scores through clearer instructions).

### 2. Minimal Nudge: Reference Ruled-Out Questions (~1 hour)

**What:** Add ONE instruction to CoScout system prompt: _"When the user asks about a factor that appears in the question tree as ruled-out, reference its evidence (R²adj or η²) so the analyst can cite it to stakeholders."_

**Why:** The question tree data is already in CoScout's context. A capable model may already do this naturally, but a minimal nudge ensures consistency. Research (ProAgentBench, 2026) shows context-triggered responses are better received than proactive interruptions.

**File:** `packages/core/src/ai/prompts/coScout.ts` — add to investigation context section.

**Moves:** C2 +0.1, C3 +0.1 (within-project memory activation).

### 3. ADR-054 Mode-Aware Questions (~5 days)

**What:** Implement the already-designed mode-specific question generators:

- Capability: bestSubsetsWithSpecs adapter (reword variation → Cpk)
- Yamazumi: wasteComposition generator (new `yamazumi/questions.ts`)
- Performance: channelRanking adapter

**Why:** Already designed and accepted. No competitor generates mode-specific investigation questions. Pure implementation work.

**Files:** See ADR-054 implementation status section for complete file list.

**Moves:** C2 +0.2, B4 +0.1.

### 4. Aggregate Coverage Metric (~1 day)

**What:** Show "X of Y questions checked, explaining Z% variation" as a progress summary on the question checklist.

**Why:** The coverage data exists (R²adj per question, question states) but isn't surfaced as a summary. This makes the implicit exploration coverage explicit.

**Implementation:** Sum R²adj of answered/auto-answered questions vs total R²adj available. Display as text or mini progress indicator in `QuestionChecklist.tsx` header.

**File:** `packages/ui/src/components/FindingsWindow/QuestionChecklist.tsx`

**Moves:** C2 +0.1, C5 +0.1.

### 5. LSL > USL Validation (~0.5 day)

**What:** Cross-field validation in SpecsSection — warn when LSL ≥ USL.

**Why:** Currently silently accepts invalid spec limits, leading to meaningless capability calculations.

**File:** `packages/ui/src/components/ColumnMapping/SpecsSection.tsx`

**Moves:** A4 +0.2.

### 6. ~~`prefers-reduced-motion`~~ — Already Implemented

**Finding:** Global `prefers-reduced-motion` override already exists in `packages/ui/src/styles/components.css:411-420`. Covers all animations, transitions, and scroll behavior with `!important` on universal selector. Both apps import this CSS. The VQI evaluation was incorrect about this gap.

**No work needed.** A3 score revised upward to 4.0.

### Projected Impact

All 6 improvements would lift VQI from **4.15 → ~4.4/5.0 (88%)**, firmly in A- territory.

---

## Part 7: Level 4→5 Vision (Pragmatic + Aspirational)

### Level 4: Institutional Memory (6-12 months)

The path to Level 4 requires cross-project knowledge compounding. The architectural approach respects the no-backend constraint:

| Tier     | Mechanism                                               | Status                                                                                                                               |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Standard | IndexedDB cross-project finding index                   | Not started. Needs design: separate index store vs query across per-project stores.                                                  |
| Team     | OneDrive sync → SharePoint → Foundry IQ semantic search | Infrastructure exists (cloudSync.ts + searchService.ts). Needs: explicit findings indexing pipeline, proactive surfacing in CoScout. |

**Key design questions (deferred):**

- How to search across IndexedDB stores without loading all project data?
- How to ensure findings are indexed in Foundry IQ (not just document files)?
- When should CoScout proactively surface historical patterns vs wait for the analyst to ask?
- What makes two findings "similar" for pattern matching? (Factor? Cpk range? Evidence type?)

### Level 5: Self-Improving Quality Intelligence (12+ months)

- AI learns which investigation approaches produce results (methodology evolution)
- Predictive degradation alerts from finding pattern corpus
- Org-wide improvement idea ranking from outcome data
- All powered by customer's Microsoft tenant — VariScout adds intelligence layer only

**The moat remains architectural:** Competitors would need both the investigation model AND the Microsoft-native storage architecture to replicate institutional memory. The customer's own Teams/SharePoint becomes the knowledge graph.

---

## Part 8: What Changed — Summary

| Area                                                         | March 30 Assessment        | March 31 Reality                                                                                                                                                                                         |
| ------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C2: "AI is reactive only"                                    | Correct at time of writing | **Incorrect.** Question model is proactive: generates ranked questions, auto-rules-out, spawns follow-ups, detects uncovered categories.                                                                 |
| C5: "Suggested questions not phase-adaptive"                 | Correct at time of writing | **Incorrect.** `suggestedQuestions.ts` has 5-phase question sets, hypothesis-aware logic, uncovered category detection, verification-grounded questions.                                                 |
| A3: "No screen reader for charts, no prefers-reduced-motion" | Correct at time of writing | **Largely incorrect.** `accessibility.ts` has ARIA helpers for all chart types. `aria-live="polite"` on CoScout. `prefers-reduced-motion` global override in `components.css`. Only missing: skip links. |
| B2: "AI action proposals lack finding provenance"            | Correct at time of writing | **Fixed.** `findingId` parameter in `suggest_action` tool. Question→finding auto-link via `questionId`.                                                                                                  |
| B4: "No anti-pattern detection"                              | Correct                    | **Still correct.** No SCOUT-skipping or premature-conclusion warnings.                                                                                                                                   |
| Prompt size                                                  | Not assessed               | **1,500-2,500 tokens (reasonable).** But ~360 tokens of redundancy found across 4 duplicated sections.                                                                                                   |

---

## References

- [Original VQI Evaluation (March 30)](2026-03-30-holistic-evaluation-vqi.md)
- [ADR-053: Question-Driven Investigation](../../07-decisions/adr-053-question-driven-investigation.md)
- [ADR-054: Mode-Aware Question Strategy](../../07-decisions/adr-054-mode-aware-question-strategy.md)
- [ProAgentBench: Evaluating LLM Agents for Proactive Assistance](https://arxiv.org/html/2602.04482v1) — timing of AI interruptions research
- [Question-Driven EDA Design Spec](2026-03-30-question-driven-eda-design.md)

Sources:

- [ProAgentBench: Evaluating LLM Agents for Proactive Assistance](https://arxiv.org/html/2602.04482v1)
- [Experience the Future of Analytics: Minitab AI-Powered Solutions](https://blog.minitab.com/en/blog/the-future-of-analytics-introducing-new-ai-powered-solutions)
- [AI in UX Research: Enterprise Gains, Risks & Governance in 2026](https://www.hurix.com/blogs/ai-augmented-ux-research-what-enterprises-gain-and-risk-in-2026/)
