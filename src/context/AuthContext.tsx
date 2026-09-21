import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadFirebase, isAuthConfigured, type User } from '../lib/firebase';
import { identifyUser, resetUser, track } from '../lib/analytics';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

interface AuthContextValue {
  /** False when Firebase env vars are absent — the UI hides sign-in entirely. */
  configured: boolean;
  user: AuthUser | null;
  /** True until the first auth state resolves, so we don't flash a signed-out menu. */
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Used by the One Tap prompt to exchange a Google credential. */
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toAuthUser = (u: User): AuthUser => ({
  uid: u.uid,
  name: u.displayName ?? u.email?.split('@')[0] ?? 'Signed in',
  email: u.email ?? '',
  photoURL: u.photoURL,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pending = loadFirebase();
    if (!pending) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void pending
      .then(fb => {
        if (cancelled) return;
        unsubscribe = fb.onAuthStateChanged(fb.auth, next => {
          if (next) {
            const mapped = toAuthUser(next);
            setUser(mapped);
            identifyUser(mapped.uid);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async () => {
    const fb = await loadFirebase();
    if (!fb) return;
    setError(null);
    try {
      await fb.signInWithPopup(fb.auth, fb.googleProvider);
      track('signed_in', { method: 'google_popup' });
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      // Closing the popup is a normal thing to do, not an error worth showing.
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(
        code === 'auth/unauthorized-domain'
          ? 'This domain is not authorised for sign-in yet.'
          : 'Sign-in failed. Please try again.'
      );
    }
  }, []);

  const signInWithGoogleCredential = useCallback(async (idToken: string) => {
    const fb = await loadFirebase();
    if (!fb) return;
    setError(null);
    try {
      await fb.signInWithCredential(fb.auth, fb.GoogleAuthProvider.credential(idToken));
      track('signed_in', { method: 'google_one_tap' });
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const fb = await loadFirebase();
    if (!fb) return;
    await fb.signOut(fb.auth);
    track('signed_out');
    resetUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isAuthConfigured,
      user,
      loading,
      error,
      signIn,
      signOut,
      signInWithGoogleCredential,
    }),
    [user, loading, error, signIn, signOut, signInWithGoogleCredential]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
