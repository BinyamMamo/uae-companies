import React, { useState, useId, useRef } from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { useSimilarCompanies } from '../hooks/useSimilarCompanies';
import { SaveToListMenu } from './SaveToListMenu';
import { CompanyCareersTab } from './CompanyCareersTab';
import { track } from '../lib/analytics';
import { TabBar, tabPanelId } from './ui/TabBar';
import { Modal } from './ui/Modal';
import { formatDistance } from '../utils/distance';
import { isCareerRelevant } from '../utils/relevance';
import { directionsUrl, directionsEmbedUrl } from '../utils/directions';
import { CompanyLogo } from './ui/CompanyLogo';
import { ProvenanceBadge } from './ui/ProvenanceBadge';
import { LinkedInMark } from './ui/LinkedInMark';
import {
  Globe,
  X,
  Bookmark,
  ExternalLink,
  MapPin,
  Car,
  ShieldCheck,
  Bus,
} from 'lucide-react';

interface CompanyDrawerProps {
  company: Company;
  onClose: () => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({ company, onClose }) => {
  const { isCompanySaved, setSelectedCompany, userInterests, userLocation } = useApp();
  const tabsId = useId();
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'location' | 'similar'>('overview');
  const [commuteMode, setCommuteMode] = useState<'transit' | 'driving'>('transit');

  // The embed takes a moment; show a skeleton rather than an empty box. The key
  // changes with company and mode, so switching either re-arms the skeleton.
  const routeMapKey = `${company.id}-${commuteMode}`;
  const [loadedRouteMap, setLoadedRouteMap] = useState<string | null>(null);
  const isRouteMapLoaded = loadedRouteMap === routeMapKey;
  const setIsRouteMapLoaded = (loaded: boolean) =>
    setLoadedRouteMap(loaded ? routeMapKey : null);

  const isSaved = isCompanySaved(company.id);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);

  const hasProfile = Boolean(
    company.shortDescription ||
      company.whatTheyDo ||
      company.technicalAreas.length ||
      company.commonCareers.length
  );

  // Both of these used to run on every render: a filter over the whole company
  // list, and a several-hundred-line route solver — the latter even when the
  // Location tab was closed.
  /*
    Similarity is only offered between records whose profile was actually
    researched. The original generator gave 118 companies the same two
    categories, so matching on them returned whatever came first — 3M appeared
    under almost everything. Comparing unverified profiles cannot produce a
    real answer, so the tab stays hidden for them and appears as the research
    pipeline fills records in.
  */
  const similarCompanies = useSimilarCompanies(company);




  const hasCareers = Boolean(
    company.careersUrl ||
      company.commonCareers.length ||
      company.programmes.length ||
      company.internshipsKnown !== null ||
      company.graduateRolesKnown !== null
  );

  const tabs: Array<{ id: 'overview' | 'careers' | 'location' | 'similar'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    ...(hasCareers ? [{ id: 'careers' as const, label: 'Careers' }] : []),
    { id: 'location', label: 'Location' },
    ...(similarCompanies.length > 0 ? [{ id: 'similar' as const, label: 'Similar' }] : []),
  ];

  // Jumping to a similar company keeps the drawer mounted, so the tab that was
  // open may not exist for the new record. Fall back rather than show nothing.
  const currentTab = tabs.some(t => t.id === activeTab) ? activeTab : 'overview';

