---
tier: stable
purpose: orient
title: 'Positioning Bible'
audience: human
category: reference
status: active
related: [strategy, positioning, methodology, category, messaging]
layer: L1
last-verified: 2026-06-11
verified-against-commit: c289d920
---

# Positioning Bible

> **Last material edit 2026-06-11** — Positioning now follows [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md): local-first practical Minitab replacement, artifact-first sharing, and optional Azure services.

How we talk about VariScout — at every level, to every audience. The strategic
home for category language, audience messaging, and the long-term moat.

Companion to the [Constitution](constitution.md) (what we believe), the
[Business Bible](business-bible.md) (how we grow), and the canonical V1
architecture lineage at [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](../07-decisions/adr-082-wedge-architecture.md), and [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md).

---

## 1. The category

> **Structured investigation for process improvement.**

VariScout is not a chart tool. It is not a dashboard. It is not a statistics
package. It is the local-first structured investigation layer that turns
operational data into process understanding, verified improvements, sustained
controls, and shareable evidence. Every chart, every AI nudge, every export
serves the investigation — not the other way around.

Most existing tools assume the practitioner already knows what to look for.
They compute what you ask for and stop. VariScout guides the work from
"something's wrong" through "here's where variation lives," "here's what
explains it," and "here's proof the fix held." The methodology does the
structuring so the analyst can focus on thinking.

This is the category VariScout owns: local-first structured investigation,
evidence-based, optionally AI-assisted, customer-owned. No incumbent occupies
this slot today.

---

## 2. Who VariScout is for

The V1 audience is the **improvement specialist** — quality engineers, Lean
practitioners, Six Sigma belts (Green Belt / Black Belt / Master Black Belt),
CI engineers, process analysts, and consulting MBBs replacing the practical
Minitab + Excel + PowerPoint workflow.

What unifies them: their job is to _find and reduce variation in process data,
then verify the change worked_. They often work privately first, then share the
evidence with SMEs, frontline operators, managers, sponsors, customers, or
auditors. They need a defensible story with numbers behind it.

VariScout V1 delivers the whole sentence for one improvement specialist:
process context, EDA, investigation, action, Control verification, and a
beautiful shareable evidence pack. No statistics degree required. No cloud
collaboration platform required.

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
The exported evidence serves the flow.

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

### 3.3 Local-first data, customer-owned AI

Data enters in the browser and stays local for analysis. Durable output is
user-controlled files: `.vrs` snapshots and Analysis Packs — there is no cloud
document store (ADR-093). AI is always the customer's: the company tier uses
the tenant's own Azure AI endpoint; the individual tier uses the user's own
key with direct browser→provider calls. No data ever touches
VariScout-operated cloud infrastructure (ADR-059, ADR-092). This isn't a
privacy bullet point — it is the load-bearing architectural decision that
makes VariScout sellable into regulated and quality-sensitive industries.

The same principle makes the free PWA possible: no backend, no signup, no
data leaving the laptop. Try-before-buy without paperwork.

### 3.4 Artifact collaboration — the consultation loop

VariScout V1 shares work through the right artifact: executive Analysis Pack,
technical Analysis Pack, reproducible `.vrs` bundle, redacted pack for
external sharing — and the **Consultation Pack**, which closes the loop:
questions ride out with the data over Teams/email, the expert answers in the
pack or on a recorded call, and their knowledge comes back as structured
evidence the analyst explicitly accepts ([consultation-loop spec](../superpowers/specs/2026-06-11-consultation-loop-design.md)).
Live project membership is deleted from V1 (ADR-093); multi-user workspaces
are a VariScout Process (future) concern.

This is a deliberate counter-positioning move against the enterprise SaaS norm
of cloud-first collaboration. The analyst controls what leaves the workspace —
and what comes back in.

---

## 4. What VariScout is — and is not

### What VariScout is

VariScout is a **private process improvement workspace** for turning
operational data into process understanding, verified improvements, sustained
controls, and shareable evidence. Question-driven, evidence-based, optionally
AI-assisted, customer-owned.

The methodology nests:

- **Workspace** is the default container: data, process map, findings, actions,
  Control evidence, report, and share artifacts.
- **Project** is the optional formalization layer (Charter → Approach →
  Control) — a solo act of naming, chartering, and running the lifecycle;
  there is no membership or invite flow (ADR-093). Improvement actions are
  owned by the **Improve tab** — a top-level verb tab, not a stage inside
  Project detail.
- **Frame → Explore → Analyze → Improve → Control** explains how one investigation is
  done inside a Project (or as quick analysis without one).
