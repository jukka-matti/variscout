---
title: 'Azure App Testing Plan — rdmaic Organization'
---

# Azure App Testing Plan — rdmaic Organization

Internal testing plan for VariScout Azure App before Azure Marketplace submission. Covers browser-based App Service testing and Microsoft Teams tab integration.

**Target environment:** rdmaic Azure subscription
**App type:** Azure App Service (browser SPA) + Teams personal tab
**Auth:** EasyAuth (App Service Authentication) with Entra ID

---

## A. Prerequisites Checklist

### Azure Subscription

- [ ] rdmaic Azure subscription active with Contributor access
- [ ] Azure CLI installed (`az --version`)
- [ ] Logged in (`az login`)

### Entra ID App Registration

Create an App Registration before deploying the app. EasyAuth requires customer-provided credentials (Managed Applications cannot create App Registrations in the customer's tenant).

1. **Azure Portal → Entra ID → App registrations → New registration**
2. **Name:** `VariScout Test`
3. **Supported account types:** "Accounts in this organizational directory only" (single tenant)
4. **Redirect URI:** Web platform →
   ```
   https://<app-name>.azurewebsites.net/.auth/login/aad/callback
   ```
   Replace `<app-name>` with the App Service name you'll use during deployment (e.g., `variscout-test-rdmaic`).
5. **Register**, then copy the **Application (client) ID**

**API Permissions** (Microsoft Graph → Delegated):

- `User.Read` — sign-in and read user profile (both plans)
- `Files.ReadWrite.All` — read and write OneDrive + SharePoint files (Team plan only)
- `Channel.ReadBasic.All` — resolve channel SharePoint drives (Team plan only)
- `People.Read` — people picker for @mentions (Team plan only)
- `ChannelMessage.Send` — post findings to Teams channel (Team plan only)
- Standard plan: only `User.Read` needed, no admin consent required
- Team plan: admin consent required for `Files.ReadWrite.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`

**Client Secret:**

1. Certificates & secrets → Client secrets → New client secret
2. Description: `VariScout EasyAuth Test`
3. Expiration: 6 months (sufficient for testing)
4. Copy the secret value immediately — it won't be shown again

### Local Build

```bash
# Install dependencies
pnpm install

# Build all packages (core, charts, hooks, ui, data) + Azure app
pnpm build

# Verify Azure app built successfully
ls apps/azure/dist/
```

The build output at `apps/azure/dist/` is what gets deployed.

---

## B. Deployment Guide

Two approaches: ARM template (mirrors Marketplace flow) or direct zip deploy (simpler for testing).

### Option 1: Direct Zip Deploy (recommended for testing)

Simpler setup — deploys the built app directly to App Service without the full ARM template.

```bash
# 1. Create resource group
az group create \
  --name rg-variscout-test \
  --location westeurope

# 2. Create App Service Plan (B1 is sufficient for testing)
az appservice plan create \
  --name variscout-test-plan \
  --resource-group rg-variscout-test \
  --sku B1 \
  --is-linux

# 3. Create Web App
az webapp create \
  --name variscout-test-rdmaic \
  --resource-group rg-variscout-test \
  --plan variscout-test-plan \
  --runtime "NODE|22-lts"

# 4. Configure app settings
az webapp config appsettings set \
  --name variscout-test-rdmaic \
  --resource-group rg-variscout-test \
  --settings \
    VITE_LICENSE_TIER="enterprise" \
    VITE_VARISCOUT_PLAN="team" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="false"

# 5. Set startup command (Node server.js, not PM2)
az webapp config set \
  --name variscout-test-rdmaic \
  --resource-group rg-variscout-test \
  --startup-file "node server.js"

# 6. Configure EasyAuth (authsettingsV2)
#    Store the client secret as an app setting first
az webapp config appsettings set \
  --name variscout-test-rdmaic \
  --resource-group rg-variscout-test \
  --settings MICROSOFT_PROVIDER_AUTHENTICATION_SECRET="<YOUR_CLIENT_SECRET>"

#    Then configure authsettingsV2 via REST API (most reliable method)
az rest --method PUT \
  --uri "/subscriptions/{subscriptionId}/resourceGroups/rg-variscout-test/providers/Microsoft.Web/sites/variscout-test-rdmaic/config/authsettingsV2?api-version=2024-04-01" \
  --body '{
    "properties": {
      "platform": { "enabled": true },
      "globalValidation": {
        "requireAuthentication": true,
        "unauthenticatedClientAction": "RedirectToLoginPage",
        "redirectToProvider": "azureactivedirectory",
        "excludedPaths": ["/health"]
      },
      "identityProviders": {
        "azureActiveDirectory": {
          "enabled": true,
          "registration": {
            "openIdIssuer": "https://login.microsoftonline.com/<YOUR_TENANT_ID>/v2.0",
            "clientId": "<YOUR_CLIENT_ID>",
            "clientSecretSettingName": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
          },
          "login": {
            "loginParameters": ["scope=openid profile email User.Read Files.ReadWrite Files.ReadWrite.All Channel.ReadBasic.All People.Read ChannelMessage.Send"]
          }
        }
      },
      "login": {
        "tokenStore": { "enabled": true }
      }
    }
  }'

# 7. Build, package, and deploy
#    Package must include server.js + package.json (not just dist/)
mkdir -p deploy/dist
cp -r apps/azure/dist/* deploy/dist/
cp apps/azure/server.js deploy/server.js
echo '{"type":"module","scripts":{"start":"node server.js"}}' > deploy/package.json
cd deploy && zip -r ../variscout-azure.zip . && cd ..

az webapp deploy \
  --name variscout-test-rdmaic \
  --resource-group rg-variscout-test \
  --src-path variscout-azure.zip \
  --type zip

# Cleanup
rm -rf deploy variscout-azure.zip
```

### Option 2: ARM Template Deploy (mirrors Marketplace)

Uses `infra/mainTemplate.json` — tests the actual deployment experience customers will have.

```bash
# 1. Create resource group
az group create \
  --name rg-variscout-test \
  --location westeurope

# 2. Build the deployment zip (server.js + package.json + dist/)
mkdir -p deploy/dist
cp -r apps/azure/dist/* deploy/dist/
cp apps/azure/server.js deploy/server.js
echo '{"type":"module","scripts":{"start":"node server.js"}}' > deploy/package.json
cd deploy && zip -r ../variscout-azure.zip . && cd ..

# 3. Upload the zip to a storage account
# The ARM template expects a publicly accessible URL for WEBSITE_RUN_FROM_PACKAGE
az storage account create \
  --name variscoutreleases \
  --resource-group rg-variscout-test \
  --sku Standard_LRS

az storage container create \
  --name releases \
  --account-name variscoutreleases \
  --public-access blob

az storage blob upload \
  --account-name variscoutreleases \
  --container-name releases \
  --name variscout-azure-test.zip \
  --file variscout-azure.zip

# 4. Deploy ARM template
az deployment group create \
  --resource-group rg-variscout-test \
  --template-file infra/mainTemplate.json \
  --parameters \
    appName="variscout-test-rdmaic" \
    variscoutPlan="team" \
    clientId="<YOUR_CLIENT_ID>" \
    clientSecret="<YOUR_CLIENT_SECRET>" \
    packageUrl="https://variscoutreleases.blob.core.windows.net/releases/variscout-azure-test.zip"
```

### Verify Deployment

1. Visit `https://variscout-test-rdmaic.azurewebsites.net`
2. Expected: redirect to Entra ID login
3. After sign-in: app loads with empty state (no data)
4. Check header shows authenticated user name

---

## C. Browser Test Scenarios (Standalone)

Test the app at `https://<app-name>.azurewebsites.net` in a desktop browser.

| #   | Scenario                  | Steps                                                                                                                      | What to Record                                                                           |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | **Authentication**        | Visit app URL → redirected to Entra ID → sign in → see user name in header                                                 | Redirect speed, error messages, user display name correctness                            |
| 2   | **Sample data loading**   | Click a sample dataset in the empty-state Editor → charts render                                                           | Load time, chart correctness, all 4 chart types visible                                  |
| 3   | **Paste data input**      | Editor → Add Data → Paste → paste CSV text → column mapping → analysis                                                     | Tab/comma detection accuracy, column type detection, mapping UX                          |
| 4   | **File upload (CSV)**     | Editor → Add Data → Upload File → select CSV → column mapping → analysis                                                   | Parse correctness, column detection, large file handling (try 10K+ rows)                 |
| 5   | **Manual entry**          | Editor → Add Data → Manual Entry → create columns → add rows → analyze                                                     | Input UX, validation feedback, performance mode toggle                                   |
| 6   | **I-Chart analysis**      | Load data with spec limits → verify control limits, Nelson rule markers, dot colors                                        | Blue=in-control, red=violation, correct UCL/LCL, Nelson sequence overlays                |
| 7   | **Boxplot analysis**      | Drill by category factor → verify groups, toggle violin mode, try sorting (name/mean/spread), contribution labels          | Visual quality, violin overlay, sort correctness, contribution % labels                  |
| 8   | **Pareto analysis**       | Verify Cpk ranking chart → click bar to drill into channel                                                                 | Chart readability, bar ordering (worst first), drill interaction                         |
| 9   | **Capability (Cp/Cpk)**   | Set spec limits via SpecEditor popover → verify histogram + probability plot                                               | SpecEditor UX, Cp/Cpk calculation correctness                                            |
| 10  | **ANOVA results**         | Drill by factor → check F-statistic, p-value, η² in ANOVA panel                                                            | Statistical accuracy (spot-check against known dataset values)                           |
| 11  | **Performance Mode**      | Load multi-column CSV → PerformanceSetupPanel → select measures → Cpk scatter, boxplot, Pareto                             | Column detection, measure selection, channel drill navigation                            |
| 12  | **Filter navigation**     | Apply factor filters → verify breadcrumbs → navigate back → apply multi-select                                             | Filter chips display, variation % contribution, back navigation, cumulative scope        |
| 13  | **Findings panel**        | Open findings panel → pin observation from chart → change status (observed→investigating→analyzed) → add comment → What-If | Findings list rendering, status transitions, comment persistence, What-If slider         |
| 14  | **OneDrive sync**         | Save project → check OneDrive/VariScout/Projects folder → close tab → reopen → verify data loads                           | Sync speed, file appears in OneDrive, data persists across sessions                      |
| 15  | **Theme switching**       | Settings → toggle dark/light/system → verify all views adapt                                                               | Color consistency across charts, panels, editor; chrome color adaptation                 |
| 16  | **Chart export**          | Copy chart to clipboard → paste in document; download PNG; download SVG                                                    | Export quality, correct dimensions (see chart export sizes), branding hidden (paid tier) |
| 17  | **Settings persistence**  | Change display options (Y-axis lock, show specs, chart text size) → reload → verify retained                               | localStorage reliability, all toggle states restored                                     |
| 18  | **Factor management**     | Click "Factors" in nav bar → ColumnMapping opens in edit mode → add/remove factor → Apply → verify filter cleanup          | State consistency, orphaned filters cleaned, cancel preserves data                       |
| 19  | **Data table editing**    | Open data table → edit cell values → verify charts update                                                                  | Inline editing UX, bi-directional sync, undo behavior                                    |
| 20  | **Chart annotations**     | Right-click boxplot/Pareto → highlight + add note; right-click I-Chart → add free-floating note                            | Context menu positioning, annotation persistence, drag-to-reposition                     |
| 21  | **CSV export**            | Editor header → export CSV → open in Excel                                                                                 | Data completeness, column ordering, encoding (UTF-8 with special characters)             |
| 22  | **Editable chart titles** | Click chart title → edit text → verify persistence                                                                         | Inline editing UX, title saved across sessions                                           |
| 23  | **Presentation mode**     | Enter presentation mode → full-screen chart overlay → navigate charts                                                      | Full-screen rendering, keyboard navigation, exit behavior                                |

---

## D. Teams Test Scenarios

### Prerequisite: Generate and Upload Manifest

The Azure app includes an admin page (`AdminTeamsSetup.tsx`) that generates a Teams manifest `.zip` file containing the app configuration and icons.

| #   | Scenario                   | Steps                                                                                          | What to Record                                                                                             |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Generate manifest**      | Navigate to admin/Teams setup page → download `.zip` → inspect contents (manifest.json, icons) | Manifest correctness, icon presence (color + outline), app ID matches                                      |
| 2   | **Upload to Teams**        | Teams Admin Center → Manage apps → Upload → select the `.zip` → verify app appears in catalog  | Upload process, any validation errors, app listing appearance                                              |
| 3   | **Open in Teams**          | Teams → Apps → Built for your org → open VariScout as personal tab                             | Load time, iframe rendering, no console errors                                                             |
| 4   | **Auth in Teams**          | First open → expect login redirect to `*.azurewebsites.net` → sign in via Entra ID             | SSO behavior (note: `*.azurewebsites.net` domains require one-time redirect, no seamless SSO), redirect UX |
| 5   | **Full workflow in Teams** | Load sample → drill by factor → set specs → export chart                                       | Iframe constraints, scrolling behavior, popup/modal rendering                                              |
| 6   | **Responsive in Teams**    | Resize Teams window → check chart responsiveness → try narrow sidebar mode                     | Layout adaptation, breakpoints, chart readability at small sizes                                           |
| 7   | **Findings popout**        | Open findings panel → click popout to new window                                               | `window.open` behavior in Teams (may be blocked), fallback behavior                                        |
| 8   | **OneDrive sync in Teams** | Save project in Teams tab → verify appears in OneDrive                                         | Same Graph API flow as standalone, verify token available                                                  |

---

## E. Evaluation Template

Fill this form during and after testing. Rate items 1–5 (1=poor, 5=excellent) where applicable.

### Deployment Experience

| Criterion                               | Rating / Answer |
| --------------------------------------- | --------------- |
| Time to deploy (minutes)                |                 |
| Clarity of deployment instructions      | /5              |
| Issues encountered                      |                 |
| App Registration creation ease          | /5              |
| ARM template deploy success (if tested) | yes / no        |
| Portal wizard usability (if tested)     | /5              |

### Authentication & Security

| Criterion                                                       | Rating / Answer |
| --------------------------------------------------------------- | --------------- |
| Login flow smoothness                                           | /5              |
| Token refresh behavior (any interruptions during long session?) |                 |
| Logout → re-login works cleanly?                                | yes / no        |
| User display name correct in header?                            | yes / no        |
| Auth error messages clear?                                      | /5              |

### Core Analysis Quality

| Criterion                                                              | Rating / Answer |
| ---------------------------------------------------------------------- | --------------- |
| Statistical correctness (spot-check Cpk, mean, σ against known values) | /5              |
| Chart visual quality                                                   | /5              |
| Interactivity responsiveness (hover, click, drill)                     | /5              |
| Performance with larger datasets (10K+ rows)                           | /5              |
| Nelson rule detection accuracy                                         | /5              |
| ANOVA results match expectations?                                      | yes / no        |

### Data Input

| Criterion                                        | Rating / Answer |
| ------------------------------------------------ | --------------- |
| Paste data detection accuracy (tab vs comma)     | /5              |
| File upload reliability                          | /5              |
| Column type detection (numeric/categorical/date) | /5              |
| Manual entry UX                                  | /5              |
| Add Data dropdown clarity                        | /5              |
| Data merge behavior (append vs replace)          | /5              |

### OneDrive Sync

| Criterion                                        | Rating / Answer |
| ------------------------------------------------ | --------------- |
| Save reliability                                 | /5              |
| Load reliability (data persists across sessions) | /5              |
| Offline → online sync behavior                   |                 |
| Error messages clarity                           | /5              |
| Sync speed                                       |                 |
| File visible in OneDrive folder?                 | yes / no        |

### Teams Integration

| Criterion                              | Rating / Answer |
| -------------------------------------- | --------------- |
| Manifest generation works?             | yes / no        |
| Upload to Teams Admin Center           | /5              |
| App renders correctly in Teams iframe? | yes / no        |
| Auth flow in Teams                     | /5              |
| Any iframe-specific issues?            |                 |
| Popout windows work (findings)?        | yes / no        |
| Scrolling behavior in Teams            | /5              |

### Accessibility

| Criterion                                                   | Rating / Answer |
| ----------------------------------------------------------- | --------------- |
| Keyboard navigation works? (Tab, Enter, Escape, Arrow keys) | yes / no        |
| Skip link functional?                                       | yes / no        |
| Screen reader announcements (ARIA live regions)?            | yes / no        |
| Color contrast sufficient (light + dark themes)?            | yes / no        |
| Focus indicators visible?                                   | yes / no        |

### Overall Assessment

| Criterion                                          | Rating / Answer                |
| -------------------------------------------------- | ------------------------------ |
| Missing features for real-world use                |                                |
| Bugs found                                         |                                |
| Comparison to PWA experience (what's better/worse) |                                |
| Would you use this daily?                          | /5                             |
| Top 3 suggested improvements                       |                                |
| Marketplace readiness assessment                   | ready / needs work / not ready |

---

## F. Known Limitations

Document these with testers so they don't report them as bugs:

| Limitation                   | Detail                                                                                                                    | Workaround / Timeline                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Teams SSO**                | `*.azurewebsites.net` domains don't support seamless Teams SSO. Users see a one-time login redirect.                      | Custom domain needed for seamless SSO. Not blocking for testing.                                      |
| **Storage scope**            | Standard plan: local files only (no cloud sync). Team plan: OneDrive personal + SharePoint channel storage.               | Standard needs only `User.Read`. Team needs `Files.ReadWrite.All` + `Channel.ReadBasic.All`.          |
| **Local dev**                | Graph API unavailable on localhost. Auth returns mock user, OneDrive sync is no-op.                                       | Expected behavior per `easyAuth.ts` — test sync only on deployed instance.                            |
| **Admin consent**            | `User.Read` + `Files.ReadWrite` don't require admin consent by default, but org Entra ID policies may block user consent. | If blocked, tenant admin grants consent via App Registration → API permissions → Grant admin consent. |
| **Performance Mode in PWA**  | PWA detection modal shows "available in Azure App" — Performance Mode is Azure-only.                                      | Expected behavior — PWA is free tier.                                                                 |
| **Client secret expiration** | Test secret expires based on chosen duration. Production deployments should use 24-month secrets.                         | Set calendar reminder to rotate before expiration.                                                    |

---

## G. Test Data Recommendations

### Built-in Samples

The app ships with sample datasets (via `@variscout/data`). Use these for initial smoke testing:

- **Coffee** — extraction temperature with spec limits, good for capability analysis
- **Journey** — multi-factor dataset, good for drill-down and ANOVA
- **Bottleneck** — multi-channel data, good for Performance Mode testing
- **Sachets** — packaging weights, good for Nelson rule testing

### Custom Test Data

For thorough testing, prepare CSV files that exercise edge cases:

| Test File            | Purpose             | Characteristics                               |
| -------------------- | ------------------- | --------------------------------------------- |
| `large-dataset.csv`  | Performance testing | 10,000+ rows, 3 factors, 1 measure            |
| `multi-measure.csv`  | Performance Mode    | 5+ numeric columns (fill heads / cavities)    |
| `unicode-data.csv`   | Encoding            | Column names with ÄÖÅ, accented characters    |
| `missing-values.csv` | Validation          | Rows with blank cells, mixed types            |
| `single-value.csv`   | Edge case           | All measurements identical (σ=0)              |
| `two-rows.csv`       | Minimum data        | Just 2 data points (control limits undefined) |

---

## H. Cleanup

After testing is complete:

```bash
# Delete the test resource group (removes all resources)
az group delete --name rg-variscout-test --yes --no-wait

# Delete the App Registration (Azure Portal)
# Entra ID → App registrations → VariScout Test → Delete
```

---

## I. Automated E2E Coverage

The Azure app has 9 Playwright spec files in `apps/azure/e2e/` plus a shared helper module:

| File                       | Covers Scenarios                                                              |
| -------------------------- | ----------------------------------------------------------------------------- |
| `helpers.ts`               | Shared: `confirmColumnMapping`, `loadSampleInEditor`, `loadPerformanceSample` |
| `editor-workflow.spec.ts`  | C-1 (auth mock), C-2 (sample load), C-12 (filter drill)                       |
| `samples.spec.ts`          | C-2 (all sample datasets), C-6 (I-Chart), C-7 (Boxplot)                       |
| `analysis-views.spec.ts`   | C-6 (I-Chart), C-7 (Boxplot), C-8 (Pareto)                                    |
| `stats-anova.spec.ts`      | C-9 (Cp/Cpk), C-10 (ANOVA)                                                    |
| `user-flows.spec.ts`       | C-3 (paste), C-12 (filter navigation), multi-step workflows                   |
| `edge-cases.spec.ts`       | Boundary conditions, empty states, error handling                             |
| `editor-features.spec.ts`  | C-13 (findings), C-19 (data table), C-21 (CSV export), C-22 (chart titles)    |
| `performance-mode.spec.ts` | C-11 (Performance Mode), Cp/Cpk toggle, spec limits                           |
| `settings-theme.spec.ts`   | C-15 (theme switching), C-17 (settings persistence)                           |

**Not covered by automation** (require deployed Azure environment):

- C-1 live auth (EasyAuth redirect — mocked in Playwright)
- C-14 OneDrive sync (requires Graph API token)
- C-23 Presentation mode (partial — visual verification needed)
- All section D (Teams integration — requires Teams Admin Center)

**ANOVA check clarification:** ANOVA results (`[data-testid="anova-results"]`) are only visible in FocusedChartView (boxplot focused view). Tests must first maximize the boxplot card to reach this view.

```bash
# Run all Azure E2E tests
pnpm --filter @variscout/azure-app test:e2e
```

---

## Related Documentation

- [ARM Template Documentation](../../08-products/azure/arm-template.md) — template parameters and App Registration setup
- [Authentication (EasyAuth)](../../08-products/azure/authentication.md) — auth flow, endpoints, token management
- [OneDrive Sync](../../08-products/azure/onedrive-sync.md) — sync architecture and storage structure
- [Marketplace Submission Checklist](../../08-products/azure/submission-checklist.md) — full submission tracker
- [Deployment Guide](deployment.md) — build commands and deployment workflows
- [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md) — distribution strategy
