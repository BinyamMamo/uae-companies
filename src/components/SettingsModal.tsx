import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { TILE_CONFIGS, previewStyleForTheme } from '../utils/mapTiles';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  Sun,
  MoonStar,
  Plus,
  RotateCcw,
  Download,
  Trash2,
  Navigation,
  MapPinHouse,
  Search,
  MapPin
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ACCENT_THEMES } from '../utils/accentThemes';
import { geocode, GeocodeError } from '../utils/geocode';

const SUGGESTED_DOMAINS = [
  'AI / Machine Learning',
  'Computer Vision',
  'Data Engineering',
  'Embedded Systems',
  'Firmware Engineering',
  'Robotics',
  'IoT',
  'VLSI & Semiconductors',
  'Software Engineering',
  'Web Development',
  'Mobile Development',
  'Cloud Infrastructure',
  'Cybersecurity',
  'Telecom & Networks',
  'FinTech',
  'Autonomous Systems',
  'Aerospace & Avionics'
];

interface DubaiLocationPreset {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

const DUBAI_LOCATIONS: DubaiLocationPreset[] = [
  { name: 'KSK Students Residence', category: 'Student Housing', latitude: 25.1292, longitude: 55.4268 },
  { name: 'University of Dubai', category: 'Campus', latitude: 25.1304, longitude: 55.4273 },
  { name: 'The Myriad Dubai', category: 'Student Housing', latitude: 25.1235, longitude: 55.4180 },
  { name: 'Uninest Student Residences', category: 'Student Housing', latitude: 25.1180, longitude: 55.3990 },
  { name: 'Academic City (DIAC Central)', category: 'Academic Hub', latitude: 25.1265, longitude: 55.4215 },
  { name: 'Zayed University Dubai', category: 'Campus', latitude: 25.1130, longitude: 55.3900 },
  { name: 'Amity University Dubai', category: 'Campus', latitude: 25.1245, longitude: 55.4220 },
  { name: 'Heriot-Watt University Dubai', category: 'Campus', latitude: 25.1110, longitude: 55.3880 },
  { name: 'BITS Pilani Dubai', category: 'Campus', latitude: 25.1280, longitude: 55.4200 },
  { name: 'University of Birmingham Dubai', category: 'Campus', latitude: 25.1250, longitude: 55.4170 },
  { name: 'Dubai Silicon Oasis (HQ)', category: 'District', latitude: 25.1238, longitude: 55.3821 },
  { name: 'DSO Cedre Community', category: 'Residential', latitude: 25.1320, longitude: 55.3875 },
  { name: 'DSO Silicon Gates', category: 'Residential', latitude: 25.1285, longitude: 55.3780 },
  { name: 'Business Bay', category: 'Business Hub', latitude: 25.1850, longitude: 55.2750 },
  { name: 'Downtown Dubai (Burj Khalifa)', category: 'District', latitude: 25.1972, longitude: 55.2744 },
  { name: 'DIFC (Financial Centre)', category: 'Financial Hub', latitude: 25.2135, longitude: 55.2810 },
  { name: 'Dubai Internet City', category: 'Tech Hub', latitude: 25.0975, longitude: 55.1624 },
  { name: 'Dubai Media City', category: 'Media Hub', latitude: 25.0950, longitude: 55.1550 },
  { name: 'Dubai Marina', category: 'District', latitude: 25.0805, longitude: 55.1403 },
  { name: 'Jumeirah Lake Towers (JLT)', category: 'District', latitude: 25.0740, longitude: 55.1420 },
  { name: 'DAFZA (Airport Freezone)', category: 'Free Zone', latitude: 25.2605, longitude: 55.3725 },
  { name: 'Mirdif City Centre', category: 'Shopping / Residential', latitude: 25.2185, longitude: 55.4180 },
  { name: 'Al Barsha 1', category: 'Residential', latitude: 25.1120, longitude: 55.2000 },
  { name: 'Deira (City Centre)', category: 'District', latitude: 25.2530, longitude: 55.3330 },
  { name: 'Bur Dubai', category: 'District', latitude: 25.2570, longitude: 55.3000 },
  { name: 'Sharjah University City', category: 'Academic Hub', latitude: 25.2950, longitude: 55.4650 },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    userInterests,
    addInterest,
    removeInterest,
    resetInterests,
    setUserInterests,
    userLocation,
    setUserLocation,
    resetUserLocation,
    savedCompanyIds,
    savedLists
  } = useApp();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();

