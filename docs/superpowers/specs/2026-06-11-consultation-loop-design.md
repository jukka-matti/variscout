---
tier: ephemeral
purpose: design
title: 'Consultation loop — data-anchored expert consultation via Analysis Packs'
audience: human
category: design-spec
status: active
date: 2026-06-11
last-verified: 2026-06-14
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
3. **Respond.** Two modes: the expert **fills the pack's Markdown response
   template** (in any editor or email reply — no executable content; see the
   "JS-into-orgs constraint" note below) and sends it back, or the analyst
   walks the expert through the pack on a **recorded Teams call** and the
   expert's tribal knowledge comes out in their natural medium — conversation.
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
[export.md](../../03-features/data/export.md)).

> **Build-state reconciliation (2026-06-14).** Grounding confirmed there is
> **no standalone-HTML pack renderer in the codebase yet** — #387 shipped the
> `.vrs` JSON export plus the build-time paid/free alias gate
> (`@pwa-artifacts` → `paid/freeArtifacts.ts`, `__WORKSPACE_ARTIFACTS__`), not
> the Analysis-Pack HTML family. The Consultation Pack is therefore built on a
> **net-new, reusable pack-renderer spine** (chart→inline-SVG, redaction
> levels, print CSS), with Consultation as the only concrete variant shipped
> in this arc. The other pack variants (Executive/Technical/…) become trivial
> follow-ons on the same spine.

> **JS-into-orgs constraint (decided 2026-06-14).** Corporate mail gateways
> and SharePoint/Teams previews routinely strip `.html` attachments, block
> executable content, or render HTML inert (no JS execution in preview). The
> loop must not depend on the recipient's browser running our script.
> Therefore **viewing and answering are decoupled**: the pack is **script-free
> static HTML** for viewing, and answering runs through an **editable Markdown
> response template** the expert fills in any editor (or email reply) and
> returns. No in-page "download" button is required for the critical path.

- **Script-free static HTML**; selected charts/conditions rendered as inline
  SVG; **each question shown in context** with its stable question ID and an
  answer area. The page renders, previews, and prints anywhere with **zero
  `<script>` tags** and **no network calls, ever**.
- **Markdown response template** ships with the pack (embedded as a
  copy-paste block _and_ offered as a companion `.md` download at export
  time). Each question is a section anchored by its stable question ID; the
  expert types answers under each anchor. Returnable by mail/Teams/SharePoint
  as a plain text/Markdown file — no executable content in either direction.
- Redaction options inherited from the pack design (raw rows excluded unless
  deliberately included).
- Pack ID ↔ Consultation ID keeps the round trip exact; question IDs are
  stable across export/import; the importer is **edit-tolerant** and
  schema-validates (the file will have been hand-edited).

## Import side — two return modes, one review queue

- **Typed/Markdown mode** (deterministic, no AI) — **the V1 critical path.**
  Import the filled Markdown template (or an equivalent `.json` response
  file) → answers map to question IDs by anchor → `ProposedInsight`s → review
  queue. This path works with **no AI provider configured**, which matters
  because CoScout is `ai: false` in every channel today (BYOK/tenant wiring is
  named-future); the deterministic path is the only return mode that
  functions in V1 at ship time.
- **Talk-track mode** (CoScout, customer-tenant AI) — **built but
  provider-gated; sequenced last.** Import a transcript (`.vtt` / `.docx` /
  pasted text — acquired manually from Teams/SharePoint) → a one-shot CoScout
  structured-output call distills `ProposedInsight`s mapped to questions → the
  same review queue. Dormant (no-op) until a provider key exists; testable via
  a mock provider config.
- Review queue UX: per-insight accept / reject / edit, with the anchored
  entity visible (see wireframes below).
