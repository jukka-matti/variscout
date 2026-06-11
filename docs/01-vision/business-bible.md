---
tier: stable
purpose: orient
title: Business Bible
audience: human
category: reference
status: active
last-reviewed: 2026-06-11
related: [strategy, hypotheses, value-levers, flywheel, pricing, single-sku]
layer: L1
---

# Business Bible

The strategy doc. What VariScout is betting on, what constraints we accept,
how the unit economics work, and how the long-term moat compounds.

Companion to the [Positioning Bible](positioning.md) (how we talk about it),
the [Constitution](constitution.md) (what we believe), and the canonical V1
architecture lineage: [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](../07-decisions/adr-082-wedge-architecture.md), and [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md).

---

## 1. The bet

> **Local-first process improvement workspace. Replace the practical Minitab
> + Excel + PowerPoint workflow, with Azure as optional distribution/licensing
> and customer-tenant services.**

VariScout is betting that the right unit of value in 2026 process-improvement
software is _the private Workspace a specialist uses to understand variation,
change the process, verify Control, and share the evidence_.

The 2026 SaaS default is per-seat licensing, feature-gated tiers, cloud-hosted
collaboration, and an enterprise sales motion. VariScout takes the opposite
stance:

- **Local-first, not cloud-first.** The product is valuable before any shared
  backend exists: local browser analysis, `.vrs` snapshots, and Analysis Packs.
- **Single SKU, not feature-gated tiers.** Every paid customer gets the full
  product. Optional services are distribution, persistence, AI, and governance
  choices, not analytical feature gates.
- **Artifact-first sharing, not collaboration-first SaaS.** Analysts share
  polished Analysis Packs before they need project invites or ACL-heavy live
  workspaces.
- **Company-approved distribution, not vendor cloud dependency.** Azure can
  approve, license, distribute, and optionally host customer-tenant services
  without becoming the default data home.

This is a deliberately narrow ICP at V1: improvement specialists running
process improvement work that currently spills across Minitab, Excel,
PowerPoint, and email. Process owners running portfolios, enterprise OpEx
programs across sites, automated data pipelines, and multi-persona role
matrices are deferred to **VariScout Process** — a future, separate product on
the same roadmap. See §7.

---

## 2. Strategic hypotheses

Each hypothesis has a statement, supporting evidence, invalidation criteria,
and current status.

### H1: The 20% Usage Gap

**Statement:** Most quality professionals use <20% of their SPC tool's
capabilities (Minitab, JMP) but still need Excel, PowerPoint, and email to
turn analysis into action. A tool that covers the practical
process-improvement slice can win on value.

**Evidence for:**

- Market analysis confirms VariScout targets the "structured process
  investigation" segment (~10–15% of $1.05B SPC market).
- Minitab pricing (~€135-155/user/month) vs VariScout at €120/month total
  per Azure tenant, unlimited users.
- Grace Mwangi persona: "I calculate averages, standard deviations, make
  charts… I need maybe 20% of what Minitab offers."
- ADR-092 sharpens the target: replace the practical Minitab + Excel +
  PowerPoint workflow for Process -> Explore -> Analyze -> Improve -> Control
  -> Report, not every advanced statistical procedure.

**Evidence against:** None observed yet (pre-launch).

**Invalidation criteria:** If >50% of trial users request DOE, response-surface
features, or a broad test catalog before they value Process/Improve/Control
and Analysis Packs, the gap is narrower than assumed.

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
- Optional company-approved builds can use IndexedDB, cached responses, or
  customer-tenant services without making Azure the default data home.

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
- Local-first `.vrs` and Analysis Pack workflows let sensitive data stay on
  the analyst's machine unless they deliberately share it.
- Optional project-membership ACLs sharpen the privacy story for customers
  that need managed shared workspaces, but ACLs are no longer the default
  product proof point.
- EU AI Act and ISO 9001:2026 favor transparent, auditable architectures.

**Evidence against:** First field signal (2026-06-11): a large-enterprise
prospect reported that buying external software is hard regardless of
architecture — certifications, vendor risk assessment, data concerns.
Customer-tenant deployment _answers_ the security review but does not waive it
by itself. ADR-092 therefore makes the local-first path the lead trust story:
"run the analysis locally, export only what you choose, use Azure services only
when your company wants managed distribution, persistence, or AI." The privacy
story still needs a procurement artifact (security review pack: architecture
brief, data-flow diagram, DPA template, pre-filled vendor security
questionnaire).

**Invalidation criteria:** If enterprise buyers consistently request
centralized cloud analytics (multi-site dashboards, cross-tenant aggregation),
customer-owned becomes a limitation — and that's the signal to ship VariScout
Process.

**Status:** Supported.

---

### H5: Free PWA Proves The Product

