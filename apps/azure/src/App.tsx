import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getEasyAuthUser, login, logout, type EasyAuthUser } from './auth/easyAuth';
import { clearGraphTokenCache } from './auth/graphToken';
import { ThemeProvider } from '@variscout/ui';
import { LocaleProvider } from './context/LocaleContext';
import { StorageProvider, useStorage } from './services/storage';
import { ToastProvider, useToast } from './context/ToastContext';
import { Dashboard as ProjectDashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

import { AdminHub, type AdminTab } from './components/admin/AdminHub';
import { useAdminAccess, type AdminGatingMode } from './hooks/useAdminAccess';
import SettingsPanel from './components/settings/SettingsPanel';
import { SyncToastContainer } from './components/SyncToast';
import { PasteConflictToast } from './components/PasteConflictToast';
import { ErrorBoundary, FindingsWindow } from '@variscout/ui';
import ImprovementWindow from './components/ImprovementWindow';
import { EvidenceMapWindow } from './pages/EvidenceMapWindow';
import { AppHeader } from './components/AppHeader';
import { Activity } from 'lucide-react';
import { parseDeepLink, validateDeepLink, type DeepLinkParams } from './services/deepLinks';
import { hasTeamFeatures } from '@variscout/core';
import { trackException } from './lib/appInsights';
import type { SampleDataset } from '@variscout/data';

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

  // Popout window route: render standalone EvidenceMapWindow
  if (urlParams.get('view') === 'evidence-map') {
    return (
      <ThemeProvider>
        <LocaleProvider>
          <EvidenceMapWindow />
        </LocaleProvider>
      </ThemeProvider>
    );
  }

  return <AppMain />;
}

function AppMain() {
  const [user, setUser] = useState<EasyAuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isAdmin, gatingMode } = useAdminAccess(user);

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

  const handleAppError = useCallback((error: Error) => {
    trackException(error);
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

  // Authenticated — render provider tree with AppContent inside StorageProvider
  return (
    <LocaleProvider>
      <ThemeProvider>
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
                <AppContent
                  user={user}
                  isAdmin={isAdmin}
                  gatingMode={gatingMode}
                  isSettingsOpen={isSettingsOpen}
                  setIsSettingsOpen={setIsSettingsOpen}
                  onLogout={handleLogout}
                />
              </ErrorBoundary>
              <SyncToasts />
              <PasteConflictToast />
            </div>
          </ToastProvider>
        </StorageProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

/**
 * AppContent — rendered inside StorageProvider so useStorage() is safe.
 * Owns navigation state, deep-link resolution, header, and view rendering.
 */
function AppContent({
  user,
  isAdmin,
  gatingMode,
  isSettingsOpen,
  setIsSettingsOpen,
  onLogout,
}: {
  user: EasyAuthUser;
  isAdmin: boolean;
  gatingMode: AdminGatingMode;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  onLogout: () => void;
}) {
  const [currentView, setCurrentView] = useState<View>('editor');
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [pendingProcessHubId, setPendingProcessHubId] = useState<string | null>(null);
  const [pendingSample, setPendingSample] = useState<SampleDataset | null>(null);
  // When true, Editor mounts directly into PasteScreen (used by "Add framing" CTA).
  // Reset to false once consumed so subsequent navigations don't re-trigger paste.
  const [pendingStartPaste, setPendingStartPaste] = useState(false);

  // Resolve deep link from URL params
  const deepLink = useMemo<DeepLinkParams>(() => {
    const fromUrl = parseDeepLink(window.location.search);
    if (fromUrl.project) return fromUrl;
    return {
      project: null,
      findingId: null,
      questionId: null,
      chart: null,
      mode: null,
      tab: null,
    };
  }, []);

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

  // Auto-redirect to portfolio if saved projects exist (first-run users stay on editor)
  useEffect(() => {
    if (deepLink.project) return; // Deep links handle their own navigation
    listProjects()
      .then(projects => {
        if (projects.length > 0) setCurrentView('dashboard');
      })
      .catch(() => {}); // Stay on editor if listing fails
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToEditor = (projectId?: string, processHubId?: string, startPaste?: boolean) => {
    setCurrentProject(projectId || null);
    setPendingProcessHubId(processHubId || null);
    if (startPaste) setPendingStartPaste(true);
    setCurrentView('editor');
  };

  const navigateToDashboard = () => {
    setCurrentProject(null);
    setPendingStartPaste(false);
    setCurrentView('dashboard');
  };

  const handleLoadSample = (sample: SampleDataset) => {
    setPendingSample(sample);
    navigateToEditor(undefined, pendingProcessHubId ?? undefined);
  };

  return (
    <>
      {/* Unified header — portfolio/admin views only (editor renders its own AppHeader) */}
      {currentView !== 'editor' && (
        <AppHeader mode="portfolio" onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      {/* Main Content */}
      <main id="main-content" className={currentView === 'editor' ? '' : 'p-6'}>
        {/* Deep link error — shown instead of normal content */}
        {deepLinkError && currentView === 'dashboard' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-lg font-medium text-content mb-2">Link error</p>
            <p className="text-sm text-content-secondary mb-6 max-w-md">{deepLinkError}</p>
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
          <ProjectDashboard
            onOpenProject={(id, processHubId, startPaste) =>
              navigateToEditor(id, processHubId, startPaste)
            }
            onLoadSample={handleLoadSample}
          />
        )}
        {currentView === 'editor' && (
          <Editor
            projectId={currentProject}
            onBack={navigateToDashboard}
            initialProcessHubId={currentProject ? undefined : (pendingProcessHubId ?? undefined)}
            initialSample={pendingSample}
            startPasteOnMount={pendingStartPaste}
            onOpenSettings={() => setIsSettingsOpen(true)}
            initialFindingId={
              deepLink.project === currentProject ? (deepLink.findingId ?? undefined) : undefined
            }
            initialChart={
              deepLink.project === currentProject ? (deepLink.chart ?? undefined) : undefined
            }
            initialQuestionId={
              deepLink.project === currentProject ? (deepLink.questionId ?? undefined) : undefined
            }
            initialMode={
              deepLink.project === currentProject ? (deepLink.mode ?? undefined) : undefined
            }
          />
        )}
        {currentView === 'admin' && (
          <AdminHub
            initialTab={
              (new URLSearchParams(window.location.search).get('admin') as AdminTab) || undefined
            }
            onBack={navigateToDashboard}
            gatingMode={gatingMode}
          />
        )}
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={user.name}
        userEmail={user.email}
        isAdmin={isAdmin}
        onAdminHub={() => {
          setCurrentView('admin');
          setIsSettingsOpen(false);
        }}
        onSignOut={onLogout}
      />
    </>
  );
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
