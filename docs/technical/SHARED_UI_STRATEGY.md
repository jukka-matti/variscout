# Shared UI Library Strategy

> [!NOTE]
> **Status**: Implemented (Jan 2026)
> **Package**: `@variscout/ui`

This document outlines the architectural strategy for implementing a Shared UI Library within the VariScout monorepo.

## 1. Current State Assessment

- **Existing Shared Packages**: `packages/core` (logic), `packages/charts` (visualization).
- **Missing**: No shared UI component library.
- **Divergence**:
  - **Excel Add-in (`apps/excel-addin`)**: Uses **Fluent UI** (`@fluentui/react-components`) to align with Native Office look and feel.
  - **PWA (`apps/pwa`)** & **Azure App (`apps/azure`)**: Use **Tailwind CSS** + Headless components (e.g., Radix, Lucide icons) for a custom, modern web aesthetic.

## 2. Architectural Recommendation

Would a shared UI library make sense? **YES**, but with a split strategy.

### Strategy A: The "Web" UI Kit (`@variscout/ui`)

We should create a shared UI package specifically for the **PWA** and **Azure App** (and any future web portals). Since they share a tech stack (Tailwind), they should share components.

- **Goal**: Ensure `apps/azure` and `apps/pwa` look identical and share the same buttons, inputs, cards, and layouts.
- **Contents**: Buttons, Forms, Modals, Layouts (Sidebar/Header), Typography.

### Strategy B: Excel Add-in independence

The Excel Add-in should **continue using Fluent UI** primarily.

- **Why?**: Microsoft strongly recommends Fluent UI for add-ins to feel "native" within Excel. Overriding this with a custom Tailwind design often leads to UX friction (e.g., scrolling issues, non-native scaling, focus management).
- **Shared Logic**: The Excel Add-in _should_ consume hooks and logic from `packages/core`, but render its own Fluent UI views.

## 3. Implementation Plan

### 3.1 Create `@variscout/ui`

1.  **Location**: `packages/ui`
2.  **Dependencies**: `react`, `react-dom`, `tailwindcss`, `lucide-react`, `class-variance-authority` (helper for component variants).
3.  **Build Tool**: Vite (Library Mode) or tsup.

### 3.2 Shared Tailwind Configuration

To ensure colors and fonts are consistent, move the Tailwind config to a shared preset.

- **Location**: `packages/ui/tailwind.config.js` (or a specific configuration package like `packages/config-tailwind`).
- **Usage**: In apps, `import sharedConfig from '@variscout/ui/tailwind.config';`

### 3.3 Component Development (Storybook)

Develop components in isolation using **Storybook**. This forces components to be pure and decoupled from app-specific state.

## 4. Best Practices

1.  **Headless Approach**: For complex interactive components (Tabs, Dropdowns), use a "Headless" library (e.g., Radix UI or Headless UI) in the shared package and style it with Tailwind. This provides accessibility out of the box.
2.  **Export Pattern**: Use "Barrel files" (`index.ts`) carefully.
    - Good: `export * from './Button';`
    - Ensure tree-shaking works so apps don't bundle unused components.
3.  **Versioning**: Since this is a monorepo, we typically version packages together or use "workspace:\*" protocols.
4.  **Styles**: Ship the CCS with the package or ensuring the consuming app processes the convenient utility classes.
    - _Recommended_: Add the package source paths to the consuming app's `tailwind.config.js` `content` array. This allows the app to generate only the CSS needed.

    ```javascript
    // apps/pwa/tailwind.config.js
    export default {
      content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}', // <-- Scan shared UI
      ],
      // ...
    };
    ```

## 5. Summary Recommendation

| App              | UI Strategy        | Action                                                       |
| :--------------- | :----------------- | :----------------------------------------------------------- |
| **PWA**          | Custom (Tailwind)  | Consume `@variscout/ui`                                      |
| **Azure App**    | Custom (Tailwind)  | Consume `@variscout/ui`                                      |
| **Excel Add-in** | Native (Fluent UI) | Keep independent UI, share Logic via `@variscout/core`       |
| **Marketing**    | Astro (Tailwind)   | SSG for performance, embeds PWA for interactive case studies |

## 6. Cross-App Embedding (iframe strategy)

The PWA supports a specialized **Embed Mode** to allow its charts and analysis features to be reused as interactive components within other sites (like the marketing website).

### Implementation

- **URL Parameter**: `?embed=true` hides the PWA header, footer, and navigation.
- **Sample Data**: `?sample=<key>` auto-loads a specific dataset for the context.
- **Security**: Content Security Policy (CSP) should allow framing from `variscout.com`.

### Usage in Marketing Website

The marketing site uses React Islands with pre-computed data from `@variscout/data` to showcase interactive charts on case study and tool pages. This ensures fast page loads while maintaining interactivity.

**Implementation**: Chart islands import directly from `@variscout/charts` and render with Astro's `client:only="react"` directive.

**Next Step**: Initialize `packages/ui` when you are ready to align the PWA and Azure App designs.
