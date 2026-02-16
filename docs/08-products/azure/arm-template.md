# ARM Template Documentation

Azure Resource Manager (ARM) template for VariScout Managed Application deployment.

---

## Overview

The ARM template deploys VariScout to a customer's Azure subscription as a Managed Application with:

- Azure App Service (hosting via `WEBSITE_RUN_FROM_PACKAGE`)
- App Service Authentication (EasyAuth) with Azure AD
- App Registration (created via deployment script)
- Configuration settings (all features enabled)

**No backend resources** - the app runs entirely in the browser. The App Service serves the static build as a zip package.

### Managed Application Package

The template is packaged as a `.zip` file for Partner Center:

```
variscout-managed-app.zip
├── mainTemplate.json         # ARM template (this document)
└── createUiDefinition.json   # Azure portal deployment wizard
```

---

## Template Structure

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "metadata": {
    "description": "Deploys VariScout Azure App as a Managed Application with App Service and EasyAuth"
  },
  "parameters": {
    /* ... */
  },
  "variables": {
    /* ... */
  },
  "resources": [
    /* ... */
  ],
  "outputs": {
    /* ... */
  }
}
```

---

## Parameters

### Optional Parameters

| Parameter  | Type   | Default                 | Description                 |
| ---------- | ------ | ----------------------- | --------------------------- |
| `location` | string | Resource group location | Azure region for deployment |
| `appName`  | string | `variscout-{unique}`    | Name for App Service (3-24) |

All Managed Application deployments get full features — no tier parameter needed.

---

## Resources

### 1. App Service Plan

Linux B1 plan for hosting the App Service:

```json
{
  "type": "Microsoft.Web/serverfarms",
  "apiVersion": "2022-09-01",
  "name": "[variables('appServicePlanName')]",
  "location": "[parameters('location')]",
  "kind": "linux",
  "sku": {
    "name": "B1",
    "tier": "Basic"
  },
  "properties": {
    "reserved": true
  }
}
```

### 2. App Service

Serves the VariScout build via `WEBSITE_RUN_FROM_PACKAGE`:

```json
{
  "type": "Microsoft.Web/sites",
  "apiVersion": "2022-09-01",
  "name": "[variables('webAppName')]",
  "location": "[parameters('location')]",
  "properties": {
    "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
    "httpsOnly": true,
    "siteConfig": {
      "linuxFxVersion": "NODE|20-lts",
      "appSettings": [
        { "name": "WEBSITE_RUN_FROM_PACKAGE", "value": "[variables('packageUrl')]" },
        { "name": "VITE_LICENSE_TIER", "value": "enterprise" }
      ],
      "minTlsVersion": "1.2",
      "ftpsState": "Disabled"
    }
  }
}
```

### 3. EasyAuth Configuration (authsettingsV2)

App Service Authentication configured for Azure AD:

```json
{
  "type": "Microsoft.Web/sites/config",
  "apiVersion": "2022-09-01",
  "name": "[concat(variables('webAppName'), '/authsettingsV2')]",
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
          "openIdIssuer": "[concat('https://sts.windows.net/', subscription().tenantId, '/v2.0')]",
          "clientId": "[reference('createAppRegistration').outputs.appId]",
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

Key configuration:

- **Token store enabled**: tokens available at `/.auth/me` for Graph API calls
- **Login parameters**: requests `User.Read` and `Files.ReadWrite` scopes for OneDrive access
- **Redirect to login**: unauthenticated users are automatically redirected to Azure AD sign-in

### 4. App Registration (via Deployment Script)

Creates the App Registration with the correct redirect URI and permissions:

```json
{
  "type": "Microsoft.Resources/deploymentScripts",
  "apiVersion": "2020-10-01",
  "name": "createAppRegistration",
  "kind": "AzurePowerShell",
  "properties": {
    "azPowerShellVersion": "9.0",
    "timeout": "PT30M",
    "scriptContent": "..."
  }
}
```

The script:

1. Creates an App Registration with `AzureADMyOrg` sign-in audience
2. Sets redirect URI to `https://{app-url}/.auth/login/aad/callback`
3. Adds `User.Read` and `Files.ReadWrite` delegated permissions
4. Creates a client secret for EasyAuth
5. Outputs `appId` and `clientSecret` for the auth configuration

---

## Outputs

```json
{
  "outputs": {
    "appUrl": {
      "type": "string",
      "value": "[concat('https://', reference(resourceId('Microsoft.Web/sites', variables('webAppName'))).defaultHostName)]"
    },
    "appRegistrationId": {
      "type": "string",
      "value": "[reference('createAppRegistration').outputs.appId]"
    }
  }
}
```

---

## createUiDefinition.json

The `createUiDefinition.json` defines the Azure portal wizard shown to customers during deployment:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/0.1.2-preview/CreateUIDefinition.MultiVm.json#",
  "handler": "Microsoft.Azure.CreateUIDef",
  "version": "0.1.2-preview",
  "parameters": {
    "basics": [
      {
        "name": "appName",
        "type": "Microsoft.Common.TextBox",
        "label": "Application Name",
        "defaultValue": "variscout",
        "constraints": {
          "required": true,
          "regex": "^[a-z0-9-]{3,24}$",
          "validationMessage": "Name must be 3-24 lowercase letters, numbers, or hyphens."
        }
      }
    ],
    "steps": [],
    "outputs": {
      "appName": "[basics('appName')]",
      "location": "[location()]"
    }
  }
}
```

The wizard is intentionally minimal — there are no tiers or configuration options to choose. The customer provides an app name and selects a region, then the template deploys everything.

---

## Deployment Methods

### Azure Marketplace (Primary)

1. Customer finds VariScout on Azure Marketplace
2. Clicks "Create"
3. Enters app name and selects region
4. ARM template deploys automatically to managed resource group

### Azure CLI (Development/Testing)

```bash
# Create resource group
az group create --name rg-variscout --location westeurope

