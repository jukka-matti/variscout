# Testing Rules

## Framework

- **Vitest** for unit tests
- **React Testing Library** for component tests
- Test files in `__tests__/` directories alongside source

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
