import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderOpen, Calendar, Database, Edit2, Check, Plus } from 'lucide-react';
import { SavedProject } from '../lib/persistence';
import { useData } from '../context/DataContext';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedProjectsModal({ isOpen, onClose }: SavedProjectsModalProps) {
  const { listProjects, loadProject, deleteProject, renameProject, newProject, hasUnsavedChanges } =
    useData();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listProjects().then(p => {
        setProjects(p);
        setLoading(false);
      });
    }
  }, [isOpen, listProjects]);

  const handleLoad = async (id: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Load this project anyway?')) {
        return;
      }
    }
    await loadProject(id);
    onClose();
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setProjects(projects.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  const handleRename = async (id: string) => {
    if (editName.trim()) {
      await renameProject(id, editName.trim());
      setProjects(projects.map(p => (p.id === id ? { ...p, name: editName.trim() } : p)));
    }
    setEditingId(null);
    setEditName('');
  };

  const startEditing = (project: SavedProject) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleNewProject = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Start a new project anyway?')) {
        return;
      }
    }
    newProject();
    onClose();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Saved Projects</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* New Project Button */}
          <button
            onClick={handleNewProject}
            className="w-full flex items-center gap-3 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-blue-600/30 rounded-lg">
              <Plus size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-400">New Project</div>
              <div className="text-xs text-slate-500">Start fresh with a blank analysis</div>
            </div>
          </button>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
              <p>No saved projects yet</p>
              <p className="text-xs mt-1">Your saved analyses will appear here</p>
            </div>
          ) : (
            projects.map(project => (
              <div
                key={project.id}
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all group"
              >
                <div className="p-2 bg-slate-600 rounded-lg">
                  <Database size={18} className="text-slate-300" />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === project.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(project.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(project.id)}
                        className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-white truncate">{project.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(project.savedAt)}
                        </span>
                        <span>{project.rowCount} rows</span>
                      </div>
                    </>
                  )}
                </div>

                {confirmDelete === project.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLoad(project.id)}
                      className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                      title="Load"
                    >
                      <FolderOpen size={16} />
                    </button>
                    <button
                      onClick={() => startEditing(project)}
                      className="p-1.5 text-slate-400 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(project.id)}
                      className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          Projects are stored locally in your browser
        </div>
      </div>
    </div>
  );
}
