# VaRiScout Azure Deployment — Technical Specification

## Overview

VaRiScout Azure allows organizations to deploy VaRiScout to their own Azure tenant with **team collaboration via SharePoint/OneDrive**. Teams can share projects, templates, and analyses across the organization.

```
PRODUCT SUMMARY
─────────────────────────────────────────────────────────────────

What it is:     Self-hosted VaRiScout with team collaboration
Storage:        SharePoint / OneDrive (team file sharing)
Auth:           Azure AD (SSO with existing accounts)
Users:          Unlimited
Branding:       Custom logo, colors, domain
Price:          €999/year license + ~€10-20/month Azure hosting
Distribution:   Azure Marketplace
```

### Analysis Features

The Azure app includes all PWA analysis features:

- **I-Chart with Staged Analysis**: Divide I-Chart into phases with separate control limits per stage
  - Select any categorical column with 2-10 unique values as a stage column
  - Stage order modes: Auto-detect, First occurrence, Alphabetical
  - See [Staged Analysis User Guide](../pwa/STAGED_ANALYSIS.md) for detailed usage
- **Boxplot** with factor comparison and ANOVA
- **Pareto Chart** for defect categorization
- **Capability Analysis** (Cp/Cpk, histogram, probability plot)

---

## Why Azure Deployment?

### Individual vs Azure

```
PWA INDIVIDUAL (€49/year)          AZURE DEPLOYMENT (€999/year)
─────────────────────────────────────────────────────────────────

Storage:    Browser only            SharePoint/OneDrive
Sharing:    Export .vrs manually    Click "Share with team"
Auth:       License key             Azure AD (SSO)
Users:      1 person                Unlimited
Branding:   VaRiScout               Your company
Domain:     variscout.com           analysis.yourcompany.com

Best for:   Individual analysts     Teams & organizations
```

### Value Proposition

| Need                           | Solution                          |
| ------------------------------ | --------------------------------- |
| "Team needs to share analyses" | Save to SharePoint, open anywhere |
| "We have 200+ users"           | Unlimited users, Azure AD SSO     |
| "Don't want another login"     | Uses existing Microsoft account   |
| "Projects must be backed up"   | SharePoint = automatic backup     |
| "Need audit trail"             | SharePoint version history        |
| "Data can't leave our tenant"  | Everything in YOUR Azure/M365     |

### Ideal Use Cases

```
WHO SHOULD USE AZURE DEPLOYMENT
─────────────────────────────────────────────────────────────────

1. QUALITY TEAMS
   • Multiple analysts sharing projects
   • Template library for standard analyses
   • SharePoint for project storage

2. TRAINING ORGANIZATIONS
   • Custom branding
   • Template library for exercises
   • Students can save work to SharePoint
   • Unlimited users

3. CORPORATIONS WITH LSS PROGRAMS
   • Branded tool for internal use
   • Central template library
   • Project sharing across sites
   • SSO with existing accounts

4. CONSULTING FIRMS
   • Projects organized by client
   • Analysts share work easily
   • Custom branding optional
```

---

## Architecture

### High-Level Overview

```
CUSTOMER'S ENVIRONMENT
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        Azure Tenant                             │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────────┐ │
│  │  Azure Static Web App │     │  Azure Functions             │ │
│  │  (Frontend)           │     │  (Backend API)               │ │
│  │                       │     │                              │ │
│  │  • React PWA          │────▶│  • /api/auth/login           │ │
│  │  • Custom branding    │     │  • /api/projects/*           │ │
│  │  • analysis.acme.com  │◀────│  • /api/templates/*          │ │
│  │                       │     │  • /api/share/*              │ │
│  └──────────────────────┘     └──────────────────────────────┘ │
│                                          │                      │
│                                          │ Microsoft Graph API  │
│                                          ▼                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Microsoft 365                          │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │  SharePoint     │  │  OneDrive       │                │  │
│  │  │                 │  │                 │                │  │
│  │  │  /VaRiScout/    │  │  /VaRiScout/    │                │  │
│  │  │  ├── Team/      │  │  └── Personal/  │                │  │
│  │  │  │   └── *.vrs  │  │      └── *.vrs  │                │  │
│  │  │  └── Templates/ │  │                 │                │  │
│  │  │      └── *.vrs  │  │                 │                │  │
│  │  └─────────────────┘  └─────────────────┘                │  │
│  │                                                           │  │
│  │  ┌─────────────────┐                                     │  │
│  │  │  Azure AD       │  ← SSO authentication               │  │
│  │  └─────────────────┘                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Details

```
AZURE RESOURCES
─────────────────────────────────────────────────────────────────

