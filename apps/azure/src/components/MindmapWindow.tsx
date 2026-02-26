import React from 'react';
import { MindmapWindow as MindmapWindowBase } from '@variscout/ui';

/**
 * Azure MindmapWindow — wraps @variscout/ui. Uses default semantic-token-based color scheme.
 */
const MindmapWindow: React.FC = () => <MindmapWindowBase />;

export default MindmapWindow;
export { openMindmapPopout } from '@variscout/ui';
