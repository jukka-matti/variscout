import React from 'react';
import { MindmapWindow as MindmapWindowBase, mindmapWindowAzureColorScheme } from '@variscout/ui';

/**
 * Azure MindmapWindow — wraps @variscout/ui with Azure slate color scheme.
 */
const MindmapWindow: React.FC = () => (
  <MindmapWindowBase colorScheme={mindmapWindowAzureColorScheme} />
);

export default MindmapWindow;
export { openMindmapPopout } from '@variscout/ui';