- Provider boundary respected: with provider `none` there is no distillation;
  a pre-distilled response file produced by the customer's own tooling
  imports through the deterministic path (this is the future `mcp-agent` /
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

## V1 build design (decided 2026-06-14)

This section makes the spec build-ready: it records the entity shapes, the
render architecture, the UX homes, and the slice plan, grounded against the
current codebase.

### Entity shapes & home

New module `packages/core/src/consultations/` (kept separate from
`findings/` to avoid bloating that module; it references Finding/Hypothesis/
scope IDs). A `Consultation` **owns** its questions, responses, and proposed
insights — "one consultation = one pack family" (V1 non-goal: no multi-pack
threads), so a single nested aggregate keeps the store and serialization
trivial.

```ts
interface Consultation {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'responses-imported' | 'closed';
  createdAt: number;
  updatedAt: number;
  viewSelection: ConsultationViewRef[]; // conditions/charts shown in the pack
  questions: ConsultationQuestion[];
  responses: ConsultationResponse[]; // one per import event
  proposedInsights: ProposedInsight[]; // review queue, across responses
}

interface ConsultationQuestion {
  id: string; // stable across export/import
  text: string;
  anchor?: { kind: 'finding' | 'hypothesis' | 'scope'; id: string };
  status: 'open' | 'answered';
}

interface ConsultationResponse {
  id: string;
  source: 'typed' | 'transcript';
  respondentLabel: string; // free text — no identity mgmt (V1)
  importedAt: number;
  rawArtifactRef?: string; // filename/hash of the imported file
}

interface ProposedInsight {
  id: string;
  responseId: string;
  questionId?: string; // unanchored allowed
  text: string;
  kind: 'answer' | 'context' | 'new-hypothesis-proposal' | 'contradiction';
  status: 'pending' | 'accepted' | 'rejected';
  acceptedAs?: { kind: 'finding' | 'hypothesis'; id: string };
}
```

- **Store:** one new `consultations: Consultation[]` collection on
  `useAnalyzeStore` (Document layer, `packages/stores/src/analyzeStore.ts`),
  with actions `createConsultation`, `addQuestion`, `markSent`,
  `importResponse`, `acceptInsight`, `rejectInsight`, `editInsight`.
- **Serialization:** add `consultations` to `AnalyzeDocumentSnapshot`
  (`packages/stores/src/documentSnapshot.ts`) → it rides the existing `.vrs`
  round trip and snapshot validation for free.
- **Accept = expert evidence.** Accepting a `ProposedInsight` creates an
  `evidenceType: 'expert'` Finding (existing union, `findings/types.ts:461`)
  carrying provenance via a **new optional `Finding.provenance` field**
  `{ kind: 'consultation'; consultationId; responseId; questionId?; respondentLabel; importedAt }`,
  and — when anchored to a hypothesis — links into `hypothesis.findingIds`.
  **Note (grounding correction 2026-06-14):** provenance is a _new field_, not
  a `FindingSource` variant — `FindingSource` is documented chart-observation-
  only (`packages/core/CLAUDE.md`; `findings/types.ts:506`), so a consultation
  origin must not be forced into it. This reuses the existing evidence model
  (the `DisconfirmationAttempt` `verdict` + `attemptedBy/attemptedAt` shape is
  the provenance pattern reference) rather than inventing a parallel one.
  **Nothing enters the stats engine** (qualitative evidence only); **no
  canonical state mutates without an explicit accept.**

### Render architecture — the pack-renderer spine

A pure render function with no DOM/runtime dependency:

```
renderPackHtml(model: PackModel, options: { redaction: RedactionLevel }) => string
```

- Implemented with `renderToStaticMarkup` over a pack React tree (lets the
  Consultation pack reuse our chart components for the heavy visual parts).
- visx charts are SVG-native → they serialize to **inline SVG at a fixed
  size** (the static render bypasses `withResponsiveSize`/ResizeObserver by
  passing explicit width/height).
- Output is a **single self-contained HTML string**: inline `<style>` (incl. a
  print stylesheet), inline SVG charts, embedded `{packId, consultationId,
questions[]}` as `<script type="application/json">` (data, not executable),
  and the Markdown response template as a copy-paste `<pre>` block. **No
  `<script>` with executable JS; no external URLs.**
- Lives in `packages/core/src/packs/` (engine, framework-agnostic render) with
  the export trigger wired through `apps/pwa/src/artifacts/paidArtifacts.ts`
  behind `__WORKSPACE_ARTIFACTS__`; the free stub throws (matches existing
  `exportVrs` gating).

### UX homes

- **Ask** (Analyze/Explore): a contextual "Ask an expert about this" action on
  a Finding / Hypothesis / condition seeds a `ConsultationQuestion` with the
  anchor pre-filled. A **Consultation builder** panel collects the draft
  consultation (title, selected views, questions) and triggers pack export
  (which flips status `draft → sent`).
- **Respond/Distill**: an **Import** action (Home/Report) ingests the filled
  Markdown template / `.json` (deterministic) or a transcript (CoScout) →
  creates a `ConsultationResponse` + `ProposedInsight`s → status
  `sent → responses-imported`.
- **Accept**: a **review-queue panel in the Analyze tab**, mirroring
  `FindingsPanel`/`FindingsWindow`, shows pending insights with the anchored
  entity visible; per-insight accept / reject / edit.

### Wireframes

**Consultation Pack (script-free HTML, recipient view):**

```
┌────────────────────────────────────────────────────────────┐
│  Consultation · "Why does Line 3 drift on Mondays?"          │
│  From: <analyst>   ·   Pack ID: c-8f2a   ·   3 questions      │
├────────────────────────────────────────────────────────────┤
│  What I'm seeing                                             │
│  ┌────────────── I-Chart (inline SVG) ──────────────┐        │
│  │   ·····•·····•·· (rendered, static)               │        │
│  └───────────────────────────────────────────────────┘      │
│  Condition: Day_of_Week = Monday   (Cpk 0.77 · 12 events)    │
├────────────────────────────────────────────────────────────┤
│  Q1  [anchored: Hypothesis "warm-up variation"]              │
│  "Does the Monday startup differ from other days?"           │
│  Your answer:  ____________________________________          │
│                                                              │
│  Q2 …                                                        │
├────────────────────────────────────────────────────────────┤
│  ▸ How to respond                                            │
│  Copy the template below into a reply / text file, fill in   │
│  your answers under each question, and send it back.         │
│  ┌── response template (copy this) ───────────────────┐      │
│  │ ## Consultation c-8f2a — responses                 │      │
│  │ respondent: <your name>                            │      │
│  │ ### Q1 [id: q-1]                                   │      │
│  │ > (type your answer here)                          │      │
│  │ ### Q2 [id: q-2]                                   │      │
│  │ > (type your answer here)                          │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

**Review queue (Analyze tab, analyst view):**

```
┌─ Consultation review · "Line 3 Monday drift" ── responses: 1 ─┐
│  Respondent: J. Operator · imported 2026-06-14                │
├───────────────────────────────────────────────────────────────┤
│  ▸ Proposed insight  → Q1 (Hypothesis "warm-up variation")    │
│    "Monday first hour runs cold; oven not pre-heated over     │
│     the weekend."           [ kind: answer ]                  │
│    anchored to: ◰ warm-up variation                           │
│    [ Accept as expert evidence ] [ Edit ] [ Reject ]          │
├───────────────────────────────────────────────────────────────┤
│  ▸ Proposed insight  (unanchored)                             │
│    "Different operator on Mondays."  [ kind: new-hypothesis ] │
│    [ Accept as draft hypothesis ] [ Edit ] [ Reject ]         │
└───────────────────────────────────────────────────────────────┘
```

### Slice plan (multi-PR off one branch; ~6–8 tasks each)

1. **CL-1 — Domain + store + serialization.** `consultations/` types +
   factories + `FindingSource` `'consultation'` variant; `consultations[]` on
   `useAnalyzeStore` + actions; wire into `AnalyzeDocumentSnapshot`. Tests:
   `.vrs` round trip; accept → expert Finding w/ provenance; no canonical
   mutation without accept.
2. **CL-2 — Pack-renderer spine.** `renderPackHtml` (static, no-JS, inline
   SVG, redaction, print CSS). Tests: no `<script>` in output; no external
   URLs; charts present as inline SVG; raw rows absent unless chosen.
3. **CL-3 — Consultation variant + MD template + export gate.** Build a
   `PackModel` from a `Consultation`; render question cards + embedded MD
   template; companion `.md` download; wire export behind `@pwa-artifacts` /
   `__WORKSPACE_ARTIFACTS__` (free stub throws). Tests: question IDs stable;
   template anchors == question IDs; excluded from free build.
4. **CL-4 — Deterministic import + review queue.** Edit-tolerant parser
   (Markdown template + `.json`) → `ConsultationResponse` + `ProposedInsight`s;
   review-queue panel in Analyze (accept/reject/edit, anchored entity visible);
   accept → expert Finding. Tests: malformed → readable error; transitions;
   provenance stamped.
5. **CL-5 — Ask entry + consultation builder.** Contextual "Ask an expert"
   anchored action; builder panel; lifecycle wiring
   (draft→sent→responses-imported→closed). Tests + chrome verify of the round
   trip.
6. **CL-6 (last, AI-gated) — Transcript distillation.** `distillTranscriptToInsights`
   one-shot CoScout structured-output call (json_schema) → same review queue;
   no-op when provider `none`; mock-provider tests. Note dormant until
   BYOK/tenant wiring lands.

## Testing expectations

- Round-trip integrity: question IDs stable export→import; schema-validated
  response files; malformed/edited files rejected with a readable error.
- Inclusion/exclusion rules per pack level (raw rows absent unless chosen).
- Distillation output is **proposals only**: a test must prove no
  `ProposedInsight` mutates canonical state without an explicit accept.
- Provenance: accepted insights carry respondent label + consultation ID +
  import timestamp.

## Sequencing

**Active as of 2026-06-14.** The prior queue (ER-5b/ER-6 closeout, D4 app
convergence) is delivered; demo-readiness is retired as a gate. The
consultation loop is the **next arc** and is now in execution: brainstorm/
scope confirmed → this spec amended → implementation plan
([`2026-06-14-consultation-loop.md`](../plans/2026-06-14-consultation-loop.md))
→ subagent-driven build per the CL-1…CL-6 slices above (one worktree per PR,
adversarial review per slice). Within the arc, the **deterministic path ships
first** (it is the only functional return mode at V1 ship time); transcript
distillation (CL-6) is built last and stays provider-gated.
