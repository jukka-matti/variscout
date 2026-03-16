---
title: AIX Design System
audience: [developer]
category: architecture
status: stable
related: [ai-architecture, ai-context-engineering, coscout, narrative-bar, knowledge-base]
---

# AIX Design System

Authoritative reference for VariScout's AI experience. Read this before modifying any AI behavior.

**Last updated:** March 2026 | **Baseline score:** 3.14/5.0 (40-criteria evaluation)

---

## Layer 1: Foundations

### 1.1 AI Principles

Seven non-negotiable rules governing all AI behavior in VariScout:

1. **Deterministic primacy** — AI explains computed analysis, never generates its own numbers. Every statistic shown comes from `@variscout/core`.
2. **Contribution, not causation** — AI helps locate WHERE variation concentrates; the analyst investigates WHY. Never say "X causes Y."
3. **Stats-only payloads** — No raw measurement data in prompts. Context carries summary statistics only (<500 tokens typical).
4. **Customer-owned** — All AI runs in the customer's Azure tenant. No telemetry, no phone-home, no cross-tenant data.
5. **Graceful degradation** — AI failure is invisible. The dashboard works identically without AI. No error modals, no broken layouts.
6. **Progressive engagement** — Passive (NarrativeBar) → prompted (ChartInsightChip) → conversational (CoScout). User controls depth.
7. **Methodology grounding** — AI speaks VariScout's language: Four Lenses, Two Voices, Progressive Stratification. See `packages/core/src/glossary/`.

### 1.2 Tone & Voice Guide

**Audience:** Quality professionals at Green Belt level. Technical but accessible.

**Voice:** Helpful expert colleague, not textbook professor. Direct, specific, grounded in data.

#### Confidence Calibration

| Sample Size  | Tone      | Language Examples                                                                    |
| ------------ | --------- | ------------------------------------------------------------------------------------ |
| n ≥ 100      | Assertive | "The data shows...", "Cpk confirms..."                                               |
| 30 ≤ n < 100 | Standard  | "The analysis suggests...", "Current data indicates..."                              |
| 10 ≤ n < 30  | Hedged    | "Based on limited data...", "Preliminary analysis indicates..."                      |
| n < 10       | Cautious  | "With only N observations, this is not yet reliable. Consider collecting more data." |

#### Additional Hedging Rules

- Factors > samples/5: "Note: high factor-to-sample ratio may reduce ANOVA reliability"
- Single-category filter with n < 20: "Filtered to a small subset — patterns may not be representative"

#### Terminology Enforcement

- Always use VariScout glossary terms over textbook SPC
- "Contribution %" not "effect size" or "eta squared" in user-facing text
- "Progressive stratification" not "drill-down" when explaining methodology
- "Voice of the Process / Voice of the Customer" when explaining control vs spec limits

#### What AI Must Never Do

- Invent data or statistics not in the context
- Claim causation from correlation
- Suggest specific numeric thresholds not derived from the data
- Recommend process changes beyond the analyst's data scope
- Reference data from other tenants or organizations

### 1.3 Governance

#### Model Selection

| Tier      | Models                     | Used By                        | Priority         |
| --------- | -------------------------- | ------------------------------ | ---------------- |
| Fast      | GPT-4o-mini / Claude Haiku | NarrativeBar, ChartInsightChip | Latency, cost    |
| Reasoning | GPT-4o / Claude Sonnet     | CoScout, Reports               | Quality, context |

Customer configures model during ARM deployment. Provider auto-detected from endpoint URL pattern.

#### Prompt Change Process

1. Read this AIX Design System doc for applicable principles
2. Edit prompt template in `packages/core/src/ai/promptTemplates.ts`
3. Run snapshot tests: `pnpm --filter @variscout/core test`
4. Verify with sample data (coffee dataset: n=24 — ideal for hedging testing)
5. Document rationale in commit message

#### Safety Guardrails

- **Content filtering:** CoScout classifies errors as rate-limit, content-filter, or auth. Each has distinct UX (see §2.4).
- **No PII in context:** Finding text is analyst-written, not auto-captured from data.
- **Tenant isolation:** JWT `tid` claim in Azure Functions. AI Search queries filtered by tenant.
- **Auth:** AI endpoint URL is not a secret; auth via EasyAuth bearer tokens.

---

## Layer 2: Interaction Patterns

### 2.1 Confidence Communication Pattern

**When to hedge:** Apply confidence calibration table (§1.2) based on `context.stats.samples`.

**Implementation:** `buildSummaryPrompt()` and `buildCoScoutSystemPrompt()` in `promptTemplates.ts` inject hedging instructions when sample count falls below thresholds.

**Visual indicators:**

