/**
 * FactorSelector wrapper for Azure app
 *
 * Re-exports the shared FactorSelector from @variscout/ui.
 * Uses default semantic-token-based color scheme.
 */
import React from 'react';
import { FactorSelector as SharedFactorSelector, type FactorSelectorProps } from '@variscout/ui';

const FactorSelector = (props: Omit<FactorSelectorProps, 'colorScheme'>) => (
  <SharedFactorSelector {...props} />
);

export default FactorSelector;
