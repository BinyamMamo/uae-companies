import React from 'react';

/** Placeholder matching CompanyCard's layout, so nothing shifts when data lands. */
const Row: React.FC = () => (
  <div className="bg-surface border border-line rounded-xl p-4 sm:p-5">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-md bg-surface-2 shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-44 max-w-[55%] rounded bg-surface-2 animate-pulse" />
          <div className="flex gap-1 shrink-0">
            <div className="w-8 h-8 rounded-md bg-surface-2 animate-pulse" />
            <div className="w-8 h-8 rounded-md bg-surface-2 animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-32 rounded bg-surface-2 animate-pulse" />
        <div className="h-3 w-56 max-w-full rounded bg-surface-2 animate-pulse" />
        <div className="h-3 w-full rounded bg-surface-2 animate-pulse" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-24 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-5 w-20 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-5 w-28 rounded-md bg-surface-2 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const CompanyCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <Row key={i} />
    ))}
  </div>
);
