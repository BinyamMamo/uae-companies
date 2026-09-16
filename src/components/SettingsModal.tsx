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
  Check,
  Download,
  Trash2,
  Navigation,
  MapPinHouse
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

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    userInterests,
    addInterest,
    removeInterest,
    resetInterests,
    setUserInterests,
    username,
    setUsername,
    theme,
    toggleTheme,
    userLocation,
    setUserLocation,
    resetUserLocation,
    savedCompanyIds,
    savedLists
  } = useApp();

  const [customInterestInput, setCustomInterestInput] = useState('');
  const [nameInput, setNameInput] = useState(username);
  const [nameSaved, setNameSaved] = useState(false);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

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

    const updateLocation = (lat: number, lng: number) => {
      const roundedLat = Math.round(lat * 100000) / 100000;
      const roundedLng = Math.round(lng * 100000) / 100000;
      setUserLocation({
        name: `Home (${roundedLat.toFixed(3)}°, ${roundedLng.toFixed(3)}°)`,
        latitude: roundedLat,
        longitude: roundedLng,
        isCustom: true,
      });
    };

    marker.on('dragend', (e) => {
      const latlng = (e.target as L.Marker).getLatLng();
      updateLocation(latlng.lat, latlng.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateLocation(e.latlng.lat, e.latlng.lng);
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

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setUsername(nameInput.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
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
        setUserLocation({
          name: `Current Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
          latitude: lat,
          longitude: lng,
          isCustom: true,
        });
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
      userGreeting: username || 'there',
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
        {/* Header - Clean, minimal */}
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

        {/* Body - Single clean unified view */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* 1. Display Name */}
          <div className="space-y-2">
            <label htmlFor="settings-name-input" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Display Name
            </label>
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                id="settings-name-input"
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Binyam (leave empty for 'there')"
                className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-[#27272a] rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0 shadow-2xs"
              >
                {nameSaved && <Check className="w-3.5 h-3.5" />}
                <span>{nameSaved ? 'Saved' : 'Save'}</span>
              </button>
            </form>
          </div>

          {/* 2. Appearance: Theme */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                  theme === 'light'
                    ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-600'
                    : 'border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#222226] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Light</span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-brand-600 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-[#222226] ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#222226] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-white shrink-0" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Dark</span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-brand-400 ml-auto" />}
              </button>
            </div>
          </div>

          {/* 3. Home Address with Interactive Mini-Map */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPinHouse className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Home Address</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="text-brand-600 dark:text-brand-400 hover:underline text-[11px] flex items-center gap-1"
                  title="Use device GPS"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Use GPS</span>
                </button>
                {userLocation.isCustom && (
                  <button
                    type="button"
                    onClick={resetUserLocation}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-[11px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Location Pill / Information */}
            <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#222226] flex items-center justify-between text-xs">
              <div className="truncate min-w-0 pr-2">
                <span className="font-medium text-slate-900 dark:text-white block truncate">
                  {userLocation.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-500/30 shrink-0">
                {userLocation.isCustom ? 'Custom' : 'Default'}
              </span>
            </div>

            {/* Embedded Interactive Mini-Map */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#27272a] shadow-inner">
              <div
                ref={miniMapContainerRef}
                className="w-full h-44 z-0"
                style={{ background: '#f8fafc' }}
              />
              <div className="absolute bottom-2 left-2 z-400 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-xs pointer-events-none">
                Click map or drag pin to set home address
              </div>
            </div>
          </div>

          {/* 4. Interests (Single unified list, add button inside input) */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Career Interests ({userInterests.length} active)
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetInterests}
                  className="text-brand-600 dark:text-brand-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserInterests([])}
                  className="text-slate-400 hover:text-red-600 text-[11px]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Add Custom Form with button inside input */}
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

          {/* 5. Data Management */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
                className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-red-200 dark:border-red-900/40"
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
