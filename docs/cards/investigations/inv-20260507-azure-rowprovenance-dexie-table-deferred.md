---
title: 'Azure `rowProvenance` Dexie table — deferred'
purpose: remember
tier: card
status: archived
date: 2026-05-07
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-07 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Azure `rowProvenance` Dexie table — deferred

**Status:** RESOLVED via F3.6-β (PR #135). Provenance now persists on Azure as an envelope facet on `EvidenceSnapshot` (D1; no separate `rowProvenance` table — `RowProvenanceTag[]` rides the snapshot record). Cloud-sync round-trips the facet through Blob Storage; ETag optimistic concurrency on `_snapshots.json` catalog handles concurrent-paste races. F3.5 D3 asymmetry closed.

**Surfaced by:** Data-Flow Foundation F3.5 plan + P2 implementation, 2026-05-06.

**Description:** F3.5's `EVIDENCE_ADD_SNAPSHOT` handler in Azure (`apps/azure/src/persistence/applyAction.ts`) persists snapshot only; provenance tracking stays session-only via the existing `setRowProvenance` prop callback in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`. Asymmetric persistence vs PWA (which atomically writes provenance inside `db.transaction('rw', [evidenceSnapshots, rowProvenance], ...)`) is accepted for the F3.5 scope per locked decision D3. Adding a `rowProvenance` table to Azure requires:

- Azure Dexie schema bump (new table declaration with `&id, snapshotId` index)
- New cascade rule consumer (mirror PWA's bulkUpdate-on-archive pattern)
- Migration of any existing session-only provenance tracking surface to dispatch through the action layer
- Updates to `apps/azure/src/persistence/applyAction.ts` for both `EVIDENCE_ADD_SNAPSHOT` (atomic write) and `EVIDENCE_ARCHIVE_SNAPSHOT` (cascade soft-delete)

**Possible directions:**

- F3.6 (Azure normalization parity): A dedicated slice immediately after F3.5 — adds the table + atomic handler + cascade rule. Estimated 6-8 tasks.
- F4 (three-layer state codification): Folded into the broader Document/Annotation/View boundary work; provenance becomes part of the Annotation layer.
- Status quo: Accept asymmetric persistence indefinitely until cross-app provenance reconciliation becomes a feature need.

**Promotion path:** Recommendation is F3.6 if cloud-tier provenance becomes a paid-tier requirement (e.g., audit trail compliance for Six Sigma sessions); otherwise defer to F4 absorption. Logged 2026-05-06.
