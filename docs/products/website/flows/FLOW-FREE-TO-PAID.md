# Flow: Free to Paid Conversion

## Overview

The journey from first visit to paid customer, with the new 3-tier model:

- **Demo** (browser) → Samples only
- **Free** (installed PWA) → Upload files, session-only
- **Licensed** (installed PWA) → Save projects, €99/year

---

## Funnel Stages

```
AWARENESS → DEMO → INSTALL → VALUE → CONVERSION → RETENTION

   │          │       │        │         │           │
   ▼          ▼       ▼        ▼         ▼           ▼
 Website    /app    Install   Upload    Save      Renewal
  visit    demo     PWA      own data  blocked
```

---

## Stage 1: Awareness

### Entry Points

| Source             | Landing Page          | Goal                  |
| ------------------ | --------------------- | --------------------- |
| Organic search     | Home or relevant page | Learn about VaRiScout |
| #VariationScouting | Resources page        | Watch, then try       |
| AppSource          | Product page          | Understand, then try  |
| LinkedIn           | Home                  | Learn, then try       |
| Direct referral    | Home or /app          | Try immediately       |

### Key Actions

- Read value proposition
- Watch demo video
- Browse features
- Check pricing

### Conversion Goal

Click "Try Demo" → Enter app (browser demo)

---

## Stage 2: Demo (Browser)

### Demo Experience

```
FIRST VISIT TO /app (BROWSER)
─────────────────────────────────────────────────────

User arrives in browser:
  1. See sample datasets available
  2. Explore 16 pre-loaded samples
  3. Experience all chart types
  4. Click to filter, copy charts
  5. Realize: "I want to use my own data"
  6. See prompt: "Install to upload your data"

TIME TO VALUE: < 2 minutes with samples
```

### Demo State Design

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📊 VaRiScout Demo                      │
│                                                     │
│         Explore with sample datasets               │
│                                                     │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│    │ Coffee  │ │ Pizza   │ │ Bottleneck│           │
│    │ Sample  │ │ Delivery│ │  Case   │            │
│    └─────────┘ └─────────┘ └─────────┘            │
│                                                     │
│         ─────── or ───────                          │
│                                                     │
│         [Install to Upload Your Data]              │
│                                                     │
│    Your data never leaves your device              │
│    Installation is free • 2 clicks                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Why Demo First?

| Benefit           | Explanation                             |
| ----------------- | --------------------------------------- |
| Immediate value   | User sees charts instantly with samples |
| No commitment     | Explore freely without installing       |
| Trust building    | User understands the tool before upload |
| Privacy messaging | "Install to upload" explains why        |

---

## Stage 3: Install (Free Tier)

### Install Prompt

