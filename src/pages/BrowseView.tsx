import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { CompanyCardSkeleton } from '../components/ui/CompanyCardSkeleton';
import { DataError } from '../components/ui/DataError';
import { BrowseSection, FacetChip, FacetRow } from '../components/ui/Facet';
import { track } from '../lib/analytics';
import type { FilterState } from '../types/company';
import { ArrowRight } from 'lucide-react';

/**
 * Browse is for when you don't yet know what you're looking for.
 *
 * Every slice below is computed from the loaded dataset, so the counts are
 * always true and an empty bucket is never shown. The previous version listed
 * hardcoded domains, districts and industries with stale descriptions — one
 * industry card rendered permanently empty, and the district blurbs made
 * commute claims that stopped being true as soon as you moved your home pin.
 */

const COMMUTE_BANDS = [
  { label: 'Under 30 min', max: 30 },
  { label: 'Under 45 min', max: 45 },
  { label: 'Under 1 hour', max: 60 },
  { label: 'Under 1½ hours', max: 90 },
];

const TOP_N = 6;

export const BrowseView: React.FC = () => {
  const {
    companies,
    companiesStatus,
    reloadCompanies,
    selectedCompany,
    setSelectedCompany,
    setActiveTab,
    setFilters,
    clearFilters,
    userLocation,
    setIsSettingsModalOpen,
  } = useApp();
  const isDesktop = useIsDesktop();
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  /** Apply a slice and drop the user into the list with it already narrowed. */
  const applyFilter = (patch: Partial<FilterState>, facet: string, value: string) => {
    track('filter_applied', { filter: facet, value });
    clearFilters();
    setFilters(prev => ({ ...prev, ...patch }));
    setActiveTab('list');
  };

  const facets = useMemo(() => {
    const tally = (pick: (c: (typeof companies)[number]) => string[]) => {
      const counts = new Map<string, number>();
      for (const c of companies) {
        for (const key of pick(c)) {
          if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    };

    const areas = tally(c => [c.location.area]).map(a => {
      const inArea = companies.filter(c => c.location.area === a.label);
      const median = inArea
        .map(c => c.commute.busMinutes)
        .sort((x, y) => x - y)[Math.floor(inArea.length / 2)];
      return { ...a, meta: median ? `~${median} min` : undefined };
    });

    return {
      areas,
      fields: tally(c => c.categories),
      roles: tally(c => c.commonCareers).slice(0, 10),
      bands: COMMUTE_BANDS.map(b => ({
        ...b,
        count: companies.filter(c => c.commute.busMinutes < b.max).length,
      })),
      freeZone: companies.filter(c => c.location.isFreeZone).length,
      withCareers: companies.filter(c => c.careersUrl).length,
      verified: companies.filter(c => c.shortDescription).length,
    };
  }, [companies]);

  if (companiesStatus === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <CompanyCardSkeleton count={4} />
      </div>
    );
  }

  if (companiesStatus === 'error') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <DataError onRetry={reloadCompanies} />
      </div>
    );
  }

  const visibleAreas = showAllAreas ? facets.areas : facets.areas.slice(0, TOP_N);
  const visibleFields = showAllFields ? facets.fields : facets.fields.slice(0, TOP_N);
  const maxArea = facets.areas[0]?.count ?? 0;
  const maxField = facets.fields[0]?.count ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Orientation: what you're browsing, and what the commutes are measured from */}
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-lg font-semibold text-ink tracking-tight">
          Browse
          <span className="text-ink-3 font-normal"> · {companies.length} companies</span>
        </h1>
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="text-[11px] text-ink-3 hover:text-ink transition-colors"
        >
          from {userLocation.name}
        </button>
      </header>

      {/* Commute is the thing this app knows that a job board doesn't — lead with it */}
      <BrowseSection
        title="By commute"
        note="One-way, by bus"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {facets.bands.map(band => (
            <button
              key={band.label}
              type="button"
              onClick={() =>
                applyFilter({ busMinutesMax: band.max, sortBy: 'nearest' }, 'commute', band.label)
              }
              disabled={band.count === 0}
              className="group text-left bg-surface border border-line rounded-xl p-4 hover:border-brand-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="text-2xl font-bold text-ink tabular-nums">{band.count}</div>
              <div className="text-xs text-ink-2 mt-0.5">{band.label}</div>
              <div
                className="mt-3 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-brand-600/70 dark:bg-brand-400/60"
                  style={{
                    width: `${companies.length ? Math.max(2, (band.count / companies.length) * 100) : 0}%`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </BrowseSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Where they are */}
        <BrowseSection title="By district" note={`${facets.areas.length} districts`}>
          <div className="bg-surface border border-line rounded-xl p-1.5">
            {visibleAreas.map(area => (
              <FacetRow
                key={area.label}
                label={area.label}
                count={area.count}
                max={maxArea}
                meta={area.meta}
                onClick={() => applyFilter({ area: area.label }, 'area', area.label)}
              />
            ))}
            {facets.areas.length > TOP_N && (
              <button
                type="button"
                onClick={() => setShowAllAreas(v => !v)}
                className="w-full px-3 py-2 text-[11px] font-medium text-ink-2 hover:text-ink transition-colors text-left"
              >
                {showAllAreas
                  ? 'Show fewer'
                  : `Show all ${facets.areas.length} districts`}
              </button>
            )}
          </div>
        </BrowseSection>

        {/* What they work on */}
        <BrowseSection title="By field" note={`${facets.fields.length} fields`}>
          <div className="bg-surface border border-line rounded-xl p-1.5">
            {visibleFields.map(field => (
              <FacetRow
                key={field.label}
                label={field.label}
                count={field.count}
                max={maxField}
                onClick={() => applyFilter({ companyTypes: [field.label] }, 'field', field.label)}
              />
            ))}
            {facets.fields.length > TOP_N && (
              <button
                type="button"
                onClick={() => setShowAllFields(v => !v)}
                className="w-full px-3 py-2 text-[11px] font-medium text-ink-2 hover:text-ink transition-colors text-left"
              >
                {showAllFields ? 'Show fewer' : `Show all ${facets.fields.length} fields`}
              </button>
            )}
          </div>
        </BrowseSection>
      </div>

      {/* Roles — this is what a student is actually shopping for */}
      {facets.roles.length > 0 && (
        <BrowseSection title="By role" note="Roles these companies list">
          <div className="flex flex-wrap gap-2">
            {facets.roles.map(role => (
              <FacetChip
                key={role.label}
                label={role.label}
                count={role.count}
                onClick={() => applyFilter({ careerFilter: role.label }, 'role', role.label)}
              />
            ))}
          </div>
        </BrowseSection>
      )}

      {/* Narrowing that doesn't fit the other axes */}
      <BrowseSection title="Narrow it down">
        <div className="flex flex-wrap gap-2">
          <FacetChip
            label="In a free zone"
            count={facets.freeZone}
            onClick={() => applyFilter({ isFreeZoneOnly: true }, 'freezone', 'true')}
          />
          {facets.withCareers > 0 && (
            <FacetChip
              label="Has a careers page"
              count={facets.withCareers}
              onClick={() => applyFilter({ hasCareersUrl: true }, 'has_careers', 'true')}
            />
          )}
          <FacetChip
            label="Details verified"
            count={facets.verified}
            onClick={() => applyFilter({ verifiedOnly: true }, 'verified', 'true')}
          />
        </div>
        <p className="text-[11px] text-ink-3 mt-2.5 leading-relaxed max-w-xl">
          {facets.verified} of {companies.length} companies have details confirmed against a
          source so far. The rest carry their original listing and are marked unverified.
        </p>
      </BrowseSection>

      {/* Straight to the full list */}
      <div>
        <button
          type="button"
          onClick={() => {
            clearFilters();
            setActiveTab('list');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline underline-offset-2"
        >
          <span>See all {companies.length} companies</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {selectedCompany && isDesktop && (
        <CompanyDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
      {selectedCompany && !isDesktop && (
        <CompanyBottomSheet company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};
