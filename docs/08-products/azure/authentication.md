---
title: 'Authentication (EasyAuth)'
audience: [admin, architect]
category: reference
status: stable
---

# Authentication (EasyAuth)

App Service Authentication (EasyAuth) integration for Azure AD SSO.

---

## Overview

The Azure app uses **EasyAuth** (App Service Authentication) — a platform-level auth feature that handles Azure AD login without any client-side auth libraries:

- Zero auth code in the application
- Platform-managed token refresh
- Built-in token store at `/.auth/me`
- Automatic redirect to Azure AD login
- **Zero admin consent required** — both tiers use `User.Read` (user-consent only)

---

## How It Works

EasyAuth runs as middleware in the App Service platform. The app never sees unauthenticated requests — Azure handles the login flow before the request reaches the application code.

```
USER                    APP SERVICE (EasyAuth)         ENTRA ID
  │                              │                         │
  │── Visit app URL ────────────▶│                         │
  │                              │── Not authenticated ───▶│
  │                              │   Redirect to login     │
  │                              │                         │
  │◀───────────── User authenticates ─────────────────────▶│
  │                              │                         │
  │                              │◀── Session cookie ──────│
  │                              │   + tokens in store     │
  │◀── Serve app ────────────────│                         │
```

---

## Auth Endpoints

EasyAuth provides built-in endpoints on every App Service:

| Endpoint           | Purpose                               |
| ------------------ | ------------------------------------- |
| `/.auth/login/aad` | Redirect to Azure AD sign-in          |
| `/.auth/logout`    | Sign out and clear session            |
| `/.auth/me`        | Get current user info + access tokens |
| `/.auth/refresh`   | Refresh the session token             |

### `/.auth/me` Response Structure

```json
[
  {
    "provider_name": "aad",
    "user_id": "user@contoso.com",
    "user_claims": [
      { "typ": "name", "val": "Jane Smith" },
      {
        "typ": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "val": "jane@contoso.com"
      },
      { "typ": "preferred_username", "val": "jane@contoso.com" }
    ],
    "access_token": "eyJ0eXAi...",
    "expires_on": "2026-02-16T12:00:00.0000000Z"
  }
]
```

---

## Client-Side Helper

The `easyAuth.ts` module provides typed helpers for accessing EasyAuth:

```typescript
// auth/easyAuth.ts
import { getEasyAuthUser, getAccessToken, login, logout } from './auth/easyAuth';

// Get the current user (name, email, userId)
const user = await getEasyAuthUser();

// Get an access token for Graph API calls
const token = await getAccessToken();

// Redirect to Azure AD login
login();

// Sign out
logout();
```

### Local Development

EasyAuth only works on deployed App Services. For local development, the helper detects `localhost` and returns mock data:

- `getEasyAuthUser()` returns a mock "Local Developer" user
- `getAccessToken()` throws an error (Graph API not available locally)
- `login()` / `logout()` reload the page

---

## Error Handling

### AuthError Class

Typed authentication errors with machine-readable codes:

| Code                | Meaning                                 |
| ------------------- | --------------------------------------- |
| `not_authenticated` | No auth session found                   |
| `no_provider`       | `/.auth/me` returned empty array        |
| `no_token`          | Provider entry has no `access_token`    |
| `refresh_failed`    | `/.auth/refresh` returned non-OK status |
| `local_dev`         | Graph API unavailable on localhost      |

Source: `apps/azure/src/auth/easyAuth.ts`

### Proactive Token Refresh

`getAccessToken()` checks `expires_on` from the `/.auth/me` response. If the token expires within **5 minutes**, it calls `/.auth/refresh` before returning the token. If refresh fails but the token hasn't actually expired, the existing token is returned as a fallback.

Flow:

1. Fetch `/.auth/me` → extract `access_token` + `expires_on`
2. If expires within 5 min → call `/.auth/refresh`
   - Success → re-fetch `/.auth/me` → return new token
   - Failure → return existing token (still valid)
3. If not near expiry → return token directly

### Periodic Background Refresh

`startPeriodicRefresh()` runs a 45-minute interval that calls `/.auth/refresh` in the background. This prevents session expiry during long analysis sessions (EasyAuth tokens typically expire after 1 hour).

- Started on app mount, stopped on unmount
- Safe to call multiple times — clears any existing interval first
- Failures are logged but do not interrupt the user session
- Companion: `stopPeriodicRefresh()` for cleanup

Source: `apps/azure/src/auth/easyAuth.ts`

---

## Required Permissions

**Both tiers — zero admin consent:**

| Permission    | Type      | Admin Consent | Purpose          | Tier |
| ------------- | --------- | ------------- | ---------------- | ---- |
| `User.Read`   | Delegated | No            | Get user profile | All  |
| `People.Read` | Delegated | No            | People picker    | Team |

No admin consent required for either tier. Users grant consent on first login.

**Previous architecture (ADR-016, superseded):** Team tier required 5 admin-consent Graph API scopes (`Files.ReadWrite.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Sites.Read.All`, `People.Read`). These have been removed in ADR-059 (Web-First Architecture). Team tier collaboration now uses Azure Blob Storage with Azure RBAC instead of Graph API.

---

## Blob Storage Authentication (Team Plan)

Team tier projects are stored in Azure Blob Storage in the customer's resource group. Browser access uses SAS tokens generated by a server-side endpoint:

