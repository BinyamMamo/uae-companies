import React from 'react';
import { MapPin } from 'lucide-react';
import type { Company } from '../../types/company';
import { formatBusCommute, formatDistance } from '../../utils/distance';

interface CommuteMetaProps {
  company: Company;
  /** Show the specific area (e.g. "Dubai Internet City") rather than the emirate. */
  showArea?: boolean;
  className?: string;
}

const Dot = () => (
  <span className="text-line-strong select-none" aria-hidden="true">
    ·
  </span>
);

/**
 * The "where it is / how far / how long by bus" line, shared by the card,
 * drawer, bottom sheet, saved list, featured grid and map popup — which
 * previously each had their own copy with drifting separator colours.
 */
export const CommuteMeta: React.FC<CommuteMetaProps> = ({
  company,
  showArea = false,
  className = '',
}) => (
  <div className={`flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-ink-2 ${className}`}>
    <span className="flex items-center gap-1 font-medium text-ink">
      <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
      <span>{showArea ? company.location.area : `${company.location.emirate}, UAE`}</span>
    </span>
    <Dot />
    <span>{formatDistance(company.commute.distanceKm)}</span>
    <Dot />
    <span className="font-medium text-ink">
      {formatBusCommute(company.commute.busMinutes)}
    </span>
  </div>
);