**Statement:** A genuinely useful free/local PWA proves the product before
procurement. The PWA is not only a funnel; it is the core local-first
experience.

**Evidence for:**

- Market analysis Layer 2: Training funnel TAM €5–15M/year.
- GTM: "Try it free at variscout.com. When you're ready for your team, get it
  on Azure Marketplace."
- ADR-007: PWA repositioned as free training tool; same funnel role as the
  shelved Excel Add-in at zero marginal cost.
- ADR-092: local browser analysis, `.vrs`, and Analysis Packs are the default
  proof of value; paid distribution/services expand from that base.

**Evidence against:** None in funnel data (pre-launch). One structural risk
logged 2026-06-11: the large-company procurement objection lands exactly on
the PWA→Azure conversion step — the practitioner adopts the free PWA without
friction, but the €120 deployment still passes vendor onboarding unless the
purchase rides existing Microsoft agreements (transactable Marketplace offer)
or enters via the training budget (trainer-network land motion). See
decision-log 2026-06-11 GTM entry. ADR-092 reduces this risk by allowing
company-approved local use and artifact sharing before Azure services are
needed.

**Invalidation criteria:** If <5% of PWA users visit the Azure Marketplace
listing within 12 months, the funnel is broken.

**Status:** Untested.

---

### H6: Distribution/Licensing Beats Per-Seat

**Statement:** Charging for company-approved use/distribution (€120/month
target) creates better value perception than per-seat pricing, especially when
the default product is local-first and artifact-based.

**Evidence for:**

- ADR-007: "A team of 3+ saves money vs Minitab immediately. For a team of
  10, it's 10× cheaper."
- Azure Marketplace Managed Applications enforce per-deployment, not
  per-user — no mechanism to enforce user counts.
- UX research: cost sensitivity is extreme for SMEs and CI departments.
- The V1 single-SKU pivot collapses the prior €79/€199 tier split into a
  single €120 SKU. €120 is still per-deployment, honoring this hypothesis.
  The tier collapse is a refinement of H6, not a contradiction.
- ADR-092 reframes "deployment" as an approved distribution/licensing and
  optional services unit. The analytical value no longer depends on inviting
  more people into a shared Azure project.

**Evidence against:** Enterprise buyers may expect per-user pricing and find
flat pricing suspicious; some procurement processes are built around seat
counts.

**Invalidation criteria:** If >30% of enterprise evaluation conversations
stall on pricing-model confusion or per-seat-expectation friction.

**Status:** Supported, reframed by ADR-092.

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

### H8: AI Augments, Never Replaces — Provider-Boundary Collaborator

**Statement:** When AI is enabled, it explains deterministic conclusions and
suggests concrete next actions. The statistical engine is the authority; AI is
the collaborator. The analyst always confirms before any action is taken.

**Evidence for:**

- ADR-019: "AI explains deterministic conclusions, it doesn't generate
  competing ones."
- ADR-027: Evolution from narrator to collaborator — existing patterns (drill
  suggestions, investigation coaching) already suggest actions; making them
  clickable is natural progression.
- Minitab AI (April 2025) adopted the same general trust framing.
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

### H9: Closed-Loop Findings Create Optional Organizational Memory

**Statement:** VariScout's investigation workflow (detect → investigate →
act → verify with measured Cpk) builds structured evidence competitors cannot
replicate. When a customer enables an approved memory layer later — customer
Azure, local index, or company-approved agent bundle — closed workspaces can
become genuine organizational knowledge.

**Evidence for:**

- ADR-019: "After 50+ resolved findings, the AI has real organizational
  knowledge."
- ADR-027: AI collaborator model means prior evidence can feed back into
  actionable suggestions (not just narration) when a customer enables an
  approved memory layer.
- Traditional FMEA uses subjective RPN scores (1–10 guesses). VariScout
  findings carry actual Cpk values and verified outcomes.
- No competitor captures the full improvement cycle with measurement-backed
  outcomes.

**Evidence against:** Requires sustained usage — teams that resolve <10
findings/year won't reach critical mass.

**Invalidation criteria:** If average resolved findings per active company
workspace is <5 after 12 months of usage, the knowledge flywheel doesn't spin.

**Status:** Supported as an optional extension point; knowledge accumulation
untested at scale.

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

**€120/month target for company-approved distribution/services.** Full
analytical capability remains local-first; optional customer-tenant services
add persistence, AI, governance, and managed sharing.

The price sits above the retired €79 Standard and below the retired €199
Team. Reasoning:

- €120/mo = €1,440/year sits slightly above the typical €1,000 SME purchasing
  threshold, which the V1 product scope (full improvement loop, project
  formalization, Analysis Packs, optional customer services) justifies.
- A team of 3+ on VariScout is still <10% the cost of Minitab seats.
- Customer-deployed AI Foundry, Blob, or other optional service resources are
  the customer's Azure cost, not ours — VariScout's marginal serving cost
  stays near zero.

