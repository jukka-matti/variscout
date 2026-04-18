# VariScout

Structured investigation for process improvement. Browser-based, offline-first, customer-owned data.

## Invariants

- Browser-only processing; data stays in customer's tenant (ADR-059).
- 4 domain Zustand stores are source of truth; no DataContext.
- Deterministic stats engine is authority; CoScout (AI) adds context.
- Package dependencies flow downward: core → hooks → ui → apps.

## Commands

- `pnpm dev` — PWA at :5173
- `pnpm --filter @variscout/azure-app dev` — Azure app
- `pnpm test` — all packages (turbo)
- `pnpm build` — all packages + apps
- `claude --chrome` — enable browser for E2E

## Where to look

- **Product context**: `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`.
- **Package-specific**: nested `CLAUDE.md` in each `packages/*/` and `apps/*/`.
- **Agent manifest**: `docs/llms.txt` — map of priority entry points.
- **Decisions (why)**: `docs/07-decisions/` (live) + `docs/archive/adrs/` (superseded).
- **Designs (what)**: `docs/superpowers/specs/` (active) + `docs/archive/specs/` (delivered/historical).
- **Path-scoped rules**: `.claude/rules/` — load automatically when editing specific areas.
- **Skills**: `.claude/skills/` — load on invocation or match.

## Workflow

- **Tooling / docs / config** (`.claude/`, `scripts/`, `docs/`, `CLAUDE.md`, `package.json`, etc.): direct commit to main is fine.
- **Product code** (`packages/*/src/`, `apps/*/src/`): branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge. Don't use `gh pr merge --admin` unless it's an emergency.
- Pre-push hook warns (non-blocking) if a direct-to-main push touches product code.

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package CLAUDE.md before writing non-trivial code. If an instruction contradicts code, trust code and flag the drift.
