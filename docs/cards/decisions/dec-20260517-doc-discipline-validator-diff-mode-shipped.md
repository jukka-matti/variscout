---
title: 'Doc-discipline validator `--diff` mode shipped'
purpose: decide
tier: card
status: active
date: 2026-05-17
topic: ['decisions', 'spec-edit', 'spec', 'doc-discipline']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Doc-discipline validator `--diff` mode shipped

`spec edit`: `scripts/check-doc-frontmatter.mjs` — added decision-log append-only WARN (>7-day-old line edits) + edit-type vocabulary parser + `## Amendment` heading WARN in design specs + `delivered-by` without `Delivered` banner WARN.
  Why: completes the mechanical half of `docs/agent-context/doc-discipline.md` §Decision-log as temporal index + §Edit-in-place mechanics. Pre-commit/pre-push hook `--diff` wiring is a follow-up (out of scope for Phase 2). Commit: <TBD>. PR: <TBD>. Related: [[2026-05-16-docs-strategy-design]], [[doc-discipline]].
