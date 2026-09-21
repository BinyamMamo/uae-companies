import React, { useState, useId } from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { track } from '../lib/analytics';
import { directionsUrl, ESTIMATE_NOTE } from '../utils/directions';
import { TabBar, tabPanelId } from './ui/TabBar';
import { Modal } from './ui/Modal';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { isCareerRelevant } from '../utils/relevance';
import { CompanyLogo } from './ui/CompanyLogo';
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
  const { toggleSaveCompany, isCompanySaved, userInterests, userLocation } = useApp();
  const tabsId = useId();
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'employees' | 'location'>('overview');

  const isSaved = isCompanySaved(company.id);

  const tabs: Array<{ id: 'overview' | 'careers' | 'employees' | 'location'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'careers', label: 'Careers' },
    ...(company.employees.length > 0
      ? [{ id: 'employees' as const, label: 'Employees' }]
      : []),
    { id: 'location', label: 'Location' },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      label={`${company.name} details`}
      className="fixed inset-0 z-10011 flex flex-col justify-end md:hidden pointer-events-none"
      backdropClassName="fixed inset-0 z-10010 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
    >
      <div className="bg-surface rounded-t-2xl max-h-[88dvh] flex flex-col shadow-drawer border-t border-line overflow-hidden pointer-events-auto animate-slide-up">
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Mobile Header */}
        <div className="p-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CompanyLogo name={company.name} src={company.logo} size="md" />
              <div>
                <h3 className="text-base font-bold text-ink leading-tight">
                  {company.name}
                </h3>
                <div className="text-xs text-ink-2 mt-0.5">
                  {company.categories.join(' · ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleSaveCompany(company.id)}
                className={`p-2 rounded border transition-colors ${ isSaved ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-800 text-ink-2 border-slate-200 dark:border-slate-700' }`}
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

          <div className="flex items-center gap-2 text-xs text-ink-2 mt-2 pt-2 border-t border-line">
            <span className="flex items-center gap-1 font-medium text-ink">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {company.location.area}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{formatDistance(company.commute.distanceKm)}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-ink">{formatBusCommute(company.commute.busMinutes)}</span>
          </div>
        </div>

        {/* Tabs */}
        <TabBar
          baseId={tabsId}
          tabs={tabs}
          active={activeTab}
          onChange={id => {
            setActiveTab(id);
            track('company_tab_viewed', { company_id: company.id, tab: id });
          }}
          className="border-b border-line px-4 shrink-0 gap-3"
        />

        {/* Tab Body */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 text-ink text-xs"
        role="tabpanel"
        id={tabPanelId(tabsId, activeTab)}
        aria-labelledby={`${tabsId}-tab-${activeTab}`}
        tabIndex={0}
      >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider mb-1">About</h4>
                <p className="text-ink-2 leading-relaxed">
                  {company.shortDescription ?? 'No verified description yet.'}
                </p>
              </div>

              {company.whatTheyDo && (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider mb-1">What They Do</h4>
                  <p className="text-ink-2 leading-relaxed">{company.whatTheyDo}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider mb-1.5">Common Careers</h4>
                <div className="flex flex-wrap gap-1.5">
                  {company.commonCareers.map(role => {
                    const relevant = isCareerRelevant(role, userInterests);
                    return (
                      <span
                        key={role}
                        className={`px-2 py-0.5 rounded ${ relevant ? 'bg-accent-soft text-accent-soft-text font-medium border border-accent-soft-border' : 'bg-surface-2 text-ink-2 border border-line' }`}
                      >
                        {role}
                      </span>
                    );
                  })}
                </div>
              </div>

              {company.studentMatchReason && (
                <div className="bg-surface-2 border border-line rounded-md p-3">
                  <h4 className="text-xs font-semibold text-ink mb-0.5">
                    Student Relevance
                  </h4>
                  <p className="text-slate-700 dark:text-slate-200">{company.studentMatchReason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'careers' && (
            <div className="space-y-3">
              {company.careersUrl ? (
                <a
                  href={company.careersUrl}
                  onClick={() => track('careers_link_clicked', { company_id: company.id })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open careers page</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="text-xs text-ink-3 border border-line rounded-md p-3 leading-relaxed">
                  No careers page confirmed for this company yet.
                </p>
              )}
              {(company.internshipsKnown !== null || company.graduateRolesKnown !== null) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {company.internshipsKnown !== null && (
                    <div className="border border-line p-2.5 rounded-md bg-surface">
                      <span className="text-[10px] text-ink-3 uppercase font-semibold">
                        Internships
                      </span>
                      <div className="font-semibold text-ink mt-0.5">
                        {company.internshipsKnown ? 'Confirmed' : 'None listed'}
                      </div>
                    </div>
                  )}
                  {company.graduateRolesKnown !== null && (
                    <div className="border border-line p-2.5 rounded-md bg-surface">
                      <span className="text-[10px] text-ink-3 uppercase font-semibold">
                        Graduates
                      </span>
                      <div className="font-semibold text-ink mt-0.5">
                        {company.graduateRolesKnown ? 'Confirmed' : 'None listed'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-3">
              {company.employees && company.employees.length > 0 ? (
                company.employees.map((emp, idx) => (
                  <div key={idx} className="p-2.5 border border-line rounded-sm bg-white dark:bg-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink">{emp.name}</div>
                      <div className="text-ink-2">{emp.title}</div>
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
                <div className="text-center py-6 text-ink-2">
                  <Users className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <p>Employee profiles are not available for this company yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-3">
              <div className="border border-line p-3 rounded-sm bg-white dark:bg-slate-800">
                <div className="text-ink-2 text-[10px] uppercase font-semibold">Address</div>
                <div className="font-medium text-ink mt-0.5">{company.location.address}</div>
              </div>

              <div className="border border-line p-3 rounded-md bg-surface-2 space-y-2">
                <div className="text-ink font-semibold">From {userLocation.name}</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-surface p-2 rounded-md border border-line">
                    <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mx-auto" aria-hidden="true" />
                    <div className="font-bold text-ink mt-0.5">
                      {formatBusCommute(company.commute.busMinutes)}
                    </div>
                  </div>
                  <div className="bg-surface p-2 rounded-md border border-line">
                    <Car className="w-3.5 h-3.5 text-ink-2 mx-auto" aria-hidden="true" />
                    <div className="font-bold text-ink mt-0.5">
                      ~{company.commute.drivingMinutes} min drive
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-ink-3 leading-relaxed">{ESTIMATE_NOTE}</p>
              </div>

              <a
                href={directionsUrl(userLocation, company.location, 'transit')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('route_viewed', { company_id: company.id, mode: 'transit' })}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <span>Get directions</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
