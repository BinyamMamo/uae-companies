import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { CompanyMap } from '../components/CompanyMap';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';

export const MapView: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const isDesktop = useIsDesktop();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Tech', 'AI/ML', 'Cybersecurity', 'Hardware', 'Aviation'];

  const filteredForMap = useMemo(() => {
    return companies.filter(c => {

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
        return c.categories.includes('Aviation') || (c.industry ?? '').includes('Aviation');
      }
      return true;
    });
  }, [companies, activeCategory]);

  const handleSelectCompany = React.useCallback((company: any) => {
    setSelectedCompany(company);
  }, [setSelectedCompany]);

  return (
    <div className="relative w-full h-[calc(100dvh-var(--header-h))] flex flex-col bg-surface-3 transition-colors">
      
      {/* Top Map Filter Controls */}
      <div className="absolute top-4 left-4 z-900 flex flex-wrap items-center gap-2 pointer-events-none max-w-[calc(100%-2rem)]">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-lg border border-line shadow-lg pointer-events-auto overflow-x-auto max-w-full transition-colors">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded transition whitespace-nowrap ${ isActive ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
              >
                {cat}
              </button>
            );
          })}
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
  );
};
