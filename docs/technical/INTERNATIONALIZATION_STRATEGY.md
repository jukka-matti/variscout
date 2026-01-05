# Internationalization (i18n) Strategy

> [!NOTE]
> **Status**: Implemented (Jan 2026)
> **Stack**: `i18next`, `react-i18next`

## Executive Summary

VaRiScout Lite will launch with **20 languages** to maximize organic search traffic across global manufacturing and quality markets. This strategy targets not just Lean Six Sigma practitioners, but the broader quality and operations audience searching for tools to analyze variation, find bottlenecks, and improve processes.

**Target markets**: Quality professionals, operations managers, manufacturing engineers, process improvement practitioners

**Languages**: 20 (covering ~4.1 billion speakers and ~70% of global manufacturing GDP)

**Estimated effort**: ~96 hours (~5-10 weeks depending on pace)

**Expected outcome**: Access to ~1.27M monthly searches across quality/operations keywords

---

## Strategic Rationale

### Why Multi-Language?

```
ORGANIC TRAFFIC MULTIPLIER
═══════════════════════════════════════════════════════════════════

English-only site:
• Competing with Minitab, JMP, countless blogs
• Hard to rank for "process capability" (high competition)
• Limited to English-searching audience

20-language site:
• Less competition in DE, ES, TR, PL, ID searches
• Same content ranks easier in smaller markets
• Long-tail keywords in native language
• "Prozessfähigkeit" (DE) easier than "process capability"
• "Analisis bottleneck produksi" (ID) = almost no competition
• Builds domain authority across regions
```

### Expanded Market Scope

We're not just targeting Lean Six Sigma - we're targeting the much larger quality and operations market:

```
KEYWORD UNIVERSE
═══════════════════════════════════════════════════════════════════
LEAN SIX SIGMA (Niche)       QUALITY (Broader)         OPERATIONS (Broadest)
─────────────────────        ─────────────────         ──────────────────────
• cpk calculator             • quality control         • bottleneck analysis
• process capability         • root cause analysis     • production optimization
• control charts             • defect reduction        • throughput improvement
• six sigma tools            • quality improvement     • capacity planning
• spc software               • inspection data         • OEE calculator
                             • quality metrics         • cycle time analysis
                             • 8D problem solving      • production efficiency

Est. Monthly Searches:       Est. Monthly Searches:    Est. Monthly Searches:
~100K globally               ~500K globally            ~1M+ globally

COMBINED: 1.5M+ monthly searches addressable
```

---

## The Strategic 20 Languages

| #   | Flag | Language   | Speakers | Region          | SEO Competition | LLM Quality |
| --- | ---- | ---------- | -------- | --------------- | --------------- | ----------- |
| 1   | 🇬🇧   | English    | 1.5B     | Global          | Very High       | Native      |
| 2   | 🇩🇪   | German     | 95M      | DACH            | Medium          | Excellent   |
| 3   | 🇪🇸   | Spanish    | 550M     | Spain + LatAm   | Medium-Low      | Excellent   |
| 4   | 🇫🇷   | French     | 300M     | France + Africa | Medium          | Excellent   |
| 5   | 🇧🇷   | Portuguese | 260M     | Brazil + Africa | Low             | Excellent   |
| 6   | 🇮🇹   | Italian    | 65M      | Italy           | Medium-Low      | Excellent   |
| 7   | 🇵🇱   | Polish     | 45M      | Poland          | Very Low        | Excellent   |
| 8   | 🇳🇱   | Dutch      | 25M      | NL + Belgium    | Low             | Excellent   |
| 9   | 🇨🇿   | Czech      | 10M      | Czechia         | Very Low        | Good        |
| 10  | 🇷🇴   | Romanian   | 20M      | Romania         | Very Low        | Good        |
| 11  | 🇹🇷   | Turkish    | 85M      | Turkey          | Very Low        | Good        |
| 12  | 🇫🇮   | Finnish    | 5.5M     | Finland         | Very Low        | Good        |
| 13  | 🇸🇪   | Swedish    | 10M      | Sweden          | Low             | Excellent   |
| 14  | 🇩🇰   | Danish     | 6M       | Denmark         | Very Low        | Excellent   |
| 15  | 🇳🇴   | Norwegian  | 5.5M     | Norway          | Very Low        | Very Good   |
| 16  | 🇮🇩   | Indonesian | 275M     | Indonesia       | Almost None     | Good        |
| 17  | 🇻🇳   | Vietnamese | 100M     | Vietnam         | Almost None     | Good        |
| 18  | 🇹🇭   | Thai       | 70M      | Thailand        | Very Low        | Good        |
| 19  | 🇮🇳   | Hindi      | 600M     | India           | Low             | Good        |
| 20  | 🇰🇷   | Korean     | 50M      | South Korea     | Medium          | Good        |

**Total reach**: ~4.1 billion speakers