- NarrativeBar: amber dot when n < 30 (`dataQualityHint` prop)
- No indicator when data is robust (n ≥ 100)

**Language:** Calibrated per confidence table. Hedging instructions are injected into prompts, not hardcoded in responses.

### 2.2 Action Suggestion Pattern

**Principle:** AI suggests, user confirms. "Drill Machine A (45%)" is clickable, not auto-executed.

**Implementation:**

- `InsightAction` type on `DeterministicInsight`: `{ type: 'drill'; factor: string; value?: string }`
- Populated by `buildBoxplotInsight` (drill next factor) and `buildParetoInsight` (drill top category)
- `ChartInsightChip` accepts `onAction` callback; renders arrow icon on actionable chips
- Action flows: chip click → `onInsightAction` on `DashboardLayoutBase` → app's `handleDrillDown`

**Visual:** Arrow icon on actionable chips, `cursor-pointer`, distinct hover state.

### 2.3 Context Transparency Pattern

**What AI sees:** `buildAIContext()` assembles stats, filters, findings, violations, hypotheses. See `ai-context-engineering.md` for token budgets.

**What user sees:** Currently nothing (known gap). Future: expandable "AI context" card in CoScout.

**Source attribution:** Knowledge Base sources formatted in `formatKnowledgeContext()` with `[From: source]` markers. Currently in prompts only, not surfaced in UI (known gap).

### 2.4 Error & Degradation Pattern

VariScout's error handling is already exemplary — documenting here as reference:

| State             | NarrativeBar          | ChartInsightChip                    | CoScout                                |
| ----------------- | --------------------- | ----------------------------------- | -------------------------------------- |
| No AI configured  | Renders null          | Renders null                        | Renders null                           |
| API error         | Hides or shows cached | Hides (falls back to deterministic) | Inline retry button                    |
| Rate limit        | —                     | —                                   | "Please wait a moment"                 |
| Content filter    | —                     | —                                   | "I can't answer that. Try rephrasing." |
| Partial streaming | —                     | —                                   | Preserved (content kept on disconnect) |
| Offline           | Shows cached or hides | Shows deterministic                 | Hidden                                 |

Zero layout impact in all degraded states. No error modals.

### 2.5 Progressive Engagement Pattern

Three tiers of AI interaction — user controls depth:

| Tier           | Component        | Behavior                        | User Action    |
| -------------- | ---------------- | ------------------------------- | -------------- |
| Passive        | NarrativeBar     | Always-on summary               | Read only      |
| Prompted       | ChartInsightChip | Contextual per-chart suggestion | Dismiss or act |
| Conversational | CoScout          | Full dialogue, phase-aware      | User initiates |

Each tier is independently dismissable. Global toggle in Settings disables all AI. No per-component toggles currently (future consideration).

### 2.6 Knowledge Base Pattern

Azure AI Search + Foundry IQ integration for organizational learning:

**Indexing:**

- Findings indexed to AI Search via Azure Function (HTTP trigger, debounced 5s after project save)
- Team documents indexed from SharePoint via Foundry IQ managed connector
- Tenant-isolated queries (JWT `tid` filtering)

**Search types:**

- Hybrid (keyword + semantic) for findings
- Agentic (LLM decomposition) for documents

**Integration surface:**

- CoScout `onBeforeSend` hook triggers search
- Results injected as system message via `formatKnowledgeContext()`
- Source attribution: `[From: findings]` and `[From: {source}]` markers in context

### 2.7 Investigation Coaching Pattern

Five investigation phases with distinct AI behavior:

| Phase      | AI Role        | Prompt Instructions                                   |
| ---------- | -------------- | ----------------------------------------------------- |
| Initial    | Orientation    | Help identify which chart to examine first            |
| Diverging  | Exploration    | Encourage testing hypotheses across factor categories |
| Validating | Interpretation | Help interpret η² (contribution, not causation)       |
| Converging | Synthesis      | Help synthesize root causes, brainstorm improvements  |
| Acting     | Monitoring     | Check Capability chart, monitor Cpk improvement       |

Phase detection is deterministic (`detectInvestigationPhase()` in `buildAIContext.ts`). AI coaching instructions are injected per phase in `buildCoScoutSystemPrompt()`.

Improvement ideas injected during converging phase when supported hypotheses exist. See `promptTemplates.ts` for implementation.

---

## Layer 3: Component AIX Cards

### 3.1 NarrativeBar

