# Deployment Guide

This document covers build commands, deployment workflows, and environment configurations for VariScout Lite applications.

## Current Workflow

Development currently follows a local testing approach with manual commits:

1. Local development with `pnpm dev`
2. Run tests with `pnpm test`
3. Build verification with `pnpm build`
4. Manual git commit and push
5. Manual deployment to hosting platforms

> **Note**: Automated CI/CD pipelines are planned but not yet implemented. This document serves as a placeholder for future automation.

---

## Build Commands

### Development

```bash
# PWA development server (localhost:5173)
pnpm dev

# Excel Add-in development server (localhost:3000)
pnpm dev:excel

# Azure app development server
pnpm --filter @variscout/azure-app dev

# Marketing website development server
pnpm --filter @variscout/website dev
```

### Production Builds

```bash
# Build all packages and apps
pnpm build

# Build specific packages
pnpm --filter @variscout/core build
pnpm --filter @variscout/charts build
pnpm --filter @variscout/pwa build

# Build PWA editions
pnpm build:pwa:community  # Community edition
pnpm build:pwa:licensed   # Licensed edition
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Package-specific tests
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

---

## Environment Configuration

### PWA Environment Variables

| Variable               | Description                       | Default           |
| ---------------------- | --------------------------------- | ----------------- |
| `VITE_EDITION`         | Edition type (community/licensed) | `community`       |
| `VITE_APP_VERSION`     | App version for display           | From package.json |
| `VITE_LICENSE_API_URL` | License validation endpoint       | Production URL    |

### Azure App Environment Variables

| Variable                  | Description                | Required |
| ------------------------- | -------------------------- | -------- |
| `VITE_AZURE_CLIENT_ID`    | MSAL application client ID | Yes      |
| `VITE_AZURE_TENANT_ID`    | Azure AD tenant ID         | Yes      |
| `VITE_AZURE_REDIRECT_URI` | OAuth redirect URI         | Yes      |

### Excel Add-in Environment Variables

| Variable            | Description           | Default   |
| ------------------- | --------------------- | --------- |
| `VITE_ADDIN_ID`     | Office Add-in ID      | Dev ID    |
| `VITE_MANIFEST_URL` | Manifest XML location | localhost |

---

## Deployment Targets

### PWA (Vercel - Planned)

```yaml
# Future vercel.json configuration
{
  'buildCommand': 'pnpm build:pwa:community',
  'outputDirectory': 'apps/pwa/dist',
  'framework': 'vite',
}
```

**Manual deployment steps (current)**:

1. Run `pnpm build:pwa:community`
2. Deploy `apps/pwa/dist/` to static hosting
3. Verify service worker registration

### Marketing Website (Vercel - Planned)

```yaml
# Future configuration
{
  'buildCommand': 'pnpm --filter @variscout/website build',
  'outputDirectory': 'apps/website/dist',
  'framework': 'astro',
}
```

### Azure App (Azure Static Web Apps - Planned)

```yaml
# Future Azure Static Web Apps configuration
app_location: 'apps/azure'
output_location: 'dist'
api_location: ''
```

### Excel Add-in (Office Store - Planned)

1. Build add-in package
2. Generate manifest XML
3. Submit to Office Store Partner Center
4. Sideload for testing

---

## Future CI/CD Pipeline

### Planned GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml (planned)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    # Deploy to preview URL

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    # Deploy to production
```

### Pipeline Stages (To Be Implemented)

1. **Lint & Type Check**: ESLint, TypeScript compilation
2. **Unit Tests**: Vitest for all packages
3. **Build**: All packages and apps
4. **Integration Tests**: E2E tests (Playwright - planned)
5. **Preview Deploy**: PR preview environments
6. **Production Deploy**: Main branch auto-deploy

---

## Pre-Deployment Checklist

### Before Any Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] Build completes without errors (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Version numbers updated if releasing

### PWA-Specific

- [ ] Service worker caches new assets
- [ ] Lighthouse PWA score acceptable (>90)
- [ ] Offline functionality verified
- [ ] Edition-specific features work correctly

### Azure App-Specific

- [ ] MSAL authentication working
- [ ] OneDrive sync tested
- [ ] Correct tenant configuration
- [ ] Permissions scoped correctly

### Excel Add-in-Specific

- [ ] Manifest validates against schema
- [ ] Sideload testing in desktop/web Excel
- [ ] State bridge persists correctly
- [ ] All supported Excel versions tested

---

## Rollback Procedures

### Current (Manual)

1. Identify last known good commit
2. Checkout and rebuild
3. Redeploy manually

### Planned (Automated)

- Vercel automatic rollback to previous deployment
- Azure deployment slots for blue-green deployments
- Version tagging for easy rollback points

---

## Monitoring (Planned)

### Planned Integrations

| Service          | Purpose                     |
| ---------------- | --------------------------- |
| Vercel Analytics | PWA traffic, performance    |
| Sentry           | Error tracking (PWA, Azure) |
| Azure Monitor    | Azure app health            |

### Key Metrics to Track

- Page load time
- Error rates by type
- Storage usage
- Feature adoption by edition

---

## Next Steps

1. Set up GitHub Actions for CI
2. Configure Vercel for PWA deployment
3. Add Azure Static Web Apps for Azure app
4. Implement preview deployments for PRs
5. Add Lighthouse CI for performance regression testing