Resource Group: rg-variscout
├── Static Web App (Frontend)
│   ├── Custom domain: analysis.acme.com
│   ├── Managed SSL certificate
│   └── React PWA with branding
│
├── Function App (Backend API)
│   ├── Node.js runtime
│   ├── Consumption plan (~€5-15/month)
│   └── Managed Identity for Graph API
│
├── App Registration (Azure AD)
│   ├── Enables SSO login
│   ├── Graph API permissions
│   └── SharePoint/OneDrive access
│
└── Key Vault (optional)
    └── Stores secrets and license key
```

---

## SharePoint Integration

### File Structure

```
SHAREPOINT SITE: VaRiScout (auto-created)
─────────────────────────────────────────────────────────────────

/sites/VaRiScout/
├── Shared Documents/
│   ├── Projects/
│   │   ├── Q1 Diameter Analysis.vrs
│   │   ├── Machine A Capability.vrs
│   │   └── Defect Pareto 2026.vrs
│   │
│   └── Templates/
│       ├── Standard Capability.vrs
│       ├── Daily I-Chart.vrs
│       └── Shift Comparison.vrs
│
└── Document Library Settings
    ├── Versioning: Enabled (major versions)
    ├── Content types: VaRiScout Project (.vrs)
    └── Metadata: Author, Modified, Tags

ONEDRIVE (Personal):
/VaRiScout/
└── My Projects/
    └── Draft Analysis.vrs
