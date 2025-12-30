# Excel Add-in Rules

## Architecture

- **Hybrid Approach**: Native Excel slicers + Visx charts in Content Add-in
- Task Pane: Setup wizard, configuration, settings (Fluent UI)
- Content Add-in: Embedded charts (Visx, dark theme)

## Styling

- Task Pane uses Fluent UI `tokens` for colors/spacing
- Content Add-in uses `darkTheme` token system from `src/lib/darkTheme.ts`
- **Never hardcode colors** - always use token references

## Dark Theme Tokens (Content Add-in)

```typescript
import { darkTheme } from '../lib/darkTheme';

// Use tokens, not hardcoded values:
backgroundColor: darkTheme.colorNeutralBackground1,  // Not '#0f172a'
color: darkTheme.colorNeutralForeground1,            // Not '#f1f5f9'
```

## State Management

- State sync via Custom Document Properties (`stateBridge.ts`)
- Charts poll for slicer changes (no native events)
- Use `getFilteredTableData()` to read visible rows

## Key Files

- `src/lib/darkTheme.ts` - Token definitions
- `src/lib/stateBridge.ts` - State persistence
- `src/content/ContentDashboard.tsx` - Main chart display

## Office.js APIs

- ExcelApi 1.9+ required for chart types
- ExcelApi 1.10+ required for slicers
