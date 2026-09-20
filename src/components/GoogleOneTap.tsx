import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const DISMISS_KEY = 'uae_one_tap_dismissed';

interface CredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

/**
 * Google One Tap — the prompt you see on many sites.
 *
 * Deliberately not shown the instant the page loads: it waits for the user to
 * actually engage with the page first, and it stays away for the rest of the
 * session once dismissed. FedCM is required by Google as of late 2025.
 *
 * Renders nothing; the prompt is drawn by Google's own script.
 */
export const GoogleOneTap: React.FC = () => {
  const { configured, user, loading, signInWithGoogleCredential } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!configured || !CLIENT_ID || loading || user || startedRef.current) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // storage blocked — just don't show the prompt
      return;
    }

    let cancelled = false;
    let idleTimer = 0;

    const start = () => {
      if (cancelled || startedRef.current) return;
      startedRef.current = true;

      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      const script = existing ?? document.createElement('script');

      const onReady = () => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res: CredentialResponse) => {
            if (res.credential) void signInWithGoogleCredential(res.credential);
          },
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
          cancel_on_tap_outside: true,
          auto_select: false,
        });
        window.google.accounts.id.prompt();
      };

      if (existing) {
        onReady();
      } else {
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = onReady;
        document.head.appendChild(script);
      }
    };

    // Wait for a real interaction, or ~8s of reading, before interrupting.
    const onInteract = () => {
      window.clearTimeout(idleTimer);
      start();
    };
    idleTimer = window.setTimeout(start, 8000);
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      try {
        window.google?.accounts.id.cancel();
      } catch {
        // ignore
      }
    };
  }, [configured, user, loading, signInWithGoogleCredential]);

  // Remember dismissal for the session so we don't nag.
  useEffect(() => {
    if (user) {
      try {
        sessionStorage.setItem(DISMISS_KEY, '1');
      } catch {
        // ignore
      }
    }
  }, [user]);

  return null;
};
