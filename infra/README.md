# Azure Infrastructure Deployment

This directory contains the Infrastructure as Code (IaC) for the VariScout Azure Team App, deployed as an Azure Marketplace Managed Application.

## Contents

| File/Directory              | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `main.bicep`                | Bicep entry point (primary IaC source)                          |
| `modules/app-service.bicep` | App Service + EasyAuth module                                   |
| `modules/ai-services.bicep` | Azure AI Foundry (OpenAI) module                                |
| `modules/key-vault.bicep`   | Key Vault + RBAC module                                         |
| `modules/search.bicep`      | Azure AI Search module                                          |
| `modules/functions.bicep`   | Azure Functions (OBO token exchange) module                     |
| `mainTemplate.json`         | **Auto-generated** compiled ARM template (do not edit directly) |
| `createUiDefinition.json`   | Azure portal deployment wizard (Marketplace UI)                 |
| `functions/`                | Azure Functions code (OBO token exchange)                       |
| `functions/token-exchange/` | Teams SSO -> Graph API token exchange (OBO flow)                |

## Bicep Module Structure

```
infra/
├── main.bicep                  # Entry point — orchestrates all modules
├── modules/
│   ├── app-service.bicep       # App Service Plan + Web App + EasyAuth
│   ├── ai-services.bicep       # Azure AI Foundry (OpenAI) + model deployments
│   ├── key-vault.bicep         # Key Vault + RBAC authorization
│   ├── search.bicep            # Azure AI Search (Team plan)
│   └── functions.bicep         # Function App for OBO token exchange (Team plan)
├── mainTemplate.json           # Compiled output (auto-generated, do not edit)
├── createUiDefinition.json     # Marketplace deployment wizard
└── functions/                  # Azure Functions source code
```

> **Important**: `mainTemplate.json` is auto-generated from `main.bicep`. Always edit the `.bicep` files, then compile to JSON for Marketplace packaging.

## Building the ARM Template

After modifying any `.bicep` file, recompile the ARM template:

```bash
az bicep build --file main.bicep --outfile mainTemplate.json
```

This produces the `mainTemplate.json` required by Azure Marketplace packaging.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed (includes Bicep)
- An active Azure subscription
- An Azure AD App Registration with `User.Read` and `Files.ReadWrite` permissions (see [ARM Template docs](../docs/08-products/azure/arm-template.md#pre-deployment-create-app-registration))

## Deployment Steps

1. **Login to Azure**

   ```bash
   az login
   ```

2. **Create a Resource Group**
   Replace `westeurope` with your preferred region.

   ```bash
   az group create --name rg-variscout --location westeurope
   ```

3. **Deploy Resources**
   Replace placeholders with your App Registration credentials.

   ```bash
   az deployment group create \
     --resource-group rg-variscout \
     --template-file main.bicep \
     --parameters \
       appName=variscout \
       clientId=<app-reg-client-id> \
       clientSecret=<app-reg-secret> \
       variscoutPlan=standard
   ```

   Alternatively, deploy the compiled ARM template:

   ```bash
   az deployment group create \
     --resource-group rg-variscout \
     --template-file mainTemplate.json \
     --parameters clientId=<app-reg-client-id> clientSecret=<app-reg-secret>
   ```

## Resources Created

- **App Service (B1 Linux):** Hosts the VariScout SPA via `WEBSITE_RUN_FROM_PACKAGE`.
- **EasyAuth (Azure AD):** App Service Authentication with Azure AD sign-in.
- **App Service Plan:** B1 Basic Linux plan.
- **Key Vault:** Secure storage for client secret and API keys.
- **Azure AI Services:** AI Foundry (OpenAI) with model deployments (all plans).
- **Azure AI Search (Team plan only):** Knowledge Base search.
- **Function App (Team plan only):** OBO token exchange for Teams silent SSO.

## Function App

The `functions/` directory contains an Azure Function that exchanges a Teams SSO token for a Graph API access token via the On-Behalf-Of (OBO) flow. This enables silent authentication when the app runs inside a Teams tab — no redirect flash for OneDrive sync or photo uploads.

**Endpoint:** `POST /api/token-exchange`
**Security:** Validates the incoming JWT's `aud` claim matches `CLIENT_ID` before exchanging.
**Dependencies:** `@azure/msal-node` (installed via `npm install` in `functions/`).

The Function App is provisioned by the Bicep template (conditional on Team plan) and deployed via the CI/CD pipeline when `AZURE_FUNCTION_APP_NAME` is configured.

## Fresh Deployment Notes

On a fresh deployment, the Function App starts before Key Vault RBAC assignments are created.
This causes temporary errors when the Function App tries to resolve `@Microsoft.KeyVault()` references.
The Function App will self-heal within minutes as Azure propagates the RBAC assignment.

If errors persist, restart the Function App:

```bash
az webapp restart -g <resource-group> -n <function-app-name>
```

## See Also

- [ARM Template Documentation](../docs/08-products/azure/arm-template.md)
- [Authentication](../docs/08-products/azure/authentication.md)
- [Marketplace Guide](../docs/08-products/azure/marketplace.md)
- [ADR-040: Bicep Migration](../docs/07-decisions/adr-040-bicep-migration.md)
