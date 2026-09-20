import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, mergeProfiles, saveProfile, type SyncedProfile } from '../lib/sync';

interface Args {
  profile: SyncedProfile;
  onMerged: (merged: SyncedProfile) => void;
}

/**
 * Pulls the signed-in user's profile once on sign-in, merges it into local
 * state, then mirrors subsequent local changes back up (debounced).
 */
export function useProfileSync({ profile, onMerged }: Args): void {
  const { user } = useAuth();
  const hydratedFor = useRef<string | null>(null);
  const latest = useRef(profile);
  latest.current = profile;

  // Pull + merge, once per signed-in user.
  useEffect(() => {
    if (!user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.uid) return;
    hydratedFor.current = user.uid;

    let cancelled = false;
    void (async () => {
      const remote = await fetchProfile(user.uid);
      if (cancelled) return;
      const merged = mergeProfiles(latest.current, remote);
      onMerged(merged);
      await saveProfile(user.uid, merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, onMerged]);

  // Push local changes up, debounced so a burst of edits is one write.
  useEffect(() => {
    if (!user || hydratedFor.current !== user.uid) return;
    const timer = window.setTimeout(() => {
      void saveProfile(user.uid, profile);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [user, profile]);
}