### 3.2 What €120 buys

- Full local analytical surface (chart modes, capability, ANOVA, OLS, Evidence
  Map, control limits).
- Full improvement loop: Process -> Explore -> Analyze -> Improve -> Control
  -> Report.
- `.vrs` snapshots and polished Analysis Packs.
- Optional CoScout AI via customer Azure AI / Foundry.
- Optional project-membership ACLs (Lead / Member / Sponsor) and Blob Storage
  sync in the customer's tenant.
- Future Agent Workspace Bundle / MCP extension points for companies that use
  local or approved AI agents.

### 3.3 Implications for growth

- **Per-tenant ARPU cap is €120/mo (€1,440/year) until VariScout Process
  ships.** This is the V1 economic ceiling. Volume + low churn carries the
  business until Process unlocks higher ARPU enterprise SKU.
- **Customer success is light.** Same product everywhere; no plan-mapping; no
  feature anxiety. Support load scales with volume, not with SKU complexity.
- **Marketing is one message.** No "which plan is right for you" worksheet.
  One landing page. One Marketplace listing.
- **Sales motion is self-serve.** Free/local PWA evaluation -> company-approved
  distribution/licensing -> optional Azure services. No enterprise sales cycle
  until VariScout Process arrives.
- **Marketplace removes the contracting leg of procurement, not the
  security-review leg** (verified 2026-06-11 against Microsoft Learn). A
  transactable listing makes Microsoft the billing counterparty under the
  customer's existing Azure agreement (agency model, 3% store fee; private
  plans for negotiated per-customer deals) — but customers typically still
  run vendor security review. The security-review answer is ADR-059
  packaged as a procurement artifact (see H4 evidence-against).