  return (
    <Modal
      open
      onClose={onClose}
      label={`${company.name} details`}
      className="fixed inset-y-0 right-0 z-10011 w-full max-w-lg flex flex-col animate-slide-in-right"
      backdropClassName="fixed inset-0 z-10010 bg-slate-900/20 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <aside className="h-full w-full bg-surface border-l border-line shadow-[-4px_0_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 dark:ring-0 dark:shadow-[-20px_0_56px_rgba(0,0,0,0.75)] flex flex-col transition-colors duration-200 ease-out">
      {/* Drawer Header */}
      <div className="p-5 border-b border-line relative">
        
        {/* Close button at top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-surface-2 transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Company Title & Logo */}
        <div className="flex items-start gap-3.5 pr-12">
          <CompanyLogo name={company.name} src={company.logo} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-ink leading-snug truncate">
              {company.name}
            </h2>
            <div className="text-xs text-ink-2 mt-0.5 truncate">
              {company.categories.join(' · ')}
            </div>
          </div>
        </div>

        {/* Location Subheader & Save Button placed down with ample space */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-line">
          <div className="flex items-center flex-wrap gap-x-2 text-xs text-ink-2 min-w-0">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{company.location.area}, {company.location.emirate}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{formatDistance(company.commute.distanceKm)}</span>
          </div>

          {/* Opens the list picker, like the cards do — saving from here used
              to drop the company into "All Saved" with no say in the matter. */}
          <div className="relative shrink-0">
            <button
              ref={saveButtonRef}
              onClick={() => setIsSaveMenuOpen(open => !open)}
              aria-haspopup="dialog"
              aria-expanded={isSaveMenuOpen}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${ isSaved ? 'bg-brand-600 text-white border-brand-600 shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-line hover:bg-slate-50 dark:hover:bg-slate-750' }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            {isSaveMenuOpen && (
              <SaveToListMenu
                companyId={company.id}
                companyName={company.name}
                anchorRef={saveButtonRef}
                onClose={() => setIsSaveMenuOpen(false)}
              />
            )}
          </div>
        </div>

      </div>

      {/* Office Banner Photo */}
      {company.bannerImage && (
        <div className="w-full h-36 bg-surface-2 relative overflow-hidden shrink-0 border-b border-line">
          <img
            src={company.bannerImage}
            alt={`${company.name} office`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-2 left-4 text-[11px] text-white font-medium drop-shadow-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{company.location.address}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <TabBar
          baseId={tabsId}
        tabs={tabs}
        active={currentTab}
        onChange={id => {
          setActiveTab(id);
          track('company_tab_viewed', { company_id: company.id, tab: id });
        }}
        className="border-b border-line px-5 bg-surface shrink-0"
      />

      {/* Scrollable Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-ink"
        role="tabpanel"
        id={tabPanelId(tabsId, currentTab)}
        aria-labelledby={`${tabsId}-tab-${currentTab}`}
        tabIndex={0}
      >
        
        {/* TAB 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="space-y-6">

            {/* 193 of 225 records have no verified profile text yet. Say so
                rather than rendering a column of empty headings. */}
            {!hasProfile && (
              <div className="border border-line rounded-lg p-3.5 bg-surface-2">
                <h3 className="text-xs font-semibold text-ink">
                  No verified profile yet
                </h3>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  We only publish details we can trace to a source. This
                  company&rsquo;s description and roles haven&rsquo;t been
                  verified, so they&rsquo;re left blank rather than guessed.
                  {company.website ? ' Their own site is linked below.' : ''}
                </p>
              </div>
            )}
            
            {company.shortDescription && (
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  About
                </h3>
                <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                  {company.shortDescription}
                </p>
              </div>
            )}

            {company.whatTheyDo && (
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  What They Do
                </h3>
                <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                  {company.whatTheyDo}
                </p>
              </div>
            )}

            {company.technicalAreas.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Technical Areas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {company.technicalAreas.map(tech => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs rounded-sm bg-surface-2 text-ink-2 border border-line"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            )}

            {company.commonCareers.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Common Careers
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {company.commonCareers.map(role => {
                  const relevant = isCareerRelevant(role, userInterests);
                  return (
                    <span
                      key={role}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${ relevant ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 text-ink-2 border border-slate-200 dark:border-slate-700' }`}
                    >
                      {role}
                    </span>
                  );
                })}
              </div>
            </div>
            )}

            {/* Potential Student Relevance Note */}
            {company.studentMatchReason && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-line rounded-lg p-3.5">
                <h4 className="text-xs font-semibold text-ink">
                  Student Relevance
                </h4>
                <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                  {company.studentMatchReason}
                </p>
              </div>
            )}

            {/* Where to go next — the company's own pages, when we have them */}
            {(company.website || company.linkedinUrl) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {company.website && (
                  <a
                    href={company.website}
                    onClick={() => track('website_link_clicked', { company_id: company.id })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Website</span>
                  </a>
                )}
                {company.linkedinUrl && (
                  <a
                    href={company.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
                    title="See the company and its people on LinkedIn"
                  >
                    <LinkedInMark />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            )}

            {/*
              Only rendered when independent sources actually exist. Previously
              this always showed "Verified Sources" listing the company's own
              homepage, which presented a claim as a citation.
            */}
            <div className="pt-3 border-t border-line">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                  Sources
                </h4>
                <ProvenanceBadge company={company} />
              </div>

              {company.sources.length > 0 ? (
                <ul className="space-y-1 text-xs text-ink-2">
                  {company.sources.map((src, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2 flex items-center gap-1"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink-3 leading-relaxed">
                  No independent sources recorded for this company yet. The
                  details above come from the original listing and have not been
                  checked.
                  {company.lastUpdated && ` Last reviewed ${company.lastUpdated}.`}
                </p>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: CAREERS */}
        {currentTab === 'careers' && <CompanyCareersTab company={company} />}

        {/* TAB 4: LOCATION */}
        {currentTab === 'location' && (
          <div className="space-y-4">
            
            {/* Address & Free Zone Card */}
            <div className="border border-line rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
              {company.location.address && (
                <div>
                  <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">
                    Address
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-ink mt-0.5">
                    {company.location.address}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block">
                    Area / District
                  </span>
                  <span className="font-semibold text-ink">{company.location.area}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block">
                    Jurisdiction
                  </span>
                  <span className="font-semibold text-ink">
                    {company.location.isFreeZone
                      ? (company.location.freeZoneName || 'Free Zone')
                      : 'Mainland UAE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Selector: Full-Width Bottom-Bordered Tabs (No Background) */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-2 border-b border-line">
                <button
                  type="button"
                  onClick={() => setCommuteMode('transit')}
                  className={`pb-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${ commuteMode === 'transit' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-2 hover:text-slate-800 dark:hover:text-slate-200' }`}
                >
                  <Bus className="w-4 h-4" />
                  <span>Public Bus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCommuteMode('driving')}
                  className={`pb-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${ commuteMode === 'driving' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-ink-2 hover:text-slate-800 dark:hover:text-slate-200' }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Driving</span>
                </button>
              </div>


              {/*
                Distance is exact; the travel time is not, and Google's embed
                below gives the real one. Showing our straight-line estimate
                here just contradicted it, so only the distance stays.
              */}
              <div className="flex items-baseline gap-2 px-0.5">
                <span className="text-sm font-semibold text-ink">
                  {company.commute.distanceKm.toFixed(1)} km
                </span>
                <span className="text-xs text-ink-3">
                  direct from {userLocation.name}
                </span>
              </div>

              {/*
                The real route, from a planner that has RTA's schedules. We do
                not draw it ourselves: Dubai's open data publishes bus route
                names and stop order but no bus stop coordinates, so an in-app
                route could not be verified.
              */}
              <div className="relative rounded-lg overflow-hidden border border-line h-64">
                {!isRouteMapLoaded && (
                  <div
                    className="absolute inset-0 bg-surface-2 animate-pulse flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-[11px] text-ink-3">Loading route…</span>
                  </div>
                )}
                <iframe
                  key={routeMapKey}
                  title={`Route from ${userLocation.name} to ${company.name}`}
                  src={directionsEmbedUrl(userLocation, company.location, commuteMode)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => setIsRouteMapLoaded(true)}
                  className={`w-full h-full border-0 block transition-opacity duration-200 ${
                    isRouteMapLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Sits under the map: you look at the route first, then open it. */}
              <a
                href={directionsUrl(userLocation, company.location, commuteMode)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track('route_viewed', { company_id: company.id, mode: commuteMode })
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <span>
                  {commuteMode === 'transit' ? 'Get transit directions' : 'Get driving directions'}
                </span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

            </div>
          </div>
        )}

        {/* TAB 5: SIMILAR COMPANIES */}
        {currentTab === 'similar' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Similar Companies in UAE
            </h3>
            {similarCompanies.map(sim => (
              <div
                key={sim.id}
                onClick={() => {
                  // The drawer stays mounted, so without this the new company
                  // opens on whatever tab was last read.
                  setActiveTab('overview');
                  setSelectedCompany(sim);
                }}
                className="p-3.5 border border-line rounded-lg bg-white dark:bg-slate-800 hover:border-brand-500 hover:shadow-subtle cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CompanyLogo name={sim.name} src={sim.logo} size="sm" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">{sim.name}</h4>
                    <span className="text-[11px] text-ink-2">{sim.categories.slice(0, 2).join(' · ')}</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-ink-2 shrink-0">
                  <span>{formatDistance(sim.commute.distanceKm)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      </aside>
    </Modal>
  );
};
