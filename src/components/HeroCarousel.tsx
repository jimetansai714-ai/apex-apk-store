import React, { useState, useEffect } from 'react';
import { Download, ChevronRight, ChevronLeft, ShieldCheck, Star, Heart } from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { formatExactDownloads } from '../utils/shareUtils';

interface Props {
  featuredApps: APKApp[];
  onSelectApp: (app: APKApp) => void;
  onQuickDownload: (app: APKApp, e: React.MouseEvent) => void;
  language: Language;
  isWishlisted?: (appId: string) => boolean;
  onToggleWishlist?: (appId: string) => void;
}

export const HeroCarousel: React.FC<Props> = ({
  featuredApps,
  onSelectApp,
  onQuickDownload,
  language,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredApps.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredApps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredApps.length]);

  if (!featuredApps.length) return null;
  const currentApp = featuredApps[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featuredApps.length) % featuredApps.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredApps.length);
  };

  return (
    <section className="relative w-full rounded-2xl overflow-hidden mb-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-slate-900">
      {/* Background artwork mesh */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${currentApp.bannerBg} opacity-90 transition-all duration-700`} 
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />

      {/* Slide Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white min-h-[260px]">
        
        {/* Left: App Showcase Info */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
              {currentApp.bannerTagline || (language === 'my' ? 'အထူးအကြံပြုထားသော အက်ပ်' : 'Editor’s Spotlight')}
            </span>
            <span className="text-slate-400">·</span>
            <div className="flex items-center gap-1 text-xs text-emerald-300/90 font-medium">
              <ShieldCheck size={14} />
              <span>Verified Clean</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <AppIconRenderer app={currentApp} size="lg" className="rounded-2xl shadow-lg ring-2 ring-white/10 shrink-0" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
                {language === 'my' && currentApp.nameMy ? currentApp.nameMy : currentApp.name}
              </h2>
              <p className="text-sm text-slate-300 font-medium mb-2">
                {currentApp.developer}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-1 font-semibold text-amber-300">
                  <Star size={13} className="fill-amber-300" />
                  <span className="tabular-nums">{currentApp.rating}</span>
                </div>
                <span>·</span>
                <span className="tabular-nums font-semibold text-emerald-300">{formatExactDownloads(currentApp.downloadCount, language)}</span>
                <span>·</span>
                <span className="tabular-nums">{currentApp.size}</span>
                <span>·</span>
                <span className="text-slate-300 font-mono text-[11px]">{currentApp.version}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-200 line-clamp-2 max-w-xl">
            {language === 'my' && currentApp.shortDescriptionMy ? currentApp.shortDescriptionMy : currentApp.shortDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => onQuickDownload(currentApp, e)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Download size={16} className="stroke-[2.5]" />
              <span>{language === 'my' ? 'APK ဒေါင်းလုဒ်ရယူရန်' : 'Download APK'}</span>
            </button>

            <button
              onClick={() => onSelectApp(currentApp)}
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-sm transition-colors cursor-pointer"
            >
              {language === 'my' ? 'အသေးစိတ်ကြည့်ရန်' : 'View Details'}
            </button>

            {onToggleWishlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(currentApp.id);
                }}
                title={isWishlisted?.(currentApp.id) ? 'Remove favorite' : 'Save to favorites'}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Heart
                  size={16}
                  className={isWishlisted?.(currentApp.id) ? 'fill-rose-500 text-rose-500 scale-110' : ''}
                />
              </button>
            )}
          </div>
        </div>

        {/* Right: Mock Android Phone Showcase */}
        <div className="hidden lg:flex shrink-0 items-center justify-center">
          <div className="w-56 h-48 rounded-xl bg-slate-800/80 border border-white/10 p-3 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] text-slate-400 font-mono">
              <span>{currentApp.packageName}</span>
              <span className="text-emerald-400">Clean</span>
            </div>
            <div className="space-y-2 py-2">
              <div className="h-2 rounded bg-white/20 w-3/4" />
              <div className="h-2 rounded bg-white/10 w-full" />
              <div className="h-2 rounded bg-white/10 w-5/6" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
              <span className="text-[11px]">{currentApp.minAndroid}</span>
              <span className="font-mono text-emerald-400 font-bold">{currentApp.size}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel navigation controls */}
      {featuredApps.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous app"
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            {featuredApps.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            aria-label="Next app"
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
};
