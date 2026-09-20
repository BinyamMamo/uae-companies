import React, { useEffect, useRef, useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  Settings as SettingsIcon,
  Bookmark,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { GoogleMark } from './ui/GoogleMark';

export const ProfileMenu: React.FC = () => {
  const { configured, user, loading, error, signIn, signOut } = useAuth();
  const { setIsSettingsModalOpen, setActiveTab, savedCompanyIds } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click / Escape — same pattern as Dropdown.
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

  if (!configured) return null;

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const itemClass =
    'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors text-left';

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
          className="absolute right-0 mt-2 w-60 bg-surface border border-line rounded-lg shadow-popup overflow-hidden z-50 animate-fade-in"
        >
          {user ? (
            <>
              <div className="px-3 py-3 border-b border-line">
                <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
                <p className="text-[11px] text-ink-3 truncate mt-0.5">{user.email}</p>
                <p className="text-[11px] text-ink-3 mt-1.5">Saved lists sync across your devices.</p>
              </div>
              <button
                role="menuitem"
                className={itemClass}
                onClick={() => {
                  setActiveTab('saved');
                  setOpen(false);
                }}
              >
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Saved</span>
                <span className="ml-auto text-[11px] text-ink-3">{savedCompanyIds.length}</span>
              </button>
              <button
                role="menuitem"
                className={itemClass}
                onClick={() => {
                  setIsSettingsModalOpen(true);
                  setOpen(false);
                }}
              >
                <SettingsIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Settings</span>
              </button>
              <button
                role="menuitem"
                className={`${itemClass} border-t border-line`}
                onClick={() => {
                  void signOut();
                  setOpen(false);
                }}
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-3 border-b border-line">
                <p className="text-xs font-semibold text-ink">Sign in</p>
                <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
                  Keep your saved companies and lists across devices. Everything works
                  signed out too.
                </p>
              </div>
              <div className="p-2">
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
                  <p className="mt-2 text-[11px] text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <button
                role="menuitem"
                className={`${itemClass} border-t border-line`}
                onClick={() => {
                  setIsSettingsModalOpen(true);
                  setOpen(false);
                }}
              >
                <SettingsIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Settings</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
