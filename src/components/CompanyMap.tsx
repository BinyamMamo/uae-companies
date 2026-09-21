import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './ui/Toast';
import { LocationPicker } from './ui/LocationPicker';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { TILE_CONFIGS, defaultStyleForTheme, type MapStyleId } from '../utils/mapTiles';
import {
  MapPinHouse,
  Locate,
  Layers,
  ExternalLink,
  X
} from 'lucide-react';

interface CompanyMapProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
}

// Color mapping matching the restrained palette from reference screenshot
const CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  'Tech / Software': { bg: '#2563eb', border: '#60a5fa' },
  'AI / ML': { bg: '#059669', border: '#34d399' },
  'AI / Data': { bg: '#059669', border: '#34d399' },
  'Cybersecurity': { bg: '#475569', border: '#94a3b8' },
  'Hardware / Embedded': { bg: '#d97706', border: '#fcd34d' },
  'Telecom / Networks': { bg: '#0284c7', border: '#7dd3fc' },
  'Aviation': { bg: '#0284c7', border: '#bae6fd' },
  'Other': { bg: '#334155', border: '#64748b' }
};

import { DUBAI_DISTRICTS_GEO } from '../data/dubaiDistrictsGeo';
import { CompanyLogo } from './ui/CompanyLogo';

