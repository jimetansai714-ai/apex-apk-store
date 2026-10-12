import React from 'react';
import { 
  Sparkles, 
  Dices, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Zap, 
  Flame, 
  RefreshCw 
} from 'lucide-react';
import { Language, APKApp } from '../types';
import { playSurpriseSound, playClickSound } from '../utils/soundEffects';
import { fireCelebrationConfetti } from '../utils/confetti';

interface Props {
  language: Language;
  onSearchTag: (tag: string) => void;
  apps: APKApp[];
  onSelectApp: (app: APKApp) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
}

export const TrendingBar: React.FC<Props> = ({
  language,
  onSearchTag,
  apps,
  onSelectApp,
  isSoundOn,
  onToggleSound,
}) => {
  const trendingTags = [
    { label: language === 'my' ? '🔥 လူကြိုက်များ' : '🔥 Popular', query: '' },
    { label: 'VPN', query: 'vpn' },
    { label: 'Social', query: 'social' },
    { label: 'Games', query: 'game' },
    { label: 'Telegram', query: 'telegram' },
    { label: 'Tools', query: 'tool' },
    { label: language === 'my' ? '🇲🇲 မြန်မာ' : '🇲🇲 Myanmar', query: 'myanmar' },
  ];

  const handleSurpriseMe = () => {
    if (apps.length === 0) return;
    playSurpriseSound();
    fireCelebrationConfetti();
    const randomIndex = Math.floor(Math.random() * apps.length);
    const chosen = apps[randomIndex];
    onSelectApp(chosen);
  };

  return (
    <div className="w-full mb-6 space-y-2.5">
      {/* Top row: Trending Tags + Surprise Me + Sound Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        
        {/* Left: Trending chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1.5 shrink-0 flex items-center gap-1">
            <Flame size={13} className="text-amber-500" />
            <span>{language === 'my' ? 'ခေတ်စားနေသော:' : 'Trending:'}</span>
          </span>

          {trendingTags.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                playClickSound();
                onSearchTag(t.query);
              }}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 dark:bg-slate-800 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-emerald-500/20"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right: Fun Discovery & Audio Controls */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          
          {/* Surprise Me Button */}
          {apps.length > 0 && (
            <button
              type="button"
              onClick={handleSurpriseMe}
              title={language === 'my' ? 'ဆော့ဖ်ဝဲလ်တစ်ခု ကံစမ်းရှာဖွေမည်' : 'Surprise me with a random app!'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Dices size={14} className="stroke-[2.5]" />
              <span>{language === 'my' ? 'ကံစမ်းရှာဖွေမည် 🎲' : 'Surprise Me 🎲'}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={isSoundOn ? (language === 'my' ? 'အသံပိတ်မည်' : 'Mute sound effects') : (language === 'my' ? 'အသံဖွင့်မည်' : 'Enable sound effects')}
            className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer border ${
              isSoundOn 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

      </div>

      {/* Trust & Guarantee Ticker Bar */}
      <div className="hidden sm:grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 px-2 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>{language === 'my' ? '၁၀၀% ဗိုင်းရပ်စ်ကင်းစင် စစ်ဆေးပြီး' : '100% Virus-Free Verified'}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-x border-slate-200/60 dark:border-slate-800/60">
          <Zap size={14} className="text-amber-500 shrink-0" />
          <span>{language === 'my' ? 'အမြန်ဆုံး တိုက်ရိုက်ဒေါင်းလုဒ်' : 'Ultra-Fast Direct CDN Download'}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <RefreshCw size={14} className="text-blue-500 shrink-0" />
          <span>{language === 'my' ? 'ဗားရှင်း အသစ်ဆုံး အမြဲရရှိနိုင်' : 'Latest Verified Releases'}</span>
        </div>
      </div>
    </div>
  );
};
