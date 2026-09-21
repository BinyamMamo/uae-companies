import React from 'react';
import { Scale, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { track } from '../lib/analytics';

/**
 * The compare action, as a floating bar.
 *
 * It appears only once something is selected: an always-visible Compare button
 * is noise for the majority of visits that never compare anything. On phones it
 * clears the bottom nav; on wider screens it centres and keeps its own width.
 */
export const CompareBar: React.FC = () => {
  const { compareCompanyIds, clearCompare, setIsCompareModalOpen } = useApp();
  const count = compareCompanyIds.length;

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 z-1100 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-6 px-3 pb-2 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full md:w-auto md:min-w-sm flex items-center gap-2 rounded-xl border border-line bg-surface/95 backdrop-blur-md shadow-drawer p-2 animate-slide-up">
        <button
          type="button"
          onClick={clearCompare}
          className="p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
          aria-label="Clear comparison"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <span className="text-xs text-ink-2 min-w-0 flex-1">
          <span className="font-semibold text-ink tabular-nums">{count}</span>{' '}
          {count === 1 ? 'company selected' : 'companies selected'}
        </span>

        <button
          type="button"
          onClick={() => {
            track('compare_opened', { company_count: count });
            setIsCompareModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors shrink-0"
        >
          <Scale className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Compare</span>
        </button>
      </div>
    </div>
  );
};
