---
title: AI Experience Narrative
audience: [analyst, engineer]
category: workflow
status: stable
related: [ai-integration, narrative-bar, coscout, chart-insights, knowledge-base]
---

# AI Experience Narrative

How the analyst's experience changes with and without AI — a user-facing story, not architecture.

---

## Without AI (Baseline)

Every VariScout user starts here. The PWA always works this way. Azure users without AI Foundry deployed, or with the "Show AI assistance" toggle OFF, see this experience.

### What the analyst does

1. **Upload or paste data** → column mapping → dashboard renders
2. **Scan the I-Chart** — look for red dots (spec violations), orange segments (Nelson Rule 2 shifts), drift patterns
3. **Check the Boxplot** — compare category distributions visually. A yellow glow on the highest-η² category suggests where to drill
4. **Read the Pareto** — see which categories explain the most variation (contribution % bars)
5. **Review Stats** — Cpk, mean, sigma, pass rate. Green = meeting spec. Red = failing.
6. **Drill down** — click a Boxplot bar or Pareto category → filter applied → breadcrumb appears → all charts recalculate for the filtered subset
7. **Pin a finding** — right-click → "Add observation" → record what you see
8. **Investigate** — add hypotheses, run further drill-downs, go to the shop floor
9. **Act and verify** — define corrective action, load new data, check Cpk before/after

### What guides the analyst

- **Deterministic suggestions** — yellow glow on high-η² categories, `getNextDrillFactor()` recommends next drill target
- **Statistical indicators** — Nelson Rule violation markers, control/spec limit lines, contribution percentages
- **Glossary tooltips** — hover any statistical term for a plain-language definition

The analyst reads charts, interprets numbers, and makes their own connections. This is the "guided frustration" pedagogy — the struggle builds statistical intuition.

---

## With AI Enabled (Azure App)

When the customer deploys Azure AI Foundry resources and the user keeps "Show AI assistance" ON in Settings, three layers of AI assistance appear. AI is available on any Azure plan (Standard, Team, or Team AI).

### Layer 1: NarrativeBar

A single-line summary bar fixed at the bottom of the dashboard. Updates automatically when data, filters, or findings change.

**What the analyst sees:**

> "Machine A explains 47% of variation. Morning shift shows Nelson Rule 2 violation. Cpk 0.85 below target 1.33."

**What changes:** The analyst no longer needs to mentally synthesize across four charts. The NarrativeBar does the cross-chart summary in plain language — but the statistical engine computed the numbers; AI just narrates them.

**Mobile:** Tap to expand (up to 3 lines). "Ask →" button opens CoScout.

### Layer 2: ChartInsightChips

Small badges below each chart card. One chip per chart maximum.

| Chart   | Example Chip                                |
| ------- | ------------------------------------------- |
| I-Chart | "Process shift detected at point 34"        |
| Boxplot | "→ Drill Machine A (47%)"                   |
| Pareto  | "Top 2 categories explain 73% of variation" |
| Stats   | "Cpk 0.85 — below 1.33 target"              |

**What changes:** Each chart gets a contextual suggestion that connects statistical output to action. The yellow glow on Machine A is still there — the chip adds "Your process description mentions nozzle clogging as a concern — check the nozzle on Head A."

**Relationship to deterministic suggestions:** AI chips build on existing deterministic suggestions, never override them. If deterministic and AI disagree, the deterministic answer wins.

### Layer 3: CoScout Panel

A resizable slide-out panel for conversational analysis. Opened via "Ask →" in the NarrativeBar or a dedicated toolbar button.

**What the analyst can ask:**

- "Why is Fill Head 3 drifting?" → CoScout explains the statistical evidence (47% variation contribution, downward drift from point 34) and, on Team AI, references past findings
- "What should I check next?" → Suggests investigation steps based on current hypothesis tree and investigation phase
- "Generate a summary for the review meeting" → Produces structured report from findings data

