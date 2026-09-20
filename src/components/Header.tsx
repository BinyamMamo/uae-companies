import React from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileMenu } from './ProfileMenu';
import { Logo } from './ui/Logo';
import { SlidersHorizontal, Sun, Moon, Settings } from 'lucide-react';

type TabId = 'list' | 'browse' | 'featured' | 'map' | 'saved';

const NAV_ITEMS: Array<{ id: TabId; label: string }> = [
  { id: 'list', label: 'List' },
  { id: 'browse', label: 'Browse' },
  { id: 'featured', label: 'Featured' },
  { id: 'map', label: 'Map' },
  { id: 'saved', label: 'Saved' },
];

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    savedCompanyIds,
    setIsMobileFilterOpen,
    setIsSettingsModalOpen,
  } = useApp();
  const { theme, toggleTheme } = useTheme();

  const renderTab = (item: { id: TabId; label: string }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`relative shrink-0 py-3 md:py-4 px-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
          isActive
            ? 'text-brand-600 dark:text-brand-400 font-semibold'
            : 'text-ink-2 hover:text-ink'
        }`}
      >
        <span>{item.label}</span>
        {item.id === 'saved' && savedCompanyIds.length > 0 && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
              isActive
                ? 'bg-brand-600 dark:bg-brand-500 text-white'
                : 'bg-surface-2 text-ink-2'
            }`}
          >
            {savedCompanyIds.length}
          </span>
        )}
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-500 rounded-t-sm" />
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-app border-b border-line transition-colors duration-150">
      {/*
        Three-column grid: the centre column is nav, so it stays optically
        centred without the fixed-width side rails that used to overflow
        below ~380px.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: filters (mobile, list view only) + wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {activeTab === 'list' && (
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-ink-2 bg-surface-2 hover:bg-surface-3 rounded-md border border-line transition-colors shrink-0"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Filters</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity min-w-0"
            aria-label="UAE Companies — go to list"
          >
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold tracking-tight text-ink truncate">
                UAE <span className="text-brand-600 dark:text-brand-400">Companies</span>
              </span>
              <span className="text-[11px] text-ink-3 font-normal truncate">
                Tech &amp; Jobs Discovery
              </span>
            </span>
          </button>
        </div>

        {/* Centre: nav on desktop only — on mobile it moves to its own row below */}
        <nav
          className="hidden md:flex items-center justify-center gap-4 lg:gap-6"
          aria-label="Main"
        >
          {NAV_ITEMS.map(renderTab)}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>

          <ProfileMenu />
        </div>
      </div>

      {/* Mobile nav: its own scrollable row, so nothing can collide with the wordmark */}
      <nav
        className="md:hidden flex items-center gap-1 px-4 overflow-x-auto border-t border-line"
        aria-label="Main"
      >
        {NAV_ITEMS.map(renderTab)}
      </nav>
    </header>
  );
};
