---
title: Teams App Store + Microsoft Patterns Compliance Audit
audience: [developer]
category: compliance
status: archived
related: [teams, accessibility, azure, navigation]
date: 2026-03-17
---

# Teams App Store + Microsoft Patterns Compliance Audit

> **ARCHIVED (2026-04-02):** This spec is no longer relevant. ADR-059 (Web-First Deployment Architecture) removes Teams SDK dependency. VariScout is no longer submitted to the Teams App Store.

Systematic audit of VariScout against Microsoft's Teams app store validation guidelines and recommended coding patterns. Goal: pass submission on the first try.

## Audit Summary

| Area                      | Items  | ✅ Pass | ⚠️ Fix | ❌ Missing |
| ------------------------- | ------ | ------- | ------ | ---------- |
| Manifest & App Identity   | 8      | 5       | 2      | 1          |
| SSO & Authentication      | 6      | 6       | 0      | 0          |
| Tab UX & Value            | 7      | 5       | 2      | 0          |
| Accessibility             | 10     | 5       | 4      | 1          |
| Content & Permissions     | 5      | 5       | 0      | 0          |
| Microsoft Coding Patterns | 8      | 3       | 4      | 1          |
| **Total**                 | **44** | **29**  | **12** | **2**      |

---

## 1. Manifest & App Identity

| #   | Check                         | Status  | Finding                                                                                                                                              |
| --- | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Manifest schema version       | ⚠️ Fix  | Using v1.16 — latest stable is **v1.23** (Aug 2025). Update for contextual tab support + agent metadata.                                             |
| 1.2 | Manifest generated correctly  | ✅ Pass | `AdminTeamsSetup.tsx` generates manifest from deployment origin with all required fields.                                                            |
| 1.3 | App ID deterministic          | ✅ Pass | `generateManifestId()` produces consistent GUID from origin URL.                                                                                     |
| 1.4 | Developer info complete       | ⚠️ Fix  | Privacy URL is `variscout.com/privacy` in manifest but `variscout.com/legal/privacy` in submission checklist. **Must be consistent and return 200.** |
| 1.5 | Icons included                | ✅ Pass | `color.png` and `outline.png` fetched from `/teams/` directory.                                                                                      |
| 1.6 | staticTabs + configurableTabs | ✅ Pass | Personal tab + channel/groupchat configurable tab both defined.                                                                                      |
| 1.7 | webApplicationInfo for SSO    | ✅ Pass | Conditionally included when clientId provided. Correct `api://` resource format.                                                                     |
| 1.8 | validDomains                  | ✅ Pass | Dynamically set from deployment hostname.                                                                                                            |

**Action items:**

- Upgrade manifest schema to v1.23
- Fix privacy URL to match actual deployed URL (`/legal/privacy` vs `/privacy`)
- Verify terms URL consistency too

---

## 2. SSO & Authentication

| #   | Check                          | Status  | Finding                                                                                                 |
| --- | ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| 2.1 | Teams SSO token acquisition    | ✅ Pass | `authentication.getAuthToken()` in `teamsContext.ts` line 216.                                          |
| 2.2 | OBO token exchange             | ✅ Pass | Azure Functions in `infra/functions/` handles OBO flow with `@azure/msal-node`.                         |
| 2.3 | EasyAuth fallback              | ✅ Pass | Falls back to `/.auth/login/aad` when not in Teams.                                                     |
| 2.4 | Sign-out available (non-Teams) | ✅ Pass | Logout button visible, redirects to `/.auth/logout`. Hidden in Teams (correct — Teams manages session). |
| 2.5 | SSO failure handling           | ✅ Pass | `getTeamsSsoToken()` catches errors, logs warning, returns null. Graceful fallback.                     |
| 2.6 | Graph permissions minimized    | ✅ Pass | Only `User.Read` + `Files.ReadWrite` (Team plan). Standard plan has no Graph calls.                     |

**No action items.** Auth flow is well-implemented.

---

## 3. Tab UX & Value

