---
title: Agent Review Log Profile - Safe Green Throughput in Process Hub
audience: [product, engineer, quality-manager]
category: design-spec
status: draft
related:
  [
    process-hub,
    evidence-sources,
    question-driven-eda-2,
    data-profile,
    ai-quality,
    safe-green-throughput,
    customer-owned-data,
  ]
date: 2026-04-26
---

# Agent Review Log Profile

## Summary

External AI agents are becoming steps inside real business and production
processes. VariScout should not become an agent runtime, eval dashboard, or
monitoring platform. It should let a Process Hub owner improve the
agent-assisted process by treating the agent review log as an **Evidence
Source** and applying this Data Profile to each Snapshot.

The target is **safe green throughput**:

```text
Increase the share of green pass-through decisions
while keeping false-green decisions below an agreed tolerance.
```

The agent can live in Azure AI Foundry or another customer-owned platform.
Foundry or the customer's AI stack owns runtime traces, eval execution, and
agent deployment. VariScout owns the improvement question: which inputs,
process conditions, policy versions, prompts, tools, or local contexts prevent
cases from becoming safely green?

## Why This Belongs In Process Hub

Agent review quality is a process-owner problem, not only an AI-team problem.
The same Process Hub questions apply:

- What is happening to this process right now?
- Which cases flow through without review, and are those decisions safe?
- Where does review burden concentrate?
- Which team owns input quality, policy clarity, prompt/tool fixes, or local
  workflow changes?
- Which improvement is waiting for verification data?

The external agent is one step in the process. The Process Hub remains the
organizational home for the investigation, actions, verification, and control
handoff.

## Metric Model

Agent logs usually expose green, yellow, and red decisions:

| Signal     | Meaning in this profile                                    |
| ---------- | ---------------------------------------------------------- |
| Green      | Agent says the case can pass through or proceed normally   |
| Yellow     | Agent asks for human review, caution, or extra information |
| Red        | Agent blocks, escalates, or flags high risk                |
| Confidence | Agent-provided score or band, when available               |

The first quality question is whether green decisions are correct. The
improvement target comes after that.

| Metric                      | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| Green pass-through share    | Primary improvement Y: green cases / all cases                         |
| Audited green correctness   | Safety proof from sampled green audits                                 |
| False-green rate            | Guardrail: green cases later judged wrong, unsafe, or requiring rework |
| Yellow/red review burden    | Supporting workload metric                                             |
| Downstream negative outcome | Lagging evidence: complaint, reversal, defect, incident, or rework     |

VariScout should not reward green inflation. A higher green share is only an
improvement when green correctness stays above the customer's threshold and
false-green rate stays below tolerance.

## Evidence Source And Data Profile

This is the first concrete **Data Profile** behind a Process Hub Evidence
Source. It is not a new analysis mode. The user-facing source might be named
"Agent review log" or "Claims triage agent review export." The profile should
normalize each Snapshot into columns that existing Standard analysis, staged
comparison, Factor Intelligence, Findings, QDE 2.0, and Process Hub can use.

Typical source columns:

- `flagColor` or equivalent green/yellow/red decision
- confidence score or confidence band
- human audit result for sampled green cases
- human review result for yellow/red cases
- downstream outcome signal, when available
- case type, process step, product/service family, customer/supplier segment
- input completeness or input quality fields
- site, team, queue, or local process context
- agent name, model deployment, prompt version, tool version, policy version
- timestamp and optional reviewer/owner fields

Profile-derived columns should be deterministic and auditable. The exact
TypeScript names can be decided during implementation, but the responsibilities
are fixed:

- derive a binary green pass-through indicator
- derive a binary non-green review-burden indicator
- derive false-green indicators only when audit or downstream evidence exists
- derive confidence bands from numeric confidence when useful
- preserve source columns so the analyst can inspect and correct mappings

Each Snapshot should retain its Profile Application: the profile version,
confirmed mapping, derived columns, validation results, and any user correction
needed to make the import auditable.

## Workflow Integration

### Setup

The existing upload, paste, Excel, and manual-entry paths remain the entry
points until Process Hub Evidence Sources are implemented. Column Mapping
detects likely agent-review fields and recommends:

- green pass-through as the primary Y
- false-green rate as a guardrail when audit or downstream evidence exists
- yellow/red review burden as a supporting outcome
- case, input, site/process, confidence, and version columns as factors