# Deploy template
az deployment group create \
  --resource-group rg-variscout \
  --template-file infra/mainTemplate.json

# Get outputs
az deployment group show \
  --resource-group rg-variscout \
  --name mainTemplate \
  --query properties.outputs
```

---

## Post-Deployment

No manual post-deployment configuration is required. EasyAuth is fully configured by the ARM template:

- Users visit the app URL and are redirected to Azure AD sign-in
- Consent for `User.Read` and `Files.ReadWrite` is requested on first login
- Tokens are stored in the EasyAuth token store and accessible via `/.auth/me`

### Custom Domain (Optional)

Add a custom domain to the App Service:

```bash
az webapp config hostname add \
  --webapp-name variscout-xyz123 \
  --resource-group rg-variscout \
  --hostname variscout.contoso.com
```

A custom domain also enables seamless Teams SSO (without it, users get a one-time login redirect because Microsoft blocks SSO on `*.azurewebsites.net`).

### Teams Integration (Optional)

The app includes an Admin page (Admin > Teams Setup) that generates a Teams app package. See the in-app instructions for uploading to your Teams admin center.

---

## Troubleshooting

### Deployment Fails

| Error                   | Cause                            | Fix                                     |
| ----------------------- | -------------------------------- | --------------------------------------- |
| `ResourceNotFound`      | Invalid location                 | Use supported region                    |
| `AuthorizationFailed`   | Insufficient permissions         | Requires Contributor + AD permissions   |
| `DeploymentScriptError` | App Registration creation failed | Check Graph API permissions             |
| `QuotaExceeded`         | App Service Plan limit           | Delete unused plans or request increase |

### Authentication Issues

If users can't sign in:

1. Verify the App Registration redirect URI matches the App Service URL + `/.auth/login/aad/callback`
2. Check the EasyAuth configuration in Azure Portal > App Service > Authentication
3. Verify user is in the correct tenant
4. Check `/.auth/me` returns a valid response (should return JSON array)

---

## Security Considerations

### Principle of Least Privilege

The template requests only necessary permissions:

| Permission        | Scope     | Purpose               |
| ----------------- | --------- | --------------------- |
| `User.Read`       | Delegated | Get user profile      |
| `Files.ReadWrite` | Delegated | OneDrive project sync |

### No Secrets in Template

The template:

- Creates a client secret via deployment script (stored as app setting, not in template)
- Does not create service principals with passwords
- Uses the EasyAuth token store (server-side) for access tokens

### Customer Data Isolation

- Each deployment is isolated to customer's tenant
- No cross-tenant data access
- No outbound connections to publisher systems
- Publisher management is disabled (zero publisher access)

---

## Template Versioning

| Version | Date       | Changes                                                 |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0.0   | 2026-02-01 | Initial release (Solution Template)                     |
| 2.0.0   | 2026-02-13 | Managed Application format, single plan                 |
| 3.0.0   | 2026-02-16 | App Service + EasyAuth (replaces Static Web App + MSAL) |

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Pricing](pricing-tiers.md)
- [Authentication](authentication.md)
- [Azure ARM Template Reference](https://docs.microsoft.com/azure/azure-resource-manager/templates/)
