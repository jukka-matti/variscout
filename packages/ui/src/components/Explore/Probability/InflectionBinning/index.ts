/**
 * Inflection-binning workflow surface for the Explore tab's Probability lens.
 *
 * Exposes the side panel (UI) + the state machine hook (for tests / advanced
 * consumers wiring custom layouts) + the default level-name helper.
 *
 * @module Explore/Probability/InflectionBinning
 */

export { InflectionSidePanel } from './InflectionSidePanel';
export type { InflectionSidePanelProps } from './InflectionSidePanel';

export { useInflectionBinningState } from './useInflectionBinningState';
export type {
  BinningState,
  UseInflectionBinningStateInput,
  UseInflectionBinningStateReturn,
} from './useInflectionBinningState';

export { defaultLevelNames } from './defaultLevelNames';
