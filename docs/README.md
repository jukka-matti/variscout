# VariScout Documentation

Complete guide to understanding and building VariScout Lite - lightweight, offline-first variation analysis tool for quality professionals.

---

## Quick Navigation

| Section           | Path                                        | Description                                        |
| ----------------- | ------------------------------------------- | -------------------------------------------------- |
| **User Flows**    | [flows/](./flows/OVERVIEW.md)               | How users interact with VariScout across platforms |
| **Case Studies**  | [cases/](./cases/README.md)                 | Teaching cases with demo data                      |
| **Concepts**      | [concepts/](./concepts/README.md)           | Methodology, strategy, and learning frameworks     |
| **Technical**     | [technical/](./technical/README.md)         | Implementation guides and specifications           |
| **Design System** | [design-system/](./design-system/README.md) | UI/UX standards, components, charts                |
| **Products**      | [products/](#product-documentation)         | Product specifications by platform                 |

---

## Product Documentation

| Product      | Path                                              | Description                                 |
| ------------ | ------------------------------------------------- | ------------------------------------------- |
| **PWA**      | [products/pwa/](./products/pwa/README.md)         | Progressive Web App (main product)          |
| **Azure**    | [products/azure/](./products/azure/OVERVIEW.md)   | Team deployment with SharePoint/OneDrive    |
| **Excel**    | [products/excel/](./products/excel/OVERVIEW.md)   | Excel Add-in with native slicer integration |
| **Website**  | [products/website/](./products/website/README.md) | Marketing website and content strategy      |
| **Power BI** | [products/powerbi/](./products/powerbi/)          | Custom visuals for Power BI                 |

---

## Architecture References

Core technical documentation for developers:

| Document                                          | Description                           |
| ------------------------------------------------- | ------------------------------------- |
| [Monorepo Structure](./MONOREPO_ARCHITECTURE.md)  | Package organization and dependencies |
| [Statistics Reference](./STATISTICS_REFERENCE.md) | Statistical calculations and formulas |
| [Hooks Reference](./HOOKS_REFERENCE.md)           | Shared React hooks API                |
| [User Flows](./USER_FLOWS.md)                     | High-level user journey mapping       |

---

## Getting Started

### For Developers

Start with the [Monorepo Architecture](./MONOREPO_ARCHITECTURE.md) to understand the codebase structure:

```
variscout-lite/
├── packages/
│   ├── core/      # @variscout/core - Statistics, parser, types
│   ├── charts/    # @variscout/charts - Visx chart components
│   ├── hooks/     # @variscout/hooks - Shared React hooks
│   └── ui/        # @variscout/ui - UI utilities, colors, components
├── apps/
│   ├── pwa/       # PWA website (React + Vite)
│   ├── azure/     # Azure Team App
│   ├── website/   # Marketing website (Astro)
│   └── excel-addin/ # Excel Add-in (Office.js)
└── docs/          # This documentation
```

### For Product Understanding

1. **Start with methodology**: [Four Pillars](./concepts/four-pillars/OVERVIEW.md) and [Two Voices](./concepts/two-voices/OVERVIEW.md)
2. **See it in action**: [Case Studies](./cases/README.md) with real demo data
3. **Understand user flows**: [User Flows](./flows/OVERVIEW.md) by platform

---

## Documentation Standards

### Directory Structure

| Directory        | Index File    | Purpose                       |
| ---------------- | ------------- | ----------------------------- |
| `cases/`         | `README.md`   | Teaching cases with demo data |
| `concepts/`      | `README.md`   | Strategy and methodology      |
| `design-system/` | `README.md`   | UI/UX standards               |
| `flows/`         | `OVERVIEW.md` | User experience flows         |
| `products/`      | Per-product   | Product specifications        |
| `technical/`     | `README.md`   | Implementation guides         |

### File Naming

- `README.md` - Primary index for directory
- `OVERVIEW.md` - Alternative index (used in concepts subdirs)
- `UPPER_CASE.md` - Specification documents
- `kebab-case.md` - Reference documents

---

## Quick Links

- **Development**: `pnpm dev` (PWA), `pnpm dev:excel` (Excel Add-in)
- **Testing**: `pnpm test` (all packages), `pnpm --filter @variscout/core test`
- **Building**: `pnpm build` (all packages)

See root [README.md](../README.md) for complete development instructions.
