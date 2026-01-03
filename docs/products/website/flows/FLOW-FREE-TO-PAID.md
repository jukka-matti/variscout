# Flow: Free to Paid Conversion

## Overview

The journey from first visit to paid customer.

---

## Funnel Stages

```
AWARENESS → TRIAL → VALUE → CONVERSION → RETENTION

   │          │       │         │           │
   ▼          ▼       ▼         ▼           ▼
 Website    /app    First    Purchase    Renewal
  visit     use    insight   decision
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

Click "Try Free" → Enter app

---

## Stage 2: Trial

### First App Experience

```
FIRST VISIT TO /app
─────────────────────────────────────────────────────

Option A: Has own data
  1. See empty state with upload prompt
  2. Drag/drop CSV
  3. Select columns
  4. See charts

Option B: No data ready
  1. See empty state
  2. Click "Try Sample Data"
  3. Sample loads automatically
  4. Explore pre-configured analysis

TIME TO VALUE: < 2 minutes
```

### Empty State Design

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📊 Ready to Scout?                     │
│                                                     │
│         Drop your CSV here to start                 │
│                                                     │
│         ─────── or ───────                          │
│                                                     │
│         [Try with Sample Data]                      │
│                                                     │
│    Supports: CSV, Excel (.xlsx, .xls)              │
│    Your data never leaves your browser              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sample Data Experience

Pre-configured dataset that demonstrates:

- I-Chart with visible pattern
- Boxplot with clear difference between groups
- Pareto with 80/20 distribution
- Filter interaction

User can immediately:

- See all charts
- Click to filter
- Copy charts
- Experience the value

---

## Stage 3: Value Discovery

### First Value Moment

User realizes: "This is useful for me."

Triggers:

- Sees a pattern they recognize in their data
- Successfully answers a question
- Copies a chart for a real presentation
- Saves time vs. their current tool

### Friction Points to Address

| Friction                              | Solution                               |
| ------------------------------------- | -------------------------------------- |
| "I don't have data ready"             | Sample data option                     |
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

## Stage 4: Conversion

### Upgrade Triggers

| Trigger                   | Moment                       | Priority     | Message                             |
| ------------------------- | ---------------------------- | ------------ | ----------------------------------- |
| **Save project attempt**  | User clicks Save             | 🔴 Primary   | "Save projects with Individual"     |
| **Browser close**         | Unsaved work in progress     | 🔴 Primary   | "Your work will be lost"            |
| **Template save attempt** | User tries to save template  | 🟡 Secondary | "Save templates with Individual"    |
| **.vrs export attempt**   | User tries to export project | 🟡 Secondary | "Export .vrs files with Individual" |
| Export with watermark     | After copy/export            | 🟢 Gentle    | "Remove watermark for €49/year"     |
| Repeat visit              | 3rd+ session with work       | 🟢 Gentle    | "Ready to save your work?"          |

### Why Save-Based Triggers Work

```
USER PSYCHOLOGY
─────────────────────────────────────────────────────────────────

1. User spends 15-30 minutes on analysis
2. Sees insights, wants to keep them
3. Clicks "Save Project"
4. Prompt: "This requires Individual"
5. User thinks: "I just invested 30 minutes... €49 is worth it"

vs.

Old model:
1. User exports chart
2. Sees watermark
3. User thinks: "I'll just crop it out"
```

### Upgrade Prompt Designs

```
SAVE PROJECT ATTEMPT (primary trigger)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  💾 Save Projects with Individual                   │
│                                                     │
│  Your analysis will be lost when you close.        │
│  Upgrade to save and return to your work anytime.  │
│                                                     │
│  • Save unlimited projects                         │
│  • Export .vrs files to share                      │
│  • Save templates for repeat analyses              │
│  • Remove watermark from exports                   │
│                                                     │
│  €49/year                                          │
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


BROWSER CLOSE WARNING (if work in progress)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  ⚠️ Your analysis will be lost                      │
│                                                     │
│  Free version: projects don't persist.             │
│                                                     │
│  [Upgrade to Save — €49/year]                      │
│                                                     │
│  [Copy Charts First]    [Close Anyway]             │
│                                                     │
│  ☐ Don't warn me again                             │
│                                                     │
└─────────────────────────────────────────────────────┘


