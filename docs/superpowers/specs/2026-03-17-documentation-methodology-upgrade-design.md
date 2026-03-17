---
title: Documentation Methodology Upgrade — Lessons from tblsum
audience: [engineer, analyst]
category: architecture
status: draft
date: 2026-03-17
related: [documentation, business-strategy, tiers, ai-integration, user-journeys]
---

# Documentation Methodology Upgrade

## Problem Statement

Benchmarking VariScout's documentation against tblsum (a spec-first restaurant SaaS project in the same organization) revealed four structural gaps. tblsum has patterns that make strategic decisions traceable and justified — VariScout's documentation, while strong on technical architecture and feature coverage, lacks the strategic connective tissue that answers "why?"

### Gaps Identified

| Gap                         | tblsum has                                                               | VariScout has                                          | Impact                                                       |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Business Bible**          | 21 hypotheses with invalidation criteria, 6 value levers, flywheel model | Vision philosophy, market TAM, scattered ADRs          | Hard to justify product decisions or validate assumptions    |
| **Tier Philosophy**         | Value ladder, tier gate principles, modular pricing research             | Feature-parity matrix (what), pricing table (how much) | Unclear why features are gated where they are                |
| **AI Experience Narrative** | N/A (no AI yet)                                                          | 3 architecture docs, ADR-019                           | No user-facing story of the without-AI → with-AI progression |
| **Journey Traceability**    | Bidirectional: journey → aggregate → UI view → journey                   | Flows + JTBD + use cases (not linked to code)          | Can't trace a feature back to a user need                    |

### What VariScout Does Better

- **Domain philosophy**: Four Lenses, Two Voices, detective metaphor (tblsum has no equivalent conceptual framework)
- **AI architecture**: Three dedicated docs (architecture, data flow, context engineering)
- **Working product**: 3,000+ tests, 6 packages, real users
- **Feature-parity matrix**: Thorough cross-platform comparison

## Design

### Approach: Cherry-Pick + Adapt

Take the _concepts_ from tblsum's documentation methodology but adapt them to VariScout's reality as a shipped product (not a spec-first project). Create 4 focused documents rather than porting tblsum's full DDD/aggregate structure.

### Deliverable 1: Business Bible

**File:** `docs/01-vision/business-bible.md`

**Purpose:** Single strategic master document where every product decision can be traced to a testable business assumption.

**Template adapted from:** tblsum's `docs/business/business-bible.md`

#### Section 1: Strategic Hypotheses

Numbered, falsifiable bets with explicit invalidation criteria. Format per hypothesis:

```markdown
### H1: [Statement]

|                           |                                                     |
| ------------------------- | --------------------------------------------------- |
| **Evidence For**          | What supports this hypothesis                       |
| **Evidence Against**      | What challenges it                                  |
| **Invalidation Criteria** | "If X proves false, we should Y"                    |
| **Status**                | Untested / Supported / Invalidated                  |
| **Validates**             | Which value lever or product decision this supports |
```

**Initial hypothesis candidates** (to be validated and expanded):

- **H1:** Quality professionals will pay for variation analysis if it saves 3+ hours/week vs Excel/Minitab workflows
- **H2:** Free PWA users convert to Azure at meaningful rates (10-20% of engaged users)
- **H3:** AI as interpreter (not generator) avoids the trust issues seen in Minitab AI Assistant and Power BI Copilot
- **H4:** Linked filtering (Four Lenses working together) is the key differentiator vs single-chart tools
- **H5:** Teams integration creates organizational stickiness that reduces churn below 5%/month
- **H6:** The investigation workflow (observed → resolved) is more valuable than the charts themselves
- **H7:** Offline-first architecture is a competitive advantage for manufacturing floor use
- **H8:** €99/month per-deployment pricing is the right price point for quality teams of 2-10 people
- **H9:** The free PWA as training tool creates a genuine market funnel, not just goodwill
- **H10:** Knowledge Base (organizational memory from resolved findings) justifies the €80/month Team AI premium

#### Section 2: Value Levers

Inspired by tblsum's L1-L6 system. Each lever represents a capability axis that drives product value:

| Lever                           | Capability                                          | Module                                        | Tier                       |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------- | -------------------------- |
| **L1: Core Analysis**           | Four Lenses — see variation, drill down, compare    | @variscout/core, @variscout/charts            | All (PWA subset)           |
| **L2: Investigation Workflow**  | Findings → hypotheses → actions → outcomes          | @variscout/hooks (useFindings, useHypotheses) | Standard+ (PWA: basic)     |
| **L3: AI Augmentation**         | NarrativeBar, CoScout, ChartInsightChips            | @variscout/core/ai, Azure AI Foundry          | Optional on any Azure plan |
| **L4: Team Collaboration**      | OneDrive sync, Teams tabs, Adaptive Cards, photos   | apps/azure (Teams SDK)                        | Team+                      |
| **L5: Organizational Learning** | Knowledge Base, resolved findings → AI Search index | Azure AI Search                               | Team AI                    |

