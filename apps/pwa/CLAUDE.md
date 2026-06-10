# @variscout/pwa

Free PWA. Session-only by default; export-only local durability; education + training funnel into the €120 Azure SKU.

## Hard rules

- **Session-only by default.** PWA has no browser Save/Save-to-Browser document identity, saved-document list, or reload-from-browser promise. `.vrs` export is the only durable PWA path: backup/share/start-import only. Importing `.vrs` starts a new unsaved in-memory session. Trainers can package datasets + Hub state as shareable training scenarios; students import to start work. No cloud sync (Azure-only).
- **No AI in free tier** (Constitution P8). CoScout is Azure-only.
- Tailwind v4 requires `@source` directives in `src/index.css` for shared packages (`@source "../../../packages/ui/src/**/*.tsx"`, etc).
- PWA is the free training tool — branding is shown in chart footers (PWA build identifies as free; Azure build is the single €120 SKU).

## Invariants

- **Architecture aligned with Azure per ADR-078** (same product, two builds — free PWA + €120 Azure): shared domain Zustand stores from `@variscout/stores` per the 3-layer model — Document (`useProjectStore`, `useAnalyzeStore`, `useCanvasStore`), Annotation (`useCanvasViewportStore` per-hub, `usePreferencesStore` per-user), View (`useViewStore`). See `packages/stores/CLAUDE.md` for the authoritative table. State shapes build-agnostic; persistence is PWA-capability-scoped (R6d: `.vrs` export/import only; no browser save identity). Build-time capability differences (AI, file upload, persistence) gate at mount via the build target, not via runtime tier check. Shared orchestration components live in `@variscout/ui` with ~40 LOC route-shell per app. The "DataContext only, no Zustand" rule was retired by ADR-078; `useSessionStore` + `useImprovementStore` were deleted in F4 (2026-05-07) — UI state moved to feature stores, preferences moved to `usePreferencesStore`.
- **Persistence boundary** (R6d): PWA document durability is `.vrs` export/import only. Do not add new IndexedDB document-save paths, saved-document lists, or browser-reload promises. Domain stores **never import `dexie` directly**; any remaining PWA Dexie modules are legacy implementation surface pending R6f/code cleanup. An ESLint `no-restricted-imports` rule (P7.2) enforces this; only `apps/pwa/src/persistence/**` and `apps/pwa/src/db/**` are whitelisted. R12 exception: `packages/stores/src/canvasViewportStore.ts` imports Dexie directly for its separate `variscout-canvas-viewport` DB (cross-app UI state, cannot reach into `apps/*/src/persistence/`).
- Embedded mode supported for iframes (see flows in `docs/02-journeys/flows/pwa-education.md`).
- Entry: `src/components/Dashboard.tsx`. **Explore chrome = 2 rows:** AppHeader (compact, icon-only) + ProcessHealthBar context line. The context line owns `Time` / `Stages` / `Subgroup` / `Export` lenses and the `Edit framing` chip menu; the framing toolbar is Process-tab-only. The scope ribbon was deleted (header chips are the single scope chrome).

## Test command

```bash
pnpm --filter @variscout/pwa test
```

E2E: `pnpm --filter @variscout/pwa test:e2e`.

## Related

- ADR-004 Offline-first
- ADR-012 PWA browser-only
- ADR-033 Pricing simplification
- ADR-078 PWA + Azure architecture alignment (same product, two builds: free PWA + €120 Azure SKU)
- ADR-082 Wedge architecture (single-SKU + project-membership ACL)
