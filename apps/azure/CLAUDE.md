# @variscout/azure-app

Azure Workspace host — Feature-Sliced Design with Zustand feature stores, local IndexedDB cache, EasyAuth, App Insights.

## Hard rules

- Never log PII to App Insights or any telemetry. Customer-owned data principle (ADR-059) is strict. Log only structural events (counts, types, durations).
- Never import MSAL or roll your own auth. Azure uses EasyAuth — the `/api/me` endpoint + cookie flow in `server.js`.
- Tailwind v4 requires `@source` directives in `src/index.css` for every shared package with UI (`@source "../../../packages/ui/src/**/*.tsx"`, etc). Responsive utilities (`lg:grid`, `md:flex-row`) silently break without these.
- Don't introduce new top-level directories. Feature-Sliced Design: features/, hooks/, components/, services/, auth/, db/, lib/.

## Invariants

- Feature modules in `src/features/`, each with a co-located Zustand feature store: `panels/panelsStore`, `findings/findingsStore`, `analyze/useAnalyzeFeatureStore`, `ai/aiStore`, `data-flow/`. Feature stores hold UI-only state. Domain stores from `@variscout/stores` (3-layer model — see `packages/stores/CLAUDE.md`) are the source of truth for project / analyze / canvas / viewport / preferences / view data. `useSessionStore` + `useImprovementStore` were deleted in F4 (2026-05-07) — never re-introduce; preferences live in `usePreferencesStore`, transient view state in `useViewStore`, app-local UI state in feature stores.
- **Persistence boundary** (ADR-093 D2): hub-domain writes flow through `azureHubRepository` (`apps/azure/src/persistence/`, module-scoped singleton implementing `@variscout/core/persistence#HubRepository`). Domain stores **never import `dexie` directly** — access is via `azureHubRepository.dispatch(action)`. An ESLint `no-restricted-imports` rule (P7.2) enforces this boundary. Documented exceptions: **R12** — `packages/stores/src/canvasViewportStore.ts` (separate `variscout-canvas-viewport` DB for cross-app canvas viewport UI state); **R13** — `apps/azure/src/services/{storage,localDb}.ts` and `apps/azure/src/lib/persistence.ts` (local project overlay + save/import/export cache paths that pre-date full HubAction dispatch).
- Persistence: IndexedDB via Dexie (`src/db/schema.ts`, `services/localDb.ts`) plus user-owned `.vrs` export/import. ADR-093 D2 removed cloud document listing/loading/saving, storage routes, document identity, sync queues, and conflict dialogs. Save/Save As update the local Workspace cache and the dirty baseline only; `.vrs` remains the paid artifact boundary.
- App Insights wired at `src/lib/appInsights.ts`. `services/storage.ts` is the local-first storage facade.
- Live membership/ACLs were removed in ADR-093 D1. Preserve author/provenance display as local labels, and keep Sponsor only as an export/consultation-pack audience concept.
- File Picker: local files only (`components/FileBrowseButton.tsx`). SharePoint picker removed per ADR-059.
- Multi-level surfaces: SCOUT dashboard (investigation-time picker) and Hub Capability tab (hub-time, rolling default matched to cadence) link as peers; ADR-074 boundary policy applies.
- Hub Capability tab exposes the hub-level Cpk target editor (`CpkTargetInput`) next to `TimelineWindowPicker`. Commits write `processHub.reviewSignal.capability.cpkTarget` via `Dashboard.handleHubCpkTargetCommit` → `saveProcessHub`. This is the cascade-level "hub" writer; the per-column writer is `setMeasureSpec`.
- **Control + handoff deferral**: `controlRecords`, `controlReviews`, and `controlHandoffs` are NOT yet hub-domain-dispatched; their HubAction kinds do not exist. Editors continue calling `saveControlRecordToIndexedDB` and friends directly via `services/localDb.ts` (R13 allow-listed). F5 may unify them under HubAction.
- `ProjectMetadata` writes are merges — `mergeProjectMetadata` preserves the Control-owned `sustainment` projection; never recompute-and-overwrite.
- **Provenance envelope facet** (ADR-077 amendment 2026-05-07, F3.6-β): `EvidenceSnapshot.provenance?: RowProvenanceTag[]` is the canonical home for row-source metadata. The runtime sidecar `Map<rowKey, RowProvenanceTag>` from slice 3 is retired; persistence + in-memory access converge on `snapshot.provenance` directly. **The facet is write-only today** — no live surface reads it back (grounding-corrected 2026-06-04: MatchSummaryCard renders from the in-memory `MatchSummaryClassification` produced by `classifyPaste`, not from `snapshot.provenance`).

## Test command

```bash
pnpm --filter @variscout/azure-app test
```

E2E tests via Playwright: `pnpm --filter @variscout/azure-app test:e2e`.

## Related

- ADR-041 Zustand feature stores
- ADR-059 Web-first deployment architecture
- ADR-092 Local-first VariScout product model
- ADR-093 V1 simplification cuts
- docs/08-products/azure/authentication.md
