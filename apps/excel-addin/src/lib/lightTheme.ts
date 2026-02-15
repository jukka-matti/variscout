/**
 * Light Theme Tokens for Content Add-in
 *
 * The Content Add-in renders in an iframe without FluentProvider,
 * so it uses this custom token system matching Tailwind's slate palette.
 *
 * Token naming follows Fluent UI conventions for consistency.
 * This is the light theme counterpart to darkTheme.ts.
 *
 * @see docs/EXCEL_ADDIN_DESIGN_SYSTEM.md
 */

export const lightTheme = {
  // ─────────────────────────────────────────────────────────────────
  // Backgrounds
  // ─────────────────────────────────────────────────────────────────
  /** Main container background (slate-50) */
  colorNeutralBackground1: '#f8fafc',
  /** Card/panel background (slate-100) */
  colorNeutralBackground2: '#f1f5f9',
  /** Interactive/hover background (slate-200) */
  colorNeutralBackground3: '#e2e8f0',

  // ─────────────────────────────────────────────────────────────────
  // Foreground (Text)
  // ─────────────────────────────────────────────────────────────────
  /** Primary text (slate-900) */
  colorNeutralForeground1: '#0f172a',
  /** Secondary text (slate-600) */
  colorNeutralForeground2: '#475569',
  /** Tertiary/muted text (slate-500) */
  colorNeutralForeground3: '#64748b',
  /** Disabled/faint text (slate-400) */
  colorNeutralForeground4: '#94a3b8',

  // ─────────────────────────────────────────────────────────────────
  // Stroke (Borders)
  // ─────────────────────────────────────────────────────────────────
  /** Primary border (slate-300) */
  colorNeutralStroke1: '#cbd5e1',
  /** Subtle border (slate-200) */
  colorNeutralStroke2: '#e2e8f0',

  // ─────────────────────────────────────────────────────────────────
  // Status Colors (slightly darker for light background contrast)
  // ─────────────────────────────────────────────────────────────────
  /** Success/pass (green-600) */
  colorStatusSuccessForeground: '#16a34a',
  /** Danger/fail (red-600) */
  colorStatusDangerForeground: '#dc2626',
  /** Warning (amber-600) */
  colorStatusWarningForeground: '#d97706',

  // ─────────────────────────────────────────────────────────────────
  // Brand Colors
  // ─────────────────────────────────────────────────────────────────
  /** Brand primary (blue-600) */
  colorBrandForeground1: '#2563eb',
  /** Brand secondary (blue-500) */
  colorBrandForeground2: '#3b82f6',

  // ─────────────────────────────────────────────────────────────────
  // Spacing (same as dark theme)
  // ─────────────────────────────────────────────────────────────────
  /** Extra small spacing: 4px */
  spacingXS: 4,
  /** Small spacing: 8px */
  spacingS: 8,
  /** Medium spacing: 12px */
  spacingM: 12,
  /** Large spacing: 16px */
  spacingL: 16,
  /** Extra large spacing: 24px */
  spacingXL: 24,

  // ─────────────────────────────────────────────────────────────────
  // Border Radius (same as dark theme)
  // ─────────────────────────────────────────────────────────────────
  /** Small radius: 4px */
  borderRadiusS: 4,
  /** Medium radius: 8px */
  borderRadiusM: 8,
  /** Large radius: 12px */
  borderRadiusL: 12,
  /** Circular radius: 50% */
  borderRadiusCircular: '50%',

  // ─────────────────────────────────────────────────────────────────
  // Typography (same as dark theme)
  // ─────────────────────────────────────────────────────────────────
  /** Caption text: 10px */
  fontSizeCaption: 10,
  /** Small text: 12px */
  fontSizeSmall: 12,
  /** Body text: 14px */
  fontSizeBody: 14,
  /** Title text: 16px */
  fontSizeTitle: 16,
  /** Heading text: 18px */
  fontSizeHeading: 18,

  /** Semibold weight: 600 */
  fontWeightSemibold: 600,
  /** Bold weight: 700 */
  fontWeightBold: 700,
} as const;
