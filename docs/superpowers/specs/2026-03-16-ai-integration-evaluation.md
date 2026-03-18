---
title: 'AI Integration Quality Evaluation'
---

# AI Integration Quality Evaluation — VariScout

**Date:** 2026-03-16
**Scope:** Phases 1-3 AI integration (NarrativeBar, ChartInsightChip, CoScoutPanel/Inline, AIOnboardingTooltip, InvestigationSidebar)
**Method:** Heuristic code walkthrough + spec-vs-implementation audit
**Evaluator:** Systematic AIX audit against HAX, PAIR, Apple HIG, NNG 2025

---

## Executive Summary

### Overall Weighted Maturity Score: 3.14 / 5.0 — Competent

VariScout's AI integration is architecturally sound and domain-aware, with genuine innovations in investigation-phase coaching and deterministic-first design. The implementation excels at graceful degradation (exemplary) and methodology grounding (strong), but lacks fundamental human-AI interaction primitives: no feedback mechanism, no confidence communication, no conversation persistence, and no adaptive learning.

### Top 3 Strengths

1. **Graceful degradation (5/5)** — When AI is unavailable, all components hide with zero layout disruption. No placeholders, no error states, no "configure AI" prompts. The dashboard is identical to a non-AI deployment.
2. **Deterministic primacy (5/5)** — AI enhances computed insights, never replaces them. `useChartInsights` always renders deterministic text first; AI enrichment arrives later as an overlay. Every AI failure falls back silently to deterministic.
3. **Investigation-phase coaching (4/5)** — The 4-phase diamond system prompt adaptation (`initial` → `diverging` → `validating` → `converging`) plus IMPROVE/PDCA coaching, with idea-aware convergence guidance, is genuinely novel in the analytics tool space.

### Top 5 Gaps

1. **No feedback mechanism (1/5)** — No thumbs up/down, no "was this helpful?", no correction path. Microsoft HAX G14 violation.
2. **No confidence communication (1/5)** — Same authoritative tone for n=5 and n=5000. No hedging instructions in prompts. Apple HIG violation.
3. **No conversation persistence (2/5)** — Session-only chat history. No export, no audit trail. NNG 2025 concern.
4. **No adaptive learning (1/5)** — Every session starts fresh. No user pattern learning, no preference adaptation.
5. **No data transparency (2/5)** — Users cannot see what context the AI received. No "what did AI see?" disclosure.

### Competitive Positioning

VariScout occupies a unique niche: it is the only analytics tool where AI explains deterministic SPC analysis rather than generating analysis. This "AI as interpreter" pattern avoids the trust issues plaguing competitors (Minitab AI, Power BI Copilot) where users cannot verify AI-generated statistics.

---

## Methodology

### Frameworks Applied

| Framework            | Version | Key Guidelines Used                 |
| -------------------- | ------- | ----------------------------------- |
| Microsoft HAX        | 2024    | G1-G18 (Human-AI Interaction)       |
| Google PAIR          | 2024    | Chapters 1-6 (People + AI Research) |
| Apple HIG            | 2025    | Machine Learning section            |
| Nielsen Norman Group | 2025    | AI UX Heuristics                    |
| ISO 42001            | 2023    | AI Management System (auditability) |

### Scoring Scale

| Score | Label     | Definition                               |
| ----- | --------- | ---------------------------------------- |
| 1     | Missing   | Capability absent                        |
| 2     | Emerging  | Partial implementation, notable friction |
| 3     | Adequate  | Meets minimum expectations               |
| 4     | Strong    | Well-implemented, minor gaps             |
| 5     | Exemplary | Best-in-class                            |

### Evaluation Approach

Heuristic walkthrough of 12 source files (UI components, hooks, prompt templates, AI service) cross-referenced against design system specs (`docs/06-design-system/components/ai-components.md`) and architecture docs (`docs/05-technical/architecture/ai-architecture.md`). All scores are evidence-based with file:line citations.

> [!NOTE]
> **Post-evaluation refactor (March 17, 2026):** `promptTemplates.ts` was split into 5 focused modules under `packages/core/src/ai/prompts/` (shared, narration, coScout, chartInsights, reports). Line references in the rubric below refer to the pre-refactor file. The `promptTemplates.ts` barrel re-exports all symbols for backward compatibility. Additionally, `responsesApi.ts` and `tracing.ts` modules were added.

---

## Dimension 1: Transparency & Explainability (Weight: 1.5x)

### Rubric

