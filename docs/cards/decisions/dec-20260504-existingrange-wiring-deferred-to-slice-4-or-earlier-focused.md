---
title: '`existingRange` wiring deferred to slice 4 (or earlier focused follow-up)'
purpose: decide
tier: card
status: active
date: 2026-05-04
topic: ['decisions', 'wedge', 'azure', 'adr']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# `existingRange` wiring deferred to slice 4 (or earlier focused follow-up)

The `overlap` temporal-axis case in the match-summary card correctly archives existing overlap rows via `archiveReplacedRows` (tagging them `__replacedBy:<importId>`) when the user clicks "Replace overlap." The merge logic is correct and unit-tested. However, the trigger condition (`existingRange` present in `ClassifyPasteContext`) is currently always `undefined` because neither paste wedge — Azure's `useEditorDataFlow` nor PWA's `usePasteImportFlow` — yet reads `rowTimestampRange` from the active Hub's most-recent `EvidenceSnapshot` and passes it into `classifyPaste`. As a result, the overlap-replace UI action is reachable only via deliberate fixture construction, never from real user paste flow. **Decision: merge slice 3 as-is; wire `existingRange` in slice 4 (or a focused follow-up PR before slice 4 if bandwidth allows).** The wiring is straightforward — read `hub.evidenceSnapshots.at(-1)?.rowTimestampRange` in each wedge and forward it as `existingRange` in the `ClassifyPasteContext`. Source: ADR-077; `packages/core/src/matchSummary/classifier.ts`; `apps/azure/src/features/data-flow/useEditorDataFlow.ts`; `apps/pwa/src/hooks/usePasteImportFlow.ts`. _Pinned 2026-05-04._ **[RESOLVED 2026-05-04 — see 2026-05-04 close-out entry above]**
