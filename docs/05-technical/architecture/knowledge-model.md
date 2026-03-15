# Knowledge Model Architecture

## Overview

Unified registry of terms (vocabulary) and concepts (methodology) that feeds all knowledge consumers in VariScout.

The knowledge model serves as the single source of truth for domain terminology and analytical methodology. It grounds AI responses in VariScout's own framework rather than generic SPC terminology.

## Data Model

```
KnowledgeEntry = GlossaryTerm | Concept  (discriminated union)
```

- **GlossaryTerm**: `id`, `label`, `definition`, `description?`, `category` (GlossaryCategory), `learnMorePath?`, `relatedTerms?`
- **Concept**: `id`, `label`, `definition`, `description?`, `conceptCategory` (ConceptCategory), `learnMorePath?`, `relations[]` (KnowledgeRelation)
- **KnowledgeRelation**: `{ targetId: string, type: 'uses' | 'leads-to' | 'contains' | 'contrasts' }`

Type guards: `isConcept(entry)` and `isGlossaryTerm(entry)` disambiguate the union.

## Module Structure

```
packages/core/src/glossary/
├── types.ts              — Type definitions (GlossaryTerm, Concept, KnowledgeEntry)
├── terms.ts              — ~41 vocabulary terms (6 categories)
├── concepts.ts           — ~15 methodology concepts (3 categories)
├── knowledge.ts          — Unified lookup (getEntry, getRelated, getReferencedBy)
├── buildGlossaryPrompt.ts — AI prompt builder (terms + optional concepts)
├── index.ts              — Public API
└── locales/              — Translations (de, es, fr, pt)
```

## Consumer Pipeline

| Consumer  | Input          | API                                            | Output                     |
| --------- | -------------- | ---------------------------------------------- | -------------------------- |
| Tooltips  | termId         | `getTerm(id)`                                  | Short definition popup     |
| CoScout   | analysis state | `buildGlossaryPrompt({includeConcepts: true})` | Grounding in system prompt |
| Website   | page route     | `getTerm(id)` + EXTENSIONS                     | Rich glossary/learn page   |
| UI labels | component      | `getConcept(id).label`                         | Phase names, lens names    |

## Adding a New Term

1. Add to `terms.ts` array with unique id and category
2. Translations: add to each locale file
3. Website: optionally add GLOSSARY_EXTENSIONS entry
4. Test: run glossary tests

## Adding a New Concept

1. Add to `concepts.ts` with relations to existing terms/concepts
2. Verify all relation targetIds exist (test enforces this)
3. Test: run `pnpm --filter @variscout/core test -- --run`

## Relationship Types

| Type        | Meaning                        | Example                                          |
| ----------- | ------------------------------ | ------------------------------------------------ |
| `uses`      | Concept references a tool/term | `changeLens` → uses → `nelsonRule2`              |
| `leads-to`  | Sequential phase flow          | `phaseValidating` → leads-to → `phaseConverging` |
| `contains`  | Parent-child grouping          | `fourLenses` → contains → `changeLens`           |
| `contrasts` | Complementary frameworks       | `fourLenses` → contrasts → `twoVoices`           |

## Localization

- Terms: `glossary/locales/{locale}.ts` — keyed to term IDs
- API: `getLocalizedTerm(id, locale)`

## Design Decisions

- GlossaryTerm interface is frozen (zero breaking changes to existing consumers)
- Concepts use `conceptCategory` (not `category`) to disambiguate in the union type
- Relations are data-only (hardcoded in `concepts.ts`), not runtime-mutable
- One-hop lookups only (`getRelated`, `getReferencedBy`) — no recursive graph traversal
- `buildGlossaryPrompt` always includes methodology concepts for AI consumers

## See Also

- [Methodology Reference](../../01-vision/methodology.md)
- [AI Context Engineering](ai-context-engineering.md)
- [AI Architecture](ai-architecture.md)
- [Glossary Feature](../../03-features/learning/glossary.md)
