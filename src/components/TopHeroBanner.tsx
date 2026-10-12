import React, { useState } from 'react';
import { 
  Download, 
  ShieldCheck, 
  Star, 
  Trophy, 
  Flame, 
  ChevronRight,
  Link2,
  Check
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';

interface Props {
  topApp: APKApp;
  runnerUps: APKApp[];
  onSelectApp: (app: APKApp) => void;
  onQuickDownload: (app: APKApp, e: React.MouseEvent) => void;
  language: Language;
}

export const TopHeroBanner: React.FC<Props> = ({
  topApp,
  runnerUps,
  onSelectApp,
  onQuickDownload,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  if (!topApp) return null;

  return (
    <section className="relative w-full rounded-2xl overflow-hidden mb-8 border border-slate-200/80 dark:border-slate-800 shadow-sm bg-slate-950 text-white">
      {/* Sleek background gradient mesh */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${topApp.bannerBg || 'from-emerald-950 via-slate-900 to-slate-950'} opacity-90 transition-all duration-500`} 
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

      {/* Compact Main Showcase Container */}
      <div className="relative z-10 p-5 sm:p-6 md:p-7">
        
        {/* Top Mini Header: Trophy & Status */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wide">
              <Trophy size={12} className="stroke-[2.5]" />
              <span>{language === 'my' ? '#1 ဒေါင်းလုဒ်အများဆုံး' : '#1 MOST DOWNLOADED'}</span>
            </span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              {language === 'my' ? 'ဝဘ်ဆိုက်တွင် ဒေါင်းလုဒ်အများဆုံး ရရှိထားသော အက်ပ်' : 'Top trending package across entire store'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck size={13} />
            <span>P-Store Verified Clean</span>
          </div>
        </div>

        {/* Content Row: App Icon + Information + Download Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          
          {/* App Info Lockup */}
          <div className="flex items-center gap-4 min-w-0">
            <AppIconRenderer 
              app={topApp} 
              size="lg" 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-2 ring-white/10 shadow-lg shrink-0" 
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-0.5">
                <span>{topApp.categoryName}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-slate-300 text-[11px]">{topApp.version}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                {language === 'my' && topApp.nameMy ? topApp.nameMy : topApp.name}
              </h2>

              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                {topApp.developer}
              </p>

              {/* Compact horizontal stats */}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star size={13} className="fill-amber-300" />
                  <span className="tabular-nums">{topApp.rating}</span>
                </div>
                <span>·</span>
                <span className="font-bold text-emerald-400 tabular-nums">{formatExactDownloads(topApp.downloadCount, language)}</span>
                <span>·</span>
                <span className="font-mono tabular-nums text-slate-300">{topApp.size}</span>
                <span>·</span>
                <span className="text-slate-400 text-[11px]">{topApp.minAndroid}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
            <button
              onClick={(e) => onQuickDownload(topApp, e)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Download size={15} className="stroke-[2.5]" />
              <span>
                {language === 'my' 
                  ? `APK ဒေါင်းလုဒ် (${topApp.size})` 
                  : `Download APK (${topApp.size})`}
              </span>
            </button>

            <button
              onClick={() => onSelectApp(topApp)}
              className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium text-xs sm:text-sm backdrop-blur-sm transition-colors cursor-pointer"
            >
              {language === 'my' ? 'အသေးစိတ်' : 'Details'}
            </button>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                await copyAppShareUrl(topApp);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              title={language === 'my' ? 'တိုက်ရိုက်လင့်ခ် ကူးယူမည်' : 'Copy Direct Share Link'}
              className={`p-2.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
          </div>

        </div>

        {/* Compact runner-ups footer strip (#2 and #3) */}
        {runnerUps && runnerUps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-[11px] uppercase tracking-wider">
                {language === 'my' ? 'နောက်ထပ် ထိပ်တန်းများ:' : 'Top Runners:'}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
              {runnerUps.slice(0, 2).map((runner, index) => (
                <div
                  key={runner.id}
                  onClick={() => onSelectApp(runner)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 transition-colors cursor-pointer group shrink-0"
                >
                  <span className="font-bold text-amber-400/90 text-xs">#{index + 2}</span>
                  <AppIconRenderer app={runner} size="sm" className="w-5 h-5 rounded-md" />
                  <span className="font-medium text-slate-200 text-xs truncate max-w-[120px]">
                    {language === 'my' && runner.nameMy ? runner.nameMy : runner.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">{runner.downloads}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