  const [customInterestInput, setCustomInterestInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DubaiLocationPreset[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const { toast } = useToast();

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
  };

  // Search submit handler (with OpenStreetMap Nominatim fallback)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (searchResults.length > 0) {
      selectLocation(searchResults[0]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await geocode(q);
      if (results.length > 0) {
        selectLocation(results[0]);
      } else {
        setSearchError(
          `No results for "${q}". Try a nearby landmark, or drop a pin on the map.`
        );
      }
    } catch (err) {
      const message =
        err instanceof GeocodeError
          ? err.message
          : 'Address lookup is unavailable right now. You can still drop a pin on the map.';
      setSearchError(message);
      toast(message, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Initialize and maintain embedded Leaflet mini-map for Home Address selection
  useEffect(() => {
    if (!isSettingsModalOpen || !miniMapContainerRef.current) return;

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove();
      miniMapInstanceRef.current = null;
    }

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

    const userHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid #2563eb; opacity: 0.75; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 30px; height: 30px; border-radius: 9999px; background: #2563eb; color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'custom-home-pin',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      draggable: true,
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

    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
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

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterestInput.trim()) return;
    addInterest(customInterestInput.trim());
    setCustomInterestInput('');
  };

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
      userInterests,
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
    <Modal
      open={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      labelledBy="settings-title"
      className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-4"
      backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface rounded-xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-popup border border-line overflow-hidden text-ink transition-colors">
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

          {/* 2. Accent colour — 15 palettes lived in accentThemes.ts with no UI
              to reach them; the accent could only be changed by hand-editing
              localStorage. */}
          <div className="py-1">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-ink">Accent Colour</span>
              <span className="text-[11px] text-ink-3">
                {ACCENT_THEMES.find(t => t.id === accentColor)?.name ?? 'Blue'}
              </span>
            </div>
            <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2">
              {ACCENT_THEMES.map(t => {
                const selected = t.id === accentColor;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t.name}
                    title={t.name}
                    onClick={() => setAccentColor(t.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      selected
                        ? 'border-ink scale-110'
                        : 'border-transparent ring-1 ring-line'
                    }`}
                    style={{ backgroundColor: t.colorHex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t border-line" />

          {/* 2. Home Address with Search & Interactive Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-ink flex items-center gap-1.5">
                <MapPinHouse className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Home Address</span>
              </label>
              <button
                type="button"
                onClick={handleUseGps}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition flex items-center gap-1.5 shadow-2xs"
                title="Detect device GPS location"
              >
                <Navigation className="w-3 h-3" />
                <span>Use GPS</span>
              </button>
            </div>

            {/* Location Search Bar with Instant Autocomplete Dropdown */}
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search address (e.g. KSK Students Residence, DSO Cedre, Downtown)..."
                  className="w-full text-xs pl-8 pr-16 py-2 bg-surface-2 border border-line rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-1.5 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-[11px] font-semibold rounded-md transition shrink-0"
                >
                  {isSearching ? 'Finding...' : 'Find'}
                </button>
              </form>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-2 border border-slate-200 dark:border-line rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectLocation(item)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-2 flex items-center justify-between border-b border-slate-100 dark:border-line last:border-0 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="text-xs font-semibold text-ink truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-3 shrink-0 ml-2 font-medium">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchError && (
                <p
                  className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 leading-relaxed"
                  role="alert"
                >
                  {searchError}
                </p>
              )}
            </div>

            {/* Current Selected Address with Reset button on the same level */}
            <div className="flex items-center justify-between gap-2 py-0.5 text-xs">
              <div className="flex items-center gap-2 truncate min-w-0">
                <MapPinHouse className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="truncate min-w-0">
                  <span className="font-semibold text-ink block truncate">
                    {userLocation.name}
                  </span>
                  <span className="text-[11px] text-ink-2 block">
                    {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetUserLocation}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-surface-2 text-ink-2 hover:text-ink border border-line hover:bg-slate-200 dark:hover:bg-surface-2 transition flex items-center gap-1 shrink-0"
                title="Reset to default (University of Dubai)"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>

            {/* Embedded Interactive Mini-Map */}
            <div className="relative rounded-lg overflow-hidden border border-line shadow-inner">
              <div
                ref={miniMapContainerRef}
                className="w-full h-44 z-0"
                style={{ background: 'var(--bg-muted)' }}
              />
              <div className="absolute bottom-2 left-2 z-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-1 rounded-sm text-[10px] text-ink-2 border border-slate-200/80 dark:border-white/10 shadow-2xs pointer-events-none">
                Click map or drag pin to fine-tune
              </div>
            </div>
          </div>

          {/* Redesigned Divider */}
          <div className="border-t border-slate-200/80 dark:border-slate-800" />

          {/* 3. Interests (Single unified list) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-ink">
                Career Interests ({userInterests.length} active)
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetInterests}
                  className="text-ink-2 hover:text-brand-600 dark:hover:text-brand-400 text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserInterests([])}
                  className="text-slate-400 hover:text-red-600 text-[11px] transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Add Custom Form */}
            <form onSubmit={handleAddCustomInterest} className="relative flex items-center">
              <input
                type="text"
                value={customInterestInput}
                onChange={e => setCustomInterestInput(e.target.value)}
                placeholder="Add an interest (e.g. Computer Vision, ROS)..."
                className="w-full text-xs pl-3.5 pr-20 py-2 bg-surface-2 border border-line rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!customInterestInput.trim()}
                className="absolute right-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Unified Tag List */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {Array.from(new Set([...userInterests, ...SUGGESTED_DOMAINS])).map(item => {
                const isSelected = userInterests.some(
                  i => i.toLowerCase() === item.toLowerCase()
                );

                if (isSelected) {
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeInterest(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium bg-brand-50/90 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-500/30 hover:bg-brand-100/80 dark:hover:bg-brand-500/25 transition cursor-pointer"
                      title="Click to remove"
                    >
                      <span>{item}</span>
                      <X className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                    </button>
                  );
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addInterest(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium bg-surface-2 text-ink-2 border border-line hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                    title="Click to add"
                  >
                    <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Redesigned Divider */}
          <div className="border-t border-slate-200/80 dark:border-slate-800" />

          {/* 4. Data Management */}
          <div className="pt-1 flex items-center justify-between">
            <div className="text-[11px] text-ink-2 font-medium">
              {savedCompanyIds.length} saved · {savedLists.length} lists
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-surface-2 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-line"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(true);
                }}
                className="px-3 py-1.5 bg-surface-2 hover:bg-slate-200 dark:hover:bg-surface-2 text-ink-2 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-line"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      <ConfirmDialog
        open={isResetConfirmOpen}
        destructive
        title="Reset everything?"
        description="This clears your saved companies, lists, interests and home address on this device. It cannot be undone."
        confirmLabel="Reset everything"
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
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
        }}
      />
    </Modal>
  );
};
