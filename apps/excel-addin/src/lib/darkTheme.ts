/**
 * Dark Theme Tokens for Content Add-in
 *
 * The Content Add-in renders in an iframe without FluentProvider,
 * so it uses this custom token system matching Tailwind's slate palette.
 *
 * Token naming follows Fluent UI conventions for consistency.
 *
 * @see docs/EXCEL_ADDIN_DESIGN_SYSTEM.md
 */

export const darkTheme = {
  // ─────────────────────────────────────────────────────────────────
  // Backgrounds
  // ─────────────────────────────────────────────────────────────────
  /** Main container background (slate-800) */
  colorNeutralBackground1: '#1e293b',
  /** Card/panel background (slate-700) */
  colorNeutralBackground2: '#334155',
  /** Interactive/hover background (slate-600) */
  colorNeutralBackground3: '#475569',

  // ─────────────────────────────────────────────────────────────────
  // Foreground (Text)
  // ─────────────────────────────────────────────────────────────────
  /** Primary text (slate-100) */
  colorNeutralForeground1: '#f1f5f9',
  /** Secondary text (slate-400) */
  colorNeutralForeground2: '#94a3b8',
  /** Tertiary/muted text (slate-500) */
  colorNeutralForeground3: '#64748b',
  /** Disabled/faint text (slate-600) */
  colorNeutralForeground4: '#475569',

  // ─────────────────────────────────────────────────────────────────
  // Stroke (Borders)
  // ─────────────────────────────────────────────────────────────────
  /** Primary border (slate-600) */
  colorNeutralStroke1: '#475569',
  /** Subtle border (slate-700) */
  colorNeutralStroke2: '#334155',

  // ─────────────────────────────────────────────────────────────────
  // Status Colors
  // ─────────────────────────────────────────────────────────────────
  /** Success/pass (green-500) */
  colorStatusSuccessForeground: '#22c55e',
  /** Danger/fail (red-500) */
  colorStatusDangerForeground: '#ef4444',
  /** Warning (amber-500) */
  colorStatusWarningForeground: '#f59e0b',

  // ─────────────────────────────────────────────────────────────────
  // Brand Colors
  // ─────────────────────────────────────────────────────────────────
  /** Brand primary (blue-500) */
  colorBrandForeground1: '#3b82f6',
  /** Brand secondary (blue-400) */
  colorBrandForeground2: '#60a5fa',

  // ─────────────────────────────────────────────────────────────────
  // Spacing
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
  // Border Radius
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
  // Typography
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

/** Type for darkTheme token values */
export type DarkThemeTokens = typeof darkTheme;
