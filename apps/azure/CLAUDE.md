# @variscout/azure-app

Company server/static host for the canonical Workspace app. It should not grow
new product UI; product UI belongs in `apps/pwa` (`@variscout/workspace-app`) and
is assembled by channel gates.

## Hard Rules

- Never log PII to App Insights or telemetry. Log only structural events such as counts, types, and durations.
- Never import MSAL or roll custom auth. Company deployment uses EasyAuth; server-owned identity endpoints live in `server.js`.
- Default `build` must serve the company-channel Workspace bundle, not the retired Azure React client.
- Keep server responsibilities narrow: `/health`, `/config`, `/api/me`, tenant CoScout/runtime plumbing, and static hosting.
- Do not reintroduce cloud document sync, Blob document identity, conflict dialogs, live membership/ACLs, product-mobile surfaces, or in-product voice capture.

## Commands

```bash
pnpm --filter @variscout/azure-app build
pnpm --filter @variscout/azure-app preview
pnpm --filter @variscout/azure-app test
```

Temporary legacy-client escape hatch while convergence finishes:

```bash
pnpm --filter @variscout/azure-app build:legacy-client
```

## Invariants

- The company deployment serves the same Workspace app as free/individual channels, built with `VITE_VARISCOUT_CHANNEL=company`.
- `.vrs` remains the paid artifact boundary. The server does not list, save, or sync customer documents.
- EasyAuth and runtime config stay server-owned. CoScout typed interaction may use tenant-governed server plumbing; in-product voice capture is cut.

## Related

- ADR-092 Local-first VariScout product model
- ADR-093 V1 simplification cuts
- `apps/pwa/CLAUDE.md`
