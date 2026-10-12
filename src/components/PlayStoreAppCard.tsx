import React, { useState } from 'react';
import { Star, Download, Link2, Check, Heart } from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';

interface Props {
  app: APKApp;
  onSelect: (app: APKApp) => void;
  onQuickDownload?: (app: APKApp, e: React.MouseEvent) => void;
  language: Language;
  isWishlisted?: boolean;
  onToggleWishlist?: (appId: string) => void;
}

/**
 * Google Play Store style Vertical Card for "Recommended for you"
 * Exactly matching the user's screenshot (photo_2026-10-05_15-34-52.jpg):
 * - Large squircle icon
 * - 2-line clean App Name
 * - Rating with Star (e.g. 4.8 ★)
 */
export const PlayStoreAppCard: React.FC<Props> = ({
  app,
  onSelect,
  onQuickDownload,
  language,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  return (
    <div
      onClick={() => onSelect(app)}
      className="group relative flex flex-col w-28 sm:w-32 shrink-0 cursor-pointer select-none transition-transform active:scale-95"
    >
      {/* Play Store Squircle Icon + Floating Heart */}
      <div className="relative mx-auto group-hover:scale-[1.03] transition-transform duration-200">
        <AppIconRenderer app={app} size="xl" className="shadow-sm" />
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(app.id);
            }}
            title={isWishlisted ? 'Remove favorite' : 'Save to favorites'}
            className="absolute -top-1 -right-1 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Heart size={13} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        )}
      </div>

      {/* App Title (2-line clamp like Play Store) */}
      <h3 className="mt-2 text-xs sm:text-[13px] font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {language === 'my' && app.nameMy ? app.nameMy : app.name}
      </h3>

      {/* Category / Rating / Downloads */}
      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{app.rating}</span>
        <Star size={11} className="fill-amber-400 text-amber-400" />
        <span aria-hidden="true">·</span>
        <span className="tabular-nums text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{formatExactDownloads(app.downloadCount, language)}</span>
      </div>
    </div>
  );
};

/**
 * Google Play Store style Horizontal List Row for "Suggested for you"
 * Exactly matching the user's screenshot:
 * - Squircle Icon
 * - Title + Category/Status
 * - Clean Install / Download action
 */
export const PlayStoreListRow: React.FC<Props> = ({
  app,
  onSelect,
  onQuickDownload,
  language,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div
      onClick={() => onSelect(app)}
      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none gap-3"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <AppIconRenderer app={app} size="md" className="group-hover:scale-105 transition-transform" />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {language === 'my' && app.nameMy ? app.nameMy : app.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {app.categoryName} • {app.version} • {app.size}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">{app.rating}</span>
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span aria-hidden="true">·</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatExactDownloads(app.downloadCount, language)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(app.id);
            }}
            title={isWishlisted ? 'Remove favorite' : 'Save to favorites'}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Heart size={14} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        )}

        <button
          onClick={async (e) => {
            e.stopPropagation();
            await copyAppShareUrl(app);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title={language === 'my' ? 'တိုက်ရိုက်လင့်ခ် ကူးယူမည်' : 'Copy Direct Share Link'}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          {copied ? <Check size={13} /> : <Link2 size={13} />}
        </button>

        {onQuickDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickDownload(app, e);
            }}
            className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            {language === 'my' ? 'ဒေါင်းလုဒ်' : 'Install'}
          </button>
        )}
      </div>
    </div>
  );
};