**What changes:** The analyst has a domain-aware conversation partner that knows the current analysis state, process description, and (on Team AI) organizational history.

---

## With Knowledge Base (Team AI Plan)

Team AI adds a managed knowledge layer on top of the base AI experience. Azure AI Search indexes resolved findings and team documents, giving CoScout organizational memory.

### What the analyst gains

**Cross-project knowledge:**

> "You've seen this pattern 3 times in 6 months. Nozzle wear was the cause 67% of the time. Average resolution: 5 days."

**Document retrieval:**

> "Your team's FMEA lists nozzle wear (RPN 180) as the top failure mode. The SOP says: replace nozzle tip, perform alignment procedure."

**Measurement-backed suggestions:**

> "Nozzle replacement improved Cpk by 0.47 on average across 3 past findings."

### How it accumulates

Each resolved finding adds a structured document to the Azure AI Search index:

- Project name, title, factor, contribution %, Cpk before/after
- Suspected cause, corrective actions taken, outcome assessment
- Process description context

After 50+ resolved findings, CoScout has genuine organizational knowledge that no competitor can match — measurement-backed, closed-loop, and continuously evolving.

### Scouting Report vs. AI Report

Two report types serve different purposes:

| Report              | Available On            | Content                                                                   | How It Works                                                                         |
| ------------------- | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Scouting Report** | Standard, Team, Team AI | Structured story-driven report following the 5-step investigation journey | Deterministic — assembles chart snapshots, findings, KPIs into a narrative structure |
| **AI Report**       | Team AI only            | AI-generated prose from findings data                                     | AI writes a quality engineering narrative from structured finding data               |

The Scouting Report is always available on Azure. The AI Report requires Team AI because it uses AI generation and benefits from the knowledge base context.

---

## Graceful Degradation

AI is designed to be invisible when unavailable. The app never breaks, never shows error modals, and never changes layout when AI is absent.

| Scenario                                 | Behavior                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **No AI endpoint configured**            | AI UI elements never render. No toggles, no empty spaces, no "AI unavailable" messages. The dashboard looks exactly like the PWA. |
| **AI endpoint configured, toggle OFF**   | Same as above — user chose to hide AI. Toggle persists in localStorage.                                                           |
| **AI endpoint configured, API error**    | NarrativeBar shows last cached response or hides. ChartInsightChips hide entirely. CoScout shows inline error with retry button.  |
| **AI endpoint configured, offline**      | NarrativeBar shows cached response (if available) or hides. CoScout shows conversation history but disables new messages.         |
| **AI endpoint configured, rate limited** | CoScout shows "Please wait a moment before asking again." NarrativeBar and chips continue with cached responses.                  |
| **Content filter triggered**             | CoScout shows "I can't answer that question. Try rephrasing."                                                                     |

All cached AI responses have a 24-hour TTL or expire when analysis data changes — whichever comes first.

---

## The Experience Spectrum

```
PWA (Free)              Azure Standard/Team              Azure Team AI
─────────────────────   ──────────────────────────────   ─────────────────────────
Charts + numbers        + NarrativeBar                   + Knowledge Base
Deterministic hints     + ChartInsightChips              + Cross-project queries
Glossary tooltips       + CoScout conversation           + Document retrieval
Manual investigation    + Process context inference      + AI-generated reports
                        + AI-aware investigation         + Organizational memory

"Read the charts        "AI explains what you see        "AI remembers what
 yourself"               and suggests what to do"         your team learned"
```

At every point on this spectrum, the statistical engine is the authority. AI adds language, context, and memory — never competing statistics.

---

## See Also

- [AI-Assisted Analysis](ai-assisted-analysis.md) — Workflow details for each AI layer
- [Investigation to Action](investigation-to-action.md) — The investigation workflow AI enhances
- [AI Architecture](../../05-technical/architecture/ai-architecture.md) — Technical implementation
- [Tier Philosophy](../../08-products/tier-philosophy.md) — Why features are gated where they are
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