| #   | Check                             | Status  | Finding                                                                                                          |
| --- | --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 3.1 | Tab provides value beyond website | ✅ Pass | Full SPC analysis tool — charts, findings, data management, not just a website embed.                            |
| 3.2 | Core workflows in Teams           | ✅ Pass | Data upload, analysis, chart viewing, findings, drill-down all work within Teams tab.                            |
| 3.3 | Tab configuration page            | ✅ Pass | `TeamsTabConfig.tsx` with proper `pages.config` registration.                                                    |
| 3.4 | Responsive at 320px               | ⚠️ Fix  | Navigation architecture spec mentions 320px but no evidence of dedicated CSS breakpoint testing. Need to verify. |
| 3.5 | Responsive at 200% zoom           | ⚠️ Fix  | Same — mentioned in spec but not explicitly tested. Needs manual verification.                                   |
| 3.6 | Deep link via subPageId           | ✅ Pass | `subPageId` extracted in `teamsContext.ts` and available via `TeamsContext.subPageId`.                           |
| 3.7 | `app.notifySuccess()` called      | ✅ Pass | Called after successful Teams SDK initialization (line 134).                                                     |

**Action items:**

- Test at 320px viewport width
- Test at 200% zoom in Teams desktop client
- Document test results

---

## 4. Accessibility

| #    | Check                        | Status     | Finding                                                                                                                                                                                                  |
| ---- | ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | Screen reader support        | ⚠️ Fix     | Charts (visx/SVG) likely lack comprehensive ARIA labels. Needs audit per chart component.                                                                                                                |
| 4.2  | Keyboard navigation          | ✅ Pass    | Interactive elements use `<button>`, tab order generally correct.                                                                                                                                        |
| 4.3  | High contrast mode           | ✅ Pass    | `theme.css` has high-contrast CSS overrides (added in navigation architecture work).                                                                                                                     |
| 4.4  | Focus management on dialogs  | ⚠️ Fix     | `DataTableModalBase` migrated to `<dialog>` ✅, but `SettingsPanelBase`, `CreateFactorModal`, `PerformanceDetectedModal`, `SpecEditor` still use `fixed inset-0` overlays without native focus trapping. |
| 4.5  | Touch targets 44px+          | ✅ Pass    | FilterBreadcrumb, FilterChipDropdown, ToolbarBase all updated to 44px minimum.                                                                                                                           |
| 4.6  | Focus return on dialog close | ⚠️ Fix     | `DataTableModalBase` and `MobileCategorySheet` migrated, but remaining modals don't return focus to trigger element.                                                                                     |
| 4.7  | `aria-label` on icon buttons | ✅ Pass    | Most icon buttons have labels or titles. A few may be missing — spot check needed.                                                                                                                       |
| 4.8  | `prefers-reduced-motion`     | ✅ Pass    | `theme.css` disables `scroll-behavior` in reduced motion.                                                                                                                                                |
| 4.9  | Color contrast ratios        | ❌ Missing | No automated contrast ratio testing. Should run axe-core or similar.                                                                                                                                     |
| 4.10 | Skip-to-content link         | ✅ Pass    | Z-index strategy reserves `z-[100]` for skip-to-content.                                                                                                                                                 |

**Action items:**

- Migrate remaining 4 overlay components to `<dialog>`
- Add chart ARIA labels / screen reader descriptions
- Run axe-core accessibility scanner
- Ensure focus return on all modal close paths

---

## 5. Content & Permissions

| #   | Check                    | Status  | Finding                                                                             |
| --- | ------------------------ | ------- | ----------------------------------------------------------------------------------- |
| 5.1 | No competitor references | ✅ Pass | No Slack, Zoom, or competitor platform names in UI.                                 |
| 5.2 | No ads or promotions     | ✅ Pass | Clean product UI.                                                                   |
| 5.3 | All links functional     | ✅ Pass | External links use `noopener noreferrer`.                                           |
| 5.4 | Permissions in manifest  | ✅ Pass | `['identity', 'messageTeamMembers']` — appropriate for SSO + channel notifications. |
| 5.5 | Device permissions       | ✅ Pass | `['media']` for Teams camera/photo capture support.                                 |

