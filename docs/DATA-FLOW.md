---
tier: living
purpose: system
title: VariScout Data Lifecycle
audience: human
category: architecture
status: active
last-reviewed: 2026-05-17
related: [data-flow, persistence, sync, customer-owned, blob-storage, indexeddb, easyauth]
---

# VariScout Data Lifecycle

Data enters VariScout in the browser, stays in the browser for analysis, and — on the Azure tier — can sync to storage **in the customer's own Azure tenant**. No data ever touches VariScout-operated cloud infrastructure. This is the **customer-owned data** principle, and every architectural decision downstream respects it (ADR-059).

## 1. Parse boundary (B1 — the first numeric gate)

Users paste text, upload CSV, or drag a file. `packages/core/src/parser/` detects columns, types, wide-form stacks (ADR-050), and defect formats (ADR-066). The parser applies the first numeric-safety boundary:

- `toNumericValue()` rejects `NaN` and returns `undefined` for unparseable values.
- Column types are inferred: continuous, categorical, ordinal, date, stack.
- Wide-form headers are unpacked into long-form on the fly where needed.

**No value flagged as unparseable is silently zeroed.** Downstream code sees `undefined` or a valid number.

Process Hub Evidence Sources are the workflow layer above this parse boundary.
An Evidence Source represents recurring hub evidence; a Snapshot is one dated
evidence package from that source. When the source shape is known, a Data
Profile can recommend mappings, derive deterministic columns, and record a
Profile Application for that Snapshot. Together, Evidence Sources, Snapshots,
Signal Cards, Survey readiness, targets, subgroup logic, and cadence rules form
the Process Measurement System that produces Current Process State for Process
Hub review. Current ordinary analysis still enters through the existing
paste/upload/manual paths, while Azure has the first profile-specific Evidence
Source slice for Agent Review Log snapshots.

## 2. Mode transforms (pre-stats aggregation)

Two modes apply a transform between parse and stats:

- **Yamazumi:** `computeYamazumiData()` aggregates raw timing observations into per-step × activity-type stacked totals.
- **Defect:** `computeDefectRates()` aggregates defect event logs into rates per time unit. Triggered when `detectDefectFormat()` identifies the input shape during import; user confirms via `DefectDetectedModal`.

Other modes pass raw parsed data straight to stats.

## 3. Stats engine (B2 — the second numeric gate)

`packages/core/src/stats/` computes descriptive stats, capability (Cp/Cpk/Pp/Ppk), ANOVA, OLS regression, Evidence Map R²adj, control limits, probability plot positions, and more. All stats functions return `number | undefined` — **never `NaN` or `Infinity`**. `safeMath.ts` (safeDivide, safeLog, safeSqrt) is the standard primitive.

Two-pass best subsets with interaction screening (ADR-067) drives Evidence Map. NIST Longley benchmark validates regression against Minitab/JMP.

## 4. Persistence

VariScout V1 is a single SKU (€120/month, Azure tenant-wide). There is no tier-based feature split in persistence — the distinction is between the **PWA capability** (session-only, no backend required, offline-first funnel) and the **Azure capability** (full persistence, team sync, CoScout AI). Both are first-class capabilities of the single product.

| Capability   | Storage                      | Scope                                                        |
| ------------ | ---------------------------- | ------------------------------------------------------------ |
| PWA          | None                         | Session-only. Refresh = data gone. Intentional.              |
| Azure        | IndexedDB (local to browser) | Project and Hub data persists across sessions on the device. |
| Azure + Blob | IndexedDB + Blob Storage     | Same as Azure, plus cross-device sync within the tenant.     |

IndexedDB schema in `apps/azure/src/db/schema.ts` (Dexie). `services/localDb.ts` is the facade. sessionStore from `@variscout/stores` persists UI session state via middleware; document-level persistence goes through `useProjectActions` (domain stores).

## 5. Project-membership ACL as data-isolation layer