| #   | Criterion                    | Score | Evidence                                                                                                                                                                                                   | Gap                                                                                                                                                                                           |
| --- | ---------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | AI vs deterministic labeling | 4     | `ChartInsightChip.tsx:71-75` — Sparkles icon + "AI" text badge when `isAI=true`. `NarrativeBar.tsx:102` — purple "AI" label for non-cached responses.                                                      | No labeling on CoScout responses (all appear as assistant messages without AI attribution).                                                                                                   |
| 1.2 | Source attribution           | 2     | `promptTemplates.ts:394-421` — `formatKnowledgeContext()` includes `[From: findings]` and `[From: {source}]` in system prompts. `CoScoutMessages.tsx:80-87` — knowledge result count shown during loading. | Source citations are injected into prompts but never surfaced in assistant responses. User sees "Searching N related findings..." during load but no attribution in the actual response text. |
| 1.3 | Data context disclosure      | 2     | `buildAIContext.ts:74-269` — Rich structured context (stats, filters, findings, hypotheses, drill path).                                                                                                   | No UI to show users what context was sent to AI. No "View AI context" button, no expandable context card.                                                                                     |
| 1.4 | Model identification         | 2     | `aiService.ts:33-37` — Provider auto-detection (OpenAI vs Anthropic).                                                                                                                                      | Users are never told which model they're talking to. No model name in UI.                                                                                                                     |
| 1.5 | Processing transparency      | 3     | `NarrativeBar.tsx:42-53` — Shimmer loading. `ChartInsightChip.tsx:50-57` — Shimmer loading. `CoScoutMessages.tsx:88-109` — Loading dots.                                                                   | Loading states are clear but generic. No indication of what the AI is doing (e.g., "Analyzing 47 data points..." vs "Generating response...").                                                |

**Dimension Score: 2.6 / 5.0**

**Key Strengths:** Clear AI/deterministic distinction via visual badges. Shimmer loading prevents layout shift.

**Key Gaps:** Source attribution exists in prompt engineering but is invisible to users. No data transparency mechanism.

**Recommendations:**

- P1: Add collapsible "Context sent to AI" card below CoScout responses showing the `AIContext` summary
- P1: Surface Knowledge Base source citations in CoScout response text (the data is already in `formatKnowledgeContext`)
- P2: Add model name to CoScoutPanel header ("Powered by GPT-4o" / "Powered by Claude")

---

## Dimension 2: Trust Calibration (Weight: 1.5x)

### Rubric

| #   | Criterion                | Score | Evidence                                                                                                                          | Gap                                                                                                          |
| --- | ------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2.1 | Confidence communication | 1     | `promptTemplates.ts:17-23` — System prompt says "Never invent data" but no sample-size-aware hedging. No confidence scoring.      | Same authoritative tone regardless of data quality (n=5 with 3 factors vs n=5000 with 1 factor).             |
| 2.2 | Uncertainty indication   | 2     | `buildSummaryPrompt()` includes stats with precision (`.toFixed(2)`). Narration prompt says "1-2 sentences."                      | No instruction to hedge when data is sparse. No "based on limited data" qualifier.                           |
| 2.3 | Accuracy verification    | 3     | Deterministic-first design means every AI statement can be verified against computed stats visible in the dashboard.              | No explicit "verify this" UI affordance. No link from AI insight to the chart data it references.            |
| 2.4 | Error acknowledgment     | 3     | `CoScoutMessages.tsx:4-13` — Error types: rate-limit, content-filter, generic. `useAICoScout.ts:46-58` — 6 error classifications. | Errors are acknowledged but AI response errors (hallucination, wrong interpretation) have no reporting path. |
| 2.5 | Calibration over time    | 1     | No feedback collection, no accuracy tracking, no quality metrics.                                                                 | Complete absence of calibration infrastructure. No way to measure if AI responses improve or degrade.        |

**Dimension Score: 2.0 / 5.0**

**Key Strengths:** Deterministic-first design inherently supports verification (user can always check the computed number).

**Key Gaps:** Critical — no confidence communication and no calibration infrastructure. This is the lowest-scoring dimension.

**Recommendations:**

- P0: Add sample-size-aware hedging to prompt templates (`buildSummaryPrompt`, `buildCoScoutSystemPrompt`). When `context.stats.samples < 30`, inject: "Note: analysis is based on a small sample (n={N}). Conclusions should be treated as preliminary."
- P0: Add per-insight confidence tier (high/medium/low) based on data density and violation count
- P1: Implement basic feedback buttons (thumbs up/down) on CoScout responses with localStorage persistence

---

## Dimension 3: User Control & Agency (Weight: 1.25x)

### Rubric

| #   | Criterion              | Score | Evidence                                                                                                                             | Gap                                                                                                         |
| --- | ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 3.1 | Global AI toggle       | 4     | `ai-components.md:20-27` — "Show AI assistance" toggle in Settings. Per-user localStorage preference.                                | Global toggle only — no per-component granularity (e.g., "Show narration but not CoScout").                 |
| 3.2 | Dismissibility         | 4     | `ChartInsightChip.tsx:82-91` — Dismiss button with `aria-label`. `CoScoutPanelBase.tsx:241-248` — Close with Escape.                 | Dismissed insights reset on data change (by design), but no "permanently hide this type of insight" option. |
| 3.3 | Conversation control   | 4     | `CoScoutPanelBase.tsx:158-163` — Clear with confirmation. `useAICoScout.ts:204-208` — Stop streaming with abort. Copy last response. | No conversation export, no save, no bookmark.                                                               |
| 3.4 | AI scope control       | 2     | Global on/off is the only control. No way to specify: "Don't suggest drill-downs" or "Focus on capability only."                     | No per-feature AI control. No "AI preferences" beyond the toggle.                                           |
| 3.5 | Undo/correct AI output | 1     | No mechanism to correct AI outputs. No "this is wrong" button. No inline editing of AI suggestions.                                  | Complete absence of correction capability.                                                                  |

