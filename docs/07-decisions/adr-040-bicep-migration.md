---
title: 'ADR-040: Migrate Infrastructure from ARM JSON to Bicep'
---

# ADR-040: Migrate Infrastructure from ARM JSON to Bicep

**Status**: Accepted

**Date**: 2026-03-22

## Context

The VariScout Azure infrastructure was defined in a single `infra/mainTemplate.json` ARM template. At 571+ lines of JSON, the template was difficult to maintain:

- JSON lacks comments, making intent unclear
- No modularity — all resources in one file (App Service, AI, Key Vault, Search, Functions)
- Repetitive boilerplate for each resource
- No IntelliSense or compile-time validation
- Microsoft recommends Bicep as the preferred IaC language for Azure

## Decision

Migrate the infrastructure definition from ARM JSON to modular Bicep:

- **`infra/main.bicep`** — Entry point that orchestrates all modules
- **`infra/modules/app-service.bicep`** — App Service Plan + Web App + EasyAuth
- **`infra/modules/ai-services.bicep`** — Azure AI Foundry (OpenAI) + model deployments
- **`infra/modules/key-vault.bicep`** — Key Vault + RBAC authorization
- **`infra/modules/search.bicep`** — Azure AI Search (Team plan)
- **`infra/modules/functions.bicep`** — Function App for OBO token exchange (Team plan)

The compiled `mainTemplate.json` is kept as an auto-generated output for Azure Marketplace packaging, which requires ARM JSON format. It is rebuilt via:

```bash
az bicep build --file main.bicep --outfile mainTemplate.json
```

The `createUiDefinition.json` (Marketplace deployment wizard UI) is unchanged — it is hand-authored JSON and not generated from Bicep.

## Consequences

### Positive

- **Better developer experience** — Bicep syntax is concise, readable, and supports comments
- **IntelliSense** — VS Code Bicep extension provides autocompletion, type checking, and hover docs
- **Modularity** — Each Azure resource group is isolated in its own module, easier to review and test
- **Compile-time validation** — Bicep catches errors before deployment (missing parameters, type mismatches)
- **Microsoft-recommended** — Bicep is the strategic direction for Azure IaC; ARM JSON is maintenance mode

### Neutral

- **Marketplace packaging unchanged** — Azure Marketplace still requires ARM JSON, so the compiled `mainTemplate.json` must be included in the deployment package
- **CI/CD unaffected** — The staging pipeline deploys app code only (not infrastructure); infrastructure deployment remains manual via Marketplace or CLI

### Negative

- **Build step required** — Developers must run `az bicep build` after editing `.bicep` files to regenerate `mainTemplate.json`
- **Bicep CLI dependency** — Azure CLI must be installed for compilation (already a prerequisite for Azure development)
