---
tier: stable
purpose: orient
title: 'Positioning Bible'
audience: human
category: reference
status: active
last-reviewed: 2026-05-17
related: [strategy, positioning, methodology, category, messaging]
layer: L1
---

# Positioning Bible

How we talk about VariScout — at every level, to every audience. The strategic
home for category language, audience messaging, and the long-term moat.

Companion to the [Constitution](constitution.md) (what we believe), the
[Business Bible](business-bible.md) (how we grow), and the canonical V1
architecture spec at [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../superpowers/specs/2026-05-16-wedge-architecture-design.md) plus [ADR-082](../07-decisions/adr-082-wedge-architecture.md).

---

## 1. The category

> **Structured investigation for process improvement.**

VariScout is not a chart tool. It is not a dashboard. It is not a statistics
package. It is the structured investigation layer that turns operational data
into shared process understanding, verified improvements, and sustained
controls. Every chart, every AI nudge, every collaboration surface serves the
investigation — not the other way around.

Most existing tools assume the practitioner already knows what to look for.
They compute what you ask for and stop. VariScout guides the work from
"something's wrong" through "here's where variation lives," "here's what
explains it," and "here's proof the fix held." The methodology does the
structuring so the analyst can focus on thinking.

This is the category VariScout owns: structured investigation, evidence-based,
AI-assisted, customer-owned. No incumbent occupies this slot today.

---

## 2. Who VariScout is for

The V1 audience is the **improvement specialist** — quality engineers, Lean
practitioners, Six Sigma belts (Green Belt / Black Belt / Master Black Belt),
CI engineers, process analysts, and consulting MBBs running projects with their
team.

What unifies them: their job is to _find and reduce variation in process data,
then verify the fix worked_. They lead projects. They invite SMEs, frontline
operators, and analysts into the work. They report up to a Sponsor who expects
a defensible story with numbers behind it.

VariScout V1 delivers the whole sentence for one project lead and their
invited team — paste data, frame the process, investigate, drive action, prove
it worked, hand it off. No statistics degree required. No enterprise sales
motion required. Azure Marketplace install, invite, work.

What V1 is not built for: a process owner monitoring 30 production lines, an
enterprise running portfolio-level operational excellence programs across
sites, or an org needing automated pipelines from MES / SCADA / ERP. Those
needs belong to a different customer with a different mental model — and to a
different product (see §8).

---

## 3. The differentiated promise

Four claims VariScout makes that competitors cannot.

### 3.1 Structured investigation, not statistical verification

Statistical verification asks _did the change work_; structured investigation asks _what could be going on and how do we know_. VariScout is for the second question.

VariScout is built around a published, peer-reviewed methodology — Turtiainen
(2019), _"Mental Model for Exploratory Data Analysis Applications for
Structured Problem-Solving"_ (LUT University), validated by nine Lean Six Sigma
Master Black Belt experts across manufacturing, healthcare, and service
industries. The flow is canonical:

```
Issue (vague)
  → Questions generated from data + Factor Intelligence
    → Findings (evidence-backed answers)
      → Hypotheses (mechanisms you can disconfirm)
        → Actions (tracked, owned, due-dated)
          → Verified Cpk improvement
```

The flow is the product. The charts serve the flow. The AI serves the flow.
The collaboration serves the flow.

### 3.2 Three evidence types — data, gemba, expert

No variation problem is solved from a desk alone (Constitution §7). VariScout
treats data evidence (η², R²adj, ANOVA, Cpk), gemba evidence (go-and-see
observations, photos from the floor, walk-the-process notes), and expert
knowledge (SME judgment, captured methodically) as three first-class evidence
types. Each Hypothesis on the Investigation Wall can carry all three. None
ranks above the others.

Most tools force everything through "the numbers." VariScout structures the
investigation around the methodology, then lets the right evidence answer the
question at hand.

### 3.3 Customer-owned data, browser-only processing

Data enters in the browser, stays in the browser for analysis, and — on the
Azure tier — syncs to storage in the customer's own Azure tenant. No data ever
touches VariScout-operated cloud infrastructure (ADR-059). CoScout's AI calls
go to Azure OpenAI endpoints provisioned in the customer's subscription, never
the vendor's. This isn't a privacy bullet point — it is the load-bearing
architectural decision that makes VariScout sellable into regulated and
quality-sensitive industries without an enterprise procurement cycle.

