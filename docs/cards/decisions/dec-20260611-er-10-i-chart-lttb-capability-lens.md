---
title: 'ER-10 makes I-Chart LTTB live and shares the Cpk trajectory lens'
purpose: decide
tier: card
status: active
date: 2026-06-11
topic: ['decisions', 'explore', 'i-chart', 'capability', 'control']
verified-against-commit: pending-er-10
last-verified: 2026-06-11
supersedes: []
---

> **Decision card** — append-only source for `docs/decision-log.md` regeneration.

# ER-10 makes I-Chart LTTB live and shares the Cpk trajectory lens

ER-10 corrects ADR-039's stale "implemented" claim: LTTB existed in core/hooks but was not activated by the live Explore or Azure report I-Chart call sites. The new contract computes Nelson Rule 2/3 signals on the full series before decimation, then force-includes control-limit violations, spec violations, Nelson signal points, and condition members through LTTB. Decimated chart rendering keys signals by `originalIndex` and point flags rather than rendered array index. The legacy "Cpk stability" no-op is replaced with a gated **Capability over time** I-Chart identity that stays inside the four-slot Explore dashboard contract and shares the Cpk trajectory chart grammar with Control / production-line glance.
