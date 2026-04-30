---
title: VariScout User Journeys — Personas & Flows
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-24
related: [personas, flows, journey, modes]
---

# VariScout User Journeys — Personas & Flows

Ten personas drive VariScout's design decisions. Each follows the same journey spine (FRAME → SCOUT → INVESTIGATE → IMPROVE); the tools they use inside each phase vary by process question and evidence shape.

## The ten personas

1. **Analyst Alex** — data analyst, uses Standard mode, lives in statistics and charts.
2. **Engineer Eeva** — process engineer, uses Capability + Performance modes, specs-driven.
3. **Green-Belt Gary** — Six Sigma green-belt, formal DMAIC, may work across multiple Process Hubs.
4. **OpEx Olivia** — operational excellence lead, hub-first operating view, uses Process Hub rollups.
5. **Trainer Tina** — facilitator, uses PWA tier for workshops and classroom exercises.
6. **Student Sara** — first-time learner, uses PWA, embedded or standalone.
7. **Curious Carlos** — discovery mode, exploratory, comes in via content or SEO.
8. **Evaluator Erik** — prospective buyer, evaluating the product for a team.
9. **Admin Aino** — Azure admin, provisions tenants, manages access, reviews telemetry.
10. **Field Fiona** — gemba observer, captures photos, voice notes, and comments on the floor (mobile flows).

Full persona details: `docs/02-journeys/personas/`.

## Process Hub contexts

Process Hub adds an Azure organizational layer around the investigation spine.
A process owner may mostly live in one hub for a production line, queue, or
workflow. A quality engineer, GB/BB, OpEx lead, or development-org engineer may
work across multiple hubs to compare leverage, blocked work, verification gaps,
and charter candidates. The PWA remains investigation-first for training.

Evidence Sources are the recurring hub inputs that let those users ask whether
the process is meeting the requirement, what changed, and where to focus. The
Process Measurement System combines those sources, stable measure definitions,
targets, subgroup logic, trust checks, known x-control measures, and cadence
rules into Current Process State. Data Profiles sit behind recognized Evidence
Sources as deterministic adapters, not as a separate user-facing journey.

Today, the [Process Hub Capability tab](03-features/analysis/process-hub-capability.md)
is the cadence-review surface inside the Hub: it embeds the
production-line-glance dashboard (per-step Cpk vs target, gap trend, per-step
boxplot, per-step error Pareto) so a process owner can read the hub's current
state at a glance without leaving Hub IA.

## Usage levels

VariScout serves one nested methodology at several levels of use:

| Level                       | Typical user                      | Primary need                                                                                                                                      |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA / training              | Tina, Sara, Carlos                | Learn the investigation method without organizational persistence                                                                                 |
| Quick analyst dataset       | Alex, Eeva, Gary                  | Analyze one dataset and attach the learning to process context                                                                                    |
| Process-owner cadence       | Olivia, process owner, team lead  | Review Current Process State and choose the right response path (today: see [Hub Capability tab](03-features/analysis/process-hub-capability.md)) |
| GB/BB multi-hub scan        | Gary, Olivia, sponsor             | Compare hubs for leverage, charter candidates, and blocked work                                                                                   |
| Evidence-source enablement  | Admin Aino, data team, consultant | Fit recurring exports to VariScout contracts without custom integrations                                                                          |
| Sustainment/control handoff | Owner, quality, operations        | Decide what stays in VariScout and what moves to live monitoring                                                                                  |

The same investigation journey sits inside each level. Survey acts as the
readiness evaluator: it asks what the current data, signals, branches, and
verification evidence can support next.

## Current Process State and response paths

Process-owner cadence centers on Current Process State: the latest read of
outcome, flow, known x-control, capability structure, and trust measures. This
state is produced by the Process Measurement System, not by a generic dashboard.

Current Process State can trigger five response paths:

| Response path                 | Typical use                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| Quick team action             | Cause is obvious enough, low-risk, reversible, and locally owned.  |
| Focused investigation         | Pattern is real, but mechanism, subgroup, trust, or scope is open. |
| Chartered improvement project | High impact, cross-functional, expensive, regulatory, or unclear.  |
| Sustainment review            | Improvement is verified and should stay checked in VariScout.      |
| Control handoff               | Live control belongs in another operational system.                |

CoScout is grounded in the same shared process context. It can explain, draft,
and guide investigation work, but deterministic statistics, Survey, Signal
Cards, and user-confirmed evidence remain the authority.

## Process learning levels

The journey should be evaluated through three levels of process understanding,
not only through analysis modes:

| Level                      | Main user question                                                  | Common users                         |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| System / outcome           | Are we meeting the customer or business requirement?                | process owner, sponsor, OpEx, GB/BB  |
| Flow / process model       | Where does time, rate, throughput, wait, or bottleneck loss live?   | engineer, lean practitioner, analyst |
| Local mechanism / evidence | Which physics, recipe, condition, or measurement issue explains it? | local owner, expert, gemba observer  |

The same dataset can start at any level. A customer complaint or Cpk gap starts
at outcome level. Timestamped station data starts at flow level. A scoped
Yamazumi study, maintenance record, or gemba check starts at local-mechanism
level. VariScout's job is to connect those levels into durable process
understanding.

These levels generalize the existing investigation language: `Y` maps to
system/outcome, `X` maps to flow/concentration, and local `x` maps to mechanism
or evidence. Process Flow uses the same idea as line, station, and activity
levels.

## The unified journey spine

Every investigation - Standard, Yamazumi, Performance, Defect, Capability, or Process Flow - follows this spine:

