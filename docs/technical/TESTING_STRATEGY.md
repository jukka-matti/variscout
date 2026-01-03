# Testing Strategy

**Status:** Active
**Last Updated:** January 2026

---

## Philosophy

VariScout Lite testing follows these principles:

1. **Test critical paths first** - Statistical accuracy is business-critical
2. **Behavior over implementation** - Test what the code does, not how it does it
3. **Local-first** - All tests run locally without CI/CD dependencies
4. **Test where the code lives** - Unit tests in the same package as the code

---

## Framework

| Tool                          | Purpose                         |
| ----------------------------- | ------------------------------- |
| **Vitest**                    | Test runner (Vite-native, fast) |
| **React Testing Library**     | Component testing (PWA)         |
| **@testing-library/jest-dom** | DOM assertions                  |

### Running Tests

```bash
# Run all tests across monorepo
pnpm test

# Run tests in specific package
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test

# Watch mode (during development)
pnpm --filter @variscout/core test -- --watch

# Coverage report
pnpm --filter @variscout/core test -- --coverage
```

---

## Test Ownership by Package

| Package                  | Test Type                | What to Test                                                                                                                    |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `@variscout/core`        | **Unit**                 | Statistics (calculateStats, calculateAnova, calculateRegression, calculateGageRR), parser, license validation, export utilities |
| `@variscout/pwa`         | **Component**            | UI components (StatsPanel, Dashboard, DataTableModal)                                                                           |
| `@variscout/pwa`         | **Integration**          | Data context, persistence layer                                                                                                 |
| `@variscout/charts`      | **Unit** (optional)      | Responsive utilities only                                                                                                       |
| `@variscout/excel-addin` | **Integration** (future) | State bridge, Office.js integration                                                                                             |

---

## Priority Tiers

| Priority | Category          | Rationale                                                          |
| -------- | ----------------- | ------------------------------------------------------------------ |
| **P0**   | Statistics engine | Business-critical accuracy - wrong Cpk could lead to bad decisions |
| **P1**   | Data persistence  | User data integrity - losing projects is unacceptable              |
| **P2**   | Export/Import     | Data portability - .vrs files must work reliably                   |
| **P3**   | UI components     | User interactions - important but less critical                    |

---

## Current Coverage

### @variscout/core (30+ test cases)

| Function                | Tested | Cases                                                    |
| ----------------------- | ------ | -------------------------------------------------------- |
| `calculateStats()`      | ✅     | Basic stats, Cp/Cpk, one-sided specs, empty data         |
| `calculateAnova()`      | ✅     | Significant/non-significant, group stats, eta-squared    |
| `calculateRegression()` | ✅     | Linear, quadratic, weak relationships, optimum detection |
| `calculateGageRR()`     | ✅     | Excellent/unacceptable systems, variance components      |

### @variscout/pwa (25+ test cases)

| Component        | Tested | Focus                                  |
| ---------------- | ------ | -------------------------------------- |
| `StatsPanel`     | ✅     | Conditional display, Cp/Cpk formatting |
| `Dashboard`      | ✅     | Empty state, chart rendering           |
| `DataTableModal` | ✅     | Cell editing, row operations           |
| `export.ts`      | ✅     | CSV generation, special characters     |

### @variscout/charts

| Item                 | Tested                    |
| -------------------- | ------------------------- |
| Chart components     | ❌ (visual, hard to test) |
| Responsive utilities | ❌ (optional)             |

### @variscout/excel-addin

| Item                  | Tested      |
| --------------------- | ----------- |
| State bridge          | ❌ (future) |
| Office.js integration | ❌ (future) |

---

## Testing Patterns

### Float Comparisons (Statistics)

```typescript
// Use toBeCloseTo for floating-point math
expect(stats.mean).toBeCloseTo(11.2, 1); // 1 decimal precision
expect(stats.cpk).toBeCloseTo(0.33, 2); // 2 decimal precision
```

### Component Testing with Context

```typescript
import { vi } from 'vitest';
import * as DataContextModule from '../context/DataContext';

beforeEach(() => {
  vi.restoreAllMocks();
});

it('displays Cpk when showCpk is true', () => {
  vi.spyOn(DataContextModule, 'useData').mockReturnValue({
    displayOptions: { showCpk: true },
    // ... other context values
  });

  render(<StatsPanel stats={mockStats} />);
  expect(screen.getByText('Cpk')).toBeInTheDocument();
});
```

### Mocking External Libraries

```typescript
// Mock libraries with CSS/DOM issues
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }) => <div data-testid="panel">{children}</div>,
}));

// Mock child components to isolate tests
vi.mock('../charts/IChart', () => ({
  default: () => <div data-testid="i-chart">Mock</div>,
}));
```

### Query Selection

| Method          | When to Use                      |
| --------------- | -------------------------------- |
| `getByRole()`   | Prefer for accessibility         |
| `getByText()`   | Static text content              |
| `queryByText()` | Testing element absence          |
| `getByTestId()` | Last resort for complex elements |

---

## Test File Organization

```
packages/core/
├── src/
│   ├── stats.ts
│   ├── parser.ts
│   └── __tests__/
│       └── stats.test.ts

apps/pwa/
├── src/
│   ├── components/
│   │   ├── StatsPanel.tsx
│   │   └── __tests__/
│   │       └── StatsPanel.test.tsx
│   ├── lib/
│   │   ├── export.ts
│   │   └── __tests__/
│   │       └── export.test.ts
│   └── test/
│       ├── setup.ts      # Test setup file
│       └── utils.tsx     # Mock data & helpers
```

---

## Adding New Tests

### For @variscout/core

1. Create test file in `packages/core/src/__tests__/`
2. Import from relative path: `import { fn } from '../module'`
3. Use `describe/it/expect` from vitest (global)

### For @variscout/pwa

1. Create test file in `__tests__/` alongside component
2. Use mock utilities from `src/test/utils.tsx`
3. Mock context with `vi.spyOn(DataContextModule, 'useData')`

---

## Manual QA Checklist

For features that are difficult to automate, see the manual testing checklist in [docs/technical/README.md](README.md).

---

## Related Documentation

- [.claude/rules/testing.md](../../.claude/rules/testing.md) - Quick reference testing rules
- [docs/technical/README.md](README.md) - Manual QA checklist
