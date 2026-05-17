---
title: 'Process Measurement System (PMS) — stable measures + cadence + Current Process State'
audience: [product, designer, engineer, quality-manager]
category: methodology
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md
  - docs/superpowers/specs/2026-04-29-consolidated-method-and-surface-overview-design.md
  - docs/superpowers/specs/2026-04-29-multi-level-scout-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
---

# Process Measurement System (PMS) — stable measures + cadence + Current Process State

> **Status: named-future capture.** PMS is the cadence-review substrate for the Process Owner persona. Stable measure definitions + Evidence Sources + Snapshots + Signal Cards + Survey readiness + cadence rules combine into the latest structured read of a process — **Current Process State**. The V1 wedge defers this surface explicitly; the engine pieces are partly shipped today, the cadence-review surface is named-future.

## §1 What PMS is, and what it isn't

The Process Measurement System is **not** a separate product or a separate analytical engine. It's the **disciplined recurring use** of VariScout's existing analytical primitives, organized around a process's stable measure definitions and review cadence.

The structure:

| Component                      | Purpose                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stable measure definitions** | What this process is measured by — outcome measures, in-process measures, defect categories, throughput metrics. Defined once per Hub; persistent across investigations.     |
| **Evidence Sources**           | Recurring evidence streams that feed measurements — a daily fill-weight export, a weekly claims-queue extract, a continuous sensor stream. Per [pipelines.md](pipelines.md). |
| **Snapshots**                  | Dated evidence packages. One Snapshot per Evidence Source per cadence cycle. The unit of "what changed since last review."                                                   |
| **Signal Cards**               | Compact per-measure cards rendering Current Process State — Cpk, trend, drift, recent context.                                                                               |
| **Survey readiness**           | Per-measure check: do we have enough recent evidence, of the right shape, to interpret this measure today?                                                                   |
| **Subgroup logic**             | Per-measure: how do we group samples? (Subgroup size, time bucketing, context stratification.)                                                                               |
| **Targets**                    | Per-measure spec rules — USL / LSL / target / cpkTarget. Indexed by `(node × context-tuple)` per the existing per-characteristic spec model.                                 |
| **Cadence rules**              | When does this process get reviewed? Daily huddle, weekly process review, monthly leadership review, ad-hoc on signal.                                                       |

Together these produce **Current Process State** — not "stable" or "unstable" as a label, but a cadence-review surface that triggers a response path. The Process Owner persona consumes Current Process State as their primary daily / weekly artifact.

PMS is **not** real-time monitoring. It's **not** an alarm runtime. It's **not** an ERP integration platform. It's the disciplined cadence-shaped consumption of the process's recurring evidence by the right persona at the right interval.

## §2 The three timescales

PMS operates on three timescales simultaneously. The cadence rules per measure route different measures to different timescales.

### §2.1 Daily huddle scale

**Question.** "What changed today? What needs attention now?"

**Surface.** Hub's daily huddle view — latest Snapshot's Current Process State for each measure flagged as `cadence: daily`. Compact Signal Cards; one screen.

**Persona.** Process Owner (primary), Specialist (when investigating actively), Process Engineer (when on-call for the process).

**Triggers.** Drift indicator on any measure → routes to Process Owner's decisions queue. Survey-readiness check failing → routes to Specialist to gather more evidence. Sustainment cadence prompt fired → routes to the project owner (Lead).

### §2.2 Weekly process review scale

**Question.** "Is the process meeting requirements over the last week? Where are recurring focus areas? What should be sustained or escalated?"

**Surface.** Hub's weekly review view — Snapshot history compare across the last N cycles. Trend chart per measure. Capability over time. Recent Findings + Hypotheses surfaced from in-flight investigations.

**Persona.** Process Owner (primary), Process Engineer (when expert input is needed on emerging Hypotheses), occasionally Leader (when reading a specific Hub).

**Triggers.** Sustained drift over multiple cycles → response path Charter (escalate to formal investigation). Capability improvement validated across cycles → response path Sustainment (cadence to verify it stays). Recurring focus pattern → response path Investigate (start a new Improvement Project).

### §2.3 Monthly / quarterly leadership scale

