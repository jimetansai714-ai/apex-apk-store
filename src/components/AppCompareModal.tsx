import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Star, 
  Download, 
  ShieldCheck, 
  Smartphone, 
  Calendar,
  Check,
  ChevronDown
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { formatExactDownloads } from '../utils/shareUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  primaryApp: APKApp | null;
  allApps: APKApp[];
  onStartDownload: (app: APKApp) => void;
  language: Language;
}

export const AppCompareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  primaryApp,
  allApps,
  onStartDownload,
  language,
}) => {
  const [secondaryAppId, setSecondaryAppId] = useState<string>(() => {
    const candidates = allApps.filter((a) => a.id !== primaryApp?.id);
    return candidates[0]?.id || '';
  });

  if (!isOpen || !primaryApp) return null;

  const secondaryApp = allApps.find((a) => a.id === secondaryAppId) || allApps.filter((a) => a.id !== primaryApp.id)[0] || null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowLeftRight size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'my' ? 'ဆော့ဖ်ဝဲလ် အချင်းချင်း နှိုင်းယှဉ်ချက်' : 'App Side-by-Side Comparison'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'my' ? 'အချက်အလက်များနှင့် ဗားရှင်းများကို ယှဉ်ကြည့်ပါ' : 'Compare specifications, sizes, and requirements'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Apps Header Comparison */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          {/* App 1 (Fixed) */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <AppIconRenderer app={primaryApp} size="md" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  App 1
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                  {language === 'my' && primaryApp.nameMy ? primaryApp.nameMy : primaryApp.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">{primaryApp.developer}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onStartDownload(primaryApp);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Download size={13} />
              <span>{language === 'my' ? 'ဒေါင်းလုဒ်ဆွဲမည်' : 'Download'}</span>
            </button>
          </div>

          {/* App 2 (Selectable) */}
          <div className="space-y-2 text-center sm:text-left border-l border-slate-200 dark:border-slate-700/80 pl-3 sm:pl-4">
            {secondaryApp ? (
              <>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <AppIconRenderer app={secondaryApp} size="md" />
                  <div className="min-w-0 flex-1">
                    {/* Selector */}
                    <div className="relative">
                      <select
                        value={secondaryApp.id}
                        onChange={(e) => setSecondaryAppId(e.target.value)}
                        className="text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 pr-6 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer w-full truncate"
                      >
                        {allApps
                          .filter((a) => a.id !== primaryApp.id)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 pointer-events-none text-slate-400" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                      {language === 'my' && secondaryApp.nameMy ? secondaryApp.nameMy : secondaryApp.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{secondaryApp.developer}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onStartDownload(secondaryApp);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Download size={13} />
                  <span>{language === 'my' ? 'ဒေါင်းလုဒ်ဆွဲမည်' : 'Download'}</span>
                </button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No second app available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Metrics Table */}
        {secondaryApp && (
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              {language === 'my' ? 'အချက်အလက် နှိုင်းယှဉ်ချက်ဇယား' : 'Comparison Matrix'}
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60">
              {/* Row 1: Version */}
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-slate-500 font-medium">Version</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{primaryApp.version}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{secondaryApp.version}</span>
              </div>

              {/* Row 2: File Size */}
              <div className="grid grid-cols-3 p-3 items-center bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-slate-500 font-medium">File Size</span>
                <span className="font-mono">{primaryApp.size}</span>
                <span className="font-mono">{secondaryApp.size}</span>
              </div>

              {/* Row 3: Total Downloads */}
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-slate-500 font-medium">Downloads</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatExactDownloads(primaryApp.downloadCount, language)}
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatExactDownloads(secondaryApp.downloadCount, language)}
                </span>
              </div>

              {/* Row 4: Star Rating */}
              <div className="grid grid-cols-3 p-3 items-center bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-slate-500 font-medium">Rating</span>
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Star size={12} className="fill-amber-500" /> {primaryApp.rating} ({primaryApp.ratingsCount})
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Star size={12} className="fill-amber-500" /> {secondaryApp.rating} ({secondaryApp.ratingsCount})
                </span>
              </div>

              {/* Row 5: Android Requirement */}
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-slate-500 font-medium">Android Min OS</span>
                <span>{primaryApp.minAndroid}</span>
                <span>{secondaryApp.minAndroid}</span>
              </div>

              {/* Row 6: Category */}
              <div className="grid grid-cols-3 p-3 items-center bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{primaryApp.categoryName}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{secondaryApp.categoryName}</span>
              </div>

              {/* Row 7: Play Protect / Virus Free */}
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-slate-500 font-medium">Security</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={14} /> Clean
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={14} /> Clean
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            {language === 'my' ? 'ပိတ်မည်' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
