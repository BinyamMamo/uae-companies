import React, { useRef, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SaveToListMenu } from './SaveToListMenu';

interface SaveToListButtonProps {
  companyId: string;
  companyName: string;
  className?: string;
}

/**
 * Bookmark button that opens the list picker.
 *
 * Featured used to call toggleSaveCompany directly, so the same icon meant
 * "choose a list" on the cards and "drop it in All Saved" here. Owning the
 * ref and the open state makes it usable inside a list, where a shared
 * useState in the parent could not be.
 */
export const SaveToListButton: React.FC<SaveToListButtonProps> = ({
  companyId,
  companyName,
  className = '',
}) => {
  const { isCompanySaved } = useApp();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const isSaved = isCompanySaved(companyId);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={e => {
          // These sit inside clickable cards.
          e.stopPropagation();
          setOpen(o => !o);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={isSaved ? `Edit lists for ${companyName}` : `Save ${companyName} to a list`}
        title={isSaved ? 'Edit lists' : 'Save to a list'}
        className={`p-2 rounded-md border transition-colors ${
          isSaved
            ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/30'
            : 'text-ink-3 border-line hover:text-ink hover:bg-surface-2'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <SaveToListMenu
          companyId={companyId}
          companyName={companyName}
          anchorRef={buttonRef}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};
