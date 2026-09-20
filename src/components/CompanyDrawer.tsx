import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { TILE_CONFIGS, previewStyleForTheme } from '../utils/mapTiles';
import 'leaflet/dist/leaflet.css';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { isCareerRelevant } from '../utils/relevance';
import { calculateTransitRoute } from '../utils/transitRouting';
import {
  X,
  Bookmark,
  ExternalLink,
  MapPin,
  Car,
  CheckCircle2,
  ShieldCheck,
  Users,
  ArrowRight,
  Bus,
  MapPinHouse,
  Footprints,
  Train
} from 'lucide-react';

interface CompanyDrawerProps {
  company: Company;
  onClose: () => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({ company, onClose }) => {
  const { toggleSaveCompany, isCompanySaved, companies, setSelectedCompany, userInterests, userLocation, theme } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'employees' | 'location' | 'similar'>('overview');
  const [commuteMode, setCommuteMode] = useState<'transit' | 'driving'>('transit');

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

  const transitPlan = calculateTransitRoute(userLocation, {
    latitude: company.location.latitude,
    longitude: company.location.longitude,
    name: company.name,
    area: company.location.area,
  });

  const routeMapContainerRef = useRef<HTMLDivElement>(null);
  const routeMapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (activeTab !== 'location' || !routeMapContainerRef.current) return;

    if (routeMapInstanceRef.current) {
      routeMapInstanceRef.current.remove();
      routeMapInstanceRef.current = null;
    }

    const originCoords: [number, number] = [userLocation.latitude, userLocation.longitude];
    const destCoords: [number, number] = [company.location.latitude, company.location.longitude];

    const map = L.map(routeMapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix('');

    const tiles = TILE_CONFIGS[previewStyleForTheme(theme)];
    L.tileLayer(tiles.url, {
      maxZoom: tiles.maxZoom,
      attribution: tiles.attribution,
    }).addTo(map);

    // 1. Home Pin (Origin)
    const homeHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid #2563eb; opacity: 0.75; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
      </div>
    `;
    const homeIcon = L.divIcon({
      html: homeHtml,
      className: 'custom-home-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const homeMarker = L.marker(originCoords, { icon: homeIcon }).addTo(map);
    homeMarker.bindTooltip(`<strong>Home Address</strong><br/>${userLocation.name}`, {
      direction: 'top',
      className: 'map-tooltip',
    });

    // 2. Company Destination Pin
    const destHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #059669; color: #fff; box-shadow: 0 4px 12px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
        </div>
      </div>
    `;
    const destIcon = L.divIcon({
      html: destHtml,
      className: 'custom-dest-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);
    destMarker.bindTooltip(`<strong>${company.name}</strong><br/>${company.location.area}`, {
      direction: 'top',
      className: 'map-tooltip',
    });

    // 3. Render Route Polylines based on mode
    if (commuteMode === 'transit') {
      transitPlan.legs.forEach(leg => {
        if (leg.type === 'walk') {
          L.polyline(leg.coordinates, {
            color: '#64748b',
            weight: 3,
            dashArray: '4, 5',
            opacity: 0.85,
          }).addTo(map);
        } else {
          L.polyline(leg.coordinates, {
            color: leg.color,
            weight: 4,
            opacity: 0.95,
          }).addTo(map);
        }
      });
    } else {
      L.polyline(transitPlan.drivingPolyline, {
        color: '#059669',
        weight: 4,
        opacity: 0.95,
      }).addTo(map);
    }

    const bounds = L.latLngBounds([originCoords, destCoords]);
    map.fitBounds(bounds, { padding: [40, 40] });

    routeMapInstanceRef.current = map;

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (routeMapInstanceRef.current) {
        routeMapInstanceRef.current.remove();
        routeMapInstanceRef.current = null;
      }
    };
  }, [activeTab, commuteMode, userLocation.latitude, userLocation.longitude, company.id, theme]);

  const tabs: Array<{ id: 'overview' | 'careers' | 'employees' | 'location' | 'similar'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'careers', label: 'Careers' },
    { id: 'employees', label: 'Employees' },
    { id: 'location', label: 'Location' },
    { id: 'similar', label: 'Similar' },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-[2px] z-9998 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-9999 w-full max-w-lg bg-surface border-l border-line shadow-[-4px_0_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 dark:ring-0 dark:shadow-[-20px_0_56px_rgba(0,0,0,0.75)] flex flex-col transition-colors duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={`${company.name} Details`}
      >
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
          <div className="w-12 h-12 rounded-lg border border-line bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `<span class="text-xs font-bold text-ink-2">${company.name.slice(0, 2).toUpperCase()}</span>`;
                }
              }}
            />
          </div>
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
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{formatBusCommute(company.commute.busMinutes)}</span>
          </div>

          <button
            onClick={() => toggleSaveCompany(company.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 ${ isSaved ? 'bg-brand-600 text-white border-brand-600 shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-line hover:bg-slate-50 dark:hover:bg-slate-750' }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
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
      <div className="border-b border-line px-5 bg-surface shrink-0 flex items-center gap-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${ activeTab === tab.id ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold' : 'border-transparent text-ink-2 hover:text-slate-900 dark:hover:text-white' }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-ink">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* About */}
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                About
              </h3>
              <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                {company.shortDescription}
              </p>
            </div>

            {/* What They Do */}
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                What They Do
              </h3>
              <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                {company.whatTheyDo}
              </p>
            </div>

            {/* Technical Areas */}
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

            {/* Common Careers with student match highlights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
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
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${ relevant ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 text-ink-2 border border-slate-200 dark:border-slate-700' }`}
                    >
                      {role}
                    </span>
                  );
                })}
              </div>
            </div>

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

            {/* Data Citations & Sources */}
            <div className="pt-3 border-t border-line">
              <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                Verified Sources
              </h4>
              <ul className="space-y-1 text-xs text-ink-2">
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
            <div className="bg-slate-50 dark:bg-slate-800 border border-line rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-ink">
                  Official Careers Portal
                </h4>
                <p className="text-xs text-ink-2 mt-0.5">
                  Browse live verified openings and graduate vacancies.
                </p>
              </div>
              <a
                href={company.careersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-sm shadow-2xs transition"
              >
                <span>Careers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Program Status Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-line rounded-lg p-3 bg-white dark:bg-slate-800">
                <span className="text-[10px] text-ink-3 font-semibold uppercase tracking-wider block">
                  Student Internships
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {company.internshipsKnown ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-ink">Verified Program</span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-2">Subject to openings</span>
                  )}
                </div>
              </div>

              <div className="border border-line rounded-lg p-3 bg-white dark:bg-slate-800">
                <span className="text-[10px] text-ink-3 font-semibold uppercase tracking-wider block">
                  Graduate Roles
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {company.graduateRolesKnown ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-ink">Direct Entry Available</span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-2">Seasonal entry</span>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Career Roles List */}
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">
                Technical Career Paths
              </h3>
              <div className="space-y-2">
                {company.commonCareers.map((role) => {
                  const relevant = isCareerRelevant(role, userInterests);
                  return (
                    <div
                      key={role}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${ relevant ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' }`}
                    >
                      <div>
                        <span className="text-xs font-semibold text-ink block">
                          {role}
                        </span>
                        <span className="text-[11px] text-ink-2">
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
            
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
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
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-line bg-white dark:bg-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-200 shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-ink">{emp.name}</h4>
                        <div className="text-xs text-ink-2">{emp.title}</div>
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
              <div className="text-center py-8 px-4 border border-dashed border-line rounded-lg">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-ink-2 font-medium">
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
            <div className="border border-line rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">
                  Address
                </span>
                <p className="text-xs sm:text-sm font-medium text-ink mt-0.5">
                  {company.location.address}
                </p>
              </div>

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

              {/* Clean Map Embed - no borders, no cards */}
              <div className="rounded-lg overflow-hidden">
                <div
                  ref={routeMapContainerRef}
                  className="w-full h-44 z-0"
                  style={{ background: 'var(--bg-muted)' }}
                />
              </div>

              {/* Route Summary Bar */}
              <div className="p-3 rounded-lg border border-line bg-white dark:bg-slate-800/80">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-ink">
                    {commuteMode === 'transit' ? `~${transitPlan.totalMinutes} min` : `~${transitPlan.drivingMinutes} min`}
                  </span>
                  <span className="text-xs text-ink-2 font-medium">
                    ({transitPlan.totalDistanceKm.toFixed(1)} km)
                  </span>
                </div>
                <span className="text-xs text-ink-2 block mt-0.5">
                  {commuteMode === 'transit' ? transitPlan.transitSummary : 'Via Dubai Arterial Highway Network'}
                </span>
              </div>

              {/* Downward Route Sequence (Google Maps Style) */}
              {commuteMode === 'transit' && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Transit Route Itinerary
                    </span>
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {transitPlan.primaryBusLine}
                    </span>
                  </div>

                  {/* Vertical Timeline Track */}
                  <div className="space-y-0 pt-1">
                    
                    {/* Origin: Home Address */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/50 border-2 border-brand-600 dark:border-brand-400 flex items-center justify-center shrink-0 z-10">
                          <MapPinHouse className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="w-0.5 flex-1 min-h-[28px] border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-px" />
                      </div>
                      <div className="pb-3 flex-1">
                        <span className="text-xs font-bold text-ink block">
                          Home Address
                        </span>
                        <span className="text-[11px] text-ink-2 block mt-0.5">
                          {userLocation.name}
                        </span>
                      </div>
                    </div>

                    {/* Sequential Legs */}
                    {transitPlan.legs.map((leg) => {
                      if (leg.type === 'walk') {
                        return (
                          <div key={leg.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 rounded-full bg-surface-2 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 z-10">
                                <Footprints className="w-3 h-3 text-ink-2" />
                              </div>
                              <div className="w-0.5 flex-1 min-h-[28px] border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-px" />
                            </div>
                            <div className="pb-3 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-semibold text-ink-2">
                                  Walk to {leg.to}
                                </span>
                                <span className="text-[11px] font-medium text-ink-2 shrink-0">
                                  ~{leg.durationMin} min ({Math.round(leg.distanceKm * 1000)} m)
                                </span>
                              </div>
                              {leg.notes && (
                                <p className="text-[11px] text-ink-3 mt-0.5">
                                  {leg.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Bus or Metro Leg
                      return (
                        <div key={leg.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-2xs z-10"
                              style={{ backgroundColor: leg.color }}
                            >
                              {leg.type === 'metro' ? (
                                <Train className="w-3 h-3 text-white" />
                              ) : (
                                <Bus className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div
                              className="w-1 flex-1 min-h-[52px] rounded-full my-0.5"
                              style={{ backgroundColor: leg.color }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shrink-0 z-10"
                              style={{ backgroundColor: leg.color }}
                            />
                            <div className="w-0.5 flex-1 min-h-[24px] border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-px" />
                          </div>
                          <div className="pb-4 flex-1 space-y-2">
                            {/* Boarding Info Card */}
                            <div className="p-3 rounded-lg border border-line bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className="px-2 py-0.5 rounded-sm text-[11px] font-bold text-white tracking-wide"
                                    style={{ backgroundColor: leg.color }}
                                  >
                                    {leg.lineBadge}
                                  </span>
                                  <span className="text-xs font-semibold text-ink">
                                    Board at {leg.from}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-ink shrink-0">
                                  ~{leg.durationMin} min
                                </span>
                              </div>

                              {leg.corridor && (
                                <div className="text-[11px] text-ink-2">
                                  via {leg.corridor}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-ink-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                                <span>Ride to: <strong className="text-ink font-semibold">{leg.to}</strong></span>
                                {leg.frequencyMin && (
                                  <span className="font-medium text-ink-2">Every {leg.frequencyMin} min</span>
                                )}
                              </div>
                            </div>

                            {/* Alighting Callout */}
                            <div className="text-xs font-medium text-ink-2 pl-0.5">
                              Alight at <span className="font-bold text-ink">{leg.to}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Final Destination Arrival */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs z-10 ring-2 ring-emerald-400/30">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="pt-0.5 flex-1">
                        <span className="text-xs font-bold text-ink block">
                          Arrive at {company.name}
                        </span>
                        <span className="text-[11px] text-ink-2 block mt-0.5">
                          {company.location.address}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Transit Advisory Note */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                    <span className="font-semibold text-ink block">
                      Transit Advisory
                    </span>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      {transitPlan.advisoryNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Driving Downward Sequence */}
              {commuteMode === 'driving' && (
                <div className="pt-2 space-y-3">
                  <div className="pb-2 border-b border-line">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Driving Route Itinerary
                    </span>
                  </div>

                  {/* Vertical Timeline Track */}
                  <div className="space-y-0 pt-1">
                    
                    {/* Origin: Home Address */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/50 border-2 border-brand-600 dark:border-brand-400 flex items-center justify-center shrink-0 z-10">
                          <MapPinHouse className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="w-1 flex-1 min-h-[32px] bg-emerald-500 rounded-full my-0.5" />
                      </div>
                      <div className="pb-3 flex-1">
                        <span className="text-xs font-bold text-ink block">
                          Home Address
                        </span>
                        <span className="text-[11px] text-ink-2 block mt-0.5">
                          {userLocation.name}
                        </span>
                      </div>
                    </div>

                    {/* Highway Corridor Leg */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs z-10">
                          <Car className="w-3 h-3 text-white" />
                        </div>
                        <div className="w-1 flex-1 min-h-[48px] bg-emerald-500 rounded-full my-0.5" />
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                              Dubai Arterial Highway Network
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              ~{transitPlan.drivingMinutes} min
                            </span>
                          </div>
                          <p className="text-emerald-800/80 dark:text-emerald-300/80 text-[11px] leading-relaxed">
                            Direct expressway travel ({transitPlan.totalDistanceKm.toFixed(1)} km). Off-peak driving time is approximately {transitPlan.drivingMinutes} min. Please allow an additional 10 to 15 min during peak evening hours (5:30 to 7:00 PM).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Final Destination Arrival */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs z-10 ring-2 ring-emerald-400/30">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="pt-0.5 flex-1">
                        <span className="text-xs font-bold text-ink block">
                          Arrive at {company.name}
                        </span>
                        <span className="text-[11px] text-ink-2 block mt-0.5">
                          {company.location.address}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Driving Commute Advisory */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                    <span className="font-semibold text-ink block">
                      Traffic Advisory
                    </span>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      Major arterial expressways (E66 Dubai-Al Ain Rd, E311 Sheikh Mohammed Bin Zayed Rd, and E11 Sheikh Zayed Rd) experience peak traffic between 5:30 PM and 7:00 PM on weekdays.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 5: SIMILAR COMPANIES */}
        {activeTab === 'similar' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Similar Companies in UAE
            </h3>
            {similarCompanies.map(sim => (
              <div
                key={sim.id}
                onClick={() => setSelectedCompany(sim)}
                className="p-3.5 border border-line rounded-lg bg-white dark:bg-slate-800 hover:border-brand-500 hover:shadow-subtle cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex items-center justify-center p-1 shrink-0">
                    <img
                      src={sim.logo}
                      alt={sim.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
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
    </>
  );
};