Each lever includes:

- What it enables (capability)
- How it reinforces other levers (flywheel connection)
- Which hypotheses it validates

#### Section 3: Flywheel

VariScout's reinforcement loop — how each tier feeds the next:

```
Free PWA
  └→ Trains users in methodology (Four Lenses, investigation)
      └→ Trained users hit PWA limits (no save, 50K rows, 3 factors)
          └→ Upgrade to Azure Standard (€99/mo)
              └→ Professional analysis proves value (persistence, presentation)
                  └→ Team needs shared analysis
                      └→ Upgrade to Azure Team (€199/mo)
                          └→ Resolved findings accumulate
                              └→ Organization wants memory
                                  └→ Upgrade to Team AI (€279/mo)
                                      └→ Knowledge base reduces investigation time
                                          └→ More findings resolved → richer knowledge
                                              └→ Stickiness (switching cost = losing organizational memory)
```

**Key insight from tblsum:** The flywheel is not just "more features = more money." Each tier creates data/behavior that makes the next tier valuable. Standard creates saved analyses. Team creates shared findings. Team AI creates organizational memory. The knowledge compounds.

#### Section 4: Personas

Consolidated from existing `docs/02-journeys/ux-research.md`:

- Link to existing personas (Grace Mwangi et al.)
- Map each persona to their primary value lever and likely tier
- Note: no duplication — reference `ux-research.md` for details

#### Section 5: Value Ladder

Explicit upgrade progression with trigger moments:

| From     | To          | Trigger Moment                                                    | Value Proposition                  |
| -------- | ----------- | ----------------------------------------------------------------- | ---------------------------------- |
| Nothing  | PWA         | "I need to learn variation analysis"                              | Free, no signup, instant           |
| PWA      | Standard    | "I need to save my work / upload CSV / analyze 100K rows"         | Professional scale + persistence   |
| Standard | Standard+AI | "I want faster insights / need to explain findings to management" | AI narrates what you see           |
| Standard | Team        | "My colleague needs to see this analysis"                         | Shared storage + Teams integration |
| Team     | Team AI     | "We've solved this before — where's that finding?"                | Organizational memory              |

#### Section 6: Competitive Landscape

| Competitor           | Strength                                             | Weakness vs VariScout                                | VariScout Positioning                                                            |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Minitab**          | Full statistical suite (DOE, regression, predictive) | Expensive ($1,750/yr+), complex, no linked filtering | "20% of Minitab for 20% of the cost" — targets the variation investigation slice |
| **JMP**              | Strong visualization, DOE                            | Expensive, no real-time collaboration, no Teams      | Linked filtering + investigation workflow + team collaboration                   |
| **Power BI / Excel** | Ubiquitous, general-purpose                          | No quality methodology, no investigation workflow    | VariScout embeds the methodology — AI coaches, not just charts                   |
| **InfinityQS**       | Enterprise SPC, compliance                           | Heavy, expensive, server-based                       | Lightweight, browser-based, offline-first, customer-tenant data                  |

References `docs/01-vision/market-analysis.md` for TAM data. References ADR-019 for competitive AI positioning lessons.

---

### Deliverable 2: Tier Philosophy

**File:** `docs/08-products/tier-philosophy.md`

**Purpose:** The "why" companion to `feature-parity.md`. Explains the design principles behind tier gates.

#### Capability Maturity Model

Five levels of capability maturity, mapping to product tiers:

| Level                        | Tier                     | Relationship with Platform        | Core Principle                                                |
| ---------------------------- | ------------------------ | --------------------------------- | ------------------------------------------------------------- |
| **0: Learning**              | PWA (Free)               | User IS the intelligence          | "The struggle is the point" — guided frustration pedagogy     |
| **1: Professional**          | Azure Standard           | User has professional tools       | Persistence, scale, presentation                              |
| **2: AI-Augmented**          | Standard + AI (optional) | AI narrates and suggests          | "AI augments, never replaces" — faster insight, human control |
| **3: Collaborative**         | Azure Team               | Team shares and acts together     | Shared analysis, gemba evidence, team assignments             |
| **4: Learning Organization** | Azure Team AI            | Organization remembers and learns | Knowledge compounds across investigations and analysts        |

