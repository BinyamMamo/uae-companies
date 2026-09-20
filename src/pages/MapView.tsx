import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CompanyMap } from '../components/CompanyMap';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';

export const MapView: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isFreeZoneOnly, setIsFreeZoneOnly] = useState<boolean>(false);

  const categories = ['All', 'Tech', 'AI/ML', 'Cybersecurity', 'Hardware', 'Aviation'];

  const filteredForMap = useMemo(() => {
    return companies.filter(c => {
      if (isFreeZoneOnly && !c.location.isFreeZone) return false;

      if (activeCategory === 'All') return true;
      if (activeCategory === 'Tech') {
        return c.categories.includes('Tech / Software') || c.categories.includes('Software');
      }
      if (activeCategory === 'AI/ML') {
        return c.categories.includes('AI/ML') || c.categories.includes('AI / ML') || c.categories.includes('Data');
      }
      if (activeCategory === 'Cybersecurity') {
        return c.categories.includes('Cybersecurity') || c.technicalAreas.includes('Cybersecurity');
      }
      if (activeCategory === 'Hardware') {
        return c.categories.includes('Hardware / Embedded') || c.categories.includes('Hardware');
      }
      if (activeCategory === 'Aviation') {
        return c.categories.includes('Aviation') || c.industry.includes('Aviation');
      }
      return true;
    });
  }, [companies, activeCategory, isFreeZoneOnly]);

  const handleSelectCompany = React.useCallback((company: any) => {
    setSelectedCompany(company);
  }, [setSelectedCompany]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors">
      
      {/* Top Map Filter Controls */}
      <div className="absolute top-4 left-4 right-4 z-900 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto overflow-x-auto max-w-full transition-colors">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded transition whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Free Zone Toggle Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsFreeZoneOnly(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border backdrop-blur-md shadow-lg transition ${
              isFreeZoneOnly
                ? 'bg-brand-600 text-white border-brand-500 shadow-2xs'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isFreeZoneOnly ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
            <span>Free Zone Only</span>
          </button>
        </div>

      </div>

      {/* Main Map Component */}
      <div className="flex-1 w-full h-full">
        <CompanyMap
          companies={filteredForMap}
          onSelectCompany={handleSelectCompany}
        />
      </div>

      {/* Desktop Drawer */}
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
  );
};
