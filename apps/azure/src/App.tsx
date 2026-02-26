import React, { useState, useEffect } from 'react';
import { getEasyAuthUser, login, logout, type EasyAuthUser } from './auth/easyAuth';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { StorageProvider, useStorage } from './services/storage';
import { Dashboard as ProjectDashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

import { AdminTeamsSetup } from './components/AdminTeamsSetup';
import SettingsPanel from './components/settings/SettingsPanel';
import { SyncToastContainer } from './components/SyncToast';
import { ErrorBoundary, FindingsWindow } from '@variscout/ui';
import { Activity, LogOut, Settings, Shield } from 'lucide-react';

type View = 'dashboard' | 'editor' | 'admin-teams';

function App() {
  // Popout window route: render standalone FindingsWindow
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'findings') {
    return (
      <ThemeProvider>
        <FindingsWindow />
      </ThemeProvider>
    );
  }

  return <AppMain />;
}

function AppMain() {
  const [user, setUser] = useState<EasyAuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    getEasyAuthUser()
      .then(u => {
        setUser(u);
        setAuthChecked(true);
      })
      .catch(() => {
        setUser(null);
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

  // Still checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-content-secondary">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-surface text-content">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-surface via-surface-secondary to-surface">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              VariScout
            </h1>
          </div>
          <p className="mb-8 text-content-secondary text-lg max-w-md text-center">
            Variation analysis for quality teams. Sign in with your Microsoft account to access
            shared analyses.
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
          <p className="mt-6 text-xs text-content-muted">Powered by Microsoft Entra ID</p>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <ThemeProvider>
      <StorageProvider>
        <div className="min-h-screen bg-surface text-content">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
          >
            Skip to main content
          </a>
          <ErrorBoundary>
            <DataProvider>
              {/* Header */}
              <header className="h-14 border-b border-edge flex items-center justify-between px-4 sm:px-6 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
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
                    <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                      <Activity className="text-white" size={18} />
                    </div>
                    <h1 className="text-lg font-bold text-content">VariScout</h1>
                  </div>

                  {currentView === 'editor' && (
                    <>
                      <span className="text-content-muted">/</span>
                      <span className="text-content-secondary">
                        {currentProject ? `Analysis ${currentProject}` : 'New Analysis'}
                      </span>
                    </>
                  )}
                </div>

                <nav aria-label="App actions" className="flex items-center gap-1">
                  <span className="text-sm text-content-secondary mr-2 hidden sm:inline">
                    {user.name}
                  </span>
                  <button
                    onClick={() => setCurrentView('admin-teams')}
                    aria-label="Admin"
                    title="Admin"
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'admin-teams'
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
                    }`}
                    style={{ minWidth: 40, minHeight: 40 }}
                  >
                    <Shield size={18} />
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label="Settings"
                    title="Settings"
                    className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors"
                    style={{ minWidth: 40, minHeight: 40 }}
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={logout}
                    aria-label="Sign out"
                    title="Sign Out"
                    className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors"
                    style={{ minWidth: 40, minHeight: 40 }}
                  >
                    <LogOut size={18} />
                  </button>
                </nav>
              </header>

              {/* Main Content */}
              <main id="main-content" className="p-6">
                {currentView === 'dashboard' && (
                  <ProjectDashboard onOpenProject={id => navigateToEditor(id)} />
                )}
                {currentView === 'editor' && (
                  <Editor projectId={currentProject} onBack={navigateToDashboard} />
                )}
                {currentView === 'admin-teams' && <AdminTeamsSetup />}
              </main>

              {/* Settings Panel */}
              <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </DataProvider>
          </ErrorBoundary>
          <SyncToasts />
        </div>
      </StorageProvider>
    </ThemeProvider>
  );
}

/** Renders sync toast notifications from the StorageProvider context. */
function SyncToasts() {
  const { notifications, dismissNotification } = useStorage();
  return <SyncToastContainer notifications={notifications} onDismiss={dismissNotification} />;
}

export default App;
