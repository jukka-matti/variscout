---
title: 'ADR-072: Process Hub Storage and CoScout Context Boundary'
status: accepted
date: 2026-04-26
---

# ADR-072: Process Hub Storage and CoScout Context Boundary

**Status**: Accepted

**Date**: 2026-04-26

**Amends**: [ADR-004](adr-004-offline-first.md), [ADR-059](adr-059-web-first-deployment-architecture.md), [ADR-060](adr-060-coscout-intelligence-architecture.md)

**Supersedes as active guidance**:
[ADR-021](../archive/adrs/adr-021-security-evaluation.md),
[ADR-030](../archive/adrs/adr-030-unified-file-picker.md),
[ADR-043](../archive/adrs/adr-043-teams-entry-experience.md)

---

## Context

VariScout is moving to a Process Hub first product model. A Process Hub is the durable context around a real production line, queue, value stream, development flow, or business process. Investigations inside the hub create structured evidence, questions, findings, actions, verification results, and sustainment decisions.

Older active ADRs still described the Azure Team direction as Teams-first, OneDrive/SharePoint-first, and broadly offline-first. ADR-059 moved the Azure app to a web-first deployment architecture with customer-tenant Blob Storage. The remaining decision gap is how Process Hub context, local persistence, Blob Storage, and CoScout memory fit together.

## Decision

Process Hub is the durable process memory. It is built through normal VariScout work:

- process description, SIPOC/process map, CTS/CTQ and customer requirement context
- linked investigations and their depth/status
- Survey readiness, Signal Cards, review signals, and data gaps
- findings, questions, suspected causes, action items, verification, and sustainment decisions
- periodic cadence review metadata

This process memory is deterministic, serializable, and customer-owned. It must be readable without invoking AI.

For storage:

- Browser-based processing remains invariant.
- IndexedDB remains valid as Azure Standard persistence and as the Azure Team browser cache/resilience layer.
- Azure Team shared work uses customer-tenant Blob Storage as the shared sync path.
- A future Process tier may add governed Process Hub storage, snapshots, cadence records, retention, and audit controls, but it is not introduced as a SKU yet.
- VariScout does not build customer-specific ERP, MES, QMS, CRM, or data lake integrations. Customer data teams or external consultants can populate documented import/storage contracts.

For CoScout:

- CoScout reads Process Hub context and can later explain, draft, and propose from it.
- CoScout does not own a separate hidden process memory.
- Deterministic stats, Survey output, Signal Cards, and user-confirmed evidence remain the authority.
- Future CoScout retrieval/indexing work must consume the same customer-owned Process Hub and Blob artifacts rather than creating a parallel knowledge store.

## Consequences

### Positive

- Process owners get an auditable hub-level record of what is known, changing, waiting for verification, and ready for sustainment.
- Analysts and GB/BB users can still run quick investigations without first building a complete hub model.
- Data teams and consultants get a clear future integration boundary: populate documented customer-owned storage/contracts, not custom VariScout integrations.
- CoScout becomes more useful inside a specific Process Hub without becoming the source of truth.

### Trade-offs

- The Blob canonical storage refactor remains a separate future project.
- Process tier packaging remains a validation topic rather than an immediate product tier.
- Readiness metadata must be maintained carefully so Process Hub views and future CoScout context do not drift from the actual investigation record.

## Implementation Notes

- Archive superseded Teams-first and OneDrive/File Picker ADRs instead of deleting them.
- Keep ADR-004 active only for PWA/local-cache behavior.
- Store Process Hub context as deterministic metadata derived from investigations.
- Add readiness queues and local metadata backfill before deeper Signal Card, Blob contract, or CoScout retrieval work.
