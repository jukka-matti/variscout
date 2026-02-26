import React, { useEffect, useState } from 'react';
import { useStorage, type CloudProject } from '../services/storage';
import { Plus, RefreshCw, Cloud, CloudOff, FolderOpen, Clock, User, Search } from 'lucide-react';

interface DashboardProps {
  onOpenProject: (id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject }) => {
  const { listProjects, syncStatus } = useStorage();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load projects on mount — loadProjects is defined below and not
  // useCallback-wrapped, so adding it would cause infinite re-runs.
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectList = await listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get sync status display
  const getSyncStatusDisplay = () => {
    const isOnline = navigator.onLine;
    const Icon = isOnline ? Cloud : CloudOff;
    const color =
      syncStatus.status === 'synced'
        ? 'text-green-400'
        : syncStatus.status === 'syncing'
          ? 'text-blue-400'
          : 'text-content-muted';

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary/50 ${color}`}
      >
        <Icon size={16} className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''} />
        <span className="text-sm">
          {syncStatus.status === 'syncing' ? 'Syncing...' : isOnline ? 'Connected' : 'Offline'}
        </span>
        {syncStatus.pendingChanges && syncStatus.pendingChanges > 0 && (
          <span className="text-xs text-amber-400">({syncStatus.pendingChanges} pending)</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-content">Analyses</h2>
          <p className="text-content-secondary text-sm mt-1">Manage your saved analyses</p>
        </div>
        <div className="flex items-center gap-3">
          {getSyncStatusDisplay()}
          <button
            onClick={() => onOpenProject()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} />
            New Analysis
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-content-secondary hover:text-content hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          title="Refresh analyses"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Analyses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-content-muted animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content mb-2">
            {projects.length === 0 ? 'No analyses yet' : 'No matching analyses'}
          </h3>
          <p className="text-content-secondary text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first analysis to start exploring variation data with your team.'
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => onOpenProject()}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              New Analysis
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-secondary rounded-xl border border-edge overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface/50 border-b border-edge">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-content-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium text-content-muted uppercase tracking-wider hidden md:table-cell">
                  Modified
                </th>
                <th className="px-6 py-3 text-xs font-medium text-content-muted uppercase tracking-wider hidden lg:table-cell">
                  Modified By
                </th>
                <th className="px-6 py-3 text-xs font-medium text-content-muted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/50">
              {filteredProjects.map(project => (
                <tr
                  key={project.id}
                  className="hover:bg-surface-tertiary/30 transition-colors cursor-pointer"
                  onClick={() => onOpenProject(project.name)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-content">{project.name}</div>
                    <div className="text-xs text-content-muted md:hidden mt-0.5">
                      {formatDate(project.modified)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-content-secondary text-sm hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {formatDate(project.modified)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-content-secondary text-sm hidden lg:table-cell">
                    {project.modifiedBy ? (
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        {project.modifiedBy}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenProject(project.name);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
