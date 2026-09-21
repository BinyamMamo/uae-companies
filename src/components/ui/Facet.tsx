import React from 'react';

/**
 * Browse facets.
 *
 * Each facet is a real button that narrows the list, labelled with its true
 * count from the loaded data — nothing here is hardcoded, so a slice can never
 * advertise companies it doesn't have.
 *
 * The bar is a magnitude cue only: one hue, recessive, and always accompanied
 * by the number in text, so nothing is encoded by colour alone.
 */

interface FacetRowProps {
  label: string;
  count: number;
  /** Largest count in this group, used to scale the bar. */
  max: number;
  meta?: string;
  onClick: () => void;
}

export const FacetRow: React.FC<FacetRowProps> = ({ label, count, max, meta, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
  >
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-xs font-medium text-ink truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {label}
      </span>
      <span className="flex items-baseline gap-2 shrink-0">
        {meta && <span className="text-[11px] text-ink-3">{meta}</span>}
        <span className="text-xs font-semibold text-ink tabular-nums">{count}</span>
      </span>
    </span>
    <span
      className="mt-1.5 block h-1.5 w-full rounded-full bg-surface-2 overflow-hidden"
      aria-hidden="true"
    >
      <span
        className="block h-full rounded-full bg-brand-600/70 dark:bg-brand-400/60"
        style={{ width: `${max > 0 ? Math.max(2, (count / max) * 100) : 0}%` }}
      />
    </span>
  </button>
);

interface FacetChipProps {
  label: string;
  count: number;
  onClick: () => void;
  active?: boolean;
}

export const FacetChip: React.FC<FacetChipProps> = ({ label, count, onClick, active = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
      active
        ? 'bg-accent-soft border-accent-soft-border text-accent-soft-text'
        : 'bg-surface border-line text-ink-2 hover:border-line-strong hover:text-ink'
    }`}
  >
    <span>{label}</span>
    <span className="text-[11px] text-ink-3 tabular-nums">{count}</span>
  </button>
);

interface SectionProps {
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}

export const BrowseSection: React.FC<SectionProps> = ({ title, note, children, className = '' }) => (
  <section className={className}>
    <div className="flex items-baseline justify-between gap-4 mb-3">
      <h2 className="text-xs font-bold text-ink uppercase tracking-wider">{title}</h2>
      {note && <span className="text-[11px] text-ink-3 text-right">{note}</span>}
    </div>
    {children}
  </section>
);
