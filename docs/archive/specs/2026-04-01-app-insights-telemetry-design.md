---
title: Application Insights Telemetry Design
status: delivered
related: [app-insights, telemetry, security, observability]
---

# Application Insights Telemetry Design

## Overview

VariScout uses Azure Application Insights for browser telemetry. Each customer's telemetry goes to their own App Insights instance (embedded in their Azure deployment), maintaining the customer-owned data principle.

## Architecture Decisions

### Connection String Is Client-Side (By Design)

The App Insights connection string is served to the browser via the `/config` runtime endpoint. This is **Microsoft's standard pattern** for browser SDKs:

- The connection string contains an **Instrumentation Key** (identifies the resource) and **Ingestion Endpoint** (where telemetry is sent)
- It is **write-only** — you can send telemetry but cannot read data
- It is **not a secret** — Microsoft's own documentation shows client-side usage
- Each customer gets their own connection string from their own Azure deployment

### Runtime Injection (Not Build-Time)

Connection string is injected via `server.js → /config` endpoint at runtime, not via `VITE_` env vars at build time. This is required for Azure Marketplace distribution where a single build artifact serves many customers.

## What Telemetry Is Collected

### Auto-Collected (SDK Default)

- Page views and route changes
- AJAX/fetch request timing
- JavaScript errors and exceptions
- Browser performance metrics

### Custom Events

- `AI.Call` — Per-call metadata: feature name, model, success, duration, token counts. **No user data or error messages.**
- `AI.Summary` — Aggregate stats: total calls, success rate, avg/p95 duration, total tokens

### Web Vitals (Custom Metrics)

- `Web.Vitals.CLS` — Cumulative Layout Shift
- `Web.Vitals.LCP` — Largest Contentful Paint
- `Web.Vitals.FCP` — First Contentful Paint
- `Web.Vitals.TTFB` — Time to First Byte

### Deployment Context (Custom Properties)

- `ai.cloud.role` = `variscout-browser`
- `deployment.plan` = `standard` | `team`

## What Is NOT Collected

- No customer data (measurements, factor values, findings text)
- No AI prompt content or responses
- No error messages from AI calls (only `hasError: true/false`)
- No user identifiers beyond what EasyAuth provides to App Insights

## Sampling

Fixed-rate sampling at 80% — 80% of telemetry is sent, 20% dropped. This prevents quota exhaustion in high-traffic deployments while maintaining statistical significance. Customers can override via Azure Portal.

## CSP Integration

The App Insights ingestion endpoint is dynamically extracted from the connection string and added to the CSP `connect-src` directive. Without this, strict CSP enforcement would silently block telemetry.

## SDK Loading Strategy

The App Insights SDK (`@microsoft/applicationinsights-web`) is dynamically imported after first paint. This keeps it out of the main bundle and avoids blocking the initial render.

## Related

- `apps/azure/src/lib/appInsights.ts` — SDK integration
- `apps/azure/server.js` — CSP and `/config` endpoint
- `apps/azure/src/lib/runtimeConfig.ts` — Config loading
- `docs/05-technical/implementation/disaster-recovery.md` — Monitoring context
