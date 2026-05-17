metadata description = 'Deploys VariScout Azure App as a Managed Application with App Service and EasyAuth'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Name for the App Service (3-24 lowercase letters, numbers, or hyphens)')
@minLength(3)
@maxLength(24)
param appName string = 'variscout-${uniqueString(resourceGroup().id)}'

@description('Client ID of the Azure AD App Registration for authentication')
param clientId string

@description('Client secret of the Azure AD App Registration. Stored in Key Vault and referenced via @Microsoft.KeyVault() in app settings.')
@secure()
param clientSecret string

@description('URL to the VariScout application deployment package')
param packageUrl string = 'https://variscout.blob.${environment().suffixes.storage}/releases/variscout-azure-latest.zip'

// --- Derived names ---
var appServicePlanName = '${appName}-plan'
var webAppName = appName
var appInsightsName = '${appName}-insights'
var aiServicesName = '${appName}-ai'
var searchServiceName = '${appName}-search'
var keyVaultName = 'kv-${take(appName, 17)}-${take(uniqueString(resourceGroup().id), 4)}'

var aiSearchIndex = 'findings'

// --- AI Services ---
module aiServices 'modules/ai-services.bicep' = {
  name: 'aiServices'
  params: {
    location: location
    aiServicesName: aiServicesName
    appInsightsName: appInsightsName
  }
}

// --- Search Service ---
module search 'modules/search.bicep' = {
  name: 'search'
  params: {
    location: location
    searchServiceName: searchServiceName
  }
}

// --- App Service (always deployed) ---
module appService 'modules/app-service.bicep' = {
  name: 'appService'
  params: {
    location: location
    appServicePlanName: appServicePlanName
    webAppName: webAppName
    clientId: clientId
    clientSecret: clientSecret
    packageUrl: packageUrl
    aiEndpoint: aiServices.outputs.aiEndpoint
    appInsightsConnectionString: aiServices.outputs.appInsightsConnectionString
    searchServiceName: searchServiceName
    aiSearchIndex: aiSearchIndex
    storageAccountName: 'variscout${uniqueString(resourceGroup().id)}'
    storageContainerName: 'variscout-projects'
  }
}

// --- Blob Storage ---
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    appServicePrincipalId: appService.outputs.principalId
  }
}

// --- Key Vault ---
module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    keyVaultName: keyVaultName
    clientSecret: clientSecret
    aiServicesApiKey: aiServices.outputs.aiServicesApiKey
    searchApiKey: search.outputs.searchAdminKey
    webAppPrincipalId: appService.outputs.principalId
  }
}

// --- Outputs ---
output appUrl string = 'https://${appService.outputs.defaultHostName}'
output aiEndpoint string = aiServices.outputs.aiEndpoint
output searchEndpoint string = 'https://${searchServiceName}.search.windows.net'
output appInsightsConnectionString string = aiServices.outputs.appInsightsConnectionString
