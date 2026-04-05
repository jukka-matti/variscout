/**
 * EvidenceMap — Responsive wrapper for EvidenceMapBase
 *
 * Uses withParentSize for auto-sizing, following the same pattern
 * as IChart, Boxplot, ParetoChart, etc.
 */

import { withParentSize } from '@visx/responsive';
import EvidenceMapBase from './EvidenceMapBase';

const EvidenceMap = withParentSize(EvidenceMapBase);

export default EvidenceMap;
export { EvidenceMapBase };
