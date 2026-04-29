# VariScout

Structured investigation for process improvement. Browser-based, customer-owned data, local-cache capable.

Shared agent map: `docs/llms.txt`

## Invariants

- Browser-only processing; data stays in customer's tenant (ADR-059).
- 4 domain Zustand stores are source of truth; no DataContext.
- Deterministic stats engine is authority; CoScout (AI) adds context.
- Package dependencies flow downward: core → hooks → ui → apps.
- No statistical roll-up across heterogeneous units — distributions, not aggregates (ADR-073).

## Commands

- `pnpm dev` — PWA at :5173
- `pnpm --filter @variscout/azure-app dev` — Azure app
- `pnpm test` — all packages (turbo)
- `pnpm build` — all packages + apps
- `claude --chrome` — enable browser for E2E

## Where to look

- **Product context**: `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`.
- **Operating model**: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` — three-level methodology, Process Measurement System, response paths.
- **Roadmap**: `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md` — H0–H4 horizons.
- **Package-specific**: nested `CLAUDE.md` in each `packages/*/` and `apps/*/`.
- **Agent manifest**: `docs/llms.txt` — map of priority entry points.
- **Decisions (why)**: `docs/07-decisions/` (live) + `docs/archive/adrs/` (superseded).
- **Designs (what)**: `docs/superpowers/specs/` (active) + `docs/archive/specs/` (delivered/historical).
- **Ruflo workflow**: `docs/05-technical/implementation/ruflo-workflow.md` + `docs/05-technical/implementation/ruflo.md`
- **Claude-only rules**: `.claude/rules/` — load automatically when editing specific areas.
- **Claude-only skills**: `.claude/skills/` — load on invocation or match.

## Workflow

- **Tooling / docs / config** (`.claude/`, `scripts/`, `docs/`, `CLAUDE.md`, `package.json`, etc.): direct commit to main is fine.
- **Product code** (`packages/*/src/`, `apps/*/src/`): branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge. Don't use `gh pr merge --admin` unless it's an emergency.
- Pre-push hook warns (non-blocking) if a direct-to-main push touches product code.
- **Before pushing to a feature branch**: `git fetch && git log HEAD..origin/main` — if ≥10 commits drift, merge main first. Drive-by fixes on PRs >3 days old or ≥15 commits behind go to main directly, not the stale branch.

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package CLAUDE.md before writing non-trivial code. If an instruction contradicts code, trust code and flag the drift.

Before re-opening any topic, check `docs/decision-log.md` first. When you defer, supersede, or close something, log it there with the appropriate state. The decision log is the durable home for decisions that would otherwise live only in a plan file.

## Memory & ruflo hygiene

MEMORY.md and ruflo hold _durable_ facts (architecture, decisions, terminology, feedback). Ephemeral state (PR status, in-flight phase, test counts, sprint focus) belongs in `git`/`gh`, not memory — say "see PR #N for delivery state" instead of encoding status. Entries citing file paths, function names, or commit hashes are claims valid _at write time_; verify before recommending, and update/delete when referenced entities move. See `.claude/skills/using-ruflo/SKILL.md` for ruflo workflow.

## Claude-Specific Notes

- `.claude/settings.json` provides Claude hooks, statusline, permissions, and attribution.
- `claude --chrome` is the supported browser-assisted E2E path in this repo.
- `AGENTS.md` is the Codex entrypoint; keep shared repo guidance consistent across both wrappers.
