---
title: EU AI Act Classification & Mapping
audience: [compliance, engineer]
category: architecture
status: stable
date: 2026-03-19
related: [ai, compliance, eu-ai-act, regulation]
---

# EU AI Act Classification & Mapping — VariScout

Classification analysis and Article mapping for CoScout under the EU AI Act (Regulation 2024/1689). High-risk obligations effective August 2, 2026.

---

## §1 — Classification Analysis

**Question:** Is CoScout a high-risk AI system under EU AI Act Article 6 + Annex III?

### Annex III analysis

The most relevant category is **Annex III, Category 4 — Employment, workers management:**

> AI systems intended to be used for making decisions affecting terms of work-related relationships, task allocation based on individual behaviour, personal traits or characteristics, or monitoring/evaluation of persons in work-related contractual relationships.

### VariScout's position

CoScout assists with **process variation analysis**, not worker evaluation:

| Criterion                     | VariScout reality                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Targets individuals?          | No — targets equipment, materials, conditions, temporal patterns                                  |
| Makes autonomous decisions?   | No — analyst makes all decisions; AI explains pre-computed statistics                             |
| Evaluates worker performance? | No — "Operator" is one of 5+ factor roles, analyzing process variation, not individual evaluation |
| Affects employment terms?     | No — quality analysis tool, not HR system                                                         |
| Monitors individuals?         | No — monitors process metrics (Cpk, variation, control limits)                                    |

### Recommended classification: **Limited-risk** (Article 50 transparency obligations)

CoScout is an **AI-assisted professional tool** that explains pre-computed statistics. It does not make autonomous decisions, does not evaluate individuals, and requires analyst confirmation for all proposed actions.

### Boundary condition

If a customer uses VariScout specifically to evaluate individual operator performance (operator as the primary factor, findings targeting specific individuals, actions assigned to specific operators), the system could approach high-risk territory under Annex III Category 4.

**Mitigations for this boundary:**

- VariScout's design frames operator analysis as "process variation by operator" — identifying which workstations, shifts, or methods produce different outcomes, not evaluating individual capability
- Factor roles include: equipment, temporal, material, location, operator — operator is one of many process factors
- The analyst (not AI) creates findings and assigns actions
- AI never recommends personnel actions

**Recommendation:** Include a notice in deployment documentation that VariScout is designed for process analysis, not individual performance evaluation.

---

## §2 — Transparency Obligations (Article 50)

Even as limited-risk, Article 50 requires clear disclosure when users interact with AI:

| Requirement                                   | VariScout implementation                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Users informed they're interacting with AI    | Provider label "Azure OpenAI" visible in CoScout header; AI components visually distinct                     |
| AI-generated content identifiable             | AI narrative labeled "AI-Generated Summary" in reports; CoScout responses in distinct UI panel               |
| Disclosure of AI capabilities and limitations | Confidence calibration visible (hedging language for small samples); AIX Design System principles documented |
| AI can be disabled                            | Per-component AI toggles in Settings panel                                                                   |

---

## §3 — High-Risk Documentation Mapping (Annex IV)

If VariScout were classified as high-risk in the future, Annex IV documentation requirements map to existing documents:

| Annex IV requirement                 | VariScout document                                                          | Status                        |
| ------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| General description of the AI system | [`aix-design-system.md`](aix-design-system.md) §1                           | Complete                      |
| Elements of the development process  | [`responsible-ai-policy.md`](responsible-ai-policy.md) §6                   | Complete                      |
| Risk management system               | [`responsible-ai-policy.md`](responsible-ai-policy.md) §3 + §7              | Complete (gaps documented)    |
| Data governance measures             | [`responsible-ai-policy.md`](responsible-ai-policy.md) §4                   | Complete                      |
| Transparency provisions              | This document §2                                                            | Complete                      |
| Human oversight measures             | [ADR-029](../../07-decisions/adr-029-ai-action-tools.md) (proposal pattern) | Complete                      |
| Accuracy, robustness, cybersecurity  | [`ai-safety-report.md`](../../08-products/azure/ai-safety-report.md)        | Partial (red teaming pending) |
| Logging capabilities                 | `tracing.ts` + `appInsights.ts` (operational logs)                          | Partial (audit spec needed)   |
| Instructions for use                 | In-app help tooltips + AIX Design System                                    | Complete                      |

### Gap analysis for high-risk readiness

| Requirement                  | Current state               | Action needed                            |
| ---------------------------- | --------------------------- | ---------------------------------------- |
| Conformity assessment        | Not started                 | Required only if classified as high-risk |
| EU declaration of conformity | Not started                 | Required only if classified as high-risk |
| CE marking                   | Not applicable              | Software-only; no physical marking       |
| Quality management system    | Partial (prompt governance) | Formalize if high-risk                   |
| Post-market monitoring       | Telemetry only              | Add feedback mechanism + evaluation      |

---

## §4 — Timeline & Obligations

| Date           | Obligation               | VariScout action                                               |
| -------------- | ------------------------ | -------------------------------------------------------------- |
| August 2, 2025 | Prohibited practices ban | Not applicable — CoScout is not a prohibited practice          |
| August 2, 2026 | High-risk obligations    | Monitor classification; this document serves as pre-assessment |
| August 2, 2027 | All remaining provisions | Transparency obligations (§2 above) already implemented        |

---

## See Also

- [Responsible AI Policy](responsible-ai-policy.md) — Comprehensive guardrail documentation
- [AI Safety Report](../../08-products/azure/ai-safety-report.md) — Marketplace certification
- [AIX Design System](aix-design-system.md) — Design principles
- [EU AI Act full text](https://eur-lex.europa.eu/eli/reg/2024/1689) — Regulation 2024/1689
