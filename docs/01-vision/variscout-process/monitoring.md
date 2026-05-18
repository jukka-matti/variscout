---
title: 'Monitoring — drift detection, alerts, process-owner views'
audience: [product, designer, engineer, quality-manager]
category: strategy
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/archive/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md
layer: L1
---

# Monitoring — drift detection, alerts, process-owner views

> **Status: named-future capture.** Process-owner monitoring is the "ongoing watching" half of process ownership — drift detection, alert routing, capability snapshots over time, decisions queue at cadence. V1 defers monitoring as a process-owner concept. V1 keeps Sustainment auto-fire (ADR-080) which is the only V1 monitoring shape; everything else is Process.

## §1 What monitoring is, and what it isn't

Monitoring in Process is **cadence-shaped, not real-time**. It's the disciplined recurring read of Current Process State that surfaces decisions to the Process Owner persona on a daily / weekly rhythm. It is not:

- **A real-time alarm runtime.** SCADA, MES, and operational monitoring systems own real-time alarming. Process integrates with them as upstream Evidence Sources, not as a replacement.
- **A shift-critical escalation tool.** When something breaks the line, the operations team uses their existing escalation tooling. Process surfaces the post-event analysis at cadence; it doesn't replace the incident-response stack.
- **An uptime / SLA monitoring product.** APM and reliability tooling own that. Process is process-improvement-shaped, not infrastructure-shaped.

What monitoring IS in Process:

- **Drift detection** at cadence — has any measure's distribution shifted in a way that warrants attention?
- **Alert routing** — when drift fires, who gets the prompt and at what surface?
- **Capability snapshots over time** — how has the process's capability evolved across snapshot cycles?
- **Decisions queue** — the surface where drift signals + cadence prompts + signoffs surface as actionable items for the Process Owner.
- **Sustainment cadence** — verifying that completed improvements stay sustained at the cadence the project closed at.

## §2 Drift detection

Drift detection compares the **latest Snapshot's distribution** to the **prior reference window** for each measure. The detection answers: _"is what we see different from what we expected?"_ (the universal lens, per [methodology.md §3.3](methodology.md)).

| Drift type                        | What it detects                                                                      | Surface                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Capability drift**              | Cpk has declined materially vs prior reference window                                | Process tab decisions queue; routed to Process Owner           |
| **Distribution shift**            | Mean or σ has shifted (with sample-size honesty)                                     | Signal Card on relevant measure; visible during cadence review |
| **Out-of-control signal**         | Recent points violate Western Electric / Nelson rules on the i-chart for the measure | Process tab decisions queue; severity-flagged                  |
| **Spec breach**                   | Recent points breach USL or LSL                                                      | Process tab decisions queue; immediate-attention severity      |
| **Throughput / cycle-time drift** | Step output rate, FPY, or cycle time has declined                                    | Process tab decisions queue; routed to Process Owner           |
| **Defect rate increase**          | Defect rate per category has increased materially                                    | Process tab decisions queue; routed to Process Owner           |

Each drift type carries:

- A reference window (the "expected" baseline)
- A latest window (the "observed" reality)
- A statistical test or rule that triggered the detection
- A response-path suggestion (Investigate / Quick Action / Charter / Sustainment)

**Sample-size honesty applied.** Drift detection respects the Watson invariants ([methodology.md §3.4](methodology.md)). A drift signal on a measure with n<10 is **suppressed**; the Signal Card shows "needs evidence" instead. A drift signal on n<30 is **badged "trust pending"**. Both prevent the false-positive flood that would otherwise undermine the Process Owner's trust in the queue.

## §3 Process Owner monitoring views

The Process Owner's daily / weekly artifact is the **Process tab in State mode** ([four-personas.md §2.1](four-personas.md)). The State mode surfaces three sections in attention order:

### §3.1 Needs your decision (decisions queue)

Primary attention; indigo-accent cards. Items requiring the Process Owner's input across their assigned Hubs:

- Drift escalations (capability degradation, out-of-control signals, spec breaches)
- Sustainment cadence prompts (project ready for "did it work?" verification per ADR-080 auto-fire)
- Charter signoff requests (Specialists requesting new project authorization)
- Cross-persona handoffs (Process Engineer flagging a mechanism finding for Process Owner review)
- Pending measurement plans on Hypotheses where the Process Owner is the consultative role

