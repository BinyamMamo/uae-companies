import React from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { FilterSidebar } from '../components/FilterSidebar';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { Dropdown } from '../components/Dropdown';
import { SearchX, Search, X, Scale, SlidersHorizontal } from 'lucide-react';
import { track } from '../lib/analytics';
import { CompanyCardSkeleton } from '../components/ui/CompanyCardSkeleton';
import { DataError } from '../components/ui/DataError';
import type { FilterState } from '../types/company';

export const ListView: React.FC = () => {
  const {
    filteredCompanies,
    selectedCompany,
    setSelectedCompany,
    filters,
    setFilters,
    clearFilters,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    compareCompanyIds,
    setIsCompareModalOpen,
    companiesStatus,
    reloadCompanies
  } = useApp();
  const isDesktop = useIsDesktop();

  // Drives the filter icon's active state in the search field.
  const activeFilterCount =
    filters.companyTypes.length +
    (filters.location ? 1 : 0) +
    (filters.area ? 1 : 0) +
    (filters.distanceMax !== null ? 1 : 0) +
    (filters.isFreeZoneOnly !== null ? 1 : 0) +
    (filters.hasCareersUrl ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  const sortOptions = [
    { value: 'nearest', label: 'Nearest' },
    { value: 'relevance', label: 'Most relevant' },
    { value: 'name', label: 'Company name' },
    { value: 'saved', label: 'Saved first' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Mobile filter sheet */}
      {isMobileFilterOpen && (
        <FilterSidebar isMobileDrawer={true} />
      )}

      <div className="flex items-start gap-6">
        
        {/* Left: Filter Sidebar (Desktop) */}
        <FilterSidebar />

        {/* Center: Scrollable Company List */}
        <main className="flex-1 min-w-0">
          
          {/*
            Sticky on phones: the list is 225 rows, and having to scroll back to
            the top to change the query or open the filters was the main cost of
            moving the filter control in here. `top-14` clears the header.
          */}
          {/* Phones only: on a desktop this lives at the top of the filter card,
              next to the controls it belongs with. */}
          <div className="md:hidden relative mb-4 sticky top-14 z-1100 bg-app py-1.5">
            <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2 pointer-events-none z-10" aria-hidden="true" />
            <label htmlFor="company-search" className="sr-only">
              Search companies
            </label>
            <input
              id="company-search"
              type="search"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name, industry, role, or tech stack"
              className="w-full pl-9 pr-16 py-2.5 bg-transparent border-0 border-b border-line rounded-none text-sm text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-brand-500 focus:ring-0 transition-colors"
            />

            {/* Trailing controls sit inside the field: clear, then filters. */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="text-ink-3 hover:text-ink p-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Phones have no room for the sidebar, so filters live here. */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className={`md:hidden p-1 transition-colors ${
                  activeFilterCount > 0
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-ink-3 hover:text-ink'
                }`}
                aria-label={
                  activeFilterCount > 0
                    ? `Filters (${activeFilterCount} active)`
                    : 'Filters'
                }
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* List Toolbar / Count & Sort - No bottom border */}
          <div className="flex items-center justify-between mb-3 text-xs text-ink-2">
            <div className="font-medium text-ink">
              <span className="font-bold text-ink">{filteredCompanies.length}</span>{' '}
              {filteredCompanies.length === 1 ? 'company' : 'companies'}
              {filters.search && (
                <span className="text-ink-2 ml-1">
                  matching &ldquo;{filters.search}&rdquo;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Compare Button, phones get the icon in the search field plus
                  the floating bar below, so this one is desktop-only. */}
              <button
                type="button"
                onClick={() => {
                  track('compare_opened', { company_count: compareCompanyIds.length });
                  setIsCompareModalOpen(true);
                }}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-line bg-surface text-ink-2 hover:border-brand-500/70 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shadow-2xs"
                title="Compare companies side-by-side"
              >
                <Scale className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Compare</span>
                {compareCompanyIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {compareCompanyIds.length}
                  </span>
                )}
              </button>

              {/* Sort by Custom Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-xs text-ink-2 font-medium">
                  Sort:
                </span>
                <Dropdown
                  value={filters.sortBy}
                  onChange={val => {
                    track('sort_changed', { sort_by: val });
                    setFilters(prev => ({ ...prev, sortBy: val as FilterState['sortBy'] }));
                  }}
                  options={sortOptions}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Company Cards List */}
          {companiesStatus === 'loading' ? (
            <CompanyCardSkeleton />
          ) : companiesStatus === 'error' ? (
            <DataError onRetry={reloadCompanies} />
          ) : filteredCompanies.length > 0 ? (
            <div className="space-y-3">
              {filteredCompanies.map(company => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isSelected={selectedCompany?.id === company.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-lg p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-line flex items-center justify-center mx-auto mb-3 text-ink-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-ink">
                No companies found
              </h3>
              <p className="text-xs text-ink-2 mt-1 max-w-sm mx-auto">
                Try changing your filters, clearing the search keyword, or selecting a broader distance radius.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-sm shadow-2xs transition"
              >
                Reset all filters
              </button>
            </div>
          )}

        </main>

        {/* Right: Company Detail Drawer (Desktop) */}
        {selectedCompany && isDesktop && (
          <CompanyDrawer
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}

        {/* Mobile Bottom Sheet */}
        {selectedCompany && !isDesktop && (
          <CompanyBottomSheet
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}

      </div>
    </div>
  );
};
