---
title: 'Design Specs (superpowers)'
---

# Design Specs (superpowers)

Implementation design specs created during brainstorming sessions.
These capture the detailed design thinking behind major features.
Once a feature stabilizes, the ADR is the canonical reference.

## Status Matrix

| Spec                                                                                                                   | Feature                                                 | ADR     | Status   |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------- | -------- |
| [2026-03-18-methodology-coach-design.md](../../archive/2026-03-18-methodology-coach-design.md)                         | Methodology Coach (removed)                             | —       | Archived |
| [2026-03-17-navigation-architecture-design.md](2026-03-17-navigation-architecture-design.md)                           | Navigation Architecture                                 | —       | Draft    |
| [2026-03-17-navigation-audit.md](2026-03-17-navigation-audit.md)                                                       | Navigation Audit                                        | —       | Active   |
| [2026-03-17-documentation-methodology-upgrade-design.md](2026-03-17-documentation-methodology-upgrade-design.md)       | Documentation Upgrade                                   | —       | Active   |
| [2026-03-17-platform-opportunities.md](2026-03-17-platform-opportunities.md)                                           | Platform Opportunities                                  | —       | Active   |
| [2026-03-17-teams-compliance-audit.md](2026-03-17-teams-compliance-audit.md)                                           | Teams Compliance                                        | —       | Active   |
| [2026-03-19-ai-action-tools-design.md](2026-03-19-ai-action-tools-design.md)                                           | AI Action Tools for CoScout                             | ADR-029 | Active   |
| [2026-03-19-improve-phase-ux-design.md](../../archive/specs/2026-03-19-improve-phase-ux-design.md)                     | IMPROVE Phase UX Design                                 | —       | Archived |
| [2026-03-19-admin-experience-design.md](../../archive/specs/2026-03-19-admin-experience-design.md)                     | Admin Hub & Diagnostics                                 | —       | Archived |
| [2026-03-19-knowledge-base-folder-search-design.md](2026-03-19-knowledge-base-folder-search-design.md)                 | KB Folder Selection & Permissions                       | ADR-026 | Active   |
| [2026-03-16-ai-integration-evaluation.md](2026-03-16-ai-integration-evaluation.md)                                     | AI Integration Evaluation                               | ADR-019 | Active   |
| [2026-03-16-code-review-design.md](2026-03-16-code-review-design.md)                                                   | Code Review Process                                     | —       | Active   |
| [2026-03-20-reporting-workspaces-design.md](2026-03-20-reporting-workspaces-design.md)                                 | Reporting Workspaces                                    | ADR-037 | Active   |
| [2026-03-21-mobile-performance-design.md](../../archive/specs/2026-03-21-mobile-performance-design.md)                 | Mobile Performance                                      | ADR-039 | Archived |
| [2026-03-22-project-dashboard-design.md](../../archive/specs/2026-03-22-project-dashboard-design.md)                   | Project Dashboard + CoScout Nav                         | ADR-042 | Archived |
| [2026-03-22-teams-entry-experience-design.md](2026-03-22-teams-entry-experience-design.md)                             | Teams Entry Experience Redesign                         | —       | Draft    |
| [2026-03-24-coscout-context-and-memory-design.md](../../archive/specs/2026-03-24-coscout-context-and-memory-design.md) | CoScout Context & Memory (superseded)                   | ADR-049 | Archived |
| [2026-03-24-coscout-knowledge-catalyst-design.md](2026-03-24-coscout-knowledge-catalyst-design.md)                     | CoScout Knowledge Catalyst                              | ADR-049 | Draft    |
| [2026-03-27-capability-modal-redesign.md](../../archive/specs/2026-03-27-capability-modal-redesign.md)                 | Capability Suggestion Modal Redesign                    | —       | Archived |
| [2026-03-28-dashboard-chrome-redesign.md](2026-03-28-dashboard-chrome-redesign.md)                                     | Dashboard Chrome Redesign (header/toolbar/stats/panels) | —       | Draft    |
| [2026-03-28-process-intelligence-panel-design.md](2026-03-28-process-intelligence-panel-design.md)                     | Process Intelligence Panel (sidebar target discovery)   | —       | Design   |
| [2026-03-28-benchmark-findings-scope-design.md](../../archive/specs/2026-03-28-benchmark-findings-scope-design.md)     | Benchmark Findings + Project Scope (Phase 3)            | —       | Archived |
| [2026-03-30-holistic-evaluation-vqi.md](2026-03-30-holistic-evaluation-vqi.md)                                         | Holistic Evaluation: VQI Framework + Maturity Model     | —       | Active   |
| [scouting-report-design.md](../../archive/specs/scouting-report-design.md)                                             | Report View (superseded)                                | ADR-024 | Archived |
| [report-verification-upgrade-design.md](../../archive/specs/report-verification-upgrade-design.md)                     | Staged Verification                                     | ADR-023 | Archived |
| [hypothesis-investigation-design.md](../../archive/specs/hypothesis-investigation-design.md)                           | Investigation Workflow                                  | ADR-020 | Archived |
| [investigation-workflow-enhancement-design.md](../../archive/specs/investigation-workflow-enhancement-design.md)       | Investigation Enhancement                               | ADR-020 | Archived |
| [ai-integration-strategy-brainstorm.md](../../archive/ai-integration-strategy-brainstorm.md)                           | AI Strategy (Archived)                                  | ADR-019 | Archived |

## Lifecycle

| Status        | Meaning                                            |
| ------------- | -------------------------------------------------- |
| **Draft**     | Design in progress, not yet implemented            |
| **Active**    | Informing current or upcoming work                 |
| **Delivered** | Feature shipped, ADR is canonical reference        |
| **Archived**  | Moved to `docs/archive/` — superseded or abandoned |

Delivered specs with ADRs can be archived when the ADR and feature docs fully capture the design decisions. The spec remains useful as historical context for "why" decisions.
