---
title: Build System & CI/CD
audience: [developer]
category: implementation
status: stable
related: [turbo, vite, github-actions, deployment]
---

# Build System & CI/CD

## Turbo Task Graph

VariScout uses Turborepo for monorepo task orchestration. Tasks are defined in `turbo.json`:

| Task    | Depends On                           | Inputs                                                  | Outputs   | Cacheable       |
| ------- | ------------------------------------ | ------------------------------------------------------- | --------- | --------------- |
| `build` | `^build` (dependencies first)        | `src/**`, `tsconfig.json`, `package.json`               | `dist/**` | Yes             |
| `test`  | `^build` (packages must build first) | `src/**`, `test/**`, `vitest.config.*`, `tsconfig.json` | —         | Yes             |
| `lint`  | —                                    | `src/**`, `eslint.config.*`                             | —         | Yes             |
| `dev`   | —                                    | —                                                       | —         | No (persistent) |

The `^build` dependency means packages build before apps. The dependency graph:

```
@variscout/core → (no deps, builds first)
@variscout/data → core
@variscout/charts → core
@variscout/hooks → core
@variscout/ui → core, charts, hooks
apps/* → all packages
```

### Turbo Caching

- **Local**: `.turbo/` directory (in `.gitignore`)
- **CI**: `actions/cache` restores `.turbo/` keyed by `pnpm-lock.yaml` + commit SHA
- **Cache invalidation**: Any change to `inputs` files invalidates the task cache

## Vite Build

Both apps use Vite with shared chunking via `config/viteChunks.ts`:

| Chunk            | Contents                    | Rationale                                       |
| ---------------- | --------------------------- | ----------------------------------------------- |
| `vendor-react`   | react, react-dom, scheduler | Stable, rarely changes                          |
| `vendor-d3`      | d3-\* modules               | Large, shared by charts                         |
| `vendor-visx`    | @visx/\* modules            | Chart rendering library                         |
| `vendor-icons`   | lucide-react                | Icon library                                    |
| `vendor-teams`   | @microsoft/teams-js         | Azure-only, large                               |
| `vendor-storage` | dexie                       | Azure-only, IndexedDB                           |
| `locale-{code}`  | i18n message catalogs       | Per-language code-split (English stays in main) |

### Sub-Path Exports in Build

`@variscout/core` uses the `exports` field in `package.json` to provide 18 sub-path imports (e.g., `@variscout/core/stats`). Vite resolves these at build time — no special configuration needed. Each sub-path maps to a source `.ts` file or `index.ts` barrel.

### i18n Build Layering

Locale loading is code-split via Vite's `import.meta.glob`:

1. `@variscout/core` defines messages but does NOT load them (no `import.meta.glob` in packages)
2. Each app calls `registerLocaleLoaders()` in its `main.tsx` with app-level `import.meta.glob`
3. Vite splits each locale into a separate chunk (`locale-fi`, `locale-sv`, etc.)
4. English stays in the main bundle (no lazy load needed)

### Build Warning Suppression

Two Rolldown `checks` options are suppressed in build configs:

| Check                      | Suppressed In   | Rationale                                                             |
| -------------------------- | --------------- | --------------------------------------------------------------------- |
| `ineffectiveDynamicImport` | UI library only | `@variscout/core` in Worker fallback uses intentional lazy loading    |
| `pluginTimings`            | UI library only | `vite-plugin-dts` is slow but correct; warning is informational noise |

These patterns are architecturally intentional — the dynamic imports exist for conditional loading, not for code splitting. Suppressing the warning prevents noise without hiding real issues.

**Vitest 4 migration**: `test.poolOptions` was removed in Vitest 4. Pool-specific options (like `execArgv`) are now top-level under `test:` directly. See [Vitest 4 migration guide](https://main.vitest.dev/guide/migration).

## CI/CD Pipeline

### Staging (`deploy-azure-staging.yml`)

**Trigger**: Push to `main` when `apps/azure/**`, `packages/**`, `infra/functions/**`, or `pnpm-lock.yaml` changes.

**Steps**:

1. Checkout + pnpm install (frozen lockfile)
2. Restore Turborepo cache
3. `pnpm audit --audit-level=high` (dependency security)
4. `npx lockfile-lint` (lockfile integrity)
5. `pnpm test` (all vitest tests across all packages)
6. `pnpm --filter @variscout/azure-app build` (Vite production build)
7. Generate SBOM (CycloneDX)
8. Azure Login (OIDC — no stored credentials)
9. Deploy to **staging slot** via `az webapp deploy`

### Production (`deploy-azure-production.yml`)

**Trigger**: Manual (`workflow_dispatch`) — requires GitHub environment approval.

**Steps**:

1. Azure Login (OIDC)
2. Health check staging slot (`/health` endpoint, HTTP 200 required)
3. Slot swap: staging → production (zero-downtime)
4. Health check production (verify swap succeeded)
5. **Auto-rollback**: If production health check fails, swap back immediately

**Emergency**: `skip_health_check` input bypasses the pre-swap check.

### Authentication

- OIDC federated credentials (no stored secrets)
- GitHub secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
