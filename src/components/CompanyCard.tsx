import React from 'react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { isCareerRelevant, countMatchingRoles, getStudentMatchLabel } from '../utils/relevance';
import { Bookmark, MapPin, Scale } from 'lucide-react';

interface CompanyCardProps {
  company: Company;
  isSelected?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, isSelected = false }) => {
  const {
    setSelectedCompany,
    toggleSaveCompany,
    isCompanySaved,
    toggleCompareCompany,
    isCompanyInCompare,
    userInterests
  } = useApp();

  const isSaved = isCompanySaved(company.id);
  const isCompared = isCompanyInCompare(company.id);
  const matchCount = countMatchingRoles(company.commonCareers, userInterests);
  const matchLabel = getStudentMatchLabel(matchCount);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    setSelectedCompany(company);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-surface border rounded-lg p-4 sm:p-5 transition-colors transition-shadow cursor-pointer group ${ isSelected ? 'border-brand-600 ring-1 ring-brand-600 shadow-xs' : 'border-slate-200 dark:border-slate-800 hover:border-line-strong hover:shadow-subtle' }`}
    >
      <div className="flex items-start justify-between gap-3">
        
        {/* Left: Logo and details */}
        <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
          
          {/* Company Logo / Avatar */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-sm border border-line bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `<span class="text-xs font-bold text-ink-2">${company.name.slice(0, 2).toUpperCase()}</span>`;
                }
              }}
            />
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-ink truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {company.name}
              </h3>
              {company.location.isFreeZone && (
                <span className="hidden sm:inline-block text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded-sm bg-surface-2 text-ink-2 border border-line">
                  Free Zone
                </span>
              )}
            </div>

            {/* Categories */}
            <div className="text-xs text-ink-2 font-normal mt-0.5 truncate">
              {company.categories.join(' · ')}
            </div>

            {/* Location & Metrics */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-ink-2 mt-1.5">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{company.location.emirate}, UAE</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span>{formatDistance(company.commute.distanceKm)}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {formatBusCommute(company.commute.busMinutes)}
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs text-ink-2 mt-2 line-clamp-2 leading-relaxed font-normal">
              {company.shortDescription}
            </p>

            {/* Career Roles with Subtle Relevance Highlights */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {company.commonCareers.slice(0, 4).map((role) => {
                const relevant = isCareerRelevant(role, userInterests);
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded transition-colors border bg-transparent ${ relevant ? 'text-brand-600 dark:text-brand-400 font-medium border-brand-500/80 dark:border-brand-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 font-normal border-slate-200 dark:border-slate-800' }`}
                  >
                    {role}
                  </span>
                );
              })}

              {company.commonCareers.length > 4 && (
                <span className="text-[10px] text-ink-3 font-normal px-1">
                  +{company.commonCareers.length - 4} more
                </span>
              )}

              {matchLabel && (
                <span className="ml-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hidden sm:inline">
                  {matchLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          
          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveCompany(company.id);
            }}
            className={`p-1.5 rounded transition-colors ${ isSaved ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-2' }`}
            title={isSaved ? 'Remove from saved' : 'Save company'}
            aria-label={isSaved ? `Unsave ${company.name}` : `Save ${company.name}`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-600 dark:fill-brand-400' : ''}`} />
          </button>

          {/* Quick Compare Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompareCompany(company.id);
            }}
            className={`p-1 text-[10px] flex items-center gap-1 rounded border transition-colors ${ isCompared ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200' : 'bg-white dark:bg-surface-2 text-ink-2 border-line hover:text-slate-800 dark:hover:text-slate-200' }`}
            title="Compare company"
            aria-label={`Compare ${company.name}`}
          >
            <Scale className="w-3 h-3" />
            <span className="hidden lg:inline">{isCompared ? 'Compared' : 'Compare'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
