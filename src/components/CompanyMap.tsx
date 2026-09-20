import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { TILE_CONFIGS, defaultStyleForTheme, type MapStyleId } from '../utils/mapTiles';
import {
  MapPinHouse,
  Locate,
  Layers,
  ExternalLink,
  MapPin,
  Navigation,
  RotateCcw,
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

export const CompanyMap: React.FC<CompanyMapProps> = ({ companies, onSelectCompany }) => {
  const { userLocation, setUserLocation, resetUserLocation, theme } = useApp();
  
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
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [isClickToSetMode, setIsClickToSetMode] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setLocationToast(msg);
    setTimeout(() => setLocationToast(null), 3500);
  };

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

      // Create Distinct Home Location Marker with MapPinHouse & Pulsing Outline
      const userHtml = `
        <div class="relative flex items-center justify-center cursor-move" title="Drag to move reference location">
          <div class="absolute -inset-4 bg-amber-500/35 rounded-full animate-ping"></div>
          <div class="absolute -inset-2 bg-orange-500/40 rounded-full animate-pulse"></div>
          <div class="relative w-9 h-9 rounded-full bg-linear-to-tr from-amber-500 via-orange-500 to-rose-500 border-2 border-white flex items-center justify-center shadow-2xl text-white">
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
        { icon: userIcon, zIndexOffset: 1500, draggable: true }
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

    if (!showDistricts) return;

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
        `<div class="district-tip-badge" style="border-left: 2.5px solid ${d.borderColor};">
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
  }, [showDistricts]);

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
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isClickToSetMode) return;
      const lat = Math.round(e.latlng.lat * 100000) / 100000;
      const lng = Math.round(e.latlng.lng * 100000) / 100000;
      setUserLocation({
        name: `Custom Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        latitude: lat,
        longitude: lng,
        isCustom: true,
      });
      setIsClickToSetMode(false);
      showNotification(`Location set to ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isClickToSetMode, setUserLocation]);

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

      const marker = L.marker([lat, lon], { icon });

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

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;
        setUserLocation({
          name: 'My GPS Location',
          latitude: lat,
          longitude: lng,
          isCustom: true,
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
        }
        showNotification('Set origin to your GPS location');
      },
      (err) => {
        alert('Could not retrieve your location: ' + err.message);
      }
    );
  };

  const handleResetLocation = () => {
    resetUserLocation();
    showNotification('Reset origin to Academic City');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([25.12901, 55.42684], 13, { animate: true });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[360px] md:min-h-[580px] rounded-lg overflow-hidden border border-line bg-surface-3 ${isClickToSetMode ? 'cursor-crosshair' : ''}`}>
      
      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] md:min-h-[580px]" />

      {/* Floating Notification Toast */}
      {locationToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1100 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg border border-brand-400 flex items-center gap-2 animate-fade-in">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* Top Right Controls: Set Location, Districts Toggle, Tile Selector */}
      <div className="absolute top-4 right-4 z-1000 flex flex-col items-end gap-2">
        
        {/* Set Location Action Toolbar + Districts Overlay Toggle */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-lg border border-line shadow-lg transition-colors">
          <button
            onClick={() => setIsClickToSetMode(prev => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition ${ isClickToSetMode ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-700 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Click to enable placing your location pin anywhere on the map"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isClickToSetMode ? 'Click Map to Place' : 'Set Location'}</span>
          </button>

          <button
            onClick={handleUseGps}
            className="p-1.5 rounded-sm text-ink-2 hover:text-ink hover:bg-surface-2 transition"
            title="Use My GPS Location"
            aria-label="Use My GPS Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {userLocation.isCustom && (
            <button
              onClick={handleResetLocation}
              className="p-1.5 rounded-sm text-ink-2 hover:text-ink hover:bg-surface-2 transition"
              title="Reset location to Academic City"
              aria-label="Reset location to Academic City"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Region / District Boundaries Toggle */}
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={() => setShowDistricts(prev => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition ${ showDistricts ? 'bg-brand-600 text-white shadow-2xs' : 'text-slate-700 dark:text-slate-300 hover:text-ink hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title="Toggle Dubai tech district boundary polygons and English labels"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showDistricts ? 'Districts: On' : 'Districts: Off'}</span>
          </button>
        </div>

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

      {/* Floating Bottom Left: User Location Commute Reference Badge with MapPinHouse */}
      <div className="absolute bottom-6 left-6 z-1000 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-line rounded-lg p-3 text-ink shadow-xl flex items-center gap-3 transition-colors">
        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
          <MapPinHouse className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-semibold text-ink-2 tracking-wider">
            {userLocation.isCustom ? 'Your Custom Location' : 'Default Reference Location'}
          </div>
          <div className="text-xs font-semibold text-ink truncate max-w-[200px]">
            {userLocation.name}
          </div>
          <div className="text-[11px] text-ink-2">
            {userLocation.latitude.toFixed(3)}° N, {userLocation.longitude.toFixed(3)}° E · (drag pin to move)
          </div>
        </div>
        <button
          onClick={handleCenterOnUser}
          className="ml-1 p-1.5 rounded-sm hover:bg-surface-2 text-slate-400 hover:text-ink transition"
          title="Center map on your location"
          aria-label="Center map on your location"
        >
          <Locate className="w-4 h-4" />
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
              <div className="w-10 h-10 rounded-sm border border-line bg-surface-2 flex items-center justify-center p-1 shrink-0">
                <img
                  src={activePopupCompany.logo}
                  alt={activePopupCompany.name}
                  className="w-full h-full object-contain"
                />
              </div>
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
