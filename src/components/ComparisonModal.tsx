import React from 'react';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { X, Scale, Trash2, CheckCircle2 } from 'lucide-react';

export const ComparisonModal: React.FC = () => {
  const {
    companies,
    compareCompanyIds,
    toggleCompareCompany,
    clearCompare,
    isCompareModalOpen,
    setIsCompareModalOpen,
    setSelectedCompany
  } = useApp();

  if (!isCompareModalOpen || compareCompanyIds.length === 0) {
    return null;
  }

  const comparedCompanies = compareCompanyIds
    .map(id => companies.find(c => c.id === id))
    .filter(Boolean) as typeof companies;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#18181b] rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-popup border border-slate-200 dark:border-[#27272a] overflow-hidden text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Company Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluating {comparedCompanies.length} selected organizations side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-x-auto p-5">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#27272a]">
                <th className="p-3 w-40 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-[#222226]">
                  Feature
                </th>
                {comparedCompanies.map(c => (
                  <th key={c.id} className="p-3 min-w-[200px] align-top bg-white dark:bg-[#18181b]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img src={c.logo} alt={c.name} className="w-7 h-7 object-contain rounded border border-slate-100 dark:border-[#27272a] p-0.5" />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</span>
                      </div>
                      <button
                        onClick={() => toggleCompareCompany(c.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
              
              {/* Technical Fit */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-[#222226]">
                  Relevance Fit
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-brand-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                      <span>{c.relevanceScore}/100</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Industry */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Industry &amp; Category
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3 text-slate-600 dark:text-slate-300">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{c.industry}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{c.categories.join(' · ')}</div>
                  </td>
                ))}
              </tr>

              {/* Location & Commute */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Distance from DIAC
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3 text-slate-800 dark:text-slate-200">
                    <div className="font-bold">{formatDistance(c.commute.distanceKm)}</div>
                    <div className="text-slate-500 dark:text-slate-400">{formatBusCommute(c.commute.busMinutes)}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{c.location.area}</div>
                  </td>
                ))}
              </tr>

              {/* Jurisdiction */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Free Zone Status
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    {c.location.isFreeZone ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {c.location.freeZoneName || 'Free Zone'}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Mainland</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Student Internships */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Student Programs
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {c.internshipsKnown ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Internships</span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Internships: Unconfirmed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.graduateRolesKnown ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Graduate Entry</span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Grad Roles: Discretionary</span>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Technical Domains */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Technical Domains
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.technicalAreas.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Careers */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Common Roles
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.commonCareers.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[10px] text-brand-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Action */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50">
                  Action
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <button
                      onClick={() => {
                        setSelectedCompany(c);
                        setIsCompareModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded text-xs transition"
                    >
                      View Full Details
                    </button>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
