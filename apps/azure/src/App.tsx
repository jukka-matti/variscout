import React, { useState, useEffect } from 'react';
import { getEasyAuthUser, login, logout, type EasyAuthUser } from './auth/easyAuth';
import { DataProvider } from './context/DataContext';
import { Dashboard as ProjectDashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import MindmapWindow from './components/MindmapWindow';
import { AdminTeamsSetup } from './components/AdminTeamsSetup';
import { ErrorBoundary } from '@variscout/ui';
import { Cloud, LogOut, Settings } from 'lucide-react';

type View = 'dashboard' | 'editor' | 'admin-teams';

function App() {
  // Detect popout mode from URL — render standalone mindmap without auth
  const [isMindmapPopout] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'mindmap';
  });

  const [user, setUser] = useState<EasyAuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  useEffect(() => {
    getEasyAuthUser().then(u => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  const navigateToEditor = (projectId?: string) => {
    setCurrentProject(projectId || null);
    setCurrentView('editor');
  };

  const navigateToDashboard = () => {
    setCurrentProject(null);
    setCurrentView('dashboard');
  };

  if (isMindmapPopout) {
    return <MindmapWindow />;
  }

  // Still checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Cloud size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              VariScout Team
            </h1>
          </div>
          <p className="mb-8 text-slate-400 text-lg max-w-md text-center">
            Collaborative variation analysis for quality teams. Sign in with your Microsoft account
            to access shared projects.
          </p>
          <button
            onClick={login}
            aria-label="Sign in with Microsoft"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
              <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
            </svg>
            Sign In with Microsoft
          </button>
          <p className="mt-6 text-xs text-slate-600">Powered by Microsoft Azure Active Directory</p>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <ErrorBoundary>
        <DataProvider>
          {/* Header */}
          <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                role="button"
                aria-label="Go to dashboard"
                tabIndex={0}
                onClick={navigateToDashboard}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') navigateToDashboard();
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Cloud size={16} className="text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">VariScout Team</h1>
              </div>

              {currentView === 'editor' && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">
                    {currentProject ? `Project ${currentProject}` : 'New Analysis'}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('admin-teams')}
                aria-label="Admin settings"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Settings size={16} />
                Admin
              </button>
              <span className="text-sm text-slate-400">{user.name}</span>
              <button
                onClick={logout}
                aria-label="Sign out"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            {currentView === 'dashboard' && (
              <ProjectDashboard onOpenProject={id => navigateToEditor(id)} />
            )}
            {currentView === 'editor' && (
              <Editor projectId={currentProject} onBack={navigateToDashboard} />
            )}
            {currentView === 'admin-teams' && <AdminTeamsSetup />}
          </main>
        </DataProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
