import React, { useId, useRef } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * Tablist with roving focus and arrow-key navigation.
 *
 * The drawer and bottom sheet previously rendered bare <button>s with no
 * role, no aria-selected and no keyboard model, so assistive tech had no way
 * to tell they were tabs.
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: TabBarProps<T>) {
  const groupId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const index = tabs.findIndex(t => t.id === active);
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;

    e.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-6 overflow-x-auto ${className}`}
    >
      {tabs.map(tab => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={el => {
              refs.current[tab.id] = el;
            }}
            id={`${groupId}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${groupId}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors shrink-0 ${
              selected
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
