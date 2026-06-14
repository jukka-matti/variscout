/**
 * EvidenceMap — Responsive wrapper for EvidenceMapBase
 *
 * Uses withResponsiveSize for auto-sizing, following the same pattern
 * as IChart, Boxplot, ParetoChart, etc.
 */

import { withResponsiveSize } from '../responsive/withResponsiveSize';
import EvidenceMapBase from './EvidenceMapBase';

const EvidenceMap = withResponsiveSize(EvidenceMapBase);

export default EvidenceMap;
export { EvidenceMapBase };
