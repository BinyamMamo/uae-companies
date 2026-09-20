import React, { useCallback, useEffect, useId, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Tracks how many dialogs are open so nested/stacked ones don't fight over the scroll lock. */
let lockCount = 0;

function lockBodyScroll() {
  if (lockCount === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.dataset.prevOverflow = document.body.style.overflow;
    document.body.dataset.prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = document.body.dataset.prevOverflow ?? '';
    document.body.style.paddingRight = document.body.dataset.prevPaddingRight ?? '';
    delete document.body.dataset.prevOverflow;
    delete document.body.dataset.prevPaddingRight;
  }
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Provide this or `labelledBy`. */
  label?: string;
  labelledBy?: string;
  children: React.ReactNode;
  /** Wrapper around the panel — controls where the panel sits (centre, right, bottom). */
  className?: string;
  backdropClassName?: string;
  /** Set false for panels that should not close on outside click. */
  closeOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Accessible dialog shell.
 *
 * Before this existed, Escape worked in 2 of 6 overlays, backdrop click in 2 of
 * 6, `role="dialog"` was on 2 of 6, none trapped focus or restored it on close,
 * and the page scrolled behind every one of them.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  label,
  labelledBy,
  children,
  className = 'fixed inset-0 z-9999 flex items-center justify-center p-4',
  backdropClassName = 'fixed inset-0 z-9998 bg-slate-900/30 dark:bg-black/60 backdrop-blur-xs animate-fade-in',
  closeOnBackdrop = true,
  initialFocusRef,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const fallbackId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    // Move focus into the dialog so the trap has something to hold.
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      target?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      unlockBodyScroll();
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return (
    <>
      <div
        className={backdropClassName}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : (label ?? 'Dialog')}
        aria-labelledby={labelledBy ?? undefined}
        tabIndex={-1}
        id={fallbackId}
        className={className}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </>
  );
};
