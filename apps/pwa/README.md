# @variscout/workspace-app

Local-first Workspace client for free, individual, and company channels.

## Quick Start

```bash
pnpm --filter @variscout/workspace-app dev    # Dev server at localhost:5173
pnpm build:workspace:free                     # Free channel production build
pnpm build:workspace:individual               # Individual channel production build
pnpm build:workspace:company                  # Company channel production build
```

## Scope

The Workspace app is one client assembled with build-time channel gates:

- `free`: in-session analysis, sample datasets, paste/manual data entry, no artifact export code.
- `individual`: `.vrs` import/export and local artifact support.
- `company`: same Workspace client with company capabilities and server-provided runtime config.

## Architecture

- **React 18** + **Vite** + **Tailwind CSS**
- State: `DataContext.tsx` (Context API, no Redux)
- Offline-first: works without internet after first visit (service worker via vite-plugin-pwa)
- Session-only storage (no IndexedDB persistence)

## Testing

```bash
pnpm --filter @variscout/workspace-app test       # Unit/component tests (Vitest)
pnpm --filter @variscout/workspace-app test:e2e   # E2E tests (Playwright)
```

## Related

- [Company server](../../apps/azure/README.md) — EasyAuth/runtime config/static host
