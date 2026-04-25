---
title: Signal And Branch Components
audience: [designer, developer]
category: reference
status: draft
related: [signal-cards, mechanism-branches, investigation-workspace, coscout, accessibility]
---

# Signal And Branch Components

Component guidance for QDE 2.0 investigation workspaces, Signal Cards, trust
chips, power chips, process-moment strips, and branch cards.

These components must work with and without CoScout.

## Principle

Every component should answer one of three questions:

1. What did we observe?
2. How much can we trust the signal?
3. What should we check next?

If a component does not help answer one of those questions, it does not belong
in the investigation workspace.

## Signal Card

A Signal Card describes whether a measured column or derived signal is fit for
the analysis scope.

Required fields:

| Field                  | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| Signal name            | Human-readable label and source column                    |
| Archetype              | Classical, attribute, timestamp, derived, or manual       |
| Operational definition | What the signal literally means                           |
| Resolution claim       | What time/process/factor granularity it supports          |
| Trust label            | Textual label such as Trust A, Trust B, Trust C           |
| Weak link              | Main reason trust is limited                              |
| Study/reference        | Measurement study, calibration note, op-def, or parent(s) |
| Version/hash           | Audit link used by reports and saved plans                |

Signal Cards are deterministic records. CoScout can explain them, but cannot be
the source of truth.

## Trust Chip

Trust chips quote the Signal Card wherever a signal appears.

Required behavior:

- Always includes text, never color alone.
- Opens the Signal Card on click/tap.
- Has hover/focus tooltip with the short reason.
- Appears on chart headers, factor chips, branch cards, and report rows.
- Persists in exported/audited outputs as label plus Signal Card version.

Example labels:

```text
TRUST A · calibrated gage
TRUST B · shift-resolution timestamp
TRUST C · derived from weak parent
```

## Power Chip

Power chips state whether the current data can support the check being made.

Required behavior:

- Shows plain-language state: `POWER OK`, `UNDER-POWERED`, or `BLIND SPOT`.
- Opens the power detail card.
- Distinguishes "not seen" from "could not have detected."
- Can attach to a branch, clue, process moment, or next move.

Example:

```text
UNDER-POWERED · would miss ΔCpk 0.06
```

## Process-Moment Strip

The Process-Moment Strip shows Cp and Cpk across meaningful process windows.

Required behavior:

- Each segment maps to an authored process moment.
- Each segment shows Cp and Cpk or an insufficient-data label.
- Segment boundaries link back to operational events.
- Average Cp and average Cpk can be shown by stage when moments are comparable.
- Clicking or focusing a segment opens its source window and can create a clue.

Do not show Ppk in this component unless a later capability spec explicitly
reintroduces it.

Accessibility requirement:

- Provide an equivalent table with columns: moment, boundary cause, n, Cp, Cpk,
  stage, trust/power warnings, source action.

## Mechanism Branch Card

The Mechanism Branch Card is the main investigation unit.

Required sections:

```text
Suspected mechanism
Problem condition link
Scope chips
Supporting clues
Counter-clues / disconfirmation
Signal and power warnings
Next move
Comments / owner
```

Allowed actions:

- open source clue
- add clue
- mark as counter-clue
- add next check
- attach Signal Card
- request CoScout explanation when available
- accept/edit/reject CoScout proposal when present

The card must still be fully useful when CoScout is hidden.

Branch warnings are advisory. A card may show weak trust, weak power, missing
counter-checks, or "statistically notable but small effect" prompts, but those
prompts should guide the next move rather than block action.

## Evidence / Clue Chip

Clue chips summarize source and strength.

Examples:

```text
DATA · I-Chart · brushed 9 pts
GEMBA · photo · line 2 23:14
YAMAZUMI · wait 41%
PROCESS FLOW · Station 3 bottleneck
EXPERT · operator note
COUNTER · day shift check
```

Every clue chip needs:

- source type
- short label
- open-source action
- branch attachment state
- screen-reader label that includes whether it supports or challenges the
  branch

## AI Proposal Card

CoScout suggestions must render as proposals, never invisible state changes.

Required controls:

- Accept
- Edit
- Reject
- Why?

Required content:

- proposed action
- evidence or context used
- deterministic checks involved
- affected branch or signal
- confidence language if appropriate

Forbidden behavior:

- auto-creating branches
- auto-confirming mechanisms
- auto-changing Signal Cards
- hiding the manual path
- using `significant` as causal proof

## Component States

All components must support:

- normal
- focused
- selected
- warning
- disabled/unavailable
- loading deterministic calculation
- AI unavailable

AI unavailable is not an error for these components. It should either hide the
AI proposal affordance or replace it with deterministic/manual next actions.

## Reporting

Anything shown as trust, power, branch status, or process-moment capability must
be reportable.

Report rows should include:

- label shown in the UI
- source object ID
- Signal Card version/hash when relevant
- deterministic metric values
- user-authored notes
- CoScout proposal acceptance state when relevant
