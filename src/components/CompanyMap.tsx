import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { Home, Locate, Layers, ExternalLink, MapPin, Navigation, RotateCcw, X } from 'lucide-react';

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

// Major Dubai Districts for clean reference labels
const MAJOR_DISTRICTS = [
  { name: 'Academic City', lat: 25.129, lon: 55.412, isHome: true },
  { name: 'Silicon Oasis', lat: 25.124, lon: 55.378 },
  { name: 'Downtown Dubai', lat: 25.197, lon: 55.274 },
  { name: 'Business Bay', lat: 25.184, lon: 55.267 },
  { name: 'Dubai Internet City', lat: 25.097, lon: 55.168 },
  { name: 'Dubai Media City', lat: 25.092, lon: 55.158 },
  { name: 'DIFC', lat: 25.210, lon: 55.280 },
  { name: 'Dubai Marina', lat: 25.080, lon: 55.140 },
  { name: 'Jumeirah', lat: 25.170, lon: 55.220 },
  { name: 'Dubai Intl Airport', lat: 25.253, lon: 55.365 },
];

export const CompanyMap: React.FC<CompanyMapProps> = ({ companies, onSelectCompany }) => {
  const { userLocation, setUserLocation, resetUserLocation } = useApp();
  
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
  const [mapStyle, setMapStyle] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [isClickToSetMode, setIsClickToSetMode] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Tile Providers (100% Free, NO API keys needed, NO watermarks)
  const TILE_CONFIGS = {
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 16,
      subdomains: 'abc',
      name: 'Dark Gray (Esri)'
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      subdomains: 'abc',
      name: 'OpenStreetMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 18,
      subdomains: 'abc',
      name: 'Satellite (Esri)'
    }
  };

  const showNotification = (msg: string) => {
    setLocationToast(msg);
    setTimeout(() => setLocationToast(null), 3500);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around Dubai tech corridor for crisp initial framing
      const map = L.map(mapContainerRef.current, {
        center: [25.135, 55.285],
        zoom: 11.5,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // Add default tile layer
      const config = TILE_CONFIGS[mapStyle];
      tileLayerRef.current = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        subdomains: config.subdomains,
      }).addTo(map);

      // Add Zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create User Location Marker
      const userHtml = `
        <div class="relative flex items-center justify-center cursor-move" title="Drag to change your location">
          <div class="absolute -inset-2.5 bg-brand-500/25 rounded-full animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center shadow-lg text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
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
        { permanent: false, direction: 'top', className: 'dark-tooltip' }
      );

      userMarkerRef.current = userMarker;

      // Layers for districts and company markers
      districtsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Render district labels
      MAJOR_DISTRICTS.forEach(d => {
        if (d.isHome) return;
        const districtHtml = `
          <div class="text-[10px] font-semibold text-slate-400/80 uppercase tracking-wider select-none pointer-events-none whitespace-nowrap drop-shadow-sm">
            ${d.name}
          </div>
        `;
        const districtIcon = L.divIcon({
          html: districtHtml,
          className: 'district-label',
          iconSize: [100, 14],
          iconAnchor: [50, 7],
        });
        L.marker([d.lat, d.lon], { icon: districtIcon, interactive: false }).addTo(districtsLayerRef.current!);
      });

      mapInstanceRef.current = map;

      // Invalidate size to ensure container is fully painted
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
  const handleSwitchTile = (newStyle: 'dark' | 'osm' | 'satellite') => {
    setMapStyle(newStyle);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_CONFIGS[newStyle];
    tileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
    }).addTo(map);
  };

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

    // Only adjust bounds when the user actively filters categories, never on initial mount or pin click
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
    <div className={`relative w-full h-full min-h-[580px] rounded-lg overflow-hidden border border-slate-200 dark:border-[#27272a] bg-slate-100 dark:bg-[#121214] ${isClickToSetMode ? 'cursor-crosshair' : ''}`}>
      
      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[580px]" />

      {/* Floating Notification Toast */}
      {locationToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg border border-brand-400 flex items-center gap-2 animate-fadeIn">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* Top Right Controls: Set Location + Tile Selector */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        
        {/* Set Location Action Toolbar */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-[#27272a] shadow-lg transition-colors">
          <button
            onClick={() => setIsClickToSetMode(prev => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition ${
              isClickToSetMode
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
            }`}
            title="Click to enable placing your location pin anywhere on the map"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isClickToSetMode ? 'Click Map to Place' : 'Set Location'}</span>
          </button>

          <button
            onClick={handleUseGps}
            className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226] transition"
            title="Use My GPS Location"
            aria-label="Use My GPS Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {userLocation.isCustom && (
            <button
              onClick={handleResetLocation}
              className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226] transition"
              title="Reset location to Academic City"
              aria-label="Reset location to Academic City"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Map Tile Provider Selector */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 dark:border-[#27272a] shadow-lg transition-colors">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <button
            onClick={() => handleSwitchTile('dark')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${
              mapStyle === 'dark' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
            }`}
            title="Esri Dark Gray Minimal (No watermark)"
          >
            Dark
          </button>
          <button
            onClick={() => handleSwitchTile('osm')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${
              mapStyle === 'osm' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
            }`}
            title="OpenStreetMap Street View"
          >
            Street
          </button>
          <button
            onClick={() => handleSwitchTile('satellite')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition ${
              mapStyle === 'satellite' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222226]'
            }`}
            title="Esri Satellite Imagery"
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Floating Bottom Left: User Location Commute Reference Badge */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-slate-200 dark:border-[#27272a] rounded-lg p-3 text-slate-800 dark:text-white shadow-xl flex items-center gap-3 transition-colors">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center text-brand-500 shrink-0">
          <Home className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
            {userLocation.isCustom ? 'Your Custom Location' : 'Default Reference Location'}
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
            {userLocation.name}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {userLocation.latitude.toFixed(3)}° N, {userLocation.longitude.toFixed(3)}° E · (drag pin to move)
          </div>
        </div>
        <button
          onClick={handleCenterOnUser}
          className="ml-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#222226] text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          title="Center map on your location"
          aria-label="Center map on your location"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Selected Company Popup Card */}
      {activePopupCompany && (
        <div
          className="absolute top-28 right-4 z-[1000] bg-white dark:bg-[#18181b] rounded-lg p-3.5 shadow-popup border border-slate-200 dark:border-[#27272a] max-w-xs transition-all text-slate-900 dark:text-slate-100"
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => onSelectCompanyRef.current(activePopupCompany)}
            >
              <div className="w-10 h-10 rounded border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#222226] flex items-center justify-center p-1 shrink-0">
                <img
                  src={activePopupCompany.logo}
                  alt={activePopupCompany.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activePopupCompany.name}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activePopupCompany.categories.slice(0, 2).join(' · ')}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
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
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222226] transition"
              title="Close popup"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onSelectCompanyRef.current(activePopupCompany)}
            className="w-full mt-2.5 pt-2 border-t border-slate-100 dark:border-[#27272a] flex items-center justify-between text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            <span>Click to open detail drawer</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

    </div>
  );
};
