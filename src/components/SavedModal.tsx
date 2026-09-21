import React from 'react';
import { X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { SavedListsPanel } from './SavedListsPanel';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { CompanyDrawer } from './CompanyDrawer';
import { CompanyBottomSheet } from './CompanyBottomSheet';

interface SavedModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The saved lists as a modal, reachable from the profile menu.
 *
 * Runs the same panel as the full page so the two cannot drift apart while
 * both exist.
 */
export const SavedModal: React.FC<SavedModalProps> = ({ open, onClose }) => {
  const { selectedCompany, setSelectedCompany } = useApp();
  const isDesktop = useIsDesktop();

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        labelledBy="saved-modal-title"
        className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-6"
        backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
      >
        <div className="bg-surface rounded-xl w-full max-w-5xl h-[85dvh] flex flex-col shadow-popup border border-line overflow-hidden text-ink">
          <header className="flex items-center justify-between gap-4 px-5 h-14 border-b border-line shrink-0">
            <h2 id="saved-modal-title" className="text-sm font-semibold text-ink">
              Saved
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </header>

          <SavedListsPanel variant="modal" />
        </div>
      </Modal>

      {/* Opened from inside the modal, so it stacks above it */}
      {open && selectedCompany && isDesktop && (
        <CompanyDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
      {open && selectedCompany && !isDesktop && (
        <CompanyBottomSheet company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </>
  );
};
