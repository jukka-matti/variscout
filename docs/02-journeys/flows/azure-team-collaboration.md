# Flow 8: Azure App — Team Collaboration

> OpEx Olivia deploys VariScout for her team and sets up sharing
>
> **Priority:** Medium - expansion (team adoption after initial deployment)
>
> See also: [Journeys Overview](../index.md) | [Enterprise Evaluation](enterprise.md) | [First Analysis](azure-first-analysis.md)

---

## Persona: OpEx Olivia (Admin)

| Attribute         | Detail                                                  |
| ----------------- | ------------------------------------------------------- |
| **Role**          | OpEx Manager, VariScout deployment owner                |
| **Goal**          | Get the team using VariScout, enable collaboration      |
| **Knowledge**     | Strategic, manages deployment and team access           |
| **Pain points**   | Onboarding friction, IT coordination, Teams integration |
| **Entry point**   | Azure Marketplace or ARM template deployment            |
| **Decision mode** | Admin — configures once, team uses daily                |

### What Olivia is thinking:

- "How do I get this deployed for my team?"
- "Can everyone use their existing Microsoft login?"
- "How do team members share analyses?"
- "Can we put this in Teams so people actually use it?"

---

## Journey Flow

### Mermaid Flowchart

```mermaid
flowchart TD
    A[Decision to deploy] --> B[Create App Registration in Azure AD]
    B --> C[Deploy via Azure Marketplace]
    C --> D[ARM template creates App Service + EasyAuth]
    D --> E[App live at custom URL]
    E --> F[Share URL with team]
    F --> G[Team members sign in via SSO]
    G --> H[Each user gets local storage or cloud sync]
    H --> I{Collaboration}
    I -->|Standard| J[Share via file export or chart copy]
    I -->|Team plan| J2[Channel tabs + deep links + OneDrive]
    I -->|Teams tab| K[Admin generates Teams manifest]
    K --> L[Sideload manifest to Teams]
    L --> M[VariScout appears as Teams tab]
    I -->|Settings| N[Company accent, theme defaults]
```

### Team Adoption Journey

```mermaid
journey
    title Team Collaboration Setup
    section Deploy
      Create App Registration: 3: Admin
      Deploy from Marketplace: 4: Admin
      Verify app loads: 5: Admin
    section Onboard
      Share URL with team: 5: Admin
      First team member logs in: 5: User
      Consent to permissions: 3: User
    section Collaborate
      Standard: local file storage: 5: User
      Team: cloud sync + channel sharing: 4: User
      Set up Teams tab: 4: Admin
    section Establish
      Team uses daily: 5: User
      Admin reviews adoption: 4: Admin
```

---

## Step-by-Step

### 1. Deployment (Admin — One-Time)

The admin (Olivia or IT) deploys VariScout to the organization's Azure tenant.

**Pre-requisite**: Create an App Registration in Azure AD:

| Step | Action                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 1    | Go to Azure AD → App Registrations → New                                                                     |
| 2    | Name: "VariScout" (or any name)                                                                              |
| 3    | Add redirect URI (configured during deployment)                                                              |
| 4    | API permissions: `User.Read` (Standard plan). Team plan adds `Files.ReadWrite.All` + `Channel.ReadBasic.All` |
| 5    | Create a client secret                                                                                       |
| 6    | Note the Client ID and Client Secret                                                                         |

**Deploy from Azure Marketplace:**

1. Find VariScout on Azure Marketplace
2. Click "Create"
3. Enter: app name, region, Client ID, Client Secret
4. _(Optional)_ Check **"Enable AI-powered analysis"** — provisions Azure AI Foundry resources in the same tenant. Select model (GPT-4o-mini default). See [AI Setup](azure-ai-setup.md) for the full admin flow.
5. Deploy — ARM template creates App Service Plan + App Service + EasyAuth config (+ AI resources if enabled)
6. App is live at `https://<app-name>.azurewebsites.net` (~2 minutes)

See [ARM Template](../../08-products/azure/arm-template.md) and [Marketplace Guide](../../08-products/azure/marketplace.md) for details.