**Question.** "How is this portfolio doing? Which Hubs need attention? Where are we investing improvement work?"

**Surface.** Org-level overview ([hub-portfolios.md §3](hub-portfolios.md)) — Hub-of-hubs side-by-side, portfolio drift indicators, Sponsor signoff queue, recent Sustainment closures. Per-Hub computation; no cross-Hub arithmetic.

**Persona.** Leader.

**Triggers.** Hub-level drift escalation → Process Owner of affected Hub flagged for response. Charter approval queue → Leader signoff. Portfolio resource allocation decisions (out-of-app, but informed by the overview).

## §3 Current Process State — the cadence-review surface

**Current Process State** is what the cadence-review view renders. It is the latest structured read of the process across:

| Axis                     | What it surfaces                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Outcome**              | L1 outcome distribution + Cpk vs target + drift. Per the multi-level methodology.                                         |
| **Flow**                 | L2 process map with state badges per step — capability badge, drift indicator, in-flight investigation count.             |
| **Known x-control**      | Which factors are being actively controlled. Stratification status.                                                       |
| **Capability structure** | Per-(step × context-tuple) capability summary. The Hub Capability tab content, surfaced in cadence-review shape.          |
| **Trust**                | Per-measure: is the evidence current enough, large enough, the right shape? Sample-size honesty applied across the board. |

Current Process State is not a single number. It is not a stability label. It is a **structured read** that surfaces what the Process Owner needs to decide on today.

The decisions queue (the indigo-accent cards at the top of the Process tab State mode) is where Current Process State surfaces as **actionable signals**. Each queue item carries a response-path CTA — Investigate / Quick Action / Charter / (auto-fired) Sustainment.

## §4 Stable measures vs investigation measures

**Stable measures** are the measures the process is run by. They persist across investigations, snapshots, and time. The Hub's Process Owner defines them; they don't change with each Improvement Project.

Examples:

- Fill weight on Line 4 (outcome measure)
- Cap torque per head (in-process measure)
- Customer escapes per million (lagging outcome)
- Defect rate by category (defect measure)
- Cycle time per workflow step (throughput measure)

**Investigation measures** are project-specific. A Specialist running an Improvement Project may introduce additional factors / measures specific to their investigation that aren't in the Hub's stable definitions. These don't promote to the Hub's PMS unless the investigation produces a Finding that justifies adding the measure.

The promotion path: investigation produces a strong Finding → the measure that revealed the Finding gets considered for promotion to stable → Process Engineer reviews → if accepted, the measure joins the Hub's stable definitions and starts being surfaced in Current Process State.

This is **how the Hub learns over time**. The Knowledge Catalyst feature ([scope-line.md §4](scope-line.md)) is the durable record of which investigation measures have promoted to stable status.

## §5 Cadence rules per measure

Each stable measure carries a cadence rule. The cadence determines which timescale surface renders it and how often Current Process State is recomputed for that measure.

| Cadence                   | Refresh interval                     | Surface                                                                               |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| **Manual**                | On-demand (Specialist runs analysis) | Per-project Analyze tab                                                               |
| **Shiftly**               | Per shift (typically 8h)             | Process tab daily huddle view                                                         |
| **Daily**                 | Daily                                | Process tab daily huddle view                                                         |
| **Weekly**                | Weekly                               | Process tab weekly review view                                                        |
| **Hourly** (named-future) | Hourly automated                     | Process tab daily huddle view; requires auto-ingestion ([pipelines.md](pipelines.md)) |

When a Snapshot lands at the cadence interval, the PMS recomputes Current Process State and updates Signal Cards. If drift / breach / out-of-control is detected, the relevant queue items surface for the Process Owner.

V1's `EvidenceSnapshot` type exists at `packages/core/src/evidenceSources.ts:43-51`. It carries `origin`, `importedAt`, `rowTimestampRange`. The cadence rules + automated refresh layer is named-future — V1 has the Snapshot data model but no cadence-triggered refresh.

## §6 Survey readiness check

For each stable measure, the Survey readiness check answers: **do we have enough recent evidence, of the right shape, to interpret this measure today?**

Six V1 rule categories (also named-future as a generalized cross-phase methodology layer):

