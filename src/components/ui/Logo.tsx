import React from 'react';

interface LogoProps {
  className?: string;
  /** Decorative by default, the wordmark beside it carries the name. */
  title?: string;
}

/**
 * Product mark: a map pin containing a briefcase.
 *
 * The pin carries the "where is it / how far" idea the app is built around;
 * the briefcase says these are employers, not properties.
 *
 * Inlined rather than served as a file so it inherits `currentColor`, which
 * makes it follow both the theme and the user's chosen accent. It replaces two
 * 31KB PNGs (one per theme) that both downloaded on every visit and rendered
 * as an indistinct blob at 32px.
 */
export const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', title }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    {title && <title>{title}</title>}
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 2C9.92 2 5 6.92 5 13c0 8.25 11 17 11 17s11-8.75 11-17C27 6.92 22.08 2 16 2Zm-2.4 7.2h4.8v1.6h2.8v7.6H10.8v-7.6h2.8V9.2Zm1.6 1.6h1.6v-.4h-1.6v.4Z"
    />
  </svg>
);
