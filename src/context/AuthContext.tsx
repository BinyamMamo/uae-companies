import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** False when Firebase env vars are absent, the UI hides sign-in entirely. */
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


const HAD_SESSION = 'uae_had_session';

/** Whether anyone has ever signed in on this device. */
function hadSessionBefore(): boolean {
  try {
    return localStorage.getItem(HAD_SESSION) === '1';
  } catch {
    // Private mode and blocked storage both land here; assume no session and
    // load Firebase on demand instead.
    return false;
  }
}

function rememberSession(yes: boolean) {
  try {
    if (yes) localStorage.setItem(HAD_SESSION, '1');
    else localStorage.removeItem(HAD_SESSION);
  } catch {
    /* nothing we can do, and nothing depends on it being durable */
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [error, setError] = useState<string | null>(null);
  /*
    Set once the auth listener is live. The deferred bootstrap below only
    attaches it for someone who has signed in here before, so a first sign-in
    has to attach it itself, otherwise nothing tells the header a user now
    exists and the avatar stays generic until the page is reloaded.
  */
  const watching = useRef(false);
  const watchAuth = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!isAuthConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const attach = (pending: NonNullable<ReturnType<typeof loadFirebase>>) => {
      if (watching.current) return Promise.resolve();
      watching.current = true;
      return pending
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
        watching.current = false;
        if (!cancelled) setLoading(false);
      });
    };

    /*
      Exposed so signIn can start watching on a device that has never had a
      session. It is assigned before the early return below, because that is
      exactly the case that needs it: without this, a first sign-in had nothing
      listening and the header kept showing a signed-out avatar until reload.
    */
    watchAuth.current = async () => {
      const pending = loadFirebase();
      if (pending) await attach(pending);
    };

    /*
      Firebase auth + firestore + analytics is ~700KB, and it was being fetched
      during first paint on every visit, including the great majority that never
      sign in. So someone who has signed in on this device before gets their
      session restored once the browser is idle; everyone else pays nothing
      until they press Sign in.

      HAD_SESSION is only a hint about which path to take. Firebase remains the
      source of truth for whether a session is actually valid.
    */
    if (!hadSessionBefore()) {
      setLoading(false);
      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    }

    let idle: number | undefined;
    const start = () => {
      if (cancelled) return;
      const pending = loadFirebase();
      if (!pending) {
        setLoading(false);
        return;
      }
      void attach(pending);
    };

    const ric = window.requestIdleCallback;
    if (typeof ric === 'function') {
      idle = ric(start, { timeout: 3000 });
    } else {
      idle = window.setTimeout(start, 1200);
    }

    return () => {
      cancelled = true;
      if (idle !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
        else window.clearTimeout(idle);
      }
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async () => {
    const fb = await loadFirebase();
    if (!fb) return;
    // Attach first: the listener is what pushes the new user into the UI.
    await watchAuth.current();
    setError(null);
    try {
      await fb.signInWithPopup(fb.auth, fb.googleProvider);
      rememberSession(true);
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
    await watchAuth.current();
    setError(null);
    try {
      await fb.signInWithCredential(fb.auth, fb.GoogleAuthProvider.credential(idToken));
      rememberSession(true);
      track('signed_in', { method: 'google_one_tap' });
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const fb = await loadFirebase();
    if (!fb) return;
    await fb.signOut(fb.auth);
    rememberSession(false);
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
