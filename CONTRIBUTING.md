# Contributing to VariScout Lite

Thank you for your interest in contributing! This document provides guidelines for contributing to VariScout Lite.

## Table of Contents

- [Philosophy](#philosophy)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Philosophy

Before contributing, please understand our design philosophy:

> **Stay Lite.** VariScout Lite is a focused analysis tool, not a platform.

We deliberately chose simplicity over feature richness. See [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) for what we built and why we chose NOT to build certain features.

**Contributions we welcome:**
- Bug fixes
- Performance improvements
- Accessibility enhancements
- Documentation improvements
- Features aligned with our roadmap

**Contributions we'll likely decline:**
- Complex multi-mode UIs
- Backend/server dependencies
- Features requiring user accounts
- Heavy third-party dependencies

## Development Setup

### Prerequisites
- Node.js v18+
- npm

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure

```
src/
├── components/       # React components
│   ├── charts/      # Visx chart components
│   └── __tests__/   # Component tests
├── context/         # React Context (DataContext)
├── hooks/           # Custom React hooks
├── lib/             # Utilities (persistence, export)
├── logic/           # Business logic (stats)
└── data/            # Sample data
```

### Key Files

| File | Purpose |
|------|---------|
| `src/context/DataContext.tsx` | Central state management |
| `src/logic/stats.ts` | Statistics calculations |
| `src/lib/persistence.ts` | Storage operations |
| `src/components/Dashboard.tsx` | Main layout |

## Code Style

### General Rules

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Functional components with hooks only
- **State**: Use DataContext, not local state for shared data
- **Styling**: Tailwind CSS utilities only

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StatsPanel.tsx` |
| Hooks | camelCase with `use` | `useDataIngestion.ts` |
| Utils | camelCase | `persistence.ts` |
| Tests | `*.test.ts(x)` | `stats.test.ts` |

### Color Conventions

For spec-related UI elements:
- `text-green-500` — Pass / In-spec
- `text-red-400` — Fail USL (above upper limit)
- `text-amber-500` — Fail LSL (below lower limit)

### Do's and Don'ts

**Do:**
- Keep components focused and small
- Write tests for business logic
- Use existing patterns from the codebase
- Document complex algorithms

**Don't:**
- Add new npm dependencies without discussion
- Use high-level chart abstractions (we use Visx primitives)
- Store sensitive data (we're offline-first)
- Break offline functionality

## Pull Request Process

### Before You Start

1. Check existing issues and PRs to avoid duplicates
2. For features, open an issue first to discuss the approach
3. For bugs, include reproduction steps in your issue

### Creating a PR

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run build: `npm run build`
6. Commit with clear messages
7. Push and create a Pull Request

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Code follows existing style
- [ ] Documentation updated if needed
- [ ] No new dependencies (or justified in PR)

### Review Process

1. Maintainers will review within a few days
2. Address feedback in new commits
3. Once approved, maintainers will merge

## Reporting Issues

### Bug Reports

Include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Sample data (if applicable, anonymized)
- Console errors

### Feature Requests

Include:
- Use case description
- How it aligns with our philosophy
- Proposed implementation (optional)

## Documentation

When contributing, please update relevant documentation:

| Change Type | Update |
|-------------|--------|
| New feature | PRODUCT_OVERVIEW.md, Specs.md |
| API change | ARCHITECTURE.md |
| New component | CLAUDE.md (Key Files) |
| Bug fix | CHANGELOG.md |

## Questions?

- Read [CLAUDE.md](CLAUDE.md) for quick reference
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Open an issue for questions

---

Thank you for contributing to VariScout Lite!
