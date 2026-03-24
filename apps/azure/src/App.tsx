import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getEasyAuthUser, login, logout, type EasyAuthUser } from './auth/easyAuth';
import { clearGraphTokenCache } from './auth/graphToken';
import { DataProvider } from './context/DataContext';
import { ThemeProvider, useTheme } from '@variscout/ui';
import { LocaleProvider } from './context/LocaleContext';
import { StorageProvider, useStorage } from './services/storage';
import { ToastProvider, useToast } from './context/ToastContext';
import { Dashboard as ProjectDashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

import { AdminHub, type AdminTab } from './components/admin/AdminHub';
import { useAdminAccess } from './hooks/useAdminAccess';
import SettingsPanel from './components/settings/SettingsPanel';
import { SyncToastContainer } from './components/SyncToast';
import { ErrorBoundary, FindingsWindow } from '@variscout/ui';
import ImprovementWindow from './components/ImprovementWindow';
import { Activity, LogOut, Settings, Shield } from 'lucide-react';
import { useTeamsContext, notifyTeamsFailure } from './teams';
import { TeamsTabConfig } from './teams/TeamsTabConfig';
import {
  parseDeepLink,
  parseSubPageId,
  validateDeepLink,
  type DeepLinkParams,
} from './services/deepLinks';
import { hasTeamFeatures } from '@variscout/core';
import { trackException } from './lib/appInsights';

type View = 'dashboard' | 'editor' | 'admin';

function App() {
  const urlParams = new URLSearchParams(window.location.search);

  // Popout window route: render standalone FindingsWindow
  if (urlParams.get('view') === 'findings') {
    return (
      <ThemeProvider>
        <FindingsWindow />
      </ThemeProvider>
    );
  }

  // Popout window route: render standalone ImprovementWindow
  if (urlParams.get('view') === 'improvement') {
    return (
      <ThemeProvider>
        <LocaleProvider>
          <ImprovementWindow />
        </LocaleProvider>
      </ThemeProvider>
    );
  }

  // Teams tab configuration page (shown when adding VariScout to a channel)
  if (urlParams.get('teamsConfig') === 'true') {
    return (
      <ThemeProvider>
        <TeamsTabConfig />
      </ThemeProvider>
    );
  }

  return <AppMain />;
}

/** Map Teams theme name to our ThemeMode */
function mapTeamsTheme(teamsTheme: string): 'light' | 'dark' {
  if (teamsTheme === 'dark') return 'dark';
  // 'default' (light) and 'contrast' (high-contrast) → light is the closest safe match
  return 'light';
}

function AppMain() {
  const [user, setUser] = useState<EasyAuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const teams = useTeamsContext();
  const { isAdmin, gatingMode } = useAdminAccess(user);

  // Resolve deep link from URL params or Teams subPageId
  const deepLink = useMemo<DeepLinkParams>(() => {
    const fromUrl = parseDeepLink(window.location.search);
    if (fromUrl.project) return fromUrl;
    if (teams.subPageId) return parseSubPageId(teams.subPageId);
    return {
      project: null,
      findingId: null,
      hypothesisId: null,
      chart: null,
      mode: null,
      tab: null,
    };
  }, [teams.subPageId]);

  // Deep link validation state
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

  // Auto-navigate to editor when a deep link specifies a project (with validation)
  const { listProjects } = useStorage();
  useEffect(() => {
    if (!deepLink.project || currentView !== 'dashboard') return;

    // Validate: check if the project exists before navigating
    listProjects()
      .then(projects => {
        const projectExists = (id: string) => projects.some(p => p.id === id || p.name === id);
        const isStandard = !hasTeamFeatures();
        const validation = validateDeepLink(deepLink, projectExists, isStandard);

        if (!validation.valid) {
          setDeepLinkError(validation.errorMessage ?? 'Project not found.');
          return;
        }

        // tab=overview means stay on the project overview (dashboard) after navigating
        // The Editor handles this via its own activeView logic
        navigateToEditor(deepLink.project!);
      })
      .catch(() => {
        // Failed to list projects — navigate anyway, Editor handles load errors
        navigateToEditor(deepLink.project!);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink.project]);

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

  // Notify Teams host when a render error crashes the app
  // (must be before early returns to satisfy rules-of-hooks)
  const handleAppError = useCallback((error: Error) => {
    trackException(error);
    notifyTeamsFailure(error.message || 'Application render error');
  }, []);

  const handleLogout = useCallback(() => {
    clearGraphTokenCache();
    logout();
  }, []);

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
    <LocaleProvider>
      <ThemeProvider>
        {teams.isTeams && <TeamsThemeSync teamsTheme={teams.theme} />}
        <StorageProvider>
          <ToastProvider>
            <div className="min-h-screen bg-surface text-content">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
              >
                Skip to main content
              </a>
              <ErrorBoundary onError={handleAppError}>
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

                      {teams.isTeams && teams.channelName && currentView !== 'editor' && (
                        <>
                          <span className="text-content-muted">/</span>
                          <span className="text-sm text-content-secondary truncate max-w-[200px]">
                            {teams.channelName}
                          </span>
                        </>
                      )}

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
                      {isAdmin && (
                        <button
                          onClick={() => setCurrentView('admin')}
                          aria-label="Admin"
                          title="Admin"
                          className={`p-2 rounded-lg transition-colors ${
                            currentView === 'admin'
                              ? 'text-blue-400 bg-blue-400/10'
                              : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
                          }`}
                          style={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Shield size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        aria-label="Settings"
                        title="Settings"
                        className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors"
                        style={{ minWidth: 44, minHeight: 44 }}
                      >
                        <Settings size={18} />
                      </button>
                      {/* Hide sign-out in Teams — Teams manages the session */}
                      {!teams.isTeams && (
                        <button
                          onClick={handleLogout}
                          aria-label="Sign out"
                          title="Sign Out"
                          className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors"
                          style={{ minWidth: 44, minHeight: 44 }}
                        >
                          <LogOut size={18} />
                        </button>
                      )}
                    </nav>
                  </header>

                  {/* Main Content */}
                  <main id="main-content" className="p-6">
                    {/* Deep link error — shown instead of normal content */}
                    {deepLinkError && currentView === 'dashboard' && (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <p className="text-lg font-medium text-content mb-2">Link error</p>
                        <p className="text-sm text-content-secondary mb-6 max-w-md">
                          {deepLinkError}
                        </p>
                        <button
                          onClick={() => {
                            setDeepLinkError(null);
                            navigateToDashboard();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Go to Portfolio
                        </button>
                      </div>
                    )}
                    {currentView === 'dashboard' && !deepLinkError && (
                      <ProjectDashboard onOpenProject={id => navigateToEditor(id)} />
                    )}
                    {currentView === 'editor' && (
                      <Editor
                        projectId={currentProject}
                        onBack={navigateToDashboard}
                        initialFindingId={
                          deepLink.project === currentProject
                            ? (deepLink.findingId ?? undefined)
                            : undefined
                        }
                        initialChart={
                          deepLink.project === currentProject
                            ? (deepLink.chart ?? undefined)
                            : undefined
                        }
                        initialHypothesisId={
                          deepLink.project === currentProject
                            ? (deepLink.hypothesisId ?? undefined)
                            : undefined
                        }
                        initialMode={
                          deepLink.project === currentProject
                            ? (deepLink.mode ?? undefined)
                            : undefined
                        }
                      />
                    )}
                    {currentView === 'admin' && (
                      <AdminHub
                        initialTab={
                          (new URLSearchParams(window.location.search).get('admin') as AdminTab) ||
                          undefined
                        }
                        onBack={navigateToDashboard}
                        gatingMode={gatingMode}
                      />
                    )}
                  </main>

                  {/* Settings Panel */}
                  <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                </DataProvider>
              </ErrorBoundary>
              <SyncToasts />
            </div>
          </ToastProvider>
        </StorageProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

/** Syncs Teams theme into ThemeContext on initial load and theme changes. */
function TeamsThemeSync({ teamsTheme }: { teamsTheme: string | null }) {
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (!teamsTheme) return;

    // Sync on initial load and subsequent Teams theme changes.
    // Skip if already synced with same value to avoid overriding user's manual choice.
    const mapped = mapTeamsTheme(teamsTheme);
    if (!synced.current) {
      setTheme({ mode: mapped });
      synced.current = true;
    } else {
      // Teams actively changed the theme — follow it
      setTheme({ mode: mapped });
    }

    // Signal Teams high-contrast mode for CSS targeting (F-13)
    if (teamsTheme === 'contrast') {
      document.documentElement.dataset.teamsContrast = 'true';
    } else {
      delete document.documentElement.dataset.teamsContrast;
    }
  }, [teamsTheme, setTheme]);

  return null;
}

/** Bridges storage notifications into ToastContext and renders them via SyncToastContainer. */
function SyncToasts() {
  const { notifications: storageNotifs, dismissNotification } = useStorage();
  const { notifications: toastNotifs, showToast, dismissToast } = useToast();

  // Bridge: push new storage notifications into toast context, preserving original IDs
  const prevStorageRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    const prevIds = new Set(prevStorageRef.current);
    for (const notif of storageNotifs) {
      if (!prevIds.has(notif.id)) {
        showToast(notif); // showToast preserves the id when provided
      }
    }
    prevStorageRef.current = storageNotifs.map(n => n.id);
  }, [storageNotifs, showToast]);

  // Dismiss in both systems
  const handleDismiss = React.useCallback(
    (id: string) => {
      dismissToast(id);
      dismissNotification(id);
    },
    [dismissToast, dismissNotification]
  );

  return <SyncToastContainer notifications={toastNotifs} onDismiss={handleDismiss} />;
}

export default App;
