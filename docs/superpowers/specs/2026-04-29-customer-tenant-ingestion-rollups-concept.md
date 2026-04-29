---
title: Customer-Tenant Ingestion And Rollups Concept
audience: [product, architect, engineer, admin]
category: design-spec
status: draft
related:
  [
    process-hub,
    evidence-sources,
    data-profiles,
    snapshots,
    current-process-state,
    customer-owned-data,
    hub-of-hubs,
  ]
date: 2026-04-29
---

# Customer-Tenant Ingestion And Rollups Concept

## Summary

Hourly or automated production-line data changes the storage shape for Process
Hub evidence. Raw files may arrive continuously in customer-tenant Blob Storage,
but Process Hub, Current Process State, CoScout context, and future hub-of-hubs
views should not load or recompute over all raw files in the browser.

The future architecture should keep raw evidence immutable and customer-owned,
then add a narrow customer-tenant ingestion and rollup processor that writes
small deterministic manifests and summaries. The browser reads those summaries
first and loads raw snapshot data only for deliberate drill-down.

This is named-future guidance. It is not a commitment to build the processor in
the next slice.

## Why This Exists

The current Evidence Source model already allows hourly cadence, Snapshot
metadata, and Blob paths under:

```text
process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...
```

That is enough for early manual and low-volume Snapshot workflows. It is not the
right long-term read model for hourly data across many lines, child hubs, or
hub-of-hubs views. A browser-first product can still own the review experience,
but it needs precomputed, deterministic evidence summaries when raw data volume
becomes continuous.

## Architecture Direction

The future flow should be:

```text
customer export or drop
-> raw snapshot file in customer-tenant Blob Storage
-> customer-tenant ingestion and rollup processor
-> Snapshot manifest, validation report, latest signals, and period rollups
-> Process Hub reads rollups first
-> selected investigation or drill-down loads raw snapshot data
```

Raw snapshot files remain the audit trail. Manifests and rollups are derived
views, safe to regenerate from raw evidence and Data Profile versions.

The processor should be narrow:

- detect and apply Data Profiles
- validate source contracts and mappings
- write Snapshot manifests and Profile Application metadata
- compute latest signals and period summaries
- preserve row counts, capture times, profile versions, warnings, and source
  provenance
- avoid owning process decisions, action routing, or CoScout memory

## Runtime Choice

The default VariScout-owned processor runtime should be TypeScript/Node because
the deterministic product logic already lives in `@variscout/core`. That keeps
browser computation, background rollups, tests, and CoScout grounding aligned
on the same definitions for Data Profiles, Snapshot validation, signals, and
Current Process State inputs.

Python remains appropriate at the customer or data-engineering edge:

- MES, ERP, SCADA, QMS, CRM, or data-lake export shaping
- pandas, Polars, or notebook-based preprocessing
- customer-specific adapters that emit documented Evidence Source contracts
- research or validation work before productizing deterministic logic

Python should not become a separate authority for VariScout product truth unless
a specific workload proves that TypeScript, Web Workers, Azure-native services,
or WebAssembly are not enough.

## Read Model

Process Hub and hub-of-hubs screens should read compact objects:

- latest Snapshot manifest per Evidence Source
- latest signal set for outcome, flow, known x-control, capability, and trust
- daily, weekly, shiftly, or hourly rollup summaries as configured
- validation warnings, missing data, mapping drift, and sample/trust flags
- links back to raw Snapshot files for drill-down

The browser should not list or fetch every raw hourly file to render a hub
overview. It should load raw data only when the user opens a selected Snapshot,
time window, or investigation.

## Hub-Of-Hubs Boundary

Hub-of-hubs views should compare patterns, queues, state, trust, response paths,
and evidence freshness. They should not add or average capability statistics
across heterogeneous local processes. Raw Cp/Cpk, defect rates, or flow metrics
belong to the local process context unless the compared hubs share a documented
profile, measure definition, subgroup logic, and interpretation boundary.

This keeps the future ingestion layer aligned with the no-statistical-rollup
principle: the system provides comparable context without creating a misleading
portfolio statistic.

## Non-Goals

- No VariScout-operated data pipeline or shared SaaS backend.
- No live monitoring, alarm management, or shift-critical escalation promise.
- No custom integration ownership for customer source systems.
- No separate Python authority for deterministic stats or process state.
- No automatic cross-hub statistical rollups.

## ADR Trigger

Promote this concept to an ADR when the product commits to one of these:

- an automated customer-tenant processor in Azure
- a governed Process tier with Snapshot retention and cadence records
- a canonical rollup manifest contract consumed by multiple screens
- an implementation choice that adds a second product runtime

Until then, this note should guide Evidence Source, Blob namespace, and
hub-of-hubs design without forcing implementation scope.

## Related Docs

- [Evidence Sources And Data Profiles](2026-04-26-evidence-sources-data-profiles-design.md)
- [Product-Method Roadmap](2026-04-27-product-method-roadmap-design.md)
- [Process Learning Operating Model](2026-04-27-process-learning-operating-model-design.md)
- [Process Hub Storage and CoScout Context Boundary](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md)
- [No Statistical Roll-Up Across Heterogeneous Units](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md)
