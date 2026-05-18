---
title: 'Doc validation pre-commit hooks'
description: 'Pre-commit hook validates docs orphans (file referenced from at least one other doc) and broken cross-references (relative markdown link paths). Plans + specs need to reference each other to avoid orphan errors.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 8f9054c029cc8338
origin-session-id: 86a56343-170c-4e74-b36c-f6ef64738dc3
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_doc_validation_hooks.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The husky pre-commit hook (run via lint-staged) includes a docs validator that checks two things on docs/ changes:

1. **Orphaned files** — any new doc must be referenced from at least one other doc. Bare specs, plans, or other markdown files that nothing links to fail the hook.
2. **Broken cross-references** — relative markdown link paths `[text](path)` must resolve to existing files from the *source* file's location.

**Why:** keeps docs/ navigable; prevents drift where files exist but no one can find them. Discovered when committing a fresh design spec + plan together — both initially failed the hook with "ORPHAN" and "BROKEN" errors.

**How to apply:**

- **Always pair specs with plans cross-referencing each other.** Spec's "Implementation plan" section should link to the plan; plan's References section should link back to the spec. Both reference each other → both pass orphan check.
- **In plan files that quote markdown to be pasted into other docs**, NEVER use real markdown link syntax `[text](../path/...)` for those snippets. The hook scans all link syntax regardless of whether it's inside a fenced code block, and interprets paths relative to the *current* file (the plan), not the file the snippet will be pasted into. Use plain text path references instead, with a note like "(write a real markdown link from `<target dir>` when pasting)".
- **Single-quote inline-code wrapping is NOT enough** to hide a markdown link from the validator — the regex still fires.
- The hook output is in `/private/tmp/claude-501/.../<task-id>.output` when run via background commands; use `tail -50` to see specific errors.

This memory was added 2026-04-27 after fixing two real issues caught by the hook on the Layered Process View spec + V1 plan commit (`aa5c9fe2`).
