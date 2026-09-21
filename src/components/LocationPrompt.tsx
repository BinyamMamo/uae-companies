import React, { useEffect, useState } from 'react';
import { MapPinHouse, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Says once that distances are measured from an assumed address.
 *
 * Every distance in the app needs an origin, and one is assumed so the list is
 * useful immediately. This is the single place that admits the assumption, so
 * no other screen has to caveat its numbers. Dismissing it only clears it from
 * this page view: the assumption is still in force on the next load, and saying
 * so once per visit is what keeps the numbers honest. Setting a location is
 * what actually ends it.
 */
export const LocationPrompt: React.FC = () => {
  const { isLocationSet, userLocation, setIsSettingsModalOpen } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // Settings is a lazily loaded chunk, so pressing this used to sit there while
  // it downloaded. Fetching it as soon as the prompt is on screen means the
  // dialog is already in memory by the time anyone reaches for it.
  useEffect(() => {
    if (isLocationSet) return;
    void import('./SettingsModal');
  }, [isLocationSet]);

  if (isLocationSet || dismissed) return null;

  const close = () => setDismissed(true);

  return (
    <div className="fixed z-1100 left-3 right-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] md:left-auto md:right-6 md:bottom-6 md:w-sm">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/95 backdrop-blur-md shadow-drawer p-2 animate-slide-up">
        <button
          type="button"
          onClick={() => {
            setIsSettingsModalOpen(true);
            close();
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left px-1.5 py-1 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <MapPinHouse className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink">Set your location</span>
            <span className="block text-[11px] text-ink-2 truncate">
              Distances are from {userLocation.name}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={close}
          className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
