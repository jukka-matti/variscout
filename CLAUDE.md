# VariScout

Structured investigation for process improvement. Browser-based, customer-owned data, local-cache capable. **V1 strategic direction (single-SKU pivot 2026-05-16, amended 2026-05-16 Improve-tab):** single-product tool for improvement specialists; €120/mo Azure tenant-wide; 7-tab workflow nav (`Home · Project · Process · Analyze · Investigation · Improve · Report`); Improve is a top-level verb tab with active-IP cascade; project-membership ACLs (no cross-AD-tenant invites). Canonical: [V1 architecture spec](docs/superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](docs/07-decisions/adr-082-wedge-architecture.md). VariScout Process (enterprise) is named-future. Many docs pre-date this pivot — Phase A canonical-anchor cleanup landed 2026-05-17; Phase C holistic audit scheduled post-customer-validation.

Shared agent map: `docs/llms.txt`

## Invariants

- Browser-only processing; data stays in customer's tenant (ADR-059). Deterministic stats engine is authority; CoScout (AI) adds context. No statistical roll-up across heterogeneous units — distributions, not aggregates (ADR-073).
- 6 Zustand stores split across 3 layers per ADR-078 + F4 (3 Document, 2 Annotation, 1 View); no DataContext. Authoritative table: `packages/stores/CLAUDE.md`.
- Package dependencies flow downward: core → hooks → ui → apps. Sub-path exports need **both** `package.json#exports` AND `tsconfig.json#paths` updated together. Tailwind v4: every app's `src/index.css` needs `@source` for shared packages — missing it silently breaks responsive utils.
- Never "root cause" — say "contribution" / "suspected cause" / "mechanism" (P5 amended). Never call interactions "moderator/primary" — use `'ordinal'` / `'disordinal'`. ESLint enforces both.

## Commands

- `pnpm dev` — PWA at :5173
- `pnpm --filter @variscout/azure-app dev` — Azure app
- `pnpm test` — all packages (turbo)
- `pnpm build` — all packages + apps
- `claude --chrome` — enable the **official [Claude for Chrome extension](https://claude.com/claude-for-chrome)** for browser-assisted E2E (drives your real Chrome with your login state).
- Local test cheatsheet (`--ui`, `--changed`, `--bail`, `--reporter=verbose`): see `docs/05-technical/implementation/testing.md` § "Local TDD cheatsheet".

## Where to look

- **Product context**: `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`.
- **Operating model**: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` — three-level methodology, Process Measurement System, response paths.
- **Roadmap**: `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md` — H0–H4 horizons.
- **Package-specific**: nested `CLAUDE.md` in each `packages/*/` and `apps/*/`.
- **Agent manifest**: `docs/llms.txt` — map of priority entry points.
- **Decisions (why)**: `docs/07-decisions/` (live) + `docs/archive/adrs/` (superseded).
- **Designs (what)**: `docs/superpowers/specs/` (active) + `docs/archive/specs/` (delivered/historical).
- **Invariants + skills**: `.claude/invariants/` = short cross-cutting non-negotiables (currently load globally). See `.claude/INVARIANTS.md` for the synthesizing index. `.claude/skills/` = workflows only — VariScout editing patterns live in nested `CLAUDE.md`. Doc workflow: spec frontmatter SSOT in `scripts/docs-frontmatter-schema.mjs`; new docs need ≥1 inbound link.

## Workflow

- **Tooling / docs / config** (`.claude/`, `scripts/`, `docs/`, `CLAUDE.md`, `package.json`): direct commit to main is fine. **Product code** (`packages/*/src/`, `apps/*/src/`): branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge. Pre-push hook warns (non-blocking) on direct-to-main product touches. Don't `gh pr merge --admin` unless emergency.
- **Before pushing a feature branch**: `git fetch && git log HEAD..origin/main` — if ≥10 commits drift, merge main first. Drive-by fixes on PRs >3 days old or ≥15 commits behind go to main, not the stale branch.
- **Plans + implementation**: brainstorming → `superpowers:writing-plans` → `superpowers:subagent-driven-development` by default (one worktree per plan, fresh implementer per task, spec + quality reviewer pair per task, final code-reviewer at the end). **Right-size the model per task** — Haiku for purely mechanical work (single-file, full spec, no decisions: rename / barrel-line / `git rm`); Sonnet for standard implementer + reviewer work (well-specified TDD against 1–3 files); Opus for multi-file integration, judgment-heavy refactors, architecture/design, under-specified plans, and the final-branch review. No quota — the orchestrator picks per task based on judgment density, integration breadth, and reversibility of mistakes. Inline only for trivial / secrets / exploration-only tasks.
- **Plan + parallel-write discipline** (slice 4 retro): cap slices at ~6–8 tasks/PR for **feature work** where complexity grows nonlinearly. Multi-PR off one branch when larger. **Carve-out for atomic deletion-cascade sweeps** (research-backed 2026 + Anthropic subagent guidance): when a public-API change forces a tsc-wide breaking change across many consumers, dispatch ONE bigger Opus implementer with Architect → Migration → Validator internal phases + per-category commits, rather than splitting into artificial sub-tasks. Splitting an atomic cascade into 6-8 sub-dispatches multiplies orchestration cost without buying review depth (each sub-reviewer sees only a slice). Verify call-site reachability at plan time (Explore). Write §"Partial-integration policy" for engine→primitive→app spans. **Any parallel writer (Codex, subagent, automation) owns its own `.worktrees/<branch>/`** — main session stays at repo root; sharing checkouts causes branch-switch races + dangling commits. See `feedback_slice_size_cap`, `feedback_atomic_sweep_one_dispatch`, `feedback_plan_call_site_reachability`, `feedback_partial_integration_policy`, `feedback_one_worktree_per_agent`.

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package CLAUDE.md before writing non-trivial code. If an instruction contradicts code, trust code and flag the drift.

Before re-opening any topic, check `docs/decision-log.md` first. When you defer, supersede, or close something, log it there with the appropriate state. The decision log is the durable home for decisions that would otherwise live only in a plan file.

For code-level smells, UX follow-ups, or architectural questions surfaced during work that aren't yet decisions, log them in `docs/investigations.md`. Lighter than an Open Question (no decision pending); heavier than a TODO comment (deserves to outlive the PR). Entries graduate to `decision-log.md`, a spec, or an ADR when ready.

## Memory Hygiene

MEMORY.md holds _durable_ facts for Claude Code (architecture, decisions, terminology, feedback). Ephemeral state (PR status, in-flight phase, test counts, sprint focus) belongs in `git`/`gh`, not memory — say "see PR #N for delivery state" instead of encoding status. Entries citing file paths, function names, or commit hashes are claims valid _at write time_; verify before recommending, and update/delete when referenced entities move.

## Claude-Specific Notes

- `.claude/settings.json` provides Claude hooks, statusline, permissions, and attribution.
- **Browser E2E**: install [Claude for Chrome](https://claude.com/claude-for-chrome) and start with `claude --chrome` (or `/chrome` → Enabled by default). This is the canonical browser path — gives Claude `chrome_*` tools that drive your real Chrome with login state, bookmarks, and devtools console access. Docs: https://code.claude.com/docs/en/chrome.
- Claude Code does not use Ruflo or Claude Flow in this repo: no project MCP server, no Ruflo hooks, no Ruflo attribution, and no Ruflo skills.
- `AGENTS.md` is the Codex entrypoint; keep shared repo guidance consistent across both wrappers.
