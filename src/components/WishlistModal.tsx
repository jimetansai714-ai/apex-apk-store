import React from 'react';
import { 
  X, 
  Heart, 
  Download, 
  Trash2, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { formatExactDownloads } from '../utils/shareUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wishlistApps: APKApp[];
  onRemove: (appId: string) => void;
  onClear: () => void;
  onSelectApp: (app: APKApp) => void;
  onStartDownload: (app: APKApp) => void;
  language: Language;
}

export const WishlistModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wishlistApps,
  onRemove,
  onClear,
  onSelectApp,
  onStartDownload,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart size={20} className="fill-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'my' ? 'သိမ်းဆည်းထားသော အကြိုက်ဆုံးများ' : 'My Saved Collection'}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold">
                  {wishlistApps.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'my' ? 'သင့်ဖုန်းတွင် သွင်းယူရန် စုဆောင်းထားသော အက်ပ်များ' : 'Your saved apps ready for fast install'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {wishlistApps.length > 0 && (
              <button
                onClick={onClear}
                title={language === 'my' ? 'စာရင်း အားလုံးရှင်းမည်' : 'Clear All'}
                className="p-1.5 text-xs text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {wishlistApps.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <Heart size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {language === 'my' ? 'သိမ်းဆည်းထားသော အက်ပ် မရှိသေးပါ' : 'Your collection is empty'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {language === 'my' 
                  ? 'အက်ပ်ကတ်ပြားများရှိ အသည်းပုံ (❤️) ကို နှိပ်ပြီး နှစ်သက်သော APK များကို သိမ်းဆည်းထားနိုင်ပါသည်' 
                  : 'Tap the heart icon on any app to bookmark it for quick access later.'}
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all mt-2"
              >
                <span>{language === 'my' ? 'အက်ပ်များ လေ့လာမည်' : 'Explore Apps'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            wishlistApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  onClose();
                  onSelectApp(app);
                }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AppIconRenderer app={app} size="md" className="group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {language === 'my' && app.nameMy ? app.nameMy : app.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{app.version}</span>
                      <span>·</span>
                      <span className="font-mono">{app.size}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star size={10} className="fill-amber-500" /> {app.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartDownload(app);
                    }}
                    title={language === 'my' ? 'ဒေါင်းလုဒ်ဆွဲမည်' : 'Download APK'}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    <Download size={14} className="stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(app.id)}
                    title={language === 'my' ? 'ဖယ်ရှားမည်' : 'Remove from collection'}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistApps.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck size={14} />
              <span>{language === 'my' ? 'ဗိုင်းရပ်စ်ကင်းစင်ပြီး စစ်ဆေးပြီးဖြစ်သည်' : 'All packages verified clean'}</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {language === 'my' ? 'ပိတ်မည်' : 'Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
