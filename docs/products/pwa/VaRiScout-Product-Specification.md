# VaRiScout Product Specification

## Overview

VaRiScout is a variation analysis tool for Lean Six Sigma practitioners, quality professionals, and operations teams. It helps users find what's driving variation in their data—in minutes.

**Tagline**: "Find what's driving variation. In minutes."

**1-1-1 Promise**: 1 minute to insight. 1 minute to adjust. 1 minute to present.

---

## Architecture Philosophy

```
CORE PRINCIPLES
─────────────────────────────────────────────────────────────────

✓ Client-side only: No user data on our servers
✓ Offline-first: Works without internet (PWA)
✓ Privacy simple: "We don't have your data" (GDPR)
✓ Low complexity: Minimal backend (licensing only)
```

### Data Flow

```
User's Data  →  Browser (JavaScript)  →  Analysis  →  Output
                       │
                       ↓
                  IndexedDB
                  (user's device only)
                       │
                       ↓
              ┌────────┴────────┐
              ↓                 ↓
         .vrs file          PNG/CSV
      (downloadable)       (export)
```

**Server never sees**: User data, projects, analysis results

**Server only provides**: Static files (HTML/JS/CSS), License validation

---

## Product Line

### Web App vs Installed PWA

```
TWO WAYS TO USE VARISCOUT
─────────────────────────────────────────────────────────────────

WEB APP (variscout.com/app)          INSTALLED PWA
─────────────────────────            ─────────────────────────
Runs on: Vercel (internet)           Runs on: User's computer
Purpose: Try, learn, train           Purpose: Real project work
Features: Free only                  Features: Free + Paid
Saving: No (session only)            Saving: Yes (with license)
Upgrade: No                          Upgrade: Yes (via Paddle)
Offline: No                          Offline: Yes

HOW TO GET INSTALLED PWA:
1. Visit variscout.com/app
2. Click "Install" in browser (or browser prompts)
3. App installs locally
4. Now has full features + upgrade option
```

### Freemium Model (Installed PWA Only)

```
FREE vs INDIVIDUAL (installed PWA)
─────────────────────────────────────────────────────────────────

FREE (€0)                          INDIVIDUAL (€49/year)
─────────────────                  ─────────────────
✓ All chart types                  ✓ Everything in Free
✓ Full analysis features           ✓ Save projects (IndexedDB)
✓ Copy to clipboard                ✓ Export/import .vrs files
✓ Export PNG/CSV                   ✓ Save templates
✗ Watermark on exports             ✓ No watermark
✗ Projects don't persist           ✓ Priority support
✗ Session only

Note: Upgrade option only appears in installed PWA, not web app.
```

### Individual Products

| Product                  | Free                                   | Paid                                  | Delivery       |
| ------------------------ | -------------------------------------- | ------------------------------------- | -------------- |
| **VaRiScout Lite (PWA)** | Full analysis, session only, watermark | €49/year — save, export, no watermark | Static hosting |
| **VaRiScout Excel**      | Full analysis, session only, watermark | €49/year — save, export, no watermark | Excel add-in   |

Same core analysis engine, same price. User picks their preferred workflow.

### Team & Enterprise

| Product             | Price       | Users     | Delivery     |
| ------------------- | ----------- | --------- | ------------ |
| Power BI Team       | €399/year   | Up to 10  | AppSource    |
| Power BI Department | €999/year   | Up to 50  | AppSource    |
| Power BI Enterprise | €1,999/year | Unlimited | AppSource    |
| VaRiScout Azure     | €999/year   | Unlimited | ARM template |

### Price Tier Logic

```
PRICING TIERS
─────────────────────────────────────────────────────────────────

€0        Free (try everything, session only, watermark)
€49       Individual (save projects, no watermark)
€399      Team (Power BI, 10 users)
€999      Department (Power BI 50) or Azure (unlimited self-host)
€1,999    Enterprise (Power BI unlimited)
```

---

## Use Cases

