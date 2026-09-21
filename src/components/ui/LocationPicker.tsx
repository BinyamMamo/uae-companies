import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LocateFixed, RotateCcw, Loader2, MapPin } from 'lucide-react';
import { DUBAI_LOCATIONS } from '../../utils/dubaiLocations';
import { geocode, GeocodeError } from '../../utils/geocode';
import { useApp } from '../../context/AppContext';
import { useToast } from './Toast';
import { track } from '../../lib/analytics';

interface LocationPickerProps {
  /** Which way the panel opens. The map places this at the bottom. */
  direction?: 'down' | 'up';
  onClose: () => void;
  className?: string;
  /**
   * Drop the popover chrome (fixed width, border, shadow, own dialog role) for
   * when this is already inside a dialog — the mobile bottom sheet supplies all
   * of that, and nesting them looks like a card inside a card.
   */
  bare?: boolean;
}

/**
 * Search-and-set for the user's home location.
 *
 * Replaces a "Set location" toggle that put the map into a click-to-place mode
 * — a mode you had to discover, and which couldn't answer "where is X?". This
 * offers the known Dubai landmarks first, falls back to a geocoder, and keeps
 * "use my current location" as one row rather than a separate button.
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  direction = 'down',
  onClose,
  className = '',
  bare = false,
}) => {
  const { userLocation, setUserLocation, resetUserLocation } = useApp();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<{ name: string; latitude: number; longitude: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const presets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUBAI_LOCATIONS.slice(0, 6);
    return DUBAI_LOCATIONS.filter(
      l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  // Only reach for the geocoder when we have nothing local to offer.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || presets.length > 0) {
      setRemote([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        setRemote(await geocode(q, controller.signal));
      } catch (err) {
        if (err instanceof GeocodeError) setRemote([]);
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, presets.length]);

  const apply = (name: string, latitude: number, longitude: number, method: 'search' | 'gps') => {
    setUserLocation({
      name,
      latitude: Math.round(latitude * 100000) / 100000,
      longitude: Math.round(longitude * 100000) / 100000,
      isCustom: true,
    });
    track('home_location_changed', { method });
    onClose();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Your browser does not support location access.', 'error');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setBusy(false);
        apply('My current location', pos.coords.latitude, pos.coords.longitude, 'gps');
      },
      err => {
        setBusy(false);
        toast(`Could not get your location: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const rowClass =
    'w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-surface-2 transition-colors';

  return (
    <div
      className={`${
        bare
          ? 'w-full bg-surface'
          : 'w-72 bg-surface border border-line rounded-xl shadow-popup overflow-hidden'
      } ${direction === 'up' ? 'origin-bottom' : 'origin-top'} ${className}`}
      role={bare ? undefined : 'dialog'}
      aria-label={bare ? undefined : 'Set your home location'}
    >
      <div className="relative border-b border-line">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none"
          aria-hidden="true"
        />
        <label htmlFor="location-search" className="sr-only">
          Search for a place
        </label>
        <input
          id="location-search"
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Search a place or address"
          className="w-full pl-9 pr-8 py-2.5 bg-transparent text-xs text-ink placeholder:text-ink-3 focus:outline-hidden"
        />
        {busy && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="max-h-60 overflow-y-auto py-1">
        {presets.map(l => (
          <button
            key={l.name}
            type="button"
            className={rowClass}
            onClick={() => apply(l.name, l.latitude, l.longitude, 'search')}
          >
            <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
            <span className="text-ink truncate flex-1">{l.name}</span>
            <span className="text-[11px] text-ink-3 shrink-0">{l.category}</span>
          </button>
        ))}

        {remote.map(l => (
          <button
            key={`${l.latitude},${l.longitude}`}
            type="button"
            className={rowClass}
            onClick={() => apply(l.name, l.latitude, l.longitude, 'search')}
          >
            <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
            <span className="text-ink truncate">{l.name}</span>
          </button>
        ))}

        {query.trim().length >= 3 && presets.length === 0 && remote.length === 0 && !busy && (
          <p className="px-3 py-3 text-[11px] text-ink-3 leading-relaxed">
            Nothing found for &ldquo;{query.trim()}&rdquo;. Try a nearby landmark, or drag the pin
            on the map.
          </p>
        )}
      </div>

      <div className="border-t border-line">
        <button type="button" className={rowClass} onClick={useCurrentLocation}>
          <LocateFixed className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" aria-hidden="true" />
          <span className="text-ink">Use my current location</span>
        </button>
        {userLocation.isCustom && (
          <button
            type="button"
            className={rowClass}
            onClick={() => {
              resetUserLocation();
              track('home_location_changed', { method: 'reset' });
              onClose();
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
            <span className="text-ink-2">Reset to Academic City</span>
          </button>
        )}
      </div>
    </div>
  );
};
