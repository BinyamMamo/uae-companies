import React from 'react';
import { useApp } from '../context/AppContext';
import { FilterSidebar } from '../components/FilterSidebar';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { SearchX, Search, X } from 'lucide-react';

export const ListView: React.FC = () => {
  const {
    filteredCompanies,
    selectedCompany,
    setSelectedCompany,
    filters,
    setFilters,
    clearFilters,
    isMobileFilterOpen
  } = useApp();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
  };

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
          
          {/* In-Page Search Bar - Bottom border only, no shadow */}
          <div className="relative mb-4">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search companies by name, domain, industry, role, or tech stack..."
              className="w-full pl-6 pr-7 py-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 rounded-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-0 transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {/* List Toolbar / Count & Sort - No bottom border */}
          <div className="flex items-center justify-between mb-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="font-medium text-slate-900 dark:text-white">
              <span className="font-bold text-slate-900 dark:text-white">{filteredCompanies.length}</span>{' '}
              {filteredCompanies.length === 1 ? 'company' : 'companies'}
              {filters.search && (
                <span className="text-slate-500 dark:text-slate-400 ml-1">
                  matching &ldquo;{filters.search}&rdquo;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="list-sort-select" className="hidden sm:inline text-slate-500 dark:text-slate-400">
                Sort by:
              </label>
              <select
                id="list-sort-select"
                value={filters.sortBy}
                onChange={handleSortChange}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none hover:text-brand-600 dark:hover:text-brand-400 transition"
              >
                <option value="nearest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nearest</option>
                <option value="relevance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Most relevant</option>
                <option value="name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Company name</option>
                <option value="saved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Saved first</option>
              </select>
            </div>
          </div>

          {/* Company Cards List */}
          {filteredCompanies.length > 0 ? (
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                No companies found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try changing your filters, clearing the search keyword, or selecting a broader distance radius.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shadow-2xs transition"
              >
                Reset all filters
              </button>
            </div>
          )}

        </main>

        {/* Right: Company Detail Drawer (Desktop) */}
        {selectedCompany && (
          <div className="hidden md:block">
            <CompanyDrawer
              company={selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          </div>
        )}

        {/* Mobile Bottom Sheet */}
        {selectedCompany && (
          <CompanyBottomSheet
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}

      </div>
    </div>
  );
};