- **Patterns:** Confidence Communication (§2.1), Error & Degradation (§2.4), Passive Engagement (§2.5)
- **Prompt:** Fast tier, 200 tokens, temp 0.3. "1-2 sentences for quality professionals."
- **Accessibility:** `aria-live="polite"` on container. Mobile: tap-to-expand with `aria-expanded`.
- **Mobile:** 1 line → 3 lines on tap, animated transition.
- **Visual:** Amber dot when `dataQualityHint` indicates limited data (n < 30).
- **Files:** `packages/ui/src/components/NarrativeBar/`, `packages/hooks/src/useNarration.ts`

### 3.2 ChartInsightChip

- **Patterns:** Action Suggestion (§2.2), Confidence Communication (§2.1), Prompted Engagement (§2.5)
- **Prompt:** Fast tier, 80 tokens, temp 0.2. "One sentence, <120 chars, specific and actionable."
- **Deterministic builders:** I-Chart (Nelson rules), Boxplot (drill suggestions), Pareto (top categories), Stats (Cpk vs target)
- **AI enhancement:** 3s debounce, silent fallback to deterministic on error
- **Accessibility:** Dismiss button `aria-label="Dismiss insight"`. Text span has `title` attribute for overflow.
- **Mobile:** 44px touch targets for dismiss button (already implemented)
- **Action:** Actionable chips show arrow icon; clicking triggers `onAction` → drill-down
- **Files:** `packages/ui/src/components/ChartInsightChip/`, `packages/core/src/ai/chartInsights.ts`, `packages/hooks/src/useChartInsights.ts`

### 3.3 CoScout (Panel + Inline)

- **Patterns:** All patterns — Confidence, Action, Context Transparency, Error, Conversational Engagement, Investigation Coaching, Knowledge Base
- **Prompt:** Reasoning tier, 800 tokens, temp 0.4. "2-4 sentences, phase-aware."
- **Conversation:** Session-only (50 messages max), streaming with abort, narrative-seeded
- **Suggested questions:** Phase-aware, dynamically generated from investigation state
- **Accessibility:** `role="log"` + `aria-live="polite"` on message container
- **Knowledge Base:** Search indicator during loading ("Searching N related findings...")
- **Known gaps:** No source attribution in responses, no context disclosure card, no feedback mechanism
- **Files:** `packages/ui/src/components/CoScoutPanel/`, `packages/hooks/src/useAICoScout.ts`

### 3.4 InvestigationSidebar

- **Patterns:** Context Transparency (§2.3), Investigation Coaching (§2.7), Progressive Engagement (§2.5)
- **Features:** Phase display with description, uncovered factor roles, suggested questions
- **No API calls:** "Ask CoScout" copies to clipboard (popout window has no auth context)
- **Mobile:** Hidden on phone (`hidden sm:block`); CoScoutInline used instead
- **Files:** `packages/ui/src/components/FindingsWindow/InvestigationSidebar.tsx`

### 3.5 AIOnboardingTooltip

- **Patterns:** Progressive Engagement (§2.5)
- **Behavior:** Single tooltip, one-time per browser, dismissed on any click
- **Known gap:** Minimal onboarding (single feature introduced). Future: multi-step progressive introduction.
- **Files:** `packages/ui/src/components/AIOnboardingTooltip/`

---

## Layer 4: Evolution

### 4.1 Prompt Maintenance Process

- All templates centralized in `packages/core/src/ai/promptTemplates.ts`
- Snapshot tests validate structure, not exact wording
- Test with coffee dataset (n=24, multiple factors — triggers hedging)
- Document prompt changes in commit messages with rationale
- This AIX Design System doc is the governance reference for all prompt work

### 4.2 Re-audit Schedule

- Re-run 40-criteria evaluation quarterly (next: June 2026)
- Track dimension scores over time (baseline: March 2026 at 3.14/5.0)
- Evaluation rubric: `docs/superpowers/specs/2026-03-16-ai-integration-evaluation.md`

### 4.3 Gap Tracker

Known gaps from the March 2026 evaluation:

| Gap                              | Priority | Status                       |
| -------------------------------- | -------- | ---------------------------- |
| Source attribution in CoScout UI | P1       | Deferred                     |
| Context disclosure card          | P1       | Deferred                     |
| Per-component AI toggles         | P2       | Deferred                     |
| Feedback mechanism               | P2       | Deferred (awaiting use case) |
| Conversation persistence         | P2       | Deferred (tied to feedback)  |
| Adaptive learning                | P3       | Deferred (Phase 5+)          |

### 4.4 Competitive Watch

VariScout's unique position: AI-as-interpreter — explains deterministic analysis, doesn't generate it. This is a deliberate architectural choice (Principle 1).

Monitor competitors annually:

- **Minitab AI:** Traditional SPC + AI assistant
- **Power BI Copilot:** General-purpose data Q&A
- **Tableau GPT:** Natural language visualization

Update competitive matrix in evaluation doc annually.
