import React from 'react';
import { Modal } from './Modal';
import { useSheetDrag } from '../../hooks/useSheetDrag';

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  /** Desktop width cap. Phones always get the full width. */
  maxWidthClassName?: string;
  /** Height cap, shared by both layouts. */
  heightClassName?: string;
  children: React.ReactNode;
}

/**
 * A dialog that is a bottom sheet on phones and a centred panel on larger
 * screens.
 *
 * Phones get the sheet treatment because a centred box with a small × in its
 * corner is awkward one-handed: this sits under the thumb and can be flicked
 * away. The two layouts are the same DOM, switched with `sm:` classes, so there
 * is no breakpoint JavaScript and nothing to keep in sync.
 */
export const ResponsiveSheet: React.FC<ResponsiveSheetProps> = ({
  open,
  onClose,
  label,
  labelledBy,
  maxWidthClassName = 'sm:max-w-lg',
  heightClassName = 'max-h-[90dvh]',
  children,
}) => {
  const { sheetRef, sheetStyle, handleProps } = useSheetDrag(onClose);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={label}
      labelledBy={labelledBy}
      className="fixed inset-0 z-10000 flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 pointer-events-none"
      backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`bg-surface w-full ${maxWidthClassName} ${heightClassName} flex flex-col shadow-popup border-t sm:border border-line overflow-hidden text-ink pointer-events-auto rounded-t-2xl sm:rounded-xl animate-slide-up sm:animate-fade-in`}
      >
        {/* Grab area: phones only, on a desktop the header's × is the target. */}
        <div
          {...handleProps}
          className="sm:hidden pt-2.5 pb-1.5 flex justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {children}
      </div>
    </Modal>
  );
};
