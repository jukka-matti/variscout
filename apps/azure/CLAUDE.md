# @variscout/azure-app

Azure Team App — Feature-Sliced Design with Zustand feature stores, IndexedDB + Blob Storage, EasyAuth, App Insights.

## Hard rules

- Never log PII to App Insights or any telemetry. Customer-owned data principle (ADR-059) is strict. Log only structural events (counts, types, durations).
- Never import MSAL or roll your own auth. Azure uses EasyAuth — the `/api/me` endpoint + cookie flow in `server.js`.
- Tailwind v4 requires `@source` directives in `src/index.css` for every shared package with UI (`@source "../../../packages/ui/src/**/*.tsx"`, etc). Responsive utilities (`lg:grid`, `md:flex-row`) silently break without these.
- Don't introduce new top-level directories. Feature-Sliced Design: features/, hooks/, components/, services/, auth/, db/, lib/.

## Invariants

- 6 feature modules in `src/features/`, each with a co-located Zustand feature store suffixed `*FeatureStore` where ambiguity needed: `panels/panelsStore`, `findings/findingsStore`, `investigation/useInvestigationFeatureStore`, `ai/aiStore`, `data-flow/`, `improvement/` (the improvement UI-state store was deleted April 2026; its state moved to `panelsStore`).
- **Persistence boundary** (F1+F2 PR3): hub-domain writes flow through `azureHubRepository` (`apps/azure/src/persistence/`, module-scoped singleton implementing `@variscout/core/persistence#HubRepository`). Domain stores **never import `dexie` directly** — access is via `azureHubRepository.dispatch(action)`. An ESLint `no-restricted-imports` rule (P7.2) enforces this boundary. Documented exceptions: **R12** — `packages/stores/src/wallLayoutStore.ts` (separate `variscout-wall-layout` DB for cross-app Wall UI state); **R13** — `apps/azure/src/services/{storage,localDb,cloudSync}.ts` and `apps/azure/src/lib/persistence.ts` (project-overlay + cloud-sync writes that pre-date HubAction dispatch; F3 may unify).
- Persistence: IndexedDB via Dexie (`src/db/schema.ts`, `services/localDb.ts`). Blob Storage sync for Team tier (`services/cloudSync.ts`). SAS tokens minted by `/api/storage-token` endpoint in `server.js`.
- App Insights wired at `src/lib/appInsights.ts`. `services/storage.ts` is the facade for both local + cloud.
- Domain stores from `@variscout/stores` are the source of truth for project/investigation/improvement/session data. Feature stores hold UI-only state.
- File Picker: local files only (`components/FileBrowseButton.tsx`). SharePoint picker removed per ADR-059.
- Multi-level surfaces: SCOUT dashboard (investigation-time picker) and Hub Capability tab (hub-time, rolling default matched to cadence) link as peers; ADR-074 boundary policy applies.
- Hub Capability tab exposes the hub-level Cpk target editor (`CpkTargetInput`) next to `TimelineWindowPicker`. Commits write `processHub.reviewSignal.capability.cpkTarget` via `Dashboard.handleHubCpkTargetCommit` → `saveProcessHub`. This is the cascade-level "hub" writer; the per-column writer is `setMeasureSpec`.
- **Sustainment + handoff deferral**: `sustainmentRecords`, `sustainmentReviews`, and `controlHandoffs` are NOT yet hub-domain-dispatched; their HubAction kinds do not exist. Editors continue calling `saveSustainmentRecordToIndexedDB` and friends directly via `services/localDb.ts` (R13 allow-listed). F5 may unify them under HubAction.
- **ETag optimistic concurrency on hub-blob writes** (ADR-079, F3.6-β): `saveProcessHubToCloud` returns `{ ok: true; etag } | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' }`. Callers MUST handle both branches; the typed result is the compile-time guard against silent overwrites. On 412 Precondition Failed, retries up to 3× with exponential backoff (100ms/200ms/400ms); `concurrency-exhausted` surfaces via the `PasteConflictToast` event channel as a non-blocking toast (transient retry succeeded) → blocking modal (3 retries failed, "Try again" CTA). Snapshot-blob writes (`saveEvidenceSnapshotToCloud`) intentionally do NOT use ETag — each snapshot lives at a unique path keyed by snapshot id; no concurrency surface.
- **Provenance envelope facet** (ADR-077 amendment 2026-05-07, F3.6-β): `EvidenceSnapshot.provenance?: RowProvenanceTag[]` is the canonical home for row-source metadata. The runtime sidecar `Map<rowKey, RowProvenanceTag>` from slice 3 is retired; persistence + in-memory access converge on `snapshot.provenance` directly. MatchSummaryCard pill renders from `snapshot.provenance ?? []` (lazy hydration — most reads ignore the facet). Cloud-sync envelope carries provenance inline with the snapshot blob; cross-device fidelity preserved automatically.

## Test command

```bash
pnpm --filter @variscout/azure-app test
```

E2E tests via Playwright: `pnpm --filter @variscout/azure-app test:e2e`.

## Skills to consult

- `editing-azure-storage-auth` — for any auth, storage, or cloud sync changes
- `editing-investigation-workflow` — for editor/InvestigationMapView, HubComposer, etc.
- `writing-tests` — E2E data-testid conventions

## Related

- ADR-041 Zustand feature stores
- ADR-043 Teams entry experience
- ADR-059 Web-first deployment architecture
- docs/08-products/azure/authentication.md
- docs/08-products/azure/blob-storage-sync.md
