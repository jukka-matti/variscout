import React, { useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from './auth/msalConfig';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';

// Simple router (can upgrade to react-router later)
type View = 'dashboard' | 'editor';

function App() {
  const { instance } = useMsal();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => console.error(e));
  };

  const navigateToEditor = (projectId?: string) => {
    setCurrentProject(projectId || null);
    setCurrentView('editor');
  };

  const navigateToDashboard = () => {
    setCurrentProject(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnauthenticatedTemplate>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-4">VariScout Team</h1>
          <p className="mb-8 text-gray-600">Please sign in to access team analytics.</p>
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Sign In with Microsoft
          </button>
        </div>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-bold text-gray-800 cursor-pointer"
              onClick={navigateToDashboard}
            >
              VariScout Team
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => instance.logoutPopup()}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="p-6">
          {currentView === 'dashboard' ? (
            <Dashboard onOpenProject={id => navigateToEditor(id)} />
          ) : (
            <Editor projectId={currentProject} onBack={navigateToDashboard} />
          )}
        </main>
      </AuthenticatedTemplate>
    </div>
  );
}

export default App;