AFTER EXPORT (gentle upsell)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│  ✓ Copied to clipboard                              │
│                                                     │
│  💡 Upgrade to save projects and remove watermark   │
│                                                     │
│  [Learn More]  [Dismiss]  ☐ Don't show again       │
└─────────────────────────────────────────────────────┘


SETTINGS PAGE (permanent option)
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│  Settings                                           │
│                                                     │
│  Account                                            │
│  ────────────────────────────────────────────      │
│  Status: Free tier                                  │
│                                                     │
│  Free tier limitations:                             │
│  • Projects don't persist (session only)           │
│  • Watermark on exports                            │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  Upgrade to Individual — €49/year          │     │
│  │                                            │     │
│  │  ✓ Save projects     ✓ No watermark       │     │
│  │  ✓ Export .vrs       ✓ Save templates     │     │
│  │                                            │     │
│  │  [Upgrade Now]                             │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  Other Options                                      │
│                                                     │
│  For teams and enterprises, we offer:              │
│  • Power BI visuals (€399 - €1,999/year)          │
│  • Azure self-hosted deployment (€999/year)        │
│                                                     │
│  [View all options at variscout.com/pricing]       │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  Prompt Preferences                                 │
│  ☐ Show upgrade prompts                            │
│  ☐ Show browser close warnings                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### "Don't Show Again" Behavior

| Preference           | Stored In          | Effect                           |
| -------------------- | ------------------ | -------------------------------- |
| `hideUpgradePrompts` | IndexedDB settings | Suppresses save/export prompts   |
| `hideCloseWarning`   | IndexedDB settings | Suppresses browser close warning |

**Reset option**: Always available in Settings under "Prompt Preferences"

**Important**: Settings page always shows upgrade option regardless of prompt preferences — user can always upgrade if they change their mind.

### Checkout Flow (In-App via Paddle + Instant Activation)

Checkout happens **inside the PWA** with **instant activation** — no waiting for email.

```
IN-APP CHECKOUT (Instant Activation)
─────────────────────────────────────────────────────

User clicks "Upgrade" in PWA
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🔓 Unlock Full Version                             │
│                                                     │
│  Save projects • Export .vrs • No watermark         │
│                                                     │
│  €49/year                                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │     [Paddle Checkout Overlay]               │   │
│  │                                             │   │
│  │     Email: user@example.com                 │   │
│  │     Card: •••• •••• •••• 4242               │   │
│  │                                             │   │
│  │     [Pay €49]                               │   │
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

### Why Instant Activation?

| Old Flow (Email)                        | New Flow (Instant) |
| --------------------------------------- | ------------------ |
| Pay → Wait → Check email → Copy → Paste | Pay → Done         |
| 1-5 minutes                             | 2-3 seconds        |
| Spam folder risk                        | No risk            |
| User might close browser                | Immediate          |
| Friction                                | Delight ✨         |

### Email as Backup

Email is still sent (in background) for:

- Setting up on new devices
- Recovering after browser data cleared
- Invoice/receipts for company records

### What Changes After Activation

| Feature           | Before (Free)     | After (Individual) |
| ----------------- | ----------------- | ------------------ |
| Save projects     | ❌ Blocked        | ✅ Enabled         |
| Export .vrs       | ❌ Blocked        | ✅ Enabled         |
| Save templates    | ❌ Blocked        | ✅ Enabled         |
| Export PNG/CSV    | ✅ With watermark | ✅ No watermark    |
| Copy to clipboard | ✅ With watermark | ✅ No watermark    |

### Why In-App Checkout?

| Reason                        | Benefit                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| Data stays local              | User was just analyzing sensitive data — don't redirect away |
| Context preserved             | They're already in the tool, friction-free                   |
| Instant activation            | Pay → features unlock in 2 seconds                           |
| No website payment complexity | Website is just static marketing                             |
| Paddle handles VAT            | No tax compliance on our end                                 |

### Website's Role

The website **does not** handle checkout. Instead:

- Pricing page is **informational** — shows prices, explains how buying works
- All CTAs lead to `/app` (open the tool) or Microsoft AppSource
- Upgrade prompts and Paddle checkout live **inside the PWA only**

```
WEBSITE                              PWA
────────────────────                ────────────────────
• Explain value                     • Analyze data
• Show pricing                      • Experience value
• Explain how buying works          • Try to save → upgrade prompt
• Link to /app                      • Pay via Paddle overlay
• Link to AppSource                 • Instant activation (2 sec)
                                    • Done! Features unlocked