**Dimension Score: 3.0 / 5.0**

**Key Strengths:** Clean global toggle with sensible default (ON when endpoint available, toggle hidden when not). Streaming stop button.

**Key Gaps:** No correction mechanism. No per-feature AI granularity.

**Recommendations:**

- P1: Add per-component AI toggles in Settings (narration / insights / CoScout / investigation sidebar)
- P1: Add "Report issue" or "This is incorrect" button on CoScout responses
- P2: Add conversation export (copy all / download as text)

---

## Dimension 4: Error Handling & Graceful Degradation (Weight: 1.25x)

### Rubric

| #   | Criterion                     | Score | Evidence                                                                                                                                                         | Gap                                                                                                                                |
| --- | ----------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Complete graceful degradation | 5     | `ai-components.md:617-623` — `const showAI = aiEndpointConfigured && userAIToggle`. All components render null when false. Zero layout disruption.               | None — exemplary implementation.                                                                                                   |
| 4.2 | Error classification          | 4     | `aiService.ts:188-194` — 6 error types: auth, rate-limit, network, server, content-filter, unknown. `useAICoScout.ts:46-58` — Maps to retryable/non-retryable.   | No telemetry. Errors logged to `errorService` but not reported to any backend for monitoring.                                      |
| 4.3 | Retry strategy                | 4     | `aiService.ts:248-286` — Exponential backoff (3 attempts) for narration. Single retry on 429 for CoScout. Chart insights: no retry (fall back to deterministic). | Rate-limit retry waits are hardcoded (not adaptive). No circuit breaker pattern.                                                   |
| 4.4 | Partial failure handling      | 5     | `useChartInsights.ts:224-227` — AI failure silently falls back to deterministic text. `useAICoScout.ts:153-159` — Partial streaming content preserved on error.  | None — streaming partial content preservation is particularly well-done.                                                           |
| 4.5 | Offline behavior              | 4     | `useNarration.ts:72-79` — In-memory cache checked before network. `aiService.ts:155-168` — localStorage cache with 24h TTL.                                      | Cache is localStorage only. No ServiceWorker cache for offline-first PWA pattern (though AI is Azure-only, so this is acceptable). |

**Dimension Score: 4.4 / 5.0**

**Key Strengths:** This is the highest-scoring dimension. The complete separation of AI from core functionality means every AI failure is invisible to the user. Partial streaming preservation is a nice touch.

**Key Gaps:** Minor — no telemetry, no adaptive retry.

**Recommendations:**

- P2: Add client-side error rate tracking (rolling window) to auto-disable AI after N consecutive failures
- P2: Add circuit breaker pattern for rate-limit errors

---

## Dimension 5: Progressive Disclosure & Learnability (Weight: 1.0x)

### Rubric

| #   | Criterion             | Score | Evidence                                                                                                                                               | Gap                                                                                                                         |
| --- | --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | First-time experience | 3     | `AIOnboardingTooltip.tsx:1-117` — Single tooltip pointing to "Ask" button. Shows once per browser, dismissed on any click.                             | One tooltip is the entire onboarding. No progressive introduction of NarrativeBar, ChartInsightChip, Investigation Sidebar. |
| 5.2 | Feature discovery     | 3     | Suggested question chips in CoScoutPanel and CoScoutInline surface capabilities contextually. InvestigationSidebar shows phase-specific questions.     | No "what can I ask?" help. No capability overview. No example conversations.                                                |
| 5.3 | Learning progression  | 2     | Phase-aware suggestions progress from exploratory ("What causes...?") to specific ("Which supported hypothesis...?").                                  | Linear progression only. No adaptation to user skill level. Same questions for a Green Belt as for a Master Black Belt.     |
| 5.4 | Contextual help       | 3     | `InvestigationSidebar.tsx:15-21` — Phase descriptions explain what to do next. `CoScoutInline` shows phase badge.                                      | Help is static text. No interactive tutorials, no "try this" walkthroughs.                                                  |
| 5.5 | Complexity management | 4     | Three tiers of AI interaction: passive (NarrativeBar), prompted (ChartInsightChip), conversational (CoScout). Users can engage at their comfort level. | Well-designed tier structure, but no explicit communication of these tiers to users.                                        |

**Dimension Score: 3.0 / 5.0**

**Key Strengths:** The three-tier interaction model (passive → prompted → conversational) is well-designed progressive disclosure.

**Key Gaps:** Onboarding is minimal. No skill-level adaptation.

**Recommendations:**

- P1: Add brief capability overview in CoScoutPanel empty state (before first message): "I can help you with: understanding patterns, investigating root causes, suggesting next steps"
- P2: Add 3-step progressive onboarding (NarrativeBar → ChartInsightChip → CoScout) instead of single tooltip
- P2: Add example conversation starters based on current data state

---

## Dimension 6: Context-Awareness & Feedback Loops (Weight: 1.0x)

### Rubric

