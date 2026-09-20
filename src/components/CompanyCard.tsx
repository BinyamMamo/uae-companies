import React from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { isCareerRelevant, countMatchingRoles, getStudentMatchLabel } from '../utils/relevance';
import { Bookmark, Scale } from 'lucide-react';
import { CompanyLogo } from './ui/CompanyLogo';
import { CommuteMeta } from './ui/CommuteMeta';
import { ProvenanceBadge } from './ui/ProvenanceBadge';

interface CompanyCardProps {
  company: Company;
  isSelected?: boolean;
}

const MAX_VISIBLE_ROLES = 4;

const CompanyCardComponent: React.FC<CompanyCardProps> = ({ company, isSelected = false }) => {
  const {
    setSelectedCompany,
    toggleSaveCompany,
    isCompanySaved,
    toggleCompareCompany,
    isCompanyInCompare,
    userInterests,
  } = useApp();

  const isSaved = isCompanySaved(company.id);
  const isCompared = isCompanyInCompare(company.id);
  const matchCount = countMatchingRoles(company.commonCareers, userInterests);
  const matchLabel = getStudentMatchLabel(matchCount);
  const hiddenRoles = company.commonCareers.length - MAX_VISIBLE_ROLES;

  return (
    /*
      The title button carries a stretched ::after, so the whole card is
      clickable while there is exactly one focusable control for it. This
      replaces a clickable <div> that sniffed `target.closest('button')` and
      was unreachable by keyboard.
    */
    <article
      className={`group relative isolate bg-surface border rounded-xl p-4 sm:p-5 transition-colors transition-shadow ${
        isSelected
          ? 'border-brand-600 ring-1 ring-brand-600 shadow-xs'
          : 'border-line hover:border-line-strong hover:shadow-subtle'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <CompanyLogo name={company.name} src={company.logo} size="md" className="sm:w-12 sm:h-12" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-ink">
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(company)}
                    className="text-left after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
                  >
                    {company.name}
                  </button>
                </h3>
                {company.location.isFreeZone && (
                  <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 border border-line">
                    Free Zone
                  </span>
                )}
              </div>

              <p className="text-xs text-ink-3 mt-1 truncate">
                {company.categories.join(' · ')}
              </p>
            </div>

            {/* Actions sit above the stretched link */}
            <div className="relative z-10 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => toggleCompareCompany(company.id)}
                aria-pressed={isCompared}
                className={`p-2 rounded-md border transition-colors ${
                  isCompared
                    ? 'bg-ink text-app border-ink'
                    : 'bg-surface text-ink-3 border-line hover:text-ink hover:bg-surface-2'
                }`}
                aria-label={
                  isCompared
                    ? `Remove ${company.name} from comparison`
                    : `Add ${company.name} to comparison`
                }
                title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
              >
                <Scale className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => toggleSaveCompany(company.id)}
                aria-pressed={isSaved}
                className={`p-2 rounded-md border transition-colors ${
                  isSaved
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/30'
                    : 'text-ink-3 border-line hover:text-ink hover:bg-surface-2'
                }`}
                aria-label={isSaved ? `Remove ${company.name} from saved` : `Save ${company.name}`}
                title={isSaved ? 'Remove from saved' : 'Save company'}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <CommuteMeta company={company} className="mt-2" />

          {company.shortDescription ? (
            <p className="text-xs sm:text-[13px] text-ink-2 mt-2 line-clamp-2 leading-relaxed">
              {company.shortDescription}
            </p>
          ) : (
            <p className="text-xs sm:text-[13px] text-ink-3 mt-2 italic">
              No verified description yet.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {company.commonCareers.slice(0, MAX_VISIBLE_ROLES).map(role => {
              const relevant = isCareerRelevant(role, userInterests);
              return (
                <span
                  key={role}
                  className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                    relevant
                      ? 'text-accent-soft-text font-medium border-accent-soft-border bg-accent-soft'
                      : 'text-ink-2 border-line bg-transparent'
                  }`}
                >
                  {role}
                </span>
              );
            })}

            {hiddenRoles > 0 && (
              <span className="text-[11px] text-ink-3 px-1">+{hiddenRoles} more</span>
            )}

            {matchLabel && (
              <span className="ml-auto text-[11px] font-medium text-brand-600 dark:text-brand-400">
                {matchLabel}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <ProvenanceBadge company={company} />
          </div>
        </div>
      </div>
    </article>
  );
};

/** 225 of these render at once — memoising keeps filter/search typing smooth. */
export const CompanyCard = React.memo(CompanyCardComponent);
