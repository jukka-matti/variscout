# VariScout for Codex

Structured investigation for process improvement. Browser-based, customer-owned data, local-cache capable.

## Invariants

- Browser-only processing; data stays in customer's tenant (ADR-059).
- 5 domain Zustand stores are source of truth (project, investigation, improvement, session, canvas) + 1 cross-app feature store (wallLayout); no DataContext per ADR-078.
- Deterministic stats engine is authority; CoScout (AI) adds context.
- Package dependencies flow downward: core -> hooks -> ui -> apps.

## Commands

- `pnpm dev` - PWA at `:5173`
- `pnpm --filter @variscout/azure-app dev` - Azure app
- `pnpm test` - all packages via turbo
- `pnpm build` - all packages and apps
- `pnpm codex:ruflo-check` - verify Codex can reach the expected Ruflo version and print recovery steps if missing or stale

## Where To Look

- Shared repo map: `docs/llms.txt`
- Product context: `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`
- Package context: `packages/*/CLAUDE.md` and `apps/*/CLAUDE.md`
- Decisions: `docs/07-decisions/` (live ADRs) and `docs/decision-log.md` (Replayed Decisions, Open Questions, Named-Future) — read before re-opening any topic.
- Designs: `docs/superpowers/specs/`
- Investigations: `docs/investigations.md` — code smells / UX follow-ups / architectural questions surfaced during work that aren't yet decisions. Lighter than an Open Question, heavier than a TODO. Add an entry when shipping fix A surfaces problem B you don't want to lose.
- Ruflo workflow: `docs/05-technical/implementation/ruflo-workflow.md`
- Codex-specific notes: `docs/05-technical/implementation/codex-ruflo-workflow.md`

## Workflow

- Tooling, docs, and config changes can go direct to `main`.
- Product code changes should follow the repo PR workflow: branch, PR, `bash scripts/pr-ready-check.sh`, review, squash-merge.
- Prefer retrieval over recall. Read the relevant ADR, spec, or package doc before non-trivial edits.
- **Use a dedicated worktree.** Codex must operate from `.worktrees/<branch>/` (not the repo root) when writing code, even for solo work — and ALWAYS when running concurrently with another agent. The repo root stays reserved for the human / main Claude Code session (docs, specs, decisions). Sharing a checkout across writing agents causes branch-switch races, stash accumulation, and dangling commits. See `~/.claude/projects/.../memory/feedback_one_worktree_per_agent.md` for the slice 4 followup retro evidence. Setup: `git worktree add .worktrees/<branch> -b <branch> origin/main && cd .worktrees/<branch> && pnpm install`.

## Using Ruflo From Codex

- The tracked Ruflo expectation lives in `scripts/check-codex-ruflo.sh`; local `.mcp.json` and Codex MCP config can drift and must be verified.
- At session start, run `pnpm codex:ruflo-check` for the Codex-side registration/version health summary and recovery command. Treat any direct Ruflo CLI probe in that check as diagnostic only.
- Use the Ruflo MCP tools for in-session work. Query memory/status/diff/workers through `mcp__ruflo__*` (lazy-load with tool search if needed), not by running `npx ruflo ...` from the shell.
- Before complex work, query Ruflo MCP memory for architecture, domain, or prior patterns.
- Before PR prep, run MCP diff analysis and dispatch MCP audit or test-gap workers when relevant.
- Codex does not use Claude-only hooks from `.claude/settings.json`; treat those as client-specific automation.

## Codex Session Start

1. Read `AGENTS.md` and `docs/llms.txt`.
2. Run `pnpm codex:ruflo-check`.
3. If Ruflo is missing or registered with the wrong version, follow the remove/add repair commands printed by the check.
4. **Create or attach to a dedicated worktree** for any code work: `git worktree add .worktrees/<feature-branch> -b <feature-branch> origin/main && cd .worktrees/<feature-branch> && pnpm install`. Do NOT operate from the repo root if you will write — that's reserved for the main session.
