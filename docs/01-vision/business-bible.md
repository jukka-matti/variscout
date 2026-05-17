---
title: Business Bible
audience: [analyst, engineer, business]
category: reference
status: stable
last-reviewed: 2026-05-17
related: [strategy, hypotheses, value-levers, flywheel, pricing, single-sku]
---

# Business Bible

The strategy doc. What VariScout is betting on, what constraints we accept,
how the unit economics work, and how the long-term moat compounds.

Companion to the [Positioning Bible](positioning.md) (how we talk about it),
the [Constitution](constitution.md) (what we believe), and the canonical V1
architecture spec at [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../superpowers/specs/2026-05-16-wedge-architecture-design.md) plus [ADR-082](../07-decisions/adr-082-wedge-architecture.md).

---

## 1. The bet

> **One product, one price, one pitch. €120/month per Azure tenant. The
> investigation specialist's workspace, delivered through Azure Marketplace.**

VariScout is betting that the right unit of value in 2026 process-improvement
software is _the project a specialist runs with their team_, priced at the
_deployment level_, sold through _Marketplace not enterprise sales_.

The 2026 SaaS default is per-seat licensing with feature-gated tiers and an
enterprise sales motion. VariScout takes the opposite stance on all three:

- **Per-deployment, not per-seat.** Adding a teammate to a project is free.
  Collaboration is unpenalized. The buyer's marginal user cost is zero.
- **Single SKU, not feature-gated tiers.** Every paid customer gets the full
  product. Access is membership-scoped per project, inside the product. See
  [Membership Philosophy](../08-products/membership-philosophy.md).
- **Marketplace, not enterprise sales.** Self-serve install via Azure
  Marketplace Managed Application. Customer-owned data inside their own
  tenant. Procurement happens through Azure billing, not vendor contracts.

This is a deliberately narrow ICP at V1: improvement specialists running
projects with their invited team. Process owners running portfolios, enterprise
OpEx programs across sites, automated data pipelines, and multi-persona role
matrices are deferred to **VariScout Process** — a future, separate product
on the same roadmap. See §7.

---

## 2. Strategic hypotheses

Each hypothesis has a statement, supporting evidence, invalidation criteria,
and current status.

### H1: The 20% Usage Gap

**Statement:** Most quality professionals use <20% of their SPC tool's
capabilities (Minitab, JMP) but pay 100% of the price. A tool that covers
just the variation-investigation slice can win on value.

**Evidence for:**

- Market analysis confirms VariScout targets the "structured process
  investigation" segment (~10–15% of $1.05B SPC market).
- Minitab pricing (~€135-155/user/month) vs VariScout at €120/month total
  per Azure tenant, unlimited users.
- Grace Mwangi persona: "I calculate averages, standard deviations, make
  charts… I need maybe 20% of what Minitab offers."

**Evidence against:** None observed yet (pre-launch).

**Invalidation criteria:** If >50% of trial users request DOE, hypothesis
testing, or response-surface features within 6 months of launch, the gap is
narrower than assumed.

**Status:** Supported (persona research + competitive pricing confirms gap).

---

### H2: Linked Filtering Is the Differentiator

**Statement:** Cross-chart linked filtering (click one chart, all others
respond) is the primary "magic moment" that separates VariScout from
Excel-based workflows.

**Evidence for:**

