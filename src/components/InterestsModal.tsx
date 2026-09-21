import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from './ui/Modal';
import { X } from 'lucide-react';

const SUGGESTED_DOMAINS = [
  'AI / Machine Learning',
  'Software Engineering',
  'Web Development',
  'Computer Vision',
  'Data Engineering',
  'Embedded Systems',
  'IoT',
  'Robotics',
  'Automation',
  'Cloud',
  'Cybersecurity',
  'Firmware Engineering',
  'VLSI & Semiconductors',
  'Mobile Development',
  'DevOps',
  'Networking',
];

interface InterestsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Interests get their own modal rather than a section inside Settings — they
 * are the one preference that changes what the app shows you, so they deserve
 * to be reachable in one step.
 */
export const InterestsModal: React.FC<InterestsModalProps> = ({ open, onClose }) => {
  const { userInterests, addInterest, removeInterest, resetInterests, setUserInterests } = useApp();
  const [customInterestInput, setCustomInterestInput] = useState('');

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterestInput.trim()) return;
    addInterest(customInterestInput.trim());
    setCustomInterestInput('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="interests-title"
      className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-4"
      backdropClassName="fixed inset-0 z-9999 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface rounded-xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-popup border border-line overflow-hidden text-ink">
        <header className="flex items-center justify-between gap-4 px-5 h-14 border-b border-line shrink-0">
          <h2 id="interests-title" className="text-sm font-semibold text-ink">
            Your interests
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 overflow-y-auto">
          <p className="text-xs text-ink-2 mb-4 leading-relaxed">
            Companies whose roles match these are highlighted across the app, and the Featured
            view ranks by them.
          </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-ink">
              Career Interests ({userInterests.length} active)
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={resetInterests}
                className="text-ink-2 hover:text-brand-600 dark:hover:text-brand-400 text-[11px] font-medium flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setUserInterests([])}
                className="text-slate-400 hover:text-red-600 text-[11px] transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Add Custom Form */}
          <form onSubmit={handleAddCustomInterest} className="relative flex items-center">
            <input
              type="text"
              value={customInterestInput}
              onChange={e => setCustomInterestInput(e.target.value)}
              placeholder="Add an interest (e.g. Computer Vision, ROS)..."
              className="w-full text-xs pl-3.5 pr-20 py-2 bg-surface-2 border border-line rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!customInterestInput.trim()}
              className="absolute right-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Unified Tag List */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {Array.from(new Set([...userInterests, ...SUGGESTED_DOMAINS])).map(item => {
              const isSelected = userInterests.some(
                i => i.toLowerCase() === item.toLowerCase()
              );

              if (isSelected) {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeInterest(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium bg-brand-50/90 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-500/30 hover:bg-brand-100/80 dark:hover:bg-brand-500/25 transition cursor-pointer"
                    title="Click to remove"
                  >
                    <span>{item}</span>
                    <X className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                  </button>
                );
              }

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => addInterest(item)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium bg-surface-2 text-ink-2 border border-line hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                  title="Click to add"
                >
                  <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Redesigned Divider */}
        <div className="border-t border-slate-200/80 dark:border-slate-800" />
        </div>
      </div>
    </Modal>
  );
};
