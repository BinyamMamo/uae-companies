import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileMenu } from './ProfileMenu';
import { InstallButton } from './InstallButton';
import { Logo } from './ui/Logo';
import { Sun, Moon, Bookmark, LayoutList, BuildingComplex, MapPinned } from 'lucide-react';

type TabId = 'list' | 'featured' | 'map';

const NAV_ITEMS: Array<{ id: TabId; label: string; Icon: LucideIcon }> = [
  { id: 'list', label: 'List', Icon: LayoutList },
  { id: 'featured', label: 'Featured', Icon: BuildingComplex },
  { id: 'map', label: 'Map', Icon: MapPinned },
];

interface HeaderProps {
  onOpenSaved: () => void;
  onOpenInterests: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSaved, onOpenInterests }) => {
  const {
    activeTab,
    setActiveTab,
    savedCompanyIds,
  } = useApp();
  const { theme, toggleTheme } = useTheme();

  const renderTab = (item: { id: TabId; label: string; Icon: LucideIcon }) => {
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
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-500 rounded-t-sm" />
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-1200 bg-app border-b border-line transition-colors duration-150">
      {/*
        Three-column grid: the centre column is nav, so it stays optically
        centred without the fixed-width side rails that used to overflow
        below ~380px.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: filters (mobile, list view only) + wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity min-w-0"
            aria-label="UAE Companies — go to list"
          >
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-brand-600 dark:text-brand-400" />
            <span className="text-sm sm:text-base font-bold tracking-tight text-ink truncate">
              UAE <span className="text-brand-600 dark:text-brand-400">Companies</span>
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
        <div className="flex items-center justify-end gap-1">
          <InstallButton />
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {/* Saved replaces the old nav tab; the badge carries the count. */}
          <button
            onClick={onOpenSaved}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label={
              savedCompanyIds.length > 0
                ? `Saved companies (${savedCompanyIds.length})`
                : 'Saved companies'
            }
          >
            <Bookmark className="w-4 h-4" aria-hidden="true" />
            {savedCompanyIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold leading-[1.05rem] text-center tabular-nums">
                {savedCompanyIds.length > 99 ? '99+' : savedCompanyIds.length}
              </span>
            )}
          </button>

          <ProfileMenu onOpenInterests={onOpenInterests} />
        </div>
      </div>

    </header>
  );
};

/**
 * Mobile navigation, as a bottom bar. Thumbs reach the bottom of a phone; a row
 * under the header does not. It is fixed, so it survives the list scrolling,
 * and it pads for the home indicator on iOS.
 */
export const MobileNavBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-1200 bg-app border-t border-line pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.4 : 1.9}
                aria-hidden="true"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