If no green audit or downstream outcome field exists, the product should not
call green pass-through "safe." The next move should be to plan sampled green
audits or connect a lagging outcome signal.

In the Process Hub workflow, setup begins from the Evidence Source: what
recurring review log will this hub use, what requirement or tolerance does it
support, and which Snapshot should feed the next cadence review?

### FRAME

FRAME anchors the agent step inside the real process map. The agent step can be
a process node, and upstream input-quality columns can become tributaries or
factor candidates.

### SCOUT

Existing instruments answer the first questions:

- I-chart: green share, false-green rate, or review burden over time
- Pareto: yellow/red reasons, false-green reasons, or downstream outcome types
- Boxplot / Factor Intelligence: which factors explain green share or
  false-green concentration
- Staged comparison: before/after prompt, input, policy, workflow, or tool
  changes

### INVESTIGATE

QDE 2.0 mechanism branches should use plain process language:

- "Missing supplier certificate fields drive yellow reviews."
- "Policy version B creates unsafe greens for export-control cases."
- "Low confidence is concentrated in Site 3 because attachments are incomplete."
- "Red flags are appropriate for high-risk cases, but too many low-risk cases
  are routed red because the input form is ambiguous."

### IMPROVE / VERIFY

Improvement actions can target input forms, upstream data quality, policy
definitions, prompt/tool configuration, routing rules, training data, or local
work standards. Verification uses staged comparison:

```text
Before -> after change
green pass-through share increases
audited green correctness stays above threshold
false-green rate does not increase
yellow/red burden decreases where intended
```

## Current UI Fit

The current Azure app is still project/investigation-first until Process Hub
product code lands. This profile should still be designed for Process Hub.

Current surfaces already map cleanly:

- `EditorEmptyState`, Paste, file upload, and manual entry load the log.
- `ColumnMapping` recommends outcome, factor, and derived profile columns.
- FRAME's process map places the agent step in the process.
- Analysis dashboard and Process Intelligence panel run existing charts and
  Factor Intelligence.
- Investigation workspace creates questions, clues, hubs, comments, and next
  moves.
- Improvement workspace owns ideas, actions, and staged verification.
- Report view documents the evidence chain.

When implemented before Process Hub, the profile metadata should persist with
the project so it can later migrate into an Evidence Source without remapping.

## Global And Local Ownership

Do not build an enterprise ownership hierarchy for v1. Big-company global/local
ownership is real, but it should start as metadata and templates:

- process family
- site or local process
- agent name
- policy/prompt/tool/model version
- metric definitions and audit threshold

This lets a future global owner compare hubs that use the same profile without
turning VariScout into Celonis-style process mining or enterprise process
governance infrastructure.

## Architecture Direction

The profile reinforces a broader architecture rule:

```text
Normalize early into a common analysis shape.
Keep transforms deterministic and inspectable.
Use analysis modes as instrument sets, not product silos.
```

Do not add `agent-review` to `AnalysisMode` in the first implementation.
Instead, add a clear data-profile boundary beside existing detection and
transform patterns for wide-form, defect, Yamazumi, and future profiles.

State should follow the current architecture:

- domain Zustand stores remain the source of truth
- profile metadata belongs in project/process context, not UI-only state
- no DataContext reintroduction
- source systems remain systems of record
- customer-owned data boundaries still apply

## Non-Goals

- No live agent runtime integration in v1.
- No automatic connection to Azure AI Foundry traces in v1.
- No agent eval dashboard, model registry, or monitoring product.
- No live monitoring surface for agent decisions.
- No automatic threshold tuning.
- No claim that green decisions are safe without audit or downstream evidence.
- No global/local ownership hierarchy or cross-site rollup in v1.

## Acceptance Scenarios

1. A process owner imports an agent review log and VariScout detects the Agent
   Review Log profile behind the hub's Evidence Source.
2. Column Mapping recommends green pass-through share as the improvement Y and
   false-green rate as a guardrail when audit data exists.
3. The team verifies green correctness from sampled green audits and sees that
   downstream outcomes are lagging supporting evidence.
4. SCOUT identifies that missing input fields, case type, site, or policy
   version explains yellow/red review burden or false-green concentration.
5. INVESTIGATE creates a mechanism branch with a next move, such as improving
   upstream input quality or checking a policy version.
6. IMPROVE verifies that a change increased green pass-through share without
   increasing false greens.
7. Process Hub shows the investigation owner, AI/platform contributors, open
   actions, verification waiting, and control handoff.
