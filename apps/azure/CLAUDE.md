# @variscout/azure-app

Azure Team App — Feature-Sliced Design with Zustand feature stores, IndexedDB + Blob Storage, EasyAuth, App Insights.

## Hard rules

- Never log PII to App Insights or any telemetry. Customer-owned data principle (ADR-059) is strict. Log only structural events (counts, types, durations).
- Never import MSAL or roll your own auth. Azure uses EasyAuth — the `/api/me` endpoint + cookie flow in `server.js`.
- Tailwind v4 requires `@source` directives in `src/index.css` for every shared package with UI (`@source "../../../packages/ui/src/**/*.tsx"`, etc). Responsive utilities (`lg:grid`, `md:flex-row`) silently break without these.
- Don't introduce new top-level directories. Feature-Sliced Design: features/, hooks/, components/, services/, auth/, db/, lib/.

## Invariants

- Feature modules in `src/features/`, each with a co-located Zustand feature store: `panels/panelsStore`, `findings/findingsStore`, `analyze/useAnalyzeFeatureStore`, `ai/aiStore`, `data-flow/`. Feature stores hold UI-only state. Domain stores from `@variscout/stores` (3-layer model — see `packages/stores/CLAUDE.md`) are the source of truth for project / analyze / canvas / viewport / preferences / view data. `useSessionStore` + `useImprovementStore` were deleted in F4 (2026-05-07) — never re-introduce; preferences live in `usePreferencesStore`, transient view state in `useViewStore`, app-local UI state in feature stores.
- **Persistence boundary** (F1+F2 PR3): hub-domain writes flow through `azureHubRepository` (`apps/azure/src/persistence/`, module-scoped singleton implementing `@variscout/core/persistence#HubRepository`). Domain stores **never import `dexie` directly** — access is via `azureHubRepository.dispatch(action)`. An ESLint `no-restricted-imports` rule (P7.2) enforces this boundary. Documented exceptions: **R12** — `packages/stores/src/canvasViewportStore.ts` (separate `variscout-canvas-viewport` DB for cross-app canvas viewport UI state); **R13** — `apps/azure/src/services/{storage,localDb,cloudSync}.ts` and `apps/azure/src/lib/persistence.ts` (project-overlay + cloud-sync writes that pre-date HubAction dispatch; F3 may unify).
- Persistence: IndexedDB via Dexie (`src/db/schema.ts`, `services/localDb.ts`). Blob Storage sync is part of the single €120 SKU (`services/cloudSync.ts`). R6e access enforcement moves cloud storage behind same-origin server APIs in `server.js`: the browser must not receive a broad container-scoped SAS for project data, and the server must enforce the R6c document access model before listing, reading, or writing blobs. Production storage access uses the App Service managed identity with Azure RBAC; `AZURE_STORAGE_CONNECTION_STRING` / Shared Key paths are local-dev and test-only. After R6c, local project records, sync queue payloads, cloud `analysis.json`, and `.vrs` import/export are snapshot-only `DocumentSnapshot` documents. R6d save semantics: Save updates the active Azure document identity, Save As forks to a new identity, imported `.vrs` starts unsaved/forkable, dirty state compares the canonical `DocumentSnapshot` fingerprint with the saved baseline, and `.vrs` remains backup/share/start-import rather than an active save target.
- App Insights wired at `src/lib/appInsights.ts`. `services/storage.ts` is the facade for both local + cloud.
- Access-gating under V1 single-SKU (ADR-082): project-formal features are guarded by `canAccess(userId, members, action)` from `@variscout/core/projectMembership` (PR-WV1-1). Access-gate INSIDE the surface (Charter / Approach / Improve / Control / Report writes), not at surface entry — Sponsor role gets read-only Project dossier visibility with active review gestures, Member + Lead get edit according to ACL, and non-members never see the project in their list. Saved documents follow the same boundary: quick analyses are private to the creator/current user, and formal Projects derive allowed users from `improvementProject.metadata.members`.
- File Picker: local files only (`components/FileBrowseButton.tsx`). SharePoint picker removed per ADR-059.
- Multi-level surfaces: SCOUT dashboard (investigation-time picker) and Hub Capability tab (hub-time, rolling default matched to cadence) link as peers; ADR-074 boundary policy applies.
- Hub Capability tab exposes the hub-level Cpk target editor (`CpkTargetInput`) next to `TimelineWindowPicker`. Commits write `processHub.reviewSignal.capability.cpkTarget` via `Dashboard.handleHubCpkTargetCommit` → `saveProcessHub`. This is the cascade-level "hub" writer; the per-column writer is `setMeasureSpec`.
- **Control + handoff deferral**: `controlRecords`, `controlReviews`, and `controlHandoffs` are NOT yet hub-domain-dispatched; their HubAction kinds do not exist. Editors continue calling `saveControlRecordToIndexedDB` and friends directly via `services/localDb.ts` (R13 allow-listed). F5 may unify them under HubAction.
- **ETag optimistic concurrency on hub/document blob writes** (ADR-079, F3.6-β + R6c): `saveProcessHubToCloud` returns `{ ok: true; etag } | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' }`. Callers MUST handle both branches; the typed result is the compile-time guard against silent overwrites. Project document writes also use ETag/`If-Match`. Snapshot-blob writes (`saveEvidenceSnapshotToCloud`) intentionally do NOT use ETag — each evidence snapshot lives at a unique path keyed by snapshot id; no concurrency surface. PO-8b: project-document 412s surface the **reload-or-branch `SaveConflictDialog`** (no silent auto-fork; the timestamp pre-flight is retired — If-Match/412 is the sole conflict surface). The wholesale Dexie write + blob PUT run under `withDocumentSaveLock` (`services/saveLock.ts`, per-document exclusive Web Lock, feature-detected; never await UI under the lock). Every cloud load refreshes `syncState.etag` (the server GET returns it in the body). `ProjectMetadata` writes are merges — `mergeProjectMetadata` preserves the Control-owned `sustainment` projection (the load-time heal; never recompute-and-overwrite). Save-serialize telemetry: `Document.Save.Serialize` + the `>50MB`/`>50ms` re-architect trigger (`lib/saveTelemetry.ts`); the worker-marshal was cut on research grounds (spec §17). `navigator.storage.persist()` fires once per session on a real save gesture — Save As or the dialog's Branch (`services/storageDurability.ts`).
- **Provenance envelope facet** (ADR-077 amendment 2026-05-07, F3.6-β): `EvidenceSnapshot.provenance?: RowProvenanceTag[]` is the canonical home for row-source metadata. The runtime sidecar `Map<rowKey, RowProvenanceTag>` from slice 3 is retired; persistence + in-memory access converge on `snapshot.provenance` directly. **The facet is write-only today** — no live surface reads it back (grounding-corrected 2026-06-04: MatchSummaryCard renders from the in-memory `MatchSummaryClassification` produced by `classifyPaste`, not from `snapshot.provenance`). Cloud-sync envelope carries provenance inline with the snapshot blob; cross-device fidelity preserved automatically.

## Test command

```bash
pnpm --filter @variscout/azure-app test
```

E2E tests via Playwright: `pnpm --filter @variscout/azure-app test:e2e`.

## Related

- ADR-041 Zustand feature stores
- ADR-059 Web-first deployment architecture
- ADR-082 Wedge architecture (single-SKU + project-membership ACL)
- docs/08-products/azure/authentication.md
- docs/08-products/azure/blob-storage-sync.md
