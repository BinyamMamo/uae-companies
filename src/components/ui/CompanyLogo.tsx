import React, { useState } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: string; text: string; pad: string; px: number }> = {
  xs: { box: 'w-8 h-8', text: 'text-[10px]', pad: 'p-1', px: 32 },
  sm: { box: 'w-9 h-9', text: 'text-[11px]', pad: 'p-1', px: 36 },
  md: { box: 'w-11 h-11', text: 'text-xs', pad: 'p-1.5', px: 44 },
  lg: { box: 'w-12 h-12', text: 'text-sm', pad: 'p-1.5', px: 48 },
};

interface CompanyLogoProps {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}

/**
 * Company logo tile with a monogram fallback.
 *
 * Replaces eight near-identical copies across the app, three of which used
 * `parentElement.innerHTML` to swap in the fallback, that injected the
 * company name as raw HTML and detached the subtree from React.
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name,
  src,
  size = 'md',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];
  const monogram = name.trim().slice(0, 2).toUpperCase();

  return (
    <div
      className={`${s.box} ${s.pad} rounded-md border border-line bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={s.px}
          height={s.px}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`${s.text} font-bold text-ink-2 leading-none`} aria-hidden="true">
          {monogram}
        </span>
      )}
    </div>
  );
};
