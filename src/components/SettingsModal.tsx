import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import {
  X,
  Sun,
  Moon,
  Plus,
  RotateCcw,
  Download,
  Trash2,
  Navigation,
  MapPinHouse,
  Search,
  MapPin
} from 'lucide-react';

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
    theme,
    toggleTheme,
    userLocation,
    setUserLocation,
    resetUserLocation,
    savedCompanyIds,
    savedLists
  } = useApp();

  const [customInterestInput, setCustomInterestInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DubaiLocationPreset[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

  // Search filter logic
  useEffect(() => {
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
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ' Dubai')}&countrycodes=ae&limit=4`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const displayName = first.name || first.display_name.split(',')[0];
        selectLocation({
          name: displayName,
          latitude: parseFloat(first.lat),
          longitude: parseFloat(first.lon),
        });
      } else {
        alert(`No results found for "${q}". Try selecting on the map or typing a nearby landmark.`);
      }
    } catch (err) {
      console.error('Location search failed:', err);
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
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const userHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid #2563eb; opacity: 0.75; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 30px; height: 30px; border-radius: 9999px; background: #2563eb; color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 220-4 0v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M18 10a6 6 0 0 0-12 0c0 7 6 13 6 13s6-6 6-13Z"/><circle cx="12" cy="10" r="1.5"/></svg>
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
  }, [isSettingsModalOpen]);

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
      alert('Geolocation is not supported by your browser');
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
        alert('Could not retrieve your location: ' + err.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-[#18181b] rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-popup border border-slate-200 dark:border-[#27272a] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#18181b]">
          <h2 id="settings-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222226] transition"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* 1. Appearance: Theme - Single Line with Icons */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Theme
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center bg-slate-100 dark:bg-[#222226] p-1 rounded-lg border border-slate-200/60 dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  theme === 'light'
                    ? 'bg-white dark:bg-[#18181b] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-[#18181b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Redesigned Divider */}
          <div className="border-t border-slate-200/80 dark:border-[#27272a]" />

          {/* 2. Home Address with Search & Interactive Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPinHouse className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Home Address</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition flex items-center gap-1.5 shadow-2xs"
                  title="Detect device GPS location"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Use GPS</span>
                </button>
                {userLocation.isCustom && (
                  <button
                    type="button"
                    onClick={resetUserLocation}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-[#222226] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#27272a] transition flex items-center gap-1"
                    title="Reset to default"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
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
                  className="w-full text-xs pl-8 pr-16 py-2 bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-[#27272a] rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-[#2e2e33] rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectLocation(item)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#27272b] flex items-center justify-between border-b border-slate-100 dark:border-[#27272b] last:border-0 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2 font-medium">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Selected Address Clean Text (No custom pill card!) */}
            <div className="flex items-center gap-2 py-0.5 text-xs">
              <MapPinHouse className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <div className="truncate min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {userLocation.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                </span>
              </div>
            </div>

            {/* Embedded Interactive Mini-Map */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#27272a] shadow-inner">
              <div
                ref={miniMapContainerRef}
                className="w-full h-44 z-0"
                style={{ background: '#f8fafc' }}
              />
              <div className="absolute bottom-2 left-2 z-400 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-xs pointer-events-none">
                Click map or drag pin to fine-tune
              </div>
            </div>
          </div>

          {/* Redesigned Divider */}
          <div className="border-t border-slate-200/80 dark:border-[#27272a]" />

          {/* 3. Interests (Single unified list) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Career Interests ({userInterests.length} active)
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetInterests}
                  className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-[11px] font-medium flex items-center gap-1 transition"
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
                className="w-full text-xs pl-3.5 pr-20 py-2 bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-[#27272a] rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium bg-slate-50 dark:bg-[#222226] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#27272a] hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
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
          <div className="border-t border-slate-200/80 dark:border-[#27272a]" />

          {/* 4. Data Management */}
          <div className="pt-1 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {savedCompanyIds.length} saved · {savedLists.length} lists
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#222226] hover:bg-slate-200 dark:hover:bg-[#27272e] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-200 dark:border-[#27272a]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all saved companies and preferences?')) {
                    localStorage.removeItem('uae_saved_companies');
                    localStorage.removeItem('uae_saved_lists');
                    localStorage.removeItem('uae_user_interests');
                    localStorage.removeItem('uae_user_location');
                    window.location.reload();
                  }
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#222226] hover:bg-slate-200 dark:hover:bg-[#2a2a30] text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-200 dark:border-[#27272a]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
