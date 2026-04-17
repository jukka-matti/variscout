# eslint-plugin-variscout

VariScout-specific ESLint rules enforcing numeric safety (ADR-069), chart color conventions, and
terminology requirements (P5 contribution principle, interaction geometry language).

Rules are being added incrementally; see `index.js` for the current list.

## Installation

This plugin is workspace-local and not published to npm. It is consumed by the monorepo root
`eslint.config.js` via a `workspace:*` reference.

Add to root `package.json` devDependencies:

```json
"eslint-plugin-variscout": "workspace:*"
```

Then import in `eslint.config.js`:

```javascript
import variscoutPlugin from 'eslint-plugin-variscout';
```

And register in a config object:

```javascript
{
  plugins: { variscout: variscoutPlugin },
  rules: {
    'variscout/no-tofixed-on-stats': 'error',
    // ...
  },
}
```

## Rules

| Rule         | Category | Severity | Description                  |
| ------------ | -------- | -------- | ---------------------------- |
| _(none yet)_ | —        | —        | Rules are added in Tasks 2–5 |

Rules planned for subsequent tasks:

- **`no-tofixed-on-stats`** — Enforces ADR-069 B3: forbids `.toFixed()` on stat values in UI and
  AI prompt code; directs to `formatStatistic()` from `@variscout/core/i18n`.
- **`no-hardcoded-chart-colors`** — Forbids hex color literals inside chart component files;
  requires `chartColors`/`chromeColors` constants from `@variscout/charts/colors`.
- **`no-root-cause-language`** — Forbids the phrase "root cause" in user-facing strings and AI
  prompts per P5; requires "contribution" instead.
- **`no-interaction-moderator`** — Forbids "moderator"/"primary" when describing statistical
  interactions; requires geometric terms (ordinal/disordinal).

## Development

### Adding a rule

1. Create `rules/<rule-name>.js` with the rule implementation.
2. Write tests in `rules/__tests__/<rule-name>.test.js` using `@eslint/rule-tester` or vitest.
3. Export the rule from `index.js` under `rules`.
4. Document it in the table above.

### Running tests

```bash
pnpm --filter eslint-plugin-variscout test
```

Or from the monorepo root:

```bash
pnpm test
```

### Conventions

- Rule files are plain ES modules (`type: "module"` in `package.json`).
- Each rule exports a default object with `meta` and `create` per the ESLint Rule API.
- Prefer `messageId` over inline `message` strings for testability.

## References

- [ADR-069 — Three-Boundary Numeric Safety](../../docs/07-decisions/adr-069-three-boundary-numeric-safety.md)
- [Constitution P5 — Contribution not causation](../../docs/01-vision/constitution.md)
- Interaction language feedback — user memory at `feedback_interaction_language.md`
- [ESLint Rule API (v9)](https://eslint.org/docs/latest/extend/custom-rules)
