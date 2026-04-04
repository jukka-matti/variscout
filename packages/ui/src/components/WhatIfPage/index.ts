export {
  default as WhatIfPageBase,
  computePresets,
  whatIfPageDefaultColorScheme,
  type WhatIfPageColorScheme,
  type WhatIfPageBaseProps,
  type WhatIfReferenceContext,
} from './WhatIfPageBase';

// Re-export lean types from WhatIfSimulator for convenience
export type { LeanActivity } from '../WhatIfSimulator/LeanWhatIfSimulator';
