import React, { useState } from 'react';
import type { Company } from '../types/company';
import { X, Copy, Check, Share2, Link } from 'lucide-react';

interface ShareListModalProps {
  listName: string;
  companies: Company[];
  onClose: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({ listName, companies, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNames, setCopiedNames] = useState(false);

  // Construct shareable URL
  const shareableUrl = `${window.location.origin}${window.location.pathname}?share_name=${encodeURIComponent(listName)}&share_ids=${companies.map(c => c.id).join(',')}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyNames = async () => {
    try {
      const text = companies.map(c => c.name).join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedNames(true);
      setTimeout(() => setCopiedNames(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-popup border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Share List: &ldquo;{listName}&rdquo;
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shareable Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-2 text-slate-600 dark:text-slate-300 truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shrink-0 flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company Names ({companies.length})
              </label>
              <button
                onClick={handleCopyNames}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 font-semibold flex items-center gap-1"
              >
                {copiedNames ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNames ? 'Copied names!' : 'Copy company names'}</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-3 text-xs text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto space-y-1 font-mono">
              {companies.map((c, i) => (
                <div key={c.id} className="truncate">
                  {i + 1}. {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
