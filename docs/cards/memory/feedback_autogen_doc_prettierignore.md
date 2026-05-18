---
title: 'feedback-autogen-doc-prettierignore'
description: 'Auto-generated markdown docs need `.prettierignore` exclusion (or the generator must output prettier-formatted markdown). Otherwise lint-staged prettier reformats on commit → script output diverges → pre-push staleness check fails on every push.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 80a655209f5c2d9f
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_autogen_doc_prettierignore.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Auto-generated docs vs prettier formatting

Pattern bites every time:
1. Script (`pnpm docs:gen-arch`, etc.) writes compact markdown tables
2. lint-staged on commit runs `prettier --write` on all `**/*.{css,json,md}` files — reformats tables with padded columns
3. Next regeneration produces compact output again
4. Pre-push staleness check (`git diff --exit-code <generated-file>`) sees diff → fails → push blocked

**Why**: 2026-05-16 session — Play 7's `scripts/docs/gen-arch.mjs` shipped + initial commit + `.husky/pre-push` staleness check added. First push hit "architecture-generated.md is stale" error. Root cause: lint-staged config in `package.json` does `"**/*.{css,json,md}": ["prettier --write"]` for any staged markdown, including the generated file.

**Fix**: Add the generated file path to `.prettierignore`:

```
# .prettierignore
docs/<path>/architecture-generated.md
```

Then commit triggers don't reformat → committed content stays identical to script output → staleness check is happy.

**Why not other fixes**:
- Script outputs pre-padded tables: matching prettier's exact rules is fragile (column widths, alignment); breaks if prettier config changes.
- Script invokes prettier on its output: adds prettier dep to script + slowdown; couples generator to formatting toolchain.
- Skip the staleness check: defeats the whole point (script output should always match committed content for the doc to be trustworthy).
- `--no-verify` on push: forbidden per [[feedback_subagent_no_verify]] + skips the check entirely.

**How to apply**:
- Whenever you add any `scripts/*/gen-*.mjs` or similar generator script that writes markdown/json/yaml, also add its output path to `.prettierignore` in the **same PR**.
- Document the exclusion in commit message or `.prettierignore` comment so future devs understand the special case.
- If the generator writes multiple files, glob-pattern the exclusion (e.g., `docs/*-generated.md`).

**Detection**:
- Symptom: pre-push hook fails with "X is stale. Run: pnpm docs:gen-X && git add X && git commit"
- Diagnosis: regenerate, then `git diff <generated-file>` — if the diff is formatting-only (whitespace, table column padding, line wrapping), it's this issue. If diff is content (different data), it's a different issue (genuine staleness).

Related: [[feedback_subagent_no_verify]], [[project_docs_strategy_2026]]
