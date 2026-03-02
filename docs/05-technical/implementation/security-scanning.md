# Security Scanning

## Overview

VariScout uses ruflo for automated OWASP security audits. As an offline-first application with no backend, the attack surface is limited, but security scanning ensures dependency safety and code quality.

## Prerequisites

- Node.js 18+
- ruflo installed (runs via npx)

## Running a Security Scan

### Quick CVE Check

```bash
npx ruflo@latest security cve --check
```

### Full OWASP Scan

```bash
npx ruflo@latest security scan --depth full
```

### Auto-Fix with Agent Swarm

```bash
npx ruflo@latest swarm init --v3-mode
npx ruflo@latest swarm start --objective "Fix security issues identified in scan"
```

## OWASP Top 10 Coverage

| Category                       | What We Check                                      |
| ------------------------------ | -------------------------------------------------- |
| A01: Broken Access Control     | Tier feature gates, Azure Marketplace subscription |
| A02: Cryptographic Failures    | No sensitive keys (tier via ARM params)            |
| A03: Injection                 | CSV parser input sanitization                      |
| A04: Insecure Design           | Architecture review                                |
| A05: Security Misconfiguration | Build configs, env vars                            |
| A06: Vulnerable Components     | npm audit, CVE database                            |
| A07: Authentication Failures   | Azure EasyAuth configuration (Azure app)           |
| A08: Data Integrity Failures   | Data validation, import/export                     |
| A09: Logging Failures          | Sensitive data exposure checks                     |
| A10: SSRF                      | External request handling                          |

## Attack Surface

VariScout is offline-first with no backend. Key security areas:

### Parser Input Handling

- CSV parsing via PapaParse (well-maintained, no known CVEs)
- Text paste parsing via `parseText()` in `@variscout/core/parser.ts`

### npm Dependencies

- Regular `pnpm audit` for vulnerability scanning
- ruflo CVE checks for additional coverage

### Azure EasyAuth (Azure App Only)

- App Service Authentication (EasyAuth) -- no MSAL libraries
- API permissions: Standard plan = `User.Read` only; Team plan adds `Files.ReadWrite` (OneDrive sync)
- Token store via `/.auth/me` endpoint

### Audit Scope Exclusions

The security audit worker excludes non-application paths (`.venv/`, `node_modules/`, `dist/`, `site/`, minified files) to avoid false positives from build tooling and Python MkDocs dependencies.

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

### Transitive Dependency Overrides (March 2026)

Transitive dependencies (pulled in by our dev/build tooling) sometimes lag behind security patches. pnpm's `overrides` field in the root `package.json` pins these to patched versions within their declared semver ranges, so no compatibility breakage occurs.

**Current overrides (6):**

| Override                      | Pinned To | Pulled In By                                      | Vulnerability             |
| ----------------------------- | --------- | ------------------------------------------------- | ------------------------- |
| `minimatch@^3.0.0`            | 3.1.5     | eslint 9 → @eslint/eslintrc, @eslint/config-array | ReDoS (high)              |
| `minimatch@^10.0.0`           | 10.2.4    | @typescript-eslint → typescript-estree            | ReDoS (high)              |
| `rollup@^4.0.0`               | 4.59.0    | vite → rollup                                     | Path traversal (high)     |
| `serialize-javascript@^6.0.0` | 7.0.3     | workbox-build → @rollup/plugin-terser             | RCE (high)                |
| `ajv@^6.0.0`                  | 6.14.0    | eslint 9 → @eslint/eslintrc                       | ReDoS (moderate)          |
| `devalue@^5.0.0`              | 5.6.3     | astro → devalue                                   | Prototype pollution (low) |

All are dev/build tooling — none affect the deployed runtime bundle.

**Maintenance:**

1. Run `pnpm audit` after adding or upgrading dependencies
2. Only add overrides for packages actually in the dependency tree — verify with `pnpm --filter <pkg> why <dep>`
3. When the patched version becomes the natural resolution, the override is harmless but can be removed for cleanliness

**ESLint 10 migration path:** When `eslint-plugin-react` and `eslint-plugin-react-hooks` ship ESLint 10 support, migrating will eliminate the `minimatch@^3.0.0` and `ajv@^6.0.0` overrides (both pulled in via `@eslint/eslintrc`, which ESLint 10 drops). This reduces overrides from 6 → 4.

## Running Verification

After fixes, re-run the scan to confirm remediation:

```bash
npx ruflo@latest security scan --depth full
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Security Scan
  run: npx ruflo@latest security scan --depth full
```
