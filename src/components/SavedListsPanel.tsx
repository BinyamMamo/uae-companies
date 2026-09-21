import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useConfirm } from '../hooks/useConfirm';
import { CompanyDrawer } from './CompanyDrawer';
import { CompanyBottomSheet } from './CompanyBottomSheet';
import { ShareListModal } from './ShareListModal';
import { CompanyLogo } from './ui/CompanyLogo';
import { CommuteMeta } from './ui/CommuteMeta';
import { EmptyState } from './ui/EmptyState';
import { track } from '../lib/analytics';
import { Bookmark, Check, Pencil, Plus, Search, Share2, Trash2, X } from 'lucide-react';

/**
 * Saved lists.
 *
 * Lists and their contents share one panel split by a divider, rather than a
 * floating sidebar card next to a separate bordered body — two disconnected
 * boxes that read as unfinished when either side was empty.
 */
interface SavedListsPanelProps {
  /** Modal variant sizes to its container instead of the page. */
  variant?: 'page' | 'modal';
}

export const SavedListsPanel: React.FC<SavedListsPanelProps> = ({ variant = 'page' }) => {
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
  const totalSaved = savedLists.find(l => l.id === 'default')?.companyIds.length ?? 0;

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
      description: 'The list is removed. The companies in it stay saved under All Saved.',
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
    <div className={variant === "modal" ? "h-full min-h-0 flex flex-col" : "max-w-7xl mx-auto px-4 sm:px-6 py-6"}>
      {/* One panel: lists and their contents share a surface, split by a rule */}
      <div
        className={`bg-surface overflow-hidden flex flex-col md:flex-row ${
          variant === "modal"
            ? "flex-1 min-h-0"
            : "border border-line rounded-xl md:min-h-[32rem]"
        }`}
      >
        {/* ---------------- Lists ---------------- */}
        <aside
          aria-label="Your saved lists"
          className="md:w-60 lg:w-64 shrink-0 md:border-r border-b md:border-b-0 border-line flex flex-col"
        >
          <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-line shrink-0">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Lists</h2>
            <button
              type="button"
              onClick={() => setIsCreating(v => !v)}
              className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Create a new list"
              title="New list"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-2 space-y-2 flex-1 md:overflow-y-auto">
            {isCreating && (
              <form onSubmit={handleCreate} className="flex items-center gap-1.5">
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
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white transition-colors"
                >
                  Add
                </button>
              </form>
            )}

            {savedLists.length > 5 && (
              <div className="relative">
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
                  <li key={list.id} className="group">
                    {renamingId === list.id ? (
                      <form onSubmit={submitRename} className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && setRenamingId(null)}
                          className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                          aria-label={`Rename ${list.name}`}
                        />
                        <button
                          type="submit"
                          className="p-1.5 rounded-md text-brand-600 dark:text-brand-400"
                          aria-label="Save name"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <div
                        className={`relative flex items-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-500/10'
                            : 'hover:bg-surface-2'
                        }`}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
                            aria-hidden="true"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveListId(list.id)}
                          aria-current={isActive ? 'true' : undefined}
                          className="flex-1 min-w-0 flex items-baseline gap-2 pl-3 pr-1 py-2 text-left"
                        >
                          <span
                            className={`text-xs truncate ${
                              isActive
                                ? 'font-semibold text-brand-700 dark:text-brand-300'
                                : 'text-ink-2'
                            }`}
                          >
                            {list.name}
                          </span>
                          <span className="ml-auto w-5 text-right text-[11px] text-ink-3 tabular-nums shrink-0">
                            {list.companyIds.length}
                          </span>
                        </button>

                        {/*
                          Fixed width on every row, including the default list
                          that has no actions, so the counts line up.
                        */}
                        <span className="w-14 flex items-center justify-end pr-1 shrink-0">
                          {list.id !== 'default' && (
                            <span className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
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
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {visibleLists.length === 0 && (
              <p className="text-[11px] text-ink-3 px-2 py-3">
                No lists match &ldquo;{listQuery}&rdquo;.
              </p>
            )}
          </div>
        </aside>

        {/* ---------------- Contents ---------------- */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-14 border-b border-line shrink-0">
            <p className="text-xs text-ink-3 min-w-0 truncate">
              {listCompanies.length}
              {companyQuery.trim() ? ' matching' : ''}{' '}
              {listCompanies.length === 1 ? 'company' : 'companies'}
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              {(activeList?.companyIds.length ?? 0) > 3 && (
                <div className="relative hidden sm:block">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none"
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
                    placeholder="Search"
                    className="w-40 pl-8 pr-2 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {(activeList?.companyIds.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    track('list_shared', { company_count: activeList?.companyIds.length ?? 0 });
                    setIsShareOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          </div>

          {listCompanies.length > 0 ? (
            <ul className="divide-y divide-line flex-1">
              {listCompanies.map(company => (
                <li
                  key={company.id}
                  className="group flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface-2 transition-colors"
                >
                  <CompanyLogo name={company.name} src={company.logo} size="sm" />

                  <button
                    type="button"
                    onClick={() => setSelectedCompany(company)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="block text-sm font-semibold text-ink truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
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
                    className="p-2 rounded-md text-ink-3 hover:text-red-600 dark:hover:text-red-400 hover:bg-surface transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    aria-label={`Remove ${company.name} from ${activeList?.name}`}
                    title="Remove from this list"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : companyQuery.trim() ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                bare
                icon={Search}
                title="No matches in this list"
                description={`Nothing in "${activeList?.name}" matches "${companyQuery.trim()}".`}
                action={{ label: 'Clear search', onClick: () => setCompanyQuery('') }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                bare
                icon={Bookmark}
                title={
                  activeList?.id === 'default'
                    ? 'Nothing saved yet'
                    : `"${activeList?.name}" is empty`
                }
                description={
                  activeList?.id === 'default' || totalSaved === 0
                    ? 'Use the bookmark button on any company to save it, and pick which lists it belongs to.'
                    : 'Open a company you have saved and tick this list in its bookmark menu.'
                }
                action={
                  totalSaved === 0
                    ? { label: 'Find companies', onClick: () => setActiveTab('list') }
                    : activeList?.id !== 'default'
                      ? { label: 'Go to All Saved', onClick: () => setActiveListId('default') }
                      : undefined
                }
              />
            </div>
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

      {variant === 'page' && selectedCompany && isDesktop && (
        <CompanyDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
      {variant === 'page' && selectedCompany && !isDesktop && (
        <CompanyBottomSheet company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};