Hub-level data (the tenant-wide internal container backing the Process tab and paste data) is accessible to any authenticated user in the Azure tenant. **Project-level data** (Charter, Approach, Control stages + Improve tab artifacts + Report) is **membership-gated**: only users explicitly invited to a Project can access it, regardless of their presence in the tenant (ADR-082 §4.4).

Access checks are role-based: `canAccess(userId, members, action)` from `@variscout/core/projectMembership`. Roles are Lead (full edit + advance stages + close hypotheses + manage membership), Member + Sponsor (read everywhere + edit contributions: Findings, evidence, action items, ideas, comments). Per Spec 2 §7. This is the primary data-isolation boundary for project-formal artifacts.

Evidence Source objects exist in core as the first implementation slice:
`EvidenceSource`, `DataProfileDefinition`, `EvidenceSnapshot`, and
`ProfileApplication`. The current persisted Azure UI support is still narrow
and profile-specific; ordinary process datasets do not yet have a general
promotion path from one-off project to recurring Evidence Source or Current
Process State review.

## 6. Sync (Azure — Blob Storage)

`services/cloudSync.ts` pushes/pulls project documents to/from Blob Storage in the **customer's tenant**. Flow:

1. User authenticates via EasyAuth (`/api/me` returns identity). No MSAL in the client.
2. Client calls `/api/storage-token` (in `apps/azure/server.js`). Server mints a short-lived SAS token scoped to the user's container.
3. Client uses SAS to read/write blobs directly. VariScout server never sees the data.
4. Conflict resolution: last-write-wins at document level. Granular CRDT-style merge is deferred.

SAS lifetime, container structure, and RBAC rules: `docs/08-products/azure/blob-storage-sync.md`.

Current Blob behavior remains primarily project-based, with Process Hub
evidence storage emerging through the first Evidence Source implementation
slice. The logical namespace remains:
`process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...`.

## 7. Display boundary (B3 — the third numeric gate)

UI code never calls `.toFixed()` on stat values. `formatStatistic()` from `@variscout/core/i18n` guards every displayed number with `Number.isFinite()` and locale-aware formatting. ESLint enforces this (in Phase 3 of the doc architecture migration; currently a text convention).

## 8. AI boundary (CoScout)

CoScout calls leave the browser but stay in the customer's tenant (Azure OpenAI endpoint provisioned in the customer's subscription). Prompts include investigation state (findings, hubs, causal links, evidence map topology) but **never raw data rows beyond what the user has exposed in charts**. Visual grounding markers (ADR-057) reference chart elements by ID, not data. Tool calls (27-tool registry) return structured diffs the user confirms before applying.

Azure voice input uses the same tenant boundary:

- browser records a short audio clip in memory only
- the clip is sent to the customer's Azure OpenAI speech-to-text deployment
- raw audio is discarded after transcription
- the transcript becomes a normal CoScout draft, finding draft, or comment draft

There is no persisted audio object in IndexedDB or Blob Storage, and PWA keeps the microphone disabled.

## 9. Telemetry (App Insights — Azure only)

`apps/azure/src/lib/appInsights.ts`. Logs structural events (mode changes, feature usage counts, durations) — **never PII, never raw data**. Telemetry violations are a priority fix.

## Trust chain summary

Parse → transform → stats → persist → sync → display → AI. Every boundary either validates or passes through, never silently corrupts. Three numeric gates (B1, B2, B3) guarantee no `NaN`/`Infinity` reaches the user. Customer-owned principle guarantees no data leaves customer tenant. Project-membership ACLs (ADR-082 §4) scope project-formal data to invited members. Voice input, when enabled on Azure, follows the same rule: audio is transient, transcript is durable.

## Reference

- ADR-023 Data lifecycle
- ADR-050 Wide-form stack columns
- ADR-059 Web-first deployment architecture
- ADR-069 Three-boundary numeric safety
- ADR-082 V1 architecture (single-SKU + project-membership ACL)
- docs/05-technical/architecture/data-flow.md
- docs/05-technical/architecture/data-pipeline-map.md
- docs/08-products/azure/blob-storage-sync.md
