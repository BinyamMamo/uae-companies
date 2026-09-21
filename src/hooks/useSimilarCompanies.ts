import { useMemo } from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';

/**
 * The three companies most like this one.
 *
 * Only researched records take part. Matching on any shared category put 3M at
 * the top of almost every list, because 163 of 225 companies carry
 * "Tech / Software" — a bucket the old generator handed out, not a fact about
 * the company. So the broad buckets score nothing, and a record with no
 * verified description is not compared at all.
 *
 * Shared by the desktop drawer and the mobile sheet so the two cannot drift.
 */
export function useSimilarCompanies(company: Company): Company[] {
  const { companies } = useApp();

  return useMemo(() => {
    if (!company.shortDescription) return [];

    const BROAD = new Set(['Tech / Software', 'Engineering']);
    const mySpecific = new Set(company.categories.filter(c => !BROAD.has(c)));

    return companies
      .filter(c => c.id !== company.id && c.shortDescription)
      .map(c => {
        const shared = c.categories.filter(cat => !BROAD.has(cat) && mySpecific.has(cat));
        let score = shared.length * 3;
        if (c.location.area === company.location.area) score += 2;
        if (c.industry && c.industry === company.industry) score += 4;
        return { company: c, score };
      })
      .filter(entry => entry.score >= 3)
      .sort(
        (a, b) =>
          b.score - a.score || a.company.commute.distanceKm - b.company.commute.distanceKm
      )
      .slice(0, 3)
      .map(entry => entry.company);
  }, [
    companies,
    company.id,
    company.categories,
    company.industry,
    company.location.area,
    company.shortDescription,
  ]);
}