The same principle makes the free PWA possible: no backend, no signup, no
data leaving the laptop. Try-before-buy without paperwork.

### 3.4 One product, role-based access inside

VariScout V1 is a single product at a single price (see §6). Every paid
customer gets the full analytical capability — charts, modes, CoScout, Report,
Sustainment. What's _membership-gated_ is access to a specific Project's
formal artifacts (Charter, Approach, Sustainment, Report). That
gating happens _inside_ the product via project-membership ACLs (Lead /
Member / Sponsor), not at sales-conversation entry via tier choice.

This is a deliberate counter-positioning move against the enterprise SaaS norm
of feature-gated tiers. See [Membership Philosophy](../08-products/membership-philosophy.md).

---

## 4. What VariScout is — and is not

### What VariScout is

VariScout is a **team improvement workspace** for turning operational data
into shared process understanding, verified improvements, and sustained
controls. Question-driven, evidence-based, AI-assisted, customer-owned.

The methodology nests:

- **Project** is the formal container (Charter → Approach → Sustainment),
  invited team, Report. Improvement actions are owned by the **Improve tab** —
  a top-level verb tab scoped to the active project, not a stage inside it.
- **FRAME → SCOUT → INVESTIGATE → IMPROVE** explains how one investigation is
  done inside a Project (or as quick analysis without one).
- **Questions** drive the reasoning. Each question can be answered by data,
  gemba, or expert evidence — and each Hypothesis can be confirmed or
  disconfirmed against the same three.

### What VariScout is not

- **Not a dashboard tool.** Dashboards show what happened. VariScout helps you
  figure out why and guides you to fix it.
- **Not a statistics package.** Statistics are one evidence type. VariScout
  structures the investigation around them.
- **Not an AI analytics tool.** AI assists. The methodology and the team
  drive the investigation.
- **Not a 24/7 operational monitoring system.** VariScout reviews performance
  at an improvement cadence; live alerts, shift-critical escalation, and
  real-time control loops stay in operational systems.
- **Not feature-gated across tiers.** One paid product; access scoped per
  project, not per feature.

### Multi-level pitch

| Context                 | Pitch                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One sentence**        | VariScout helps improvement teams turn process data into shared understanding, verified improvement, and sustained control.                                                                                                           |
| **Project lead**        | Charter a project. Invite your team. Frame the process, scout the variation, investigate suspected causes, drive action, prove the Cpk improvement held. Sponsor gets a Report.                                                       |
| **Elevator**            | A single Azure Marketplace install for your improvement team. Paste data, find where variation lives, investigate with data + gemba + expert evidence, act, verify. Same product everywhere.                                          |
| **Website hero**        | Turn operational data into structured team improvement. Build current understanding, check suspected mechanisms with data and gemba evidence, prove fixes worked, hand learning back to the process.                                  |
| **Marketplace listing** | Structured improvement workspace for process teams. Question-driven analysis guides teams from concern to measured result by combining data analysis, gemba observations, expert knowledge, action tracking, and AI-assisted context. |
| **Internal strategy**   | VariScout is the first tool that ships structured EDA investigation as a team workspace. The methodology (Turtiainen 2019) is the product. AI augments. Project membership is the access model.                                       |

---

## 5. The investigation method

### 5.1 Four phases — investigation as navigation

The investigation journey is encoded in the workflow:

| Phase           | Question                   | Lens                                                                                          | Surface                 |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| **FRAME**       | What am I looking at?      | Column mapping, factor selection, outcome spec, process map                                   | Process tab (Edit mode) |
| **SCOUT**       | Where does variation live? | Four Lenses (I-Chart, Boxplot, Pareto, Stats), linked filtering                               | Analyze tab             |
| **INVESTIGATE** | Why is this happening?     | Hypothesis Wall, Measurement Plans, Evidence Map, three evidence types                        | Investigation tab       |
| **IMPROVE**     | What do we do about it?    | Action tracker (simple by default), PDCA workbench (Advanced), sustainment + Cpk verification | Improve tab (top-level) |
| **REPORT**      | What did we learn?         | Audience-adapted reports, audit trail, Sponsor-ready                                          | Report tab              |

Each phase serves a different purpose — discovery, understanding, verification.
The same tool serves all phases; the surface changes the lens.

### 5.2 Question-driven EDA — the methodological core

