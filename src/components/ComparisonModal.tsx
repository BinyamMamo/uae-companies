import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDistance } from '../utils/distance';
import { X, Plus, Search } from 'lucide-react';
import { Modal } from './ui/Modal';
import { CompanyLogo } from './ui/CompanyLogo';

/**
 * Side-by-side comparison.
 *
 * Deliberately plain: the job of this view is to let you read across a row and
 * spot a difference. Earlier it wrapped almost every value in a coloured pill,
 * which made everything look equally important and nothing scannable. Values
 * are now text, hierarchy comes from weight and spacing, and colour is kept for
 * the one thing it should mark — a match against your interests.
 */

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <tr className="align-top">
    <th
      scope="row"
      className="py-4 pr-4 text-left text-[11px] font-medium text-ink-3 uppercase tracking-wider whitespace-nowrap w-36 align-top"
    >
      {label}
    </th>
    {children}
  </tr>
);

const Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="py-4 pr-6 text-xs text-ink-2 min-w-[190px] align-top">{children}</td>
);

const List: React.FC<{ items: string[]; empty?: string }> = ({ items, empty = '—' }) =>
  items.length === 0 ? (
    <span className="text-ink-3">{empty}</span>
  ) : (
    <span className="text-ink-2 leading-relaxed">{items.join(' · ')}</span>
  );

export const ComparisonModal: React.FC = () => {
  const {
    companies,
    compareCompanyIds,
    toggleCompareCompany,
    clearCompare,
    isCompareModalOpen,
    setIsCompareModalOpen,
    setSelectedCompany,
    userLocation,
  } = useApp();

  const compared = compareCompanyIds
    .map(id => companies.find(c => c.id === id))
    .filter((c): c is (typeof companies)[number] => Boolean(c));

  const [query, setQuery] = useState('');

  const MAX = 4;
  const canAdd = compared.length < MAX;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return companies
      .filter(c => !compareCompanyIds.includes(c.id) && c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [companies, compareCompanyIds, query]);

  const programme = (known: boolean | null) =>
    known === true ? 'Confirmed' : known === false ? 'None listed' : 'Not confirmed';

  return (
    <Modal
      open={isCompareModalOpen}
      onClose={() => setIsCompareModalOpen(false)}
      label="Compare companies"
      className="fixed inset-0 z-10000 flex items-center justify-center p-4"
      backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface rounded-xl max-w-5xl w-full max-h-[90dvh] flex flex-col shadow-popup border border-line overflow-hidden text-ink">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-sm font-semibold text-ink">
            Compare
            <span className="text-ink-3 font-normal"> · {compared.length} selected</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={clearCompare}
              className="px-2 py-1 text-xs font-medium text-ink-3 hover:text-ink transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Close comparison"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {canAdd && (
          <div className="px-6 pt-4 pb-1 shrink-0">
            <div className="relative">
              <Search
                className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="compare-add" className="sr-only">
                Add a company to the comparison
              </label>
              <input
                id="compare-add"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={
                  compared.length === 0
                    ? 'Search for a company to compare'
                    : `Add another (up to ${MAX})`
                }
                className="w-full pl-6 pr-2 py-2 bg-transparent border-0 border-b border-line rounded-none text-xs text-ink placeholder:text-ink-3 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 z-10 bg-surface border border-line rounded-lg shadow-popup overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          toggleCompareCompany(c.id);
                          setQuery('');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
                        <span className="text-xs text-ink truncate">{c.name}</span>
                        <span className="ml-auto text-[11px] text-ink-3 shrink-0">
                          {c.location.area}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {compared.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-ink">Nothing to compare yet</p>
            <p className="text-xs text-ink-2 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Search above, or use the scales icon on any company card to add it here.
            </p>
          </div>
        ) : (
        <div className="overflow-auto px-6">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Selected companies compared across commute, programmes and roles
            </caption>

            <thead>
              <tr>
                <td className="w-36" />
                {compared.map(c => (
                  <th key={c.id} scope="col" className="py-5 pr-6 text-left min-w-[190px] align-top">
                    <div className="flex items-start gap-2.5">
                      <CompanyLogo name={c.name} src={c.logo} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink leading-snug">{c.name}</div>
                        <button
                          onClick={() => toggleCompareCompany(c.id)}
                          className="mt-0.5 text-[11px] text-ink-3 hover:text-ink transition-colors"
                          aria-label={`Remove ${c.name} from comparison`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              <Row label="Match">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <span className="text-sm font-semibold text-ink tabular-nums">
                      {c.relevanceScore}
                    </span>
                    <span className="text-ink-3">/100</span>
                  </Cell>
                ))}
              </Row>

              <Row label="Focus">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <List items={c.categories} />
                  </Cell>
                ))}
              </Row>

              <Row label={`From ${userLocation.name}`}>
                {compared.map(c => (
                  <Cell key={c.id}>
                    <div className="text-sm font-semibold text-ink">
                      {formatDistance(c.commute.distanceKm)}
                    </div>
                    <div className="mt-0.5 text-ink-3">{c.location.area}</div>
                  </Cell>
                ))}
              </Row>

              <Row label="Free zone">
                {compared.map(c => (
                  <Cell key={c.id}>
                    {c.location.isFreeZone ? (
                      <span className="text-ink-2">{c.location.freeZoneName ?? 'Yes'}</span>
                    ) : (
                      <span className="text-ink-3">Mainland</span>
                    )}
                  </Cell>
                ))}
              </Row>

              <Row label="Programmes">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <div>Internships: {programme(c.internshipsKnown)}</div>
                    <div className="mt-0.5">Graduate: {programme(c.graduateRolesKnown)}</div>
                  </Cell>
                ))}
              </Row>

              <Row label="Tech">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <List items={c.technicalAreas} />
                  </Cell>
                ))}
              </Row>

              <Row label="Roles">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <List items={c.commonCareers} />
                  </Cell>
                ))}
              </Row>

              <Row label="">
                {compared.map(c => (
                  <Cell key={c.id}>
                    <button
                      // Leaves the comparison open behind the drawer, so you
                      // can read one company and come straight back.
                      onClick={() => setSelectedCompany(c)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline underline-offset-2"
                    >
                      View details →
                    </button>
                  </Cell>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
        )}
      </div>
    </Modal>
  );
};
