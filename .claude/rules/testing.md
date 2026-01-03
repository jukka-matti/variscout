# Testing Rules

> Full testing strategy: [docs/technical/TESTING_STRATEGY.md](../../docs/technical/TESTING_STRATEGY.md)

## Framework

- **Vitest** for unit tests
- **React Testing Library** for component tests
- Test files in `__tests__/` directories alongside source

## Test Ownership

| Package                  | Test Type            | What to Test                   |
| ------------------------ | -------------------- | ------------------------------ |
| `@variscout/core`        | Unit                 | stats, parser, license, export |
| `@variscout/pwa`         | Component            | UI components, context         |
| `@variscout/charts`      | Unit (optional)      | responsive utilities           |
| `@variscout/excel-addin` | Integration (future) | state bridge                   |

## Commands

```bash
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # Coverage report
```

## Patterns

- Test file naming: `ComponentName.test.tsx` or `util.test.ts`
- Use `describe` blocks for grouping related tests
- Prefer `getByRole` over `getByTestId` for component queries
- Mock external dependencies, not internal modules
- Use `toBeCloseTo()` for float comparisons in stats tests