When user tries to upload in browser, or clicks "Install to upload":

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ⬇️ Install VaRiScout (Free)                        │
│                                                     │
│  To upload your own data, install the app.         │
│  This keeps your data 100% on your device.         │
│                                                     │
│  ✓ Upload CSV/Excel files                          │
│  ✓ Manual data entry                               │
│  ✓ Full analysis tools                             │
│  ✓ Works offline                                   │
│                                                     │
│  [Install App]                                      │
│                                                     │
│  Free • No signup • 2 clicks                       │
│                                                     │
│  Note: Session-only (projects don't persist)       │
│  Upgrade to Licensed (€99/year) to save work       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Installation Flow

```
User clicks "Install App"
         │
         ▼
Browser shows native install prompt
         │
         ▼
User confirms installation
         │
         ▼
PWA installs (2-3 seconds)
         │
         ▼
App launches in standalone window
         │
         ▼
User can now upload files
```

---

## Stage 4: Value Discovery (Free Tier)

### First Value Moment

User realizes: "This is useful for me with MY data."

Triggers:

- Sees a pattern they recognize in their data
- Successfully answers a question
- Copies a chart for a real presentation
- Saves time vs. their current tool

### Friction Points to Address

| Friction                              | Solution                               |
| ------------------------------------- | -------------------------------------- |
| "I can't upload in browser"           | Clear "Install to upload" messaging    |
| "I don't know what columns to select" | Smart auto-detection                   |
| "The chart isn't what I expected"     | Clear empty states, help text          |
| "I need to do this again next week"   | **Upgrade prompt when trying to save** |

### Engagement Signals

Track:

- Time in app > 5 minutes (invested enough to want to save)
- Multiple filter clicks
- Copy action
- Export action
- **Save attempt (primary upgrade trigger)**
- Return visit

---

## Stage 5: Conversion (Free → Licensed)

### Upgrade Triggers

| Trigger                   | Moment                       | Priority     | Message                           |
| ------------------------- | ---------------------------- | ------------ | --------------------------------- |
| **Save project attempt**  | User clicks Save             | 🔴 Primary   | "Save projects with Licensed"     |
| **Browser/app close**     | Unsaved work in progress     | 🔴 Primary   | "Your work will be lost"          |
| **Template save attempt** | User tries to save template  | 🟡 Secondary | "Save templates with Licensed"    |
| **.vrs export attempt**   | User tries to export project | 🟡 Secondary | "Export .vrs files with Licensed" |
| Export with watermark     | After copy/export            | 🟢 Gentle    | "Remove watermark for €99/year"   |
| Repeat visit              | 3rd+ session with work       | 🟢 Gentle    | "Ready to save your work?"        |

### Upgrade Prompt Designs

```
SAVE PROJECT ATTEMPT (primary trigger)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  💾 Save Projects with Licensed                     │
│                                                     │
│  Your analysis will be lost when you close.        │
│  Upgrade to save and return to your work anytime.  │
│                                                     │
│  • Save unlimited projects                         │
│  • Export .vrs files to share                      │
│  • Save templates for repeat analyses              │
│  • Remove watermark from exports                   │
│  • Theme customization                             │
│                                                     │
│  €99/year                                          │
│                                                     │
│  [Upgrade Now]    [Maybe Later]                    │
│                                                     │
│  ☐ Don't show this again                           │
│                                                     │
│  ─────────────────────────────────────────────     │
│  💡 Need team features? Check out Power BI or      │
│     Azure options at variscout.com/pricing         │
│                                                     │
└─────────────────────────────────────────────────────┘


APP CLOSE WARNING (if work in progress)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  ⚠️ Your analysis will be lost                      │
│                                                     │
│  Free tier: projects don't persist.                │
│                                                     │
│  [Upgrade to Save — €99/year]                      │
│                                                     │
│  [Copy Charts First]    [Close Anyway]             │
│                                                     │
│  ☐ Don't warn me again                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Checkout Flow (In-App via Paddle + Instant Activation)

Checkout happens **inside the installed PWA** with **instant activation**.

```
IN-APP CHECKOUT (Instant Activation)
─────────────────────────────────────────────────────

User clicks "Upgrade" in PWA
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🔓 Unlock Licensed Version                         │
│                                                     │
│  Save projects • Export .vrs • No watermark         │
│                                                     │
│  €99/year                                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │     [Paddle Checkout Overlay]               │   │
│  │                                             │   │
│  │     Email: user@example.com                 │   │
│  │     Card: •••• •••• •••• 4242               │   │
│  │                                             │   │
│  │     [Pay €99]                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Paddle handles VAT automatically.                  │
│                                                     │
└─────────────────────────────────────────────────────┘
         │
         ▼ Paddle returns: { transactionId }
         │
PWA calls: POST api.variscout.com/license/activate
         │
         ▼ Server verifies → generates license (2 sec)
         │
License returned to PWA → stored in IndexedDB
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✓ You're all set!                                  │
│                                                     │
│  ✓ Save projects                                   │
│  ✓ Export .vrs files                               │
│  ✓ No watermark                                    │
│                                                     │
│  Backup sent to user@example.com                   │
│                                                     │
│  [Start Using VaRiScout]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### What Changes After Activation

| Feature           | Demo         | Free (Installed)  | Licensed        |
| ----------------- | ------------ | ----------------- | --------------- |
| Sample datasets   | ✅           | ✅                | ✅              |
| Upload CSV/Excel  | ❌           | ✅                | ✅              |
| Save projects     | ❌           | ❌                | ✅              |
| Export .vrs       | ❌           | ❌                | ✅              |
| Save templates    | ❌           | ❌                | ✅              |
| Export PNG/CSV    | ❌           | ✅ With watermark | ✅ No watermark |
| Copy to clipboard | ✅ Watermark | ✅ With watermark | ✅ No watermark |
| Works offline     | ❌           | ✅                | ✅              |

---

## Stage 6: Retention

### Engagement Triggers

| Trigger                | Action                                 |
| ---------------------- | -------------------------------------- |
| 30 days since last use | Email: "Your data is waiting"          |
| New feature released   | In-app notification                    |
| Renewal approaching    | Email: "Your subscription renews soon" |

### Renewal Flow

- Auto-renewal by default
- Email 7 days before
- Easy cancellation (no friction)
- Win-back flow if cancelled

---

## Updated User Journey

```
BEFORE (Old Model):
Homepage → Try Free → Upload file → Analyze → Save blocked → Upgrade

AFTER (New 3-Tier Model):
Homepage → Try Demo → Demo (samples) → "Install to upload" →
  Install PWA → Upload file → Analyze → Save blocked → Upgrade to Licensed
```

---

## Conversion Metrics

### Funnel Metrics

| Stage                         | Metric             | Target |
| ----------------------------- | ------------------ | ------ |
| Visit → Demo                  | Click-through rate | 20%    |
| Demo → Install                | Install rate       | 15%    |
| Install → First analysis      | Completion rate    | 70%    |
| First analysis → Save attempt | Intent signal      | 40%    |
| Save attempt → Upgrade        | Conversion rate    | 15%    |
| Overall: Visit → Licensed     | End-to-end         | 1-2%   |

### Time-Based

| Metric                             | Target                     |
| ---------------------------------- | -------------------------- |
| Time to first chart (demo)         | < 1 minute                 |
| Time to install decision           | 2-5 minutes exploring demo |
| Time to save attempt               | 5-30 minutes after install |
| Time to upgrade (from save prompt) | < 2 minutes                |

---

## Technical Requirements

### Tracking (Website)

- Page views (Plausible)
- CTA clicks (event tracking)
- External link clicks (AppSource, Azure)
- Attribution (source → app open)

### Tracking (PWA)

- Session tracking (anonymous)
- **Install tracking** (browser → installed PWA)
- Event tracking (filter, export, copy)
- **Save attempt tracking** (critical conversion signal)
- Upgrade prompt impressions (by type)
- Upgrade prompt responses (upgrade / dismiss)
- Conversion tracking (upgrade click, purchase complete)
- License activation

### Analytics Events Schema

```javascript
// Install events (new)
{ event: 'install_prompt_shown' }
{ event: 'install_completed' }
{ event: 'install_dismissed' }

// Prompt events
{ event: 'prompt_shown', type: 'save_attempt' | 'close_warning' | 'export' }
{ event: 'prompt_response', type: 'upgrade' | 'dismiss' | 'copy_first' }
{ event: 'prompt_dont_show_again', type: 'save_attempt' | 'close_warning' | 'export' }

// Conversion events
{ event: 'upgrade_started', trigger: 'save_attempt' | 'settings' | 'export' }
{ event: 'checkout_completed', source: 'paddle' }
{ event: 'license_activated' }
```

---

## Power BI / Azure Flow

For enterprise products, the flow is different:

```
POWER BI / AZURE CONVERSION
─────────────────────────────────────────────────────

Website: Learn about Power BI visuals
         │
         ▼
   Click "View in AppSource"
         │
         ▼
Microsoft AppSource: Procurement, billing
         │
         ▼
   Install to Power BI
         │
         ▼
   Licensed via Microsoft
```

We don't handle payment or licensing for Power BI and Azure products — Microsoft does through AppSource and Azure Marketplace.
