---
title: 'F3.5 Data-Flow Foundation plan written: ingestion action layer (paste / upload unified onto `EVIDENCE_ADD_SNAPSHOT`)'
purpose: decide
tier: card
status: active
date: 2026-05-06
topic: ['decisions', 'investigation', 'azure', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# F3.5 Data-Flow Foundation plan written: ingestion action layer (paste / upload unified onto `EVIDENCE_ADD_SNAPSHOT`)

Plan at [`docs/superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md`](superpowers/plans/2026-05-06-data-flow-foundation-f3-5-ingestion.md) — single-PR slice off branch `data-flow-foundation-f3-5`. **7 locked decisions (D1-D7):** D1 handler reads `existingRange` itself (no caller payload); D2 PWA atomic write inside `db.transaction('rw', [evidenceSnapshots, rowProvenance], ...)` closes the `RowProvenanceTag.snapshotId = ''` placeholder gap; D3 Azure snapshot-only (rowProvenance stays session-only — Azure has no table; deferred to F3.6 or F4 per a new `docs/investigations.md` entry to land in P2.4); D4 PWA paste flow drops `setRowProvenance?` + `evidenceSnapshots?` props (Azure keeps per D3 asymmetry); D5 `EVIDENCE_SOURCE_UPDATE_CURSOR` reconciliation per F3 reconciliation point (PWA id-keyed put + post-filter; Azure compound-keyed put); D6 single PR; D7 out of scope (Azure rowProvenance table, evidence-source-pull, F4-F6, `generateDeterministicId` rename, `'general-unassigned'` runtime guard). 8 phases P0–P7 with audit-then-implement pattern; final Opus review at P7. Smaller than F3 (schema unchanged; just handler implementations + 2 call-site refactors + cursor reconciliation). Source: spec §5 + F-series memory `project_data_flow_foundation_fseries.md` reconciliation note + F3 close-out entry below. _Pinned 2026-05-06._
