import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useConfirm } from '../hooks/useConfirm';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { ShareListModal } from '../components/ShareListModal';
import { CompanyLogo } from '../components/ui/CompanyLogo';
import { CommuteMeta } from '../components/ui/CommuteMeta';
import { EmptyState } from '../components/ui/EmptyState';
import { track } from '../lib/analytics';
import { Bookmark, Plus, Search, Share2, Trash2, X, Check, Pencil } from 'lucide-react';

/**
 * Saved lists.
 *
 * The lists live in a sidebar that mirrors the filter card on the list view, so
 * switching between them is one click rather than a scrolling tab strip. Every
 * destructive action goes through the shared confirmation dialog.
 */
export const SavedView: React.FC = () => {
  const {
    companies,
    savedLists,
    activeListId,
    setActiveListId,
    createSavedList,
    deleteSavedList,
    renameSavedList,
    removeCompanyFromList,
    selectedCompany,
    setSelectedCompany,
    setActiveTab,
  } = useApp();
  const isDesktop = useIsDesktop();
  const confirm = useConfirm();

  const [listQuery, setListQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);

  const activeList = savedLists.find(l => l.id === activeListId) ?? savedLists[0];

  const visibleLists = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return q ? savedLists.filter(l => l.name.toLowerCase().includes(q)) : savedLists;
  }, [savedLists, listQuery]);

  const listCompanies = useMemo(() => {
    if (!activeList) return [];
    const inList = activeList.companyIds
      .map(id => companies.find(c => c.id === id))
      .filter((c): c is (typeof companies)[number] => Boolean(c));
    const q = companyQuery.trim().toLowerCase();
    return q
      ? inList.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.categories.some(cat => cat.toLowerCase().includes(q))
        )
      : inList;
  }, [activeList, companies, companyQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createSavedList(newListName);
    setNewListName('');
    setIsCreating(false);
  };

  const handleDeleteList = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description:
        'The list is removed. The companies in it stay saved under All Saved.',
      confirmLabel: 'Delete list',
      tone: 'danger',
    });
    if (ok) deleteSavedList(id);
  };

  const handleRemove = async (companyId: string, companyName: string) => {
    const fromDefault = activeList?.id === 'default';
    const ok = await confirm({
      title: fromDefault ? `Unsave ${companyName}?` : `Remove ${companyName}?`,
      description: fromDefault
        ? 'It will be removed from all of your lists.'
        : `It will be taken out of "${activeList?.name}" but stay under All Saved.`,
      confirmLabel: fromDefault ? 'Unsave' : 'Remove',
      tone: 'danger',
    });
    if (ok && activeList) removeCompanyFromList(activeList.id, companyId);
  };

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingId && renameValue.trim()) renameSavedList(renamingId, renameValue);
    setRenamingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Lists — mirrors the filter card on the list view */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0 md:sticky md:top-[calc(var(--header-h)+1.5rem)] md:self-start">
          <div className="bg-surface border border-line rounded-xl p-3 shadow-subtle">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Lists</h2>
              <button
                type="button"
                onClick={() => setIsCreating(v => !v)}
                className="p-1 rounded text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Create a new list"
                title="New list"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreate} className="flex items-center gap-1.5 mb-2">
                <label htmlFor="new-list" className="sr-only">
                  New list name
                </label>
                <input
                  id="new-list"
                  autoFocus
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setIsCreating(false)}
                  placeholder="List name"
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-2 py-1.5 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white transition-colors"
                >
                  Add
                </button>
              </form>
            )}

            {savedLists.length > 4 && (
              <div className="relative mb-2">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none"
                  aria-hidden="true"
                />
                <label htmlFor="list-search" className="sr-only">
                  Search your lists
                </label>
                <input
                  id="list-search"
                  type="search"
                  value={listQuery}
                  onChange={e => setListQuery(e.target.value)}
                  placeholder="Search lists"
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            <ul className="space-y-0.5">
              {visibleLists.map(list => {
                const isActive = list.id === activeList?.id;
                return (
                  <li key={list.id} className="group relative">
                    {renamingId === list.id ? (
                      <form onSubmit={submitRename} className="flex items-center gap-1 p-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && setRenamingId(null)}
                          className="flex-1 min-w-0 px-2 py-1 text-xs bg-surface-2 border border-line rounded text-ink focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                          aria-label={`Rename ${list.name}`}
                        />
                        <button
                          type="submit"
                          className="p-1 rounded text-brand-600 dark:text-brand-400"
                          aria-label="Save name"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <div
                        className={`flex items-center rounded-lg transition-colors ${
                          isActive ? 'bg-surface-2' : 'hover:bg-surface-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveListId(list.id)}
                          aria-current={isActive ? 'true' : undefined}
                          className="flex-1 min-w-0 flex items-baseline gap-2 px-2.5 py-2 text-left"
                        >
                          <span
                            className={`text-xs truncate ${
                              isActive ? 'font-semibold text-ink' : 'text-ink-2'
                            }`}
                          >
                            {list.name}
                          </span>
                          <span className="ml-auto text-[11px] text-ink-3 tabular-nums shrink-0">
                            {list.companyIds.length}
                          </span>
                        </button>

                        {list.id !== 'default' && (
                          <span className="flex items-center pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(list.id);
                                setRenameValue(list.name);
                              }}
                              className="p-1 rounded text-ink-3 hover:text-ink transition-colors"
                              aria-label={`Rename ${list.name}`}
                            >
                              <Pencil className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteList(list.id, list.name)}
                              className="p-1 rounded text-ink-3 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              aria-label={`Delete ${list.name}`}
                            >
                              <Trash2 className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {visibleLists.length === 0 && (
              <p className="text-[11px] text-ink-3 px-2 py-3">No lists match &ldquo;{listQuery}&rdquo;.</p>
            )}
          </div>
        </aside>

        {/* Companies in the selected list */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-ink truncate">{activeList?.name}</h1>
              <p className="text-xs text-ink-3 mt-0.5">
                {activeList?.companyIds.length ?? 0}{' '}
                {activeList?.companyIds.length === 1 ? 'company' : 'companies'}
              </p>
            </div>

            {(activeList?.companyIds.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  track('list_shared', { company_count: activeList?.companyIds.length ?? 0 });
                  setIsShareOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Share</span>
              </button>
            )}
          </div>

          {(activeList?.companyIds.length ?? 0) > 3 && (
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="saved-search" className="sr-only">
                Search within this list
              </label>
              <input
                id="saved-search"
                type="search"
                value={companyQuery}
                onChange={e => setCompanyQuery(e.target.value)}
                placeholder="Search in this list"
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 border-b border-line rounded-none text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
            </div>
          )}

          {listCompanies.length > 0 ? (
            <ul className="space-y-2">
              {listCompanies.map(company => (
                <li
                  key={company.id}
                  className="group flex items-center gap-3 bg-surface border border-line hover:border-line-strong rounded-xl p-3 sm:p-4 transition-colors"
                >
                  <CompanyLogo name={company.name} src={company.logo} size="sm" />

                  <button
                    type="button"
                    onClick={() => setSelectedCompany(company)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="block text-sm font-semibold text-ink truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {company.name}
                    </span>
                    <span className="block text-xs text-ink-3 truncate mt-0.5">
                      {company.categories.slice(0, 3).join(' · ')}
                    </span>
                    <CommuteMeta company={company} className="mt-1.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleRemove(company.id, company.name)}
                    className="p-2 rounded-md text-ink-3 hover:text-red-600 dark:hover:text-red-400 hover:bg-surface-2 transition-colors shrink-0"
                    aria-label={`Remove ${company.name} from ${activeList?.name}`}
                    title="Remove from this list"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : companyQuery.trim() ? (
            <EmptyState
              icon={Search}
              title="No matches in this list"
              description={`Nothing in "${activeList?.name}" matches "${companyQuery.trim()}".`}
              action={{ label: 'Clear search', onClick: () => setCompanyQuery('') }}
            />
          ) : (
            <EmptyState
              icon={Bookmark}
              title={activeList?.id === 'default' ? 'Nothing saved yet' : 'This list is empty'}
              description="Use the bookmark button on any company to save it, and pick which lists it belongs to."
              action={{ label: 'Browse companies', onClick: () => setActiveTab('list') }}
            />
          )}
        </main>
      </div>

      {isShareOpen && activeList && (
        <ShareListModal
          listName={activeList.name}
          companies={listCompanies}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {selectedCompany && isDesktop && (
        <CompanyDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
      {selectedCompany && !isDesktop && (
        <CompanyBottomSheet company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};