```
WEB APP (variscout.com/app) — FREE ONLY
─────────────────────────────────────────────────────────────────

LEARNING & TRAINING
├── LSS workshops and courses
├── Green Belt training programs
├── University courses
├── Self-learning
└── Full analysis features, no saving needed

QUICK ANALYSIS
├── Ad-hoc investigations
├── Meeting prep
├── One-off data exploration
└── Session only — work disappears on close

TRYING BEFORE INSTALLING
├── See if VaRiScout fits your needs
├── No commitment, no install
└── Install PWA when ready for more


INSTALLED PWA — FREE + PAID
─────────────────────────────────────────────────────────────────

INDIVIDUAL ANALYSTS (with license)
├── Quality engineers
├── Green Belts doing projects
├── Operations analysts
├── Continuous improvement teams
└── Save projects, export .vrs files, no watermark
```

---

## VaRiScout Lite (PWA) - Core Product

### Features by Tier

| Category       | Feature                              | Free          | Individual |
| -------------- | ------------------------------------ | ------------- | ---------- |
| **Charts**     | I-Chart, Boxplot, Pareto, Capability | ✓             | ✓          |
| **Charts**     | Linked filtering (click to drill)    | ✓             | ✓          |
| **Analysis**   | Cp/Cpk capability                    | ✓             | ✓          |
| **Analysis**   | Control limits (UCL/LCL)             | ✓             | ✓          |
| **Data Input** | CSV/Excel import                     | ✓             | ✓          |
| **Data Input** | Manual entry, clipboard paste        | ✓             | ✓          |
| **Export**     | Copy to clipboard                    | ✓ (watermark) | ✓          |
| **Export**     | PNG charts                           | ✓ (watermark) | ✓          |
| **Export**     | CSV with spec status                 | ✓             | ✓          |
| **Projects**   | Save projects (IndexedDB)            | ✗             | ✓          |
| **Projects**   | Export/import .vrs files             | ✗             | ✓          |
| **Projects**   | Save templates                       | ✗             | ✓          |
| **PWA**        | Offline-first                        | ✓             | ✓          |
| **PWA**        | Installable                          | ✓             | ✓          |
| **Support**    | Priority email                       | ✗             | ✓          |

### Features (Planned for Trainer Adoption)

| Feature           | Why Needed                                      |
| ----------------- | ----------------------------------------------- |
| Gage R&R          | MSA is non-negotiable in manufacturing training |
| Normality check   | "Can I use this capability number?"             |
| 2-sample t-test   | "Did the improvement work?"                     |
| 1-way ANOVA       | "Which factor matters?"                         |
| Simple regression | "What's the relationship?"                      |

### Technical Stack

| Component | Technology                         |
| --------- | ---------------------------------- |
| Framework | React 18                           |
| Charts    | Visx (shared with Power BI, Excel) |
| Storage   | IndexedDB (via Dexie.js)           |
| State     | React Context + useReducer         |
| PWA       | Workbox                            |
| Build     | Vite                               |
| Styling   | Tailwind CSS                       |
| Hosting   | Vercel                             |

---

## Licensing System

### Overview

Paddle handles payments. Signed license keys enable offline validation.

```
LICENSING FLOW
─────────────────────────────────────────────────────────────────

User clicks Buy (€49)
         │
         ↓
   Paddle Checkout
   (handles VAT)
         │
         ↓
Webhook → Generate signed key → Email to user
         │
         ↓
User enters key in app → Validates locally → Stored in IndexedDB
         │
         ↓
   Watermark removed (works offline forever)
```

### Key Details

| Aspect           | Implementation                 |
| ---------------- | ------------------------------ |
| Payment provider | Paddle (merchant of record)    |
| Key format       | `VSL-XXXX-XXXX-XXXX-XXXX`      |
| Validation       | RSA signature, offline-capable |
| Storage          | IndexedDB on user's device     |
| Expiry           | Checked locally, in signature  |

See `technical/TECH-LICENSING.md` for full implementation.

---

## Storage System

### What's Stored Locally

| Data      | Storage              | Purpose            |
| --------- | -------------------- | ------------------ |
| Projects  | IndexedDB            | Saved analyses     |
| Settings  | IndexedDB            | User preferences   |
| License   | IndexedDB            | Activation status  |
| App files | Service Worker cache | Offline capability |

### Project Files (.vrs)

Users can export/import projects as `.vrs` files (JSON format):

- Portable between devices
- Shareable with colleagues
- Backup capability

See `technical/TECH-PWA-STORAGE.md` for full implementation.

---

## Editions & Branding

### Free Edition

