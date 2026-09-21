import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ListView } from './pages/ListView';
import { FeaturedView } from './pages/FeaturedView';
import { MapView } from './pages/MapView';
import { ComparisonModal } from './components/ComparisonModal';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './hooks/useConfirm';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOneTap } from './components/GoogleOneTap';
import { SavedModal } from './components/SavedModal';
import { InterestsModal } from './components/InterestsModal';

const AppContent: React.FC = () => {
  const { activeTab, companies, sharedListArrived, setSharedListArrived } = useApp();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);

  // A ?share_ids= link adds a list; reveal it rather than leaving it hidden.
  useEffect(() => {
    if (!sharedListArrived) return;
    setIsSavedModalOpen(true);
    setSharedListArrived(false);
  }, [sharedListArrived, setSharedListArrived]);

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink font-sans selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
      
      {/* Centered Minimal Header */}
      <Header
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenInterests={() => setIsInterestsOpen(true)}
      />

      {/* Main View Container */}
      <div className="flex-1">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'featured' && <FeaturedView />}
        {activeTab === 'map' && <MapView />}
      </div>

      {/* Comparison Modal */}
      <ComparisonModal />

      {/* Settings Modal */}
      <SettingsModal />

      <SavedModal open={isSavedModalOpen} onClose={() => setIsSavedModalOpen(false)} />
      <InterestsModal open={isInterestsOpen} onClose={() => setIsInterestsOpen(false)} />

      {/* Google One Tap prompt (signed-out users only, after first interaction) */}
      <GoogleOneTap />

      {/* Subtle Minimal Footer (omitted on Map view for maximum canvas height) */}
      {activeTab !== 'map' && (
        <footer className="mt-auto border-t border-line bg-app py-6 text-ink-2 transition-colors duration-150">
          {/*
            On phones this stacks and drops the dot separators — inline they
            wrapped mid-phrase ("225 / companies") with dots stranded on their
            own line.
          */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
              <span className="font-semibold text-ink">Where to work in the UAE</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span>{companies.length} companies</span>
            </div>
            <div className="text-ink-3 text-balance sm:text-right">
              Designed for University of Dubai students
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
        <ConfirmProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
