/**
 * localStorage helpers that never throw and never hand back a shape the
 * caller didn't ask for.
 *
 * Previously every read was a bare `JSON.parse` with no validation, so a
 * stale or hand-edited value (e.g. `uae_user_location`) crashed the provider
 * during render, before any error boundary could catch it.
 */

export function readJSON<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled, non-fatal.
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(item => typeof item === 'string');

export const isRecordArray = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.every(item => typeof item === 'object' && item !== null);
