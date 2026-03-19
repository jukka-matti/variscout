---
title: 'Authentication (EasyAuth)'
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

This replaces the previous MSAL library approach, eliminating `@azure/msal-browser` and `@azure/msal-react` dependencies.

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

## Graph API Token Usage

The `/.auth/me` response includes an `access_token` that can be used for Microsoft Graph API calls:

```typescript
const token = await getAccessToken();

const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root:/VariScout/Projects', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

The token is automatically scoped to the permissions configured in the EasyAuth login parameters. Standard plan: `User.Read`. Team plan adds: `Files.ReadWrite`, `Files.ReadWrite.All`, `Channel.ReadBasic.All`.

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
          "loginParameters": ["scope=openid profile email User.Read Files.ReadWrite"]
        }
      }
    },
    "login": {
      "tokenStore": { "enabled": true }
    }
  }
}
```

> **Note:** The `loginParameters` scope shown above is for the **Team plan**. The actual ARM template uses a conditional expression — Standard plan requests `User.Read` only, Team plan requests the full scope including `Files.ReadWrite`.

See [ARM Template](arm-template.md) for the complete deployment configuration.

---

## Required Permissions

**Standard plan (€99/month):**

| Permission | Type      | Admin Consent | Purpose          |
| ---------- | --------- | ------------- | ---------------- |
| User.Read  | Delegated | No            | Get user profile |

No admin consent required — users grant consent on first login.

**Team plan (€199/month) / Team AI (€279/month) additional scopes:**

| Permission            | Type      | Admin Consent | Purpose                   |
| --------------------- | --------- | ------------- | ------------------------- |
| Files.ReadWrite       | Delegated | No            | OneDrive analysis sync    |
| Files.ReadWrite.All   | Delegated | Yes           | Channel SharePoint access |
| Channel.ReadBasic.All | Delegated | Yes           | Channel listing           |

---

## Teams SSO (Team Plan)

When running inside Microsoft Teams, the app uses the Teams SDK for single sign-on:

### Client-side token acquisition

1. `@microsoft/teams-js` `authentication.getAuthToken()` acquires an Azure AD token scoped to the app's client ID
2. This token identifies the user but cannot call Graph API directly
3. For Graph API access, the app falls back to EasyAuth redirect (standard flow)

### On-Behalf-Of (OBO) Function

When running inside Teams, the app exchanges the Teams SSO token for a Graph API token via an Azure Function:

1. `getTeamsSsoToken()` acquires an Azure AD token scoped to the app's client ID
2. The token is POST-ed to the OBO function (`/api/token-exchange`)
3. The function validates the token's audience matches `CLIENT_ID`, then exchanges it via MSAL OBO flow
4. The Graph API token is returned and cached client-side (5 min margin). Scoped tokens (e.g., ChannelMessage.Send) and resource-specific tokens (e.g., SharePoint File Picker) are also cached with the same margin.
5. If OBO fails, the app falls back to EasyAuth redirect (graceful degradation)

This enables **silent SSO** — no redirect flash when saving to OneDrive or uploading photos from within Teams.

**Security controls on the OBO function:**

| Control             | Detail                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Audience validation | JWT `aud` must match `CLIENT_ID` — prevents exchanging tokens issued for other apps               |
| Scope allowlist     | Only `Files.ReadWrite.All`, `ChannelMessage.Send`, `People.Read` — other scopes rejected with 400 |
| CORS                | Configurable `ALLOWED_ORIGIN` env var (defaults to `*` for dev); `OPTIONS` preflight supported    |
| Function-key auth   | Optional `FUNCTION_KEY` env var — if set, requests must include `X-Functions-Key` header          |
| Generic errors      | Catch block returns `"Token exchange failed"` — no MSAL internals leaked to clients               |
| Method restriction  | Only `POST` accepted; other methods return 405                                                    |

- Function code: `infra/functions/token-exchange/index.js`
- Client module: `apps/azure/src/auth/graphToken.ts`
- Used by: all service files via `graphFetch.ts` — `storage.ts` (OneDrive sync), `photoUpload.ts` (photo uploads), `reportUpload.ts` (report sharing), `graphChannelMessage.ts` (Teams @mentions), `graphPeople.ts` (people search), `channelDrive.ts` (channel drive resolution)
- See [ADR-016](../../07-decisions/adr-016-teams-integration.md) Phase 6

### Teams SSO in the manifest

- `webApplicationInfo` in the Teams manifest enables SSO
- Requires the App Registration's Client ID
- Custom domains recommended (SSO blocked on `*.azurewebsites.net`)

### Code reference

- Teams SDK init: `apps/azure/src/teams/teamsContext.ts`
- SSO token: `getTeamsSsoToken()` in the same module
- Tab configuration: `apps/azure/src/teams/TeamsTabConfig.tsx`

---

## Cognitive Services Scope (AI Features)

When AI features are enabled (`enableAI` parameter in ARM template), EasyAuth additionally requests the Cognitive Services scope:

| Scope                                          | Purpose                     | Conditional             |
| ---------------------------------------------- | --------------------------- | ----------------------- |
| `https://cognitiveservices.azure.com/.default` | Azure AI Foundry API access | Only when AI is enabled |

**How it works:** Same EasyAuth pattern as Graph API — the scope is added to `loginParameters` in `authsettingsV2` conditionally based on `enableAI`. The browser obtains Cognitive Services tokens via the existing `getAccessToken()` helper.

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

- [OneDrive Sync](onedrive-sync.md)
- [ARM Template](arm-template.md)
- [AI Architecture](../../05-technical/architecture/ai-architecture.md)
- [App Service Authentication Docs](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization)
