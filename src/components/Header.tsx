import React from 'react';
import { useApp } from '../context/AppContext';
import { SlidersHorizontal, Scale, Sun, Moon, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    savedCompanyIds,
    compareCompanyIds,
    setIsCompareModalOpen,
    setIsMobileFilterOpen,
    setIsSettingsModalOpen,
    theme,
    toggleTheme
  } = useApp();

  const navItems: Array<{ id: 'list' | 'browse' | 'featured' | 'map' | 'saved'; label: string }> = [
    { id: 'list', label: 'List' },
    { id: 'browse', label: 'Browse' },
    { id: 'featured', label: 'Featured' },
    { id: 'map', label: 'Map' },
    { id: 'saved', label: 'Saved' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#121214] border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Left: Dynamic Greeting Logo & mobile filter */}
        <div className="flex items-center gap-3 w-44 sm:w-56 shrink-0">
          {/* Mobile Filter Button for List View */}
          {activeTab === 'list' && (
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          )}

          {/* Logo with Backgroundless Monogram and UD Company List Text */}
          <button
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity"
            title="UD Company List"
          >
            <img
              src="/logo.png"
              alt="UD Logo"
              className="w-8 h-8 object-contain dark:hidden shrink-0"
            />
            <img
              src="/logo-white.png"
              alt="UD Logo"
              className="w-8 h-8 object-contain hidden dark:block shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                UD <span className="text-brand-600 dark:text-brand-400">Company List</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                University of Dubai · Discovery Hub
              </span>
            </div>
          </button>
        </div>

        {/* Center: Main Navigation Tabs with Saved Counter Badge */}
        <nav className="flex items-center justify-center space-x-1 sm:space-x-6 flex-1" aria-label="Main Navigation">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative py-4 px-2 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'saved' && savedCompanyIds.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-brand-600 dark:bg-brand-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {savedCompanyIds.length}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-500 rounded-t-sm" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Toggle, Compare & Settings (mirrors left width to keep nav centered) */}
        <div className="flex items-center justify-end gap-2 sm:gap-2.5 w-44 sm:w-56 shrink-0">
          
          {/* Compare shortcut button */}
          {compareCompanyIds.length > 0 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              title="Compare selected companies"
            >
              <Scale className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Compare</span>
              <span className="bg-brand-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {compareCompanyIds.length}
              </span>
            </button>
          )}

          {/* Dark Mode Theme Toggle - White Sun Icon */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-white" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Settings"
            aria-label="Platform Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