**No action items.**

---

## 6. Microsoft Coding Patterns

| #   | Check                              | Status     | Finding                                                                                                                                                                                             |
| --- | ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Native `<dialog>` for modals       | ⚠️ Fix     | 2/8 modal components migrated. Remaining: `SettingsPanelBase`, `CreateFactorModal`, `PerformanceDetectedModal`, `SpecEditor`, `PresentationView`, `ReportViewBase`.                                 |
| 6.2 | Teams JS tree shaking              | ❌ Missing | Using `@microsoft/teams-js ^2.49.0` but import is `{ app, authentication, teamsCore }` — tree shaking available since v2.31 but need to verify Vite config supports it (likely does automatically). |
| 6.3 | ErrorBoundary + Teams notification | ✅ Pass    | Root-level `ErrorBoundary` in `App.tsx` calls `notifyTeamsFailure()` on error. Per-component boundaries around charts.                                                                              |
| 6.4 | Theme sync                         | ✅ Pass    | `app.registerOnThemeChangeHandler` + subscriber pattern implemented.                                                                                                                                |
| 6.5 | `beforeUnloadHandler`              | ✅ Pass    | `teamsCore.registerBeforeUnloadHandler` saves data before tab close. Graceful fallback if API unavailable.                                                                                          |
| 6.6 | CSP headers (Azure)                | ⚠️ Fix     | PWA has CSP via `vercel.json`. **Azure app has no CSP headers** — needs to be set via ARM template `siteConfig` or a middleware/meta tag.                                                           |
| 6.7 | Teams `backStack` API              | ⚠️ Fix     | Navigation architecture spec mentions `microsoftTeams.pages.backStack.navigateBack()` but implementation status unclear. Need to verify in `useNavigation`.                                         |
| 6.8 | Progressive enhancement            | ✅ Pass    | App works without Teams SDK — graceful fallback to `EMPTY_CONTEXT` when `app.initialize()` rejects.                                                                                                 |

**Action items:**

- Migrate remaining modal components to `<dialog>`
- Verify tree shaking is active (check bundle analysis)
- Add CSP headers to Azure deployment (ARM template or `<meta>` tag)
- Verify Teams `backStack.navigateBack()` implementation

---

## Priority Fix List (Ordered by Submission Risk)

### Must Fix (submission blockers)

| #   | Issue                     | Effort | Fix                                            |
| --- | ------------------------- | ------ | ---------------------------------------------- |
| P1  | Privacy URL mismatch      | S      | Align manifest URLs with actual deployed pages |
| P2  | No CSP on Azure           | S      | Add CSP `<meta>` tag or ARM template header    |
| P3  | 320px / 200% zoom testing | S      | Test and document results                      |

### Should Fix (likely "Good-to-fix" or rejection risk)

| #   | Issue                              | Effort | Fix                                                                                                                  |
| --- | ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| P4  | Manifest v1.16 → v1.23             | S      | Update schema reference and version                                                                                  |
| P5  | 6 modals without native `<dialog>` | M      | Migrate SettingsPanelBase, CreateFactorModal, PerformanceDetectedModal, SpecEditor, PresentationView, ReportViewBase |
| P6  | Focus return on modal close        | M      | Add `triggerRef` pattern from nav architecture spec                                                                  |
| P7  | Chart ARIA labels                  | M      | Add descriptive `aria-label` to SVG chart containers                                                                 |
| P8  | Automated a11y testing             | S      | Add axe-core to e2e pipeline                                                                                         |

### Nice to Have (strengthens submission)

| #   | Issue                     | Effort | Fix                                        |
| --- | ------------------------- | ------ | ------------------------------------------ |
| P9  | Teams `backStack` API     | S      | Wire into `useNavigation` for Teams mobile |
| P10 | Tree shaking verification | S      | Check Vite bundle for unused Teams JS code |
| P11 | Contrast ratio audit      | S      | Run axe-core, fix any failures             |
