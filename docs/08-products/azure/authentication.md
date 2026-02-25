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

The token is automatically scoped to the permissions configured in the EasyAuth login parameters (`User.Read`, `Files.ReadWrite`).

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

See [ARM Template](arm-template.md) for the complete deployment configuration.

---

## Required Permissions

| Permission      | Type      | Purpose                |
| --------------- | --------- | ---------------------- |
| User.Read       | Delegated | Get user profile       |
| Files.ReadWrite | Delegated | OneDrive analysis sync |

No admin consent required — users grant consent on first login.

---

## See Also

- [OneDrive Sync](onedrive-sync.md)
- [ARM Template](arm-template.md)
- [App Service Authentication Docs](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization)
