import React, { useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { ResponsiveSheet } from './ui/ResponsiveSheet';
import { track } from '../lib/analytics';

/**
 * Install the app to the home screen.
 *
 * Phones only: this is where a home-screen icon is worth anything. On Chromium
 * the button installs; on iOS, which has no install API, it opens the three
 * steps instead, because "Add to Home Screen" is buried in the Share menu and
 * nobody finds it unaided.
 */
export const InstallButton: React.FC = () => {
  const { canInstall, needsGuide, install, dismiss } = useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!canInstall) return null;

  const onClick = async () => {
    if (needsGuide) {
      track('install_guide_opened', { platform: 'ios' });
      setGuideOpen(true);
      return;
    }
    const outcome = await install();
    track('install_prompted', { outcome });
    if (outcome === 'accepted') dismiss();
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Install this app"
        title="Install"
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
      </button>

      <ResponsiveSheet
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        label="Install this app"
        heightClassName="max-h-[70dvh]"
      >
        <div className="px-5 pb-6 pt-1">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink">Add to Home Screen</h2>
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="p-1.5 -mt-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <ol className="mt-4 space-y-3">
            {[
              { icon: Share, text: 'Tap the Share button in Safari’s toolbar.' },
              { icon: Plus, text: 'Scroll down and choose “Add to Home Screen”.' },
              { icon: Download, text: 'Tap Add. It opens like any other app.' },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                </span>
                <span className="text-xs text-ink-2 leading-relaxed">
                  <span className="font-semibold text-ink mr-1">{i + 1}.</span>
                  {text}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              dismiss();
              setGuideOpen(false);
            }}
            className="mt-5 w-full py-2 text-xs font-medium text-ink-3 hover:text-ink transition-colors"
          >
            Don’t show this again
          </button>
        </div>
      </ResponsiveSheet>
    </>
  );
};
