# Azure Infrastructure Deployment

This directory contains the Infrastructure as Code (IaC) templates for the VariScout Azure Team App.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- An active Azure subscription

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
   Run the following command, replacing `<your-tenant-id>` with your Azure AD Tenant ID.
   ```bash
   az deployment group create \
     --resource-group rg-variscout \
     --template-file main.bicep \
     --parameters tenantId=<your-tenant-id>
   ```

## Resources Created

- **Static Web App:** Hosts the Frontend React application.
- **Function App:** Hosts the Backend Node.js API.
- **App Service Plan:** Consumption plan for the Function App.