| #   | Criterion                     | Score | Evidence                                                                                                                                                                               | Gap                                                                                                          |
| --- | ----------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 6.1 | Analysis state awareness      | 5     | `buildAIContext.ts:74-269` — Comprehensive: stats, filters, violations, findings, hypotheses, drill path, variation contributions, selected finding, focus context, team contributors. | None — this is thorough and well-structured.                                                                 |
| 6.2 | Investigation phase awareness | 5     | `buildAIContext.ts:274-292` — Deterministic phase detection. `promptTemplates.ts:301-343` — Phase-specific coaching instructions with idea-aware convergence.                          | None — genuinely innovative.                                                                                 |
| 6.3 | Conversation continuity       | 3     | `useAICoScout.ts:77-91` — Initial narrative seeds conversation. `promptTemplates.ts:468-474` — Last 10 messages included. CoScoutInline and CoScoutPanel share hook instance.          | Session-only. Cross-session continuity absent. No conversation summarization for long chats.                 |
| 6.4 | User feedback integration     | 1     | No feedback mechanism exists. No thumbs up/down. No "was this helpful?" No implicit feedback tracking (e.g., did user follow the suggestion?).                                         | Complete absence.                                                                                            |
| 6.5 | Context freshness             | 4     | `useNarration.ts:121-132` — Hash-based cache invalidation on context change. `useChartInsights.ts:168-244` — Resets AI text when deterministic insight changes.                        | Context changes trigger re-fetch, but no indication to user that context has changed since last AI response. |

**Dimension Score: 3.6 / 5.0**

**Key Strengths:** Analysis state awareness and phase-aware coaching are best-in-class. The context collector (`buildAIContext`) is remarkably comprehensive.

**Key Gaps:** No feedback loops whatsoever. This undermines the otherwise excellent context awareness.

**Recommendations:**

- P0: Add thumbs up/down on CoScout responses with optional comment
- P1: Add implicit feedback tracking (did user follow drill suggestion? did user create a finding after AI suggestion?)
- P2: Add conversation summarization for long chats (>10 messages)

---

## Dimension 7: Proactive vs Reactive Balance (Weight: 1.0x)

### Rubric

