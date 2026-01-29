# Security Scanning

## Overview

VariScout uses Claude Flow v3 for automated OWASP security audits. As an offline-first application with no backend, the attack surface is limited, but security scanning ensures dependency safety and code quality.

## Prerequisites

- Node.js 18+
- Claude Flow v3 installed (runs via npx)

## Running a Security Scan

### Quick CVE Check

```bash
npx claude-flow@v3alpha security cve --check
```

### Full OWASP Scan

```bash
npx claude-flow@v3alpha security scan --depth full
```

### Auto-Fix with Agent Swarm

```bash
npx claude-flow@v3alpha swarm init --v3-mode
npx claude-flow@v3alpha swarm start --objective "Fix security issues identified in scan"
```

## OWASP Top 10 Coverage

| Category                       | What We Check                             |
| ------------------------------ | ----------------------------------------- |
| A01: Broken Access Control     | Edition feature gates, license validation |
| A02: Cryptographic Failures    | License key handling                      |
| A03: Injection                 | CSV/Excel parser input sanitization       |
| A04: Insecure Design           | Architecture review                       |
| A05: Security Misconfiguration | Build configs, env vars                   |
| A06: Vulnerable Components     | npm audit, CVE database                   |
| A07: Authentication Failures   | Azure MSAL configuration (Azure app)      |
| A08: Data Integrity Failures   | Data validation, import/export            |
| A09: Logging Failures          | Sensitive data exposure checks            |
| A10: SSRF                      | External request handling                 |

## Attack Surface

VariScout is offline-first with no backend. Key security areas:

### Parser Input Handling

- CSV parsing via PapaParse (well-maintained, no known CVEs)
- Excel parsing via ExcelJS (replaced vulnerable xlsx/SheetJS in Jan 2026)

### npm Dependencies

- Regular `pnpm audit` for vulnerability scanning
- Claude Flow CVE checks for additional coverage

### License Validation System

- Client-side only, no sensitive keys exposed
- Edition detection via build-time flags

### Azure MSAL Configuration (Azure App Only)

- OAuth token handling
- OneDrive API permissions

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

### Transitive Dependencies

Some transitive dependencies have known issues but are low risk for this application:

- `qs`, `devalue`, `h3` - vulnerabilities in dev/build tooling dependencies (astro, office-addin)
- These do not affect runtime security of the PWA

## Running Verification

After fixes, re-run the scan to confirm remediation:

```bash
npx claude-flow@v3alpha security scan --depth full
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Security Scan
  run: npx claude-flow@v3alpha security scan --depth full
```
