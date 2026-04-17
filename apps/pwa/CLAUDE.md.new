# @variscout/pwa

Free PWA. Session-only (no persistence), Context-based state, education tier.

## Hard rules

- No persistence. No IndexedDB, no localStorage, no cloud sync. Session ends, data is gone. This is the product principle.
- Tailwind v4 requires `@source` directives in `src/index.css` for shared packages (`@source "../../../packages/ui/src/**/*.tsx"`, etc).
- Free tier only — branding is shown in chart footers (`isPaidTier()` from `@variscout/core/tier` returns false).

## Invariants

- State via React Context (`DataContext`). No Zustand stores in PWA.
- Embedded mode supported for iframes (see flows in `docs/02-journeys/flows/pwa-education.md`).
- Entry: `src/components/Dashboard.tsx`.

## Test command

```bash
pnpm --filter @variscout/pwa test
```

E2E: `pnpm --filter @variscout/pwa test:e2e`.

## Skills to consult

- `writing-tests` — RTL patterns, E2E data-testid conventions

## Related

- ADR-004 Offline-first
- ADR-012 PWA browser-only
- ADR-033 Pricing simplification
