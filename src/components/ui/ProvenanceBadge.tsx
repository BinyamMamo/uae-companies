import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import type { Company } from '../../types/company';

interface ProvenanceBadgeProps {
  company: Company;
  className?: string;
}

/**
 * Says how far a record has actually been checked.
 *
 * The previous dataset gave every company a "Sources" list and a date, whether
 * or not anything had been verified. Roughly 90% of it was generated from a
 * template, so the interface was asserting things nobody had confirmed. This
 * badge makes the difference visible instead.
 */
export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ company, className = '' }) => {
  const { website, description } = company.provenance;
  const verified = website.confidence === 'verified' && description.confidence === 'verified';
  const unverified =
    website.confidence === 'unverified' && description.confidence === 'unverified';

  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ${className}`}
        title={`Checked against published sources${company.lastUpdated ? ` on ${company.lastUpdated}` : ''}`}
      >
        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
        Verified
      </span>
    );
  }

  if (unverified) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 ${className}`}
        title="Carried over from the original seed list and not yet checked. Treat the details as a starting point, not a fact."
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
        Unverified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium text-ink-3 ${className}`}
      title="Details come from the company's own website rather than an independent source."
    >
      <Info className="w-3.5 h-3.5" aria-hidden="true" />
      Company-reported
    </span>
  );
};
