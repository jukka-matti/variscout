# VaRiScout Azure App

Team-enabled variation analysis with Azure AD authentication and OneDrive/SharePoint sync.

## Features

- Full analysis capabilities (I-Chart, Boxplot, Pareto, ANOVA, Regression, Gage R&R)
- Azure AD single sign-on
- OneDrive personal storage
- SharePoint team storage
- Offline-first with automatic sync
- 20 language translations

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your Azure AD credentials
# (see Azure AD Setup below)

# Start development server
pnpm dev
```

## Azure AD Setup

### 1. Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App Registrations
2. Click **New registration**
3. Configure:
   - **Name**: VaRiScout Azure App
   - **Supported account types**: Based on your needs:
     - Single tenant: "Accounts in this organizational directory only"
     - Multi-tenant: "Accounts in any organizational directory"
   - **Redirect URI**: Select "Single-page application (SPA)" and add:
     - `http://localhost:5173` (development)
     - `https://your-production-domain.com` (production)

### 2. Configure API Permissions

Go to your app registration > API permissions > Add a permission > Microsoft Graph:

| Permission          | Type      | Purpose           |
| ------------------- | --------- | ----------------- |
| User.Read           | Delegated | Read user profile |
| Files.ReadWrite     | Delegated | OneDrive access   |
| Sites.ReadWrite.All | Delegated | SharePoint access |

Click "Grant admin consent" if your organization requires it.

### 3. Get Credentials

From the app registration Overview page, copy:

- **Application (client) ID** → `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_TENANT_ID`

## Environment Variables

| Variable               | Required | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `AZURE_CLIENT_ID`      | Yes      | Azure AD app client ID                      |
| `AZURE_TENANT_ID`      | Yes      | Tenant ID or 'common' for multi-tenant      |
| `VITE_SHAREPOINT_SITE` | No       | SharePoint site path (default: /sites/root) |
| `VITE_EDITION`         | No       | 'itc' or 'licensed' for branding            |

## Build & Deploy

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Azure Static Web Apps Deployment

1. Create Azure Static Web App in Azure Portal
2. Connect to your GitHub repository
3. Configure build:
   - **App location**: `apps/azure`
   - **Output location**: `dist`
   - **API location**: `apps/azure/api`
4. Add environment variables in Static Web App Configuration

### Manual Deployment

The build output (`dist/`) can be deployed to any static hosting:

- Azure Blob Storage with Static Website
- Azure CDN
- Vercel
- Netlify

## Development

```bash
# Run development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Project Structure

```
apps/azure/
├── api/                 # Azure Functions (project API)
│   └── projects/        # CRUD endpoints for cloud storage
├── src/
│   ├── auth/            # MSAL configuration
│   ├── components/      # React components
│   ├── context/         # State management
│   ├── db/              # IndexedDB schema (Dexie)
│   ├── locales/         # i18n translations
│   ├── pages/           # Route pages
│   └── services/        # Storage and sync logic
└── .env.example         # Environment template
```

## Current Limitations

- SharePoint site is hardcoded to `/sites/root` (multi-site picker not implemented)
- Share dialog and permission management not yet implemented
- Team collaboration features (real-time, comments) planned for future release

## License

Part of the VaRiScout monorepo. See root LICENSE file.