**Important:** AI is an orthogonal axis, not a sequential tier. A customer can have Standard+AI without Team features. The capability maturity model shows the _typical_ progression, not a mandatory path.

#### Tier Gate Principles

Explicit rules for feature placement:

1. **PWA gate:** "Free if it teaches the methodology without requiring persistence"
2. **Standard gate:** "Paid if it requires persistence, professional scale (100K rows, 6 factors), or closed-loop workflow"
3. **AI gate:** "Available on any Azure plan — AI is optional and customer-deployed, not tier-locked"
4. **Team gate:** "Team if it requires multi-user coordination, shared storage, or mobile gemba access"
5. **Team AI gate:** "Team AI if it creates or consumes organizational knowledge"

#### Upgrade Triggers

The moment the user hits each ceiling — what they experience and what they need:

| Trigger                                                              | User Experience                  | Next Tier       |
| -------------------------------------------------------------------- | -------------------------------- | --------------- |
| "I lost my analysis when I closed the browser"                       | Session-only PWA, no persistence | → Standard      |
| "I have 60K rows and 5 factors — PWA won't load this"                | Row/factor limits hit            | → Standard      |
| "I'm spending 20 minutes explaining this chart to my manager"        | Manual interpretation labor      | → Standard + AI |
| "My colleague needs to continue this investigation"                  | Single-user workflow             | → Team          |
| "We solved this exact problem 3 months ago but nobody remembers how" | No organizational memory         | → Team AI       |

---

### Deliverable 3: AI Experience Narrative

**File:** `docs/03-features/workflows/ai-experience-narrative.md`

**Purpose:** User-facing story of how the analysis experience changes across AI capability levels. Not architecture — experience.

#### Without AI (Baseline)

The analyst opens VariScout. Dashboard shows four linked charts (I-Chart, Boxplot, Pareto, Capability). Stats panel shows Cp, Cpk, mean, sigma. The analyst:

- Reads the I-Chart: "There's a shift around observation 47"
- Clicks the highest Pareto bar: linked filtering highlights that category across all charts
- Drills into the Boxplot: "Operator B has wider spread"
- Checks Cpk: "We're at 0.89 — below target"
- Creates a finding: "Operator B shows higher variation"
- Forms a hypothesis, investigates, resolves

**The human does all the interpretation.** This is the PWA experience and the Azure experience without AI enabled.

#### With AI Enabled (Any Azure Plan)

The same dashboard, but three new elements appear:

1. **NarrativeBar** (bottom of dashboard): "Your process shows 4 control violations. Operator B contributes 46% of total variation (η² = 0.46). Cpk is 0.89, below the 1.33 target."
   - The AI _narrates what you already see_ — but faster and in plain language
   - Useful for sharing with non-technical stakeholders

2. **ChartInsightChips** (on individual charts): "Drill into Operator B — highest variation contributor"
   - Contextual, per-chart suggestions for next actions
   - Based on statistical significance, not guessing

3. **CoScoutPanel** (investigation sidebar): Ask questions like "Why might Operator B show higher variation?"
   - Methodology-grounded responses (not generic AI)
   - Aware of the current statistical context (Cpk, η², drill path)
   - Suggests investigation tasks (gemba walk, hypothesis validation)

**Key moment:** The analyst notices the NarrativeBar mentions a Nelson Rule 2 violation they hadn't spotted. AI didn't replace their analysis — it caught something they missed.

#### With Knowledge Base (Team AI)

Everything above, plus:

4. **Organizational memory**: CoScout says "Last quarter, the packaging team investigated a similar Operator B pattern. They found it was caused by training gaps in the new shift schedule. See Finding #47."
   - Resolved findings from past investigations are indexed in Azure AI Search
   - CoScout retrieves relevant past findings automatically
   - New analysts benefit from institutional knowledge

5. **AI Report generation**: Export findings as an AI-generated quality engineering report
   - Structured narrative from investigation data
   - Suitable for management review or audit documentation

**Key moment:** A new team member starts an investigation and immediately gets context from 6 months of organizational learning, instead of starting from scratch.

#### Graceful Degradation

When AI is unavailable (no endpoint configured, network down, user toggles off):

- NarrativeBar shows shimmer then hides
- ChartInsightChips don't render
- CoScout panel is not available
- **All analysis features work identically** — AI enhances, never gates

---

### Deliverable 4: Journey Traceability Index

**File:** `docs/02-journeys/traceability.md`

**Purpose:** Cross-reference matrix mapping user journey steps to implementation code. Enables tracing features back to user needs and forward from code to user impact.

