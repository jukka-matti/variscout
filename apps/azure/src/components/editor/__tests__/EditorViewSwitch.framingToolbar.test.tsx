// apps/azure/src/components/editor/__tests__/EditorViewSwitch.framingToolbar.test.tsx
//
// ER-1 Task 4 — the canvas framing toolbar is Process-tab chrome, not a
// universal strip. Asserts it is ABSENT on Explore and PRESENT on Process.
//
// vi.mock() BEFORE component imports — testing.md invariant.
import { vi } from 'vitest';

// Stub the heavy inner views so the test exercises only the toolbar gating
// (the toolbar renders before the view switch inside the data+outcome branch).
vi.mock('../EditorDashboardView', () => ({
  EditorDashboardView: () => <div data-testid="editor-dashboard-stub">Dashboard</div>,
}));
vi.mock('../AnalyzeWorkspace', () => ({
  AnalyzeWorkspace: () => <div data-testid="analyze-workspace-stub">Analyze</div>,
}));
vi.mock('../FrameView', () => ({
  default: () => <div data-testid="frame-view-stub">Frame</div>,
}));
vi.mock('../EditorEmptyState', () => ({
  EditorEmptyState: () => <div data-testid="empty-state-stub">Empty</div>,
}));
vi.mock('../../charter/ImprovementProjectPanel', () => ({
  default: () => <div data-testid="ip-panel-stub">IP</div>,
}));
vi.mock('../../control/ControlPanel', () => ({
  default: () => <div data-testid="control-stub">Control</div>,
}));
vi.mock('../../ProjectDashboard', () => ({
  default: () => <div data-testid="project-dashboard-stub">ProjectDashboard</div>,
}));
vi.mock('../../ProjectsTabView', () => ({
  default: () => <div data-testid="projects-stub">Projects</div>,
}));
vi.mock('../../views/ReportView', () => ({
  default: () => <div data-testid="report-stub">Report</div>,
}));
vi.mock('@variscout/ui', () => ({
  ColumnMapping: () => <div data-testid="column-mapping-stub">Mapping</div>,
  GoalBanner: () => <div data-testid="goal-banner-stub">Goal</div>,
  ImproveTabRoot: () => <div data-testid="improve-stub">Improve</div>,
  WorkspaceProjectLaunchpadCard: () => <div data-testid="launchpad-stub">Launchpad</div>,
}));
vi.mock('@variscout/core', () => ({ extractHubName: (s: string) => s }));
vi.mock('@variscout/core/findings', () => ({ createProjectActionItem: () => ({}) }));
vi.mock('@variscout/stores', () => ({
  useCanvasViewportStore: { getState: () => ({ setViewMode: vi.fn() }) },
}));
vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: { getState: () => ({ showFrame: vi.fn(), showAnalyze: vi.fn() }) },
}));
vi.mock('../../../lib/chunkReload', () => ({
  lazyWithRetry: () => () => <div data-testid="report-stub">Report</div>,
}));
vi.mock('../../../services/aiService', () => ({ isAIAvailable: () => false }));
vi.mock('../../../persistence', () => ({ azureHubRepository: { dispatch: vi.fn() } }));

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorViewSwitch } from '../EditorViewSwitch';

// Minimal prop bag: data present + outcome set so the canvas branch renders.
// EditorViewSwitch consumes a Record<string, any> contract from Editor.tsx.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseProps(activeView: string): Record<string, any> {
  return {
    activeView,
    rawData: [{ Weight: 1 }],
    outcome: 'Weight',
    isAnalyzeWallCanvasFirst: false,
    stageFive: { openOnDemand: () => {} },
    dataFlow: {},
    workspaceProjectContext: { workspaceProject: null },
    sharedCoScoutSection: null,
    activeHub: null,
  };
}

describe('EditorViewSwitch — framing toolbar gating (ER-1)', () => {
  it('does NOT render the framing toolbar on Explore', () => {
    render(<EditorViewSwitch {...baseProps('explore')} />);
    expect(screen.queryByTestId('framing-toolbar')).toBeNull();
  });

  it('renders the framing toolbar on the Process tab (frame)', () => {
    render(<EditorViewSwitch {...baseProps('frame')} />);
    expect(screen.getByTestId('framing-toolbar')).toBeInTheDocument();
  });
});
