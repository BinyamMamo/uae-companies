import React, { useState, useId, useRef } from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { useSheetDrag } from '../hooks/useSheetDrag';
import { SaveToListMenu } from './SaveToListMenu';
import { CompanyCareersTab } from './CompanyCareersTab';
import { useSimilarCompanies } from '../hooks/useSimilarCompanies';
import { track } from '../lib/analytics';
import { directionsUrl, directionsEmbedUrl } from '../utils/directions';
import { Globe } from 'lucide-react';
import { TabBar, tabPanelId } from './ui/TabBar';
import { Modal } from './ui/Modal';
import { formatDistance } from '../utils/distance';
import { isCareerRelevant } from '../utils/relevance';
import { CompanyLogo } from './ui/CompanyLogo';
import { formatDistance as fmtKm } from '../utils/distance';
import {
  X,
  Bookmark,
  ExternalLink,
  MapPin,
} from 'lucide-react';

interface CompanyBottomSheetProps {
  company: Company;
  onClose: () => void;
}

export const CompanyBottomSheet: React.FC<CompanyBottomSheetProps> = ({ company, onClose }) => {
  const { isCompanySaved, setSelectedCompany, userInterests, userLocation } = useApp();
  const tabsId = useId();
  const { sheetRef, sheetStyle, handleProps } = useSheetDrag(onClose);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'careers' | 'location' | 'similar'
  >('overview');
  const [isRouteMapLoaded, setIsRouteMapLoaded] = useState(false);
  const similarCompanies = useSimilarCompanies(company);

  const hasCareers = Boolean(
    company.careersUrl ||
      company.commonCareers.length ||
      company.programmes.length ||
      company.internshipsKnown !== null ||
      company.graduateRolesKnown !== null
  );

  const isSaved = isCompanySaved(company.id);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);

  const tabs: Array<{ id: 'overview' | 'careers' | 'location' | 'similar'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    ...(hasCareers ? [{ id: 'careers' as const, label: 'Careers' }] : []),
    { id: 'location', label: 'Location' },
    ...(similarCompanies.length > 0
      ? [{ id: 'similar' as const, label: 'Similar' }]
      : []),
  ];

  // Same reason as the drawer: the sheet stays mounted when you jump to a
  // similar company, so the open tab may not exist for the new record.
  const currentTab = tabs.some(t => t.id === activeTab) ? activeTab : 'overview';

  return (
    <Modal
      open
      onClose={onClose}
      label={`${company.name} details`}
      className="fixed inset-0 z-10011 flex flex-col justify-end md:hidden pointer-events-none"
      backdropClassName="fixed inset-0 z-10010 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
    >
      <div
        ref={sheetRef}
        className="bg-surface rounded-t-2xl h-[82dvh] flex flex-col shadow-drawer border-t border-line overflow-hidden pointer-events-auto animate-slide-up"
        style={sheetStyle}
      >
        {/* Drag handle, the whole strip is the target, not just the bar. */}
        <div
          {...handleProps}
          aria-label="Close details"
          className="pt-2.5 pb-2 flex justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Mobile Header */}
        <div className="p-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CompanyLogo name={company.name} src={company.logo} background={company.logoBackground} size="md" />
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
                ref={saveButtonRef}
                onClick={() => setIsSaveMenuOpen(open => !open)}
                aria-haspopup="dialog"
                aria-expanded={isSaveMenuOpen}
                aria-label={isSaved ? 'Edit lists' : 'Save to a list'}
                className={`p-2 rounded-md transition-colors ${
                  isSaved
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              {isSaveMenuOpen && (
                <SaveToListMenu
                  companyId={company.id}
                  companyName={company.name}
                  anchorRef={saveButtonRef}
                  onClose={() => setIsSaveMenuOpen(false)}
                />
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0 text-xs text-ink-2 mt-2 pt-2 border-t border-line">
            <span className="flex items-center gap-1 min-w-0 font-medium text-ink shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{company.location.area}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-ink">{formatDistance(company.commute.distanceKm)}</span>
            {company.website && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <a
                  href={company.website}
                  onClick={() => track('website_link_clicked', { company_id: company.id })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 min-w-0 text-brand-600 dark:text-brand-400 font-medium hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <TabBar
          baseId={tabsId}
          tabs={tabs}
          active={currentTab}
          onChange={id => {
            setActiveTab(id);
            track('company_tab_viewed', { company_id: company.id, tab: id });
          }}
          className="border-b border-line px-4 shrink-0 gap-3"
        />

        {/* Tab Body */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 text-ink text-xs"
        role="tabpanel"
        id={tabPanelId(tabsId, currentTab)}
        aria-labelledby={`${tabsId}-tab-${currentTab}`}
        tabIndex={0}
      >
          {currentTab === 'overview' && (
            <div className="space-y-4">
              {company.shortDescription ? (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider mb-1">About</h4>
                  <p className="text-ink-2 leading-relaxed">{company.shortDescription}</p>
                </div>
              ) : (
                <div className="border border-line rounded-md p-3 bg-surface-2">
                  <h4 className="font-semibold text-ink">No verified profile yet</h4>
                  <p className="text-ink-2 mt-1 leading-relaxed">
                    We only publish details we can trace to a source, so this
                    company&rsquo;s description and roles are left blank rather
                    than guessed.
                  </p>
                </div>
              )}

              {company.whatTheyDo && (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider mb-1">What They Do</h4>
                  <p className="text-ink-2 leading-relaxed">{company.whatTheyDo}</p>
                </div>
              )}

              {company.commonCareers.length > 0 && (
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
              )}

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

          {currentTab === 'careers' && <CompanyCareersTab company={company} />}

          {currentTab === 'similar' && (
            <div className="space-y-2.5">
              {similarCompanies.map(sim => (
                <button
                  key={sim.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setSelectedCompany(sim);
                  }}
                  className="w-full p-3 border border-line rounded-lg bg-surface text-left flex items-center gap-3 active:bg-surface-2 transition-colors"
                >
                  <CompanyLogo name={sim.name} src={sim.logo} background={sim.logoBackground} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink truncate">{sim.name}</span>
                    <span className="block text-ink-2 truncate">
                      {sim.location.area} · {fmtKm(sim.commute.distanceKm)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentTab === 'location' && (
            <div className="space-y-3">
              <div className="border border-line p-3 rounded-sm bg-white dark:bg-slate-800">
                <div className="text-ink-2 text-[10px] uppercase font-semibold">Address</div>
                <div className="font-medium text-ink mt-0.5">{company.location.address}</div>
              </div>

              <div className="border border-line p-3 rounded-md bg-surface-2 space-y-2">
                <div className="text-ink font-semibold">From {userLocation.name}</div>
                <div className="text-center bg-surface p-2.5 rounded-md border border-line">
                  <div className="font-bold text-ink">
                    {formatDistance(company.commute.distanceKm)}
                  </div>
                  <div className="text-[10px] text-ink-3 mt-0.5">direct distance</div>
                </div>
              </div>

              {/* The same embedded route the desktop drawer shows, it was
                  missing here, so the mobile Location tab had no map at all. */}
              <div className="relative rounded-lg overflow-hidden border border-line h-56">
                {!isRouteMapLoaded && (
                  <div
                    className="absolute inset-0 bg-surface-2 animate-pulse flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-[11px] text-ink-3">Loading route…</span>
                  </div>
                )}
                <iframe
                  title={`Route from ${userLocation.name} to ${company.name}`}
                  src={directionsEmbedUrl(userLocation, company.location, 'transit')}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => setIsRouteMapLoaded(true)}
                  className={`w-full h-full border-0 block transition-opacity duration-200 ${
                    isRouteMapLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
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
