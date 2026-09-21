import React from 'react';
import { SavedListsPanel } from '../components/SavedListsPanel';

/** Full-page view of the saved lists. The same panel also runs as a modal. */
export const SavedView: React.FC = () => <SavedListsPanel variant="page" />;
