---
title: Evidence Sources And Data Profiles - Process Hub Evidence Workflow
audience: [product, designer, engineer]
category: design-spec
status: in-progress
related:
  [process-hub, evidence-sources, data-profiles, snapshots, customer-owned-data, agent-review-log]
date: 2026-04-26
---

# Evidence Sources And Data Profiles

## Summary

Process Hub evidence should start from the recurring process question, not from
an import dialog:

```text
Are we meeting the requirement, what changed, and where should we focus?
```

An **Evidence Source** is the user-facing hub-level source of recurring
evidence. A **Data Profile** is the deterministic adapter behind that source
when VariScout recognizes a repeatable source-data shape.

This keeps Process Hub evidence workflow first:

1. The hub owner defines the recurring evidence the process uses.
2. VariScout applies a documented Data Profile when the source shape is known.
3. Each uploaded or imported package becomes a dated Snapshot.
4. The confirmed mapping and profile version become the Profile Application for
   that Snapshot.
5. Survey, Signal Cards, investigations, verification, and sustainment reviews
   quote the Snapshot instead of treating every import as an isolated project.

## Vocabulary

| Concept                 | Meaning                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| **Evidence Source**     | User-facing Process Hub source of recurring evidence                |
| **Data Profile**        | Reusable deterministic adapter for a recognizable source-data shape |
| **Snapshot**            | One dated or imported evidence package from an Evidence Source      |
| **Profile Application** | Profile version plus confirmed mapping used for one Snapshot        |

The future conceptual object names are:

- `EvidenceSource`
- `DataProfileDefinition`
- `EvidenceSnapshot`
- `ProfileApplication`

This design does not introduce code, APIs, or persisted types yet.

## Evidence Source

An Evidence Source belongs to a Process Hub and is named in the language of the
process owner:

- Line 4 fill-weight export
- Claims queue weekly extract
- Supplier intake defects
- Agent review log
- Verification audit sample

The source answers what the team will review on a cadence and how that evidence
feeds the hub. It can support:

- cadence board signals
- Survey readiness checks
- new or existing investigations
- action verification
- sustainment/control reviews
- handoff to live systems when control moves outside VariScout

Evidence Sources do not make VariScout an integration platform. The customer
data team or an external consultant owns extraction and transformation from
source systems into documented contracts. VariScout owns import contracts,
validation, deterministic profile application, evidence snapshots, and the
investigation workflow that uses them.

## Data Profile

A Data Profile is reusable deterministic logic for a recognizable data shape.
It can recommend mappings, derive analysis-ready columns, validate required and
optional fields, and preserve source columns for inspection.

Data Profiles are implementation/design concepts, not primary user language.
Users set up Evidence Sources; VariScout may say that the source uses a profile
when that helps explain a mapping, validation result, or migration.

The first concrete example is the
[Agent Review Log Profile](2026-04-26-agent-review-log-process-hub-design.md).
It adapts agent review exports into ordinary process evidence for safe green
throughput investigations. It is not an AI eval dashboard, agent runtime, or
live monitoring product.

## Snapshot

A Snapshot is one evidence package from a source. It may arrive by paste,
upload, append, customer-owned Blob sync, or a future customer-controlled export
drop. Snapshot timing is an improvement cadence: manual, shiftly, daily,
weekly, or hourly when that fits the process review need.

Snapshots are what the hub cadence board should reason over:

- what changed since the last Snapshot
- whether requirements are being met
- where variation, defects, wait, burden, or unsafe outcomes concentrate
- whether an action has enough post-change evidence for verification
- whether a sustainment item still needs review in VariScout

The same cadence board should support both daily huddles and weekly process
reviews. Daily huddles use the latest Snapshot and open investigation metadata
to ask what changed, what needs attention today, and what verification is
waiting. Weekly process reviews compare Snapshot history to ask whether the
process is meeting requirements, whether recurring focus areas are emerging,
and which improvements should be sustained or escalated into focused/chartered
work. Until Phase 5 is implemented, the Azure board may label these meeting
uses but must derive them from existing project metadata rather than claiming
true Snapshot history.

## Profile Application

A Profile Application records the deterministic adapter actually used for a
Snapshot:

- Data Profile identity and version
- confirmed column mapping
- derived columns and validation results
- user confirmations or corrections
- source package metadata needed for auditability

Profile Application is snapshot-specific because mappings can change over time,
even when the Evidence Source represents the same process evidence.

## Storage Direction

Current Blob behavior remains project-based until Phase 5 is implemented. This
document reserves the future Process Hub evidence namespace without claiming
current support:

```text
process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...
```

The future namespace should hold snapshot files, profile application metadata,
validation reports, and related attachments when the implementation slice needs
them.

## Non-Goals

- No code, API, schema, or type changes in this documentation update.
- No custom ERP, MES, QMS, CRM, ACD, AI-platform, or workflow integrations.
- No live alarms, runtime monitoring, shift-critical escalation, or operational
  uptime promise.
- No separate AI-evaluation product for agent logs.
- No replacement of the deterministic stats engine as authority.