```

### Save Locations

```
SAVE DIALOG
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│  Save Project                                         [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name: [Q1 Diameter Analysis________________]               │
│                                                             │
│  Location:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☁️ Team Projects (SharePoint)          [Default]     │   │
│  │    Shared with: Quality Team                         │   │
│  │                                                      │   │
│  │ 👤 My Projects (OneDrive)                            │   │
│  │    Private, synced across your devices               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tags: [capability] [machine-a] [+]                        │
│                                                             │
│                              [Cancel]  [Save]               │
└─────────────────────────────────────────────────────────────┘

No "local only" option — everything goes to SharePoint/OneDrive.
Offline handled automatically (see below).
```

### Automatic Offline Sync

Users don't choose "local" — offline is transparent:

```
OFFLINE BEHAVIOR
─────────────────────────────────────────────────────────────────

ONLINE (normal):
  User clicks Save → API call → SharePoint/OneDrive → Done ✓

OFFLINE:
  User clicks Save → Saved to IndexedDB (instant)
                   → Queued for sync
                   → Badge: "Saved offline, will sync"

  Later, when online → Auto-sync to SharePoint/OneDrive
                     → Badge: "Synced ✓"
                     → IndexedDB cache cleared

CONFLICT (rare):
  If same file edited by two people offline:
  → Show both versions
  → User picks which to keep (or merge manually)
```

**User sees:**

```
┌─────────────────────────────────────────────────────────────┐
│  ☁️ Saved                          (normal)                 │
│  📴 Saved offline, will sync       (offline)                │
│  🔄 Syncing...                     (coming back online)     │
│  ✓ Synced                          (after sync completes)   │
└─────────────────────────────────────────────────────────────┘
```

**Why no local-only option?**

- Azure deployment = team tool = everything should be backed up
- IT expects data in SharePoint (retention, compliance, backup)
- Users don't have to think about where data lives
- Simpler UX, fewer choices

### Open Dialog

```
OPEN PROJECT
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│  Open Project                                         [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🔍 Search projects...                              ]      │
│                                                             │
│  Recent                                                     │
│  ├─ Q1 Diameter Analysis          Today, 2:30 PM           │
│  ├─ Machine A Capability          Yesterday                │
│  └─ Defect Pareto 2026            Jan 2                    │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  Team Projects (SharePoint)                                │
│  ├─ 📁 Quality Team                                        │
│  │   ├─ Line 1 Analysis.vrs       Maria, Dec 15           │
│  │   ├─ Supplier Comparison.vrs   Juho, Dec 10            │
│  │   └─ ...                                                │
│  │                                                         │
│  └─ 📁 Templates                                           │
│      ├─ Standard Capability.vrs   Template                 │
│      └─ Daily I-Chart.vrs         Template                 │
│                                                             │
│  My Projects (OneDrive)                                    │
│  └─ Draft Analysis.vrs            Draft                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication (Azure AD SSO)

### Login Flow

```
USER LOGIN FLOW
─────────────────────────────────────────────────────────────────

1. User visits analysis.acme.com
         │
         ▼
2. App checks for existing session
   (MSAL.js checks for cached token)
         │
         ▼
3. If no session → Redirect to Azure AD login
   (Uses company's normal login page)
         │
         ▼
4. User logs in with existing Microsoft account
   (Same credentials as Outlook, Teams, etc.)
         │
         ▼
5. Azure AD returns tokens
   - Access token (for Graph API)
   - ID token (user info)
         │
         ▼
6. User is logged in
   - See their name/photo
   - Access their OneDrive
   - Access SharePoint sites they have permission to
```

### MSAL.js Configuration

```typescript
// src/auth/msalConfig.ts

import { Configuration, PublicClientApplication } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    'User.Read', // Get user profile
    'Files.ReadWrite', // OneDrive access
    'Sites.ReadWrite.All', // SharePoint access
  ],
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

---

## Backend API (Azure Functions)

### API Endpoints

```
API ROUTES
─────────────────────────────────────────────────────────────────

POST   /api/projects              Create new project
GET    /api/projects              List user's projects
GET    /api/projects/:id          Get project by ID
PUT    /api/projects/:id          Update project
DELETE /api/projects/:id          Delete project

GET    /api/templates             List organization templates
POST   /api/templates             Create template (admin only)

POST   /api/share                 Share project with user/group
GET    /api/share/:id             Get sharing info for project

GET    /api/recent                Get recent projects for user
GET    /api/search?q=...          Search projects by name/tags
```

### Project Operations

```typescript
// api/projects/index.ts

import { Client } from '@microsoft/microsoft-graph-client';

async function listProjects(context, graphClient: Client) {
  // List files in VaRiScout folder on OneDrive
  const response = await graphClient
    .api('/me/drive/root:/VaRiScout/Projects:/children')
    .filter('file ne null')
    .select('id,name,lastModifiedDateTime,lastModifiedBy,size')
    .orderby('lastModifiedDateTime desc')
    .get();

  return response.value.map(file => ({
    id: file.id,
    name: file.name.replace('.vrs', ''),
    modified: file.lastModifiedDateTime,
    modifiedBy: file.lastModifiedBy?.user?.displayName,
  }));
}

async function saveProject(graphClient: Client, name: string, content: object, location: string) {
  const basePath =
    location === 'team'
      ? '/sites/VaRiScout/Shared Documents/Projects'
      : '/me/drive/root:/VaRiScout/Projects';

  return await graphClient.api(`${basePath}/${name}.vrs:/content`).put(JSON.stringify(content));
}
```

---

## Sharing & Permissions

### Share Dialog

```
SHARE PROJECT
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│  Share "Q1 Diameter Analysis"                         [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Share with people                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [maria@acme.com, juho@acme.com               ] [+]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Permission:  ○ Can view   ● Can edit                      │
│                                                             │
│  ☑ Notify people by email                                  │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  People with access                                        │
│  ├─ 👤 You (Owner)                                         │
│  ├─ 👤 Maria (Can edit)                      [Remove]      │
│  └─ 👥 Quality Team (Can view)               [Remove]      │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  🔗 Get shareable link                                     │
│     [Copy link]                                            │
│                                                             │
│                              [Cancel]  [Share]              │
└─────────────────────────────────────────────────────────────┘
```

### Permission Model

```
WHO CAN ACCESS WHAT
─────────────────────────────────────────────────────────────────

Project Permissions (via SharePoint):
├── Owner:      Full control (edit, delete, share)
├── Editor:     Can view and edit
└── Viewer:     Can only view

Template Permissions:
├── Admin:      Can create/edit templates
└── Users:      Can use templates (read-only)

Controlled by SharePoint permissions — no extra system needed
```

---

## Offline Sync Implementation

### Storage Service with Auto-Sync

```typescript
// src/services/storage.ts

export type StorageLocation = 'team' | 'personal';

interface SyncStatus {
  status: 'saved' | 'offline' | 'syncing' | 'synced' | 'conflict';
  message: string;
  pendingChanges?: number;
}

export function useStorage() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'saved',
    message: '',
  });

  const saveProject = async (project: Project, name: string, location: StorageLocation) => {
    // Always save to IndexedDB first (instant feedback)
    await saveToIndexedDB(project, name, location);

    if (!navigator.onLine) {
      // Offline: queue for sync
      await addToSyncQueue({ project, name, location });
      setSyncStatus({
        status: 'offline',
        message: 'Saved offline, will sync when connected',
      });
      return;
    }

    // Online: sync immediately
    try {
      setSyncStatus({ status: 'syncing', message: 'Saving to cloud...' });

      const token = await getAccessToken();
      await saveToCloud(token, project, name, location);

      await markAsSynced(name);
      setSyncStatus({ status: 'synced', message: 'Saved' });
    } catch (error) {
      // Failed: keep in queue for retry
      await addToSyncQueue({ project, name, location });
      setSyncStatus({
        status: 'offline',
        message: 'Save failed, will retry',
      });
    }
  };

  // Background sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const pending = await getPendingSyncItems();

      if (pending.length === 0) return;

      setSyncStatus({
        status: 'syncing',
        message: `Syncing ${pending.length} items...`,
        pendingChanges: pending.length,
      });

      const token = await getAccessToken();

      for (const item of pending) {
        try {
          await saveToCloud(token, item.project, item.name, item.location);
          await removeFromSyncQueue(item.name);
        } catch (error) {
          console.error('Sync failed for:', item.name);
          // Keep in queue for next attempt
        }
      }

      const remaining = await getPendingSyncItems();
      if (remaining.length === 0) {
        setSyncStatus({ status: 'synced', message: 'All changes synced' });
      } else {
        setSyncStatus({
          status: 'offline',
          message: `${remaining.length} items pending sync`,
          pendingChanges: remaining.length,
        });
      }
    };

    window.addEventListener('online', handleOnline);

    // Also try sync on mount if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return { saveProject, syncStatus };
}
```

### IndexedDB Schema for Sync Queue

```typescript
// src/db/schema.ts

