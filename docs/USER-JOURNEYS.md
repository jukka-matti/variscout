---
title: VariScout User Journeys — Personas & Flows
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-24
related: [personas, flows, journey, modes]
---

# VariScout User Journeys — Personas & Flows

Ten personas drive VariScout's design decisions. Each follows the same journey spine (FRAME → SCOUT → INVESTIGATE → IMPROVE); the tools they use inside each phase vary by analysis mode.

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

## The unified journey spine

Every investigation — Standard, Yamazumi, Performance, Defect, Capability, or Process Flow — follows this spine:

1. **FRAME.** User names the problem. Three entry points per P5 (amended constitution): upfront hypothesis, evidence-ranked from data (Factor Intelligence), or observation-triggered (from a Four Lenses finding). Problem Statement captures Watson's 3 Qs.

2. **SCOUT.** Data is parsed (wide-form, stack columns, defect events all supported). Characteristic types inferred. The Four Lenses surface variation patterns. First hypotheses emerge.

3. **INVESTIGATE.** User picks one or more suspected causes — the SuspectedCause hub model (ADR-064) is the organizing entity. Each hub accumulates evidence: data (Evidence Map edges with R²adj from best-subsets regression), gemba (photos, notes), expert knowledge. The investigation spine has three threads (ADR-066): regression discovery, hub UX, EDA heartbeat.

4. **IMPROVE.** Hubs with strong evidence become HMW ("How Might We") brainstorming starters. Ideas prioritized by timeframe × cost × risk × impact (ADR-035). Selected ideas become action items; implementation captured, outcome compared to prediction via What-If Explorer.

## Per-mode distinctive experience

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
