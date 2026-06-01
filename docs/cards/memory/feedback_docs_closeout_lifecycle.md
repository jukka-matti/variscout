---
title: 'docs-closeout-lifecycle'
description: 'Multi-PR initiative closeout requires the `delivered` canonical frontmatter status gate. When a phase ships, flip spec + master + sub-plans to `status: delivered`; document explicit deferrals in `docs/decision-log.md`. Pattern established by LV1 doc closeout PR #241 (2026-05-29).'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, feedback]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: 55956b70a6ac299f
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_docs_closeout_lifecycle.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a multi-PR initiative ships, run a doc closeout sweep that flips frontmatter status from `active`/`draft` → `delivered` for: (1) the spec, (2) the master plan, (3) all sub-plans. Pre-PR #241 the schema treated `delivered` as a transitional alias to `active`; PR #241 promoted it to canonical (`scripts/docs-frontmatter-schema.mjs` STATUS array). The closeout PR should also:

- Log explicit deferrals in `docs/decision-log.md` (e.g., PWA-Mount-Deferral).
- Mark resolved investigations entries `[RESOLVED YYYY-MM-DD via PR #N]` inline (append-only audit trail; don't delete).
- Add inline blockquote banners on superseded sections of living docs (e.g., wedge §3.3 supersession banner; section-level supersession isn't a frontmatter concept).
- Sweep for residual references to retired entities/binaries (State/Edit, Done button, authoringMode) in canonical user-facing docs.

**Why:** Prevents next-Claude from reading stale-active specs and treating them as in-flight design rather than reference history. The lifecycle gate also surfaces drift between docs and shipped reality at the natural transition moment.

**How to apply:** When the last PR of a multi-PR initiative merges, run a focused doc closeout sweep before declaring done. Pair with vocabulary-alignment cleanup (T-NEW-1 pattern) if a vocab rename happened during the phase. Use audit-based scoping but recognize audits miss design-level drift (e.g., Sponsor model drift surfaced post-closeout because audit looked for specific signals only).

Caveat: sample markdown in sub-plans (e.g., example decision-log entries) must use plain-text paths or `[label](path)` patterns that don't resolve as real links — the cross-reference validator follows samples from the sub-plan's own location, which produces broken-ref errors. See `feedback_doc_validation_hooks`.

Related: [[docs-closeout-lifecycle]] · [[doc-validation-hooks]] · [[close-threads-to-done]] · [[consolidation-replace-not-umbrella]] · [[systemic-before-patching]].
