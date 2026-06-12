# @variscout/workspace-app

Canonical local-first Workspace client. Build-time channels assemble `free`, `individual`, and `company` bundles from this app.

## Hard rules

- **Free channel is session-only.** It has no browser Save/Save-to-Browser document identity, saved-document list, reload-from-browser promise, artifact export code, AI, or account surface.
- **Paid channels use local-first artifacts.** `.vrs` export/import is the durable artifact path. Importing `.vrs` starts a local Workspace session; no cloud document sync is allowed in this client.
- **Company channel uses the same Workspace app.** Company deployment serves this build through the company server for EasyAuth, runtime config, and tenant-governed CoScout plumbing.
- Tailwind v4 requires `@source` directives in `src/index.css` for shared packages (`@source "../../../packages/ui/src/**/*.tsx"`, etc).
- Channel gates live in `src/config/capabilities.ts` and `vite.config.ts`. Do not add runtime tier switches for build-excluded code.

## Invariants

- Shared domain Zustand stores from `@variscout/stores` follow the 3-layer model: Document (`useProjectStore`, `useAnalyzeStore`, `useCanvasStore`), Annotation (`useCanvasViewportStore`, `usePreferencesStore`), View (`useViewStore`). See `packages/stores/CLAUDE.md`.
- **Persistence boundary:** free channel has no artifact modules in the bundle; paid channels use `.vrs` plus minimal local artifact infrastructure. Do not add cloud sync, saved document lists, shared save promises, or browser-reload document identity.
- Embedded mode supported for iframes (see flows in `docs/02-journeys/flows/pwa-education.md`).
- Entry: `src/components/Dashboard.tsx`. **Explore chrome = 2 rows:** AppHeader (compact, icon-only) + ProcessHealthBar context line. The context line owns `Time` / `Stages` / `Subgroup` / `Export` lenses and the `Edit framing` chip menu; the framing toolbar is Process-tab-only. The scope ribbon was deleted (header chips are the single scope chrome).

## Test command

```bash
pnpm --filter @variscout/workspace-app test
```

E2E: `pnpm --filter @variscout/workspace-app test:e2e`.

## Related

- ADR-004 Offline-first
- ADR-092 Local-first VariScout product model
- ADR-093 V1 simplification cuts