- **MACC is a named growth milestone, not a launch lever.** At ~60–70
  concurrent tenants (~USD 100K trailing-12-month Azure-attributable
  revenue) VariScout qualifies for Azure IP co-sell → MACC eligibility,
  letting purchases draw down customers' pre-committed Azure spend — the
  strongest procurement sentence available ("this draws down the Azure
  commitment you already signed"). Watch Microsoft's App Accelerate
  nomination path (2026 rollout) as a possible earlier route.

### 3.4 Customer-owned data is non-negotiable

VariScout's cloud cost stays near zero because we don't host customer data, AI
inference, or storage. The default product can run locally, and optional
customer-tenant services are paid by the customer's environment. This is also
the architectural foundation of H4 (Privacy as Feature) — the two are linked
by design, not by accident.

If VariScout ever centralized data or inference, both the cost structure and
the H4 sellable-privacy story collapse. Local-first/customer-owned is
load-bearing.

---

## 4. Value Levers

Five layers of value, each building on the previous. Analytical capability is
not tier-gated; optional services expand distribution, AI, persistence, and
managed sharing.

### L1: Core Analysis

**What:** Four Lenses (I-Chart, Boxplot, Pareto, Capability) + linked
filtering + drill-down.

**Why it matters:** Reduces a 4-hour Excel analysis to <1 hour. The
fundamental value proposition.

**Available in:** Local/PWA and company-approved distributions.

### L2: Investigation Workflow

**What:** Findings → Hypotheses → Measurement Plans → Actions → Outcomes →
Verification (5-status closed-loop investigation).

**Why it matters:** Transforms analysis from "interesting chart" into
"measured improvement." Creates audit trail.

**Available in:** Local-first Workspace direction. PWA durability remains
`.vrs` export/import; optional services add managed persistence.

### L3: AI Augmentation

**What:** NarrativeBar, ChartInsightChips, CoScout (chat + voice input) — AI
explains stats in plain language, suggests next steps, references
investigation history.

**Why it matters:** Bridges the gap between statistical output and actionable
insight. Non-statisticians can understand variation analysis results.

**Available in:** Optional customer Azure AI today; future local LLM / MCP
agent provider boundary.

### L4: Artifact-First Sharing

**What:** Executive, Technical, Reproducible, and Redacted Analysis Packs;
`.vrs` snapshots; future Agent Workspace Bundles for company-approved agents.

**Why it matters:** Quality is a team sport, but V1 does not need to make live
collaboration the default. The analyst can share the right evidence with the
right audience without exposing the full workspace or creating an access
management surface.

**Available in:** Local/PWA direction for Analysis Packs; optional customer
services for managed sharing and project membership.

### L5: Optional Organizational Memory

**What:** Organizational memory — measurement-backed organizational knowledge
that can accumulate across closed workspaces/projects when the customer enables
an approved memory layer. CoScout or local agents can reference prior evidence
when suggesting Hypotheses for new investigations.

**Why it matters:** This is the long-term moat (H9). The knowledge layer
gets more valuable as the customer accumulates resolved investigations —
making churn increasingly expensive for the customer.

**Available in:** Optional customer-tenant services or future local/company
index. Not the V1 proof point.

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
                    │  (company-       │◄──── "I need approved use,
                    │  approved use)   │      AI, managed save,
                    │                  │      or governed sharing"
                    │  Process ->      │
                    │  Control ->      │
                    │  Analysis Packs  │
                    └────────┬─────────┘
                             │ exported packs and saved workspaces
                             │ can feed optional knowledge layer
                             ▼
                    ┌──────────────────┐
                    │ Knowledge Layer  │
                    │ (50+ findings)   │──── reinforces investigation
                    └──────────────────┘     quality → more resolved
                                             findings → deeper knowledge
                                             → lower churn
```

**Reinforcement loops:**

1. **Training → Real use.** Free PWA teaches methodology → users trust the
   local workflow on their own data.
2. **Usage → Stickiness.** More projects closed → harder to switch → lower
   churn.
3. **Evidence Packs → Demand.** Better Analysis Packs travel through the
   organization → more specialists try VariScout.
4. **Optional services → Expansion.** When teams need managed save, AI, or
   sharing, company-approved distribution becomes natural.
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

### 6.2 Azure/service constraint — accepted as optional

Confirm: customers do not require live multi-user Azure collaboration before
they see value in local analysis and Analysis Packs. Check pipeline / existing
customer mix.

If a meaningful slice of pipeline depends on managed sharing, cross-org
collaboration, or central persistence before analysis value, that service
layer becomes a precondition — and that's a re-scope, not a tweak.

### 6.3 Customer validation — the bet test

Pitch the V1 product end-to-end to a real improvement specialist (Six Sigma
BB, CI engineer, or quality manager — the named ICP). The gate fails if they
cannot articulate, in their own words, "yes, that's the tool I want instead
of my Minitab + Excel + PowerPoint loop." A 30-minute call is the
minimum-viable bet test, not the standard
— multiple specialist conversations strengthen the signal, and a single soft
"sure, sounds interesting" is not a pass.

If they push back hard on something foundational ("I really need
process-owner monitoring," "I really need cross-tenant collaboration"),
pause and revisit the V1 plan — don't reframe the pushback as an edge case.

These three checks test the economic + ICP + product-fit assumptions of the
V1 plan before code-level commitment.

---

## 7. Two products on a roadmap

**Today: VariScout** (this doc's primary product) — local-first process
improvement workspace, company-approved distribution/services target,
improvement-specialist ICP.

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
| **Improvement lead (BB)** | Google, referral, Marketplace | PWA demo with seeded sample → linked filtering magic → Analysis Pack           | "This replaces my analysis-to-report workflow"                                      |
| **Quality engineer**     | Google, LinkedIn              | PWA with sample data → linked filtering "magic moment" → own data              | "I need to save/export this and share the evidence"                                 |
| **CI / OpEx lead**       | Referral, case study          | Local-first demo → see Process/Improve/Control loop                            | "This carries the full improvement loop without forcing a cloud collaboration platform"    |
| **Trainer / consultant** | LinkedIn, conference          | PWA in training session → students learn through guided investigation          | "I want to embed this in my curriculum"                                              |
| **Sponsor / Champion**   | Lead presents the Analysis Pack | Reads outcome, evidence, actions, and Control result. Signoff out-of-band.    | "Did the project work? What was the Cpk delta?"                                     |
| **IT / Procurement**     | Direct link                   | Local-first/customer-owned architecture review                                 | "Data can stay local; optional Azure services stay in our tenant"                   |

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
| Full-suite SPC  | Minitab (~€135-155/user/mo)  | Local-first browser workflow, process context, full improvement loop, polished Analysis Packs                                    | Fewer statistical tests (no DOE, no broad test catalog) |
| Enterprise QMS  | InfinityQS ($50–100/user/mo) | No implementation cost, instant ARM deploy, customer-owned data                                                                  | No MES/ERP integration (deferred to VariScout Process)  |
| Free tools      | R, Python, Google Sheets     | No coding required, guided workflows                                                                                             | Less flexible at the statistical edge                   |
| Training tools  | Minitab academic licenses    | Free PWA, browser-based, offline-first                                                                                           | Less brand recognition                                  |
| AI-enhanced SPC | Minitab AI (April 2025)      | Deterministic-first stats, optional customer/local AI boundary, closed-loop findings and Control evidence                        | Smaller brand, newer product                            |

**VariScout's moat:** Measurement-backed improvement knowledge inside
customer-owned data. Minitab is analysis-first; InfinityQS is
enterprise-heavy. Neither combines process context, local-first workflow,
Control verification, and beautiful share artifacts in one workspace.

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
- [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md) —
  Local-first product model.
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
