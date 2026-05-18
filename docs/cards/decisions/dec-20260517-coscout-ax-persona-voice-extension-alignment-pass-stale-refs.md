---
title: 'CoScout AX persona+voice extension + alignment-pass stale-refs'
purpose: decide
tier: card
status: active
date: 2026-05-17
topic: ['decisions', 'spec-edit', 'wedge', 'coscout']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# CoScout AX persona+voice extension + alignment-pass stale-refs

`spec edit`: `docs/01-vision/coscout-ax-design.md`#Persona-+-Voice — distinguishes CoScout's narrator voice (project-wide constant) from role-aware tone adjustments per project-membership role (Lead / Member / Sponsor). `spec edit`: `.claude/skills/agent-context-quickstart/SKILL.md` — fixed stale "6-tab nav" → "7-tab nav (singular Project, Improve as verb tab)".
  Why: Phase 1 (PR #199) cherry-picked the wedge V1 docs onto fresh main but the agent-context-quickstart skill body was authored before the Improve-tab amendment landed; CoScout AX-design's § Persona + Voice didn't differentiate narrator voice from role-aware tone (3 personas affect tone, not analysis). Closes the gap before subagents read stale guidance. Commit: <TBD>. PR: <TBD>. Related: [[coscout-ax-design]], [[2026-05-16-wedge-architecture-design]].