export const CompanyMap: React.FC<CompanyMapProps> = ({ companies, onSelectCompany }) => {
  const { userLocation, setUserLocation } = useApp();
  const { theme } = useTheme();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const districtsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onSelectCompanyRef = useRef(onSelectCompany);

  useEffect(() => {
    onSelectCompanyRef.current = onSelectCompany;
  }, [onSelectCompany]);
  
  const [activePopupCompany, setActivePopupCompany] = useState<Company | null>(null);
  // Tile style follows the UI theme unless the user picks one explicitly.
  const [mapStyle, setMapStyle] = useState<MapStyleId>(() => defaultStyleForTheme(theme));
  const userPickedStyleRef = useRef(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [isPickerOpen]);
  const { toast } = useToast();
  const showNotification = useCallback(
    (msg: string) => toast(msg, 'success'),
    [toast]
  );

  // Initialize Map with ideal default zoom & center
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on central Dubai corridor at zoom 12 for clean visibility of all tech clusters
      const map = L.map(mapContainerRef.current, {
        center: [25.14, 55.26],
        zoom: 12,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
      });

      map.attributionControl.setPrefix('');

      // Add default tile layer
      const config = TILE_CONFIGS[mapStyle];
      tileLayerRef.current = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution,
      }).addTo(map);

      // Add Zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Home location marker: pulsing halo, no ring
      const userHtml = `
        <div class="relative flex items-center justify-center cursor-move" title="Drag to move reference location">
          <div class="absolute -inset-4 bg-amber-500/35 rounded-full animate-ping"></div>
          <div class="absolute -inset-2 bg-orange-500/40 rounded-full animate-pulse"></div>
          <div class="relative w-9 h-9 rounded-full bg-linear-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/>
              <path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/>
              <path d="M18 22v-3"/>
              <circle cx="10" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const userMarker = L.marker(
        [userLocation.latitude, userLocation.longitude],
        {
          icon: userIcon,
          zIndexOffset: 1500,
          draggable: true,
          // Leaflet marks interactive markers role="button"; without this they
          // have no accessible name at all.
          alt: 'Your home location — drag to move',
          title: 'Drag to move your home location',
        }
      ).addTo(map);

      userMarker.on('dragend', (e) => {
        const marker = e.target as L.Marker;
        const latlng = marker.getLatLng();
        const lat = Math.round(latlng.lat * 100000) / 100000;
        const lng = Math.round(latlng.lng * 100000) / 100000;
        setUserLocation({
          name: `Custom Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          latitude: lat,
          longitude: lng,
          isCustom: true,
        });
        showNotification(`Location set to ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`);
      });

      userMarker.bindTooltip(
        `<div style="font-family: Inter, sans-serif; font-size: 11px; padding: 2px 4px;">
           <strong style="color:#f8fafc;">${userLocation.name}</strong><br/>
           <span style="color:#a1a1aa;">Drag to set location or click map</span>
         </div>`,
        { permanent: false, direction: 'top', className: 'map-tooltip' }
      );

      userMarkerRef.current = userMarker;

      // Layers for district boundaries and company markers
      districtsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update District Boundaries & Highlighting
  useEffect(() => {
    const districtsLayer = districtsLayerRef.current;
    if (!districtsLayer) return;

    districtsLayer.clearLayers();


    DUBAI_DISTRICTS_GEO.forEach(d => {
      // 1. Real geographic boundary polygon
      const polygon = L.polygon(d.polygon, {
        color: d.borderColor,
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: d.color,
        fillOpacity: 0.08,
      });

      // Hover interaction to smoothly highlight boundary
      polygon.on('mouseover', () => {
        polygon.setStyle({
          fillOpacity: 0.18,
          weight: 2.2,
        });
      });

      polygon.on('mouseout', () => {
        polygon.setStyle({
          fillOpacity: 0.08,
          weight: 1.5,
        });
      });

      // Detailed tooltip on hover anywhere along the district boundary
      polygon.bindTooltip(
        `<div style="font-family: Inter, sans-serif; font-size: 11px; padding: 2px 4px;">
           <strong style="color:${d.borderColor}; font-size: 12px; display: block; margin-bottom: 2px;">${d.name}</strong>
           <span style="color:#a1a1aa;">${d.info}</span>
         </div>`,
        { sticky: true, className: 'map-tooltip' }
      );

      districtsLayer.addLayer(polygon);

      // 2. Sleek border label at the top tip of the boundary (never covering pins in cluster centers!)
      const tipMarker = L.circleMarker(d.northTip, {
        radius: 0,
        opacity: 0,
        fillOpacity: 0,
        interactive: false,
      });

      tipMarker.bindTooltip(
        `<div class="district-tip-badge" style="--district: ${d.borderColor};">
           <span>${d.badgeName}</span>
         </div>`,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -2],
          className: 'district-tip-tooltip',
          interactive: false,
        }
      );

      districtsLayer.addLayer(tipMarker);
    });
  }, []);

  // Update User Marker position whenever userLocation changes in Context
  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      userMarkerRef.current.setTooltipContent(
        `<div style="font-family: Inter, sans-serif; font-size: 11px; padding: 2px 4px;">
           <strong style="color:#f8fafc;">${userLocation.name}</strong><br/>
           <span style="color:#a1a1aa;">${userLocation.isCustom ? 'Custom Location (Drag to move)' : 'Academic City Reference Point'}</span>
         </div>`
      );
    }
  }, [userLocation]);

  // Click-on-map to set location handler

  // Handle Tile Style Switcher
  const applyTileStyle = useCallback((newStyle: MapStyleId) => {
    setMapStyle(newStyle);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_CONFIGS[newStyle];
    tileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(map);
  }, []);

  const handleSwitchTile = useCallback((newStyle: MapStyleId) => {
    userPickedStyleRef.current = true;
    applyTileStyle(newStyle);
  }, [applyTileStyle]);

  // Follow the UI theme until the user overrides the tile style themselves.
  useEffect(() => {
    if (userPickedStyleRef.current) return;
    applyTileStyle(defaultStyleForTheme(theme));
  }, [theme, applyTileStyle]);

  const prevCategoryCountRef = useRef<number>(companies.length);
  const isFirstRenderRef = useRef<boolean>(true);

  // Update Company Markers (preserves zoom when pins are clicked)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    companies.forEach(company => {
      const lat = company.location.latitude;
      const lon = company.location.longitude;

      const primaryCat = company.categories[0] || 'Other';
      const colorScheme = CATEGORY_COLORS[primaryCat] || CATEGORY_COLORS['Other'];

      const markerHtml = `
        <div class="group relative cursor-pointer" title="${company.name}">
          <div class="w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-125" style="background-color: ${colorScheme.bg}; border: 2px solid ${colorScheme.border};">
            <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-map-pin',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([lat, lon], {
        icon,
        alt: `${company.name}, ${company.location.area}`,
        title: company.name,
      });

      marker.on('click', () => {
        setActivePopupCompany(company);
        onSelectCompanyRef.current(company);
      });

      marker.on('mouseover', () => {
        setActivePopupCompany(company);
      });

      markersLayer.addLayer(marker);
    });

    // Only adjust bounds when the user actively filters categories
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevCategoryCountRef.current = companies.length;
    } else if (companies.length !== prevCategoryCountRef.current) {
      prevCategoryCountRef.current = companies.length;
      if (companies.length > 0 && companies.length <= 40) {
        const bounds = L.latLngBounds(companies.map(c => [c.location.latitude, c.location.longitude]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
    }
  }, [companies]);

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [userLocation.latitude, userLocation.longitude],
        13,
        { animate: true }
      );
    }
  };



  return (
    <div className={`relative w-full h-full min-h-[360px] md:min-h-[580px] rounded-lg overflow-hidden border border-line bg-surface-3 `}>
      
      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] md:min-h-[580px]" />

      {/* Top right: tile style */}
      <div className="absolute top-4 right-4 z-1000 flex flex-col items-end gap-2">
        {/* Map Tile Provider Selector: Street (Default), Clean (Hide streets), Dark, Satellite */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-lg border border-line shadow-lg transition-colors">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <button
            onClick={() => handleSwitchTile('street')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${ mapStyle === 'street' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Street Map with English labels"
          >
            Street
          </button>
          <button
            onClick={() => handleSwitchTile('clean')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${ mapStyle === 'clean' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Hide streets and keep clean regional canvas"
          >
            Clean
          </button>
          <button
            onClick={() => handleSwitchTile('dark')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${ mapStyle === 'dark' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Dark Gray Minimal"
          >
            Dark
          </button>
          <button
            onClick={() => handleSwitchTile('satellite')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${ mapStyle === 'satellite' ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Esri Satellite Imagery"
          >
            Satellite
          </button>
        </div>
      </div>

      {/*
        Sits to the left of Leaflet's zoom control, which renders at
        bottom-right. right-16 clears the ~40px zoom buttons plus their margin.
      */}
      <div className="absolute bottom-6 right-16 z-1000" ref={pickerRef}>
        {isPickerOpen && (
          <div className="absolute bottom-full right-0 mb-2">
            <LocationPicker direction="up" onClose={() => setIsPickerOpen(false)} />
          </div>
        )}
        <button
          onClick={() => setIsPickerOpen(open => !open)}
          aria-expanded={isPickerOpen}
          aria-haspopup="dialog"
          className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-line shadow-lg text-ink-2 hover:text-ink transition-colors"
          title="Change the location commutes are measured from"
        >
          <MapPinHouse className="w-4 h-4" aria-hidden="true" />
          <span>Change location</span>
        </button>
      </div>

      {/* Bottom left: which location the commute figures are measured from */}
      <div className="absolute bottom-6 left-6 z-1000 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-line rounded-lg px-3 py-2 text-ink shadow-xl flex items-center gap-2 transition-colors">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink truncate max-w-[220px]">
            {userLocation.name}
          </div>
          <div className="text-[11px] text-ink-3">
            Commutes measured from here · drag to move
          </div>
        </div>
        <button
          onClick={handleCenterOnUser}
          className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
          title="Centre map on this location"
          aria-label="Centre map on this location"
        >
          <Locate className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Floating Selected Company Popup Card */}
      {activePopupCompany && (
        <div
          className="absolute top-28 right-4 z-1000 bg-surface rounded-lg p-3.5 shadow-popup border border-line max-w-xs transition-colors text-ink"
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => onSelectCompanyRef.current(activePopupCompany)}
            >
              <CompanyLogo name={activePopupCompany.name} src={activePopupCompany.logo} size="sm" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-ink truncate">
                  {activePopupCompany.name}
                </h4>
                <div className="text-xs text-ink-2">
                  {activePopupCompany.categories.slice(0, 2).join(' · ')}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-2 mt-2">
                  <span className="font-semibold text-ink">
                    {formatDistance(activePopupCompany.commute.distanceKm)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-brand-600 dark:text-brand-400 font-medium">
                    {formatBusCommute(activePopupCompany.commute.busMinutes)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActivePopupCompany(null)}
              className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-2 transition"
              title="Close popup"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onSelectCompanyRef.current(activePopupCompany)}
            className="w-full mt-2.5 pt-2 border-t border-line flex items-center justify-between text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            <span>Click to open detail drawer</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

    </div>
  );
};
