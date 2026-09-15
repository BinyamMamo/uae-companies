import React from 'react';
import { useApp } from '../context/AppContext';
import { X, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  isMobileDrawer?: boolean;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ isMobileDrawer = false }) => {
  const { filters, setFilters, clearFilters, setIsMobileFilterOpen, userLocation } = useApp();

  const companyTypeOptions = [
    { id: 'Tech / Software', label: 'Tech / Software' },
    { id: 'AI / Data', label: 'AI / Data' },
    { id: 'Cybersecurity', label: 'Cybersecurity' },
    { id: 'Hardware / Embedded', label: 'Hardware / Embedded' },
    { id: 'Telecom / Networks', label: 'Telecom / Networks' },
    { id: 'Aviation', label: 'Aviation' },
    { id: 'Other', label: 'Other' },
  ];

  const locationOptions = [
    'All locations',
    'Dubai',
    'Abu Dhabi',
    'Sharjah',
    'Other UAE'
  ];

  const areaOptions = [
    'All areas',
    'Academic City',
    'Silicon Oasis',
    'Business Bay',
    'Downtown',
    'JLT',
    'Dubai Internet City',
    'Dubai Media City',
    'DIFC',
    'Al Quoz',
    'Airport areas',
    'Abu Dhabi areas'
  ];

  const distanceOptions: Array<{ label: string; maxKm: number | null }> = [
    { label: 'Any distance', maxKm: null },
    { label: 'Under 5 km', maxKm: 5 },
    { label: 'Under 10 km', maxKm: 10 },
    { label: 'Under 20 km', maxKm: 20 },
    { label: 'Under 30 km', maxKm: 30 },
  ];

  const sortOptions: Array<{ id: 'nearest' | 'relevance' | 'name' | 'saved'; label: string }> = [
    { id: 'nearest', label: 'Nearest' },
    { id: 'relevance', label: 'Most relevant' },
    { id: 'name', label: 'Company name' },
    { id: 'saved', label: 'Saved first' },
  ];

  const toggleCompanyType = (type: string) => {
    setFilters(prev => {
      const exists = prev.companyTypes.includes(type);
      return {
        ...prev,
        companyTypes: exists
          ? prev.companyTypes.filter(t => t !== type)
          : [...prev.companyTypes, type]
      };
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, location: e.target.value }));
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, area: e.target.value }));
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'null' ? null : Number(e.target.value);
    setFilters(prev => ({ ...prev, distanceMax: val }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
  };

  const content = (
    <div className="space-y-5 text-slate-800 dark:text-slate-200">
      
      {/* Header with Title and Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#27272a]">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Filters
        </h2>
        <button
          onClick={clearFilters}
          className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Company Type Section */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Company Type
        </label>
        <div className="space-y-2">
          {companyTypeOptions.map(opt => {
            const checked = filters.companyTypes.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex items-center text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCompanyType(opt.id)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#222226] text-brand-600 focus:ring-brand-500 focus:ring-1 transition cursor-pointer"
                />
                <span className="ml-2.5 font-normal group-hover:text-slate-900 dark:group-hover:text-white">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Section */}
      <div>
        <label htmlFor="filter-location-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Location
        </label>
        <select
          id="filter-location-select"
          value={filters.location}
          onChange={handleLocationChange}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-600 transition"
        >
          {locationOptions.map(loc => (
            <option key={loc} value={loc} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">{loc}</option>
          ))}
        </select>
      </div>

      {/* Area Section */}
      <div>
        <label htmlFor="filter-area-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Area / District
        </label>
        <select
          id="filter-area-select"
          value={filters.area}
          onChange={handleAreaChange}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-600 transition"
        >
          {areaOptions.map(area => (
            <option key={area} value={area} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">{area}</option>
          ))}
        </select>
      </div>

      {/* Distance Filter */}
      <div>
        <label htmlFor="filter-distance-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Distance from {userLocation?.name?.split(',')[0] || 'Academic City'}
        </label>
        <select
          id="filter-distance-select"
          value={filters.distanceMax === null ? 'null' : String(filters.distanceMax)}
          onChange={handleDistanceChange}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-600 transition"
        >
          {distanceOptions.map(dist => (
            <option key={dist.label} value={dist.maxKm === null ? 'null' : String(dist.maxKm)} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">
              {dist.label}
            </option>
          ))}
        </select>
      </div>

      {/* Free Zone Filter */}
      <div>
        <label htmlFor="filter-freezone-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Free Zone Status
        </label>
        <select
          id="filter-freezone-select"
          value={filters.isFreeZoneOnly === null ? 'any' : filters.isFreeZoneOnly ? 'freezone' : 'non-freezone'}
          onChange={(e) => {
            const v = e.target.value;
            setFilters(prev => ({
              ...prev,
              isFreeZoneOnly: v === 'any' ? null : v === 'freezone'
            }));
          }}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-600 transition"
        >
          <option value="any" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">Any Status</option>
          <option value="freezone" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">Free Zone Only (e.g. DIC, DSO, DIFC)</option>
          <option value="non-freezone" className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">Mainland / Non-Free Zone</option>
        </select>
      </div>

      {/* Sort by */}
      <div>
        <label htmlFor="filter-sort-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Sort by
        </label>
        <select
          id="filter-sort-select"
          value={filters.sortBy}
          onChange={handleSortChange}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-600 transition"
        >
          {sortOptions.map(s => (
            <option key={s.id} value={s.id} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100">{s.label}</option>
          ))}
        </select>
      </div>

    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs md:hidden">
        <div className="bg-white dark:bg-[#18181b] rounded-t-xl p-5 max-h-[85vh] overflow-y-auto shadow-popup border-t border-slate-200 dark:border-[#27272a]">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-[#27272a]">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Filter Companies</span>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#27272a]">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shadow-sm transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-56 lg:w-60 shrink-0 hidden md:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-0.5">
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-lg p-4 shadow-subtle transition-colors duration-150">
        {content}
      </div>
    </aside>
  );
};
