---
title: 'Consultation loop — V1 collaboration model'
purpose: decide
tier: card
status: active
date: 2026-06-11
topic: ['collaboration', 'consultation', 'analysis-pack', 'ai', 'evidence', 'expert']
related:
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
supersedes: []
---

> **Decision card** — accepted 2026-06-11. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Consultation loop — V1 collaboration model

V1 collaboration is a closed artifact loop, not a multi-user workspace: **Ask → Share → Respond → Distill → Accept**. The analyst exports a Consultation Pack (selected views + anchored questions with inline answer boxes); it rides existing enterprise rails (Teams/email/SharePoint); the expert answers typed-in-pack (deterministic import) or on a recorded call whose transcript CoScout distills into proposed insights; the analyst explicitly accepts each insight into the investigation with provenance. No recipient accounts; no new security-review surface; the deterministic engine stays the authority and no AI mutates canonical state.

New entities: `Consultation`, `ConsultationQuestion` (anchored to findings/hypotheses/conditions), `ConsultationResponse`, `ProposedInsight` (review queue). V1 non-goals: Graph API auto-fetch, respondent identity, gate-review RACI routing (named next horizon), any server component in the pack.

Canonical artifact: [consultation-loop spec](superpowers/specs/2026-06-11-consultation-loop-design.md).
