# @variscout/azure-app

Company deployment host for the canonical VariScout Workspace client.

## Scope

`apps/azure` is no longer a separate React product surface. Its default build creates
the company-channel Workspace bundle from `apps/pwa` / `@variscout/workspace-app`,
copies that output into `apps/azure/dist`, and serves it through `server.js`.

The surviving server responsibilities are:

- App Service health checks via `/health`
- Runtime config via `/config`
- EasyAuth user identity via `/api/me`
- Tenant-governed CoScout and telemetry plumbing
- Static hosting for the company Workspace build

## Commands

```bash
pnpm --filter @variscout/azure-app build   # build company Workspace into apps/azure/dist
pnpm --filter @variscout/azure-app preview # serve apps/azure/dist through server.js
pnpm --filter @variscout/azure-app test    # remaining server/config/legacy tests
```

The previous Azure React client build is retained temporarily as:

```bash
pnpm --filter @variscout/azure-app build:legacy-client
```

Use it only while retiring old Azure-client tests and references.
