import React from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from './Dropdown';
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

  const locationDropdownOptions = locationOptions.map(loc => ({ value: loc, label: loc }));
  const areaDropdownOptions = areaOptions.map(area => ({ value: area, label: area }));
  const distanceDropdownOptions = distanceOptions.map(dist => ({
    value: dist.maxKm === null ? 'null' : String(dist.maxKm),
    label: dist.label
  }));
  const freeZoneDropdownOptions = [
    { value: 'any', label: 'Any Status' },
    { value: 'freezone', label: 'Free Zone Only (e.g. DIC, DSO, DIFC)' },
    { value: 'non-freezone', label: 'Mainland / Non-Free Zone' },
  ];
  const sortDropdownOptions = sortOptions.map(s => ({ value: s.id, label: s.label }));

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

  const content = (
    <div className="space-y-5 text-ink">
      
      {/* Header with Title and Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
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
        <label className="block text-xs font-semibold text-ink-2 mb-2.5">
          Company Type
        </label>
        <div className="space-y-2">
          {companyTypeOptions.map(opt => {
            const checked = filters.companyTypes.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex items-center text-xs text-ink-2 cursor-pointer select-none group hover:text-ink"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCompanyType(opt.id)}
                  className="w-3.5 h-3.5 rounded-sm border-slate-300 dark:border-slate-800 bg-white dark:bg-surface-2 text-brand-600 focus:ring-brand-500 focus:ring-1 transition cursor-pointer"
                />
                <span className="ml-2.5 font-normal group-hover:text-slate-900 dark:group-hover:text-white">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Section */}
      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1.5">
          Location
        </label>
        <Dropdown
          value={filters.location}
          onChange={(val) => setFilters(prev => ({ ...prev, location: val }))}
          options={locationDropdownOptions}
          className="w-full"
          buttonClassName="w-full"
        />
      </div>

      {/* Area Section */}
      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1.5">
          Area / District
        </label>
        <Dropdown
          value={filters.area}
          onChange={(val) => setFilters(prev => ({ ...prev, area: val }))}
          options={areaDropdownOptions}
          className="w-full"
          buttonClassName="w-full"
        />
      </div>

      {/* Distance Filter */}
      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1.5">
          Distance from {userLocation?.name?.split(',')[0] || 'Academic City'}
        </label>
        <Dropdown
          value={filters.distanceMax === null ? 'null' : String(filters.distanceMax)}
          onChange={(val) => {
            const num = val === 'null' ? null : Number(val);
            setFilters(prev => ({ ...prev, distanceMax: num }));
          }}
          options={distanceDropdownOptions}
          className="w-full"
          buttonClassName="w-full"
        />
      </div>

      {/* Free Zone Filter */}
      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1.5">
          Free Zone Status
        </label>
        <Dropdown
          value={filters.isFreeZoneOnly === null ? 'any' : filters.isFreeZoneOnly ? 'freezone' : 'non-freezone'}
          onChange={(val) => {
            setFilters(prev => ({
              ...prev,
              isFreeZoneOnly: val === 'any' ? null : val === 'freezone'
            }));
          }}
          options={freeZoneDropdownOptions}
          className="w-full"
          buttonClassName="w-full"
        />
      </div>

      {/* Sort by */}
      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1.5">
          Sort by
        </label>
        <Dropdown
          value={filters.sortBy}
          onChange={(val) => setFilters(prev => ({ ...prev, sortBy: val as any }))}
          options={sortDropdownOptions}
          className="w-full"
          buttonClassName="w-full"
        />
      </div>

    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs md:hidden">
        <div className="bg-surface rounded-t-xl p-5 max-h-[85vh] overflow-y-auto shadow-popup border-t border-line">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-line">
            <span className="text-sm font-semibold text-ink">Filter Companies</span>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-1 rounded-sm text-ink-2 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
          <div className="mt-5 pt-3 border-t border-line">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-sm shadow-xs transition"
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
      <div className="bg-surface border border-line rounded-lg p-4 shadow-subtle transition-colors duration-150">
        {content}
      </div>
    </aside>
  );
};
