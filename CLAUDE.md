# VariScout

Structured investigation for process improvement. Browser-based,
offline-first, customer-owned data.

## Hard rules (enforced by lint/hooks — do not violate)

- Never use `.toFixed()` on stats — use `formatStatistic()` from
  `@variscout/core/i18n`
- Never hardcode hex colors in charts — use `chartColors`/`chromeColors`
  from `@variscout/charts/colors`
- Never use "root cause" in user-facing strings or AI prompts —
  use "contribution" (P5)
- Never interpret interactions as "moderator/primary" — use
  geometric terms (ordinal/disordinal)

## Invariants

- Browser-only processing; data stays in customer's tenant
- 4 domain Zustand stores are source of truth; no DataContext
- Deterministic stats engine is authority; CoScout (AI) adds context
- Package dependencies flow downward: core → hooks → ui → apps

## Commands

- `pnpm dev` — PWA at :5173
- `pnpm --filter @variscout/azure-app dev` — Azure app
- `pnpm test` — all packages
- `pnpm build` — all packages + apps
- `claude --chrome` — enable browser for E2E

## Orientation

- System in practice: @docs/OVERVIEW.md
- User journeys and personas: @docs/USER-JOURNEYS.md
- Data lifecycle: @docs/DATA-FLOW.md

## Package inventory (counts checked by pre-commit gate)

| Package            | Exports               |
| ------------------ | --------------------- |
| `@variscout/hooks` | 83+ hooks             |
| `@variscout/ui`    | 90+ component modules |

## Where to find domain knowledge

- Package-specific context: nested CLAUDE.md in each `packages/*/` and `apps/*/`
- Workflow-specific knowledge: `.claude/skills/` (auto-loaded by task)
- Decisions (why): `docs/07-decisions/` (ADR-001 through ADR-069)
- Designs (what): `docs/superpowers/specs/`
- Reference corpus: `docs/index.md` (domain manifest)

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package
CLAUDE.md before writing non-trivial code. If an instruction contradicts
code, trust code and flag the drift.
