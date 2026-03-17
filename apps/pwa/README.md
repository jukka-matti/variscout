# @variscout/pwa

Free, offline-first PWA for training and education in process variation analysis.

## Quick Start

```bash
pnpm --filter @variscout/pwa dev    # Dev server at localhost:5173
pnpm --filter @variscout/pwa build  # Production build
```

## Scope

The PWA is **forever free** — a training tool for quality professionals:

- Core analysis: I-Chart, Boxplot, Pareto, Capability
- Sample datasets (coffee, journey, bottleneck, sachets)
- Copy-paste data input only (no file upload/save)
- Max 3 factors, 50K rows
- VariScout branding on chart exports
- No Performance Mode, no file persistence

## Architecture

- **React 18** + **Vite** + **Tailwind CSS**
- State: `DataContext.tsx` (Context API, no Redux)
- Offline-first: works without internet after first visit (service worker via vite-plugin-pwa)
- Session-only storage (no IndexedDB persistence)

## Testing

```bash
pnpm --filter @variscout/pwa test       # Unit/component tests (Vitest)
pnpm --filter @variscout/pwa test:e2e   # E2E tests (Playwright)
```

## Related

- [Azure App](../../apps/azure/README.md) — paid product with persistence, Teams, AI
- [PWA Product Spec](../../docs/08-products/pwa/index.md)
