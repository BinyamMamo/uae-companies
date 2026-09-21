import React, { useRef } from 'react';
import { Modal } from './Modal';

export type ConfirmTone = 'primary' | 'danger';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Severity is carried by the confirm button's colour, not by an icon. */
  tone?: ConfirmTone;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_CLASS: Record<ConfirmTone, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700',
  danger: 'bg-red-600 hover:bg-red-700',
};

/**
 * The app's single confirmation dialog.
 *
 * Deliberately plain: a title, a sentence, two buttons. The only signal of how
 * serious the action is comes from the confirm button's colour, so an ordinary
 * confirmation doesn't wear the same alarm styling as a destructive one.
 *
 * Prefer the `useConfirm()` hook over rendering this directly.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}) => {
  // Focus starts on Cancel so a stray Enter cannot destroy anything.
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      label={title}
      initialFocusRef={cancelRef}
      className="fixed inset-0 z-10021 flex items-center justify-center p-4"
      backdropClassName="fixed inset-0 z-10020 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface border border-line rounded-xl shadow-popup max-w-sm w-full p-5 animate-slide-up">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && (
          <p className="text-xs text-ink-2 mt-2 leading-relaxed">{description}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold rounded-md border border-line text-ink-2 hover:bg-surface-2 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md text-white transition-colors ${TONE_CLASS[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
