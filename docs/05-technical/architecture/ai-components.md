---
title: AI Components — Locale Behavior
audience: [developer]
category: architecture
status: stable
related: [aix-design-system, ai-architecture, internationalization, adr-025]
---

# AI Components — Locale Behavior

How each AI component receives and uses the user's locale for multilingual responses. See [ADR-025](../../07-decisions/adr-025-internationalization.md) for the internationalization architecture and [AIX Design System](aix-design-system.md) for the full component AIX cards.

## NarrativeBar

Locale flows via `AIContext.locale`. The `buildSummaryPrompt()` template in `promptTemplates.ts` receives the locale from the assembled AI context and includes a language instruction so the model responds in the user's language.

- `useNarration` passes the full `AIContext` (which includes `locale`) to the narration fetch.
- When locale is `undefined` or `'en'`, no extra language instruction is injected (English is the default).

## ChartInsightChip

Locale is passed as an explicit parameter on `fetchChartInsight()`. The per-chart insight hooks (`useChartInsights`) forward the current locale from the app context so that the short AI-enhanced sentence (80 tokens max) is generated in the correct language.

- Deterministic insight builders are locale-unaware (they use static English strings); only the AI enhancement layer respects locale.

## CoScout

Locale flows through `buildCoScoutMessages()`. The system prompt assembled by `buildCoScoutSystemPrompt()` includes a language instruction derived from the locale, ensuring the full conversation — including suggested questions and phase coaching — is in the user's language.

- `useAICoScout` passes locale as part of the context forwarded to `buildCoScoutMessages`.
- Streaming responses respect the language instruction set in the system prompt.
