# VariScout for Codex

Structured investigation for process improvement. Browser-based, offline-first, customer-owned data.

## Invariants

- Browser-only processing; data stays in customer's tenant (ADR-059).
- 4 domain Zustand stores are source of truth; no DataContext.
- Deterministic stats engine is authority; CoScout (AI) adds context.
- Package dependencies flow downward: core -> hooks -> ui -> apps.

## Commands

- `pnpm dev` - PWA at `:5173`
- `pnpm --filter @variscout/azure-app dev` - Azure app
- `pnpm test` - all packages via turbo
- `pnpm build` - all packages and apps
- `pnpm codex:ruflo-check` - verify Codex can reach repo-pinned Ruflo and print recovery steps if missing

## Where To Look

- Shared repo map: `docs/llms.txt`
- Product context: `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`
- Package context: `packages/*/CLAUDE.md` and `apps/*/CLAUDE.md`
- Decisions: `docs/07-decisions/`
- Designs: `docs/superpowers/specs/`
- Ruflo workflow: `docs/05-technical/implementation/ruflo-workflow.md`
- Codex-specific notes: `docs/05-technical/implementation/codex-ruflo-workflow.md`

## Workflow

- Tooling, docs, and config changes can go direct to `main`.
- Product code changes should follow the repo PR workflow: branch, PR, `bash scripts/pr-ready-check.sh`, review, squash-merge.
- Prefer retrieval over recall. Read the relevant ADR, spec, or package doc before non-trivial edits.

## Using Ruflo From Codex

- The repo pins the shared Ruflo command in `.mcp.json`, but Codex activation is verified through `codex mcp` and local Codex config.
- At session start, run `pnpm codex:ruflo-check` for the Codex-side health summary and recovery command.
- Before complex work, query ruflo memory for architecture, domain, or prior patterns.
- Before PR prep, run diff analysis and dispatch audit or test-gap workers when relevant.
- Codex does not use Claude-only hooks from `.claude/settings.json`; treat those as client-specific automation.

## Codex Session Start

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Run `pnpm codex:ruflo-check`.
3. If Ruflo is missing, add it with `codex mcp add ruflo -- npx ruflo@3.5.42 mcp start`.
