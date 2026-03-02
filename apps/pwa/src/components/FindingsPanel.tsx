import React from 'react';
import { FindingsPanelBase, type FindingsPanelBaseProps } from '@variscout/ui';

const RESIZE_CONFIG = {
  storageKey: 'variscout-pwa-findings-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

type FindingsPanelProps = Omit<FindingsPanelBaseProps, 'resizeConfig'>;

const FindingsPanel: React.FC<FindingsPanelProps> = props => (
  <FindingsPanelBase {...props} resizeConfig={RESIZE_CONFIG} />
);

export default FindingsPanel;