```

---

## Stage 5: Retention

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

## Conversion Metrics

### Funnel Metrics

| Stage                         | Metric             | Target |
| ----------------------------- | ------------------ | ------ |
| Visit → App                   | Click-through rate | 20%    |
| App → First analysis          | Completion rate    | 60%    |
| First analysis → Save attempt | Intent signal      | 40%    |
| Save attempt → Upgrade        | Conversion rate    | 15%    |
| Overall: Visit → Paid         | End-to-end         | 2-3%   |

### Save-Based Conversion Signals

| Signal                       | What It Means                 | Action                 |
| ---------------------------- | ----------------------------- | ---------------------- |
| Time in app > 5 min          | Invested, likely to want save | Prepare upgrade prompt |
| Multiple filter interactions | Exploring, finding value      | Good sign              |
| Save button click            | Strong intent                 | Show upgrade prompt    |
| Browser close with work      | Critical moment               | Show warning prompt    |
| Return visit                 | Repeat interest               | Gentle reminder        |

### Time-Based

| Metric                             | Target                     |
| ---------------------------------- | -------------------------- |
| Time to first chart                | < 2 minutes                |
| Time to save attempt               | 5-30 minutes               |
| Time to upgrade (from save prompt) | < 2 minutes                |
| Time to paid conversion            | Same session or 1-3 visits |

---

## A/B Testing Opportunities

| Test                                 | Hypothesis                                        |
| ------------------------------------ | ------------------------------------------------- |
| Save button visibility               | More prominent → more upgrade prompts             |
| Prompt copy: features vs. loss       | "Save your work" vs. "Don't lose your work"       |
| Prompt timing                        | After 5 min vs. only on save click                |
| Browser close warning                | With warning → higher conversion                  |
| Price in prompt                      | Show €49 → higher conversion (low perceived cost) |
| "Copy first" option in close warning | Reduces frustration, maintains goodwill           |

---

## Technical Requirements

### Tracking (Website)

- Page views (Plausible)
- CTA clicks (event tracking)
- External link clicks (AppSource, Azure)
- Attribution (source → app open)

### Tracking (PWA)

- Session tracking (anonymous)
- Event tracking (filter, export, copy)
- **Save attempt tracking** (critical conversion signal)
- **Browser close with unsaved work** (trigger for warning)
- Upgrade prompt impressions (by type)
- Upgrade prompt responses (upgrade / dismiss / copy first)
- **"Don't show again" clicks** (measure opt-out rate)
- **Team options link clicks** (Power BI/Azure interest)
- Conversion tracking (upgrade click, purchase complete)
- License activation

### Analytics Events Schema

```javascript
// Prompt events
{ event: 'prompt_shown', type: 'save_attempt' | 'close_warning' | 'export' }
{ event: 'prompt_response', type: 'upgrade' | 'dismiss' | 'copy_first' }
{ event: 'prompt_dont_show_again', type: 'save_attempt' | 'close_warning' | 'export' }
{ event: 'team_options_click', location: 'prompt' | 'settings' }

// Conversion events
{ event: 'upgrade_started', trigger: 'save_attempt' | 'settings' | 'export' }
{ event: 'checkout_completed', source: 'paddle' }
{ event: 'license_activated' }
```

### Storage (PWA)

- IndexedDB for projects, settings, license
- No server-side user data
- License validation offline via signed keys

### Payment (PWA Only)

- **Paddle** for in-app checkout
- License key delivery via email (Resend)
- Offline key validation in app

> See `variscout-pwa/technical/TECH-LICENSING.md` for full implementation.

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
