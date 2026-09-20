import React from 'react';
import { CloudOff, RotateCcw } from 'lucide-react';

interface DataErrorProps {
  onRetry: () => void;
}

/** Shown when the company dataset fails to load — offline, or a bad deploy. */
export const DataError: React.FC<DataErrorProps> = ({ onRetry }) => (
  <div className="bg-surface border border-line rounded-xl p-10 text-center" role="alert">
    <div className="w-12 h-12 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto mb-3 text-ink-3">
      <CloudOff className="w-6 h-6" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-semibold text-ink">Couldn't load companies</h3>
    <p className="text-xs text-ink-2 mt-1.5 max-w-sm mx-auto leading-relaxed">
      Check your connection and try again. Your saved lists are stored on this
      device and are unaffected.
    </p>
    <button
      onClick={onRetry}
      className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md transition-colors"
    >
      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
      Try again
    </button>
  </div>
);
