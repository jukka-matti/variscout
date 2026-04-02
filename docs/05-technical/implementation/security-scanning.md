---
title: 'Security Scanning'
---

# Security Scanning

## Overview

VariScout uses ruflo for automated OWASP security audits. As an offline-first application with no backend, the attack surface is limited, but security scanning ensures dependency safety and code quality.

## Prerequisites

- Node.js 18+
- ruflo installed (runs via npx)

## Running a Security Scan

### Quick CVE Check

```bash
npx ruflo@3.5.42 security cve --check
```

### Full OWASP Scan

```bash
npx ruflo@3.5.42 security scan --depth full
```

### Auto-Fix with Agent Swarm

Use MCP tools to dispatch a targeted security audit worker:

```bash
# Via MCP: mcp__ruflo__hooks_worker-dispatch with trigger: "audit"
# Or manually:
npx ruflo@3.5.42 security scan --depth full --fix
```

## OWASP Top 10 Coverage

| Category                       | What We Check                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| A01: Broken Access Control     | Tier feature gates, Azure Marketplace subscription                                    |
| A02: Cryptographic Failures    | No sensitive keys (tier via ARM params)                                               |
| A03: Injection                 | CSV parser input sanitization                                                         |
| A04: Insecure Design           | Architecture review                                                                   |
| A05: Security Misconfiguration | CSP headers, Permissions-Policy, security headers on all 3 apps, CORS on OBO function |
| A06: Vulnerable Components     | npm audit, CVE database                                                               |
| A07: Authentication Failures   | Azure EasyAuth configuration (Azure app)                                              |
| A08: Data Integrity Failures   | Data validation, import/export                                                        |
| A09: Logging Failures          | Sensitive data exposure checks                                                        |
| A10: SSRF                      | External request handling                                                             |

## Attack Surface

VariScout is offline-first with no backend. Key security areas:

### Parser Input Handling

- CSV parsing via PapaParse (well-maintained, no known CVEs)
- Text paste parsing via `parseText()` in `@variscout/core/parser.ts`

### npm Dependencies

- Regular `pnpm audit` for vulnerability scanning
- ruflo CVE checks for additional coverage

### Azure EasyAuth (Azure App Only)

- App Service Authentication (EasyAuth) — no MSAL libraries
- API permissions: Standard plan = `User.Read` only; Team plan adds `People.Read`
- Zero admin-consent scopes (ADR-059)
- Token store via `/.auth/me` endpoint
- Periodic background token refresh (45-minute interval) prevents session expiry

### Knowledge Base API Endpoints (Team Plan, ADR-060)

- All KB endpoints (`/api/kb-*`) validate EasyAuth token via `x-ms-client-principal` header
- Team tier enforcement via `requireTeamPlan` middleware
- UUID validation on `projectId` and `documentId` parameters (prevents OData filter injection)
- Project-level data isolation via server-computed `projectId` filter
- See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md) for architecture

### Audit Scope Exclusions

The security audit worker excludes non-application paths (`.venv/`, `node_modules/`, `dist/`, `site/`, minified files) to avoid false positives from build tooling and Python MkDocs dependencies.

## Security Hardening

| Measure                                                       | Scope                   | Details                                                                        |
| ------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Security headers (CSP, HSTS, Permissions-Policy)              | Azure App, PWA, Website | See [deployment.md](deployment.md)                                             |
| EasyAuth (zero admin-consent, ADR-059)                        | Azure App               | See [authentication.md](../../08-products/azure/authentication.md)             |
| KB endpoint auth + UUID validation (ADR-060)                  | Azure App (Team plan)   | See [ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md) |
| Service worker (Workbox via vite-plugin-pwa)                  | PWA                     | See [PWA docs](../../08-products/pwa/index.md)                                 |
| Supply chain (Dependabot, SHA-pinned actions, CycloneDX SBOM) | CI/CD                   | See [deployment.md](deployment.md)                                             |
| Transitive dependency overrides (17 overrides)                | All packages            | See "Transitive Dependency Overrides" section above                            |
| Graceful shutdown (SIGTERM handler)                           | Azure App server        | See [deployment.md](deployment.md)                                             |
| Periodic token refresh (45-min interval)                      | Azure App               | See [authentication.md](../../08-products/azure/authentication.md)             |
| Vulnerability disclosure (`/.well-known/security.txt`)        | Website                 | `apps/website/public/.well-known/security.txt`                                 |

## Security Backlog

- [ ] PWA icons — generate `pwa-192x192.png` and `pwa-512x512.png` (requires image generation)
- [ ] Penetration testing — engage external vendor before Marketplace GA
- [ ] Threat model — STRIDE model covering EasyAuth, OBO, OneDrive sync, service worker
- [ ] Incident response plan — classification, escalation paths, response procedures

## When to Run

- Before releases
- After adding new dependencies
- After significant code changes
- Periodically (monthly recommended)

## Reviewing Results