import Dexie from 'dexie';

export const db = new Dexie('VaRiScoutAzure');

db.version(1).stores({
  // Local cache of projects
  projects: 'name, location, modified, synced',

  // Sync queue for offline changes
  syncQueue: '++id, name, location, queuedAt',

  // Track what's been synced
  syncState: 'name, cloudId, lastSynced, etag',
});

// Sync queue operations
export async function addToSyncQueue(item: SyncItem) {
  await db.syncQueue.put({
    name: item.name,
    location: item.location,
    project: item.project,
    queuedAt: new Date().toISOString(),
  });
}

export async function getPendingSyncItems(): Promise<SyncItem[]> {
  return await db.syncQueue.toArray();
}

export async function removeFromSyncQueue(name: string) {
  await db.syncQueue.where('name').equals(name).delete();
}
```

### Sync Status UI Component

```tsx
// src/components/SyncStatusBadge.tsx

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const icons = {
    saved: '☁️',
    offline: '📴',
    syncing: '🔄',
    synced: '✓',
    conflict: '⚠️',
  };

  const colors = {
    saved: 'text-green-600',
    offline: 'text-yellow-600',
    syncing: 'text-blue-600',
    synced: 'text-green-600',
    conflict: 'text-red-600',
  };

  return (
    <div className={`sync-status ${colors[status.status]}`}>
      <span className="icon">{icons[status.status]}</span>
      <span className="message">{status.message}</span>
      {status.pendingChanges && <span className="badge">{status.pendingChanges}</span>}
    </div>
  );
}
```

### Conflict Resolution

```typescript
// When same file edited offline by two people

interface ConflictResolution {
  localVersion: Project;
  cloudVersion: Project;
  localModified: string;
  cloudModified: string;
  cloudModifiedBy: string;
}

