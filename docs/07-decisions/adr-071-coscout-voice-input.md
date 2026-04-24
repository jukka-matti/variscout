---
title: 'ADR-071: CoScout Voice Input'
---

# ADR-071: CoScout Voice Input

**Status:** Accepted
**Date:** 2026-04-24

## Context

VariScout is increasingly used in two settings where keyboard-first interaction becomes a drag:

- **shop-floor / gemba capture**, where the user wants to describe what they see while standing near the process
- **desk-based investigation**, where the user wants to think aloud with CoScout while keeping hands on charts, filters, and evidence

The product constraint is strict: VariScout is not a generic voice bot. Investigation state, findings, comments, citations, and action proposals must stay visible and durable. Voice must fit the investigation model rather than bypass it.

## Decision

Adopt **transcription-first voice input** for Azure tiers only.

### Product scope

- Voice input is available for:
  - CoScout draft input
  - finding editor
  - finding comments
- CoScout replies stay **text-only** in v1.
- Desktop uses **tap-to-record**.
- Mobile uses **push-to-talk** (hold, then release to transcribe).

### Architecture scope

- Audio capture happens in the browser.
- Speech-to-text is sent to the **customer's Azure OpenAI deployment**.
- The transcript becomes the canonical artifact in existing text models.
- Raw audio is **not persisted**.

### Tier scope

- **Azure Standard:** enabled behind feature flag
- **Azure Team:** enabled behind feature flag
- **PWA:** excluded

## Consequences

### Positive

- Shop-floor capture improves without changing the investigation model
- CoScout remains traceable because transcripts land in the normal thread
- No new durable audio store, sync path, or privacy surface is introduced
- The implementation reuses the existing Azure AI auth boundary

### Negative

- This is not a realtime spoken discussion system
- Users who want spoken back-and-forth still need a later architecture change
- Browser microphone behavior remains subject to browser support and permission friction

## Non-goals

- Realtime conversational audio
- Text-to-speech
- Always-on listening
- Audio history or playback

## Implementation notes

- Runtime config: `voiceInputEnabled`, `speechToTextDeployment`
- Azure speech service: `apps/azure/src/services/speechService.ts`
- Shared UI controls insert transcript into existing drafts instead of auto-sending
- Azure App Service enables microphone permissions only when the feature flag is on

## Related

- ADR-049: CoScout Knowledge Catalyst — the investigation model is the durable memory
- ADR-059: Web-first deployment architecture
- ADR-060: CoScout intelligence architecture
