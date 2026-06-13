# @variscout/azure-app

**Server / deployment host package — not a client app.** Serves the
`@variscout/workspace-app` company-channel bundle
(`scripts/build-company-workspace.mjs` → `dist/`) via `server.js` (CSP,
`/health`, `/config`, EasyAuth client-principal parse, ephemeral SSE relays).
No client source lives here; the client is `@variscout/workspace-app` at
`apps/pwa/`. It should not grow new product UI; product UI belongs in `apps/pwa`
and is assembled by channel gates.

## Hard Rules

- Never log PII to App Insights or telemetry. Log only structural events such as counts, types, and durations.
- Never import MSAL or roll custom auth. Company deployment uses EasyAuth; server-owned identity endpoints live in `server.js`.
- Default `build` builds the company-channel Workspace bundle into `dist/`. The legacy Azure React client (`src/`) was deleted in the D4 convergence — do not reintroduce a client tree here.
- Keep server responsibilities narrow: `/health`, `/config`, `/api/me`, tenant CoScout/runtime plumbing, and static hosting.
- Do not reintroduce cloud document sync, Blob document identity, conflict dialogs, live membership/ACLs, product-mobile surfaces, or in-product voice capture.

## Commands

```bash
pnpm --filter @variscout/azure-app build     # build workspace-app company bundle → dist/
pnpm --filter @variscout/azure-app preview   # serve dist/ via server.js
pnpm --filter @variscout/azure-app test:e2e  # Playwright against the served bundle
```

There are no unit tests in this package (it is server/host only); `test` is a
no-op. Client tests live in `@variscout/workspace-app` (`apps/pwa/`).

## Invariants

- The company deployment serves the same Workspace app as free/individual channels, built with `VITE_VARISCOUT_CHANNEL=company`.
- `.vrs` remains the paid artifact boundary. The server does not list, save, or sync customer documents.
- EasyAuth and runtime config stay server-owned. CoScout typed interaction may use tenant-governed server plumbing; in-product voice capture is cut.

## Related

- ADR-092 Local-first VariScout product model
- ADR-093 V1 simplification cuts
- `apps/pwa/CLAUDE.md`
