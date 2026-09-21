import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SaveToListMenuProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  /** The button the menu hangs off; used to position the portalled panel. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

/**
 * Pick which lists a company belongs to.
 *
 * Lists were previously creatable but unfillable, `addCompanyToList` existed
 * in context and was called by nothing, so every list except "All Saved" stayed
 * permanently empty. Saving now goes through here.
 */
export const SaveToListMenu: React.FC<SaveToListMenuProps> = ({
  companyId,
  companyName,
  onClose,
  anchorRef,
}) => {
  const { savedLists, listsContaining, addCompanyToList, removeCompanyFromList, createSavedList } =
    useApp();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  /*
    Rendered in a portal because the company card sets `content-visibility`,
    which implies paint containment and clipped this panel to the card.
    Position is measured from the trigger and flipped if it would overflow.
  */
  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const width = 240;
      const estHeight = panelRef.current?.offsetHeight ?? 260;
      const gap = 8;

      let left = r.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

      let top = r.bottom + gap;
      if (top + estHeight > window.innerHeight - 8) {
        top = Math.max(8, r.top - estHeight - gap);
      }
      setPos({ top, left });
    };

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchorRef]);

  const memberOf = new Set(listsContaining(companyId));

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchorRef]);

  useEffect(() => {
    if (creating) newNameRef.current?.focus();
  }, [creating]);

  const submitNewList = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createSavedList(name, [companyId]);
    setNewName('');
    setCreating(false);
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Save ${companyName} to a list`}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="fixed w-60 bg-surface border border-line rounded-xl shadow-popup overflow-hidden z-10015 animate-fade-in"
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
        <span className="text-xs font-semibold text-ink">Save to</span>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded text-ink-3 hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <ul className="max-h-56 overflow-y-auto py-1">
        {savedLists.map(list => {
          const checked = memberOf.has(list.id);
          return (
            <li key={list.id}>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                onClick={() =>
                  checked
                    ? removeCompanyFromList(list.id, companyId)
                    : addCompanyToList(list.id, companyId)
                }
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-line-strong text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" aria-hidden="true" />
                </span>
                <span className="text-xs text-ink truncate flex-1">{list.name}</span>
                <span className="text-[11px] text-ink-3 shrink-0">{list.companyIds.length}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line">
        {creating ? (
          <form onSubmit={submitNewList} className="p-2 flex items-center gap-1.5">
            <label htmlFor="new-list-name" className="sr-only">
              New list name
            </label>
            <input
              id="new-list-name"
              ref={newNameRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setCreating(false);
                }
              }}
              placeholder="List name"
              className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-surface-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white transition-colors"
            >
              Add
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>New list</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};
