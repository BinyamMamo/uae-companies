import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ListView } from './pages/ListView';
import { BrowseView } from './pages/BrowseView';
import { FeaturedView } from './pages/FeaturedView';
import { MapView } from './pages/MapView';
import { SavedView } from './pages/SavedView';
import { ComparisonModal } from './components/ComparisonModal';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import { GoogleOneTap } from './components/GoogleOneTap';

const AppContent: React.FC = () => {
  const { activeTab, companies } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink font-sans selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
      
      {/* Centered Minimal Header */}
      <Header />

      {/* Main View Container */}
      <div className="flex-1">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'browse' && <BrowseView />}
        {activeTab === 'featured' && <FeaturedView />}
        {activeTab === 'map' && <MapView />}
        {activeTab === 'saved' && <SavedView />}
      </div>

      {/* Comparison Modal */}
      <ComparisonModal />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Google One Tap prompt (signed-out users only, after first interaction) */}
      <GoogleOneTap />

      {/* Subtle Minimal Footer (omitted on Map view for maximum canvas height) */}
      {activeTab !== 'map' && (
        <footer className="mt-auto border-t border-line bg-app py-6 text-ink-2 transition-colors duration-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">UAE Student Discovery Platform</span>
              <span>·</span>
              <span>{companies.length} companies</span>
              <span>·</span>
              <span>Ref: DIAC / KSK Homes</span>
            </div>
            <div className="text-ink-3">
              Designed for UAE Computer Engineering & Technical University Students
            </div>
          </div>
        </footer>
      )}

    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
