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

@description('VariScout plan: \'standard\' (local files, AI included), \'team\' (+ OneDrive, Teams collaboration, Knowledge Base)')
@allowed([
  'standard'
  'team'
])
param variscoutPlan string = 'standard'

// --- Derived names ---
var appServicePlanName = '${appName}-plan'
var webAppName = appName
var functionAppName = '${appName}-func'
var functionStorageName = 'vsf${uniqueString(resourceGroup().id)}'
var functionPlanName = '${appName}-func-plan'
var appInsightsName = '${appName}-insights'
var aiServicesName = '${appName}-ai'
var searchServiceName = '${appName}-search'
var keyVaultName = 'kv-${take(appName, 17)}-${take(uniqueString(resourceGroup().id), 4)}'

// --- Feature flags ---
var hasTeamFeatures = (variscoutPlan == 'team')
// hasAI is always true for current allowed plans (standard, team).
// Kept as a variable for future-proofing if a 'free' plan tier is introduced.
var hasAI = (variscoutPlan != 'free')
var aiSearchIndex = 'findings'

// --- AI Services (conditional: standard + team) ---
module aiServices 'modules/ai-services.bicep' = if (hasAI) {
  name: 'aiServices'
  params: {
    location: location
    aiServicesName: aiServicesName
    appInsightsName: appInsightsName
    variscoutPlan: variscoutPlan
  }
}

// --- Search Service (conditional: team only) ---
module search 'modules/search.bicep' = if (hasTeamFeatures) {
  name: 'search'
  params: {
    location: location
    searchServiceName: searchServiceName
    variscoutPlan: variscoutPlan
  }
}

// --- App Service (always deployed) ---
module appService 'modules/app-service.bicep' = {
  name: 'appService'
  params: {
    location: location
    appServicePlanName: appServicePlanName
    webAppName: webAppName
    variscoutPlan: variscoutPlan
    clientId: clientId
    clientSecret: clientSecret
    packageUrl: packageUrl
    hasAI: hasAI
    hasTeamFeatures: hasTeamFeatures
    functionAppName: functionAppName
    aiEndpoint: hasAI ? aiServices.outputs.aiEndpoint : ''
    appInsightsConnectionString: hasAI ? aiServices.outputs.appInsightsConnectionString : ''
    searchServiceName: searchServiceName
    aiSearchIndex: aiSearchIndex
  }
}

// --- Functions (conditional: standard + team) ---
// Function App uses @Microsoft.KeyVault() references in app settings,
// which resolve at runtime — no deploy-time dependency on Key Vault.
module functions 'modules/functions.bicep' = if (hasAI) {
  name: 'functions'
  params: {
    location: location
    functionAppName: functionAppName
    functionPlanName: functionPlanName
    functionStorageName: functionStorageName
    variscoutPlan: variscoutPlan
    hasAI: hasAI
    clientId: clientId
    keyVaultName: keyVaultName
    aiEndpoint: hasAI ? aiServices.outputs.aiEndpoint : ''
    webAppDefaultHostName: appService.outputs.defaultHostName
  }
}

// --- Key Vault (conditional: standard + team) ---
// Deployed after Functions so we can store the function key as a secret.
module keyVault 'modules/key-vault.bicep' = if (hasAI) {
  name: 'keyVault'
  params: {
    location: location
    keyVaultName: keyVaultName
    variscoutPlan: variscoutPlan
    hasTeamFeatures: hasTeamFeatures
    clientSecret: clientSecret
    aiServicesApiKey: hasAI ? aiServices.outputs.aiServicesApiKey : ''
    searchApiKey: hasTeamFeatures ? search.outputs.searchAdminKey : ''
    // Function key is passed when hasAI (standard + team) but only stored as a KV secret
    // when hasTeamFeatures (team only). Standard plan Functions don't need KV-stored keys
    // because they're only accessed internally by the App Service.
    functionKey: hasAI ? functions.outputs.defaultFunctionKey : ''
    webAppPrincipalId: appService.outputs.principalId
    functionAppPrincipalId: hasAI ? functions.outputs.principalId : ''
  }
}

// --- Outputs ---
output appUrl string = 'https://${appService.outputs.defaultHostName}'
output functionUrl string = hasAI ? 'https://${functionAppName}.azurewebsites.net' : ''
output aiEndpoint string = hasAI ? aiServices.outputs.aiEndpoint : ''
output searchEndpoint string = hasTeamFeatures ? 'https://${searchServiceName}.search.windows.net' : ''
output appInsightsConnectionString string = hasAI ? aiServices.outputs.appInsightsConnectionString : ''
