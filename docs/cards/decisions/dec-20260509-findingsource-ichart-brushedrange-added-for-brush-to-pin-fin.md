---
title: '`FindingSource.ichart.brushedRange` added for brush-to-pin findings'
purpose: decide
tier: card
status: active
date: 2026-05-09
topic: ['decisions', 'wall', 'chart']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# `FindingSource.ichart.brushedRange` added for brush-to-pin findings

Optional field on the `ichart` FindingSource variant (`packages/core/src/findings/types.ts`)
  preserves the brushed `{ startIdx, endIdx }` index range when an analyst pins a Finding from
  a mini-chart drag gesture. Migration (`packages/core/src/findings/migration.ts`) preserves
  the field across schema migrations when present and well-formed. Existing `ichart` consumers
  (`anchorX`/`anchorY`/`timeLens`) ignore the optional field and continue to function unchanged.
  _Logged in PR-RPS-4 (Wall Detective-pack: brush-to-pin gesture + missing-evidence panel)._
