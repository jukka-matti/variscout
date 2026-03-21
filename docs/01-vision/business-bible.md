---
title: Business Bible
audience: [analyst, engineer]
category: reference
status: stable
related: [strategy, hypotheses, value-levers, flywheel, personas, pricing]
---

# Business Bible

Strategic hypotheses, value levers, and growth flywheel for VariScout.

---

## Strategic Hypotheses

Each hypothesis has a statement, supporting evidence, invalidation criteria, and current status.

### H1: The 20% Usage Gap

**Statement:** Most quality professionals use <20% of their SPC tool's capabilities (Minitab, JMP) but pay 100% of the price. A tool that covers just the variation investigation slice can win on value.

**Evidence for:**

- Market analysis confirms VariScout targets the "lightweight quality analytics" segment (~10-15% of $1.05B SPC market)
- Minitab pricing (~€135-155/user/month) vs VariScout unlimited users from €79/month
- Grace Mwangi persona: "I calculate averages, standard deviations, make charts... I need maybe 20% of what Minitab offers"

**Evidence against:** None observed yet (pre-launch).

**Invalidation criteria:** If >50% of trial users request DOE, hypothesis testing, or response surface features within 6 months of launch, the gap is narrower than assumed.

**Status:** Supported (persona research + competitive pricing confirms gap)

---

### H2: Linked Filtering Is the Differentiator

**Statement:** Cross-chart linked filtering (click one chart, all others respond) is the primary "magic moment" that separates VariScout from Excel-based workflows.

**Evidence for:**

