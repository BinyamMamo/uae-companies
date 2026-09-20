import React from 'react';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { X, Scale, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { CompanyLogo } from './ui/CompanyLogo';

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

  const comparedCompanies = compareCompanyIds
    .map(id => companies.find(c => c.id === id))
    .filter((c): c is (typeof companies)[number] => Boolean(c));

  return (
    <Modal
      open={isCompareModalOpen && compareCompanyIds.length > 0}
      onClose={() => setIsCompareModalOpen(false)}
      label="Compare companies"
      className="fixed inset-0 z-10000 flex items-center justify-center p-4"
      backdropClassName="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-popup border border-line overflow-hidden text-ink">
        
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h2 className="text-base font-bold text-ink">
                Company Comparison
              </h2>
              <p className="text-xs text-ink-2">
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
              className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-x-auto p-5">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 w-40 font-bold text-ink-3 uppercase tracking-wider bg-slate-50/50 dark:bg-surface-2">
                  Feature
                </th>
                {comparedCompanies.map(c => (
                  <th key={c.id} className="p-3 min-w-[200px] align-top bg-surface">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CompanyLogo name={c.name} src={c.logo} size="xs" />
                        <span className="font-bold text-ink text-sm">{c.name}</span>
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
            <tbody className="divide-y divide-line">
              
              {/* Technical Fit */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-surface-2">
                  Relevance Fit
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-900/30 text-brand-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                      <span>{c.relevanceScore}/100</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Industry */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Industry &amp; Category
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3 text-ink-2">
                    <div className="font-semibold text-ink">{c.industry}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">{c.categories.join(' · ')}</div>
                  </td>
                ))}
              </tr>

              {/* Location & Commute */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Distance from DIAC
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3 text-ink">
                    <div className="font-bold">{formatDistance(c.commute.distanceKm)}</div>
                    <div className="text-ink-2">{formatBusCommute(c.commute.busMinutes)}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">{c.location.area}</div>
                  </td>
                ))}
              </tr>

              {/* Jurisdiction */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Free Zone Status
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    {c.location.isFreeZone ? (
                      <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {c.location.freeZoneName || 'Free Zone'}
                      </span>
                    ) : (
                      <span className="text-ink-2">Mainland</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Student Internships */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Student Programs
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {c.internshipsKnown ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-ink">Internships</span>
                          </>
                        ) : (
                          <span className="text-ink-3">Internships: Unconfirmed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.graduateRolesKnown ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-ink">Graduate Entry</span>
                          </>
                        ) : (
                          <span className="text-ink-3">Grad Roles: Discretionary</span>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Technical Domains */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Technical Domains
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.technicalAreas.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-sm bg-surface-2 text-[10px] text-ink-2 border border-line">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Careers */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Common Roles
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.commonCareers.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-900/30 text-[10px] text-brand-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Action */}
              <tr>
                <td className="p-3 font-semibold text-ink-2 bg-slate-50/50 dark:bg-slate-800/50">
                  Action
                </td>
                {comparedCompanies.map(c => (
                  <td key={c.id} className="p-3">
                    <button
                      onClick={() => {
                        setSelectedCompany(c);
                        setIsCompareModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-sm text-xs transition"
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
    </Modal>
  );
};
