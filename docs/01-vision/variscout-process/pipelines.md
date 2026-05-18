---
tier: stable
purpose: orient
title: 'Pipelines — auto-ingestion, multi-source profile join, scheduled refresh'
audience: human
category: strategy
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md
  - docs/superpowers/specs/2026-04-26-agent-review-log-process-hub-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
layer: L1
---

# Pipelines — auto-ingestion, multi-source profile join, scheduled refresh

> **Status: named-future capture.** Auto-ingestion is the "automated data" half of process ownership — the substrate that makes recurring evidence operationally cheap. V1 ships with manual paste + file upload only; sensor / SCADA / ERP feeds, scheduled refresh, and multi-source profile join at Hub scale are deferred to Process. The Evidence Source data model exists in V1 today as a partial implementation slice.

## §1 Why Process needs auto-ingestion

V1's data path is **manual**: the Specialist pastes data, uploads a CSV, or starts from a sample dataset. This works for V1 because the Specialist controls when data enters the product — they paste before they analyze, the rhythm matches their workflow.

Process Owners operate differently. They don't paste data when they want to analyze; they need the data to **already be there** when they open the product at cadence. A Process Owner who has to ask the data team for an extract every Monday morning is not in a cadence loop — they're in an interruption loop. The Process tab opens, Current Process State is current, decisions surface — or it doesn't, and the product fails its persona's job.

Auto-ingestion closes the loop. The Evidence Source data model + Data Profile adapter + Snapshot history gives Process Owners a Hub whose data refreshes on a cadence schedule without their intervention.

This is the canonical V1-vs-Process line for ingestion:

- **V1**: manual paste + file upload only. Cadence is "when the analyst decides to look."
- **Process**: automated Evidence Sources at the cadence the process needs (shiftly / daily / weekly / hourly). Cadence is the process's natural rhythm.

## §2 The data model (partly shipped in V1)

The Evidence Source data model exists in V1 core as a first implementation slice. The objects in scope:

| Type                        | Purpose                                                             | V1 status                                           |
| --------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| **`EvidenceSource`**        | User-facing Hub-level source of recurring evidence                  | Type exists; UI surface partial                     |
| **`DataProfileDefinition`** | Reusable deterministic adapter for a recognizable source-data shape | Type exists; one profile (Agent Review Log) defined |
| **`EvidenceSnapshot`**      | One dated evidence package from an Evidence Source                  | Type exists; produced by V1 paste flow              |
| **`ProfileApplication`**    | Profile version + confirmed mapping used for one Snapshot           | Type exists; not yet wired across all paths         |

What's named-future is the **operational layer above the data model** — scheduled refresh, sensor / SCADA / ERP source adapters, generalized Evidence Source authoring UI, automated profile recognition.

## §3 Evidence Source — the user-facing concept

An Evidence Source belongs to a Process Hub and is named in the language of the Process Owner:

- "Line 4 fill-weight export"
- "Claims queue weekly extract"
- "Supplier intake defects"
- "Agent review log"
- "Verification audit sample"

The Source answers **what the team will review on a cadence** and how that evidence feeds the Hub. It supports:

