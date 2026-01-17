export { gradeColors, type GradeColor } from './colors';

// Components
export { HelpTooltip, type HelpTooltipProps, type TooltipPosition } from './components/HelpTooltip';

// Services
export {
  errorService,
  type ErrorSeverity,
  type ErrorContext,
  type ErrorLogEntry,
  type ErrorNotificationHandler,
} from './services';

// Hooks
export { useIsMobile, useGlossary, type UseGlossaryOptions, type UseGlossaryResult } from './hooks';
