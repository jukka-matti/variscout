---
tier: living
purpose: system
title: VariScout Data Lifecycle
audience: human
category: architecture
status: active
last-reviewed: 2026-06-11
related:
  [data-flow, persistence, sync, customer-owned, blob-storage, indexeddb, easyauth, local-first]
---

# VariScout Data Lifecycle

> **Last material edit 2026-06-11** — Data lifecycle aligned with [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md) + [ADR-093](07-decisions/adr-093-v1-simplification-cuts.md): local browser processing and user-controlled files are the model; there is no cloud document store in the V1 product. **Sections 4–6 below describe shipped code (Blob sync, document ACLs, EasyAuth document identity) that is scheduled for deletion per ADR-093 D1/D2** — they remain accurate until the sweeps land; do not build on them.

Data enters VariScout in the browser and stays in the browser for analysis. The durable artifacts are user-controlled files: `.vrs` workspace snapshots and Analysis Packs. AI calls flow only to the customer's own endpoint (tenant or BYOK key). No data ever touches VariScout-operated cloud infrastructure. This is the **local-first / customer-owned data** principle, and every architectural decision downstream respects it (ADR-059, ADR-092, ADR-093).

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

VariScout V1 is local-first. There is no tier-based split in analytical capability — durability is `.vrs` + a minimal local autosave cache; the channel model (free / individual / company) is ADR-093 D5. The Azure persistence rows below describe shipped code **scheduled for deletion (ADR-093 D2)**.

| Capability              | Storage                        | Scope                                                                      |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Browser session         | In-memory stores               | Session-only by default. Refresh = unsaved data gone unless exported.      |
| `.vrs` snapshot         | User-downloaded JSON file      | Portable workspace envelope for backup, transfer, and reproducible review. |
| Analysis Pack           | Self-contained export artifact | Executive, technical, reproducible, or redacted share output.              |
| Optional local cache    | IndexedDB (local to browser)   | Device-local convenience cache where product slice enables it.             |
| Optional Azure services | IndexedDB + Blob Storage       | Customer-tenant persistence and managed sharing when explicitly enabled.   |

IndexedDB schema in `apps/azure/src/db/schema.ts` (Dexie). `services/localDb.ts` is the facade. Document-level persistence goes through the R6 `DocumentSnapshot` boundary in `@variscout/stores`: Project config/data, Analyze state, Canvas document state, and zero-or-one hub-scoped `ImprovementProject`.

PWA has no browser save identity or reload-from-browser promise. Exported `.vrs` files are user-owned backups or share artifacts; importing one starts a new unsaved in-memory session. Analysis Packs are read/share artifacts, not canonical save state unless they include or link a `.vrs` snapshot. Azure owns durable document identity only when optional customer-tenant persistence is enabled: Save updates the active Azure document, Save As forks a new document, and dirty state is based on the canonical `DocumentSnapshot` fingerprint versus the saved baseline.

## 5. Project-membership ACL as data-isolation layer — scheduled for deletion (ADR-093 D1)

> The ACL/membership layer below is shipped code scheduled for deletion; documented until the sweep lands. Do not build on it.

Saved Azure documents are access-aware when optional customer-tenant persistence is enabled. Local `.vrs` files and Analysis Packs rely on file/share discipline: the analyst chooses which artifact to export and where to send it. Formal Projects derive allowed users from `improvementProject.metadata.members`; only the Lead/Member/Sponsor roster should see or load a managed Azure document.

Access checks are role-based: `canAccess(userId, members, action)` from `@variscout/core/projectMembership`. Roles are Lead (full edit + advance stages + close hypotheses + manage membership), Member + Sponsor (read everywhere + edit contributions: Findings, evidence, action items, ideas, comments). Per Spec 2 §7. R6c applies this model to saved document listing/loading; R6e is the current slice that moves enforcement to the same-origin server API / storage boundary before any Blob list/read/write operation.

Evidence Source objects exist in core as the first implementation slice:
`EvidenceSource`, `DataProfileDefinition`, `EvidenceSnapshot`, and
`ProfileApplication`. The current persisted Azure UI support is still narrow
and profile-specific; ordinary process datasets do not yet have a general
promotion path from one-off project to recurring Evidence Source or Current
Process State review.

## 6. Sync (Azure — Blob Storage) — scheduled for deletion (ADR-093 D2)

