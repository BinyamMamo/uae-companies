import { useState, useRef, useEffect } from 'react';
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

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 rounded-lg border text-left font-medium transition-all ${
          isSmall ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2'
        } ${
          isOpen
            ? 'border-brand-500 ring-1 ring-brand-500 bg-white dark:bg-[#18181b] text-slate-900 dark:text-white'
            : 'border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-[#3f3f46]'
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-brand-500' : ''
          }`}
        />
      </button>

      {/* Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1 min-w-full w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-popup py-1 z-50 text-slate-800 dark:text-slate-200 animate-fadeIn ${menuClassName}`}
          role="listbox"
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-500/10'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#222226] hover:text-slate-900 dark:hover:text-white'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