```
Browser → App Service (/api/storage-token)
    → Validates Entra ID session (EasyAuth)
    → Generates container-scoped SAS token (read/write, 1hr expiry)
    → Returns SAS token to browser
Browser → Azure Blob Storage (direct, using SAS token)
```

The App Service uses its managed identity (with `Storage Blob Data Contributor` RBAC role) to generate SAS tokens. No storage credentials are exposed to the browser.

### Security Controls

| Control              | Detail                                                         |
| -------------------- | -------------------------------------------------------------- |
| Container-scoped     | SAS token only grants access to `variscout-projects` container |
| Time-limited         | 1-hour expiry, regenerated on demand                           |
| Entra ID gated       | `/api/storage-token` requires valid EasyAuth session           |
| No delete permission | SAS token grants read + write only, no delete                  |
| Azure RBAC           | Customer IT manages access via standard Azure role assignments |

Source: `apps/azure/server.js` (`/api/storage-token` route)

---

## ARM Template Configuration

EasyAuth is configured in the ARM template via `authsettingsV2`:

```json
{
  "type": "Microsoft.Web/sites/config",
  "name": "[concat(webAppName, '/authsettingsV2')]",
  "properties": {
    "platform": { "enabled": true },
    "globalValidation": {
      "requireAuthentication": true,
      "unauthenticatedClientAction": "RedirectToLoginPage",
      "redirectToProvider": "azureactivedirectory"
    },
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "registration": {
          "clientId": "<app-registration-client-id>",
          "clientSecretSettingName": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
        },
        "login": {
          "loginParameters": ["scope=openid profile email User.Read"]
        }
      }
    },
    "login": {
      "tokenStore": { "enabled": true }
    }
  }
}
```

Both Standard and Team plans use the same `User.Read` scope. Team plan adds `People.Read` for the people picker.

See [ARM Template](arm-template.md) for the complete deployment configuration.

---

## Cognitive Services Scope (AI Features)

When AI features are enabled (`enableAI` parameter in ARM template), EasyAuth additionally requests the Cognitive Services scope:

| Scope                                          | Purpose                     | Conditional             |
| ---------------------------------------------- | --------------------------- | ----------------------- |
| `https://cognitiveservices.azure.com/.default` | Azure AI Foundry API access | Only when AI is enabled |

**How it works:** Same EasyAuth pattern — the scope is added to `loginParameters` in `authsettingsV2` conditionally based on `enableAI`. The browser obtains Cognitive Services tokens via the existing `getAccessToken()` helper.

**RBAC requirement:** Users need the "Cognitive Services User" role on the Azure AI Services resource. This is configured in the ARM template alongside the AI resource deployment.

**No API keys in client code:** AI endpoint URL (`VITE_AI_ENDPOINT`) is a build-time setting (not a secret). Authentication uses bearer tokens from EasyAuth, not API keys.

---

## Admin Role Gating (App Roles)

The Admin Hub uses **soft gating** based on Entra ID App Roles. By default (no App Roles configured), all authenticated users can access the Admin Hub. When App Roles are configured, only users with the `VariScout.Admin` role see the Shield icon.

### How It Works

The `/.auth/me` response includes `roles` claims when App Roles are configured:

```json
[
  {
    "provider_name": "aad",
    "user_id": "user@contoso.com",
    "user_claims": [
      { "typ": "name", "val": "Jane Smith" },
      { "typ": "roles", "val": "VariScout.Admin" }
    ]
  }
]
```

The app reads these claims via `EasyAuthUser.roles` and applies soft gating:

| Condition                               | Result                                         |
| --------------------------------------- | ---------------------------------------------- |
| No `roles` claims at all                | Admin Hub visible to all (backward compatible) |
| `roles` includes `VariScout.Admin`      | Admin Hub visible                              |
| `roles` exists but no `VariScout.Admin` | Admin Hub hidden                               |

### Setup (Optional)

To restrict admin access to specific users:

#### 1. Define the App Role

In Azure Portal → Entra ID → App registrations → your VariScout app → **App roles** → Create app role:

| Field                | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| Display name         | VariScout Admin                                            |
| Allowed member types | Users/Groups                                               |
| Value                | `VariScout.Admin`                                          |
| Description          | Can access the Admin Hub for diagnostics and configuration |

#### 2. Assign Users

In Azure Portal → Entra ID → Enterprise applications → VariScout → **Users and groups**:

- Add IT admins with role "VariScout Admin"
- Regular analysts get the default assignment (no admin role)

#### 3. Verify

After sign-in, the `roles` claim appears in the `/.auth/me` response. The Admin Hub Status tab shows the current gating mode:

- **"Admin access is currently open to all authenticated users"** — no App Roles configured
- **"Admin access restricted to users with the VariScout.Admin role"** — App Roles active

### Code Reference

- Role extraction: `apps/azure/src/auth/easyAuth.ts` (`EasyAuthUser.roles`)
- Gating logic: `apps/azure/src/hooks/useAdminAccess.ts`
- Shield icon gating: `apps/azure/src/App.tsx`
- Status display: `apps/azure/src/components/admin/AdminStatusTab.tsx`

---

## See Also

- [Blob Storage Sync](blob-storage-sync.md)
- [ARM Template](arm-template.md)
- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
- [ADR-059: Web-First Deployment Architecture](../../07-decisions/adr-059-web-first-deployment-architecture.md)
- [App Service Authentication Docs](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization)
