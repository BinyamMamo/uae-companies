import React, { useState } from 'react';
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
  Users
} from 'lucide-react';

interface CompanyBottomSheetProps {
  company: Company;
  onClose: () => void;
}

export const CompanyBottomSheet: React.FC<CompanyBottomSheetProps> = ({ company, onClose }) => {
  const { toggleSaveCompany, isCompanySaved, userInterests } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'employees' | 'location'>('overview');

  const isSaved = isCompanySaved(company.id);

  const tabs: Array<{ id: 'overview' | 'careers' | 'employees' | 'location'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'careers', label: 'Careers' },
    { id: 'employees', label: 'Employees' },
    { id: 'location', label: 'Location' },
  ];

  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs md:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-2xl max-h-[88vh] flex flex-col shadow-drawer border-t border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Mobile Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222226] flex items-center justify-center shrink-0 p-1">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {company.name}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {company.categories.join(' · ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleSaveCompany(company.id)}
                className={`p-2 rounded border transition-colors ${
                  isSaved
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {company.location.area}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{formatDistance(company.commute.distanceKm)}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBusCommute(company.commute.busMinutes)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">About</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{company.shortDescription}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">What They Do</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{company.whatTheyDo}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">Common Careers</h4>
                <div className="flex flex-wrap gap-1.5">
                  {company.commonCareers.map(role => {
                    const relevant = isCareerRelevant(role, userInterests);
                    return (
                      <span
                        key={role}
                        className={`px-2 py-0.5 rounded ${
                          relevant
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {role}
                      </span>
                    );
                  })}
                </div>
              </div>

              {company.studentMatchReason && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">
                    Student Relevance
                  </h4>
                  <p className="text-slate-700 dark:text-slate-200">{company.studentMatchReason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'careers' && (
            <div className="space-y-3">
              <a
                href={company.careersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-sm flex items-center justify-center gap-1.5"
              >
                <span>Visit Official Careers Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Internships</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.internshipsKnown ? 'Available' : 'Seasonal'}
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Graduates</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.graduateRolesKnown ? 'Direct Entry' : 'Openings Vary'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-3">
              {company.employees && company.employees.length > 0 ? (
                company.employees.map((emp, idx) => (
                  <div key={idx} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{emp.title}</div>
                    </div>
                    <a
                      href={emp.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 dark:text-brand-400 font-semibold"
                    >
                      LinkedIn
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                  <Users className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <p>Employee profiles are not available for this company yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-sm bg-white dark:bg-slate-800">
                <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">Address</div>
                <div className="font-medium text-slate-900 dark:text-white mt-0.5">{company.location.address}</div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-sm bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="text-slate-700 dark:text-slate-200 font-semibold">Transit from Academic City</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mx-auto" />
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatBusCommute(company.commute.busMinutes)}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-700">
                    <Car className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">~{company.commute.drivingMinutes} min drive</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