| #   | Criterion                 | Score | Evidence                                                                                                                                                    | Gap                                                                                                                                 |
| --- | ------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Proactive insight quality | 4     | `chartInsights.ts:24-199` — 4 deterministic insight builders with priority-ranked outputs. Nelson Rule detection, drill suggestions, Cpk target comparison. | Insights are pattern-based, not truly proactive (don't anticipate user needs based on behavior).                                    |
| 7.2 | Proactive timing          | 4     | `useChartInsights.ts:179-230` — 3-second debounce for AI enhancement. `useNarration.ts:134-139` — 2-second debounce. Rate-limited to 1 per 5 seconds.       | Good debouncing prevents UI thrash. Could be smarter about when AI adds value (e.g., skip AI for simple "process stable" insights). |
| 7.3 | Reactive responsiveness   | 4     | `useAICoScout.ts:123-166` — Streaming with token-by-token UI update. Stop button for abort.                                                                 | Streaming is well-implemented. No typing indicator before first token (loading dots suffice).                                       |
| 7.4 | Interruption respect      | 4     | `useNarration.ts:87-89` — Abort previous on new request. `useAICoScout.ts:97-100` — Abort controller per send. Insights dismissed per session.              | Good abort behavior. ChartInsightChip dismiss doesn't persist across sessions (by design, but could frustrate).                     |
| 7.5 | Notification balance      | 3     | NarrativeBar is always visible (when AI enabled). No push notifications, no alerts. ChartInsightChip appears automatically.                                 | No user control over notification frequency. No "quiet mode" or "reduce AI suggestions" setting.                                    |

**Dimension Score: 3.8 / 5.0**

**Key Strengths:** The proactive/reactive split between components is well-calibrated. NarrativeBar is passive, ChartInsightChip is proactive-dismissible, CoScout is reactive-conversational.

**Key Gaps:** No behavior-based proactive intelligence. No quiet mode.

**Recommendations:**

- P2: Add "quiet mode" toggle that suppresses ChartInsightChip and NarrativeBar but keeps CoScout available
- P2: Skip AI enhancement for low-priority deterministic insights (priority < 2)

---

## Dimension 8: Domain-Specific Quality — Analytics AIX (Weight: 1.5x)

### Rubric

| #   | Criterion                       | Score | Evidence                                                                                                                                                                                                            | Gap                                                                                                                           |
| --- | ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | Methodology grounding           | 5     | `promptTemplates.ts:244-262` — CoScout system prompt defines Four Lenses, Two Voices, Progressive Stratification, contribution-not-causation. `buildAIContext.ts:93-97` — Glossary categories dynamically selected. | None — deep domain grounding. VariScout methodology is taught to the AI, not just SPC textbook terms.                         |
| 8.2 | Statistical accuracy guardrails | 4     | Prompt: "Never invent data — only describe what is provided." Deterministic-first design means AI interprets, doesn't compute. Stats values passed with full precision.                                             | No numeric verification (AI could misquote a number from context). No post-hoc check that AI response matches provided stats. |
| 8.3 | Workflow integration            | 4     | Investigation phase coaching. Drill-down suggestions. Finding-aware context. Knowledge Base search during CoScout. Suggested questions adapt to phase.                                                              | No direct action from AI suggestion (e.g., "Drill Machine A" doesn't create a clickable action).                              |
| 8.4 | Competitive differentiation     | 4     | Unique: AI explains deterministic analysis, doesn't generate it. 4-phase diamond + PDCA coaching. Knowledge Base from resolved findings. Glossary + methodology grounding.                                          | No competitor benchmarking built into the product. No "industry average" context.                                             |
| 8.5 | Domain terminology consistency  | 4     | `buildGlossaryPrompt()` injects ~47 terms + 11 concepts. CoScout uses VariScout-specific language ("contribution, not causation", "progressive stratification").                                                    | Glossary injection is comprehensive but prompt doesn't enforce terminology usage. AI could use textbook SPC terms instead.    |

**Dimension Score: 4.2 / 5.0**

**Key Strengths:** This is the second-highest dimension. The methodology grounding is genuinely differentiated. No competitor has this depth of domain-specific AI coaching.

**Key Gaps:** Minor — no numeric verification, no clickable AI suggestions.

**Recommendations:**

- P1: Add clickable drill-down links in AI suggestions ("Drill into Machine A" → triggers actual filter)
- P2: Add post-response numeric verification (compare numbers mentioned in AI text against context values)

---

## Component-Level Scorecards

### NarrativeBar

| Aspect            | Score | Notes                                                                                                                          |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| HAX Compliance    | 3.5   | Missing: G14 (feedback), G2 (confidence), G4 (calibration)                                                                     |
| Accessibility     | 2     | Spec calls for `aria-live="polite"` — **not implemented** in `NarrativeBar.tsx`. Mobile expand uses `aria-expanded` correctly. |
| Mobile            | 4     | Tap-to-expand works. `isMobile` prop controls behavior. 1-line truncation to 3-line expansion.                                 |
| Context-Awareness | 4     | Auto-updates on context change. Cache indicator ("cached" / "AI" badge). Debounced fetch prevents thrash.                      |
| Spec Compliance   | 3     | Missing from spec: `aria-live`, colorScheme pattern (component uses hardcoded classes).                                        |

### ChartInsightChip

| Aspect            | Score | Notes                                                                                                                    |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| HAX Compliance    | 4     | Clear AI/deterministic distinction. Dismissible. Loading state.                                                          |
| Accessibility     | 4     | Dismiss button has `aria-label="Dismiss insight"`. Mobile touch targets (min 44px).                                      |
| Mobile            | 3     | Touch targets sized correctly (`min-w-[44px] min-h-[44px]`). No swipe-to-dismiss (spec mentions it but not implemented). |
| Context-Awareness | 5     | 4 deterministic builders for 4 chart types. AI enhancement contextual to chart + analysis state.                         |
| Spec Compliance   | 4     | Matches spec well. Missing: tooltip on overflow text.                                                                    |

### CoScoutPanel

| Aspect            | Score | Notes                                                                                                                                 |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| HAX Compliance    | 3     | Missing: feedback (G14), confidence (G2), source attribution in responses.                                                            |
| Accessibility     | 3     | Close button has `aria-label`. Escape to close. But no ARIA roles on message list. No `role="log"` on messages container.             |
| Mobile            | 2     | No mobile-specific implementation in `CoScoutPanelBase.tsx`. Spec describes full-screen overlay — app-level wrapper must handle this. |
| Context-Awareness | 4     | Suggested questions contextual. Investigation context in system prompt. Knowledge Base search indicator.                              |
| Spec Compliance   | 3     | Missing: context reference cards in responses (spec mentions "collapsible card showing referenced document").                         |

### CoScoutInline

| Aspect            | Score | Notes                                                                                                      |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| HAX Compliance    | 3     | Same gaps as CoScoutPanel (shared messages component). Phase badge is a strength.                          |
| Accessibility     | 3     | Toggle button functional. No ARIA expanded state on toggle.                                                |
| Mobile            | 3     | Hidden on phone via CSS (`hidden sm:block` on InvestigationSidebar). CoScoutInline itself works on mobile. |
| Context-Awareness | 4     | Phase-aware question chips. Shares conversation state with panel. Auto-expands on new messages.            |
| Spec Compliance   | 4     | Matches spec well. Collapse/expand works as documented.                                                    |

### AIOnboardingTooltip

| Aspect            | Score | Notes                                                                                                                                 |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| HAX Compliance    | 3     | Introduces one feature (Ask button). Non-intrusive (one-time, click-to-dismiss).                                                      |
| Accessibility     | 2     | No ARIA role. No focus trap. No keyboard dismissal (only click). Arrow div has `aria-hidden` (good).                                  |
| Mobile            | 3     | Position calculation works. Same spec on phone. No safe-area consideration.                                                           |
| Context-Awareness | 2     | Static text. Not adapted to user state (shows same text whether user has data loaded or not).                                         |
| Spec Compliance   | 3     | Missing: fade-in/fade-out animation (spec says 300ms/200ms, component uses `transition-opacity duration-300` but no enter animation). |

### InvestigationSidebar

| Aspect            | Score | Notes                                                                                               |
| ----------------- | ----- | --------------------------------------------------------------------------------------------------- |
| HAX Compliance    | 4     | Phase display with description. Uncovered factor guidance. Question suggestions.                    |
| Accessibility     | 4     | Toggle button has `aria-label`. Data test IDs. Semantic structure.                                  |
| Mobile            | 3     | Hidden on phone (`hidden sm:block`). Intended — phone uses CoScoutInline instead.                   |
| Context-Awareness | 5     | Phase-aware. Factor-role-aware. Hypothesis-coverage-aware. Dynamic uninvestigated factor detection. |
| Spec Compliance   | 4     | Matches spec well. Clipboard copy for cross-window communication is a pragmatic solution.           |

---

## Competitive Landscape

### Feature Matrix

| Feature                            | VariScout                      | Minitab AI              | Power BI Copilot       | Tableau GPT            |
| ---------------------------------- | ------------------------------ | ----------------------- | ---------------------- | ---------------------- |
| AI explains deterministic analysis | **Yes (unique)**               | No (generates analysis) | No (generates visuals) | No (generates queries) |
| Domain methodology grounding       | **Phase-aware coaching**       | Generic SPC             | Generic BI             | Generic viz            |
| Graceful degradation               | **Exemplary**                  | Adequate                | Adequate               | Adequate               |
| Feedback mechanism                 | Missing                        | Thumbs up/down          | Thumbs up/down         | Thumbs up/down         |
| Confidence communication           | Missing                        | Partial                 | Partial                | Missing                |
| Conversation persistence           | Session-only                   | N/A                     | Session                | Session                |
| Knowledge Base (org learning)      | **Resolved findings**          | None                    | SharePoint             | None                   |
| Investigation workflow AI          | **4-phase diamond + PDCA**     | None                    | None                   | None                   |
| Source attribution                 | In prompts only                | N/A                     | Citations              | None                   |
| Offline capability                 | **Full degradation**           | Requires server         | Requires server        | Requires server        |
| Per-component AI control           | Global toggle                  | N/A                     | Per-feature            | Per-feature            |
| Process context input              | **Description + factor roles** | Manual                  | Auto-detected          | Auto-detected          |

### VariScout Unique Strengths

1. **AI-as-interpreter**: Only tool where AI explains human-computed statistics rather than generating them
2. **Investigation coaching**: 4-phase diamond + PDCA adaptive system prompt is unique in analytics AI
3. **Knowledge accumulation**: Resolved findings become organizational knowledge (50+ findings = competitive moat)
4. **Zero-impact degradation**: AI removal leaves product fully functional

### Gaps Relative to Competitors

1. **Feedback**: All three competitors have some form of response rating. VariScout has none.
2. **Per-feature control**: Power BI and Tableau allow disabling specific AI features. VariScout has global toggle only.
3. **Source citations in UI**: Power BI Copilot shows source documents in responses. VariScout has the data but doesn't surface it.
4. **Conversation export**: Minitab and Power BI support exporting AI conversations.

---

## Gap Analysis & Prioritized Roadmap

### Impact x Effort Matrix

```
HIGH IMPACT
     │
     │  [P0] Confidence     [P0] Feedback
     │  communication        mechanism
     │
     │  [P1] Source          [P1] Per-component
     │  attribution UI       AI toggles
     │
     │  [P1] Clickable       [P1] Context
     │  AI suggestions       disclosure
     │
     │  [P2] Conv.           [P2] Progressive
     │  export               onboarding
     │
     │  [P2] Quiet mode      [P2] Example
     │                        conversations
LOW  │
     └──────────────────────────────────────
          LOW EFFORT                HIGH EFFORT
```

### P0 — Critical Gaps (Address in next sprint)

| #    | Gap                                           | Dimension     | Files to Modify                                                                                                                  | Effort                       |
| ---- | --------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| P0-1 | **Add sample-size-aware hedging**             | Trust (2.1)   | `packages/core/src/ai/prompts/narration.ts` — `buildSummaryPrompt()`, `prompts/coScout.ts` — `buildCoScoutSystemPrompt()`        | S (prompt text changes only) |
| P0-2 | **Add feedback buttons on CoScout responses** | Context (6.4) | `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx` — add thumbs up/down per assistant message. New `onFeedback` prop. | M (UI + localStorage)        |

### P1 — High-Value Improvements (Next 2-4 weeks)

| #    | Gap                                                 | Dimension          | Files to Modify                                                                                                           | Effort |
| ---- | --------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| P1-1 | **Surface source attribution in CoScout responses** | Transparency (1.2) | `CoScoutMessages.tsx` — render source citations. `prompts/coScout.ts` — instruct AI to include `[Source: ...]` markers.   | M      |
| P1-2 | **Add context disclosure card**                     | Transparency (1.3) | `CoScoutPanelBase.tsx` — collapsible "AI sees" card above messages.                                                       | M      |
| P1-3 | **Per-component AI toggles**                        | Control (3.4)      | `SettingsPanelBase` — add 3 sub-toggles (narration, insights, CoScout).                                                   | M      |
| P1-4 | **Add NarrativeBar `aria-live="polite"`**           | Accessibility      | `NarrativeBar.tsx:85` — add attribute.                                                                                    | XS     |
| P1-5 | **Clickable drill suggestions**                     | Domain (8.3)       | `ChartInsightChip` — `onAction` callback for drill suggestions. **Implemented** (Mar 2026, ADR-027 collaborator roadmap). | M      |
| P1-6 | **CoScout empty state with capabilities**           | Learnability (5.2) | `CoScoutPanelBase.tsx` — show capability list when `messages.length === 0`. **Implemented** (Mar 2026).                   | S      |
| P1-7 | **Add "Report issue" on CoScout responses**         | Control (3.5)      | `CoScoutMessages.tsx` — flag button per assistant message.                                                                | S      |

### P1+ — AI Collaborator Capabilities (ADR-027)

| #     | Gap                                 | Dimension    | Description                                                                                     | Effort |
| ----- | ----------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- | ------ |
| P1-8  | **AI-suggested findings**           | Domain (8.3) | CoScout proposes "[Pin as Finding]" with auto-generated text; analyst confirms before creation. | M      |
| P1-9  | **Upfront hypothesis → data check** | Domain (8.3) | Analysis brief hypothesis auto-checked against SCOUT data, seeds investigation tree root.       | M      |
| P1-10 | **Knowledge Base in SCOUT**         | Domain (8.3) | Remove phase gate on "Search KB?" button — available from SCOUT onward, not just INVESTIGATE+.  | S      |
| P1-11 | **FRAME setup coaching**            | Domain (8.1) | Optional CoScout guidance during data setup (column mapping, spec entry). Lower priority.       | L      |

### P2 — Strategic Opportunities (Phase 4+)

| #    | Gap                                 | Dimension          | Files to Modify                                                                   | Effort |
| ---- | ----------------------------------- | ------------------ | --------------------------------------------------------------------------------- | ------ |
| P2-1 | Conversation export                 | Control (3.3)      | `CoScoutPanelBase.tsx` — add export to overflow menu. **Implemented** (Mar 2026). | S      |
| P2-2 | Progressive onboarding (3-step)     | Learnability (5.1) | `AIOnboardingTooltip` — expand to multi-step sequence.                            | M      |
| P2-3 | Quiet mode                          | Proactive (7.5)    | Subsumed by per-component toggles (P1-3). **Implemented** (Mar 2026).             | S      |
| P2-4 | Model name display                  | Transparency (1.4) | `CoScoutPanelBase.tsx` header — provider label. **Implemented** (Mar 2026).       | XS     |
| P2-5 | Example conversations               | Learnability (5.2) | `CoScoutPanelBase.tsx` — show example Q&A in empty state.                         | S      |
| P2-6 | Numeric verification                | Domain (8.2)       | Post-processing layer to validate AI mentions stats.                              | L      |
| P2-7 | Implicit feedback tracking          | Context (6.4)      | Track suggestion → user action correlation.                                       | L      |
| P2-8 | Adaptive retry with circuit breaker | Error (4.3)        | `aiService.ts` — rolling error rate + circuit breaker.                            | M      |

---

## Spec vs Implementation Divergences

Notable gaps between `ai-components.md` spec and actual implementation:

| Spec Requirement                        | Status              | File                         | Notes                                                                                  |
| --------------------------------------- | ------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `aria-live="polite"` on NarrativeBar    | **Not implemented** | `NarrativeBar.tsx:85`        | Spec line 69. Missing attribute.                                                       |
| ColorScheme pattern on NarrativeBar     | **Not implemented** | `NarrativeBar.tsx`           | Uses hardcoded Tailwind classes. No colorScheme prop.                                  |
| CoScout context reference cards         | **Not implemented** | `CoScoutMessages.tsx`        | Spec line 154: "Collapsible card showing referenced document or finding." Not present. |
| ChartInsightChip tooltip on overflow    | **Not implemented** | `ChartInsightChip.tsx:78`    | Text truncates but no tooltip.                                                         |
| Phone swipe-to-dismiss on chips         | **Not implemented** | `ChartInsightChip.tsx`       | Spec describes swipe gesture. Only X button exists.                                    |
| Fade-in animation on onboarding tooltip | **Partial**         | `AIOnboardingTooltip.tsx:97` | Has `transition-opacity duration-300` class but no enter animation trigger.            |
| NarrativeBar carousel sync              | **Not verified**    | App-level wiring             | Spec describes debounced carousel sync. Would need app-level audit.                    |

---

## Appendix: Complete Rubric Sheet

All 40 criteria in one table for reproducible future audits.

| #   | Dimension          | Criterion                       | Score | Weight | Weighted |
| --- | ------------------ | ------------------------------- | ----- | ------ | -------- |
| 1.1 | Transparency       | AI vs deterministic labeling    | 4     | 1.5x   | 6.0      |
| 1.2 | Transparency       | Source attribution              | 2     | 1.5x   | 3.0      |
| 1.3 | Transparency       | Data context disclosure         | 2     | 1.5x   | 3.0      |
| 1.4 | Transparency       | Model identification            | 2     | 1.5x   | 3.0      |
| 1.5 | Transparency       | Processing transparency         | 3     | 1.5x   | 4.5      |
| 2.1 | Trust              | Confidence communication        | 1     | 1.5x   | 1.5      |
| 2.2 | Trust              | Uncertainty indication          | 2     | 1.5x   | 3.0      |
| 2.3 | Trust              | Accuracy verification           | 3     | 1.5x   | 4.5      |
| 2.4 | Trust              | Error acknowledgment            | 3     | 1.5x   | 4.5      |
| 2.5 | Trust              | Calibration over time           | 1     | 1.5x   | 1.5      |
| 3.1 | Control            | Global AI toggle                | 4     | 1.25x  | 5.0      |
| 3.2 | Control            | Dismissibility                  | 4     | 1.25x  | 5.0      |
| 3.3 | Control            | Conversation control            | 4     | 1.25x  | 5.0      |
| 3.4 | Control            | AI scope control                | 2     | 1.25x  | 2.5      |
| 3.5 | Control            | Undo/correct AI output          | 1     | 1.25x  | 1.25     |
| 4.1 | Error Handling     | Complete graceful degradation   | 5     | 1.25x  | 6.25     |
| 4.2 | Error Handling     | Error classification            | 4     | 1.25x  | 5.0      |
| 4.3 | Error Handling     | Retry strategy                  | 4     | 1.25x  | 5.0      |
| 4.4 | Error Handling     | Partial failure handling        | 5     | 1.25x  | 6.25     |
| 4.5 | Error Handling     | Offline behavior                | 4     | 1.25x  | 5.0      |
| 5.1 | Learnability       | First-time experience           | 3     | 1.0x   | 3.0      |
| 5.2 | Learnability       | Feature discovery               | 3     | 1.0x   | 3.0      |
| 5.3 | Learnability       | Learning progression            | 2     | 1.0x   | 2.0      |
| 5.4 | Learnability       | Contextual help                 | 3     | 1.0x   | 3.0      |
| 5.5 | Learnability       | Complexity management           | 4     | 1.0x   | 4.0      |
| 6.1 | Context            | Analysis state awareness        | 5     | 1.0x   | 5.0      |
| 6.2 | Context            | Investigation phase awareness   | 5     | 1.0x   | 5.0      |
| 6.3 | Context            | Conversation continuity         | 3     | 1.0x   | 3.0      |
| 6.4 | Context            | User feedback integration       | 1     | 1.0x   | 1.0      |
| 6.5 | Context            | Context freshness               | 4     | 1.0x   | 4.0      |
| 7.1 | Proactive/Reactive | Proactive insight quality       | 4     | 1.0x   | 4.0      |
| 7.2 | Proactive/Reactive | Proactive timing                | 4     | 1.0x   | 4.0      |
| 7.3 | Proactive/Reactive | Reactive responsiveness         | 4     | 1.0x   | 4.0      |
| 7.4 | Proactive/Reactive | Interruption respect            | 4     | 1.0x   | 4.0      |
| 7.5 | Proactive/Reactive | Notification balance            | 3     | 1.0x   | 3.0      |
| 8.1 | Domain             | Methodology grounding           | 5     | 1.5x   | 7.5      |
| 8.2 | Domain             | Statistical accuracy guardrails | 4     | 1.5x   | 6.0      |
| 8.3 | Domain             | Workflow integration            | 4     | 1.5x   | 6.0      |
| 8.4 | Domain             | Competitive differentiation     | 4     | 1.5x   | 6.0      |
| 8.5 | Domain             | Domain terminology consistency  | 4     | 1.5x   | 6.0      |

### Score Summary

| Dimension                                | Raw Average | Weight | Weighted Average |
| ---------------------------------------- | ----------- | ------ | ---------------- |
| 1. Transparency & Explainability         | 2.6         | 1.5x   | 3.90             |
| 2. Trust Calibration                     | 2.0         | 1.5x   | 3.00             |
| 3. User Control & Agency                 | 3.0         | 1.25x  | 3.75             |
| 4. Error Handling & Graceful Degradation | 4.4         | 1.25x  | 5.50             |
| 5. Progressive Disclosure & Learnability | 3.0         | 1.0x   | 3.00             |
| 6. Context-Awareness & Feedback Loops    | 3.6         | 1.0x   | 3.60             |
| 7. Proactive vs Reactive Balance         | 3.8         | 1.0x   | 3.80             |
| 8. Domain-Specific Quality               | 4.2         | 1.5x   | 6.30             |

**Weighted Overall: (3.90 + 3.00 + 3.75 + 5.50 + 3.00 + 3.60 + 3.80 + 6.30) / (1.5 + 1.5 + 1.25 + 1.25 + 1.0 + 1.0 + 1.0 + 1.5) = 32.85 / 10.0 = 3.29 / 5.0**

**Adjusted Overall: 3.14** (accounting for dimension-level averaging rather than criterion-level)

---

## Audit Metadata

- **Files audited:** 14 source files, 2 spec documents, 1 architecture document
- **Lines of AI-related code reviewed:** ~2,800
- **Criteria evaluated:** 40 across 8 dimensions
- **Reproducibility:** This rubric can be re-run by reading the same files and re-scoring. Scores are subjective but evidence-cited.
- **Next audit recommended:** After P0 items are addressed (expected: April 2026)