| Severity | Action                         |
| -------- | ------------------------------ |
| Critical | Fix immediately, block release |
| High     | Fix before release             |
| Medium   | Fix in next sprint             |
| Low      | Track and prioritize           |

## Known Issues

### Resolved: SheetJS xlsx Package (January 2026)

The xlsx package was replaced with ExcelJS to resolve CVE-2023-30533 (Prototype Pollution) and a ReDoS vulnerability. The patched xlsx versions (0.19.3+) were only available through SheetJS's commercial CDN.

**Resolution:**

- Replaced `xlsx` with `exceljs` in `@variscout/core`
- Removed unused `xlsx` from `@variscout/pwa`
- ExcelJS 4.4.0+ has no known high/critical vulnerabilities

### Transitive Dependency Overrides (updated April 2026)

Transitive dependencies sometimes lag behind security patches. pnpm's `overrides` field in the root `package.json` pins these to patched versions. This is the [Microsoft-recommended approach](https://learn.microsoft.com/azure/devops/repos/security/github-advanced-security-dependency-scanning) for transitive vulnerability remediation.

**Current overrides (17):**

| Override                      | Pinned To | Pulled In By                           | Vulnerability                   | Scope    |
| ----------------------------- | --------- | -------------------------------------- | ------------------------------- | -------- |
| `minimatch@^3.0.0`            | 3.1.5     | eslint 9 → @eslint/eslintrc            | ReDoS (high)                    | Dev      |
| `minimatch@^10.0.0`           | 10.2.4    | @typescript-eslint → typescript-estree | ReDoS (high)                    | Dev      |
| `rollup@^4.0.0`               | 4.59.0    | vite → rollup                          | Path traversal (high)           | Dev      |
| `serialize-javascript@^6.0.0` | 7.0.3     | workbox-build → @rollup/plugin-terser  | RCE (high)                      | Dev      |
| `undici@>=7.0.0`              | 7.24.0    | vitest → jsdom → undici                | Unhandled exception (high)      | Dev      |
| `svgo@^4.0.0`                 | 4.0.1     | astro → svgo                           | DoS via entity expansion (high) | Dev      |
| `flatted@^3.0.0`              | 3.4.2     | eslint → file-entry-cache → flat-cache | Unbounded recursion DoS (high)  | Dev      |
| `h3@^1.0.0`                   | 1.15.9    | astro → h3                             | Open redirect (high)            | Dev      |
| `fast-xml-parser@^5.0.0`      | 5.5.8     | astro → fast-xml-parser                | Entity expansion DoS (moderate) | Dev      |
| `picomatch@^2.0.0`            | 2.3.2     | various → picomatch                    | ReDoS (moderate)                | Dev      |
| `picomatch@>=4.0.0`           | 4.0.4     | various → picomatch                    | ReDoS (moderate)                | Dev      |
| `handlebars@^4.0.0`           | 4.7.9     | storybook → handlebars                 | Prototype pollution (high)      | Dev      |
| `ajv@^6.0.0`                  | 6.14.0    | eslint 9 → @eslint/eslintrc            | ReDoS (moderate)                | Dev      |
| `devalue@^5.0.0`              | 5.6.4     | astro → devalue                        | Prototype pollution (low)       | Dev      |
| `lodash@>=4.0.0`              | 4.18.1    | @visx/\* → lodash                      | Prototype pollution (high)      | **Prod** |
| `lodash-es@>=4.0.0`           | 4.18.1    | mermaid → chevrotain → lodash-es       | Prototype pollution (high)      | Dev      |
| `@xmldom/xmldom@<0.8.12`      | 0.8.12    | read-excel-file → @xmldom/xmldom       | Entity expansion (high)         | **Prod** |

**Scope legend:** Dev = dev/build tooling only, not in deployed bundle. Prod = in the runtime bundle.

**Production overrides (2):** `lodash` (via @visx chart library) and `@xmldom/xmldom` (via read-excel-file). Both are backward-compatible patch upgrades. @visx v4 (alpha Nov 2025) is expected to resolve lodash; read-excel-file needs an upstream release for xmldom.

**Maintenance:**

1. Run `pnpm audit --audit-level=high` after adding or upgrading dependencies (CI enforces this)
2. Only add overrides for packages in the dependency tree — verify with `pnpm --filter <pkg> why <dep>`
3. When the patched version becomes the natural resolution, remove the override for cleanliness
4. Review overrides quarterly — remove any that upstream dependencies have resolved
5. Document the reason for each override in this table

**Remaining moderate/low vulnerabilities (7):** These are below the `--audit-level=high` CI threshold and monitored via Dependabot alerts. Includes `smol-toml`, `brace-expansion`, `yaml`, `serialize-javascript` (different advisory), and `astro` — all in dev/build tooling.

## Running Verification

After fixes, re-run the scan to confirm remediation:

```bash
npx ruflo@3.5.42 security scan --depth full
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Security Scan
  run: npx ruflo@3.5.42 security scan --depth full
```