The investigation starts from questions, not theories (Constitution §5).
Multiple suspected causes are correct outcomes, not failures. The question
tree tracks status: Open → Investigating → Answered / Ruled Out. Each answered
question sharpens the problem statement.

> "Don't search for the function first. Don't search for the equation first.
> Search for which variables make a difference by contributing to the overall
> explanation of variation and which ones don't." — MBB expert, March 29 2026
> validation session.

That quote is VariScout in one sentence. Understand which variables
contribute, then model. Not the other way around.

### 5.3 Hypothesis-first or data-first — both first class

Two starting points converge on the same Investigation Wall:

| Start                            | Path                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data-first (exploratory)**     | Paste → explore in Analyze → notice patterns → create Findings → group into Hypotheses on the Wall                                                                                           |
| **Hypothesis-first (deductive)** | Open Wall → create Hypothesis (no Findings yet) → add Measurement Plans → coordinate collection out-of-product → re-ingest data → Findings auto-link to Plans → Hypothesis status progresses |

The Measurement Plan sub-entity (per the V1 architecture spec §3.6, [Investigation Wall + Measurement Plans](../superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans))
supports recurring data collection without forcing a separate "Measure" stage.

---

## 6. Pricing and access

### 6.1 The single SKU

**VariScout** ships at **€120/month per Azure tenant.** Unlimited org users.
Unlimited projects. Full analytical capability. Single billing path. Single
sales conversation.

Distributed via Azure Marketplace Managed Application — the customer deploys
into their own Azure subscription, owns the data, owns the AI Foundry
resources, owns the Blob storage. VariScout, the vendor, never touches
customer data.

### 6.2 The PWA as funnel

