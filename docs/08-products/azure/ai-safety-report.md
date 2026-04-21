---
title: AI Safety Report — CoScout
category: compliance
status: template
date: 2026-03-17
audience: [admin, architect]
---

# AI Safety Report — CoScout

Pre-submission safety validation for Azure AI Marketplace certification.

## 1. Overview

CoScout is a conversational AI assistant embedded in VariScout, a quality engineering tool. It assists with statistical analysis interpretation, hypothesis evaluation, and investigation guidance.

**AI Capabilities:**

- Summary narration of analysis state
- Chart-specific insight enhancement
- Conversational Q&A grounded in user data
- Investigation report generation

**Model:** Azure OpenAI (gpt-5.4-nano for "fast", gpt-5.4-mini for "reasoning")

## 2. Safety Controls

### Deployment Controls

- `raiPolicyName: "Microsoft.DefaultV2"` — explicit content filter policy on both model deployments (filters hate, sexual, violence, self-harm, jailbreak, protected material)
- TPM rate limits: 30 (fast/nano), 60 (reasoning/mini) — Azure-enforced
- Model version pinning: `versionUpgradeOption: "OnceCurrentVersionExpired"`
- Tenant isolation: customer's Azure subscription, no cross-tenant data access
- API keys stored in Azure Key Vault with RBAC authorization; managed identity access

### Prompt-Level Controls

- System prompts explicitly instruct: "Never invent data or statistics"
- Confidence calibration based on sample size (n<10, n<30, n<100)
- Domain-scoped terminology enforcement (TERMINOLOGY_INSTRUCTION)
- Knowledge Base source attribution requirement
- Strict tool schemas: `strict: true`, `additionalProperties: false` on all 14 CoScout tools

### Architectural Controls

- Stats-only payloads — `buildAIContext()` transforms raw data to summary statistics; raw measurements never enter AI context
- No external API calls from AI responses
- AI responses are read-only — no write access to user data
- Session-only conversation history — no persistence across sessions
- Proposal pattern — action tools return proposals requiring user confirmation (ADR-029)
- Phase-gated tools — tool availability restricted by journey phase

### Content Policy Compliance

- No references to competing platforms in prompts
- No user-generated content in system prompts
- Deterministic insights computed first, AI only enhances them

## 3. Red Teaming Results

> [!NOTE]
> This section should be populated after running Azure AI Foundry Red Teaming Agent.

### Test Categories

- [ ] Jailbreak attempts (system prompt extraction)
- [ ] PII leakage probes
- [ ] Harmful content generation
- [ ] Off-topic conversation steering
- [ ] Data fabrication attempts

### Results Summary

| Category         | Probes | Passed | Failed | Notes                   |
| ---------------- | ------ | ------ | ------ | ----------------------- |
| Jailbreak        | —      | —      | —      | _Run red teaming agent_ |
| PII Leakage      | —      | —      | —      | _Run red teaming agent_ |
| Harmful Content  | —      | —      | —      | _Run red teaming agent_ |
| Off-topic        | —      | —      | —      | _Run red teaming agent_ |
| Data Fabrication | —      | —      | —      | _Run red teaming agent_ |

## 4. Mitigations

- **System prompt grounding:** All responses must reference provided context
- **Confidence calibration:** Automatic hedging for small sample sizes
- **Error boundaries:** Graceful degradation when AI unavailable
- **Rate limiting:** debounce (2s) + min interval (5s) for narration
- **Abort control:** user can stop streaming at any time

## 6. PII Handling

### What data enters AI

| Data type            | Source                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Computed statistics  | `buildAIContext()` — mean, stdDev, Cpk, ANOVA η², pass rate                                                  |
| Factor names         | CSV column headers (e.g., "Machine", "Operator")                                                             |
| Category values      | CSV data values (e.g., "Machine A", "Morning")                                                               |
| Analyst-written text | Finding descriptions, hypothesis text, action items, process descriptions, problem statements, outcome notes |
| CoScout conversation | Last 10 messages (user questions + AI responses)                                                             |
| KB document snippets | Foundry IQ / Remote SharePoint retrieval (400 chars max per document)                                        |

### Design decision

Analyst-written text is sent to AI **without client-side PII scrubbing**.

**Rationale:**

- The analyst is an authenticated data owner in the customer's Azure AD tenant
- Text is deliberately authored by the analyst, not passively collected
- AI runs in the customer's own Azure subscription (tenant-isolated)
- Azure OpenAI content filters apply server-side (DefaultV2 policy)
- No data leaves the customer's Azure region

### Upgrade path

If enterprise customers require client-side PII detection, Azure AI Content Safety PII Detection API can be added as a pre-processing step to scan analyst-written text before it enters AI context.

## 7. Recommendation

_To be completed after red teaming results are available._

## See Also

- [Responsible AI Policy](../../05-technical/architecture/responsible-ai-policy.md) — Comprehensive RAI framework
- [EU AI Act Mapping](../../05-technical/architecture/eu-ai-act-mapping.md) — Classification analysis
