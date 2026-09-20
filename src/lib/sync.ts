import { loadFirebase } from './firebase';
import type { SavedList } from '../types/company';

/**
 * Cross-device sync of a user's own data.
 *
 * localStorage stays the source of truth so the app is fully usable signed
 * out and offline; Firestore is a mirror. On first sign-in the two are merged
 * rather than one overwriting the other, so signing in never loses the lists
 * someone built up beforehand.
 */

export interface SyncedProfile {
  savedCompanyIds: string[];
  savedLists: SavedList[];
  userInterests: string[];
  userLocation: {
    name: string;
    latitude: number;
    longitude: number;
    isCustom?: boolean;
  } | null;
  accentColor: string | null;
  theme: 'light' | 'dark' | null;
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === 'string');

export async function fetchProfile(uid: string): Promise<Partial<SyncedProfile> | null> {
  const fb = await loadFirebase();
  if (!fb) return null;
  try {
    const snap = await fb.getDoc(fb.doc(fb.db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as Partial<SyncedProfile>;
  } catch {
    // Offline or rules denied — fall back to local data.
    return null;
  }
}

export async function saveProfile(uid: string, profile: SyncedProfile): Promise<void> {
  const fb = await loadFirebase();
  if (!fb) return;
  try {
    await fb.setDoc(
      fb.doc(fb.db, 'users', uid),
      { ...profile, updatedAt: fb.serverTimestamp() },
      { merge: true }
    );
  } catch {
    // Non-fatal: the local copy is still correct.
  }
}

/** Union merge — signing in adds to what you had, it never deletes it. */
export function mergeProfiles(
  local: SyncedProfile,
  remote: Partial<SyncedProfile> | null
): SyncedProfile {
  if (!remote) return local;

  const savedCompanyIds = Array.from(
    new Set([...local.savedCompanyIds, ...(isStringArray(remote.savedCompanyIds) ? remote.savedCompanyIds : [])])
  );

  const userInterests = local.userInterests.length
    ? local.userInterests
    : (isStringArray(remote.userInterests) ? remote.userInterests : []);

  // Lists merge by id; company ids within a shared id are unioned.
  const byId = new Map<string, SavedList>();
  for (const list of [...(Array.isArray(remote.savedLists) ? remote.savedLists : []), ...local.savedLists]) {
    if (!list || typeof list.id !== 'string') continue;
    const existing = byId.get(list.id);
    byId.set(
      list.id,
      existing
        ? { ...existing, ...list, companyIds: Array.from(new Set([...existing.companyIds, ...list.companyIds])) }
        : list
    );
  }

  return {
    savedCompanyIds,
    savedLists: Array.from(byId.values()),
    userInterests,
    // Local preferences win — they reflect this device, which the user is looking at.
    userLocation: local.userLocation ?? remote.userLocation ?? null,
    accentColor: local.accentColor ?? remote.accentColor ?? null,
    theme: local.theme ?? remote.theme ?? null,
  };
}
