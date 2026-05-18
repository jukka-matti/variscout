<!--
PR template — see CLAUDE.md "Workflow" + docs/superpowers/specs/2026-05-18-spec-driven-development-design.md
for the SDD lifecycle (Propose → Apply → Archive).
-->

## What this PR does

<!-- 1-3 sentences. Why this change exists. Link to spec / ADR / issue. -->

## SDD checklist

- [ ] L1-L3 docs updated for this change (or this PR is infrastructure-only)
- [ ] If new feature: design spec has `implements:` pointing to affected L1-L3 docs
- [ ] If delivered: design spec moved to `docs/archive/specs/` with banner + `delivered-by:` frontmatter
- [ ] Validator green (`pnpm docs:check`)

## Test plan

<!--
Brief markdown list of how this was verified. Examples:
- `pnpm test --filter @variscout/core` green
- Manual walkthrough via `claude --chrome` — created project, ran scout, verified Investigation tab
- Architecture grep: `pnpm test:arch` green
-->

-

🤖 Generated with [Claude Code](https://claude.com/claude-code)
