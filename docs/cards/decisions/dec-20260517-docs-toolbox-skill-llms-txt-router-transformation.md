---
title: 'Docs-toolbox skill + llms.txt → router transformation'
purpose: decide
tier: card
status: active
date: 2026-05-17
topic: ['decisions', 'spec-edit', 'new-spec', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Docs-toolbox skill + llms.txt → router transformation

`new spec`: `.claude/skills/docs-toolbox/SKILL.md`. `spec edit`: `docs/llms.txt` [supersedes prior static catalog].
  Why: subagents need a single auto-triggered skill that surfaces `pnpm docs:find/get/related/recent/verify/amend`; llms.txt becomes a router pointing at the four canonical skills (quickstart, toolbox, package-router, store-state-glossary) + always-load docs. Commit: <TBD>. PR: <TBD>. Related: [[2026-05-16-docs-strategy-design]].