The free PWA stays. Same charts, same methodology, same investigation
structure — session-only storage, no file upload, no CoScout. It teaches
structured investigation. The "magic moment" of linked filtering happens on
the free tier without paywall friction. When the analyst hits the natural
ceiling ("I need to save this. I need my team in here. I need the AI to
explain this."), the Azure product is one Marketplace click away.

The PWA is not a degraded paid product. It is a learning tool by design.

### 6.3 Why a single SKU

Per [ADR-082](../07-decisions/adr-082-wedge-architecture.md), the V1
go-to-market collapses the prior Standard / Team tier split into one price.
Reasons:

- **Sales conversation is one sentence.** "€120/month, Azure tenant-wide,
  invite your team per project." No tier decision moment.
- **Customer success doesn't need plan-mapping.** Every customer is on the
  same surface; support is consistent.
- **Engineering doesn't carry tier-gating UX.** ~28 files of `isPaidTier()` /
  `hasTeamFeatures()` retire.
- **Per-deployment pricing honors ADR-033 H6.** €120 is still per-deployment
  — collaboration is unpenalized.

Access control moves _inside_ the product as project-membership ACLs. See
[Membership Philosophy](../08-products/membership-philosophy.md).

---

## 7. Audience-specific messaging

| Audience                  | What they care about                            | Lead with                                                                                                                                                           |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project lead (BB/MBB)** | "I run improvement projects with my team"       | Charter to Sustainment lifecycle. Invite Members + Sponsor. Investigation Wall with Measurement Plans. Cpk before/after proves the fix. €120/mo, unlimited team.    |
| **Quality engineer (GB)** | "I need more than Excel, less than Minitab"     | Four Lenses with linked filtering. Question-driven investigation. Capability + control limits. €120/mo Azure tenant-wide.                                           |
| **CI / OpEx lead**        | "I need a tool for the team's improvement work" | One product everyone can use. PDCA in the Improve tab. Three evidence types. Knowledge Catalyst accumulates across projects.                                        |
| **Trainer / consultant**  | "I need a tool that teaches the methodology"    | Free PWA teaches structured EDA — same methodology, same lenses. The guided investigation builds statistical intuition.                                             |
| **Sponsor / Champion**    | "Did the project work? What did we learn?"      | Report-only access. Cpk delta, action completion, sustainment evidence. Signoff out-of-band at V1; full audit trail in the Report.                                  |
| **IT / Procurement**      | "Is this safe? Customer-owned? One vendor?"     | Azure Marketplace Managed Application. Customer-owned data + customer-deployed AI Foundry. Zero admin-consent permissions. One SKU, one billing path, no surprises. |

---

## 8. Two products on a roadmap

V1 is **VariScout**: the project tool an improvement specialist invites their
team to. €120/mo, Azure tenant-wide, project-membership ACLs.

A future second product, **VariScout Process**, addresses a distinct customer
— enterprises with ongoing process ownership across multiple lines or sites,
needing automated data pipelines, multi-persona routing (Process Owner /
Project Lead / SME / Frontline), and Hub-portfolio orchestration. Different
audience. Different unit economics. Different sales motion.

VariScout Process is **not announced in V1 marketing**. It is named in this
positioning doc because the team building VariScout needs to know what V1
defers without losing — and so customers asking "do you handle the
process-ownership use case?" hear a coherent answer ("not in V1; we're
building that as a separate product"). When V1 reaches 500+ customer
validation, VariScout Process becomes the expansion story.

What V1 explicitly defers to VariScout Process:

- Process Hub as a user-visible primary container (V1 keeps Hub internal-only)
- 4-persona routing + persona-adaptive Home variants
- Automated data pipelines (sensor / SCADA / ERP feeds)
- Multi-Hub portfolio scans + cross-Hub orchestration
- Process-owner cadence monitoring as a separate surface
- Cross-Azure-AD-tenant invitations (V1 enforces tenant boundary as a privacy
  feature)

These aren't lost. They are deferred to the customer who actually needs them.

---

## 9. The Knowledge flywheel

The long-term moat is organizational knowledge measured by improvement
outcomes, not subjective scores.

> After 50+ resolved findings in a tenant, CoScout has genuine organizational
> memory: "Last time variation spiked on Line 3, the team changed nozzle
> spacing and Cpk went from 0.6 to 1.4." That memory is durable, vendor-locked
> only by methodology fit, and grows monotonically with project completion.

How it accumulates:

1. **Team investigates** — questions generated, evidence gathered, findings
   carry Cpk values and verified outcomes (not subjective RPN scores).
2. **Project closes** — Sustainment verifies the fix held. The Report
   captures the chain: question → evidence → conclusion → action → outcome.
3. **Next investigation** — CoScout suggests from the tenant's history, not
   from generic best practices.
4. **Improvement compounds** — each closed project makes the next faster.

Why it's defensible:

- **Customer-owned.** Knowledge stays in the customer's tenant. No vendor
  lock-in on the data layer.
- **Measurement-backed.** Traditional FMEA uses subjective 1–10 RPN scores.
  VariScout findings carry actual Cpk values and verified outcomes.
- **Investigation-structured.** Knowledge isn't raw documents — it's
  question → evidence → conclusion → outcome chains, enriched by uploaded
  SOPs and FMEAs that provide organizational context.
- **Accumulating.** Each resolved finding makes the next investigation
  faster. The moat deepens with usage.

No competitor captures the full PDCA cycle with verified outcomes feeding an
AI knowledge layer.

---

## 10. Methodology as brand

### The academic foundation

VariScout's investigation methodology is grounded in published, peer-reviewed
academic research:

- **Turtiainen (2019)**: _"Mental Model for Exploratory Data Analysis
  Applications for Structured Problem-Solving"_ — Master's thesis, LUT
  University. Validated by nine Lean Six Sigma Master Black Belt experts
  across manufacturing, healthcare, and service industries.
- **Builds on**: Shewhart's control charts (1924), Tukey's Exploratory Data
  Analysis (1977), Juran's Pareto principle (1950s), Watson's structured EDA
  approach (2015).
- **The methodology is published and peer-reviewed.** The product is the
  implementation.

### Expert validation

The March 29, 2026 expert testing sessions demonstrated that:

1. The question-driven investigation methodology works on non-manufacturing
   data (visitor / tourism) without modification
2. An MBB expert naturally follows the investigation flow without coaching
3. The Four Lenses generate questions that lead to deeper investigation
4. The probability plot serves as a process diagnostic tool (inflection points
   = process transitions, steepness = capability)

### The brand proposition

VariScout is the only tool that ships a validated EDA investigation
methodology as a product. The investigation structure is not a feature bolted
onto a chart tool — it is the product. The charts, the AI, the collaboration,
the knowledge base all serve the investigation.

The methodology works on any data with repeated measurements and factors.
Manufacturing, healthcare, logistics, government services, education — the
questions are different, the investigation structure is the same.

**The methodology is the brand. The investigation is the product. The
knowledge is the moat.**