> **Detailed Rationale**: See "Tier 1-4 Markets" analysis in Product Strategy docs.

---

## Technical Implementation

### Architecture

```
PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════

variscout-lite/
├── packages/
│   ├── core/                      # No i18n (calculations only)
│   ├── ui/                        # Shared UI (language agnostic)
│
├── apps/
│   ├── pwa/
│   │   └── src/
│   │       ├── locales/
│   │       │   ├── en/translation.json  # English (base)
│   │       │   ├── fi/translation.json  # Finnish
│   │       │   ├── de/translation.json  # German
│   │       │   └── ... (one dir per language)
│   │       │
│   │       ├── i18n.ts            # i18next configuration
│   │       └── components/
│   │           └── LanguageSwitcher.tsx
│   │
│   ├── azure/                     # Azure Team App (Same structure)
│   │   └── src/
│   │       ├── locales/
│   │       └── i18n.ts
│   │
│   └── excel-addin/               # Excel Add-in (Same structure)
│       └── src/
│           ├── locales/
│           └── i18n.ts
```

> **Note on Structure**: We use a per-app configuration (`apps/pwa`, `apps/azure`, `apps/excel-addin`) rather than a shared `locales` package to optimize bundle sizes and offline behavior for the PWA.

### i18n Library: i18next

We use `i18next` with `react-i18next` and `i18next-browser-languagedetector`.

**Example Configuration (`apps/pwa/src/i18n.ts`):**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locales (bundled for offline capability)
import en from './locales/en/translation.json';
import fi from './locales/fi/translation.json';
// ... import other languages as added

export const resources = {
  en: { translation: en },
  fi: { translation: fi },
  // ...
} as const;

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  // ... other config
});

export default i18n;
```

### Locale File Structure (`translation.json`)

```json
{
  "common": {
    "appName": "VaRiScout Lite",
    "loading": "Loading...",
    "save": "Save"
  },
  "charts": {
    "iChart": "I-Chart",
    "boxplot": "Boxplot",
    "pareto": "Pareto Chart"
  },
  "seo": {
    "title": "VaRiScout Lite - Free Process Capability & Variation Analysis",
    "description": "Analyze process capability, find bottlenecks, and reduce variation."
  }
}
```

### URL Structure for SEO (Future Website)

For the marketing website (served via PWA or separate generic pages):

```
variscout.com/              → English (default)
variscout.com/de/           → German
variscout.com/fi/           → Finnish
...
```

Implementation via **hreflang tags** in `<head>`:

```html
<link rel="alternate" hreflang="en" href="https://variscout.com/" />
<link rel="alternate" hreflang="de" href="https://variscout.com/de/" />
<link rel="alternate" hreflang="fi" href="https://variscout.com/fi/" />
<link rel="alternate" hreflang="x-default" href="https://variscout.com/" />
```

---

## Translation Workflow

### Using Claude for Translation

1.  **Extract Base Strings**: Ensure all English strings are in `en/translation.json`.
2.  **Generate Translation**: Use Claude/LLM with a specific prompt context.

    > "Translate the following JSON strings from English to [LANGUAGE]. Context: Manufacturing quality control software (Six Sigma, process capability). Maintain JSON structure."

3.  **Review**:
    - **Tier 1 (DE, ES, FR, PT)**: Minimal review needed (excellent LLM quality).
    - **Tier 3 (FI, VN)**: Native speaker review recommended for grammar and technical nuances.
4.  **Test**: Switch language in PWA to verify layout and rendering.

---

## Implementation Roadmap

Currently (`Jan 2026`), the **Architecture and Base Integration** are complete (`en`, `fi` implemented).

### 1. Foundation (Complete)

- [x] i18n architecture setup
- [x] `i18next` installed in all apps
- [x] English (base) and Finnish (Tier 3 pilot) files created

### 2. Tier 1: Core Global (Upcoming)

- [x] German
- [x] Spanish
- [x] French
- [x] Portuguese

### 3. Tier 2: European Manufacturing

- [ ] Italian, Polish, Dutch
- [ ] Czech, Romanian, Turkish

### 4. Tier 3 & 4: Nordic & Asia

- [ ] Swedish, Danish, Norwegian
- [ ] Indonesian, Vietnamese, Thai, Hindi, Korean

---

## Success Metrics

| Metric                 | Target (6-Month) |
| ---------------------- | ---------------- |
| Languages live         | 20               |
| Monthly organic visits | 10,000+          |
| Trial/Usage signups    | 200/month        |
| Top 10 rankings        | 50+ keywords     |

---

## Risks & Mitigations

| Risk                    | Mitigation                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Translation Quality** | Use "Tiered" approach; prioritize human review for lower-resource languages (FI, VN).                                 |
| **Maintenance**         | Use automated scripts to sync JSON keys across files.                                                                 |
| **Performance**         | Monitor bundle size. If >20 languages bloat the bundle, switch to dynamic imports (`import('...')`) for translations. |
