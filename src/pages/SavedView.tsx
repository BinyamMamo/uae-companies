import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { ShareListModal } from '../components/ShareListModal';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { CompanyLogo } from '../components/ui/CompanyLogo';
import {
  Trash2,
  Share2,
  Plus,
  MapPin,
  BookmarkCheck
} from 'lucide-react';

export const SavedView: React.FC = () => {
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    savedLists,
    activeListId,
    setActiveListId,
    createSavedList,
    deleteSavedList,
    removeCompanyFromList,
    toggleSaveCompany
  } = useApp();
  const isDesktop = useIsDesktop();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Active list object
  const currentList = savedLists.find(l => l.id === activeListId) || savedLists[0];

  // Resolve companies in this list
  const savedCompanies = (currentList?.companyIds || [])
    .map(id => companies.find(c => c.id === id))
    .filter(Boolean) as typeof companies;

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createSavedList(newListName.trim());
    setNewListName('');
    setIsCreatingList(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      {/* List Tabs, Create List & Share Action */}
      <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          {savedLists.map(list => {
            const isActive = list.id === activeListId;
            return (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition whitespace-nowrap flex items-center gap-2 ${ isActive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-line hover:bg-slate-50 dark:hover:bg-slate-800' }`}
              >
                <span>{list.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ isActive ? 'bg-slate-800 dark:bg-slate-200 text-slate-300 dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' }`}>
                  {list.companyIds.length}
                </span>
              </button>
            );
          })}

          {/* New List button */}
          {!isCreatingList ? (
            <button
              onClick={() => setIsCreatingList(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 hover:bg-blue-50/50 rounded-lg border border-dashed border-blue-300 transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New list</span>
            </button>
          ) : (
            <form onSubmit={handleCreateList} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="List name..."
                autoFocus
                className="text-xs px-2.5 py-1.5 border border-brand-500 rounded-lg focus:outline-hidden w-32"
              />
              <button
                type="submit"
                className="px-2 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Right actions: Share list & Delete list */}
        <div className="flex items-center gap-2 shrink-0">
          {savedCompanies.length > 0 && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-1.5 bg-surface hover:bg-surface-2 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-sm border border-line shadow-2xs transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-ink-2" />
              <span>Share list</span>
            </button>
          )}

          {/* Delete current custom list */}
          {currentList && currentList.id !== 'default' && (
            <button
              onClick={() => deleteSavedList(currentList.id)}
              className="text-xs text-red-600 hover:text-red-700 font-medium shrink-0 flex items-center gap-1 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete list</span>
            </button>
          )}
        </div>
      </div>

      {/* Company Items List (matching screenshot bottom-right) */}
      {savedCompanies.length > 0 ? (
        <div className="space-y-3">
          {savedCompanies.map(company => (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className="bg-surface border border-line hover:border-line-strong rounded-lg p-4 shadow-subtle flex items-center justify-between gap-4 transition-colors transition-shadow cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                
                {/* Logo */}
                <CompanyLogo name={company.name} src={company.logo} size="sm" />

                {/* Info */}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {company.name}
                  </h3>
                  <div className="text-xs text-ink-2 truncate">
                    {company.categories.slice(0, 3).join(' · ')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                    <span>{company.location.emirate}, UAE</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{formatDistance(company.commute.distanceKm)}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-ink-2 font-medium">{formatBusCommute(company.commute.busMinutes)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentList.id === 'default') {
                      toggleSaveCompany(company.id);
                    } else {
                      removeCompanyFromList(currentList.id, company.id);
                    }
                  }}
                  className="p-2 rounded-sm text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title="Remove from this list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg p-12 text-center mt-6">
          <BookmarkCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-ink">
            No saved companies in this list
          </h3>
          <p className="text-xs text-ink-2 mt-1 max-w-sm mx-auto">
            Save companies while browsing the directory or exploring the map and they will appear here.
          </p>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && currentList && (
        <ShareListModal
          listName={currentList.name}
          companies={savedCompanies}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Desktop Drawer */}
      {selectedCompany && isDesktop && (
          <CompanyDrawer
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}

      {/* Mobile Bottom Sheet */}
      {selectedCompany && !isDesktop && (
          <CompanyBottomSheet
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

    </div>
  );
};