- UX research: "Linked visualization is the 'magic'" (Key Insight #4)
- Grace: "If I click on Farm C in a chart, highlight all the data points from Farm C across all my charts"
- Four Lenses methodology requires parallel views — linked filtering is the technical expression

**Evidence against:** None observed.

**Invalidation criteria:** If user analytics show <30% of sessions use cross-chart filtering within first 3 analyses, the feature is not delivering perceived value.

**Status:** Supported (UX research)

---

### H3: Offline-First Is Non-Negotiable

**Statement:** Quality professionals in manufacturing and agriculture work at locations with unreliable internet. Full offline capability is a hard requirement, not a nice-to-have.

**Evidence for:**

- UX research: "Offline-first is non-negotiable" (Key Insight #1)
- Grace: "Internet is not reliable at field sites... We tried cloud tools — beautiful software, but useless"
- PWA architecture enables full offline analysis
- Azure App uses IndexedDB + cached responses

**Evidence against:** None.

**Invalidation criteria:** If >80% of users are always-online enterprise desktop users, offline capability is over-invested relative to need.

**Status:** Supported (UX research + architecture decision ADR-004)

---

### H4: Privacy as Feature

**Statement:** Local-only data processing (no server transmission) is a competitive advantage, not a limitation — especially for quality data containing supplier performance and process secrets.

**Evidence for:**

- Grace: "Our farm yield data, our supplier quality scores... that's sensitive"
- UX research: "Privacy = competitive advantage" (Key Insight #2)
- Azure Managed Application deploys to customer's own tenant — data sovereignty by design
- EU AI Act and ISO 9001:2026 favor transparent, auditable architectures

**Evidence against:** None.

**Invalidation criteria:** If enterprise buyers consistently request centralized cloud analytics (multi-site dashboards, cross-tenant aggregation), local-only becomes a limitation.

**Status:** Supported

---

### H5: Free PWA Drives Paid Conversion

**Statement:** A genuinely useful free tool (PWA) creates awareness and demand for the paid Azure App. The free-to-paid funnel is the primary growth engine.

**Evidence for:**

- Market analysis Layer 2: Training funnel TAM €5-15M/year
- GTM: "Try it free at variscout.com. When you're ready for your team, get it on Azure Marketplace."
- ADR-007: PWA repositioned as free training tool; same funnel role as shelved Excel Add-in at zero marginal cost

**Evidence against:** None (pre-launch).

**Invalidation criteria:** If <5% of PWA users visit the Azure Marketplace listing within 12 months, the funnel is broken.

**Status:** Untested

---

### H6: Per-Deployment Pricing Beats Per-User

**Statement:** Unlimited users per deployment (from €79/month) creates better value perception for teams than per-seat pricing, which penalizes collaboration.

**Evidence for:**

- ADR-007: "A team of 3+ saves money vs Minitab immediately. For a team of 10, it's 10× cheaper."
- Managed Applications enforce per-deployment, not per-user — no mechanism to enforce user counts
- UX research: cost sensitivity is extreme for SMEs

**Evidence against:** Enterprise buyers may expect per-user pricing and find flat pricing suspicious.

**Invalidation criteria:** If >30% of enterprise evaluation conversations stall on pricing model confusion.

**Status:** Supported (architectural alignment)

---

### H7: The Struggle Is the Point (PWA)

**Statement:** Removing AI from the free PWA makes it a better learning tool. Guided frustration builds statistical intuition that shortcuts would undermine.

**Evidence for:**

- Philosophy: "The Sock Mystery teaches through guided frustration"
- Grace: "A tool that helps me analyze faster — yes. A tool that makes decisions for me — I'm not sure I can trust that"
- EDAScout's chatbot rollback (v6→v7) confirms AI friction risk
- ADR-019: "PWA stays AI-free. The free PWA is a learning tool where 'the struggle is the point.'"

**Evidence against:** Students may expect AI assistance as baseline in 2026+.

**Invalidation criteria:** If PWA completion rates (first analysis → insight) are <20% and exit surveys cite "too hard" as primary reason.

**Status:** Supported (philosophy + competitive lessons)

---

### H8: AI Augments, Never Replaces — Collaborator Model

**Statement:** In the Azure App, AI should explain deterministic conclusions AND suggest concrete next actions. The statistical engine is the authority; AI is the collaborator. The analyst always confirms before any action is taken.

**Evidence for:**

- ADR-019: "AI explains deterministic conclusions, it doesn't generate competing ones"
- ADR-027: Evolution from narrator to collaborator — existing patterns (drill suggestions, investigation coaching) already suggest actions; making them clickable is natural progression
- Minitab AI (April 2025) adopted the same approach: "AI you can trust"
- ISO/IEC 42001 human oversight requirements align with this pattern — human confirmation satisfies oversight
- EDAScout rollback validates that auto-acting AI creates user friction; VariScout avoids this by requiring confirmation
- ChartInsightChip drill suggestions, investigation coaching, and suggested questions already constitute action suggestions — the collaborator model formalizes what exists

**Evidence against:** None. The confirmation requirement prevents the overreach that caused EDAScout's rollback.

**Invalidation criteria:** If confirmation fatigue emerges (users clicking "confirm" reflexively without reading), the interaction model needs refinement — perhaps trusted actions that skip confirmation after repeated use.

**Status:** Supported (ADR-019 + ADR-027 + competitor validation + existing implementation evidence)

---

### H9: Closed-Loop Findings Create Moat

**Statement:** VariScout's investigation workflow (detect → investigate → act → verify with measured Cpk) builds a knowledge base that competitors cannot replicate. After 50+ resolved findings, AI has genuine organizational knowledge.

**Evidence for:**

- ADR-019: "After 50+ resolved findings, the AI has real organizational knowledge"
- ADR-027: AI collaborator model means knowledge feeds back into actionable suggestions (not just narration) — "last time this happened, nozzle replacement resolved it 90% of the time" becomes a clickable action
- Traditional FMEA uses subjective RPN scores (1-10 guesses). VariScout findings carry actual Cpk values and verified outcomes.
- No competitor captures the full PDCA cycle with measurement-backed outcomes

**Evidence against:** Requires sustained usage — teams that resolve <10 findings/year won't reach critical mass.

**Invalidation criteria:** If average resolved findings per tenant is <5 after 12 months of usage, the knowledge flywheel doesn't spin.

**Status:** Supported (architecture delivered, knowledge accumulation untested at scale)

---

### H10: ~~Team AI Premium Justifies Itself~~ — Superseded by ADR-033

**Status:** Superseded by [ADR-033](../07-decisions/adr-033-pricing-simplification.md). The Team AI tier was removed — AI is now included in all plans, and the Knowledge Base moved to the Team plan. The hypothesis is no longer testable as designed because the €80 premium no longer exists.

**Original statement:** Organizations investing in AI Knowledge Base would see enough investigation time savings to justify the €80/month premium over Azure Team (€279 vs €199).

**Why superseded:** The three-plan model created upsell friction. Simplifying to two plans (Standard €79, Team €199) with AI included in all plans removes the barrier to AI adoption and pairs the Knowledge Base with team collaboration features where it naturally belongs.

---

## Value Levers

Five layers of value, each building on the previous:

### L1: Core Analysis

**What:** Four Lenses (I-Chart, Boxplot, Pareto, Capability) + linked filtering + drill-down.

**Why it matters:** Reduces 4-hour Excel analysis to <1 hour. The fundamental value proposition.

**Available in:** All products (PWA + all Azure plans).

### L2: Investigation Workflow

**What:** Findings → Hypotheses → Actions → Outcomes → Verification (5-status closed-loop).

**Why it matters:** Transforms analysis from "interesting chart" into "measured improvement." Creates audit trail.

**Available in:** Full workflow in Azure (all plans). PWA has simplified 3-status findings.

### L3: AI Augmentation

**What:** NarrativeBar, ChartInsightChips, CoScout — AI explains stats in plain language, suggests next steps.

**Why it matters:** Bridges the gap between statistical output and actionable insight. Non-statisticians can understand variation analysis results.

**Available in:** Azure plans (optional, customer-deployed Azure AI Foundry).

### L4: Team Collaboration + Knowledge

**What:** Teams integration, OneDrive/SharePoint sync, mobile gemba access, photo evidence, Adaptive Cards, AI Knowledge Base (Azure AI Search), cross-project queries, document retrieval, measurement-backed organizational memory.

**Why it matters:** Quality is a team sport. Sharing findings, assigning actions, reviewing on the shop floor, and building organizational knowledge multiplies impact. Organizations stop rediscovering the same root causes.

**Available in:** Azure Team plan.

---

## Flywheel

```
                    ┌──────────────────┐
                    │   Free PWA       │
                    │ (Training Tool)  │
                    └────────┬─────────┘
                             │ trains users in methodology
                             ▼
                    ┌──────────────────┐
                    │  Azure Standard  │
                    │  (€79/month)     │◄──── "I need file upload, save,
                    └────────┬─────────┘      Performance Mode, AI"
                             │ team needs collaboration + knowledge
                             ▼
                    ┌──────────────────┐
                    │   Azure Team     │
                    │  (€199/month)    │◄──── "I need Teams, mobile,
                    └────────┬─────────┘      shared storage, Knowledge Base"
                             │
                             │ resolved findings feed back
                             ▼
                    ┌──────────────────┐
                    │ Knowledge Base   │
                    │ (50+ findings)   │──── reinforces investigation
                    └──────────────────┘     quality → more resolved
                                             findings → deeper knowledge
```

**Reinforcement loops:**

1. **Training → Demand:** Free PWA teaches methodology → users want full features → Azure adoption
2. **Usage → Stickiness:** More analyses saved → harder to switch → lower churn
3. **Findings → Knowledge:** More resolved findings → better AI suggestions → faster investigations → more resolved findings
4. **Team → Expansion:** One team succeeds → adjacent teams adopt → site-wide deployment

---

## Personas

Consolidated from [UX Research](../02-journeys/ux-research.md) and [Journey Personas](../02-journeys/index.md).

| Persona             | Role                           | Primary Need                   | Entry Point        | Product Fit     |
| ------------------- | ------------------------------ | ------------------------------ | ------------------ | --------------- |
| **Grace Mwangi**    | QA Manager (agri-food)         | Reduce 4h Excel analysis to 1h | Google, referral   | PWA → Standard  |
| **Raj Sharma**      | Quality Engineer (textile)     | Real-time variation monitoring | Direct, LinkedIn   | Standard → Team |
| **Carlos Mendez**   | Training Coordinator (coffee)  | Educational tool for farmers   | Course link        | PWA (free)      |
| **Green Belt Gary** | Quality Engineer, GB certified | Better tools than Excel        | Google, LinkedIn   | PWA → Standard  |
| **Curious Carlos**  | Operations Supervisor          | Understand variation           | YouTube, TikTok    | PWA → Standard  |
| **OpEx Olivia**     | OpEx Manager                   | Tools for her team             | Referral, LinkedIn | Team            |
| **Student Sara**    | LSS trainee                    | Learn methodology              | Course link        | PWA (free)      |
| **Evaluator Erik**  | IT/Procurement                 | Assess for organization        | Direct link        | Team            |
| **Trainer Tina**    | LSS Trainer/Consultant         | Tools for courses & clients    | LinkedIn           | PWA + Standard  |
| **Field Fiona**     | Field Quality Engineer         | Review charts on the go        | Teams mobile       | Team            |

---

## Value Ladder

The explicit progression from free to maximum value, with the trigger moments that drive each upgrade.

| From         | To                    | Trigger Moment                                                                           | What They Gain                                                            |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| —            | **PWA (Free)**        | Finds VariScout via search, training, or referral                                        | Core analysis, Four Lenses, sample datasets                               |
| **PWA**      | **Standard (€79/mo)** | Hits PWA ceiling: needs file upload, save, Performance Mode, AI, >3 factors              | Full analysis suite + CoScout AI, persistence, 6 factors, 250K rows       |
| **Standard** | **Team (€199/mo)**    | Team needs collaboration: shared files, mobile access, Teams integration, Knowledge Base | OneDrive, SharePoint, Teams tabs, mobile gemba, photos, AI Knowledge Base |

AI features (NarrativeBar, ChartInsightChips, CoScout) are included in all Azure plans — the customer deploys their own Azure AI Foundry resources. The Team plan adds the managed Knowledge Base layer on top.

---

## Competitive Landscape

| Segment         | Incumbent                    | VariScout Advantage                                                      | VariScout Weakness                                      |
| --------------- | ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Full-suite SPC  | Minitab (~€135-155/user/yr)  | 10× cheaper for teams, zero install, unlimited users                     | Fewer statistical tests (no DOE, no hypothesis testing) |
| Enterprise QMS  | InfinityQS ($50-100/user/mo) | No implementation cost, instant ARM deploy                               | No MES/ERP integration                                  |
| Free tools      | R, Python, Google Sheets     | No coding required, guided workflows                                     | Less flexible                                           |
| Training tools  | Minitab academic licenses    | Free PWA, browser-based, offline-first                                   | Less brand recognition                                  |
| AI-enhanced SPC | Minitab AI (April 2025)      | Closed-loop findings (Cpk before/after), team knowledge, unlimited users | Smaller brand, newer product                            |

**VariScout's moat:** Measurement-backed organizational knowledge. Minitab is single-user desktop software. InfinityQS is enterprise-heavy. Neither captures the full PDCA cycle with verified outcomes feeding an AI knowledge base.

**TAM:** €105-200M/year total (Layer 1: Quality Analytics €90-160M, Layer 2: Training €5-15M, Layer 3: Excel €10-25M). SAM: €10-30M. SOM Year 1-3: €0.1-1M. See [Market Analysis](market-analysis.md) for full breakdown.

**Regulatory tailwind:** ISO 9001:2026 (DIS approved, publication Sept 2026) emphasizes digitalization and data-driven decisions. EU AI Act high-risk obligations (effective August 2, 2026) require human oversight and transparency — VariScout's deterministic-first architecture is naturally compliant.

---

## See Also

- [Philosophy](philosophy.md) — Four Lenses, Two Voices, EDA for Process Improvement
- [Market Analysis](market-analysis.md) — TAM, competitive positioning, pricing comparison
- [UX Research](../02-journeys/ux-research.md) — Persona interviews, JTBD
- [Tier Philosophy](../08-products/tier-philosophy.md) — Why features are gated where they are
- [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md) — Distribution strategy
- [ADR-019](../07-decisions/adr-019-ai-integration.md) — AI integration decision
