import React, { useState, useEffect } from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { isCareerRelevant } from '../utils/relevance';
import {
  X,
  Bookmark,
  ExternalLink,
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';

interface CompanyDrawerProps {
  company: Company;
  onClose: () => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({ company, onClose }) => {
  const { toggleSaveCompany, isCompanySaved, companies, setSelectedCompany, userInterests } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'employees' | 'location' | 'similar'>('overview');

  const isSaved = isCompanySaved(company.id);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find similar companies
  const similarCompanies = companies
    .filter(c => c.id !== company.id && (
      c.categories.some(cat => company.categories.includes(cat)) ||
      c.location.area === company.location.area
    ))
    .slice(0, 3);

  const tabs: Array<{ id: 'overview' | 'careers' | 'employees' | 'location' | 'similar'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'careers', label: 'Careers' },
    { id: 'employees', label: 'Employees' },
    { id: 'location', label: 'Location' },
    { id: 'similar', label: 'Similar' },
  ];

  return (
    <>
      {/* Backdrop overlay so drawer stands out above map/pages and clicks outside close it */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-[9998] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-[9999] w-full max-w-lg bg-white dark:bg-[#18181b] border-l border-slate-200 dark:border-[#27272a] shadow-[-16px_0_48px_rgba(0,0,0,0.35)] dark:shadow-[-20px_0_56px_rgba(0,0,0,0.75)] flex flex-col transition-all duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={`${company.name} Details`}
      >
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 dark:border-[#27272a]">
        
        {/* Top bar with Close button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Company Intelligence</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222226] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Title, Logo, and Save Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<span class="text-xs font-bold text-slate-700 dark:text-slate-300">${company.name.slice(0, 2).toUpperCase()}</span>`;
                  }
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {company.name}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {company.categories.join(' · ')}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleSaveCompany(company.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors shrink-0 ${
              isSaved
                ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Location & Commute Subheader */}
        <div className="flex items-center flex-wrap gap-x-2 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{company.location.area}, {company.location.emirate}</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>{formatDistance(company.commute.distanceKm)}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{formatBusCommute(company.commute.busMinutes)}</span>
        </div>

      </div>

      {/* Office Banner Photo */}
      {company.bannerImage && (
        <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0 border-b border-slate-200 dark:border-slate-800">
          <img
            src={company.bannerImage}
            alt={`${company.name} office`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-2 left-4 text-[11px] text-white font-medium drop-shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{company.location.address}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-[#27272a] px-5 bg-white dark:bg-[#18181b] shrink-0 flex items-center gap-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-800 dark:text-slate-200">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* About */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                About
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {company.shortDescription}
              </p>
            </div>

            {/* What They Do */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                What They Do
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {company.whatTheyDo}
              </p>
            </div>

            {/* Technical Areas */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Technical Areas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {company.technicalAreas.map(tech => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Common Careers with student match highlights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Common Careers
                </h3>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                  Highlighted roles match your interests
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {company.commonCareers.map(role => {
                  const relevant = isCareerRelevant(role, userInterests);
                  return (
                    <span
                      key={role}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        relevant
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {role}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Potential Student Relevance Note */}
            {company.studentMatchReason && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Student Relevance
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {company.studentMatchReason}
                </p>
              </div>
            )}

            {/* Data Citations & Sources */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Verified Sources
              </h4>
              <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {company.sources.map((src, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2 flex items-center gap-1"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

        {/* TAB 2: CAREERS */}
        {activeTab === 'careers' && (
          <div className="space-y-5">
            
            {/* Direct Careers Link */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Official Careers Portal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse live verified openings and graduate vacancies.
                </p>
              </div>
              <a
                href={company.careersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shadow-2xs transition"
              >
                <span>Open Careers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Program Status Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                  Student Internships
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {company.internshipsKnown ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Verified Program</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Subject to openings</span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                  Graduate Roles
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {company.graduateRolesKnown ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Direct Entry Available</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Seasonal entry</span>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Career Roles List */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                Technical Career Paths
              </h3>
              <div className="space-y-2">
                {company.commonCareers.map((role) => {
                  const relevant = isCareerRelevant(role, userInterests);
                  return (
                    <div
                      key={role}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                        relevant
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          {role}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {relevant ? 'High alignment with your degree' : 'Standard engineering path'}
                        </span>
                      </div>
                      <a
                        href={`${company.careersUrl}?q=${encodeURIComponent(role)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium flex items-center gap-1"
                      >
                        <span>Search</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Employees in UAE
              </h3>
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 font-medium flex items-center gap-1"
              >
                <span>View on LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {company.employees && company.employees.length > 0 ? (
              <div className="space-y-3">
                {company.employees.map((emp, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-200 shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{emp.name}</h4>
                        <div className="text-xs text-slate-600 dark:text-slate-300">{emp.title}</div>
                        {emp.university && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Alum: {emp.university}
                          </div>
                        )}
                      </div>
                    </div>
                    <a
                      href={emp.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 font-medium inline-flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>LinkedIn</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Employee profiles are not available for this company yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can explore full staff directories directly on LinkedIn.
                </p>
                <a
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                >
                  <span>Search {company.name} on LinkedIn</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: LOCATION */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            
            {/* Address & Free Zone Card */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Address
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                  {company.location.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Area / District
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{company.location.area}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Jurisdiction
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {company.location.isFreeZone
                      ? (company.location.freeZoneName || 'Free Zone')
                      : 'Mainland UAE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commute Breakdown from Academic City */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Commute from Academic City (KSK Student Residence)
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <Compass className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Distance</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatDistance(company.commute.distanceKm)}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Public Bus</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatBusCommute(company.commute.busMinutes)}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <Car className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Driving</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">~{company.commute.drivingMinutes} min</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                Commute times are estimated from Dubai International Academic City using standard RTA transit networks.
              </p>
            </div>

          </div>
        )}

        {/* TAB 5: SIMILAR COMPANIES */}
        {activeTab === 'similar' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Similar Companies in UAE
            </h3>
            {similarCompanies.map(sim => (
              <div
                key={sim.id}
                onClick={() => setSelectedCompany(sim)}
                className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:border-brand-500 hover:shadow-subtle cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex items-center justify-center p-1 shrink-0">
                    <img
                      src={sim.logo}
                      alt={sim.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{sim.name}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{sim.categories.slice(0, 2).join(' · ')}</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  <span>{formatDistance(sim.commute.distanceKm)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </aside>
    </>
  );
};
