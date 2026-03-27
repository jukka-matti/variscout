@description('Azure region for deployment')
param location string

@description('Name for the App Service Plan')
param appServicePlanName string

@description('Name for the Web App')
param webAppName string

@description('VariScout plan identifier')
param variscoutPlan string

@description('Client ID of the Azure AD App Registration')
param clientId string

@description('Client secret of the Azure AD App Registration')
@secure()
param clientSecret string

@description('URL to the VariScout application deployment package')
param packageUrl string

@description('Whether AI features are enabled')
param hasAI bool

@description('Whether Team plan features are enabled')
param hasTeamFeatures bool

@description('Function App name (for URL construction)')
param functionAppName string

@description('AI endpoint URL (empty if AI disabled)')
param aiEndpoint string

@description('App Insights connection string (empty if AI disabled)')
param appInsightsConnectionString string

@description('Search service name (for URL construction)')
param searchServiceName string

@description('AI Search index name')
param aiSearchIndex string

var tags = {
  product: 'VariScout'
  plan: variscoutPlan
  managedBy: 'AzureMarketplace'
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: packageUrl
        }
        {
          name: 'VITE_LICENSE_TIER'
          value: 'enterprise'
        }
        {
          name: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
          value: clientSecret
        }
        {
          name: 'VITE_VARISCOUT_PLAN'
          value: variscoutPlan
        }
        {
          name: 'VITE_FUNCTION_URL'
          value: hasAI ? 'https://${functionAppName}.azurewebsites.net' : ''
        }
        {
          name: 'AI_ENDPOINT'
          value: aiEndpoint
        }
        {
          name: 'AI_SEARCH_ENDPOINT'
          value: hasTeamFeatures ? 'https://${searchServiceName}.search.windows.net' : ''
        }
        {
          name: 'AI_SEARCH_INDEX'
          value: aiSearchIndex
        }
        {
          name: 'FUNCTION_URL'
          value: hasAI ? 'https://${functionAppName}.azurewebsites.net' : ''
        }
        {
          name: 'VITE_APPINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

resource authSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: true
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureactivedirectory'
      excludedPaths: [
        '/health'
        '/config'
      ]
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          openIdIssuer: '${environment().authentication.loginEndpoint}${subscription().tenantId}/v2.0'
          clientId: clientId
          clientSecretSettingName: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
        }
        login: {
          loginParameters: [
            hasTeamFeatures
              ? 'scope=openid profile email User.Read Files.ReadWrite Files.ReadWrite.All Channel.ReadBasic.All People.Read ChannelMessage.Send'
              : 'scope=openid profile email User.Read https://cognitiveservices.azure.com/.default'
          ]
        }
      }
    }
    login: {
      tokenStore: {
        enabled: true
      }
    }
  }
}

@description('Resource ID of the Web App')
output webAppId string = webApp.id

@description('Default hostname of the Web App')
output defaultHostName string = webApp.properties.defaultHostName

@description('Principal ID of the Web App managed identity')
output principalId string = webApp.identity.principalId