- **Questions** drive the reasoning. Each question can be answered by data,
  gemba, or expert evidence — and each Hypothesis can be confirmed or
  disconfirmed against the same three.

### What VariScout is not

- **Not a dashboard tool.** Dashboards show what happened. VariScout helps you
  figure out why and guides you to fix it.
- **Not a full statistical suite clone.** Statistics are one evidence type.
  VariScout replaces the practical improvement workflow around them.
- **Not an AI analytics tool.** AI assists. The methodology and the team
  drive the investigation.
- **Not a 24/7 operational monitoring system.** VariScout reviews performance
  at an improvement cadence; live alerts, shift-critical escalation, and
  real-time control loops stay in operational systems.
- **Not cloud collaboration.** Collaboration is controlled share artifacts +
  the consultation loop; there is no live multi-user workspace in V1.

### Multi-level pitch

| Context                    | Pitch                                                                                                                                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One sentence**           | VariScout is a local-first process improvement workspace that turns process data into verified improvement and shareable evidence.                                                                                                                                                        |
| **Improvement specialist** | Replace the practical Minitab + Excel + PowerPoint loop: map the process, explore variation, analyze suspected causes, drive action, verify Control, export the evidence pack.                                                                                                            |
| **Elevator**               | Paste data locally, connect it to the process, find where variation lives, decide what to change, prove whether it held, and export a polished Analysis Pack — or send the expert a Consultation Pack and pull their knowledge back as evidence. €17/month solo, €120/month company-wide. |
| **Website hero**           | Analyze the process behind the data. Improve it. Prove it held. Share the evidence.                                                                                                                                                                                                       |
| **Marketplace listing**    | Local-first structured improvement workspace for process specialists. Browser-based analysis in your own tenant, process context, action tracking, Control verification, polished Analysis Packs, and CoScout on your own Azure AI endpoint. Your data never reaches the vendor.          |
| **Internal strategy**      | VariScout is the first tool that ships structured EDA investigation as a local-first improvement workspace. The methodology is the product. Deterministic stats compute; AI and agents propose.                                                                                           |

---

## 5. The investigation method

### 5.1 Four phases — investigation as navigation

The investigation journey is encoded in the workflow:

| Phase           | Question                   | Lens                                                                                      | Surface                 |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| **FRAME**       | What am I looking at?      | Column mapping, factor selection, outcome spec, process map                               | Process tab (Edit mode) |
| **SCOUT**       | Where does variation live? | Four Lenses (I-Chart, Boxplot, Pareto, Stats), linked filtering                           | Analyze tab             |
| **INVESTIGATE** | Why is this happening?     | Hypothesis Wall, Measurement Plans, Evidence Map, three evidence types                    | Investigation tab       |
| **IMPROVE**     | What do we do about it?    | Action tracker (simple by default), PDCA workbench (Advanced), Control + Cpk verification | Improve tab (top-level) |
| **REPORT**      | What did we learn?         | Audience-adapted reports, audit trail, Sponsor-ready                                      | Report tab              |

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

### 6.1 Three channels, one product (ADR-093 D5)

- **Free** — public web URL. Full in-session analysis; no save/export, no AI.
  Training, evaluation, the funnel.
- **Individual** — **€17+VAT/month or €99+VAT/year** via Paddle. Installable
  desktop PWA from a Paddle-gated app origin (runs on the user's machine,
  offline-capable); the artifact layer (`.vrs`, Analysis Packs, the
  consultation loop); BYOK CoScout — the user's own AI key, direct
  browser→provider calls. Personal-use license.
- **Company** — **€120/month per Azure tenant** via Azure Marketplace.
  Deployed into the customer's own subscription, tenant-wide users, the
  artifact layer, CoScout on the tenant's IT-governed AI endpoint, security
  review pack. VariScout, the vendor, never touches customer data.

The paid product never runs on VariScout's public website — it runs on the
user's machine or in the customer's tenant.

### 6.2 The free deployment as product proof

