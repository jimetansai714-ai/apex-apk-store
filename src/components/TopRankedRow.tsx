import React, { useState } from 'react';
import { Star, Download, Link2, Check } from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';

interface Props {
  app: APKApp;
  rank: number;
  onSelect: (app: APKApp) => void;
  onQuickDownload: (app: APKApp, e: React.MouseEvent) => void;
  language: Language;
}

export const TopRankedRow: React.FC<Props> = ({
  app,
  rank,
  onSelect,
  onQuickDownload,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div
      onClick={() => onSelect(app)}
      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100/90 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <span
          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs tabular-nums shrink-0 transition-transform group-hover:scale-105 ${
            rank === 1
              ? 'bg-amber-400 text-slate-950 font-black shadow-sm shadow-amber-400/30'
              : rank === 2
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold'
              : rank === 3
              ? 'bg-amber-700/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
              : 'text-slate-400 dark:text-slate-500 font-semibold'
          }`}
        >
          {rank}
        </span>

        <AppIconRenderer app={app} size="sm" className="group-hover:scale-105 transition-transform" />

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            {language === 'my' && app.nameMy ? app.nameMy : app.name}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{app.categoryName}</span>
            <span>·</span>
            <div className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="tabular-nums font-medium">{app.rating}</span>
            </div>
            <span>·</span>
            <span className="tabular-nums font-mono text-[11px]">{app.size}</span>
            <span>·</span>
            <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
              {formatExactDownloads(app.downloadCount, language)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-3 shrink-0">
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

        <button
          onClick={(e) => onQuickDownload(app, e)}
          title={language === 'my' ? 'ဒေါင်းလုဒ်ရယူရန်' : 'Download APK'}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Download size={13} className="stroke-[2]" />
          <span>APK</span>
        </button>
      </div>
    </div>
  );
};
