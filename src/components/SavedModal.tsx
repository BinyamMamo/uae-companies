import React from 'react';
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
        label="Saved companies"
        className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-6"
        backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
      >
        <div className="bg-surface rounded-xl w-full max-w-5xl h-[85dvh] flex flex-col shadow-popup border border-line overflow-hidden text-ink">
          {/*
            No separate title bar: the panel's own header row carries the close
            button, so the modal does not stack two headers on top of each other.
          */}
          <SavedListsPanel variant="modal" onClose={onClose} />
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
