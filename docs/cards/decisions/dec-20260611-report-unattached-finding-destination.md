---
title: 'Report routes unattached findings explicitly'
purpose: decide
tier: card
status: active
date: 2026-06-11
topic: ['decisions', 'report', 'findings', 'explore-redesign']
last-verified: 2026-06-11
supersedes: []
---

> **Decision card** — captures ER-11's Report truthfulness decision for findings captured before they are attached to a suspected cause. Canonical workflow doc: [`report.md`](../../03-features/workflows/report.md). Aggregate view: [`decision-log.md`](../../decision-log.md).

# Report routes unattached findings explicitly

Findings captured without a hypothesis, counter-finding link, or mechanism-goal link still belong in the single-project Report. They are observed evidence, so their destination is **What we found + what we did**, under the explicit label **"Findings not yet attached to a suspected cause."**

The destination is intentionally not a cause row. Cause rows remain governed by PO-5: analyst-owned hypothesis status decides which suspected causes appear as evidenced work. Unattached findings are shown without action-progress or verification claims until the analyst links them to a suspected cause or mechanism goal.

Report section status markers are content-derived. Placeholder-only sections render active/future states, never completed checkmarks. For an empty found/done section, the Report says: "No findings, actions, or suspected causes have been recorded for this report yet."

_Pinned 2026-06-11._
