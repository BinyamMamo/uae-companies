import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string | number = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
}

export function Dropdown<T extends string | number = string>({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'sm'
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // The menu is rendered into <body>, because these live inside the filter
  // sheet, which is an `overflow-y-auto` box — an absolutely positioned menu
  // was simply clipped by it. Being in the body means positioning by hand.
  const placeMenu = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 240;
    const below = window.innerHeight - r.bottom;
    // Flip above when there is no room below, the way a native select does.
    const top = below < menuH + 8 && r.top > below ? r.top - menuH - 4 : r.bottom + 4;
    setMenuPos({ top, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    placeMenu();
    // Any scroll under the menu moves the anchor, including the sheet's own.
    window.addEventListener('scroll', placeMenu, true);
    window.addEventListener('resize', placeMenu);
    return () => {
      window.removeEventListener('scroll', placeMenu, true);
      window.removeEventListener('resize', placeMenu);
    };
  }, [isOpen, placeMenu]);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(t) &&
        !(menuRef.current && menuRef.current.contains(t))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 rounded-lg border text-left font-medium transition-colors ${ isSmall ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2' } ${ isOpen ? 'border-brand-500 ring-1 ring-brand-500 bg-surface text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700' } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${ isOpen ? 'rotate-180 text-brand-500' : '' }`}
        />
      </button>

      {/* Menu Popover — portalled so no scroll container can clip it */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos?.top ?? -9999,
            left: menuPos?.left ?? -9999,
            width: menuPos?.width,
            visibility: menuPos ? 'visible' : 'hidden',
          }}
          className={`max-h-60 overflow-y-auto rounded-lg border border-line bg-surface shadow-popup py-1 z-10030 text-ink animate-fade-in ${menuClassName}`}
          role="listbox"
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${ isSelected ? 'font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-500/10' : 'text-slate-700 dark:text-slate-300 hover:bg-surface-2 hover:text-slate-900 dark:hover:text-white' }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Dropdown;