```
FREE EDITION
─────────────────────────────────────────────────────────────────

WHAT YOU GET:
✓ All chart types and analysis features
✓ Copy charts to clipboard (with watermark)
✓ Export PNG/CSV (with watermark)
✓ Presentation mode
✓ No time limit
✓ No registration required

WHAT YOU DON'T GET:
✗ Save projects (session only — data gone when browser closes)
✗ Export/import .vrs project files
✗ Save templates
✗ Watermark-free exports

IDEAL FOR:
• Trying VaRiScout
• Quick one-off analyses
• Training/learning
• Evaluating before purchase
```

### Individual Edition (€49/year)

```
INDIVIDUAL EDITION
─────────────────────────────────────────────────────────────────

WHAT YOU GET:
✓ Everything in Free, plus:
✓ Save projects (persists in browser via IndexedDB)
✓ Export/import .vrs project files
✓ Save templates for repeat analyses
✓ No watermark on exports
✓ Priority email support

LICENSE DETAILS:
• License key: VSL-XXXX-XXXX-XXXX-XXXX
• Works offline after activation
• Tied to email, works on multiple devices
• Annual renewal via Paddle

IDEAL FOR:
• Regular use
• Sharing analyses with colleagues
• Professional presentations
• Repeat data sources
```

### Custom Branding (Azure/Enterprise)

- Custom logo
- Custom colors
- Custom domain
- No VaRiScout branding

### Prompt Preferences

Free users can opt out of upgrade prompts:

| Preference           | Effect                                    | Stored In |
| -------------------- | ----------------------------------------- | --------- |
| Hide upgrade prompts | No popup when clicking Save               | IndexedDB |
| Hide close warning   | No warning when closing with unsaved work | IndexedDB |

**Reset**: Always available in Settings. Users can re-enable prompts anytime.

**Behavior**: Upgrade option always visible in Settings regardless of prompt preferences.

---

## Beyond Individual: Team & Enterprise

The PWA serves individual users. For teams and organizations, we offer:

### Power BI Visuals

For teams using Power BI for reporting:

- 4 custom visuals (I-Chart, Boxplot, Pareto, Capability)
- Embed in existing dashboards
- Cross-visual filtering
- Billed through Microsoft AppSource

| Tier       | Users     | Price       |
| ---------- | --------- | ----------- |
| Team       | Up to 10  | €399/year   |
| Department | Up to 50  | €999/year   |
| Enterprise | Unlimited | €1,999/year |

### Azure Deployment

For organizations wanting full control:

- Deploy to your Azure tenant
- Custom domain (analysis.yourcompany.com)
- Custom branding
- Unlimited users
- €999/year + ~€5/month Azure hosting

### Cross-Promotion in PWA

Free users see team options mentioned:

- In Settings page ("Other Options" section)
- In upgrade prompts (small link at bottom)
- Links to variscout.com/pricing for details

This keeps the PWA focused while letting users discover enterprise options.

---

## User Experience

### First-Time User Flow

```
1. Land on variscout.com
2. Click "Try Free" → /app
3. See sample data loaded OR upload own CSV
4. Explore linked filtering
5. Export chart
6. See watermark → "Remove watermark €49/year"
```

### Project Workflow

```
1. Import data (CSV/Excel/paste)
2. Map columns (value, factors, timestamp)
3. Set spec limits (optional)
4. Analyze (I-Chart, Boxplot, Pareto)
5. Click to filter → drill down
6. Export charts/data
7. Save project (auto-save + manual .vrs export)
```

### Upgrade Flow

```
Free user clicks "Save Project"
         │
         ↓
   ┌─────────────────────────────────┐
   │  Save requires Individual       │
   │                                 │
   │  • Save projects                │
   │  • Export .vrs files            │
   │  • No watermark                 │
   │                                 │
   │  €49/year                       │
   │                                 │
   │  [Upgrade]  [Maybe Later]       │
   │                                 │
   │  ☐ Don't show again             │
   │                                 │
   │  💡 Need team features?         │
   │     Power BI / Azure options    │
   └─────────────────────────────────┘
         │
User clicks "Upgrade"
         │
         ↓
   Paddle checkout overlay
         │
         ↓
   User pays (30 seconds)
         │
         ↓
   PWA calls /license/activate
         │
         ↓ (2-3 seconds)
   ┌─────────────────────────────────┐
   │  ✓ You're all set!              │
   │                                 │
   │  ✓ Save projects                │
   │  ✓ Export .vrs files            │
   │  ✓ No watermark                 │
   │                                 │
   │  Backup key sent to your email  │
   │                                 │
   │  [Start Using VaRiScout]        │
   └─────────────────────────────────┘
```

