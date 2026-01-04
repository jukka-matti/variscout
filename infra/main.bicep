// infra/main.bicep

param appName string = 'variscout'
param location string = resourceGroup().location
@description('The Azure AD Tenant ID used for authentication')
param tenantId string

// Static Web App (Frontend)
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'stapp-${appName}'
  location: location
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {}
}

// Consumption plan for Functions
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-${appName}'
  location: location
  sku: { name: 'Y1', tier: 'Dynamic' }
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
      appSettings: [
        { name: 'AZURE_TENANT_ID', value: tenantId }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~18' }
      ]
    }
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostName string = staticWebApp.properties.defaultHostname
output functionAppName string = functionApp.name
