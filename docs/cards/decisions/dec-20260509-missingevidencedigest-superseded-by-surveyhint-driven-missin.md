---
title: '`MissingEvidenceDigest` superseded by SurveyHint-driven `MissingEvidencePanel` on Wall'
purpose: decide
tier: card
status: active
date: 2026-05-09
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# `MissingEvidenceDigest` superseded by SurveyHint-driven `MissingEvidencePanel` on Wall

Per spec §5 D11 + vision slide 3 ("MISSING EVIDENCE — THE DETECTIVE MOVE NOBODY SHIPS"),
  the Wall hosts a single rule-driven panel surfacing data-collection (cat 2) +
  triangulation-readiness (cat 3) Survey hints. The previous `MissingEvidenceDigest`
  consumed a generic `gaps`/`gapsByHubId` prop pair that was empty in production; both props
  are removed from `WallCanvasProps`. `gapDetector` (FRAME-scope, different surface) is
  untouched. `WallCanvas` computes `surveyHints` internally via `surveyWallRules`; `hasGap` on
  hypothesis cards now derives from the data-collection hint set. Refactored consumers in PWA
  `InvestigationView` + Azure `InvestigationWorkspace` in the same PR per
  `feedback_no_backcompat_clean_architecture`.
  _Logged in PR-RPS-4._
