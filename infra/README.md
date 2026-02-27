# Azure Infrastructure Deployment

This directory contains the Infrastructure as Code (IaC) templates for the VariScout Azure Team App, deployed as an Azure Marketplace Managed Application.

## Contents

| File                        | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `mainTemplate.json`         | ARM template (App Service + EasyAuth + Function) |
| `createUiDefinition.json`   | Azure portal deployment wizard                   |
| `functions/`                | Azure Functions code (OBO token exchange)        |
| `functions/token-exchange/` | Teams SSO → Graph API token exchange (OBO flow)  |

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
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
   Replace `<app-reg-client-id>` and `<app-reg-secret>` with your App Registration credentials.
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
- **Function App (Team plan only):** OBO token exchange for Teams silent SSO.

## Function App

The `functions/` directory contains an Azure Function that exchanges a Teams SSO token for a Graph API access token via the On-Behalf-Of (OBO) flow. This enables silent authentication when the app runs inside a Teams tab — no redirect flash for OneDrive sync or photo uploads.

**Endpoint:** `POST /api/token-exchange`
**Security:** Validates the incoming JWT's `aud` claim matches `CLIENT_ID` before exchanging.
**Dependencies:** `@azure/msal-node` (installed via `npm install` in `functions/`).

The Function App is provisioned by the ARM template (conditional on Team plan) and deployed via the CI/CD pipeline when `AZURE_FUNCTION_APP_NAME` is configured.

## See Also

- [ARM Template Documentation](../docs/08-products/azure/arm-template.md)
- [Authentication](../docs/08-products/azure/authentication.md)
- [Marketplace Guide](../docs/08-products/azure/marketplace.md)