1. **Status.** When did this measure last receive a Snapshot? Is it stale?
2. **Data collection.** Is the recent Snapshot adequate sample size? Are required columns present?
3. **Triangulation.** Are Gemba and Expert evidence available where the Data evidence alone would be ambiguous?
4. **Power.** For comparative analyses, do we have enough samples per group?
5. **Drift.** Has the measure's distribution shifted in a way that flags the recent Snapshot as not comparable to prior cycles?
6. **Lifecycle.** Is the measure still meaningful for the current process configuration? Or has the process changed enough that this measure no longer answers the question it was defined for?

When a readiness check fails, the measure's Signal Card carries a "needs evidence" badge. The decisions queue surfaces a routing item to whoever can address it (Specialist for sample-size, Process Engineer for triangulation, Process Owner for lifecycle review).

This is **dual-surface** in Process: inline on the Signal Card + as Inbox prompts to the responsible persona.

## §7 How PMS triggers response paths

Per the three V1 canvas response paths + the auto-fire Sustainment pattern (ADR-080), Process expands the routing:

| Trigger                                                  | Response path                                        | Routed to                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Drift detected on outcome measure                        | Investigate or Charter (Specialist's choice)         | Specialist persona, with cross-project Hypothesis cross-reference surfaced             |
| Drift detected on multiple measures over multiple cycles | Charter (escalation)                                 | Process Owner signs off; Leader may be Sponsor                                         |
| Single-cycle out-of-spec breach                          | Quick Action                                         | Specialist responsible for the relevant step                                           |
| Sustainment cadence interval reached                     | Sustainment auto-fires                               | Project Lead reviews; closes or extends                                                |
| Capability improvement validated across cycles           | Sustainment closure                                  | Project Lead + Sponsor signoff                                                         |
| Recurring focus pattern across multiple Snapshots        | Investigate (new project)                            | Specialist accepts assignment; Charter inherits the recurring focus as initial context |
| Survey readiness failing (sample size)                   | Measurement Plan creation on the relevant Hypothesis | Specialist adds Plan; collection follows                                               |
| Survey readiness failing (lifecycle / measure stale)     | Measure-review decision                              | Process Engineer + Process Owner discuss in next weekly review                         |

Each routing carries the relevant artifact link — clicking a queue item lands the user in the workspace they need (Process tab L2 for Investigate, Improvement workspace for Sustainment closure, Charter form for escalation).

## §8 Process Measurement System vs Improvement Project lifecycle

PMS is **continuous**. Improvement Projects are **bounded**. They coexist on a Hub.

The Hub's PMS surfaces Current Process State at cadence. When the state surfaces a problem worth structured investigation, a project is chartered. The project runs its lifecycle (Charter → Approach → Sustainment) and closes. The Hub's PMS continues — the project's outputs (validated improvement actions, new Findings, sometimes new stable measures) feed back into PMS. The Hub's Current Process State reflects the post-project reality.

A Hub may have multiple projects open simultaneously, each addressing a different problem the PMS surfaced. The Hub Owner (Process Owner) sees all active projects in their Hub-overview view; the projects themselves are workspaces for the Specialists who lead them.

This is **how PMS makes the methodology continuous**. V1 ships the Improvement Project lifecycle but doesn't ship PMS — V1 projects exist without a persistent PMS layer underneath them. In Process, the PMS layer is the daily artifact; projects are events on top of it.

## §9 Cross-references

- The Evidence Source / Snapshot / Profile Application data model is specified in [Evidence Sources and Data Profiles spec](../../superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md). The V1 implementation slice exists; the cadence-review surface that consumes the data is named-future.
- The PMS → Current Process State framing is articulated in [Consolidated Method and Surface Overview §4](../../superpowers/specs/2026-04-29-consolidated-method-and-surface-overview-design.md).
- The auto-fire Sustainment pattern that PMS extends is [ADR-080](../../07-decisions/adr-080-sustainment-auto-fire-pattern.md).
- The three-level methodology that PMS organizes evidence around is in [methodology.md](methodology.md).
- The monitoring surfaces that render Current Process State live in [monitoring.md](monitoring.md).
