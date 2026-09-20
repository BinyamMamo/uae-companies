import React from 'react';

/**
 * Official Google "G", served as a file rather than inlined — the source SVG
 * defines gradients with ids a–s, which would collide with any other inlined
 * SVG on the page.
 */
export const GoogleMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <img src="/google.svg" alt="" width={16} height={16} className={className} aria-hidden="true" />
);