### 2. Team Onboarding (Zero Friction)

There is no user provisioning. Anyone in the Azure AD tenant can access the app:

1. Admin shares the App Service URL (email, Teams message, intranet)
2. Team member opens the URL
3. EasyAuth redirects to Azure AD sign-in (existing work account)
4. First-time consent: `User.Read` (Standard). Team plan: admin pre-consents cloud permissions
5. App loads — ready to use

**No separate accounts, no invitations, no license assignment.** The Managed Application covers unlimited users in the tenant.

### 3. Data Storage

Storage depends on the plan:

**Standard plan** — local files only:

- Projects saved to IndexedDB + local files via File System Access API
- No cloud sync, no OneDrive
- Offline-first: full functionality without internet

**Team plan** — local files + cloud sync:

```
User's OneDrive/
└── VariScout/
    └── Projects/
        ├── analysis-001.vrs
        └── ...

Channel Files/VariScout/     ← channel tab storage (SharePoint)
├── Projects/
│   └── shared-analysis.vrs
└── Photos/
    └── ...
```

- Personal OneDrive sync for personal tabs and browser access
- SharePoint channel storage for channel tabs (shared with team)
- Sync via Graph API with `Files.ReadWrite.All` permission
- Offline-first: works without internet, syncs when reconnected

### 4. Sharing Analyses

| Sharing method            | Plan | How                                                         |
| ------------------------- | ---- | ----------------------------------------------------------- |
| Channel tab (shared .vrs) | Team | Analyses stored in channel SharePoint — team sees same data |
| Teams deep links          | Team | Share chart/finding URLs via Teams native dialog            |
| Share OneDrive file       | Team | Right-click `.vrs` file in OneDrive → Share with colleague  |
| Export and send           | Both | CSV export → email/Teams attachment                         |
| Copy chart                | Both | Copy chart as PNG → paste into email/presentation           |

**Standard plan**: Sharing via file export or chart copy. No cloud-based sharing.

**Team plan**: Channel tabs provide built-in team collaboration — all channel members access the same analysis. Deep links allow sharing specific charts or findings via Teams chat.

### 5. Teams Integration

The admin can add VariScout as a Teams tab:

1. Open the **Admin Settings** panel in the app
2. Click **Teams Setup** (AdminTeamsSetup component)
3. The app generates a Teams manifest (`manifest.json`) with the correct App Service URL
4. Download the `.zip` package (generated client-side with JSZip)
5. In Teams Admin Center: Upload → Sideload the `.zip`
6. VariScout appears as a Teams tab option

Team members can then add VariScout to any Teams channel as a tab — SSO flows through seamlessly.

### 6. AI-Powered Analysis (Optional)

If the admin enabled AI during deployment, all team members have access to AI-assisted analysis features:

| Feature                 | Plan | Phase | Description                                                                                     |
| ----------------------- | ---- | ----- | ----------------------------------------------------------------------------------------------- |
| **NarrativeBar**        | Both | 1     | Plain-language summary at dashboard bottom, visible to all users                                |
| **ChartInsightChip**    | Both | 2     | Per-chart suggestions (e.g., "Drill Machine A (47%)")                                           |
| **CopilotPanel**        | Both | 3     | Conversational AI for deeper questions                                                          |
| **Team knowledge base** | Team | 2+    | Resolved findings accumulate as searchable organizational knowledge                             |
| **Document retrieval**  | Team | 3     | CopilotPanel can reference team SOPs, fault trees, and past investigations via Azure AI Search  |
| **Shared AI insights**  | Both | 1+    | NarrativeBar and ChartInsightChip content visible to all team members viewing the same analysis |

**Team knowledge base (Phase 2+):** Each resolved finding — with its factor, contribution %, Cpk, corrective action, and measured outcome — is indexed via Azure AI Search. After 50+ resolved findings, the AI has genuine organizational knowledge backed by measurement data. CopilotPanel can answer questions like "Have we seen this pattern before?" by retrieving past investigations.

