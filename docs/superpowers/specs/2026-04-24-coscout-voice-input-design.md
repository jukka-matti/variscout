---
title: CoScout Voice Input v1
audience: [engineer, product]
category: architecture
status: draft
related: [coscout, azure, voice-input, findings, shop-floor, customer-owned-data]
---

# CoScout Voice Input v1

## Context

VariScout already supports structured text-based investigation, photo evidence, and CoScout coaching, but shop-floor use exposes a clear friction: typing is often the wrong input mode when the user is standing near the process, wearing gloves, or moving between observation and discussion.

The desired product shape is **not** a free-floating voice assistant. VariScout still needs visible questions, findings, citations, and proposals. Voice should make capture and coaching easier without creating a hidden conversation channel that escapes the investigation model.

## Decision

Ship **transcription-first voice input** for Azure tiers only.

- **Azure Standard + Azure Team** get optional voice input.
- **PWA** remains microphone-disabled.
- Voice is available in two places:
  - **CoScout input**: user speaks, transcript lands in the existing draft box, user reviews/edits, then sends.
  - **Finding/comment editors**: user speaks, transcript lands in the existing draft note/comment, user reviews/edits, then saves.
- **CoScout replies remain text-only** in v1.
- **Raw audio is discarded** after transcription; the transcript is the canonical artifact.

## UX Model

### CoScout

- Desktop: **tap to record**, tap again to transcribe.
- Mobile: **hold to talk**, release to transcribe.
- The resulting transcript is appended to the current CoScout draft.
- Nothing auto-sends.
- The existing thread stays authoritative for citations, action proposals, retry, save-as-finding, and references.

### Findings and comments

- The same tap/hold pattern is available in the inline finding editor and comment editor.
- Voice works alongside the existing attachment/photo flow.
- A user can attach a photo, speak the observation, review the transcript, then save a normal comment.

## Architecture

- Browser recording stays in the shared UI layer.
- Azure-specific speech-to-text lives in `apps/azure/src/services/speechService.ts`.
- Runtime config exposes:
  - `voiceInputEnabled`
  - `speechToTextDeployment`
- Azure App Service only grants `Permissions-Policy: microphone=(self)` when the feature flag is enabled.
- The Azure app sends captured audio directly to the customer's Azure OpenAI speech-to-text deployment using the same tenant-bound auth pattern as other AI calls.

## Data Handling

- Audio is kept in memory only long enough to transcribe.
- No audio blob is persisted to IndexedDB, Blob Storage, or project documents.
- The durable record is normal VariScout text:
  - CoScout user message draft
  - finding text
  - finding comment text

## Non-goals

- No realtime spoken discussion
- No text-to-speech replies
- No always-listening microphone
- No browser-native `SpeechRecognition` dependency
- No audio persistence or replay UI

## Rollout

- Feature-flagged Azure release
- Hidden when the flag is off, the deployment is missing, the browser is unsupported, or mic access is unavailable
- PWA remains excluded by product and security policy
