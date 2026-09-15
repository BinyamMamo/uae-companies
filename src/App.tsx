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

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121214] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
      
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

      {/* Subtle Minimal Footer (omitted on Map view for maximum canvas height) */}
      {activeTab !== 'map' && (
        <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121214] py-6 text-slate-500 dark:text-slate-400 transition-colors duration-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">UAE Student Discovery Platform</span>
              <span>·</span>
              <span>225 Authoritative Companies</span>
              <span>·</span>
              <span>Ref: DIAC / KSK Homes</span>
            </div>
            <div className="text-slate-400 dark:text-slate-500">
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
