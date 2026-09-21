import React from 'react';
import { ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Company } from '../types/company';
import { useApp } from '../context/AppContext';
import { track } from '../lib/analytics';
import { isCareerRelevant } from '../utils/relevance';

interface CompanyCareersTabProps {
  company: Company;
}

/**
 * The Careers tab body, shared by the desktop drawer and the mobile sheet.
 *
 * The sheet used to carry its own copy, which quietly fell behind: it was still
 * missing the programme list and the role list long after the drawer had both.
 * One component means a phone and a laptop show the same thing.
 */
export const CompanyCareersTab: React.FC<CompanyCareersTabProps> = ({ company }) => {
  const { userInterests } = useApp();

  return (
      <div className="space-y-5">
        
        {/* Direct Careers Link, a card that only says we found nothing is
            not worth the space it takes. */}
        {company.careersUrl && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-line rounded-lg p-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-ink">
              Official Careers Portal
            </h4>
            <p className="text-xs text-ink-2 mt-0.5">
              Open roles are listed on the company’s own careers page.
            </p>
          </div>
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              onClick={() => track('careers_link_clicked', { company_id: company.id })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors shrink-0"
            >
              <span>Careers</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
        )}

        {/*
          Shows the actual scheme names when research found them, and falls
          back to a plain confirmation otherwise. Hidden entirely when
          nothing is known, rather than printing "Not confirmed" on every
          record.
        */}
        {(company.programmes.length > 0 ||
          company.internshipsKnown !== null ||
          company.graduateRolesKnown !== null) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Student &amp; graduate programmes
            </h3>

            {company.programmes.length > 0 ? (
              <ul className="space-y-1.5">
                {company.programmes.map(programme => (
                  <li
                    key={programme.name}
                    className="flex items-start gap-2 border border-line rounded-lg p-2.5 bg-surface"
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-ink">
                        {programme.name}
                      </span>
                      <span className="block text-[11px] text-ink-3 capitalize">
                        {programme.kind === 'graduate' ? 'Graduate scheme' : 'Internship'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {company.internshipsKnown !== null && (
                  <div className="border border-line rounded-lg p-3 bg-surface">
                    <span className="text-[10px] text-ink-3 font-semibold uppercase tracking-wider block">
                      Internships
                    </span>
                    <span className="text-xs font-semibold text-ink mt-1 block">
                      {company.internshipsKnown ? 'Offered' : 'None listed'}
                    </span>
                  </div>
                )}
                {company.graduateRolesKnown !== null && (
                  <div className="border border-line rounded-lg p-3 bg-surface">
                    <span className="text-[10px] text-ink-3 font-semibold uppercase tracking-wider block">
                      Graduate roles
                    </span>
                    <span className="text-xs font-semibold text-ink mt-1 block">
                      {company.graduateRolesKnown ? 'Offered' : 'None listed'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Technical Career Roles List, only for records where the roles
            were actually verified; most companies have none. */}
        {company.commonCareers.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">
            Technical Career Paths
          </h3>
          <div className="space-y-2">
            {company.commonCareers.map((role) => {
              const relevant = isCareerRelevant(role, userInterests);
              return (
                <div
                  key={role}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${ relevant ? 'bg-accent-soft border-accent-soft-border' : 'bg-surface border-line' }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-ink block">
                      {role}
                    </span>
                    <span className="text-[11px] text-ink-2">
                      {relevant ? 'Matches your interests' : 'Related role'}
                    </span>
                  </div>
                  {company.careersUrl && (
                    <a
                      href={`${company.careersUrl}?q=${encodeURIComponent(role)}`}
                      onClick={() => track('careers_link_clicked', { company_id: company.id, role })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium flex items-center gap-1 shrink-0"
                      aria-label={`Search ${role} roles at ${company.name}`}
                    >
                      <span>Search</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>
  );
};
