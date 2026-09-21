import React from 'react';
import { MapPin } from 'lucide-react';
import type { Company } from '../../types/company';
import { formatDistance } from '../../utils/distance';

interface CommuteMetaProps {
  company: Company;
  /** Show the specific area (e.g. "Dubai Internet City") rather than the emirate. */
  showArea?: boolean;
  /** Append the free-zone status. It is a fact about the location, so it reads
   *  here rather than as a chip competing with the company name. */
  showFreeZone?: boolean;
  className?: string;
}

const Dot = () => (
  <span className="text-line-strong select-none" aria-hidden="true">
    ·
  </span>
);

/**
 * The "where it is / how far" line, shared by the card,
 * drawer, bottom sheet, saved list, featured grid and map popup.
 *
 * Travel time is deliberately absent. The estimates were derived from
 * straight-line distance and ran roughly 3x optimistic against real transit
 * times, so only the distance — which is exact — is shown.
 */
export const CommuteMeta: React.FC<CommuteMetaProps> = ({
  company,
  showArea = false,
  showFreeZone = false,
  className = '',
}) => (
  <div className={`flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-ink-2 ${className}`}>
    <span className="flex items-center gap-1 font-medium text-ink">
      <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
      <span>{showArea ? company.location.area : `${company.location.emirate}, UAE`}</span>
    </span>
    <Dot />
    <span className="font-medium text-ink">{formatDistance(company.commute.distanceKm)}</span>
    {showFreeZone && company.location.isFreeZone && (
      <>
        <Dot />
        <span className="uppercase tracking-[0.08em] text-[10px] text-ink-3">Free zone</span>
      </>
    )}
  </div>
);
