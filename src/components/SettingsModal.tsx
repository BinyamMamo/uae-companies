import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ACCENT_THEMES } from '../utils/accentThemes';
import {
  X,
  Sun,
  Moon,
  Plus,
  RotateCcw,
  Check,
  Download,
  Trash2,
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
    accentColor,
    setAccentColor,
    userLocation,
    resetUserLocation,
    savedCompanyIds,
    savedLists
  } = useApp();

  const [customInterestInput, setCustomInterestInput] = useState('');
  const [nameInput, setNameInput] = useState(username);
  const [nameSaved, setNameSaved] = useState(false);

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
        className="bg-white dark:bg-[#18181b] rounded-xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-popup border border-slate-200 dark:border-[#27272a] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
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

        {/* Body - Single clean unified view without sidebar tabs */}
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Header logo: <span className="font-semibold text-slate-800 dark:text-slate-200">Hey {nameInput.trim() ? nameInput.trim() : 'there'} 👋</span>
            </p>
          </div>

          {/* 2. Appearance: Theme + Accent Color */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
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

            {/* Accent Color Swatches */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {ACCENT_THEMES.map(preset => {
                  const isActive = accentColor === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAccentColor(preset.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ${
                        isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] ring-brand-500' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.colorHex }}
                      title={preset.name}
                      aria-label={`Select ${preset.name} accent`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Interests (Single unified list, add button inside input) */}
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

          {/* 4. Commute Location Reference */}
          <div className="border-t border-slate-100 dark:border-[#27272a] pt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Commute Location
              </label>
              {userLocation.isCustom && (
                <button
                  type="button"
                  onClick={resetUserLocation}
                  className="text-brand-600 dark:text-brand-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to DIAC</span>
                </button>
              )}
            </div>
            
            <div className="p-3 rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#222226] flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5 min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {userLocation.name}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                  {userLocation.isCustom ? ' (Custom Location)' : ' (Reference)'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  Tip: Open the <strong className="text-slate-700 dark:text-slate-300">Map tab</strong> to set your custom location anywhere in the UAE.
                </p>
              </div>
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