- Cadence-board signals (Current Process State recomputation)
- Survey readiness checks (do we have enough recent evidence?)
- New or existing investigations (a paste flow can append to an Evidence Source's Snapshot history)
- Action verification (Sustainment-stage validation)
- Sustainment / control reviews (cadence-driven monitoring)
- Handoff to live systems when control moves outside VariScout (the export-and-archive path)

**Boundary.** Evidence Sources do **not** make VariScout an integration platform. The customer's data team or an external consultant owns the extraction + transformation from source systems (SAP, MES, QMS, CRM, agent runtime, ACD, etc.) into documented contracts. VariScout owns the import contracts, validation, deterministic profile application, evidence snapshots, and the investigation workflow that uses them.

This is **not** an ERP / MES / QMS / CRM / agent-runtime integration. It's a recurring data contract.

## §4 Data Profile — the deterministic adapter

A Data Profile is reusable deterministic logic for a recognizable data shape. It can:

- Recommend mappings (which column → which canonical-map node)
- Derive analysis-ready columns (computed fields from raw)
- Validate required + optional fields
- Preserve source columns for inspection
- Carry version metadata so the Profile Application records which profile + which mapping was used per Snapshot

Profiles are **implementation / design concepts, not primary user language**. Users set up Evidence Sources; VariScout may say that the source uses a profile when that helps explain a mapping, validation result, or migration. The user doesn't author profiles — VariScout (or a partner / consultant) does.

**First concrete example: Agent Review Log Profile.** Adapts agent review exports (green / yellow / red decisions, confidence scores, audited correctness) into ordinary process evidence for safe-green-throughput investigations. The target metric is _"increase the share of green pass-through decisions while keeping false-green decisions below an agreed tolerance."_ See [Agent Review Log Profile spec](../../superpowers/specs/2026-04-26-agent-review-log-process-hub-design.md).

Other Process-era profiles likely to ship: time-series fill measurements (the canonical manufacturing case), call-center queue exports, claims queue exports, supplier defect intake feeds, sensor stream rollups (computed by customer-tenant ingestion, not raw sensor data — see §6).

## §5 Snapshot — the recurring evidence unit

A Snapshot is one evidence package from a Source. It may arrive by paste, upload, append, customer-owned Blob sync, or a future customer-controlled export drop.

**Snapshot timing is an improvement cadence**, not real-time:

- Manual (analyst-triggered append)
- Shiftly (per shift, typically 8h)
- Daily
- Weekly
- Hourly (when that fits the process review need, and customer-tenant ingestion handles the volume)

Snapshots are what Current Process State and the Hub cadence-board reason over:

- What changed since the last Snapshot
- Whether requirements are being met
- Where variation / defects / wait / burden / unsafe outcomes concentrate
- Whether an action has enough post-change evidence for verification
- Whether a sustainment item still needs review in VariScout
- Whether the right response path is Quick Action, Focused Investigation, Charter, Sustainment, or Handoff

The same cadence-board supports both **daily huddles** (latest Snapshot + open investigation metadata) and **weekly process reviews** (Snapshot history compare across the last N cycles). See [measurement-system.md §2](measurement-system.md) for the three-timescale shape.

V1 has one Snapshot path live (the Agent Review Log Profile path). Broader daily / weekly comparison generalized across Source types is named-future.

## §6 Customer-tenant ingestion + rollups (named-future)

When Evidence Sources become **automated or hourly**, raw Snapshot files should not be the browser's primary read model. The named-future architecture:

1. **Hourly or automated production-line data lands as immutable raw files in the customer-tenant Blob Storage.** (Per ADR-059: customer data stays in customer's tenant.)
2. **A narrow customer-tenant ingestion processor** writes Snapshot manifests + period rollups + validation reports back to Blob.
3. **Process Hub reads rollups first**, raw only on explicit drill-down.

This keeps the browser-only processing principle intact (ADR-059) while making hourly-cadence operations feasible. The processor lives in the customer's Azure tenant; VariScout provides the deterministic logic + manifests; the customer owns the compute.

The logical Process Hub evidence namespace in Blob:

```
process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...
```

This namespace holds snapshot files, profile application metadata, validation reports, and related attachments. The processor reads + writes to this namespace; the browser reads from it.

V1 doesn't have this layer. V1 paste flow writes directly to the Hub blob (Azure) or IndexedDB (PWA). The customer-tenant ingestion architecture activates when Hub-level automation activates.

## §7 Multi-source profile join

A single canonical map can have **multiple Evidence Sources** contributing to it. The fill-line Hub's canonical map has steps `Fill`, `Cap`, `Label`, `Crown`. Three Evidence Sources feed it:

- "Line 4 fill measurements" (sensor → daily Snapshot of `Fill_Weight`)
- "Cap torque audit" (manual measurement → weekly Snapshot of `Cap_Torque`)
- "Final inspection defects" (defect log → daily Snapshot of defect category counts)

Each Source has its own Data Profile (the deterministic mapping from source-data shape to canonical-map columns). The Hub's Current Process State integrates across all three Sources — each Source contributes its own measures to the per-step Signal Cards.

**Multi-source join logic.** The V1 framing-layer work (`MatchSummaryCard`, `EvidenceSourceSync`, per-source provenance, `archiveReplacedRows`, `RowProvenanceTag`) implements the join engine. In V1, the join operates per-project (one investigation's data may come from multiple Sources). In Process, the same engine operates **at Hub scope** — the Hub's accumulated multi-Source evidence join is Current Process State's substrate.

The provenance shape (per ADR-077): `EvidenceSnapshot.origin`, `importedAt`, `rowTimestampRange` + sidecar `RowProvenanceTag` map. Process inherits this verbatim.

## §8 What V1 explicitly defers

The wedge spec §3.6.5 and §7 list the Process-only pieces of pipelines:

- **Auto-ingestion / sensor feeds.** Re-ingestion in V1 uses the existing paste flow. Sensor / SCADA / ERP feeds defer to Process.
- **Multi-source provenance gating.** The framing-layer Slice 2/3 work stays in flight for V1 but is not a V1 blocker; basic re-paste suffices for V1's specialist scope.
- **Scheduled refresh.** No cadence-triggered Snapshot creation in V1. Process owns the scheduler.
- **Customer-tenant ingestion processor.** No automated Blob → Hub processor in V1. Process owns the customer-tenant compute architecture.
- **Generalized Evidence Source authoring UI.** V1 has the data model; the user-facing Source-setup UI generalized across Source types is Process-scope.

What V1 keeps: the paste / file upload paths, the Snapshot data model, the per-source provenance logic, the framing-layer join engine, the Agent Review Log Profile (which V1 doesn't enable as a UI surface but which exists as a code artifact).

## §9 Non-goals (across both V1 and Process)

These are explicitly out of scope regardless of which product:

- **No deep or custom ERP / MES / QMS / CRM / ACD / AI-platform / workflow integrations.** Customers' data teams own those.
- **No live alarms, runtime monitoring, shift-critical escalation, or operational uptime promise.** Process is cadence-shaped, not real-time.
- **No separate AI-evaluation product for agent logs.** Agent Review Log is one Evidence Source profile, not a product line.
- **No replacement of the deterministic stats engine as authority.** CoScout (AI) adds context; the engine remains authoritative across V1 and Process.

These non-goals come from the Evidence Sources spec and persist into Process unchanged.

## §10 Cross-references

- The Evidence Source / Data Profile / Snapshot / Profile Application data model: [Evidence Sources and Data Profiles spec](../../superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md).
- The concrete first-profile example: [Agent Review Log Profile spec](../../superpowers/specs/2026-04-26-agent-review-log-process-hub-design.md).
- The customer-tenant ingestion architecture is sketched in [Customer-Tenant Ingestion And Rollups Concept](../../archive/specs/2026-04-29-customer-tenant-ingestion-rollups-concept.md) (archived; will be revived in Process activation).
- The PMS layer that consumes pipeline data: [measurement-system.md](measurement-system.md).
- The Hub-scope multi-Source join that operates on pipeline outputs: [hub-portfolios.md §6](hub-portfolios.md).
