# Excel Add-in Deployment Guide

This guide covers deploying the VariScout Excel Add-in to production and distributing it to your organization.

## Prerequisites

- Node.js 18+
- pnpm 8+
- HTTPS hosting (Vercel, Azure, etc.)
- Microsoft 365 Global Admin access (for organization deployment)

## Build for Production

### 1. Build with Production URL

```bash
# From repository root
ADDIN_URL=https://your-domain.com pnpm build:excel:prod
```

This will:

1. Build the add-in with TypeScript and Vite
2. Generate `manifest.prod.xml` and `manifest-content.prod.xml` with production URLs

### 2. Environment Variables

| Variable        | Description                           | Default                  |
| --------------- | ------------------------------------- | ------------------------ |
| `ADDIN_URL`     | Production URL where add-in is hosted | `https://localhost:3000` |
| `TASKPANE_GUID` | Fixed GUID for Task Pane add-in       | Random UUID              |
| `CONTENT_GUID`  | Fixed GUID for Content add-in         | Random UUID              |

**Note:** Use fixed GUIDs in production to maintain consistent add-in identity across updates.

Example with fixed GUIDs:

```bash
ADDIN_URL=https://excel.variscout.com \
TASKPANE_GUID=12345678-1234-1234-1234-123456789012 \
CONTENT_GUID=87654321-4321-4321-4321-210987654321 \
pnpm build:excel:prod
```

## Deploy to Vercel

### Option A: CLI Deployment

```bash
cd apps/excel-addin
npx vercel --prod
```

### Option B: Git Integration

1. Connect your repository to Vercel
2. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `apps/excel-addin`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`

## Deploy to Organization

After hosting is set up, deploy the add-in to your Microsoft 365 organization.

### Option A: Microsoft 365 Admin Center (UI)

1. Go to [admin.microsoft.com](https://admin.microsoft.com)
2. Navigate to **Settings** → **Integrated apps**
3. Click the **Add-ins** link
4. Click **Deploy Add-in**
5. Choose **Upload custom apps**
6. Upload `manifest.prod.xml`
7. Configure deployment:
   - **Users:** Choose specific users, groups, or entire organization
   - **Deployment method:** Fixed (recommended for controlled rollout)
8. Repeat steps 4-7 for `manifest-content.prod.xml`

### Option B: PowerShell (Scriptable)

Install the deployment module:

```powershell
Install-Module -Name O365CentralizedAddInDeployment
```

Connect as Global Admin:

```powershell
Connect-OrganizationAddInService
```

Deploy both add-ins:

```powershell
# Deploy Task Pane add-in
New-OrganizationAddIn -ManifestPath './manifest.prod.xml' -Locale 'en-US'

# Deploy Content add-in
New-OrganizationAddIn -ManifestPath './manifest-content.prod.xml' -Locale 'en-US'
```

Assign to organization:

```powershell
# Get add-in IDs
$taskPane = Get-OrganizationAddIn | Where-Object { $_.DisplayName -eq 'VariScout' }
$content = Get-OrganizationAddIn | Where-Object { $_.DisplayName -eq 'VariScout Charts' }

# Assign to everyone
Set-OrganizationAddInAssignments -ProductId $taskPane.ProductId -AssignToEveryone $true
Set-OrganizationAddInAssignments -ProductId $content.ProductId -AssignToEveryone $true

# Or assign to specific users/groups
Set-OrganizationAddInAssignments -ProductId $taskPane.ProductId -Add -Members 'user@company.com', 'group@company.com'
```

### Other PowerShell Commands

```powershell
# List all deployed add-ins
Get-OrganizationAddIn

# Get details of specific add-in
Get-OrganizationAddIn -ProductId <guid>

# Update an add-in manifest
Set-OrganizationAddIn -ProductId <guid> -ManifestPath './manifest.prod.xml' -Locale 'en-US'

# Disable an add-in
Set-OrganizationAddIn -ProductId <guid> -Enabled $false

# Remove an add-in
Remove-OrganizationAddIn -ProductId <guid>
```

## Deployment Timeline

- **New deployment:** Up to 24 hours to appear for all users
- **Updates:** Up to 72 hours to propagate
- **Removal:** Up to 24 hours to reflect

## Troubleshooting

### Add-in not appearing for users

1. Verify deployment status in Admin Center
2. Check user is in assigned group
3. Wait up to 24 hours for propagation
4. Have user restart Excel

### Certificate errors

Ensure your hosting uses valid HTTPS certificates. Self-signed certificates won't work for production deployment.

### PowerShell MFA issues

The O365CentralizedAddInDeployment module only supports Basic authentication. If your admin account requires MFA:

1. Create a service account without MFA for scripting
2. Use the Admin Center UI instead

## Files Reference

| File                        | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `manifest.xml`              | Development Task Pane manifest (localhost)      |
| `manifest-content.xml`      | Development Content add-in manifest (localhost) |
| `manifest.prod.xml`         | Production Task Pane manifest (generated)       |
| `manifest-content.prod.xml` | Production Content add-in manifest (generated)  |
| `vercel.json`               | Vercel deployment configuration                 |

## Resources

- [Deploy add-ins in the admin center](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-deployment-of-add-ins)
- [Centralized Deployment PowerShell cmdlets](https://learn.microsoft.com/en-us/microsoft-365/enterprise/use-the-centralized-deployment-powershell-cmdlets-to-manage-add-ins)
- [Deploy and publish Office Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/publish/publish)
