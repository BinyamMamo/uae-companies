import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  /** Drop the card chrome when already inside a bordered container. */
  bare?: boolean;
  className?: string;
}

/** Shared empty state, so a filtered-to-nothing view never renders blank. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
  className = '',
}) => (
  <div
    className={`${bare ? '' : 'bg-surface border border-line rounded-xl'} p-10 text-center ${className}`}
  >
    <div className="w-12 h-12 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto mb-3 text-ink-3">
      <Icon className="w-6 h-6" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-semibold text-ink">{title}</h3>
    <p className="text-xs text-ink-2 mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);
