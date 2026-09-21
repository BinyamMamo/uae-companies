import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { TILE_CONFIGS, previewStyleForTheme } from '../utils/mapTiles';
import 'leaflet/dist/leaflet.css';
import { useApp, DEFAULT_ORIGIN } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  Sun,
  MoonStar,
  RotateCcw,
  Download,
  Trash2,
  MapPinHouse,
  Search,
  LocateFixed,
  Check,
} from 'lucide-react';
import { ResponsiveSheet } from './ui/ResponsiveSheet';
import { SocialLinks } from './ui/SocialLinks';
import { useToast } from './ui/Toast';
import { useConfirm } from '../hooks/useConfirm';
import { DUBAI_LOCATIONS, type DubaiLocationPreset } from '../utils/dubaiLocations';
import { homeMarkerHtml, HOME_MARKER_SIZE } from '../utils/homeMarker';




export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    userLocation,
    isLocationSet,
    setUserLocation,
    resetUserLocation,
    savedCompanyIds,
    savedLists
  } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DubaiLocationPreset[]>([]);
  /*
    A line under the map that says where the location landed, then removes
    itself. `leaving` drives the exit animation: the node has to stay mounted
    long enough for it to play, so it is dropped on a second timer.
  */
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [noticeLeaving, setNoticeLeaving] = useState(false);
  const noticeTimers = useRef<number[]>([]);

  const showLocationNotice = (name: string) => {
    noticeTimers.current.forEach(clearTimeout);
    setNoticeLeaving(false);
    setLocationNotice(name);
    noticeTimers.current = [
      window.setTimeout(() => setNoticeLeaving(true), 3200),
      window.setTimeout(() => setLocationNotice(null), 3500),
    ];
  };

  useEffect(() => {
    const timers = noticeTimers;
    return () => timers.current.forEach(clearTimeout);
  }, []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();
  const confirm = useConfirm();

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

  // Search filter logic
  useEffect(() => {
    setSearchError(null);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const matched = DUBAI_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(q) || loc.category.toLowerCase().includes(q)
    );

    setSearchResults(matched);
    setIsSearchOpen(true);
  }, [searchQuery]);

  // Select location helper
  const selectLocation = (loc: { name: string; latitude: number; longitude: number }) => {
    setUserLocation({
      name: loc.name,
      latitude: Math.round(loc.latitude * 100000) / 100000,
      longitude: Math.round(loc.longitude * 100000) / 100000,
      isCustom: true,
    });
    setSearchQuery('');
    setIsSearchOpen(false);
    if (miniMarkerRef.current && miniMapInstanceRef.current) {
      miniMarkerRef.current.setLatLng([loc.latitude, loc.longitude]);
      miniMapInstanceRef.current.setView([loc.latitude, loc.longitude], 13, { animate: true });
    }
    showLocationNotice(loc.name);
  };

  // Search submit handler (with OpenStreetMap Nominatim fallback)

  // Initialize and maintain embedded Leaflet mini-map for Home Address selection
  useEffect(() => {
    if (!isSettingsModalOpen || !miniMapContainerRef.current) return;

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove();
      miniMapInstanceRef.current = null;
    }

    /*
      Building the map is the slowest thing this dialog does, and it used to
      happen before the dialog had painted, so opening Settings visibly stalled.
      Deferring it by a frame lets the dialog appear first and the map fill in
      behind it. `cancelled` covers closing again inside that frame.
    */
    let cancelled = false;
    let frame = 0;
    const timers: number[] = [];
    const build = () => {
    if (cancelled || !miniMapContainerRef.current) return;

    const map = L.map(miniMapContainerRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix('');

    const tiles = TILE_CONFIGS[previewStyleForTheme(theme)];
    L.tileLayer(tiles.url, {
      maxZoom: tiles.maxZoom,
      attribution: tiles.attribution,
    }).addTo(map);

    const userHtml = homeMarkerHtml();

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'custom-home-pin',
      iconSize: [HOME_MARKER_SIZE, HOME_MARKER_SIZE],
      iconAnchor: [HOME_MARKER_SIZE / 2, HOME_MARKER_SIZE / 2],
    });

    const marker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      draggable: true,
      alt: 'Your home location, drag to move',
      title: 'Drag to move your home location',
    }).addTo(map);

    const updateLocationFromCoords = (lat: number, lng: number) => {
      const roundedLat = Math.round(lat * 100000) / 100000;
      const roundedLng = Math.round(lng * 100000) / 100000;

      // Check if near any landmark
      const near = DUBAI_LOCATIONS.find(loc => {
        const dLat = Math.abs(loc.latitude - roundedLat);
        const dLng = Math.abs(loc.longitude - roundedLng);
        return dLat < 0.003 && dLng < 0.003;
      });

      const chosenName = near ? near.name : `Selected Location (${roundedLat.toFixed(3)}°, ${roundedLng.toFixed(3)}°)`;

      setUserLocation({
        name: chosenName,
        latitude: roundedLat,
        longitude: roundedLng,
        isCustom: true,
      });
    };

    marker.on('dragend', (e) => {
      const latlng = (e.target as L.Marker).getLatLng();
      updateLocationFromCoords(latlng.lat, latlng.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateLocationFromCoords(e.latlng.lat, e.latlng.lng);
    });

    miniMarkerRef.current = marker;
    miniMapInstanceRef.current = map;

      timers.push(
        window.setTimeout(() => map.invalidateSize(), 150),
        window.setTimeout(() => map.invalidateSize(), 450)
      );
    };

    frame = requestAnimationFrame(build);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [isSettingsModalOpen, theme]);

  // Sync marker position when userLocation changes externally
  useEffect(() => {
    if (miniMarkerRef.current && miniMapInstanceRef.current) {
      miniMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      miniMapInstanceRef.current.panTo([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation.latitude, userLocation.longitude]);

  if (!isSettingsModalOpen) return null;


  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast('Your browser does not support location access.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;

        const near = DUBAI_LOCATIONS.find(loc => {
          const dLat = Math.abs(loc.latitude - lat);
          const dLng = Math.abs(loc.longitude - lng);
          return dLat < 0.003 && dLng < 0.003;
        });

        const chosenName = near ? near.name : `Current Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`;

        setUserLocation({
          name: chosenName,
          latitude: lat,
          longitude: lng,
          isCustom: true,
        });

        if (miniMarkerRef.current && miniMapInstanceRef.current) {
          miniMarkerRef.current.setLatLng([lat, lng]);
          miniMapInstanceRef.current.setView([lat, lng], 13, { animate: true });
        }
        showLocationNotice(chosenName);
      },
      err => {
        toast(`Could not get your location: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      userLocation,
        savedCompanyIds,
      savedLists
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uae-companies-saved-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ResponsiveSheet
      open={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      labelledBy="settings-title"
    >
      <>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <h2 id="settings-title" className="text-sm sm:text-base font-bold text-ink">
            Settings
          </h2>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-surface-2 transition"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* 1. Dark Mode - One line custom switch with sparkly moon (no bright colors) */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-ink">
              Dark Mode
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-1 focus:ring-brand-500 ${ theme === 'dark' ? 'bg-slate-700 dark:bg-slate-800' : 'bg-slate-200' }`}
            >
              <span className="sr-only">Toggle Dark Mode</span>
              <span
                className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-app shadow-xs ring-0 transition duration-200 ease-in-out ${ theme === 'dark' ? 'translate-x-5' : 'translate-x-0' }`}
              >
                {theme === 'dark' ? (
                  <MoonStar className="h-3.5 w-3.5 text-slate-200" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-slate-600" />
                )}
              </span>
            </button>
          </div>

          <div className="border-t border-line" />



          {/* 2. Home Address, search inline, status floats on the map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="home-search" className="font-semibold text-ink">
                Home Address
              </label>
              {/* A state light, not a control: grey until a place is chosen. */}
              <MapPinHouse
                className={`w-4 h-4 ${
                  isLocationSet ? 'text-brand-600 dark:text-brand-400' : 'text-line-strong'
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Search with instant suggestions; picking one applies it immediately */}
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="home-search"
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search a place or address"
                className="w-full text-xs pl-8 pr-9 py-2 bg-surface-2 border border-line rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-ink-3"
              />

              {/* Asking the browser is quicker than typing an address. */}
              <button
                type="button"
                onClick={handleUseGps}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink-3 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                title="Use my current location"
                aria-label="Use my current location"
              >
                <LocateFixed className="w-4 h-4" aria-hidden="true" />
              </button>

              {isSearchOpen && searchResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-lg shadow-popup z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => selectLocation(item)}
                        className="w-full px-3 py-2 text-left hover:bg-surface-2 flex items-center justify-between gap-2 transition-colors"
                      >
                        <span className="text-xs font-medium text-ink truncate">{item.name}</span>
                        <span className="text-[11px] text-ink-3 shrink-0">{item.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {searchError && (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 leading-relaxed" role="alert">
                  {searchError}
                </p>
              )}
            </div>

            {/* Mini-map carries the current location and reset, matching the main map */}
            <div className="relative rounded-lg overflow-hidden border border-line shadow-inner">
              <div
                ref={miniMapContainerRef}
                className="w-full h-44 z-0"
                style={{ background: 'var(--bg-muted)' }}
              />

              <div className="absolute bottom-2 left-2 right-2 z-400 flex items-center gap-2 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-line shadow-2xs">
                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    {isLocationSet ? (
                      <span className="text-[11px] font-semibold text-ink truncate block">
                        {userLocation.name}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        Not set
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-3">
                    {isLocationSet
                      ? 'Drag the pin to fine-tune'
                      : `Assumed ${DEFAULT_ORIGIN.name}`}
                  </div>
                </div>
                {userLocation.isCustom && (
                  <button
                    type="button"
                    onClick={resetUserLocation}
                    className="p-1 rounded text-ink-3 hover:text-ink transition-colors shrink-0"
                    title="Reset to Academic City"
                    aria-label="Reset location to Academic City"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {locationNotice && (
              <div
                role="status"
                className={`flex items-center gap-2 overflow-hidden text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ${
                  noticeLeaving ? 'animate-status-out' : 'animate-status-in'
                }`}
              >
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">Location set to {locationNotice}</span>
              </div>
            )}
          </div>

          {/* Redesigned Divider */}
          <div className="border-t border-slate-200/80 dark:border-slate-800" />

          {/* 4. Data Management */}
          <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
            <SocialLinks className="-ml-2" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportData}
                title="Downloads your saved companies, lists and settings"
                className="px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-surface-2 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-line"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: 'Reset everything?',
                      description:
                        'This clears your saved companies, lists, interests and home address on this device. It cannot be undone.',
                      confirmLabel: 'Reset everything',
                      tone: 'danger',
                    });
                    if (!ok) return;
                    ['uae_saved_companies', 'uae_saved_lists', 'uae_user_interests', 'uae_user_location'].forEach(
                      key => {
                        try {
                          localStorage.removeItem(key);
                        } catch {
                          // ignore
                        }
                      }
                    );
                    window.location.reload();
                  })();
                }}
                className="px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-surface-2 text-ink-2 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-line"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

        </div>

      </>

    </ResponsiveSheet>
  );
};
