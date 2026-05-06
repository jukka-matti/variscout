# @variscout/pwa

Free PWA. Session-only by default; opt-in local persistence; education + training tier.

## Hard rules

- **Session-only by default.** Opt-in IndexedDB persistence allowed only via explicit user action ("Save to this browser" → single Hub-of-one) AND/OR `.vrs` file export/import. `.vrs` files double as **shareable training scenarios** — trainers package datasets + Hub state; students import. No cloud sync (Azure-only). Per Q8-revised in `docs/archive/specs/2026-05-03-framing-layer-design.md` and `docs/decision-log.md` "Q8 revised" entry.
- **No AI in free tier** (Constitution P8). CoScout is Azure-only.
- Tailwind v4 requires `@source` directives in `src/index.css` for shared packages (`@source "../../../packages/ui/src/**/*.tsx"`, etc).
- Free tier only — branding is shown in chart footers (`isPaidTier()` from `@variscout/core/tier` returns false).

## Invariants

- **Architecture aligned with Azure per ADR-078** (same product, gated tiers): shared domain Zustand stores from `@variscout/stores` (`useProjectStore`, `useInvestigationStore`, `useImprovementStore`, `useSessionStore`, `useWallLayoutStore`, `useCanvasStore`); state shapes tier-agnostic, persistence tier-gated (Q8-revised: IndexedDB Hub-of-one + `.vrs`); tier-gated features check `isPaidTier()` at mount; shared orchestration components live in `@variscout/ui` with ~40 LOC route-shell per app. The "DataContext only, no Zustand" rule was retired by ADR-078.
- Embedded mode supported for iframes (see flows in `docs/02-journeys/flows/pwa-education.md`).
- Entry: `src/components/Dashboard.tsx`. Hosts the timeline-window picker (investigation-time, default `open-ended`; session-local in V1).

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
- ADR-078 PWA + Azure architecture alignment (same product, gated tiers)
