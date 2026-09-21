import React from 'react';
import { ResponsiveSheet } from './ui/ResponsiveSheet';
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
      {/*
        No separate title bar: the panel's own header row carries the close
        button, so the sheet does not stack two headers on top of each other.
      */}
      <ResponsiveSheet
        open={open}
        onClose={onClose}
        label="Saved companies"
        maxWidthClassName="sm:max-w-5xl"
        heightClassName="h-[85dvh]"
      >
        <SavedListsPanel variant="modal" onClose={onClose} />
      </ResponsiveSheet>

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
