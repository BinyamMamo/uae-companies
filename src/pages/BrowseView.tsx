import React from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { formatDistance } from '../utils/distance';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import {
  Cpu,
  Shield,
  Cloud,
  Code2,
  Plane,
  Coins,
  Truck,
  HeartPulse,
  ShoppingBag,
  MapPin,
  ArrowRight
} from 'lucide-react';

export const BrowseView: React.FC = () => {
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    setActiveTab,
    setFilters
  } = useApp();
  const isDesktop = useIsDesktop();

  const handleFilterToCategory = (cat: string) => {
    setFilters(prev => ({
      ...prev,
      companyTypes: [cat],
      location: 'All locations',
      area: 'All areas'
    }));
    setActiveTab('list');
  };

  const handleFilterToArea = (area: string) => {
    setFilters(prev => ({
      ...prev,
      companyTypes: [],
      location: 'All locations',
      area: area
    }));
    setActiveTab('list');
  };

  const handleFilterToIndustry = (industryKeyword: string) => {
    setFilters(prev => ({
      ...prev,
      search: industryKeyword,
      companyTypes: [],
      location: 'All locations',
      area: 'All areas'
    }));
    setActiveTab('list');
  };

  const techDomains = [
    { name: 'AI / Machine Learning', filter: 'AI / Data', icon: Cpu, desc: 'Computer vision, deep learning, NLP' },
    { name: 'Software & Cloud', filter: 'Tech / Software', icon: Cloud, desc: 'Enterprise SaaS, cloud computing, distributed systems' },
    { name: 'Cybersecurity', filter: 'Cybersecurity', icon: Shield, desc: 'SOC, threat intelligence, penetration testing' },
    { name: 'Embedded & Hardware', filter: 'Hardware / Embedded', icon: Code2, desc: 'IoT, microcontrollers, robotics, automation' },
  ];

  const industrySectors = [
    { name: 'Aviation & Aerospace', query: 'Aviation', icon: Plane },
    { name: 'Banking & Fintech', query: 'Bank', icon: Coins },
    { name: 'Logistics & Supply Chain', query: 'Logistics', icon: Truck },
    { name: 'Healthcare & Life Sciences', query: 'Health', icon: HeartPulse },
    { name: 'Retail & E-Commerce', query: 'Retail', icon: ShoppingBag },
  ];

  const keyDistricts = [
    { name: 'Dubai Silicon Oasis', area: 'Silicon Oasis', desc: 'Direct neighbor to Academic City (~15 min bus)' },
    { name: 'Dubai Internet City', area: 'Dubai Internet City', desc: 'Regional HQ for Microsoft, AWS, Cisco, SAP' },
    { name: 'Academic City (DIAC)', area: 'Academic City', desc: 'University hub & KSK Student Residence area' },
    { name: 'DIFC & Downtown', area: 'DIFC', desc: 'Financial capital and top tier tech consulting' },
    { name: 'Abu Dhabi Capital', area: 'Abu Dhabi areas', desc: 'National energy, banking, and defense research' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Technology Domains */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            Key Technology Domains
          </h2>
          <span className="text-xs text-ink-2">For Computer &amp; Technical Majors</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techDomains.map(domain => {
            const Icon = domain.icon;
            const count = companies.filter(c => 
              domain.filter === 'Tech / Software' ? c.categories.includes('Tech / Software') :
              domain.filter === 'AI / Data' ? (c.categories.includes('AI/ML') || c.categories.includes('Data')) :
              c.categories.includes(domain.filter)
            ).length;

            return (
              <div
                key={domain.name}
                onClick={() => handleFilterToCategory(domain.filter)}
                className="bg-surface border border-line hover:border-brand-500 dark:hover:border-brand-500 rounded-lg p-5 shadow-subtle hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-brand-600 dark:text-brand-400 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {domain.name}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1">
                    {domain.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-brand-600 dark:text-brand-400 font-semibold">
                  <span>{count} companies</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Geographic Clusters */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            Major UAE Employment Hubs
          </h2>
          <span className="text-xs text-ink-2">Ordered by transit proximity to Academic City</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {keyDistricts.map(dist => (
            <div
              key={dist.name}
              onClick={() => handleFilterToArea(dist.area)}
              className="bg-surface border border-line hover:border-slate-400 dark:hover:border-slate-600 rounded-lg p-4 transition cursor-pointer shadow-subtle group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">
                <MapPin className="w-3.5 h-3.5 text-ink-3" />
                <span>{dist.name}</span>
              </div>
              <p className="text-[11px] text-ink-2 mt-1 leading-snug">
                {dist.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Industry Sectors */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            Explore by Industry Sector
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industrySectors.map(sec => {
            const Icon = sec.icon;
            const sectorCompanies = companies.filter(c =>
              (c.industry ?? '').toLowerCase().includes(sec.query.toLowerCase()) ||
              c.name.toLowerCase().includes(sec.query.toLowerCase())
            ).slice(0, 3);

            return (
              <div
                key={sec.name}
                className="bg-surface border border-line rounded-lg p-5 shadow-subtle"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-ink-2" />
                    <h3 className="text-xs font-bold text-ink">{sec.name}</h3>
                  </div>
                  <button
                    onClick={() => handleFilterToIndustry(sec.query)}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {sectorCompanies.length === 0 && (
                    <p className="text-xs text-ink-3 py-2">No companies in this sector yet.</p>
                  )}
                  {sectorCompanies.map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      className="flex items-center justify-between p-2 rounded-sm hover:bg-surface-2 cursor-pointer text-xs transition"
                    >
                      <span className="font-medium text-ink truncate">{comp.name}</span>
                      <span className="text-ink-3 text-[11px] shrink-0 ml-2">
                        {formatDistance(comp.commute.distanceKm)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
