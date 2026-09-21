import React from 'react';
import { LinkedInMark } from './LinkedInMark';

export const AUTHOR_LINKEDIN = 'https://www.linkedin.com/in/binyammamo';
export const PROJECT_REPO = 'https://github.com/BinyamMamo/uae-companies';

/**
 * Official GitHub mark, served as a file like the LinkedIn one.
 *
 * lucide no longer ships brand icons and svgl's copy carries a fixed dark fill,
 * so it is an <img> rather than inline SVG. That means it cannot take
 * currentColor, hence the dark-mode inversion below rather than a fill swap.
 */
const GitHubMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <img
    src="/github.svg"
    alt=""
    width={16}
    height={16}
    className={`${className} dark:invert`}
    aria-hidden="true"
  />
);

interface SocialLinksProps {
  className?: string;
}

/** Who made this and where the code lives. */
export const SocialLinks: React.FC<SocialLinksProps> = ({ className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <a
      href={AUTHOR_LINKEDIN}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Binyam Mamo on LinkedIn"
      title="Binyam Mamo on LinkedIn"
      className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
    >
      <LinkedInMark className="w-4 h-4" />
    </a>
    <a
      href={PROJECT_REPO}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Source code on GitHub"
      title="Source code on GitHub"
      className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
    >
      <GitHubMark />
    </a>
  </div>
);
