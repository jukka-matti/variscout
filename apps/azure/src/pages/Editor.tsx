import React from 'react';
import { useStorage } from '../services/storage';

// TODO: When integrating @variscout/charts:
// 1. Import { useDrillDown } from '../hooks/useDrillDown' (copy from PWA)
// 2. Import DrillBreadcrumb component (copy from PWA)
// 3. Add filters state and setFilters (like PWA DataContext)
// 4. Wire breadcrumb between header and content
// See: docs/design-system/patterns/navigation.md

export const Editor: React.FC<{ projectId: string | null; onBack: () => void }> = ({
  projectId,
  onBack,
}) => {
  const { saveProject, syncStatus } = useStorage();

  const handleSave = () => {
    saveProject({ data: 'mock' }, 'New Project', 'team');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header with back navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900">
            ← Back
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            {projectId ? `Editing Project ${projectId}` : 'New Analysis'}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{syncStatus.message}</span>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border col-span-1">
          <h3 className="font-medium text-gray-900 mb-4">Data & Config</h3>
          <div className="bg-gray-50 p-4 rounded text-sm text-gray-500">Data table placeholder</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border col-span-2 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-2">Chart Visualization</p>
            <p className="text-sm text-gray-500">(Import @variscout/charts/IChart here)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
