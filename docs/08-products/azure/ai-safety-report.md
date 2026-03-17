---
title: AI Safety Report — CoScout
category: compliance
status: template
date: 2026-03-17
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

**Model:** Azure OpenAI (gpt-4o-mini for "fast", gpt-4o for "reasoning")

## 2. Safety Controls

### Prompt-Level Controls

- System prompts explicitly instruct: "Never invent data or statistics"
- Confidence calibration based on sample size (n<10, n<30, n<100)
- Domain-scoped terminology enforcement (TERMINOLOGY_INSTRUCTION)
- Knowledge Base source attribution requirement

### Architectural Controls

- No PII in prompts — data is anonymized factor names + numeric values
- No external API calls from AI responses
- AI responses are read-only — no write access to user data
- Session-only conversation history — no persistence across sessions

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

## 5. Recommendation

_To be completed after red teaming results are available._
