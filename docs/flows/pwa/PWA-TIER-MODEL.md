# PWA Tier Model

The PWA serves users differently based on platform and license status.

## Overview

| State     | Platform      | License | Primary Purpose     |
| --------- | ------------- | ------- | ------------------- |
| **Demo**  | Web browser   | N/A     | Explore samples     |
| **Trial** | Installed PWA | None    | Try with own data   |
| **Full**  | Installed PWA | Valid   | Production analysis |

## Feature Matrix

| Feature             | Demo | Trial | Full |
| ------------------- | :--: | :---: | :--: |
| Load samples        |  ✅  |  ✅   |  ✅  |
| Upload CSV/Excel    |  ❌  |  ✅   |  ✅  |
| Manual entry        |  ❌  |  ✅   |  ✅  |
| Save projects       |  ❌  |  ❌   |  ✅  |
| Import .vrs         |  ❌  |  ❌   |  ✅  |
| Export .vrs         |  ❌  |  ❌   |  ✅  |
| Recent projects     |  ❌  |  ❌   |  ✅  |
| Watermark-free      |  ❌  |  ❌   |  ✅  |
| Theme customization |  ❌  |  ❌   |  ✅  |

## State Detection

### Platform Detection

The `useIsInstalled()` hook detects whether the PWA is running as an installed app:

```typescript
import { useIsInstalled } from '../hooks/useIsInstalled';

const isInstalled = useIsInstalled();
```

Detection methods:

- Standard: `window.matchMedia('(display-mode: standalone)').matches`
- iOS Safari: `(window.navigator as any).standalone === true`

### License Detection

```typescript
import { hasValidLicense } from '../lib/license';

const isLicensed = hasValidLicense();
```

## User Journeys

```
┌─────────────┐     Install      ┌─────────────┐    Upgrade     ┌─────────────┐
│    Demo     │ ───────────────► │    Trial    │ ─────────────► │    Full     │
│ (web only)  │                  │ (installed) │                │ (licensed)  │
└─────────────┘                  └─────────────┘                └─────────────┘
```

### Demo → Trial

User installs the PWA via:

- Browser install prompt (Chrome, Edge, Firefox)
- iOS Safari "Add to Home Screen"
- Manual browser menu option

After installation, user can:

- Upload CSV/Excel files
- Enter data manually
- Analyze their own data (session-only)

### Trial → Full

User purchases license (€49/yr) via:

- Settings panel in the app
- Website checkout flow

After license activation:

- Projects persist between sessions
- Import/export .vrs files
- Recent projects on home screen
- Chart watermarks removed
- Theme customization unlocked

## HomeScreen Variants

### Demo Mode (Web Browser)

```
┌─────────────────────────────────────────┐
│        Explore Variation Analysis       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Try a Sample Dataset           │    │
│  │  [Coffee] [Bottleneck] [Journey]│    │
│  │                                 │    │
│  │  All Sample Datasets            │    │
│  │  ▸ Case Studies (10)            │    │
│  │  ▸ Learning Journeys (3)        │    │
│  │  ▸ Industry Examples (3)        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ═══════════════ or ════════════════    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Want to analyze YOUR data?     │    │
│  │                                 │    │
│  │  ① Install the app (free)      │    │
│  │  ② Upload your CSV/Excel       │    │
│  │  ③ Upgrade to save (€49/yr)    │    │
│  │                                 │    │
│  │    [Install VariScout]          │    │
│  │                                 │    │
│  │  💡 What's a PWA?               │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Key elements:**

- Featured sample cards (3)
- Collapsible sample categories
- NO upload/manual entry options
- 3-step journey explanation
- PWA explainer for non-technical users

### Trial Mode (Installed, No License)

```
┌─────────────────────────────────────────┐
│          Start Your Analysis            │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────┐  ┌───────────────┐   │
│  │ Upload File   │  │ Enter         │   │
│  │ CSV or Excel  │  │ Manually      │   │
│  └───────────────┘  └───────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ⚠️ Session only                 │    │
│  │ Work disappears when you close. │    │
│  │ Upgrade to save projects →      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ▸ Sample datasets (16)                 │
│                                         │
└─────────────────────────────────────────┘
```

**Key elements:**

- Upload and Manual Entry with EQUAL prominence
- Clear session warning with upgrade link
- Samples collapsed at bottom

### Full Mode (Installed, Licensed)

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Recent Projects                │    │
│  │  Coffee Analysis     2h ago   → │    │
│  │  Factory Batch 12    Yesterday →│    │
│  │                                 │    │
│  │  [See all] [Import .vrs]        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ═════════ or start new ════════════    │
│                                         │
│  ┌───────────────┐  ┌───────────────┐   │
│  │ Upload File   │  │ Enter         │   │
│  │ CSV or Excel  │  │ Manually      │   │
│  └───────────────┘  └───────────────┘   │
│                                         │
│  ▸ Sample datasets (16)                 │
│                                         │
└─────────────────────────────────────────┘
```

**Key elements:**

- Recent projects FIRST (if any exist)
- Import .vrs alongside projects
- Upload and Manual Entry with equal prominence
- Samples collapsed at bottom

## Implementation Files

| File                                         | Purpose                            |
| -------------------------------------------- | ---------------------------------- |
| `apps/pwa/src/hooks/useIsInstalled.ts`       | Platform detection hook            |
| `apps/pwa/src/components/HomeScreen.tsx`     | 3-variant home screen              |
| `apps/pwa/src/components/SampleSection.tsx`  | Categorized sample list            |
| `apps/pwa/src/components/InstallPrompt.tsx`  | PWA install CTA                    |
| `apps/pwa/src/components/SessionWarning.tsx` | Upgrade reminder                   |
| `apps/pwa/src/data/sampleData.ts`            | Sample definitions with categories |

## Sample Categories

Samples are organized into categories for the collapsible list:

| Category | Count | Description                                                              |
| -------- | ----- | ------------------------------------------------------------------------ |
| Featured | 3     | Visual cards shown in demo mode (Coffee Moisture, Bottleneck, 46% Story) |
| Cases    | 10    | Real-world case studies for learning                                     |
| Journeys | 3     | Guided learning experiences                                              |
| Standard | 3     | Industry sector examples (Mango, Textiles, Coffee Defects)               |

## Testing Checklist

| Scenario           | How to Test                      | Expected Behavior                           |
| ------------------ | -------------------------------- | ------------------------------------------- |
| Web browser        | Open PWA URL (not installed)     | Samples + Install CTA, NO upload            |
| Installed free     | Install PWA, don't enter license | Upload/Manual side-by-side, session warning |
| Installed licensed | Install PWA, enter valid license | Recent projects first (if any exist)        |
| Mobile web         | Open on phone browser            | Same as desktop web                         |
| Mobile installed   | Install on phone                 | Same as desktop installed                   |

## Related Documentation

- [DATA-ONBOARDING.md](./DATA-ONBOARDING.md) - Data import flow
- [MANUAL-ENTRY.md](./MANUAL-ENTRY.md) - Manual data entry
- [../../concepts/licensing/OVERVIEW.md](../../concepts/licensing/OVERVIEW.md) - License system
