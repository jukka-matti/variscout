// src/auth/msalConfig.ts

import { Configuration, PublicClientApplication } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    'User.Read', // Get user profile
    'Files.ReadWrite', // OneDrive access
    'Sites.ReadWrite.All', // SharePoint access
  ],
};

export const msalInstance = new PublicClientApplication(msalConfig);
