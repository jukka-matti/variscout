---
tier: ephemeral
purpose: design
title: 'Consultation loop — data-anchored expert consultation via Analysis Packs'
audience: human
category: design-spec
status: active
date: 2026-06-11
last-verified: 2026-06-11
related:
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
  - docs/superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md
  - docs/03-features/data/export.md
layer: spec
implements:
  - docs/01-vision/product-overview.md
  - docs/01-vision/positioning.md
---

# Consultation loop — data-anchored expert consultation via Analysis Packs

> **Accepted design — 2026-06-11.** This spec defines V1's collaboration
> model: a closed loop where the analyst sends a question-carrying Analysis
> Pack out over existing enterprise rails and expert knowledge comes back as
> structured, analyst-accepted evidence. It completes the artifact-first
> collaboration model of [ADR-092](../../07-decisions/adr-092-local-first-variscout-product-model.md);
> live project membership is deleted per [ADR-093](../../07-decisions/adr-093-v1-simplification-cuts.md).

## Summary

The loop: **Ask → Share → Respond → Distill → Accept.**

1. **Ask.** The analyst finds something in the data and exports a
   **Consultation Pack**: a standalone HTML artifact presenting exactly the
   right views (conditions, charts) plus explicit questions — "here's what I
   see; what do you think?"
2. **Share.** The pack travels via Teams/email/SharePoint — rails the
   organization already approved. The expert opens it locally. No VariScout
   account, no login, no procurement involvement.
3. **Respond.** Two modes: the expert **types answers inline** in the pack
   and sends back a small response file, or the analyst walks the expert
   through the pack on a **recorded Teams call** and the expert's tribal
   knowledge comes out in their natural medium — conversation.
4. **Distill.** The response file imports deterministically; a transcript
   imports through CoScout (customer-tenant AI), which maps commentary to
   the questions and extracts mechanisms, contradictions, and proposed
   hypotheses.
5. **Accept.** Every distilled insight lands in a review queue. The analyst —
   never the AI — accepts or rejects each one into the investigation, with
   provenance.

Why this is the collaboration model: it solves collaboration without
multi-user software. The return path also avoids the tool — the recording
and transcript live in the customer's own Teams/SharePoint under existing
compliance. Nothing new for the vendor security review. And it is the durable
AI position: as chart-making commoditizes, the moat is the structured
investigation loop plus a protocol for converting human process knowledge
into linked evidence. **VariScout computes; humans contribute knowledge; AI
distills conversation into structure; the analyst decides.**

A named future stage (not V1 build): **gate reviews as routing events** —
for a tollgate or team meeting, each Consulted/Informed person receives the
audience-appropriate pack beforehand.

## Domain model

New first-class entity in the per-project document layer:

### `Consultation`

- Selected views/conditions (what the recipient sees) + authored questions.
- Lifecycle: `draft → sent → responses-imported → closed`.
- The natural object for future gate-review routing.

### `ConsultationQuestion`

- Question text + **optional anchor** to a Finding, Hypothesis, or condition
  (Analysis Scope). Anchors make the round trip mappable.
- Status: `open / answered`.

### `ConsultationResponse`

- One import event: source (`typed` | `transcript`), respondent label
  (free text — **no identity management in V1**), import timestamp, raw
  artifact reference.

### `ProposedInsight`

- The distilled unit: maps to a `questionId` (or arrives unanchored), typed
  as `answer / context / new-hypothesis-proposal / contradiction`.
- Sits in a review queue until the analyst **accepts** (it becomes hypothesis
  evidence, finding context, or a draft hypothesis — carrying provenance:
  who, when, which consultation) or **rejects**.

### Invariants preserved

- Insights are **qualitative evidence only** — nothing enters the stats
  engine. The deterministic engine remains the sole authority on numbers.
- Analyst-owned status everywhere; no AI-written state without explicit
  accept ("tool assists, analyst decides").
- "Suspected cause" language throughout — never "root cause."
- Expert knowledge maps to the existing three evidence types: this is the
  productized **expert** evidence channel (data / gemba / expert).

## Export side — the Consultation Pack

A member of the Analysis Pack family (see
[export.md](../../03-features/data/export.md)):

- Standalone interactive HTML; selected charts/conditions rendered; **each
  question shown in context with an answer box**.
- Redaction options inherited from the pack design (raw rows excluded unless
  deliberately included).
- A **"Download my responses"** button produces a small response file
  (`.json` + a human-readable `.md`) the expert returns by mail/Teams.
- Pack ID ↔ Consultation ID keeps the round trip exact; question IDs are
  stable across export/import; the importer validates the response schema
  (the file may have been edited).
- **No network calls from the pack, ever.**

## Import side — two return modes, one review queue

- **Typed mode** (deterministic, no AI): import the response file → answers
  map exactly to question IDs → review queue.
- **Talk-track mode** (CoScout, customer-tenant AI): import a transcript
  (`.vtt` / `.docx` / pasted text — acquired manually from Teams/SharePoint)
  → CoScout distills into `ProposedInsight`s mapped to questions → the same
  review queue.
- Review queue UX: per-insight accept / reject / edit, with the anchored
  entity visible.
- Provider boundary respected: with provider `none` there is no distillation;
  a pre-distilled response file produced by the customer's own tooling
  imports through the typed path (this is the future `mcp-agent` /
  `local-llm` slot).

## Free/paid boundary

Per ADR-093 D5, the whole loop is **paid-only**: pack export is excluded from
the free deployment at build time. Both paid channels carry it — transcript
distillation runs on the individual tier's BYOK key (direct browser→provider)
or the company tier's tenant AI endpoint. This is the natural gate — the
differentiating workflow is the paid product.

## V1 non-goals

- No Graph API auto-fetch of recordings/transcripts (manual acquisition;
  revisit post-traction).
- No respondent identity/accounts; respondent is a text label.
- No gate-review RACI routing engine (named next horizon; one sentence in
  the vision, no build).
- No live comments, presence, or any server component in or behind the pack.
- No multi-pack consultation threads; one consultation = one pack family.

## Testing expectations

- Round-trip integrity: question IDs stable export→import; schema-validated
  response files; malformed/edited files rejected with a readable error.
- Inclusion/exclusion rules per pack level (raw rows absent unless chosen).
- Distillation output is **proposals only**: a test must prove no
  `ProposedInsight` mutates canonical state without an explicit accept.
- Provenance: accepted insights carry respondent label + consultation ID +
  import timestamp.

## Sequencing

Implementation planning happens after the active queue (ER-5b/ER-6 closeout,
demo-readiness) — separate call. The Consultation entity design should be
known to Report/pack implementation work so nothing is built that blocks it.
