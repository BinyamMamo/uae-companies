import React from 'react';

/**
 * Official LinkedIn mark, served as a file.
 *
 * lucide-react no longer ships brand icons, and brand marks should not be
 * redrawn by hand — this is svgl's copy of the official asset.
 */
export const LinkedInMark: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <img src="/linkedin.svg" alt="" width={14} height={14} className={className} aria-hidden="true" />
);