async function handleConflict(conflict: ConflictResolution): Promise<Project> {
  // Show dialog to user
  const choice = await showConflictDialog({
    message: `This file was also edited by ${conflict.cloudModifiedBy}`,
    options: [
      {
        label: 'Keep my version',
        description: `Your changes from ${conflict.localModified}`,
        action: () => conflict.localVersion,
      },
      {
        label: 'Keep their version',
        description: `Changes by ${conflict.cloudModifiedBy} from ${conflict.cloudModified}`,
        action: () => conflict.cloudVersion,
      },
      {
        label: 'Keep both',
        description: 'Save your version as a new file',
        action: () => saveAsCopy(conflict.localVersion),
      },
    ],
  });

  return choice;
}
```

---

## Branding Configuration

### config.json

```json
{
  "branding": {
    "appName": "AcmeCorp Analytics",
    "logoUrl": "/assets/acme-logo.svg",
    "faviconUrl": "/assets/acme-favicon.ico",
    "primaryColor": "#1e40af",
    "accentColor": "#3b82f6"
  },

  "features": {
    "showPoweredBy": false,
    "defaultSaveLocation": "team",
    "allowPersonalProjects": true
  },

  "sharepoint": {
    "siteUrl": "https://acme.sharepoint.com/sites/VaRiScout",
    "projectsLibrary": "Shared Documents/Projects",
    "templatesLibrary": "Shared Documents/Templates"
  },

  "support": {
    "helpUrl": "https://intranet.acme.com/analytics-help",
    "supportEmail": "analytics-support@acme.com"
  },

  "license": {
    "key": "VSA-XXXX-XXXX-XXXX-XXXX",
    "validUntil": "2027-01-03"
  }
}
```

---

## Infrastructure as Code

### Bicep Template

```bicep
// infra/main.bicep

param appName string = 'variscout'
param location string = resourceGroup().location
param tenantId string

// Static Web App (Frontend)
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'stapp-${appName}'
  location: location
  sku: { name: 'Standard', tier: 'Standard' }
}

// Function App (Backend API)
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'func-${appName}'
  location: location
  kind: 'functionapp'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '18'
      appSettings: [
        { name: 'AZURE_TENANT_ID', value: tenantId }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
      ]
    }
  }
}

// Consumption plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-${appName}'
  location: location
  sku: { name: 'Y1', tier: 'Dynamic' }
}
```

---

## Cost Breakdown

```
MONTHLY COST ESTIMATE
─────────────────────────────────────────────────────────────────

Azure Static Web App (Standard)     ~€9/month
Azure Functions (Consumption)       ~€5-15/month
Storage Account                     ~€1/month
                                    ─────────────
                                    ~€15-25/month

Plus: VaRiScout license             €999/year (~€83/month)

Total: ~€100-110/month for unlimited users

Break-even vs Individual: ~12 users
Sweet spot: 50-500 users
```

---

## Security & Compliance

### Data Flow

```
WHERE DATA LIVES
─────────────────────────────────────────────────────────────────

Analysis:       User's browser (same as PWA)
Projects:       SharePoint/OneDrive (customer's M365)
Auth:           Azure AD (customer's tenant)
Our access:     NONE

Compliance via Microsoft 365:
✓ SOC2
✓ ISO 27001
✓ GDPR
✓ Data residency (customer's M365 region)
```

---

## Summary

### What Azure Adds Over PWA

| Feature         | PWA Individual       | Azure                         |
| --------------- | -------------------- | ----------------------------- |
| Save projects   | Browser only         | SharePoint/OneDrive           |
| Share with team | Export .vrs file     | Click "Share"                 |
| Open anywhere   | Same browser only    | Any device                    |
| Offline         | Works (browser only) | Works (auto-sync when online) |
| Authentication  | License key          | Azure AD SSO                  |
| Backup          | Manual               | Automatic                     |
| Version history | None                 | SharePoint built-in           |
| Search          | None                 | Full-text search              |
| Templates       | Personal only        | Org-wide library              |
| Users           | 1                    | Unlimited                     |
| Branding        | VaRiScout            | Custom                        |

### Development Phases

```
Phase 1: Basic Cloud Save (6-8 weeks)
├── Azure AD authentication (MSAL.js)
├── Save to OneDrive
├── Open from OneDrive
└── Basic sharing via Graph API

Phase 2: Team Features (4-6 weeks)
├── SharePoint site integration
├── Templates library
├── Search across projects
└── Recent files

Phase 3: Advanced (TBD)
├── Offline sync queue
├── Real-time collaboration indicators
├── Admin dashboard
└── Usage analytics
```