**Document retrieval (Phase 3):** On the Team plan, CopilotPanel can reference quality documents stored in the Teams channel SharePoint (fault trees, SOPs, control plans). Azure AI Search with Foundry IQ orchestration provides semantic search across these documents.

Each user controls their own AI visibility via the "Show AI assistance" toggle in Settings. AI features are always optional — the app works identically without them.

See [AI Setup](azure-ai-setup.md) for the admin deployment flow and [ADR-019](../../07-decisions/adr-019-ai-integration.md) for the phased rollout plan.

### 7. Settings and Branding

Admin or any user can customize via the Settings panel:

| Setting            | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| Theme              | Light / Dark / System (per user)                     |
| Company accent     | Brand color applied to headers (per user)            |
| Chart font scale   | Adjust chart text size (per user)                    |
| Show AI assistance | Show or hide AI components (per user, if configured) |

Settings are stored in browser `localStorage` (per device, not synced).

---

## Data Ownership

All data stays within the customer's Azure tenant — including AI resources:

```
CUSTOMER TENANT                        VARISCOUT (Publisher)
┌──────────────────────┐               ┌────────────────────┐
│                      │               │                    │
│  App Service         │               │  Marketplace       │
│  (hosts the app)     │  ── NO ────▶  │  listing only      │
│                      │  connection   │                    │
│  Azure AD            │               │  No access to:     │
│  (authenticates)     │               │  - Customer data   │
│                      │               │  - User identities │
│  OneDrive            │               │  - App resources   │
│  (stores analyses)   │               │  - AI prompts/data │
│                      │               │  - Usage telemetry │
│  Azure AI Foundry    │               │                    │
│  (optional, in-tenant) │             │                    │
│                      │               │                    │
└──────────────────────┘               └────────────────────┘
```

When AI is enabled, Azure AI Foundry resources are deployed in the customer's tenant. AI receives only computed statistics (mean, Cpk, violations) — never raw measurement data. GDPR by design.

- Publisher management is disabled — zero access to customer deployment
- No telemetry or outbound calls to publisher systems
- Data survives subscription cancellation (analyses remain on device or in OneDrive/SharePoint)

---

## Permissions Summary

| Permission              | Type      | Plan | Who consents | Purpose                           |
| ----------------------- | --------- | ---- | ------------ | --------------------------------- |
| `User.Read`             | Delegated | Both | Each user    | Display user name & email         |
| `Files.ReadWrite.All`   | Delegated | Team | Tenant admin | OneDrive + SharePoint file sync   |
| `Channel.ReadBasic.All` | Delegated | Team | Tenant admin | Resolve channel SharePoint drives |

**Standard plan**: No admin consent required — users consent to `User.Read` on first login.

**Team plan**: Requires one-time tenant admin consent for `Files.ReadWrite.All` and `Channel.ReadBasic.All`. No `Sites.ReadWrite.All`, no mail access.

---

## Success Metrics

| Metric                                | Target  |
| ------------------------------------- | ------- |
| Deployment → first team login         | < 1 day |
| Team members active (month 1)         | > 50%   |
| Analyses saved per user (month 1)     | > 3     |
| Teams tab adoption (if set up)        | Track   |
| OneDrive sharing between team members | Track   |
| Return rate (week 2)                  | > 60%   |

---

## See Also

- [Azure App Overview](../../08-products/azure/index.md) — product positioning and pricing
- [How It Works](../../08-products/azure/how-it-works.md) — end-to-end architecture
- [ARM Template](../../08-products/azure/arm-template.md) — deployment resources
- [Authentication](../../08-products/azure/authentication.md) — EasyAuth details
- [OneDrive Sync](../../08-products/azure/onedrive-sync.md) — sync and offline behavior
- [AI Setup](azure-ai-setup.md) — admin flow for enabling AI features
- [Enterprise Evaluation](enterprise.md) — how Olivia evaluated before deploying
- [First Analysis](azure-first-analysis.md) — what team members experience on day one
- [Daily Use](azure-daily-use.md) — ongoing workflow
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — AI architectural decision