- UX research: "Linked visualization is the 'magic'" (Key Insight #4).
- Grace: "If I click on Farm C in a chart, highlight all the data points from
  Farm C across all my charts."
- Four Lenses methodology requires parallel views — linked filtering is the
  technical expression.

**Evidence against:** None observed.

**Invalidation criteria:** If user analytics show <30% of sessions use
cross-chart filtering within first 3 analyses, the feature is not delivering
perceived value.

**Status:** Supported (UX research).

---

### H3: Offline-First Is Non-Negotiable

**Statement:** Quality professionals in manufacturing and agriculture work at
locations with unreliable internet. Full offline capability is a hard
requirement, not a nice-to-have.

**Evidence for:**

- UX research: "Offline-first is non-negotiable" (Key Insight #1).
- Grace: "Internet is not reliable at field sites… We tried cloud tools —
  beautiful software, but useless."
- PWA architecture enables full offline analysis.
- Azure App uses IndexedDB + cached responses.

**Evidence against:** None.

**Invalidation criteria:** If >80% of users are always-online enterprise
desktop users, offline capability is over-invested relative to need.

**Status:** Supported (UX research + architecture decision ADR-004).

---

### H4: Privacy as Feature

**Statement:** Customer-owned data processing (no vendor cloud transit) is a
competitive advantage, not a limitation — especially for quality data
containing supplier performance and process secrets.

**Evidence for:**

- Grace: "Our farm yield data, our supplier quality scores… that's sensitive."
- UX research: "Privacy = competitive advantage" (Key Insight #2).
- Azure Marketplace Managed Application deploys to customer's own tenant —
  data sovereignty by design (ADR-059).
- Project-membership ACLs sharpen the privacy story further: even inside the
  tenant, project-formal data is scoped to invited members only.
- EU AI Act and ISO 9001:2026 favor transparent, auditable architectures.

**Evidence against:** None.

**Invalidation criteria:** If enterprise buyers consistently request
centralized cloud analytics (multi-site dashboards, cross-tenant aggregation),
customer-owned becomes a limitation — and that's the signal to ship VariScout
Process.

**Status:** Supported.

---

### H5: Free PWA Drives Paid Conversion

**Statement:** A genuinely useful free tool (PWA) creates awareness and demand
for the paid Azure App. The free-to-paid funnel is the primary growth engine.

**Evidence for:**

- Market analysis Layer 2: Training funnel TAM €5–15M/year.
- GTM: "Try it free at variscout.com. When you're ready for your team, get it
  on Azure Marketplace."
- ADR-007: PWA repositioned as free training tool; same funnel role as the
  shelved Excel Add-in at zero marginal cost.

**Evidence against:** None (pre-launch).

**Invalidation criteria:** If <5% of PWA users visit the Azure Marketplace
listing within 12 months, the funnel is broken.

**Status:** Untested.

---

### H6: Per-Deployment Pricing Beats Per-User

**Statement:** Unlimited users per deployment (€120/month) creates better
value perception for teams than per-seat pricing, which penalizes
collaboration.

**Evidence for:**

- ADR-007: "A team of 3+ saves money vs Minitab immediately. For a team of
  10, it's 10× cheaper."
- Azure Marketplace Managed Applications enforce per-deployment, not
  per-user — no mechanism to enforce user counts.
- UX research: cost sensitivity is extreme for SMEs and CI departments.
- The V1 single-SKU pivot collapses the prior €79/€199 tier split into a
  single €120 SKU. €120 is still per-deployment, honoring this hypothesis.
  The tier collapse is a refinement of H6, not a contradiction.

**Evidence against:** Enterprise buyers may expect per-user pricing and find
flat pricing suspicious; some procurement processes are built around seat
counts.

**Invalidation criteria:** If >30% of enterprise evaluation conversations
stall on pricing-model confusion or per-seat-expectation friction.

**Status:** Supported (architectural alignment); reinforced by the V1 single-SKU
pivot.

---

### H7: The Struggle Is the Point (PWA)

**Statement:** Removing AI from the free PWA makes it a better learning tool.
Guided frustration builds statistical intuition that shortcuts would
undermine.

**Evidence for:**

- Philosophy: "The Sock Mystery teaches through guided frustration."
- Grace: "A tool that helps me analyze faster — yes. A tool that makes
  decisions for me — I'm not sure I can trust that."
- EDAScout's chatbot rollback (v6→v7) confirms AI friction risk.
- ADR-019: "PWA stays AI-free. The free PWA is a learning tool where 'the
  struggle is the point.'"

**Evidence against:** Students may expect AI assistance as baseline in 2026+.

**Invalidation criteria:** If PWA completion rates (first analysis → insight)
are <20% and exit surveys cite "too hard" as primary reason.

**Status:** Supported (philosophy + competitive lessons).

---

### H8: AI Augments, Never Replaces — Collaborator Model

**Statement:** In the Azure App, AI explains deterministic conclusions AND
suggests concrete next actions. The statistical engine is the authority; AI
is the collaborator. The analyst always confirms before any action is taken.

**Evidence for:**

- ADR-019: "AI explains deterministic conclusions, it doesn't generate
  competing ones."
- ADR-027: Evolution from narrator to collaborator — existing patterns (drill
  suggestions, investigation coaching) already suggest actions; making them
  clickable is natural progression.
- Minitab AI (April 2025) adopted the same approach: "AI you can trust."
- ISO/IEC 42001 human oversight requirements align with this pattern — human
  confirmation satisfies oversight.
- EDAScout rollback validates that auto-acting AI creates user friction;
  VariScout avoids this by requiring confirmation.
- ChartInsightChip drill suggestions, investigation coaching, and suggested
  questions already constitute action suggestions — the collaborator model
  formalizes what exists.

**Evidence against:** None. The confirmation requirement prevents the
overreach that caused EDAScout's rollback.

**Invalidation criteria:** If confirmation fatigue emerges (users clicking
"confirm" reflexively without reading), the interaction model needs
refinement — perhaps trusted actions that skip confirmation after repeated
use.

**Status:** Supported (ADR-019 + ADR-027 + competitor validation + existing
implementation evidence).

---

### H9: Closed-Loop Findings Create Moat

**Statement:** VariScout's investigation workflow (detect → investigate →
act → verify with measured Cpk) builds a knowledge base that competitors
cannot replicate. After 50+ resolved findings, AI has genuine organizational
knowledge.

**Evidence for:**

- ADR-019: "After 50+ resolved findings, the AI has real organizational
  knowledge."
- ADR-027: AI collaborator model means knowledge feeds back into actionable
  suggestions (not just narration) — "last time this happened, nozzle
  replacement resolved it 90% of the time" becomes a clickable action.
- Traditional FMEA uses subjective RPN scores (1–10 guesses). VariScout
  findings carry actual Cpk values and verified outcomes.
- No competitor captures the full PDCA cycle with measurement-backed outcomes.

**Evidence against:** Requires sustained usage — teams that resolve <10
findings/year won't reach critical mass.

**Invalidation criteria:** If average resolved findings per tenant is <5
after 12 months of usage, the knowledge flywheel doesn't spin.

**Status:** Supported (architecture delivered, knowledge accumulation untested
at scale).

---

### H10: Single SKU Beats Tier Ladder

**Statement:** A single paid product at €120/month converts better than a
tiered ladder (Standard / Team / Enterprise). The decision moment at purchase
matters more than the optionality of "more SKU per customer."

**Evidence for:**

- ADR-082: ~28 files of tier-gating logic retire; sales conversation collapses
  to one sentence; customer success doesn't need plan-mapping.
- 2026 SaaS counter-evidence is mounting (Linear, Basecamp, Plausible all
  single-SKU and growing) — the tier-ladder norm is not as load-bearing as
  the SaaS-playbook canon suggests. Specific data points worth re-verifying
  before V1 launch: Linear scaled from $0 to a reported $130M+ ARR (2019–2024)
  on a single per-user/month plan with no enterprise tier until late in that
  arc — the ladder was added at scale, not used to drive initial growth.
  Plausible has publicly reported sustained 30%+ year-over-year ARR growth on
  a flat single-tier price structure that varies only by site volume, not by
  feature gates. Both citations should be sourced against the vendors' own
  public reporting before being used in external marketing; cited here as
  defensible patterns, not as audited numbers.
- The retired H10 ("Team AI Premium Justifies Itself") was already
  superseded by ADR-033's two-tier collapse; the V1 single-SKU pivot takes
  the simplification one further step.

**Evidence against:** Loses the €199 upsell lever per customer. ARPU at V1
caps at €120/mo until VariScout Process ships.

**Invalidation criteria:** If conversion rate from PWA → Azure stays below
1% over 6 months _and_ existing-customer surveys cite "wanted a cheaper
option" as primary objection, single-SKU was too aggressive.

**Status:** New hypothesis (V1 single-SKU pivot 2026-05-16); will be tested
by V1 customer validation conversations (see §6).

---

## 3. Unit economics

### 3.1 Pricing

**€120/month per Azure tenant.** Unlimited org users. Unlimited projects.
Full analytical capability.

The price sits above the retired €79 Standard and below the retired €199
Team. Reasoning:

- €120/mo = €1,440/year sits slightly above the typical €1,000 SME purchasing
  threshold, which the V1 product scope (full DMAIC arc, project membership,
  Knowledge Catalyst) justifies.
- A team of 3+ on VariScout is still <10% the cost of Minitab seats.
- Customer-deployed AI Foundry resources are the customer's Azure cost, not
  ours — VariScout's marginal serving cost stays near zero.

### 3.2 What €120 buys

- Full analytical surface (every chart mode, capability, ANOVA, OLS, Evidence
  Map, control limits).
- Full Project lifecycle (Charter → Approach → Sustainment), Report,
  signoff workflow.
- CoScout AI (NarrativeBar, ChartInsightChips, conversation, voice input),
  customer deploys their own Azure AI Foundry.
- Project-membership ACLs (Lead / Member / Sponsor).
- Blob Storage sync in customer's tenant.
- Knowledge Catalyst — organizational memory accumulating across projects.

### 3.3 Implications for growth

- **Per-tenant ARPU cap is €120/mo (€1,440/year) until VariScout Process
  ships.** This is the V1 economic ceiling. Volume + low churn carries the
  business until Process unlocks higher ARPU enterprise SKU.
- **Customer success is light.** Same product everywhere; no plan-mapping; no
  feature anxiety. Support load scales with volume, not with SKU complexity.
- **Marketing is one message.** No "which plan is right for you" worksheet.
  One landing page. One Marketplace listing.
- **Sales motion is self-serve.** Marketplace install → free PWA evaluation →
  Azure deploy. No enterprise sales cycle until VariScout Process arrives.

### 3.4 Customer-owned data is non-negotiable

VariScout's cloud cost stays near zero because we don't host customer data,
AI inference, or storage. The customer's Azure subscription pays for those.
This is also the architectural foundation of H4 (Privacy as Feature) — the
two are linked by design, not by accident.

If VariScout ever centralized data or inference, both the cost structure and
the H4 sellable-privacy story collapse. Customer-owned is load-bearing.

---

## 4. Value Levers

Five layers of value, each building on the previous. All are part of the
single €120 SKU — they are not tier-gated.

### L1: Core Analysis

**What:** Four Lenses (I-Chart, Boxplot, Pareto, Capability) + linked
filtering + drill-down.

**Why it matters:** Reduces a 4-hour Excel analysis to <1 hour. The
fundamental value proposition.

**Available in:** All products (PWA + Azure single SKU).

### L2: Investigation Workflow

**What:** Findings → Hypotheses → Measurement Plans → Actions → Outcomes →
Verification (5-status closed-loop investigation).

**Why it matters:** Transforms analysis from "interesting chart" into
"measured improvement." Creates audit trail.

**Available in:** Full workflow in Azure single SKU. PWA has simplified
3-status findings without persistence.

### L3: AI Augmentation

**What:** NarrativeBar, ChartInsightChips, CoScout (chat + voice input) — AI
explains stats in plain language, suggests next steps, references
investigation history.

**Why it matters:** Bridges the gap between statistical output and actionable
insight. Non-statisticians can understand variation analysis results.

**Available in:** Azure single SKU (optional, customer-deployed Azure AI
Foundry).

### L4: Team Collaboration via Project Membership

**What:** Project-membership ACLs (Lead / Member / Sponsor), invite flow,
shared Blob Storage in customer's tenant, photo evidence in findings, action
assignment, sync notifications, mobile gemba access.

**Why it matters:** Quality is a team sport. Sharing findings, assigning
actions, reviewing on the shop floor, capturing gemba observations multiplies
impact. Membership scoping keeps Project-formal data private to invited
members.

**Available in:** Azure single SKU.

### L5: Knowledge Catalyst

**What:** Organizational memory — measurement-backed organizational knowledge
that accumulates across projects. After 50+ resolved findings, CoScout
references prior projects when suggesting Hypotheses for new ones.

**Why it matters:** This is the long-term moat (H9). The knowledge layer
gets more valuable as the customer accumulates resolved investigations —
making churn increasingly expensive for the customer.

**Available in:** Azure single SKU. Knowledge Catalyst surfaces inside the
Investigation tab when prior tenant history is available; no separate
upgrade required.

---

## 5. The flywheel

```
                    ┌──────────────────┐
                    │   Free PWA       │
                    │ (Training Tool)  │
                    └────────┬─────────┘
                             │ teaches the methodology;
                             │ paywall-free pedagogy
                             ▼
                    ┌──────────────────┐
                    │  VariScout       │
                    │  (€120/month,    │◄──── "I need to save this,
                    │  Azure tenant)   │      invite my team, get
                    │                  │      AI explanations, prove
                    │  Charter →       │      the Cpk improvement"
                    │  Sustainment     │
                    │  + Knowledge     │
                    │  Catalyst        │
                    └────────┬─────────┘
                             │ resolved projects feed Knowledge Catalyst
                             ▼
                    ┌──────────────────┐
                    │ Knowledge Layer  │
                    │ (50+ findings)   │──── reinforces investigation
                    └──────────────────┘     quality → more resolved
                                             findings → deeper knowledge
                                             → lower churn
```

**Reinforcement loops:**

1. **Training → Demand.** Free PWA teaches methodology → users want full
   features → Azure adoption.
2. **Usage → Stickiness.** More projects closed → harder to switch → lower
   churn.
3. **Findings → Knowledge.** More resolved findings → better AI suggestions
   → faster investigations → more resolved findings.
4. **Team → Expansion.** One team succeeds → adjacent teams in the same
   tenant adopt (already paid for; zero marginal user cost) → site-wide
   deployment.
5. **Trainers → Reach.** More certified trainers → more courses + consulting
   → more VariScout users → more future trainers.

The flywheel doesn't depend on cross-customer data — knowledge stays in the
tenant. Customer-owned is preserved at every loop.

---

## 6. Three preconditions before V1 engineering commits

VariScout will not commit V1 engineering until these three gates clear. Per the
V1 architecture spec §8, they are not a checklist — they are the bet test.
Failing any one of them is grounds to revise the V1 plan, not to soften the
bar. The same three gates economically stress-test H6 + H10 before the codebase
reorganizes around them.

### 6.1 Migration math (30-minute exercise)

Model: what % of current revenue is €79 Standard accounts vs €199 Team
accounts? What's the churn risk on €79 → €120 (price increase, real) vs
€199 → €120 (price decrease, real revenue hit per account)? Pick a
grandfathering window option (grandfather, sunset, one-time conversion).

If the financial sensitivity is bad enough, the V1 plan needs adjustment
(grandfather longer, stage the transition).

### 6.2 Azure AD invitation constraint — accepted as feature

Confirm: customers needing external collaborators (consulting MBBs, multi-org
SMEs) are out of V1 ICP. Check pipeline / existing customer mix.

If a meaningful slice of pipeline depends on cross-org collaboration, the
SaaS distribution path becomes a precondition, not a future option — and
that's a re-scope, not a tweak.

### 6.3 Customer validation — the bet test

Pitch the V1 product end-to-end to a real improvement specialist (Six Sigma
BB, CI engineer, or quality manager — the named ICP). The gate fails if they
cannot articulate, in their own words, "yes, that's the product I want for
my team." A 30-minute call is the minimum-viable bet test, not the standard
— multiple specialist conversations strengthen the signal, and a single soft
"sure, sounds interesting" is not a pass.

If they push back hard on something foundational ("I really need
process-owner monitoring," "I really need cross-tenant collaboration"),
pause and revisit the V1 plan — don't reframe the pushback as an edge case.

These three checks test the economic + ICP + product-fit assumptions of the
V1 plan before code-level commitment.

---

## 7. Two products on a roadmap

**Today: VariScout** (this doc's primary product) — €120/month, Azure
tenant-wide, project-membership ACLs, single SKU, improvement-specialist ICP.

**Future: VariScout Process** — an enterprise product for orgs with ongoing
process ownership across multiple lines, sites, or business units. Different
customer (process owners, OpEx VPs, plant managers). Different unit economics
(higher ARPU, multi-Hub portfolios, automated data pipelines, 4-persona
routing). Different sales motion (enterprise, not Marketplace-first). Pricing
TBD.

VariScout Process is **not announced in V1 marketing.** It exists in this
doc and in the V1 architecture spec as a named-future commitment so that:

- Engineers know what V1 is deliberately not building (auto pipelines,
  multi-persona routing, multi-Hub portfolios all defer to Process).
- Sales / customer-success have a coherent answer when prospects ask "do you
  handle the process-ownership use case?" — "Not in V1; we're building that
  as a separate product."
- The two-product story is the honest expansion path: V1 plays into the
  specialist market; Process unlocks the enterprise expansion when V1
  validates.

The expected sequence: V1 reaches ~500 customer validation (real revenue at
€120 × N), then VariScout Process design opens. Until then, VariScout Process is a commitment to the customer who actually needs it — not a build.

---

## 8. Audience-Journey Mapping

| Audience                 | Entry point                   | First experience                                                               | Conversion trigger                                                                   |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Project lead (BB)**    | Google, referral, Marketplace | PWA demo with seeded sample → linked filtering magic → run a Charter rehearsal | "I need to save this; I need my team in; the Cpk verification has to live somewhere" |
| **Quality engineer**     | Google, LinkedIn              | PWA with sample data → linked filtering "magic moment" → own data              | "I need to save this and come back to it"                                            |
| **CI / OpEx lead**       | Referral, case study          | Team demo → see investigation + improvement flow → pilot project               | "This captures the full PDCA cycle and the team can collaborate at no per-seat cost" |
| **Trainer / consultant** | LinkedIn, conference          | PWA in training session → students learn through guided investigation          | "I want to embed this in my curriculum"                                              |
| **Sponsor / Champion**   | Lead presents the Report      | Report-only view of the team's V1 project                                      | "Did the project work? What was the Cpk delta?"                                      |
| **IT / Procurement**     | Direct link                   | Customer-owned data architecture review                                        | "One vendor, one SKU, one Marketplace bill, no admin-consent permissions"            |

### Trainer Network overlay

The training funnel does not need a heavy reseller program to scale. The
default ecosystem model is lightweight:

- **Trainer**: individual certified to deliver VariScout training and
  consulting.
- **Master Trainer**: individual certified to train new Trainers.
- **Company grouping**: directory visibility and lead-routing only, not a
  separate governance layer.

This keeps standards centralized while allowing delivery to spread across
consultants and small firms without founder travel becoming the bottleneck.
See [Trainer Network](trainer-network.md).

---

## 9. Competitive landscape

| Segment         | Incumbent                    | VariScout advantage                                                                                                              | VariScout weakness                                      |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Full-suite SPC  | Minitab (~€135-155/user/mo)  | 10× cheaper for a team-of-10, zero install, unlimited users at €120 total, full PDCA + Knowledge Catalyst                        | Fewer statistical tests (no DOE, no hypothesis testing) |
| Enterprise QMS  | InfinityQS ($50–100/user/mo) | No implementation cost, instant ARM deploy, customer-owned data                                                                  | No MES/ERP integration (deferred to VariScout Process)  |
| Free tools      | R, Python, Google Sheets     | No coding required, guided workflows                                                                                             | Less flexible at the statistical edge                   |
| Training tools  | Minitab academic licenses    | Free PWA, browser-based, offline-first                                                                                           | Less brand recognition                                  |
| AI-enhanced SPC | Minitab AI (April 2025)      | Closed-loop findings (Cpk before/after), Knowledge Catalyst, customer-owned AI Foundry deployment, unlimited users in single SKU | Smaller brand, newer product                            |

**VariScout's moat:** Measurement-backed organizational knowledge inside
customer-owned data. Minitab is single-user desktop software; InfinityQS is
enterprise-heavy. Neither captures the full PDCA cycle with verified
outcomes feeding an AI knowledge layer in the customer's own tenant.

**TAM:** €105–200M/year total (Layer 1: Quality Analytics €90–160M, Layer 2:
Training €5–15M, Layer 3: Excel €10–25M). SAM: €10–30M. SOM Year 1–3:
€0.1–1M. See [Market Analysis](market-analysis.md).

**Regulatory tailwind:** ISO 9001:2026 (DIS approved, publication Sept 2026)
emphasizes digitalization and data-driven decisions. EU AI Act high-risk
obligations (effective August 2, 2026) require human oversight and
transparency — VariScout's deterministic-first + human-confirmation
architecture is naturally compliant.

---

## See also

- [Positioning Bible](positioning.md) — Customer-facing language, category,
  audience messaging, the two-product roadmap.
- [Membership Philosophy](../08-products/membership-philosophy.md) — How V1
  access control works (one product, role-based access inside).
- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — V1 single-SKU
  architecture decision (supersedes ADR-007 + ADR-033 in part).
- [V1 architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md)
  — Canonical V1 product anatomy.
- [Philosophy](philosophy.md) — Four Lenses, Two Voices, EDA for Process
  Improvement.
- [Market Analysis](market-analysis.md) — TAM, competitive positioning, pricing
  comparison.
- [Trainer Network](trainer-network.md) — Lightweight ecosystem model.
- [UX Research](../02-journeys/ux-research.md) — Persona interviews, JTBD.
- [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md) —
  Distribution strategy (superseded in part by ADR-082).
- [ADR-019](../07-decisions/adr-019-ai-integration.md) — AI integration
  decision.
- [ADR-033](../archive/adrs/adr-033-pricing-simplification.md) — Pricing
  simplification (superseded by ADR-082, archived 2026-05-17).
