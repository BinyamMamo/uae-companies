import React, { useEffect, useRef, useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  Settings as SettingsIcon,
  Bookmark,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../hooks/useConfirm';
import { GoogleMark } from './ui/GoogleMark';

interface ProfileMenuProps {
  onOpenSaved: () => void;
  onOpenInterests: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onOpenSaved, onOpenInterests }) => {
  const { configured, user, loading, error, signIn, signOut } = useAuth();
  const { setIsSettingsModalOpen, savedCompanyIds, userInterests } = useApp();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    const ok = await confirm({
      title: 'Sign out?',
      description:
        'Your saved lists stay on this device. Sign back in to sync them across your devices again.',
      confirmLabel: 'Sign out',
      tone: 'danger',
    });
    if (ok) await signOut();
  };

  const item =
    'w-full flex items-center gap-3 px-4 py-2.5 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors text-left';

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Account menu for ${user.name}` : 'Account menu'}
        className="p-0.5 rounded-full border border-line hover:border-line-strong transition-colors"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-surface border border-line rounded-xl shadow-popup overflow-hidden z-50 animate-fade-in"
        >
          {/* Identity, or the reason to sign in — same padding either way */}
          {user ? (
            <div className="px-4 py-3 border-b border-line">
              <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
              <p className="text-[11px] text-ink-3 truncate mt-0.5">{user.email}</p>
            </div>
          ) : (
            configured && (
              <div className="px-4 py-3 border-b border-line space-y-3">
                <div>
                  <p className="text-xs font-semibold text-ink">Sign in</p>
                  <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
                    Keep your saved companies and lists across devices. Everything works signed
                    out too.
                  </p>
                </div>
                <button
                  role="menuitem"
                  onClick={handleSignIn}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md border border-line bg-surface hover:bg-surface-2 text-ink transition-colors disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <GoogleMark className="w-4 h-4" />
                  )}
                  <span>Continue with Google</span>
                </button>
                {error && (
                  <p className="text-[11px] text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
            )
          )}

          <div className="py-1">
            <button role="menuitem" className={item} onClick={run(onOpenSaved)}>
              <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Saved</span>
              <span className="text-[11px] text-ink-3 tabular-nums">
                {savedCompanyIds.length}
              </span>
            </button>

            <button role="menuitem" className={item} onClick={run(onOpenInterests)}>
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Interests</span>
              <span className="text-[11px] text-ink-3 tabular-nums">{userInterests.length}</span>
            </button>

            <button
              role="menuitem"
              className={item}
              onClick={run(() => setIsSettingsModalOpen(true))}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Settings</span>
            </button>
          </div>

          {user && (
            <div className="py-1 border-t border-line">
              <button role="menuitem" className={item} onClick={() => void handleSignOut()}>
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
