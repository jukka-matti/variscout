---
title: Process Hub Use Cases - Process-First Operating Context
audience: [product, designer, engineer]
category: design-spec
status: draft
related: [process-hub, azure, portfolio, user-journeys]
date: 2026-04-25
---

# Process Hub Use Cases

## Summary

Process Hub is the durable context for using VariScout around a real process,
production line, queue, lab flow, service workflow, or development value stream.
An investigation is a time-bound inquiry inside that context. A formal
improvement project can exist, especially for GB/BB work, but it is not the
primary organizing object in the MVP.

## User Contexts

| User context                        | Main question                                                                  | MVP behavior                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Process owner / team leader         | What is happening in my process, what is blocked, and what needs verification? | Hub card rollups, active investigations, overdue actions, Next Move snippets |
| Quality or process engineer         | Which investigation am I driving, and what process context does it feed?       | Start/open investigations in a hub, edit metadata, preserve editor workflow  |
| GB/BB / OpEx / development org      | Across several hubs, where is the leverage or charter candidate?               | Multi-hub Azure home with hub rollups and Quick/Focused/Chartered depth      |
| Sponsor / manager                   | What decision, resource, or escalation is needed?                              | Status, owner, sponsor, Problem Condition, and Next Move metadata            |
| Contributor / operator / field user | Where do I add observations, photos, comments, or action updates?              | Existing findings/comments/actions; no new contributor-specific MVP workflow |
| Analyst                             | Which dataset/investigation am I working on, and where should it belong?       | Investigation metadata panel and hub assignment                              |
| Admin / evaluator                   | Does the model fit tenant-owned data and Team storage?                         | IndexedDB for Standard, Blob catalog for Team, no per-hub ACL in MVP         |
| Trainer / PWA learner               | Can the method be taught without organizational persistence?                   | PWA remains investigation-first; shared vocabulary remains compatible        |

## Core Use Cases

- Legacy saved analyses appear under `General / Unassigned` without an eager
  migration or rewrite.
- A user creates a Process Hub for a line, queue, flow, or development process.
- A user starts a Quick, Focused, or Chartered investigation inside a selected
  hub.
- A user scans active investigations by hub, status, depth, overdue actions,
  Current Understanding, Problem Condition, and Next Move.
- A user opens a hub to filter the visible investigations for that process.
- A user opens an investigation and continues the existing VariScout editor
  workflow.
- A user edits hub assignment, status, depth, owner, sponsor, contributors, and
  Next Move inside the editor.

## Deferred Use Cases

- Cross-hub chartered project/program wrappers.
- Per-hub access control or permissions.
- Generic task-board workflows.
- In-product notification rules.
- Full Control Plan Lite. The MVP only exposes handoff/verification signals.
- Live ERP, MES, QMS, CRM, ACD, or workflow-system integration.

## Acceptance Notes

The MVP is successful when Azure users can reason from process context to
investigation detail without losing the existing editor behavior. GB/BB and OpEx
users should be able to work across multiple hubs, while process owners should
still be able to live mostly inside one hub.
