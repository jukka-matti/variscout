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
  const [filterLocation, setFilterLocation] = useState<'all' | 'team' | 'personal'>('all');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
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

  // Filter projects based on search and location
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === 'all' || project.location === filterLocation;
    return matchesSearch && matchesLocation;
  });

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
          : 'text-slate-500';

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 ${color}`}>
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
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your analysis projects across team and personal storage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getSyncStatusDisplay()}
          <button
            onClick={() => onOpenProject()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Location Filter */}
        <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-1">
          {(['all', 'team', 'personal'] as const).map(loc => (
            <button
              key={loc}
              onClick={() => setFilterLocation(loc)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                filterLocation === loc
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {loc === 'all' ? 'All' : loc === 'team' ? 'Team' : 'Personal'}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={loadProjects}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh projects"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="text-slate-500 animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
          </h3>
          <p className="text-slate-400 text-sm max-w-md">
            {projects.length === 0
              ? 'Create your first project to start analyzing variation data with your team.'
              : "Try adjusting your search or filter to find what you're looking for."}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => onOpenProject()}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Location
                </th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Modified
                </th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Modified By
                </th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredProjects.map(project => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => onOpenProject(project.name)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{project.name}</div>
                    <div className="text-xs text-slate-500 sm:hidden mt-0.5">
                      {project.location === 'team' ? 'Team' : 'Personal'} •{' '}
                      {formatDate(project.modified)}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                        project.location === 'team'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-600/50 text-slate-300'
                      }`}
                    >
                      {project.location === 'team' ? (
                        <>
                          <Cloud size={12} />
                          Team
                        </>
                      ) : (
                        'Personal'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {formatDate(project.modified)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm hidden lg:table-cell">
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
