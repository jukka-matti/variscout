---
title: 'ADR-048: ESLint Boundary Enforcement'
---

# ADR-048: ESLint Boundary Enforcement

**Status:** Accepted
**Date:** 2026-03-23

## Context

ADR-045 documented that VariScout's package boundary rules exist **by convention only**:

> "Packages never import apps — Convention (future: ESLint boundary plugin)"
> "Consider ESLint boundary enforcement to prevent layer violations as the codebase grows"

As of March 2026, no layer violations exist. However:

- The codebase has grown to 231 test files and 6 active feature slices in the Azure app
- Architectural Review (ADR-044) rated boundary enforcement as a recommended follow-up
- ADR-046 (event bus) creates a new pattern (`apps/azure/src/events/`) that must stay within the app layer
- Without CI enforcement, boundary drift is invisible until it causes a build-time or runtime error

The event bus adoption (ADR-046) is the right moment to add enforcement, because:

- The codebase is at a clean baseline (zero violations)
- The `events/` module needs clear boundaries (it must not be imported by packages)
- Feature-level boundaries are nearly achievable but not yet clean enough for strict enforcement

## Decision

### Adopt `eslint-plugin-boundaries` with two-phase rollout

#### Phase 1 (now): Package-level boundary rules

Add `eslint-plugin-boundaries` to the root ESLint config with rules that enforce the layer DAG from ADR-045:

```
Domain Layer     (@variscout/core, @variscout/data)
      ↓
Orchestration   (@variscout/hooks)
      ↓
Presentation    (@variscout/ui, @variscout/charts)
      ↓
Apps            (apps/azure, apps/pwa, apps/website, apps/docs)
```

**Rules enforced:**

| Rule                                                            | What it catches                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@variscout/core` must not import React                         | Core importing `react` or `react-*`                                                  |
| `@variscout/hooks` must not import app modules                  | Hooks importing from `apps/`                                                         |
| `@variscout/ui` must not import app modules                     | UI importing from `apps/`                                                            |
| `@variscout/charts` must not import app modules                 | Charts importing from `apps/`                                                        |
| Packages must not import each other laterally at the same layer | `hooks` importing `ui`, `ui` importing `hooks` except via documented peer dependency |
| `apps/azure/src/events/` must not be imported from packages     | Event bus stays in the app layer                                                     |

**Implementation:**

```javascript
// .eslintrc.js (root)
{
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'packages/core/src/**' },
      { type: 'data', pattern: 'packages/data/src/**' },
      { type: 'hooks', pattern: 'packages/hooks/src/**' },
      { type: 'ui', pattern: 'packages/ui/src/**' },
      { type: 'charts', pattern: 'packages/charts/src/**' },
      { type: 'app-azure', pattern: 'apps/azure/src/**' },
      { type: 'app-pwa', pattern: 'apps/pwa/src/**' },
    ],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        // Core: no deps
        { from: 'core', allow: [] },
        { from: 'data', allow: ['core'] },
        { from: 'hooks', allow: ['core', 'data'] },
        { from: 'charts', allow: ['core'] },
        { from: 'ui', allow: ['core', 'hooks', 'charts'] },
        { from: ['app-azure', 'app-pwa'], allow: ['core', 'data', 'hooks', 'ui', 'charts'] },
      ],
    }],
  },
}
```

**Current violation count: 0.** The rule set is adopted at zero-warning baseline.

#### Phase 2 (deferred — post-ADR-046 event migration): Feature-level rules

After the event bus enables clean feature isolation (ADR-046), add feature-slice boundary rules within `apps/azure/src/features/`:

- `features/findings/` must not import from `features/investigation/` directly (use events)
- `features/ai/` must not import from `features/findings/` directly (use events)
- etc.

Phase 2 is deferred because cross-feature direct imports in orchestration hooks currently exist and will only be cleanly removable after the event bus migration is complete.

### CI integration

`eslint --max-warnings 0` already runs in CI (`pnpm lint`). No CI changes required — boundary violations will fail the existing lint step.

## Consequences

### Positive

- Layer violations caught at PR time, not at code review or runtime
- Zero-violation baseline means the rule set is not immediately disruptive
- `events/` module boundary explicitly enforced (packages cannot import the event bus)
- Phase 2 path is documented for when feature isolation is ready
- Completes the "no runtime enforcement" gap identified in ADR-045

### Negative

- `eslint-plugin-boundaries` adds one dev dependency
- Misconfigured path patterns could produce false positives — requires verification after adding
- Phase 2 feature-level rules require the event bus migration (ADR-046) to be complete first

### Neutral

- Existing code has zero violations — no immediate refactoring required
- PWA feature structure is flat (no feature slices), so feature-level rules do not apply to it
- Package boundary rules align with what `package.json` peer dependencies already encode

## Related

- [ADR-045: Modular Architecture](adr-045-modular-architecture.md) — boundary rules this ADR enforces
- [ADR-046: Event-Driven Architecture](adr-046-event-driven-architecture.md) — event bus enables Phase 2 feature isolation
- Full design: `docs/archive/specs/2026-03-23-event-driven-architecture-design.md`
