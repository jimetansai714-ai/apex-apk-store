import React, { useState } from 'react';
import { Star, Download, ShieldCheck, Link2, Check, Heart, QrCode } from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';

interface Props {
  app: APKApp;
  onSelect: (app: APKApp) => void;
  onQuickDownload: (app: APKApp, e: React.MouseEvent) => void;
  language: Language;
  isWishlisted?: boolean;
  onToggleWishlist?: (appId: string) => void;
  onOpenQrCode?: (app: APKApp) => void;
}

export const AppCard: React.FC<Props> = ({ 
  app, 
  onSelect, 
  onQuickDownload, 
  language,
  isWishlisted = false,
  onToggleWishlist,
  onOpenQrCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyAppShareUrl(app);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      onClick={() => onSelect(app)}
      className="group relative flex flex-col justify-between p-4 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div>
        <div className="flex items-start gap-3.5 mb-3">
          <AppIconRenderer app={app} size="md" className="group-hover:scale-105 transition-transform" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {language === 'my' && app.nameMy ? app.nameMy : app.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {app.developer}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{app.categoryName}</span>
              <span>·</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{app.version}</span>
            </div>
          </div>

          {/* Quick Heart Wishlist Button at top right */}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(app.id);
              }}
              title={isWishlisted ? (language === 'my' ? 'အကြိုက်ဆုံးမှ ဖယ်ရှားမည်' : 'Remove favorite') : (language === 'my' ? 'အကြိုက်ဆုံးထဲ ထည့်မည်' : 'Save to favorites')}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Heart 
                size={16} 
                className={isWishlisted ? 'fill-rose-500 text-rose-500 scale-110 transition-transform' : 'hover:scale-110 transition-transform'} 
              />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
          {language === 'my' && app.shortDescriptionMy ? app.shortDescriptionMy : app.shortDescription}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        {/* Unboxed metadata with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="tabular-nums">{app.rating}</span>
          </div>
          <span>·</span>
          <span className="tabular-nums font-mono text-[11px]">{app.size}</span>
          <span>·</span>
          <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
            {formatExactDownloads(app.downloadCount, language)}
          </span>
          {app.isVerified && (
            <>
              <span>·</span>
              <span title="Verified Safe" className="text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={13} />
              </span>
            </>
          )}
        </div>

        {/* Action buttons: QR, Share & 1-Click Download */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenQrCode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenQrCode(app);
              }}
              title={language === 'my' ? 'ဖုန်းဖြင့် Scan ဖတ်ရန် QR Code ကြည့်မည်' : 'Scan QR for phone'}
              className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <QrCode size={13} />
            </button>
          )}

          <button
            onClick={handleShareClick}
            title={language === 'my' ? 'တိုက်ရိုက်လင့်ခ် ကူးယူမည်' : 'Copy Direct Share Link'}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            {copied ? <Check size={13} /> : <Link2 size={13} />}
          </button>

          {/* 1-Click Quick Download Button */}
          <button
            onClick={(e) => onQuickDownload(app, e)}
            title={language === 'my' ? 'APK တိုက်ရိုက်ဒေါင်းလုဒ်ရယူရန်' : 'Download APK'}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 transition-colors cursor-pointer"
          >
            <Download size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
