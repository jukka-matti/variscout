/**
 * The PWA has no AD identity (free tier, ADR-012 browser-only).
 * One synthetic local analyst id, shared by every surface that needs a
 * `currentUserId` (project membership Lead, Wall comments, IP factory).
 * Previously duplicated as local consts in ProjectsTabView + ImprovementView.
 */
export const PWA_USER_ID = 'analyst@local';