1. **FRAME.** User names the concern and maps the evidence to the right
   process-understanding level: outcome, flow, or local mechanism. Three entry
   points per P5 (amended constitution): upfront hypothesis, evidence-ranked
   from data (Factor Intelligence), or observation-triggered (from a Four Lenses
   finding). Problem Statement captures Watson's 3 Qs. The Ocean spec editor
   writes per-column (USL / LSL / target / cpkTarget) to the CTS column's
   `measureSpecs` entry, and each `StepCard` carries the same per-column
   editor over its CTQ column, so the per-characteristic capability bar is
   set at every authored quality requirement (CTS at the ocean and a CTQ per
   process step) — the methodology's primary control-plan authoring surface —
   and the cascade (`resolveCpkTarget`) sees it everywhere downstream.

2. **SCOUT.** Data is parsed (wide-form, stack columns, defect events all
   supported). Characteristic types are inferred. Analysis modes surface
   variation, capability, flow, defect, or work-content patterns. First clues
   and questions emerge. The dashboard chrome carries a [timeline-window picker](03-features/analysis/timeline-window-investigations.md)
   (fixed / rolling / open-ended / cumulative) so every chart, every Finding,
   and every drift comparison agrees on the same temporal scope. Investigation-time
   defaults to `open-ended`. Per-column Cpk targets are editable inline in
   `ProcessHealthBar` or in the detailed `SpecEditor`; banding surfaces resolve
   the active target via the per-column → hub → investigation cascade
   (`resolveCpkTarget`).

3. **INVESTIGATE.** User builds one or more Mechanism Branches or
   SuspectedCause hubs. Each hub accumulates evidence: data (Evidence Map edges
   with R2adj from best-subsets regression), gemba (photos, notes), and expert
   knowledge. The investigation may discover a new x, check which known x
   changed, validate a suspected mechanism, scope the problem, resolve a trust
   gap, or verify an action. The investigation spine has three threads
   (ADR-066): regression discovery, hub UX, and EDA heartbeat. The investigation
   graph admits multiple projections — _Evidence Map_ shows it factor-centric
   (which factors matter?), [_Investigation Wall_](03-features/workflows/investigation-wall.md)
   shows it hypothesis-centric (which hypotheses are we betting on, what evidence
   holds them, what's missing?), and the _Question framework_ shows it
   question-centric (what are we trying to answer?).

4. **IMPROVE.** Hubs with strong evidence become HMW ("How Might We")
   brainstorming starters. Ideas are prioritized by timeframe, cost, risk, and
   impact (ADR-035). Selected ideas become action items; implementation is
   captured; outcome is compared to prediction via What-If Explorer.

## Mode experience

### Standard mode

The default for Alex, Gary, and most Azure Standard tier users. Entry: paste or upload data, map columns. Dashboard: I-Chart for time order, Boxplot for factor comparison, Pareto for category pile-up, Stats panel with Cp/Cpk/mean/sigma. Investigation proceeds by picking factors from Pareto ranks or Boxplot outliers, drilling into Evidence Map edges. Covered in this document; no separate mode journey doc.

### Yamazumi mode

Lean practitioners (industrial engineers, continuous improvement leads). Timing activities at each step, classifying each minute as Value-Adding, Necessary NVA, Waste, or Wait. Stacked yamazumi bars reveal which steps exceed takt. Rebalancing and waste elimination targets emerge from gaps to takt. **Deep journey:** `USER-JOURNEYS-YAMAZUMI.md`.

### Performance mode

Multi-channel analysts (injection molding cavities, filling heads, nozzles). Per-channel Cpk plotted; worst channels surface in Pareto. Cross-channel Boxplot shows distribution drift. Drill into a single channel for capability deep-dive. **Deep journey:** `USER-JOURNEYS-PERFORMANCE.md`.

### Defect mode

Quality engineers tracking PPM. Raw defect event logs are transformed into rates per time unit (mode transform runs during import; DefectDetectedModal confirms). Pareto of defect types, cross-type Evidence Map revealing patterns across multiple defect categories. **Deep journey:** `USER-JOURNEYS-DEFECT.md`.

### Capability mode

Quality engineers computing Cp/Cpk against specifications. Histogram + probability plot + capability statistics. Subgroup capability (ADR-038) when a subgroup column is mapped — Cp/Cpk/Pp/Ppk split by common-cause vs total variation. **Deep journey:** `USER-JOURNEYS-CAPABILITY.md`.

### Process Flow mode

Designed but not coded. Intended for bottleneck analysis across process steps. **Design reference:** `USER-JOURNEYS-PROCESS-FLOW.md`.

## Canonical flows

- **First-time user (any tier):** `docs/02-journeys/flows/first-time.md`
- **Returning user (Azure):** `docs/02-journeys/flows/return-visitor.md` + `project-reopen.md`
- **Azure daily use:** `docs/02-journeys/flows/azure-daily-use.md`
- **PWA education/workshop:** `docs/02-journeys/flows/pwa-education.md`
- **Factor Intelligence discovery:** `docs/02-journeys/flows/factor-intelligence.md`

Thirteen additional flows (distribution-specific: SEO, content, social, enterprise, mobile) in `docs/02-journeys/flows/`. These are reference, not orientation.

## Voice-assisted Azure flow

Azure Standard and Azure Team add an optional **transcript-first voice path** for two personas in particular:

- **Field Fiona** can hold to speak on mobile while documenting a finding or comment beside the process.
- **Analyst Alex** can tap to record on desktop when working through an investigation with CoScout.

The interaction is intentionally constrained:

- Voice fills the existing text draft; it does not auto-send.
- CoScout replies remain text in v1 so citations, proposals, and saved findings stay visible.
- Raw audio is discarded after transcription; the durable artifact is the transcript in the normal thread or comment.