Each queue item carries a response-path CTA. Clicking the CTA lands the Process Owner in the workspace they need (Charter form, Sustainment closure view, Investigation Wall, etc.).

### §3.2 Current state

Outcome panel + Cpk + drift indicators per assigned Hub. The L1 outcome view rendered at portfolio shape — small per-Hub miniatures if the Process Owner owns multiple Hubs, full L1 if they own one.

This is the "scan" surface — the Process Owner reads it for context, not for action. The decisions queue is the action surface.

### §3.3 Process map

The L2 process flow view (canonical map with state badges per step). State badges encode:

- Capability status (target met / trust pending / below target / breach)
- Drift indicator (none / drifting / out-of-control)
- In-flight investigation count (which steps have active Hypotheses?)

Clicking a step badge drills to L3 focal step detail. The Process Owner uses this to read which steps are healthy and which warrant attention — without entering an investigation.

### §3.4 In-flight references

Read-only links to current Improvement Projects, recent actions, open investigations, recent Findings. Compact badge format; not full cards. The full workspaces live in the relevant tabs (Project tab, Improve tab, Investigation tab).

## §4 Hub-overview monitoring (multi-Hub Process Owner)

When a Process Owner is assigned multiple Hubs, their Process tab landing is a **portfolio shape** rather than a single-Hub State mode. The portfolio shape renders:

- Per-Hub miniature L1 outcome panel
- Per-Hub drift indicator
- Cross-Hub decisions queue (queue items aggregated across all assigned Hubs)
- Hub-level Sustainment cadence prompts

The cross-Hub aggregation honors ADR-073: each Hub's metrics compute locally; the portfolio renders them adjacent; no `meanCpkAcrossHubs()` exists. The portfolio is **visual aggregation only**.

A Process Owner with five Hubs sees five miniatures + a consolidated decisions queue. They route from the queue to the relevant Hub's full State mode when they need to act. The portfolio is the orchestration layer; the State mode is the workspace.

## §5 Alert routing

Alerts route to **personas + surfaces**, not to email lists. The default routing matrix:

