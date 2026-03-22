---
title: 'Flow 6: Azure App — First Analysis'
---

# Flow 6: Azure App — First Analysis

> Green Belt Gary runs his first analysis in the Azure App
>
> **Priority:** High - activation (first value moment)
>
> See also: [Journeys Overview](../index.md) | [Enterprise Evaluation](enterprise.md) | [How It Works](../../08-products/azure/how-it-works.md)

---

## Persona: Green Belt Gary

| Attribute         | Detail                                                     |
| ----------------- | ---------------------------------------------------------- |
| **Role**          | Quality Engineer, Green Belt certified                     |
| **Goal**          | Analyze production data without Excel friction             |
| **Knowledge**     | Knows SPC concepts, comfortable with data                  |
| **Pain points**   | Excel templates break, no drill-down, manual chart updates |
| **Entry point**   | Azure App URL (deployed by admin or self)                  |
| **Decision mode** | Hands-on — needs to see value in first 5 minutes           |

### What Gary is thinking:

- "IT deployed this — let me see if it actually works"
- "Can I just paste my data and get charts?"
- "Does it understand my column structure?"
- "Where does my analysis get saved?"

---

## Entry Points

| Source              | Arrives Via                          | Lands On         |
| ------------------- | ------------------------------------ | ---------------- |
| IT deployment email | App Service URL                      | EasyAuth sign-in |
| Colleague link      | Direct URL                           | EasyAuth sign-in |
| Teams tab           | Teams sideloaded app                 | App (SSO)        |
| Bookmark            | Browser bookmark after first session | App (SSO)        |

---

## Journey Flow

### Mermaid Flowchart

```mermaid
flowchart TD
    A[Open App Service URL] --> B[EasyAuth redirects to Azure AD]
    B --> C[Sign in with work account]
    C --> D{First-time consent?}
    D -->|Yes| E[Consent to User.Read<br/>+ Files.ReadWrite on Team plan]
    D -->|No| F[Session cookie set]
    E --> F
    F --> G[Empty state: Choose data source]
    G --> H{Data source}
    H -->|Sample| I[Load sample dataset]
    H -->|Paste| J[Paste from spreadsheet]
    H -->|Upload| K[Upload CSV or Excel file]
    H -->|Manual| K2[Enter data manually]
    I --> L[Dashboard renders immediately]
    J --> M[Column mapping auto-detected]
    K --> M
    K2 --> M
    M --> N[Select outcome + factors]
    N --> L
    L --> O[Explore: I-Chart, Boxplot, Stats, ANOVA]
    O --> P[First drill-down: click a filter]
    P --> Q[Charts recalculate, breadcrumbs appear]
    Q --> R[Click Save — persists to IndexedDB]
    R --> R2{Team plan?}
    R2 -->|Yes| S[Syncs to OneDrive — loads from cloud next day]
    R2 -->|No| S2[Standard plan: loads from local storage next day]
```

### First Analysis Journey

```mermaid
journey
    title First Analysis in Azure App
    section Login
      Open app URL: 4: User
      Azure AD sign-in: 4: User
      Consent to permissions: 3: User
    section Data
      See empty state: 4: User
      Choose sample or paste data: 5: User
      Column mapping auto-detected: 5: User
    section Analysis
      Dashboard renders: 5: User
      Read I-Chart and stats: 5: User
      First drill-down: 5: User
    section Save
      Click Save to persist: 5: User
      Return next day: 5: User
```

---

## Step-by-Step

### 1. First Login

The user opens the App Service URL (e.g., `https://variscout-contoso.azurewebsites.net`). EasyAuth intercepts the unauthenticated request and redirects to Azure AD sign-in.

- User signs in with their work Microsoft account
- First-time users consent to `User.Read` (display name); Team plan users also consent to `Files.ReadWrite` (OneDrive sync)
- A platform-managed session cookie is set — no MSAL library, no token in browser storage
- The app reads user info from `/.auth/me`

See [Authentication](../../08-products/azure/authentication.md) for technical details.

### 2. Empty State

After login, the app shows an empty editor with four options:

| Option         | Description                                         |
| -------------- | --------------------------------------------------- |
| Sample dataset | Pre-loaded data (coffee, bottleneck, sachets, etc.) |
| Paste data     | Paste tab- or comma-separated text from clipboard   |
| Upload file    | Upload CSV or Excel file (parsed in-browser)        |
| Manual entry   | Type values directly into a spreadsheet-style grid  |

For a first-time user, **sample datasets** are the fastest path to seeing value. Each sample includes pre-computed stats and meaningful variation patterns.

### 3. Column Mapping

If pasting or uploading, the app:

1. Parses the text/file with `parseText()` / `parseFile()` (in-browser, no server)
2. Auto-detects column types via `detectColumns()` — numeric, categorical, date
3. Presents the **ColumnMapping** screen: select one outcome (numeric) and up to 6 factors (categorical)
4. Click "Analyze" to proceed

### 4. Dashboard

The dashboard renders four views simultaneously:

- **I-Chart** — individual values over time with control limits
- **Boxplot** — distribution by factor levels (if factors selected)
- **Stats panel** — mean, sigma, Cp, Cpk, sample count
- **ANOVA** — F-statistic, p-value, eta-squared (if factors present)