#### Forward Mapping (Journey → Code)

| Flow               | Step           | User Action                   | Package                          | Hook/Component                                   |
| ------------------ | -------------- | ----------------------------- | -------------------------------- | ------------------------------------------------ |
| **First Analysis** | Data entry     | Paste/upload data             | @variscout/hooks, @variscout/ui  | useDataIngestion, PasteScreenBase, ColumnMapping |
|                    | Column setup   | Map columns, set specs        | @variscout/ui                    | ColumnMapping, SpecEditor                        |
|                    | View dashboard | See four linked charts        | @variscout/ui                    | DashboardBase, DashboardGrid                     |
|                    | Explore        | Drill down, filter            | @variscout/hooks                 | useFilterNavigation, FilterBreadcrumb            |
|                    | Interpret      | Read stats, compare           | @variscout/ui, @variscout/charts | StatsPanelBase, IChart, Boxplot, Pareto          |
| **Investigation**  | Observe        | Create finding from chart     | @variscout/hooks                 | useFindings, useAnnotations                      |
|                    | Hypothesize    | Form and test hypotheses      | @variscout/hooks                 | useHypotheses, HypothesisTreeView                |
|                    | Validate       | Check η², gemba, expert input | @variscout/hooks                 | useControlViolations, useHypotheses              |
|                    | Act            | Create corrective actions     | @variscout/hooks                 | useFindings (addAction, completeAction)          |
|                    | Resolve        | Document outcome              | @variscout/hooks                 | useFindings (setOutcome)                         |
| **AI-Assisted**    | Narrative      | Read AI summary               | @variscout/hooks                 | useNarration, NarrativeBar                       |
|                    | Insight        | Follow chart suggestion       | @variscout/hooks                 | useChartInsights, ChartInsightChip               |
|                    | Converse       | Ask CoScout                   | @variscout/hooks                 | useAICoScout, CoScoutPanelBase                   |
| **Collaboration**  | Share          | Post to Teams channel         | apps/azure                       | Adaptive Cards, Teams SDK                        |
|                    | Sync           | Cloud file storage            | apps/azure                       | OneDrive/SharePoint sync                         |
|                    | Photo          | Capture gemba evidence        | apps/azure                       | Teams SDK media.selectMedia()                    |
| **Report**         | Generate       | Create scouting report        | @variscout/hooks, @variscout/ui  | useReportSections, ReportViewBase                |
|                    | Export         | Copy/share report             | @variscout/hooks                 | useChartCopy, copySectionAsHTML                  |

#### Backward Mapping (Code → Journey)

| Hook/Component      | Journey Steps Served                             | Tier                   |
| ------------------- | ------------------------------------------------ | ---------------------- |
| useDataIngestion    | First Analysis: Data entry                       | All                    |
| useFilterNavigation | First Analysis: Explore; Investigation: Validate | All                    |
| useFindings         | Investigation: all steps; Report: Generate       | Standard+ (PWA: basic) |
| useHypotheses       | Investigation: Hypothesize, Validate             | Standard+              |
| useNarration        | AI-Assisted: Narrative                           | Azure + AI             |
| useAICoScout        | AI-Assisted: Converse                            | Azure + AI             |
| DashboardBase       | First Analysis: View dashboard                   | All                    |
| ReportViewBase      | Report: Generate                                 | Standard+              |

---

### Cross-Linking Updates

After all 4 documents are created:

| File to Update                       | Change                              |
| ------------------------------------ | ----------------------------------- |
| `docs/01-vision/index.md`            | Add Business Bible link             |
| `docs/02-journeys/index.md`          | Add Traceability Index link         |
| `docs/03-features/index.md`          | Add AI Experience Narrative link    |
| `docs/08-products/index.md`          | Add Tier Philosophy link            |
| `docs/08-products/feature-parity.md` | Add "See Also" → tier-philosophy.md |
| `docs/01-vision/philosophy.md`       | Add "See Also" → business-bible.md  |
| `CLAUDE.md`                          | Update task-to-documentation table  |

## Execution Order

1. Business Bible (foundational — other docs reference it)
2. Tier Philosophy (depends on Bible's value levers)
3. AI Experience Narrative (references tier philosophy levels)
4. Journey Traceability Index (can parallel with 3)
5. Cross-linking updates (after all docs exist)

## Success Criteria

- Each new doc is scannable in under 2 minutes
- A reader can answer "why is feature X in tier Y?" by reading tier-philosophy.md
- A reader can trace any feature back to a business hypothesis via the Bible
- The AI experience narrative tells a compelling user story, not an architecture overview
- All cross-links resolve (no broken references)
