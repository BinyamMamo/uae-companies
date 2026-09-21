import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, MobileNavBar } from './components/Header';
import { CompareBar } from './components/CompareBar';
import { LocationPrompt } from './components/LocationPrompt';
import { SocialLinks } from './components/ui/SocialLinks';
import { ListView } from './pages/ListView';

const MapView = lazy(() => import('./pages/MapView').then(m => ({ default: m.MapView })));
const FeaturedView = lazy(() => import('./pages/FeaturedView').then(m => ({ default: m.FeaturedView })));
const ComparisonModal = lazy(() => import('./components/ComparisonModal').then(m => ({ default: m.ComparisonModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const SavedModal = lazy(() => import('./components/SavedModal').then(m => ({ default: m.SavedModal })));
const InterestsModal = lazy(() => import('./components/InterestsModal').then(m => ({ default: m.InterestsModal })));

/** Fills the view area while a lazily loaded page arrives. */
const ViewFallback: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" aria-busy="true">
    <div className="h-8 w-40 bg-surface-2 rounded-md animate-pulse" />
    <div className="mt-4 grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-surface-2 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
);
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './hooks/useConfirm';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOneTap } from './components/GoogleOneTap';

const AppContent: React.FC = () => {
  const {
    activeTab,
    companies,
    sharedListArrived,
    setSharedListArrived,
    isCompareModalOpen,
    isSettingsModalOpen,
  } = useApp();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);

  // A ?share_ids= link adds a list; reveal it rather than leaving it hidden.
  useEffect(() => {
    if (!sharedListArrived) return;
    setIsSavedModalOpen(true);
    setSharedListArrived(false);
  }, [sharedListArrived, setSharedListArrived]);

  return (
    // pb on mobile clears the fixed bottom nav bar.
    <div className="min-h-screen flex flex-col bg-app text-ink font-sans selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      
      {/* Centered Minimal Header */}
      <Header
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenInterests={() => setIsInterestsOpen(true)}
      />

      {/* Main View Container */}
      <div className="flex-1">
        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'list' && <ListView />}
          {activeTab === 'featured' && <FeaturedView />}
          {activeTab === 'map' && <MapView />}
        </Suspense>
      </div>

      {/* Each of these is mounted only while open, so its chunk is fetched
          the first time it is actually needed. */}
      <Suspense fallback={null}>
        {isCompareModalOpen && <ComparisonModal />}
        {isSettingsModalOpen && <SettingsModal />}
        {isSavedModalOpen && (
          <SavedModal open onClose={() => setIsSavedModalOpen(false)} />
        )}
        {isInterestsOpen && (
          <InterestsModal open onClose={() => setIsInterestsOpen(false)} />
        )}
      </Suspense>

      {/* Google One Tap prompt (signed-out users only, after first interaction) */}
      <GoogleOneTap />

      <LocationPrompt />
      <CompareBar />
      <MobileNavBar />

      {/* Subtle Minimal Footer (omitted on Map view for maximum canvas height) */}
      {activeTab !== 'map' && (
        <footer className="mt-auto border-t border-line bg-app py-6 text-ink-2 transition-colors duration-150">
          {/*
            On phones this stacks and drops the dot separators, inline they
            wrapped mid-phrase ("225 / companies") with dots stranded on their
            own line.
          */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
              <span className="font-semibold text-ink">Where to work in the UAE</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span>{companies.length} companies</span>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <span className="text-ink-3 text-balance">
                Designed for University of Dubai students
              </span>
              <SocialLinks className="-mr-2" />
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
