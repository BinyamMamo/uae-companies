import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/ui/EmptyState';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { EXPLORABLE_INTERESTS, calculateStudentFitScore } from '../utils/relevance';
import { formatBusCommute, formatDistance } from '../utils/distance';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyBottomSheet } from '../components/CompanyBottomSheet';
import { MapPin, Bookmark, Sparkles } from 'lucide-react';
import { CompanyLogo } from '../components/ui/CompanyLogo';

export const FeaturedView: React.FC = () => {
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    userInterests,
    setUserInterests,
    toggleSaveCompany,
    isCompanySaved,
    resetInterests
  } = useApp();
  const isDesktop = useIsDesktop();

  const toggleInterest = (interest: string) => {
    setUserInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Rank companies dynamically based on active user interests in real time
  const rankedCompanies = useMemo(() => {
    return companies
      .map(company => {
        const fitScore = calculateStudentFitScore(
          company.categories,
          company.technicalAreas,
          company.commonCareers,
          userInterests
        );
        return { company, fitScore };
      })
      .filter(item => item.fitScore > 0)
      .sort((a, b) => b.fitScore - a.fitScore || a.company.commute.distanceKm - b.company.commute.distanceKm)
      .slice(0, 12)
      .map(item => item.company);
  }, [companies, userInterests]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Personalization Section (clean, restrained, no pill cards, no button) */}
      <section className="bg-surface border border-line rounded-lg p-6 sm:p-7 shadow-subtle mb-8">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Choose what you&rsquo;re interested in
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 mt-1.5 leading-relaxed">
            Choose the technical areas you want to explore and companies will re-rank instantly to match your skills.
          </p>
        </div>

        {/* Interests Selector - Modest rectangular buttons with subtle rounding */}
        <div className="mt-5 flex flex-wrap gap-2">
          {EXPLORABLE_INTERESTS.map(interest => {
            const isSelected = userInterests.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 text-xs rounded border font-medium transition-colors ${ isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs' : 'bg-slate-50 dark:bg-slate-800 text-ink-2 border-line hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300' }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid of matched companies */}
      <section>
        {rankedCompanies.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title={userInterests.length === 0 ? 'Pick an interest to start' : 'No matches for these interests'}
            description={
              userInterests.length === 0
                ? 'Choose one or more areas above and we will rank companies by how well they fit.'
                : 'None of the companies we have match these interests yet. Try adding a broader one.'
            }
            action={
              userInterests.length > 0
                ? { label: 'Reset interests', onClick: resetInterests }
                : undefined
            }
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {rankedCompanies.map(company => {
            const isSaved = isCompanySaved(company.id);

            return (
              <div
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className="bg-surface border border-line hover:border-line-strong rounded-lg p-4 shadow-subtle hover:shadow-xs transition-colors transition-shadow cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Logo, Name, Bookmark */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <CompanyLogo name={company.name} src={company.logo} size="sm" />
                      <div>
                        <h3 className="text-sm font-semibold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {company.name}
                        </h3>
                        <div className="text-xs text-ink-2 font-normal">
                          {company.categories.slice(0, 2).join(' · ')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveCompany(company.id);
                      }}
                      className={`p-1.5 rounded transition ${ isSaved ? 'text-brand-600 dark:text-brand-400 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' }`}
                      aria-label={isSaved ? `Unsave ${company.name}` : `Save ${company.name}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-600 dark:fill-brand-400' : ''}`} />
                    </button>
                  </div>

                  {/* Location & Commute */}
                  <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-2.5">
                    <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                    <span>{company.location.area}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{formatDistance(company.commute.distanceKm)}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-medium text-ink-2">{formatBusCommute(company.commute.busMinutes)}</span>
                  </div>

                  {/* Image banner preview if available */}
                  {company.bannerImage && (
                    <div className="w-full h-24 rounded-sm mt-3 overflow-hidden bg-surface-2 relative">
                      <img
                        src={company.bannerImage}
                        alt={`${company.name} facility`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Student Match Reason */}
                  {company.studentMatchReason && (
                    <p className="text-xs text-ink-2 mt-3 leading-relaxed line-clamp-2">
                      {company.studentMatchReason}
                    </p>
                  )}
                </div>

                {/* Career Tags */}
                <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-1.5">
                  {company.commonCareers.slice(0, 3).map(role => (
                    <span
                      key={role}
                      className="px-2 py-0.5 text-[11px] rounded-sm bg-slate-50 dark:bg-slate-800 text-ink-2 border border-line"
                    >
                      {role}
                    </span>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Detail Drawer (Desktop) */}
      {selectedCompany && isDesktop && (
          <CompanyDrawer
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        )}

      {/* Bottom Sheet (Mobile) */}
      {selectedCompany && !isDesktop && (
          <CompanyBottomSheet
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

    </div>
  );
};