All computation happens in-browser via `@variscout/core` stats engine.

### 5. First Drill-Down

Gary clicks a bar in the Boxplot (e.g., "Machine A"). The dashboard:

- Applies a filter (breadcrumb appears: `Machine A`)
- Recalculates all charts for the filtered subset
- Shows the variation contribution (eta-squared %) in the filter chip
- Enables deeper drilling into sub-factors

This is the "aha moment" — seeing how variation hides inside aggregated data.

### 6. Save and Return

Gary clicks **Save** in the editor header to persist his work:

1. **IndexedDB** — immediate local save (offline-first, all plans)
2. **OneDrive** _(Team plan only)_ — syncs to `OneDrive/VariScout/Projects/` as a `.vrs` file (when online)

On **Standard plan**, saves are local-only (IndexedDB). The analysis persists on the same device/browser but does not sync to the cloud.

On **Team plan**, the header shows sync status feedback (saved, syncing, offline). Next day, Gary opens the app and his analysis loads from OneDrive. No setup needed — EasyAuth session persists.

Save is explicit on both plans — unsaved work is lost if the tab closes.

See [OneDrive Sync](../../08-products/azure/onedrive-sync.md) for Team plan sync details.

---

## Platform-Specific Notes

| Aspect           | Azure App behavior                                     |
| ---------------- | ------------------------------------------------------ |
| Authentication   | EasyAuth (platform-level, no library code)             |
| Data input       | Upload, paste, or manual entry — all parsed in-browser |
| Factor limit     | Up to 6 factors, can add/change during analysis        |
| Row limit        | 250,000 rows                                           |
| Persistence      | IndexedDB (all plans) + OneDrive sync (Team plan only) |
| Offline          | Full functionality, queues changes for sync            |
| Performance Mode | Available (multi-channel Cpk analysis)                 |
| Branding         | No VariScout branding on charts (enterprise tier)      |

---

## Success Metrics

| Metric                              | Target  |
| ----------------------------------- | ------- |
| Login → first chart rendered        | < 3 min |
| First drill-down in first session   | > 60%   |
| Return within 7 days                | > 50%   |
| Analysis saved to OneDrive (Team)   | > 80%   |
| Sample dataset chosen (first visit) | Track   |

---

## How Users Get Here

The Azure App first-analysis experience follows different acquisition flows:

| Prior Journey                          | Transition                                     | What the user already knows                         |
| -------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| [Enterprise Evaluation](enterprise.md) | IT deploys via Marketplace → Gary gets app URL | Knows the product value prop, expects SSO           |
| [PWA (free tool)](return-visitor.md)   | Outgrows PWA limits → team purchases Azure App | Knows drill-down, expects persistence + file upload |
| Direct referral                        | Colleague shares app URL                       | May know nothing — empty state must onboard         |

### Coming from the PWA

Users who graduated from the free PWA will notice key differences:

- **File upload** — CSV and Excel upload, not just paste and manual entry
- **Save and sync** — analyses persist locally; Team plan adds OneDrive sync (PWA is session-only)
- **Performance Mode** — multi-channel Cpk analysis (not available in PWA)
- **6 factors** — up to 6 factors, manageable during analysis (PWA: 3, set at start only)
- **No branding** — charts have no VariScout watermark

The analysis workflow (drill-down, ANOVA, findings) is identical — skills transfer directly.

---

## First Investigation

After the first drill-down, Gary has identified a factor that explains significant variation. This is a natural moment to create the first finding — capturing the observation while the context is fresh.

### Pinning an Observation

1. **Right-click a Boxplot category** (e.g., "Machine A") → select **"Add observation"** from the context menu
2. A **Finding** is created automatically with the filter context, chart type, and category name as source metadata
3. The Finding appears in the **Findings panel** sidebar (slide-in on the right edge)
4. Status starts at **Observed** — the pattern has been noticed but not yet investigated

### Starting an Investigation

5. Click the Finding to open it → change status to **Investigating**
6. **Create a hypothesis:** type the suspected cause (e.g., "Machine A has worn bearings") — the hypothesis auto-links to the current factor
7. _(If AI enabled)_ The **NarrativeBar** updates to reflect the investigation state; clicking **"Ask →"** opens CoScout with the finding's context pre-loaded

For a first-time user, this brief interaction introduces the investigation workflow without overwhelming. The finding persists in IndexedDB (and syncs to OneDrive on Team plan), so Gary can return to it later.

> **Full investigation lifecycle:** Once comfortable with findings, see [Azure Daily Use — Investigation Workflow](azure-daily-use.md#investigation-workflow) for the complete 4-phase journey from discovery through verification.

---

## See Also

- [Azure App Overview](../../08-products/azure/index.md)
- [How It Works](../../08-products/azure/how-it-works.md) — end-to-end architecture
- [Authentication](../../08-products/azure/authentication.md) — EasyAuth details
- [OneDrive Sync](../../08-products/azure/onedrive-sync.md) — persistence flow
- [Enterprise Evaluation](enterprise.md) — how Olivia evaluated before Gary got access
- [Azure Daily Use](azure-daily-use.md) — Gary's workflow after first analysis
- [Return Visitor](return-visitor.md) — PWA return experience and upgrade triggers
