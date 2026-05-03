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
- `claude --chrome` — enable the **official [Claude for Chrome extension](https://claude.com/claude-for-chrome)** for browser-assisted E2E (drives your real Chrome with your login state). NOT the ruflo browser MCP.

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

- **Tooling / docs / config** (`.claude/`, `scripts/`, `docs/`, `CLAUDE.md`, `package.json`): direct commit to main is fine. **Product code** (`packages/*/src/`, `apps/*/src/`): branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge. Pre-push hook warns (non-blocking) on direct-to-main product touches. Don't `gh pr merge --admin` unless emergency.
- **Before pushing a feature branch**: `git fetch && git log HEAD..origin/main` — if ≥10 commits drift, merge main first. Drive-by fixes on PRs >3 days old or ≥15 commits behind go to main, not the stale branch.
- **Plans + implementation**: brainstorming → `superpowers:writing-plans` → `superpowers:subagent-driven-development` by default (one worktree per plan, fresh implementer per task, spec + quality reviewer pair per task, final code-reviewer at the end). Pick smallest model per role — **Sonnet for ≥70% of dispatches**, Opus for final-branch review + design/plan work. Inline only for trivial / secrets / exploration-only tasks.

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package CLAUDE.md before writing non-trivial code. If an instruction contradicts code, trust code and flag the drift.

Before re-opening any topic, check `docs/decision-log.md` first. When you defer, supersede, or close something, log it there with the appropriate state. The decision log is the durable home for decisions that would otherwise live only in a plan file.

For code-level smells, UX follow-ups, or architectural questions surfaced during work that aren't yet decisions, log them in `docs/investigations.md`. Lighter than an Open Question (no decision pending); heavier than a TODO comment (deserves to outlive the PR). Entries graduate to `decision-log.md`, a spec, or an ADR when ready.

## Memory & ruflo hygiene

MEMORY.md and ruflo hold _durable_ facts (architecture, decisions, terminology, feedback). Ephemeral state (PR status, in-flight phase, test counts, sprint focus) belongs in `git`/`gh`, not memory — say "see PR #N for delivery state" instead of encoding status. Entries citing file paths, function names, or commit hashes are claims valid _at write time_; verify before recommending, and update/delete when referenced entities move. See `.claude/skills/using-ruflo/SKILL.md` for ruflo workflow.

## Claude-Specific Notes

- `.claude/settings.json` provides Claude hooks, statusline, permissions, and attribution.
- **Browser E2E**: install [Claude for Chrome](https://claude.com/claude-for-chrome) and start with `claude --chrome` (or `/chrome` → Enabled by default). This is the canonical browser path — gives Claude `chrome_*` tools that drive your real Chrome with login state, bookmarks, and devtools console access. Docs: https://code.claude.com/docs/en/chrome.
- **Do NOT use `mcp__ruflo__browser_*` MCP tools for E2E** — those are a separate headless-Chromium agent stack (different UX, no real browser state, slower iteration). Reserve ruflo MCP for `mcp__ruflo__memory_*`, `mcp__ruflo__agentdb_*`, `mcp__ruflo__hooks_*` (per `.claude/skills/using-ruflo/SKILL.md`).
- `AGENTS.md` is the Codex entrypoint; keep shared repo guidance consistent across both wrappers.