> The Blob sync/document-identity stack below (including the PO-8b save-conflict machinery) is shipped code scheduled for deletion; documented until the sweep lands. Do not build on it.

`services/cloudSync.ts` pushes/pulls project documents to/from Blob Storage in the **customer's tenant** when optional Azure persistence is enabled. Flow:

1. User authenticates via EasyAuth (`/api/me` returns identity). No MSAL in the client.
2. Client calls same-origin storage APIs in `apps/azure/server.js` for document list/load/save operations.
3. Server validates the caller against the R6c `DocumentSnapshot` access model before touching Blob Storage.
4. In production, the server uses the App Service managed identity and Azure RBAC to read/write customer-tenant Blob Storage. Browser clients do not receive broad container-scoped SAS tokens for project data.
5. Document writes use ETags/`If-Match`. On conflict, the app saves a conflict copy or surfaces the existing conflict path instead of silently overwriting. Granular CRDT-style merge is deferred.

SAS lifetime, container structure, and RBAC rules: `docs/08-products/azure/blob-storage-sync.md`.

Current Blob behavior remains primarily project-based, with Process Hub
evidence storage emerging through the first Evidence Source implementation
slice. The logical namespace remains:
`process-hubs/{hubId}/evidence-sources/{sourceId}/snapshots/{snapshotId}/...`.

## 7. Display boundary (B3 — the third numeric gate)

UI code never calls `.toFixed()` on stat values. `formatStatistic()` from `@variscout/core/i18n` guards every displayed number with `Number.isFinite()` and locale-aware formatting. ESLint enforces this (in Phase 3 of the doc architecture migration; currently a text convention).

## 8. AI boundary (CoScout / local agents)

AI is provider-boundary based. VariScout can run with no AI (free), with the individual user's own key (BYOK — direct browser→provider calls, never a VariScout proxy), with customer Azure AI (company; IT-governed), and later with local LLM or MCP agent surfaces. The deterministic stats engine remains the authority.

Customer Azure AI calls leave the browser but stay in the customer's tenant (Azure OpenAI endpoint provisioned in the customer's subscription). Prompts include investigation state (findings, hubs, causal links, evidence map topology) but **never raw data rows beyond what the user has exposed in charts**. Visual grounding markers (ADR-057) reference chart elements by ID, not data. Tool calls return structured diffs the user confirms before applying.

Future local MCP/agent access should use controlled Agent Workspace Bundles or a local server surface. Agents may read computed results and propose report copy, actions, Control plans, or redacted Analysis Packs. They must not silently mutate canonical workspace state.

**Voice input — scheduled for deletion (ADR-093 D6).** The shipped Azure voice path below remains accurate until the sweep lands; do not build on it. CoScout is typed-first.

Azure voice input uses the same tenant boundary:

- browser records a short audio clip in memory only
- the clip is sent to the customer's Azure OpenAI speech-to-text deployment
- raw audio is discarded after transcription
- the transcript becomes a normal CoScout draft, finding draft, or comment draft

There is no persisted audio object in IndexedDB or Blob Storage, and PWA keeps the microphone disabled.

## 9. Telemetry (App Insights — Azure only)

`apps/azure/src/lib/appInsights.ts`. Logs structural events (mode changes, feature usage counts, durations) — **never PII, never raw data**. Telemetry violations are a priority fix.

## Trust chain summary

Parse -> transform -> stats -> persist/export -> optional sync -> display -> optional AI. Every boundary either validates or passes through, never silently corrupts. Three numeric gates (B1, B2, B3) guarantee no `NaN`/`Infinity` reaches the user. Local-first/customer-owned principle guarantees no data leaves the browser or customer environment unless the user enables an explicit export/service path. Project-membership ACLs (ADR-082 §4) scope formal Azure Project documents to invited members; local `.vrs` and Analysis Packs are controlled by the analyst's file-sharing choices. Voice input (scheduled for deletion, ADR-093 D6) followed the same tenant-owned-data rule while shipped: audio transient, transcript durable.

## Reference

- ADR-023 Data lifecycle
- ADR-050 Wide-form stack columns
- ADR-059 Web-first deployment architecture
- ADR-069 Three-boundary numeric safety
- ADR-082 V1 architecture (single-SKU + project-membership ACL)
- ADR-092 Local-first VariScout product model
- docs/05-technical/architecture/data-flow.md
- docs/05-technical/architecture/data-pipeline-map.md
- docs/08-products/azure/blob-storage-sync.md
