/**
 * Address lookup via OpenStreetMap Nominatim.
 *
 * The previous inline call had no timeout, no abort, no `res.ok` check and no
 * response validation, and its only failure handling was a console.error, so
 * a failed lookup silently did nothing. Nominatim's usage policy also asks for
 * an identifying referrer and at most one request per second; browsers forbid
 * setting User-Agent, so we identify via the Referer the browser sends and
 * throttle client-side here.
 */

export interface GeocodeResult {
  name: string;
  fullName: string;
  latitude: number;
  longitude: number;
}

export class GeocodeError extends Error {}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 8000;

let lastRequestAt = 0;

interface NominatimRow {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
}

const isRow = (v: unknown): v is NominatimRow =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as NominatimRow).lat === 'string' &&
  typeof (v as NominatimRow).lon === 'string';

const round5 = (n: number) => Math.round(n * 100000) / 100000;

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];

  // Respect Nominatim's 1 req/sec limit.
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now());
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const url = `${ENDPOINT}?format=json&q=${encodeURIComponent(`${q} Dubai`)}&countrycodes=ae&limit=4`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new GeocodeError(
        res.status === 429
          ? 'Too many address lookups just now. Wait a moment and try again.'
          : `Address lookup failed (${res.status}).`
      );
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];

    return data.filter(isRow).flatMap(row => {
      const latitude = Number.parseFloat(row.lat);
      const longitude = Number.parseFloat(row.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      const fullName = row.display_name ?? row.name ?? q;
      return [
        {
          name: row.name || fullName.split(',')[0],
          fullName,
          latitude: round5(latitude),
          longitude: round5(longitude),
        },
      ];
    });
  } catch (err) {
    if (err instanceof GeocodeError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Caller-initiated or timed out; treat a timeout as a soft failure.
      if (signal?.aborted) return [];
      throw new GeocodeError('Address lookup timed out. Check your connection and try again.');
    }
    throw new GeocodeError('Address lookup is unavailable right now.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