| Signal type                            | Primary persona                                                                                                       | Surface                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Capability drift on outcome measure    | Process Owner                                                                                                         | Decisions queue                                                                |
| Capability drift on in-process measure | Process Owner                                                                                                         | Decisions queue, plus cross-reference to Process Engineer for mechanism review |
| Out-of-control signal                  | Process Owner                                                                                                         | Decisions queue (severity-flagged)                                             |
| Spec breach                            | Process Owner                                                                                                         | Decisions queue (immediate-attention severity)                                 |
| Sustainment cadence prompt             | Project Lead (Specialist)                                                                                             | Inbox + decisions queue                                                        |
| Charter signoff request                | Sponsor (Leader)                                                                                                      | Decisions queue (Leader's portfolio overview)                                  |
| Cross-persona handoff                  | Target persona                                                                                                        | Decisions queue + Inbox                                                        |
| Survey-readiness failure               | Specialist (where Specialist is on the affected project) or Process Engineer (where measure lifecycle is the concern) | Inbox                                                                          |

**Off-product notification** is optional and per-tenant configurable: an EngagementEvent webhook fires to Microsoft Teams / Power Automate / Slack when a signal arrives. The in-app surface is the source of truth; the off-product notification is a redirect.

## §6 Capability snapshots over time

The Hub's capability is tracked **across Snapshots**. The capability trend is a first-class read:

- Per-step Cpk per Snapshot cycle (timeline)
- Distribution of per-(step × context) Cpks per Snapshot (timeline of distributions, not means)
- Capability delta vs prior cycle (rolling)
- Capability delta vs a marked baseline (the snapshot when an Improvement Project closed Sustainment — "are we still where we ended up?")

V1 ships per-snapshot capability computation. **What's named-future**: the timeline view that renders capability evolution across the Hub's full Snapshot history, the per-baseline delta view, and the auto-fire Sustainment trigger that fires when capability drifts below a closed project's baseline.

The ADR-080 Sustainment auto-fire pattern is the V1 piece that survives — when a project closes Sustainment with a capability commitment, the cadence-triggered re-check at the project's scheduled interval fires automatically. Process generalizes this from project-bounded to Hub-persistent.

## §7 Sustainment monitoring

Sustainment in Process is **continuous**, not bounded by project lifecycle. When a project closes Sustainment, the improvement's expected capability becomes part of the Hub's PMS — a stable measure with a target and a cadence-driven verification schedule.

The Sustainment monitoring view per Hub:

- List of completed improvements with their committed capability baselines
- Current capability per improvement (latest Snapshot)
- Drift status vs baseline (sustained / drifting / regressed)
- Last verification timestamp + next scheduled verification

When a sustained improvement starts drifting, the Process Owner gets a decisions-queue item: "Improvement X is regressing — investigate?" Response paths from there: Investigate (new project), Quick Action (small fix), or Re-Charter (re-open the original project for follow-up).

This is what makes Process improvements **durable** rather than one-shot. V1 ships the Sustainment stage; the cross-project durability monitoring is Process.

## §8 What V1 explicitly defers

Per the wedge spec §7 and §10 deferrals:

- **Process Owner-shaped cadence monitoring dashboard** — the State-mode-only Hub overview surface (separate from per-project Process tab) is Process scope.
- **Persona-aware Home variants** — V1 ships one Home shape (Specialist); Process Owner's portfolio-shape default landing is Process.
- **Hub-of-hubs portfolio overview** — [hub-portfolios.md §3](hub-portfolios.md). Leader's primary landing.
- **Cross-Hub decisions queue aggregation** — Process Owner with multiple Hubs.
- **Off-product notification webhook (EngagementEvent → Teams / Power Automate / Slack)** — designed; not implemented.
- **Sustained-improvement durability monitoring** — V1 ships Sustainment as project-bounded; Process makes it Hub-persistent.

What V1 keeps: the ADR-080 Sustainment auto-fire pattern (project-bounded), the existing drift detection at the per-project scope (computed when the Specialist runs analysis), and the basic capability + i-chart rules that drift detection would consume.

## §9 Why this retired from V1

The V1 pivot collapsed monitoring because:

1. **Monitoring is a process-owner concept.** V1's single Specialist persona doesn't have a monitoring job — they have an investigation job. Specialists don't open VariScout to scan; they open it to analyze.
2. **The cadence layer requires PMS.** Without the Process Measurement System ([measurement-system.md](measurement-system.md)), there's no cadence to monitor on; drift detection has nothing to compare against beyond the Specialist's most recent manual paste.
3. **Alert routing requires the persona model.** Without 4 personas, there's no routing problem — everything goes to the Specialist. The routing decisions (who sees what) only matter when more than one persona is in the product.
4. **Scope discipline.** V1 needs to ship as the smallest defensible anatomy. Monitoring is a large surface area (multiple views, multiple persona routes, drift-detection engine integration); shipping it before V1 validates would dilute V1's scope.

Monitoring activates in Process when the four-persona model + PMS layer + auto-ingestion are all in place — they're a prerequisite set, not independent capabilities. Activation order matters: introduce Process Owner persona first ([four-personas.md §9](four-personas.md)), then PMS, then the Hub-overview surface, then drift detection on top.

## §10 Cross-references

- The ADR-080 Sustainment auto-fire pattern (the V1 surviving piece): [`docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md`](../../07-decisions/adr-080-sustainment-auto-fire-pattern.md).
- The decisions-queue and State-mode design that monitoring populates: [Wedge spec §3.3.2](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) (the V1 State-mode shape that Process expands).
- The persona × surface routing that determines who sees which alert: [four-personas.md](four-personas.md).
- The PMS layer that produces Current Process State for drift detection to read: [measurement-system.md](measurement-system.md).
- The Hub-of-hubs portfolio overview that the Leader persona's monitoring view renders: [hub-portfolios.md §3](hub-portfolios.md).
- The Coherence persona-aware State-mode design that originally specified Process Owner monitoring: [Coherence spec §4](../../archive/specs/2026-05-14-variscout-coherence-design.md).