The free deployment stays. Same charts, same methodology, same investigation
structure — full in-session analysis, no save/export (build-time gate, ADR-093
D5), no CoScout. It teaches structured investigation; the "magic moment" of
linked filtering happens without paywall friction. When the analyst hits the
natural ceiling ("I need to keep this work, export the evidence pack, consult
an expert, use AI"), the €17 personal license is one Paddle checkout away —
and the company deployment follows when IT-governed AI and approved
distribution matter.

The free deployment is not a degraded paid product. It is the clearest
expression of the local-first promise: the full analysis loop, in your
browser, on your data.

### 6.3 Why a license-scope ladder, not a feature ladder

Per [ADR-082](../07-decisions/adr-082-wedge-architecture.md) and
[ADR-093](../07-decisions/adr-093-v1-simplification-cuts.md), there is no
feature-tier ladder. Channels differ by license scope, delivery, and AI
governance — never by analytical capability. Reasons:

- **Sales conversation is one sentence per buyer.** Individual: "€17/month,
  your own AI key, your work is yours." Company: "€120/month tenant-wide,
  IT-governed AI, security pack." No plan-comparison worksheet.
- **Customer success doesn't need plan-mapping.** Every customer is on the
  same analytical surface; support is consistent.
- **Engineering doesn't carry tier-gating UX.** Channel boundaries are
  build-time deployment differences, not runtime feature flags.
- **Distribution pricing honors ADR-033 H6 for companies**; the individual
  channel monetizes the long tail the company SKU can never reach.

Access control via project-membership ACLs is deleted from V1 (ADR-093 D1).
[Membership Philosophy](../08-products/membership-philosophy.md) is retained
as historical context only.

---

## 7. Audience-specific messaging

| Audience                      | What they care about                                      | Lead with                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Improvement lead (BB/MBB)** | "I need to replace the Minitab + Excel + PowerPoint loop" | Process to Control lifecycle. Investigation Wall with Measurement Plans. Cpk before/after proves whether the change held. Analysis Pack shares the story. |
| **Quality engineer (GB)**     | "I need more than Excel, less than Minitab"               | Four Lenses with linked filtering. Question-driven investigation. Capability + control limits. Local-first by default.                                    |
| **CI / OpEx lead**            | "I need a tool for improvement work"                      | One product specialists can use privately first. Process-to-Control loop. Three evidence types. Share artifacts before live collaboration.                |
| **Trainer / consultant**      | "I need a tool that teaches the methodology"              | Free PWA teaches structured EDA — same methodology, same lenses. The guided investigation builds statistical intuition.                                   |
| **Sponsor / Champion**        | "Did the project work? What did we learn?"                | Reads the Analysis Pack: Cpk delta, action completion, Control evidence, and next steps. Sign-off is optional, non-blocking, and out-of-band.             |
| **IT / Procurement**          | "Is this safe? Customer-owned? One vendor?"               | Local-first browser analysis. Optional Azure services stay in the customer's tenant. No VariScout-operated data cloud.                                    |

---

## 8. Two products on a roadmap

V1 is **VariScout**: the local-first process improvement workspace an
improvement specialist uses to replace the practical Minitab + Excel +
PowerPoint workflow. Three channels — free in-session, €17/€99 individual
(Paddle, BYOK AI), €120 company (Marketplace, tenant-governed AI) — one
analytical surface.

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

> After 50+ resolved findings in a customer environment, CoScout or a future
> local/company agent has genuine organizational memory: "Last time variation
> spiked on Line 3, the team changed nozzle spacing and Cpk went from 0.6 to
> 1.4." That memory is durable, vendor-locked only by methodology fit, and
> grows monotonically with completed work.

How it accumulates:

1. **Specialist/team investigates** — questions generated, evidence gathered, findings
   carry Cpk values and verified outcomes (not subjective RPN scores).
2. **Workspace or project closes** — Control verifies the fix held. The Report
   captures the chain: question → evidence → conclusion → action → outcome.
3. **Next investigation** — optional AI suggests from approved customer
   history, not from generic best practices.
4. **Improvement compounds** — each closed workspace/project makes the next faster.

Why it's defensible:

- **Customer-owned.** Knowledge stays in the customer's files, tenant, or
  approved environment. No vendor lock-in on the data layer.
- **Measurement-backed.** Traditional FMEA uses subjective 1–10 RPN scores.
  VariScout findings carry actual Cpk values and verified outcomes.
- **Investigation-structured.** Knowledge isn't raw documents — it's
  question → evidence → conclusion → outcome chains, enriched by uploaded
  SOPs and FMEAs that provide organizational context.
- **Accumulating.** Each resolved finding makes the next investigation
  faster. The moat deepens with usage.

No competitor captures the full improvement cycle with verified outcomes while
preserving a local-first/customer-owned knowledge boundary.

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
onto a chart tool — it is the product. The charts, the AI, the exports, and
the optional knowledge base all serve the investigation.

The methodology works on any data with repeated measurements and factors.
Manufacturing, healthcare, logistics, government services, education — the
questions are different, the investigation structure is the same.

**The methodology is the brand. The investigation is the product. The
knowledge is the moat.**