### Why Instant Activation?

| Benefit           | How                                       |
| ----------------- | ----------------------------------------- |
| No email wait     | License returned directly to PWA          |
| No copy/paste     | Key stored automatically                  |
| Works immediately | Features unlock in 2 seconds              |
| Email as backup   | For new devices, still sent in background |

### Prompt Preferences Tracking

| Event                    | Tracked       | Purpose                         |
| ------------------------ | ------------- | ------------------------------- |
| `prompt_shown`           | Type, trigger | Know which prompts fire         |
| `prompt_upgrade_click`   | Prompt type   | Measure conversion by trigger   |
| `prompt_dismissed`       | Prompt type   | Measure dismissal rate          |
| `prompt_dont_show_again` | Prompt type   | Measure opt-out rate            |
| `team_link_click`        | Location      | Measure Power BI/Azure interest |

---

## Design Principles

### UI Constraints

| Principle         | Implementation                        |
| ----------------- | ------------------------------------- |
| Fits one screen   | Core charts visible without scrolling |
| Mobile-responsive | Works on 320px+                       |
| Dark mode         | Optional, respects system preference  |
| Accessible        | WCAG 2.1 AA compliance                |

### Chart Philosophy

| Principle              | Implementation                               |
| ---------------------- | -------------------------------------------- |
| Linked filtering       | Click any chart element → filters all charts |
| Synchronized Y-axis    | Same scale across comparable charts          |
| Progressive disclosure | Summary → click → detail                     |
| Plain language         | "Different? YES" not "p < 0.05"              |

---

## Competitive Positioning

### vs Minitab

| Aspect         | Minitab          | VaRiScout            |
| -------------- | ---------------- | -------------------- |
| Price          | $1,000+/year     | €49/year or free     |
| Installation   | Desktop software | Browser (no install) |
| Learning curve | Steep            | Minimal              |
| Feature depth  | Deep (30 years)  | Focused (essentials) |
| Target         | Statisticians    | Everyone             |

### vs Excel

| Aspect           | Excel              | VaRiScout    |
| ---------------- | ------------------ | ------------ |
| Setup            | Build from scratch | Ready to use |
| Control limits   | Manual calculation | Automatic    |
| Linked filtering | Complex            | One click    |
| Export quality   | Varies             | Consistent   |

### Positioning Statement

> "VaRiScout is for practitioners who need answers, not statisticians who need tools. Simple enough for anyone. Rigorous enough for experts."

---

## Success Metrics

### Product Metrics

| Metric                      | Target        |
| --------------------------- | ------------- |
| Time to first chart         | < 2 minutes   |
| Free → Paid conversion      | 5-10%         |
| Monthly active users (free) | 1,000+        |
| Paid subscribers            | 100+ (Year 1) |

### Business Metrics

| Metric               | Year 1 Target |
| -------------------- | ------------- |
| ARR (PWA + Excel)    | €25,000       |
| Support tickets/user | < 0.1         |
| Churn rate           | < 20%         |

---

## Roadmap

### Phase 1: Launch (Current)

- [x] Core PWA with I-Chart, Boxplot, Pareto
- [x] Cp/Cpk capability analysis
- [x] CSV/Excel import
- [x] .vrs project files
- [ ] Paddle integration
- [ ] License key system
- [ ] Website launch

### Phase 2: Trainer Features

- [ ] Gage R&R
- [ ] Normality test
- [ ] 2-sample t-test
- [ ] 1-way ANOVA
- [ ] Simple regression

### Phase 3: Excel Add-in

- [ ] Office.js add-in
- [ ] AppSource submission
- [ ] Same analysis engine

### Phase 4: Power BI

- [ ] Custom visuals
- [ ] AppSource submission
- [ ] Team licensing

---

## Related Documents

| Document         | Location                        |
| ---------------- | ------------------------------- |
| Licensing System | `technical/TECH-LICENSING.md`   |
| PWA Storage      | `technical/TECH-PWA-STORAGE.md` |
| Website Specs    | `variscout-website/`            |
| Tech Stack       | `technical/TECH-STACK.md`       |
