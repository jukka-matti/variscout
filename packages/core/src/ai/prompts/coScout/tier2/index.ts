/**
 * Tier 2 semi-static coaching modules — phase/mode-aware methodology guidance.
 *
 * These modules extend the phase coaching from `phases/` with deeper, targeted
 * discipline prompts. They are consumed by `assembleCoScoutPrompt()` when the
 * corresponding phase or mode is active.
 *
 * Current modules:
 *   - investigationDiscipline: Investigation phase discipline (Map + Wall views)
 */

export { investigationDisciplinePrompt } from './investigationDiscipline';
